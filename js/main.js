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

/* ── Scene registry (DOM order = station order) ───────────────────── */
const sceneEls = Array.from(document.querySelectorAll('[data-scene]'));
const scenes = sceneEls.map((el) => ({
  el,
  wash: (el.dataset.wash || '255,255,255').split(',').map(Number),
  label: el.dataset.label || '',
  pin: el.dataset.pin || null,
  track: el.querySelector('[data-pin-track]'),
  t: null,
}));
const ST = {}; // name → station index
scenes.forEach((s, i) => { ST[s.label] = i; });

function stationF() {
  const y = window.scrollY + window.innerHeight / 2;
  const mids = scenes.map((s) => s.el.offsetTop + s.el.offsetHeight / 2);
  if (y <= mids[0]) return 0;
  if (y >= mids[mids.length - 1]) return mids.length - 1;
  let i = 0;
  while (i < mids.length - 1 && y > mids[i + 1]) i++;
  return i + clamp((y - mids[i]) / Math.max(1, mids[i + 1] - mids[i]));
}
function localP(el, vh) {
  const r = el.getBoundingClientRect();
  return clamp(-r.top / Math.max(1, r.height - vh));
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
const N = 1500;

let three = null;

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
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/* ── Formations: each station gets {pos, col} of length N*3 ───────── */
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
    const r = rng(11);
    for (let i = 0; i < N; i++) {
      let x = (r() - 0.5) * 40, y = (r() - 0.5) * 22;
      if (Math.abs(x) < 8 && Math.abs(y) < 4) { x *= 2.4; y *= 2.6; } // keep the words readable
      setP(hero, i, x, y, -2 - r() * 7);
      setC(hero, i, MIX[i % 5]);
    }
    F.push(hero);
  }
  /* hero beat B target — a connected ring around the answer */
  const heroRing = new Float32Array(N * 3);
  {
    const r = rng(12);
    for (let i = 0; i < N; i++) {
      const ang = (i / N) * Math.PI * 2 + r() * 0.2;
      const rad = 1 + (r() - 0.5) * 0.16;
      heroRing[i * 3] = Math.cos(ang) * 15.5 * rad;
      heroRing[i * 3 + 1] = Math.sin(ang) * 8.6 * rad;
      heroRing[i * 3 + 2] = -2 - r() * 4;
    }
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

  return { F, heroRing, dnaThresh, streamT, streamJit, streamPoint };
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
      pos[i * 3] = (r() - 0.5) * 44;
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
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.3, map: tex, vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false }));
  pts.frustumCulled = false;
  scene3.add(pts);

  /* hero connection lines: a loose thread through the ring dots */
  const LINE_NODES = 26;
  const linePos = new Float32Array(LINE_NODES * 2 * 3);
  {
    const step = Math.floor(N / LINE_NODES);
    for (let k = 0; k < LINE_NODES; k++) {
      const a = (k * step) % N, b = ((k + 1) * step) % N;
      linePos.set(built.heroRing.subarray(a * 3, a * 3 + 3), k * 6);
      linePos.set(built.heroRing.subarray(b * 3, b * 3 + 3), k * 6 + 3);
    }
  }
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
  lineGeo.setDrawRange(0, 0);
  const lineMat = new THREE.LineBasicMaterial({ color: 0xc9cfda, transparent: true, opacity: 0.7 });
  const lines = new THREE.LineSegments(lineGeo, lineMat);
  scene3.add(lines);

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
    renderer, scene3, camera, geo, P, CL, phases, ...built,
    lines, lineGeo, nLineSegs: LINE_NODES,
    mouse, camZ: CAM_DIST, heroP: 0, dnaP: 0,
  };
}

/* ═══════════════════════════════════════════════════════════════════
   DOM CHOREOGRAPHY
   ═══════════════════════════════════════════════════════════════════ */
const washEl = document.getElementById('wash');
let curScene = 0;
function goToScene(i) {
  const s = scenes[clamp(i, 0, scenes.length - 1)];
  window.scrollTo({ top: s.el.offsetTop, behavior: reduced ? 'auto' : 'smooth' });
}
document.getElementById('goPrev').addEventListener('click', () => goToScene(curScene - 1));
document.getElementById('goNext').addEventListener('click', () => goToScene(curScene + 1));

const obs = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('in'); obs.unobserve(e.target); }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.rv').forEach((el) => {
  if (reduced) el.classList.add('in'); else obs.observe(el);
});

const beatA = document.getElementById('beatA');
const beatB = document.getElementById('beatB');
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

  const wa = scenes[i].wash, wb = scenes[Math.min(i + 1, scenes.length - 1)].wash;
  const w = [0, 1, 2].map((k) => Math.round(lerp(wa[k], wb[k], t)));
  washEl.style.background = (w[0] === 255 && w[1] === 255 && w[2] === 255)
    ? '#fff'
    : `radial-gradient(1100px 700px at 50% 38%, rgb(${w[0]},${w[1]},${w[2]}), #ffffff 78%)`;

  curScene = t < 0.5 ? i : i + 1;

  scenes.forEach((sc) => {
    if (!sc.pin) return;
    const p = localP(sc.track || sc.el, vh);
    const T = pinTargets(sc);
    if (sc.pin === 'hero') {
      // beat A (question) hands over to beat B (the answer) mid-pin
      const out = ease(clamp((p - 0.22) / 0.2));
      const inn = ease(clamp((p - 0.42) / 0.22));
      beatA.style.opacity = String(1 - out);
      beatA.style.transform = `translateY(${out * -46}px) scale(${1 - out * 0.05})`;
      beatA.style.pointerEvents = out > 0.5 ? 'none' : 'auto';
      beatB.style.opacity = String(inn);
      beatB.style.transform = `translateY(${(1 - inn) * 40}px)`;
      beatB.style.pointerEvents = inn > 0.5 ? 'auto' : 'none';
      if (inn > 0.4 && !counted) { counted = true; countUp(); }
      if (hintReady) scrollHint.style.opacity = p > 0.04 ? '0' : '1';
      if (three) three.heroP = p;
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
    if (sc.pin === 'views' && T.vH) {
      const q = ease(clamp((p - 0.08) / 0.2));
      T.vH.style.opacity = String(q);
      T.vH.style.transform = `translateY(${(1 - q) * 24}px)`;
      T.vLabels.forEach((el, k) => el.classList.toggle('in', p > 0.34 + k * 0.1));
    }
    if (sc.pin === 'skills' && T.skillCards.length) {
      T.skillCards.forEach((card, k) => card.classList.toggle('in', p > 0.12 + k * 0.055));
    }
    if (sc.pin === 'state' && T.stH) {
      const q = ease(clamp(p / 0.4));
      T.stH.style.transform = `scale(${0.88 + 0.12 * q})`;
      T.stH.style.opacity = String(0.15 + 0.85 * q);
      T.stP.style.opacity = String(clamp((p - 0.16) / 0.22));
      T.pops.forEach((pl, k) => {
        const v = clamp((p - 0.45 - k * 0.08) / 0.12);
        pl.style.opacity = String(v);
        pl.style.transform = `scale(${0.6 + 0.4 * v})`;
      });
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
  });

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
  document.getElementById('world').style.display = 'none';
  beatA.querySelectorAll('[data-hb]').forEach((el) => el.classList.add('in'));
  beatB.style.opacity = '1';
  document.querySelectorAll('.skill-card, .view-label').forEach((el) => el.classList.add('in'));
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

    /* base morph between the two neighbouring stations */
    const i = Math.min(Math.floor(f), th.F.length - 2);
    const tt = smooth(clamp(f - i));
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
    const heroBeat = ease(clamp((th.heroP - 0.3) / 0.3));
    if (i === 0 && heroBeat > 0) {
      const wgt = heroBeat * (1 - tt);
      for (let k = 0; k < N * 3; k += 3) {
        P[k] += (th.heroRing[k] - A.pos[k]) * wgt;
        P[k + 1] += (th.heroRing[k + 1] - A.pos[k + 1]) * wgt;
        P[k + 2] += (th.heroRing[k + 2] - A.pos[k + 2]) * wgt;
      }
    }
    const lineBeat = clamp((th.heroP - 0.45) / 0.3) * (1 - clamp(f - 0.3, 0, 0.2) * 5);
    th.lineGeo.setDrawRange(0, Math.floor(ease(clamp(lineBeat)) * th.nLineSegs) * 2);
    th.lines.position.z = planeZ;
    th.lines.material.opacity = 0.7 * clamp(1 - (f - 0.25) * 3);

    /* DASHBOARD: the stream actually flows */
    {
      const wgt = clamp(1 - Math.abs(f - ST['Dashboard']));
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
      const wgt = clamp(1 - Math.abs(f - ST['Collect']));
      if (wgt > 0.01) {
        const ang = time * 0.45 * wgt;
        for (let k = 0; k < N * 3; k += 3) rotXY(P, k, 0, 0, ang);
      }
    }

    /* DNA: strands appear in stage order, then the helix rotates */
    {
      const dnaI = ST['Measure'], skI = ST['12 skills'];
      const wgt = clamp((f - (dnaI - 0.55)) / 0.4) * (1 - clamp((f - (skI + 0.45)) / 0.4));
      if (wgt > 0.01) {
        const cx = lerp(0, 7.2, smooth(clamp(f - dnaI)));
        const ang = time * 0.4;
        const reveal = f > dnaI + 0.5 ? 1 : th.dnaP; // fully woven once past Measure
        for (let n = 0; n < N; n++) {
          const k = n * 3;
          rotate2D(P, k, cx * (i >= dnaI ? 1 : 0), -3, ang * wgt);
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
      const wgt = clamp(1 - Math.abs(f - ST['On track']));
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
