"use client";

// ═══════════════════════════════════════════════════════════════════════════
//  PDFReader
//  ─────────────────────────────────────────────────────────────────────────
//  Continuous-scroll PDF viewer for the Third Space archive.
//
//  Pages render as soft-white crystalline rectangles floating over the
//  pond substrate. No pagination — pagination would fight Lenis; a
//  single vertical column read with smooth scroll feels closer to
//  parchment unrolling than to clicking through slides. Each page is
//  lazy-rendered as it approaches the viewport, so a 26-page paper
//  doesn't rasterize all at once on load.
//
//  Chrome is minimal: a masthead above the pages with the paper's
//  identifying marks, a hairline tapered rule beneath it that echoes
//  the site-wide accent rules, and a fixed glass meter at the bottom
//  of the viewport showing page N of M with a ghost-cyan progress
//  hairline.
//
//  Keyboard: ↑/k/PgUp = previous, ↓/j/Space/PgDn = next,
//            Home/End = first/last.
//
//  Worker: configured to load from unpkg by default. For production or
//  privacy-minded deploys, copy pdf.worker.min.mjs into public/ and
//  switch the workerSrc line below — see the note there.
// ═══════════════════════════════════════════════════════════════════════════

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// PDF.js worker. For local/offline deploys, run once:
//   cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/
// and replace this line with:
//   pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
pdfjs.GlobalWorkerOptions.workerSrc =
  `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// ───────────────────────────────────────────────────────────────────
//  Smooth-scroll bridge
//  ──────────────────────────────────────────────────────────────────
//  Prefers the Lenis instance exposed by SmoothScroll.tsx (see the
//  one-line patch in that file). Falls back to native smooth scroll
//  if Lenis isn't reachable — still works, just without the site's
//  usual easing.
// ───────────────────────────────────────────────────────────────────
function scrollToY(y: number, duration = 0.9) {
  const lenis = (window as unknown as { __lenis?: { scrollTo: (y: number, opts?: { duration?: number }) => void } }).__lenis;
  if (lenis && typeof lenis.scrollTo === "function") {
    lenis.scrollTo(y, { duration });
  } else {
    window.scrollTo({ top: y, behavior: "smooth" });
  }
}

// ───────────────────────────────────────────────────────────────────
//  Types
// ───────────────────────────────────────────────────────────────────

type Props = {
  src: string;
  title: string;
  subtitle?: string;
  authors?: string;
  meta?: string;                // "P — 001 · April mmxxvi · Revision xiii"
  downloadHref?: string;        // defaults to src
  downloadName?: string;        // filename suggestion for the download
};

// ───────────────────────────────────────────────────────────────────
//  Tuning
// ───────────────────────────────────────────────────────────────────

const TOP_OFFSET_PX = 120;
const PAGE_GAP_PX = 44;
const DEFAULT_ASPECT = "1 / 1.294"; // US letter placeholder

// ───────────────────────────────────────────────────────────────────
//  Component
// ───────────────────────────────────────────────────────────────────

export default function PDFReader({
  src,
  title,
  subtitle,
  authors,
  meta,
  downloadHref,
  downloadName,
}: Props) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<Error | null>(null);
  const [width, setWidth] = useState<number>(820);
  const [progress, setProgress] = useState<number>(0);

  const containerRef = useRef<HTMLDivElement>(null);

  // Keep page render width responsive, clamped so the eye doesn't have
  // to sweep across unreadably wide columns on ultrawide displays.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 820;
      setWidth(Math.min(Math.max(w - 48, 320), 880));
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // Jump-to-page. Used by keyboard bindings + the bottom meter.
  const goToPage = useCallback(
    (n: number) => {
      if (!numPages) return;
      const page = Math.min(Math.max(n, 1), numPages);
      const el = document.getElementById(`pdf-page-${page}`);
      if (!el) return;
      const y = el.getBoundingClientRect().top + window.scrollY - TOP_OFFSET_PX;
      scrollToY(y);
    },
    [numPages],
  );

  // Keyboard. Ignores when focus is in a form field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (!numPages) return;

      switch (e.key) {
        case "ArrowDown":
        case "PageDown":
        case "j":
        case " ":
          e.preventDefault();
          goToPage(currentPage + 1);
          break;
        case "ArrowUp":
        case "PageUp":
        case "k":
          e.preventDefault();
          goToPage(currentPage - 1);
          break;
        case "Home":
          e.preventDefault();
          goToPage(1);
          break;
        case "End":
          e.preventDefault();
          goToPage(numPages);
          break;
        default:
          return;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [currentPage, numPages, goToPage]);

  // Current-page tracking via scroll + rAF. A per-page
  // IntersectionObserver is unreliable here — intersectionRatio is
  // computed relative to the target (the page), so a tall page in a
  // narrower sensor band never crosses a meaningful ratio threshold.
  // Instead: on every scroll tick, find the page whose top has last
  // crossed a sensor line in the upper third of the viewport. Works
  // regardless of page size and updates correctly during Lenis's
  // programmatic scrolls. rAF-throttled, ~free.
  useEffect(() => {
    if (!numPages) return;

    const SENSOR_Y = 220; // px from top of viewport
    let rafId = 0;

    const update = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        let best = 1;
        for (let p = 1; p <= numPages; p++) {
          const el = document.getElementById(`pdf-page-${p}`);
          if (!el) continue;
          const top = el.getBoundingClientRect().top;
          if (top <= SENSOR_Y) {
            best = p;
          } else {
            // pages are in DOM order; once one's top is below the
            // sensor, every later page is too.
            break;
          }
        }
        setCurrentPage((prev) => (prev === best ? prev : best));
      });
    };

    type LenisLike = { on?: (e: string, cb: () => void) => void; off?: (e: string, cb: () => void) => void };
    const lenis = (window as unknown as { __lenis?: LenisLike }).__lenis;
    lenis?.on?.("scroll", update);
    window.addEventListener("scroll", update, { passive: true });
    update(); // establish initial value once pages have mounted

    return () => {
      window.removeEventListener("scroll", update);
      lenis?.off?.("scroll", update);
      cancelAnimationFrame(rafId);
    };
  }, [numPages]);

  // Keep Document options stable — handing a new object every render
  // makes react-pdf re-fetch the worker assets.
  const options = useMemo(
    () => ({
      cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
      cMapPacked: true,
      standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
    }),
    [],
  );

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        maxWidth: 960,
        margin: "0 auto",
        padding: "140px 24px 220px",
      }}
    >
      {/* ─── Masthead ─────────────────────────────────────── */}
      <header style={{ textAlign: "center", marginBottom: 80 }}>
        {meta && (
          <div
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: 10,
              letterSpacing: "0.42em",
              textTransform: "uppercase",
              color: "#5a6780",
              marginBottom: 28,
            }}
          >
            {meta}
          </div>
        )}

        <h1
          style={{
            margin: 0,
            fontFamily: "var(--font-display), 'Cormorant Garamond', serif",
            fontStyle: "italic",
            fontWeight: 300,
            fontSize: "clamp(44px, 6vw, 72px)",
            lineHeight: 1.04,
            letterSpacing: "-0.025em",
            color: "#eaeef7",
          }}
        >
          {title}
        </h1>

        {subtitle && (
          <p
            style={{
              margin: "22px auto 0",
              maxWidth: "50ch",
              fontFamily: "var(--font-display), serif",
              fontStyle: "italic",
              fontWeight: 300,
              fontSize: "clamp(16px, 1.5vw, 20px)",
              lineHeight: 1.5,
              color: "#8a9bba",
            }}
          >
            {subtitle}
          </p>
        )}

        {authors && (
          <div
            style={{
              marginTop: 36,
              fontFamily: "var(--font-mono), monospace",
              fontSize: 10,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "#8a9bba",
            }}
          >
            {authors}
          </div>
        )}

        <div
          aria-hidden
          style={{
            margin: "56px auto 0",
            width: 180,
            height: 1,
            background:
              "linear-gradient(90deg, transparent, rgba(127,175,179,0.45), transparent)",
          }}
        />
      </header>

      {/* ─── Document body ────────────────────────────────── */}
      <Document
        file={src}
        options={options}
        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        onLoadError={(err) => setError(err)}
        onLoadProgress={({ loaded, total }) =>
          setProgress(total ? loaded / total : 0)
        }
        loading={<Unfolding progress={progress} />}
        error={<ErrorPanel error={error} />}
      >
        {numPages != null && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: PAGE_GAP_PX,
            }}
          >
            {Array.from({ length: numPages }, (_, i) => (
              <PageFrame
                key={i + 1}
                pageNumber={i + 1}
                width={width}
              />
            ))}
          </div>
        )}
      </Document>

      {/* ─── End marker ───────────────────────────────────── */}
      {numPages != null && (
        <div
          style={{
            marginTop: 120,
            textAlign: "center",
            fontFamily: "var(--font-mono), monospace",
            fontSize: 9,
            letterSpacing: "0.5em",
            textTransform: "uppercase",
            color: "#3a4560",
          }}
        >
          ─ End of Document · {numPages.toString().padStart(2, "0")} pages ─
        </div>
      )}

      {/* ─── Bottom chrome ────────────────────────────────── */}
      {numPages != null && (
        <ReaderChrome
          current={currentPage}
          total={numPages}
          title={title}
          onJump={goToPage}
          downloadHref={downloadHref ?? src}
          downloadName={downloadName}
        />
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────
//  PageFrame — per-page lazy render
// ───────────────────────────────────────────────────────────────────
//  Single observer per frame with a generous ±600px root margin, so
//  rasterization starts well before the page scrolls in. Current-page
//  tracking lives in PDFReader (scroll-based) and is handled there.
// ───────────────────────────────────────────────────────────────────

function PageFrame({
  pageNumber,
  width,
}: {
  pageNumber: number;
  width: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shouldRender, setShouldRender] = useState(false);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShouldRender(true);
            io.disconnect();
          }
        }
      },
      { rootMargin: "600px 0px 600px 0px", threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      id={`pdf-page-${pageNumber}`}
      className="pdf-page-frame"
      style={{
        position: "relative",
        width,
        aspectRatio: rendered ? undefined : DEFAULT_ASPECT,
        // Soft-warm white — not clinical. Reads as paper, not screen.
        background: "#fefcf8",
        borderRadius: 2,
        // Shadow layers: long drop for depth over the void, short
        // close shadow for local contact, ghost-cyan rim so the page
        // carries the palette even when it's just a white rectangle.
        boxShadow: [
          "0 28px 80px -24px rgba(0,0,0,0.75)",
          "0 6px 20px -8px rgba(0,0,0,0.4)",
          "0 0 0 1px rgba(127,175,179,0.1)",
          "0 0 42px -10px rgba(127,175,179,0.22)",
        ].join(", "),
        transition: "opacity 0.5s ease",
      }}
    >
      {/* folio mark — p. NN above the top-right corner */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: -22,
          right: 0,
          fontFamily: "var(--font-mono), monospace",
          fontSize: 9,
          letterSpacing: "0.38em",
          textTransform: "uppercase",
          color: "#3a4560",
        }}
      >
        p. {pageNumber.toString().padStart(2, "0")}
      </div>

      {shouldRender ? (
        <Page
          pageNumber={pageNumber}
          width={width}
          renderTextLayer
          renderAnnotationLayer
          onRenderSuccess={() => setRendered(true)}
          loading={<PagePlaceholder />}
        />
      ) : (
        <PagePlaceholder />
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────
//  Placeholders, loaders, errors
// ───────────────────────────────────────────────────────────────────

function PagePlaceholder() {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(180deg, rgba(127,175,179,0.04), rgba(127,175,179,0.01))",
      }}
    >
      <div
        className="animate-breathe"
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: "#7fafb3",
          opacity: 0.4,
          boxShadow: "0 0 18px rgba(127,175,179,0.5)",
        }}
      />
    </div>
  );
}

function Unfolding({ progress }: { progress: number }) {
  const pct = Math.max(0.04, Math.min(progress, 1));
  return (
    <div
      style={{
        padding: "160px 0",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 32,
      }}
    >
      <div
        className="animate-breathe"
        style={{
          fontFamily: "var(--font-mono), monospace",
          fontSize: 10,
          letterSpacing: "0.55em",
          textTransform: "uppercase",
          color: "#7fafb3",
        }}
      >
        Unfolding
      </div>
      <div
        style={{
          width: 240,
          height: 1,
          background: "rgba(127,175,179,0.12)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            bottom: 0,
            width: `${pct * 100}%`,
            background:
              "linear-gradient(90deg, transparent, rgba(127,175,179,0.75), transparent)",
            transition: "width 0.3s ease",
            boxShadow: "0 0 12px rgba(127,175,179,0.5)",
          }}
        />
      </div>
    </div>
  );
}

function ErrorPanel({ error }: { error: Error | null }) {
  return (
    <div
      role="alert"
      style={{
        padding: "80px 40px",
        textAlign: "center",
        fontFamily: "var(--font-mono), monospace",
        color: "#8a9bba",
      }}
    >
      <div
        style={{
          fontSize: 10,
          letterSpacing: "0.4em",
          textTransform: "uppercase",
          color: "#c08878",
          marginBottom: 18,
        }}
      >
        ─ Could not unfold ─
      </div>
      <div style={{ fontSize: 13, letterSpacing: "0.05em" }}>
        {error?.message ?? "Unknown error loading the document."}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────
//  ReaderChrome — the fixed glass meter at the viewport bottom
// ───────────────────────────────────────────────────────────────────

function ReaderChrome({
  current,
  total,
  title,
  onJump,
  downloadHref,
  downloadName,
}: {
  current: number;
  total: number;
  title: string;
  onJump: (n: number) => void;
  downloadHref: string;
  downloadName?: string;
}) {
  const pct = total > 0 ? current / total : 0;
  return (
    <div
      className="pdf-reader-chrome"
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 10,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        padding: "14px 26px",
        width: "min(560px, calc(100vw - 48px))",
        background: "rgba(6, 9, 18, 0.72)",
        backdropFilter: "blur(22px) saturate(1.3)",
        WebkitBackdropFilter: "blur(22px) saturate(1.3)",
        border: "1px solid rgba(127,175,179,0.12)",
        borderRadius: 2,
        boxShadow:
          "0 20px 60px -20px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.02)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 20,
          fontFamily: "var(--font-mono), monospace",
          fontSize: 10,
          letterSpacing: "0.32em",
          textTransform: "uppercase",
          color: "#8a9bba",
        }}
      >
        <span
          style={{
            flex: 1,
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            color: "#c8cfe0",
            letterSpacing: "0.28em",
          }}
          title={title}
        >
          {title}
        </span>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => onJump(current - 1)}
            aria-label="Previous page"
            disabled={current <= 1}
            className="pdf-reader-nav"
            style={{
              background: "transparent",
              border: "none",
              color: current <= 1 ? "#3a4560" : "#8a9bba",
              cursor: current <= 1 ? "default" : "pointer",
              padding: "4px 6px",
              fontSize: 11,
              letterSpacing: "0.2em",
              fontFamily: "inherit",
            }}
          >
            ←
          </button>
          <span style={{ color: "#7fafb3", letterSpacing: "0.24em" }} aria-live="polite">
            {current.toString().padStart(2, "0")}{" "}
            <span style={{ color: "#5a6780" }}>
              · {total.toString().padStart(2, "0")}
            </span>
          </span>
          <button
            type="button"
            onClick={() => onJump(current + 1)}
            aria-label="Next page"
            disabled={current >= total}
            className="pdf-reader-nav"
            style={{
              background: "transparent",
              border: "none",
              color: current >= total ? "#3a4560" : "#8a9bba",
              cursor: current >= total ? "default" : "pointer",
              padding: "4px 6px",
              fontSize: 11,
              letterSpacing: "0.2em",
              fontFamily: "inherit",
            }}
          >
            →
          </button>
        </div>

        <a
          href={downloadHref}
          download={downloadName || true}
          className="pdf-reader-download"
          style={{
            flexShrink: 0,
            color: "#8a9bba",
            textDecoration: "none",
            borderBottom: "1px solid rgba(127,175,179,0.25)",
            paddingBottom: 1,
            transition: "color 0.3s ease, border-color 0.3s ease",
          }}
        >
          PDF ↓
        </a>
      </div>

      {/* progress hairline */}
      <div
        aria-hidden
        style={{
          position: "relative",
          height: 1,
          background: "rgba(127,175,179,0.08)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            height: 1,
            width: `${pct * 100}%`,
            background:
              "linear-gradient(90deg, rgba(127,175,179,0.1), rgba(127,175,179,0.85))",
            boxShadow: "0 0 10px rgba(127,175,179,0.6)",
            transition: "width 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />
      </div>

      <style>{`
        .pdf-reader-download:hover {
          color: #eaeef7 !important;
          border-color: #7fafb3 !important;
        }
        .pdf-reader-nav:not(:disabled):hover {
          color: #eaeef7 !important;
        }
      `}</style>
    </div>
  );
}
