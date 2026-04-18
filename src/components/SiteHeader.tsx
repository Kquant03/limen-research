"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

// ═══════════════════════════════════════════════════════════════════════════
// Tokens — Lantern palette
// ═══════════════════════════════════════════════════════════════════════════

const COLOR = {
  void: "#010106",
  ink: "#f4f6fb",
  inkStrong: "#eaeef7",
  inkBody: "#c8cfe0",
  inkMuted: "#8a9bba",
  inkFaint: "#5a6780",
  inkGhost: "#3a4560",
  ghost: "#7fafb3",
  ghostSoft: "#5d8a8e",
  ghostDeep: "#3f6267",
} as const;

const FONT = {
  display: "var(--font-display), 'Cormorant Garamond', Georgia, serif",
  body: "var(--font-body), 'DM Sans', system-ui, sans-serif",
  mono: "var(--font-mono), 'JetBrains Mono', monospace",
} as const;

type NavItem = {
  href: string;
  label: string;
  roman: string;
  external?: boolean;
};

const NAV: NavItem[] = [
  { href: "/", label: "Index", roman: "I" },
  { href: "/research", label: "Research", roman: "II" },
  {
    href: "https://kquant03.github.io/genesis-phase-transition/",
    label: "Genesis",
    roman: "III",
    external: true,
  },
  { href: "/about", label: "About", roman: "IV" },
];

// ═══════════════════════════════════════════════════════════════════════════
// Evaporation transitions — asymmetric for polished in/out
// ═══════════════════════════════════════════════════════════════════════════

// Phases are fully sequenced with a 50ms gap so content never animates
// alongside the height change — that's what produces the reveal/slide feel.

// Collapse:  content evaporates in place (0–0.35s)  ·  pause  ·  empty frame closes (0.40–0.90s)
const EVAPORATE_OUT =
  "opacity 0.3s ease, filter 0.35s ease, max-height 0.5s cubic-bezier(0.22,1,0.36,1) 0.4s";

// Expand:   empty frame opens (0–0.50s)  ·  pause  ·  content materializes (0.55–0.95s)
const MATERIALIZE_IN =
  "opacity 0.4s ease 0.55s, filter 0.45s ease 0.55s, max-height 0.5s cubic-bezier(0.22,1,0.36,1)";

// Lateral compact elements — positioned absolutely so they can fade purely
// with opacity + blur. No max-width animation = no horizontal clip = no slide.
// Asymmetric timing coordinates with masthead: fade in after masthead has
// begun to clear, fade out before masthead content reappears.
const LATERAL_IN = "opacity 0.5s ease 0.25s, filter 0.55s ease 0.25s";
const LATERAL_OUT = "opacity 0.3s ease, filter 0.35s ease";

// ═══════════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════════

export default function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [progress, setProgress] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    const compute = () => {
      const y = window.scrollY;
      setScrolled(y > 64);
      const max =
        document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(Math.max(y / max, 0), 1) : 0);
    };

    // Sync state BEFORE marking mounted so we don't animate on load
    compute();
    setMounted(true);

    window.addEventListener("scroll", compute, { passive: true });
    window.addEventListener("resize", compute, { passive: true });
    return () => {
      window.removeEventListener("scroll", compute);
      window.removeEventListener("resize", compute);
    };
  }, []);

  const compact = mounted && scrolled;
  const transOn = mounted;

  return (
    <>
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          background: compact ? "rgba(1,1,6,0.88)" : "rgba(1,1,6,0.38)",
          backdropFilter: "blur(40px) saturate(1.4)",
          WebkitBackdropFilter: "blur(40px) saturate(1.4)",
          borderBottom: `1px solid rgba(255,255,255,${compact ? 0.06 : 0.03})`,
          transition: transOn
            ? "background 0.7s cubic-bezier(0.22,1,0.36,1), border-color 0.5s ease"
            : "none",
        }}
      >
        {/* ═══════════════════════════════════════════════════════════════
             TOP HAIRLINE — bounded to container, frames the page
             ═══════════════════════════════════════════════════════════════ */}
        <div style={{ maxWidth: 1440, margin: "0 auto", padding: "0 40px" }}>
          <div
            aria-hidden
            style={{
              height: 1,
              background:
                "linear-gradient(90deg, transparent 0%, rgba(127,175,179,0) 8%, rgba(127,175,179,0.32) 50%, rgba(127,175,179,0) 92%, transparent 100%)",
              opacity: compact ? 0.6 : 0.42,
              transition: transOn ? "opacity 0.6s ease" : "none",
            }}
          />
        </div>

        {/* ═══════════════════════════════════════════════════════════════
             UPPER MASTHEAD — evaporates on scroll (no slide)
             ═══════════════════════════════════════════════════════════════ */}
        <div
          aria-hidden={compact || undefined}
          style={{
            maxHeight: compact ? 0 : 240,
            opacity: compact ? 0 : 1,
            filter: compact ? "blur(6px)" : "blur(0px)",
            overflow: "hidden",
            pointerEvents: compact ? "none" : "auto",
            transition: transOn
              ? compact
                ? EVAPORATE_OUT
                : MATERIALIZE_IN
              : "none",
            willChange: "opacity, filter, max-height",
          }}
        >
          <div
            className="masthead-row"
            style={{
              maxWidth: 1440,
              margin: "0 auto",
              padding: "32px 40px 24px",
              display: "grid",
              gridTemplateColumns: "1fr auto 1fr",
              alignItems: "center",
              gap: 40,
            }}
          >
            {/* LEFT FLANK — Est. date with printer's diamond */}
            <div
              style={{
                fontFamily: FONT.mono,
                fontSize: 9,
                letterSpacing: "0.42em",
                textTransform: "uppercase",
                color: COLOR.inkFaint,
                display: "flex",
                alignItems: "center",
                gap: 14,
                lineHeight: 1,
              }}
            >
              <span
                aria-hidden
                style={{
                  display: "block",
                  width: 26,
                  height: 1,
                  background:
                    "linear-gradient(90deg, transparent, rgba(255,255,255,0.14))",
                }}
              />
              <span
                aria-hidden
                style={{
                  display: "inline-block",
                  width: 3,
                  height: 3,
                  background: COLOR.ghostSoft,
                  transform: "rotate(45deg)",
                  opacity: 0.75,
                  flex: "0 0 auto",
                }}
              />
              <span style={{ whiteSpace: "nowrap" }}>
                Est.{" "}
                <span style={{ color: COLOR.inkMuted, letterSpacing: "0.3em" }}>
                  mmxxiv
                </span>
              </span>
            </div>

            {/* CENTER — wordmark with favicon */}
            <Link
              href="/"
              className="masthead-wordmark"
              tabIndex={compact ? -1 : 0}
              style={{
                display: "inline-flex",
                alignItems: "baseline",
                gap: 16,
                textDecoration: "none",
                position: "relative",
                padding: "4px 6px",
                borderRadius: 2,
                lineHeight: 1,
              }}
            >
              <img
                src="/favicon.ico"
                alt=""
                aria-hidden
                className="masthead-favicon"
                style={{
                  alignSelf: "center",
                  height: "clamp(30px, 3.4vw, 42px)",
                  width: "auto",
                  objectFit: "contain",
                  marginBottom: "-0.06em",
                  filter: "drop-shadow(0 0 18px rgba(127,175,179,0.18))",
                  transition:
                    "filter 0.5s ease, transform 0.6s cubic-bezier(0.22,1,0.36,1)",
                }}
              />
              <span
                className="masthead-limen"
                style={{
                  fontFamily: FONT.display,
                  fontStyle: "italic",
                  fontWeight: 300,
                  fontSize: "clamp(32px, 3.6vw, 46px)",
                  lineHeight: 1,
                  color: COLOR.ink,
                  letterSpacing: "-0.012em",
                  textShadow: "0 0 36px rgba(127,175,179,0.08)",
                  transition: "text-shadow 0.5s ease",
                }}
              >
                Limen
              </span>
              <span
                className="masthead-research"
                style={{
                  fontFamily: FONT.mono,
                  fontSize: 11,
                  letterSpacing: "0.55em",
                  textTransform: "uppercase",
                  color: COLOR.ghost,
                  transform: "translateY(-2px)",
                  transition: "color 0.4s ease",
                  lineHeight: 1,
                }}
              >
                Research
              </span>
            </Link>

            {/* RIGHT FLANK — edition with live mark */}
            <div
              style={{
                fontFamily: FONT.mono,
                fontSize: 9,
                letterSpacing: "0.42em",
                textTransform: "uppercase",
                color: COLOR.inkFaint,
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 14,
                lineHeight: 1,
              }}
            >
              <span style={{ whiteSpace: "nowrap" }}>
                № 001 /{" "}
                <span style={{ color: COLOR.inkMuted, letterSpacing: "0.3em" }}>
                  mmxxvi
                </span>
              </span>
              <span
                aria-hidden
                className="limen-live"
                title="Current edition"
                style={{
                  display: "inline-block",
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: COLOR.ghost,
                  boxShadow: `0 0 8px ${COLOR.ghost}, 0 0 18px rgba(127,175,179,0.45)`,
                  flex: "0 0 auto",
                }}
              />
              <span
                aria-hidden
                style={{
                  display: "block",
                  width: 26,
                  height: 1,
                  background:
                    "linear-gradient(270deg, transparent, rgba(255,255,255,0.14))",
                }}
              />
            </div>
          </div>

          {/* SCOTCH RULE — classic editorial double rule */}
          <div
            style={{
              maxWidth: 1440,
              margin: "0 auto",
              padding: "0 40px",
            }}
          >
            <div
              aria-hidden
              style={{
                height: 1,
                background:
                  "linear-gradient(90deg, transparent 0%, rgba(127,175,179,0.08) 10%, rgba(127,175,179,0.48) 50%, rgba(127,175,179,0.08) 90%, transparent 100%)",
              }}
            />
            <div style={{ height: 3 }} />
            <div
              aria-hidden
              style={{
                height: 1,
                background:
                  "linear-gradient(90deg, transparent 0%, rgba(127,175,179,0.04) 28%, rgba(127,175,179,0.14) 50%, rgba(127,175,179,0.04) 72%, transparent 100%)",
              }}
            />
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
             NAV BAR
             ═══════════════════════════════════════════════════════════════ */}
        <div
          style={{
            position: "relative",
            maxWidth: 1440,
            margin: "0 auto",
            padding: compact ? "15px 40px" : "20px 40px 22px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: transOn
              ? "padding 0.6s cubic-bezier(0.22,1,0.36,1)"
              : "none",
          }}
        >
          {/* LEFT — compact wordmark (absolutely positioned so max-width never animates) */}
          <Link
            href="/"
            className="compact-wordmark"
            aria-hidden={!compact || undefined}
            tabIndex={compact ? 0 : -1}
            style={{
              position: "absolute",
              left: 40,
              top: "50%",
              display: "inline-flex",
              alignItems: "baseline",
              gap: 10,
              textDecoration: "none",
              opacity: compact ? 1 : 0,
              filter: compact ? "blur(0px)" : "blur(6px)",
              transform: "translateY(-50%)",
              whiteSpace: "nowrap",
              padding: "2px 4px",
              borderRadius: 2,
              lineHeight: 1,
              pointerEvents: compact ? "auto" : "none",
              transition: transOn
                ? compact
                  ? LATERAL_IN
                  : LATERAL_OUT
                : "none",
            }}
          >
            <img
              src="/favicon.ico"
              alt=""
              aria-hidden
              style={{
                alignSelf: "center",
                height: 20,
                width: "auto",
                objectFit: "contain",
                filter: "drop-shadow(0 0 10px rgba(127,175,179,0.25))",
              }}
            />
            <span
              style={{
                fontFamily: FONT.display,
                fontStyle: "italic",
                fontWeight: 300,
                fontSize: 20,
                color: COLOR.ink,
                letterSpacing: "-0.01em",
                lineHeight: 1,
              }}
            >
              Limen
            </span>
            <span
              style={{
                fontFamily: FONT.mono,
                fontSize: 9,
                letterSpacing: "0.48em",
                textTransform: "uppercase",
                color: COLOR.ghost,
                transform: "translateY(-1px)",
                lineHeight: 1,
              }}
            >
              Research
            </span>
          </Link>

          {/* CENTER — nav */}
          <nav
            style={{
              display: "flex",
              alignItems: "center",
              gap: compact ? 34 : 56,
              transition: transOn
                ? "gap 0.55s cubic-bezier(0.22,1,0.36,1)"
                : "none",
            }}
          >
            {NAV.map((item) => {
              const isActive =
                item.href === pathname ||
                (item.href === "/" && pathname === "/");
              return (
                <NavLink
                  key={item.label}
                  item={item}
                  isActive={!!isActive}
                  showRoman={!compact}
                />
              );
            })}
          </nav>

          {/* RIGHT — compact edition stamp (absolutely positioned) */}
          <div
            className="compact-edition"
            aria-hidden={!compact || undefined}
            style={{
              position: "absolute",
              right: 40,
              top: "50%",
              opacity: compact ? 1 : 0,
              filter: compact ? "blur(0px)" : "blur(6px)",
              transform: "translateY(-50%)",
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              fontFamily: FONT.mono,
              fontSize: 9,
              letterSpacing: "0.42em",
              textTransform: "uppercase",
              color: COLOR.inkFaint,
              whiteSpace: "nowrap",
              lineHeight: 1,
              pointerEvents: compact ? "auto" : "none",
              transition: transOn
                ? compact
                  ? LATERAL_IN
                  : LATERAL_OUT
                : "none",
            }}
          >
            <span>
              № 001 ·{" "}
              <span style={{ color: COLOR.inkMuted }}>mmxxvi</span>
            </span>
            <span
              aria-hidden
              className="limen-live"
              style={{
                display: "inline-block",
                width: 4,
                height: 4,
                borderRadius: "50%",
                background: COLOR.ghost,
                boxShadow: `0 0 6px ${COLOR.ghost}`,
                flex: "0 0 auto",
              }}
            />
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
             SCROLL PROGRESS — ghost rule traces the header base
             ═══════════════════════════════════════════════════════════════ */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 1,
            pointerEvents: "none",
            opacity: progress < 0.004 ? 0 : 1,
            transition: "opacity 0.4s ease",
          }}
        >
          <div
            style={{
              height: "100%",
              width: "100%",
              background: `linear-gradient(90deg, rgba(127,175,179,0.55) 0%, ${COLOR.ghost} 70%, #b8e0e4 100%)`,
              transformOrigin: "left center",
              transform: `scaleX(${progress})`,
              transition: "transform 0.12s linear",
              boxShadow: `0 0 8px ${COLOR.ghost}, 0 0 18px rgba(127,175,179,0.5)`,
              opacity: 0.9,
            }}
          />
        </div>
      </header>

      <style>{`
        /* ── nav item ────────────────────────────────────────────── */
        .nav-item {
          position: relative;
          display: inline-flex;
          align-items: baseline;
          gap: 10px;
          text-decoration: none;
          padding: 4px 2px;
          outline: none;
          line-height: 1;
          transition: color 0.3s ease;
        }
        .nav-item .nav-roman {
          display: inline-block;
          width: 26px;
          text-align: right;
          flex: 0 0 auto;
          transition: color 0.3s ease, transform 0.3s ease;
        }
        .nav-item .nav-ext {
          margin-left: -2px;
          transition: color 0.3s ease;
        }

        /* ── label-wrap owns the underline + folio so they align to the word ─ */
        .nav-label-wrap {
          position: relative;
          display: inline-block;
          line-height: 1;
        }
        .nav-label-wrap .nav-underline {
          position: absolute;
          left: 0;
          right: 0;
          bottom: -9px;
          height: 1px;
          background: linear-gradient(90deg, transparent, ${COLOR.ghost} 16%, ${COLOR.ghost} 84%, transparent);
          transform: scaleX(0);
          transform-origin: center;
          transition: transform 0.5s cubic-bezier(0.22,1,0.36,1);
        }
        .nav-label-wrap .nav-folio {
          position: absolute;
          left: 50%;
          margin-left: -1.5px;
          bottom: -16px;
          width: 3px;
          height: 3px;
          background: ${COLOR.ghost};
          border-radius: 50%;
          opacity: 0;
          transform: translateY(-3px);
          box-shadow: 0 0 6px ${COLOR.ghost};
          transition: opacity 0.4s ease 0.05s, transform 0.5s cubic-bezier(0.22,1,0.36,1) 0.05s;
        }

        /* ── active ──────────────────────────────────────────────── */
        .nav-item.is-active { color: ${COLOR.ghost}; }
        .nav-item.is-active .nav-underline { transform: scaleX(1); }
        .nav-item.is-active .nav-folio { opacity: 1; transform: translateY(0); }

        /* ── hover ───────────────────────────────────────────────── */
        .nav-item:hover { color: ${COLOR.ghost} !important; }
        .nav-item:hover .nav-roman { color: ${COLOR.ghost} !important; transform: translateY(-1px); }
        .nav-item:hover .nav-ext { color: ${COLOR.ghost} !important; }
        .nav-item:hover .nav-underline { transform: scaleX(1); }

        /* ── focus ───────────────────────────────────────────────── */
        .nav-item:focus-visible {
          outline: 1px solid ${COLOR.ghost};
          outline-offset: 8px;
          border-radius: 2px;
        }

        /* ── wordmark hovers ─────────────────────────────────────── */
        .masthead-wordmark:hover .masthead-favicon {
          filter: drop-shadow(0 0 28px rgba(127,175,179,0.38));
          transform: translateY(-1px);
        }
        .masthead-wordmark:hover .masthead-limen {
          text-shadow: 0 0 52px rgba(127,175,179,0.22);
        }
        .masthead-wordmark:hover .masthead-research {
          color: ${COLOR.ink} !important;
        }
        .masthead-wordmark:focus-visible,
        .compact-wordmark:focus-visible {
          outline: 1px solid ${COLOR.ghost};
          outline-offset: 6px;
        }

        /* ── live mark ───────────────────────────────────────────── */
        .limen-live {
          animation: limen-live-pulse 2.8s ease-in-out infinite;
        }
        @keyframes limen-live-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.5; transform: scale(0.82); }
        }

        /* ── motion safety ───────────────────────────────────────── */
        @media (prefers-reduced-motion: reduce) {
          .limen-live { animation: none; }
          .nav-label-wrap .nav-underline,
          .nav-label-wrap .nav-folio,
          .nav-item .nav-roman,
          .masthead-favicon,
          .masthead-limen,
          .masthead-research {
            transition-duration: 0.001ms !important;
          }
        }

        /* ── responsive ──────────────────────────────────────────── */
        @media (max-width: 820px) {
          .masthead-row {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
            text-align: center !important;
          }
          .masthead-row > *:first-child,
          .masthead-row > *:last-child {
            justify-content: center !important;
            font-size: 8px !important;
          }
        }
        @media (max-width: 640px) {
          .nav-item .nav-roman { display: none !important; }
          .compact-edition     { display: none !important; }
        }
      `}</style>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════

function NavLink({
  item,
  isActive,
  showRoman,
}: {
  item: NavItem;
  isActive: boolean;
  showRoman: boolean;
}) {
  const inner = (
    <>
      {showRoman && (
        <span
          className="nav-roman"
          style={{
            fontFamily: FONT.mono,
            fontSize: 9,
            letterSpacing: "0.2em",
            color: COLOR.inkGhost,
          }}
        >
          {item.roman}.
        </span>
      )}
      <span className="nav-label-wrap">
        <span
          className="nav-label"
          style={{
            fontFamily: FONT.mono,
            fontSize: 10,
            letterSpacing: "0.32em",
            textTransform: "uppercase",
          }}
        >
          {item.label}
        </span>
        <span className="nav-underline" aria-hidden />
        <span className="nav-folio" aria-hidden />
      </span>
      {item.external && (
        <span
          aria-hidden
          className="nav-ext"
          style={{
            fontFamily: FONT.mono,
            fontSize: 9,
            color: COLOR.inkGhost,
          }}
        >
          ↗
        </span>
      )}
    </>
  );

  const sharedStyle: React.CSSProperties = {
    color: isActive ? COLOR.ghost : COLOR.inkMuted,
  };

  if (item.external) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className={`nav-item${isActive ? " is-active" : ""}`}
        style={sharedStyle}
      >
        {inner}
      </a>
    );
  }

  return (
    <Link
      href={item.href}
      className={`nav-item${isActive ? " is-active" : ""}`}
      style={sharedStyle}
    >
      {inner}
    </Link>
  );
}
