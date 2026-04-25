"use client";

// ═══════════════════════════════════════════════════════════════════════════
//  Filter · FilterExperience (v14·2 — site-chrome-aware orchestrator)
//  ─────────────────────────────────────────────────────────────────────────
//  Top-level client component for /genesis/filter.
//
//  Architecture: the page is rendered inside SiteChrome's <main>, which is
//  itself wrapped between a fixed SiteHeader (top, z-50, expanded ~220px
//  → compact ~64px on scroll) and an in-flow <footer> (~96px marginTop +
//  internal padding). This component does NOT own the chrome and must
//  not double up on it. What it owns is the box BETWEEN them.
//
//  Layout shape:
//    [SiteHeader, fixed]
//
//    [outer wrapper — paddingTop clears the expanded header]
//      [reading-plate box, max-width 1700, frosted glass over substrate]
//        [grid: TOC | scrolling beats | sticky phase plot]
//      [/box]
//    [/wrapper]
//
//    [<footer> from SiteChrome — appears naturally in flow]
//
//  Key changes from v14·1:
//    · TOC moved from `position: fixed` (viewport-pinned, bleeds past the
//      box) to `position: sticky` inside its grid column. It now reads as
//      part of the filter content rather than as global page chrome.
//    · The whole experience wraps in a reading-plate-style box (rgba +
//      backdrop blur + subtle border) constrained to max-width 1400 to
//      match the SiteChrome footer's content width. The substrate shows
//      through the frosted glass.
//    · Top padding on the outer wrapper clears the expanded SiteHeader on
//      initial load. No global padding-top hack — the offset is local to
//      this experience.
//    · Sticky aside's `height: calc(100vh - sticky-offset)` ensures it
//      always fits below the compact header. The footer-collision problem
//      from v14·1 disappears because the aside is sticky inside the box
//      and naturally scrolls away when the box ends, before the footer.
//
//  IMPORTANT — file rename required (carried over from v14·1):
//  the existing ./beats/Beat11_CoherenceDepth.tsx must be renamed to
//  ./beats/Beat12_CoherenceDepth.tsx with the export symbol updated to
//  match.
// ═══════════════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useRef, useState } from "react";
import { COLOR, FONT } from "./styles";
import { BEATS } from "./scenarios";
import { PhasePlot } from "./PhasePlot";
import {
  PredictionPoint,
  makeInitialPrediction,
} from "./PredictionCurve";
import {
  C_LIGHT, L_SUN, T_DEFAULT, LAMBDA_DEFAULT,
} from "./physics";

import { Beat0_Stakes }            from "./beats/Beat0_Stakes";
import { Beat1_ColdOpen }          from "./beats/Beat1_ColdOpen";
import { Beat2_SignalingTooth }    from "./beats/Beat2_SignalingTooth";
import { Beat3_EnergeticTooth }    from "./beats/Beat3_EnergeticTooth";
import { Beat4_SivakCrooks }       from "./beats/Beat4_SivakCrooks";
import { Beat5_YouDrawIt }         from "./beats/Beat5_YouDrawIt";
import { Beat6_Cusp }              from "./beats/Beat6_Cusp";
import { Beat7_SmallMultiples }    from "./beats/Beat7_SmallMultiples";
import { Beat8_Strategies }        from "./beats/Beat8_Strategies";
import { Beat9_FissionDilemma }    from "./beats/Beat9_FissionDilemma";
import { Beat10_Loopholes }        from "./beats/Beat10_Loopholes";
import { Beat11_ReplicatorWave }   from "./beats/Beat11_ReplicatorWave";
import { Beat12_CoherenceDepth }   from "./beats/Beat12_CoherenceDepth";

// ─── Header offsets ────────────────────────────────────────────────────────
// SiteHeader expands when scrollY ≤ 64; collapses above. Conservative
// upper bounds — better to overshoot than clip masthead content.
const HEADER_H_EXPANDED = 220; // px — masthead + nav, fully open
const HEADER_H_COMPACT  = 64;  // px — nav-only, compact mode

// Sticky elements (TOC, phase plot aside) sit just below the compact header
// once the user has scrolled past the masthead.
const STICKY_OFFSET     = HEADER_H_COMPACT + 12;

// Box sizing — wider than the SiteChrome footer (1400) because the filter
// has a 3-column grid (TOC | beats | plot) that benefits from more room.
// At 1700 the box leaves ~110px margins on a 1920 viewport, ~50px on a
// 1800 viewport, and hits the inner clamp padding below 1700. Tune here
// if you want it wider/tighter; everything else flows from this.
const BOX_MAX_WIDTH     = 1700;

// ───────────────────────────────────────────────────────────────────────────

export function FilterExperience() {
  // ─── Beat state ─────────────────────────────────────────────────
  const [activeBeat, setActiveBeat] = useState(0);

  // ─── Parameter store (Tangle-style) ─────────────────────────────
  const [params, setParams] = useState({
    lam: LAMBDA_DEFAULT,
    T: T_DEFAULT,
    v: C_LIGHT,
    L_star: L_SUN,
  });

  // ─── Prediction curve ───────────────────────────────────────────
  const [prediction, setPrediction] = useState<PredictionPoint[]>(() =>
    makeInitialPrediction(9),
  );

  // ─── Trajectory animation clock — only beats 8/9/10 use it.
  // (Beat 11 Replicator Wave handles its own swarm animation; Beat 12
  // Coherence Depth is static.)
  const [trajClock, setTrajClock] = useState(0);
  const beatRef = useRef(activeBeat);
  beatRef.current = activeBeat;

  useEffect(() => {
    if (activeBeat < 8 || activeBeat > 10) {
      setTrajClock(0);
      return;
    }
    let raf: number;
    let start: number | null = null;
    const loop = (t: number) => {
      if (start === null) start = t;
      const elapsed = (t - start) / 5500;
      const clamped = Math.min(1, elapsed);
      setTrajClock(clamped);
      if (elapsed < 1.05 && beatRef.current >= 8 && beatRef.current <= 10) {
        raf = requestAnimationFrame(loop);
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [activeBeat]);

  // ─── IntersectionObserver wiring ───────────────────────────────
  // rootMargin biased so a beat counts as "active" only once it's clear
  // of the compact header. The +80 adds a small reading buffer so the
  // active state lags entry by a beat-fraction, not flickering at the
  // boundary.
  const sectionRefs = useRef<Map<number, HTMLElement>>(new Map());
  const setSectionRef = useCallback((id: number) => (el: HTMLElement | null) => {
    if (el) sectionRefs.current.set(id, el);
    else sectionRefs.current.delete(id);
  }, []);

  useEffect(() => {
    const opts: IntersectionObserverInit = {
      rootMargin: `-${STICKY_OFFSET + 80}px 0px -55% 0px`,
      threshold: 0,
    };
    const obs = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .map((e) => parseInt((e.target as HTMLElement).dataset.beat || "0", 10));
      if (visible.length > 0) {
        setActiveBeat(Math.min(...visible));
      }
    }, opts);
    sectionRefs.current.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  // ─── Manual TOC navigation ─────────────────────────────────────
  // scroll-margin-top on each section (set in scoped CSS below) ensures
  // scrollIntoView lands the section below the compact header rather
  // than under it.
  const goToBeat = useCallback((id: number) => {
    const el = sectionRefs.current.get(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  // ─── Sticky-plot visibility: hide on hero (beat 0) ─────────────
  const showStickyPlot = activeBeat >= 1;

  return (
    <div
      style={{
        // CSS variables scoped to this experience.
        ["--header-h-expanded" as string]: `${HEADER_H_EXPANDED}px`,
        ["--header-h-compact" as string]: `${HEADER_H_COMPACT}px`,
        ["--filter-sticky-offset" as string]: `${STICKY_OFFSET}px`,
        // Compensate for the fixed SiteHeader on initial load. Once the
        // user scrolls past 64px the header collapses; the reserved
        // 220px+breathing area scrolls off naturally.
        paddingTop: `calc(${HEADER_H_EXPANDED}px + 4vh)`,
        // Breathing room before the SiteChrome footer (which has its
        // own marginTop:96 and internal padding).
        paddingBottom: "5vh",
        position: "relative",
        zIndex: 2,
      }}
    >
      {/* Scoped CSS — section scroll-margin so TOC navigation lands
          below the compact header; responsive collapses for the side
          rails when the box gets narrow. */}
      <style>{`
        section[data-beat] {
          scroll-margin-top: var(--filter-sticky-offset);
        }
        @media (max-width: 980px) {
          .filter-toc-label { display: none !important; }
        }
        @media (max-width: 760px) {
          .filter-grid {
            grid-template-columns: minmax(0, 1fr) !important;
          }
          .filter-toc, .filter-aside {
            display: none !important;
          }
        }
      `}</style>

      {/* Outer max-width container. 1700 is wider than the SiteChrome
          footer (1400) because the filter's 3-column grid needs the
          room — but still bounded so the box reads as a frame, not as
          full-bleed page chrome. */}
      <div
        style={{
          maxWidth: BOX_MAX_WIDTH,
          margin: "0 auto",
          padding: "0 clamp(16px, 2.5vw, 32px)",
        }}
      >
        {/* The reading-plate box. Frosted glass over the LivingSubstrate
            via backdrop-filter, matching the .reading-plate idiom in
            globals.css. The blur saturation pulls in the substrate's
            color cast (ghost-cyan at rest, occasional pink/violet
            during pond events) so the box feels alive but stays
            legible. */}
        <div
          className="filter-box"
          style={{
            position: "relative",
            background: "rgba(4, 8, 16, 0.55)",
            backdropFilter: "blur(28px) saturate(1.4) brightness(0.88)",
            WebkitBackdropFilter: "blur(28px) saturate(1.4) brightness(0.88)",
            border: "1px solid rgba(255, 255, 255, 0.04)",
            boxShadow:
              "inset 0 0 90px rgba(127, 175, 179, 0.025), inset 0 1px 0 rgba(255, 255, 255, 0.022)",
          }}
        >
          {/* Three-column grid (TOC | beats | plot) when the plot is
              shown; two-column (TOC | beats) on Beat 0. align-items:
              start so the sticky elements have proper row-cell extent
              to pin against. */}
          <div
            className="filter-grid"
            style={{
              display: "grid",
              gridTemplateColumns: showStickyPlot
                ? "minmax(150px, 190px) minmax(0, 1fr) minmax(0, 1fr)"
                : "minmax(150px, 190px) minmax(0, 1fr)",
              alignItems: "start",
            }}
          >
            <SidebarTOC activeBeat={activeBeat} goToBeat={goToBeat} />

            {/* Left scroll column — the beats themselves. */}
            <main style={{ minWidth: 0, position: "relative" }}>
              <Wrap refSetter={setSectionRef(0)} beatId={0}>
                <Beat0_Stakes goToBeat={goToBeat} />
              </Wrap>
              <Wrap refSetter={setSectionRef(1)} beatId={1}>
                <Beat1_ColdOpen />
              </Wrap>
              <Wrap refSetter={setSectionRef(2)} beatId={2}>
                <Beat2_SignalingTooth />
              </Wrap>
              <Wrap refSetter={setSectionRef(3)} beatId={3}>
                <Beat3_EnergeticTooth />
              </Wrap>
              <Wrap refSetter={setSectionRef(4)} beatId={4}>
                <Beat4_SivakCrooks />
              </Wrap>
              <Wrap refSetter={setSectionRef(5)} beatId={5}>
                <Beat5_YouDrawIt
                  prediction={prediction}
                  onPredictionChange={setPrediction}
                />
              </Wrap>
              <Wrap refSetter={setSectionRef(6)} beatId={6}>
                <Beat6_Cusp params={params} />
              </Wrap>
              <Wrap refSetter={setSectionRef(7)} beatId={7}>
                <Beat7_SmallMultiples />
              </Wrap>
              <Wrap refSetter={setSectionRef(8)} beatId={8}>
                <Beat8_Strategies />
              </Wrap>
              <Wrap refSetter={setSectionRef(9)} beatId={9}>
                <Beat9_FissionDilemma />
              </Wrap>
              <Wrap refSetter={setSectionRef(10)} beatId={10}>
                <Beat10_Loopholes />
              </Wrap>
              <Wrap refSetter={setSectionRef(11)} beatId={11}>
                <Beat11_ReplicatorWave />
              </Wrap>
              <Wrap refSetter={setSectionRef(12)} beatId={12}>
                <Beat12_CoherenceDepth />
              </Wrap>
            </main>

            {/* Right column — sticky phase plot. position:sticky inside
                the grid cell rather than position:fixed so it stays
                bounded by the box rather than bleeding out of it. */}
            {showStickyPlot && (
              <aside
                className="filter-aside"
                style={{
                  position: "sticky",
                  top: "var(--filter-sticky-offset)",
                  alignSelf: "start",
                  height: "calc(100vh - var(--filter-sticky-offset))",
                  borderLeft: `1px solid ${COLOR.inkVeil}`,
                  padding: "clamp(20px, 3vw, 40px)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  overflowY: "auto",
                }}
              >
                <div
                  style={{
                    fontFamily: FONT.mono,
                    fontSize: 10,
                    letterSpacing: "0.32em",
                    textTransform: "uppercase",
                    color: COLOR.inkFaint,
                    marginBottom: 14,
                  }}
                >
                  the coordination ceiling · L vs τ
                </div>
                <PhasePlot
                  beatId={activeBeat}
                  params={params}
                  prediction={prediction}
                  onPredictionChange={setPrediction}
                  trajectoryProgress={trajClock}
                />
                <div
                  style={{
                    marginTop: 18,
                    fontFamily: FONT.display,
                    fontStyle: "italic",
                    fontSize: 14,
                    color: COLOR.inkMuted,
                    lineHeight: 1.5,
                  }}
                >
                  {plotCaptionForBeat(activeBeat)}
                </div>
              </aside>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
//  Section wrapper — attaches the IntersectionObserver target.
// ───────────────────────────────────────────────────────────────────────────

function Wrap({
  beatId,
  refSetter,
  children,
}: {
  beatId: number;
  refSetter: (el: HTMLElement | null) => void;
  children: React.ReactNode;
}) {
  return (
    <section
      ref={refSetter}
      data-beat={beatId}
      style={{ minHeight: "100vh" }}
    >
      {children}
    </section>
  );
}

// ───────────────────────────────────────────────────────────────────────────
//  SidebarTOC — sticky inside its grid column, bounded by the box.
//  Renders as a vertical rail of beat numbers + labels with a thin
//  vertical rule on the right to separate from the beat content.
// ───────────────────────────────────────────────────────────────────────────

function SidebarTOC({
  activeBeat,
  goToBeat,
}: {
  activeBeat: number;
  goToBeat: (id: number) => void;
}) {
  return (
    <nav
      className="filter-toc"
      style={{
        position: "sticky",
        top: "var(--filter-sticky-offset)",
        alignSelf: "start",
        height: "calc(100vh - var(--filter-sticky-offset))",
        padding: "clamp(20px, 2.5vw, 32px) clamp(12px, 1.5vw, 20px)",
        borderRight: `1px solid ${COLOR.inkVeil}`,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        overflowY: "auto",
      }}
    >
      <div
        style={{
          fontFamily: FONT.mono,
          fontSize: 9,
          letterSpacing: "0.28em",
          textTransform: "uppercase",
          color: COLOR.inkFaint,
          marginBottom: 18,
        }}
      >
        filter
      </div>
      {BEATS.map((b) => {
        const active = b.id === activeBeat;
        return (
          <button
            key={b.id}
            onClick={() => goToBeat(b.id)}
            style={{
              background: "transparent",
              border: "none",
              padding: "4px 0",
              cursor: "pointer",
              display: "grid",
              gridTemplateColumns: "32px 1fr",
              gap: 8,
              alignItems: "baseline",
              textAlign: "left",
              opacity: active ? 1 : 0.55,
              transition: "opacity 200ms",
            }}
          >
            <span
              style={{
                fontFamily: FONT.mono,
                fontSize: 9,
                color: active ? COLOR.ghost : COLOR.inkFaint,
                letterSpacing: "0.06em",
              }}
            >
              {b.kicker}
            </span>
            <span
              className="filter-toc-label"
              style={{
                fontFamily: FONT.display,
                fontStyle: "italic",
                fontSize: 12,
                lineHeight: 1.25,
                color: active ? COLOR.ink : COLOR.inkMuted,
              }}
            >
              {b.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

// ───────────────────────────────────────────────────────────────────────────
//  Per-beat plot caption — rendered under the sticky plot.
// ───────────────────────────────────────────────────────────────────────────

function plotCaptionForBeat(beatId: number): string {
  switch (beatId) {
    case 1:  return "Empty axes. The civilization will move here in a moment.";
    case 2:  return "L_R — what light allows. Round-trip signalling, plotted.";
    case 3:  return "L_E — what heat allows. The Landauer floor, multiplied across the blanket.";
    case 4:  return "Both walls, separately. Watch where they cross.";
    case 5:  return "Now you draw what reach is possible. Drag the points; lock when ready.";
    case 6:  return "The cusp τ* — the moment two unrelated areas of physics conspire.";
    case 7:  return "Same wall, four scales. The argument is invariant under choice of scenario.";
    case 8:  return "Naïve fission — the daughters start fresh and hit the same wall.";
    case 9:  return "Architected fission — and the coordination channel D = 2·L_d inherits the wall.";
    case 10: return "Sweep λ and T. The wall shifts. It does not vanish.";
    case 11: return "The wall, alongside a swarm with no L. Physics permits the swarm. Design declines it.";
    case 12: return "What real advanced civilizations should look like instead.";
    default: return "";
  }
}