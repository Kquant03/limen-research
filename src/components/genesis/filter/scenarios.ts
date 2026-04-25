// ═══════════════════════════════════════════════════════════════════════════
//  Filter · scenarios, strategies, and beat visibility
//  ─────────────────────────────────────────────────────────────────────────
//  Static configuration: the four scenarios (home-system → galactic), the
//  three strategies (monolithic / naïve fission / architected fission), and
//  the visibility flags that drive what the phase plot shows at each of
//  the thirteen beats of the v14·1 redesign.
//
//  v14·1 change: Beat 11 (Replicator Wave) inserted between Loopholes and
//  Coherence Depth. Concedes that the §6 composed envelope does not bind a
//  swarm of locally-bounded self-replicating probes (the strongest reading
//  of Hanson's grabby model), and pivots to the homeostatic-design move
//  carrying the rest of the weight. The bridge from physics to alignment
//  is here. Coherence Depth is now id 12.
// ═══════════════════════════════════════════════════════════════════════════

import { LY, AU } from "./physics";

// ─── Scenarios ────────────────────────────────────────────────────────────

export type ScenarioId = "home" | "solar" | "local" | "galactic";

export type Scenario = {
  id: ScenarioId;
  label: string;
  sub: string;
  tau_yr: number;
  L_target_ly: number;
  note: string;
};

export const SCENARIOS: Record<ScenarioId, Scenario> = {
  home: {
    id: "home",
    label: "Home-system agent",
    sub: "τ = 1 day · L = 100 AU",
    tau_yr: 1 / 365.25,
    L_target_ly: (100 * AU) / LY,
    note: "A civilization coordinating its home system. Fully inside the envelope.",
  },
  solar: {
    id: "solar",
    label: "Solar neighbourhood",
    sub: "τ = 10 yr · L = 4.2 ly (Proxima)",
    tau_yr: 10,
    L_target_ly: 4.2,
    note: "Reaching the nearest star requires response times of ~decade. Just barely agent-scale.",
  },
  local: {
    id: "local",
    label: "Local cluster",
    sub: "τ = 100 yr · L = 100 ly",
    tau_yr: 100,
    L_target_ly: 100,
    note: "Multi-century response. Approaching the upper edge of agent-plausible responsiveness.",
  },
  galactic: {
    id: "galactic",
    label: "Galactic (ambitious)",
    sub: "τ = 10 yr · L = 100 kly",
    tau_yr: 10,
    L_target_ly: 1e5,
    note: "The grabby scenario: agent-timescale responsiveness AND galactic reach. Watch where it lands.",
  },
};

export const SCENARIO_LIST: Scenario[] = [
  SCENARIOS.home,
  SCENARIOS.solar,
  SCENARIOS.local,
  SCENARIOS.galactic,
];

// ─── Strategies ───────────────────────────────────────────────────────────

export type StrategyId = "monolithic" | "naive" | "architected";

export type Strategy = {
  id: StrategyId;
  label: string;
  sub: string;
};

export const STRATEGIES: Record<StrategyId, Strategy> = {
  monolithic: {
    id: "monolithic",
    label: "Monolithic",
    sub: "Single civilization expanding L toward target.",
  },
  naive: {
    id: "naive",
    label: "Naïve fission",
    sub: "Parent splits at L_fiss. Daughters start from L = 0 with no shared infrastructure.",
  },
  architected: {
    id: "architected",
    label: "Architected fission",
    sub: "Parent splits at L_fiss. Daughters maintain inter-fragment coordination at τ_sync. Coordination channel D = 2·L_daughter tracks as its own worldline — and hits the same envelope.",
  },
};

export const STRATEGY_LIST: Strategy[] = [
  STRATEGIES.monolithic,
  STRATEGIES.naive,
  STRATEGIES.architected,
];

// ─── Beats ────────────────────────────────────────────────────────────────

export type BeatMeta = {
  id: number;
  label: string;
  kicker: string;
  title: string;
};

export const BEATS: BeatMeta[] = [
  { id: 0,  label: "Stakes",            kicker: "0",   title: "What this paper claims" },
  { id: 1,  label: "Cold open",         kicker: "1",   title: "Imagine a civilization" },
  { id: 2,  label: "Signaling tooth",   kicker: "2",   title: "The first wall · light" },
  { id: 3,  label: "Energetic tooth",   kicker: "3",   title: "The second wall · heat" },
  { id: 4,  label: "Sivak–Crooks",      kicker: "3.5", title: "The price of moving fast" },
  { id: 5,  label: "You draw it",       kicker: "4",   title: "Predict the envelope" },
  { id: 6,  label: "The cusp",          kicker: "5",   title: "τ* — where two worlds meet" },
  { id: 7,  label: "Four scenarios",    kicker: "6",   title: "Same wall, different reach" },
  { id: 8,  label: "Strategies",        kicker: "7—8", title: "Three ways to try; three breaches" },
  { id: 9,  label: "Fission dilemma",   kicker: "8.5", title: "The Chinese-Room moment" },
  { id: 10, label: "Loopholes",         kicker: "9",   title: "Where this could fail" },
  { id: 11, label: "Replicator wave",   kicker: "9.5", title: "But what about replicators?" },
  { id: 12, label: "Coherence Depth",   kicker: "10",  title: "What to look for instead" },
];

// ─── Beat plot state ──────────────────────────────────────────────────────
// What the sticky PhasePlot shows at each beat. The renderer in
// PhasePlot.tsx reads this and cross-fades layers as the reader scrolls.

export type PlotState = {
  axes: boolean;
  agentBand: boolean;
  L_R: boolean;
  L_E: boolean;
  envelope: boolean;
  infeasible: boolean;
  tauStar: boolean;
  prediction: boolean;
  predictionLocked: boolean;
  smallMultiples: boolean;
  overlay: boolean;
  trajectory: "monolithic" | "naive" | "architected" | null;
  fissionMode: "branch" | null;
  scenarioMarks: boolean;
};

const baseHidden: PlotState = {
  axes: false, agentBand: false,
  L_R: false, L_E: false, envelope: false,
  infeasible: false, tauStar: false,
  prediction: false, predictionLocked: false,
  smallMultiples: false, overlay: false,
  trajectory: null, fissionMode: null,
  scenarioMarks: false,
};

export const PLOT_STATE: Record<number, PlotState> = {
  // 0 · Stakes — no plot (hero)
  0:  { ...baseHidden },
  // 1 · Cold open — empty axes; the cold-open widget is in the left column
  1:  { ...baseHidden, axes: true },
  // 2 · Signaling tooth — L_R alone
  2:  { ...baseHidden, axes: true, agentBand: true, L_R: true },
  // 3 · Energetic tooth — L_R + L_E together
  3:  { ...baseHidden, axes: true, agentBand: true, L_R: true, L_E: true },
  // 4 · Sivak–Crooks — both teeth still visible; bead explorable in left column
  4:  { ...baseHidden, axes: true, agentBand: true, L_R: true, L_E: true },
  // 5 · You-Draw-It — both teeth + the reader's prediction curve
  5:  { ...baseHidden, axes: true, agentBand: true, L_R: true, L_E: true, prediction: true },
  // 6 · Cusp reveal — envelope + τ* + locked prediction (so reader sees the gap)
  6:  { ...baseHidden, axes: true, agentBand: true, L_R: true, L_E: true,
        envelope: true, infeasible: true, tauStar: true,
        prediction: true, predictionLocked: true },
  // 7 · Small multiples — 2×2 of envelopes with scenario targets
  7:  { ...baseHidden, axes: true, agentBand: true, envelope: true, infeasible: true,
        smallMultiples: true },
  // 8 · Strategies — naïve fission trajectory (daughter breach is the pedagogy)
  8:  { ...baseHidden, axes: true, agentBand: true, envelope: true, infeasible: true,
        trajectory: "naive" },
  // 9 · Fission dilemma — architected with D channel revealed
  9:  { ...baseHidden, axes: true, agentBand: true, envelope: true, infeasible: true,
        trajectory: "architected", fissionMode: "branch" },
  // 10 · Loopholes — envelope + parameter overlay sweep + scenario marks
  10: { ...baseHidden, axes: true, agentBand: true, envelope: true, infeasible: true,
        overlay: true, scenarioMarks: true },
  // 11 · Replicator wave — envelope persists as silent context. The swarm
  //      visualization lives inline in the left column. The plot showing
  //      the §6 envelope alongside the swarm IS the argument: physics
  //      bounds coordinated extent; the swarm has no coordinated extent.
  //      Trajectory deliberately null — the swarm doesn't have a worldline
  //      on (τ, L) because it doesn't have an L.
  11: { ...baseHidden, axes: true, agentBand: true, envelope: true, infeasible: true },
  // 12 · Coherence Depth — envelope persists as the silent context
  12: { ...baseHidden, axes: true, agentBand: true, envelope: true, infeasible: true },
};

export function plotStateForBeat(beatId: number): PlotState {
  return PLOT_STATE[Math.max(0, Math.min(12, beatId))];
}
