"use client";

// ═══════════════════════════════════════════════════════════════════════════
//  Filter · LoopholesPanel
//  ─────────────────────────────────────────────────────────────────────────
//  A deliberately-named list of the precise places where the composed
//  bound could fail. Borrowed from Bell-inequality practice: naming the
//  loopholes strengthens the claim rather than weakens it.
// ═══════════════════════════════════════════════════════════════════════════

const COLOR = {
  ink: "#f4f6fb",
  inkBody: "#c8cfe0",
  inkMuted: "#8a9bba",
  inkFaint: "#5a6780",
  inkGhost: "#3a4560",
  ghost: "#7fafb3",
} as const;

const FONT = {
  display: "var(--font-display), 'Cormorant Garamond', Georgia, serif",
  body: "var(--font-body), 'Source Serif 4', Georgia, serif",
  mono: "var(--font-mono), 'JetBrains Mono', monospace",
} as const;

const LOOPHOLES: Array<{
  name: string;
  text: string;
  status: "physics" | "design" | "residual";
}> = [
  {
    name: "Wormholes / superluminal physics",
    status: "physics",
    text:
      "If signals can outrun c, the relativistic tooth dissolves. Reply: known physics provides no such channel. Traversable wormholes require null-energy-condition violation; none observed.",
  },
  {
    name: "Sub-Landauer reversible computation",
    status: "physics",
    text:
      "If updates are logically reversible, the k_B T ln 2 floor disappears. Reply: coordination requires erasing the stale local model when the global state changes — this is the irreversible step. Even Bennett's reversible-computing constructions require eventual erasure of garbage bits at the boundary.",
  },
  {
    name: "Cold reservoir (T → 0)",
    status: "physics",
    text:
      "The Landauer quantum k_B T ln 2 scales with bath temperature. Reply: any cooling protocol must reject heat to a colder reservoir. The CMB at ~2.7 K is the practical floor; quantum-limited refrigerators below that pay the same Sivak–Crooks cost in their own protocols.",
  },
  {
    name: "Quantum compression (smaller λ)",
    status: "physics",
    text:
      "τ★ ∝ λ². Halving λ shifts the cusp by a factor of four. Reaching agent-scale galactic expansion would require λ ~ 10⁻¹⁵ m (nuclear scale) and femtokelvin baths. No physically realizable substrate.",
  },
  {
    name: "Relativistic time dilation",
    status: "physics",
    text:
      "Coordination is an inertial-frame property of the home substrate; the frontier's lab-frame τ is shrunk, not stretched. Time dilation tightens the bound on coordinated extent rather than relaxing it.",
  },
  {
    name: "Non-Markovian reservoirs",
    status: "physics",
    text:
      "Sivak–Crooks assumes a memoryless bath. Reply: the time-averaged bound is restored, and any genuinely persistent non-Markovian bath is itself part of the system requiring a Markov boundary at some larger λ. The argument re-inserts at the next scale.",
  },
  {
    name: "Uncoordinated self-replicator cloud",
    status: "design",
    text:
      "An expanding cloud of autonomous units sharing common origin and construction template but no inter-fragment coordination. Conceded on physics grounds — the envelope of §6.1–6.3 does not bind a cloud whose units do not coordinate across L. The argument against such deployment is a design argument: a homeostatic mind, on the account of §3 and §7, would not deploy such a cloud, because the deployment is itself the expansion-extraction-maximization configuration the rest of the paper diagnoses. This loophole is closed by the paper as a whole, not by §6.",
  },
  {
    name: "Acausal / superdeterministic coordination",
    status: "residual",
    text:
      "Coordinated outcomes without exchanged signals (cosmological initial conditions, retrocausality). Honest residual. I do not formally close this loophole. Any such mechanism abandons agentic coordination as a meaningful concept — the agent did not choose anything. Hanson's grabby model presupposes choice; without it, the model dissolves on its own terms before our envelope ever applies.",
  },
];

const STATUS_LABEL: Record<"physics" | "design" | "residual", string> = {
  physics: "Closed on physics",
  design: "Conceded on physics · closed by design",
  residual: "Honest residual",
};

const STATUS_COLOR: Record<"physics" | "design" | "residual", string> = {
  physics: COLOR.ghost,
  design: "#c8a04a",
  residual: "#c44536",
};

export function LoopholesPanel() {
  return (
    <div
      style={{
        padding: "clamp(28px, 3vw, 44px) clamp(28px, 3vw, 44px)",
        border: `1px solid ${COLOR.inkGhost}`,
        background: "rgba(10, 15, 26, 0.35)",
      }}
    >
      <div
        style={{
          fontFamily: FONT.mono,
          fontSize: 10,
          letterSpacing: "0.32em",
          textTransform: "uppercase",
          color: COLOR.inkFaint,
          marginBottom: 18,
        }}
      >
        Eight escape attempts, named explicitly
      </div>
      <div
        style={{
          fontFamily: FONT.display,
          fontStyle: "italic",
          fontSize: 15.5,
          lineHeight: 1.6,
          color: COLOR.inkMuted,
          marginBottom: 28,
          maxWidth: "62ch",
        }}
      >
        Following the Bell-test loophole tradition: name every escape, address
        every escape, mark the residual. Six close on the physics. One — the
        uncoordinated self-replicator cloud — is conceded on physics and
        closed by the design argument the paper makes elsewhere. One is
        honestly retained.
      </div>
      {LOOPHOLES.map((l, i) => (
        <div
          key={i}
          style={{
            marginBottom: 22,
            paddingBottom: 22,
            borderBottom:
              i < LOOPHOLES.length - 1 ? `1px solid ${COLOR.inkGhost}60` : "none",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              flexWrap: "wrap",
              gap: 12,
              marginBottom: 8,
            }}
          >
            <div
              style={{
                fontFamily: FONT.display,
                fontSize: 17,
                color: COLOR.ink,
                fontWeight: 500,
              }}
            >
              {i + 1}. {l.name}
            </div>
            <div
              style={{
                fontFamily: FONT.mono,
                fontSize: 9,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: STATUS_COLOR[l.status],
                border: `1px solid ${STATUS_COLOR[l.status]}40`,
                padding: "3px 8px",
                borderRadius: 2,
              }}
            >
              {STATUS_LABEL[l.status]}
            </div>
          </div>
          <div
            style={{
              fontFamily: FONT.body,
              fontSize: 15,
              lineHeight: 1.7,
              color: COLOR.inkBody,
            }}
          >
            {l.text}
          </div>
        </div>
      ))}
    </div>
  );
}
