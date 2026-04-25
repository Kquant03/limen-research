"use client";

// ═══════════════════════════════════════════════════════════════════════════
//  Filter · Beat 12 — Coherence Depth + Coda
//  ─────────────────────────────────────────────────────────────────────────
//  The landmark biosignature. If grabby expansion is impossible, what
//  should real advanced civilizations look like instead?
//
//    · NOT an expanding bubble at v ~ c. (We just spent 11 beats on why.)
//    · INSTEAD: dense, non-expanding regions with high internal coherence
//      depth — many layers of nested coordination at small extent. Pulses
//      of activity inside the boundary, but a stable boundary.
//
//  The diagram contrasts the two signatures side by side. The coda
//  closes with a falsifiability commitment (Aaronson-style) and a
//  chiastic image: "the stars belong to no one."
//
//  v14·1 renumber: this was Beat 11 in v14. With the Replicator Wave
//  inserted at id 11, Coherence Depth is now Beat 12. Content unchanged
//  from v14 — the previous beat now shoulders the bridge to alignment,
//  so this one can stay focused on the positive observational claim.
// ═══════════════════════════════════════════════════════════════════════════

import { COLOR, FONT } from "../styles";
import { Body, DisplayHeading, Italic, Kicker, Mono } from "../atoms";

export function Beat12_CoherenceDepth() {
  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "12vh clamp(28px, 6vw, 80px) 14vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <Kicker color={COLOR.amber}>beat 10 · what to look for instead</Kicker>
      <div style={{ marginTop: 18 }}>
        <DisplayHeading size={64}>
          Coherence Depth.
        </DisplayHeading>
      </div>

      <div style={{ marginTop: 32, display: "grid", gap: 24, maxWidth: "60ch" }}>
        <Body size={18}>
          If grabby expansion is impossible, what should real advanced
          civilizations look like? The envelope predicts a positive
          signature. Not an expanding bubble at <Mono>v ~ c</Mono>; a
          dense, stable region with many nested layers of coordination
          inside its boundary. Activity pulses internally; the boundary
          itself does not move.
        </Body>

        <Body>
          We call this <Italic>Coherence Depth</Italic>: the number of
          mutually-coordinated levels nested within a stable Markov
          boundary. A homeostatic civilization optimizes Coherence Depth
          rather than coordinated extent. It is what the wall makes
          possible — what the wall, in fact, encourages.
        </Body>
      </div>

      {/* Biosignature diagram */}
      <div style={{ marginTop: 48 }}>
        <BiosignatureDiagram />
      </div>

      {/* Falsifiability + coda */}
      <div style={{ marginTop: 56, display: "grid", gap: 22, maxWidth: "60ch" }}>
        <div
          style={{
            padding: "20px 22px",
            background: COLOR.voidSoft,
            borderLeft: `2px solid ${COLOR.amber}`,
          }}
        >
          <div
            style={{
              fontFamily: FONT.mono,
              fontSize: 10,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: COLOR.amber,
              marginBottom: 10,
            }}
          >
            falsifiability commitment
          </div>
          <Body>
            <Italic>If a single grabby expansion front is observed</Italic> —
            a boundary moving at any meaningful fraction of c, with
            spectroscopic evidence of inter-fragment coordination — this
            paper is wrong. We retract the bound, the cusp, and the
            biosignature. We do not retreat to fitted parameters.
          </Body>
        </div>

        <Body muted size={16}>
          The bound has two parameters worth measuring against:{" "}
          <Mono>λ</Mono> (the granularity of irreversible registration)
          and <Mono>T</Mono> (the bath temperature). Both are operationally
          accessible. Both have known floors. Neither moves enough to
          reach galactic agentic coordination.
        </Body>

        <div
          style={{
            marginTop: 32,
            padding: "32px 0 0",
            borderTop: `1px solid ${COLOR.inkVeil}`,
          }}
        >
          <div
            style={{
              fontFamily: FONT.display,
              fontStyle: "italic",
              fontWeight: 300,
              fontSize: "clamp(28px, 4vw, 44px)",
              lineHeight: 1.2,
              color: COLOR.ink,
              maxWidth: "20ch",
            }}
          >
            Look at the stars —
            <br />
            they belong to no one.
          </div>
          <div
            style={{
              marginTop: 18,
              fontFamily: FONT.mono,
              fontSize: 11,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: COLOR.inkFaint,
            }}
          >
            Third Space · stanley sebastian · 2026
          </div>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
//  Biosignature diagram — expansionist vs homeostatic, side by side
// ───────────────────────────────────────────────────────────────────────────

function BiosignatureDiagram() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 0,
        background: COLOR.voidSoft,
        border: `1px solid ${COLOR.inkVeil}`,
      }}
    >
      <BioPanel
        title="Expansionist (predicted absent)"
        accent={COLOR.sanguine}
        kicker="grabby signature · v ~ c bubble"
        description="A coherent expansion front, isotropic, near-lightspeed. Should produce visible spectroscopic features at the bubble wall. Not observed."
        diagram={<ExpansionistDiagram />}
      />
      <BioPanel
        title="Homeostatic (the prediction)"
        accent={COLOR.ghost}
        kicker="coherence depth signature · stable boundary"
        description="Dense, non-expanding region with high internal nesting. Boundary is stable; pulses of activity internal to the boundary. Detectable by spectral persistence + low astrometric drift over many epochs."
        diagram={<HomeostaticDiagram />}
      />
    </div>
  );
}

function BioPanel({
  title, accent, kicker, description, diagram,
}: {
  title: string;
  accent: string;
  kicker: string;
  description: string;
  diagram: React.ReactNode;
}) {
  return (
    <div
      style={{
        padding: "28px 28px",
        borderLeft: `2px solid ${accent}`,
        display: "grid",
        gap: 14,
      }}
    >
      <div
        style={{
          fontFamily: FONT.mono,
          fontSize: 10,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: accent,
        }}
      >
        {kicker}
      </div>
      <div
        style={{
          fontFamily: FONT.display,
          fontStyle: "italic",
          fontSize: 22,
          color: COLOR.ink,
        }}
      >
        {title}
      </div>
      <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {diagram}
      </div>
      <div
        style={{
          fontFamily: FONT.body,
          fontSize: 14,
          lineHeight: 1.6,
          color: COLOR.inkBody,
        }}
      >
        {description}
      </div>
    </div>
  );
}

function ExpansionistDiagram() {
  return (
    <svg viewBox="0 0 240 200" style={{ width: "100%", maxWidth: 280 }}>
      <defs>
        <radialGradient id="bubble" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={COLOR.sanguine} stopOpacity="0.08" />
          <stop offset="0.7" stopColor={COLOR.sanguine} stopOpacity="0.18" />
          <stop offset="1" stopColor={COLOR.sanguine} stopOpacity="0.4" />
        </radialGradient>
        <marker id="arrowR" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill={COLOR.sanguine} />
        </marker>
      </defs>
      {/* Stars */}
      {Array.from({ length: 28 }).map((_, i) => {
        const ang = (i * 137.5) * (Math.PI / 180);
        const r = 30 + (i % 5) * 20;
        const x = 120 + r * Math.cos(ang);
        const y = 100 + r * Math.sin(ang);
        return (
          <circle key={i} cx={x} cy={y} r={0.8} fill={COLOR.inkBody} opacity="0.5" />
        );
      })}
      {/* Concentric expansion fronts */}
      {[40, 60, 82].map((r, i) => (
        <circle
          key={i}
          cx={120} cy={100} r={r}
          fill="none"
          stroke={COLOR.sanguine}
          strokeWidth="1.2"
          strokeOpacity={0.7 - i * 0.18}
          strokeDasharray="3 3"
        />
      ))}
      <circle cx={120} cy={100} r={82} fill="url(#bubble)" />
      <circle cx={120} cy={100} r={3} fill={COLOR.sanguineWash} />
      {/* Outward arrows */}
      {[0, 60, 120, 180, 240, 300].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const x1 = 120 + 84 * Math.cos(rad);
        const y1 = 100 + 84 * Math.sin(rad);
        const x2 = 120 + 100 * Math.cos(rad);
        const y2 = 100 + 100 * Math.sin(rad);
        return (
          <line
            key={deg}
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={COLOR.sanguine}
            strokeWidth="1.6"
            strokeOpacity="0.8"
            markerEnd="url(#arrowR)"
          />
        );
      })}
    </svg>
  );
}

function HomeostaticDiagram() {
  return (
    <svg viewBox="0 0 240 200" style={{ width: "100%", maxWidth: 280 }}>
      {/* Background stars */}
      {Array.from({ length: 28 }).map((_, i) => {
        const ang = (i * 137.5) * (Math.PI / 180);
        const r = 70 + (i % 5) * 15;
        const x = 120 + r * Math.cos(ang);
        const y = 100 + r * Math.sin(ang);
        return (
          <circle key={i} cx={x} cy={y} r={0.8} fill={COLOR.inkBody} opacity="0.5" />
        );
      })}
      {/* Stable boundary */}
      <circle
        cx={120} cy={100} r={50}
        fill={COLOR.ghost} fillOpacity="0.06"
        stroke={COLOR.ghost} strokeWidth="1.4"
      />
      {/* Nested layers — coherence depth */}
      {[40, 30, 20].map((r, i) => (
        <circle
          key={r}
          cx={120} cy={100} r={r}
          fill="none"
          stroke={COLOR.ghost}
          strokeWidth="0.9"
          strokeOpacity={0.35 + i * 0.18}
        />
      ))}
      {/* Internal coherence pulses */}
      {[
        { x: 110, y: 90 },
        { x: 130, y: 96 },
        { x: 118, y: 110 },
        { x: 128, y: 86 },
        { x: 108, y: 105 },
      ].map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="2.2" fill={COLOR.ghost} opacity="0.85" />
          <circle
            cx={p.x} cy={p.y} r="6"
            fill="none"
            stroke={COLOR.ghost} strokeWidth="0.8"
            strokeOpacity="0.4"
          />
        </g>
      ))}
      {/* Center mark */}
      <circle cx={120} cy={100} r={3} fill={COLOR.amber} />
    </svg>
  );
}
