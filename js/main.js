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
/* cubic ease-in-out — slow start, fast middle, slow stop (used by the
   section-snap glide) */
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const smooth = (t) => t * t * (3 - 2 * t);
/* quintic smootherstep — zero velocity AND zero acceleration at both ends, so
   a scrubbed slide starts and stops with no perceptible jerk. */
const smoother = (t) => t * t * t * (t * (t * 6 - 15) + 10);
/* ease-out-back — overshoots slightly past 1 then settles, for a WhatsApp-style
   "pop" as a chat bubble scales in */
const easeOutBack = (t) => { const c = 1.70158, c3 = c + 1; const u = t - 1; return 1 + c3 * u * u * u + c * u * u; };

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

/* ON-TRACK "kids" formation — the dots trace the Student Outline figure(s).
   count    number of children in the row
   gap      spacing between adjacent children (world units, centre-to-centre)
   x,y,z    position of the whole GROUP of kids (world units)
   height   world height of each figure (its width follows the SVG aspect)
   dot      dot size for the kids only (independent of every other scene)
   colors   palette cycled around each child's outline (give it 3, 4, … colours) */
const KID = {
  count: 6,
  gap: 9.5,
  x: 0, y: 2.5, z: -3,
  height: 11,
  dot: 1.2,
  colors: [C.green, C.yellow, C.cyan],
};
/* x-centre of child k, laid out symmetrically around the group's x */
const kidCenterX = (k) => KID.x + (k - (KID.count - 1) / 2) * KID.gap;

/* ON-TRACK headline/subtext block offset (moves the whole .wrap together).
   x,y = screen translation in px; z = depth as a scale multiplier (1 = default). */
const STATE_TEXT = { x: 0, y: 315, z: 1.1 };

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
const DOT_OPACITY      = 0.9;        // the field's default master opacity (faded out on the Ask-live screen)
/* MINI DNA — the helix as it sits on the "Get a 360° view" (12-skills) screen.
   x/y/z place it, scale sets its overall size (height + radius, kept in
   proportion), dotScale shrinks the dots to match so it reads as a true
   scaled-down copy, not a same-dot clump. All live-tunable from the GUI. */
const DNA2_CFG = { x: 10.9, y: -0.6, z: 4.4, scale: 0.96, dotScale: 0.99 };
/* 12-skills → On-track handover choreography (driven in step()).
   start  the 12-skills scene fraction (0..1) where the handover begins — the
          screen holds fully readable until here, then the DNA eases out
   slideR world units the DNA helix eases off to the RIGHT as it exits + whitens
   slideL world units the kids slide in from the LEFT as they colour up (walk in) */
const SKILLS_EXIT = { start: 0.60, slideR: 19, slideL: 22 };
/* KIDS WALK-IN — after the DNA has left and the On-track text is in, the
   children WALK in from the left with an up/down bob, then settle. Time-based
   (plays on its own once the section lands) so it reads as walking, not as a
   scroll-scrubbed slide.
   speed    walk-in rate (progress per second) — HIGHER = kids walk in faster
   bob      vertical bob amplitude in world units — HIGHER = deeper up/down
   bobFreq  bob cycles rate (steps) — higher = quicker, busier steps
   slideL   world units left of their resting spot the kids start from */
const WALK = { speed: 0.20, bob: 1.00, bobFreq: 2.5, slideL: 44 };
/* ON-TRACK EXIT — after the kids have walked in and held, they LEAVE in a
   straight horizontal line as the handover to Ask-Tilli begins: the 3 LEFT
   kids (kid 0,1,2) slide off-screen left, the 3 RIGHT kids (3,4,5) off-screen
   right, whitening away. The Ask-Tilli formation then fades in from white over
   the back half, so the crossover is hidden (both ends pure white). Scroll-
   scrubbed across the On-track tail — it always finishes with the handover.
   start  On-track scene fraction (0..1) where the kids start to leave
   dist   world units each side travels — BIGGER = kids shoot off faster
   holdCol  fraction of the exit the kids stay coloured before whitening (0..1)
   textZoom scale the On-track headline shrinks to as it zooms out on exit */
const ONTRACK_EXIT = { start: MORPH_AT, dist: 34, holdCol: 0.5, textZoom: 0.55 };
/* ASK-TILLI reveal choreography.
   The WHOLE sequence is now time-based (NOT scrubbed by scroll). A single
   clock starts the instant the scene is entered — i.e. the moment the "Any AI
   can…" headline appears — and every beat below fires off that one clock, so
   the section auto-plays like a live chat regardless of scroll speed. All
   values are ms FROM ENTRY (except headFrom, a scale, and the *Dur spans).
   The scroll is HELD on this scene and cannot be released until the response
   bubbles have landed (askChat.locked, honoured by feedHold) — so the viewer
   always watches the full exchange before moving on.
   headFrom   scale the "Any AI can…" headline zooms IN from (1 = no zoom)
   headDur    ms the headline takes to zoom in
   subAt      ms the sub-line fades in
   cardsAt    ms both chat boxes begin rising in (after the headline lands)
   cardsDur   ms the boxes take to rise + settle
   promptAt   ms the prompt bubble pops in (boxes are settled by now)
   stagger    ms the second (Ask-Tilli) box lags the first (the "slight stagger")
   flowGap    ms after a prompt before that box's dots START streaming
   pop        ms each bubble takes to scale in
   (the response bubble is NOT timed directly — it pops the instant the first
    streamed dot reaches the box: flowGap + one path-traverse (1/speed s) after
    the prompt. A typing bubble fills the gap between prompt and response.) */
const ASK = { headFrom: 0.72, headDur: 600, subAt: 480,
  cardsAt: 860, cardsDur: 520, promptAt: 1620,
  stagger: 90, flowGap: 520, pop: 300 };
/* the chat clock (ms since the scene was entered) is owned by runPin('ai') and
   shared with the dot-flow block in step() so both play off one timeline.
   `locked` stays true until the response lands — feedHold absorbs scroll input
   against the Ask-Tilli hold while it's set, so you can't scroll past early. */
const askChat = { ms: -1, locked: true };
/* ── ASK-LIVE cursor-carry + plug ─────────────────────────────────────
   Leaving the "Any AI can…" screen, the colourful dots detach from Dhruv's
   chat and CARRY on the cursor as a loose swirling cloud (carryP trails the
   pointer between frames → a comet tail). On the "Ask Tilli anything…"
   screen a socket is highlighted at the chat input; once the cursor gets
   near the input the dots stream in and are absorbed ("plugged"). Live from
   the Ask-live GUI (buildAskLiveGUI); `window.__tilliCarry` dumps values.
     z          world plane the swarm rides
     cloud      radius of the cloud around the cursor (world units)
     lag        how fast the cloud chases the cursor (higher = tighter trail)
     spin       swirl speed of the cloud (rad / second)
     plugRadius px: cursor within this of the input box → dots plug in
     plugSpeed  how fast the swarm streams into the socket once plugging */
const ASK_CARRY = {
  z: -3, cloud: 2.7, lag: 5.5, spin: 0.7, plugRadius: 260, plugSpeed: 2.4,
};
/* live cursor, in both pixels (socket proximity) and screen-frac (world). */
const POINTER = { x: window.innerWidth * 0.5, y: window.innerHeight * 0.4, fx: 0.5, fy: 0.4, seen: false };
window.addEventListener('pointermove', (e) => {
  POINTER.x = e.clientX; POINTER.y = e.clientY;
  POINTER.fx = e.clientX / window.innerWidth;
  POINTER.fy = e.clientY / window.innerHeight;
  POINTER.seen = true;
}, { passive: true });

/* the input-socket DOM + input-bar, resolved once and reused. */
let _askSocketEl = null, _askBarEl = null, _askCardEl = null, _askArmed = null, _askPlug = null;
function askEls() {
  if (!_askSocketEl) _askSocketEl = document.querySelector('[data-atl-socket]');
  if (!_askBarEl) _askBarEl = document.querySelector('[data-atl-inputbar]');
  if (!_askCardEl) _askCardEl = document.getElementById('askTilliLive');
  return _askSocketEl && _askBarEl;
}
/* Snap-point in world + whether the cursor is close enough to plug.
   Normally that's the socket on the input bar. Once the 2-question demo LOCKS,
   the input bar (and its socket) is display:none — so we fall back to the card's
   right edge and flag `locked`, keeping the stream plugged into the card instead
   of springing back to the cursor. */
function askSocketWorld() {
  if (!askEls()) return null;
  const sr = _askSocketEl.getBoundingClientRect();
  const live = sr.width > 0 || sr.height > 0;             // input bar still shown?
  let fx, fy, prox;
  if (live) {
    fx = (sr.left + sr.width / 2) / window.innerWidth;
    fy = (sr.top + sr.height / 2) / window.innerHeight;
    prox = _askBarEl;
  } else {
    if (!_askCardEl) return null;
    const cr = _askCardEl.getBoundingClientRect();
    if (cr.width === 0 && cr.height === 0) return null;    // not laid out yet
    fx = (cr.right - 18) / window.innerWidth;              // just inside the right edge
    fy = (cr.top + cr.height / 2) / window.innerHeight;
    prox = _askCardEl;
  }
  const w = screenFracToWorld(fx, fy, ASK_CARRY.z);
  const br = prox.getBoundingClientRect();                  // proximity to bar (or card, when locked)
  const dx = Math.max(br.left - POINTER.x, 0, POINTER.x - br.right);
  const dy = Math.max(br.top - POINTER.y, 0, POINTER.y - br.bottom);
  const near = POINTER.seen && Math.hypot(dx, dy) < ASK_CARRY.plugRadius;
  return { wx: w[0], wy: w[1], near, locked: !live };
}
/* show the socket while the swarm is live; the socket pulses until it is
   plugged, then locks solid (`.atl-plugged`). */
function setAskSocketState(own, plugged) {
  if (!askEls()) return;
  const live = own > 0.05;
  if (_askArmed !== live) { _askBarEl.classList.toggle('atl-live', live); _askArmed = live; }
  const plug = live && plugged;
  if (_askPlug !== plug) {
    _askSocketEl.classList.toggle('atl-plugged', plug);
    _askBarEl.classList.toggle('atl-plugged', plug);   // lets the whole card glow green
    _askPlug = plug;
  }
}
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

/* ASK-TILLI card in-flow — per-dot phase along the arc + a little jitter so the
   two streams have width. askPh = where the dot sits on its path this cycle. */
const askPh = new Float32Array(N), askJx = new Float32Array(N), askJy = new Float32Array(N), askJz = new Float32Array(N);
(() => { const r = rng(178); for (let i = 0; i < N; i++) { askPh[i] = r(); askJx[i] = r() - 0.5; askJy[i] = r() - 0.5; askJz[i] = r() - 0.5; } })();

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

/* ASK-TILLI in-flow — two cubic Bézier paths the dots stream along as they pour
   INTO the chat boxes. Each side's `pts` are 4 screen fractions (0..1, top-left
   origin, may go off-screen): A (entry, off-frame corner) → C1 → C2 → D (the
   card edge where dots vanish behind the box). GREY dots ride `red` into the
   generic box; the COLOURFUL dots ride `blue` into the Ask-Tilli box.
   Drag the handles live via the GUI "Edit ask paths" toggle. `speed` is the
   stream's flow rate in PATH-LENGTHS PER SECOND — it also sets how long the dots
   take to reach the box (travel = 1/speed sec), which is when that box's response
   pops. `gray` recolours the grey dots. Bake via the __tilliAskFlow() dump. */
/* DEBUG: draw the colourful (blue) ask-flow path — the sampled Bézier curve, a
   faint control-polygon, and a sphere at each of the 4 control points. Flip to
   false to remove the overlay. Only shows while the Ask-Tilli scene is on. */
const DEBUG_ASK_PATH = true;
const ASK_FLOW = {
  gray: '#c3c9d4',   // colour of the grey (generic-box) dots
  z: -3,             // world plane the streams flow on
  width: 1.7,        // world units of stream spread (its thickness)
  red:  { pts: [[-0.03, -0.06], [0.05, 0.30], [0.15, 0.58], [0.28, 0.60]], speed: 0.35 },
  blue: { pts: [[1.03, -0.06], [0.95, 0.30], [0.85, 0.58], [0.72, 0.60]], speed: 0.60 },
};
/* one coordinate of a cubic Bézier at t */
const bez3 = (a, b, c, d, t) => { const u = 1 - t; return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d; };

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

  /* 7 · ON TRACK — the dots fill the Student Outline child silhouette.
     loadStudentSilhouette() patches this buffer once the SVG loads; the
     blob below is only a fallback shape shown if that fetch ever fails. */
  {
    const kids = make();
    for (let i = 0; i < N; i++) {
      const k = i % KID.count, m = (i - k) / KID.count, M = Math.ceil((N - k) / KID.count);
      const t = (m / M) * Math.PI * 2, rad = 4.2;   // clean ring outline
      setP(kids, i, kidCenterX(k) + Math.cos(t) * rad, KID.y + Math.sin(t) * rad, KID.z);
      setC(kids, i, KID.colors[m % KID.colors.length], 0.06);
    }
    F.push(kids);
  }

  /* 8 · ASK-TILLI — the field is held WHITE (invisible) here: the visible dots
     are drawn entirely by the time-based ASK-TILLI CARD IN-FLOW block, which
     streams them into the two chat boxes. Keeping the form white means neither
     entry nor the exit-morph to Impact ever flashes a static cloud. Positions
     are a neutral spread (only the source of the invisible Impact morph). */
  {
    const ai = make();
    const r = rng(88);
    for (let i = 0; i < N; i++) {
      setP(ai, i, (r() - 0.5) * 24, (r() - 0.5) * 13, -3 - r() * 3);
      setC(ai, i, '#ffffff', 0);
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

/* The ON-TRACK formation is filled from the OUTLINE of assets/Student Outline.svg.
   loadStudentSilhouette() fetches + measures the path ONCE and caches it in
   kidLayout (keeping a hidden <svg> alive so the outline can be re-walked). All
   the KID controls then re-lay the figures synchronously via relayoutKids() — no
   re-fetch per change. Swap the figure by replacing the SVG (single closed path). */
let kidLayout = null;   // { pathEl, L, viewBox+matrix params, form } once loaded

function relayoutKids() {
  if (!kidLayout) return;
  const { pathEl, L, vx, vy, vw, vh, a, b, c, dd, e, ff, form } = kidLayout;
  const KID_W = KID.height * (vw / vh);   // width follows the SVG aspect
  const pal = KID.colors.length ? KID.colors : ['#ffffff'];
  const white = new THREE.Color('#ffffff');
  const tmp = new THREE.Color();

  // split the field across KID.count kids; walk each evenly around the outline
  for (let k = 0; k < KID.count; k++) {
    const idxs = [];
    for (let i = k; i < N; i += KID.count) idxs.push(i);
    const M = idxs.length, cx = kidCenterX(k);
    for (let m = 0; m < M; m++) {
      const p = pathEl.getPointAtLength((m / M) * L);
      const x = a * p.x + c * p.y + e;   // bake the group transform
      const y = b * p.x + dd * p.y + ff;
      const nx = (x - vx) / vw - 0.5;    // -0.5..0.5 across the figure
      const ny = (y - vy) / vh - 0.5;    // SVG y runs downward
      const i = idxs[m];
      form.pos[i * 3]     = cx + nx * KID_W;
      form.pos[i * 3 + 1] = KID.y - ny * KID.height;   // flip to world-up
      form.pos[i * 3 + 2] = KID.z;
      tmp.set(pal[m % pal.length]).lerp(white, 0.06);   // cycle the palette
      form.col[i * 3]     = tmp.r;
      form.col[i * 3 + 1] = tmp.g;
      form.col[i * 3 + 2] = tmp.b;
    }
  }
}

function loadStudentSilhouette(form) {
  fetch('assets/Student Outline.svg')
    .then(res => res.text())
    .then(svg => {
      const d = (svg.match(/<path[^>]*\sd="([^"]+)"/i) || [])[1];
      const vbm = svg.match(/viewBox="([^"]+)"/i);
      if (!d || !vbm) return;
      const [vx, vy, vw, vh] = vbm[1].split(/[\s,]+/).map(Number);
      const mm = svg.match(/matrix\(([^)]+)\)/);
      const [a, b, c, dd, e, ff] = mm ? mm[1].split(/[\s,]+/).map(Number)
                                      : [1, 0, 0, 1, 0, 0];

      // keep a hidden <svg> alive so getPointAtLength can re-walk the outline
      const NS = 'http://www.w3.org/2000/svg';
      const holder = document.createElementNS(NS, 'svg');
      holder.setAttribute('width', '0'); holder.setAttribute('height', '0');
      holder.style.cssText = 'position:absolute;left:-9999px;top:-9999px';
      const pathEl = document.createElementNS(NS, 'path');
      pathEl.setAttribute('d', d);
      holder.appendChild(pathEl);
      document.body.appendChild(holder);

      kidLayout = { pathEl, L: pathEl.getTotalLength(), vx, vy, vw, vh, a, b, c, dd, e, ff, form };
      relayoutKids();
    })
    .catch(() => {});
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
  loadStudentSilhouette(built.F[9]);   // upgrade the ON-TRACK blob to the SVG kid
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
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: BASE_DOT_SIZE, map: tex, vertexColors: true, transparent: true, opacity: DOT_OPACITY, depthWrite: true, depthTest: true, alphaTest: 0.5 }));
  pts.frustumCulled = false;
  scene3.add(pts);

  /* ── DEBUG overlay for the colourful (blue) ask-flow path. Built once; its
     world positions are refreshed every frame in step() because ASK_FLOW.blue
     is stored as screen fractions (so it tracks the viewport / resizes). */
  let askPathDbg = null;
  if (DEBUG_ASK_PATH) {
    const SEG = 48;
    const curvePos = new Float32Array((SEG + 1) * 3);
    const curveGeo = new THREE.BufferGeometry();
    curveGeo.setAttribute('position', new THREE.BufferAttribute(curvePos, 3));
    const curve = new THREE.Line(curveGeo, new THREE.LineBasicMaterial({ color: 0x0aa2c7, transparent: true, opacity: 0.95, depthTest: false }));
    const polyPos = new Float32Array(4 * 3);
    const polyGeo = new THREE.BufferGeometry();
    polyGeo.setAttribute('position', new THREE.BufferAttribute(polyPos, 3));
    const poly = new THREE.Line(polyGeo, new THREE.LineBasicMaterial({ color: 0x94a0b4, transparent: true, opacity: 0.5, depthTest: false }));
    const spheres = [];
    const sGeo = new THREE.SphereGeometry(0.34, 16, 12);
    for (let j = 0; j < 4; j++) {   // endpoints red, control handles amber
      const m = new THREE.Mesh(sGeo, new THREE.MeshBasicMaterial({ color: (j === 0 || j === 3) ? 0xff3b6b : 0xffb020, depthTest: false }));
      m.frustumCulled = false; m.renderOrder = 1001;
      scene3.add(m); spheres.push(m);
    }
    curve.frustumCulled = poly.frustumCulled = false;
    curve.renderOrder = poly.renderOrder = 1000;
    scene3.add(curve); scene3.add(poly);
    askPathDbg = { curve, curvePos, curveGeo, poly, polyPos, polyGeo, spheres, SEG };
  }

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
    hands, viewsHands, dotMat: pts.material, askPathDbg,
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
/* the Impact "30+ schools" card — revealed via .in for the move-into-the-scene
   entrance once Ask-Tilli has scaled/blurred away (see the scene loop) */
const impactCardEl = document.getElementById('impactCard');
let curScene = 0;

/* ═══════════════════════════════════════════════════════════════════
   MAGNETIC SECTION SNAPPING
   The site no longer free-scrolls. A small scroll gesture — a wheel
   notch, a trackpad flick, an arrow/space key, or a touch drag — GLIDES
   the page to the next scene's rest point instead of scrubbing along.
   The in-between choreography (orb burst, stream crossing, funnel pour,
   DNA build) still plays: it simply animates as the glide scrubs through
   it. Cross + Funnel are pure transition screens with nothing to rest
   on, so they're skipped as stops — a gesture jumps across them to the
   content scene on the far side.
   ═══════════════════════════════════════════════════════════════════ */
const REST = 0.35;            // default: land this far into a scene (stage fully in)
const SNAP_SKIP = new Set(['Cross', 'Funnel']);
/* Snap stops are {i: sceneIndex, frac: fraction into that scene}. Most
   scenes are one stop at REST, but the hero scene holds TWO beats in its
   240vh — the orb ("How do schools decide?") and the ring it bursts into
   ("They measure… 2,895 data points") — so it gets its own two stops.
   Cross + Funnel are transition-only screens and contribute no stop. */
const HERO = ST['Start'];
const snapStops = [];
scenes.forEach((s, i) => {
  if (SNAP_SKIP.has(s.label)) return;
  if (i === HERO) snapStops.push({ i, frac: 0.20 }, { i, frac: 0.63 });
  else snapStops.push({ i, frac: REST });
});
function stopY(stop) {
  const s = scenes[clamp(stop.i, 0, LAST)];
  return s.top + s.len * stop.frac;
}

const SNAP = {
  smooth: 9,       // free-scroll smoothing rate — higher tracks the wheel tighter, lower = floatier
  wheelMult: 1.0,  // px the free-scroll target moves per unit of wheel delta
  holdDist: 1800,  // px of scroll input you must "spend" (in one direction) to break free of a hold (all holds)
  rearm: 70,       // px you must move off a hold before it can catch you again
  dur: 1400,       // ms for an explicit-nav glide (Home/End, ↑/↓ buttons, anchor links)
  fieldLag: 6,     // particle/scene interpolation rate — LOWER = dots ease between states more softly
                   //   during a transition; raise toward 40+ to make them track the scroll 1:1
};
window.__tilliSnap = SNAP;   // tune any of these live from the console

/* ── Section HOLDS ───────────────────────────────────────────────────
   There's no magnetic snapping — you free-scroll with soft easing. But
   when the page REACHES a holding section it STICKS there and won't move
   on until you've SPENT `dist` px of scroll input (in one direction), so
   each screen gets a beat to land. Distance, not time — a fast and a slow
   scroller do the same work. Pick which screens hold by data-label; full
   ordered list:
     Start · Cross · Dashboard · Funnel · Reports · Collect · 3 views ·
     Measure · 12 skills · On track · Ask-Tilli · Impact · Journey · Let's talk
   (Cross + Funnel are blank transition screens — normally leave them out.) */
const HOLD_ON = new Set([
  'Dashboard', 'Reports', '3 views', 'Measure',
  '12 skills', 'On track', 'Ask-Tilli', 'Impact', 'Journey',
]);   // Start (both hero beats) + Collect + Let's talk scroll through freely
/* per-scene hold overrides — frac = where in the scene it catches (0..1;
   later = nearer the end). All holds share SNAP.holdDist for the release
   distance; these three just catch LATER, as they FINISH forming (just
   before they morph to the next scene). Add `dist:` here to override one. */
const HOLD_CFG = {
  '3 views':   { frac: 0.62 },
  'Measure':   { frac: 0.78 },
  '12 skills': { frac: 0.62 },
};
/* one hold per enabled scene; y is read live each frame so it survives
   re-measure. `armed` gates re-triggering while you sit on the hold. */
const holds = scenes
  .map((_, i) => i)
  .filter((i) => HOLD_ON.has(scenes[i].label))
  .map((i) => {
    const c = HOLD_CFG[scenes[i].label] || {};
    return { i, frac: c.frac ?? REST, dist: c.dist ?? SNAP.holdDist, armed: true };
  });

/* land ~REST into a scene, where its stage is fully faded in */
function sceneScrollTop(i) {
  const s = scenes[clamp(i, 0, LAST)];
  return s.top + s.len * REST;
}

/* ── Smooth free-scroll with section holds ───────────────────────────
   Wheel / touch drive a SMOOTHED free scroll (aimY, eased toward every
   frame). Crossing a holding section pins the scroll there until you've
   spent that hold's `dist` px of scroll input. Keys(Home/End) / buttons /
   anchors do an explicit cubic-in-out glide. */
let scrollMode = 'idle';               // 'idle' | 'free' | 'glide'
let aimY = 0;                          // free-scroll target
let glY0 = 0, glY1 = 0, glT0 = 0, glDur = 0;
let maxY = 0, prevPosY = 0;
/* active hold: pinned at holdY; `holdSpent` accumulates signed scroll input
   and the hold releases once |holdSpent| ≥ holdNeed. */
let holdActive = false, holdY = 0, holdSpent = 0, holdNeed = 0, holdLabel = '';
const held = () => holdActive;

function refreshMaxY() { maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight); }
window.addEventListener('resize', refreshMaxY);
window.addEventListener('load', refreshMaxY);
refreshMaxY();

const stopYs = () => snapStops.map(stopY);
function adjacentStopY(y, dir) {          // next stop strictly beyond y in a direction
  const ys = stopYs(), EPS = 6;
  if (dir > 0) return ys.find((s) => s > y + EPS);
  const b = ys.filter((s) => s < y - EPS); return b.length ? b[b.length - 1] : undefined;
}

/* explicit cubic-in-out glide to an absolute y (nav only, not scrolling) */
function glideTo(y) {
  if (y == null) return;
  y = clamp(y, 0, maxY);
  holdActive = false;                     // a deliberate jump clears any active hold
  if (reduced) { window.scrollTo(0, y); return; }
  glY0 = window.scrollY; glY1 = y;
  if (Math.abs(glY1 - glY0) < 1) { scrollMode = 'idle'; return; }
  glDur = clamp(Math.abs(glY1 - glY0) / Math.max(1, window.innerHeight), 0.22, 1) * SNAP.dur;
  glT0 = performance.now();
  scrollMode = 'glide';
}

/* moves the scroll once per animation frame (called from the render loop) */
function advanceScroll(now, dt) {
  const k = 1 - Math.exp(-dt * SNAP.smooth);
  const pos = window.scrollY;

  /* active hold: ease onto the hold point and stay pinned; input is fed to
     holdSpent by the handlers below and releases the hold via feedHold */
  if (holdActive) {
    const ny = lerp(pos, holdY, k);
    window.scrollTo(0, Math.abs(holdY - ny) < 0.4 ? holdY : ny);
    aimY = holdY;
    prevPosY = window.scrollY;
    return;
  }

  if (scrollMode === 'free') {
    let ny = lerp(pos, aimY, k);
    /* catch a re-armed hold we cross this frame → stick to it */
    for (const h of holds) {
      const sc = scenes[h.i];
      const hy = sc.top + sc.len * h.frac;                        // live (survives re-measure)
      if (Math.abs(pos - hy) > SNAP.rearm) h.armed = true;         // moved away → re-arm
      if (h.armed && ((prevPosY < hy) !== (ny < hy))) {            // crossed hy this frame
        h.armed = false;
        holdActive = true; holdY = hy; holdSpent = 0; holdNeed = h.dist;
        holdLabel = sc.label;
        aimY = hy; ny = hy;
        break;
      }
    }
    window.scrollTo(0, Math.abs(aimY - ny) < 0.4 ? aimY : ny);
  } else if (scrollMode === 'glide') {
    const p = glDur ? clamp((now - glT0) / glDur) : 1;
    window.scrollTo(0, glY0 + (glY1 - glY0) * easeInOut(p));
    if (p >= 1) scrollMode = 'idle';
  }
  prevPosY = window.scrollY;
}

function goToScene(i) { glideTo(sceneScrollTop(i)); }
document.getElementById('goPrev').addEventListener('click', () => glideTo(adjacentStopY(window.scrollY, -1) ?? 0));
document.getElementById('goNext').addEventListener('click', () => glideTo(adjacentStopY(window.scrollY, 1) ?? maxY));

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

/* ── input → smooth free-scroll (wheel / keys / touch) ───────────────
   Native scroll is intercepted and re-emitted through the eased model
   above; input is ABSORBED while a hold is active. Skipped under
   prefers-reduced-motion (native scroll stays). */
if (!reduced) {
  const PAGE = new Set(['PageDown', 'PageUp', ' ', 'Spacebar']);
  const beginFree = () => { if (scrollMode !== 'free') { aimY = window.scrollY; scrollMode = 'free'; } };
  /* while pinned on a hold, scroll input is spent against holdNeed instead
     of moving the page; once |holdSpent| clears it, let go and continue in
     the push direction (nudged just past the hold so it doesn't re-catch) */
  const feedHold = (delta) => {
    /* the Ask-Tilli hold swallows all scroll input until its chat has played
       through to the response — you can't skip past the exchange */
    if (holdLabel === 'Ask-Tilli' && askChat.locked) return;
    holdSpent += delta;
    if (Math.abs(holdSpent) >= holdNeed) {
      const dir = Math.sign(holdSpent) || 1;
      holdActive = false;
      beginFree();
      aimY = clamp(holdY + dir * (SNAP.rearm + 30), 0, maxY);
    }
  };
  const nudge = (dy) => { if (holdActive) { feedHold(dy); return; } beginFree(); aimY = clamp(aimY + dy, 0, maxY); };

  window.addEventListener('wheel', (e) => {
    if (e.ctrlKey) return;                  // leave pinch-zoom to the browser
    e.preventDefault();                     // take over native free-scroll
    if (holdActive) { feedHold(e.deltaY * SNAP.wheelMult); return; }   // spend input against the hold
    beginFree();
    aimY = clamp(aimY + e.deltaY * SNAP.wheelMult, 0, maxY);
  }, { passive: false });

  window.addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea, select, button, a, [contenteditable]')) return;
    const vh = window.innerHeight;
    if (e.key === 'Home') { e.preventDefault(); glideTo(stopYs()[0]); return; }
    if (e.key === 'End') { e.preventDefault(); const a = stopYs(); glideTo(a[a.length - 1]); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); nudge(vh * 0.2); return; }
    if (e.key === 'ArrowUp') { e.preventDefault(); nudge(-vh * 0.2); return; }
    if (PAGE.has(e.key)) { e.preventDefault(); nudge((e.key === 'PageUp' ? -1 : 1) * vh * 0.9); return; }
  });

  let touchY = null;
  window.addEventListener('touchstart', (e) => {
    touchY = e.touches[0].clientY;
    if (!held()) beginFree();
  }, { passive: true });
  window.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (touchY == null) return;
    const cur = e.touches[0].clientY;
    const dy = touchY - cur;                // finger up → scroll down
    touchY = cur;
    if (holdActive) { feedHold(dy); return; }   // spend finger travel against the hold
    beginFree();
    aimY = clamp(aimY + dy, 0, maxY);
  }, { passive: false });
  window.addEventListener('touchend', () => { touchY = null; }, { passive: true });
}

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
    aiH: q('[data-ai-h]'), aiP: q('[data-ai-p]'), aiCards: qa('[data-ai-card]'),
    aiQs: qa('[data-ai-q]'), aiTypings: qa('[data-ai-typing]'),
    aiRs: qa('[data-ai-r]'), aiFoots: qa('[data-ai-foot]'),
    stH: q('[data-st-h]'), stP: q('[data-st-p]'), pops: qa('[data-pop]'), stWrap: q('.wrap'),
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

/* fOverride lets the render loop pass a TIME-SMOOTHED f (renderF) so the
   whole scene — dots and DOM together — eases between states during a fast
   snap instead of jumping. Called with no arg (raw scroll) at setup. */
function onScroll(fOverride) {
  const f = fOverride == null ? stationF() : fOverride;
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
  const crossI = ST['Cross'], dashI = ST['Dashboard'], skillsI = ST['12 skills'], onTrackI = skillsI + 1;
  const aiI = ST['Ask-Tilli'], askLiveI = ST['Ask-live'], impactI = ST['Impact'];
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
    let ty = 0, tx = 0, exScale = 1, exBlur = 0;
    if (k === 0) {
      /* the hero text stays centred and FADES as the dot streams cross paths
         in front of it (they're lifted above the content — see liftDots
         above); it no longer rides up and out */
      op = 1 - heroGone;
    } else if (k === skillsI) {
      /* 360° cards ease OUT to the LEFT (mirror of the DNA leaving right) over
         the exit half of the handover, fading as they go; the On-track text
         then fades in (onTrackI branch) before the kids walk in. */
      const ex = smoother(clamp(((clamp(f - k) - SKILLS_EXIT.start) / (1 - SKILLS_EXIT.start)) / 0.5));
      tx = -ex;
      op *= 1 - ex;
    } else if (k === onTrackI) {
      /* the On-track text arrives FIRST — it fades in over the 12-skills tail
         (f ≈ skills+0.78 → 0.94), just as the DNA finishes leaving and before
         the kids walk in — then holds and cross-fades out normally to Ask-Tilli. */
      const tIn = smooth(clamp((f - (skillsI + 0.78)) / 0.16));
      const tOut = smooth(clamp((f - (onTrackI + 1 - FADE_LEN)) / FADE_LEN));
      op = tIn * (1 - tOut);
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
    } else if (k === aiI) {
      /* NORMAL SCROLL out to Ask-live — NO cross-fade on the way out. "Any AI
         can…" fades in from On-track as usual, holds opaque through its chat,
         then physically translates UP and out (like a normal page scroll) as
         the Ask-live screen climbs in from below. */
      const inFade = smooth(clamp((f - (aiI - FADE_OVER)) / FADE_LEN));
      const aiOut = smoother(clamp((f - (aiI + 0.58)) / 0.42));
      ty = -aiOut;
      op = inFade * (1 - smooth(clamp((aiOut - 0.92) / 0.08)));   // opaque until fully gone
    } else if (k === askLiveI) {
      /* "Ask Tilli anything…" SCROLLS IN from below (opaque the whole way), then
         on the way OUT to Impact it ZOOMS THROUGH the camera — scales up + fades
         + blurs, all at once — to sell the feeling of moving INTO the next scene.
         The dot field fades out over the same window (see the dotMat block). */
      const askIn = smoother(clamp((f - (askLiveI - 0.42)) / 0.42));
      const askOut = smooth(clamp((f - (askLiveI + 0.62)) / 0.34));   // exit ramp over the tail
      ty = 1 - askIn;
      op = smooth(clamp(askIn / 0.08)) * (1 - askOut);
      exScale = 1 + askOut * 0.7;    // grow past the camera
      exBlur = askOut * 16;          // px
    } else if (k === impactI) {
      /* "30+ schools…" — the stage is held opaque across the Ask-live→Impact
         boundary while #impactCard does the reveal (fade in + scale up + unblur,
         0.2s after Ask-live has blurred away — CSS drives that pause). It then
         cross-fades out to Journey normally at its own tail. */
      const toJourney = smooth(clamp((f - (impactI + 1 - FADE_LEN)) / FADE_LEN));
      op = smooth(clamp((f - (impactI - 0.45)) / 0.2)) * (1 - toJourney);
      if (impactCardEl) impactCardEl.classList.toggle('in', f > impactI - 0.06 && toJourney < 0.9);
    }
    if (sc.stage) {
      const tStr = (tx || ty || exScale !== 1)
        ? `translate3d(${(tx * 100).toFixed(3)}%, ${(ty * 100).toFixed(3)}%, 0)${exScale !== 1 ? ` scale(${exScale.toFixed(3)})` : ''}`
        : '';
      if (tStr !== sc._tStr) { sc.stage.style.transform = tStr; sc._tStr = tStr; }
      const fStr = exBlur > 0.05 ? `blur(${exBlur.toFixed(1)}px)` : '';
      if (fStr !== sc._fStr) { sc.stage.style.filter = fStr; sc._fStr = fStr; }
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
    /* on exit (p ≥ start) the whole headline block ZOOMS OUT (shrinks) as the
       kids slide off — it recedes while the stage cross-fades away */
    const exit = ease(clamp((p - ONTRACK_EXIT.start) / (1 - ONTRACK_EXIT.start)));
    const zoom = lerp(1, ONTRACK_EXIT.textZoom, exit);
    if (T.stWrap) T.stWrap.style.transform = `translate(${STATE_TEXT.x}px, ${STATE_TEXT.y}px) scale(${STATE_TEXT.z * zoom})`;
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
  if (sc.pin === 'ai' && T.aiH) {
    /* ONE clock drives the whole section. It starts the instant the scene is
       entered (headline appearing) and is armed only inside a scroll window
       bracketing the hold at REST, so it replays cleanly whether you arrive
       from above or below. Everything downstream — headline, cards, prompt,
       typing, dots (step() reads askChat.ms), response — plays off this clock,
       NOT the scroll. */
    const TRIG_IN = 0.24, TRIG_OUT = 0.55;          // p-window the sequence PLAYS in
    const live = p >= TRIG_IN && p <= TRIG_OUT;
    /* reset (re-arm for replay) only when scrolled back BEFORE the chat — NOT
       once it has finished. That way the completed boxes scroll away with their
       content intact instead of blanking out the instant p passes TRIG_OUT. */
    if (p < TRIG_IN) { sc._chatT = 0; askChat.locked = true; }
    else if (live && !sc._chatT) sc._chatT = performance.now();
    const rawMs = sc._chatT ? performance.now() - sc._chatT : -1;
    /* DOM clock: real time while live, then HELD at the finished frame past
       TRIG_OUT so the boxes stay fully drawn as they scroll off (1e7 covers
       arriving from below, where the chat never ran). The dot-flow clock
       (askChat.ms) tracks the SAME held clock past TRIG_OUT so the streaming
       dots keep flowing as the section scrolls away instead of vanishing;
       only BEFORE the chat (p < TRIG_IN) are they parked un-born (-1). */
    const ms = p > TRIG_OUT ? (sc._chatT ? rawMs : 1e7) : rawMs;
    askChat.ms = live ? rawMs : (p > TRIG_OUT ? ms : -1);
    const at = (from, dur) => (ms < 0 ? 0 : ease(clamp((ms - from) / dur)));
    /* 1 · the headline ZOOMS IN (scales up from small) and fades on */
    const qh = at(0, ASK.headDur);
    T.aiH.style.opacity = String(qh);
    T.aiH.style.transform = `scale(${lerp(ASK.headFrom, 1, qh)})`;
    /* 2 · the sub-line follows right behind it */
    if (T.aiP) T.aiP.style.opacity = String(at(ASK.subAt, 260));
    /* 3 · once the headline has landed, BOTH chat boxes rise in together */
    const qc = at(ASK.cardsAt, ASK.cardsDur);
    T.aiCards.forEach((c) => {
      c.style.opacity = String(qc);
      c.style.transform = `translateY(${(1 - qc) * 22}px) scale(${lerp(0.97, 1, qc)})`;
    });
    /* pop a bubble IN with a WhatsApp-style scale/fade once `t0` ms have passed;
       display:none until then so it takes no space and the box stays clean. */
    const pop = (el, t0, disp) => {
      if (!el) return;
      if (ms < t0) { el.style.display = 'none'; return; }
      el.style.display = disp;
      const t = clamp((ms - t0) / ASK.pop);
      el.style.opacity = String(clamp(t / 0.55));
      el.style.transform = `scale(${lerp(0.55, 1, easeOutBack(t))})`;
    };
    /* 4 · CHAT. Per box: prompt pops → a typing bubble shows while the dots
       stream down the path → the response replaces it the instant the first
       dot arrives. Track the LAST response so we know when to release scroll. */
    let lastResp = 0;
    T.aiCards.forEach((_, i) => {
      const tPrompt = ASK.promptAt + i * ASK.stagger;   // the second box lags slightly
      /* the dots begin streaming flowGap after the prompt; the response pops the
         instant the FIRST dot reaches the box — i.e. one full path-traverse
         (1/speed sec) later. Same numbers the flow block uses, so they agree. */
      const spd = i === 0 ? ASK_FLOW.red.speed : ASK_FLOW.blue.speed;
      const tResp = tPrompt + ASK.flowGap + (spd > 0 ? 1000 / spd : 0);
      lastResp = Math.max(lastResp, tResp);
      pop(T.aiQs[i], tPrompt, 'block');                 // prompt bubble
      /* typing dots live between the prompt landing and the answer arriving */
      const tp = T.aiTypings[i];
      if (tp) {
        const typing = ms >= tPrompt + ASK.pop && ms < tResp;
        tp.style.display = typing ? 'flex' : 'none';
        tp.style.opacity = typing ? '1' : '0';
        tp.style.transform = 'scale(1)';
      }
      pop(T.aiRs[i], tResp, 'block');                   // the answer (on dot arrival)
      if (T.aiFoots[i]) T.aiFoots[i].style.opacity = String(clamp((ms - (tResp + ASK.pop)) / 260));
    });
    /* release the scroll only once the (later) response has fully popped in.
       Once released, the visitor scrolls DOWN into the interactive "Ask-Tilli
       live" section themselves — a normal, non-seamless scroll (no auto-glide). */
    askChat.locked = !(ms >= lastResp + ASK.pop);
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

/* ─── Path/arc value dumps ───────────────────────────────────────────
   The live drag-editors for the dashboard crossing paths and the collect
   split arcs were removed once both were baked (DASH_PATHS / COLLECT_ARC).
   These helpers still dump the current values as copy-paste text through
   the console hooks __tilliPaths() / __tilliCollectArcs(), so a future
   retune can bake new numbers without re-adding an editor. */
function pathsText() {
  const f = (a) => '[' + a.map((p) => `[${p[0].toFixed(3)}, ${p[1].toFixed(3)}]`).join(', ') + ']';
  return `red:  ${f(DASH_PATHS.red)},\nblue: ${f(DASH_PATHS.blue)},`;
}
function collectArcsText() {
  const f = (a) => '[' + a.map((p) => `[${p[0].toFixed(3)}, ${p[1].toFixed(3)}]`).join(', ') + ']';
  return `red:  ${f(COLLECT_ARC.red)},\nblue: ${f(COLLECT_ARC.blue)},`;
}
function askFlowText() {
  const f = (a) => '[' + a.map((p) => `[${p[0].toFixed(3)}, ${p[1].toFixed(3)}]`).join(', ') + ']';
  return `gray: '${ASK_FLOW.gray}',\n` +
    `red:  { pts: ${f(ASK_FLOW.red.pts)}, speed: ${ASK_FLOW.red.speed} },\n` +
    `blue: { pts: ${f(ASK_FLOW.blue.pts)}, speed: ${ASK_FLOW.blue.speed} },`;
}
/* Live drag-editor for the two ASK_FLOW arcs — an SVG overlay with draggable
   handles at each control point (fractions). Toggled from the GUI; the flow
   block reads ASK_FLOW every frame, so the stream reshapes as you drag. */
function buildAskPathEditor() {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('width', '100%'); svg.setAttribute('height', '100%');
  svg.style.cssText = 'position:fixed;inset:0;z-index:99998;display:none;';
  const stroke = { red: '#e0483a', blue: '#2b6fe0' };
  const paths = {}, handles = {};
  ['red', 'blue'].forEach((side) => {
    const path = document.createElementNS(NS, 'path');
    path.setAttribute('fill', 'none'); path.setAttribute('stroke', stroke[side]);
    path.setAttribute('stroke-width', '2'); path.setAttribute('stroke-dasharray', '6 5');
    svg.appendChild(path); paths[side] = path;
    handles[side] = ASK_FLOW[side].pts.map((_, i) => {
      const c = document.createElementNS(NS, 'circle');
      const anchor = i === 0 || i === 3;
      c.setAttribute('r', anchor ? 9 : 6);
      c.setAttribute('fill', anchor ? stroke[side] : '#fff');
      c.setAttribute('stroke', stroke[side]); c.setAttribute('stroke-width', '2.5');
      c.style.cssText = 'cursor:grab;';
      c.dataset.side = side; c.dataset.i = i;
      svg.appendChild(c); return c;
    });
  });
  const redraw = () => {
    ['red', 'blue'].forEach((side) => {
      const q = ASK_FLOW[side].pts.map((p) => [p[0] * window.innerWidth, p[1] * window.innerHeight]);
      paths[side].setAttribute('d', `M${q[0][0]},${q[0][1]} C${q[1][0]},${q[1][1]} ${q[2][0]},${q[2][1]} ${q[3][0]},${q[3][1]}`);
      handles[side].forEach((c, i) => { c.setAttribute('cx', q[i][0]); c.setAttribute('cy', q[i][1]); });
    });
  };
  let drag = null;
  svg.addEventListener('pointerdown', (e) => {
    if (!e.target.dataset.side) return;
    drag = { side: e.target.dataset.side, i: +e.target.dataset.i };
    e.target.setPointerCapture(e.pointerId);
  });
  svg.addEventListener('pointermove', (e) => {
    if (!drag) return;
    ASK_FLOW[drag.side].pts[drag.i] = [clamp(e.clientX / window.innerWidth, -0.25, 1.25), clamp(e.clientY / window.innerHeight, -0.25, 1.25)];
    redraw();
  });
  svg.addEventListener('pointerup', () => { drag = null; });
  window.addEventListener('resize', redraw);
  document.body.appendChild(svg);
  redraw();
  return { toggle: (on) => { svg.style.display = on ? 'block' : 'none'; if (on) redraw(); } };
}

/* ═══════════════════════════════════════════════════════════════════
   HERO HANDS — two Milo-Hand images that sweep in from the top corners
   and cradle the dot orb (the image-1 layout). Each hand is positioned by
   its centre, sized by `scale`, and can be mirrored on either axis — all
   live-tunable from the GUI (see initThree → `hands`). They fade out as the
   orb bursts. The hand meshes themselves are created inside initThree so
   they can be added straight into scene3.
   ═══════════════════════════════════════════════════════════════════ */

/* The live "Kids controls" panel was removed once its values were baked
   into KID and STATE_TEXT above. The console hooks below still dump the
   current values (__tilliKids / __tilliText) if you want to retune + rebake. */
window.__tilliKids = () => ({ ...KID, colors: KID.colors.slice() });
window.__tilliText = () => ({ ...STATE_TEXT });

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
  let f = 0;
  let renderF = stationF();   // time-smoothed scroll the whole scene reads (see step)
  let lastT = performance.now();
  /* drain progress: once parked at the "Schools see…" screen, dots stop
     respawning at the start of the path and flow on to the END. 0 = full
     stream, 1 = fully drained. Reset when scrolling back above the dashboard. */
  let drainAmt = 0;

  /* NOTE: no 'scroll' listener here — the render loop drives onScroll every
     frame with the smoothed renderF, so a raw scroll-event call would fight
     it. (The reduced-motion branch keeps its own raw scroll listener.) */
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
    /* hybrid scroll first (moves window.scrollY this frame), then read it and
       ease renderF toward it: the whole scene (dots + DOM) interpolates
       between states during a fast snap instead of jumping. renderF snaps to
       the exact target once close so resting formations stay pixel-accurate. */
    advanceScroll(now, dt);
    const rawF = stationF();
    renderF += (rawF - renderF) * (1 - Math.exp(-dt * SNAP.fieldLag));
    if (Math.abs(rawF - renderF) < 0.0004) renderF = rawF;
    f = onScroll(renderF);

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
    /* 12 SKILLS → ON TRACK: the generic base-morph is switched OFF for this
       scene (tt = 0 holds the mini-helix) — the dedicated handover block below
       owns the whole choreography: DNA eases out right, kids walk in from left. */
    if (si === ST['12 skills']) tt = 0;
    /* ON TRACK → ASK-TILLI: base-morph off too — the kids don't melt into the
       AI formation, they slide straight off the sides (ONTRACK_EXIT block). */
    if (si === ST['On track']) tt = 0;
    /* ASK-TILLI → ASK-LIVE: base-morph OFF so the field never blends into the
       confetti scatter — it holds WHITE (the ai form) through the handover,
       and the ASK-LIVE wave block below fades the sine line in cleanly on top.
       Keeps the section change a plain scroll with no dot transition. */
    if (si === ST['Ask-Tilli']) tt = 0;
    /* dot size tracks the position morph exactly: only the 12-skills form
       carries the shrunken dotScale, so the dots scale down in lock-step with
       the geometry as Measure→12-skills and grow back on the way out. */
    {
      const sizeOf = (idx) =>
        idx === ST['12 skills'] ? DNA2_CFG.dotScale :
        idx === ST['On track'] ? KID.dot / BASE_DOT_SIZE : 1;
      th.dotMat.size = BASE_DOT_SIZE * lerp(sizeOf(i), sizeOf(i + 1), tt);
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
        /* idle spin: ACCUMULATE the angle while the helix owns the screen, then
           FREEZE it at the 12-skills→On-track handover (f > skI+0.9). Freezing
           (rather than the old `time*0.4 * wgt`, which scaled a large absolute
           angle down toward 0 as wgt faded) means the helix holds its last
           rotation and morphs straight into the kids with no unwind spin. */
        const spinIn = clamp((f - (dnaI - 0.35)) / 0.35);
        if (f <= skI + SKILLS_EXIT.start) th.dnaSpin = (th.dnaSpin || 0) + dt * 0.4 * spinIn;
        const ang = th.dnaSpin || 0;
        const reveal = f > dnaI + 0.85 ? 1 : th.dnaP; // fully woven before the slide begins
        for (let n = 0; n < N; n++) {
          const k = n * 3;
          rotate2D(P, k, cx * (si >= dnaI ? 1 : 0), cz, ang);
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

    /* 12 SKILLS EXIT: over the first half of the scene tail the DNA (already
       spun+shaded by the block above) eases off to the RIGHT and whitens away.
       The kids are NOT drawn here — they walk in via the time-based block below,
       which takes over once the helix is gone. The 360° cards slide left / the
       On-track text fades in first — see onScroll. */
    if (si === ST['12 skills']) {
      const hb = clamp((S.p - SKILLS_EXIT.start) / (1 - SKILLS_EXIT.start));   // linear 0→1
      if (hb > 0 && hb < 0.5) {
        const outP = smoother(clamp(hb / 0.5));          // DNA exit: eased 0→1 over first half
        const dx = SKILLS_EXIT.slideR * outP;
        for (let n = 0; n < N; n++) {
          const k = n * 3;
          P[k] += dx;                                    // ease the spun helix off-right
          CL[k]     = lerp(CL[k], 1, outP);
          CL[k + 1] = lerp(CL[k + 1], 1, outP);
          CL[k + 2] = lerp(CL[k + 2], 1, outP);
        }
      }
    }

    /* KIDS WALK-IN: once the DNA has cleared (f ≥ f0) and the text is in, the
       children WALK in from the LEFT with an up/down bob, then settle. Time-based
       (th.kidWalk advances at WALK.speed, independent of the scroll scrub) so it
       reads as walking. Spans the 12-skills tail into On-track, and fully owns
       the field there — overwriting the held DNA so it doesn't reappear. */
    {
      const skI = ST['12 skills'], onI = skI + 1;
      const f0 = skI + 0.8;                              // hb 0.5 — the DNA has fully exited
      const fEnd = onI + MORPH_AT;                        // where On-track starts morphing to the next scene
      if (f >= f0 && f < fEnd) {
        th.kidWalk = Math.min(1, (th.kidWalk || 0) + dt * WALK.speed);
        const kids = th.F[onI];
        const wlk = smoother(th.kidWalk);                // eased 0→1 arrival
        const lx = WALK.slideL * (1 - wlk);              // remaining leftward offset → 0 at rest
        const colIn = smooth(clamp(th.kidWalk / 0.1));   // colour up from white as they enter
        /* the bob keeps hopping through the walk AND the whole On-track hold,
           at full strength right up to the exit — the straight exit below then
           carries the same bob and fades it out as the kids slide off. */
        const bobEnv = 1;
        for (let n = 0; n < N; n++) {
          const k = n * 3;
          /* |sin| — a HOP: rises off the baseline and returns to it each step
             (arches ∩∩∩), never dipping below, so it reads as bobbing/walking
             rather than a sine wave floating up and down through the line. */
          const bob = Math.abs(Math.sin(time * WALK.bobFreq + (n % KID.count) * 1.1)) * WALK.bob * bobEnv;
          P[k]     = kids.pos[k] - lx;
          P[k + 1] = kids.pos[k + 1] + bob;
          P[k + 2] = kids.pos[k + 2];
          CL[k]     = lerp(1, kids.col[k], colIn);
          CL[k + 1] = lerp(1, kids.col[k + 1], colIn);
          CL[k + 2] = lerp(1, kids.col[k + 2], colIn);
        }
      } else if (f < f0) {
        th.kidWalk = 0;                                  // rearm when scrolled back before the walk
      }
    }

    /* ON-TRACK EXIT → ASK-TILLI: once the kids have held (S.p ≥ start), they
       leave in a STRAIGHT horizontal line — the 3 left kids off-left, the 3
       right kids off-right — over the first half of the tail, whitening away.
       The Ask-Tilli formation then fades in from white over the back half, so
       the position jump at the crossover is invisible (both ends pure white). */
    if (si === ST['On track'] && S.p >= ONTRACK_EXIT.start) {
      const onI = ST['On track'], aiI = onI + 1;
      const hb = clamp((S.p - ONTRACK_EXIT.start) / (1 - ONTRACK_EXIT.start));   // 0→1 across the tail
      if (hb <= 0.5) {
        /* PHASE 1 — kids slide straight out to their side; hold colour, then whiten */
        const move = smoother(clamp(hb / 0.5));
        const col  = smoother(clamp((hb - ONTRACK_EXIT.holdCol * 0.5) / (0.5 - ONTRACK_EXIT.holdCol * 0.5)));
        const kids = th.F[onI];
        for (let n = 0; n < N; n++) {
          const k = n * 3;
          const dir = (n % KID.count) < KID.count / 2 ? -1 : 1;   // kids 0,1,2 left · 3,4,5 right
          /* carry the walk-in bob in (full at move=0, so it's seamless with the
             hold) and fade it out as they slide away — same |sin| hop as WALK */
          const bob = Math.abs(Math.sin(time * WALK.bobFreq + (n % KID.count) * 1.1)) * WALK.bob * (1 - move);
          P[k]     = kids.pos[k] + dir * ONTRACK_EXIT.dist * move;
          P[k + 1] = kids.pos[k + 1] + bob;
          P[k + 2] = kids.pos[k + 2];
          CL[k]     = lerp(kids.col[k], 1, col);
          CL[k + 1] = lerp(kids.col[k + 1], 1, col);
          CL[k + 2] = lerp(kids.col[k + 2], 1, col);
        }
        th.dotMat.size = KID.dot;
      } else {
        /* PHASE 2 — the Ask-Tilli formation fades in from white at its rest spots */
        const inP = smoother(clamp((hb - 0.5) / 0.5));
        const ai = th.F[aiI];
        for (let n = 0; n < N; n++) {
          const k = n * 3;
          P[k]     = ai.pos[k];
          P[k + 1] = ai.pos[k + 1];
          P[k + 2] = ai.pos[k + 2];
          CL[k]     = lerp(1, ai.col[k], inP);
          CL[k + 1] = lerp(1, ai.col[k + 1], inP);
          CL[k + 2] = lerp(1, ai.col[k + 2], inP);
        }
        th.dotMat.size = lerp(KID.dot, BASE_DOT_SIZE, inP);
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

    /* ASK-TILLI CARD IN-FLOW: the field is held WHITE (invisible) through this
       scene; the dots you see are GENERATED here and streamed into the boxes.
       Each box's stream begins flowGap after its prompt (askChat clock, shared
       with runPin) and emits dots FROM THE PATH START — a dot is "born" only
       once the flow front passes its phase, so the stream builds from the start
       and flows like water to the box. Grey dots (even) ride the red path into
       the generic box; the colourful dots (odd) ride the blue path into the
       Ask-Tilli box. `own` releases into the Impact morph at the scene tail. */
    /* Ask-live has NO pin of its own, and runPin('ai') — which owns askChat.ms —
       stops firing once the Ask-Tilli stage scrolls out to opacity 0 (the
       op<0.004 early return in onScroll). Without this the clock freezes and the
       stream stalls the instant you land on "Now you try". Tick it here in
       step() (always runs) so the flow keeps pouring. */
    if (si === ST['Ask-live'] && askChat.ms >= 0) askChat.ms += dt * 1000;
    if (si === ST['Ask-Tilli'] || si === ST['Ask-live']) {
      /* The colourful stream keeps flowing on BOTH the Ask-Tilli scene and the
         following Ask-live ("Now you try") scene — same clock (askChat.ms keeps
         advancing), so it never freezes. On Ask-live only the colourful stream
         survives: the grey (generic-box) dots are fully released and the whole
         background field is banished off-screen so nothing shows behind it. */
      const onLive = si === ST['Ask-live'];
      /* on scroll-past only the GREY (generic-box) dots release back to the
         base morph and disappear; the COLOURFUL dots stay fully held on their
         path so they carry straight into the Ask-live cursor swarm. */
      const greyOwn = onLive ? 0 : 1 - smooth(clamp((S.p - (MORPH_AT - 0.03)) / 0.09));
      {
        const AZ = ASK_FLOW.z, W = ASK_FLOW.width, ms = askChat.ms;
        const rW = ASK_FLOW.red.pts.map((p) => screenFracToWorld(p[0], p[1], AZ));
        const bW = ASK_FLOW.blue.pts.map((p) => screenFracToWorld(p[0], p[1], AZ));
        const white = th._white || (th._white = new THREE.Color('#ffffff'));
        const grey = th._askGrey || (th._askGrey = new THREE.Color());
        grey.set(ASK_FLOW.gray).lerp(white, 0.06);
        const pal = th._askPal || (th._askPal = [C.cyan, C.green, C.yellow].map((h) => new THREE.Color(h).lerp(white, 0.05)));
        const start0 = ASK.promptAt + ASK.flowGap;                  // grey box flow start (ms)
        const start1 = ASK.stagger + ASK.promptAt + ASK.flowGap;    // colour box flow start
        /* SCROLL-AWAY / SNAP: the COLOURFUL tail rubber-bands onto a moving
           target. The start (A) and first handle (C1) stay put — only the tail
           handle (C2) and endpoint (D) chase the target, so the stream keeps
           flowing but now pours THERE instead of at the box. Off on touch (no
           pointer). The grey path is never attached.
             • On Ask-Tilli the target is the cursor (comet trail).
             • On Ask-live the socket is ARMED (glowing invite). Once the cursor
               comes within plugRadius of the input, a plug factor eases 0→1 and
               the target slides from cursor → socket centre: the dots SNAP into
               the box and pour in continuously, never stopping. */
        let tgtX, tgtY;
        {
          const cur = screenFracToWorld(POINTER.fx, POINTER.fy, AZ);
          tgtX = cur[0]; tgtY = cur[1];
          if (onLive) {
            const sock = askSocketWorld();
            if (sock) th._askSockLast = sock;             // remember it for frames the rect read fails
            /* LATCH: the instant the cursor gets near — OR the moment the demo
               locks (input bar gone, sock.locked) — the stream connects and
               STAYS connected. _askPlugF eases to 1 and never decays back, so
               neither moving the cursor away nor the demo ending can pull the
               dots out. Resets only when you leave the Ask-live scene (below). */
            if (sock && (sock.near || sock.locked)) th._askLatched = true;
            th._askPlugF = lerp(th._askPlugF || 0, th._askLatched ? 1 : 0, 1 - Math.exp(-dt * 7));
            const s = sock || th._askSockLast;
            if (s) { tgtX = lerp(cur[0], s.wx, th._askPlugF); tgtY = lerp(cur[1], s.wy, th._askPlugF); }
            /* arm the glowing socket + guide through the scene body; flip to the
               green "plugged" lock the moment it latches */
            const armed = S.p < 0.86;
            setAskSocketState(armed ? 1 : 0, armed && th._askLatched);
          }
        }
        /* once latched the tail stays pinned even with no pointer motion (e.g.
           the demo locked while the cursor sits still), so force full attach. */
        const attach = onLive
          ? (POINTER.seen || th._askLatched ? 1 : 0)
          : (POINTER.seen ? smooth(clamp((S.p - REST) / 0.22)) : 0);
        let bWc = bW;
        if (attach > 0.001) {
          const cur = [tgtX, tgtY];
          const C2 = bW[2], D = bW[3];
          bWc = [bW[0], bW[1],
            [lerp(C2[0], cur[0], attach * 0.7), lerp(C2[1], cur[1], attach * 0.7), AZ],
            [lerp(D[0],  cur[0], attach),       lerp(D[1],  cur[1], attach),       AZ]];
        }
        for (let n = 0; n < N; n++) {
          const k = n * 3;
          const isGrey = n % 2 === 0;
          const own = isGrey ? greyOwn : 1;   // colourful dots never release here
          if (own <= 0.001) {
            /* on Ask-live the released (grey) dots are the leftover background
               confetti — white ≠ invisible on this wash, so park them far
               off-screen; on Ask-Tilli (white wash) just leave them to the
               base morph, where they read as invisible. */
            if (onLive) P[k] = 1e5;
            continue;
          }
          const arc = isGrey ? rW : bWc;
          const spd = isGrey ? ASK_FLOW.red.speed : ASK_FLOW.blue.speed;
          const fst = isGrey ? start0 : start1;
          const prog = ms < 0 ? -1 : (ms - fst) / 1000 * spd;   // 0 at flow start, 1 when the front hits the box
          const c = prog - askPh[n];
          let tx, ty, tz, show;
          if (c >= 0) {
            const t = c % 1;                                     // 0 = path start, 1 = box
            tx = bez3(arc[0][0], arc[1][0], arc[2][0], arc[3][0], t) + askJx[n] * W;
            ty = bez3(arc[0][1], arc[1][1], arc[2][1], arc[3][1], t) + askJy[n] * W;
            tz = AZ + askJz[n] * 1.2;
            /* fade in off-frame; fade out INTO the box — but once the colourful
               tail is attached to the cursor, drop that out-fade so the dots
               actually arrive at the pointer instead of vanishing. */
            const outFade = smooth(clamp((t - 0.82) / 0.18)) * (isGrey ? 1 : 1 - attach);
            show = Math.min(smooth(clamp(t / 0.07)), 1 - outFade);
          } else {
            tx = arc[0][0]; ty = arc[0][1]; tz = AZ;             // un-born: parked (invisible) at the path start
            show = 0;
          }
          P[k]     = lerp(P[k], tx, own);
          P[k + 1] = lerp(P[k + 1], ty, own);
          P[k + 2] = lerp(P[k + 2], tz, own);
          const col = isGrey ? grey : pal[(n >> 1) % 3];
          CL[k]     = lerp(CL[k], lerp(1, col.r, show), own);
          CL[k + 1] = lerp(CL[k + 1], lerp(1, col.g, show), own);
          CL[k + 2] = lerp(CL[k + 2], lerp(1, col.b, show), own);
        }
      }
    }
    /* keep the socket dark everywhere except Ask-live (cheap: setAskSocketState
       only touches the DOM when the armed/plugged state actually flips), and
       clear the latch so the connection re-arms fresh next time in. */
    if (si !== ST['Ask-live']) { setAskSocketState(0, false); th._askLatched = false; th._askPlugF = 0; }

    /* ASK-LIVE — the colourful stream keeps FLOWING across this whole scene
       (drawn by the flow block above, extended to run here with attach=1 so
       its tail stays pinned to the cursor). The field is held at full opacity
       so the stream reads, and fades out only over the last slice as we head
       into Impact — where the re-formed field fades back in. No freeze, no
       cursor swarm, no re-forming. */
    if (ST['Ask-live'] != null) {
      if (si === ST['Ask-live'])    th.dotMat.opacity = DOT_OPACITY * (1 - smooth(clamp((S.p - 0.82) / 0.16)));
      /* Impact is now a clean card (no dot swirl) — keep the field hidden through
         it, fading back in only over the tail so it's ready for Journey. */
      else if (si === ST['Impact']) th.dotMat.opacity = DOT_OPACITY * smooth(clamp((S.p - 0.85) / 0.12));
      else                          th.dotMat.opacity = DOT_OPACITY;
    }

    /* DEBUG — refresh the blue-path overlay (Bézier curve + control polygon +
       control-point spheres) in world space; only visible while Ask-Tilli is on. */
    if (th.askPathDbg) {
      const d = th.askPathDbg, show = si === ST['Ask-Tilli'];
      d.curve.visible = d.poly.visible = show;
      d.spheres.forEach((m) => (m.visible = show));
      if (show) {
        const cp = ASK_FLOW.blue.pts.map((p) => screenFracToWorld(p[0], p[1], ASK_FLOW.z));
        for (let s = 0; s <= d.SEG; s++) {
          const t = s / d.SEG, o = s * 3;
          d.curvePos[o]     = bez3(cp[0][0], cp[1][0], cp[2][0], cp[3][0], t);
          d.curvePos[o + 1] = bez3(cp[0][1], cp[1][1], cp[2][1], cp[3][1], t);
          d.curvePos[o + 2] = ASK_FLOW.z;
        }
        for (let j = 0; j < 4; j++) {
          d.polyPos[j * 3] = cp[j][0]; d.polyPos[j * 3 + 1] = cp[j][1]; d.polyPos[j * 3 + 2] = ASK_FLOW.z;
          d.spheres[j].position.set(cp[j][0], cp[j][1], cp[j][2]);
        }
        d.curveGeo.attributes.position.needsUpdate = true;
        d.polyGeo.attributes.position.needsUpdate = true;
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
  window.__tilliAskFlow = () => ({ flow: ASK_FLOW, text: askFlowText() });
  window.__tilliViewsHands = () => VIEWS_HANDS;
  window.__tilliViewsHead = () => VIEWS_HEAD;
  window.__tilliDrain = () => drainAmt;
  window.__tilliCarry = () => ({ ...ASK_CARRY });
  // Dev tuning panels — all disabled for production. Re-enable a call to tune live.
  // buildTuneGUI(() => three);   // kids walk-in bake (toggle with G)
  // buildAskLiveGUI();           // Ask-live carry/plug + prompt-colour controls (toggle with W)
  // buildImpactGUI();            // "30+ schools" text mover (toggle with I, or drag on page)
}

/* ── Ask-live carry/plug + prompt controls ────────────────────────────
   A small live panel for the "Ask Tilli anything…" screen: sliders for the
   cursor-carry swarm + socket plug (ASK_CARRY, read every frame by the
   step() carry block) plus colour pickers for the suggested-prompt chips.
   Starts visible; press W to hide/show. Chip colours are pushed onto the
   --atl-chip-* CSS vars so the DOM recolours instantly. */
function buildAskLiveGUI() {
  if (document.getElementById('waveGUI')) return;
  const ROWS = [
    ['Cloud size',      ASK_CARRY, 'cloud',      0.5, 6,   0.1],
    ['Trail tightness', ASK_CARRY, 'lag',        1,   14,  0.5],
    ['Swirl speed',     ASK_CARRY, 'spin',       0,   3,   0.05],
    ['Plug distance',   ASK_CARRY, 'plugRadius', 60,  600, 10],
    ['Plug speed',      ASK_CARRY, 'plugSpeed',  0.5, 6,   0.1],
  ];
  const fmt = (v, step) => (step < 1 ? v.toFixed(step < 0.01 ? 3 : 2) : v.toFixed(0));
  const panel = document.createElement('div');
  panel.id = 'waveGUI';
  panel.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:99999;width:230px;' +
    'font:12px/1.4 system-ui,-apple-system,sans-serif;color:#e9e9ee;background:rgba(22,22,28,.93);' +
    'border:1px solid rgba(255,255,255,.12);border-radius:11px;padding:11px 13px;' +
    'box-shadow:0 10px 34px rgba(0,0,0,.4);backdrop-filter:blur(7px);user-select:none;';

  const head = document.createElement('div');
  head.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;font-weight:600;letter-spacing:.02em;';
  const title = document.createElement('span'); title.textContent = 'Ask-live carry';
  const hide = document.createElement('button');
  hide.textContent = '×'; hide.title = 'hide (press W)';
  hide.style.cssText = 'all:unset;cursor:pointer;font-size:17px;line-height:1;padding:0 4px;color:#9a9aa6;';
  hide.onclick = () => { panel.style.display = 'none'; };
  head.append(title, hide);
  panel.appendChild(head);

  ROWS.forEach(([label, obj, key, min, max, step]) => {
    const row = document.createElement('label');
    row.style.cssText = 'display:block;margin:8px 0;';
    const cap = document.createElement('span'); cap.textContent = label;
    const val = document.createElement('span');
    val.textContent = fmt(obj[key], step);
    val.style.cssText = 'float:right;color:#7fe0a8;font-variant-numeric:tabular-nums;';
    const inp = document.createElement('input');
    inp.type = 'range'; inp.min = min; inp.max = max; inp.step = step; inp.value = obj[key];
    inp.style.cssText = 'width:100%;margin-top:4px;accent-color:#26BDE2;cursor:pointer;';
    inp.oninput = () => { obj[key] = parseFloat(inp.value); val.textContent = fmt(obj[key], step); };
    row.append(cap, val, inp);
    panel.appendChild(row);
  });

  /* colour pickers: prompt-chip text / background */
  const colorRow = (label, get, set) => {
    const row = document.createElement('label');
    row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin:9px 0 2px;';
    const cap = document.createElement('span'); cap.textContent = label;
    const inp = document.createElement('input');
    inp.type = 'color'; inp.value = get();
    inp.style.cssText = 'width:44px;height:22px;padding:0;border:none;background:none;cursor:pointer;';
    inp.oninput = () => set(inp.value);
    row.append(cap, inp);
    panel.appendChild(row);
  };
  const rootStyle = document.documentElement.style;
  rootStyle.setProperty('--atl-chip-text', '#6b7280');
  rootStyle.setProperty('--atl-chip-bg', '#eef1f4');
  colorRow('Prompt text',   () => '#6b7280',      (v) => rootStyle.setProperty('--atl-chip-text', v));
  colorRow('Prompt bg',     () => '#eef1f4',      (v) => rootStyle.setProperty('--atl-chip-bg', v));

  const logBtn = document.createElement('button');
  logBtn.textContent = 'Log values';
  logBtn.style.cssText = 'all:unset;display:block;text-align:center;cursor:pointer;margin-top:9px;padding:6px 0;' +
    'border-radius:7px;background:rgba(255,255,255,.09);transition:background .15s;';
  logBtn.onmouseenter = () => (logBtn.style.background = 'rgba(255,255,255,.17)');
  logBtn.onmouseleave = () => (logBtn.style.background = 'rgba(255,255,255,.09)');
  logBtn.onclick = () => console.log('ASK_CARRY', { ...ASK_CARRY });
  panel.appendChild(logBtn);

  document.body.appendChild(panel);
  window.addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea, select, button, a, [contenteditable]')) return;
    if (e.key === 'w' || e.key === 'W') panel.style.display = panel.style.display === 'none' ? '' : 'none';
  });
}

/* ── Impact stats GUI ─────────────────────────────────────────────────
   Live controls for the "30+ schools" section: each heading/stat's position,
   scale, and colour. Values are written straight onto the elements as CSS vars, so the
   DOM updates instantly. Starts visible; toggle with I. "Log values" dumps each
   element's inline style so the tuned look can be baked into the HTML. */
function buildImpactGUI() {
  if (document.getElementById('impactGUI')) return;
  const el = document.getElementById('schCopy');
  if (!el) return;

  /* [label, target, cssVar, min, max, step, unit, initial] — a 1-tuple is a section label */
  const SLIDERS = [
    ['— "30+ schools" text —'],
    ['Text X',     el, '--tx',  -900, 900, 1,    'px', -88],
    ['Text Y',     el, '--ty',  -600, 600, 1,    'px', 0],
    ['Text scale', el, '--tsc', 0.4,  2.2, 0.01, '',   1.65],
  ];
  const COLORS = [];
  const fmt = (v, step) => (step < 1 ? v.toFixed(2) : v.toFixed(0));
  const inputs = {};

  const panel = document.createElement('div');
  panel.id = 'impactGUI';
  panel.style.cssText = 'position:fixed;left:16px;top:16px;z-index:99999;width:238px;max-height:90vh;overflow:auto;' +
    'font:12px/1.4 system-ui,-apple-system,sans-serif;color:#e9e9ee;background:rgba(22,22,28,.93);' +
    'border:1px solid rgba(255,255,255,.12);border-radius:11px;padding:11px 13px;' +
    'box-shadow:0 10px 34px rgba(0,0,0,.4);backdrop-filter:blur(7px);user-select:none;';

  const bar = document.createElement('div');
  bar.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;font-weight:600;letter-spacing:.02em;';
  const title = document.createElement('span'); title.textContent = '"30+ schools" text';
  const hide = document.createElement('button');
  hide.textContent = '×'; hide.title = 'hide (press I)';
  hide.style.cssText = 'all:unset;cursor:pointer;font-size:17px;line-height:1;padding:0 4px;color:#9a9aa6;';
  hide.onclick = () => { panel.style.display = 'none'; };
  bar.append(title, hide);
  panel.appendChild(bar);

  const section = (txt) => {
    const s = document.createElement('div');
    s.textContent = txt;
    s.style.cssText = 'margin:11px 0 2px;color:#8f8fa0;font-size:11px;letter-spacing:.03em;';
    panel.appendChild(s);
  };

  SLIDERS.forEach((r) => {
    if (r.length === 1) { section(r[0]); return; }
    const [label, target, cssVar, min, max, step, unit, init] = r;
    target.style.setProperty(cssVar, init + unit);
    const row = document.createElement('label');
    row.style.cssText = 'display:block;margin:7px 0;';
    const cap = document.createElement('span'); cap.textContent = label;
    const val = document.createElement('span');
    val.textContent = fmt(init, step);
    val.style.cssText = 'float:right;color:#7fe0a8;font-variant-numeric:tabular-nums;';
    const inp = document.createElement('input');
    inp.type = 'range'; inp.min = min; inp.max = max; inp.step = step; inp.value = init;
    inp.style.cssText = 'width:100%;margin-top:4px;accent-color:#26BDE2;cursor:pointer;';
    inp.oninput = () => { const v = parseFloat(inp.value); target.style.setProperty(cssVar, v + unit); val.textContent = fmt(v, step); };
    row.append(cap, val, inp);
    panel.appendChild(row);
    inputs[cssVar] = { inp, val, step };
  });

  /* drag the text block directly on the page — updates the same vars + sliders */
  el.style.cursor = 'grab';
  let drag = null;
  const setVar = (cssVar, v) => {
    el.style.setProperty(cssVar, v + 'px');
    const r = inputs[cssVar]; if (r) { r.inp.value = v; r.val.textContent = fmt(v, r.step); }
  };
  el.addEventListener('pointerdown', (e) => {
    drag = { x: e.clientX, y: e.clientY,
             tx: parseFloat(el.style.getPropertyValue('--tx')) || 0,
             ty: parseFloat(el.style.getPropertyValue('--ty')) || 0 };
    el.setPointerCapture(e.pointerId); el.style.cursor = 'grabbing'; e.preventDefault();
  });
  el.addEventListener('pointermove', (e) => {
    if (!drag) return;
    setVar('--tx', Math.round(drag.tx + (e.clientX - drag.x)));
    setVar('--ty', Math.round(drag.ty + (e.clientY - drag.y)));
  });
  const endDrag = () => { if (drag) { drag = null; el.style.cursor = 'grab'; } };
  el.addEventListener('pointerup', endDrag);
  el.addEventListener('pointercancel', endDrag);

  if (COLORS.length) section('— Colours —');
  COLORS.forEach(([label, target, cssVar, init]) => {
    target.style.setProperty(cssVar, init);
    const row = document.createElement('label');
    row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin:8px 0 2px;';
    const cap = document.createElement('span'); cap.textContent = label;
    const inp = document.createElement('input');
    inp.type = 'color'; inp.value = init;
    inp.style.cssText = 'width:44px;height:22px;padding:0;border:none;background:none;cursor:pointer;';
    inp.oninput = () => target.style.setProperty(cssVar, inp.value);
    row.append(cap, inp);
    panel.appendChild(row);
  });

  const logBtn = document.createElement('button');
  logBtn.textContent = 'Log values';
  logBtn.style.cssText = 'all:unset;display:block;text-align:center;cursor:pointer;margin-top:11px;padding:6px 0;' +
    'border-radius:7px;background:rgba(255,255,255,.09);transition:background .15s;';
  logBtn.onmouseenter = () => (logBtn.style.background = 'rgba(255,255,255,.17)');
  logBtn.onmouseleave = () => (logBtn.style.background = 'rgba(255,255,255,.09)');
  logBtn.onclick = () => console.log('schCopy →', el.getAttribute('style'));
  panel.appendChild(logBtn);

  document.body.appendChild(panel);
  window.addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea, select, button, a, [contenteditable]')) return;
    if (e.key === 'i' || e.key === 'I') panel.style.display = panel.style.display === 'none' ? '' : 'none';
  });
}

/* ── Dev tuning panel ─────────────────────────────────────────────────
   A tiny dependency-free slider GUI wired straight to the live WALK /
   SKILLS_EXIT config objects — drag a slider and the next frame reads it.
   Starts visible; press G to hide/show. `Replay` rewinds the walk so you can
   watch it again without scrolling; `Log` prints the current values so you can
   bake them into the consts. Remove the buildTuneGUI() call above to ship. */
function buildTuneGUI(getThree) {
  if (document.getElementById('tuneGUI')) return;
  const ROWS = [
    ['Walk speed',     WALK,        'speed',   0.1, 2,  0.05],
    ['Bob intensity',  WALK,        'bob',     0,   3,  0.05],
    ['Bob steps/freq', WALK,        'bobFreq', 1,   20, 0.5],
    ['Walk distance',  WALK,        'slideL',  10,  80, 1],
    ['DNA exit start', SKILLS_EXIT, 'start',   0.3, 0.9, 0.01],
    ['DNA exit dist',  SKILLS_EXIT, 'slideR',  10,  50, 1],
    ['Kids exit dist', ONTRACK_EXIT,'dist',    10,  70, 1],
    ['On-track zoom',  ONTRACK_EXIT,'textZoom',0.2, 1,  0.05],
    ['Chat stagger',   ASK,         'stagger',   0, 800, 20],
    ['Prompt delay',   ASK,         'promptAt',  0, 1500, 50],
    ['Flow gap',       ASK,         'flowGap',   0, 2000, 50],
    ['Grey flow speed',ASK_FLOW.red, 'speed',  0.2, 2.5, 0.05],
    ['Colour flow spd',ASK_FLOW.blue,'speed',  0.2, 2.5, 0.05],
  ];
  const fmt = (v, step) => (step < 1 ? v.toFixed(2) : v.toFixed(0));
  const panel = document.createElement('div');
  panel.id = 'tuneGUI';
  panel.style.cssText = 'position:fixed;left:16px;bottom:16px;z-index:99999;width:232px;' +
    'font:12px/1.4 system-ui,-apple-system,sans-serif;color:#e9e9ee;background:rgba(22,22,28,.93);' +
    'border:1px solid rgba(255,255,255,.12);border-radius:11px;padding:11px 13px;' +
    'box-shadow:0 10px 34px rgba(0,0,0,.4);backdrop-filter:blur(7px);user-select:none;';

  const head = document.createElement('div');
  head.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;font-weight:600;letter-spacing:.02em;';
  const title = document.createElement('span'); title.textContent = 'Kids walk-in';
  const hide = document.createElement('button');
  hide.textContent = '×'; hide.title = 'hide (press G)';
  hide.style.cssText = 'all:unset;cursor:pointer;font-size:17px;line-height:1;padding:0 4px;color:#9a9aa6;';
  hide.onclick = () => { panel.style.display = 'none'; };
  head.append(title, hide);
  panel.appendChild(head);

  ROWS.forEach(([label, obj, key, min, max, step]) => {
    const row = document.createElement('label');
    row.style.cssText = 'display:block;margin:8px 0;';
    const cap = document.createElement('span'); cap.textContent = label;
    const val = document.createElement('span');
    val.textContent = fmt(obj[key], step);
    val.style.cssText = 'float:right;color:#7fe0a8;font-variant-numeric:tabular-nums;';
    const inp = document.createElement('input');
    inp.type = 'range'; inp.min = min; inp.max = max; inp.step = step; inp.value = obj[key];
    inp.style.cssText = 'width:100%;margin-top:4px;accent-color:#56C02B;cursor:pointer;';
    inp.oninput = () => { obj[key] = parseFloat(inp.value); val.textContent = fmt(obj[key], step); };
    row.append(cap, val, inp);
    panel.appendChild(row);
  });

  /* grey-dot colour picker */
  const crow = document.createElement('label');
  crow.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin:10px 0 4px;';
  const ccap = document.createElement('span'); ccap.textContent = 'Grey dot colour';
  const cin = document.createElement('input');
  cin.type = 'color'; cin.value = ASK_FLOW.gray;
  cin.style.cssText = 'width:44px;height:22px;padding:0;border:none;background:none;cursor:pointer;';
  cin.oninput = () => { ASK_FLOW.gray = cin.value; };
  crow.append(ccap, cin);
  panel.appendChild(crow);

  const editor = buildAskPathEditor();
  let editing = false;

  const bar = document.createElement('div');
  bar.style.cssText = 'display:flex;gap:6px;margin-top:9px;';
  const mkBtn = (txt, fn) => {
    const b = document.createElement('button');
    b.textContent = txt;
    b.style.cssText = 'flex:1;all:unset;text-align:center;cursor:pointer;padding:6px 0;border-radius:7px;' +
      'background:rgba(255,255,255,.09);transition:background .15s;';
    b.onmouseenter = () => (b.style.background = 'rgba(255,255,255,.17)');
    b.onmouseleave = () => (b.style.background = 'rgba(255,255,255,.09)');
    b.onclick = fn;
    return b;
  };
  const editBtn = mkBtn('✎ Edit ask paths', () => {
    editing = !editing;
    editor.toggle(editing);
    editBtn.style.background = editing ? 'rgba(120,190,255,.32)' : 'rgba(255,255,255,.09)';
  });
  editBtn.onmouseleave = () => (editBtn.style.background = editing ? 'rgba(120,190,255,.32)' : 'rgba(255,255,255,.09)');
  bar.append(
    mkBtn('▶ Replay', () => { const t = getThree && getThree(); if (t) t.kidWalk = 0; }),
    mkBtn('Log', () => console.log('WALK', { ...WALK }, 'SKILLS_EXIT', { ...SKILLS_EXIT }, 'ONTRACK_EXIT', { ...ONTRACK_EXIT }, 'ASK', { ...ASK }, '\nASK_FLOW\n' + askFlowText())),
  );
  panel.appendChild(bar);
  const bar2 = document.createElement('div');
  bar2.style.cssText = 'display:flex;gap:6px;margin-top:6px;';
  bar2.append(editBtn);
  panel.appendChild(bar2);
  document.body.appendChild(panel);

  window.addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea, select, button, a, [contenteditable]')) return;
    if (e.key === 'g' || e.key === 'G') panel.style.display = panel.style.display === 'none' ? '' : 'none';
  });
}
