/* ═══════════════════════════════════════════════════════════════════════
   IMPACT CAROUSEL — seamless cylinder BARREL of logo cards.

   Cards are spread evenly around a full 360° cylinder (angStep = 360 /
   cardCount) and the whole barrel spins continuously. Cards that pass the
   sides fade out and travel round the hidden back, so the loop never jumps —
   that's why the logos are duplicated in the HTML (a fuller ring = more cards
   across the visible front). Pauses on hover. Carousel geometry is baked into
   CFG below; each text element's position/scale is baked into the HTML as
   inline CSS vars (--hx/--hy/--hsc, --sx/--sy/--ssc, --qx/--qy/--qsc).
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
    scale:  0.68,   // card size (× BASE_W/H)
    radius: 370,    // barrel radius (px) — bigger = flatter/gentler curve
    persp:  1160,   // perspective focal length (px)
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
})();
