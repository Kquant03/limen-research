"use client";

// ═══════════════════════════════════════════════════════════════════════════
//  Filter · Beat 0 — Stakes
//  ─────────────────────────────────────────────────────────────────────────
//  The hero. Establishes the claim, names the empty niche in the existing
//  Grabby Aliens objection literature (anthropic, falsifiability, prior-on-
//  hard-steps, expansion-velocity, selection-bias), promises the reader
//  the bound + the cusp + the fission-invariance result + the Coherence
//  Depth biosignature, and offers three reading paths.
//
//  Note: the sticky PhasePlot is hidden on this beat. The hero owns the
//  page. The reader's first encounter with the visualization is Beat 1.
// ═══════════════════════════════════════════════════════════════════════════

import { COLOR, FONT } from "../styles";
import { Body, Italic, Kicker } from "../atoms";
import { BEATS } from "../scenarios";

export function Beat0_Stakes({ goToBeat }: { goToBeat: (id: number) => void }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "12vh clamp(28px, 6vw, 80px) 6vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        position: "relative",
      }}
    >
      <Kicker>Third Space · against grabby expansion · v14</Kicker>

      <div style={{ marginTop: 36 }}>
        <h1
          style={{
            fontFamily: FONT.display,
            fontWeight: 300,
            fontStyle: "italic",
            fontSize: "clamp(48px, 8vw, 108px)",
            lineHeight: 0.94,
            letterSpacing: "-0.022em",
            color: COLOR.ink,
            margin: 0,
            maxWidth: "16ch",
          }}
        >
          A civilization
          <br />
          that obeys physics
          <br />
          <span style={{ color: COLOR.ghost }}>cannot</span> coordinate
          <br />
          across a galaxy.
        </h1>
      </div>

      <div
        style={{
          marginTop: 56,
          maxWidth: "62ch",
          display: "grid",
          gap: 22,
        }}
      >
        <Body size={19}>
          The Grabby Aliens model — Hanson, Martin, McCarter & Paulson, 2021 —
          predicts that advanced civilizations expand at near-lightspeed in
          coherent fronts, filling the universe in deep time. Five lines of
          objection have been raised in print: anthropic, falsifiability,
          prior-on-hard-steps, expansion-velocity, and selection-bias.{" "}
          <Italic>The thermodynamic floor under coordinated agent expansion
          has not yet been formalized.</Italic>
        </Body>
        <Body size={19}>
          This essay closes that gap. Two independent walls — one set by the
          speed of light, one set by Landauer's heat-tax on irreversible
          computation — compose into a single envelope below which no
          agent-coordinated extent is reachable. The argument survives
          every escape attempt we know how to state. It also predicts what
          real advanced civilizations should look like instead. We call that
          signature <Italic>Coherence Depth</Italic>.
        </Body>
      </div>

      {/* Reading paths + TOC */}
      <div
        style={{
          marginTop: 72,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "clamp(20px, 3vw, 48px)",
          maxWidth: 880,
        }}
      >
        <div>
          <Kicker>three reading paths</Kicker>
          <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
            <PathRow label="skim · 12 min" desc="hero · cusp · dilemma · biosignature." />
            <PathRow label="full · 40 min" desc="all twelve beats in order." />
            <PathRow label="audit · 90 min" desc="every derivation drawer + the PDF." />
          </div>
        </div>
        <div>
          <Kicker>twelve beats</Kicker>
          <div
            style={{
              marginTop: 14,
              display: "grid",
              gap: 4,
              maxHeight: 240,
              overflowY: "auto",
            }}
          >
            {BEATS.map((b) => (
              <button
                key={b.id}
                onClick={() => goToBeat(b.id)}
                style={{
                  background: "transparent",
                  border: "none",
                  borderLeft: `1px solid ${COLOR.inkGhost}`,
                  padding: "6px 12px",
                  textAlign: "left",
                  cursor: "pointer",
                  display: "grid",
                  gridTemplateColumns: "44px 1fr",
                  alignItems: "baseline",
                  gap: 12,
                }}
              >
                <span
                  style={{
                    fontFamily: FONT.mono,
                    fontSize: 9,
                    color: COLOR.inkFaint,
                  }}
                >
                  {b.kicker}
                </span>
                <span
                  style={{
                    fontFamily: FONT.display,
                    fontStyle: "italic",
                    fontSize: 15,
                    color: COLOR.inkBody,
                  }}
                >
                  {b.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Down arrow */}
      <div
        style={{
          position: "absolute",
          bottom: 36,
          left: "50%",
          transform: "translateX(-50%)",
          fontFamily: FONT.mono,
          fontSize: 10,
          letterSpacing: "0.3em",
          color: COLOR.inkFaint,
          textTransform: "uppercase",
          textAlign: "center",
        }}
      >
        scroll · begin
        <div style={{ marginTop: 6, fontSize: 14, color: COLOR.ghost }}>↓</div>
      </div>
    </div>
  );
}

function PathRow({ label, desc }: { label: string; desc: string }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "120px 1fr",
        gap: 16,
        alignItems: "baseline",
      }}
    >
      <span style={{ fontFamily: FONT.mono, fontSize: 11, color: COLOR.ghost }}>
        {label}
      </span>
      <span
        style={{
          fontFamily: FONT.display,
          fontStyle: "italic",
          fontSize: 15,
          color: COLOR.inkMuted,
        }}
      >
        {desc}
      </span>
    </div>
  );
}
