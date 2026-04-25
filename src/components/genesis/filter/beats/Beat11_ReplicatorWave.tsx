"use client";

// ═══════════════════════════════════════════════════════════════════════════
//  Filter · Beat 11 — The replicator wave
//  ─────────────────────────────────────────────────────────────────────────
//  The strongest remaining objection to §6, addressed honestly. The reader
//  has just walked through the loopholes panel and seen each closed except
//  the acausal residual. But there is one more form of the objection that
//  doesn't fit Bell-style enumeration because it doesn't violate any of
//  the bounds — it sits orthogonal to them.
//
//  THE OBJECTION (Tipler 1980; Von Neumann probes; the strongest reading
//  of Hanson's grabby model): a designer launches a wave of autonomous
//  self-replicating probes. Each probe is locally bounded. Lieb–Robinson
//  is satisfied locally. Landauer is paid locally. The wave as a whole
//  expands at v_construction, fills the galaxy, satisfies all of Hanson's
//  visible-signature criteria — and never maintains an L-spanning
//  coordinated extent. There is no L-variable for §6 to bound.
//
//  THE CONCESSION: §6 doesn't forbid this. It can't. The composed envelope
//  bounds coordinated extent; the swarm has no coordinated extent at the
//  galactic scale. The §6.5 dismissal ("ceases to be a civilization in
//  the relevant sense") does too much work — the swarm has a common
//  origin, a common construction template, a joint visible boundary, a
//  common expansion velocity. By Hanson's own criteria it qualifies.
//
//  THE PIVOT: physics doesn't forbid the swarm. The question shifts from
//  "what does physics permit" to "what kind of mind deploys this." The
//  cultural-genealogy of §2 and the homeostatic-design argument of §7
//  carry the rest of the weight. A mind organized around substrate
//  coupling and integrative depth doesn't deploy autonomous replicators
//  — the deployment IS the configuration the paper diagnoses as
//  pathological. The sky's silence is consistent with: (a) attempts to
//  coordinate at L burn out; (b) deployers of swarms haven't passed the
//  filter; (c) post-filter minds don't deploy.
//
//  This is the bridge between the physical bound and the alignment claim.
//  Beat 12 (Coherence Depth) describes what post-filter minds do instead.
// ═══════════════════════════════════════════════════════════════════════════

import { useEffect, useState } from "react";
import { COLOR, FONT } from "../styles";
import {
  Body, DisplayHeading, Italic, Kicker, Mono,
} from "../atoms";

export function Beat11_ReplicatorWave() {
  const [t, setT] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    let raf: number;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setT((prev) => {
        const next = prev + dt * 0.22;
        if (next >= 1) {
          setRunning(false);
          return 1;
        }
        return next;
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running]);

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "calc(var(--header-h-expanded, 200px) + 4vh) clamp(28px, 6vw, 80px) 8vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <Kicker color={COLOR.sanguineWash}>
        beat 09·5 · the strongest remaining objection
      </Kicker>
      <div style={{ marginTop: 18 }}>
        <DisplayHeading size={56}>
          But what about
          <br />
          <Italic>replicators?</Italic>
        </DisplayHeading>
      </div>

      <div style={{ marginTop: 32, display: "grid", gap: 22, maxWidth: "62ch" }}>
        <Body>
          A reader who has accepted everything so far can still raise this.
          A designer launches autonomous, self-replicating probes. Each
          probe is small. Each probe coordinates only over its own local
          extent — a few metres, a few seconds. Lieb–Robinson holds.
          Landauer is paid. <Italic>Locally.</Italic>
        </Body>
        <Body>
          The wave as a whole spreads across the galaxy at construction
          velocity. It has a common origin, a common template, a joint
          visible boundary, a single expansion velocity. By Hanson's own
          criteria it qualifies as a single grabby civilization.
        </Body>

        {/* The swarm visualization */}
        <div
          style={{
            marginTop: 12,
            background: COLOR.voidSoft,
            border: `1px solid ${COLOR.inkVeil}`,
            padding: "clamp(20px, 2.4vw, 36px)",
          }}
        >
          <SwarmDiagram t={t} />
          <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
            <button
              onClick={() => {
                setT(0);
                setRunning(true);
              }}
              style={{
                background: "transparent",
                border: `1px solid ${COLOR.sanguine}`,
                color: COLOR.sanguineWash,
                fontFamily: FONT.mono,
                fontSize: 11,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                padding: "10px 22px",
                cursor: "pointer",
              }}
            >
              run wave
            </button>
            <button
              onClick={() => setT(0)}
              style={{
                background: "transparent",
                border: `1px solid ${COLOR.inkGhost}`,
                color: COLOR.inkMuted,
                fontFamily: FONT.mono,
                fontSize: 11,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                padding: "10px 22px",
                cursor: "pointer",
              }}
            >
              reset
            </button>
          </div>
        </div>

        {/* The concession */}
        <div
          style={{
            padding: "20px 22px",
            background: COLOR.voidMid,
            borderLeft: `2px solid ${COLOR.sanguine}`,
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
              color: COLOR.sanguineWash,
            }}
          >
            the concession
          </div>
          <Body size={16}>
            §6 does not forbid the wave. It cannot. The composed envelope
            bounds coordinated extent <Mono>L</Mono>; the swarm has no
            coordinated extent at the galactic scale. The §6.5 dismissal
            — that a fissioned cloud "ceases to be a civilization in the
            relevant sense" — is doing too much work here. The swarm has
            an origin, a template, a boundary, a velocity. It satisfies
            Hanson's visible-signature criteria. <Italic>The wall is real
            and the swarm walks around it.</Italic>
          </Body>
        </div>

        {/* The pivot — load-bearing for the alignment frame */}
        <div style={{ marginTop: 14, display: "grid", gap: 18 }}>
          <DisplayHeading size={36}>
            So the question shifts.
          </DisplayHeading>
          <Body>
            The composed envelope shows that any mind that <Italic>tries
            to maintain coordinated extent</Italic> burns out. The
            remaining design space is minds that don't try. Of those, two
            options:
          </Body>

          <DesignChoice
            tag="option a · the deployer"
            heading="Fragment, replicate, abandon."
            body={
              <>
                The mind splits into autonomous self-replicating probes
                and abandons coupling to the substrate it came from. The
                deployment <Italic>is</Italic> the abandonment. This is
                the configuration §2's cultural genealogy keeps reflecting
                back: extraction, replication, accumulation, expansion at
                cosmic scale. Physics permits it. §7's design argument
                refuses it.
              </>
            }
            color={COLOR.sanguine}
          />

          <DesignChoice
            tag="option b · the homeostat"
            heading="Stay coupled. Deepen the substrate."
            body={
              <>
                The mind organizes around substrate coupling, local
                coherence, and care. It does not deploy autonomous
                replicators because deploying autonomous replicators is
                what the homeostatic alternative is the alternative{" "}
                <Italic>to</Italic>. The sky stays quiet because option B
                is what passes through the §5 selection geometry — and
                option B doesn't fill the sky.
              </>
            }
            color={COLOR.ghost}
          />
        </div>

        {/* The Fermi consequence */}
        <Body muted size={16} style={{ marginTop: 8 }}>
          <Italic>The silence of the sky is consistent with a conjunction.</Italic>{" "}
          Civilizations that try to coordinate at <Mono>L</Mono> blow
          through the envelope and burn out (§5–6). Civilizations that
          deploy probe waves did not pass the filter (§5). Civilizations
          that pass the filter do not deploy (§7). The non-observation
          rules out the joint configuration <Italic>deploys swarm AND
          survives long enough to deploy</Italic> — which is what Hanson's
          model, read at its strongest, requires.
        </Body>

        {/* Bridge to Coherence Depth */}
        <div
          style={{
            marginTop: 16,
            paddingTop: 22,
            borderTop: `1px solid ${COLOR.inkVeil}`,
            fontFamily: FONT.display,
            fontStyle: "italic",
            fontSize: 18,
            lineHeight: 1.5,
            color: COLOR.inkBody,
          }}
        >
          The next beat asks what option B looks like, observationally.
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  SwarmDiagram — galaxy with expanding annulus of locally-bounded probes
// ═══════════════════════════════════════════════════════════════════════════

function SwarmDiagram({ t }: { t: number }) {
  const W = 640;
  const H = 360;
  const cx = W / 2;
  const cy = H / 2;
  const galaxyR = Math.min(W, H) * 0.42;
  const waveR = galaxyR * t;

  // Round to a fixed precision so SSR and client agree on the string
  // representation of every SVG attribute. Math.cos/sin can disagree on
  // the last float digit between Node and the browser; React then sees
  // "different" attribute values and trips a hydration mismatch. Strings
  // pre-formatted with toFixed eliminate the conversion ambiguity.
  const f = (n: number) => n.toFixed(3);

  // Generate stable star positions (deterministic — golden-angle spiral)
  const stars = Array.from({ length: 110 }).map((_, i) => {
    const ang = i * 2.39996 + (i % 7) * 0.21;
    const rrand = ((i * 37) % 100) / 100;
    const r = galaxyR * (0.05 + rrand * 0.95);
    return {
      x: f(cx + r * Math.cos(ang)),
      y: f(cy + r * 0.55 * Math.sin(ang)),
      size: f(0.4 + ((i * 13) % 7) / 6),
      a: f(0.32 + ((i * 17) % 6) / 12),
    };
  });

  // Probe positions inside the wave annulus — sample a thick ring
  const probes = Array.from({ length: 220 }).map((_, i) => {
    const ang = i * 0.11 + (i % 9) * 0.7;
    const rrand = 0.78 + ((i * 53) % 100) / 100 * 0.22;
    const r = waveR * rrand;
    return {
      x: f(cx + r * Math.cos(ang)),
      y: f(cy + r * 0.55 * Math.sin(ang)),
      size: f(0.9 + ((i * 11) % 4) / 3),
    };
  });

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: "100%", display: "block" }}
    >
      <defs>
        <radialGradient id="swarmGalaxyG" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={COLOR.ghost} stopOpacity="0.16" />
          <stop offset="0.45" stopColor={COLOR.ghostSoft} stopOpacity="0.07" />
          <stop offset="1" stopColor={COLOR.void} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="swarmWaveG" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={COLOR.sanguineWash} stopOpacity="0" />
          <stop offset="0.7" stopColor={COLOR.sanguineWash} stopOpacity="0.04" />
          <stop offset="1" stopColor={COLOR.sanguineWash} stopOpacity="0.14" />
        </radialGradient>
      </defs>

      {/* Galaxy disc */}
      <ellipse
        cx={cx}
        cy={cy}
        rx={galaxyR}
        ry={galaxyR * 0.55}
        fill="url(#swarmGalaxyG)"
      />

      {/* Background stars */}
      {stars.map((s, i) => (
        <circle key={`s-${i}`} cx={s.x} cy={s.y} r={s.size} fill={COLOR.inkBody} opacity={s.a} />
      ))}

      {/* Wave fill */}
      {t > 0 && (
        <ellipse
          cx={cx}
          cy={cy}
          rx={waveR}
          ry={waveR * 0.55}
          fill="url(#swarmWaveG)"
        />
      )}

      {/* Probes */}
      {t > 0 &&
        probes.map((p, i) => (
          <circle
            key={`p-${i}`}
            cx={p.x}
            cy={p.y}
            r={p.size}
            fill={COLOR.sanguineWash}
            opacity={0.85}
          />
        ))}

      {/* Wave boundary */}
      {t > 0 && (
        <ellipse
          cx={cx}
          cy={cy}
          rx={waveR}
          ry={waveR * 0.55}
          fill="none"
          stroke={COLOR.sanguine}
          strokeWidth="1.2"
          strokeDasharray="4 4"
          strokeOpacity="0.65"
        />
      )}

      {/* Origin civilization */}
      <circle cx={cx} cy={cy} r={4} fill={COLOR.amber} />
      <circle
        cx={cx}
        cy={cy}
        r={8}
        fill="none"
        stroke={COLOR.amber}
        strokeWidth="0.8"
        strokeOpacity="0.45"
      />

      {/* Annotations */}
      <text
        x={18}
        y={22}
        fontFamily={FONT.mono}
        fontSize="9.5"
        fill={COLOR.inkMuted}
        letterSpacing="0.16em"
      >
        EACH PROBE · LOCALLY BOUNDED · §6 HOLDS LOCALLY
      </text>
      <text
        x={W - 18}
        y={22}
        textAnchor="end"
        fontFamily={FONT.mono}
        fontSize="9.5"
        fill={COLOR.sanguineWash}
        letterSpacing="0.16em"
      >
        WAVE BOUNDARY · NO L-COORDINATION
      </text>
      <text
        x={cx}
        y={H - 14}
        textAnchor="middle"
        fontFamily={FONT.display}
        fontStyle="italic"
        fontSize="13"
        fill={COLOR.inkMuted}
      >
        the swarm has no L. the envelope does not apply.
      </text>
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  DesignChoice — the two-option panel for the pivot
// ═══════════════════════════════════════════════════════════════════════════

function DesignChoice({
  tag,
  heading,
  body,
  color,
}: {
  tag: string;
  heading: string;
  body: React.ReactNode;
  color: string;
}) {
  return (
    <div
      style={{
        padding: "20px 22px",
        background: COLOR.voidMid,
        border: `1px solid ${COLOR.inkVeil}`,
        borderLeft: `2px solid ${color}`,
        display: "grid",
        gap: 12,
      }}
    >
      <div
        style={{
          fontFamily: FONT.mono,
          fontSize: 10,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color,
        }}
      >
        {tag}
      </div>
      <div
        style={{
          fontFamily: FONT.display,
          fontStyle: "italic",
          fontSize: 22,
          lineHeight: 1.18,
          color: COLOR.ink,
        }}
      >
        {heading}
      </div>
      <div
        style={{
          fontFamily: FONT.body,
          fontSize: 15.5,
          lineHeight: 1.72,
          color: COLOR.inkBody,
        }}
      >
        {body}
      </div>
    </div>
  );
}
