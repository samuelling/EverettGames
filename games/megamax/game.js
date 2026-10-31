// MegaMax — an Everett Game.
// Arena fights (win = the fighter you beat joins your team), Buddy Island
// (catch a buddy = your fighter grows), and the MEGAMAX buddy super move.
// You can play as the fighter, or be the Coach and call the moves.
'use strict';
(() => {
  const A = window.MMArt, AU = window.MMAudio;
  const { FIGHTERS, BUDDIES, fighterById, buddyById } = A;
  const W = 960, H = 540;
  const cvs = document.getElementById('game');
  const ctx = cvs.getContext('2d');
  let scale = 1;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const s = Math.min(window.innerWidth / W, window.innerHeight / H);
    cvs.style.width = Math.floor(W * s) + 'px';
    cvs.style.height = Math.floor(H * s) + 'px';
    cvs.width = Math.floor(W * s * dpr);
    cvs.height = Math.floor(H * s * dpr);
    scale = cvs.width / W;
    arenaBG = null; islandBG = null;
  }
  window.addEventListener('resize', resize);

  // ---------------- save ----------------
  const KEY = 'megamax-save-v1';
  function fresh() {
    const f = {};
    FIGHTERS.forEach((d) => (f[d.id] = { size: 1, buddy: null }));
    return { unlocked: ['boulder', 'torch'], fighters: f, wins: 0, muted: false, seenIntro: false };
  }
  let S = (() => {
    try {
      const s = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (s && s.fighters) {
        const d = fresh();
        if (Array.isArray(s.unlocked) && s.unlocked.length) d.unlocked = s.unlocked.filter((id) => fighterById(id));
        FIGHTERS.forEach((x) => { if (s.fighters[x.id]) Object.assign(d.fighters[x.id], s.fighters[x.id]); });
        d.wins = s.wins | 0; d.muted = !!s.muted; d.seenIntro = !!s.seenIntro;
        return d;
      }
    } catch (e) { /* storage blocked */ }
    return fresh();
  })();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ignore */ } }
  AU.setMuted(S.muted);

  // ---------------- utils ----------------
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOutBack = (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
  const easeOutElastic = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1);
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  // ---------------- input ----------------
  const keys = {};
  const press = new Set();
  const pointers = new Map();
  let ui = [], prevUI = [];
  let joy = null;
  let usingTouch = (window.matchMedia && matchMedia('(pointer: coarse)').matches) || navigator.maxTouchPoints > 0;
  let focusIdx = -1;

  function toLocal(e) {
    const r = cvs.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
  }
  function hitUI(b, p) {
    if (b.r) return Math.hypot(p.x - b.x, p.y - b.y) <= b.r + 8;
    return p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h;
  }
  cvs.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    AU.init();
    if (e.pointerType === 'touch') usingTouch = true;
    try { cvs.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    const p = toLocal(e);
    const rec = { x: p.x, y: p.y, btn: null };
    pointers.set(e.pointerId, rec);
    if (fadeDir) return;
    for (let i = prevUI.length - 1; i >= 0; i--) {
      const b = prevUI[i];
      if (hitUI(b, p)) {
        rec.btn = b.id;
        if (b.hold) { rec.holdT0 = performance.now(); rec.holdDone = false; } // must be held
        else if (b.onTap) b.onTap();
        return;
      }
    }
    if (scene && scene.joyZone && scene.joyZone(p)) joy = { id: e.pointerId, bx: p.x, by: p.y, x: p.x, y: p.y };
    if (scene && scene.tapAnywhere) scene.tapAnywhere(p);
  });
  cvs.addEventListener('pointermove', (e) => {
    const rec = pointers.get(e.pointerId);
    if (!rec) return;
    const p = toLocal(e);
    rec.x = p.x; rec.y = p.y;
    if (joy && joy.id === e.pointerId) {
      const dx = p.x - joy.bx, dy = p.y - joy.by, d = Math.hypot(dx, dy), m = 60;
      if (d > m) { joy.bx = p.x - (dx / d) * m; joy.by = p.y - (dy / d) * m; }
      joy.x = p.x; joy.y = p.y;
    }
  });
  const endPtr = (e) => { pointers.delete(e.pointerId); if (joy && joy.id === e.pointerId) joy = null; };
  cvs.addEventListener('pointerup', endPtr);
  cvs.addEventListener('pointercancel', endPtr);
  cvs.addEventListener('contextmenu', (e) => e.preventDefault());

  const held = (id) => { for (const r of pointers.values()) if (r.btn === id) return true; return false; };
  // hold-to-press buttons (sound, home, quit): fire only after a steady press, so random taps do nothing
  function updateHolds() {
    for (const r of pointers.values()) {
      if (r.holdT0 == null || r.holdDone) continue;
      const b = prevUI.find((u) => u.id === r.btn);
      if (!b || !hitUI(b, r)) { r.holdT0 = null; r.btn = null; continue; }
      if (performance.now() - r.holdT0 >= b.hold * 1000) { r.holdDone = true; if (b.onTap) b.onTap(); }
    }
  }
  function holdProgress(b) {
    let k = 0;
    for (const r of pointers.values()) if (r.btn === b.id && r.holdT0 != null && !r.holdDone) k = Math.max(k, (performance.now() - r.holdT0) / (b.hold * 1000));
    return Math.min(1, k);
  }

  const KEYMAP = {
    KeyJ: 'punch', KeyZ: 'punch', KeyK: 'power', KeyX: 'power', Space: 'jump', KeyL: 'mega', KeyC: 'mega', KeyH: 'cheer', KeyV: 'cheer',
    Digit1: 'punch', Digit2: 'power', Digit3: 'jump', Digit4: 'cheer', Digit5: 'mega',
  };
  window.addEventListener('keydown', (e) => {
    AU.init();
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    if (e.repeat) { keys[e.code] = true; return; }
    keys[e.code] = true;
    if (e.code === 'KeyM') { toggleMute(); return; }
    if (fadeDir) return;
    if (scene && scene.noNav) { if (KEYMAP[e.code]) press.add(KEYMAP[e.code]); if (e.code === 'Escape' && scene.onEsc) scene.onEsc(); return; }
    // menu navigation
    const f = prevUI.filter((b) => b.focus);
    if (!f.length) return;
    if (['ArrowRight', 'ArrowDown', 'KeyD', 'KeyS', 'Tab'].includes(e.code)) { focusIdx = (focusIdx + 1 + f.length) % f.length; AU.sfx('tap'); e.preventDefault(); }
    else if (['ArrowLeft', 'ArrowUp', 'KeyA', 'KeyW'].includes(e.code)) { focusIdx = (focusIdx - 1 + f.length) % f.length; AU.sfx('tap'); }
    else if (e.code === 'Enter' || e.code === 'Space') { const b = f[Math.max(0, focusIdx)]; if (b && b.onTap) b.onTap(); }
    else if (e.code === 'Escape' && scene.onEsc) scene.onEsc();
  });
  window.addEventListener('keyup', (e) => { keys[e.code] = false; });

  function moveVec() {
    let x = 0, z = 0;
    if (keys.ArrowLeft || keys.KeyA) x -= 1;
    if (keys.ArrowRight || keys.KeyD) x += 1;
    if (keys.ArrowUp || keys.KeyW) z -= 1;
    if (keys.ArrowDown || keys.KeyS) z += 1;
    if (joy) {
      const dx = joy.x - joy.bx, dy = joy.y - joy.by, d = Math.hypot(dx, dy);
      if (d > 8) { const m = Math.min(1, d / 50); x = (dx / d) * m; z = (dy / d) * m; }
    }
    const l = Math.hypot(x, z);
    if (l > 1) { x /= l; z /= l; }
    return { x, z };
  }

  function button(b) { ui.push(b); return b; }
  function toggleMute() { S.muted = !S.muted; AU.setMuted(S.muted); save(); }
  function topBar(opts) {
    opts = opts || {};
    if (opts.home) button({ id: 'home', x: 46, y: 42, r: 30, color: '#3a3f7a', icon: 'home', hold: 0.8, onTap: opts.home });
    if (opts.back) button({ id: 'back', x: 46, y: 42, r: 30, color: '#3a3f7a', icon: 'back', onTap: opts.back });
    button({ id: 'mute', x: W - 46, y: 42, r: 26, color: '#3a3f7a', icon: S.muted ? 'mute' : 'sound', hold: 0.8, onTap: () => { toggleMute(); } });
  }
  // back to the Everett Games console (when we're playing inside the console's screen, ask it to eject)
  const toConsole = () => {
    AU.sfx('tap');
    if (window.parent !== window) { try { window.parent.postMessage({ type: 'everett-console-home' }, '*'); return; } catch (e) { /* fall through */ } }
    setTimeout(() => { window.location.href = '../../'; }, 120);
  };

  // ---------------- particles & effects ----------------
  let parts = [], fx = [];
  function burst(x, y, col, n, spd, o) {
    o = o || {};
    for (let i = 0; i < n; i++) {
      const a = o.up ? rand(-Math.PI * 0.95, -Math.PI * 0.05) : rand(0, Math.PI * 2), s = rand(spd * 0.35, spd);
      parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rand(0.35, 0.8) * (o.life || 1), max: 1, col: Array.isArray(col) ? pick(col) : col, r: rand(3, 7) * (o.size || 1), g: o.g == null ? 500 : o.g, shape: o.shape || 'dot', rot: rand(0, 6), vr: rand(-8, 8) });
    }
  }
  function updParts(dt) {
    for (const p of parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; p.vx *= 0.98; p.life -= dt; p.rot += p.vr * dt; }
    parts = parts.filter((p) => p.life > 0);
    for (const f of fx) f.t += dt;
    fx = fx.filter((f) => f.t < f.life);
  }
  function drawParts(camX) {
    for (const p of parts) {
      ctx.save();
      ctx.globalAlpha = clamp(p.life * 2, 0, 1);
      ctx.translate(p.x - (camX || 0), p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.col;
      if (p.shape === 'star') { A.star(ctx, 0, 0, p.r * 1.6, 5, 0.45); ctx.fill(); }
      else if (p.shape === 'rect') { ctx.fillRect(-p.r, -p.r * 0.5, p.r * 2, p.r); }
      else if (p.shape === 'heart') { drawHeart(0, 0, p.r * 1.4, p.col); }
      else if (p.shape === 'leaf') { ctx.beginPath(); ctx.moveTo(-p.r, 0); ctx.quadraticCurveTo(0, -p.r, p.r, 0); ctx.quadraticCurveTo(0, p.r, -p.r, 0); ctx.fill(); }
      else { ctx.beginPath(); ctx.arc(0, 0, p.r, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
    }
  }
  function drawFx(camX) {
    for (const f of fx) {
      const k = f.t / f.life;
      if (f.kind === 'pow') {
        ctx.save();
        ctx.translate(f.x - (camX || 0), f.y);
        const s = easeOutBack(Math.min(1, f.t / 0.12)) * f.s;
        ctx.globalAlpha = 1 - Math.max(0, (k - 0.6) / 0.4);
        ctx.rotate(f.rot);
        A.star(ctx, 0, 0, 30 * s, 8, 0.5); ctx.fillStyle = f.col; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = A.OUT; ctx.stroke();
        A.star(ctx, 0, 0, 15 * s, 8, 0.5); ctx.fillStyle = '#fff'; ctx.fill();
        ctx.restore();
      } else if (f.kind === 'ring') {
        ctx.save();
        ctx.globalAlpha = 1 - k;
        ctx.strokeStyle = f.col; ctx.lineWidth = 8 * (1 - k) + 2;
        A.ell(ctx, f.x - (camX || 0), f.y, f.r * (0.3 + k), f.r * (0.3 + k) * (f.flat || 1)); ctx.stroke();
        ctx.restore();
      }
    }
  }
  function drawHeart(x, y, r, col) {
    ctx.beginPath();
    ctx.moveTo(x, y + r * 0.9);
    ctx.bezierCurveTo(x - r * 1.6, y - r * 0.2, x - r * 0.6, y - r * 1.4, x, y - r * 0.4);
    ctx.bezierCurveTo(x + r * 0.6, y - r * 1.4, x + r * 1.6, y - r * 0.2, x, y + r * 0.9);
    ctx.fillStyle = col; ctx.fill();
  }

  // ---------------- shared drawing ----------------
  function bigText(txt, x, y, size, col, o) {
    o = o || {};
    ctx.save();
    ctx.font = `900 ${size}px "Arial Rounded MT Bold", "Trebuchet MS", system-ui, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = size * 0.22; ctx.strokeStyle = A.OUT; ctx.strokeText(txt, x, y + size * 0.06);
    ctx.strokeText(txt, x, y);
    if (o.rainbow) {
      const g = ctx.createLinearGradient(x - size * 3, 0, x + size * 3, 0);
      ['#ff4d6d', '#ffb703', '#ffe14d', '#52d273', '#4cc9f0', '#9d4edd'].forEach((c, i, a) => g.addColorStop(((i / (a.length - 1)) + (o.shift || 0)) % 1, c));
      ctx.fillStyle = g;
    } else ctx.fillStyle = col || '#fff';
    ctx.fillText(txt, x, y);
    ctx.restore();
  }

  function drawMenuBG(t, c1, c2) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, c1 || '#3b1c7a'); g.addColorStop(1, c2 || '#16123a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.translate(W / 2, H * 0.55);
    ctx.rotate(t * 0.08);
    ctx.fillStyle = 'rgba(255,255,255,0.045)';
    for (let i = 0; i < 16; i++) {
      ctx.beginPath(); ctx.moveTo(0, 0);
      ctx.arc(0, 0, 900, (i / 16) * Math.PI * 2, ((i + 0.5) / 16) * Math.PI * 2);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    for (let i = 0; i < 30; i++) {
      const x = (i * 137.5) % W, y = (i * 71.3 + t * (8 + (i % 5) * 4)) % H;
      ctx.globalAlpha = 0.25 + (i % 3) * 0.15;
      ctx.fillStyle = '#fff';
      A.star(ctx, x, H - y, 2 + (i % 3), 4, 0.4); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawCoach(x, y, s, t, blow, facing) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s * (facing || 1), s);
    const bob = blow ? -Math.abs(Math.sin(t * 18)) * 4 : Math.sin(t * 3) * 1.5;
    // legs
    A.rrect(ctx, -20, -38, 16, 38, 6); A.fs(ctx, '#1d3557');
    A.rrect(ctx, 4, -38, 16, 38, 6); A.fs(ctx, '#1d3557');
    A.ell(ctx, -10, -2, 14, 7); A.fs(ctx, '#ffffff'); A.ell(ctx, 16, -2, 14, 7); A.fs(ctx, '#ffffff');
    ctx.translate(0, bob);
    // clipboard arm (back)
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-22, -96); ctx.lineTo(-34, -66);
    ctx.strokeStyle = A.OUT; ctx.lineWidth = 20; ctx.stroke(); ctx.strokeStyle = '#c1121f'; ctx.lineWidth = 12; ctx.stroke();
    A.rrect(ctx, -54, -86, 30, 40, 4); A.fs(ctx, '#a0522d', 3);
    A.rrect(ctx, -50, -80, 22, 30, 2); ctx.fillStyle = '#fff'; ctx.fill();
    ctx.strokeStyle = '#9aa'; ctx.lineWidth = 2; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-47, -73 + i * 8); ctx.lineTo(-31, -73 + i * 8); ctx.stroke(); }
    // body
    A.ell(ctx, 0, -76, 36, 42); A.fs(ctx, '#e63946');
    ctx.fillStyle = '#fff'; ctx.fillRect(-4, -116, 8, 76);
    // whistle cord
    ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-12, -112); ctx.quadraticCurveTo(0, -84, blow ? 26 : 12, blow ? -128 : -88); ctx.stroke();
    // head
    A.ell(ctx, 4, -138, 28, 27); A.fs(ctx, '#f1c27d');
    if (blow) { A.ell(ctx, 22, -128, 9, 8); ctx.fillStyle = '#f7a8a8'; ctx.fill(); }
    // cap
    ctx.beginPath(); ctx.arc(4, -146, 28, Math.PI, 0); ctx.closePath(); A.fs(ctx, '#1d3557');
    A.rrect(ctx, 14, -152, 34, 9, 4); A.fs(ctx, '#1d3557', 3);
    // face
    A.ell(ctx, 6, -138, 3.5, 4.5); ctx.fillStyle = A.OUT; ctx.fill();
    A.ell(ctx, 20, -138, 3.5, 4.5); ctx.fill();
    ctx.fillStyle = '#6b4226'; A.rrect(ctx, 6, -128, 22, 7, 3); ctx.fill(); // mustache
    if (blow) {
      A.rrect(ctx, 26, -128, 18, 10, 4); A.fs(ctx, '#c0c8d0', 3); // whistle
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(46, -124, 8 + i * 8 + (t * 40) % 8, -0.6, 0.6); ctx.stroke(); }
    } else {
      A.rrect(ctx, 6, -94, 14, 8, 3); A.fs(ctx, '#c0c8d0', 3);
    }
    // pointing arm
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(22, -96); ctx.lineTo(blow ? 62 : 34, blow ? -112 : -62);
    ctx.strokeStyle = A.OUT; ctx.lineWidth = 20; ctx.stroke(); ctx.strokeStyle = '#e63946'; ctx.lineWidth = 12; ctx.stroke();
    A.ell(ctx, blow ? 64 : 34, blow ? -113 : -60, 8, 8); A.fs(ctx, '#f1c27d', 3);
    ctx.restore();
  }

  function drawPad(x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.beginPath();
    ctx.moveTo(-40, -16); ctx.quadraticCurveTo(0, -24, 40, -16);
    ctx.quadraticCurveTo(58, 10, 48, 24); ctx.quadraticCurveTo(38, 32, 24, 14);
    ctx.lineTo(-24, 14); ctx.quadraticCurveTo(-38, 32, -48, 24); ctx.quadraticCurveTo(-58, 10, -40, -16);
    A.fs(ctx, '#4a4e69');
    ctx.fillStyle = '#fff'; ctx.fillRect(-32, -4, 18, 6); ctx.fillRect(-26, -10, 6, 18);
    [['#ff4d6d', 26, -6], ['#52d273', 34, 2], ['#4cc9f0', 18, 2], ['#ffd23f', 26, 10]].forEach(([c, bx, by]) => { A.ell(ctx, bx, by - 4, 4, 4); ctx.fillStyle = c; ctx.fill(); });
    ctx.restore();
  }

  // default button renderer
  function drawUI() {
    const f = ui.filter((b) => b.focus);
    if (focusIdx >= f.length) focusIdx = f.length - 1;
    ui.forEach((b) => {
      const isHeld = held(b.id);
      const isFocus = focusIdx >= 0 && f[focusIdx] === b;
      if (b.hidden) return;
      ctx.save();
      if (b.draw) { b.draw(b, isHeld, isFocus); ctx.restore(); return; }
      const pulse = b.pulse ? 1 + Math.sin(T * 6) * 0.06 : 1;
      const k = (isHeld ? 0.9 : 1) * pulse;
      ctx.translate(b.x, b.y);
      ctx.scale(k, k);
      ctx.globalAlpha = b.alpha == null ? 1 : b.alpha;
      if (isFocus) { A.ell(ctx, 0, 0, b.r + 9, b.r + 9); ctx.fillStyle = '#ffe14d'; ctx.fill(); }
      A.ell(ctx, 0, 4, b.r, b.r); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();
      A.ell(ctx, 0, 0, b.r, b.r); A.fs(ctx, b.color || '#4361ee', 4);
      A.ell(ctx, -b.r * 0.25, -b.r * 0.35, b.r * 0.5, b.r * 0.28); ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fill();
      if (b.ring != null) {
        ctx.beginPath(); ctx.arc(0, 0, b.r - 5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp(b.ring, 0, 1));
        ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 6; ctx.stroke();
      }
      if (b.drawIcon) b.drawIcon(b);
      else if (b.icon) A.drawIcon(ctx, b.icon, 0, 0, b.r * 1.05, '#fff');
      if (b.hold) {
        const hp = holdProgress(b);
        if (hp > 0) {
          ctx.beginPath(); ctx.arc(0, 0, b.r + 8, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * hp);
          ctx.lineCap = 'round'; ctx.strokeStyle = A.OUT; ctx.lineWidth = 11; ctx.stroke();
          ctx.strokeStyle = '#ffe14d'; ctx.lineWidth = 6; ctx.stroke();
        }
      }
      ctx.restore();
    });
  }

  // ======================================================================
  // ARENA geometry (2.5D: x across, z = depth on the floor, h = height)
  // ======================================================================
  const AR = { cx: 480, cz: 394, rx: 410, rz: 104 };
  const zTop = AR.cz - AR.rz, zBot = AR.cz + AR.rz;
  const persp = (z) => 0.8 + 0.3 * (z - zTop) / (zBot - zTop);
  function clampArena(e) {
    const nx = (e.x - AR.cx) / (AR.rx - 24), nz = (e.z - AR.cz) / (AR.rz - 6), d = Math.hypot(nx, nz);
    if (d > 1) { e.x = AR.cx + (nx / d) * (AR.rx - 24); e.z = AR.cz + (nz / d) * (AR.rz - 6); }
  }

  let arenaBG = null;
  function buildArenaBG() {
    const c = document.createElement('canvas');
    c.width = Math.ceil(W * scale); c.height = Math.ceil(H * scale);
    const g = c.getContext('2d');
    g.scale(scale, scale);
    const sky = g.createLinearGradient(0, 0, 0, 300);
    sky.addColorStop(0, '#2b1055'); sky.addColorStop(0.6, '#a4508b'); sky.addColorStop(1, '#ff9a76');
    g.fillStyle = sky; g.fillRect(0, 0, W, 320);
    // moon + stars
    g.fillStyle = '#fff6d5'; g.beginPath(); g.arc(800, 70, 34, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.7)';
    for (let i = 0; i < 40; i++) g.fillRect((i * 211) % W, (i * 53) % 140, 2, 2);
    // stadium back wall
    g.fillStyle = '#3d2c5e';
    g.beginPath(); g.moveTo(0, 300); g.lineTo(0, 150); g.quadraticCurveTo(480, 60, 960, 150); g.lineTo(960, 300); g.closePath(); g.fill();
    g.fillStyle = '#2a1f45';
    g.beginPath(); g.moveTo(0, 300); g.lineTo(0, 210); g.quadraticCurveTo(480, 140, 960, 210); g.lineTo(960, 300); g.closePath(); g.fill();
    // arches
    g.fillStyle = '#1a1230';
    for (let i = 0; i < 12; i++) {
      const x = 40 + i * 80, y = 250 - Math.sin((i / 11) * Math.PI) * 40;
      g.beginPath(); g.moveTo(x - 22, y + 50); g.lineTo(x - 22, y + 10); g.arc(x, y + 10, 22, Math.PI, 0); g.lineTo(x + 22, y + 50); g.closePath(); g.fill();
    }
    // banners
    ['#ff4d6d', '#ffd23f', '#4cc9f0', '#52d273', '#9d4edd'].forEach((col, i) => {
      const x = 120 + i * 180, y = 120 - Math.sin(((x) / W) * Math.PI) * 30;
      g.fillStyle = col; g.beginPath(); g.moveTo(x - 18, y); g.lineTo(x + 18, y); g.lineTo(x + 18, y + 50); g.lineTo(x, y + 40); g.lineTo(x - 18, y + 50); g.closePath(); g.fill();
      g.fillStyle = '#fff'; A.star(g, x, y + 20, 9, 5, 0.45); g.fill();
    });
    // wall ledge
    g.fillStyle = '#5a4580'; g.fillRect(0, 286, W, 18);
    g.fillStyle = '#463466'; g.fillRect(0, 300, W, 10);
    // ground outside the ring
    const gr = g.createLinearGradient(0, 300, 0, H);
    gr.addColorStop(0, '#6d4c8a'); gr.addColorStop(1, '#3b2a55');
    g.fillStyle = gr; g.fillRect(0, 306, W, H - 306);
    // arena ring
    g.save();
    g.fillStyle = '#2a1f45'; A.ell(g, AR.cx, AR.cz + 12, AR.rx + 26, AR.rz + 22); g.fill();
    g.fillStyle = '#c9a66b'; A.ell(g, AR.cx, AR.cz + 4, AR.rx + 18, AR.rz + 16); g.fill();
    g.fillStyle = '#8a6a3a'; A.ell(g, AR.cx, AR.cz + 8, AR.rx + 18, AR.rz + 12); g.globalCompositeOperation = 'source-over';
    const fl = g.createRadialGradient(AR.cx, AR.cz, 20, AR.cx, AR.cz, AR.rx);
    fl.addColorStop(0, '#f6d99a'); fl.addColorStop(1, '#d9b06a');
    g.fillStyle = fl; A.ell(g, AR.cx, AR.cz, AR.rx, AR.rz); g.fill();
    g.strokeStyle = 'rgba(120,80,30,0.35)'; g.lineWidth = 3;
    [0.35, 0.7].forEach((k) => { A.ell(g, AR.cx, AR.cz, AR.rx * k, AR.rz * k); g.stroke(); });
    g.save(); g.translate(AR.cx, AR.cz); g.scale(1, AR.rz / AR.rx);
    g.fillStyle = 'rgba(255,77,109,0.35)'; A.star(g, 0, 0, 90, 5, 0.45); g.fill();
    g.restore();
    g.restore();
    // halloween pumpkins on the ledge in October
    if (new Date().getMonth() === 9) {
      [70, 250, 710, 890].forEach((x) => {
        g.fillStyle = '#ff8c1a'; A.ell(g, x, 280, 18, 14); g.fill();
        g.strokeStyle = '#c45f00'; g.lineWidth = 2; A.ell(g, x, 280, 7, 14); g.stroke();
        g.fillStyle = '#3a7d2c'; g.fillRect(x - 2, 262, 4, 6);
        g.fillStyle = '#ffe14d'; A.poly(g, [x - 10, 276, x - 4, 276, x - 7, 270]); g.fill(); A.poly(g, [x + 4, 276, x + 10, 276, x + 7, 270]); g.fill();
        g.beginPath(); g.moveTo(x - 9, 284); g.lineTo(x + 9, 284); g.lineTo(x, 290); g.closePath(); g.fill();
      });
    }
    arenaBG = c;
  }

  function drawArena(t, crowdHype) {
    if (!arenaBG) buildArenaBG();
    ctx.drawImage(arenaBG, 0, 0, W, H);
    // crowd
    const cols = ['#ff4d6d', '#ffd23f', '#4cc9f0', '#52d273', '#ff8c2b', '#c3a6ff', '#ffffff'];
    for (let row = 0; row < 3; row++) {
      for (let i = 0; i < 34; i++) {
        const x = 14 + i * 28 + (row % 2) * 14;
        const base = 196 + row * 26 - Math.sin((x / W) * Math.PI) * (44 - row * 6);
        const jump = Math.max(0, Math.sin(t * (6 + (i % 4)) + i * 1.7)) * (2 + crowdHype * 10);
        ctx.fillStyle = cols[(i * 7 + row * 3) % cols.length];
        ctx.beginPath(); ctx.arc(x, base - jump, 9, 0, Math.PI * 2); ctx.fill();
        ctx.fillRect(x - 9, base - jump, 18, 16);
      }
    }
    // spotlights
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    [[180, 0.3], [780, -0.3]].forEach(([x, a]) => {
      const sw = Math.sin(t * 0.7 + x) * 0.25;
      ctx.save(); ctx.translate(x, 0); ctx.rotate(a + sw);
      const g = ctx.createLinearGradient(0, 0, 0, 420);
      g.addColorStop(0, 'rgba(255,240,200,0.18)'); g.addColorStop(1, 'rgba(255,240,200,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(10, 0); ctx.lineTo(90, 440); ctx.lineTo(-90, 440); ctx.closePath(); ctx.fill();
      ctx.restore();
    });
    ctx.restore();
  }

  // ======================================================================
  // FIGHT
  // ======================================================================
  function makeFighter(def, size, buddyId, x, z, facing, isCPU) {
    const maxHp = Math.round(100 * (1 + 0.3 * (size - 1)));
    return {
      def, size, sc: 0.9 + 0.22 * (size - 1), x, z, h: 0, vh: 0, kx: 0, kz: 0, facing,
      hp: maxHp, maxHp, shownHp: maxHp, state: 'idle', st: 0, hitDone: false, fired: false,
      punchCd: 0, powerCd: 0, cheerCd: 0, meter: 0, stun: 0, inv: 0, flash: 0, t: rand(0, 5), isCPU,
      spd: def.speed * (1 - 0.06 * (size - 1)), pow: def.power * (1 + 0.22 * (size - 1)), dmgMul: 1,
      buddy: buddyId ? { def: buddyById(buddyId), x: x - 60 * facing, z: z - 14, t: 0, cd: 2.5, state: 'follow', facing, nipT: 0 } : null,
      ai: { t: 0, act: 'approach', order: null, orderT: 0, dodgeT: 0, dodgeDir: 1 },
    };
  }

  function SceneFight(p) {
    AU.play('arena');
    const pdef = fighterById(p.id), pst = S.fighters[p.id];
    const lockedLeft = FIGHTERS.filter((f) => !S.unlocked.includes(f.id));
    const odef = lockedLeft.length ? lockedLeft[0] : pick(FIGHTERS.filter((f) => f.id !== p.id));
    // LEVELS: every win is a new level, and every level the bad guy gets tougher:
    // smarter, bigger, more health, harder hits, faster, quicker fireballs.
    // Every 5th level is a BOSS (crown, extra size and health).
    const L = S.wins + 1, boss = L % 5 === 0;
    const D = Math.min(0.95, 0.25 + 0.07 * (L - 1));
    const oSize = Math.min(4, 1 + Math.floor((L - 1) / 2) + (boss ? 1 : 0));
    const oBuddy = L >= 3 ? pick(BUDDIES).id : null;
    const P = makeFighter(pdef, pst.size, pst.buddy, 300, 400, 1, false);
    const O = makeFighter(odef, oSize, oBuddy, 660, 400, -1, true);
    O.dmgMul = Math.min(0.95, 0.5 + 0.05 * (L - 1)) * (boss ? 1.1 : 1);
    O.maxHp = O.hp = O.shownHp = Math.round(O.maxHp * Math.min(1.4, 1 + 0.05 * (L - 1)) * (boss ? 1.2 : 1));
    O.spd *= Math.min(1.3, 1 + 0.03 * (L - 1));
    O.powerCdMax = Math.max(0.8, 1.4 - 0.05 * (L - 1));
    O.level = L; O.boss = boss; O.rage = Math.min(1, (L - 1) / 10);
    P.coached = !!p.coach;
    const coach = { t: 0, blowT: 0, call: null };
    let projs = [];
    let intro = 2.3, hitstop = 0, shake = 0, slow = 0, mega = null, ko = null, flashScreen = 0, hype = 0;
    let hintCd = 0, t = 0, ended = false;
    parts = []; fx = [];
    AU.say(boss ? `Level ${L}. Boss fight! ${odef.name}!` : `Level ${L}! ${odef.name}! Fight!`);

    function coachCall(order, icon) {
      if (intro > 0 || ko) return;
      AU.sfx('whistle');
      coach.blowT = 0.6; coach.call = icon || order;
      if (order === 'cheer') {
        if (P.cheerCd > 0) return;
        P.cheerCd = 0.45;
        P.meter = Math.min(100, P.meter + 7);
        hype = 1;
        burst(P.x, P.z - P.h - 120 * P.sc, '#ff4d6d', 4, 160, { shape: 'heart', g: -60, size: 1.4 });
        if (P.meter >= 100 && P.buddy) AU.say('MegaMax is ready!');
        return;
      }
      if (order === 'mega') {
        if (!P.buddy) { AU.say('Find a buddy on Buddy Island!'); return; }
        if (P.meter < 100) { AU.sfx('nope'); AU.say('Cheer to fill it up!'); return; }
      }
      AU.say({ punch: 'Punch!', power: 'Power!', dodge: 'Dodge!', mega: 'MegaMax!' }[order] || '');
      P.ai.order = order; P.ai.orderT = 1.8;
    }

    function hit(tg, at, dmg, kind) {
      if (tg.state === 'ko' || ko) return;
      if (kind !== 'mega' && tg.inv > 0) return;
      tg.hp = Math.max(0, tg.hp - dmg * at.dmgMul);
      tg.flash = 0.12;
      const dir = Math.sign(tg.x - at.x) || at.facing;
      tg.stun = kind === 'nip' ? 0.14 : kind === 'mega' ? Math.max(tg.stun, 0.5) : 0.26;
      tg.kx = dir * (kind === 'mega' ? 300 : kind === 'nip' ? 110 : 270);
      tg.kz = clamp((tg.z - at.z) * 2, -80, 80);
      tg.state = 'hurt';
      tg.inv = kind === 'mega' ? 0 : 0.08;
      if (kind !== 'mega') at.meter = Math.min(100, at.meter + (kind === 'nip' ? 5 : 11));
      tg.meter = Math.min(100, tg.meter + 5);
      hitstop = kind === 'mega' ? 0.03 : 0.065;
      shake = Math.max(shake, kind === 'mega' ? 12 : kind === 'nip' ? 3 : 7);
      hype = Math.min(1, hype + 0.3);
      const hy = tg.z - tg.h - 70 * tg.sc * persp(tg.z);
      burst(tg.x, hy, ['#fff', '#ffe14d', A.ELEMENT_COLORS[at.def.element]], kind === 'nip' ? 5 : 12, 380, { shape: 'star' });
      fx.push({ kind: 'pow', x: tg.x + rand(-10, 10), y: hy + rand(-10, 10), t: 0, life: 0.35, s: kind === 'nip' ? 0.6 : kind === 'mega' ? 1.3 : 1, col: kind === 'mega' ? '#ff4d6d' : '#ffd23f', rot: rand(0, 1) });
      AU.sfx(kind === 'nip' ? 'nip' : 'hit');
      if (tg.hp <= 0) {
        tg.state = 'ko'; tg.vh = 620; tg.kx = dir * 420;
        ko = { winner: at, loser: tg, t: 0 };
        slow = 1.1; shake = 16;
        AU.sfx('ko'); AU.sfx('boom');
        setTimeout(() => AU.say('K.O.!', { rate: 0.9 }), 150);
        finishMatch(at === P);
      }
    }

    let result = null;
    function finishMatch(won) {
      if (ended) return; ended = true;
      result = { won, pid: pdef.id, oid: odef.id, coach: !!p.coach, newId: null, oSize, pSize: P.size };
      if (won) {
        S.wins++;
        if (!S.unlocked.includes(odef.id)) { S.unlocked.push(odef.id); result.newId = odef.id; }
        save();
      }
    }

    function tryPunch(f, o) {
      if (o.state === 'ko') return;
      const dx = (o.x - f.x) * f.facing, reach = 72 * f.sc;
      if (dx > -12 && dx < reach + 22 * o.sc && Math.abs(o.z - f.z) < 34 && Math.abs(o.h - f.h) < 80) { f.hitDone = true; hit(o, f, 7 * f.pow, 'punch'); }
    }
    function shoot(f, o) {
      const dx = o.x - f.x, dz = o.z - f.z, l = Math.hypot(dx, dz) || 1;
      projs.push({ x: f.x + f.facing * 34 * f.sc, z: f.z, h: f.h + 66 * f.sc, vx: (dx / l) * 560, vz: (dz / l) * 560, el: f.def.element, r: 13 * f.sc, dmg: 10 * f.pow, owner: f, target: o, life: 1.8, t: 0 });
    }
    function startMega(f, o) {
      mega = { f, o, t: 0, n: 0 };
      f.meter = 0; f.state = 'power'; f.st = 0.2; f.fired = true;
      AU.sfx('mega');
      AU.say('Mega Max!', { rate: 0.85, pitch: 1.1 });
      flashScreen = 1; shake = 8; hype = 1;
    }

    function aiCtl(f, o, dt, diff, coached) {
      const c = { mx: 0, mz: 0, jump: false, punch: false, power: false, mega: false };
      const ai = f.ai;
      const dx = o.x - f.x, dz = o.z - f.z, dist = Math.hypot(dx, dz * 1.6), reach = 66 * f.sc + 20 * o.sc;
      const steer = () => { const l = Math.hypot(dx, dz) || 1; if (dist > reach * 0.8) { c.mx = dx / l; c.mz = clamp((dz / l) * 1.6, -1, 1); } else if (Math.abs(dz) > 18) c.mz = Math.sign(dz); };
      if (ai.dodgeT > 0) { ai.dodgeT -= dt; c.mx = -Math.sign(dx) * 0.6; c.mz = ai.dodgeDir; return c; }
      if (coached && ai.order) {
        ai.orderT -= dt;
        const busy = f.stun > 0 || f.state === 'punch' || f.state === 'power';
        if (busy) { if (ai.orderT <= 0) ai.order = null; return c; }
        const ord = ai.order;
        if (ord === 'punch') { if (dist < reach && Math.abs(dz) < 28) { c.punch = true; ai.order = null; } else steer(); }
        else if (ord === 'power') { if (Math.abs(dz) < 22 || ai.orderT < 1.2) { c.power = f.powerCd <= 0; if (f.powerCd <= 0) ai.order = null; } else c.mz = Math.sign(dz); }
        else if (ord === 'dodge') { c.jump = true; ai.dodgeT = 0.45; ai.dodgeDir = f.z > AR.cz ? -1 : 1; ai.order = null; }
        else if (ord === 'mega') { c.mega = true; ai.order = null; }
        if (ai.orderT <= 0) ai.order = null;
        return c;
      }
      ai.t -= dt;
      if (ai.t <= 0) {
        ai.t = 0.5 - 0.28 * diff + Math.random() * 0.3;
        const r = Math.random();
        if (!coached && f.meter >= 100 && f.buddy && r < 0.25 + 0.5 * diff) ai.act = 'mega';
        else if (dist > reach + 30) ai.act = (f.powerCd <= 0 && r < 0.18 + 0.25 * diff) ? 'power' : r < 0.85 ? 'approach' : 'circle';
        else ai.act = r < 0.28 + 0.45 * diff ? 'punch' : r < 0.78 ? 'retreat' : 'jump';
        // dodge incoming fireballs sometimes
        if (projs.some((pj) => pj.target === f && Math.abs(pj.x - f.x) < 220) && Math.random() < diff * 0.6) { c.jump = true; ai.dodgeT = 0.35; ai.dodgeDir = Math.random() < 0.5 ? -1 : 1; }
      }
      switch (ai.act) {
        case 'approach': steer(); break;
        case 'circle': c.mz = Math.sin(f.t * 1.3) > 0 ? 1 : -1; c.mx = Math.sign(dx) * 0.25; break;
        case 'retreat': c.mx = -Math.sign(dx); c.mz = -Math.sign(dz) * 0.4; break;
        case 'punch': if (Math.abs(dz) < 28 && dist < reach + 10) { c.punch = true; ai.act = 'wait'; } else steer(); break;
        case 'power': if (Math.abs(dz) < 24) { c.power = true; ai.act = 'wait'; } else c.mz = Math.sign(dz); break;
        case 'jump': c.jump = true; steer(); ai.act = 'approach'; break;
        case 'mega': c.mega = true; ai.act = 'wait'; break;
      }
      return c;
    }

    function updFighter(f, c, o, dt) {
      f.t += dt; f.punchCd -= dt; f.powerCd -= dt; f.cheerCd -= dt; f.flash -= dt; f.inv -= dt;
      f.shownHp = lerp(f.shownHp, f.hp, Math.min(1, dt * 6));
      const grounded = f.h <= 0;
      if (f.state === 'ko') {
        f.vh -= 2300 * dt; f.h = Math.max(0, f.h + f.vh * dt); if (f.h === 0) f.vh = 0;
        f.x += f.kx * dt; f.kx *= Math.pow(0.05, dt); clampArena(f);
        return;
      }
      let mx = 0, mz = 0;
      if (f.stun > 0) { f.stun -= dt; f.state = 'hurt'; if (f.stun <= 0) f.state = 'idle'; }
      else if (f.state === 'punch') { f.st += dt; if (!f.hitDone && f.st > 0.07 && f.st < 0.18) tryPunch(f, o); if (f.st > 0.3) f.state = 'idle'; }
      else if (f.state === 'power') { f.st += dt; if (!f.fired && f.st > 0.16) { f.fired = true; shoot(f, o); } if (f.st > 0.42) f.state = 'idle'; }
      else {
        mx = c.mx; mz = c.mz;
        if (c.punch && f.punchCd <= 0) { f.state = 'punch'; f.st = 0; f.hitDone = false; f.punchCd = 0.32; AU.sfx('swing'); }
        else if (c.power && f.powerCd <= 0) { f.state = 'power'; f.st = 0; f.fired = false; f.powerCd = f.powerCdMax || 1.4; AU.sfx('power'); }
        else if (c.mega) {
          if (f.buddy && f.meter >= 100) { startMega(f, o); return; }
          if (!f.isCPU && hintCd <= 0) { hintCd = 2.5; AU.sfx('nope'); AU.say(f.buddy ? 'Not ready yet!' : 'Find a buddy on Buddy Island!'); }
        }
        if (c.jump && grounded) { f.vh = 800; AU.sfx('jump'); }
        if (f.state === 'idle' || f.state === 'walk' || f.state === 'jump' || f.state === 'hurt') {
          f.state = !grounded ? 'jump' : Math.abs(mx) + Math.abs(mz) > 0.1 ? 'walk' : 'idle';
        }
        if (Math.abs(o.x - f.x) > 6) f.facing = o.x > f.x ? 1 : -1;
      }
      if (f.state === 'punch' || f.state === 'power') { mx *= 0.2; mz *= 0.2; }
      const sp = 250 * f.spd;
      f.x += (mx * sp + f.kx) * dt;
      f.z += (mz * sp * 0.6 + f.kz) * dt;
      f.kx *= Math.pow(0.004, dt); f.kz *= Math.pow(0.004, dt);
      f.vh -= 2300 * dt; f.h += f.vh * dt; if (f.h < 0) { f.h = 0; f.vh = 0; }
      clampArena(f);
    }

    function updBuddy(f, o, dt) {
      const b = f.buddy; if (!b) return;
      b.t += dt; b.cd -= dt;
      const hx = f.x - f.facing * 62 * f.sc, hz = f.z - 16;
      const go2 = (tx, tz, sp) => { const dx = tx - b.x, dz = tz - b.z, d = Math.hypot(dx, dz); if (d < sp) { b.x = tx; b.z = tz; return true; } b.x += (dx / d) * sp; b.z += (dz / d) * sp; return false; };
      if (b.state === 'follow') {
        go2(hx, hz, 330 * dt); b.facing = f.facing;
        if (b.cd <= 0 && o.state !== 'ko' && f.state !== 'ko' && Math.hypot(o.x - b.x, (o.z - b.z) * 2) < 320) { b.state = 'nip'; b.nipT = 0; }
      } else if (b.state === 'nip') {
        b.nipT += dt;
        const dx = o.x - b.x, dz = o.z - b.z, d = Math.hypot(dx, dz);
        b.facing = dx > 0 ? 1 : -1;
        if (d < 24 * o.sc + 16) { hit(o, f, 3 * f.pow, 'nip'); b.state = 'return'; b.cd = 3 + Math.random() * 1.5; }
        else go2(o.x, o.z, 620 * dt);
        if (b.nipT > 1.2 || o.state === 'ko') { b.state = 'return'; b.cd = 2; }
      } else if (go2(hx, hz, 420 * dt)) b.state = 'follow';
    }

    function updProjs(dt) {
      for (const pj of projs) {
        pj.t += dt; pj.life -= dt;
        if (pj.homing) {
          const tg = pj.target, dx = tg.x - pj.x, dz = tg.z - pj.z, d = Math.hypot(dx, dz) || 1, sp = 900;
          pj.x += (dx / d) * sp * dt; pj.z += (dz / d) * sp * dt;
          pj.h = lerp(pj.h, tg.h + 60 * tg.sc, Math.min(1, dt * 6));
          if (d < 40) { pj.life = 0; hit(tg, pj.owner, pj.dmg, 'mega'); if (pj.last) { AU.sfx('boom'); shake = 16; burst(tg.x, tg.z - 60, ['#fff', '#ffe14d', '#ff4d6d', '#4cc9f0'], 30, 520, { shape: 'star' }); } }
          continue;
        }
        pj.x += pj.vx * dt; pj.z += pj.vz * dt;
        const tg = pj.target;
        if (tg.state !== 'ko' && Math.abs(pj.x - tg.x) < pj.r + 22 * tg.sc && Math.abs(pj.z - tg.z) < 30 && tg.h < 90) {
          pj.life = 0; hit(tg, pj.owner, pj.dmg, 'power');
        }
        if (pj.x < -60 || pj.x > W + 60 || pj.z < zTop - 40 || pj.z > zBot + 40) pj.life = 0;
      }
      // fireballs that bump into each other both pop
      for (let i = 0; i < projs.length; i++) for (let j = i + 1; j < projs.length; j++) {
        const a = projs[i], b = projs[j];
        if (a.life > 0 && b.life > 0 && a.owner !== b.owner && !a.homing && !b.homing && Math.hypot(a.x - b.x, (a.z - b.z) * 2) < a.r + b.r) {
          a.life = b.life = 0; burst((a.x + b.x) / 2, a.z - a.h, ['#fff', '#ffe14d'], 14, 320, { shape: 'star' }); AU.sfx('hit'); shake = 5;
        }
      }
      projs = projs.filter((pj) => pj.life > 0);
    }

    function separate() {
      if (P.state === 'ko' || O.state === 'ko' || P.h > 40 || O.h > 40) return;
      const dx = O.x - P.x, dz = (O.z - P.z) * 1.8, d = Math.hypot(dx, dz), min = 36 * (P.sc + O.sc) / 2;
      if (d < min && d > 0.01) {
        const push = (min - d) / 2, ux = dx / d, uz = dz / d;
        P.x -= ux * push; O.x += ux * push; P.z -= (uz * push) / 1.8; O.z += (uz * push) / 1.8;
      }
    }

    const pressAny = (k) => press.has(k);
    const btnPressed = new Set();
    const tapBtn = (id) => () => { btnPressed.add(id); };

    return {
      noNav: true,
      dbg: { P, O },
      onEsc: () => go('hub'),
      joyZone: (pt) => !P.coached && pt.x < W * 0.45 && pt.y > 150,
      update(dt) {
        t += dt; coach.t += dt; coach.blowT -= dt; hintCd -= dt; flashScreen = Math.max(0, flashScreen - dt * 2.5); hype = Math.max(0, hype - dt * 0.5);
        // UI
        button({ id: 'quit', x: 480, y: 40, r: 22, color: '#3a3f7a', icon: 'home', hold: 0.8, onTap: () => { AU.sfx('tap'); go('hub'); } });
        if (P.coached) {
          const ready = P.buddy && P.meter >= 100;
          const calls = [
            { id: 'c-punch', x: 330, icon: 'fist', color: '#ff4d6d', order: 'punch' },
            { id: 'c-power', x: 440, color: '#4361ee', order: 'power', el: P.def.element, ring: P.powerCd > 0 ? 1 - P.powerCd / 1.4 : null },
            { id: 'c-dodge', x: 550, icon: 'up', color: '#52b788', order: 'dodge' },
            { id: 'c-cheer', x: 660, color: '#f15bb5', order: 'cheer', heart: true },
          ];
          calls.forEach((cb) => button({
            id: cb.id, x: cb.x, y: 488, r: 42, color: cb.color, icon: cb.icon, ring: cb.ring,
            drawIcon: cb.el ? () => A.drawProjectile(ctx, cb.el, 0, 0, 18, T, 1) : cb.heart ? () => { drawHeart(0, 2, 15, '#fff'); } : null,
            onTap: () => coachCall(cb.order),
          }));
          button({
            id: 'c-mega', x: 800, y: 470, r: 58, color: ready ? '#ff006e' : '#5a4f7a', pulse: ready, ring: P.buddy ? P.meter / 100 : null,
            drawIcon: () => drawMegaIcon(P, ready), onTap: () => coachCall('mega'),
          });
        } else {
          const showTouch = usingTouch;
          const ready = P.buddy && P.meter >= 100;
          button({ id: 'b-punch', x: 868, y: 452, r: 52, color: '#ff4d6d', icon: 'fist', hidden: !showTouch, onTap: tapBtn('punch') });
          button({ id: 'b-power', x: 758, y: 482, r: 40, color: '#4361ee', hidden: !showTouch, ring: P.powerCd > 0 ? 1 - P.powerCd / 1.4 : null, drawIcon: () => A.drawProjectile(ctx, P.def.element, 0, 0, 16, T, 1), onTap: tapBtn('power') });
          button({ id: 'b-jump', x: 890, y: 342, r: 38, color: '#52b788', icon: 'up', hidden: !showTouch, onTap: tapBtn('jump') });
          button({ id: 'b-mega', x: 768, y: 372, r: 46, color: ready ? '#ff006e' : '#5a4f7a', pulse: ready, hidden: !showTouch && !ready, ring: P.buddy ? P.meter / 100 : null, drawIcon: () => drawMegaIcon(P, ready), onTap: tapBtn('mega') });
        }

        if (intro > 0) { intro -= dt; }
        if (ko) { ko.t += dt; if (ko.t > 2.6 && !this.left) { this.left = true; go('result', result); } }
        let sdt = dt;
        if (slow > 0) { slow -= dt; sdt *= 0.35; }
        if (hitstop > 0) { hitstop -= dt; sdt = 0; }
        shake = Math.max(0, shake - dt * 30);

        if (mega) {
          mega.t += sdt;
          const f = mega.f, o = mega.o;
          f.state = 'power'; f.st = 0.2;
          const bx = f.x - f.facing * 80 * f.sc, bz = f.z - 4;
          if (mega.t > 0.8 && mega.n < 7 && mega.t > 0.8 + mega.n * 0.14) {
            const last = mega.n === 6;
            projs.push({ x: bx + f.facing * 40, z: bz, h: 170 * f.sc, el: f.buddy.def.element, r: last ? 30 : 20, dmg: (last ? 10 : 4.5) * f.pow, owner: f, target: o, life: 3, t: 0, homing: true, last });
            AU.sfx('power');
            mega.n++;
          }
          updProjs(sdt); updParts(sdt);
          if (f.buddy) { f.buddy.t += sdt; }
          P.t += sdt; O.t += sdt;
          if (mega.t > 2.3 && !projs.some((pj) => pj.homing)) {
            if (o.state !== 'ko') { o.stun = 0.3; }
            f.state = 'idle'; mega = null;
          }
          if (ko) { updFighter(ko.loser, {}, ko.winner, sdt); }
          press.clear(); btnPressed.clear();
          return;
        }

        const canAct = intro <= 0 && !ko;
        let pc;
        if (P.coached) pc = canAct ? aiCtl(P, O, sdt, 0.45, true) : { mx: 0, mz: 0 };
        else {
          const mv = canAct ? moveVec() : { x: 0, z: 0 };
          const pr = (k) => canAct && (pressAny(k) || btnPressed.has(k));
          pc = { mx: mv.x, mz: mv.z, jump: pr('jump'), punch: pr('punch'), power: pr('power'), mega: pr('mega') };
        }
        if (P.coached && canAct) {
          ['punch', 'power', 'cheer', 'mega'].forEach((k) => { if (pressAny(k)) coachCall(k); });
          if (pressAny('jump')) coachCall('dodge');
        }
        const oc = canAct ? aiCtl(O, P, sdt, D, false) : { mx: 0, mz: 0 };
        if (sdt > 0) {
          updFighter(P, pc, O, sdt); updFighter(O, oc, P, sdt);
          updBuddy(P, O, sdt); updBuddy(O, P, sdt);
          separate();
          updProjs(sdt);
        }
        updParts(dt);
        if (P.buddy) P.buddy.t += 0; // (animated in updBuddy)
        btnPressed.clear();
      },
      draw() {
        ctx.save();
        if (shake > 0) ctx.translate(rand(-shake, shake), rand(-shake, shake));
        drawArena(t, hype);
        if (mega) {
          ctx.fillStyle = `rgba(20,5,40,${Math.min(0.6, mega.t * 1.5)})`; ctx.fillRect(-20, -20, W + 40, H + 40);
          const f = mega.f, bx = f.x - f.facing * 80 * f.sc, bz = f.z - 4;
          ctx.save(); ctx.translate(bx, bz - 120 * f.sc); ctx.rotate(mega.t * 1.5);
          for (let i = 0; i < 18; i++) {
            ctx.fillStyle = i % 2 ? 'rgba(255,214,10,0.25)' : 'rgba(255,0,110,0.22)';
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 700, (i / 18) * Math.PI * 2, ((i + 1) / 18) * Math.PI * 2); ctx.closePath(); ctx.fill();
          }
          ctx.restore();
        }
        // draw everything sorted by depth
        const list = [];
        [P, O].forEach((f) => {
          list.push({ z: f.z, d: () => {
            const ps = persp(f.z);
            A.drawShadow(ctx, f.x, f.z, f.sc * ps * (1 - Math.min(0.5, f.h / 400)));
            if (f.rage > 0 && f.state !== 'ko') {
              // the tougher the level, the angrier the red glow
              const gy = f.z - f.h - 60 * f.sc * ps, gr = 95 * f.sc * ps * (1 + Math.sin(t * 6) * 0.06);
              const g = ctx.createRadialGradient(f.x, gy, 10, f.x, gy, gr);
              g.addColorStop(0, `rgba(255,40,60,${0.15 + 0.4 * f.rage})`); g.addColorStop(1, 'rgba(255,40,60,0)');
              ctx.fillStyle = g; ctx.beginPath(); ctx.arc(f.x, gy, gr, 0, Math.PI * 2); ctx.fill();
            }
            A.drawFighter(ctx, f.def, { x: f.x, y: f.z - f.h, scale: f.sc * ps, facing: f.facing, pose: f.state === 'hurt' && f.stun <= 0 ? 'idle' : f.state, t: f.t, flash: f.flash > 0 });
            if (f.boss && f.state !== 'ko') drawCrown(f.x + 4 * f.facing * f.sc * ps, f.z - f.h - 142 * f.sc * ps, 0.9 * f.sc * ps);
          } });
          if (f.buddy) {
            const b = f.buddy;
            const giant = mega && mega.f === f;
            list.push({ z: giant ? f.z - 30 : b.z, d: () => {
              if (giant) {
                const k = easeOutElastic(Math.min(1, mega.t / 0.7));
                const bx = f.x - f.facing * 80 * f.sc;
                A.drawBuddy(ctx, b.def, { x: bx, y: f.z - 4, scale: (0.6 + 2.2 * k) * f.sc, t: b.t, facing: f.facing, mood: 'happy' });
              } else {
                const ps = persp(b.z);
                A.drawShadow(ctx, b.x, b.z, 0.5 * ps);
                A.drawBuddy(ctx, b.def, { x: b.x, y: b.z, scale: 0.7 * ps * (0.9 + 0.1 * f.size), t: b.t, facing: b.facing, mood: b.state === 'follow' ? 'idle' : 'hop' });
              }
            } });
          }
        });
        projs.forEach((pj) => list.push({ z: pj.z + 1, d: () => {
          if (!pj.homing) A.drawShadow(ctx, pj.x, pj.z, 0.35, 0.18);
          A.drawProjectile(ctx, pj.el, pj.x, pj.z - pj.h, pj.r, pj.t, Math.sign(pj.vx || (pj.target.x - pj.x)) || 1);
        } }));
        list.sort((a, b) => a.z - b.z).forEach((it) => it.d());
        drawParts(0); drawFx(0);
        ctx.restore();

        if (P.coached) drawCoach(96, 520, 0.95, coach.t, coach.blowT > 0, 1);
        if (P.coached && coach.blowT > 0 && coach.call) {
          // speech bubble showing the call
          ctx.save(); ctx.translate(150, 300);
          A.ell(ctx, 0, 0, 44, 36); A.fs(ctx, '#fff');
          A.poly(ctx, [-20, 24, -36, 52, -2, 32]); ctx.fillStyle = '#fff'; ctx.fill();
          const ic = { punch: 'fist', dodge: 'up', mega: 'blast' }[coach.call];
          if (coach.call === 'power') A.drawProjectile(ctx, P.def.element, 0, 0, 18, T, 1);
          else if (coach.call === 'cheer') drawHeart(0, 2, 16, '#ff4d6d');
          else A.drawIcon(ctx, ic, 0, 0, 40, '#1d1b2f');
          ctx.restore();
        }

        drawHUD(P, 1); drawHUD(O, -1);
        drawLevelBadge(W - 150, 130, O.level, O.boss, 1);

        if (mega && mega.t < 2.0) {
          const k = easeOutBack(Math.min(1, mega.t / 0.35));
          ctx.save(); ctx.translate(480, 150); ctx.rotate(Math.sin(mega.t * 10) * 0.04); ctx.scale(k, k);
          bigText('MEGAMAX!', 0, 0, 84, null, { rainbow: true, shift: mega.t });
          ctx.restore();
        }
        if (intro > 0) {
          const k = easeOutBack(clamp((1.7 - intro) / 0.4, 0, 1));
          ctx.save(); ctx.globalAlpha = clamp(intro * 3, 0, 1);
          ctx.translate(480, 230); ctx.scale(k, k);
          if (intro > 0.7) {
            bigText(boss && intro < 1.5 ? 'BOSS!' : `LEVEL ${L}`, 0, 0, 96, boss && intro < 1.5 ? '#ff4d6d' : '#ffe14d');
            if (!(boss && intro < 1.5)) drawLevelBadge(0, 90, L, boss, 1.1);
          } else bigText('FIGHT!', 0, 0, 100, '#ffe14d');
          ctx.restore();
        }
        if (ko && ko.t < 2.4) {
          const k = easeOutBack(clamp(ko.t / 0.4, 0, 1));
          ctx.save(); ctx.translate(480, 220); ctx.scale(k, k); bigText('K.O.!', 0, 0, 120, '#ff4d6d'); ctx.restore();
        }
        if (flashScreen > 0) { ctx.fillStyle = `rgba(255,255,255,${flashScreen * 0.8})`; ctx.fillRect(0, 0, W, H); }
        // joystick
        if (!P.coached && usingTouch) {
          const bx = joy ? joy.bx : 120, by = joy ? joy.by : 440;
          ctx.save(); ctx.globalAlpha = joy ? 0.6 : 0.3;
          A.ell(ctx, bx, by, 62, 62); ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.stroke();
          const kx = joy ? joy.x : bx, ky = joy ? joy.y : by;
          A.ell(ctx, kx, ky, 30, 30); ctx.fillStyle = '#fff'; ctx.fill();
          ctx.restore();
        }
      },
    };
  }

  function drawCrown(x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    A.poly(ctx, [-26, 10, -30, -18, -14, -4, 0, -24, 14, -4, 30, -18, 26, 10]); A.fs(ctx, '#ffd23f');
    [[-30, -18], [0, -24], [30, -18]].forEach(([cx, cy]) => { A.ell(ctx, cx, cy, 5, 5); A.fs(ctx, '#ff4d6d', 3); });
    ctx.restore();
  }
  // a star with the level number in it (a crown on boss levels)
  function drawLevelBadge(x, y, lv, boss, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(Math.sin(T * 2) * 0.06);
    A.star(ctx, 0, 0, 34, 5, 0.55); A.fs(ctx, boss ? '#ff4d6d' : '#ffd23f', 4);
    if (boss) drawCrown(0, -34, 0.55);
    bigText(String(lv), 0, 3, lv > 99 ? 20 : 28, '#fff');
    ctx.restore();
  }

  function drawMegaIcon(f, ready) {
    if (f.buddy) {
      A.drawBuddy(ctx, f.buddy.def, { x: 0, y: 18, scale: 0.75, t: T, mood: ready ? 'happy' : 'idle', silhouette: false, alpha: ready ? 1 : 0.65 });
      if (ready) { ctx.fillStyle = '#ffe14d'; A.star(ctx, 22, -22, 10, 5, 0.45); ctx.fill(); }
    } else {
      A.drawBuddy(ctx, BUDDIES[0], { x: 0, y: 18, scale: 0.75, t: T, silhouette: true });
      ctx.fillStyle = '#fff'; ctx.font = '900 26px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('?', 0, -2);
    }
  }

  function drawPortrait(def, x, y, r, size) {
    ctx.save();
    A.ell(ctx, x, y, r, r); A.fs(ctx, A.shade(def.body, 0.55));
    ctx.save(); A.ell(ctx, x, y, r - 2, r - 2); ctx.clip();
    A.drawFighter(ctx, def, { x: x - 3, y: y + r * 3.0, scale: r / 34, facing: 1, pose: 'idle', t: 0 });
    ctx.restore();
    A.ell(ctx, x, y, r, r); ctx.lineWidth = 4; ctx.strokeStyle = A.OUT; ctx.stroke();
    ctx.restore();
    if (size) drawPips(x, y + r + 10, size, 4, 6);
  }
  function drawPips(x, y, n, max, r) {
    for (let i = 0; i < max; i++) {
      const px = x + (i - (max - 1) / 2) * (r * 2.6);
      A.ell(ctx, px, y, r, r); A.fs(ctx, i < n ? '#ffe14d' : 'rgba(255,255,255,0.18)', 2.5);
    }
  }

  function drawHUD(f, side) {
    const px = side > 0 ? 62 : W - 62, py = 56;
    drawPortrait(f.def, px, py, 36, f.size);
    const bw = 280 + 20 * (f.size - 1), bx = side > 0 ? 108 : W - 108 - bw, by = 26;
    ctx.save();
    A.rrect(ctx, bx, by, bw, 26, 13); A.fs(ctx, '#2a2745', 4);
    const k = f.shownHp / f.maxHp, k2 = f.hp / f.maxHp;
    const col = k2 > 0.5 ? '#52d273' : k2 > 0.25 ? '#ffd23f' : '#ff4d6d';
    ctx.save(); A.rrect(ctx, bx + 3, by + 3, bw - 6, 20, 10); ctx.clip();
    ctx.fillStyle = '#fff';
    if (side > 0) ctx.fillRect(bx + 3, by + 3, (bw - 6) * k, 20); else ctx.fillRect(bx + 3 + (bw - 6) * (1 - k), by + 3, (bw - 6) * k, 20);
    ctx.fillStyle = col;
    if (side > 0) ctx.fillRect(bx + 3, by + 3, (bw - 6) * k2, 20); else ctx.fillRect(bx + 3 + (bw - 6) * (1 - k2), by + 3, (bw - 6) * k2, 20);
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(bx, by + 3, bw, 6);
    ctx.restore();
    // megamax meter (only if they have a buddy)
    if (f.buddy) {
      const mw = 200, mx = side > 0 ? 108 : W - 108 - mw, my = 60;
      A.rrect(ctx, mx, my, mw, 16, 8); A.fs(ctx, '#2a2745', 3);
      ctx.save(); A.rrect(ctx, mx + 2, my + 2, mw - 4, 12, 6); ctx.clip();
      const full = f.meter >= 100;
      const g = ctx.createLinearGradient(mx, 0, mx + mw, 0);
      if (full) ['#ff4d6d', '#ffb703', '#52d273', '#4cc9f0', '#9d4edd'].forEach((c, i) => g.addColorStop((i / 4 + T * 0.8) % 1, c));
      else { g.addColorStop(0, '#9d4edd'); g.addColorStop(1, '#ff006e'); }
      ctx.fillStyle = g;
      const w = (mw - 4) * (f.meter / 100);
      if (side > 0) ctx.fillRect(mx + 2, my + 2, w, 12); else ctx.fillRect(mx + mw - 2 - w, my + 2, w, 12);
      ctx.restore();
      A.drawBuddy(ctx, f.buddy.def, { x: side > 0 ? mx + mw + 22 : mx - 22, y: my + 24, scale: 0.5, t: T, mood: full ? 'happy' : 'idle' });
    }
    ctx.restore();
  }

  // ======================================================================
  // RESULT
  // ======================================================================
  function SceneResult(r) {
    let t = 0;
    const pdef = fighterById(r.pid), ndef = r.newId ? fighterById(r.newId) : null;
    const pst = S.fighters[r.pid];
    const tooSmall = !r.won && r.oSize > pst.size;
    parts = []; fx = [];
    if (r.won) {
      AU.play('menu'); AU.sfx('fanfare');
      AU.say((ndef ? `You won! ${ndef.name} joins your team! ` : 'You won! ') + `Level ${S.wins + 1}!`);
    } else {
      AU.stop(); AU.sfx('lose');
      AU.say(tooSmall ? 'Oh no! Go to Buddy Island to get bigger!' : 'Oh no! Try again!');
    }
    return {
      onEsc: () => go('hub'),
      update(dt) {
        t += dt;
        if (r.won && Math.random() < dt * 14) burst(rand(0, W), -10, ['#ff4d6d', '#ffd23f', '#4cc9f0', '#52d273', '#c3a6ff'], 2, 80, { shape: 'rect', g: 160, life: 3 });
        updParts(dt);
        const fightAgain = () => { AU.sfx('tap'); go('fight', { id: r.pid, coach: r.coach }); };
        const island = () => { AU.sfx('tap'); AU.say('Buddy Island!'); go('island', { id: r.pid }); };
        button({ id: 'again', x: 330, y: 470, r: 46, color: '#ff4d6d', icon: 'again', focus: true, onTap: fightAgain });
        button({ id: 'isl', x: 480, y: 470, r: tooSmall ? 54 : 46, color: '#2ec4b6', pulse: tooSmall, focus: true, drawIcon: () => drawIslandIcon(), onTap: island });
        button({ id: 'hub', x: 630, y: 470, r: 46, color: '#3a3f7a', icon: 'home', focus: true, onTap: () => { AU.sfx('tap'); go('hub'); } });
        topBar({});
      },
      draw() {
        drawMenuBG(t, r.won ? '#5b2a86' : '#2b2d42', r.won ? '#1b1340' : '#111');
        if (r.won) {
          bigText('YOU WIN!', 480, 80, 72, null, { rainbow: true, shift: t * 0.3 });
          // level up: next level badge pops in
          const lk = easeOutBack(clamp((t - 1.2) / 0.5, 0, 1));
          if (lk > 0) { ctx.save(); ctx.translate(480, 300); ctx.scale(lk, lk); drawLevelBadge(0, 0, S.wins + 1, (S.wins + 1) % 5 === 0, 1.6); ctx.restore(); bigText('LEVEL UP!', 480, 380, 34 * lk, '#ffe14d'); }
          if (ndef) {
            A.drawShadow(ctx, 300, 400, 1.3);
            A.drawFighter(ctx, pdef, { x: 300, y: 400, scale: 1.25, facing: 1, pose: 'win', t });
            // new teammate in a star burst
            ctx.save(); ctx.translate(650, 300); ctx.rotate(t);
            ctx.fillStyle = 'rgba(255,225,77,0.35)'; A.star(ctx, 0, 0, 170, 12, 0.6); ctx.fill(); ctx.restore();
            const k = easeOutBack(clamp((t - 0.5) / 0.6, 0, 1));
            A.drawShadow(ctx, 650, 400, 1.4 * k);
            A.drawFighter(ctx, ndef, { x: 650, y: 400, scale: 1.4 * k, facing: -1, pose: 'win', t: t + 1 });
            ctx.save(); ctx.translate(760, 170); ctx.rotate(-0.2 + Math.sin(t * 4) * 0.08);
            ctx.fillStyle = '#ff006e'; A.star(ctx, 0, 0, 46 * k, 10, 0.75); ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = A.OUT; ctx.stroke();
            ctx.restore();
            if (k > 0.5) bigText('NEW!', 760, 170, 26 * k, '#fff');
          } else {
            A.drawShadow(ctx, 480, 400, 1.5);
            A.drawFighter(ctx, pdef, { x: 480, y: 400, scale: 1.5, facing: 1, pose: 'win', t });
          }
          // team strip
          drawPips(480, 128, S.unlocked.length, FIGHTERS.length, 5);
        } else {
          bigText('OH NO!', 480, 90, 72, '#ffd23f');
          A.drawShadow(ctx, 360, 400, 1.3);
          A.drawFighter(ctx, pdef, { x: 360, y: 400, scale: 1.3, facing: 1, pose: 'hurt', t });
          if (tooSmall) {
            // "you need to be bigger" picture: small vs big
            const k = 1 + Math.sin(t * 4) * 0.05;
            ctx.save(); ctx.translate(640, 330); ctx.scale(k, k);
            drawIslandIcon(70);
            ctx.restore();
          }
        }
        drawParts(0);
      },
    };
  }

  function drawIslandIcon(sz) {
    const s = (sz || 40) / 40;
    ctx.save(); ctx.scale(s, s);
    A.ell(ctx, 0, 12, 24, 8); ctx.fillStyle = '#ffe8a3'; ctx.fill();
    ctx.strokeStyle = '#6b4226'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-6, 10); ctx.quadraticCurveTo(-8, -6, -2, -16); ctx.stroke();
    ctx.fillStyle = '#52b788';
    [-0.3, 0.6, 1.6, 2.6].forEach((a) => { ctx.save(); ctx.translate(-2, -16); ctx.rotate(a); ctx.beginPath(); ctx.ellipse(10, 0, 12, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); });
    A.drawBuddy(ctx, BUDDIES[1], { x: 12, y: 14, scale: 0.42, t: T, mood: 'hop' });
    ctx.restore();
  }

  // ======================================================================
  // BUDDY ISLAND (only buddies live here — no enemies)
  // ======================================================================
  let islandBG = null;
  const IW = 2400, IZ0 = 300, IZ1 = 512;
  const ipersp = (z) => 0.78 + 0.3 * (z - IZ0) / (IZ1 - IZ0);

  function SceneIsland(p) {
    AU.play('island');
    const def = fighterById(p.id), st = S.fighters[p.id];
    const pl = { x: 160, z: 420, h: 0, vh: 0, facing: 1, t: 0, state: 'idle', sc: 0.9 + 0.22 * (st.size - 1), spd: def.speed * (1 - 0.06 * (st.size - 1)) };
    let camX = 0, t = 0, caught = null, found = false;
    parts = []; fx = [];

    // scenery
    const bushes = [], rocks = [], palms = [], flowers = [];
    for (let i = 0; i < 9; i++) bushes.push({ x: 360 + i * 230 + rand(-50, 50), z: rand(330, 490), s: rand(0.9, 1.25), rustle: 0, hide: null });
    for (let i = 0; i < 6; i++) rocks.push({ x: rand(250, IW - 150), z: rand(320, 500), s: rand(0.7, 1.2) });
    for (let i = 0; i < 12; i++) palms.push({ x: 80 + i * 210 + rand(-40, 40), z: 302 + rand(0, 10), s: rand(0.85, 1.2), lean: rand(-0.25, 0.25) });
    for (let i = 0; i < 40; i++) flowers.push({ x: rand(0, IW), z: rand(310, 520), c: pick(['#ff4d6d', '#ffd23f', '#ffffff', '#c3a6ff']) });
    const pond = { x: 1420, z: 430, rx: 150, rz: 42 };

    // buddies: prefer ones this fighter doesn't have yet
    const pool = shuffle(BUDDIES.filter((b) => b.id !== st.buddy));
    const crit = pool.slice(0, 5).map((b, i) => {
      const c = { def: b, x: 0, z: 0, h: 0, vh: 0, t: rand(0, 5), state: 'wander', tx: 0, tz: 0, fleeT: 0, tiredT: 0, facing: 1, bush: null };
      if (i < 2) {
        const bush = bushes[2 + i * 4 + Math.floor(rand(0, 2))];
        bush.hide = c; c.bush = bush; c.state = 'hide'; c.x = bush.x; c.z = bush.z + 2;
      } else {
        c.x = 650 + (i - 2) * 650 + rand(-100, 100); c.z = rand(340, 490);
        if (b.id === 'bubbles') { c.x = pond.x + 60; c.z = pond.z + 30; }
      }
      c.tx = c.x; c.tz = c.z;
      return c;
    });
    setTimeout(() => { if (!found) AU.say('Find a buddy!'); }, 500);

    const pSpeed = () => 280 * pl.spd;

    function catchIt(c) {
      found = true;
      caught = { c, t: 0, from: { x: c.x, z: c.z }, oldSize: st.size, newSize: Math.min(4, st.size + 1), grew: st.size < 4 };
      c.state = 'caught';
      AU.sfx('catch');
      AU.say(`You found ${c.def.name}!`);
      st.buddy = c.def.id;
      if (caught.grew) st.size = caught.newSize;
      save();
    }

    return {
      get noNav() { return !caught; },
      dbg: { pl, crit },
      onEsc: () => go('hub'),
      joyZone: (pt) => !caught && pt.y > 120,
      update(dt) {
        t += dt; pl.t += dt;
        topBar({ back: () => { AU.sfx('tap'); go('hub'); } });
        if (!caught) {
          if (usingTouch) button({ id: 'i-jump', x: 880, y: 450, r: 44, color: '#52b788', icon: 'up', onTap: () => press.add('jump') });
          const mv = moveVec();
          pl.x = clamp(pl.x + mv.x * pSpeed() * dt, 40, IW - 40);
          pl.z = clamp(pl.z + mv.z * pSpeed() * 0.6 * dt, IZ0 + 10, IZ1);
          if (Math.abs(mv.x) > 0.1) pl.facing = mv.x > 0 ? 1 : -1;
          if (press.has('jump') && pl.h <= 0) { pl.vh = 760; AU.sfx('jump'); }
          pl.vh -= 2300 * dt; pl.h = Math.max(0, pl.h + pl.vh * dt); if (pl.h === 0) pl.vh = 0;
          pl.state = pl.h > 0 ? 'jump' : Math.hypot(mv.x, mv.z) > 0.1 ? 'walk' : 'idle';
          // splash in the pond
          if (pl.state === 'walk' && Math.hypot((pl.x - pond.x) / pond.rx, (pl.z - pond.z) / pond.rz) < 1 && Math.random() < dt * 12) burst(pl.x, pl.z, '#bde9ff', 3, 160, { up: true, g: 700 });

          for (const c of crit) {
            c.t += dt;
            const dx = c.x - pl.x, dz = c.z - pl.z, d = Math.hypot(dx, dz * 1.5);
            if (c.state === 'hide') {
              if (Math.random() < dt * 0.6) { c.bush.rustle = 0.5; burst(c.bush.x + rand(-20, 20), c.bush.z - 50, '#52b788', 2, 80, { shape: 'leaf', g: 200 }); }
              if (Math.random() < dt * 1.2) burst(c.bush.x + rand(-30, 30), c.bush.z - 90 + rand(-10, 10), '#fff6a0', 1, 30, { shape: 'star', g: -20 });
              if (d < 120) {
                c.state = 'flee'; c.fleeT = 1.6; c.vh = 520; c.bush.hide = null; c.bush.rustle = 1;
                AU.sfx('rustle'); burst(c.x, c.z - 40, ['#52b788', '#2d6a4f'], 12, 260, { shape: 'leaf' });
                AU.say('There it is! Catch it!');
              }
            } else if (c.state === 'wander') {
              const ddx = c.tx - c.x, ddz = c.tz - c.z, dd = Math.hypot(ddx, ddz);
              if (dd < 6) { if (Math.random() < dt) { c.tx = clamp(c.x + rand(-200, 200), 60, IW - 60); c.tz = rand(IZ0 + 20, IZ1 - 10); } }
              else { c.x += (ddx / dd) * 60 * dt; c.z += (ddz / dd) * 40 * dt; c.facing = ddx > 0 ? 1 : -1; }
              if (d < 170) { c.state = 'flee'; c.fleeT = 1.5; c.vh = 380; AU.sfx('jump'); }
            } else if (c.state === 'flee') {
              c.fleeT -= dt;
              const sp = Math.min(230, pSpeed() * 0.78);
              let ux = dx / (d || 1), uz = (dz * 1.5) / (d || 1);
              // cornered at the edge: run along it instead
              if ((c.x < 90 && ux < 0) || (c.x > IW - 90 && ux > 0)) { ux = 0; uz = uz >= 0 ? 1 : -1; }
              c.x = clamp(c.x + ux * sp * dt, 50, IW - 50); c.z = clamp(c.z + uz * sp * 0.6 * dt, IZ0 + 14, IZ1 - 4);
              if (c.z <= IZ0 + 15 || c.z >= IZ1 - 5) c.x = clamp(c.x + Math.sign(ux || 1) * sp * 0.4 * dt, 50, IW - 50);
              c.facing = ux > 0 ? 1 : -1;
              if (c.h <= 0 && Math.random() < dt * 3) c.vh = 300;
              if (c.fleeT <= 0) { c.state = 'tired'; c.tiredT = 1.8; }
            } else if (c.state === 'tired') {
              c.tiredT -= dt;
              if (c.tiredT <= 0) { c.state = 'wander'; c.tx = c.x; c.tz = c.z; }
            }
            c.vh -= 1800 * dt; c.h = Math.max(0, c.h + c.vh * dt); if (c.h === 0) c.vh = 0;
            if (c.state !== 'hide' && Math.hypot(dx, dz * 1.4) < 34 + 18 * pl.sc && pl.h < 70) { catchIt(c); break; }
          }
          bushes.forEach((b) => (b.rustle = Math.max(0, b.rustle - dt)));
        } else {
          caught.t += dt;
          const c = caught.c;
          const k = clamp(caught.t / 0.6, 0, 1);
          c.x = lerp(caught.from.x, pl.x + pl.facing * 30 * pl.sc, k);
          c.z = lerp(caught.from.z, pl.z + 2, k);
          c.h = Math.sin(k * Math.PI) * 120 + k * 55 * pl.sc;
          pl.state = caught.t > 0.6 ? 'hold' : 'idle';
          if (caught.t > 0.6 && !caught.sparkled) { caught.sparkled = true; fx.push({ kind: 'ring', x: pl.x, y: pl.z - 60, r: 120, col: '#ffe14d', t: 0, life: 0.6 }); burst(pl.x, pl.z - 70, ['#ffe14d', '#fff', c.def.color], 20, 300, { shape: 'star' }); }
          if (caught.grew && caught.t > 1.4 && !caught.growSaid) { caught.growSaid = true; AU.sfx('grow'); AU.say('You got bigger!', { queue: true }); }
          if (caught.grew) {
            const g = clamp((caught.t - 1.4) / 1.0, 0, 1);
            const s0 = 0.9 + 0.22 * (caught.oldSize - 1), s1 = 0.9 + 0.22 * (caught.newSize - 1);
            pl.sc = lerp(s0, s1, easeOutElastic(g));
            if (g > 0 && g < 1 && Math.random() < dt * 30) burst(pl.x + rand(-40, 40), pl.z - rand(0, 160) * pl.sc, ['#ffe14d', '#fff'], 1, 120, { shape: 'star', g: -100 });
          }
          if (caught.t > (caught.grew ? 2.6 : 1.6)) {
            button({ id: 'to-fight', x: 400, y: 470, r: 50, color: '#ff4d6d', icon: 'fist', focus: true, pulse: true, onTap: () => { AU.sfx('tap'); go('select', { mode: 'fight', pre: def.id }); } });
            button({ id: 'to-home', x: 560, y: 470, r: 46, color: '#3a3f7a', icon: 'home', focus: true, onTap: () => { AU.sfx('tap'); go('hub'); } });
          }
        }
        camX = clamp(lerp(camX, pl.x - W / 2, Math.min(1, dt * 5)), 0, IW - W);
        updParts(dt);
      },
      draw() {
        drawIslandSky(t, camX);
        // ground
        const gy = 286;
        const gg = ctx.createLinearGradient(0, gy, 0, H);
        gg.addColorStop(0, '#9be36a'); gg.addColorStop(1, '#5cb85c');
        ctx.fillStyle = gg; ctx.fillRect(0, gy, W, H - gy);
        ctx.fillStyle = '#ffe8a3'; ctx.fillRect(0, gy, W, 12);
        // pond
        ctx.save(); ctx.translate(-camX, 0);
        A.ell(ctx, pond.x, pond.z, pond.rx + 8, pond.rz + 6); ctx.fillStyle = '#ffe8a3'; ctx.fill();
        A.ell(ctx, pond.x, pond.z, pond.rx, pond.rz); ctx.fillStyle = '#4cc9f0'; ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) { A.ell(ctx, pond.x + Math.sin(t + i) * 40, pond.z + i * 8 - 8, 30 + i * 10, 4); ctx.stroke(); }
        flowers.forEach((f) => { if (f.x - camX < -20 || f.x - camX > W + 20) return; ctx.fillStyle = f.c; ctx.beginPath(); ctx.arc(f.x, f.z, 4, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(f.x, f.z, 1.6, 0, Math.PI * 2); ctx.fill(); });
        // depth-sorted things
        const list = [];
        palms.forEach((pm) => list.push({ z: pm.z, d: () => drawPalm(pm.x, pm.z, pm.s, pm.lean, t) }));
        rocks.forEach((r) => list.push({ z: r.z, d: () => { const s = r.s * ipersp(r.z); A.poly(ctx, [r.x - 30 * s, r.z, r.x - 22 * s, r.z - 26 * s, r.x + 4 * s, r.z - 36 * s, r.x + 28 * s, r.z - 20 * s, r.x + 32 * s, r.z]); A.fs(ctx, '#a8a29e'); } }));
        crit.forEach((c) => {
          if (c.state === 'hide') {
            const peek = clamp((Math.sin(c.t * 1.3) - 0.2) * 3, 0, 1);
            if (peek > 0) list.push({ z: c.z - 1, d: () => {
              // a buddy peeking up out of the bush
              const s = ipersp(c.z) * c.bush.s;
              A.drawBuddy(ctx, c.def, { x: c.x, y: c.z - lerp(24, 58, peek) * s, scale: 0.85 * s, t: c.t, facing: Math.sin(c.t * 0.7) > 0 ? 1 : -1, mood: 'idle' });
            } });
            return;
          }
          list.push({ z: c.z, d: () => {
            const s = ipersp(c.z);
            if (c.state !== 'caught') A.drawShadow(ctx, c.x, c.z, 0.55 * s);
            A.drawBuddy(ctx, c.def, { x: c.x, y: c.z - c.h, scale: 0.85 * s, t: c.t, facing: c.facing, mood: c.state === 'flee' ? 'hop' : c.state === 'caught' ? 'happy' : 'idle' });
            if (c.state === 'tired') {
              ctx.fillStyle = '#7ad3ff'; ctx.beginPath(); const sx = c.x + 24 * s, sy = c.z - 52 * s - (c.t * 20 % 10);
              ctx.moveTo(sx, sy - 8); ctx.quadraticCurveTo(sx + 6, sy, sx, sy + 4); ctx.quadraticCurveTo(sx - 6, sy, sx, sy - 8); ctx.fill();
            }
          } });
        });
        bushes.forEach((b) => list.push({ z: b.z, d: () => drawBush(b, t) }));
        list.push({ z: pl.z + 0.5, d: () => {
          const s = ipersp(pl.z);
          A.drawShadow(ctx, pl.x, pl.z, pl.sc * s);
          A.drawFighter(ctx, def, { x: pl.x, y: pl.z - pl.h, scale: pl.sc * s, facing: pl.facing, pose: pl.state, t: pl.t });
        } });
        list.sort((a, b) => a.z - b.z).forEach((it) => it.d());
        drawParts(0); drawFx(0);
        ctx.restore();
        // foreground grass
        ctx.fillStyle = '#3f9142';
        for (let i = 0; i < 40; i++) {
          const x = ((i * 97 - camX * 1.25) % (W + 80) + W + 80) % (W + 80) - 40;
          ctx.beginPath(); ctx.moveTo(x - 10, H); ctx.quadraticCurveTo(x - 4, H - 30, x + 2, H - 44 - (i % 3) * 8); ctx.quadraticCurveTo(x + 2, H - 20, x + 12, H); ctx.fill();
        }
        // arrow toward nearest buddy that is off screen
        if (!caught) {
          let best = null, bd = 1e9;
          crit.forEach((c) => { const d = Math.abs(c.x - pl.x); if (d < bd) { bd = d; best = c; } });
          if (best && (best.x - camX < 0 || best.x - camX > W)) {
            const right = best.x > pl.x;
            ctx.save(); ctx.translate(right ? W - 40 : 40, 250 + Math.sin(t * 5) * 8); ctx.scale(right ? 1 : -1, 1);
            A.poly(ctx, [-18, -22, 18, 0, -18, 22]); A.fs(ctx, '#ffe14d');
            ctx.restore();
          }
          // buddy collection progress: how big am I
          drawPortrait(def, 120, 44, 28, st.size);
        } else {
          const k = easeOutBack(clamp((caught.t - 0.6) / 0.4, 0, 1));
          ctx.save(); ctx.translate(480, 110); ctx.scale(k, k);
          bigText(caught.grew && caught.t > 1.4 ? 'BIGGER!' : 'BUDDY!', 0, 0, 70, null, { rainbow: true, shift: t * 0.4 });
          ctx.restore();
          if (caught.t > 1.0) drawPips(480, 170, st.size, 4, 9);
        }
        if (usingTouch && !caught) {
          const bx = joy ? joy.bx : 120, by = joy ? joy.by : 440;
          ctx.save(); ctx.globalAlpha = joy ? 0.6 : 0.3;
          A.ell(ctx, bx, by, 62, 62); ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.stroke();
          A.ell(ctx, joy ? joy.x : bx, joy ? joy.y : by, 30, 30); ctx.fillStyle = '#fff'; ctx.fill();
          ctx.restore();
        }
      },
    };
  }

  function drawIslandSky(t, camX) {
    const g = ctx.createLinearGradient(0, 0, 0, 290);
    g.addColorStop(0, '#5ec8ff'); g.addColorStop(1, '#d8f3ff');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, 290);
    ctx.fillStyle = '#fff3b0'; ctx.beginPath(); ctx.arc(780 - camX * 0.05, 80, 46, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    for (let i = 0; i < 6; i++) {
      const x = ((i * 260 - camX * 0.15 + t * 10) % (W + 300) + W + 300) % (W + 300) - 150, y = 50 + (i % 3) * 40;
      [[0, 0, 30], [28, -10, 36], [60, 0, 28]].forEach(([dx, dy, r]) => { ctx.beginPath(); ctx.arc(x + dx, y + dy, r * 0.8, 0, Math.PI * 2); ctx.fill(); });
    }
    // sea
    ctx.fillStyle = '#2f9fd8'; ctx.fillRect(0, 205, W, 85);
    ctx.fillStyle = '#58b9e8'; ctx.fillRect(0, 205, W, 10);
    // far islands
    ctx.fillStyle = '#4fae76';
    for (let i = 0; i < 5; i++) {
      const x = ((i * 420 - camX * 0.3) % (W + 400) + W + 400) % (W + 400) - 200;
      ctx.beginPath(); ctx.ellipse(x, 212, 110, 26, 0, Math.PI, 0); ctx.fill();
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 2;
    for (let i = 0; i < 14; i++) {
      const x = ((i * 90 - camX * 0.4 + Math.sin(t + i) * 10) % W + W) % W, y = 230 + (i % 4) * 14;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 10, y - 4, x + 20, y); ctx.stroke();
    }
  }
  function drawPalm(x, z, s, lean, t) {
    ctx.save(); ctx.translate(x, z); ctx.scale(s, s);
    ctx.strokeStyle = '#8b5a2b'; ctx.lineWidth = 14; ctx.lineCap = 'round';
    const tx = lean * 120, ty = -170;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(tx * 0.2, -90, tx, ty); ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 3;
    for (let i = 1; i < 7; i++) { const k = i / 7; ctx.beginPath(); ctx.moveTo(tx * k * k - 7, ty * k); ctx.lineTo(tx * k * k + 7, ty * k); ctx.stroke(); }
    ctx.fillStyle = '#2d9a4e';
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + (i - 2.5) * 0.55 + Math.sin(t * 1.5 + i + x) * 0.05;
      ctx.save(); ctx.translate(tx, ty); ctx.rotate(a);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(40, -18, 80, 14); ctx.quadraticCurveTo(40, 4, 0, 0); ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = '#6b4226'; [[-6, 4], [6, 6], [0, 12]].forEach(([dx, dy]) => { ctx.beginPath(); ctx.arc(tx + dx, ty + dy, 7, 0, Math.PI * 2); ctx.fill(); });
    ctx.restore();
  }
  function drawBush(b, t) {
    const s = b.s * ipersp(b.z), w = Math.sin(t * 30) * b.rustle * 6;
    ctx.save(); ctx.translate(b.x + w, b.z);
    const blobs = [[-34, -22, 26], [0, -34, 32], [34, -22, 26], [-16, -12, 24], [18, -12, 24]];
    ctx.fillStyle = A.OUT;
    blobs.forEach(([x, y, r]) => { ctx.beginPath(); ctx.arc(x * s, y * s, (r + 3) * s, 0, Math.PI * 2); ctx.fill(); });
    ctx.fillStyle = '#3c9d4a';
    blobs.forEach(([x, y, r]) => { ctx.beginPath(); ctx.arc(x * s, y * s, r * s, 0, Math.PI * 2); ctx.fill(); });
    ctx.fillStyle = '#58c26a';
    blobs.slice(0, 3).forEach(([x, y, r]) => { ctx.beginPath(); ctx.arc((x - 6) * s, (y - 8) * s, r * 0.45 * s, 0, Math.PI * 2); ctx.fill(); });
    ctx.fillStyle = '#ff4d6d';
    [[-20, -30], [22, -40], [4, -14]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x * s, y * s, 3.5 * s, 0, Math.PI * 2); ctx.fill(); });
    ctx.restore();
  }

  // ======================================================================
  // TITLE / HUB / SELECT
  // ======================================================================
  function SceneTitle() {
    AU.play('menu');
    let t = 0;
    const start = () => { AU.sfx('tap'); AU.say('Mega Max!'); go('hub'); };
    return {
      onEsc: toConsole,
      tapAnywhere: start,
      update(dt) {
        t += dt;
        topBar({ home: toConsole });
        button({ id: 'start', x: 480, y: 452, r: 60, color: '#ff006e', icon: 'play', pulse: true, focus: true, onTap: start });
      },
      draw() {
        drawMenuBG(t);
        const word = 'MEGAMAX';
        for (let i = 0; i < word.length; i++) {
          const x = 480 + (i - 3) * 82, y = 120 + Math.sin(t * 4 + i * 0.6) * 10;
          ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * 3 + i) * 0.06);
          bigText(word[i], 0, 0, 104, ['#ff4d6d', '#ffb703', '#ffe14d', '#52d273', '#4cc9f0', '#9d4edd', '#ff006e'][i]);
          ctx.restore();
        }
        A.drawShadow(ctx, 250, 390, 1.4);
        A.drawFighter(ctx, fighterById('torch'), { x: 250, y: 390, scale: 1.4, facing: 1, pose: Math.sin(t * 1.5) > 0.6 ? 'punch' : 'idle', t });
        A.drawBuddy(ctx, buddyById('ember'), { x: 140, y: 392, scale: 0.9, t, mood: 'hop', facing: 1 });
        A.drawShadow(ctx, 710, 390, 1.4);
        A.drawFighter(ctx, fighterById('boulder'), { x: 710, y: 390, scale: 1.4, facing: -1, pose: Math.sin(t * 1.5 + 2) > 0.6 ? 'power' : 'idle', t: t + 1 });
        A.drawBuddy(ctx, buddyById('mossy'), { x: 820, y: 392, scale: 0.9, t: t + 2, mood: 'hop', facing: -1 });
      },
    };
  }

  function SceneHub() {
    AU.play('menu');
    let t = 0;
    if (!S.seenIntro) {
      S.seenIntro = true; save();
      setTimeout(() => AU.say('Win fights to get more fighters. Find buddies on Buddy Island to get bigger!'), 400);
    }
    const card = (id, x, y, w, h, color, drawInner, onTap) => button({
      id, x, y, w, h, focus: true, onTap,
      draw: (b, isHeld, isFocus) => {
        const k = isHeld ? 0.96 : 1 + Math.sin(T * 2 + x) * 0.008;
        ctx.translate(x + w / 2, y + h / 2); ctx.scale(k, k); ctx.translate(-w / 2, -h / 2);
        if (isFocus) { A.rrect(ctx, -8, -8, w + 16, h + 16, 34); ctx.fillStyle = '#ffe14d'; ctx.fill(); }
        A.rrect(ctx, 0, 8, w, h, 28); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();
        A.rrect(ctx, 0, 0, w, h, 28); A.fs(ctx, color, 6);
        ctx.save(); A.rrect(ctx, 10, 10, w - 20, h - 20, 20); ctx.clip(); drawInner(w, h); ctx.restore();
        A.rrect(ctx, 10, 10, w - 20, h - 20, 20); ctx.lineWidth = 4; ctx.strokeStyle = A.OUT; ctx.stroke();
      },
    });
    return {
      onEsc: toConsole,
      update(dt) {
        t += dt;
        topBar({ home: toConsole });
        card('arena', 70, 86, 400, 290, '#ff4d6d', (w, h) => {
          const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#2b1055'); g.addColorStop(1, '#a4508b'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
          A.ell(ctx, w / 2, h - 50, 170, 40); ctx.fillStyle = '#e8c27e'; ctx.fill();
          A.drawFighter(ctx, fighterById('torch'), { x: w / 2 - 70, y: h - 46, scale: 1, facing: 1, pose: Math.sin(T * 2) > 0.3 ? 'punch' : 'idle', t: T });
          A.drawFighter(ctx, fighterById('volt'), { x: w / 2 + 70, y: h - 46, scale: 1, facing: -1, pose: Math.sin(T * 2) > 0.3 ? 'hurt' : 'idle', t: T + 1, silhouette: !S.unlocked.includes('volt') });
          ctx.save(); ctx.translate(w / 2, 52); ctx.rotate(Math.sin(T * 3) * 0.1); ctx.fillStyle = '#ffe14d'; A.star(ctx, 0, 0, 30, 8, 0.5); ctx.fill(); ctx.restore();
        }, () => { AU.sfx('tap'); AU.say('Arena!'); go('select', { mode: 'fight' }); });
        card('island', 490, 86, 400, 290, '#2ec4b6', (w, h) => {
          const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#5ec8ff'); g.addColorStop(1, '#d8f3ff'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
          ctx.fillStyle = '#2f9fd8'; ctx.fillRect(0, h * 0.55, w, h * 0.45);
          A.ell(ctx, w / 2, h - 30, 190, 60); ctx.fillStyle = '#ffe8a3'; ctx.fill();
          A.ell(ctx, w / 2, h - 34, 170, 46); ctx.fillStyle = '#7fd36a'; ctx.fill();
          drawPalm(w / 2 - 60, h - 50, 0.8, 0.15, T);
          BUDDIES.slice(0, 4).forEach((b, i) => A.drawBuddy(ctx, b, { x: w / 2 - 40 + i * 50, y: h - 30 - (i % 2) * 14, scale: 0.7, t: T + i, mood: 'hop', facing: i % 2 ? -1 : 1 }));
        }, () => { AU.sfx('tap'); AU.say('Buddy Island!'); go('select', { mode: 'island' }); });
      },
      draw() {
        drawMenuBG(t);
        // wins
        bigText('LEVEL', 440, 44, 34, '#fff');
        drawLevelBadge(530, 44, S.wins + 1, (S.wins + 1) % 5 === 0, 0.8);
        // team strip
        // the whole team: unlocked fighters in color, the rest as shadows
        A.rrect(ctx, 70, 398, 820, 134, 24); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fill();
        const perRow = Math.ceil(FIGHTERS.length / 2);
        FIGHTERS.forEach((d, i) => {
          const x = 102 + (i % perRow) * (756 / (perRow - 1)), y = i < perRow ? 462 : 522;
          const have = S.unlocked.includes(d.id), st = S.fighters[d.id];
          const s = 0.3 + 0.035 * (st.size - 1);
          A.drawFighter(ctx, d, { x, y, scale: s, facing: 1, pose: 'idle', t: t + i, silhouette: !have });
          if (!have) A.drawIcon(ctx, 'lock', x, y - 22, 13, '#9d8fd0');
        });
      },
    };
  }

  function SceneSelect(p) {
    AU.play('menu');
    let t = 0, how = p.pre ? p.pre : null;
    const mode = p.mode;
    const PER = 8, pages = Math.ceil(FIGHTERS.length / PER);
    let page = 0;
    if (how) setTimeout(() => AU.say('Do you want to fight, or be the coach?'), 300);
    else setTimeout(() => AU.say('Pick a fighter!'), 250);
    const choose = (d) => {
      AU.sfx('tap');
      if (mode === 'island') { AU.say(d.name + '!'); go('island', { id: d.id }); return; }
      how = d.id; focusIdx = -1;
      AU.say(`${d.name}! Do you want to fight, or be the coach?`);
    };
    return {
      onEsc: () => { if (how) how = null; else go('hub'); },
      update(dt) {
        t += dt;
        if (how) {
          topBar({ back: () => { AU.sfx('tap'); how = null; } });
          const d = fighterById(how);
          const panel = (id, x, color, inner, onTap) => button({ id, x, y: 110, w: 330, h: 330, focus: true, onTap, draw: (b, isHeld, isFocus) => {
            const k = isHeld ? 0.96 : 1;
            ctx.translate(x + 165, 275); ctx.scale(k, k); ctx.translate(-165, -165);
            if (isFocus) { A.rrect(ctx, -8, -8, 346, 346, 36); ctx.fillStyle = '#ffe14d'; ctx.fill(); }
            A.rrect(ctx, 0, 8, 330, 330, 30); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();
            A.rrect(ctx, 0, 0, 330, 330, 30); A.fs(ctx, color, 6);
            inner();
          } });
          panel('me', 120, '#4361ee', () => {
            A.drawShadow(ctx, 165, 250, 1.2);
            A.drawFighter(ctx, d, { x: 165, y: 250, scale: 1.2, facing: 1, pose: Math.sin(T * 2) > 0.4 ? 'punch' : 'idle', t: T });
            drawPad(165, 290, 1.1);
          }, () => { AU.sfx('tap'); AU.say('You fight!'); go('fight', { id: how, coach: false }); });
          panel('coach', 510, '#f15bb5', () => {
            A.drawShadow(ctx, 230, 280, 1.0);
            A.drawFighter(ctx, d, { x: 230, y: 280, scale: 0.95, facing: -1, pose: 'idle', t: T });
            drawCoach(110, 300, 1.15, T, Math.sin(T * 2.5) > 0.3, 1);
          }, () => { AU.sfx('whistle'); AU.say("You're the coach!"); go('fight', { id: how, coach: true }); });
          return;
        }
        topBar({ back: () => { AU.sfx('tap'); go('hub'); } });
        const turn = (dir) => () => { AU.sfx('tap'); page = (page + dir + pages) % pages; focusIdx = -1; };
        button({ id: 'pg-l', x: 40, y: 300, r: 30, color: '#ff4d6d', icon: 'left', focus: true, onTap: turn(-1) });
        button({ id: 'pg-r', x: 920, y: 300, r: 30, color: '#ff4d6d', icon: 'right', focus: true, onTap: turn(1) });
        FIGHTERS.slice(page * PER, page * PER + PER).forEach((d, j) => {
          const i = page * PER + j;
          const col = j % 4, row = Math.floor(j / 4);
          const x = 80 + col * 205, y = 96 + row * 210, w = 185, h = 194;
          const have = S.unlocked.includes(d.id), st = S.fighters[d.id];
          button({ id: 'f-' + d.id, x, y, w, h, focus: have, onTap: () => {
            if (have) choose(d);
            else { AU.sfx('nope'); AU.say('Win fights to unlock!'); }
          }, draw: (b, isHeld, isFocus) => {
            const k = isHeld ? 0.95 : 1;
            ctx.translate(x + w / 2, y + h / 2); ctx.scale(k, k); ctx.translate(-w / 2, -h / 2);
            if (isFocus) { A.rrect(ctx, -7, -7, w + 14, h + 14, 28); ctx.fillStyle = '#ffe14d'; ctx.fill(); }
            A.rrect(ctx, 0, 6, w, h, 22); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();
            A.rrect(ctx, 0, 0, w, h, 22); A.fs(ctx, have ? A.shade(d.body, 0.45) : '#3a3558', 5);
            const s = 0.8 + 0.08 * (st.size - 1);
            A.drawShadow(ctx, w / 2, h - 34, s * 0.9);
            A.drawFighter(ctx, d, { x: w / 2 - (have && st.buddy ? 12 : 0), y: h - 34, scale: s, facing: 1, pose: isFocus || isHeld ? 'win' : 'idle', t: T + i, silhouette: !have });
            if (have) {
              if (st.buddy) A.drawBuddy(ctx, buddyById(st.buddy), { x: w - 36, y: h - 30, scale: 0.5, t: T + i, mood: 'idle', facing: -1 });
              drawPips(w / 2, h - 16, st.size, 4, 5);
            } else A.drawIcon(ctx, 'lock', w / 2, 70, 44, '#9d8fd0');
          } });
        });
      },
      draw() {
        drawMenuBG(t, mode === 'island' ? '#0f6d73' : '#3b1c7a', mode === 'island' ? '#0b2f3a' : '#16123a');
        ctx.save(); ctx.translate(480, 44);
        if (mode === 'island') drawIslandIcon(56); else { ctx.fillStyle = '#ff4d6d'; A.star(ctx, 0, 0, 28, 8, 0.5); ctx.fill(); A.drawIcon(ctx, 'fist', 0, 0, 30, '#fff'); }
        ctx.restore();
        if (!how) for (let i = 0; i < pages; i++) { A.ell(ctx, 480 + (i - (pages - 1) / 2) * 26, 524, 7, 7); A.fs(ctx, i === page ? '#ffe14d' : 'rgba(255,255,255,0.25)', 3); }
      },
    };
  }

  // ---------------- scene manager & loop ----------------
  const SCENES = { title: SceneTitle, hub: SceneHub, select: SceneSelect, fight: SceneFight, result: SceneResult, island: SceneIsland };
  let scene = null, fade = 0, fadeDir = 0, nextScene = null, T = 0;
  function go(name, params) { if (fadeDir) return; nextScene = [name, params]; fadeDir = 1; }
  function setScene(name, params) {
    scene = SCENES[name](params || {});
    scene.name = name;
    focusIdx = -1; joy = null;
    pointers.forEach((p) => (p.btn = null));
    press.clear();
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now; T += dt;
    if (fadeDir) {
      fade += fadeDir * dt * 4.5;
      if (fadeDir > 0 && fade >= 1) { fade = 1; setScene(nextScene[0], nextScene[1]); fadeDir = -1; }
      else if (fadeDir < 0 && fade <= 0) { fade = 0; fadeDir = 0; }
    }
    updateHolds();
    ui = [];
    try { scene.update(dt); } catch (e) { console.error(e); }
    press.clear();
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.globalAlpha = 1;
    try { scene.draw(); } catch (e) { console.error(e); }
    drawUI();
    prevUI = ui;
    if (fade > 0) { ctx.fillStyle = `rgba(18,12,36,${fade})`; ctx.fillRect(0, 0, W, H); }
    requestAnimationFrame(frame);
  }

  resize();
  setScene('title');
  requestAnimationFrame(frame);

  // test hooks (used by automated playtests; harmless in normal play)
  window.__mm = { go: (n, p) => setScene(n, p), get S() { return S; }, reset: () => { S = fresh(); save(); }, get scene() { return scene; } };
})();
