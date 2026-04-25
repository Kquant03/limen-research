"use client";

// ═══════════════════════════════════════════════════════════════════════════
//  Genesis · landing previews
//  ─────────────────────────────────────────────────────────────────────────
//  Reduced-resolution live previews for the /genesis catalog grid. Each
//  preview imports the canonical simulation code from its substrate module
//  (so the physics is identical to the full page) and runs it at a smaller
//  grid / fewer particles / simpler rendering to keep CPU + GPU tolerable
//  when six are visible at once.
//
//  A `playing` prop gates every rAF loop — when false, the simulation
//  pauses. The parent grid sets this via an IntersectionObserver in
//  <SubstrateCard> and a global toggle. That means a reader who scrolls
//  past a card stops paying for it; a reader who scrolls back picks up
//  where it left off.
//
//  ── Lenia notes ─────────────────────────────────────────────────────
//  The Lenia and Lenia Expanded previews use the actual RLE-encoded
//  species seeds (Orbium, Ignis) rather than hand-rolled Gaussian blobs.
//  Symmetric Gaussian seeds are NOT stable Lenia creatures — they either
//  collapse to nothing or smear out under the growth function. The RLE
//  seeds carry the precise asymmetric morphology that makes Orbium a
//  travelling soliton. We decode them once and scale to preview grid.
//
//  Lenia Expanded uses a real four-channel pipeline at preview scale —
//  three kernels, state + flow ping-pong, no bloom or composite. The
//  4D HYPER shader is skipped (it's expensive and what it adds is
//  invisible at 240px) but a placeholder hyperseed texture is bound so
//  the SIM shader doesn't get a null sampler.
// ═══════════════════════════════════════════════════════════════════════════

import { useEffect, useRef, useState } from "react";

import {
  createFields as gsCreateFields,
  stepRD as gsStepRD,
  renderFields as gsRenderFields,
  PRESETS as GS_PRESETS,
} from "@/components/genesis/gray-scott/simulation";

import {
  createGrid as isingCreateGrid,
  metropolisSweep,
  TC,
} from "@/components/genesis/ising/simulation";
import { renderGrid as isingRenderGrid } from "@/components/genesis/ising/renderer";

import {
  initParticles as plInitParticles,
  stepParticleLife,
  renderParticles as plRenderParticles,
  MATRIX_PRESETS as PL_MATRIX_PRESETS,
} from "@/components/genesis/particle-life/simulation";

// Lantern palette for the Filter mini-plot.
const COLOR = {
  void: "#010106",
  voidSoft: "#0a0f1a",
  ink: "#f4f6fb",
  inkMuted: "#8a9bba",
  inkFaint: "#5a6780",
  inkGhost: "#3a4560",
  ghost: "#7fafb3",
  ghostSoft: "#5d8a8e",
} as const;

// ───────────────────────────────────────────────────────────────────────────
//  Gray-Scott preview
// ───────────────────────────────────────────────────────────────────────────

export function GrayScottPreview({ playing }: { playing: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const N = 120;
    const CANVAS = 240;
    canvas.width = CANVAS;
    canvas.height = CANVAS;

    const fields = gsCreateFields(N);
    const p = GS_PRESETS.mitosis;

    let alive = true;
    const loop = () => {
      if (!alive) return;
      if (playing) {
        gsStepRD(fields, N, p.F, p.k, 6);
        gsRenderFields(ctx, fields, N, CANVAS, "ghost");
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      alive = false;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [playing]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: "100%",
        height: "100%",
        display: "block",
        imageRendering: "pixelated",
      }}
    />
  );
}

// ───────────────────────────────────────────────────────────────────────────
//  Ising preview
// ───────────────────────────────────────────────────────────────────────────

export function IsingPreview({ playing }: { playing: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const N = 80;
    const CELL = 3;
    const CANVAS = N * CELL;
    canvas.width = CANVAS;
    canvas.height = CANVAS;

    const T = TC * 1.02;
    const beta = 1.0 / T;
    const J = 1.0;
    const grid = isingCreateGrid(N);

    let alive = true;
    const loop = () => {
      if (!alive) return;
      if (playing) {
        metropolisSweep(grid, N, beta, J, 0);
        metropolisSweep(grid, N, beta, J, 0);
        isingRenderGrid(ctx, grid, N, CANVAS, CELL, "spin", J);
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      alive = false;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [playing]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: "100%",
        height: "100%",
        display: "block",
        imageRendering: "pixelated",
      }}
    />
  );
}

// ───────────────────────────────────────────────────────────────────────────
//  Particle Life preview
// ───────────────────────────────────────────────────────────────────────────

export function ParticleLifePreview({ playing }: { playing: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = 240;
    const H = 240;
    canvas.width = W;
    canvas.height = H;

    const particles = plInitParticles(300, 4, W, H);
    const matrix = PL_MATRIX_PRESETS.symbiosis.gen(4);

    let alive = true;
    const loop = () => {
      if (!alive) return;
      if (playing) {
        stepParticleLife(particles, matrix, W, H, 60, 0.5, 0.3);
        plRenderParticles(ctx, particles, W, H, true);
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      alive = false;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [playing]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: "100%",
        height: "100%",
        display: "block",
      }}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  Lenia preview — RLE-decoded Orbium at preview scale
// ═══════════════════════════════════════════════════════════════════════════

import {
  VERT_SRC as LENIA_VERT,
  SIM_FRAG_SRC as LENIA_SIM,
  DISPLAY_FRAG_SRC as LENIA_DISPLAY,
  KERNEL_TEX_SIZE as LENIA_KS,
} from "@/components/genesis/lenia/shaders";
import {
  createProgram as leniaCreateProgram,
  createTex as leniaCreateTex,
  createFB as leniaCreateFB,
} from "@/components/genesis/lenia/webgl";
import {
  buildKernelData as leniaBuildKernelData,
  decodeRLE as leniaDecodeRLE,
  scaleSeed as leniaScaleSeed,
  SPECIES_RLE as LENIA_SPECIES_RLE,
  ORBIUM_FALLBACK,
} from "@/components/genesis/lenia/kernel";

/**
 * Build an N×N initial state with RLE-decoded Orbium creatures placed at
 * the requested centres, scaled to kernel radius `R`. Distinct from the
 * full Lenia's `buildInitialState` because that one hardcodes N=256 from
 * the shader module's constant.
 */
function buildLeniaPreviewState(
  Nsize: number,
  R: number,
  centres: Array<[number, number]>,
): Float32Array {
  const data = new Float32Array(Nsize * Nsize * 4);

  // Decode Orbium from RLE. Canonical for R=13; we scale to requested R.
  let baseSeed: number[][];
  try {
    baseSeed = leniaDecodeRLE(LENIA_SPECIES_RLE.orbium);
    if (
      !baseSeed.length ||
      !baseSeed[0].length ||
      Math.max(...baseSeed.flat()) < 0.1
    ) {
      baseSeed = ORBIUM_FALLBACK;
    }
  } catch {
    baseSeed = ORBIUM_FALLBACK;
  }

  const seed = R !== 13 ? leniaScaleSeed(baseSeed, 13, R) : baseSeed;
  const h = seed.length;
  const w = seed[0].length;

  for (const [cx, cy] of centres) {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const gx = (((cx - Math.floor(w / 2) + x) % Nsize) + Nsize) % Nsize;
        const gy = (((cy - Math.floor(h / 2) + y) % Nsize) + Nsize) % Nsize;
        const idx = (gy * Nsize + gx) * 4;
        const v = seed[y][x];
        data[idx] = Math.max(data[idx], v);
        data[idx + 1] = Math.max(data[idx + 1], v);
      }
    }
  }
  return data;
}

export function LeniaPreview({ playing }: { playing: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // N=128 keeps convolution cost low; R=10 leaves space for two Orbium
    // gliders to wander before they wrap into each other.
    const N_MINI = 128;
    const CANVAS = 240;
    const R = 10;
    canvas.width = CANVAS;
    canvas.height = CANVAS;

    const gl = canvas.getContext("webgl2", {
      antialias: false,
      alpha: false,
      preserveDrawingBuffer: false,
    });
    if (!gl) return;
    if (!gl.getExtension("EXT_color_buffer_float")) return;
    gl.getExtension("OES_texture_float_linear");

    const simProg = leniaCreateProgram(gl, LENIA_VERT, LENIA_SIM);
    const dispProg = leniaCreateProgram(gl, LENIA_VERT, LENIA_DISPLAY);
    if (!simProg || !dispProg) return;

    const vao = gl.createVertexArray();
    const vbo = gl.createBuffer();
    if (!vao || !vbo) return;
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );
    for (const prog of [simProg, dispProg]) {
      const loc = gl.getAttribLocation(prog.program, "a_pos");
      if (loc >= 0) {
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      }
    }

    const stateTex0 = leniaCreateTex(gl, N_MINI, N_MINI, gl.RGBA32F, gl.RGBA, gl.FLOAT, gl.NEAREST, null);
    const stateTex1 = leniaCreateTex(gl, N_MINI, N_MINI, gl.RGBA32F, gl.RGBA, gl.FLOAT, gl.NEAREST, null);
    const kernelTex = leniaCreateTex(gl, LENIA_KS, LENIA_KS, gl.RGBA32F, gl.RGBA, gl.FLOAT, gl.NEAREST, null);
    const memoryTex = leniaCreateTex(gl, N_MINI, N_MINI, gl.RGBA32F, gl.RGBA, gl.FLOAT, gl.NEAREST, null);
    const sigmaTex = leniaCreateTex(gl, N_MINI, N_MINI, gl.RGBA32F, gl.RGBA, gl.FLOAT, gl.LINEAR, null);
    if (!stateTex0 || !stateTex1 || !kernelTex || !memoryTex || !sigmaTex) return;

    const stateFB0 = leniaCreateFB(gl, stateTex0);
    const stateFB1 = leniaCreateFB(gl, stateTex1);
    if (!stateFB0 || !stateFB1) return;

    // Two Orbium gliders, well-separated.
    const initData = buildLeniaPreviewState(N_MINI, R, [
      [Math.floor(N_MINI * 0.32), Math.floor(N_MINI * 0.4)],
      [Math.floor(N_MINI * 0.7), Math.floor(N_MINI * 0.65)],
    ]);
    gl.bindTexture(gl.TEXTURE_2D, stateTex0);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, N_MINI, N_MINI, gl.RGBA, gl.FLOAT, initData);

    // Kernel must match the seed scale (R=10 here).
    const kernelData = leniaBuildKernelData(R, [1]);
    gl.bindTexture(gl.TEXTURE_2D, kernelTex);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, LENIA_KS, LENIA_KS, gl.RGBA, gl.FLOAT, kernelData);

    gl.bindTexture(gl.TEXTURE_2D, memoryTex);
    gl.texSubImage2D(
      gl.TEXTURE_2D, 0, 0, 0, N_MINI, N_MINI, gl.RGBA, gl.FLOAT,
      new Float32Array(N_MINI * N_MINI * 4),
    );

    // Uniform σ field — required by SIM_FRAG even when ghost mode is off.
    const sigField = new Float32Array(N_MINI * N_MINI * 4);
    for (let i = 0; i < N_MINI * N_MINI; i++) sigField[i * 4] = 0.017;
    gl.bindTexture(gl.TEXTURE_2D, sigmaTex);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, N_MINI, N_MINI, gl.RGBA, gl.FLOAT, sigField);

    let swap = 0;
    let time = 0;
    let alive = true;

    const loop = () => {
      if (!alive) return;
      if (playing) {
        time += 0.016;

        // Sim pass — single step per frame at canonical Orbium dt.
        const cur = swap;
        const nxt = 1 - cur;
        gl.useProgram(simProg.program);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, cur === 0 ? stateTex0 : stateTex1);
        gl.uniform1i(simProg.uniforms["u_state"], 0);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, kernelTex);
        gl.uniform1i(simProg.uniforms["u_kernel"], 1);
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, sigmaTex);
        gl.uniform1i(simProg.uniforms["u_sigmaField"], 2);
        gl.uniform1f(simProg.uniforms["u_R"], R);
        gl.uniform1f(simProg.uniforms["u_mu"], 0.15);
        gl.uniform1f(simProg.uniforms["u_sigma"], 0.017);
        gl.uniform1f(simProg.uniforms["u_dt"], 0.1);
        gl.uniform2f(simProg.uniforms["u_res"], N_MINI, N_MINI);
        gl.uniform1f(simProg.uniforms["u_trailDecay"], 0.96);
        gl.uniform1f(simProg.uniforms["u_ghostMode"], 0.0);
        gl.uniform1f(simProg.uniforms["u_seasonMod"], 1.0);
        gl.uniform1f(simProg.uniforms["u_brushActive"], 0.0);
        gl.uniform2f(simProg.uniforms["u_mouse"], 0, 0);
        gl.uniform1f(simProg.uniforms["u_brushSize"], 0);
        gl.uniform1f(simProg.uniforms["u_brushErase"], 0);
        gl.bindFramebuffer(gl.FRAMEBUFFER, nxt === 0 ? stateFB0 : stateFB1);
        gl.viewport(0, 0, N_MINI, N_MINI);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        swap = nxt;

        // Display pass — direct to canvas, Lantern palette.
        const cs = swap;
        gl.useProgram(dispProg.program);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, cs === 0 ? stateTex0 : stateTex1);
        gl.uniform1i(dispProg.uniforms["u_state"], 0);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, memoryTex);
        gl.uniform1i(dispProg.uniforms["u_memory"], 1);
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, sigmaTex);
        gl.uniform1i(dispProg.uniforms["u_sigmaField"], 2);
        gl.uniform1i(dispProg.uniforms["u_palette"], 5); // Lantern
        gl.uniform1i(dispProg.uniforms["u_viewMode"], 0);
        gl.uniform1f(dispProg.uniforms["u_trailMix"], 0.35);
        gl.uniform1f(dispProg.uniforms["u_ghostMode"], 0.0);
        gl.uniform1f(dispProg.uniforms["u_baseSigma"], 0.017);
        gl.uniform1f(dispProg.uniforms["u_time"], time);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, CANVAS, CANVAS);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      alive = false;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      gl.deleteTexture(stateTex0);
      gl.deleteTexture(stateTex1);
      gl.deleteTexture(kernelTex);
      gl.deleteTexture(memoryTex);
      gl.deleteTexture(sigmaTex);
      gl.deleteFramebuffer(stateFB0);
      gl.deleteFramebuffer(stateFB1);
      gl.deleteBuffer(vbo);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(simProg.program);
      gl.deleteProgram(dispProg.program);
    };
  }, [playing]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: "100%",
        height: "100%",
        display: "block",
        imageRendering: "auto",
      }}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  Lenia Expanded preview — Dihypersphaerome rings under spiral advection
//  ─────────────────────────────────────────────────────────────────────────
//  Renders the substrate's signature visual: the four-dimensional
//  Dihypersphaerome ventilans cross-section, slowly rotating through XW/YW
//  /ZW planes, advected by a spiral flow field. Concentric rings of warm
//  gold, electric pink, and cyan that pulse and precess — what makes
//  Lenia Expanded specifically Lenia Expanded.
//
//  Pipeline: HYPER → FLOW → SIM → DISPLAY (no bloom, no composite).
//  The HYPER pass is what writes the rotating 4D cross-section into
//  hyperTex; SIM reads it through u_hyperseed and the 4D channel decays
//  toward it. View mode 3 (4D Projection) renders the violet-spectrum
//  rings directly from channel A.
//
//  Mirrors the parameters from the canonical DV Seed configuration with
//  spiral flow — the visual that defines this substrate on the site.
// ═══════════════════════════════════════════════════════════════════════════

import {
  VERT_SRC as XPND_VERT,
  SIM_FRAG_SRC as XPND_SIM,
  FLOW_FRAG_SRC as XPND_FLOW,
  HYPER_FRAG_SRC as XPND_HYPER,
  DISPLAY_FRAG_SRC as XPND_DISPLAY,
  KS as XPND_KS,
} from "@/components/genesis/lenia-expanded/shaders";
import {
  makeProgram as xpndMakeProgram,
  makeTex as xpndMakeTex,
  makeFB as xpndMakeFB,
} from "@/components/genesis/lenia-expanded/webgl";
import {
  buildKernel as xpndBuildKernel,
} from "@/components/genesis/lenia-expanded/kernel";

/**
 * Build the DV Seed initial state at preview scale: the radial
 * Dihypersphaerome ring written into the 4D channel (alpha). Mirrors the
 * canonical hyperseed ecosystem in `buildEcosystem('hyperseed')`.
 *
 * The β=[1/12, 1/6, 1] vector reflects as three rings of decreasing
 * intensity. We keep two of the three (the outer plus the middle, since
 * the inner is small enough to be invisible at preview scale).
 */
function buildExpandedDVSeedState(Nsize: number): Float32Array {
  const data = new Float32Array(Nsize * Nsize * 4);
  for (let y = 0; y < Nsize; y++) {
    for (let x = 0; x < Nsize; x++) {
      const nx = (x / Nsize - 0.5) * 2.2;
      const ny = (y / Nsize - 0.5) * 2.2;
      const r = Math.sqrt(nx * nx + ny * ny);
      const ring =
        Math.exp(-Math.pow((r - 0.85) / 0.08, 2)) +
        Math.exp(-Math.pow((r - 0.55) / 0.10, 2)) / 6;
      data[(y * Nsize + x) * 4 + 3] = ring;
    }
  }
  return data;
}

export function LeniaExpandedPreview({ playing }: { playing: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const N_MINI = 128;
    const CANVAS = 240;
    canvas.width = CANVAS;
    canvas.height = CANVAS;

    const gl = canvas.getContext("webgl2", {
      antialias: false,
      alpha: false,
      preserveDrawingBuffer: false,
    });
    if (!gl) return;
    if (!gl.getExtension("EXT_color_buffer_float")) return;
    gl.getExtension("OES_texture_float_linear");

    const simProg = xpndMakeProgram(gl, XPND_VERT, XPND_SIM);
    const flowProg = xpndMakeProgram(gl, XPND_VERT, XPND_FLOW);
    const hyperProg = xpndMakeProgram(gl, XPND_VERT, XPND_HYPER);
    const dispProg = xpndMakeProgram(gl, XPND_VERT, XPND_DISPLAY);
    if (!simProg || !flowProg || !hyperProg || !dispProg) return;

    const vao = gl.createVertexArray();
    const vbo = gl.createBuffer();
    if (!vao || !vbo) return;
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );
    for (const prog of [simProg, flowProg, hyperProg, dispProg]) {
      const loc = gl.getAttribLocation(prog.program, "a_pos");
      if (loc >= 0) {
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      }
    }

    // Two state ping-pongs (RGBA32F: prey, predator, morphogen, 4D).
    const stateTex0 = xpndMakeTex(gl, N_MINI, N_MINI, gl.RGBA32F, gl.RGBA, gl.FLOAT, gl.NEAREST, null);
    const stateTex1 = xpndMakeTex(gl, N_MINI, N_MINI, gl.RGBA32F, gl.RGBA, gl.FLOAT, gl.NEAREST, null);
    // Single flow texture — flow is rebuilt every frame BEFORE sim reads
    // it, so no read-while-write conflict and no need for ping-pong.
    const flowTex = xpndMakeTex(gl, N_MINI, N_MINI, gl.RGBA32F, gl.RGBA, gl.FLOAT, gl.LINEAR, null);
    // Three kernels for the three channels.
    const kernelTex0 = xpndMakeTex(gl, XPND_KS, XPND_KS, gl.RGBA32F, gl.RGBA, gl.FLOAT, gl.NEAREST, null);
    const kernelTex1 = xpndMakeTex(gl, XPND_KS, XPND_KS, gl.RGBA32F, gl.RGBA, gl.FLOAT, gl.NEAREST, null);
    const kernelTex2 = xpndMakeTex(gl, XPND_KS, XPND_KS, gl.RGBA32F, gl.RGBA, gl.FLOAT, gl.NEAREST, null);
    // Hyperseed texture — written by HYPER pass, read by SIM pass via
    // u_hyperseed. This is the live 2D cross-section of the rotating 4D
    // Dihypersphaerome.
    const hyperTex = xpndMakeTex(gl, N_MINI, N_MINI, gl.RGBA32F, gl.RGBA, gl.FLOAT, gl.LINEAR, null);

    if (
      !stateTex0 || !stateTex1 || !flowTex ||
      !kernelTex0 || !kernelTex1 || !kernelTex2 || !hyperTex
    ) return;

    const stateFB0 = xpndMakeFB(gl, stateTex0);
    const stateFB1 = xpndMakeFB(gl, stateTex1);
    const flowFB = xpndMakeFB(gl, flowTex);
    const hyperFB = xpndMakeFB(gl, hyperTex);
    if (!stateFB0 || !stateFB1 || !flowFB || !hyperFB) return;

    // Initial state: DV Seed — the radial Dihypersphaerome ring written
    // into the 4D channel. Prey and predator emerge from this seed via
    // hyperMix coupling and cross-coupling growth dynamics.
    const initData = buildExpandedDVSeedState(N_MINI);
    gl.bindTexture(gl.TEXTURE_2D, stateTex0);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, N_MINI, N_MINI, gl.RGBA, gl.FLOAT, initData);

    // Kernels at the screencast's R values. Prey at R=5 (very small
    // creatures, fits the wispy spiraling rings), predator at R=22, but
    // we cap predator at 22 since it's the edge of usable range, and the
    // morphogen at R=14.
    gl.bindTexture(gl.TEXTURE_2D, kernelTex0);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, XPND_KS, XPND_KS, gl.RGBA, gl.FLOAT, xpndBuildKernel(5, [1]));
    gl.bindTexture(gl.TEXTURE_2D, kernelTex1);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, XPND_KS, XPND_KS, gl.RGBA, gl.FLOAT, xpndBuildKernel(22, [1 / 3, 2 / 3, 1]));
    gl.bindTexture(gl.TEXTURE_2D, kernelTex2);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, XPND_KS, XPND_KS, gl.RGBA, gl.FLOAT, xpndBuildKernel(14, [1, 0.5, 0.1]));

    // Initialize hyperTex to zero — first frame's HYPER pass will fill it.
    gl.bindTexture(gl.TEXTURE_2D, hyperTex);
    gl.texSubImage2D(
      gl.TEXTURE_2D, 0, 0, 0, N_MINI, N_MINI, gl.RGBA, gl.FLOAT,
      new Float32Array(N_MINI * N_MINI * 4),
    );

    // Initial flow texture — 0.5 = zero velocity (SIM unpacks via
    // (flow - 0.5) * 2). Without this the first sim step reads garbage.
    const flowInit = new Float32Array(N_MINI * N_MINI * 4);
    for (let i = 0; i < N_MINI * N_MINI; i++) {
      flowInit[i * 4] = 0.5;
      flowInit[i * 4 + 1] = 0.5;
      flowInit[i * 4 + 2] = 0.5;
      flowInit[i * 4 + 3] = 1.0;
    }
    gl.bindTexture(gl.TEXTURE_2D, flowTex);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, N_MINI, N_MINI, gl.RGBA, gl.FLOAT, flowInit);

    let swap = 0;
    let time = 0;
    let alive = true;

    // Accumulated 4D rotation angles. ZW is the "breathing" rotation
    // that drives the ventilans pulse; XW and YW slowly precess the
    // cross-section's orientation. Same shape as the full substrate's
    // rotRef but locally scoped.
    const rot = { xw: 0, yw: 0, zw: 0 };

    const loop = () => {
      if (!alive) return;
      if (playing) {
        time += 0.016;
        rot.xw += 0.05 * 0.016;
        rot.yw += 0.07 * 0.016;
        rot.zw += 0.18 * 0.016;

        // ── 1. HYPER pass: rotating 4D cross-section into hyperTex ──
        // This is the source of the rings. The 2D shadow of the rotating
        // Dihypersphaerome gets written to hyperTex; SIM reads it as the
        // u_hyperseed seed material.
        gl.useProgram(hyperProg.program);
        gl.uniform1f(hyperProg.u["u_time"], time);
        gl.uniform1f(hyperProg.u["u_wSlice"], Math.sin(time * 0.5) * 0.3);
        gl.uniform1f(hyperProg.u["u_rotXW"], rot.xw);
        gl.uniform1f(hyperProg.u["u_rotYW"], rot.yw);
        gl.uniform1f(hyperProg.u["u_rotZW"], rot.zw);
        gl.uniform1f(hyperProg.u["u_R4D"], 0.85);
        gl.uniform1f(hyperProg.u["u_mu4D"], 0.18);
        gl.uniform1f(hyperProg.u["u_sigma4D"], 0.033);
        // u_prev4D is declared but the shader doesn't actually read from
        // it in the analytical implementation — bind state for safety.
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, swap === 0 ? stateTex0 : stateTex1);
        gl.uniform1i(hyperProg.u["u_prev4D"], 0);
        gl.bindFramebuffer(gl.FRAMEBUFFER, hyperFB);
        gl.viewport(0, 0, N_MINI, N_MINI);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        // ── 2. FLOW pass: spiral velocity from current state ──
        // Spiral mode (u_flowMode=2) creates the swirling precession
        // visible in the screencast — the rings don't just pulse, they
        // rotate.
        gl.useProgram(flowProg.program);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, swap === 0 ? stateTex0 : stateTex1);
        gl.uniform1i(flowProg.u["u_state"], 0);
        gl.uniform2f(flowProg.u["u_res"], N_MINI, N_MINI);
        gl.uniform1f(flowProg.u["u_time"], time);
        gl.uniform1f(flowProg.u["u_flowMode"], 2); // spiral
        gl.bindFramebuffer(gl.FRAMEBUFFER, flowFB);
        gl.viewport(0, 0, N_MINI, N_MINI);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        // ── 3. SIM pass: four-channel integrator ──
        const cur = swap;
        const nxt = 1 - cur;
        gl.useProgram(simProg.program);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, cur === 0 ? stateTex0 : stateTex1);
        gl.uniform1i(simProg.u["u_state"], 0);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, kernelTex0);
        gl.uniform1i(simProg.u["u_kernel0"], 1);
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, kernelTex1);
        gl.uniform1i(simProg.u["u_kernel1"], 2);
        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, kernelTex2);
        gl.uniform1i(simProg.u["u_kernel2"], 3);
        gl.activeTexture(gl.TEXTURE4);
        gl.bindTexture(gl.TEXTURE_2D, flowTex);
        gl.uniform1i(simProg.u["u_flow"], 4);
        gl.activeTexture(gl.TEXTURE5);
        gl.bindTexture(gl.TEXTURE_2D, hyperTex);
        gl.uniform1i(simProg.u["u_hyperseed"], 5);

        // Channel parameters — DV Seed configuration from the screencast.
        // Small prey kernel (R=5) creates fine wispy structure;
        // big predator kernel (R=22) defines the wide outer rings.
        gl.uniform1f(simProg.u["u_R0"], 5);
        gl.uniform1f(simProg.u["u_R1"], 22);
        gl.uniform1f(simProg.u["u_R2"], 14);
        gl.uniform1f(simProg.u["u_mu0"], 0.05);
        gl.uniform1f(simProg.u["u_mu1"], 0.133);
        gl.uniform1f(simProg.u["u_mu2"], 0.15);
        gl.uniform1f(simProg.u["u_sigma0"], 0.05);
        gl.uniform1f(simProg.u["u_sigma1"], 0.044);
        gl.uniform1f(simProg.u["u_sigma2"], 0.028);
        gl.uniform1f(simProg.u["u_dt"], 0.2);
        gl.uniform2f(simProg.u["u_res"], N_MINI, N_MINI);

        // Cross-coupling — same as screencast.
        gl.uniform1f(simProg.u["u_c01"], 0.35);
        gl.uniform1f(simProg.u["u_c10"], 0.4);
        gl.uniform1f(simProg.u["u_c20"], 0.2);
        gl.uniform1f(simProg.u["u_c21"], 0.15);
        gl.uniform1f(simProg.u["u_c02"], 0.08);
        gl.uniform1f(simProg.u["u_c12"], 0.04);

        // 4D coupling — hyperAmp drives the 4D channel toward the
        // hyperseed; hyperMix bleeds 4D into prey. Both load-bearing
        // for the visible ring structure.
        gl.uniform1f(simProg.u["u_hyperAmp"], 0.65);
        gl.uniform1f(simProg.u["u_hyperMix"], 0.12);
        gl.uniform1f(simProg.u["u_flowStr"], 3.5);
        gl.uniform1f(simProg.u["u_time"], time);

        // No brush in preview.
        gl.uniform1f(simProg.u["u_brushActive"], 0);
        gl.uniform2f(simProg.u["u_mouse"], 0, 0);
        gl.uniform1f(simProg.u["u_brushSize"], 0);
        gl.uniform1f(simProg.u["u_brushErase"], 0);
        gl.uniform1f(simProg.u["u_brushChan"], 0);

        gl.bindFramebuffer(gl.FRAMEBUFFER, nxt === 0 ? stateFB0 : stateFB1);
        gl.viewport(0, 0, N_MINI, N_MINI);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        swap = nxt;

        // ── 4. DISPLAY pass: 4D Projection view ──
        // viewMode=3 renders the 4D channel as violet/cyan/pink rings.
        // This is what makes the preview visually distinctive vs.
        // ordinary Lenia — readers see immediately that this substrate
        // has a fourth-dimensional component leaking through.
        const cs = swap;
        gl.useProgram(dispProg.program);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, cs === 0 ? stateTex0 : stateTex1);
        gl.uniform1i(dispProg.u["u_state"], 0);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, flowTex);
        gl.uniform1i(dispProg.u["u_flow"], 1);
        gl.uniform1i(dispProg.u["u_viewMode"], 3); // 4D Projection
        gl.uniform1f(dispProg.u["u_time"], time);
        gl.uniform1i(dispProg.u["u_palette"], 0);
        gl.uniform1f(dispProg.u["u_trailMix"], 0);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, CANVAS, CANVAS);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      alive = false;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      gl.deleteTexture(stateTex0);
      gl.deleteTexture(stateTex1);
      gl.deleteTexture(flowTex);
      gl.deleteTexture(hyperTex);
      gl.deleteTexture(kernelTex0);
      gl.deleteTexture(kernelTex1);
      gl.deleteTexture(kernelTex2);
      gl.deleteFramebuffer(stateFB0);
      gl.deleteFramebuffer(stateFB1);
      gl.deleteFramebuffer(flowFB);
      gl.deleteFramebuffer(hyperFB);
      gl.deleteBuffer(vbo);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(simProg.program);
      gl.deleteProgram(flowProg.program);
      gl.deleteProgram(hyperProg.program);
      gl.deleteProgram(dispProg.program);
    };
  }, [playing]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: "100%",
        height: "100%",
        display: "block",
        imageRendering: "auto",
      }}
    />
  );
}

// ───────────────────────────────────────────────────────────────────────────
//  Filter preview — animated SVG mini-phase-plot (v14·2 redesign)
//  ─────────────────────────────────────────────────────────────────────────
//  Animates the load-bearing argument of the paper across a 9-second cycle:
//
//    1. L_R draws in (ghost-cyan, slope 1)        — what light allows
//    2. L_E draws in (amber, slope 0.5)           — what heat allows
//    3. The cusp τ* materializes at intersection
//    4. Composed envelope L_env = min(L_R, L_E) traces in ink;
//       teeth fade to dashed reference lines
//    5. Forbidden region above the envelope shades sanguine
//    6. Agent token climbs at low τ toward galactic extent, hits the
//       L_R wall, and breaches — color flips to sanguine, breach
//       marker remains
//    7. Brief rest, then loop
//
//  When `playing` is false (parent toggle off, card off-screen, or
//  reduced-motion) the preview locks to phase 1 — a still-life of all
//  elements composed: faded teeth, ink envelope, cusp marker, sanguine
//  forbidden zone, breach marker, agent token at top in sanguine. Reads
//  as "this is the wall, an agent tried to cross it, it didn't."
//
//  Self-contained: defines its own FILTER_COLOR and FILTER_FONT so it
//  doesn't require amber/sanguine to be added to the file-level COLOR.
// ───────────────────────────────────────────────────────────────────────────

const FILTER_COLOR = {
  void:         "#010106",
  voidSoft:     "#0a0f1a",
  inkVeil:      "#1f2839",
  inkGhost:     "#3a4560",
  inkFaint:     "#5a6780",
  inkMuted:     "#8a9bba",
  inkBody:      "#c8cfe0",
  ink:          "#f4f6fb",
  ghost:        "#7fafb3",
  amber:        "#c9a66b",
  amberSoft:    "#9a7e4f",
  sanguine:     "#9a2b2b",
  sanguineWash: "#c9817a",
} as const;

const FILTER_FONT = {
  mono: "var(--font-mono), 'JetBrains Mono', monospace",
} as const;

export function FilterPreview({ playing }: { playing: boolean }) {
  // Animation phase 0..1, cycles. Locked to 1 when paused (final still-life).
  const [phase, setPhase] = useState<number>(playing ? 0 : 1);

  useEffect(() => {
    if (!playing) {
      setPhase(1);
      return;
    }
    let raf = 0;
    let start: number | null = null;
    const cycleMs = 9000; // one full draw cycle
    const restMs  = 1800; // rest at end before reset
    const total   = cycleMs + restMs;

    const loop = (now: number) => {
      if (start === null) start = now;
      const elapsed = (now - start) % total;
      setPhase(elapsed < cycleMs ? elapsed / cycleMs : 1);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  // ── Plot geometry ─────────────────────────────────────────────────
  const W = 800;
  const H = 500;
  const mL = 64, mR = 28, mT = 48, mB = 56;
  const pW = W - mL - mR;
  const pH = H - mT - mB;

  // (logτ, logL) → screen
  const tauMin = 0, tauMax = 6;
  const Lmin   = -1, Lmax = 6;
  const tx = (logTau: number) =>
    mL + ((logTau - tauMin) / (tauMax - tauMin)) * pW;
  const ty = (logL: number) =>
    mT + (1 - (logL - Lmin) / (Lmax - Lmin)) * pH;

  // Teeth — chosen to cross at (logτ=3, logL=2.5).
  // L_R: linear slope 1; L_E: slope 0.5. Both monotone.
  const LR   = (logTau: number) => logTau - 0.5;
  const LE   = (logTau: number) => 0.5 * logTau + 1;
  const LEnv = (logTau: number) => Math.min(LR(logTau), LE(logTau));

  // ── Phase ramps ──────────────────────────────────────────────────
  const ramp = (start: number, end: number, p: number) =>
    Math.max(0, Math.min(1, (p - start) / (end - start)));

  const fLR     = ramp(0.00, 0.20, phase);
  const fLE     = ramp(0.15, 0.35, phase);
  const fCusp   = ramp(0.32, 0.42, phase);
  const fEnv    = ramp(0.42, 0.55, phase);
  const fForbid = ramp(0.52, 0.66, phase);
  const fAgent  = ramp(0.66, 0.92, phase);

  // ── Sample teeth for path generation ─────────────────────────────
  const N = 80;
  const sLR:  Array<[number, number]> = [];
  const sLE:  Array<[number, number]> = [];
  const sEnv: Array<[number, number]> = [];
  for (let i = 0; i <= N; i++) {
    const lt = tauMin + (i / N) * (tauMax - tauMin);
    sLR.push([lt, LR(lt)]);
    sLE.push([lt, LE(lt)]);
    sEnv.push([lt, LEnv(lt)]);
  }

  const partialPath = (
    samples: Array<[number, number]>,
    frac: number,
  ): string => {
    if (frac <= 0) return "";
    const cutoff = Math.max(2, Math.ceil(samples.length * frac));
    return (
      "M " +
      samples
        .slice(0, cutoff)
        .map(([t, l]) => `${tx(t).toFixed(1)},${ty(l).toFixed(1)}`)
        .join(" L ")
    );
  };

  const pathLR = partialPath(sLR, fLR);
  const pathLE = partialPath(sLE, fLE);
  const pathEnv =
    fEnv > 0
      ? "M " +
        sEnv
          .map(([t, l]) => `${tx(t).toFixed(1)},${ty(l).toFixed(1)}`)
          .join(" L ")
      : "";

  // Forbidden region polygon (above the envelope, capped at top of plot)
  const forbidPath = (() => {
    if (fForbid <= 0) return "";
    const topLeft  = `${tx(tauMin).toFixed(1)},${ty(Lmax).toFixed(1)}`;
    const topRight = `${tx(tauMax).toFixed(1)},${ty(Lmax).toFixed(1)}`;
    const envRev   = sEnv
      .slice()
      .reverse()
      .map(([t, l]) => `${tx(t).toFixed(1)},${ty(l).toFixed(1)}`)
      .join(" L ");
    return `M ${topLeft} L ${topRight} L ${envRev} Z`;
  })();

  // ── Agent — vertical climb at fixed low τ, breaches the L_R wall ──
  const agentLogTau = 1.0;
  const agentX      = tx(agentLogTau);
  const agentEnvL   = LEnv(agentLogTau); // = LR(1) = 0.5
  const agentEnvY   = ty(agentEnvL);
  const agentStartL = -0.5;
  const agentEndL   = 5.0;
  const agentLogL   = agentStartL + fAgent * (agentEndL - agentStartL);
  const agentY      = ty(agentLogL);
  const trailY0     = ty(agentStartL);
  const breached    = agentLogL > agentEnvL;

  // Cusp coords
  const cuspX = tx(3);
  const cuspY = ty(2.5);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      style={{
        width: "100%",
        height: "100%",
        display: "block",
        background: FILTER_COLOR.voidSoft,
      }}
    >
      <defs>
        <pattern
          id="fp-forbid-hatch"
          width="7" height="7"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(42)"
        >
          <line
            x1="0" y1="0" x2="0" y2="7"
            stroke={FILTER_COLOR.sanguineWash}
            strokeOpacity="0.18"
            strokeWidth="0.7"
          />
        </pattern>
      </defs>

      {/* Decade gridlines */}
      <g stroke={FILTER_COLOR.inkVeil} strokeOpacity="0.65" strokeWidth="0.5">
        {Array.from({ length: tauMax - tauMin + 1 }).map((_, i) => {
          const x = tx(tauMin + i);
          return (
            <line key={`vl-${i}`} x1={x} y1={mT} x2={x} y2={mT + pH} />
          );
        })}
        {Array.from({ length: Lmax - Lmin + 1 }).map((_, i) => {
          const y = ty(Lmin + i);
          return (
            <line key={`hl-${i}`} x1={mL} y1={y} x2={mL + pW} y2={y} />
          );
        })}
      </g>

      {/* Axes */}
      <line
        x1={mL} y1={mT} x2={mL} y2={mT + pH}
        stroke={FILTER_COLOR.inkGhost} strokeWidth="1"
      />
      <line
        x1={mL} y1={mT + pH} x2={mL + pW} y2={mT + pH}
        stroke={FILTER_COLOR.inkGhost} strokeWidth="1"
      />

      {/* Axis labels */}
      <text
        x={mL + pW / 2} y={H - 16}
        textAnchor="middle"
        fontFamily={FILTER_FONT.mono}
        fontSize="11"
        fill={FILTER_COLOR.inkFaint}
        letterSpacing="0.18em"
      >
        log τ
      </text>
      <text
        x={20} y={mT + pH / 2}
        textAnchor="middle"
        transform={`rotate(-90, 20, ${mT + pH / 2})`}
        fontFamily={FILTER_FONT.mono}
        fontSize="11"
        fill={FILTER_COLOR.inkFaint}
        letterSpacing="0.18em"
      >
        log L
      </text>

      {/* Title strip — appears across all phases */}
      <text
        x={mL} y={mT - 18}
        fontFamily={FILTER_FONT.mono}
        fontSize="10"
        fill={FILTER_COLOR.inkFaint}
        letterSpacing="0.32em"
      >
        THE COORDINATION CEILING
      </text>
      <text
        x={mL + pW} y={mT - 18}
        textAnchor="end"
        fontFamily={FILTER_FONT.mono}
        fontSize="10"
        fill={FILTER_COLOR.inkFaint}
        letterSpacing="0.18em"
      >
        L vs τ
      </text>

      {/* Forbidden region (sanguine wash + diagonal hatch) */}
      {fForbid > 0 && (
        <>
          <path
            d={forbidPath}
            fill={FILTER_COLOR.sanguine}
            fillOpacity={0.07 * fForbid}
          />
          <path
            d={forbidPath}
            fill="url(#fp-forbid-hatch)"
            fillOpacity={fForbid}
          />
        </>
      )}

      {/* L_E tooth (amber) — fades to dashed reference once envelope appears */}
      {fLE > 0 && (
        <path
          d={pathLE}
          fill="none"
          stroke={FILTER_COLOR.amber}
          strokeOpacity={fEnv > 0 ? 0.45 : 0.85}
          strokeWidth={fEnv > 0 ? 1.4 : 1.8}
          strokeDasharray={fEnv > 0 ? "4 3" : undefined}
          strokeLinecap="round"
        />
      )}

      {/* L_R tooth (ghost-cyan) — same fade-to-reference treatment */}
      {fLR > 0 && (
        <path
          d={pathLR}
          fill="none"
          stroke={FILTER_COLOR.ghost}
          strokeOpacity={fEnv > 0 ? 0.45 : 0.85}
          strokeWidth={fEnv > 0 ? 1.4 : 1.8}
          strokeDasharray={fEnv > 0 ? "4 3" : undefined}
          strokeLinecap="round"
        />
      )}

      {/* Composed envelope (ink) — the resultant law */}
      {fEnv > 0 && (
        <path
          d={pathEnv}
          fill="none"
          stroke={FILTER_COLOR.ink}
          strokeOpacity={0.95 * fEnv}
          strokeWidth="2.4"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}

      {/* Cusp marker — small amber crosshair with τ* label */}
      {fCusp > 0 && (
        <g opacity={fCusp}>
          <circle
            cx={cuspX} cy={cuspY} r="11"
            fill="none"
            stroke={FILTER_COLOR.amber}
            strokeWidth="0.7"
            strokeOpacity="0.5"
          />
          <circle
            cx={cuspX} cy={cuspY} r="4.5"
            fill={FILTER_COLOR.void}
            stroke={FILTER_COLOR.amber}
            strokeWidth="1.6"
          />
          <text
            x={cuspX + 14} y={cuspY - 8}
            fontFamily={FILTER_FONT.mono}
            fontSize="11"
            fill={FILTER_COLOR.amber}
            letterSpacing="0.1em"
          >
            τ*
          </text>
        </g>
      )}

      {/* Agent — vertical climb at fixed τ, hits the L_R wall, breaches */}
      {fAgent > 0 && (
        <g>
          {/* Trail behind the climbing agent */}
          <line
            x1={agentX} y1={trailY0}
            x2={agentX} y2={agentY}
            stroke={breached ? FILTER_COLOR.sanguineWash : FILTER_COLOR.ghost}
            strokeOpacity="0.55"
            strokeWidth="1.4"
            strokeDasharray="2 3"
          />
          {/* Breach marker — appears once the agent crosses the wall */}
          {breached && (
            <>
              <line
                x1={agentX - 16} y1={agentEnvY}
                x2={agentX + 16} y2={agentEnvY}
                stroke={FILTER_COLOR.sanguine}
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <circle
                cx={agentX} cy={agentEnvY} r="14"
                fill="none"
                stroke={FILTER_COLOR.sanguine}
                strokeWidth="1"
                strokeOpacity="0.55"
              />
            </>
          )}
          {/* Agent token */}
          <circle
            cx={agentX} cy={agentY} r="6.5"
            fill={FILTER_COLOR.void}
            stroke={breached ? FILTER_COLOR.sanguine : FILTER_COLOR.ghost}
            strokeWidth="2.3"
          />
        </g>
      )}
    </svg>
  );
}
