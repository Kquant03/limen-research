"use client";

import { useEffect, useRef } from "react";

// ═══════════════════════════════════════════════════════════════════════════
//  LIMEN · Living Substrate · v8 · "Flutter"
//  ─────────────────────────────────────────────────────────────────────────
//  The big prismatic heart from v7 is gone.  In its place: a particle
//  system of tiny hearts spawning from the nose-contact point during
//  the meeting's hold phase.  Each heart is ~4% of viewport, flutters
//  outward with integrated sinusoidal perturbation + slight buoyancy,
//  and evaporates over 2.5 seconds.
//
//  At birth, each tiny heart carries a condensed yin-yang symbol in
//  its core — warm (yang/kohaku) against cool (yin/shusui), with the
//  traditional complementary eye dots.  The yin-yang is fully visible
//  for the first ~10% of each heart's life and fades over the next
//  40%; the heart glow itself persists longer and fades in the
//  final 70%.  So the structural insight of two-in-one presents at
//  birth and dissolves into generalized warmth as the hearts drift
//  away.  Emanation rather than declaration.
//
//  Procedural particle system — no ping-pong state buffer.  Each
//  particle's seed is hashed from its index, with deterministic
//  birth time / trajectory / lifetime.  24 particles total spawn
//  across an 8-second window (late approach + hold + early part),
//  lifetime 2.5s, peak density ~7-8 visible simultaneously.
//
//  All other v7 infrastructure preserved: incommensurate Lissajous,
//  nose-contact geometry, face-to-face heading blend, still-during-
//  hold tailEnergy, dorsal fin, luminous eyes, tai chi ring,
//  territory tinting, meeting scheduler.
// ═══════════════════════════════════════════════════════════════════════════

const VERT = /* glsl */ `#version 300 es
  in vec2 a_pos;
  void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const FIELD_FRAG = /* glsl */ `#version 300 es
  precision highp float;
  out vec4 fragColor;

  uniform vec2  u_resolution;
  uniform float u_time;
  uniform vec2  u_mouse;
  uniform float u_scroll;

  uniform vec2  u_orbitA;
  uniform vec2  u_orbitB;
  uniform vec2  u_headingA;
  uniform vec2  u_headingB;
  uniform float u_tailEnergy;

  uniform vec2  u_barycenter;
  uniform float u_orbitR;

  uniform float u_periastron;
  uniform float u_meeting;
  uniform float u_meetingElapsed;   // seconds since meeting started, <0 if none
  uniform float u_mouseDwell;
  uniform float u_moodDrift;
  uniform float u_breath;
  uniform float u_cardiac;

  const vec3 C_HALPHA = vec3(1.00, 0.20, 0.28);
  const vec3 C_OIII   = vec3(0.24, 0.85, 0.72);
  const vec3 C_NII    = vec3(0.95, 0.32, 0.44);
  const vec3 C_SII    = vec3(0.85, 0.14, 0.22);
  const vec3 C_HBETA  = vec3(0.28, 0.55, 0.95);
  const vec3 C_HEII   = vec3(0.60, 0.35, 1.00);
  const vec3 C_GHOST  = vec3(0.498, 0.686, 0.702);

  const float KOI_BODY_LEN = 0.110;
  const float KOI_BODY_W   = 0.026;
  const float KOI_TAIL_LEN = 0.042;

  vec2 hash22(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)),
             dot(p, vec2(269.5, 183.3)));
    return fract(sin(p) * 43758.5453) * 2.0 - 1.0;
  }

  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = dot(hash22(i + vec2(0,0)), f - vec2(0,0));
    float b = dot(hash22(i + vec2(1,0)), f - vec2(1,0));
    float c = dot(hash22(i + vec2(0,1)), f - vec2(0,1));
    float d = dot(hash22(i + vec2(1,1)), f - vec2(1,1));
    return mix(mix(a,b,u.x), mix(c,d,u.x), u.y) * 0.5 + 0.5;
  }

  float fbm(vec2 p, float t) {
    float v = 0.0;
    float a = 0.5;
    const mat2 R = mat2(0.877, 0.479, -0.479, 0.877);
    for (int i = 0; i < 5; i++) {
      v += a * vnoise(p + t * (0.018 + 0.004 * float(i)));
      p = R * p * 2.02 + vec2(1.7, 9.2);
      a *= 0.5;
    }
    return v;
  }

  vec2 complexField(vec2 p, float t) {
    vec2 q = vec2(
      fbm(p + vec2(0.0, 0.0), t),
      fbm(p + vec2(5.2, 1.3), t)
    );
    vec2 r = vec2(
      fbm(p + 3.6 * q + vec2(1.7, 9.2), t),
      fbm(p + 3.6 * q + vec2(8.3, 2.8), t)
    );
    float u = fbm(p + 3.6 * r,                           t) - 0.5;
    float v = fbm(p + 3.6 * r + vec2(31.416, 58.217),    t) - 0.5;
    return vec2(u, v);
  }

  vec3 spectralMix(float T, float energy) {
    vec3 cold = C_OIII  * 0.60 + C_HBETA * 0.28 + C_HEII * 0.12;
    vec3 mid  = C_GHOST * 0.75 + C_OIII  * 0.25;
    vec3 hot  = C_HALPHA * 0.48 + C_NII  * 0.30 + C_SII * 0.22;

    vec3 c;
    if (T < 0.5) c = mix(cold, mid, smoothstep(0.0, 1.0, T * 2.0));
    else         c = mix(mid,  hot, smoothstep(0.0, 1.0, (T - 0.5) * 2.0));

    c = mix(c, C_NII,  energy * 0.20 * smoothstep(0.6, 0.95, T));
    c = mix(c, C_HEII, energy * 0.15 * smoothstep(0.6, 0.95, 1.0 - T));

    return c;
  }

  vec4 koiField(vec2 pL, float t, float breath, float tailEnergy) {
    float swim = (2.6 + 0.7 * breath) * tailEnergy;
    float phase = t * swim;

    float s = (pL.x + KOI_BODY_LEN * 0.5) / KOI_BODY_LEN;

    float env = clamp(1.0 - s, 0.0, 1.4);
    env = env * env;
    float ampBase = 0.010 * tailEnergy;
    float waveK = 8.0;
    float wave = ampBase * env * sin(phase - waveK * s);

    vec2 pU = vec2(pL.x, pL.y - wave);

    float bodyS = clamp(s, 0.0, 1.0);
    float widthN = 4.0 * bodyS * (1.0 - bodyS);
    widthN = pow(max(widthN, 0.0), 0.48);
    widthN *= mix(0.80, 1.12, smoothstep(0.08, 0.85, bodyS));
    float w = KOI_BODY_W * widthN;

    float edgeSoft = 0.005;
    float body = smoothstep(w + edgeSoft, w - edgeSoft * 0.5, abs(pU.y));
    body *= smoothstep(-KOI_BODY_LEN * 0.5 - edgeSoft,
                       -KOI_BODY_LEN * 0.5 + edgeSoft, pL.x);
    body *= 1.0 - smoothstep( KOI_BODY_LEN * 0.5 - edgeSoft,
                              KOI_BODY_LEN * 0.5 + edgeSoft, pL.x);

    float finX = -(pL.x + KOI_BODY_LEN * 0.5);
    float finRel = clamp(finX / KOI_TAIL_LEN, 0.0, 1.3);
    float inFin = step(0.0, finX) * (1.0 - smoothstep(0.95, 1.15, finRel));

    float tailAmp = ampBase * 2.8;
    float finSweep = tailAmp * sin(phase);
    float finCenter = mix(wave, finSweep, smoothstep(0.0, 1.0, finRel));

    float finW = KOI_BODY_W * (0.55 + 0.55 * finRel)
                             * (1.0 - 0.60 * smoothstep(0.55, 1.05, finRel));
    float fin = smoothstep(finW + edgeSoft, finW - edgeSoft * 0.5,
                           abs(pL.y - finCenter));
    fin *= inFin;
    fin *= 0.55;

    float dorsalAlongX = -KOI_BODY_LEN * 0.5 + 0.58 * KOI_BODY_LEN;
    vec2 dorsalP = vec2(pL.x - dorsalAlongX, pL.y - wave * 0.35 - 0.006);
    float dorsalRX = dorsalP.x / 0.028;
    float dorsalRY = dorsalP.y / 0.020;
    float dorsalR2 = dorsalRX * dorsalRX + dorsalRY * dorsalRY;
    float dorsal = smoothstep(1.05, 0.70, dorsalR2);
    dorsal *= smoothstep(-0.004, 0.004, pL.y - wave);
    dorsal *= 0.42;

    vec2 eyePos = vec2(KOI_BODY_LEN * 0.36, KOI_BODY_W * 0.30);
    vec2 eyeD   = pU - eyePos;
    float eyeR2 = dot(eyeD, eyeD);
    float eyeCore = exp(-eyeR2 * 28000.0);
    float eyeHalo = exp(-eyeR2 * 7000.0) * 0.28;
    float eye = (eyeCore + eyeHalo) * body;

    return vec4(body, fin, eye, dorsal);
  }

  // ═══════════════════════════════════════════════════════════════════
  //  Yin-yang pattern
  //  ─────────────────────────────────────────────────────────────────
  //  Pattern at local coords where unit circle = outer boundary.
  //  Returns (lightness, mask).  Lightness ∈ [0,1]: 0 = yin (dark),
  //  1 = yang (light).  Mask is smooth outer circle cutoff.
  //  S-curve from two half-circles at (0, ±0.5) radius 0.5.  Eye
  //  dots at the same centers, radius 0.15.
  // ═══════════════════════════════════════════════════════════════════
  vec2 yinYang(vec2 p) {
    float rMain = length(p);
    float mask = 1.0 - smoothstep(0.96, 1.04, rMain);

    float rUp = length(p - vec2(0.0, 0.5));
    float rDn = length(p - vec2(0.0, -0.5));

    float upperHalf = smoothstep(-0.04, 0.04, p.y);
    float inUpSmall = 1.0 - smoothstep(0.47, 0.53, rUp);
    float inDnSmall = 1.0 - smoothstep(0.47, 0.53, rDn);

    // Upper half: light inside upper small circle, dark outside
    float upperL = inUpSmall;
    // Lower half: dark inside lower small circle, light outside
    float lowerL = 1.0 - inDnSmall;
    float L = mix(lowerL, upperL, upperHalf);

    // Eye dots (complementary color)
    float eyeUp = 1.0 - smoothstep(0.13, 0.17, rUp);
    float eyeDn = 1.0 - smoothstep(0.13, 0.17, rDn);
    L = mix(L, 0.0, eyeUp);  // upper eye: dark dot on light field
    L = mix(L, 1.0, eyeDn);  // lower eye: light dot on dark field

    return vec2(L, mask);
  }

  vec3 toneMap(vec3 c) {
    c *= 1.00;
    float L  = dot(c, vec3(0.2126, 0.7152, 0.0722));
    float Lm = L / (1.0 + L);
    return c * (Lm / max(L, 1e-5));
  }

  void main() {
    vec2 uv    = gl_FragCoord.xy / u_resolution;
    vec2 p_vp  = (gl_FragCoord.xy - 0.5 * u_resolution) / u_resolution.y;
    vec2 p_raw = p_vp;
    p_raw.y += u_scroll * 0.00020;
    float t    = u_time;

    vec2 mouseP = (u_mouse - 0.5 * u_resolution) / u_resolution.y;
    vec2 toMouse = p_raw - mouseP;
    float md = length(toMouse);
    vec2 lens = normalize(toMouse + 1e-5) * exp(-md * 2.4) * 0.26;
    vec2 p_field = p_raw - lens;

    vec2 dA = p_vp - u_orbitA;
    vec2 dB = p_vp - u_orbitB;
    float warpA = exp(-dot(dA,dA) * 22.0) * 0.030;
    float warpB = exp(-dot(dB,dB) * 22.0) * 0.030;
    vec2 pSample = p_field
      - normalize(dA + 1e-5) * warpA
      - normalize(dB + 1e-5) * warpB;

    vec2 psi = complexField(pSample * 1.55, t);
    float psiMag2 = dot(psi, psi);
    float phase = atan(psi.y, psi.x);

    float singMag = exp(-psiMag2 * 52.0) * 0.36;
    float armPh = sin(3.0 * phase - t * 0.15) * 0.35 + 0.65;
    armPh = pow(armPh, 1.6);

    float fieldMag = length(psi) * 2.0;
    float baseField = smoothstep(0.0, 1.1, fieldMag);

    float dust = 0.45 + 0.55 * fbm(p_raw * 0.38 + vec2(t * 0.003, t * 0.002), t);
    dust = smoothstep(0.15, 0.9, dust);
    baseField *= dust;

    float tempSpatial = 0.5 + 0.22 *
      (vnoise(p_raw * 0.7 + vec2(t * 0.018, 0.0)) - 0.5) * 2.0;
    float mouseHeat = exp(-md * 1.6) * 0.20 * (0.5 + 0.5 * u_mouseDwell);
    float dwellWarmth = exp(-md * 2.0) * u_mouseDwell * 0.16;
    float moodT = u_moodDrift * 0.08;

    float T = clamp(
      tempSpatial
        + (u_breath - 0.5) * 0.18
        + mouseHeat
        + dwellWarmth
        + moodT,
      0.0, 1.0
    );

    float energy = smoothstep(0.3, 1.0, fieldMag);
    vec3 baseCol = spectralMix(T, energy);

    float dA_field = length(p_raw - u_orbitA);
    float dB_field = length(p_raw - u_orbitB);
    float nearer = min(dA_field, dB_field);
    float ratio = dB_field / (dA_field + dB_field + 1e-5);
    float territoryT = mix(0.34, 0.74, ratio);
    float territoryInf = exp(-nearer * 2.4) * 0.18;
    vec3 territoryCol = spectralMix(territoryT, 0.5);
    baseCol = mix(baseCol, territoryCol, territoryInf);

    float vortexT = 0.35 + 0.35 * u_breath + 0.18 * sin(phase * 2.0 + t * 0.042);
    vortexT = clamp(vortexT, 0.0, 1.0);
    vec3 vortexCol = spectralMix(vortexT, 0.80);

    vec3 col = baseCol * baseField * 0.48;
    col += vortexCol * singMag * armPh * 0.62;

    float distBary = length(p_vp - u_barycenter);
    float ringBand = abs(distBary - u_orbitR);
    float ring = exp(-ringBand * ringBand * 2200.0) * 0.040;
    vec3 ringCol = spectralMix(0.52 + 0.05 * u_moodDrift, 0.45);
    col += ringCol * ring * (0.85 + 0.20 * u_breath);

    // ── Koi rendering ────────────────────────────────────────────────
    vec3 colWarmBody = spectralMix(0.78, 0.55);
    vec3 colCoolBody = spectralMix(0.28, 0.55);
    vec3 colWarmEye  = spectralMix(0.26, 0.85);
    vec3 colCoolEye  = spectralMix(0.80, 0.85);

    float bleed = u_periastron * 0.22 + u_meeting * 0.15;
    vec3 warmBodyBleed = mix(colWarmBody, colCoolBody, bleed);
    vec3 coolBodyBleed = mix(colCoolBody, colWarmBody, bleed);

    mat2 R_A = mat2(u_headingA.x, -u_headingA.y,
                    u_headingA.y,  u_headingA.x);
    vec2 pL_A = R_A * (p_vp - u_orbitA);
    vec4 koiA = koiField(pL_A, t, u_breath, u_tailEnergy);

    mat2 R_B = mat2(u_headingB.x, -u_headingB.y,
                    u_headingB.y,  u_headingB.x);
    vec2 pL_B = R_B * (p_vp - u_orbitB);
    vec4 koiB = koiField(pL_B, t + 3.14, u_breath, u_tailEnergy);

    float eyePulse = 0.80 + 0.35 * u_cardiac + 0.35 * u_meeting + 0.15 * u_periastron;

    col += warmBodyBleed * (koiA.x * 0.32 + koiA.y * 0.20 + koiA.w * 0.22);
    col += colWarmEye    * koiA.z * 0.55 * eyePulse;

    col += coolBodyBleed * (koiB.x * 0.32 + koiB.y * 0.20 + koiB.w * 0.22);
    col += colCoolEye    * koiB.z * 0.55 * eyePulse;

    // ── Orbital bridge (periastron, always) ──────────────────────────
    vec2 ab = u_orbitB - u_orbitA;
    float abLen = length(ab);
    vec2 M = 0.5 * (u_orbitA + u_orbitB);
    if (abLen > 0.001) {
      vec2 abDir = ab / abLen;
      vec2 abNorm = vec2(-abDir.y, abDir.x);
      vec2 fromA  = p_vp - u_orbitA;
      float along = dot(fromA, abDir);
      float perp  = dot(fromA, abNorm);

      float onSeg = smoothstep(-0.05, 0.02, along)
                  * smoothstep(-0.05, 0.02, abLen - along);
      float perpFall = exp(-perp * perp * 280.0);
      float proximity = smoothstep(1.2, 0.2, abLen);
      float bridge = onSeg * perpFall * proximity * 0.26;
      vec3 bridgeCol = spectralMix(0.60 + 0.08 * u_periastron, 0.65);
      col += bridgeCol * bridge * (0.85 + 0.25 * u_cardiac);
    }

    // ═════════════════════════════════════════════════════════════════
    //  Tiny heart particles
    //  ───────────────────────────────────────────────────────────────
    //  Procedural particle system — each particle deterministic from
    //  its index.  Spawns from contact midpoint M during hold phase,
    //  flutters outward with buoyancy, evaporates over 2.5s.
    //  Yin-yang at core at birth, fades over first 50% of life.
    // ═════════════════════════════════════════════════════════════════
    if (u_meeting > 0.05 && u_meetingElapsed > 6.0) {
      const int NUM_PARTS = 24;
      const float PART_LIFE = 2.5;
      const float PART_SIZE = 0.020;   // scale factor — heart spans ~4.4%

      // Yin-yang colors — strong contrast
      vec3 yyLightCol = spectralMix(0.85, 0.85) * 1.15;
      vec3 yyDarkCol  = spectralMix(0.15, 0.85) * 0.55;

      // Heart glow color — soft warm magical pink
      vec3 heartGlowCol = vec3(1.05, 0.78, 0.85);

      for (int i = 0; i < NUM_PARTS; i++) {
        // Deterministic seeds
        vec2 s1 = hash22(vec2(float(i) + 0.5, 7.31));
        vec2 s2 = hash22(vec2(float(i) + 0.5, 13.17));
        float s1x = s1.x * 0.5 + 0.5;    // [0, 1]
        float s1y = s1.y * 0.5 + 0.5;
        float s2x = s2.x * 0.5 + 0.5;
        float s2y = s2.y * 0.5 + 0.5;

        // Birth time within meeting — spread across [7.5, 15.5]
        // (late approach / hold / early part; hold itself is 8-14)
        float birth = 7.5 + s1x * 8.0;
        float age = u_meetingElapsed - birth;
        if (age < 0.0 || age > PART_LIFE) continue;

        // Initial jitter from midpoint
        vec2 jitter = s2 * 0.005;

        // Base velocity in random outward direction
        float ang = s1y * 6.28318530718;
        float speed = 0.010 + s2x * 0.012;
        vec2 baseVel = vec2(cos(ang), sin(ang)) * speed;

        // Flutter: integrated sinusoidal perturbation
        vec2 flutter = vec2(
          sin(age * 6.0 + s1y * 10.0) - sin(s1y * 10.0),
          sin(age * 5.2 + s2y * 10.0) - sin(s2y * 10.0)
        ) * 0.004;

        // Buoyancy (rise over time)
        vec2 buoy = vec2(0.0, age * 0.012);

        vec2 partPos = M + jitter + baseVel * age + flutter + buoy;

        // Bounding check — skip far pixels
        vec2 pLocal = (p_vp - partPos) / PART_SIZE;
        if (dot(pLocal, pLocal) > 2.5) continue;

        // Heart shape (implicit curve)
        float px = pLocal.x, py = pLocal.y;
        float hf = pow(px * px + py * py - 1.0, 3.0) - px * px * py * py * py;
        float hIn = smoothstep(0.03, -0.02, hf);
        float hEdge = exp(-hf * hf * 80.0);

        // Yin-yang in core (scale up 1.8× so yin-yang occupies
        // inner ~56% of heart width)
        vec2 yyCoord = pLocal * 1.8;
        vec2 yy = yinYang(yyCoord);
        vec3 yyCol = mix(yyDarkCol, yyLightCol, yy.x);

        // Fade curves
        float normAge = age / PART_LIFE;
        float hFade  = 1.0 - smoothstep(0.3,  1.0, normAge);   // heart: 0.3-1.0
        float yyFade = 1.0 - smoothstep(0.10, 0.50, normAge);  // yin-yang: 0.1-0.5

        // Birth sparkle — brief edge shimmer in first 0.35s
        float birthSparkle = 1.0 - smoothstep(0.0, 0.35, age);
        float sparkleN = vnoise(pLocal * 8.0 + vec2(age * 3.0, 0.0));
        float sparkle = smoothstep(0.72, 0.95, sparkleN) * hEdge * birthSparkle;

        // Compose particle color
        vec3 pCol = heartGlowCol * (hIn * 0.45 + hEdge * 0.70);
        pCol += yyCol * yy.y * yyFade * 1.35;
        pCol += vec3(1.00, 0.95, 0.88) * sparkle * 1.6;
        pCol *= hFade;

        col += pCol;
      }
    }

    // Iridescence
    float irid = sin(fieldMag * 11.0 + t * 0.28) * 0.5 + 0.5;
    vec3 iridTint = spectralMix(T + (irid - 0.5) * 0.25, energy);
    col = mix(col, col * iridTint * 1.3, energy * 0.12);

    // Chromatic channel shift
    float eps = 0.004;
    vec2 grad;
    grad.x = complexField((p_field + vec2(eps, 0.0)) * 1.55, t).x - psi.x;
    grad.y = complexField((p_field + vec2(0.0, eps)) * 1.55, t).x - psi.x;
    grad = normalize(grad + 1e-5);
    float disp = energy * energy * 0.08;
    col.r *= 1.0 + grad.x * disp;
    col.b *= 1.0 - grad.x * disp;
    col.g *= 1.0 + grad.y * disp * 0.5;

    col += C_GHOST * 0.024 * (0.7 + 0.3 * u_breath);

    float closeness = max(u_periastron * 0.6, u_meeting);
    col *= 1.0 + closeness * 0.07;

    col = toneMap(col);

    fragColor = vec4(col, 1.0);
  }
`;

const BLOOM_FRAG = /* glsl */ `#version 300 es
  precision highp float;
  out vec4 fragColor;

  uniform sampler2D u_tex;
  uniform vec2  u_resolution;
  uniform vec2  u_dir;
  uniform float u_threshold;

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    vec2 off = u_dir / u_resolution;

    const float w0 = 0.227027;
    const float w1 = 0.194594;
    const float w2 = 0.121622;
    const float w3 = 0.054054;
    const float w4 = 0.016216;

    vec3 c = vec3(0.0);
    c += texture(u_tex, uv).rgb              * w0;
    c += texture(u_tex, uv + off * 1.0).rgb  * w1;
    c += texture(u_tex, uv - off * 1.0).rgb  * w1;
    c += texture(u_tex, uv + off * 2.0).rgb  * w2;
    c += texture(u_tex, uv - off * 2.0).rgb  * w2;
    c += texture(u_tex, uv + off * 3.0).rgb  * w3;
    c += texture(u_tex, uv - off * 3.0).rgb  * w3;
    c += texture(u_tex, uv + off * 4.0).rgb  * w4;
    c += texture(u_tex, uv - off * 4.0).rgb  * w4;

    if (u_threshold > 0.0) {
      float L = dot(c, vec3(0.2126, 0.7152, 0.0722));
      float m = smoothstep(u_threshold, u_threshold + 0.30, L);
      c *= m;
    }

    fragColor = vec4(c, 1.0);
  }
`;

const COMPOSITE_FRAG = /* glsl */ `#version 300 es
  precision highp float;
  out vec4 fragColor;

  uniform sampler2D u_field;
  uniform sampler2D u_bloom;
  uniform vec2  u_resolution;
  uniform float u_time;
  uniform float u_periastron;
  uniform float u_meeting;

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;

    vec3 base = texture(u_field, uv).rgb;

    float ang = u_time * 0.05;
    vec2 dispDir = vec2(cos(ang), sin(ang));
    float dispAmt = 0.0012;

    float bR = texture(u_bloom, uv + dispDir * dispAmt).r;
    float bG = texture(u_bloom, uv).g;
    float bB = texture(u_bloom, uv - dispDir * dispAmt).b;
    vec3 bloom = vec3(bR, bG, bB);

    vec3 halo = vec3(0.0);
    float halR = 0.0090;
    for (int i = 0; i < 8; i++) {
      float a = float(i) * 0.7853981633974483;
      vec2 off = vec2(cos(a), sin(a)) * halR;
      halo += texture(u_bloom, uv + off).rgb;
    }
    halo *= 0.125;
    vec3 halationTint = vec3(1.18, 0.83, 0.70);
    float closeness = max(u_periastron, u_meeting);
    float halationStrength = 0.20 + 0.28 * closeness;

    vec3 col = base
             + bloom * 0.46
             + halo * halationTint * halationStrength;

    vec2 vg = uv - 0.5;
    float vignette = 1.0 - dot(vg, vg) * 0.42;
    col *= vignette;

    fragColor = vec4(col, 1.0);
  }
`;

// ═══════════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════════

export default function LivingSubstrate() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
      powerPreference: "high-performance",
    });
    if (!gl) return;

    const compile = (src: string, type: number) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        console.error("Shader compile error:", gl.getShaderInfoLog(sh));
        return null;
      }
      return sh;
    };

    const program = (vert: string, frag: string) => {
      const v = compile(vert, gl.VERTEX_SHADER);
      const f = compile(frag, gl.FRAGMENT_SHADER);
      if (!v || !f) return null;
      const p = gl.createProgram()!;
      gl.attachShader(p, v);
      gl.attachShader(p, f);
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
        console.error("Program link error:", gl.getProgramInfoLog(p));
        return null;
      }
      return p;
    };

    const fieldProgram = program(VERT, FIELD_FRAG);
    const bloomProgram = program(VERT, BLOOM_FRAG);
    const compProgram  = program(VERT, COMPOSITE_FRAG);
    if (!fieldProgram || !bloomProgram || !compProgram) return;

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const bindAttrib = (prog: WebGLProgram) => {
      const loc = gl.getAttribLocation(prog, "a_pos");
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    };

    const makeFBO = (w: number, h: number) => {
      const tex = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      const fbo = gl.createFramebuffer()!;
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      return { tex, fbo };
    };

    let W = 0, H = 0;
    let fieldFBO: ReturnType<typeof makeFBO> | null = null;
    let bloomA:   ReturnType<typeof makeFBO> | null = null;
    let bloomB:   ReturnType<typeof makeFBO> | null = null;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const scale = 0.5;
      const nw = Math.max(1, Math.floor(window.innerWidth * dpr * scale));
      const nh = Math.max(1, Math.floor(window.innerHeight * dpr * scale));
      if (nw === W && nh === H) return;
      W = nw; H = nh;
      canvas.width = W;
      canvas.height = H;
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      fieldFBO = makeFBO(W, H);
      bloomA   = makeFBO(W, H);
      bloomB   = makeFBO(W, H);
    };
    resize();
    window.addEventListener("resize", resize);

    const uField = {
      u_resolution:      gl.getUniformLocation(fieldProgram, "u_resolution"),
      u_time:            gl.getUniformLocation(fieldProgram, "u_time"),
      u_mouse:           gl.getUniformLocation(fieldProgram, "u_mouse"),
      u_scroll:          gl.getUniformLocation(fieldProgram, "u_scroll"),
      u_orbitA:          gl.getUniformLocation(fieldProgram, "u_orbitA"),
      u_orbitB:          gl.getUniformLocation(fieldProgram, "u_orbitB"),
      u_headingA:        gl.getUniformLocation(fieldProgram, "u_headingA"),
      u_headingB:        gl.getUniformLocation(fieldProgram, "u_headingB"),
      u_tailEnergy:      gl.getUniformLocation(fieldProgram, "u_tailEnergy"),
      u_barycenter:      gl.getUniformLocation(fieldProgram, "u_barycenter"),
      u_orbitR:          gl.getUniformLocation(fieldProgram, "u_orbitR"),
      u_periastron:      gl.getUniformLocation(fieldProgram, "u_periastron"),
      u_meeting:         gl.getUniformLocation(fieldProgram, "u_meeting"),
      u_meetingElapsed:  gl.getUniformLocation(fieldProgram, "u_meetingElapsed"),
      u_mouseDwell:      gl.getUniformLocation(fieldProgram, "u_mouseDwell"),
      u_moodDrift:       gl.getUniformLocation(fieldProgram, "u_moodDrift"),
      u_breath:          gl.getUniformLocation(fieldProgram, "u_breath"),
      u_cardiac:         gl.getUniformLocation(fieldProgram, "u_cardiac"),
    };
    const uBloom = {
      u_tex:        gl.getUniformLocation(bloomProgram, "u_tex"),
      u_resolution: gl.getUniformLocation(bloomProgram, "u_resolution"),
      u_dir:        gl.getUniformLocation(bloomProgram, "u_dir"),
      u_threshold:  gl.getUniformLocation(bloomProgram, "u_threshold"),
    };
    const uComp = {
      u_field:      gl.getUniformLocation(compProgram, "u_field"),
      u_bloom:      gl.getUniformLocation(compProgram, "u_bloom"),
      u_resolution: gl.getUniformLocation(compProgram, "u_resolution"),
      u_time:       gl.getUniformLocation(compProgram, "u_time"),
      u_periastron: gl.getUniformLocation(compProgram, "u_periastron"),
      u_meeting:    gl.getUniformLocation(compProgram, "u_meeting"),
    };

    let mouseRaw      = { x: window.innerWidth * 0.5, y: window.innerHeight * 0.5 };
    let mouseSmoothed = { x: mouseRaw.x, y: mouseRaw.y };
    let lastMoveTime  = performance.now();
    let dwell         = 0;

    const onMove = (e: MouseEvent) => {
      mouseRaw = { x: e.clientX, y: e.clientY };
      lastMoveTime = performance.now();
    };
    window.addEventListener("mousemove", onMove);

    let visible = !document.hidden;
    const onVis = () => { visible = !document.hidden; };
    document.addEventListener("visibilitychange", onVis);

    const T_A = 89.0;
    const T_B = 144.0;
    const OMEGA_A = (2 * Math.PI) / T_A;
    const OMEGA_B = (2 * Math.PI) / T_B;
    const R_BASE_X = 0.34;
    const R_BASE_Y = 0.22;
    const PERIASTRON_DIST = 0.26;

    const MEETING_APPROACH = 8.0;
    const MEETING_HOLD     = 6.0;
    const MEETING_PART     = 8.0;
    const MEETING_TOTAL    = MEETING_APPROACH + MEETING_HOLD + MEETING_PART;
    const MEETING_INTERVAL_MIN = 600;
    const MEETING_INTERVAL_MAX = 1080;
    const MEETING_FIRST_MIN    = 45;
    const MEETING_FIRST_MAX    = 90;
    const MEETING_GAP          = 0.050;

    let nextMeetingAt  = MEETING_FIRST_MIN +
                         Math.random() * (MEETING_FIRST_MAX - MEETING_FIRST_MIN);
    let meetingStartAt = -1000;

    const meetingStrengthAt = (tt: number): number => {
      const dt = tt - meetingStartAt;
      if (dt < 0 || dt >= MEETING_TOTAL) return 0;
      if (dt < MEETING_APPROACH) {
        const p = dt / MEETING_APPROACH;
        return p * p * (3 - 2 * p);
      }
      if (dt < MEETING_APPROACH + MEETING_HOLD) return 1;
      const p = (dt - MEETING_APPROACH - MEETING_HOLD) / MEETING_PART;
      return 1 - p * p * (3 - 2 * p);
    };

    const tailEnergyAt = (tt: number, periastron: number): number => {
      const dt = tt - meetingStartAt;
      if (dt >= 0 && dt < MEETING_TOTAL) {
        if (dt < MEETING_APPROACH) {
          return 1.0 + 0.7 * (dt / MEETING_APPROACH);
        } else if (dt < MEETING_APPROACH + MEETING_HOLD) {
          return 0.35;
        } else {
          const p = (dt - MEETING_APPROACH - MEETING_HOLD) / MEETING_PART;
          return 1.7 - 0.7 * p;
        }
      }
      return 1.0 + 0.35 * Math.max(0, Math.min(1, (periastron - 0.2) / 0.5));
    };

    type OrbitPos = { aX: number; aY: number; bX: number; bY: number;
                      baryX: number; baryY: number; rx: number; ry: number };

    const orbitRaw = (tt: number): OrbitPos => {
      const aspect = window.innerWidth / Math.max(1, window.innerHeight);
      const mobileFactor = window.innerWidth < 768 ? 0.78 : 1.0;
      const rxLimit = Math.max(0.18, aspect * 0.42);

      const baryX = 0.05 * Math.sin(tt * 0.012) + 0.03 * Math.sin(tt * 0.007);
      const baryY = -0.03 + 0.04 * Math.cos(tt * 0.009);
      const amp  = 1.0 + 0.18 * Math.sin(tt * 0.013);
      const rx = Math.min(R_BASE_X * mobileFactor, rxLimit) * amp;
      const ry = R_BASE_Y * mobileFactor * amp;
      const aX = baryX + rx * Math.cos(OMEGA_A * tt);
      const aY = baryY + ry * Math.sin(OMEGA_B * tt);
      const bX = baryX - rx * Math.cos(OMEGA_A * tt + 0.31);
      const bY = baryY - ry * Math.sin(OMEGA_B * tt + 0.27);
      return { aX, aY, bX, bY, baryX, baryY, rx, ry };
    };

    const applyMeeting = (pos: OrbitPos, strength: number): OrbitPos => {
      if (strength <= 0) return pos;
      const midX = (pos.aX + pos.bX) * 0.5;
      const midY = (pos.aY + pos.bY) * 0.5;

      const dxA = pos.aX - midX;
      const dyA = pos.aY - midY;
      const dA  = Math.hypot(dxA, dyA) || 1e-6;
      const tAx = midX + (dxA / dA) * MEETING_GAP;
      const tAy = midY + (dyA / dA) * MEETING_GAP;

      const dxB = pos.bX - midX;
      const dyB = pos.bY - midY;
      const dB  = Math.hypot(dxB, dyB) || 1e-6;
      const tBx = midX + (dxB / dB) * MEETING_GAP;
      const tBy = midY + (dyB / dB) * MEETING_GAP;

      return {
        aX: pos.aX + (tAx - pos.aX) * strength,
        aY: pos.aY + (tAy - pos.aY) * strength,
        bX: pos.bX + (tBx - pos.bX) * strength,
        bY: pos.bY + (tBy - pos.bY) * strength,
        baryX: pos.baryX, baryY: pos.baryY, rx: pos.rx, ry: pos.ry,
      };
    };

    const startTime = performance.now();
    let rafId = 0;

    const render = () => {
      if (!visible) { rafId = requestAnimationFrame(render); return; }

      const now = performance.now();
      const t  = (now - startTime) * 0.001;

      if (t > nextMeetingAt && t - meetingStartAt > MEETING_TOTAL + 30) {
        meetingStartAt = t;
        nextMeetingAt = t + MEETING_INTERVAL_MIN +
                        Math.random() * (MEETING_INTERVAL_MAX - MEETING_INTERVAL_MIN);
      }

      const k = 0.028;
      mouseSmoothed.x += (mouseRaw.x - mouseSmoothed.x) * k;
      mouseSmoothed.y += (mouseRaw.y - mouseSmoothed.y) * k;

      const mx = (mouseSmoothed.x / window.innerWidth) * W;
      const my = ((window.innerHeight - mouseSmoothed.y) / window.innerHeight) * H;
      const scroll = window.scrollY;

      const sinceMove = (now - lastMoveTime) * 0.001;
      const dwellTarget = Math.min(1, sinceMove / 4);
      dwell += (dwellTarget - dwell) * 0.04;

      const dtVel = 0.25;
      const meetStr    = meetingStrengthAt(t);
      const meetStrNxt = meetingStrengthAt(t + dtVel);
      const meetingElapsed = (meetStr > 0) ? (t - meetingStartAt) : -1.0;

      const curRaw = orbitRaw(t);
      const nxtRaw = orbitRaw(t + dtVel);
      const cur = applyMeeting(curRaw, meetStr);
      const nxt = applyMeeting(nxtRaw, meetStrNxt);

      const vAx = (nxt.aX - cur.aX) / dtVel;
      const vAy = (nxt.aY - cur.aY) / dtVel;
      const vBx = (nxt.bX - cur.bX) / dtVel;
      const vBy = (nxt.bY - cur.bY) / dtVel;
      const sA = Math.hypot(vAx, vAy) || 1e-6;
      const sB = Math.hypot(vBx, vBy) || 1e-6;
      let hAx = vAx / sA, hAy = vAy / sA;
      let hBx = vBx / sB, hBy = vBy / sB;

      if (meetStr > 0) {
        const faceAx = cur.bX - cur.aX;
        const faceAy = cur.bY - cur.aY;
        const faceADist = Math.hypot(faceAx, faceAy) || 1e-6;
        const fAx = faceAx / faceADist;
        const fAy = faceAy / faceADist;
        const bAx = hAx * (1 - meetStr) + fAx * meetStr;
        const bAy = hAy * (1 - meetStr) + fAy * meetStr;
        const bAm = Math.hypot(bAx, bAy) || 1;
        hAx = bAx / bAm; hAy = bAy / bAm;

        const fBx = -fAx, fBy = -fAy;
        const bBx = hBx * (1 - meetStr) + fBx * meetStr;
        const bBy = hBy * (1 - meetStr) + fBy * meetStr;
        const bBm = Math.hypot(bBx, bBy) || 1;
        hBx = bBx / bBm; hBy = bBy / bBm;
      }

      const dx = cur.aX - cur.bX;
      const dy = cur.aY - cur.bY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const periastron = Math.max(0, 1 - dist / PERIASTRON_DIST);
      const periastronEased = periastron * periastron * (3 - 2 * periastron);

      const tailEnergy = tailEnergyAt(t, periastronEased);

      const breathPeriodMod = 0.055 + 0.015 * Math.sin(t * 0.019);
      const breath = 0.5 + 0.5 * Math.sin(t * breathPeriodMod);

      const cardiacPeriod = 28.0;
      const cardT = (t % cardiacPeriod) / cardiacPeriod;
      const cardiac = cardT < 0.12
        ? Math.sin((cardT / 0.12) * Math.PI * 0.5)
        : Math.pow(Math.max(0, 1 - (cardT - 0.12) / 0.88), 1.8);

      const moodDrift =
        0.7 * Math.sin(t * 0.0052) +
        0.3 * Math.sin(t * 0.0021 + 1.3);

      const ringR = Math.sqrt(curRaw.rx * curRaw.ry) * 0.75;

      if (!fieldFBO || !bloomA || !bloomB) {
        rafId = requestAnimationFrame(render);
        return;
      }

      gl.viewport(0, 0, W, H);
      gl.disable(gl.BLEND);
      gl.disable(gl.DEPTH_TEST);
      gl.bindVertexArray(vao);

      gl.bindFramebuffer(gl.FRAMEBUFFER, fieldFBO.fbo);
      gl.useProgram(fieldProgram);
      bindAttrib(fieldProgram);
      gl.uniform2f(uField.u_resolution, W, H);
      gl.uniform1f(uField.u_time, t);
      gl.uniform2f(uField.u_mouse, mx, my);
      gl.uniform1f(uField.u_scroll, scroll);
      gl.uniform2f(uField.u_orbitA,        cur.aX, cur.aY);
      gl.uniform2f(uField.u_orbitB,        cur.bX, cur.bY);
      gl.uniform2f(uField.u_headingA,      hAx,    hAy);
      gl.uniform2f(uField.u_headingB,      hBx,    hBy);
      gl.uniform1f(uField.u_tailEnergy,    tailEnergy);
      gl.uniform2f(uField.u_barycenter,    curRaw.baryX, curRaw.baryY);
      gl.uniform1f(uField.u_orbitR,        ringR);
      gl.uniform1f(uField.u_periastron,    periastronEased);
      gl.uniform1f(uField.u_meeting,       meetStr);
      gl.uniform1f(uField.u_meetingElapsed, meetingElapsed);
      gl.uniform1f(uField.u_mouseDwell,    dwell);
      gl.uniform1f(uField.u_moodDrift,     moodDrift);
      gl.uniform1f(uField.u_breath,        breath);
      gl.uniform1f(uField.u_cardiac,       cardiac);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      gl.bindFramebuffer(gl.FRAMEBUFFER, bloomA.fbo);
      gl.useProgram(bloomProgram);
      bindAttrib(bloomProgram);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, fieldFBO.tex);
      gl.uniform1i(uBloom.u_tex, 0);
      gl.uniform2f(uBloom.u_resolution, W, H);
      gl.uniform2f(uBloom.u_dir, 1.0, 0.0);
      gl.uniform1f(uBloom.u_threshold, 0.72);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      gl.bindFramebuffer(gl.FRAMEBUFFER, bloomB.fbo);
      gl.useProgram(bloomProgram);
      bindAttrib(bloomProgram);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, bloomA.tex);
      gl.uniform1i(uBloom.u_tex, 0);
      gl.uniform2f(uBloom.u_resolution, W, H);
      gl.uniform2f(uBloom.u_dir, 0.0, 1.0);
      gl.uniform1f(uBloom.u_threshold, 0.0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.useProgram(compProgram);
      bindAttrib(compProgram);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, fieldFBO.tex);
      gl.uniform1i(uComp.u_field, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, bloomB.tex);
      gl.uniform1i(uComp.u_bloom, 1);
      gl.uniform2f(uComp.u_resolution, W, H);
      gl.uniform1f(uComp.u_time, t);
      gl.uniform1f(uComp.u_periastron, periastronEased);
      gl.uniform1f(uComp.u_meeting,    meetStr);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}
