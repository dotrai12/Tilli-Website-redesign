/* ═══════════════════════════════════════════════════════════════════
   Tilli — one seamless experience.
   A single persistent Three.js world flies the camera through ten
   "stations". The same particle field travels with the visitor and
   morphs: constellation halo → data grid → report arc → two minds →
   DNA helix → skill helix → target rings → celebration → journey
   path → heart. Nothing ever unmounts; sections never "end".
   ═══════════════════════════════════════════════════════════════════ */
import * as THREE from '../lib/three.module.min.js';

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => 1 - Math.pow(1 - t, 3);
const smooth = (t) => t * t * (3 - 2 * t);

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── Scene registry (DOM) ─────────────────────────────────────────── */
const sceneEls = Array.from(document.querySelectorAll('[data-scene]'));
const scenes = sceneEls.map((el) => ({
  el,
  wash: (el.dataset.wash || '255,255,255').split(',').map(Number),
  label: el.dataset.label || '',
  pin: el.dataset.pin || null,
  track: el.querySelector('[data-pin-track]'),
  t: null,
}));

/* f = fractional station index (0 … scenes.length-1), from scroll */
function stationF() {
  const y = window.scrollY + window.innerHeight / 2;
  const mids = scenes.map((s) => s.el.offsetTop + s.el.offsetHeight / 2);
  if (y <= mids[0]) return 0;
  if (y >= mids[mids.length - 1]) return mids.length - 1;
  let i = 0;
  while (i < mids.length - 1 && y > mids[i + 1]) i++;
  return i + clamp((y - mids[i]) / Math.max(1, mids[i + 1] - mids[i]));
}

/* progress 0→1 of a pinned element through the viewport */
function localP(el, vh) {
  const r = el.getBoundingClientRect();
  return clamp(-r.top / Math.max(1, r.height - vh));
}

/* ═══════════════════════════════════════════════════════════════════
   THREE.JS WORLD
   ═══════════════════════════════════════════════════════════════════ */
const PALETTE = ['#56C02B', '#26BDE2', '#E91E8C', '#FCC30B', '#F99B1C'];
const DEPTH = 40;          // world units between stations
const CAM_DIST = 26;       // camera distance to the active formation plane
const N = 1500;            // morph-field particles

let three = null;          // holds all 3D state; null when unavailable

function dotTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.55, 'rgba(255,255,255,1)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* deterministic pseudo-random, so formations are stable frame to frame */
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/* ── Formation builders: each returns Float32Array(N*3), local coords.
     Visible extent at CAM_DIST ≈ 24 units tall / 24·aspect wide. ──── */
function buildFormations() {
  const F = [];
  const mk = () => new Float32Array(N * 3);

  // 0 · HERO — wide halo ring around the headline (centre kept clear)
  {
    const a = mk(); const r = rng(11);
    for (let i = 0; i < N; i++) {
      const ang = r() * Math.PI * 2;
      const rad = 10.5 + r() * 5.5;
      a[i * 3] = Math.cos(ang) * rad * 1.35;
      a[i * 3 + 1] = Math.sin(ang) * rad * 0.62;
      a[i * 3 + 2] = -2 - r() * 6;
    }
    F.push(a);
  }
  // 1 · DASHBOARD — orderly data grid streaming behind the video card
  {
    const a = mk(); const r = rng(22);
    const cols = 50, rows = Math.ceil(N / cols);
    for (let i = 0; i < N; i++) {
      const cx = i % cols, cy = Math.floor(i / cols);
      a[i * 3] = (cx / (cols - 1) - 0.5) * 30;
      a[i * 3 + 1] = (cy / (rows - 1) - 0.5) * 17;
      a[i * 3 + 2] = -4 - r() * 3 + Math.sin(cx * 0.5) * 0.8;
    }
    F.push(a);
  }
  // 2 · REPORTS — a soft arc fanning over the report pages
  {
    const a = mk(); const r = rng(33);
    for (let i = 0; i < N; i++) {
      const t = i / N;
      const ang = Math.PI * (0.08 + t * 0.84); // arc left→right over the top
      const rad = 11 + r() * 4;
      a[i * 3] = Math.cos(ang) * rad * 1.5;
      a[i * 3 + 1] = Math.sin(ang) * rad * 0.85 - 3.5;
      a[i * 3 + 2] = -3 - r() * 5;
    }
    F.push(a);
  }
  // 3 · ASK-TILLI — chaos on the left, ordered orbits on the right
  {
    const a = mk(); const r = rng(44);
    for (let i = 0; i < N; i++) {
      if (i % 2 === 0) { // loose noise cloud (generic AI)
        a[i * 3] = -9 + (r() - 0.5) * 9;
        a[i * 3 + 1] = (r() - 0.5) * 12;
        a[i * 3 + 2] = -3 - r() * 6;
      } else {           // concentric rings (Tilli knows the child)
        const ring = i % 6 < 2 ? 2.2 : i % 6 < 4 ? 3.8 : 5.4;
        const ang = r() * Math.PI * 2;
        a[i * 3] = 9 + Math.cos(ang) * ring;
        a[i * 3 + 1] = Math.sin(ang) * ring * 0.9;
        a[i * 3 + 2] = -3 - r() * 2;
      }
    }
    F.push(a);
  }
  // 4 · MEASURE — the DNA double helix (particles hug the two strands)
  // 5 · SKILLS  — same helix, quarter-turn on (a seamless continuation)
  for (const phase of [0, Math.PI * 0.5]) {
    const a = mk(); const r = rng(55 + phase * 10);
    for (let i = 0; i < N; i++) {
      const t = i / N;
      const y = (t - 0.5) * 21;
      const strand = i % 2;
      const ang = y * 0.62 + phase + (strand ? Math.PI : 0);
      const jitter = () => (r() - 0.5) * 0.55;
      a[i * 3] = Math.sin(ang) * 3.3 + jitter();
      a[i * 3 + 1] = y + jitter();
      a[i * 3 + 2] = Math.cos(ang) * 3.3 - 3 + jitter();
    }
    F.push(a);
  }
  // 6 · ON TRACK — calm concentric target rings behind the promise
  {
    const a = mk(); const r = rng(66);
    for (let i = 0; i < N; i++) {
      const ring = [6, 8.6, 11.4][i % 3];
      const ang = r() * Math.PI * 2;
      a[i * 3] = Math.cos(ang) * ring * 1.45;
      a[i * 3 + 1] = Math.sin(ang) * ring * 0.72;
      a[i * 3 + 2] = -4 - r() * 3;
    }
    F.push(a);
  }
  // 7 · IMPACT — celebration: a loose confetti sphere
  {
    const a = mk(); const r = rng(77);
    for (let i = 0; i < N; i++) {
      const u = r() * 2 - 1, ang = r() * Math.PI * 2;
      const rad = 8.5 + r() * 6;
      const s = Math.sqrt(1 - u * u);
      a[i * 3] = Math.cos(ang) * s * rad * 1.4;
      a[i * 3 + 1] = u * rad * 0.8;
      a[i * 3 + 2] = Math.sin(ang) * s * rad - 6;
    }
    F.push(a);
  }
  // 8 · JOURNEY — a winding dotted path, echoing the SVG trail
  {
    const a = mk(); const r = rng(88);
    for (let i = 0; i < N; i++) {
      const t = i / N;
      const y = (0.5 - t) * 22;
      a[i * 3] = Math.sin(y * 0.42) * 6.5 - 6 + (r() - 0.5) * 1.6;
      a[i * 3 + 1] = y + (r() - 0.5) * 1.2;
      a[i * 3 + 2] = -4 - r() * 3;
    }
    F.push(a);
  }
  // 9 · LET'S TALK — every data point becomes one heart
  {
    const a = mk(); const r = rng(99);
    for (let i = 0; i < N; i++) {
      const t = (i / N) * Math.PI * 2;
      const s = 0.52 * (0.75 + r() * 0.3);
      a[i * 3] = 16 * Math.pow(Math.sin(t), 3) * s;
      a[i * 3 + 1] = (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * s + 1;
      a[i * 3 + 2] = -3 - r() * 3;
    }
    F.push(a);
  }
  return F;
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

  /* ── ambient dust: fixed in the world along the whole flight path.
       This is what makes the camera's travel *felt*. ──────────────── */
  {
    const M = 800;
    const pos = new Float32Array(M * 3);
    const col = new Float32Array(M * 3);
    const r = rng(7);
    const c = new THREE.Color();
    for (let i = 0; i < M; i++) {
      pos[i * 3] = (r() - 0.5) * 44;
      pos[i * 3 + 1] = (r() - 0.5) * 26;
      pos[i * 3 + 2] = 30 - r() * (scenes.length * DEPTH + 60);
      c.set(r() < 0.55 ? '#C9CFDA' : PALETTE[Math.floor(r() * 5)]);
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const m = new THREE.PointsMaterial({ size: 0.16, map: tex, vertexColors: true, transparent: true, opacity: 0.5, depthWrite: false, sizeAttenuation: true });
    scene3.add(new THREE.Points(g, m));
  }

  /* ── the morph field: N particles, screen-anchored, formation-lerped */
  const formations = buildFormations();
  const morphPos = new Float32Array(N * 3);
  morphPos.set(formations[0]);
  const morphCol = new Float32Array(N * 3);
  const phases = new Float32Array(N * 3);
  {
    const r = rng(5);
    const c = new THREE.Color();
    for (let i = 0; i < N; i++) {
      c.set(PALETTE[i % 5]);
      // soften: blend toward white a touch so text stays readable
      c.lerp(new THREE.Color('#ffffff'), 0.12);
      morphCol[i * 3] = c.r; morphCol[i * 3 + 1] = c.g; morphCol[i * 3 + 2] = c.b;
      phases[i * 3] = r() * Math.PI * 2;
      phases[i * 3 + 1] = r() * Math.PI * 2;
      phases[i * 3 + 2] = r() * Math.PI * 2;
    }
  }
  const morphGeo = new THREE.BufferGeometry();
  morphGeo.setAttribute('position', new THREE.BufferAttribute(morphPos, 3));
  morphGeo.setAttribute('color', new THREE.BufferAttribute(morphCol, 3));
  const morphMat = new THREE.PointsMaterial({ size: 0.26, map: tex, vertexColors: true, transparent: true, opacity: 0.85, depthWrite: false, sizeAttenuation: true });
  const morphPts = new THREE.Points(morphGeo, morphMat);
  morphPts.frustumCulled = false;
  scene3.add(morphPts);

  /* ── hero constellation: real spheres + connection lines, world-fixed
       at station 0 so it recedes behind you as the flight begins. ─── */
  const NODES = [
    [120, 150, '#56C02B', 15], [570, 70, '#FCC30B', 15], [1020, 130, '#26BDE2', 15],
    [180, 470, '#E91E8C', 15], [960, 440, '#F99B1C', 15], [570, 530, '#56C02B', 15],
    [330, 105, '#26BDE2', 11], [820, 95, '#E866B0', 11], [250, 300, '#FCC30B', 11],
    [890, 285, '#56C02B', 11], [400, 560, '#F99B1C', 11], [750, 555, '#E91E8C', 11],
    [470, 330, '#26BDE2', 8], [670, 340, '#E866B0', 8],
  ];
  const LINKS = [[0, 6], [6, 1], [1, 7], [7, 2], [0, 8], [8, 3], [2, 9], [9, 4], [3, 10], [10, 5], [5, 11], [11, 4], [6, 8], [7, 9], [8, 1], [9, 1], [8, 10], [9, 11], [0, 9], [3, 8]];
  const constellation = new THREE.Group();
  const zJit = [1.2, -0.8, 0.5, -1.4, 0.9, -0.5, 1.6, -1.1, 0.3, -1.6, 1.1, 0.6, -0.9, 1.4];
  const nodePts = NODES.map(([px, py, color, pr], i) => {
    const v = new THREE.Vector3((px - 570) / 570 * 11.8, (320 - py) / 320 * 6.2, -3 + zJit[i]);
    const geo = new THREE.SphereGeometry(pr === 15 ? 0.34 : pr === 11 ? 0.26 : 0.19, 20, 20);
    const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color }));
    mesh.position.copy(v);
    mesh.scale.setScalar(0.001);
    constellation.add(mesh);
    return v;
  });
  const linePos = new Float32Array(LINKS.length * 6);
  LINKS.forEach(([a, b], i) => {
    nodePts[a].toArray(linePos, i * 6);
    nodePts[b].toArray(linePos, i * 6 + 3);
  });
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
  lineGeo.setDrawRange(0, 0);
  const lineMat = new THREE.LineBasicMaterial({ color: 0xc9cfda, transparent: true, opacity: 0.8 });
  constellation.add(new THREE.LineSegments(lineGeo, lineMat));
  constellation.position.z = 0;
  scene3.add(constellation);

  /* ── the DNA helix: two tube strands + rungs, screen-anchored while
       the visitor travels stations 4–5 (Measure → 12 skills). ─────── */
  const helix = new THREE.Group();
  const HELIX_H = 23, HELIX_R = 3.3, TWIST = 0.62;
  const strandMats = [];
  for (const [phase, colorHex] of [[0, '#56C02B'], [Math.PI, '#26BDE2']]) {
    const pts = [];
    for (let k = 0; k <= 160; k++) {
      const y = (k / 160 - 0.5) * HELIX_H;
      const ang = y * TWIST + phase;
      pts.push(new THREE.Vector3(Math.sin(ang) * HELIX_R, y, Math.cos(ang) * HELIX_R));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const mat = new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0 });
    strandMats.push(mat);
    helix.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 200, 0.16, 10, false), mat));
  }
  const rungMat = new THREE.MeshBasicMaterial({ color: '#F99B1C', transparent: true, opacity: 0 });
  const rungs = [];
  const RUNG_COUNT = 14;
  for (let k = 0; k < RUNG_COUNT; k++) {
    const y = (k / (RUNG_COUNT - 1) - 0.5) * (HELIX_H - 2);
    const ang = y * TWIST;
    const a = new THREE.Vector3(Math.sin(ang) * HELIX_R, y, Math.cos(ang) * HELIX_R);
    const b = new THREE.Vector3(Math.sin(ang + Math.PI) * HELIX_R, y, Math.cos(ang + Math.PI) * HELIX_R);
    const len = a.distanceTo(b);
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, len, 8), rungMat.clone());
    mesh.position.copy(a).add(b).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    mesh.scale.set(0.001, 1, 0.001);
    rungs.push(mesh);
    helix.add(mesh);
  }
  helix.position.z = -1e4; // parked far away until needed
  scene3.add(helix);

  /* mouse parallax */
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener('pointermove', (e) => {
    mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
    mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return {
    renderer, scene3, camera, formations, morphGeo, morphPos, phases,
    constellation, lineGeo, nLinks: LINKS.length,
    helix, strandMats, rungs, mouse,
    camZ: CAM_DIST, heroP: 1, dnaP: 0,
  };
}

/* ═══════════════════════════════════════════════════════════════════
   SCROLL CHOREOGRAPHY (DOM)
   ═══════════════════════════════════════════════════════════════════ */
const washEl = document.getElementById('wash');
const railEl = document.getElementById('rail');
const railDots = scenes.map((s, i) => {
  const d = document.createElement('div');
  d.className = 'dot';
  d.title = s.label;
  d.addEventListener('click', () => goToScene(i));
  railEl.appendChild(d);
  return d;
});
let curScene = 0;

function goToScene(i) {
  const s = scenes[clamp(i, 0, scenes.length - 1)];
  window.scrollTo({ top: s.el.offsetTop, behavior: reduced ? 'auto' : 'smooth' });
}
document.getElementById('goPrev').addEventListener('click', () => goToScene(curScene - 1));
document.getElementById('goNext').addEventListener('click', () => goToScene(curScene + 1));

/* reveal-on-scroll */
const obs = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('in'); obs.unobserve(e.target); }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.rv').forEach((el) => {
  if (reduced) el.classList.add('in'); else obs.observe(el);
});

/* stat count-up */
const statEl = document.getElementById('stat');
let counted = false;
function countUp() {
  const t0 = performance.now(), dur = 1300;
  const step = (t) => {
    const p = clamp((t - t0) / dur);
    statEl.textContent = String(Math.round(579 * ease(p)));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
if (reduced) { counted = true; }
else statEl.textContent = '0';

/* tabs */
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

/* pinned-scene DOM targets, resolved lazily */
function pinTargets(sc) {
  if (sc.t) return sc.t;
  const q = (s) => sc.el.querySelector(s);
  const qa = (s) => Array.from(sc.el.querySelectorAll(s));
  sc.t = {
    h1w: q('[data-h1w]'), hbs: qa('[data-hb]'), zoom: q('[data-zoom]'),
    fans: [q('[data-fan="1"]'), q('[data-fan="2"]'), q('[data-fan="3"]')],
    aiCard: q('[data-ai-card]'), aiAns: q('[data-ai-ans]'), aiFoot: q('[data-ai-foot]'),
    stH: q('[data-st-h]'), stP: q('[data-st-p]'), pops: qa('[data-pop]'),
    skillRows: qa('.skill-row'),
  };
  return sc.t;
}

const dnaSec = document.querySelector('[data-dna]');
const stageTitles = Array.from(document.querySelectorAll('.stage-title'));
const stagePanels = Array.from(document.querySelectorAll('.stage-panel'));
const jSec = document.querySelector('[data-journey]');
const jPath = document.querySelector('[data-j-path]');
const jBall = document.querySelector('[data-j-ball]');
let jLen = 0;

function onScroll() {
  const vh = window.innerHeight;
  const f = stationF();
  const i = Math.floor(f), t = f - i;

  /* wash crossfade */
  const wa = scenes[i].wash, wb = scenes[Math.min(i + 1, scenes.length - 1)].wash;
  const w = [0, 1, 2].map((k) => Math.round(lerp(wa[k], wb[k], t)));
  washEl.style.background = (w[0] === 255 && w[1] === 255 && w[2] === 255)
    ? '#fff'
    : `radial-gradient(1100px 700px at 50% 38%, rgb(${w[0]},${w[1]},${w[2]}), #ffffff 78%)`;

  /* rail */
  curScene = t < 0.5 ? i : i + 1;
  railDots.forEach((d, k) => d.classList.toggle('on', k === curScene));

  /* pinned scenes */
  scenes.forEach((sc) => {
    if (!sc.pin) return;
    const p = localP(sc.track || sc.el, vh);
    const T = pinTargets(sc);
    if (sc.pin === 'hero' && T.h1w) {
      const q = ease(clamp(p / 0.5));
      T.h1w.style.transform = `translateY(${(1 - q) * 0.17 * vh}px)`;
      T.hbs.forEach((el, k) => {
        if (p > 0.02) {
          const v = clamp((p - 0.1 - k * 0.05) / 0.14);
          if (v > 0) { el.style.opacity = String(v); el.style.transform = `translateY(${(1 - v) * 22}px)`; }
        }
      });
      if (three) three.heroP = p;
      if (p > 0.35 && !counted) { counted = true; countUp(); }
    }
    if (sc.pin === 'dash' && T.zoom) {
      const q = ease(clamp(p / 0.65));
      T.zoom.style.transform = `scale(${0.82 + 0.18 * q}) translateY(${(1 - q) * 30}px)`;
      T.zoom.style.opacity = String(0.25 + 0.75 * q);
    }
    if (sc.pin === 'fan' && T.fans[0]) {
      const q = ease(clamp(p / 0.7));
      T.fans[0].style.transform = `rotate(${-7 * q}deg) translateX(${290 - 266 * q}px)`;
      T.fans[2].style.transform = `rotate(${7 * q}deg) translateX(${-(290 - 266 * q)}px)`;
      T.fans[1].style.transform = `translateY(${-14 * q}px) scale(${0.96 + 0.04 * q})`;
    }
    if (sc.pin === 'ai' && T.aiCard) {
      const q1 = ease(clamp(p / 0.45));
      T.aiCard.style.opacity = String(0.1 + 0.9 * q1);
      T.aiCard.style.transform = `translateX(${(1 - q1) * 120}px)`;
      const q2 = clamp((p - 0.5) / 0.28);
      T.aiAns.style.opacity = String(q2);
      T.aiAns.style.transform = `translateY(${(1 - q2) * 16}px)`;
      T.aiFoot.style.opacity = String(0.15 + 0.85 * clamp((p - 0.76) / 0.2));
    }
    if (sc.pin === 'skills' && T.skillRows.length) {
      // rows are [left×6, right×6]; reveal in pairs, in step with the helix
      T.skillRows.forEach((row, k) => {
        const pair = k % 6;
        row.classList.toggle('in', p > 0.06 + pair * 0.13);
      });
    }
    if (sc.pin === 'state' && T.stH) {
      const q = ease(clamp(p / 0.5));
      T.stH.style.transform = `scale(${0.86 + 0.14 * q})`;
      T.stH.style.opacity = String(0.15 + 0.85 * q);
      T.stP.style.opacity = String(clamp((p - 0.2) / 0.25));
      T.pops.forEach((pl, k) => {
        const v = clamp((p - 0.42 - k * 0.09) / 0.12);
        pl.style.opacity = String(v);
        pl.style.transform = `scale(${0.6 + 0.4 * v})`;
      });
    }
  });

  /* DNA measure stages */
  if (dnaSec) {
    const p = localP(dnaSec, vh);
    const stage = p < 0.32 ? 0 : p < 0.62 ? 1 : 2;
    stageTitles.forEach((el, k) => { el.style.opacity = k === stage ? '1' : '0.25'; });
    stagePanels.forEach((el, k) => {
      const on = k === stage;
      el.style.opacity = on ? '1' : '0';
      el.style.transform = on ? 'translateY(0)' : 'translateY(18px)';
      el.style.pointerEvents = on ? 'auto' : 'none';
    });
    if (three) three.dnaP = p;
  }

  /* journey ball follows its dotted path */
  if (jSec && jPath && jBall) {
    const r = jSec.getBoundingClientRect();
    const p = clamp((vh * 0.6 - r.top - 180) / Math.max(1, r.height - 200));
    if (!jLen) jLen = jPath.getTotalLength();
    const pt = jPath.getPointAtLength(jLen * p);
    jBall.setAttribute('transform', `translate(${pt.x}, ${pt.y})`);
  }

  return f;
}

/* ═══════════════════════════════════════════════════════════════════
   FRAME LOOP
   ═══════════════════════════════════════════════════════════════════ */
if (reduced) {
  // no motion: static page, canvas hidden, everything revealed
  document.getElementById('world').style.display = 'none';
  document.querySelectorAll('[data-hb]').forEach((el) => { el.style.opacity = '1'; el.style.transform = 'none'; });
  document.querySelectorAll('.skill-row').forEach((el) => el.classList.add('in'));
  statEl.textContent = '579';
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
} else {
  three = initThree();
  let f = 0;
  let lastT = performance.now();

  // keep DOM choreography live even when rAF is throttled (hidden tab)
  window.addEventListener('scroll', onScroll, { passive: true });
  window.__tilliScroll = onScroll;

  function frame(now) {
    const dt = Math.min((now - lastT) / 1000, 0.05);
    lastT = now;
    f = onScroll();

    if (three) {
      const th = three;
      const time = now / 1000;

      /* camera flight, smoothed */
      const targetZ = CAM_DIST - f * DEPTH;
      th.camZ = lerp(th.camZ, targetZ, 1 - Math.exp(-dt * 5));
      const mx = th.mouse;
      mx.x = lerp(mx.x, mx.tx, 1 - Math.exp(-dt * 3));
      mx.y = lerp(mx.y, mx.ty, 1 - Math.exp(-dt * 3));
      th.camera.position.set(mx.x * 1.1, -mx.y * 0.7 + Math.sin(time * 0.3) * 0.15, th.camZ);
      th.camera.lookAt(mx.x * 0.4, -mx.y * 0.25, th.camZ - 30);

      const planeZ = th.camZ - CAM_DIST; // the active formation plane

      /* morph field: lerp formations + idle breathing */
      const i = Math.min(Math.floor(f), th.formations.length - 2);
      const tt = smooth(clamp(f - i));
      const A = th.formations[i], B = th.formations[i + 1];
      const P = th.morphPos, PH = th.phases;
      for (let k = 0; k < N * 3; k += 3) {
        P[k] = lerp(A[k], B[k], tt) + Math.sin(time * 0.55 + PH[k]) * 0.14;
        P[k + 1] = lerp(A[k + 1], B[k + 1], tt) + Math.sin(time * 0.5 + PH[k + 1]) * 0.14;
        P[k + 2] = lerp(A[k + 2], B[k + 2], tt) + Math.sin(time * 0.6 + PH[k + 2]) * 0.14 + planeZ;
      }
      th.morphGeo.attributes.position.needsUpdate = true;

      /* hero constellation build-in (driven by hero pin progress) */
      const hp = th.heroP;
      th.constellation.children.forEach((child, k) => {
        if (child.isMesh) {
          const v = ease(clamp((hp - 0.04 - k * 0.022) / 0.14));
          const breathe = 1 + Math.sin(time * 0.9 + k) * 0.06;
          child.scale.setScalar(Math.max(0.001, v * breathe));
        }
      });
      th.lineGeo.setDrawRange(0, Math.floor(clamp((hp - 0.1) / 0.5) * th.nLinks) * 2);
      th.constellation.rotation.y = Math.sin(time * 0.22) * 0.05 + mx.x * 0.04;
      th.constellation.rotation.x = mx.y * 0.025;

      /* DNA helix: appears through stations 4–5, screen-anchored */
      const vis = clamp((f - 3.55) / 0.45) * (1 - clamp((f - 5.55) / 0.45));
      if (vis > 0.001) {
        th.helix.position.set(0, 0, planeZ - 3);
        th.helix.rotation.y = f * 1.35 + time * 0.12;
        th.strandMats.forEach((m) => { m.opacity = vis * 0.95; });
        const rp = clamp(th.dnaP > 0 ? (th.dnaP - 0.55) / 0.4 : 0) || clamp((f - 4.6) / 0.5);
        th.rungs.forEach((rg, k) => {
          const v = ease(clamp((rp - k * 0.05) / 0.12));
          rg.material.opacity = vis * v;
          rg.scale.set(Math.max(0.001, v), 1, Math.max(0.001, v));
        });
      } else {
        th.helix.position.z = -1e4;
      }

      th.renderer.render(th.scene3, th.camera);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
