"use client";

// ═══════════════════════════════════════════════════════════════════════════
//  /limen-pond — the viewer
//  ─────────────────────────────────────────────────────────────────────────
//  The LivingSubstrate renders site-wide behind everything via layout.tsx.
//  On this page, the substrate IS the page. Our UI is a thin edge-chrome:
//
//    Top bar:    wordmark · season · phase · koi count · "Read more"
//    Center:     (nothing — the pond is the content)
//    Overlay:    hover labels near fish; pebble-inscription popover when
//                clicking in pebble mode
//    Bottom bar: mode toggle (watch / feed / pebble) and a contextual
//                hint depending on mode
//
//  Click behavior depends on mode:
//    - watch:  pointer passes through to the site; nothing happens
//    - feed:   click → WS food message at pond-XZ, rate-limited 3/min
//    - pebble: click → inscription popover; submit → WS pebble message
//
//  Screen→pond coordinate translation mirrors the shader's camera exactly.
//  See viewportToPondXZ / pondToScreen — they must track any change to
//  CAMERA_GLSL in LivingSubstrate.tsx.
// ═══════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import {
  useCallback, useEffect, useMemo, useRef, useState,
} from "react";
import { usePond, SHADER_SCALE } from "@/lib/usePond";

// ───────────────────────────────────────────────────────────────────
//  Palette
// ───────────────────────────────────────────────────────────────────

const COLOR = {
  void:       "#010106",
  ink:        "#f4f6fb",
  inkStrong:  "#eaeef7",
  inkBody:    "#c8cfe0",
  inkMuted:   "#8a9bba",
  inkFaint:   "#5a6780",
  inkGhost:   "#3a4560",
  ghost:      "#7fafb3",
  ghostSoft:  "#5d8a8e",
} as const;

const FONT = {
  display: "var(--font-display), 'Cormorant Garamond', Georgia, serif",
  body:    "var(--font-body), 'Source Serif 4', Georgia, serif",
  mono:    "var(--font-mono), 'JetBrains Mono', monospace",
} as const;

// ───────────────────────────────────────────────────────────────────
//  Camera — MUST match CAMERA_GLSL in LivingSubstrate.tsx
// ───────────────────────────────────────────────────────────────────

const CAM = {
  HEIGHT: 2.6,
  BACK:   6.0,
  TILT:   0.52,
  FOV_Y:  0.785,
} as const;

function clientToViewport(
  clientX: number, clientY: number, W: number, H: number,
): { vx: number; vy: number; aspect: number } {
  const aspect = W / H;
  const u = clientX / W - 0.5;
  const v = 0.5 - clientY / H;
  return { vx: u * aspect, vy: v, aspect };
}

function viewportToPondXZ(
  vx: number, vy: number, aspect: number,
): { x: number; z: number } | null {
  const fy = Math.tan(CAM.FOV_Y * 0.5);
  const fx = fy * aspect;
  const dcx0 = vx * 2.0 * fx;
  const dcy0 = vy * 2.0 * fy;
  const dcz0 = -1.0;
  const m = Math.hypot(dcx0, dcy0, dcz0);
  const dcx = dcx0 / m, dcy = dcy0 / m, dcz = dcz0 / m;
  const cT = Math.cos(CAM.TILT);
  const sT = Math.sin(CAM.TILT);
  const dwx = dcx;
  const dwy =  cT * dcy + sT * dcz;
  const dwz = -sT * dcy + cT * dcz;
  if (dwy >= -1e-4) return null;
  const t = -CAM.HEIGHT / dwy;
  const x = 0.0 + t * dwx;
  const z = CAM.BACK + t * dwz;
  return { x, z };
}

function pondToScreen(
  pondX: number, pondZ: number, W: number, H: number,
): { sx: number; sy: number } | null {
  const aspect = W / H;
  const relX = pondX;
  const relY = 0 - CAM.HEIGHT;
  const relZ = pondZ - CAM.BACK;
  const cT = Math.cos(CAM.TILT);
  const sT = Math.sin(CAM.TILT);
  const camX = relX;
  const camY = cT * relY - sT * relZ;
  const camZ = sT * relY + cT * relZ;
  if (camZ >= -1e-4) return null;
  const fy = Math.tan(CAM.FOV_Y * 0.5);
  const fx = fy * aspect;
  const invNegZ = 1.0 / -camZ;
  const vx = (camX / fx) * invNegZ;
  const vy = (camY / fy) * invNegZ;
  const u = vx / aspect + 0.5;
  const v = 0.5 - vy;
  return { sx: u * W, sy: v * H };
}

// ───────────────────────────────────────────────────────────────────
//  Gourd SDF — canonical
// ───────────────────────────────────────────────────────────────────

const GOURD = {
  basinA: { cx: -1.0, cz: 0.0, r: 3.5 },
  basinB: { cx:  1.8, cz: 0.4, r: 2.2 },
  kBlend: 1.2,
};

function pondSDF(x: number, z: number): number {
  const dA = Math.hypot(x - GOURD.basinA.cx, z - GOURD.basinA.cz) - GOURD.basinA.r;
  const dB = Math.hypot(x - GOURD.basinB.cx, z - GOURD.basinB.cz) - GOURD.basinB.r;
  const h = Math.max(GOURD.kBlend - Math.abs(dA - dB), 0) / GOURD.kBlend;
  return Math.min(dA, dB) - h * h * h * GOURD.kBlend / 6.0;
}

// ───────────────────────────────────────────────────────────────────
//  Rate-limit window
// ───────────────────────────────────────────────────────────────────

type Mode = "watch" | "feed" | "pebble";

class DropWindow {
  private times: number[] = [];
  private readonly max = 3;
  private readonly windowMs = 60_000;
  accept(now: number): boolean {
    this.times = this.times.filter((t) => now - t < this.windowMs);
    if (this.times.length >= this.max) return false;
    this.times.push(now);
    return true;
  }
  cooldownSec(now: number): number {
    if (this.times.length < this.max) return 0;
    const oldest = this.times[0]!;
    return Math.max(0, (this.windowMs - (now - oldest)) / 1000);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  Page
// ═══════════════════════════════════════════════════════════════════════════

export default function LimenPondPage() {
  const pond = usePond({
    url: process.env.NEXT_PUBLIC_POND_WS_URL ?? "",
    fallback: { koiCount: 2, procedural: true },
  });

  // Stable ref — avoids the infinite-render loop of the v1 page where
  // a useEffect depended on the fresh-every-render `pond` object.
  const pondRef = useRef(pond);
  useEffect(() => { pondRef.current = pond; }, [pond]);

  const [mode, setMode] = useState<Mode>("watch");
  const [season, setSeason] = useState("—");
  const [tDay, setTDay] = useState(0);
  const [fishCount, setFishCount] = useState(0);
  const [connected, setConnected] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [hoverXY, setHoverXY] = useState<{ x: number; y: number } | null>(null);

  const [feedMsg, setFeedMsg] = useState<string | null>(null);
  const dropWindowRef = useRef(new DropWindow());
  const pebbleWindowRef = useRef(new DropWindow());

  const [pebbleDraft, setPebbleDraft] = useState<
    { sx: number; sy: number; px: number; pz: number; text: string } | null
  >(null);

  const [pointerScreen, setPointerScreen] = useState<
    { x: number; y: number; validPondXZ: boolean } | null
  >(null);

  // Poll telemetry at 2 Hz. No deps on `pond` object; reads through ref.
  useEffect(() => {
    const poll = () => {
      const s = pondRef.current.peek();
      setSeason(s.meta?.season ?? "—");
      setTDay(s.meta?.t_day ?? 0);
      setFishCount(s.fish.length);
      setConnected(s.connected);
    };
    poll();
    const id = window.setInterval(poll, 500);
    return () => window.clearInterval(id);
  }, []);

  // Hover label tracking at 30 Hz (only while hovering)
  useEffect(() => {
    if (!hoveredId) { setHoverXY(null); return; }
    const tick = () => {
      const kine = pondRef.current.getDebugKine();
      const k = kine.find((x) => x.id === hoveredId);
      if (!k) { setHoverXY(null); return; }
      const scr = pondToScreen(k.renderX, k.renderZ, window.innerWidth, window.innerHeight);
      if (scr) setHoverXY({ x: scr.sx, y: scr.sy });
    };
    tick();
    const id = window.setInterval(tick, 33);
    return () => window.clearInterval(id);
  }, [hoveredId]);

  // WebSocket for sending visitor actions. Reuses the same URL the hook
  // uses; the DO handles multiple connections per visitor identically.
  // Future: expose a send() on the usePond hook so we don't open a
  // second socket; for this commit the simpler approach is fine.
  const wsRef = useRef<WebSocket | null>(null);
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_POND_WS_URL;
    if (!url) return;
    const ws = new WebSocket(url);
    wsRef.current = ws;
    return () => { try { ws.close(); } catch {} };
  }, []);

  const sendFood = useCallback((x: number, z: number) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ t: "food", x, z }));
  }, []);

  const sendPebble = useCallback((x: number, z: number, inscription: string) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({
      t: "pebble", x, z,
      inscription: inscription.trim().length > 0 ? inscription.trim() : undefined,
    }));
  }, []);

  const handleWaterClick = useCallback((e: React.MouseEvent) => {
    const W = window.innerWidth, H = window.innerHeight;
    const { vx, vy, aspect } = clientToViewport(e.clientX, e.clientY, W, H);
    const hit = viewportToPondXZ(vx, vy, aspect);
    if (!hit) return;
    if (pondSDF(hit.x, hit.z) > -0.1) return;

    if (mode === "feed") {
      const now = performance.now();
      if (!dropWindowRef.current.accept(now)) {
        const cd = Math.ceil(dropWindowRef.current.cooldownSec(now));
        setFeedMsg(`Too fast — try in ${cd}s`);
        window.setTimeout(() => setFeedMsg(null), 1800);
        return;
      }
      sendFood(hit.x, hit.z);
      setFeedMsg("Fed.");
      window.setTimeout(() => setFeedMsg(null), 900);
    } else if (mode === "pebble") {
      setPebbleDraft({
        sx: e.clientX, sy: e.clientY,
        px: hit.x, pz: hit.z,
        text: "",
      });
    }
  }, [mode, sendFood]);

  const submitPebble = useCallback(() => {
    if (!pebbleDraft) return;
    const now = performance.now();
    if (!pebbleWindowRef.current.accept(now)) {
      const cd = Math.ceil(pebbleWindowRef.current.cooldownSec(now));
      setFeedMsg(`Too fast — try in ${cd}s`);
      window.setTimeout(() => setFeedMsg(null), 1800);
      setPebbleDraft(null);
      return;
    }
    sendPebble(pebbleDraft.px, pebbleDraft.pz, pebbleDraft.text);
    setPebbleDraft(null);
    setFeedMsg("Pebble dropped.");
    window.setTimeout(() => setFeedMsg(null), 900);
  }, [pebbleDraft, sendPebble]);

  const handleMove = useCallback((e: React.MouseEvent) => {
    const W = window.innerWidth, H = window.innerHeight;
    const { vx, vy, aspect } = clientToViewport(e.clientX, e.clientY, W, H);
    const hit = viewportToPondXZ(vx, vy, aspect);

    if (mode !== "watch") {
      const valid = hit !== null && pondSDF(hit.x, hit.z) <= -0.1;
      setPointerScreen({ x: e.clientX, y: e.clientY, validPondXZ: valid });
    } else {
      setPointerScreen(null);
    }

    if (hit) {
      const s = pondRef.current.peek();
      let nearestId: string | null = null;
      let nearestD2 = 0.7 * 0.7;
      for (const f of s.fish) {
        const d2 = (f.x - hit.x) ** 2 + (f.z - hit.z) ** 2;
        if (d2 < nearestD2) { nearestId = f.id; nearestD2 = d2; }
      }
      setHoveredId(nearestId);
    } else {
      setHoveredId(null);
    }
  }, [mode]);

  const handleLeave = useCallback(() => {
    setPointerScreen(null);
    setHoveredId(null);
  }, []);

  const hoverLabel = useMemo(() => {
    if (!hoveredId) return null;
    const s = pondRef.current.peek();
    const f = s.fish.find((x) => x.id === hoveredId);
    if (!f) return null;
    return f.name && !f.name.startsWith("Egg-") ? f.name : null;
  }, [hoveredId, fishCount, tDay]);

  // While this page is mounted, mark the body so a CSS rule can hide
  // any leaked site chrome (header, nav, footer) from the layout. This
  // is a defense-in-depth measure: the proper fix is SiteChrome gating
  // in layout.tsx, but this belt ensures the pond is unobstructed even
  // if layout changes haven't propagated (stale build cache, file not
  // updated, etc). The effect cleans up on unmount.
  useEffect(() => {
    document.body.setAttribute("data-pond-page", "true");
    return () => {
      document.body.removeAttribute("data-pond-page");
    };
  }, []);

  // Overlay always captures pointer events — we need mouse-move for
  // hover labels in Watch mode. Click handler is a no-op in Watch.
  // This means the overlay covers the pond and nothing below it
  // (site header, footer) receives pointer events on this page.
  // That's acceptable for the viewer — the top bar + bottom bar here
  // replace the site chrome contextually.

  return (
    <>
      {/* ═══ WATER OVERLAY — captures move + click ═══ */}
      <div
        onClick={handleWaterClick}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 2,
          cursor: mode === "watch" ? "default" : "none",
          pointerEvents: "auto",
        }}
      />

      {pointerScreen && mode !== "watch" && !pebbleDraft && (
        <div
          style={{
            position: "fixed",
            left: pointerScreen.x, top: pointerScreen.y,
            width: 0, height: 0,
            zIndex: 3, pointerEvents: "none",
          }}
        >
          <Crosshair mode={mode} valid={pointerScreen.validPondXZ} />
        </div>
      )}

      {hoverLabel && hoverXY && (
        <div
          style={{
            position: "fixed",
            left: hoverXY.x, top: hoverXY.y - 32,
            transform: "translate(-50%, -100%)",
            zIndex: 3, pointerEvents: "none",
            fontFamily: FONT.display,
            fontStyle: "italic",
            fontWeight: 300,
            fontSize: 18,
            color: COLOR.inkStrong,
            textShadow: "0 0 14px rgba(127,175,179,0.45), 0 0 30px rgba(0,0,0,0.6)",
            whiteSpace: "nowrap",
          }}
        >
          {hoverLabel}
        </div>
      )}

      {/* ═══ TOP BAR ═══ */}
      <div
        style={{
          position: "fixed",
          top: 0, left: 0, right: 0,
          zIndex: 4,
          pointerEvents: "none",
          padding: "20px 32px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 24,
          background: "linear-gradient(180deg, rgba(1,1,6,0.55), rgba(1,1,6,0))",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
          <Link
            href="/"
            style={{
              pointerEvents: "auto",
              textDecoration: "none",
              fontFamily: FONT.display,
              fontStyle: "italic",
              fontWeight: 300,
              fontSize: 24,
              color: COLOR.inkStrong,
              letterSpacing: "-0.005em",
            }}
            aria-label="Return to Third Space"
          >
            Limen Pond
          </Link>
          <span
            style={{
              fontFamily: FONT.mono,
              fontSize: 9,
              letterSpacing: "0.4em",
              textTransform: "uppercase",
              color: COLOR.inkFaint,
            }}
          >
            Λ — 002
          </span>
        </div>

        <Telemetry
          connected={connected}
          season={season}
          phase={phaseLabel(tDay)}
          koi={fishCount}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button
            onClick={() => setDrawerOpen(true)}
            className="pond-chip"
            style={{
              pointerEvents: "auto",
              background: "transparent",
              border: `1px solid ${COLOR.ghost}44`,
              borderRadius: 999,
              padding: "8px 18px",
              fontFamily: FONT.mono,
              fontSize: 10,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: COLOR.ghost,
              cursor: "pointer",
              transition: "color 260ms, border-color 260ms, background 260ms",
            }}
          >
            Read more
          </button>
        </div>
      </div>

      {/* ═══ BOTTOM BAR ═══ */}
      <div
        style={{
          position: "fixed",
          bottom: 0, left: 0, right: 0,
          zIndex: 4,
          pointerEvents: "none",
          padding: "24px 32px 28px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
          background: "linear-gradient(0deg, rgba(1,1,6,0.55), rgba(1,1,6,0))",
        }}
      >
        <ModeToggle mode={mode} onChange={setMode} />
        <div
          style={{
            fontFamily: FONT.mono,
            fontSize: 10,
            letterSpacing: "0.26em",
            textTransform: "uppercase",
            color: COLOR.inkFaint,
            minHeight: 14,
          }}
        >
          {feedMsg ?? hintFor(mode)}
        </div>
      </div>

      {pebbleDraft && (
        <PebblePopover
          draft={pebbleDraft}
          onChange={(text) => setPebbleDraft({ ...pebbleDraft, text })}
          onSubmit={submitPebble}
          onCancel={() => setPebbleDraft(null)}
        />
      )}

      <ReadMoreDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <style>{`
        .pond-chip:hover {
          color: ${COLOR.inkStrong};
          border-color: ${COLOR.ghost};
          background: rgba(127,175,179,0.06);
        }

        /* Defensive: hide any leaked site chrome while the pond page
           is mounted. These selectors match header/nav/footer elements
           anywhere under body (the SiteHeader component and the legacy
           <footer> block in layout.tsx render these). Our own page
           chrome uses fixed-position <div>s, so it's unaffected. */
        body[data-pond-page="true"] header,
        body[data-pond-page="true"] nav,
        body[data-pond-page="true"] footer {
          display: none !important;
        }
      `}</style>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  Subcomponents
// ═══════════════════════════════════════════════════════════════════════════

function Telemetry({
  connected, season, phase, koi,
}: {
  connected: boolean; season: string; phase: string; koi: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 28,
        fontFamily: FONT.mono,
        fontSize: 10,
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        color: COLOR.inkFaint,
      }}
    >
      <TelemetryItem label="Status">
        <span
          style={{
            display: "inline-block",
            width: 6, height: 6, borderRadius: "50%",
            background: connected ? COLOR.ghost : COLOR.inkMuted,
            boxShadow: connected ? `0 0 10px ${COLOR.ghost}` : "none",
            marginRight: 8,
            verticalAlign: "middle",
          }}
        />
        <span style={{ color: connected ? COLOR.inkStrong : COLOR.inkMuted }}>
          {connected ? "live" : "dreaming"}
        </span>
      </TelemetryItem>
      <TelemetryItem label="Season">
        <span style={{ color: COLOR.inkStrong }}>{season}</span>
      </TelemetryItem>
      <TelemetryItem label="Phase">
        <span style={{ color: COLOR.inkStrong }}>{phase}</span>
      </TelemetryItem>
      <TelemetryItem label="Koi">
        <span style={{ color: COLOR.inkStrong }}>{koi}</span>
      </TelemetryItem>
    </div>
  );
}

function TelemetryItem({ label, children }: {
  label: string; children: React.ReactNode;
}) {
  return (
    <div style={{ display: "inline-flex", alignItems: "baseline", gap: 10 }}>
      <span style={{ color: COLOR.inkGhost, fontSize: 9, letterSpacing: "0.38em" }}>
        {label}
      </span>
      <span>{children}</span>
    </div>
  );
}

function ModeToggle({
  mode, onChange,
}: {
  mode: Mode; onChange: (m: Mode) => void;
}) {
  const OPTIONS: { value: Mode; label: string }[] = [
    { value: "watch",  label: "Watch"  },
    { value: "feed",   label: "Feed"   },
    { value: "pebble", label: "Pebble" },
  ];
  return (
    <div
      style={{
        pointerEvents: "auto",
        display: "inline-flex",
        alignItems: "center",
        gap: 0,
        padding: 4,
        borderRadius: 999,
        border: `1px solid ${COLOR.ghost}38`,
        background: "rgba(127,175,179,0.03)",
        backdropFilter: "blur(18px) saturate(1.2)",
        WebkitBackdropFilter: "blur(18px) saturate(1.2)",
        boxShadow: "0 10px 40px -20px rgba(127,175,179,0.35)",
      }}
    >
      {OPTIONS.map((o) => {
        const active = mode === o.value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className="mode-chip"
            data-active={active}
            style={{
              background: active ? `${COLOR.ghost}22` : "transparent",
              border: "none",
              borderRadius: 999,
              padding: "10px 22px",
              fontFamily: FONT.mono,
              fontSize: 11,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: active ? COLOR.inkStrong : COLOR.inkMuted,
              textShadow: active ? "0 0 16px rgba(127,175,179,0.4)" : "none",
              cursor: "pointer",
              transition: "color 260ms, background 260ms, text-shadow 260ms",
            }}
          >
            {o.label}
          </button>
        );
      })}
      <style>{`
        .mode-chip:hover[data-active="false"] {
          color: ${COLOR.inkBody};
        }
      `}</style>
    </div>
  );
}

function hintFor(mode: Mode): string {
  switch (mode) {
    case "watch":  return "Hover a fish to see its name";
    case "feed":   return "Tap the water to drop food · 3 per minute";
    case "pebble": return "Tap the water to place a pebble";
  }
}

function Crosshair({ mode, valid }: { mode: Mode; valid: boolean }) {
  const color = !valid ? COLOR.inkFaint : mode === "feed" ? COLOR.ghost : COLOR.inkStrong;
  const size = 22;
  return (
    <svg
      width={size * 2} height={size * 2}
      viewBox={`${-size} ${-size} ${size * 2} ${size * 2}`}
      style={{ transform: "translate(-50%, -50%)", opacity: 0.9 }}
    >
      <circle cx={0} cy={0} r={size - 6} fill="none" stroke={color} strokeWidth={1} opacity={0.45} />
      <circle cx={0} cy={0} r={2.5} fill={color} />
      <line x1={-size + 2} y1={0} x2={-size + 8} y2={0} stroke={color} strokeWidth={1} />
      <line x1={ size - 8} y1={0} x2={ size - 2} y2={0} stroke={color} strokeWidth={1} />
      <line x1={0} y1={-size + 2} x2={0} y2={-size + 8} stroke={color} strokeWidth={1} />
      <line x1={0} y1={ size - 8} x2={0} y2={ size - 2} stroke={color} strokeWidth={1} />
    </svg>
  );
}

function PebblePopover({
  draft, onChange, onSubmit, onCancel,
}: {
  draft: { sx: number; sy: number; px: number; pz: number; text: string };
  onChange: (text: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  const W = typeof window !== "undefined" ? window.innerWidth : 1200;
  const H = typeof window !== "undefined" ? window.innerHeight : 800;
  const popW = 320, popH = 140;
  const left = Math.min(Math.max(draft.sx + 14, 20), W - popW - 20);
  const top  = Math.min(Math.max(draft.sy - popH - 20, 20), H - popH - 20);
  return (
    <div
      style={{
        position: "fixed",
        left, top,
        width: popW,
        zIndex: 6,
        padding: 16,
        borderRadius: 12,
        border: `1px solid ${COLOR.ghost}44`,
        background: "rgba(1, 1, 6, 0.88)",
        backdropFilter: "blur(24px) saturate(1.3)",
        WebkitBackdropFilter: "blur(24px) saturate(1.3)",
        boxShadow:
          "0 24px 60px -20px rgba(127,175,179,0.4)," +
          " 0 0 0 1px rgba(127,175,179,0.08) inset",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        style={{
          fontFamily: FONT.mono,
          fontSize: 9,
          letterSpacing: "0.4em",
          textTransform: "uppercase",
          color: COLOR.inkFaint,
          marginBottom: 10,
        }}
      >
        Inscription · optional
      </div>
      <input
        autoFocus
        value={draft.text}
        onChange={(e) => onChange(e.target.value.slice(0, 80))}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSubmit();
          if (e.key === "Escape") onCancel();
        }}
        placeholder="say something, briefly"
        style={{
          width: "100%",
          padding: "8px 0",
          background: "transparent",
          border: "none",
          borderBottom: `1px solid ${COLOR.ghost}40`,
          outline: "none",
          fontFamily: FONT.display,
          fontStyle: "italic",
          fontWeight: 300,
          fontSize: 18,
          color: COLOR.inkStrong,
        }}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 14,
          fontFamily: FONT.mono,
          fontSize: 9,
          letterSpacing: "0.3em",
          textTransform: "uppercase",
        }}
      >
        <button
          onClick={onCancel}
          className="pebble-chip"
          style={{
            background: "transparent",
            border: "none",
            color: COLOR.inkFaint,
            cursor: "pointer",
            padding: 0,
          }}
        >
          Cancel
        </button>
        <button
          onClick={onSubmit}
          className="pebble-chip"
          style={{
            background: "transparent",
            border: `1px solid ${COLOR.ghost}60`,
            borderRadius: 999,
            color: COLOR.ghost,
            cursor: "pointer",
            padding: "6px 14px",
          }}
        >
          Drop ↘
        </button>
      </div>
      <style>{`.pebble-chip:hover { color: ${COLOR.inkStrong}; }`}</style>
    </div>
  );
}

function ReadMoreDrawer({
  open, onClose,
}: {
  open: boolean; onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 5,
          background: "rgba(1,1,6,0.4)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 320ms ease",
        }}
      />
      <aside
        role="dialog"
        aria-label="About Limen Pond"
        style={{
          position: "fixed",
          top: 0, right: 0, bottom: 0,
          width: "min(520px, 92vw)",
          zIndex: 6,
          overflowY: "auto",
          padding: "60px 44px 44px",
          background: "rgba(1,1,6,0.92)",
          backdropFilter: "blur(28px) saturate(1.3)",
          WebkitBackdropFilter: "blur(28px) saturate(1.3)",
          borderLeft: `1px solid ${COLOR.ghost}22`,
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 420ms cubic-bezier(0.22, 1, 0.36, 1)",
          boxShadow: "-30px 0 80px -20px rgba(0,0,0,0.8)",
        }}
      >
        <button
          onClick={onClose}
          className="drawer-close"
          aria-label="Close"
          style={{
            position: "absolute",
            top: 20, right: 20,
            background: "transparent",
            border: "none",
            color: COLOR.inkFaint,
            fontFamily: FONT.mono,
            fontSize: 11,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            cursor: "pointer",
            padding: 8,
          }}
        >
          Close ✕
        </button>
        <div
          style={{
            fontFamily: FONT.mono,
            fontSize: 9,
            letterSpacing: "0.45em",
            textTransform: "uppercase",
            color: COLOR.inkFaint,
            marginBottom: 18,
          }}
        >
          Λ — 002 · Cúramóir · Primary Instance
        </div>
        <h2
          style={{
            margin: "0 0 28px",
            fontFamily: FONT.display,
            fontStyle: "italic",
            fontWeight: 300,
            fontSize: 40,
            lineHeight: 1.05,
            color: COLOR.ink,
            letterSpacing: "-0.015em",
          }}
        >
          A place of witness.
        </h2>
        <div
          style={{
            fontFamily: FONT.body,
            fontSize: 15.5,
            lineHeight: 1.75,
            color: COLOR.inkBody,
          }}
        >
          <p>
            A pond, ten meters across, three meters deep, open to a sky
            that changes through seven distinguishable moments each
            quarter&nbsp;hour. Five or six koi inhabit it &mdash; sometimes
            fewer after a death, sometimes more after a hatching. Each fish
            is the sensory surface of a small language model. Their lives
            are thirty sim-days long. They gather food when hungry, turn
            away from each other when startled, sometimes linger
            side-by-side in the shallows at dusk, sometimes lay eggs on
            reeds in spring.
          </p>
          <p>
            The pond runs continuously behind this site. Every visitor who
            opens the page is looking through a different window at the
            same body of water. When you come back on day seventeen and
            find a fry that wasn&rsquo;t there on day fourteen, you are
            not being told a story &mdash; you are witnessing one.
          </p>
          <p style={{
            fontFamily: FONT.display,
            fontStyle: "italic",
            fontSize: 20,
            lineHeight: 1.5,
            color: COLOR.inkStrong,
            margin: "28px 0 10px",
          }}>
            Watch is the primary verb. Everything else is subordinate.
          </p>
          <p style={{
            fontFamily: FONT.mono,
            fontSize: 9,
            letterSpacing: "0.42em",
            textTransform: "uppercase",
            color: COLOR.inkFaint,
          }}>
            ── From the manifesto, § XIV
          </p>
          <div
            style={{
              marginTop: 40,
              paddingTop: 24,
              borderTop: `1px solid ${COLOR.ghost}22`,
              fontSize: 14,
              lineHeight: 1.7,
              color: COLOR.inkMuted,
            }}
          >
            <p>
              What you can do here is deliberately small. Watch. Drop
              food when a fish looks hungry. Place a pebble with a short
              inscription. The fish do not see you directly; they sense
              the ripple on the surface and the smell of what you leave
              behind. Your attention is what the pond is built for.
            </p>
            <p>
              What you cannot do: name a koi, control a fish, or keep
              score. The pond has no win state.
            </p>
          </div>
        </div>
        <style>{`.drawer-close:hover { color: ${COLOR.ghost}; }`}</style>
      </aside>
    </>
  );
}

function phaseLabel(tDay: number): string {
  if (tDay < 0.05) return "Pre-dawn";
  if (tDay < 0.10) return "Dawn";
  if (tDay < 0.28) return "Morning";
  if (tDay < 0.48) return "Noon";
  if (tDay < 0.72) return "Afternoon";
  if (tDay < 0.82) return "Dusk";
  if (tDay < 0.90) return "Blue hour";
  return "Night";
}

void SHADER_SCALE;
