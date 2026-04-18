// Limen Pond — shared types
// Used across the Durable Object, Worker router, and Next.js client.
// Keep this file free of runtime dependencies so it can be shared via
// a published package or git submodule to the web app.

// ───────────────────────────────────────────────────────────────────
//  Spatial
// ───────────────────────────────────────────────────────────────────

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

// Pond is a cylindrical-ish basin ~20m diameter, ~3m deep.
// Coordinates in meters, centered at origin, y is up.
export const POND = {
  radius: 10.0,
  depth: 3.0,
  surfaceY: 0.0,     // water surface
  floorY: -3.0,      // pond floor
} as const;

// ───────────────────────────────────────────────────────────────────
//  Life stage
// ───────────────────────────────────────────────────────────────────

export type Stage = "egg" | "fry" | "juvenile" | "adolescent" | "adult" | "elder" | "dying" | "dead";

export type ModelTier = "fry" | "juvenile" | "adult" | "elder" | "legendary";

export interface StageSpec {
  stage: Stage;
  tier: ModelTier;
  // How many ticks (at 2Hz) this stage lasts, on average.
  // 30 real days = 30*86400*2 = 5_184_000 ticks.
  duration_ticks: number;
  cognition_interval_ticks: number;  // avg cadence for LLM calls
}

// Stage schedule in ticks (2 Hz). Numbers compress the 30-day lifecycle.
// Fry & juvenile cognize more often because their lives are eventful (first-of-everything).
export const STAGE_SCHEDULE: StageSpec[] = [
  { stage: "egg",        tier: "fry",       duration_ticks: 172_800,   cognition_interval_ticks: 0     }, // 1 day, no cognition
  { stage: "fry",        tier: "fry",       duration_ticks: 172_800,   cognition_interval_ticks: 60    }, // 30s
  { stage: "juvenile",   tier: "juvenile",  duration_ticks: 345_600,   cognition_interval_ticks: 240   }, // 2 min
  { stage: "adolescent", tier: "juvenile",  duration_ticks: 691_200,   cognition_interval_ticks: 240   }, // 2 min
  { stage: "adult",      tier: "adult",     duration_ticks: 1_900_800, cognition_interval_ticks: 240   }, // 2 min
  { stage: "elder",      tier: "elder",     duration_ticks: 864_000,   cognition_interval_ticks: 600   }, // 5 min
  { stage: "dying",      tier: "elder",     duration_ticks: 172_800,   cognition_interval_ticks: 1200  }, // 10 min
];

// ───────────────────────────────────────────────────────────────────
//  Koi state (authoritative; lives in SQLite)
// ───────────────────────────────────────────────────────────────────

export interface KoiState {
  fish_id: string;
  name: string;                    // observational, LLM-generated at hatching
  persona: string;                 // system-prompt core
  self_model: string | null;       // evolving self-description
  stage: Stage;
  born_at_tick: number;
  died_at_tick: number | null;

  // Kinematics
  pos: Vec3;
  vel: Vec3;
  heading: number;                 // radians, yaw

  // Affect (PAD)
  mood: {
    v: number;                     // pleasure/valence  [-1, 1]
    a: number;                     // arousal           [ 0, 1]
    d: number;                     // dominance         [-1, 1]
  };

  // Intent from last LLM decision
  intent: {
    type: string | null;
    target: string | null;
    expires_at_tick: number | null;
  };

  // Cognition scheduling
  next_cognition_tick: number;
  cognition_interval_ticks: number;
  model_tier: ModelTier;

  // Visual
  color: string;                   // hex or koi color code (kohaku, shusui, etc.)
  size_scale: number;              // 0.25 (fry) → 1.0 (adult) → 1.1 (elder)
}

// ───────────────────────────────────────────────────────────────────
//  Broadcast frame — what clients see
// ───────────────────────────────────────────────────────────────────

// Minimal per-fish state for rendering. Delta-compressed where possible.
export interface KoiFrame {
  id: string;
  name?: string;                   // sent only on first appearance / changes
  stage?: Stage;
  x: number;
  y: number;
  z: number;
  h: number;                       // heading (radians)
  s?: number;                      // size_scale
  c?: string;                      // color (sent only when changed)
  m?: { v: number; a: number };   // mood (subset; compact)
}

export interface BroadcastMessage {
  t: "tick";                       // tick type discriminator
  tick: number;
  now: number;                     // server time ms
  fish: KoiFrame[];
  events?: PublicEvent[];          // events worth surfacing this tick
}

export interface SpeechMessage {
  t: "speech";
  fishId: string;
  uttId: string;
  chunk: string;
  done: boolean;
}

export interface SnapshotMessage {
  t: "snapshot";
  tick: number;
  now: number;
  fish: KoiFrame[];
  pondMeta: {
    version: string;
    created_at: number;
    tick_interval_ms: number;
    t_day: number;                 // 0–1 day/night phase
    season: "spring" | "summer" | "autumn" | "winter";
  };
}

export type OutgoingMessage = BroadcastMessage | SpeechMessage | SnapshotMessage;

// ───────────────────────────────────────────────────────────────────
//  Incoming (visitor actions)
// ───────────────────────────────────────────────────────────────────

export interface VisitorActionDropPebble {
  t: "drop_pebble";
  pos: Vec3;
  inscription?: string;            // short, filtered
}

export interface VisitorActionFeed {
  t: "feed";
  pos: Vec3;
}

export interface VisitorActionNickname {
  t: "nickname";
  fishId: string;
  nickname: string;
}

export interface VisitorActionMessage {
  t: "message";
  content: string;                 // filtered, becomes ambient visitor_stimulus
}

export type VisitorAction =
  | VisitorActionDropPebble
  | VisitorActionFeed
  | VisitorActionNickname
  | VisitorActionMessage;

// ───────────────────────────────────────────────────────────────────
//  Events (research + public)
// ───────────────────────────────────────────────────────────────────

// The full event envelope (logged to SQLite + AE, eventually exported
// as the "sharded dataset of artificial life models").
export interface PondEvent {
  ts: number;                      // unix ms
  tick: number;
  pond_id: string;
  actor_id: string;
  event_type: EventType;
  target_ids: string[] | null;
  mechanism: LoveMechanism | null;
  affect_delta: { v: number; a: number; d: number } | null;
  tokens_in: number | null;
  tokens_out: number | null;
  cost_usd: number | null;
  model: string | null;
  payload: Record<string, unknown>;
  schema_v: number;
  config_hash: string;
}

// What we surface to clients (subset of events visitors might care about).
export interface PublicEvent {
  kind: "birth" | "death" | "play" | "speech_intent" | "pebble_placed" | "naming";
  actor_id: string;
  target_ids?: string[];
  at_tick: number;
  payload?: Record<string, unknown>;
}

export type EventType =
  // Life cycle
  | "koi_spawned"
  | "koi_stage_transition"
  | "koi_died"
  | "egg_laid"
  | "egg_fertilized"
  | "egg_hatched"
  // Cognition
  | "cognition_dispatched"
  | "cognition_returned"
  | "cognition_failed"
  | "memory_written"
  | "reflection_daily"
  | "reflection_weekly"
  // Social
  | "witnessing"
  | "apology"
  | "forgiveness"
  | "play_invited"
  | "play_joined"
  | "play_left"
  | "teaching"
  | "gift"
  | "ritual_attended"
  | "greeting"
  | "farewell"
  | "mourning"
  // Speech
  | "speech_uttered"
  | "speech_heard"
  // World
  | "visitor_pebble_placed"
  | "visitor_feed"
  | "visitor_message"
  | "storm_began"
  | "storm_ended"
  | "solstice_shaft"
  | "season_changed"
  // Artifacts
  | "artifact_created"
  | "artifact_given"
  | "artifact_found"
  | "artifact_offered"
  // Meta
  | "pond_booted"
  | "pond_hibernated"
  | "pond_restored"
  | "colony_reseeded";

export type LoveMechanism =
  // Witnessing family
  | "mutual_witnessing"
  | "parallel_presence"
  | "shared_attention"
  | "bearing_witness_to_suffering"
  | "joyful_reunion"
  // Repair family
  | "apology"
  | "forgiveness"
  | "cognitive_repair"
  | "emotional_attunement"
  | "farewell_ritual"
  | "grief_companionship"
  // Play family
  | "play_invitation"
  | "tag"
  | "dance"
  | "synchronized_swim"
  | "shared_curiosity"
  // Teaching family
  | "mentorship"
  | "mentor_mentee_inversion"
  | "imitation_learning"
  | "skill_transfer"
  | "story_propagation"
  | "vocabulary_drift"
  // Gift family
  | "gift"
  | "pass_it_forward"
  | "heirloom"
  | "offering"
  | "shared_food"
  | "memory_gifting"
  // Ritual family
  | "greeting"
  | "farewell"
  | "solstice_attendance"
  | "seasonal_rite"
  | "birth_witnessing"
  | "elder_naming";

// ───────────────────────────────────────────────────────────────────
//  Env bindings (mirrors wrangler.toml)
// ───────────────────────────────────────────────────────────────────

export interface Env {
  POND: DurableObjectNamespace;
  ARCHIVE: R2Bucket;
  AI: Ai;
  EVENTS_AE: AnalyticsEngineDataset;
  OPENROUTER_API_KEY: string;
  AUTH_HMAC_SECRET: string;
  POND_VERSION: string;
  POND_NAME: string;
  TICK_INTERVAL_MS: string;
  INITIAL_KOI_COUNT: string;
  MAX_CONCURRENT_COGNITIONS: string;
  DEFAULT_COGNITION_INTERVAL_MS: string;
}
