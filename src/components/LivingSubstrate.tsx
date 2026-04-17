"use client";

import { useEffect, useRef } from "react";

// ═══════════════════════════════════════════════════════════════════════════
// SHADERS
// ═══════════════════════════════════════════════════════════════════════════

const VERT = /* glsl */ `#version 300 es
in vec2 a_pos;
out vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

const FIELD_FRAG = /* glsl */ `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform float u_time;
uniform vec2  u_mouse;
uniform float u_scroll;
uniform vec2  u_res;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i),                     hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)),    hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 rot = mat2(0.80, -0.60, 0.60, 0.80);
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = rot * p * 2.0;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv     = v_uv;
  float aspect = u_res.x / u_res.y;
  vec2 p      = (uv - 0.5) * vec2(aspect, 1.0) * 2.0;

  float t = u_time * 0.014;

  // Cursor gravity — bends the coordinate space toward the pointer.
  vec2 md    = (uv - u_mouse) * vec2(aspect, 1.0);
  float mdist = length(md);
  float mbend = exp(-mdist * 2.6) * 0.42;
  p += md * mbend;

  // Scroll descent.
  float sy = u_scroll * 0.00020;

  // Two-level domain warp.
  vec2 q;
  q.x = fbm(p + vec2(0.0, t));
  q.y = fbm(p + vec2(5.2, 1.3 + t));

  vec2 r;
  r.x = fbm(p + 3.8 * q + vec2(1.7, 9.2 + t * 0.6));
  r.y = fbm(p + 3.8 * q + vec2(8.3, 2.8 + t * 0.6 - sy));

  float f = fbm(p + 4.0 * r + vec2(t * 0.25, -sy));

  // Brightness attractor at cursor.
  float mfall = exp(-dot(md, md) * 5.0);
  f += mfall * 0.14;

  // Breath cycle (~45s).
  float breath = 0.85 + 0.15 * sin(u_time * 0.14);
  f *= breath;

  // Response curve — most of the field dim, peaks carry the light.
  f = pow(clamp(f, 0.0, 1.0), 1.65);

  // Palette — ghost-cyan, deep void.
  vec3 ghost     = vec3(0.498, 0.686, 0.702);  // #7fafb3
  vec3 ghostSoft = vec3(0.412, 0.592, 0.608);
  vec3 deep      = vec3(0.008, 0.010, 0.035);

  // Base drift from deep void to dimmed ghost.
  vec3 col = mix(deep, ghostSoft * 0.95, f * 0.78);

  // Sparse filaments — brightest 30% of samples carry the accent highlights.
  float filament = smoothstep(0.58, 0.82, f) * 0.55;
  col += ghost * filament;

  // Internal vignette.
  vec2 vc = uv - 0.5;
  float vig = 1.0 - dot(vc, vc) * 1.25;
  col *= clamp(vig, 0.0, 1.0);

  // Hard brightness cap — substrate can never exceed this value.
  // Contract with the foreground text. Tune this one line if you want
  // the whole substrate louder or quieter.
  col = min(col, vec3(0.28));

  fragColor = vec4(col, 1.0);
}`;

const BLOOM_FRAG = /* glsl */ `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform sampler2D u_input;
uniform vec2      u_dir;
uniform vec2      u_res;
uniform float     u_extract;

void main() {
  vec2 px = 1.0 / u_res;
  float w0 = 0.227027;
  float w[4];
  w[0] = 0.1945946;
  w[1] = 0.1216216;
  w[2] = 0.054054;
  w[3] = 0.016216;

  vec3 sum = texture(u_input, v_uv).rgb * w0;
  for (int i = 0; i < 4; i++) {
    vec2 off = u_dir * px * float(i + 1) * 1.8;
    sum += texture(u_input, v_uv + off).rgb * w[i];
    sum += texture(u_input, v_uv - off).rgb * w[i];
  }

  if (u_extract > 0.5) {
    float lum = dot(sum, vec3(0.299, 0.587, 0.114));
    sum *= smoothstep(0.12, 0.22, lum);
  }

  fragColor = vec4(sum, 1.0);
}`;

const COMPOSITE_FRAG = /* glsl */ `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform sampler2D u_scene;
uniform sampler2D u_bloom;

void main() {
  vec3 scene = texture(u_scene, v_uv).rgb;
  vec3 bloom = texture(u_bloom, v_uv).rgb;

  vec3 col = scene + bloom * 0.45;

  // Soft Reinhard then an absolute cap.
  col = col / (col + vec3(1.0));
  col = min(col, vec3(0.32));

  fragColor = vec4(col, 1.0);
}`;

// ═══════════════════════════════════════════════════════════════════════════
// WEBGL HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const s = gl.createShader(type);
  if (!s) return null;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error("[LivingSubstrate] shader compile:", gl.getShaderInfoLog(s));
    gl.deleteShader(s);
    return null;
  }
  return s;
}

function program(gl: WebGL2RenderingContext, vs: string, fs: string) {
  const v = compile(gl, gl.VERTEX_SHADER, vs);
  const f = compile(gl, gl.FRAGMENT_SHADER, fs);
  if (!v || !f) return null;
  const p = gl.createProgram();
  if (!p) return null;
  gl.attachShader(p, v);
  gl.attachShader(p, f);
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    console.error("[LivingSubstrate] program link:", gl.getProgramInfoLog(p));
    return null;
  }
  const u: Record<string, WebGLUniformLocation | null> = {};
  const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS) as number;
  for (let i = 0; i < n; i++) {
    const info = gl.getActiveUniform(p, i);
    if (!info) continue;
    u[info.name] = gl.getUniformLocation(p, info.name);
  }
  return { program: p, uniforms: u };
}

/**
 * Standard RGBA8 render target. No HDR extension required — works on every
 * WebGL2 implementation. The substrate caps at 0.32 brightness so 8 bits
 * of precision is plenty (no banding visible at that dim).
 */
function makeFBO(gl: WebGL2RenderingContext, w: number, h: number) {
  const tex = gl.createTexture();
  if (!tex) return null;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    w,
    h,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    null
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const fbo = gl.createFramebuffer();
  if (!fbo) return null;
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    tex,
    0
  );

  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  if (status !== gl.FRAMEBUFFER_COMPLETE) {
    console.error(
      "[LivingSubstrate] framebuffer incomplete:",
      status.toString(16)
    );
    return null;
  }

  return { fbo, tex };
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function LivingSubstrate() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseTarget = useRef<[number, number]>([0.5, 0.5]);
  const mouseCurrent = useRef<[number, number]>([0.5, 0.5]);
  const scrollY = useRef(0);
  const paused = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: false,
      premultipliedAlpha: false,
      powerPreference: "low-power",
    });
    if (!gl) return;

    // ───── Resize ─────
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 1.5);
      canvas.width = Math.max(2, Math.floor(window.innerWidth * dpr * 0.5));
      canvas.height = Math.max(2, Math.floor(window.innerHeight * dpr * 0.5));
    };
    resize();
    window.addEventListener("resize", resize);

    // ───── Programs ─────
    const field = program(gl, VERT, FIELD_FRAG);
    const bloom = program(gl, VERT, BLOOM_FRAG);
    const comp = program(gl, VERT, COMPOSITE_FRAG);
    if (!field || !bloom || !comp) {
      console.error("[LivingSubstrate] program compilation failed");
      return;
    }

    // ───── Fullscreen quad ─────
    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );

    const bindQuad = (prog: { program: WebGLProgram }) => {
      const loc = gl.getAttribLocation(prog.program, "a_pos");
      gl.enableVertexAttribArray(loc);
      gl.bindBuffer(gl.ARRAY_BUFFER, quad);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    };

    // ───── FBOs ─────
    const sceneFBO = makeFBO(gl, canvas.width, canvas.height);
    const bloomFBO1 = makeFBO(
      gl,
      Math.max(2, Math.floor(canvas.width / 2)),
      Math.max(2, Math.floor(canvas.height / 2))
    );
    const bloomFBO2 = makeFBO(
      gl,
      Math.max(2, Math.floor(canvas.width / 2)),
      Math.max(2, Math.floor(canvas.height / 2))
    );
    if (!sceneFBO || !bloomFBO1 || !bloomFBO2) {
      console.error("[LivingSubstrate] framebuffer creation failed");
      return;
    }

    // ───── Events ─────
    const onMove = (e: MouseEvent) => {
      mouseTarget.current = [
        e.clientX / window.innerWidth,
        e.clientY / window.innerHeight,
      ];
    };
    window.addEventListener("mousemove", onMove, { passive: true });

    const onScroll = () => {
      scrollY.current = window.scrollY;
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    const onVis = () => {
      paused.current = document.hidden;
    };
    document.addEventListener("visibilitychange", onVis);

    // ───── Render loop ─────
    let raf = 0;
    const start = performance.now();

    const loop = () => {
      if (paused.current) {
        raf = requestAnimationFrame(loop);
        return;
      }

      const [tx, ty] = mouseTarget.current;
      const [cx, cy] = mouseCurrent.current;
      mouseCurrent.current = [
        cx + (tx - cx) * 0.028,
        cy + (ty - cy) * 0.028,
      ];

      const t = (performance.now() - start) / 1000;
      const w = canvas.width;
      const h = canvas.height;
      const bw = Math.max(2, Math.floor(w / 2));
      const bh = Math.max(2, Math.floor(h / 2));

      // Pass 1: field
      gl.bindFramebuffer(gl.FRAMEBUFFER, sceneFBO.fbo);
      gl.viewport(0, 0, w, h);
      gl.useProgram(field.program);
      bindQuad(field);
      gl.uniform1f(field.uniforms.u_time, t);
      gl.uniform2f(
        field.uniforms.u_mouse,
        mouseCurrent.current[0],
        1 - mouseCurrent.current[1]
      );
      gl.uniform1f(field.uniforms.u_scroll, scrollY.current);
      gl.uniform2f(field.uniforms.u_res, w, h);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      // Pass 2: bloom horizontal extract
      gl.bindFramebuffer(gl.FRAMEBUFFER, bloomFBO1.fbo);
      gl.viewport(0, 0, bw, bh);
      gl.useProgram(bloom.program);
      bindQuad(bloom);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, sceneFBO.tex);
      gl.uniform1i(bloom.uniforms.u_input, 0);
      gl.uniform2f(bloom.uniforms.u_dir, 1, 0);
      gl.uniform2f(bloom.uniforms.u_res, bw, bh);
      gl.uniform1f(bloom.uniforms.u_extract, 1);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      // Pass 3: bloom vertical
      gl.bindFramebuffer(gl.FRAMEBUFFER, bloomFBO2.fbo);
      gl.bindTexture(gl.TEXTURE_2D, bloomFBO1.tex);
      gl.uniform2f(bloom.uniforms.u_dir, 0, 1);
      gl.uniform1f(bloom.uniforms.u_extract, 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      // Pass 4: composite
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, w, h);
      gl.useProgram(comp.program);
      bindQuad(comp);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, sceneFBO.tex);
      gl.uniform1i(comp.uniforms.u_scene, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, bloomFBO2.tex);
      gl.uniform1i(comp.uniforms.u_bloom, 1);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 0,
        pointerEvents: "none",
        background: "#010106",
      }}
    />
  );
}
