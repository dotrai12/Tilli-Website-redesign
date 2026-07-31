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

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ═══════════════════════════════════════════════════════════════════
   THE STAGE SYSTEM — a true single page

   No section ever travels. Each `.scene` is an empty scroll spacer that
   owns a slice of the scrollbar; its `.stage` is position:fixed at the
   viewport and only ever changes opacity. Sections dissolve into each
   other through the dot field instead of sliding up from the bottom.

   Tunables:
     FADE_LEN   how long (in scene-units) a stage takes to fade in/out
     FADE_OVER  how far the incoming stage's fade starts before the
                outgoing one has finished — the size of the dissolve
     STEP_FADE  same, for `.step` sub-panels inside one stage
     MORPH_AT   the point in a scene (0..1) where the dots stop holding
                their formation and start morphing towards the next
     FIT_PAD    px of breathing room kept around a step when it has to
                be scaled down to fit a short viewport
   ═══════════════════════════════════════════════════════════════════ */
const FADE_LEN = 0.12;
const FADE_OVER = 0.04;
const STEP_FADE = 0.22;
const MORPH_AT = 0.68;
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

/* Hero beat B: 13 anchor dots pinned to a clean rim with the rest of the
   field loosened into a wide, airy halo behind them. Sized off the camera
   frustum (and re-run on resize, like the scatter) so the rim always lands
   out near the edge of the frame — clear of the copy, and clear of the
   `.hero-glow` scrim that would otherwise wash the connections out. */
const HERO_NODES = 13;
const heroNodeIdx = new Int32Array(HERO_NODES);
for (let k = 0; k < HERO_NODES; k++) heroNodeIdx[k] = Math.round((k * N) / HERO_NODES) % N;
function layoutHeroRing(ring) {
  const v = visHalf(-3);
  const rx = Math.min(v.w * 0.86, 21), ry = v.h * 0.8;
  const r = rng(12);
  const isNode = new Uint8Array(N);
  for (let k = 0; k < HERO_NODES; k++) isNode[heroNodeIdx[k]] = 1;
  for (let i = 0; i < N; i++) {
    const jit = r(), spread = r(), depth = r();
    const rim = isNode[i] === 1;
    /* anchors sit exactly on the rim so the network reads as one shape;
       everyone else drifts in angle and across a broad, sparse annulus */
    const ang = (i / N) * Math.PI * 2 + (rim ? 0 : (jit - 0.5) * 0.55);
    const rad = rim ? 1 : 0.72 + spread * 0.5;
    ring[i * 3] = Math.cos(ang) * rx * rad;
    ring[i * 3 + 1] = Math.sin(ang) * ry * rad;
    ring[i * 3 + 2] = rim ? -3 : -2 - depth * 5;
  }
}

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

  /* 0 · HERO — dots scattered everywhere around the question */
  const hero = make();
  {
    spreadHero(hero.pos);
    for (let i = 0; i < N; i++) setC(hero, i, MIX[i % 5]);
    F.push(hero);
  }
  /* hero beat B target — see layoutHeroRing() */
  const heroRing = new Float32Array(N * 3);
  layoutHeroRing(heroRing);
  /* who is wired to whom: every anchor to its neighbour all the way round,
     plus a second hop off every other anchor so the busier nodes carry
     three or four threads. Both hops are short chords of the ellipse, so
     no thread ever comes closer than 0.88 of the rim to the copy. */
  const heroLinks = [];
  for (let k = 0; k < HERO_NODES; k++) {
    heroLinks.push([k, (k + 1) % HERO_NODES]);
    if (k % 2 === 0) heroLinks.push([k, (k + 2) % HERO_NODES]);
  }

  /* 1 · DASHBOARD — a stream: in from top-right, through the card,
       out at bottom-left (flow animated in the frame loop) */
  const streamPath = [[19, 12, -6], [8, 5, -5], [0, 0, -6.5], [-5, -6, -5], [-19, -12, -6]];
  const streamT = new Float32Array(N);
  const streamJit = new Float32Array(N * 3);
  const streamPoint = (t, j3, out) => {
    const seg = Math.min(Math.floor(t * 4), 3), tt = t * 4 - seg;
    const a = streamPath[seg], b = streamPath[seg + 1];
    out[0] = lerp(a[0], b[0], tt) + streamJit[j3];
    out[1] = lerp(a[1], b[1], tt) + streamJit[j3 + 1];
    out[2] = lerp(a[2], b[2], tt) + streamJit[j3 + 2];
  };
  {
    const dash = make();
    const r = rng(22);
    const p = [0, 0, 0];
    for (let i = 0; i < N; i++) {
      streamT[i] = r();
      streamJit[i * 3] = (r() - 0.5) * 3.4;
      streamJit[i * 3 + 1] = (r() - 0.5) * 2.6;
      streamJit[i * 3 + 2] = (r() - 0.5) * 2;
      streamPoint(streamT[i], i * 3, p);
      setP(dash, i, p[0], p[1], p[2]);
      setC(dash, i, MIX[i % 5]);
    }
    F.push(dash);
  }

  /* 2 · REPORTS — funnel pouring into the cards + a heart at right */
  {
    const fan = make();
    const r = rng(33);
    for (let i = 0; i < N; i++) {
      if (i % 4 === 3) { // the heart — "loved by parents"
        const t = (i / N) * Math.PI * 2 * 4.1;
        const s = 0.17 * (0.82 + r() * 0.3);
        setP(fan, i,
          10.5 + 16 * Math.pow(Math.sin(t), 3) * s,
          -2.5 + (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * s,
          -3 - r() * 2);
        setC(fan, i, i % 8 === 3 ? C.pink : C.pink2, 0.05);
      } else { // the funnel from above
        const t = r();
        const spread = lerp(9, 2.2, t);
        setP(fan, i, (r() - 0.5) * spread * 2 - 1, lerp(12.5, 2.5, t) + (r() - 0.5) * 1.4, -4 - r() * 3);
        setC(fan, i, MIX[i % 5]);
      }
    }
    F.push(fan);
  }

  /* 3 · COLLECT — the data spirals into one rotating circle */
  {
    const sp = make();
    const r = rng(44);
    for (let i = 0; i < N; i++) {
      const t = i / N;
      const ang = t * Math.PI * 7 + r() * 0.35;
      const rad = 1.2 + t * 9.6 + (r() - 0.5) * 0.9;
      setP(sp, i, Math.cos(ang) * rad * 1.15, Math.sin(ang) * rad * 0.92, -3 - r() * 3);
      setC(sp, i, MIX[i % 5]);
    }
    F.push(sp);
  }

  /* 4 · 3 VIEWS — the circle divides into three coloured balls */
  {
    const v = make();
    const r = rng(55);
    const centers = [[-9, 0.8], [0, 0.8], [9, 0.8]];
    const colors = [C.green, C.yellow, C.cyan];
    for (let i = 0; i < N; i++) {
      const k = i % 3;
      const ang = r() * Math.PI * 2;
      const rad = Math.sqrt(r()) * 3.4;
      setP(v, i, centers[k][0] + Math.cos(ang) * rad, centers[k][1] + Math.sin(ang) * rad * 0.95, -3 - r() * 2.5);
      setC(v, i, colors[k], 0.06);
    }
    F.push(v);
  }

  /* 5 · MEASURE — a DNA of dots: green strand, cyan strand, orange
       rungs. dnaThresh[i] = when (in section progress) dot appears */
  const dnaThresh = new Float32Array(N);
  const helixDots = (f, cx, scale, seed) => {
    const r = rng(seed);
    const R = 3.4 * scale, H = 21 * scale, TW = 0.62 / scale;
    for (let i = 0; i < N; i++) {
      const role = i % 3, t = ((i - role) / 3) / (N / 3); // 0..1 along strand
      const j = () => (r() - 0.5) * 0.5 * scale;
      if (role < 2) { // strands
        const y = (0.5 - t) * H;
        const ang = y * TW + (role ? Math.PI : 0);
        setP(f, i, cx + Math.sin(ang) * R + j(), y + j(), Math.cos(ang) * R - 3 + j());
        setC(f, i, role ? C.cyan : C.green, 0.05);
        dnaThresh[i] = role === 0 ? t * 0.3 : 0.3 + t * 0.3;
      } else { // rungs: 14 dotted bars
        const rungCount = 14;
        const k = Math.floor(t * rungCount), rt = (t * rungCount) % 1;
        const y = (0.5 - (k + 0.5) / rungCount) * (H * 0.94);
        const ang = y * TW;
        const ax = cx + Math.sin(ang) * R, az = Math.cos(ang) * R - 3;
        const bx = cx + Math.sin(ang + Math.PI) * R, bz = Math.cos(ang + Math.PI) * R - 3;
        setP(f, i, lerp(ax, bx, rt) + j() * 0.5, y + j() * 0.5, lerp(az, bz, rt) + j() * 0.5);
        setC(f, i, C.orange, 0.05);
        dnaThresh[i] = 0.62 + (k / rungCount) * 0.3;
      }
    }
  };
  { const dna = make(); helixDots(dna, 0, 1, 66); F.push(dna); }

  /* 6 · 12 SKILLS — the same DNA, zoomed out to the right */
  { const dna2 = make(); helixDots(dna2, 7.2, 0.72, 66); F.push(dna2); }

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

  return { F, heroRing, heroLinks, dnaThresh, streamT, streamJit, streamPoint };
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
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 1.2, map: tex, vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false }));
  pts.frustumCulled = false;
  scene3.add(pts);

  /* hero connections. WebGL ignores LineBasicMaterial.linewidth on every
     desktop driver, so a real stroke has to be geometry: each link is a
     thin quad in the ring's plane, rebuilt each frame so the thread can be
     animated growing out from one anchor towards the next. */
  const LINK_HALF_W = 0.105;
  const linkPos = new Float32Array(built.heroLinks.length * 6 * 3);
  const linkGeo = new THREE.BufferGeometry();
  linkGeo.setAttribute('position', new THREE.BufferAttribute(linkPos, 3));
  linkGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 60);
  const links = new THREE.Mesh(linkGeo, new THREE.MeshBasicMaterial({
    color: 0x2E3542, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false,
  }));
  links.frustumCulled = false;
  links.renderOrder = 1;
  scene3.add(links);

  /* the anchors themselves, drawn over the field at twice its dot size */
  const nodePos = new Float32Array(HERO_NODES * 3);
  const nodeCol = new Float32Array(HERO_NODES * 3);
  const syncNodes = () => {
    for (let k = 0; k < HERO_NODES; k++) {
      const idx = heroNodeIdx[k];
      nodePos.set(built.heroRing.subarray(idx * 3, idx * 3 + 3), k * 3);
    }
  };
  {
    const c = new THREE.Color();
    const MIX = [C.green, C.cyan, C.yellow, C.orange, C.pink2];
    for (let k = 0; k < HERO_NODES; k++) {
      c.set(MIX[k % 5]);
      nodeCol[k * 3] = c.r; nodeCol[k * 3 + 1] = c.g; nodeCol[k * 3 + 2] = c.b;
    }
    syncNodes();
  }
  const nodeGeo = new THREE.BufferGeometry();
  nodeGeo.setAttribute('position', new THREE.BufferAttribute(nodePos, 3));
  nodeGeo.setAttribute('color', new THREE.BufferAttribute(nodeCol, 3));
  const nodes = new THREE.Points(nodeGeo, new THREE.PointsMaterial({
    size: 3, map: tex, vertexColors: true, transparent: true, opacity: 0, depthWrite: false,
  }));
  nodes.frustumCulled = false;
  nodes.renderOrder = 2;
  scene3.add(nodes);

  /* lay the link quads out for a given draw progress (0 = nothing yet,
     1 = every thread closed). Links light up in rim order with a short
     overlap, so you watch the web stitch itself together. */
  const OVERLAP = 2.4;
  function drawLinks(beat) {
    const L = built.heroLinks, R = built.heroRing, NI = heroNodeIdx;
    for (let k = 0; k < L.length; k++) {
      const t = ease(clamp((beat * (L.length + OVERLAP) - k) / OVERLAP));
      const o = k * 18;
      if (t <= 0) { linkPos.fill(0, o, o + 18); continue; }
      const a = NI[L[k][0]] * 3, b = NI[L[k][1]] * 3;
      const ax = R[a], ay = R[a + 1], az = R[a + 2];
      const tx = lerp(ax, R[b], t), ty = lerp(ay, R[b + 1], t), tz = lerp(az, R[b + 2], t);
      let nx = -(ty - ay), ny = tx - ax;
      const len = Math.hypot(nx, ny) || 1;
      nx = (nx / len) * LINK_HALF_W; ny = (ny / len) * LINK_HALF_W;
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
    spreadHero(built.F[0].pos);
    layoutHeroRing(built.heroRing);
    syncNodes();
    nodeGeo.attributes.position.needsUpdate = true;
  });

  return {
    renderer, scene3, camera, geo, P, CL, phases, ...built,
    links, nodes, drawLinks,
    mouse, camZ: CAM_DIST, heroP: 0, dnaP: 0,
  };
}

/* ═══════════════════════════════════════════════════════════════════
   DOM CHOREOGRAPHY
   ═══════════════════════════════════════════════════════════════════ */
const washEl = document.getElementById('wash');
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

/* the frame loop reads these back */
const S = { f: 0, i: 0, p: 0, wt: 0 };

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
  scenes.forEach((sc, k) => {
    const a = k === 0 ? -FADE_LEN * 1.5 : k - FADE_OVER;
    let op = smooth(clamp((f - a) / FADE_LEN));
    if (k < LAST) op *= 1 - smooth(clamp((f - (k + 1 - FADE_LEN)) / FADE_LEN));

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
    const q = ease(clamp(p / 0.5));
    T.zoom.style.transform = `scale(${0.88 + 0.12 * q})`;
    T.zoom.style.opacity = String(0.3 + 0.7 * q);
    return;
  }
  if (sc.pin === 'fan' && T.fans[0]) {
    const q = ease(clamp(p / 0.6));
    T.fans[0].style.transform = `rotate(${-7 * q}deg) translateX(${290 - 266 * q}px)`;
    T.fans[2].style.transform = `rotate(${7 * q}deg) translateX(${-(290 - 266 * q)}px)`;
    T.fans[1].style.transform = `scale(${0.96 + 0.04 * q})`;
    return;
  }
  if (sc.pin === 'views' && T.vH) {
    const q = ease(clamp((p - 0.06) / 0.18));
    T.vH.style.opacity = String(q);
    T.vH.style.transform = `scale(${0.97 + 0.03 * q})`;
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
    const stage = p < 0.34 ? 0 : p < 0.64 ? 1 : 2;
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
   re-measure once webfonts and images have settled */
measure();
window.addEventListener('resize', measure);
window.addEventListener('load', measure);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);

if (reduced) {
  document.getElementById('world').style.display = 'none';
  beatA.querySelectorAll('[data-hb]').forEach((el) => el.classList.add('in'));
  document.querySelectorAll('.skill-card, .view-label, .rv').forEach((el) => el.classList.add('in'));
  statEl.textContent = '2,895';
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
} else {
  three = initThree();
  let f = 0;
  let lastT = performance.now();

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

    const targetZ = CAM_DIST - f * DEPTH;
    th.camZ = lerp(th.camZ, targetZ, 1 - Math.exp(-dt * 5));
    const mx = th.mouse;
    mx.x = lerp(mx.x, mx.tx, 1 - Math.exp(-dt * 3));
    mx.y = lerp(mx.y, mx.ty, 1 - Math.exp(-dt * 3));
    th.camera.position.set(mx.x * 1.1, -mx.y * 0.7 + Math.sin(time * 0.3) * 0.15, th.camZ);
    th.camera.lookAt(mx.x * 0.4, -mx.y * 0.25, th.camZ - 30);
    const planeZ = th.camZ - CAM_DIST;

    /* base morph — the field holds a formation through the body of a
       scene (S.wt === 0) and morphs to the next one over its tail, so
       the dots arrive together with the incoming text */
    const si = S.i;
    let i = si, tt = S.wt;
    if (i > th.F.length - 2) { i = th.F.length - 2; tt = 1; }
    /* 1 while scene `idx` owns the screen, easing to 0 across each handover */
    const hold = (idx) => (si === idx ? 1 - S.wt : si === idx - 1 ? S.wt : 0);
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

    /* HERO: beat B pulls the scattered dots into the connected ring */
    const heroBeat = ease(clamp((th.heroP - 0.28) / 0.24));
    if (i === 0 && heroBeat > 0) {
      const wgt = heroBeat * (1 - tt);
      for (let k = 0; k < N * 3; k += 3) {
        P[k] += (th.heroRing[k] - A.pos[k]) * wgt;
        P[k + 1] += (th.heroRing[k + 1] - A.pos[k + 1]) * wgt;
        P[k + 2] += (th.heroRing[k + 2] - A.pos[k + 2]) * wgt;
      }
    }
    /* the anchors land as the ring settles, then the threads are drawn one
       after another so you watch the interconnections being made; the whole
       web leaves with the scene */
    const heroOut = clamp(1 - (f - 0.78) / 0.13);
    const nodeFade = ease(clamp((th.heroP - 0.44) / 0.10)) * heroOut;
    th.nodes.position.z = planeZ;
    th.nodes.material.opacity = nodeFade;
    th.links.position.z = planeZ;
    th.links.material.opacity = heroOut;
    if (heroOut > 0) th.drawLinks(clamp((th.heroP - 0.50) / 0.24));

    /* DASHBOARD: the stream actually flows */
    {
      const wgt = hold(ST['Dashboard']);
      if (wgt > 0.01) {
        for (let n = 0; n < N; n++) {
          const k = n * 3;
          const t2 = (th.streamT[n] + time * 0.04) % 1;
          th.streamPoint(t2, k, sp);
          P[k] = lerp(P[k], sp[0], wgt);
          P[k + 1] = lerp(P[k + 1], sp[1], wgt);
          P[k + 2] = lerp(P[k + 2], sp[2], wgt);
        }
      }
    }

    /* COLLECT: the spiral keeps rotating till scroll */
    {
      const wgt = hold(ST['Collect']);
      if (wgt > 0.01) {
        const ang = time * 0.45 * wgt;
        for (let k = 0; k < N * 3; k += 3) rotXY(P, k, 0, 0, ang);
      }
    }

    /* DNA: strands appear in stage order, then the helix rotates */
    {
      const dnaI = ST['Measure'], skI = ST['12 skills'];
      const wgt = clamp((f - (dnaI - 0.35)) / 0.35) * (1 - clamp((f - (skI + 0.9)) / 0.35));
      if (wgt > 0.01) {
        const cx = lerp(0, 7.2, smooth(clamp((f - (dnaI + 0.6)) / 0.8)));
        const ang = time * 0.4;
        const reveal = f > dnaI + 0.9 ? 1 : th.dnaP; // fully woven once past Measure
        for (let n = 0; n < N; n++) {
          const k = n * 3;
          rotate2D(P, k, cx * (si >= dnaI ? 1 : 0), -3, ang * wgt);
          const vis = smooth(clamp((reveal - th.dnaThresh[n]) / 0.05));
          const fade = 1 - (1 - vis) * wgt;
          CL[k] = lerp(white.r, CL[k], fade);
          CL[k + 1] = lerp(white.g, CL[k + 1], fade);
          CL[k + 2] = lerp(white.b, CL[k + 2], fade);
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

    /* idle breathing + anchor to the camera's plane */
    for (let k = 0; k < N * 3; k += 3) {
      P[k] += Math.sin(time * 0.5 + PH[k]) * 0.12;
      P[k + 1] += Math.sin(time * 0.45 + PH[k + 1]) * 0.12;
      P[k + 2] += Math.sin(time * 0.55 + PH[k + 2]) * 0.12 + planeZ;
    }
    th.geo.attributes.position.needsUpdate = true;
    th.geo.attributes.color.needsUpdate = true;

    th.renderer.render(th.scene3, th.camera);
  }

  function frame(now) {
    step(now);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  window.__tilliStep = step;
  window.__tilliThree = () => three;
}
