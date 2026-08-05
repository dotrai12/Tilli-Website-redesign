/* ═══════════════════════════════════════════════════════════════════════
   IMPACT CAROUSEL — seamless cylinder BARREL of logo cards.

   Cards are spread evenly around a full 360° cylinder (angStep = 360 /
   cardCount) and the whole barrel spins continuously. Cards that pass the
   sides fade out and travel round the hidden back, so the loop never jumps —
   that's why the logos are duplicated in the HTML (a fuller ring = more cards
   across the visible front). Pauses on hover. Baked in CFG below; a small
   panel (toggle with the "C" key) tunes carousel perspective/position and each
   text element's position/scale.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const root = document.getElementById('impactCarousel');
  if (!root) return;
  const cards = Array.from(root.querySelectorAll('.pcx-card'));
  const N = cards.length;
  const BASE_W = 260, BASE_H = 330;
  const DEG = Math.PI / 180;

  const CFG = {
    scale:  1.1,    // card size (× BASE_W/H)
    radius: 500,    // barrel radius (px) — bigger = flatter/gentler curve
    persp:  1020,   // perspective focal length (px)
    speed:  13,     // spin speed (deg/sec; negative reverses)
    offX:   0,      // barrel position offset X (px)
    offY:   0,      // barrel position offset Y (px)
  };

  const angStep = 360 / N;                 // even spread around the full barrel
  // Barrel is pushed toward the camera by FRONT_BIAS·R so the front card sits
  // OFF the focal plane — otherwise perspective (which scales by depth) has
  // nothing to scale on the dominant centre card. Higher = more forward = the
  // Perspective slider bites harder on the centre card.
  const FRONT_BIAS = 0.5;
  const stage = root.querySelector('.pcx-stage');
  let pos = 0;                             // continuous rotation (deg)
  cards.forEach((c) => { c.style.transition = 'none'; }); // we drive transform per-frame

  function applySize() {
    root.style.setProperty('--pcx-w', (BASE_W * CFG.scale) + 'px');
    root.style.setProperty('--pcx-ch', (BASE_H * CFG.scale) + 'px');
    root.style.setProperty('--pcx-persp', CFG.persp + 'px');
    root.style.setProperty('--pcx-h', (BASE_H * CFG.scale + 80) + 'px');
  }
  function applyPos() {
    if (stage) stage.style.transform =
      'translate(calc(-50% + ' + CFG.offX + 'px), calc(-50% + ' + CFG.offY + 'px))';
  }
  function wrap(a) { a = ((a % 360) + 360) % 360; return a > 180 ? a - 360 : a; }
  function layout() {
    const R = CFG.radius;
    for (let i = 0; i < N; i++) {
      const deg = wrap(i * angStep + pos);   // this card's angle around the barrel
      const th = deg * DEG;
      const x = R * Math.sin(th);
      const z = R * (Math.cos(th) - FRONT_BIAS); // front toward camera; perspective bites
      const c = cards[i];
      c.style.transform = 'translate3d(' + x.toFixed(1) + 'px,0,' + z.toFixed(1) + 'px) rotateY(' + deg.toFixed(1) + 'deg)';
      c.style.zIndex = String(1000 + Math.round(z));
      const ad = Math.abs(deg);
      c.style.opacity = ad >= 90 ? '0' : Math.max(0, Math.min(1, (90 - ad) / 25)).toFixed(3);
      c.style.pointerEvents = 'none';
    }
  }

  /* continuous spin, gated on-screen + tab-visible; pause on hover */
  let last = 0, running = false, onScreen = true, hover = false;
  function tick(t) {
    if (!running) return;
    const dt = last ? (t - last) / 1000 : 0; last = t;
    if (!hover) pos += CFG.speed * dt;
    layout();
    requestAnimationFrame(tick);
  }
  function start() { if (running || document.hidden || !onScreen) return; running = true; last = 0; requestAnimationFrame(tick); }
  function stop() { running = false; }
  root.addEventListener('mouseenter', () => { hover = true; });
  root.addEventListener('mouseleave', () => { hover = false; });

  applySize(); applyPos(); layout();
  // gate on the scene scroll block (the barrel lives in a fixed full-viewport stage)
  const gate = document.getElementById('impact') || root;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((e) => { onScreen = e[0].isIntersecting; onScreen ? start() : stop(); }, { rootMargin: '300px' }).observe(gate);
  } else { start(); }
  document.addEventListener('visibilitychange', () => { document.hidden ? stop() : start(); });
  window.__impactCarousel = { cfg: CFG, layout, applySize, applyPos };

  /* ═══════════════════════════════════════════════════════════════════════
     CONTROL PANEL — carousel perspective + position, and per-element text
     position/scale. Toggle with × or the "C" key. "Copy settings" copies the
     current values to paste back for baking.
     ═══════════════════════════════════════════════════════════════════════ */
  // per-text-element live state, seeded from the values baked into the HTML
  const T = {
    head:  { el: document.getElementById('impHead'),  vx: '--hx', vy: '--hy', vs: '--hsc' },
    stat1: { el: document.getElementById('impStat1'), vx: '--sx', vy: '--sy', vs: '--ssc' },
    stat2: { el: document.getElementById('impStat2'), vx: '--sx', vy: '--sy', vs: '--ssc' },
  };
  const readPx = (el, v, d) => { const s = el && el.style.getPropertyValue(v); const n = parseFloat(s); return isNaN(n) ? d : n; };
  Object.values(T).forEach((t) => {
    if (!t.el) return;
    t.x = readPx(t.el, t.vx, 0); t.y = readPx(t.el, t.vy, 0); t.sc = readPx(t.el, t.vs, 1);
  });
  function applyT(t) {
    if (!t.el) return;
    t.el.style.setProperty(t.vx, t.x + 'px');
    t.el.style.setProperty(t.vy, t.y + 'px');
    t.el.style.setProperty(t.vs, t.sc);
  }

  const panel = document.createElement('div');
  panel.id = 'impactPanel';
  panel.style.cssText = 'position:fixed;right:16px;top:16px;z-index:99999;width:250px;max-height:92vh;overflow:auto;' +
    'font:12px/1.4 system-ui,-apple-system,sans-serif;color:#e9e9ee;background:rgba(20,20,26,.94);' +
    'border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:11px 13px;' +
    'box-shadow:0 12px 36px rgba(0,0,0,.45);backdrop-filter:blur(8px);user-select:none;';
  const bar = document.createElement('div');
  bar.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;font-weight:600;';
  const ttl = document.createElement('span'); ttl.textContent = 'Carousel & text';
  const xb = document.createElement('button'); xb.textContent = '×'; xb.title = 'hide (press C)';
  xb.style.cssText = 'all:unset;cursor:pointer;font-size:18px;line-height:1;padding:0 4px;color:#9a9aa6;';
  xb.onclick = () => { panel.style.display = 'none'; };
  bar.append(ttl, xb); panel.appendChild(bar);

  function section(t) {
    const s = document.createElement('div');
    s.textContent = t;
    s.style.cssText = 'margin:12px 0 2px;color:#8f8fa0;font-size:10.5px;letter-spacing:.06em;text-transform:uppercase;';
    panel.appendChild(s);
  }
  function slider(label, min, max, step, get, set, onChange) {
    const row = document.createElement('label'); row.style.cssText = 'display:block;margin:7px 0;';
    const cap = document.createElement('span'); cap.textContent = label;
    const val = document.createElement('span');
    val.style.cssText = 'float:right;color:#7fe0a8;font-variant-numeric:tabular-nums;';
    const fmt = (v) => (step < 1 ? (+v).toFixed(2) : (+v).toFixed(0));
    val.textContent = fmt(get());
    const inp = document.createElement('input');
    inp.type = 'range'; inp.min = min; inp.max = max; inp.step = step; inp.value = get();
    inp.style.cssText = 'width:100%;margin-top:4px;accent-color:#26BDE2;cursor:pointer;';
    inp.oninput = () => { const v = parseFloat(inp.value); set(v); val.textContent = fmt(v); onChange && onChange(); };
    row.append(cap, val, inp); panel.appendChild(row);
  }
  function textBlock(label, t) {
    section(label);
    slider('X',     -500, 500, 2,    () => t.x,  (v) => t.x = v,  () => applyT(t));
    slider('Y',     -400, 400, 2,    () => t.y,  (v) => t.y = v,  () => applyT(t));
    slider('Scale',  0.3, 2.4, 0.02, () => t.sc, (v) => t.sc = v, () => applyT(t));
  }

  section('Carousel');
  slider('Perspective',    600, 2600, 20, () => CFG.persp,  (v) => CFG.persp = v,  applySize);
  slider('Radius (curve)', 200, 1300, 10, () => CFG.radius, (v) => CFG.radius = v, layout);
  slider('Position X',    -600, 600, 2,   () => CFG.offX,   (v) => CFG.offX = v,   applyPos);
  slider('Position Y',    -500, 500, 2,   () => CFG.offY,   (v) => CFG.offY = v,   applyPos);

  if (T.head.el)  textBlock('Heading', T.head);
  if (T.stat1.el) textBlock('Stat 1 · children reached', T.stat1);
  if (T.stat2.el) textBlock('Stat 2 · educators trained', T.stat2);

  const copy = document.createElement('button');
  copy.textContent = 'Copy settings';
  copy.style.cssText = 'all:unset;display:block;text-align:center;cursor:pointer;margin-top:12px;padding:6px 0;' +
    'border-radius:7px;background:rgba(255,255,255,.09);transition:background .15s;';
  copy.onmouseenter = () => (copy.style.background = 'rgba(255,255,255,.17)');
  copy.onmouseleave = () => (copy.style.background = 'rgba(255,255,255,.09)');
  copy.onclick = () => {
    const out = {
      carousel: { perspective: CFG.persp, radius: CFG.radius, positionX: CFG.offX, positionY: CFG.offY },
      text: {
        heading: { x: T.head.x, y: T.head.y, scale: T.head.sc },
        stat1:   { x: T.stat1.x, y: T.stat1.y, scale: T.stat1.sc },
        stat2:   { x: T.stat2.x, y: T.stat2.y, scale: T.stat2.sc },
      },
    };
    const txt = 'Carousel & text settings:\n```json\n' + JSON.stringify(out, null, 2) + '\n```';
    const done = () => { copy.textContent = 'Copied ✓'; setTimeout(() => (copy.textContent = 'Copy settings'), 1300); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, () => console.log(txt));
    else { console.log(txt); done(); }
  };
  panel.appendChild(copy);

  document.body.appendChild(panel);
  window.addEventListener('keydown', (e) => {
    if (e.target.closest('input,textarea,select,button,a,[contenteditable]')) return;
    if (e.key === 'c' || e.key === 'C') panel.style.display = panel.style.display === 'none' ? '' : 'none';
  });
})();
