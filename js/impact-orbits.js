/* ═══════════════════════════════════════════════════════════════════════
   IMPACT ORBITS — concentric rings of orbiting dots + a live connection web,
   drawn on the full-bleed #impactOrbits canvas behind the "30+ schools"
   carousel/stats.

   The rings are modelled in 3D: each is a flat CIRCLE on a plane TILTED back
   around the X axis, then PERSPECTIVE-projected. So a ring reads as a disc
   receding into the screen — dots at the back sit higher and smaller, dots at
   the front lower and larger. Modelling true circles means equal-angle
   sampling already gives even spacing (no ellipse bunching to correct). Rings
   counter-rotate; inner rings fade toward the background (aerial depth).

   The control panel (js/impact-carousel.js) drives everything through the live
   config at window.__impactOrbits.cfg — read every frame — and calls
   .rebuild() when dots-per-ring changes.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const canvas = document.getElementById('impactOrbits');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  /* ── Per-ring base arrays (index 0 = OUTER ring) ───────────────────────── */
  const RADII     = [520, 370, 245];   // world circle radius (px) at ringScale 1
  const SPEED     = [0.14, 0.20, 0.28];// base spin (rad/s)
  const DIRECTION = [1,   -1,   1];    // +1 CCW / -1 CW → counter-rotate
  const FAINTNESS = [0.0, 0.26, 0.46]; // 0..1 colour fade toward BG
  const DOT_SCALE = [1.0, 0.88, 0.76]; // per-ring dot-size multiplier
  const YOFF      = [0,   0,   0];     // per-ring world height (px) if you want nesting
  const RINGS = RADII.length;

  const DOT_BASE   = 6.0;   // base dot radius (px), before cfg.dotSize & depth
  const BOB_AMP    = 5;     // vertical bob amplitude (px, world)
  const BOB_SPEED  = 0.9;   // vertical bob rate (rad/s)
  const CHAOS_AMP  = 42;    // px of positional wander (world) at cfg.chaos = 1
  const BG         = [202, 240, 254];   // faint dots blend toward this (matches the glow)
  const PALETTE    = [
    [252, 195, 11], [38, 189, 226], [86, 192, 43], [249, 155, 28], [232, 102, 176],
  ];

  const MAX_DIST = 150, FADE_DIST = 78, MAX_LINKS = 3, DENSITY = 0.72,
        LINK_OPACITY = 0.5, LINK_COLOR = [150, 140, 70];

  /* ── LIVE config — the control panel mutates this ──────────────────────── */
  const cfg = {
    dotSize:   1.98,  // × DOT_BASE
    speed:     1.0,   // × SPEED[]
    chaos:     0.26,  // 0..1 positional randomness
    links:     true,  // draw connection lines?
    ringScale: 1.34,  // × RADII
    count:     28,    // dots PER RING
    tilt:      12,    // disc tilt (deg): 0 = face-on circle, 90 = edge-on
    persp:     1080,  // perspective focal length (px); lower = deeper 3D
  };

  const TWO_PI = Math.PI * 2, DEG = Math.PI / 180;

  /* ── (Re)build the dot set — call on count change ──────────────────────── */
  let dots = [];
  const phase = new Float64Array(RINGS);
  function rebuild() {
    dots = [];
    let id = 0;
    for (let o = 0; o < RINGS; o++) {
      const n = Math.max(1, cfg.count | 0);
      for (let i = 0; i < n; i++) {
        const base = PALETTE[id % PALETTE.length], t = FAINTNESS[o];
        const col = 'rgb(' +
          Math.round(base[0] + (BG[0] - base[0]) * t) + ',' +
          Math.round(base[1] + (BG[1] - base[1]) * t) + ',' +
          Math.round(base[2] + (BG[2] - base[2]) * t) + ')';
        dots.push({
          ring: o, id,
          frac0: i / n,
          color: col,
          rScale: DOT_SCALE[o],
          bobPhase: id * 2.399963,
          cphX: (Math.sin(id * 12.9898) * 43758.5453 % 1) * TWO_PI,
          cphY: (Math.sin(id * 78.233) * 12345.6789 % 1) * TWO_PI,
          x: 0, y: 0, depth: 0,
        });
        id++;
      }
    }
  }
  rebuild();

  function hash01(a, b) {
    const lo = a < b ? a : b, hi = a < b ? b : a;
    let h = (Math.imul(lo, 73856093) ^ Math.imul(hi, 19349663)) >>> 0;
    h ^= h >>> 13; h = Math.imul(h, 1274126177) >>> 0;
    return (h >>> 0) / 4294967296;
  }

  /* ── Sizing (DPR-aware; clientW/H so the reveal scale/blur doesn't skew it) */
  let cx = 0, cy = 0;
  function resize() {
    const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx = w / 2; cy = h / 2;
  }

  const order = [];
  const cand = [];
  function frame(dt, elapsed) {
    const rs = cfg.ringScale, ch = cfg.chaos, dpx = DOT_BASE * cfg.dotSize;
    const T = cfg.tilt * DEG, sinT = Math.sin(T), cosT = Math.cos(T);
    const F = cfg.persp;
    for (let o = 0; o < RINGS; o++) phase[o] += SPEED[o] * cfg.speed * dt;

    for (let d = 0; d < dots.length; d++) {
      const dot = dots[d], o = dot.ring, r = RADII[o] * rs;
      let u = dot.frac0 + DIRECTION[o] * phase[o] / TWO_PI;
      u = ((u % 1) + 1) % 1;
      const ang = u * TWO_PI;
      // world point on the tilted circle
      let wx = r * Math.cos(ang);
      let wz = r * Math.sin(ang);
      let wy = YOFF[o];
      if (ch > 0) {                                   // organic wander (world)
        wx += ch * CHAOS_AMP * Math.sin(elapsed * 0.7 + dot.cphX);
        wz += ch * CHAOS_AMP * Math.cos(elapsed * 0.9 + dot.cphY);
      }
      wy += Math.abs(Math.sin(elapsed * BOB_SPEED + dot.bobPhase)) * BOB_AMP;
      // tilt around X, then perspective-project
      const ry = wy * cosT - wz * sinT;               // screen-vertical (world)
      const depth = wy * sinT + wz * cosT;            // + = farther back
      const persp = F / Math.max(60, F + depth);      // clamp denom > 0
      dot.x = cx + wx * persp;
      dot.y = cy + ry * persp;
      dot.depth = depth;
      dot.px = persp;
    }

    ctx.clearRect(0, 0, cx * 2, cy * 2);

    if (cfg.links) {
      const maxSq = MAX_DIST * MAX_DIST, seen = new Set(), denom = MAX_DIST - FADE_DIST;
      for (let a = 0; a < dots.length; a++) {
        const da = dots[a];
        cand.length = 0;
        for (let b = 0; b < dots.length; b++) {
          if (b === a) continue;
          const db = dots[b], dx = db.x - da.x, dy = db.y - da.y, d2 = dx * dx + dy * dy;
          if (d2 <= maxSq) cand.push({ b, d2 });
        }
        cand.sort((p, q) => p.d2 - q.d2);
        const keep = Math.min(MAX_LINKS, cand.length);
        for (let k = 0; k < keep; k++) {
          const b = cand[k].b, db = dots[b];
          const key = da.id < db.id ? da.id * 100000 + db.id : db.id * 100000 + da.id;
          if (seen.has(key)) continue;
          seen.add(key);
          if (hash01(da.id, db.id) >= DENSITY) continue;
          const dist = Math.sqrt(cand[k].d2);
          const fade = dist <= FADE_DIST ? 1 : Math.max(0, 1 - (dist - FADE_DIST) / denom);
          if (fade <= 0) continue;
          ctx.strokeStyle = 'rgba(' + LINK_COLOR[0] + ',' + LINK_COLOR[1] + ',' +
            LINK_COLOR[2] + ',' + (LINK_OPACITY * fade).toFixed(3) + ')';
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(da.x, da.y); ctx.lineTo(db.x, db.y); ctx.stroke();
        }
      }
    }

    // painter's order: farthest first so near dots sit on top
    order.length = dots.length;
    for (let i = 0; i < dots.length; i++) order[i] = i;
    order.sort((i, j) => dots[j].depth - dots[i].depth);
    for (let k = 0; k < order.length; k++) {
      const dot = dots[order[k]];
      ctx.fillStyle = dot.color;
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, Math.max(0.4, dpx * dot.rScale * dot.px), 0, TWO_PI);
      ctx.fill();
    }
  }

  /* ── Loop, gated to on-screen + tab-visible ────────────────────────────── */
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let last = 0, elapsed = 0, running = false, onScreen = true;
  function tick(now) {
    if (!running) return;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
    last = now; elapsed += dt;
    frame(dt, elapsed);
    if (running) requestAnimationFrame(tick);
  }
  function start() { if (running || reduce || !onScreen || document.hidden) return; running = true; last = 0; requestAnimationFrame(tick); }
  function stop() { running = false; }

  resize();
  window.addEventListener('resize', () => { resize(); if (reduce) frame(0, elapsed); });
  window.__impactOrbits = { cfg, rebuild, redraw: () => frame(0, elapsed) };

  if (reduce) {
    frame(0, 0);
  } else {
    // gate on the SCENE's scroll block, not the canvas: the canvas lives in a
    // fixed full-viewport stage and would always read as "on-screen".
    const gate = document.getElementById('impact') || canvas;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((e) => { onScreen = e[0].isIntersecting; if (onScreen) { resize(); start(); } else stop(); },
        { rootMargin: '300px' }).observe(gate);
    } else { start(); }
    document.addEventListener('visibilitychange', () => { document.hidden ? stop() : start(); });
  }
})();
