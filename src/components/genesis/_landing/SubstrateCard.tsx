"use client";

// ═══════════════════════════════════════════════════════════════════════════
//  Genesis · SubstrateCard
//  ─────────────────────────────────────────────────────────────────────────
//  Shared primitive for the /genesis catalog page. Each card is a
//  reading-plate containing:
//
//    · live or static preview canvas (render delegated to `renderCanvas`)
//    · catalog ID + substrate name
//    · subtitle, description, citation
//    · "Enter" link to the substrate's route
//
//  ── Layout ─────────────────────────────────────────────────────────────
//  Two configurations:
//
//    Default (featured=false) · vertical stack
//      ┌──────────────────────┐
//      │       canvas         │   ← aspect-ratio (4/3 default)
//      ├──────────────────────┤
//      │       prose          │   ← flex column, citation pinned bottom
//      └──────────────────────┘
//
//    Featured (featured=true) · horizontal split on > 920px
//      ┌──────────┬───────────┐
//      │  canvas  │   prose   │   ← canvas fills row height; prose
//      │ (aspect) │           │     centers vertically
//      └──────────┴───────────┘
//
//      Below 920px the featured card stacks vertically — same breakpoint
//      <Stage> in SubstrateControls uses, so the catalog and the
//      substrate detail pages collapse together.
//
//  All layout (grid templates, breakpoints, divider directions, padding)
//  lives in globals.css under .substrate-card / .substrate-card--featured /
//  .substrate-card-canvas / .substrate-card-body. This component only
//  composes className and supplies content. Inline styles can't do media
//  queries; CSS can.
//
//  ── Visibility gate ────────────────────────────────────────────────────
//  Previews only run while on-screen, via an IntersectionObserver. Cards
//  receive a `playing` prop they can read to pause their simulation
//  loops; the parent /genesis page also has a "previews on / off" toggle.
// ═══════════════════════════════════════════════════════════════════════════

import { ReactNode, useEffect, useRef, useState } from "react";
import Link from "next/link";

// Inlined Lantern palette — matches the rest of the site.
const COLOR = {
  void: "#010106",
  voidSoft: "#0a0f1a",
  ink: "#f4f6fb",
  inkStrong: "#eaeef7",
  inkBody: "#c8cfe0",
  inkMuted: "#8a9bba",
  inkFaint: "#5a6780",
  inkGhost: "#3a4560",
  ghost: "#7fafb3",
  ghostSoft: "#5d8a8e",
} as const;

const FONT = {
  display: "var(--font-display), 'Cormorant Garamond', Georgia, serif",
  body: "var(--font-body), 'Source Serif 4', Georgia, serif",
  mono: "var(--font-mono), 'JetBrains Mono', monospace",
} as const;

export type SubstrateCardProps = {
  catalog: string;           // "Λ — 001 · F" identifier
  title: string;
  subtitle: string;
  description: string;
  citation: string;
  href: string;              // internal substrate route
  featured?: boolean;        // horizontal split layout when true
  /**
   * Aspect ratio for the preview canvas. Default 4/3 for vertical
   * (default) cards; for featured cards on wide viewports the canvas
   * fills the column height and aspect-ratio is suggestive only. On
   * the narrow stacked layout, aspect-ratio drives canvas height for
   * featured too.
   */
  canvasAspect?: string;
  renderCanvas: (playing: boolean) => ReactNode;
};

export function SubstrateCard({
  catalog,
  title,
  subtitle,
  description,
  citation,
  href,
  featured = false,
  canvasAspect,
  renderCanvas,
}: SubstrateCardProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  // Only run the preview while the card is in (or near) the viewport.
  // 200px rootMargin gives a beat of warm-up before the card scrolls
  // into view, so the reader lands on motion rather than a blank square.
  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: "200px 0px", threshold: 0 },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  // Aspect-ratio defaults — featured gets a wider default (16/10) since
  // canvas sits on the left flank rather than dominating the top edge.
  const aspect = canvasAspect ?? (featured ? "16 / 10" : "4 / 3");

  const className =
    "reading-plate substrate-card" +
    (featured ? " substrate-card--featured" : "");

  return (
    <Link
      href={href}
      style={{ textDecoration: "none", color: "inherit", display: "block" }}
    >
      <div ref={ref} className={className}>
        {/* ── Preview canvas ──────────────────────────────────────────
            On featured-wide the canvas fills the column height (CSS
            sets height: 100%), so aspect-ratio is suggestive only —
            the column's row height wins. On default and featured-
            narrow, aspect-ratio drives canvas height. */}
        <div className="substrate-card-canvas" style={{ aspectRatio: aspect }}>
          {renderCanvas(visible)}
          {/* Inset glow — faint atmospheric shadow so the preview reads
              as a window rather than a flat tile. */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              boxShadow:
                "inset 0 0 60px rgba(127, 175, 179, 0.035), inset 0 1px 0 rgba(255, 255, 255, 0.03)",
            }}
          />
        </div>

        {/* ── Prose body ─────────────────────────────────────────────── */}
        <div className="substrate-card-body">
          {/* Catalog ID + (featured marker) */}
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: 18,
              minWidth: 0,
            }}
          >
            <span
              style={{
                fontFamily: FONT.mono,
                fontSize: 10,
                letterSpacing: "0.32em",
                textTransform: "uppercase",
                color: COLOR.inkFaint,
              }}
            >
              {catalog}
            </span>
            {featured && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  fontFamily: FONT.mono,
                  fontSize: 9,
                  letterSpacing: "0.28em",
                  textTransform: "uppercase",
                  color: COLOR.ghost,
                  flexShrink: 0,
                }}
              >
                <span
                  aria-hidden
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: COLOR.ghost,
                    boxShadow: `0 0 12px ${COLOR.ghost}`,
                  }}
                />
                Featured
              </span>
            )}
          </div>

          {/* Title */}
          <h3
            style={{
              margin: 0,
              fontFamily: FONT.display,
              fontStyle: "italic",
              fontWeight: 300,
              fontSize: featured
                ? "clamp(34px, 3.6vw, 48px)"
                : "clamp(26px, 2.4vw, 32px)",
              lineHeight: 1.04,
              letterSpacing: "-0.015em",
              color: COLOR.ink,
              overflowWrap: "break-word",
            }}
          >
            {title}
          </h3>

          {/* Subtitle */}
          <p
            style={{
              margin: 0,
              fontFamily: FONT.display,
              fontStyle: "italic",
              fontWeight: 300,
              fontSize: featured
                ? "clamp(15px, 1.3vw, 19px)"
                : "clamp(14px, 1.05vw, 16px)",
              lineHeight: 1.45,
              color: COLOR.inkMuted,
              overflowWrap: "break-word",
            }}
          >
            {subtitle}
          </p>

          {/* Description */}
          <p
            style={{
              margin: 0,
              fontFamily: FONT.body,
              fontSize: featured ? 15 : 13.5,
              lineHeight: 1.7,
              color: COLOR.inkBody,
              overflowWrap: "break-word",
            }}
          >
            {description}
          </p>

          {/* Citation + Enter cue. marginTop: auto pins this row to the
              bottom of the body. align-items: flex-end keeps the Enter
              cue aligned with the final line of citation when citation
              wraps. */}
          <div
            style={{
              marginTop: "auto",
              paddingTop: 12,
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: 18,
              minWidth: 0,
            }}
          >
            <span
              style={{
                fontFamily: FONT.mono,
                fontSize: 9.5,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: COLOR.inkFaint,
                lineHeight: 1.7,
                flex: 1,
                minWidth: 0,
                overflowWrap: "break-word",
              }}
            >
              {citation}
            </span>
            <span
              className="substrate-card-cta"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                fontFamily: FONT.mono,
                fontSize: 10,
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: COLOR.ghost,
                borderBottom: `1px solid ${COLOR.ghost}40`,
                paddingBottom: 4,
                transition: "color 0.3s ease, border-color 0.3s ease",
                flexShrink: 0,
                whiteSpace: "nowrap",
              }}
            >
              Enter
              <span aria-hidden>→</span>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
