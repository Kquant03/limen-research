"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

// ═══════════════════════════════════════════════════════════════════════════
//  Limen Pond — client integration
//  ─────────────────────────────────────────────────────────────────────────
//  WebSocket bridge to the pond Durable Object. Subscribes to state,
//  interpolates snapshots for smooth motion, and exposes a shader-compat
//  API (getOrbitCompatibleFish) that LivingSubstrate consumes exactly where
//  the v8 orbitRaw/applyMeeting block used to live.
//
//  Coordinate bridge: pond is 3D meters, top-down viewed. The shader is
//  2D viewport-normalized (±aspect horizontal, ±0.5 vertical). We map:
//
//      shader_x  ←  pond_x  × SHADER_SCALE
//      shader_y  ←  pond_z  × SHADER_SCALE
//      shader_h  =  pond_h   (angles preserved under uniform scaling)
//
//  pond_y (depth) is unused at v0.1; reserved for future visual treatment
//  (opacity by depth, chromatic shift, shadow projection onto the floor).
//
//  SHADER_SCALE is chosen so a fish at its typical swimming radius
//  (POND.radius × 0.45 ≈ 4.5 m) lands at ~0.27 viewport units — about
//  where the v8 procedural Lissajous placed them — so connected and
//  procedural modes have indistinguishable amplitude.
//
//  Procedural fallback: when the WS isn't connected, returns v8 Lissajous
//  positions verbatim. No visual discontinuity between modes.
// ═══════════════════════════════════════════════════════════════════════════

// ───────────────────────────────────────────────────────────────────
//  Constants
// ───────────────────────────────────────────────────────────────────

export const SHADER_SCALE = 0.060;          // pond meters → shader viewport
const INTERPOLATION_DELAY_MS = 200;          // Valve-style snapshot buffer

// ───────────────────────────────────────────────────────────────────
//  Types (self-contained; no import from pond-types needed)
// ───────────────────────────────────────────────────────────────────

export interface KoiFrame {
  id: string;
  name?: string;
  stage?: string;
  x: number;                                 // pond meters
  y: number;                                 // pond meters (depth)
  z: number;                                 // pond meters
  h: number;                                 // heading radians
  s?: number;
  c?: string;
  m?: { v: number; a: number };
}

export interface PondMeta {
  version: string;
  created_at: number;
  tick_interval_ms: number;
  t_day: number;
  season: "spring" | "summer" | "autumn" | "winter";
}

// Shader-space fish (what LivingSubstrate actually consumes)
export interface ShaderFish {
  id: string;
  x: number;                                 // shader viewport units
  y: number;                                 // shader viewport units
  h: number;                                 // radians
  depth: number;                             // pond_y, for future use
  name?: string;
  color?: string;
}

interface PondState {
  connected: boolean;
  tick: number;
  now: number;
  fish: KoiFrame[];
  fishPrev: KoiFrame[];
  fishPrevTime: number;
  fishCurrTime: number;
  meta: PondMeta | null;
}

// ───────────────────────────────────────────────────────────────────
//  Vanilla store — read imperatively from the render loop
// ───────────────────────────────────────────────────────────────────

type Listener = () => void;

class PondStore {
  private state: PondState = {
    connected: false,
    tick: 0,
    now: 0,
    fish: [],
    fishPrev: [],
    fishPrevTime: 0,
    fishCurrTime: 0,
    meta: null,
  };
  private listeners = new Set<Listener>();

  subscribe = (l: Listener): (() => void) => {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  };

  getSnapshot = (): PondState => this.state;
  peek = (): PondState => this.state;

  applySnapshot(msg: {
    tick: number; now: number; fish: KoiFrame[]; pondMeta?: PondMeta;
  }): void {
    this.state = {
      ...this.state,
      connected: true,
      tick: msg.tick,
      now: msg.now,
      fish: msg.fish,
      fishPrev: msg.fish,
      fishPrevTime: msg.now,
      fishCurrTime: msg.now,
      meta: msg.pondMeta ?? this.state.meta,
    };
    this.notify();
  }

  applyTick(msg: { tick: number; now: number; fish: KoiFrame[] }): void {
    this.state = {
      ...this.state,
      connected: true,
      tick: msg.tick,
      now: msg.now,
      fishPrev: this.state.fish,
      fish: mergeFrames(this.state.fish, msg.fish),
      fishPrevTime: this.state.fishCurrTime,
      fishCurrTime: msg.now,
    };
    this.notify();
  }

  setConnected(connected: boolean): void {
    if (this.state.connected !== connected) {
      this.state = { ...this.state, connected };
      this.notify();
    }
  }

  private notify(): void {
    for (const l of this.listeners) l();
  }
}

function mergeFrames(prev: KoiFrame[], next: KoiFrame[]): KoiFrame[] {
  const byId = new Map<string, KoiFrame>();
  for (const f of prev) byId.set(f.id, f);
  for (const f of next) {
    const old = byId.get(f.id);
    byId.set(f.id, old ? { ...old, ...f } : f);
  }
  return [...byId.values()];
}

// Module-level singleton (survives HMR in dev)
let store: PondStore | null = null;
function getStore(): PondStore {
  if (!store) store = new PondStore();
  return store;
}

// ───────────────────────────────────────────────────────────────────
//  Hook
// ───────────────────────────────────────────────────────────────────

export interface UsePondOptions {
  url: string;
  fallback?: {
    koiCount: number;
    procedural: boolean;
  };
  reconnectBaseMs?: number;
  reconnectMaxMs?: number;
}

export interface UsePondResult {
  connected: boolean;
  fish: KoiFrame[];
  meta: PondMeta | null;
  peek: () => PondState;

  // Primary shader-compat accessor. Called imperatively from the render
  // loop. Returns fish in shader-viewport coordinates. When the pond is
  // disconnected, returns the procedural Lissajous fallback seamlessly.
  getOrbitCompatibleFish: () => {
    primary: ShaderFish;
    secondary: ShaderFish;
  };
}

export function usePond(opts: UsePondOptions): UsePondResult {
  const store = getStore();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<{ attempts: number; timer: ReturnType<typeof setTimeout> | null }>({
    attempts: 0, timer: null,
  });

  const state = useSyncExternalStore(
    store.subscribe,
    () => store.getSnapshot(),
    () => store.getSnapshot()
  );

  useEffect(() => {
    if (!opts.url) return;   // allow dev without WS by leaving env var unset
    let cancelled = false;

    const connect = () => {
      if (cancelled) return;
      try {
        const ws = new WebSocket(opts.url);
        wsRef.current = ws;

        ws.addEventListener("open", () => {
          reconnectRef.current.attempts = 0;
          store.setConnected(true);
        });

        ws.addEventListener("message", (e) => {
          try {
            const msg = JSON.parse(e.data);
            if (msg.t === "snapshot") store.applySnapshot(msg);
            else if (msg.t === "tick") store.applyTick(msg);
          } catch (err) {
            console.warn("pond: bad message", err);
          }
        });

        ws.addEventListener("close", () => {
          store.setConnected(false);
          scheduleReconnect();
        });

        ws.addEventListener("error", () => {
          try { ws.close(); } catch { /* */ }
        });
      } catch {
        scheduleReconnect();
      }
    };

    const scheduleReconnect = () => {
      if (cancelled) return;
      const base = opts.reconnectBaseMs ?? 1000;
      const max  = opts.reconnectMaxMs ?? 30000;
      const attempts = reconnectRef.current.attempts++;
      const delay = Math.min(max, base * Math.pow(1.6, attempts));
      reconnectRef.current.timer = setTimeout(connect, delay);
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectRef.current.timer) clearTimeout(reconnectRef.current.timer);
      try { wsRef.current?.close(); } catch { /* */ }
    };
  }, [opts.url]);

  const peek = (): PondState => store.peek();

  const getOrbitCompatibleFish = (): {
    primary: ShaderFish; secondary: ShaderFish;
  } => {
    const s = store.peek();
    const now = Date.now();

    if (s.connected && s.fish.length >= 2) {
      // Two fish exist; interpolate between fishPrev and fish at render-time.
      const a = s.fish[0];
      const b = s.fish[1];
      const aPrev = s.fishPrev.find(f => f.id === a.id) ?? a;
      const bPrev = s.fishPrev.find(f => f.id === b.id) ?? b;
      const alpha = computeAlpha(s.fishPrevTime, s.fishCurrTime, now);
      return {
        primary:   toShader(interpolateFrame(aPrev, a, alpha)),
        secondary: toShader(interpolateFrame(bPrev, b, alpha)),
      };
    }

    // Fallback — procedural Lissajous identical to v8. Keeps the pond
    // beautiful before WS connects, during dev without backend, and if
    // the network drops mid-session.
    if (opts.fallback?.procedural ?? true) {
      return proceduralShaderFish((now / 1000) % 1e9);
    }

    // No fallback requested — last known, or zeroed.
    const empty: ShaderFish = { id: "empty-a", x: 0, y: 0, h: 0, depth: 0 };
    return {
      primary:   s.fish[0] ? toShader(s.fish[0]) : empty,
      secondary: s.fish[1] ? toShader(s.fish[1]) : { ...empty, id: "empty-b" },
    };
  };

  return {
    connected: state.connected,
    fish: state.fish,
    meta: state.meta,
    peek,
    getOrbitCompatibleFish,
  };
}

// ───────────────────────────────────────────────────────────────────
//  Coordinate bridge: pond → shader
// ───────────────────────────────────────────────────────────────────

function toShader(f: KoiFrame): ShaderFish {
  // Top-down: pond (x, z) → shader (x, y). Depth (pond_y) kept for future use.
  return {
    id: f.id,
    x: f.x * SHADER_SCALE,
    y: f.z * SHADER_SCALE,
    h: f.h,
    depth: f.y,
    name: f.name,
    color: f.c,
  };
}

// ───────────────────────────────────────────────────────────────────
//  Snapshot interpolation (Valve-style)
// ───────────────────────────────────────────────────────────────────

function computeAlpha(prevTime: number, currTime: number, nowMs: number): number {
  const renderTime = nowMs - INTERPOLATION_DELAY_MS;
  if (currTime <= prevTime) return 1;
  const alpha = (renderTime - prevTime) / (currTime - prevTime);
  return Math.max(0, Math.min(1, alpha));
}

function interpolateFrame(a: KoiFrame, b: KoiFrame, t: number): KoiFrame {
  return {
    ...b,
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    z: a.z + (b.z - a.z) * t,
    h: lerpAngle(a.h, b.h, t),
  };
}

function lerpAngle(a: number, b: number, t: number): number {
  let diff = b - a;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  return a + diff * t;
}

// ───────────────────────────────────────────────────────────────────
//  Procedural fallback — v8 Lissajous in shader-space directly
// ───────────────────────────────────────────────────────────────────

const T_A = 89.0;
const T_B = 144.0;
const OMEGA_A = (2 * Math.PI) / T_A;
const OMEGA_B = (2 * Math.PI) / T_B;
const R_BASE_X = 0.34;
const R_BASE_Y = 0.22;

function proceduralShaderFish(t: number): {
  primary: ShaderFish; secondary: ShaderFish;
} {
  const baryX = 0.05 * Math.sin(t * 0.012) + 0.03 * Math.sin(t * 0.007);
  const baryY = -0.03 + 0.04 * Math.cos(t * 0.009);
  const amp = 1.0 + 0.18 * Math.sin(t * 0.013);
  const rx = R_BASE_X * amp;
  const ry = R_BASE_Y * amp;

  const aX = baryX + rx * Math.cos(OMEGA_A * t);
  const aY = baryY + ry * Math.sin(OMEGA_B * t);
  const bX = baryX - rx * Math.cos(OMEGA_A * t + 0.31);
  const bY = baryY - ry * Math.sin(OMEGA_B * t + 0.27);

  // Headings from finite difference
  const dt = 0.1;
  const aXn = baryX + rx * Math.cos(OMEGA_A * (t + dt));
  const aYn = baryY + ry * Math.sin(OMEGA_B * (t + dt));
  const bXn = baryX - rx * Math.cos(OMEGA_A * (t + dt) + 0.31);
  const bYn = baryY - ry * Math.sin(OMEGA_B * (t + dt) + 0.27);
  const hA = Math.atan2(aYn - aY, aXn - aX);
  const hB = Math.atan2(bYn - bY, bXn - bX);

  return {
    primary:   { id: "proc-a", x: aX, y: aY, h: hA, depth: -1.2, color: "kohaku" },
    secondary: { id: "proc-b", x: bX, y: bY, h: hB, depth: -1.2, color: "shusui" },
  };
}
