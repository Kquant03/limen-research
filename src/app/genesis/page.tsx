"use client";

// ═══════════════════════════════════════════════════════════════════════════
//  /genesis · landing page
//  ─────────────────────────────────────────────────────────────────────────
//  A room of living substrates. Six cards, each with its own live preview
//  canvas:
//
//    · The Filter is the featured entry (full-width hero card at the top)
//      because it's a paper artifact as much as a simulation — the design
//      wants it to read as the first thing, not a peer.
//    · The other five tile in a responsive 2- or 3-column grid beneath.
//    · A "previews" toggle at the top of the page lets readers switch the
//      whole grid off when their machine complains. Per-card visibility
//      via IntersectionObserver means offscreen cards don't pay the
//      simulation cost regardless of the toggle.
//
//  No SubstrateFrame here — the landing page is the opening; the frame is
//  for the substrate pages it leads to.
// ═══════════════════════════════════════════════════════════════════════════

import { useState } from "react";

import { SubstrateCard } from "@/components/genesis/_landing/SubstrateCard";
import {
  FilterPreview,
  GrayScottPreview,
  IsingPreview,
  LeniaPreview,
  LeniaExpandedPreview,
  ParticleLifePreview,
} from "@/components/genesis/_landing/previews";

// Inlined Lantern palette — matches the main page exactly so the /genesis
// landing feels continuous with / rather than a different room.
const COLOR = {
  void: "#010106",
  ink: "#f4f6fb",
  inkStrong: "#eaeef7",
  inkBody: "#c8cfe0",
  inkMuted: "#8a9bba",
  inkFaint: "#5a6780",
  inkGhost: "#3a4560",
  ghost: "#7fafb3",
} as const;

const FONT = {
  display: "var(--font-display), 'Cormorant Garamond', Georgia, serif",
  body: "var(--font-body), 'Source Serif 4', Georgia, 'Times New Roman', serif",
  mono: "var(--font-mono), 'JetBrains Mono', monospace",
} as const;

// ───────────────────────────────────────────────────────────────────────────

export default function GenesisLandingPage() {
  const [previewsOn, setPreviewsOn] = useState(true);

  return (
    <section
      style={{
        position: "relative",
        minHeight: "100vh",
        paddingTop: 200,
        paddingBottom: 160,
      }}
    >
      {/* ═══ MASTHEAD ═══ */}
      <div style={{ padding: "0 40px 0" }}>
        <div
          style={{
            maxWidth: 1440,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            alignItems: "center",
            gap: 24,
            fontFamily: FONT.mono,
            fontSize: 9,
            letterSpacing: "0.42em",
            textTransform: "uppercase",
            color: COLOR.inkFaint,
          }}
        >
          <div>Λ · 001</div>
          <div style={{ letterSpacing: "0.55em", color: COLOR.inkMuted }}>
            — Genesis · Artificial Life Laboratory —
          </div>
          <div style={{ textAlign: "right" }}>
            Six substrates
          </div>
        </div>
      </div>

      {/* ═══ TITLE + INTRO ═══ */}
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "clamp(60px, 9vw, 120px) 40px clamp(48px, 6vw, 80px)",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            margin: "0 auto",
            fontFamily: FONT.display,
            fontStyle: "italic",
            fontWeight: 300,
            fontSize: "clamp(52px, 8vw, 120px)",
            lineHeight: 0.94,
            letterSpacing: "-0.03em",
            color: COLOR.ink,
            maxWidth: "14ch",
          }}
        >
          A room of living{" "}
          <span style={{ color: COLOR.inkMuted }}>substrates.</span>
        </h1>

        <div className="lantern-rule" style={{ margin: "56px auto 40px" }} />

        <p
          style={{
            maxWidth: "58ch",
            margin: "0 auto",
            fontFamily: FONT.body,
            fontSize: "clamp(16px, 1.25vw, 18px)",
            lineHeight: 1.72,
            color: COLOR.inkBody,
          }}
        >
          Six GPU- and CPU-accelerated simulations that run in the browser.
          Each is a different thesis about what a substrate{" "}
          <em style={{ color: COLOR.inkStrong }}>is</em> — a lattice of
          spins, a field of reaction-diffusion chemistry, an asymmetric
          force matrix, a continuous cellular automaton, a composed
          envelope of physical constraints. Paint into any of them.
          Watch what the rules permit.
        </p>

        {/* Previews-on toggle — sits below the intro so the reader has
            seen the premise before being asked for a preference. */}
        <div
          style={{
            marginTop: 48,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 14,
            fontFamily: FONT.mono,
            fontSize: 10,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: COLOR.inkFaint,
          }}
        >
          <span>Previews</span>
          <button
            type="button"
            onClick={() => setPreviewsOn((v) => !v)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "7px 14px",
              borderRadius: 2,
              border: `1px solid ${previewsOn ? COLOR.ghost + "80" : COLOR.inkGhost + "80"}`,
              background: previewsOn ? "rgba(127,175,179,0.08)" : "transparent",
              color: previewsOn ? COLOR.ink : COLOR.inkMuted,
              fontFamily: FONT.mono,
              fontSize: 10,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              cursor: "pointer",
              transition: "color 0.3s ease, border-color 0.3s ease, background 0.3s ease",
            }}
          >
            <span
              aria-hidden
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: previewsOn ? COLOR.ghost : COLOR.inkFaint,
                boxShadow: previewsOn ? `0 0 12px ${COLOR.ghost}` : "none",
                transition: "all 0.3s ease",
              }}
            />
            {previewsOn ? "Running" : "Paused"}
          </button>
          <span style={{ color: COLOR.inkGhost }}>
            · pause if your machine struggles
          </span>
        </div>
      </div>

      {/* ═══ FEATURED — The Filter ═══ */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 40px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr)",
            marginBottom: 32,
          }}
        >
          <SubstrateCard
            catalog="Λ — 001 · F"
            title="The Filter"
            subtitle="A wall woven from light and heat."
            description="Two unrelated areas of physics — relativistic Lieb–Robinson signaling and Landauer–Sivak–Crooks irreversible registration — compose into a single feasibility envelope on coordinated agentic extent. Below the cusp τ★, no agent-coordinated extent is reachable. The companion paper proves the envelope is invariant under the rescaling architected cost-sharing fission would require, closing the strongest Darwinian objection to the homeostatic alternative."
            citation="Sebastian & Claude (2026)"
            href="/genesis/filter"
            featured
            canvasAspect="16 / 9"
            renderCanvas={(playing) => <FilterPreview playing={previewsOn && playing} />}
          />
        </div>

        {/* ═══ GRID — five substrates ═══ */}
        <div
          className="genesis-substrate-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
            gap: 32,
          }}
        >
          <SubstrateCard
            catalog="Λ — 001 · I"
            title="Ising"
            subtitle="The smallest model of a phase transition."
            description="A lattice of ±1 spins, exchange coupling J, temperature T. Metropolis or Wolff. Observables: ⟨M⟩, ⟨|M|⟩, ⟨E⟩/N, χ, Cv, the Binder cumulant. Toggle to the Tsarev social reading and the same lattice becomes a model of collective opinion dynamics."
            citation="Ising (1925) · Onsager (1944) · Wolff (1989)"
            href="/genesis/ising"
            renderCanvas={(playing) => <IsingPreview playing={previewsOn && playing} />}
          />

          <SubstrateCard
            catalog="Λ — 001 · L"
            title="Lenia"
            subtitle="A creature made of field."
            description="Continuous cellular automata. Orbium and its kin glide across a smooth substrate under a Gaussian growth rule. The Ghost Species — Orbium unicaudatus ignis var. phantasma — inhabits a σ-gradient landscape where physics itself varies in space, remembering shapes it can no longer hold."
            citation="Chan (2018) · Sebastian & Claude (2026)"
            href="/genesis/lenia"
            renderCanvas={(playing) => <LeniaPreview playing={previewsOn && playing} />}
          />

          <SubstrateCard
            catalog="Λ — 001 · X"
            title="Lenia Expanded"
            subtitle="Four channels and a four-dimensional organism."
            description="Prey, predator, morphogen, and the Dihypersphaerome ventilans — a 4D organism whose 2D shadow seeds the ecosystem it inhabits. Cross-coupling in the growth rules; advection along a derived flow field; the whole thing breathes through an XW/YW/ZW rotation of its fourth dimension."
            citation="Chan (2020) · Sebastian & Claude (2026)"
            href="/genesis/lenia-expanded"
            renderCanvas={(playing) => <LeniaExpandedPreview playing={previewsOn && playing} />}
          />

          <SubstrateCard
            catalog="Λ — 001 · G"
            title="Gray-Scott"
            subtitle="Pearson's eight classes of pattern."
            description="Two partial differential equations — substrate u, catalyst v — with feed rate F and kill rate k. Small changes in (F, k) produce mitosis, solitons, coral, worms, U-skates, spirals. A cartography of continuous parameter space with discrete classes as landmarks."
            citation="Pearson (1993) · Gray & Scott (1984)"
            href="/genesis/gray-scott"
            renderCanvas={(playing) => <GrayScottPreview playing={previewsOn && playing} />}
          />

          <SubstrateCard
            catalog="Λ — 001 · P"
            title="Particle Life"
            subtitle="Emergent ecologies from an asymmetric force matrix."
            description="Six particle types, a 6×6 matrix of attraction and repulsion — M[i][j] need not equal M[j][i]. The asymmetry is what lets predation, symbiosis, membranes, and orbital capture emerge. You can't get these from any symmetric potential."
            citation="Ahmad (2022) · Mohr"
            href="/genesis/particle-life"
            renderCanvas={(playing) => <ParticleLifePreview playing={previewsOn && playing} />}
          />
        </div>
      </div>

      {/* ═══ FOOT NOTE ═══ */}
      <div
        style={{
          maxWidth: 840,
          margin: "96px auto 0",
          padding: "0 40px",
          textAlign: "center",
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: FONT.display,
            fontStyle: "italic",
            fontWeight: 300,
            fontSize: "clamp(18px, 1.6vw, 22px)",
            lineHeight: 1.55,
            color: COLOR.inkMuted,
            maxWidth: "48ch",
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          Each substrate is a claim about what is allowed to live in it.
          The paper and the simulation are the same argument, read twice.
        </p>
      </div>
    </section>
  );
}
