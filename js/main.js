/* ═══════════════════════════════════════════════════════════════════
   Tilli — one seamless experience, told by the dots.
   The same particles narrate the whole page, following the sketch
   storyboard:
     scattered question → dots connect around the answer → data flows
     through the dashboard → funnels into report cards (+ a heart) →
     spirals into one rotating circle → divides into the 3 views
     (teacher / student / parent) → weaves a DNA of dots, strand by
     strand → the DNA rotates for the 360° view → zooms aside for the
     12 skills → the dots become children, developmentally on track →
     (ask · impact · journey) → every data point ends in one heart.
   ═══════════════════════════════════════════════════════════════════ */
import * as THREE from '../lib/three.module.min.js';

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => 1 - Math.pow(1 - t, 3);
const smooth = (t) => t * t * (3 - 2 * t);
/* quintic smootherstep — zero velocity AND zero acceleration at both ends, so
   a scrubbed slide starts and stops with no perceptible jerk. */
const smoother = (t) => t * t * t * (t * (t * 6 - 15) + 10);

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ═══════════════════════════════════════════════════════════════════
   THE STAGE SYSTEM — a true single page

   Each `.scene` is an empty scroll spacer that owns a slice of the
   scrollbar; its `.stage` is position:fixed at the viewport. Sections
   dissolve into each other through the dot field rather than travelling —
   with one deliberate exception around the CROSS screen: the dashboard
   climbs in from below as CROSS hands off to it (see the climb-in block).
   The hero text no longer travels — it holds centre and fades out while the
   two dot streams cross paths IN FRONT of it (the dot field is lifted above
   the content for the crossing; see liftDots / heroGone in onScroll).

   Tunables:
     FADE_LEN   how long (in scene-units) a stage takes to fade in/out
     FADE_OVER  how far the incoming stage's fade starts before the
                outgoing one has finished — the size of the dissolve
     STEP_FADE  same, for `.step` sub-panels inside one stage
     MORPH_AT   the point in a scene (0..1) where the dots stop holding
                their formation and start morphing towards the next
     SCROLL_AT  the Start fraction (0..1) where the hero rides up and out
     FIT_PAD    px of breathing room kept around a step when it has to
                be scaled down to fit a short viewport
   ═══════════════════════════════════════════════════════════════════ */
const FADE_LEN = 0.12;
const FADE_OVER = 0.04;
const STEP_FADE = 0.22;
/* The flow spans three scenes now: Start (ring) → Cross (the dots cross
   paths, a dedicated empty screen) → Dashboard (they pour into the card).
   MORPH_AT / SCROLL_AT are Start-scene fractions: where the dots begin
   leaving the ring, and where the hero content rides up and out. The
   "Space between sections" slider sizes the CROSS scene — the crossing
   space itself (see setCrossVH). */
const MORPH_AT = 0.68;   // Start fraction where the dots start leaving the ring
const SCROLL_AT = 0.74;  // Start fraction anchor for the dashboard card's zoom ramp
                         // (the hero text now fades in place — see onScroll/heroGone)
let CROSS_VH = 150;      // Cross-scene scroll length (vh) — driven by the GUI slider
let FUNNEL_VH = 34;      // Funnel-scene scroll length (vh) — driven by the GUI slider.
                         // 34vh here makes the video-bottom→report-top gap ≈ 100vh
                         // (the Dashboard's lower half + Reports approach add ~66vh).
const FIT_PAD = 34;

/* ── Scene registry (DOM order = station order) ───────────────────── */
const sceneEls = Array.from(document.querySelectorAll('[data-scene]'));
const scenes = sceneEls.map((el) => {
  const steps = Array.from(el.querySelectorAll('.step'));
  return {
    el,
    stage: el.querySelector('.stage'),
    steps,
    fits: steps.map((s) => s.firstElementChild),
    seen: steps.map(() => false),
    wash: (el.dataset.wash || '255,255,255').split(',').map(Number),
    label: el.dataset.label || '',
    pin: el.dataset.pin || null,
    t: null,
    top: 0,
    len: 1,
    op: -1,
    ty: 0,
  };
});
const LAST = scenes.length - 1;
const ST = {}; // name → station index
scenes.forEach((s, i) => { ST[s.label] = i; });

/* Scene tops / scroll lengths. The last scene can only be scrolled to
   `height - vh`, so its progress is measured against that. */
function measure() {
  const vh = window.innerHeight;
  const y0 = window.scrollY;
  scenes.forEach((s, i) => {
    s.top = Math.round(s.el.getBoundingClientRect().top + y0);
    const h = s.el.offsetHeight;
    s.len = Math.max(1, i === LAST ? h - vh : h);
  });
  fitSteps();
}

/* Stages are viewport-locked, so a step that is taller than the screen
   would be clipped with no way to reach it. Scale it down instead —
   this is what keeps every section in its "responsive position". */
function fitSteps() {
  const avail = window.innerHeight - FIT_PAD * 2;
  scenes.forEach((s) => s.fits.forEach((inner) => {
    if (!inner) return;
    inner.style.transform = 'none';
    const h = inner.offsetHeight;
    const k = h > avail ? Math.max(0.5, avail / h) : 1;
    inner.style.transform = k < 1 ? `scale(${k.toFixed(4)})` : 'none';
  }));
}

/* Set the Cross-scene height (vh) — the scroll length of the dedicated
   crossing screen between "They measure…" and "Schools see…". Bigger = more
   room for the dots to cross before the dashboard climbs in. */
function setCrossVH(vh) {
  CROSS_VH = clamp(vh, 60, 400);
  const s = scenes[ST['Cross']];
  if (s) s.el.style.height = `${Math.round(CROSS_VH)}vh`;
  measure();
  if (typeof onScroll === 'function') onScroll();
}

/* Set the Funnel-scene height (vh) — the empty screen between "Schools see…"
   and "Teachers share…" that the funnel pours down through. Bigger = the
   funnel lingers longer before the reports slide in. */
function setFunnelVH(vh) {
  FUNNEL_VH = clamp(vh, 20, 400);
  const s = scenes[ST['Funnel']];
  if (s) s.el.style.height = `${Math.round(FUNNEL_VH)}vh`;
  measure();
  if (typeof onScroll === 'function') onScroll();
}

/* f is continuous scene-space: f = i + (progress through scene i). */
function stationF() {
  const y = window.scrollY;
  let i = 0;
  while (i < LAST && y >= scenes[i + 1].top) i++;
  return i + clamp((y - scenes[i].top) / scenes[i].len);
}

/* ═══════════════════════════════════════════════════════════════════
   THREE.JS WORLD
   ═══════════════════════════════════════════════════════════════════ */
const C = {
  green: '#56C02B', cyan: '#26BDE2', pink: '#E91E8C', yellow: '#FCC30B',
  orange: '#F99B1C', pink2: '#E866B0', gray: '#C9CFDA', greenD: '#348C11',
};
const DEPTH = 40;
const CAM_DIST = 26;
const N = 400;

let three = null;

function dotTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  /* solid disc with a ~2px feathered rim: just enough to antialias, no halo */
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.9, 'rgba(255,255,255,1)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  /* mipmaps soften the sprite at typical on-screen sizes — sample the base level */
  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
}

/* half-extents of the camera frustum at a given world z — used so the dot
   field always reaches the edges of the viewport, whatever the aspect */
function visHalf(z) {
  const h = (CAM_DIST - z) * Math.tan((50 * Math.PI / 180) / 2);
  return { h, w: h * Math.max(0.65, window.innerWidth / Math.max(1, window.innerHeight)) };
}
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/* ── Formations: each station gets {pos, col} of length N*3 ───────── */
/* hero scatter — recomputed on resize so it always fills the viewport */
function spreadHero(pos) {
  const r = rng(11);
  for (let i = 0; i < N; i++) {
    const z = -2 - r() * 7;
    const v = visHalf(z);
    /* 1.08 over-scan so dots bleed past the edges instead of stopping short */
    pos[i * 3] = (r() - 0.5) * 2 * v.w * 1.08;
    pos[i * 3 + 1] = (r() - 0.5) * 2 * v.h * 1.08;
    pos[i * 3 + 2] = z;
  }
}

/* ── Beat-B connection network ─────────────────────────────────────
   The nodes are real dots picked out of the field (not an overlay), so
   the threads connect the scene's own dots. buildHeroNetwork() lays them
   round a rim starting from the TOP, wires an open chain with some links
   dropped (so it isn't a perfect symmetric ring), and hangs a few leaf
   dots off the chain that carry a single branching thread. Everything is
   live-tunable from the GUI panel (buildGUI); the network reseeds from a
   fixed seed each rebuild, so a given set of values is deterministic. */
const HERO_CFG = {
  count: 17,        // evenly-spaced rim dots seeded as the default connected set
  linksPerNode: 2,  // how many forward neighbours each dot links to (1 = simple ring)
  spacing: 0,       // 0 = perfectly even round the rim (clean garland)
  branches: 12,     // leaf dots that hang just outside the rim, one line each
  thickness: 0.055, // half-width of a connection line, in world units
  opacity: 0.35,    // master multiplier on connection-line opacity
  ringScale: 0.86,  // tightens / widens the rim
  color: '#2E3542',
};
const HERO_TOP = Math.PI / 2; // rim starts at the top of the frame
/* the ring-connection lines only join dots whose angular separation is at
   most this (radians). A short rim chord hugs the ellipse; anything wider
   would cut across the empty middle where the text sits, so it's dropped. */
const MEASURE_MAXGAP = 2.0;   // ~115° — safely clear of the centre
/* the connection ring is STITCHED on only AFTER the burst transition has
   settled the dots into the ring: over this heroP window the lines grow from
   the TOP, anti-clockwise, and close back on the first dot. It finishes
   before MORPH_AT (where the flow starts carrying the ring off). */
const STITCH_START = 0.56;    // heroP where the ring starts drawing (post-burst)
const STITCH_END = 0.64;      // heroP where the ring has fully closed

/* ── Hero orb + hand ───────────────────────────────────────────────
   The landing beat is now a spherical cluster of dots cradled in a
   line-drawn hand. On scroll into "They measure…" the orb bursts and
   the dots spread across the frame (then flow on into the dashboard).
   Everything below is live-tunable from the GUI. */
const SPHERE_Z = -3;             // world plane the orb sits on (same as the ring)
const HAND_Z = -3;               // world plane the hand planes sit on (with the orb)
const SPHERE = {
  radius: 4.6,        // orb radius in world units
  burstSpeed: 4.2,    // how fast the orb bursts — settles into the ring before the flow leaves
  spin: 0.22,         // idle rotation speed of the parked orb
};
const BURST_START = 0.30;        // heroP where the burst begins (beat B lead-in)
/* orb centre, screen fraction (0..1, top-left origin) — baked from the GUI */
const ORB = { x: 0.50, y: 0.38 };
/* the two Milo-Hand images that sweep in from the top corners and cradle
   the orb (image-1 layout). Each is placed by its centre (x,y screen frac),
   sized by `scale` (image width as a fraction of the viewport width), and
   can be mirrored on either axis. Baked from the GUI. */
/* per hand: `rotY` = persistent resting Y-turn (deg); `burstRotY` = extra
   Y-turn applied per-hand as the orb bursts (deg, scaled by burst). Baked. */
const HANDS = {
  left:  { x: 0.24, y: 0.23, scale: 0.30, flipX: true,  flipY: true,  rotY: 0, burstRotY: -55 },
  right: { x: 0.75, y: 0.23, scale: 0.30, flipX: false, flipY: true,  rotY: 0, burstRotY: 55 },
};
/* how the hands recoil as the orb bursts: `move` = world units each hand
   travels away from the orb; `rotX/rotZ` = shared degrees on those axes as
   it pulls back (Y is per-hand, see HANDS.*.burstRotY). Baked. */
const HAND_BURST = { move: 7, rotX: 0, rotZ: 0 };

/* map a screen fraction (0..1, top-left origin) to a world point on plane z */
function screenFracToWorld(fx, fy, z) {
  const v = visHalf(z);
  return [(fx - 0.5) * 2 * v.w, -(fy - 0.5) * 2 * v.h, z];
}
function ballWorld() { return screenFracToWorld(ORB.x, ORB.y, SPHERE_Z); }

/* the burst target — a full-viewport scatter the orb explodes into */
const heroSpread = new Float32Array(N * 3);

/* 0 · HERO orb — dots packed into a PERFECT filled ball at the hand cup.
   (No z stretch: a spheroid rotates into a wide egg as the orb spins. The
   3D read now comes from real perspective size-attenuation + depth-buffer
   occlusion + the atmospheric wash below.) */
const ORB_DEPTH = 1.0;               // keep 1.0 — a true sphere at every angle
/* MEASURE helix — volumetric depth cue: dots on the FAR side of the twist
   wash toward the white backdrop, so the strand reads as a rounded 3D
   cylinder catching light on its near face, not a flat ribbon of dots. */
const DNA_DEPTH_CENTER = -3;         // z the helix twists around (its rotate2D pivot)
const DNA_DEPTH_HALF   = 3.6;        // z half-span used to normalise near↔far (≈ helix radius)
const DNA_DEPTH_WASH   = 0.6;        // how far the FARTHEST dots fade into the backdrop (0..1)
const BASE_DOT_SIZE    = 1.2;        // the field's default point size (world units)
/* MINI DNA — the helix as it sits on the "Get a 360° view" (12-skills) screen.
   x/y/z place it, scale sets its overall size (height + radius, kept in
   proportion), dotScale shrinks the dots to match so it reads as a true
   scaled-down copy, not a same-dot clump. All live-tunable from the GUI. */
const DNA2_CFG = { x: 10.9, y: -0.6, z: 4.4, scale: 0.96, dotScale: 0.99 };
function sphereHero(pos) {
  const r = rng(21);
  const c = ballWorld();
  const R = SPHERE.radius;
  for (let i = 0; i < N; i++) {
    const rr = R * Math.cbrt(r());     // uniform in volume
    const u = 2 * r() - 1;             // cos(theta)
    const phi = 2 * Math.PI * r();
    const s = Math.sqrt(Math.max(0, 1 - u * u));
    pos[i * 3] = c[0] + rr * s * Math.cos(phi);
    pos[i * 3 + 1] = c[1] + rr * s * Math.sin(phi);
    pos[i * 3 + 2] = c[2] + rr * u * ORB_DEPTH;
  }
}

/* refill the two hero layouts (orb + burst scatter) — run at build, on
   resize, and whenever a GUI control moves the orb/hand */
let handAPI = null;
let viewsHandsAPI = null;
function relayoutHero() {
  if (!three) return;
  sphereHero(three.F[0].pos);
  spreadHero(heroSpread);
  if (handAPI) handAPI.update();
}

/* build the whole network for the current config. Links are stored as
   pairs of *field* indices, so drawLinks can read endpoints straight from
   the live dot field. Node/branch angles are stored so layoutHeroRing can
   place those exact dots on / just outside the rim. */
let heroNet = buildHeroNetwork(HERO_CFG);
function buildHeroNetwork(cfg) {
  const r = rng(7);
  const count = Math.max(2, Math.round(cfg.count));

  /* Rim nodes are laid evenly around the FULL circle (starting at the top),
     so the connection ring can close all the way round back to the first
     dot. The bottom now carries dots too (see layoutHeroRing's bottom fill),
     so a node there is no longer stranded in an empty gap. */
  const step = (Math.PI * 2) / count;
  const nodeIdx = new Int32Array(count);
  const nodeAng = new Float32Array(count);
  for (let k = 0; k < count; k++) {
    nodeIdx[k] = Math.round((k * N) / count) % N;
    nodeAng[k] = HERO_TOP + k * step + (r() - 0.5) * step * cfg.spacing;
  }

  /* leaf dots: a distinct field dot hung just outside a rim node, joined to
     it by a single line — a branch off the ring. `branchLinks` are host→leaf
     field-index pairs, drawn on top of the garland. */
  const branchIdx = [];
  const branchAng = [];
  const branchLinks = [];
  const used = new Set();
  for (let k = 0; k < count; k++) used.add(nodeIdx[k]);
  const nb = Math.max(0, Math.round(cfg.branches));
  for (let b = 0; b < nb; b++) {
    const host = Math.floor(r() * count);
    let li = 0, guard = 0;
    do { li = Math.floor(r() * N); guard++; } while (used.has(li) && guard < 60);
    used.add(li);
    branchIdx.push(li);
    branchAng.push({ ang: nodeAng[host] + (r() - 0.5) * 0.5, rad: 1.22 + r() * 0.3 });
    branchLinks.push([nodeIdx[host], li]);
  }

  return { count, nodeIdx, nodeAng, branchIdx, branchAng, branchLinks };
}

/* place the network's dots: rim nodes stay EXACTLY on the ellipse (so the
   wired web keeps its shape), leaves just outside it. Everyone else is
   PARKED on their half's path arc — the ring is literally the head of the
   two flow queues. Every dot (wired ones included) gets a side + queue
   slot from its ring angle, so the whole field knows where to flow.
   Re-run on resize so the rim always lands near the frame edge. */
function layoutHeroRing(ring) {
  layoutDashPaths();
  const v = visHalf(RING_Z);
  const rx = Math.min(v.w * 0.86, 21) * HERO_CFG.ringScale, ry = v.h * 0.8 * HERO_CFG.ringScale;
  const r = rng(12);
  const net = heroNet;
  const special = new Uint8Array(N);
  const setQueue = (i, ang) => {
    const m = angleToQueue(ang);
    dotSide[i] = m.side;
    dotQ[i] = m.q;
  };
  for (let k = 0; k < net.nodeIdx.length; k++) {
    const i = net.nodeIdx[k];
    special[i] = 1;
    ring[i * 3] = Math.cos(net.nodeAng[k]) * rx;
    ring[i * 3 + 1] = Math.sin(net.nodeAng[k]) * ry;
    ring[i * 3 + 2] = RING_Z;
    setQueue(i, net.nodeAng[k]);
    /* wired nodes carry no jitter — they must sit dead on the rim */
    dashJit[i * 3] = dashJit[i * 3 + 1] = dashJit[i * 3 + 2] = 0;
  }
  for (let b = 0; b < net.branchIdx.length; b++) {
    const i = net.branchIdx[b];
    special[i] = 1;
    const ba = net.branchAng[b];
    ring[i * 3] = Math.cos(ba.ang) * rx * ba.rad;
    ring[i * 3 + 1] = Math.sin(ba.ang) * ry * ba.rad;
    ring[i * 3 + 2] = RING_Z;
    setQueue(i, ba.ang);
    dashJit[i * 3] = dashJit[i * 3 + 1] = dashJit[i * 3 + 2] = 0;
  }
  const p = [0, 0, 0];
  const span = Math.PI - ARC_CUT;
  for (let i = 0; i < N; i++) {
    if (special[i]) continue;
    const jit = r(), jx = r(), jy = r(), jz = r();
    const ang = (i / N) * Math.PI * 2 + (jit - 0.5) * 0.55;
    setQueue(i, ang);
    dashJit[i * 3] = (jx - 0.5) * 3.2;
    dashJit[i * 3 + 1] = (jy - 0.5) * 2.4;
    dashJit[i * 3 + 2] = (jz - 0.5) * 2;
    /* Is this dot in the bottom wedge the two flow arcs don't cover? (Its
       queue slot would clamp past the arc end.) If so, PARK IT DIRECTLY on
       the full ellipse so the ring's dot band closes across the bottom and
       bleeds off the bottom edge — mirroring the top — instead of piling up
       at the arc ends. It rejoins its queue when the flow leaves. */
    let a = ang % (2 * Math.PI);
    if (a < 0) a += 2 * Math.PI;
    if (a >= 3 * Math.PI / 2) a -= 2 * Math.PI;   // → [-π/2, 3π/2)
    const ratio = a > Math.PI / 2 ? (a - Math.PI / 2) / span : (Math.PI / 2 - a) / span;
    if (ratio > 1) {
      ring[i * 3] = Math.cos(ang) * rx + dashJit[i * 3] * RING_JIT;
      ring[i * 3 + 1] = Math.sin(ang) * ry + dashJit[i * 3 + 1] * RING_JIT;
      ring[i * 3 + 2] = RING_Z + dashJit[i * 3 + 2] * RING_JIT;
    } else {
      /* parked exactly where its queue slot sits on the path (wide band) —
         so "start flowing" is just this same point with a larger t */
      dashPoint(dotSide[i], dotQ[i], i * 3, p);
      ring[i * 3] = p[0];
      ring[i * 3 + 1] = p[1];
      ring[i * 3 + 2] = p[2];
    }
  }
}

/* Dashboard flow: TWO crossing paths, and the hero ring IS their head.
   Each path = an auto-generated arc along one half of the ring (red = left
   half, blue = right half, both running top → bottom) + the hand-drawn flow
   tail below it. Every non-wired ring dot is PARKED on its half's arc — a
   queue standing on the path — so the hand-over is nothing but the whole
   queue advancing: dots move immediately, divide by which half they stood
   in, cross in the middle, and enter the card from opposite sides.
   Flow control points are viewport fractions [x,y] (0..1, top-left origin)
   so the shape survives any aspect AND can be dragged by the path editor.
   To bake an edited layout, copy the editor's textarea over DASH_PATHS. */
const STREAM_Z = -5.5;
const RING_Z = -3;        // the ring's dot plane — the arc portion sits here
const DASH_ROLL = 1.2;    // depth roll (world units) so the flow ribbon isn't flat
const DASH_STEPS = 96;    // spline samples per path — resolution of the flow line
let DASH_SPEED = 0.07;    // how fast dots move along the path (cycles/sec) — GUI "Dot flow speed"
const RING_JIT = 2.4;     // band width while parked in the ring (× base jitter)
const FLOW_JIT = 0.3;     // band width once flowing into the card (× base jitter)
const ARC_PTS = 6;        // control points auto-laid along each ring half
const ARC_CUT = 0.55;     // radians trimmed off the ring bottom where the flow tail takes over
/* The flow is one continuous progress φ (0 = parked ring, 1 = poured into
   the card) driven across three scenes. FLOW_CROSS is φ when the CROSS
   screen is centred — i.e. how far along the flow the crossing sits. */
const FLOW_CROSS = 0.5;
/* Tails in viewport fractions [x,y] (0..1). Each stream now has SIX control
   points for finer trajectory control, and the two are a perfect mirror about
   x = 0.5 (blue[k] = [1 - red[k][0], red[k][1]]) so the crossing stays
   symmetric. The 3rd point of each (index 2) is the SHARED crossing point at
   x = 0.5 — both paths pass through it, so they cross there, on-screen, over
   the hero text. red = left ring half → sweeps up, crosses top-centre, fans
   down into the RIGHT corner; blue = mirror into the LEFT corner. Drag any
   handle in the path editor to reshape; keep index 2 at x = 0.5 to keep the
   crossing centred (and, ideally, mirror the two sides to stay symmetric). */
const DASH_PATHS = {
  red:  [[0.335, 0.680], [0.420, 0.360], [0.500, 0.140], [0.843, 0.187], [0.946, 0.493], [0.776, 0.671]],
  blue: [[0.665, 0.680], [0.580, 0.360], [0.500, 0.140], [0.157, 0.187], [0.054, 0.493], [0.224, 0.671]],
};
/* world-space polylines the dots actually follow, rebuilt from the ring
   geometry + DASH_PATHS. DASH_R = path param where the arc ends, DASH_CS =
   param where the flow tail starts (the steady-state cycle band is
   [DASH_CS, 1], whose head point sits just off-screen so the wrap is
   invisible). Queue travel is exactly DASH_CS, so a fully-advanced queue
   lands exactly on the cycle band. */
const dashLine = { red: [], blue: [] };
let DASH_R = 0, DASH_CS = 0;
/* per-dot queue state, filled by layoutHeroRing */
const dotSide = new Uint8Array(N);   // 0 = red (left half), 1 = blue (right)
const dotQ = new Float32Array(N);    // parked param along the path, ∈ [0, DASH_R]
const dashJit = new Float32Array(N * 3);

function catmull(p0, p1, p2, p3, t) {
  const t2 = t * t, t3 = t2 * t;
  return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
}
/* sample a control-point list at u∈[0,1] over the whole path → fraction [x,y] */
function sampleFrac(pts, u) {
  const n = pts.length - 1;
  const seg = Math.min(Math.floor(u * n), n - 1), lt = u * n - seg;
  const p0 = pts[Math.max(0, seg - 1)], p1 = pts[seg], p2 = pts[seg + 1], p3 = pts[Math.min(n, seg + 2)];
  return [catmull(p0[0], p1[0], p2[0], p3[0], lt), catmull(p0[1], p1[1], p2[1], p3[1], lt)];
}
/* the ring-half arc, as viewport-fraction control points matching the rim
   ellipse exactly (red sweeps top→left→bottom, blue top→right→bottom) */
function ringArcFracs(side) {
  const v = visHalf(RING_Z);
  const rx = Math.min(v.w * 0.86, 21) * HERO_CFG.ringScale, ry = v.h * 0.8 * HERO_CFG.ringScale;
  const fx = rx / (2 * v.w), fy = ry / (2 * v.h);
  const a0 = Math.PI / 2;
  const a1 = side ? -Math.PI / 2 + ARC_CUT : 3 * Math.PI / 2 - ARC_CUT;
  const pts = [];
  for (let k = 0; k < ARC_PTS; k++) {
    const a = a0 + (a1 - a0) * (k / (ARC_PTS - 1));
    pts.push([0.5 + Math.cos(a) * fx, 0.5 - Math.sin(a) * fy]);
  }
  return pts;
}
function compositeFracs(side) {
  return ringArcFracs(side).concat(DASH_PATHS[side ? 'blue' : 'red']);
}
function layoutDashPaths() {
  for (const side of [0, 1]) {
    const pts = compositeFracs(side);
    const nSeg = pts.length - 1;
    DASH_R = (ARC_PTS - 1) / nSeg;
    DASH_CS = ARC_PTS / nSeg;
    const line = side ? dashLine.blue : dashLine.red;
    line.length = 0;
    for (let s = 0; s <= DASH_STEPS; s++) {
      const u = s / DASH_STEPS;
      const f = sampleFrac(pts, u);
      /* the arc rides the ring plane; the tail eases down to the stream
         plane with a shallow roll so the ribbon isn't flat. The frac→world
         conversion uses each sample's OWN depth. */
      const fu = clamp((u - DASH_R) / (1 - DASH_R));
      const z = lerp(RING_Z, STREAM_Z, smooth(clamp(fu * 2))) + Math.sin(fu * Math.PI) * DASH_ROLL;
      const v = visHalf(z);
      line.push([(f[0] - 0.5) * 2 * v.w, -(f[1] - 0.5) * 2 * v.h, z]);
    }
  }
}
/* position on a path at param t (0 = ring top, DASH_R = ring bottom, 1 =
   inside the card). The jitter band is wide while parked and tightens as
   the flow funnels in. */
function dashPoint(side, t, j3, out) {
  const line = side ? dashLine.blue : dashLine.red;
  const SEG = line.length - 1;
  const tc = clamp(t);
  const seg = Math.min(Math.floor(tc * SEG), SEG - 1), tt = tc * SEG - seg;
  const a = line[seg], b = line[seg + 1];
  const j = lerp(RING_JIT, FLOW_JIT, smooth(clamp((tc - DASH_R) / ((1 - DASH_R) * 0.7))));
  out[0] = lerp(a[0], b[0], tt) + dashJit[j3] * j;
  out[1] = lerp(a[1], b[1], tt) + dashJit[j3 + 1] * j;
  out[2] = lerp(a[2], b[2], tt) + dashJit[j3 + 2] * j;
}
/* which half a ring angle belongs to, and its queue slot along that half */
function angleToQueue(theta) {
  let a = theta % (2 * Math.PI);
  if (a < 0) a += 2 * Math.PI;
  if (a >= 3 * Math.PI / 2) a -= 2 * Math.PI;   // → [-π/2, 3π/2)
  const span = Math.PI - ARC_CUT;
  if (a > Math.PI / 2) return { side: 0, q: clamp((a - Math.PI / 2) / span) * DASH_R };
  return { side: 1, q: clamp((Math.PI / 2 - a) / span) * DASH_R };
}

/* ── Reports funnel ─────────────────────────────────────────────────
   On the "Schools see…" screen the dots pour INTO the video box; on the
   hand-over to "Teachers share…" they pour OUT of the box bottom in a
   tapering funnel and flow down into the next screen. All five knobs are
   live-tunable from the GUI ("Reports funnel"). Widths/height are world
   units; x/y place the funnel MOUTH (the wide end at the box bottom) in the
   camera-relative field space (x+ = right, y+ = up, 0,0 = screen centre). */
const FUNNEL_CFG = {
  maxWidth: 11,   // mouth width — the wide end (top), streaming in from above the frame
  minWidth: 2,    // spout width — the narrow end (bottom), landing on the card top
  x: 0,           // horizontal centre of the funnel
  y: 16,          // mouth Y (top of the pour); the spout end tracks the card top
  fallSpeed: 0.2, // waterfall speed — falls top→bottom per second (GUI "Fall speed")
};
/* the report card's top edge in world-Y at rest (measured), and one viewport
   expressed in world units at the funnel plane. The waterfall's spout ends
   exactly at the card's top edge, tracked live as the card slides up into
   view (repIn) — so the pour always lands on the card, whatever its position. */
const REPORT_CARD_TOP_Y = 9.7;
const VIEWPORT_WORLD_H = (CAM_DIST + 4) * Math.tan((50 * Math.PI / 180) / 2) * 2; // ≈ 27.98
/* per-dot waterfall state: a stable horizontal slot, a phase offset (where the
   dot sits in its fall), and a depth. The step loop advances each dot's phase
   over time, wraps it at the bottom, and fades it at the very top/bottom so the
   loop is invisible — a continuous stream of dots pouring down the funnel. */
const funH = new Float32Array(N);   // horizontal fraction within the width, [-0.5, 0.5]
const funPh = new Float32Array(N);  // phase offset along the fall, [0, 1)
const funZ = new Float32Array(N);   // depth
(() => { const r = rng(71); for (let i = 0; i < N; i++) { funH[i] = r() - 0.5; funPh[i] = r(); funZ[i] = -4 - r() * 3; } })();

/* COLLECT SPLIT flow — after the Reports cards settle, the field divides into a
   left half and a right half, each sweeping OUT from the side of the report
   images, arcing down and around, then merging into one dense BALL that holds
   in the centre of the screen (the Collect scene — no spiral). Filled from the
   cluster formation as it's built. collectPos = each dot's target in the ball;
   collectSide = which side it exits from (−1 left / +1 right, by its target's
   x); collectFrac = a stable stagger so the dots string out along the arc as a
   continuous ribbon rather than all moving in lockstep. */
const collectPos = new Float32Array(N * 3);
const collectSide = new Int8Array(N);
const collectFrac = new Float32Array(N);
(() => { const r = rng(214); for (let i = 0; i < N; i++) collectFrac[i] = r(); })();

/* COLLECT SPLIT arc control points, as SCREEN FRACTIONS (0..1, top-left
   origin) — editable live via the GUI "Edit collect arcs" toggle. Each side is
   a cubic Bézier: A (start beside the cards) → C1 (out to the screen side) →
   C2 (down low) → the spiral centre. `red` = the left stream, `blue` = the
   right stream. The COLLECT SPLIT step block maps these to world points with
   screenFracToWorld each frame, so dragging a handle reshapes the arc live. To
   bake an edited layout, copy the editor's textarea over COLLECT_ARC. */
const COLLECT_ARC = {
  red:  [[0.31, 0.28], [0.07, 0.43], [0.19, 0.87]],
  blue: [[0.69, 0.28], [0.93, 0.43], [0.81, 0.87]],
};

/* 3 VIEWS — the three orbs' world centres (x, shared y, shared z) plus each
   orb's own axial spin. Shared by the formation and the per-orb planet spin so
   they always line up. Each orb is a real 3-D SPHERE that turns on its own
   vertical axis (x–z rotation) at its own rate/direction — so they read as
   three spinning planets, not flat on-screen swirls. */
const VIEWS_CX = [-9, 0, 9];
const VIEWS_CY = 0.8;
const VIEWS_Z = -4;
const VIEWS_R = 3.4;                       // sphere radius (world)
const VIEWS_ZD = 1.0;                      // 1 = a true sphere (no z-stretch → no egg wobble)
const VIEWS_SPIN = [0.26, -0.19, 0.32];    // rad/s per orb (sign = direction)

/* 3 VIEWS — the two Milo hands that frame the orbs from the sides (image
   layout): screen-fraction centre, size as a viewport-width fraction, flip to
   mirror, and X/Y/Z rotation to angle the reach inward. Baked from the GUI. */
const VIEWS_HANDS = {
  left:  { x: 0.125, y: 0.690, scale: 0.245, flipX: true,  flipY: false, rotX: 0, rotY: 0, rotZ: 18 },
  right: { x: 0.875, y: 0.690, scale: 0.245, flipX: false, flipY: false, rotX: 0, rotY: 0, rotZ: -18 },
};

function buildFormations() {
  const tmp = new THREE.Color();
  const white = new THREE.Color('#ffffff');
  const F = [];
  const make = () => ({ pos: new Float32Array(N * 3), col: new Float32Array(N * 3) });
  const setC = (f, i, hex, soften = 0.1) => {
    tmp.set(hex).lerp(white, soften);
    f.col[i * 3] = tmp.r; f.col[i * 3 + 1] = tmp.g; f.col[i * 3 + 2] = tmp.b;
  };
  const setP = (f, i, x, y, z) => { f.pos[i * 3] = x; f.pos[i * 3 + 1] = y; f.pos[i * 3 + 2] = z; };
  const MIX = [C.green, C.cyan, C.yellow, C.orange, C.pink2];

  /* one dot placed inside the tapering funnel (mouth t=0 → spout t=1), from
     the live FUNNEL_CFG — shared by the dedicated Funnel screen and the
     Reports funnel so both track the GUI knobs. `r` is the caller's rng. */
  const funnelDot = (f, i, r) => {
    const t = r();
    const width = lerp(FUNNEL_CFG.maxWidth, FUNNEL_CFG.minWidth, t);
    setP(f, i,
      FUNNEL_CFG.x + (r() - 0.5) * width,
      lerp(FUNNEL_CFG.y, REPORT_CARD_TOP_Y, t) + (r() - 0.5) * 0.8,   // mouth → card top (rest)
      -4 - r() * 3);
    setC(f, i, MIX[i % 5]);
  };

  /* 0 · HERO — dots packed into a spherical cluster cradled in the hand.
       Beat B bursts them into the ring (see layoutHeroRing / the step() burst
       block). `heroSpread` is kept as a spare full-viewport scatter. */
  const hero = make();
  {
    sphereHero(hero.pos);
    spreadHero(heroSpread);
    for (let i = 0; i < N; i++) setC(hero, i, MIX[i % 5]);
    F.push(hero);
  }
  /* hero beat B target — see layoutHeroRing(). The wiring lives in the
     module-level `heroNet` (see buildHeroNetwork), rebuilt live from the
     GUI; the ring positions are laid out from it here. */
  const heroRing = new Float32Array(N * 3);
  layoutHeroRing(heroRing);

  /* 1 · CROSS — the dedicated crossing screen. A fallback formation only:
       the step loop overrides positions with the live flow, so these are
       just the mid-flow crossing state, tinted with the same rainbow so the
       field's colour is continuous through the hand-over. */
  {
    const cross = make();
    const p = [0, 0, 0];
    for (let i = 0; i < N; i++) {
      dashPoint(dotSide[i], clamp(dotQ[i] + DASH_CS * FLOW_CROSS), i * 3, p);
      setP(cross, i, p[0], p[1], p[2]);
      setC(cross, i, MIX[i % 5]);
    }
    F.push(cross);
  }

  /* 2 · DASHBOARD — the two queues, fully advanced: every dot somewhere on
       its flow tail's cycle band [DASH_CS, 1], frozen at time 0. This is the
       formation the base morph blends toward; the step loop overrides it
       with the live queue/cycle animation. The last waypoints sit inside
       the card, and the card (.content, z-index 2) paints over the canvas
       (#world, z-index 1) — so the dots are physically swallowed at its
       edge with no fade needed. */
  const streamT = new Float32Array(N);   // flow-cycle phase = queue order, ∈ [0,1]
  const dash = make();
  const relayoutDash = () => {
    const p = [0, 0, 0];
    for (let i = 0; i < N; i++) {
      streamT[i] = DASH_R > 0 ? dotQ[i] / DASH_R : 0;
      dashPoint(dotSide[i], DASH_CS + streamT[i] * (1 - DASH_CS), i * 3, p);
      setP(dash, i, p[0], p[1], p[2]);
    }
  };
  {
    for (let i = 0; i < N; i++) setC(dash, i, MIX[i % 5]);
    relayoutDash();
    F.push(dash);
  }

  /* 2.5 · FUNNEL — the dedicated empty screen between "Schools see…" and
       "Teachers share…". EVERY dot holds the tapering funnel (FUNNEL_CFG), so
       the dots pour out of the box and travel down through this space; its
       scroll length is the "Funnel screen height" GUI slider. layoutFunnelScene
       is returned so the funnel knobs rebuild it live. */
  const funnelForm = make();
  const layoutFunnelScene = () => {
    const r = rng(34);
    for (let i = 0; i < N; i++) funnelDot(funnelForm, i, r);
  };
  layoutFunnelScene();
  F.push(funnelForm);

  /* 3 · REPORTS — the funnel resolves into "Teachers share…": all dots hold
       the funnel and keep pouring into the report card. Same FUNNEL_CFG so it
       lines up with the Funnel screen; layoutReportsFunnel is returned so the
       GUI rebuilds it live too. */
  const fan = make();
  const layoutReportsFunnel = () => {
    const r = rng(33);
    for (let i = 0; i < N; i++) funnelDot(fan, i, r);
  };
  layoutReportsFunnel();
  F.push(fan);

  /* 3 · COLLECT — the two split streams merge into one big dense BALL that
     holds in the centre of the screen (no spiral). Uniform-density disc so it
     reads as a solid cluster. The pink dots (i%5===4) are faded to white here
     so the settled cluster carries no pink, matching the fade that runs as the
     streams gather. */
  {
    const cl = make();
    const r = rng(44);
    const R = 7.4;                                   // cluster radius (world) — the big centred ball
    for (let i = 0; i < N; i++) {
      const ang = r() * Math.PI * 2;
      const rad = Math.sqrt(r()) * R;                // sqrt → uniform area density
      const x = Math.cos(ang) * rad, y = Math.sin(ang) * rad * 0.94, z = -4.5 + (r() - 0.5) * 3;
      setP(cl, i, x, y, z);
      const pink = i % 5 === 4;
      if (pink) { cl.col[i * 3] = 1; cl.col[i * 3 + 1] = 1; cl.col[i * 3 + 2] = 1; }
      else setC(cl, i, MIX[i % 5]);
      collectPos[i * 3] = x; collectPos[i * 3 + 1] = y; collectPos[i * 3 + 2] = z;
      collectSide[i] = x < 0 ? -1 : 1;
    }
    F.push(cl);
  }

  /* 4 · 3 VIEWS — the Collect ball splits into three clean 3-D SPHERES. Each
     orb's dots sit on an evenly-spaced Fibonacci SHELL (crisp, round silhouette
     — no ragged volume blobbing) with a hair of radial jitter, so it reads as a
     tidy planet that spins with depth (per-orb axial spin + depth shading in
     step()). */
  {
    const v = make();
    const r = rng(55);
    const colors = [C.green, C.yellow, C.cyan];
    const GOLD = Math.PI * (3 - Math.sqrt(5));   // golden angle
    const M = Math.ceil(N / 3);                  // ~dots per orb
    for (let i = 0; i < N; i++) {
      const k = i % 3;
      const j = (i - k) / 3;                                 // index within this orb
      const yy = clamp(1 - (j / (M - 1)) * 2, -1, 1);        // even from +1 (top) to −1 (bottom)
      const rq = Math.sqrt(Math.max(0, 1 - yy * yy));        // ring radius at this latitude
      const th = GOLD * j;
      const rad = VIEWS_R * (0.95 + r() * 0.05);             // sit near the surface, faint jitter
      setP(v, i, VIEWS_CX[k] + Math.cos(th) * rq * rad, VIEWS_CY + yy * rad, VIEWS_Z + Math.sin(th) * rq * rad);
      setC(v, i, colors[k], 0.06);
    }
    F.push(v);
  }

  /* 5 · MEASURE — a DNA of dots: green strand, cyan strand, orange
       rungs. dnaThresh[i] = when (in section progress) dot appears */
  const dnaThresh = new Float32Array(N);
  /* cx/cy/cz offset the whole helix; scale keeps height, radius and twist in
     proportion (TW ∝ 1/scale so the number of turns is scale-invariant). */
  const helixDots = (f, cx, cy, cz, scale, seed) => {
    const r = rng(seed);
    const R = 3.4 * scale, H = 21 * scale, TW = 0.62 / scale;
    const z0 = DNA_DEPTH_CENTER + cz;
    for (let i = 0; i < N; i++) {
      const role = i % 3, t = ((i - role) / 3) / (N / 3); // 0..1 along strand
      const j = () => (r() - 0.5) * 0.5 * scale;
      if (role < 2) { // strands
        const y = (0.5 - t) * H;
        const ang = y * TW + (role ? Math.PI : 0);
        setP(f, i, cx + Math.sin(ang) * R + j(), cy + y + j(), z0 + Math.cos(ang) * R + j());
        setC(f, i, role ? C.cyan : C.green, 0.05);
        dnaThresh[i] = role === 0 ? t * 0.28 : 0.28 + t * 0.28;
      } else { // rungs: 14 dotted bars
        const rungCount = 14;
        const k = Math.floor(t * rungCount), rt = (t * rungCount) % 1;
        const y = (0.5 - (k + 0.5) / rungCount) * (H * 0.94);
        const ang = y * TW;
        const ax = cx + Math.sin(ang) * R, az = z0 + Math.cos(ang) * R;
        const bx = cx + Math.sin(ang + Math.PI) * R, bz = z0 + Math.cos(ang + Math.PI) * R;
        setP(f, i, lerp(ax, bx, rt) + j() * 0.5, cy + y + j() * 0.5, lerp(az, bz, rt) + j() * 0.5);
        setC(f, i, C.orange, 0.05);
        dnaThresh[i] = 0.58 + (k / rungCount) * 0.22;
      }
    }
  };
  { const dna = make(); helixDots(dna, 0, 0, 0, 1, 66); F.push(dna); }

  /* 6 · 12 SKILLS — the same DNA, offset + scaled down (DNA2_CFG). Kept as its
     own form so the GUI can re-lay it live: rebuildDNA2() re-runs helixDots
     into this form's buffers and the morph picks it up on the next frame. */
  const dna2 = make();
  const rebuildDNA2 = () => helixDots(dna2, DNA2_CFG.x, DNA2_CFG.y, DNA2_CFG.z, DNA2_CFG.scale, 66);
  rebuildDNA2();
  F.push(dna2);

  /* 7 · ON TRACK — the dots arrange themselves into children */
  {
    const kids = make();
    const r = rng(77);
    const centers = [-9.5, 0, 9.5];
    const KIDMIX = [C.green, C.cyan, C.yellow];
    for (let i = 0; i < N; i++) {
      const k = i % 3;
      const t = r() * Math.PI * 2;
      // five-limbed star-child: head, two arms, two legs
      const rad = 4.6 * (0.68 + 0.32 * Math.cos(5 * (t + Math.PI / 2))) + (r() - 0.5) * 0.5;
      setP(kids, i, centers[k] + Math.cos(t) * rad * 0.95, Math.sin(t) * rad - 1.2, -3 - r() * 2);
      setC(kids, i, KIDMIX[(i + k) % 3], 0.06);
    }
    F.push(kids);
  }

  /* 8 · ASK-TILLI — generic noise on the left, Tilli's orbits right */
  {
    const ai = make();
    const r = rng(88);
    for (let i = 0; i < N; i++) {
      if (i % 2 === 0) {
        setP(ai, i, -9 + (r() - 0.5) * 9, (r() - 0.5) * 12, -3 - r() * 6);
        setC(ai, i, C.gray, 0.15);
      } else {
        const ring = i % 6 < 2 ? 2.2 : i % 6 < 4 ? 3.8 : 5.4;
        const ang = r() * Math.PI * 2;
        setP(ai, i, 9 + Math.cos(ang) * ring, Math.sin(ang) * ring * 0.9, -3 - r() * 2);
        setC(ai, i, [C.cyan, C.green, C.yellow][i % 3], 0.06);
      }
    }
    F.push(ai);
  }

  /* 9 · IMPACT — celebration confetti */
  {
    const im = make();
    const r = rng(99);
    for (let i = 0; i < N; i++) {
      const u = r() * 2 - 1, ang = r() * Math.PI * 2;
      const rad = 8.5 + r() * 6, s = Math.sqrt(1 - u * u);
      setP(im, i, Math.cos(ang) * s * rad * 1.4, u * rad * 0.8, Math.sin(ang) * s * rad - 6);
      setC(im, i, [C.green, C.cyan, C.pink, C.yellow, C.orange][i % 5], 0.04);
    }
    F.push(im);
  }

  /* 10 · JOURNEY — a winding dotted path */
  {
    const j = make();
    const r = rng(111);
    for (let i = 0; i < N; i++) {
      const t = i / N;
      const y = (0.5 - t) * 22;
      setP(j, i, Math.sin(y * 0.42) * 6.5 - 6 + (r() - 0.5) * 1.6, y + (r() - 0.5) * 1.2, -4 - r() * 3);
      setC(j, i, MIX[i % 5]);
    }
    F.push(j);
  }

  /* 11 · LET'S TALK — every data point becomes one heart */
  {
    const h = make();
    const r = rng(122);
    for (let i = 0; i < N; i++) {
      const t = (i / N) * Math.PI * 2;
      const s = 0.55 * (0.78 + r() * 0.28);
      setP(h, i, 16 * Math.pow(Math.sin(t), 3) * s,
        (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * s + 1,
        -3 - r() * 3);
      setC(h, i, i % 7 === 0 ? C.yellow : i % 2 ? C.pink : C.pink2, 0.05);
    }
    F.push(h);
  }

  return { F, heroRing, dnaThresh, streamT, relayoutDash, layoutReportsFunnel, layoutFunnelScene, rebuildDNA2 };
}

function initThree() {
  const canvas = document.getElementById('world');
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  } catch (e) {
    canvas.style.display = 'none';
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene3 = new THREE.Scene();
  scene3.fog = new THREE.Fog(0xffffff, CAM_DIST + 8, CAM_DIST + 46);
  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 400);
  camera.position.set(0, 0, CAM_DIST);
  const tex = dotTexture();

  /* ambient dust — fixed in the world, makes the flight felt */
  {
    const M = 420;
    const pos = new Float32Array(M * 3);
    const col = new Float32Array(M * 3);
    const r = rng(7);
    const c = new THREE.Color();
    for (let i = 0; i < M; i++) {
      pos[i * 3] = (r() - 0.5) * 44 * Math.max(1, (window.innerWidth / Math.max(1, window.innerHeight)) / 1.6);
      pos[i * 3 + 1] = (r() - 0.5) * 26;
      pos[i * 3 + 2] = 30 - r() * (scenes.length * DEPTH + 60);
      c.set(r() < 0.55 ? C.gray : [C.green, C.cyan, C.pink2, C.yellow, C.orange][Math.floor(r() * 5)]);
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    scene3.add(new THREE.Points(g, new THREE.PointsMaterial({ size: 0.14, map: tex, vertexColors: true, transparent: true, opacity: 0.35, depthWrite: false })));
  }

  /* the storytelling field */
  const built = buildFormations();
  const P = new Float32Array(N * 3); P.set(built.F[0].pos);
  const CL = new Float32Array(N * 3); CL.set(built.F[0].col);
  const phases = new Float32Array(N * 3);
  {
    const r = rng(5);
    for (let k = 0; k < N * 3; k++) phases[k] = r() * Math.PI * 2;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(P, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(CL, 3));
  /* depthWrite + alphaTest so a near dot properly occludes the dots behind
     it — without this the field draws in buffer order and far dots paint
     over near ones (the orb looked inside-out). The sprite is a near-solid
     disc, so alphaTest clips only the feathered rim and edges stay clean. */
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: BASE_DOT_SIZE, map: tex, vertexColors: true, transparent: true, opacity: 0.9, depthWrite: true, depthTest: true, alphaTest: 0.5 }));
  pts.frustumCulled = false;
  scene3.add(pts);

  /* hero connections. WebGL ignores LineBasicMaterial.linewidth on every
     desktop driver, so a real stroke has to be geometry: each link is a
     thin quad in the ring's plane, rebuilt each frame so the thread can be
     animated growing out from one dot towards the next. The endpoints are
     read live from the dot field itself — these ARE the scene's dots
     connecting, not a separate overlay of anchor dots. */
  /* `selection` = the field-index set of ring dots that are wired together
     (the "connected dots"). Seeded with the evenly-spaced rim nodes so the
     ring loads with a clean garland; the GUI's picker adds/removes dots
     live. `linkDraw` is rebuilt from the selection by chainLinks() — always
     joining angle-adjacent dots only, so no line ever crosses the middle. */
  const selection = Array.from(heroNet.nodeIdx);
  const defaultSelection = () => Array.from(heroNet.nodeIdx);
  let linkDraw = [];
  let linkPos = new Float32Array(Math.max(selection.length, 1) * 6 * 3);
  const linkGeo = new THREE.BufferGeometry();
  linkGeo.setAttribute('position', new THREE.BufferAttribute(linkPos, 3));
  linkGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 60);
  const links = new THREE.Mesh(linkGeo, new THREE.MeshBasicMaterial({
    color: new THREE.Color(HERO_CFG.color), transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false,
  }));
  links.frustumCulled = false;
  links.renderOrder = 1;
  scene3.add(links);

  /* ── Hero hands: the two Milo-Hand images live IN the 3D scene now, as
     textured planes on the orb's plane, so they parallax with the camera
     and recede with the fly-through instead of floating as a flat overlay.
     Rendered behind the dots (renderOrder −1) so the orb reads in front;
     depthTest off so draw order, not the z-buffer, decides layering. */
  const handTex = new THREE.TextureLoader().load('assets/Milo Hand.png');
  handTex.colorSpace = THREE.SRGBColorSpace;
  const HAND_ASPECT = 963 / 1412;
  const mkHand = () => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ map: handTex, transparent: true, opacity: 1, depthWrite: false, depthTest: false, side: THREE.DoubleSide }),
    );
    m.renderOrder = -1;
    m.frustumCulled = false;
    scene3.add(m);
    return m;
  };
  const handMeshes = { left: mkHand(), right: mkHand() };
  /* base (resting) world position of each hand, cached by update() so the
     per-frame burst offset can be applied on top without recomputing it */
  const handBase = { left: { x: 0, y: 0 }, right: { x: 0, y: 0 } };
  function placeHand(m, cfg, base) {
    const [wx, wy] = screenFracToWorld(cfg.x, cfg.y, HAND_Z);
    const w = cfg.scale * 2 * visHalf(HAND_Z).w;   // world width from viewport-fraction scale
    base.x = wx; base.y = wy;
    m.position.set(wx, wy, HAND_Z);
    m.scale.set(w * (cfg.flipX ? -1 : 1), w * HAND_ASPECT * (cfg.flipY ? -1 : 1), 1);
  }
  const hands = {
    meshes: handMeshes,
    update() { placeHand(handMeshes.left, HANDS.left, handBase.left); placeHand(handMeshes.right, HANDS.right, handBase.right); },
    /* per-frame: pin to the camera plane, and on burst push each hand away
       from the orb (radially) + tilt it back on its X axis, while fading */
    frame(planeZ, burst) {
      const orb = ballWorld();
      const mv = HAND_BURST.move * burst;
      const DEG = Math.PI / 180;
      const bd = DEG * burst;                 // burst-scaled degrees → radians
      const rx = HAND_BURST.rotX * bd, rz = HAND_BURST.rotZ * bd;
      for (const key of ['left', 'right']) {
        const cfg = HANDS[key];
        const m = handMeshes[key], b = handBase[key];
        let dx = b.x - orb[0], dy = b.y - orb[1];
        const len = Math.hypot(dx, dy) || 1; dx /= len; dy /= len;
        m.position.set(b.x + dx * mv, b.y + dy * mv, HAND_Z + planeZ);
        /* Y = this hand's resting turn (persistent) + its own burst turn */
        const ry = (cfg.rotY || 0) * DEG + (cfg.burstRotY || 0) * bd;
        m.rotation.set(rx, ry, rz);
        /* stay opaque through the early swing-out, then fade over the back
           half of the burst so the recoil actually reads before disappearing */
        m.material.opacity = clamp((1 - burst) / 0.55);
      }
    },
  };
  hands.update();

  /* a SECOND pair of Milo hands that frame the three 3-views orbs from the
     sides (the image layout). Same asset; positioned by screen fraction and
     shown only during that scene (opacity driven from step()). */
  const viewsHandMeshes = { left: mkHand(), right: mkHand() };
  viewsHandMeshes.left.material.opacity = 0;
  viewsHandMeshes.right.material.opacity = 0;
  const viewsHands = {
    meshes: viewsHandMeshes,
    frame(planeZ, reveal) {
      const DEG = Math.PI / 180, vw = visHalf(HAND_Z).w;
      for (const key of ['left', 'right']) {
        const cfg = VIEWS_HANDS[key], m = viewsHandMeshes[key];
        const [wx, wy] = screenFracToWorld(cfg.x, cfg.y, HAND_Z);
        const w = cfg.scale * 2 * vw;
        m.position.set(wx, wy, HAND_Z + planeZ);
        m.scale.set(w * (cfg.flipX ? -1 : 1), w * HAND_ASPECT * (cfg.flipY ? -1 : 1), 1);
        m.rotation.set((cfg.rotX || 0) * DEG, (cfg.rotY || 0) * DEG, (cfg.rotZ || 0) * DEG);
        m.material.opacity = reveal;
        m.visible = reveal > 0.01;
      }
    },
  };

  /* Turn the current selection into rim-hugging connection lines, then add
     the branch offshoots. The dots are ordered around the ring with the
     SEAM at the bottom (so the chain runs bottom-right → up and over →
     bottom-left and is left OPEN at the bottom, where the dots thin out).
     Each dot links forward to up to `linksPerNode` neighbours — 1 gives a
     simple outline, more gives a denser web — and any join wider than
     MEASURE_MAXGAP is dropped, so no line ever cuts across the empty middle
     where the text sits. */
  function chainLinks() {
    const ring = built.heroRing;
    /* order the dots starting at the TOP (angle 0) and going ANTI-CLOCKWISE
       (increasing world angle), so the stitch grows from the top around the
       ring; the closed loop then brings it back to the first (top) dot */
    const ord = (i) => {
      let a = Math.atan2(ring[i * 3 + 1], ring[i * 3]) - Math.PI / 2;
      if (a < 0) a += Math.PI * 2;
      return a;
    };
    const nodes = selection
      .filter((i) => i >= 0 && i < N)
      .map((i) => ({ i, o: ord(i) }))
      .sort((p, q) => p.o - q.o);
    const out = [];
    const n = nodes.length;
    const span = Math.max(1, Math.round(HERO_CFG.linksPerNode));
    /* closed loop — each dot links forward to up to `span` neighbours, and
       the last dots wrap back to the first, so the ring reaches its start.
       Pushed in node order (top → anti-clockwise) so drawLinks stitches it on
       in that order. Any join wider than MEASURE_MAXGAP is dropped. */
    for (let s = 0; s < n; s++) {
      for (let d = 1; d <= span; d++) {
        if (d >= n) break;
        const j = (s + d) % n;
        let gap = nodes[j].o - nodes[s].o;
        if (gap < 0) gap += Math.PI * 2;
        if (gap <= MEASURE_MAXGAP) out.push([nodes[s].i, nodes[j].i]);
      }
    }
    /* branch offshoots ride on top, drawn to leaf dots outside the rim */
    for (const bl of heroNet.branchLinks) out.push([bl[0], bl[1]]);
    return out;
  }

  function refreshLinkDraw() {
    linkDraw = chainLinks();
    const need = Math.max(linkDraw.length, 1) * 18;
    if (linkPos.length < need) {
      linkPos = new Float32Array(need);
      linkGeo.setAttribute('position', new THREE.BufferAttribute(linkPos, 3));
    }
  }

  /* re-lay the ring after a structural change (e.g. ring size); the picked
     selection survives — the dots just move, and chainLinks re-reads their
     new angles — so the wiring stays put. */
  function rebuildHeroNetwork() {
    heroNet = buildHeroNetwork(HERO_CFG);
    layoutHeroRing(built.heroRing);
    links.material.color.set(HERO_CFG.color);
    refreshLinkDraw();
  }
  refreshLinkDraw();

  /* ── Manual wiring: pick dots in the scene, then connect them ──────
     A bright overlay marks the current selection; edit mode shows a
     locked, static ring so picking is stable (no scroll/breathing). */
  const raycaster = new THREE.Raycaster();
  raycaster.params.Points.threshold = 1.0;
  const EDIT_VIEW_SCALE = 0.62; // ring shrink while editing, so no dot is occluded
  let editMode = false;
  const contentEl = document.querySelector('.content');

  const selPos = new Float32Array(N * 3);
  const selGeo = new THREE.BufferGeometry();
  selGeo.setAttribute('position', new THREE.BufferAttribute(selPos, 3));
  selGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 60);
  const selMat = new THREE.PointsMaterial({
    size: 2.4, map: tex, color: new THREE.Color('#E91E8C'),
    transparent: true, opacity: 0, depthWrite: false, depthTest: false,
  });
  const selDots = new THREE.Points(selGeo, selMat);
  selDots.frustumCulled = false; selDots.renderOrder = 3;
  scene3.add(selDots);

  function updateSelDots(srcPos) {
    for (let s = 0; s < selection.length; s++) {
      const i = selection[s] * 3;
      selPos[s * 3] = srcPos[i]; selPos[s * 3 + 1] = srcPos[i + 1]; selPos[s * 3 + 2] = srcPos[i + 2];
    }
    selGeo.setDrawRange(0, selection.length);
    selGeo.attributes.position.needsUpdate = true;
    selMat.opacity = (editMode && selection.length) ? 1 : 0;
  }

  function pick(clientX, clientY) {
    const ndc = new THREE.Vector2(
      (clientX / window.innerWidth) * 2 - 1,
      -(clientY / window.innerHeight) * 2 + 1,
    );
    raycaster.setFromCamera(ndc, camera);
    const hits = raycaster.intersectObject(pts);
    if (!hits.length) return;
    /* prefer the dot nearest the click point on screen (smallest distance
       to the ray), not the one nearest the camera — otherwise a faint halo
       dot floating in front steals clicks meant for a rim node */
    let best = hits[0];
    for (const h of hits) if (h.distanceToRay < best.distanceToRay) best = h;
    const idx = best.index;
    const at = selection.indexOf(idx);
    if (at >= 0) selection.splice(at, 1); else selection.push(idx);
    /* the selection IS the wiring now — reconnect live so the ring updates
       the moment a dot is toggled */
    refreshLinkDraw();
  }
  /* the .content HTML sits above the canvas (z 2 > 1) and its steps take
     inline pointer-events:auto from the scroll choreography, so they'd
     swallow every click. A dedicated transparent capture layer above the
     content (but below the GUI) receives the picks instead — picking is
     pure screen→ray math, so it doesn't matter which element is hit. */
  const pickLayer = document.createElement('div');
  pickLayer.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:55;display:none;cursor:crosshair;';
  pickLayer.addEventListener('click', (e) => { if (editMode) pick(e.clientX, e.clientY); });
  document.body.appendChild(pickLayer);

  function setEditMode(on) {
    editMode = on;
    pickLayer.style.display = on ? 'block' : 'none';
    /* fade the copy right down so the dots are clearly visible to pick */
    if (contentEl) { contentEl.style.opacity = on ? '0.12' : ''; contentEl.style.pointerEvents = on ? 'none' : ''; }
    if (on) geo.computeBoundingSphere();
    else selMat.opacity = 0;
  }
  const isEditing = () => editMode;
  /* clear every connection; reset back to the evenly-spaced default garland */
  const clearSelection = () => { selection.length = 0; refreshLinkDraw(); };
  const resetSelection = () => { selection.length = 0; defaultSelection().forEach((i) => selection.push(i)); refreshLinkDraw(); };
  const selectionInfo = () => ({ count: selection.length, links: linkDraw.length });
  const wiringText = () => '[' + selection.join(',') + ']';

  /* edit mode: hold the ring dead-still, fully wired, and render the
     selection overlay — everything else in step() is skipped */
  function stepEdit() {
    camera.position.set(0, 0, CAM_DIST);
    camera.lookAt(0, 0, CAM_DIST - 30);
    P.set(built.heroRing);
    /* pull the whole ring inward for editing so no dot hides behind the
       GUI panel or runs off the frame edge — clicking stays easy. Wiring
       is stored by dot index, so the shrink is purely a picking view. */
    for (let k = 0; k < N * 3; k += 3) { P[k] *= EDIT_VIEW_SCALE; P[k + 1] *= EDIT_VIEW_SCALE; }
    CL.set(built.F[0].col);
    geo.attributes.position.needsUpdate = true;
    geo.attributes.color.needsUpdate = true;
    links.position.z = 0;
    links.material.opacity = Math.max(0.85, HERO_CFG.opacity);
    drawLinks(1, P);
    updateSelDots(P);
    renderer.render(scene3, camera);
  }

  /* lay the link quads out for a given draw progress (0 = nothing yet,
     1 = every thread closed), reading each endpoint live from `srcPos`
     (the field's own positions, breathing and all). Links (procedural +
     manual, stored as pairs of field indices) light up in order with a
     short overlap, so you watch the web stitch itself from the top. */
  const OVERLAP = 2.4;
  function drawLinks(beat, srcPos) {
    const L = linkDraw;
    const hw = HERO_CFG.thickness;
    linkGeo.setDrawRange(0, L.length * 6);
    for (let k = 0; k < L.length; k++) {
      const t = ease(clamp((beat * (L.length + OVERLAP) - k) / OVERLAP));
      const o = k * 18;
      if (t <= 0) { linkPos.fill(0, o, o + 18); continue; }
      const a = L[k][0] * 3, b = L[k][1] * 3;
      const ax = srcPos[a], ay = srcPos[a + 1], az = srcPos[a + 2];
      const tx = lerp(ax, srcPos[b], t), ty = lerp(ay, srcPos[b + 1], t), tz = lerp(az, srcPos[b + 2], t);
      let nx = -(ty - ay), ny = tx - ax;
      const len = Math.hypot(nx, ny) || 1;
      nx = (nx / len) * hw; ny = (ny / len) * hw;
      const v = [
        ax + nx, ay + ny, az, ax - nx, ay - ny, az, tx - nx, ty - ny, tz,
        ax + nx, ay + ny, az, tx - nx, ty - ny, tz, tx + nx, ty + ny, tz,
      ];
      linkPos.set(v, o);
    }
    linkGeo.attributes.position.needsUpdate = true;
  }

  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener('pointermove', (e) => {
    mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
    mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    sphereHero(built.F[0].pos);
    spreadHero(heroSpread);
    hands.update();
    layoutHeroRing(built.heroRing);
    /* layoutHeroRing re-lays the paths too (they're fraction-based, so the
       world polylines must track the viewport aspect) */
    built.relayoutDash();
  });

  return {
    renderer, scene3, camera, geo, P, CL, phases, ...built,
    links, drawLinks, rebuildHeroNetwork, restitch: refreshLinkDraw,
    isEditing, stepEdit, setEditMode, clearSelection, resetSelection,
    selectionInfo, wiringText, getManual: () => selection.slice(),
    hands, viewsHands, dotMat: pts.material,
    mouse, camZ: CAM_DIST, heroP: 0, dnaP: 0,
  };
}

/* ═══════════════════════════════════════════════════════════════════
   DOM CHOREOGRAPHY
   ═══════════════════════════════════════════════════════════════════ */
const washEl = document.getElementById('wash');
/* the dot field canvas — lifted above the page content while the two
   streams cross paths, so the crossing happens IN FRONT of the hero text */
const worldEl = document.getElementById('world');
let curScene = 0;

/* land ~35% into a scene, where its stage is fully faded in */
function sceneScrollTop(i) {
  const s = scenes[clamp(i, 0, LAST)];
  return s.top + s.len * 0.35;
}
function goToScene(i) {
  window.scrollTo({ top: sceneScrollTop(i), behavior: reduced ? 'auto' : 'smooth' });
}
document.getElementById('goPrev').addEventListener('click', () => goToScene(curScene - 1));
document.getElementById('goNext').addEventListener('click', () => goToScene(curScene + 1));

/* in-page anchors must land inside a scene, not on its cold edge */
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const target = document.querySelector(a.getAttribute('href'));
    const i = scenes.findIndex((s) => s.el === target);
    if (i < 0) return;
    e.preventDefault();
    goToScene(i);
  });
});

const beatA = document.getElementById('beatA');
const scrollHint = document.getElementById('scrollHint');
let hintReady = false;

const statEl = document.getElementById('stat');
let counted = false;
function countUp() {
  const t0 = performance.now(), dur = 1400;
  const step = (t) => {
    const p = clamp((t - t0) / dur);
    statEl.textContent = Math.round(2895 * ease(p)).toLocaleString('en-US');
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
if (reduced) counted = true;
else statEl.textContent = '0';

const tabBtns = Array.from(document.querySelectorAll('[data-tab]'));
const tabPanes = Array.from(document.querySelectorAll('[data-tabpane]'));
const TAB_ON = { background: '#FFF6A8', borderColor: '#141414', color: '#141414' };
const TAB_OFF = { background: '#fff', borderColor: 'var(--tl-line-200)', color: '#545454' };
function setTab(i) {
  tabBtns.forEach((b, k) => Object.assign(b.style, k === i ? TAB_ON : TAB_OFF));
  tabPanes.forEach((p, k) => { p.style.display = k === i ? 'block' : 'none'; });
}
tabBtns.forEach((b, i) => b.addEventListener('click', () => setTab(i)));
setTab(0);

function pinTargets(sc) {
  if (sc.t) return sc.t;
  const q = (s) => sc.el.querySelector(s);
  const qa = (s) => Array.from(sc.el.querySelectorAll(s));
  sc.t = {
    zoom: q('[data-zoom]'),
    fans: [q('[data-fan="1"]'), q('[data-fan="2"]'), q('[data-fan="3"]')],
    aiCard: q('[data-ai-card]'), aiAns: q('[data-ai-ans]'), aiFoot: q('[data-ai-foot]'),
    stH: q('[data-st-h]'), stP: q('[data-st-p]'), pops: qa('[data-pop]'),
    skillCards: qa('.skill-card'),
    vH: q('[data-v-h]'), vLabels: qa('.view-label'),
    stageTitles: qa('.stage-title'), stagePanels: qa('.stage-panel'),
  };
  return sc.t;
}

const jPath = document.querySelector('[data-j-path]');
const jBall = document.querySelector('[data-j-ball]');
let jLen = 0;

/* 3 VIEWS text labels — line each one up horizontally UNDER its orb (world x
   ±9 / 0, matched via the same viewport perspective the orbs use), and let each
   move vertically (VIEWS_TEXT_DY, px). layoutViewsText() runs on load + resize
   so the alignment tracks the viewport; the GUI sliders drive the offsets. */
const viewsRow = document.querySelector('.views-row');
const viewsLabels = Array.from(document.querySelectorAll('.view-label'));
const VIEWS_TEXT_DY = [101, 101, 101];   // teacher, student, parents — px vertical offset (baked)
/* the "Every data point…" heading: nudge it in x/y and scale it. Applied on top
   of the scroll-driven reveal scale in the views-pin handler. Baked from the GUI. */
const VIEWS_HEAD = { dx: 0, dy: -221, scale: 1.28 };
function layoutViewsText() {
  if (!viewsRow) return;
  const aspect = Math.max(0.65, window.innerWidth / Math.max(1, window.innerHeight));
  const visW = (CAM_DIST - VIEWS_Z) * Math.tan((50 * Math.PI / 180) / 2) * aspect;   // half visible width at the orb plane
  const orbPx = (Math.abs(VIEWS_CX[0]) / visW) * (window.innerWidth / 2);             // px, screen centre → a side orb
  viewsRow.style.maxWidth = 'none';
  viewsRow.style.width = Math.min(3 * orbPx - 24, window.innerWidth - 48) + 'px';     // side labels land under the side orbs
  viewsLabels.forEach((el, k) => { el.style.position = 'relative'; el.style.top = (VIEWS_TEXT_DY[k] || 0) + 'px'; });
}
layoutViewsText();
window.addEventListener('resize', layoutViewsText);

/* the frame loop reads these back */
const S = { f: 0, i: 0, p: 0, wt: 0, repIn: 0 };

function onScroll() {
  const f = stationF();
  const i = Math.min(Math.floor(f), LAST);
  const p = clamp(f - i);
  /* the dots hold their formation, then morph over the last stretch of
     a scene so they arrive with the next one — not during this one */
  const wt = smooth(clamp((p - MORPH_AT) / (1 - MORPH_AT)));
  S.f = f; S.i = i; S.p = p; S.wt = wt;

  const wa = scenes[i].wash, wb = scenes[Math.min(i + 1, LAST)].wash;
  const w = [0, 1, 2].map((k) => Math.round(lerp(wa[k], wb[k], wt)));
  washEl.style.background = (w[0] === 255 && w[1] === 255 && w[2] === 255)
    ? '#fff'
    : `radial-gradient(1100px 700px at 50% 38%, rgb(${w[0]},${w[1]},${w[2]}), #ffffff 78%)`;
  document.documentElement.style.setProperty('--glow-rgb', `${w[0]},${w[1]},${w[2]}`);

  curScene = i;

  /* ── stage + step cross-fades ──────────────────────────────────── */
  /* Two travelling boundaries now that an empty CROSS screen sits between
     hero and dashboard: the hero rides up and out over the Start tail as
     the crossing screen takes over, and the dashboard climbs in from below
     over the Cross tail. The dots carry the continuity across both. */
  const crossI = ST['Cross'], dashI = ST['Dashboard'];
  /* The dots now CROSS PATHS IN FRONT of the hero text. The hero stays
     centred (no ride-up) and simply fades out as the two streams sweep over
     it, while the whole dot field is lifted above the page content for the
     duration of the crossing — then dropped back so the streams pour BEHIND
     the dashboard card as before. */
  const fCrossCentre = crossI + 0.35;               // f where the two streams cross
  const heroGone = smooth(clamp((f - (fCrossCentre - 0.18)) / 0.24));
  const liftDots = f > MORPH_AT + 0.02 && f < fCrossCentre + 0.12;
  /* COLLECT SPLIT: once the arcs have emerged from beside the cards, lift the
     dot field IN FRONT of the report cards so the streams flow from behind the
     cards to the front as the cards disappear and the dots cluster in the
     middle. Dropped back to 1 before the next scene's content arrives. */
  const liftCollect = f > ST['Reports'] + 0.80 && f < ST['Collect'] + 0.45;
  /* MEASURE → 12 SKILLS: the woven helix glides IN FRONT of the measure
     cards as it slides aside, rather than ducking behind them (its dots sit
     on the right, clear of the incoming skills grid on the left). */
  const liftDNA = f > ST['Measure'] + 0.84 && f < ST['Measure'] + 1.12;
  if (worldEl) worldEl.style.zIndex = (liftDots || liftCollect || liftDNA) ? '3' : '1';

  /* NORMAL SCROLL around the Funnel screen — the one stretch that breaks the
     seamless cross-fade. "Schools see…" physically translates UP and out as
     the empty Funnel screen begins (dashOut); the Funnel screen is then just
     the dots pouring down (no stage); "Teachers share…" translates IN from
     below as the Funnel screen ends (repIn). Both slide opaque, tiled to the
     scrollbar, so it reads as a normal page scroll. The dot funnel is on the
     fixed canvas, so it fills the empty screen between the two slides. */
  const funnelI = ST['Funnel'], reportsI = ST['Reports'];
  /* Long, smootherstep-eased windows so each stage crosses a full viewport over
     ~60vh of scroll (≈1.7× parallax) instead of snapping over ~12–28vh — the
     motion tracks the scroll closely, so entering/exiting feels gradual, not
     sudden. repIn extends into the Reports scene (170vh) where there's room. */
  const dashOut = smoother(clamp((f - (dashI + 0.60)) / 0.58));    // Dashboard up & out, into the Funnel screen
  const repIn = smoother(clamp((f - (reportsI - 0.28)) / 0.58));   // Reports in from below, settling early in Reports
  S.repIn = repIn;   // shared with the funnel-waterfall spout so it tracks the card 1:1

  scenes.forEach((sc, k) => {
    const a = k === 0 ? -FADE_LEN * 1.5 : k - FADE_OVER;
    let op = smooth(clamp((f - a) / FADE_LEN));
    if (k < LAST) op *= 1 - smooth(clamp((f - (k + 1 - FADE_LEN)) / FADE_LEN));

    /* the travelling scenes leave and enter by moving, so they hold full
       opacity across their boundary instead of dissolving */
    let ty = 0;
    if (k === 0) {
      /* the hero text stays centred and FADES as the dot streams cross paths
         in front of it (they're lifted above the content — see liftDots
         above); it no longer rides up and out */
      op = 1 - heroGone;
    } else if (k === dashI) {
      /* "Schools see…" climbs in from below (φ ≈ 0.9 → 1, right at the
         Dashboard station), holds, then physically SCROLLS up and out as the
         Funnel screen begins — opaque the whole way, hidden only once gone. */
      const appear = smooth(clamp((f - (dashI - 0.12)) / 0.22));   // f ≈ 1.88 → 2.10
      ty = (1 - appear) - dashOut;
      op = appear * (1 - smooth(clamp((dashOut - 0.9) / 0.1)));
    } else if (k === reportsI) {
      /* "Teachers share…" SCROLLS IN from below at the end of the Funnel
         screen; opaque as it arrives, then the normal cross-fade out to Collect. */
      ty = 1 - repIn;
      const toCollect = smooth(clamp((f - (reportsI + 1 - FADE_LEN)) / FADE_LEN));
      op = smooth(clamp(repIn / 0.08)) * (1 - toCollect);
    }
    if (sc.stage && ty !== sc.ty) {
      sc.stage.style.transform = ty ? `translate3d(0, ${(ty * 100).toFixed(3)}%, 0)` : '';
      sc.ty = ty;
    }

    /* the Collect beat is pure dots — it has no stage at all */
    if (sc.stage && Math.abs(op - sc.op) > 0.002) {
      sc.stage.style.opacity = op.toFixed(3);
      sc.stage.style.visibility = op < 0.004 ? 'hidden' : 'visible';
      sc.op = op;
    }
    if (!sc.stage || op < 0.004) return;

    const n = sc.steps.length;
    if (n) {
      const q = clamp(f - k) * n;
      sc.steps.forEach((st, j) => {
        const inn = j === 0 ? 1 : smooth(clamp((q - (j - STEP_FADE)) / STEP_FADE));
        const out = j === n - 1 ? 1 : 1 - smooth(clamp((q - (j + 1 - STEP_FADE)) / STEP_FADE));
        const o = inn * out;
        st.style.opacity = o.toFixed(3);
        st.style.pointerEvents = o > 0.6 ? 'auto' : 'none';
        if (o > 0.4 && !sc.seen[j]) {
          sc.seen[j] = true;
          st.querySelectorAll('.rv').forEach((el, r) => {
            el.style.transitionDelay = `${r * 110}ms`;
            el.classList.add('in');
          });
        }
      });
    }

    runPin(sc, clamp(f - k));
  });

  return f;
}

/* per-scene choreography, driven by that scene's own progress p (0..1).
   Everything here is opacity / scale / horizontal — never a rise from
   the bottom of the screen. */
function runPin(sc, p) {
  if (!sc.pin) return;
  const T = pinTargets(sc);

  if (sc.pin === 'hero') {
    if (p > 0.45 && !counted) { counted = true; countUp(); }
    if (hintReady) scrollHint.style.opacity = p > 0.04 ? '0' : '1';
    if (three) three.heroP = p;
    return;
  }
  if (sc.pin === 'dash' && T.zoom) {
    /* the card settles while it is still climbing, so it has arrived at
       full strength by the time the scroll hands over — a section that
       scrolls into view shouldn't turn up faint */
    const q = ease(clamp((S.f - SCROLL_AT) / (1 - SCROLL_AT)));
    T.zoom.style.transform = `scale(${0.88 + 0.12 * q})`;
    T.zoom.style.opacity = String(0.3 + 0.7 * q);
    return;
  }
  if (sc.pin === 'fan' && T.fans[0]) {
    const q = ease(clamp(p / 0.6));
    T.fans[0].style.transform = `rotate(${-7 * q}deg) translateX(${377 - 346 * q}px)`;
    T.fans[2].style.transform = `rotate(${7 * q}deg) translateX(${-(377 - 346 * q)}px)`;
    T.fans[1].style.transform = `scale(${0.96 + 0.04 * q})`;
    return;
  }
  if (sc.pin === 'views' && T.vH) {
    const q = ease(clamp((p - 0.06) / 0.18));
    T.vH.style.opacity = String(q);
    T.vH.style.transform = `translate(${VIEWS_HEAD.dx}px, ${VIEWS_HEAD.dy}px) scale(${(0.97 + 0.03 * q) * VIEWS_HEAD.scale})`;
    T.vLabels.forEach((el, k) => el.classList.toggle('in', p > 0.3 + k * 0.09));
    return;
  }
  if (sc.pin === 'skills' && T.skillCards.length) {
    T.skillCards.forEach((card, k) => card.classList.toggle('in', p > 0.1 + k * 0.045));
    return;
  }
  if (sc.pin === 'state' && T.stH) {
    const q = ease(clamp(p / 0.35));
    T.stH.style.transform = `scale(${0.9 + 0.1 * q})`;
    T.stH.style.opacity = String(0.15 + 0.85 * q);
    T.stP.style.opacity = String(clamp((p - 0.14) / 0.2));
    T.pops.forEach((pl, k) => {
      const v = clamp((p - 0.42 - k * 0.07) / 0.12);
      pl.style.opacity = String(v);
      pl.style.transform = `scale(${0.6 + 0.4 * v})`;
    });
    return;
  }
  if (sc.pin === 'ai' && T.aiCard) {
    const q1 = ease(clamp(p / 0.4));
    T.aiCard.style.opacity = String(0.1 + 0.9 * q1);
    T.aiCard.style.transform = `scale(${0.96 + 0.04 * q1})`;
    const q2 = clamp((p - 0.45) / 0.25);
    T.aiAns.style.opacity = String(q2);
    T.aiFoot.style.opacity = String(0.15 + 0.85 * clamp((p - 0.7) / 0.2));
    return;
  }
  if (sc.pin === 'dna' && T.stageTitles.length) {
    const stage = p < 0.30 ? 0 : p < 0.58 ? 1 : 2;
    T.stageTitles.forEach((el, k) => { el.style.opacity = k === stage ? '1' : '0.25'; });
    T.stagePanels.forEach((el, k) => {
      const on = k === stage;
      el.style.opacity = on ? '1' : '0';
      el.style.pointerEvents = on ? 'auto' : 'none';
    });
    if (three) three.dnaP = p;
    return;
  }
  if (sc.pin === 'journey' && jPath && jBall) {
    if (!jLen) jLen = jPath.getTotalLength();
    const pt = jPath.getPointAtLength(jLen * smooth(p));
    jBall.setAttribute('transform', `translate(${pt.x}, ${pt.y})`);
  }
}

/* ═══════════════════════════════════════════════════════════════════
   FRAME LOOP
   ═══════════════════════════════════════════════════════════════════ */
/* heights decide both the scroll map and the fit-to-viewport scaling, so
   re-measure once webfonts and images have settled. setCrossVH sizes the
   Cross scene and measures. */
setCrossVH(CROSS_VH);
window.addEventListener('resize', measure);
window.addEventListener('load', measure);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);

/* ═══════════════════════════════════════════════════════════════════
   PATH EDITOR — a full-screen SVG overlay with draggable control points
   for the two crossing dashboard paths. Dragging a handle rewrites the
   fractions in DASH_PATHS, rebuilds the world polylines, and the dots
   follow live. Copy the baked text from the GUI to hardcode a layout.
   ═══════════════════════════════════════════════════════════════════ */
function pathsText() {
  const f = (a) => '[' + a.map((p) => `[${p[0].toFixed(3)}, ${p[1].toFixed(3)}]`).join(', ') + ']';
  return `red:  ${f(DASH_PATHS.red)},\nblue: ${f(DASH_PATHS.blue)},`;
}
function buildPathEditor(th) {
  const NS = 'http://www.w3.org/2000/svg';
  const COLORS = { red: '#E4322B', blue: '#2E6BE6' };
  const W = () => window.innerWidth, H = () => window.innerHeight;

  const svg = document.createElementNS(NS, 'svg');
  svg.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;z-index:54;pointer-events:none;display:none;';
  document.body.appendChild(svg);

  const curve = {}, handles = { red: [], blue: [] };
  for (const key of ['red', 'blue']) {
    const path = document.createElementNS(NS, 'path');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', COLORS[key]);
    path.setAttribute('stroke-width', '3');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('opacity', '0.92');
    svg.appendChild(path);
    curve[key] = path;
  }

  let active = null, onChange = null;
  /* a dragged tail bends the last arc segment too (Catmull-Rom neighbours),
     so the parked ring must be re-laid along with the polylines */
  const apply = () => { layoutHeroRing(th.heroRing); th.relayoutDash(); redraw(); if (onChange) onChange(); };

  function redraw() {
    const w = W(), h = H();
    for (const key of ['red', 'blue']) {
      /* draw the WHOLE composite (ring arc + tail) for context; only the
         tail points get drag handles — the arc follows the ring itself */
      const comp = compositeFracs(key === 'blue' ? 1 : 0);
      let d = '';
      for (let s = 0; s <= DASH_STEPS; s++) {
        const p = sampleFrac(comp, s / DASH_STEPS);
        d += `${s ? 'L' : 'M'}${(p[0] * w).toFixed(1)} ${(p[1] * h).toFixed(1)} `;
      }
      curve[key].setAttribute('d', d);
      const last = DASH_PATHS[key].length - 1;
      handles[key].forEach((c, idx) => {
        c.setAttribute('cx', DASH_PATHS[key][idx][0] * w);
        c.setAttribute('cy', DASH_PATHS[key][idx][1] * h);
        /* filled handle = the endpoint that drives into the card */
        c.setAttribute('fill', idx === last ? COLORS[key] : '#fff');
      });
    }
  }

  for (const key of ['red', 'blue']) {
    handles[key] = DASH_PATHS[key].map((_, idx) => {
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('r', '9');
      c.setAttribute('stroke', COLORS[key]);
      c.setAttribute('stroke-width', '3');
      c.style.cssText = 'pointer-events:auto;cursor:grab;';
      c.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        active = { key, idx };
        c.style.cursor = 'grabbing';
        c.setPointerCapture(e.pointerId);
      });
      c.addEventListener('pointermove', (e) => {
        if (!active || active.key !== key || active.idx !== idx) return;
        DASH_PATHS[key][idx] = [clamp(e.clientX / W()), clamp(e.clientY / H())];
        apply();
      });
      c.addEventListener('pointerup', (e) => {
        active = null; c.style.cursor = 'grab';
        try { c.releasePointerCapture(e.pointerId); } catch (_) { /* fine */ }
      });
      svg.appendChild(c);
      return c;
    });
  }

  window.addEventListener('resize', () => { if (svg.style.display !== 'none') redraw(); });
  redraw();

  return {
    show(v) { svg.style.display = v ? 'block' : 'none'; if (v) redraw(); },
    setOnChange(fn) { onChange = fn; },
  };
}

/* ═══════════════════════════════════════════════════════════════════
   COLLECT-ARC EDITOR — draggable control points for the two split arcs
   (red = left stream, blue = right stream) that carry the field out of the
   report cards and into the spiral. Each side is a cubic A→C1→C2→spiral;
   the three shaping points A/C1/C2 are editable (screen fractions), the end
   is anchored at the spiral centre. Dragging rewrites COLLECT_ARC and the
   dots follow live — scroll into the Reports→Collect hand-over to watch.
   ═══════════════════════════════════════════════════════════════════ */
function collectArcsText() {
  const f = (a) => '[' + a.map((p) => `[${p[0].toFixed(3)}, ${p[1].toFixed(3)}]`).join(', ') + ']';
  return `red:  ${f(COLLECT_ARC.red)},\nblue: ${f(COLLECT_ARC.blue)},`;
}
function buildCollectArcEditor() {
  const NS = 'http://www.w3.org/2000/svg';
  const COLORS = { red: '#E4322B', blue: '#2E6BE6' };
  const W = () => window.innerWidth, H = () => window.innerHeight;
  const END = [0.5, 0.5];   // the spiral centre (world 0,0), where both arcs land

  /* z-index 61 sits ABOVE the GUI panel (60): the root svg is pointer-events
     none so panel clicks still pass through, but the draggable handle circles
     (pointer-events auto) stay on top and grabbable even where the arc's
     right-side points fall behind the top-right panel */
  const svg = document.createElementNS(NS, 'svg');
  svg.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;z-index:61;pointer-events:none;display:none;';
  document.body.appendChild(svg);

  const curve = {}, endDot = {}, handles = { red: [], blue: [] };
  for (const key of ['red', 'blue']) {
    const path = document.createElementNS(NS, 'path');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', COLORS[key]);
    path.setAttribute('stroke-width', '3');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('opacity', '0.92');
    svg.appendChild(path);
    curve[key] = path;
    const e = document.createElementNS(NS, 'circle');
    e.setAttribute('r', '6'); e.setAttribute('fill', COLORS[key]); e.setAttribute('opacity', '0.5');
    svg.appendChild(e);
    endDot[key] = e;
  }

  let active = null, onChange = null;
  function redraw() {
    const w = W(), h = H();
    for (const key of ['red', 'blue']) {
      const p = COLLECT_ARC[key];
      const px = (i) => p[i][0] * w, py = (i) => p[i][1] * h;
      curve[key].setAttribute('d',
        `M${px(0).toFixed(1)} ${py(0).toFixed(1)} C${px(1).toFixed(1)} ${py(1).toFixed(1)} ${px(2).toFixed(1)} ${py(2).toFixed(1)} ${(END[0] * w).toFixed(1)} ${(END[1] * h).toFixed(1)}`);
      endDot[key].setAttribute('cx', END[0] * w); endDot[key].setAttribute('cy', END[1] * h);
      handles[key].forEach((c, idx) => {
        c.setAttribute('cx', p[idx][0] * w); c.setAttribute('cy', p[idx][1] * h);
        c.setAttribute('fill', idx === 0 ? COLORS[key] : '#fff');   // filled = the start anchor
      });
    }
  }

  for (const key of ['red', 'blue']) {
    handles[key] = COLLECT_ARC[key].map((_, idx) => {
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('r', '9');
      c.setAttribute('stroke', COLORS[key]);
      c.setAttribute('stroke-width', '3');
      c.style.cssText = 'pointer-events:auto;cursor:grab;';
      c.addEventListener('pointerdown', (e) => {
        e.preventDefault(); active = { key, idx };
        c.style.cursor = 'grabbing'; c.setPointerCapture(e.pointerId);
      });
      c.addEventListener('pointermove', (e) => {
        if (!active || active.key !== key || active.idx !== idx) return;
        COLLECT_ARC[key][idx] = [clamp(e.clientX / W()), clamp(e.clientY / H())];
        redraw(); if (onChange) onChange();
      });
      c.addEventListener('pointerup', (e) => {
        active = null; c.style.cursor = 'grab';
        try { c.releasePointerCapture(e.pointerId); } catch (_) { /* fine */ }
      });
      svg.appendChild(c);
      return c;
    });
  }

  window.addEventListener('resize', () => { if (svg.style.display !== 'none') redraw(); });
  redraw();

  return {
    show(v) { svg.style.display = v ? 'block' : 'none'; if (v) redraw(); },
    setOnChange(fn) { onChange = fn; },
  };
}

/* ═══════════════════════════════════════════════════════════════════
   HERO HANDS — two Milo-Hand images that sweep in from the top corners
   and cradle the dot orb (the image-1 layout). Each hand is positioned by
   its centre, sized by `scale`, and can be mirrored on either axis — all
   live-tunable from the GUI (see initThree → `hands`). They fade out as the
   orb bursts. The hand meshes themselves are created inside initThree so
   they can be added straight into scene3.
   ═══════════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════════
   GUI — live controls for the hero connection network. Vanilla DOM so it
   stays self-contained (no extra module to vendor). Collapsible; toggle
   with the ⚙ button or the `g` key.
   ═══════════════════════════════════════════════════════════════════ */
function buildGUI(th) {
  const wrap = document.createElement('div');
  wrap.id = 'gui';
  wrap.style.cssText = [
    'position:fixed', 'top:16px', 'right:16px', 'z-index:60', 'width:224px',
    'font:12px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
    'color:#2E3542', 'background:rgba(255,255,255,0.92)',
    'backdrop-filter:blur(8px)', '-webkit-backdrop-filter:blur(8px)',
    'border:1px solid rgba(46,53,66,0.12)', 'border-radius:12px',
    'box-shadow:0 6px 24px rgba(20,20,20,0.12)', 'overflow:hidden',
    'user-select:none',
  ].join(';');

  const head = document.createElement('div');
  head.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:10px 12px;cursor:pointer;font-weight:700;letter-spacing:0.02em;';
  head.innerHTML = '<span>Landing controls</span><span id="guiToggle" style="opacity:0.55;">⚙</span>';
  wrap.appendChild(head);

  const body = document.createElement('div');
  body.style.cssText = 'padding:4px 12px 12px;display:flex;flex-direction:column;gap:12px;';
  wrap.appendChild(body);

  const row = (label, get, set, min, max, step) => {
    const r = document.createElement('label');
    r.style.cssText = 'display:flex;flex-direction:column;gap:4px;';
    const top = document.createElement('div');
    top.style.cssText = 'display:flex;justify-content:space-between;';
    const name = document.createElement('span'); name.textContent = label;
    const val = document.createElement('span'); val.style.cssText = 'font-variant-numeric:tabular-nums;opacity:0.7;';
    const fmt = (v) => (step < 1 ? v.toFixed(step < 0.01 ? 3 : 2) : v);
    val.textContent = fmt(get());
    top.append(name, val);
    const inp = document.createElement('input');
    inp.type = 'range'; inp.min = min; inp.max = max; inp.step = step; inp.value = get();
    inp.style.cssText = 'width:100%;accent-color:#E91E8C;';
    inp.addEventListener('input', () => {
      const v = parseFloat(inp.value);
      set(v); val.textContent = fmt(v);
    });
    r.append(top, inp);
    body.appendChild(r);
    return r;
  };

  const mkBtn = (label) => {
    const b = document.createElement('button');
    b.textContent = label;
    b.style.cssText = 'font:inherit;font-weight:700;color:#2E3542;background:#fff;border:1px solid rgba(46,53,66,0.2);border-radius:8px;padding:6px 8px;cursor:pointer;';
    return b;
  };

  const sectionTitle = (txt) => {
    const t = document.createElement('div');
    t.textContent = txt;
    t.style.cssText = 'font-weight:700;letter-spacing:0.02em;margin-top:2px;';
    body.appendChild(t);
  };

  /* The ring-connection settings (line colour/thickness/opacity, ring size,
     connections-per-dot, branches, and the dot selection) are all baked into
     HERO_CFG now, so their GUI controls have been removed. To retune, edit
     HERO_CFG directly. The picker machinery (th.setEditMode / stepEdit) is
     still available from the console if you need to re-pick dots. */

  /* The Dashboard-flow and Reports-funnel settings (Space between sections,
     Dot flow speed, Funnel screen height, funnel Mouth/Spout width, Position X,
     Mouth height, Fall speed) are all baked into the consts now — CROSS_VH,
     DASH_SPEED, FUNNEL_VH and FUNNEL_CFG — so their sliders have been removed.
     To retune, edit those consts directly (or call setCrossVH / setFunnelVH
     from the console). The crossing-path editor below is the only live control
     left. `row`/`sectionTitle` are kept as helpers in case a slider is re-added. */

  /* ── Mini DNA (the "Get a 360° view" / 12-skills screen) ────────────
     Position + size of the scaled-down helix. X/Y/Z/Height re-lay the form;
     Dot size is applied live each frame from DNA2_CFG.dotScale. */
  sectionTitle('DNA · 12-skills view');
  const relayDNA = () => { if (th.rebuildDNA2) th.rebuildDNA2(); };
  row('Position X', () => DNA2_CFG.x, (v) => { DNA2_CFG.x = v; relayDNA(); }, -14, 14, 0.1);
  row('Position Y', () => DNA2_CFG.y, (v) => { DNA2_CFG.y = v; relayDNA(); }, -10, 10, 0.1);
  row('Position Z', () => DNA2_CFG.z, (v) => { DNA2_CFG.z = v; relayDNA(); }, -10, 10, 0.1);
  row('Height (scale)', () => DNA2_CFG.scale, (v) => { DNA2_CFG.scale = v; relayDNA(); }, 0.2, 1.2, 0.01);
  row('Dot size', () => DNA2_CFG.dotScale, (v) => { DNA2_CFG.dotScale = v; }, 0.2, 1.4, 0.01);

  /* ── Editable dot paths ─────────────────────────────────────────────
     Draggable red/blue control points for the two crossing streams. */
  const pathEd = buildPathEditor(th);
  const pathBtn = mkBtn('✏️ Edit dashboard paths: OFF');
  pathBtn.style.width = '100%';
  body.appendChild(pathBtn);

  const pathHint = document.createElement('div');
  pathHint.style.cssText = 'font-size:10.5px;opacity:0.5;';
  pathHint.textContent = 'Drag the red/blue dots to reshape the crossing paths. Scroll into the dashboard hand-over to watch the dots follow.';
  pathHint.style.display = 'none';
  body.appendChild(pathHint);

  const pathOut = document.createElement('textarea');
  pathOut.readOnly = true; pathOut.rows = 3;
  pathOut.style.cssText = 'width:100%;font:10px/1.3 ui-monospace,Menlo,monospace;color:#2E3542;background:#fff;border:1px solid rgba(46,53,66,0.18);border-radius:8px;padding:5px;resize:vertical;box-sizing:border-box;display:none;';
  pathOut.value = pathsText();
  body.appendChild(pathOut);
  pathEd.setOnChange(() => { pathOut.value = pathsText(); });

  let editingPaths = false;
  pathBtn.addEventListener('click', () => {
    editingPaths = !editingPaths;
    pathEd.show(editingPaths);
    pathBtn.textContent = editingPaths ? '✏️ Edit dashboard paths: ON' : '✏️ Edit dashboard paths: OFF';
    pathBtn.style.background = editingPaths ? '#FCC30B' : '#fff';
    pathHint.style.display = editingPaths ? 'block' : 'none';
    pathOut.style.display = editingPaths ? 'block' : 'none';
    pathOut.value = pathsText();
  });

  /* ── Editable collect-split arcs ────────────────────────────────────
     Draggable red/blue control points for the two arcs that carry the
     field out of the report cards and into the spiral. */
  const arcEd = buildCollectArcEditor();
  const arcBtn = mkBtn('✏️ Edit collect arcs: OFF');
  arcBtn.style.width = '100%';
  body.appendChild(arcBtn);

  const arcHint = document.createElement('div');
  arcHint.style.cssText = 'font-size:10.5px;opacity:0.5;';
  arcHint.textContent = 'Drag the red (left) / blue (right) dots to reshape the split arcs. Scroll into the Reports→Collect hand-over to watch the dots follow.';
  arcHint.style.display = 'none';
  body.appendChild(arcHint);

  const arcOut = document.createElement('textarea');
  arcOut.readOnly = true; arcOut.rows = 3;
  arcOut.style.cssText = 'width:100%;font:10px/1.3 ui-monospace,Menlo,monospace;color:#2E3542;background:#fff;border:1px solid rgba(46,53,66,0.18);border-radius:8px;padding:5px;resize:vertical;box-sizing:border-box;display:none;';
  arcOut.value = collectArcsText();
  body.appendChild(arcOut);
  arcEd.setOnChange(() => { arcOut.value = collectArcsText(); });

  let editingArcs = false;
  arcBtn.addEventListener('click', () => {
    editingArcs = !editingArcs;
    arcEd.show(editingArcs);
    arcBtn.textContent = editingArcs ? '✏️ Edit collect arcs: ON' : '✏️ Edit collect arcs: OFF';
    arcBtn.style.background = editingArcs ? '#FCC30B' : '#fff';
    arcHint.style.display = editingArcs ? 'block' : 'none';
    arcOut.style.display = editingArcs ? 'block' : 'none';
    arcOut.value = collectArcsText();
  });

  let open = true;
  const setOpen = (v) => { open = v; body.style.display = open ? 'flex' : 'none'; };
  head.addEventListener('click', () => setOpen(!open));
  window.addEventListener('keydown', (e) => { if (e.key === 'g' && !/input|textarea/i.test(e.target.tagName)) setOpen(!open); });

  document.body.appendChild(wrap);
}

if (reduced) {
  document.getElementById('world').style.display = 'none';
  beatA.querySelectorAll('[data-hb]').forEach((el) => el.classList.add('in'));
  document.querySelectorAll('.skill-card, .view-label, .rv').forEach((el) => el.classList.add('in'));
  statEl.textContent = '2,895';
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
} else {
  three = initThree();
  handAPI = three.hands;
  viewsHandsAPI = three.viewsHands;
  relayoutHero();
  buildGUI(three);
  let f = 0;
  let lastT = performance.now();
  /* drain progress: once parked at the "Schools see…" screen, dots stop
     respawning at the start of the path and flow on to the END. 0 = full
     stream, 1 = fully drained. Reset when scrolling back above the dashboard. */
  let drainAmt = 0;

  window.addEventListener('scroll', onScroll, { passive: true });
  window.__tilliScroll = onScroll;

  // hero entrance: the question fades in over the scattered dots
  beatA.querySelectorAll('[data-hb]').forEach((el, k) => setTimeout(() => el.classList.add('in'), 300 + k * 180));
  setTimeout(() => { hintReady = true; onScroll(); }, 1100);

  const rotate2D = (P, k, cx, cz, ang) => {
    const x = P[k] - cx, z = P[k + 2] - cz;
    const cs = Math.cos(ang), sn = Math.sin(ang);
    P[k] = cx + x * cs - z * sn;
    P[k + 2] = cz + x * sn + z * cs;
  };
  const rotXY = (P, k, cx, cy, ang) => {
    const x = P[k] - cx, y = P[k + 1] - cy;
    const cs = Math.cos(ang), sn = Math.sin(ang);
    P[k] = cx + x * cs - y * sn;
    P[k + 1] = cy + y * cs + x * sn;
  };

  const white = { r: 1, g: 1, b: 1 };
  const sp = [0, 0, 0];

  function step(now) {
    const dt = Math.min((now - lastT) / 1000, 0.05);
    lastT = now;
    f = onScroll();

    if (!three) { return; }
    const th = three;
    const time = now / 1000;

    /* manual wiring mode owns the frame: a locked, static ring to pick on */
    if (th.isEditing()) { th.stepEdit(); return; }

    const targetZ = CAM_DIST - f * DEPTH;
    th.camZ = lerp(th.camZ, targetZ, 1 - Math.exp(-dt * 5));
    const mx = th.mouse;
    mx.x = lerp(mx.x, mx.tx, 1 - Math.exp(-dt * 3));
    mx.y = lerp(mx.y, mx.ty, 1 - Math.exp(-dt * 3));
    /* the soft orbit (mouse parallax + slow drift) is OFF on the landing so
       the orb sits dead still, and eases back in once we leave the hero */
    const orbit = smooth(clamp((f - 0.9) / 0.5));
    th.camera.position.set(mx.x * 1.1 * orbit, (-mx.y * 0.7 + Math.sin(time * 0.3) * 0.15) * orbit, th.camZ);
    th.camera.lookAt(mx.x * 0.4 * orbit, -mx.y * 0.25 * orbit, th.camZ - 30);
    const planeZ = th.camZ - CAM_DIST;

    /* base morph — the field holds a formation through the body of a
       scene (S.wt === 0) and morphs to the next one over its tail, so
       the dots arrive together with the incoming text */
    const si = S.i;
    let i = si, tt = S.wt;
    let heroBurst = 0;   // 1 once the orb has fully burst into the ring (beat B)
    if (i > th.F.length - 2) { i = th.F.length - 2; tt = 1; }
    /* 1 while scene `idx` owns the screen, easing to 0 across each handover */
    const hold = (idx) => (si === idx ? 1 - S.wt : si === idx - 1 ? S.wt : 0);
    /* MEASURE holds its full woven helix until the orange rungs finish
       colouring (dnaP ≈ 0.85), THEN slides aside — the dna→dna2 morph is
       what physically carries the helix right, so gate it here instead of
       letting the generic MORPH_AT tail start it mid-weave. */
    if (si === ST['Measure']) tt = smooth(clamp((S.p - 0.86) / 0.14));
    /* dot size tracks the position morph exactly: only the 12-skills form
       carries the shrunken dotScale, so the dots scale down in lock-step with
       the geometry as Measure→12-skills and grow back on the way out. */
    {
      const dnaSizeOf = (idx) => (idx === ST['12 skills'] ? DNA2_CFG.dotScale : 1);
      th.dotMat.size = BASE_DOT_SIZE * lerp(dnaSizeOf(i), dnaSizeOf(i + 1), tt);
    }
    const A = th.F[i], B = th.F[i + 1];
    const P = th.P, CL = th.CL, PH = th.phases;
    for (let k = 0; k < N * 3; k += 3) {
      P[k] = lerp(A.pos[k], B.pos[k], tt);
      P[k + 1] = lerp(A.pos[k + 1], B.pos[k + 1], tt);
      P[k + 2] = lerp(A.pos[k + 2], B.pos[k + 2], tt);
      CL[k] = lerp(A.col[k], B.col[k], tt);
      CL[k + 1] = lerp(A.col[k + 1], B.col[k + 1], tt);
      CL[k + 2] = lerp(A.col[k + 2], B.col[k + 2], tt);
    }

    /* HERO: the orb holds through beat A (with a slow idle spin), then beat B
       bursts it — every dot flies from the ball out and settles into the RING
       that wraps around the "They measure…" text. Bursting straight into the
       ring (not a loose scatter) means the same dots are already parked as the
       head of the dashboard flow, so the hand-over downstream stays seamless. */
    if (i === 0) {
      const burst = ease(clamp((th.heroP - BURST_START) * SPHERE.burstSpeed));
      heroBurst = burst;
      if (handAPI) handAPI.frame(planeZ, burst);
      const bc = ballWorld();
      const ring = th.heroRing;
      if (burst < 1 && SPHERE.spin > 0.001) {
        const ang = time * SPHERE.spin * (1 - burst);
        for (let k = 0; k < N * 3; k += 3) rotate2D(P, k, bc[0], bc[2], ang);
      }
      if (burst > 0) {
        const wgt = burst * (1 - tt);
        for (let k = 0; k < N * 3; k += 3) {
          P[k] += (ring[k] - A.pos[k]) * wgt;
          P[k + 1] += (ring[k + 1] - A.pos[k + 1]) * wgt;
          P[k + 2] += (ring[k + 2] - A.pos[k + 2]) * wgt;
        }
      }
      /* atmospheric depth: dots on the far side of the ball wash toward the
         white background so the sphere reads with volume. Fades out with the
         burst (a flat scatter needs no depth cue). */
      const shade = 1 - burst;
      if (shade > 0.01) {
        const zBack = bc[2] - SPHERE.radius * ORB_DEPTH;
        const span = 2 * SPHERE.radius * ORB_DEPTH || 1;
        for (let k = 0; k < N * 3; k += 3) {
          const depth = clamp((P[k + 2] - zBack) / span);   // 0 far, 1 near
          const wash = (1 - depth) * (1 - depth) * shade * 0.8;
          CL[k] = lerp(CL[k], 1, wash);
          CL[k + 1] = lerp(CL[k + 1], 1, wash);
          CL[k + 2] = lerp(CL[k + 2], 1, wash);
        }
      }
    } else if (handAPI) {
      handAPI.frame(planeZ, 1);
    }

    /* the two side hands that frame the 3-views orbs (image layout): fade in as
       the orbs finish forming, hold through the scene, fade out on the way to
       Measure. */
    if (viewsHandsAPI) {
      const vI = ST['3 views'];
      const reveal = smooth(clamp((f - (vI - 0.05)) / 0.3)) * (1 - smooth(clamp((f - (vI + 0.85)) / 0.2)));
      viewsHandsAPI.frame(planeZ, reveal);
    }
    /* the threads are drawn between the field's own dots once the ring has
       settled — the actual layout happens below, after idle breathing, so
       the quads land exactly on the live dot positions. The web is a fixed
       world layer, so it has to be gone by SCROLL_AT — it would otherwise
       hang in the middle of the frame while the hero text scrolls away
       underneath it. */
    /* the connection lines are drawn at the end of the frame, once P is
       final — their opacity envelope is computed there from heroBurst. */

    /* FLOW: the ring is the head of two queues. One continuous progress φ
       carries the field across THREE scenes — leave the ring in the Start
       tail, CROSS paths on the dedicated Cross screen (φ ≈ FLOW_CROSS), then
       pour into the card as the Dashboard climbs in. Left half rides red,
       right half blue; the paths cross in the middle. */
    {
      const crossI = ST['Cross'], dashI = ST['Dashboard'];
      /* f-axis anchors: begin leaving the ring at the Start morph point,
         hit the crossing centred on the Cross screen, finish just inside
         the Dashboard */
      const fLeave = MORPH_AT;          // Start is scene 0, so abs f == fraction
      const fCross = crossI + 0.35;     // cross while the hero text is still fading over it
      const fArrive = dashI + 0.12;
      let phi;                          // 0 = ring, FLOW_CROSS = crossing, 1 = card
      if (f <= fLeave) phi = 0;
      else if (f <= fCross) phi = FLOW_CROSS * smooth((f - fLeave) / (fCross - fLeave));
      else phi = FLOW_CROSS + (1 - FLOW_CROSS) * smooth(clamp((f - fCross) / (fArrive - fCross)));
      /* engage the override over the whole flow, then release it as the
         Dashboard hands over to Reports */
      const engage = si >= dashI ? hold(dashI) : smooth(clamp((f - fLeave) / 0.12));
      /* DRAIN: once the scroll has reached / stopped at the "Schools see…"
         screen, stop feeding new dots in at the START of the path — advance
         each dot along the band to the END (no wrap) and dissolve it there,
         so the stream drains empty instead of looping forever. drainAmt only
         grows while parked at the Dashboard station; scrolling back above it
         refills the stream. */
      const arrivedDash = si >= dashI;
      drainAmt = arrivedDash ? Math.min(1, drainAmt + dt * DASH_SPEED) : 0;
      if (engage > 0.01) {
        const travel = phi * DASH_CS;
        /* the card-flow only takes over once the pour is basically done, so
           the crossing itself stays scrubbable (no drift) */
        const settle = smooth(clamp((phi - 0.75) / 0.25));
        for (let n = 0; n < N; n++) {
          const k = n * 3;
          dashPoint(dotSide[n], dotQ[n] + travel, k, sp);
          let tx = sp[0], ty = sp[1], tz = sp[2];
          if (settle > 0.001) {
            /* non-wrapping progress toward the end of the band: at drainAmt 0
               each dot rests at its queue slot; as it grows they all flow to
               the end (bandPhase → 1) and stop, no respawn at the start */
            const bandPhase = Math.min(1, th.streamT[n] + drainAmt);
            const tC = DASH_CS + bandPhase * (1 - DASH_CS);
            dashPoint(dotSide[n], tC, k, sp);
            tx = lerp(tx, sp[0], settle);
            ty = lerp(ty, sp[1], settle);
            tz = lerp(tz, sp[2], settle);
            /* dissolve into the white background as it reaches the very end,
               so the path empties cleanly rather than piling dots on the end
               point. Gated by engage so dots regain colour if we leave to
               Reports (engage → 0) instead of flickering. */
            const fadeEnd = smooth(clamp((bandPhase - 0.86) / 0.14)) * settle * drainAmt * engage;
            if (fadeEnd > 0.001) {
              CL[k] = lerp(CL[k], 1, fadeEnd);
              CL[k + 1] = lerp(CL[k + 1], 1, fadeEnd);
              CL[k + 2] = lerp(CL[k + 2], 1, fadeEnd);
            }
          }
          P[k] = lerp(P[k], tx, engage);
          P[k + 1] = lerp(P[k + 1], ty, engage);
          P[k + 2] = lerp(P[k + 2], tz, engage);
        }
      }
    }

    /* COLLECT: the cluster ball simply HOLDS in the centre (idle breathing only,
       no spin) — so when it splits into the 3 views the groups translate
       straight out from the centre with no swirl. */

    /* 3 VIEWS: the Collect ball splits into three SPHERES; each then turns on
       its OWN vertical axis — its own rate and direction — like a planet. This
       is a real 3-D rotation in the x–z plane (rotate2D), NOT a flat on-screen
       swirl, and each dot on the FAR side of its sphere washes toward the
       background, so the orbs read with depth as they spin. The spin weight
       (hold) is continuous across the Collect→3-views boundary, so the orbs are
       already turning as they finish forming. */
    {
      const vI = ST['3 views'];
      /* start ONLY after the orbs have finished forming (f > vI), ramp in over
         the first bit of the scene, fade out over its tail — so nothing spins
         during the split itself */
      const spinWgt = smooth(clamp((f - (vI + 0.06)) / 0.28)) * (1 - smooth(clamp((f - (vI + 0.75)) / 0.25)));
      if (spinWgt > 0.01) {
        const zSpan = 2 * VIEWS_R * VIEWS_ZD;
        for (let n = 0; n < N; n++) {
          const k = n * 3, o = n % 3;
          rotate2D(P, k, VIEWS_CX[o], VIEWS_Z, time * VIEWS_SPIN[o] * spinWgt);
          const depth = clamp((P[k + 2] - (VIEWS_Z - VIEWS_R * VIEWS_ZD)) / zSpan);   // 0 back → 1 front
          const wash = (1 - depth) * (1 - depth) * spinWgt * 0.72;
          CL[k] = lerp(CL[k], 1, wash);
          CL[k + 1] = lerp(CL[k + 1], 1, wash);
          CL[k + 2] = lerp(CL[k + 2], 1, wash);
        }
      }
    }

    /* DNA: strands appear in stage order, then the helix rotates */
    {
      const dnaI = ST['Measure'], skI = ST['12 skills'];
      const wgt = clamp((f - (dnaI - 0.35)) / 0.35) * (1 - clamp((f - (skI + 0.9)) / 0.35));
      if (wgt > 0.01) {
        const slide = smooth(clamp((f - (dnaI + 0.86)) / 0.14));
        const cx = lerp(0, DNA2_CFG.x, slide);
        const cz = lerp(DNA_DEPTH_CENTER, DNA_DEPTH_CENTER + DNA2_CFG.z, slide);
        /* the depth read tracks the helix's live centre + radius, so the
           back-half fade keeps working once it shrinks (scale) and moves in z.
           Pinned to the full-size span, every mini dot reads as "near" and the
           strand goes flat — this is what gives the mini the same 3D depth as
           the full-size helix on the Measure screen. */
        const zh = DNA_DEPTH_HALF * lerp(1, DNA2_CFG.scale, slide);
        const ang = time * 0.4;
        const reveal = f > dnaI + 0.85 ? 1 : th.dnaP; // fully woven before the slide begins
        for (let n = 0; n < N; n++) {
          const k = n * 3;
          rotate2D(P, k, cx * (si >= dnaI ? 1 : 0), cz, ang * wgt);
          const vis = smooth(clamp((reveal - th.dnaThresh[n]) / 0.05));
          const fade = 1 - (1 - vis) * wgt;
          CL[k] = lerp(white.r, CL[k], fade);
          CL[k + 1] = lerp(white.g, CL[k + 1], fade);
          CL[k + 2] = lerp(white.b, CL[k + 2], fade);
          /* volumetric depth: the back half of the twist (far from the camera)
             recedes into the backdrop while the near face stays saturated. */
          const depth = clamp((P[k + 2] - (cz - zh)) / (2 * zh));
          const dw = (1 - depth) * (1 - depth) * DNA_DEPTH_WASH * wgt * vis;
          CL[k] = lerp(CL[k], white.r, dw);
          CL[k + 1] = lerp(CL[k + 1], white.g, dw);
          CL[k + 2] = lerp(CL[k + 2], white.b, dw);
        }
      }
    }

    /* ON TRACK: each child slowly turns — term by term */
    {
      const wgt = hold(ST['On track']);
      if (wgt > 0.01) {
        const centers = [-9.5, 0, 9.5];
        const ang = time * 0.3 * wgt;
        for (let n = 0; n < N; n++) rotXY(P, n * 3, centers[n % 3], -1.2, ang);
      }
    }

    /* FUNNEL WATERFALL: across the Funnel screen and the Reports funnel, the
       funnel dots continuously fall from the mouth (top) to the spout (bottom);
       a dot that reaches the bottom vanishes (fades to the wash) and re-appears
       at the top — so it reads as a stream pouring down. */
    {
      const fI = ST['Funnel'], rI = ST['Reports'];
      /* the pour releases right as the COLLECT SPLIT takes over (rI+0.55…0.67),
         so the two side-streams peel straight out of the settled pour */
      const funW = smooth(clamp((f - (fI - 0.1)) / 0.25)) * (1 - smooth(clamp((f - (rI + 0.55)) / 0.12)));
      if (funW > 0.001) {
        const MOUTH = FUNNEL_CFG.y, XC = FUNNEL_CFG.x;
        /* the spout ends on the report card's TOP EDGE, tracked live as the
           card slides up (repIn: 0 = a viewport below, 1 = at rest — same
           progress the Reports stage slides by in onScroll). The waterfall
           stretches from the fixed mouth down to the card top, so the pour
           lands on the card the moment it enters and follows it to rest. */
        const SPOUT = REPORT_CARD_TOP_Y - (1 - S.repIn) * VIEWPORT_WORLD_H;
        for (let n = 0; n < N; n++) {
          let w = funW;
          if (w < 0.001) continue;
          const k = n * 3;
          const tt = (funPh[n] + time * FUNNEL_CFG.fallSpeed) % 1;   // 0 = mouth, 1 = spout
          const width = lerp(FUNNEL_CFG.maxWidth, FUNNEL_CFG.minWidth, tt);
          P[k] = lerp(P[k], XC + funH[n] * width, w);
          P[k + 1] = lerp(P[k + 1], lerp(MOUTH, SPOUT, tt), w);
          P[k + 2] = lerp(P[k + 2], funZ[n], w);
          /* fade in over the first 12% of the fall, out over the last 12% —
             the appear/disappear that hides the wrap */
          const edge = Math.min(smooth(clamp(tt / 0.12)), 1 - smooth(clamp((tt - 0.88) / 0.12)));
          const fade = (1 - edge) * w;
          if (fade > 0.001) {
            CL[k] = lerp(CL[k], 1, fade);
            CL[k + 1] = lerp(CL[k + 1], 1, fade);
            CL[k + 2] = lerp(CL[k + 2], 1, fade);
          }
        }
      }
    }

    /* COLLECT SPLIT: after the report cards settle the field divides down the
       middle. Each half is EMITTED as a queue from beside the report images and
       flows along a big cubic arc — out to the screen side, down low, then up —
       so the two streams visibly TRACE the path (a red arc on the left, a blue
       arc on the right) as they come out from BEHIND the cards. They then
       CLUSTER into one big dense ball in the centre of the screen (lifted in
       FRONT of the cards — see the collect z-lift in onScroll) just as the
       cards fade away, and hold there (no spiral). Dots are strung along the
       arc by an emit stagger + fixed travel time so it reads as two flowing
       ribbons. Pink dots fade to white on the way. The endpoint rides the live
       spinning cluster so it releases into the Collect rotation with no jump. */
    {
      const rI = ST['Reports'], cI = ST['Collect'];
      const gStart = rI + 0.55, gEnd = cI + 0.40;
      if (f >= gStart && f <= gEnd) {
        const eng = smooth(clamp((f - gStart) / 0.10));
        const Pg = clamp((f - gStart) / (gEnd - gStart));   // 0..1 across the whole split
        const EMIT = 0.25, DUR = 0.40;                      // stagger span · per-dot travel time
        const spinW = si === rI ? S.wt : 1;                 // matches the Collect rotation spin-up
        const A = time * 0.45 * spinW, cs = Math.cos(A), sn = Math.sin(A);
        /* the two arcs' control points, mapped from their editable screen
           fractions to world once per frame (see COLLECT_ARC / the editor) */
        const AZ = -3, CA = COLLECT_ARC;
        const rA = screenFracToWorld(CA.red[0][0], CA.red[0][1], AZ);
        const rC1 = screenFracToWorld(CA.red[1][0], CA.red[1][1], AZ);
        const rC2 = screenFracToWorld(CA.red[2][0], CA.red[2][1], AZ);
        const bA = screenFracToWorld(CA.blue[0][0], CA.blue[0][1], AZ);
        const bC1 = screenFracToWorld(CA.blue[1][0], CA.blue[1][1], AZ);
        const bC2 = screenFracToWorld(CA.blue[2][0], CA.blue[2][1], AZ);
        for (let n = 0; n < N; n++) {
          const k = n * 3;
          const s = smooth(clamp((Pg - collectFrac[n] * EMIT) / DUR));   // 0 at cards → 1 in spiral
          const side = collectSide[n], left = side < 0;   // left half → red arc, right → blue
          /* endpoint: this dot's spot in the cluster ball, rotated onto the live
             (slowly spinning) cluster */
          const sx0 = collectPos[k], sy0 = collectPos[k + 1];
          const ex = sx0 * cs - sy0 * sn, ey = sy0 * cs + sx0 * sn, ez = collectPos[k + 2];
          /* cubic arc: beside the cards → out to the side → down low → up into
             the spiral from the lower outside (control points are editable) */
          const pA = left ? rA : bA, pC1 = left ? rC1 : bC1, pC2 = left ? rC2 : bC2;
          const ax = pA[0] + funH[n] * 2.4, ay = pA[1] + (funPh[n] - 0.5) * 3, az = AZ;
          const c1x = pC1[0], c1y = pC1[1], c1z = AZ;
          const c2x = pC2[0], c2y = pC2[1], c2z = AZ;
          const o = 1 - s, o2 = o * o, o3 = o2 * o, s2 = s * s, s3 = s2 * s;
          const w0 = o3, w1 = 3 * o2 * s, w2 = 3 * o * s2, w3 = s3;
          P[k] = lerp(P[k], w0 * ax + w1 * c1x + w2 * c2x + w3 * ex, eng);
          P[k + 1] = lerp(P[k + 1], w0 * ay + w1 * c1y + w2 * c2y + w3 * ey, eng);
          P[k + 2] = lerp(P[k + 2], w0 * az + w1 * c1z + w2 * c2z + w3 * ez, eng);
          if (n % 5 === 4) {   // the pink dots slowly disappear as the spiral forms
            const pf = smooth(clamp((Pg - 0.15) / 0.6)) * eng;
            CL[k] = lerp(CL[k], 1, pf);
            CL[k + 1] = lerp(CL[k + 1], 1, pf);
            CL[k + 2] = lerp(CL[k + 2], 1, pf);
          }
        }
      }
    }

    /* idle breathing + anchor to the camera's plane */
    for (let k = 0; k < N * 3; k += 3) {
      P[k] += Math.sin(time * 0.5 + PH[k]) * 0.12;
      P[k + 1] += Math.sin(time * 0.45 + PH[k + 1]) * 0.12;
      P[k + 2] += Math.sin(time * 0.55 + PH[k + 2]) * 0.12 + planeZ;
    }
    th.geo.attributes.position.needsUpdate = true;
    th.geo.attributes.color.needsUpdate = true;

    /* RING CONNECTIONS: once the burst has fully settled the dots into the
       ring, STITCH the connection lines on — `stitch` drives drawLinks' growth
       progress, so the lines grow from the TOP, anti-clockwise, and close back
       on the first dot. The ring then holds and fades as the flow carries it
       off. Drawn here — after the breathing pass — so the line quads land
       exactly on the rendered dots. `heroBurst` gates it to a fully-formed
       ring (beat B, transition complete). */
    {
      const stitch = smooth(clamp((th.heroP - STITCH_START) / (STITCH_END - STITCH_START)));
      const leave = 1 - smooth(clamp((th.heroP - MORPH_AT) / 0.05));
      if (i === 0 && heroBurst > 0.999 && stitch > 0.001 && leave > 0.01) {
        th.links.material.opacity = HERO_CFG.opacity * leave;
        th.drawLinks(stitch, P);
      } else {
        th.links.material.opacity = 0;
      }
    }

    th.renderer.render(th.scene3, th.camera);
  }

  function frame(now) {
    step(now);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  window.__tilliStep = step;
  window.__tilliThree = () => three;
  window.__tilliNet = () => ({ cfg: HERO_CFG, net: heroNet, manual: three ? three.getManual() : [] });
  window.__tilliPaths = () => ({ paths: DASH_PATHS, text: pathsText() });
  window.__tilliCollectArcs = () => ({ arcs: COLLECT_ARC, text: collectArcsText() });
  window.__tilliViewsHands = () => VIEWS_HANDS;
  window.__tilliViewsHead = () => VIEWS_HEAD;
  window.__tilliDrain = () => drainAmt;
}
