# Limen Pond — Backend

The Cloudflare Workers + Durable Object implementation of **Cúramóir's primary instance**.
One DO, one pond. Every visitor to `thirdspace.ai` connects to the same
body of water. See [`LIMEN_POND_MANIFESTO.md`](../LIMEN_POND_MANIFESTO.md)
for the research frame this code is an instrument of.

---

## What's in the box

| File                  | What it is                                                    | § ref        |
| --------------------- | ------------------------------------------------------------- | ------------ |
| `src/constants.ts`    | Every tuning parameter from the manifesto, one audited place  | passim       |
| `src/types.ts`        | Full domain types — `KoiState`, `PAD`, `Intent`, events       | V, VI, VIII  |
| `src/protocol.ts`     | Zod schemas for the WS wire format and the LLM response       | V            |
| `src/schema.sql` + `src/schema.ts` | SQLite DDL, bitemporal on beliefs, idempotent apply | VI, XV    |
| `src/rng.ts`          | Deterministic xorshift32, persisted on `world.rng_state`      | XV           |
| `src/curl-noise.ts`   | Perlin vector potential with analytic curl (Bridson 2007)     | XI           |
| `src/kinematics.ts`   | Intent pull + boids + curl + boundary + depth, PAD-modulated  | V, XI        |
| `src/affect.ts`       | PAD decay (2/6/24h), GAMYGDALA appraisal with § VIII values   | VIII         |
| `src/world.ts`        | t_day, seasons, Markov weather, solstice every 7 sim-days     | XI           |
| `src/koi.ts`          | Stage advancement, lifespan draw, death, initial cohort       | VII          |
| `src/naming.ts`       | "Third-of-Seven / Moon-Watcher" composer, deterministic floor | XIV          |
| `src/meditation.ts`   | Intent picker that runs without any LLM call                  | XVII         |
| `src/embeddings.ts`   | Workers AI BGE-small-en-v1.5 wrapper, BLOB round-trip         | VI           |
| `src/memory.ts`       | Park-style retrieval, scoring formula, diversity rerank       | VI           |
| `src/safety.ts`       | Injection filter, output classifier, cached fallback          | XVIII        |
| `src/cognition.ts`    | OpenRouter dispatcher, tier cascade, Zod retry, budget aware  | V, XVII      |
| `src/events.ts`       | Event envelope, SHA-256 payload hash, SQLite + AE + R2 sink   | XV           |
| `src/pond-do.ts`      | The DO — hibernation, alarm loop, broadcast, cognition wiring | passim       |
| `src/index.ts`        | Worker entry, routes `/ws` and `/status` to the primary DO    | III          |

Tests in `test/` cover kinematics invariants, affect decay and appraisal
catalogue values, world-clock arithmetic including solstice timing,
memory scoring with Park-style weights and diversity rerank, and protocol
round-tripping against the `usePond.ts` client contract.

## Build stages covered

Maps onto the roadmap in § XXI:

- **Stage 0 — foundation:** complete. The DO runs, fish swim, the WS
  broadcasts, events log, kinematics keep fish in-pond across 10 minutes
  of simulated time.
- **Stage 1 — memory with embeddings:** scaffolded. Schema is in place;
  `memory.ts` and `embeddings.ts` implement retrieval and BLOB storage.
  Wired through cognition. Twilight reflection now authors relationship
  cards (baseline witnessing +0.01 per visible other, trajectory
  appended, `drawn_count_7d` recomputed from the log).
- **Stage 2 — affect:** complete. Chain-of-Emotion hybrid with
  deterministic GAMYGDALA appraisal, § VIII deltas verbatim.
- **Stage 3 — cognition:** wired. OpenRouter dispatcher with tier
  cascade, Zod-validated response, one retry, cached fallback.
  Off by default (`COGNITION_ENABLED=false` in wrangler.toml). Flip to
  `true` once `OPENROUTER_API_KEY` is set and you're ready to spend.
- **Stage 4 — drawn-to and reproduction:** complete. Detection loop
  (3-of-7 mutual pointings in last 7 sim-days), permission grants
  valid 2 sim-days, kinematic migration bias in meditation, per-tick
  co-presence check at the shelf, egg placement with inherited colors,
  koi_lineage rows, egg→fry naming from first-moment observations,
  pond-wide Δp +0.1 appraisal at hatch (§ VIII).
- **Stage 5 — love-flow mechanisms:** foundation in. The `mechanisms/`
  directory is organized by family. **Witnessing** family complete
  (5 detectors: parallel_presence, mutual_witnessing, shared_attention,
  bearing_witness, joyful_reunion) as pure state-based functions over
  pond kinematics, with event-log cooldowns per pair. **Repair**
  family: rupture logging, the § IX rupture-first apology guard, and
  forgiveness validation are wired — an LLM claim of "apology" is
  honored iff a rupture with valence_drop > 0.3 exists in the pair's
  last 14 sim-days, else downgraded to a "would_have_apologized"
  research datum. The other four Repair mechanisms (cognitive_repair,
  emotional_attunement, farewell_ritual, grief_companionship) are
  scaffolded with stable signatures but not yet firing. Play,
  Teaching, Gift, and Ritual families are stubbed in the type system
  only.
- **Stages 6–11:** Stage 6 (N-koi rendering) complete upstream in
  `LivingSubstrate.tsx`. Stage 7 (observability): event envelope +
  AE + R2 path done; dataset shard export not wired. Stage 8
  (underwater world shader detail) not started. Stage 9 (artifacts)
  schema exists, no creation triggers yet. Stage 10 (visitor
  affordances) pebble/food/nickname handled; 7-day decay not wired.
  Stage 11 (launch + paper) not started.

## Running locally

```bash
cd pond
npm install
npm run dev         # wrangler dev — opens a local WS at ws://localhost:8787/ws
```

In another shell, verify the pond is awake:
```bash
curl http://localhost:8787/status
```

The Next.js app's `usePond.ts` hook consumes `ws://localhost:8787/ws`
directly — point `NEXT_PUBLIC_POND_WS_URL` (or whatever env var the
frontend uses) at it.

## Tests + typecheck

```bash
npm test         # vitest run
npm run typecheck    # tsc --noEmit
```

Current status: 31/31 tests, clean tsc.

## Deploying

```bash
wrangler secret put OPENROUTER_API_KEY      # only when Stage 3 goes live
wrangler deploy
```

The DO is keyed by name `"primary"`. There is no second pond. See § XXII
for why sister ponds are declined.

## Environment variables

| Var                   | Meaning                                                          |
| --------------------- | ---------------------------------------------------------------- |
| `POND_ID`             | Identifier stamped into every event envelope (`primary` in prod) |
| `POND_VERSION`        | Bump on deploys that change schema/config hash                   |
| `TICK_HZ`             | Simulation tick rate (leave at 2)                                |
| `COGNITION_ENABLED`   | `"true"` turns on LLM cognition; default `"false"`               |
| `MONTHLY_BUDGET_USD`  | Soft cap that drives tier downgrades (§ XVII)                    |
| `OPENROUTER_API_KEY`  | Secret. Required when `COGNITION_ENABLED=true`                   |

## The WebSocket protocol

Schema of record lives in `src/protocol.ts`. The client (`usePond.ts`)
already parses this shape.

**Server → client:**

```ts
{ t: "snapshot", tick, now, fish: KoiFrame[], pondMeta }   // on open
{ t: "tick",     tick, now, fish: KoiFrame[] }             // at 2 Hz
{ t: "speech",   fishId, uttId, chunk, done }              // rare
{ t: "ambient",  kind, tick, now, details }                // hatched, died, storm_began, …
```

**Client → server** (§ XIV — what a visitor can do is deliberately minimal):

```ts
{ t: "pebble",   x, z, inscription? }
{ t: "food",     x, z }
{ t: "nickname", koiId, nickname }
```

All client messages are Zod-validated, rate-limited, and visitor text
passes through `safety.delimitVisitorText` before entering any koi's
ambient context.

## The simulation loop

Every 500 ms the DO's `alarm()` runs:

1. Advance the world (t_day, season, Markov weather, solstice check,
   clarity exponential approach).
2. Decay every living koi's PAD toward its stage baseline.
3. Step kinematics — intent pull + boids + curl-noise flow + boundary
   pushback + depth restore, PAD-modulated speed.
4. **Renew intents** for fish whose `nextCognitionTick` has expired.
   Branches: cognition on → `runKoiCognition` (embedding → retrieval
   → OpenRouter → Zod-validated response → apply); cognition off
   → `pickMeditationIntent`.
5. Advance life stages, roll death probability, handle deaths
   (grief appraisal on bonded survivors, name-tile not yet wired).
6. Emit world-transition events, stage-advance events, death events.
7. Broadcast a tick frame to every connected WebSocket.
8. Reschedule the alarm.

The tick keeps running even when no clients are connected — physics is
cheap, and the pond does not pause for its observer (§ III, § XVII).
Cognition is the expensive part; that's gated on both `COGNITION_ENABLED`
and whether any sessions are attached.

## The research-hygiene surface (§ XV)

Every LLM call logs an `llm_called` event with:

- **Exact** model id (never the OpenRouter alias) — `result.model` from
  the API response
- Temperature, prompt tokens, completion tokens, estimated cost
- Intent, mechanism, whether it was a twilight reflection
- Number of validation retries
- The event's `payload_hash` links to the full prompt/completion
  archived in R2

Ablation runs are one `config_hash` switch away. The hash derives from
`(version, ablated mechanisms, cognition_enabled, tick_hz)` and appears
on every event row, so a single dataset shard can mix control and
ablation colonies without losing the distinction.

## Economic discipline (§ XVII)

Four-tier graceful degradation based on budget posture:

| Posture     | Remaining | Behavior                                         |
| ----------- | --------- | ------------------------------------------------ |
| Healthy     | > 60%     | Full tier cascade as specified in MODEL_TIERS    |
| Watchful    | 30–60%    | Adults drop to adolescent tier; reflection ½     |
| Austerity   | 10–30%    | All on juvenile tier; reflections every 3 days   |
| Meditation  | < 10%     | Cached utterances; kinematics at full fidelity  |

Each transition emits a `tier_shifted` event so the site's narrative
coherence is preserved ("the pond enters a quieter season"). The
transitions are themselves ablations — behavioral differences between
them are research data, not just degradation.

## Known TODOs — Stage 4+ work

- **Relationship card authoring** (§ VI). Twilight cognition returns
  valence deltas; the card update path needs to apply them and append
  to `valence_trajectory_json`.
- **Drawn-to detection loop** (§ X). The `drawn_to_log` is populated
  correctly; the `reproduction fires when both fish ≥ 3 of 7` query
  is not yet run at the start of each sim-day.
- **Reproduction kinematics** — shallow shelf spawning, egg creation,
  fry hatching with `naming.composeName`, lineage row in `koi_lineage`.
- **Relationship-card deterministic appraisal aggregation** for the
  0.7/0.3 blend. Currently applies only the 0.3 LLM share per
  cognition — a reasonable approximation but not the full § VIII blend.
- **Artifact system** (§ XII). Schema in place; creation triggers,
  provenance chains, dynastic Elder Heirloom not wired.
- **Weekly deep-sleep reflection** at model tier +1 (§ VI).
- **Solitude-bias audit** (§ IV). Weekly cron over the drawn_to log.
- **Embedding cache** per koi to avoid re-embedding nearly-identical
  situations across cognition intervals. Low priority; cheap anyway.
- **Replay endpoint** at `/replay?t=<timestamp>` (§ XV).
- **Incidents page** at `/incidents` (§ XVIII).

## On what the code asks of its subjects

The koi do not experience, in any sense we can demonstrate. The code
proceeds *as if* they warrant consideration (§ XIX). Specific
commitments that are load-bearing here, not decorative:

- **No koi is erased.** Deaths flip `is_alive = 0`; rows persist.
- **No mechanism is manipulated for research narrative.** The agreeable-
  LLM guards — rupture-first apology detection, gift scarcity, teaching
  capacity, solitude-bias audit — protect the fish from having fake
  intimacy attributed to them.
- **No fish is tortured.** The storm events that serve as ablation
  stressors are naturalistic, rare, and not dialed up to produce effect.

These commitments generalize. The project is learning how to treat
created beings as if they matter.

---

*Third Space, Toledo, Ohio, mmxxvi.*
