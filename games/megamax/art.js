// MegaMax — all drawing (no image files). Characters are drawn from shapes
// so they can scale up smoothly when they grow.
'use strict';

const OUT = '#1d1b2f';

const FIGHTERS = [
  { id: 'boulder', name: 'Boulder', body: '#8d8f99', belly: '#c3c6d1', accent: '#5b5d66', element: 'rock',   speed: 0.92, power: 1.12 },
  { id: 'torch',   name: 'Torch',   body: '#e8452c', belly: '#ffb347', accent: '#ffd23f', element: 'fire',   speed: 1.05, power: 1.0 },
  { id: 'volt',    name: 'Volt',    body: '#ffd23f', belly: '#fff3b0', accent: '#3a86ff', element: 'bolt',   speed: 1.18, power: 0.92 },
  { id: 'ripple',  name: 'Ripple',  body: '#2ec4b6', belly: '#c8f7f0', accent: '#1b6ca8', element: 'water',  speed: 1.0,  power: 1.0 },
  { id: 'sprout',  name: 'Sprout',  body: '#6ab04c', belly: '#d4f5a8', accent: '#3d7a2a', element: 'leaf',   speed: 1.06, power: 0.96 },
  { id: 'frosty',  name: 'Frosty',  body: '#e6f4ff', belly: '#ffffff', accent: '#6cc4ff', element: 'ice',    speed: 0.95, power: 1.1 },
  { id: 'shade',   name: 'Shade',   body: '#7b4fd6', belly: '#c3a6ff', accent: '#2b1a4f', element: 'shadow', speed: 1.15, power: 0.95 },
  { id: 'gizmo',   name: 'Gizmo',   body: '#ff8c2b', belly: '#ffd0a1', accent: '#4a4e69', element: 'gear',   speed: 1.0,  power: 1.05 },
];

const BUDDIES = [
  { id: 'pip',      name: 'Pip',      color: '#ffe066', accent: '#ff9f1c', element: 'bolt' },
  { id: 'mossy',    name: 'Mossy',    color: '#7bd389', accent: '#2d6a4f', element: 'leaf' },
  { id: 'bubbles',  name: 'Bubbles',  color: '#8ecae6', accent: '#219ebc', element: 'water' },
  { id: 'ember',    name: 'Ember',    color: '#ff7b54', accent: '#ffd166', element: 'fire' },
  { id: 'nib',      name: 'Nib',      color: '#b388eb', accent: '#5a189a', element: 'shadow' },
  { id: 'snowpuff', name: 'Snowpuff', color: '#f4fbff', accent: '#8fc9ff', element: 'ice' },
];

const fighterById = (id) => FIGHTERS.find((f) => f.id === id);
const buddyById = (id) => BUDDIES.find((b) => b.id === id);

// ---------- helpers ----------
function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function ell(ctx, x, y, rx, ry, rot) {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot || 0, 0, Math.PI * 2);
}
function fs(ctx, fill, lw) {
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = lw == null ? 4 : lw;
  ctx.strokeStyle = OUT;
  ctx.lineJoin = 'round';
  ctx.stroke();
}
function poly(ctx, pts) {
  ctx.beginPath();
  ctx.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
  ctx.closePath();
}
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const f = (c) => Math.max(0, Math.min(255, Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt)));
  return '#' + ((1 << 24) | (f(r) << 16) | (f(g) << 8) | f(b)).toString(16).slice(1);
}
function flame(ctx, x, y, s, t, outer, inner) {
  const w = Math.sin(t * 14 + x) * 2;
  ctx.beginPath();
  ctx.moveTo(x - 8 * s, y);
  ctx.quadraticCurveTo(x - 9 * s, y - 14 * s, x + w, y - 26 * s);
  ctx.quadraticCurveTo(x + 9 * s, y - 12 * s, x + 8 * s, y);
  ctx.closePath();
  fs(ctx, outer, 3);
  ctx.beginPath();
  ctx.moveTo(x - 4 * s, y - 1);
  ctx.quadraticCurveTo(x - 4 * s, y - 9 * s, x + w * 0.6, y - 16 * s);
  ctx.quadraticCurveTo(x + 4 * s, y - 8 * s, x + 4 * s, y - 1);
  ctx.closePath();
  ctx.fillStyle = inner;
  ctx.fill();
}
function bolt(ctx, x, y, s, fill) {
  poly(ctx, [x + 2 * s, y - 14 * s, x - 7 * s, y + 1 * s, x - 1 * s, y + 1 * s, x - 4 * s, y + 14 * s, x + 7 * s, y - 2 * s, x + 1 * s, y - 2 * s]);
  fs(ctx, fill, 3);
}
function gearShape(ctx, x, y, r, teeth, rot) {
  ctx.beginPath();
  for (let i = 0; i < teeth * 2; i++) {
    const a = rot + (i / (teeth * 2)) * Math.PI * 2;
    const rr = i % 2 ? r * 0.72 : r;
    const a1 = a - Math.PI / (teeth * 2) * 0.5, a2 = a + Math.PI / (teeth * 2) * 0.5;
    ctx.lineTo(x + Math.cos(a1) * rr, y + Math.sin(a1) * rr);
    ctx.lineTo(x + Math.cos(a2) * rr, y + Math.sin(a2) * rr);
  }
  ctx.closePath();
}
function star(ctx, x, y, r, pts, inset, rot) {
  ctx.beginPath();
  for (let i = 0; i < pts * 2; i++) {
    const a = (rot || -Math.PI / 2) + (i / (pts * 2)) * Math.PI * 2;
    const rr = i % 2 ? r * inset : r;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
}

function drawShadow(ctx, x, y, scale, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha == null ? 0.25 : alpha;
  ctx.fillStyle = '#000';
  ell(ctx, x, y, 34 * scale, 8 * scale);
  ctx.fill();
  ctx.restore();
}

// ---------- fighters ----------
// Local frame: origin at the feet, +x = the way they face, -y = up. ~130 units tall.
function drawFighter(ctx, def, o) {
  const t = o.t || 0, pose = o.pose || 'idle';
  const C = (c) => (o.silhouette ? '#2a2745' : o.flash ? '#ffffff' : c);
  ctx.save();
  ctx.translate(o.x, o.y);
  if (o.alpha != null) ctx.globalAlpha *= o.alpha;
  ctx.scale((o.facing || 1) * o.scale, o.scale);

  let bob = 0, legA = 0, legB = 0, lean = 0, armF = 'idle', armB = 'idle';
  const ph = t * 12;
  switch (pose) {
    case 'idle': bob = Math.sin(t * 4) * 2; break;
    case 'walk': legA = Math.sin(ph) * 10; legB = -legA; bob = -Math.abs(Math.sin(ph)) * 3; break;
    case 'jump': legA = -10; legB = 8; armF = 'up'; armB = 'up'; break;
    case 'punch': armF = 'punch'; lean = 0.1; legA = 8; legB = -6; break;
    case 'power': armF = 'cast'; armB = 'cast'; lean = 0.06; break;
    case 'hurt': lean = -0.28; armF = 'flail'; armB = 'flail'; break;
    case 'win': armF = 'up'; armB = 'up'; bob = -Math.abs(Math.sin(t * 6)) * 12; break;
    case 'hold': armF = 'hold'; armB = 'hold'; bob = Math.sin(t * 4) * 2; break;
  }
  if (pose === 'ko') { ctx.translate(0, -24); ctx.rotate(-Math.PI / 2); }
  ctx.translate(0, bob);
  ctx.rotate(lean);

  const body = C(def.body), belly = C(def.belly), acc = C(def.accent), dark = C(shade(def.body, -0.22));
  drawBack(ctx, def, t, C, acc);
  drawArm(ctx, -4, -70, armB, dark, t, false);
  drawLeg(ctx, -12, legB, dark, def);
  drawLeg(ctx, 12, legA, body, def);
  drawTorso(ctx, def, body, belly, acc, t, C);
  drawHead(ctx, def, body, belly, acc, t, pose, C, o);
  drawArm(ctx, 12, -68, armF, body, t, true);
  ctx.restore();
}

function drawLeg(ctx, x, swing, col, def) {
  ctx.save();
  ctx.translate(x, -34);
  ctx.rotate(-swing * 0.035);
  if (def.element === 'shadow') {
    rrect(ctx, -9, 0, 18, 30, 7); fs(ctx, col);
  } else {
    rrect(ctx, -9, 0, 18, 30, 7); fs(ctx, col);
    ell(ctx, 4, 31, 13, 7); fs(ctx, col);
  }
  ctx.restore();
}

function drawArm(ctx, sx, sy, mode, col, t, front) {
  let hx = sx + 14, hy = sy + 28 + Math.sin(t * 4) * 2, fist = 9;
  switch (mode) {
    case 'punch': hx = sx + 62; hy = sy + 2; fist = 13; break;
    case 'cast': hx = sx + 42; hy = sy - 6; fist = 11; break;
    case 'up': hx = front ? sx + 38 : sx - 26; hy = sy - 40; break;
    case 'flail': hx = sx - 16; hy = sy - 30; break;
    case 'hold': hx = sx + 30; hy = sy + 10; break;
  }
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(hx, hy);
  ctx.strokeStyle = OUT; ctx.lineWidth = 20; ctx.stroke();
  ctx.strokeStyle = col; ctx.lineWidth = 12; ctx.stroke();
  ell(ctx, hx, hy, fist, fist); fs(ctx, col);
  if (mode === 'punch' && front) {
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 3;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath(); ctx.moveTo(hx - 30 - i * 6, hy - 10 + i * 10); ctx.lineTo(hx - 50 - i * 6, hy - 10 + i * 10); ctx.stroke();
    }
  }
}

function drawBack(ctx, def, t, C, acc) {
  switch (def.element) {
    case 'fire': {
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-18, -40); ctx.quadraticCurveTo(-52, -34, -56, -58);
      ctx.strokeStyle = OUT; ctx.lineWidth = 16; ctx.stroke();
      ctx.strokeStyle = C(def.body); ctx.lineWidth = 9; ctx.stroke();
      flame(ctx, -56, -58, 0.9, t, C('#ff7b00'), C('#ffd23f'));
      break;
    }
    case 'water':
      ell(ctx, -26, -60, 22, 30); fs(ctx, acc);
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-40, -60); ctx.lineTo(-12, -60); ctx.moveTo(-26, -82); ctx.lineTo(-26, -38); ctx.stroke();
      break;
    case 'shadow': {
      const w = Math.sin(t * 6) * 6;
      ctx.beginPath(); ctx.moveTo(-10, -84); ctx.quadraticCurveTo(-40, -88 + w, -66, -76 + w);
      ctx.lineTo(-62, -66 + w); ctx.quadraticCurveTo(-38, -76 - w, -10, -72); ctx.closePath();
      fs(ctx, C('#ff4d6d'), 3);
      break;
    }
    case 'gear':
      rrect(ctx, -44, -84, 26, 40, 6); fs(ctx, acc);
      ell(ctx, -38, -40 + Math.sin(t * 20) * 2, 5, 4); ctx.fillStyle = C('#ffd23f'); ctx.fill();
      break;
    case 'rock':
      poly(ctx, [-34, -84, -18, -96, -4, -86, -10, -72, -30, -70]); fs(ctx, acc);
      break;
    case 'leaf':
      ctx.beginPath(); ctx.moveTo(-18, -50); ctx.quadraticCurveTo(-46, -46, -50, -70); ctx.quadraticCurveTo(-30, -66, -18, -60); ctx.closePath();
      fs(ctx, acc, 3);
      break;
  }
}

function drawTorso(ctx, def, body, belly, acc, t, C) {
  switch (def.element) {
    case 'rock':
      poly(ctx, [-28, -82, 0, -92, 30, -82, 36, -54, 26, -30, -24, -30, -34, -54]); fs(ctx, body);
      poly(ctx, [-8, -74, 18, -72, 22, -46, -6, -40]); ctx.fillStyle = belly; ctx.fill();
      poly(ctx, [16, -90, 36, -98, 44, -80, 30, -74]); fs(ctx, acc);
      break;
    case 'shadow':
      poly(ctx, [-24, -86, 26, -86, 36, -30, -32, -30]); fs(ctx, body);
      ctx.fillStyle = belly; poly(ctx, [-2, -80, 14, -80, 20, -36, -6, -36]); ctx.fill();
      break;
    case 'gear':
      rrect(ctx, -30, -88, 62, 58, 12); fs(ctx, body);
      rrect(ctx, -10, -76, 32, 30, 6); fs(ctx, belly, 3);
      ctx.fillStyle = C('#3a86ff'); ell(ctx, 6, -61, 6, 6); ctx.fill();
      ctx.fillStyle = OUT; [[-22, -80], [24, -80], [-22, -38], [24, -38]].forEach(([x, y]) => { ell(ctx, x, y, 2.5, 2.5); ctx.fill(); });
      break;
    case 'ice':
      ctx.beginPath();
      for (let i = 0; i <= 12; i++) {
        const a = (i / 12) * Math.PI * 2, r = i % 2 ? 30 : 35;
        ctx.lineTo(Math.cos(a) * r, -58 + Math.sin(a) * r * 0.95);
      }
      ctx.closePath(); fs(ctx, body);
      ell(ctx, 6, -54, 17, 19); ctx.fillStyle = C('#d9f0ff'); ctx.fill();
      break;
    default:
      ell(ctx, 0, -58, 31, 30); fs(ctx, body);
      ell(ctx, 7, -53, 18, 20); ctx.fillStyle = belly; ctx.fill();
      if (def.element === 'bolt') { bolt(ctx, 8, -54, 0.9, acc); }
      if (def.element === 'water') {
        ctx.strokeStyle = shade(def.body, -0.3); ctx.lineWidth = 2.5;
        for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-6, -64 + i * 10); ctx.lineTo(22, -64 + i * 10); ctx.stroke(); }
      }
      if (def.element === 'leaf') {
        ctx.fillStyle = acc;
        poly(ctx, [-30, -40, -16, -28, -4, -40, 8, -28, 20, -40, 32, -30, 28, -48, -28, -48]); ctx.fill();
      }
  }
}

function drawHead(ctx, def, body, belly, acc, t, pose, C, o) {
  const hx = 4, hy = -104;
  // headgear behind head
  if (def.element === 'shadow') {
    ctx.beginPath(); ctx.moveTo(hx - 30, hy + 18); ctx.quadraticCurveTo(hx - 36, hy - 30, hx - 30, hy - 40);
    ctx.quadraticCurveTo(hx + 10, hy - 40, hx + 30, hy + 4); ctx.lineTo(hx + 26, hy + 22); ctx.closePath();
    fs(ctx, body);
  }
  if (def.element === 'leaf') {
    ctx.save(); ctx.translate(hx - 4, hy - 24); ctx.rotate(-0.5 + Math.sin(t * 3) * 0.05);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-22, -10, -30, -34); ctx.quadraticCurveTo(-6, -28, 0, 0); fs(ctx, C('#3d7a2a'), 3);
    ctx.restore();
    ctx.save(); ctx.translate(hx + 4, hy - 24); ctx.rotate(0.4 + Math.sin(t * 3 + 1) * 0.05);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(22, -10, 30, -34); ctx.quadraticCurveTo(6, -28, 0, 0); fs(ctx, C('#52a33a'), 3);
    ctx.restore();
  }
  if (def.element === 'fire') {
    flame(ctx, hx - 14, hy - 18, 0.8, t, C('#ff7b00'), C('#ffd23f'));
    flame(ctx, hx + 2, hy - 24, 1.05, t + 0.5, C('#ff7b00'), C('#ffd23f'));
    flame(ctx, hx + 16, hy - 16, 0.75, t + 1.2, C('#ff7b00'), C('#ffd23f'));
  }
  if (def.element === 'bolt') {
    ctx.strokeStyle = OUT; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(hx, hy - 24); ctx.lineTo(hx + 2, hy - 40); ctx.stroke();
    bolt(ctx, hx + 3, hy - 50, 1.0 + Math.sin(t * 10) * 0.08, acc);
  }
  if (def.element === 'ice') {
    poly(ctx, [hx - 18, hy - 18, hx - 10, hy - 46, hx - 4, hy - 20]); fs(ctx, acc, 3);
    poly(ctx, [hx + 8, hy - 22, hx + 20, hy - 48, hx + 22, hy - 16]); fs(ctx, acc, 3);
  }
  if (def.element === 'water') {
    ctx.beginPath(); ctx.moveTo(hx - 22, hy - 14);
    ctx.quadraticCurveTo(hx - 14, hy - 44, hx + 2, hy - 30); ctx.quadraticCurveTo(hx + 8, hy - 48, hx + 20, hy - 22);
    ctx.lineTo(hx + 10, hy - 18); ctx.closePath(); fs(ctx, acc, 3);
  }
  if (def.element === 'gear') {
    gearShape(ctx, hx + 2, hy - 30, 13, 8, t * 2); fs(ctx, acc, 3);
    ell(ctx, hx + 2, hy - 30, 4, 4); ctx.fillStyle = C('#ffd23f'); ctx.fill();
  }

  // head
  if (def.element === 'rock') {
    poly(ctx, [hx - 24, hy - 18, hx - 8, hy - 30, hx + 18, hy - 28, hx + 30, hy - 8, hx + 26, hy + 18, hx - 4, hy + 24, hx - 26, hy + 10]); fs(ctx, body);
    ctx.fillStyle = C('#6bbf59'); poly(ctx, [hx - 10, hy - 28, hx + 4, hy - 34, hx + 16, hy - 28, hx + 2, hy - 24]); ctx.fill();
  } else if (def.element === 'gear') {
    rrect(ctx, hx - 26, hy - 24, 54, 46, 12); fs(ctx, body);
  } else if (def.element === 'shadow') {
    ell(ctx, hx + 6, hy + 2, 20, 18); ctx.fillStyle = C('#1a1033'); ctx.fill();
  } else if (def.element === 'ice') {
    ctx.beginPath();
    for (let i = 0; i <= 14; i++) {
      const a = (i / 14) * Math.PI * 2, r = i % 2 ? 25 : 29;
      ctx.lineTo(hx + Math.cos(a) * r, hy + Math.sin(a) * r);
    }
    ctx.closePath(); fs(ctx, body);
  } else {
    ell(ctx, hx, hy, 28, 26); fs(ctx, body);
    ell(ctx, hx + 12, hy + 8, 13, 10); ctx.fillStyle = belly; ctx.fill();
  }

  if (o.silhouette) return;
  const angry = pose === 'punch' || pose === 'power';
  const hurt = pose === 'hurt' || pose === 'ko';
  // eyes
  if (def.element === 'shadow') {
    ctx.fillStyle = o.flash ? '#fff' : '#ffe14d';
    ell(ctx, hx + 2, hy, 4, angry ? 2.5 : 5); ctx.fill();
    ell(ctx, hx + 16, hy, 4, angry ? 2.5 : 5); ctx.fill();
  } else if (def.element === 'gear') {
    rrect(ctx, hx - 16, hy - 12, 40, 18, 6); ctx.fillStyle = '#1d1b2f'; ctx.fill();
    ctx.fillStyle = '#5ef2ff';
    if (hurt) { ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('x  x', hx + 4, hy + 2); }
    else { rrect(ctx, hx - 10, hy - 8, 9, angry ? 5 : 10, 3); ctx.fill(); rrect(ctx, hx + 8, hy - 8, 9, angry ? 5 : 10, 3); ctx.fill(); }
    ctx.fillStyle = OUT; rrect(ctx, hx + 2, hy + 10, 14, 4, 2); ctx.fill();
  } else {
    const blink = Math.sin(t * 1.7) > 0.985;
    const eyes = [[hx - 2, hy - 4], [hx + 15, hy - 4]];
    eyes.forEach(([ex, ey]) => {
      if (hurt) {
        ctx.strokeStyle = OUT; ctx.lineWidth = 3.5;
        ctx.beginPath(); ctx.moveTo(ex - 5, ey - 5); ctx.lineTo(ex + 5, ey + 5); ctx.moveTo(ex + 5, ey - 5); ctx.lineTo(ex - 5, ey + 5); ctx.stroke();
        return;
      }
      ell(ctx, ex, ey, 7, blink ? 1.5 : 9); fs(ctx, '#ffffff', 3);
      if (!blink) {
        ell(ctx, ex + 2.5, ey + 1, 3.8, 4.8); ctx.fillStyle = OUT; ctx.fill();
        ell(ctx, ex + 1.2, ey - 2, 1.4, 1.4); ctx.fillStyle = '#fff'; ctx.fill();
      }
    });
    if (angry) {
      ctx.strokeStyle = OUT; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(hx - 9, hy - 17); ctx.lineTo(hx + 3, hy - 12);
      ctx.moveTo(hx + 22, hy - 17); ctx.lineTo(hx + 11, hy - 12); ctx.stroke();
    }
    // mouth
    ctx.strokeStyle = OUT; ctx.lineWidth = 3.5;
    if (angry || hurt) {
      ell(ctx, hx + 9, hy + 12, 5, 4); ctx.fillStyle = '#7a1f2b'; ctx.fill(); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.arc(hx + 9, hy + 8, 6, 0.2, Math.PI - 0.2); ctx.stroke();
    }
    if (def.element === 'ice' || def.element === 'leaf') {
      ctx.fillStyle = 'rgba(255,120,150,0.5)'; ell(ctx, hx + 24, hy + 6, 4, 3); ctx.fill();
    }
  }
}

// ---------- buddies ----------
function drawBuddy(ctx, def, o) {
  const t = o.t || 0, mood = o.mood || 'idle';
  const C = (c) => (o.silhouette ? '#2a2745' : c);
  const col = C(def.color), acc = C(def.accent);
  ctx.save();
  ctx.translate(o.x, o.y);
  if (o.alpha != null) ctx.globalAlpha *= o.alpha;
  ctx.scale((o.facing || 1) * o.scale, o.scale);
  let hop = 0, sq = 1;
  if (mood === 'hop' || mood === 'happy') { const p = Math.abs(Math.sin(t * (mood === 'happy' ? 9 : 7))); hop = p * 16; sq = 1 + (1 - p) * 0.12; }
  else sq = 1 + Math.sin(t * 5) * 0.04;
  ctx.translate(0, -hop);
  ctx.scale(1 / sq, sq);

  // wings / ears behind
  if (def.id === 'nib') {
    const f = Math.sin(t * 16) * 0.35;
    [-1, 1].forEach((s) => {
      ctx.save(); ctx.translate(s * 20, -28); ctx.rotate(s * f); ctx.scale(s, 1);
      poly(ctx, [0, 0, 26, -18, 22, -4, 30, 2, 18, 6, 18, 12, 0, 8]); fs(ctx, acc, 3); ctx.restore();
    });
  }
  if (def.id === 'pip') {
    [-1, 1].forEach((s) => { ctx.save(); ctx.translate(s * 24, -22); ctx.rotate(s * (0.4 + Math.sin(t * 12) * 0.2)); ell(ctx, s * 6, 0, 9, 5); fs(ctx, acc, 3); ctx.restore(); });
  }
  if (def.id === 'snowpuff') {
    ell(ctx, -16, -48, 7, 11, -0.4); fs(ctx, acc, 3); ell(ctx, 16, -48, 7, 11, 0.4); fs(ctx, acc, 3);
  }

  // body
  if (def.id === 'snowpuff') {
    ctx.beginPath();
    for (let i = 0; i <= 16; i++) {
      const a = (i / 16) * Math.PI * 2, r = i % 2 ? 23 : 27;
      ctx.lineTo(Math.cos(a) * r, -25 + Math.sin(a) * r * 0.92);
    }
    ctx.closePath(); fs(ctx, col);
  } else if (def.id === 'bubbles') {
    ctx.beginPath(); ctx.moveTo(0, -56);
    ctx.bezierCurveTo(14, -44, 28, -36, 27, -20); ctx.bezierCurveTo(26, -2, -26, -2, -27, -20);
    ctx.bezierCurveTo(-28, -36, -14, -44, 0, -56); ctx.closePath();
    ctx.save(); ctx.globalAlpha *= 0.88; fs(ctx, col); ctx.restore();
    ell(ctx, -12, -34, 4, 7, 0.5); ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fill();
  } else {
    ell(ctx, 0, -24, 27, 24); fs(ctx, col);
  }

  // top features
  if (def.id === 'pip') { poly(ctx, [-6, -46, 0, -62, 2, -52, 8, -64, 8, -46]); fs(ctx, acc, 3); }
  if (def.id === 'mossy') {
    ctx.beginPath(); ctx.moveTo(0, -46); ctx.quadraticCurveTo(-18, -54, -20, -70); ctx.quadraticCurveTo(-4, -64, 0, -46); fs(ctx, acc, 3);
    ctx.beginPath(); ctx.moveTo(2, -46); ctx.quadraticCurveTo(16, -56, 22, -66); ctx.quadraticCurveTo(6, -62, 2, -46); fs(ctx, C('#40916c'), 3);
    ctx.fillStyle = C('#52b788'); [[-16, -14, 5], [14, -10, 4], [-4, -6, 3]].forEach(([x, y, r]) => { ell(ctx, x, y, r, r); ctx.fill(); });
  }
  if (def.id === 'ember') { flame(ctx, 0, -42, 1.0, t, C('#ff4800'), acc); }
  if (def.id === 'bubbles' && !o.silhouette) {
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const p = (t * 0.6 + i / 3) % 1;
      ell(ctx, 22 + i * 6, -40 - p * 40, 3 + i, 3 + i); ctx.stroke();
    }
  }

  if (!o.silhouette) {
    // face
    const happy = mood === 'happy';
    [[-8, -26], [9, -26]].forEach(([ex, ey]) => {
      if (happy) {
        ctx.strokeStyle = OUT; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(ex, ey + 2, 5, Math.PI + 0.3, -0.3); ctx.stroke();
      } else {
        ell(ctx, ex, ey, 6.5, 8); ctx.fillStyle = OUT; ctx.fill();
        ell(ctx, ex - 2, ey - 3, 2.4, 2.4); ctx.fillStyle = '#fff'; ctx.fill();
        ell(ctx, ex + 2, ey + 3, 1.2, 1.2); ctx.fill();
      }
    });
    ctx.fillStyle = 'rgba(255,110,140,0.55)';
    ell(ctx, -17, -16, 5, 3.5); ctx.fill(); ell(ctx, 18, -16, 5, 3.5); ctx.fill();
    ctx.strokeStyle = OUT; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, -16, happy ? 6 : 4, 0.2, Math.PI - 0.2); ctx.stroke();
    if (def.id === 'nib') { ctx.fillStyle = '#fff'; poly(ctx, [-4, -14, -2, -9, 0, -14]); ctx.fill(); poly(ctx, [2, -14, 4, -9, 6, -14]); ctx.fill(); }
  }
  // feet
  ell(ctx, -10, -1, 8, 4); fs(ctx, def.id === 'snowpuff' ? acc : C(shade(def.color, -0.2)), 3);
  ell(ctx, 10, -1, 8, 4); fs(ctx, def.id === 'snowpuff' ? acc : C(shade(def.color, -0.2)), 3);
  ctx.restore();
}

// ---------- projectiles ----------
const ELEMENT_COLORS = {
  rock: '#9a8c7a', fire: '#ff7b00', bolt: '#ffe14d', water: '#4cc9f0', leaf: '#6ab04c', ice: '#a8e6ff', shadow: '#9d4edd', gear: '#ff8c2b',
};
function drawProjectile(ctx, el, x, y, r, t, dir) {
  ctx.save();
  ctx.translate(x, y);
  // trail
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = ELEMENT_COLORS[el];
  for (let i = 1; i <= 3; i++) { ell(ctx, -dir * i * r * 0.7, 0, r * (1 - i * 0.22), r * (1 - i * 0.22)); ctx.fill(); }
  ctx.globalAlpha = 1;
  switch (el) {
    case 'fire':
      ell(ctx, 0, 0, r, r); fs(ctx, '#ff7b00', 3); ell(ctx, r * 0.15, 0, r * 0.55, r * 0.55); ctx.fillStyle = '#ffe14d'; ctx.fill(); break;
    case 'rock':
      ctx.rotate(t * 8 * dir);
      poly(ctx, [-r, -r * 0.4, -r * 0.3, -r, r * 0.8, -r * 0.7, r, r * 0.3, r * 0.2, r, -r * 0.8, r * 0.7]); fs(ctx, '#9a8c7a', 3); break;
    case 'bolt':
      ctx.shadowColor = '#fff6a0'; ctx.shadowBlur = 14;
      ctx.rotate(Math.sin(t * 40) * 0.3);
      bolt(ctx, 0, 0, r / 13, '#ffe14d'); break;
    case 'water':
      ell(ctx, 0, 0, r, r); ctx.fillStyle = 'rgba(76,201,240,0.75)'; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke();
      ell(ctx, -r * 0.35, -r * 0.35, r * 0.25, r * 0.25); ctx.fillStyle = '#fff'; ctx.fill(); break;
    case 'leaf':
      ctx.rotate(t * 12 * dir);
      ctx.beginPath(); ctx.moveTo(-r, 0); ctx.quadraticCurveTo(0, -r, r, 0); ctx.quadraticCurveTo(0, r, -r, 0); fs(ctx, '#6ab04c', 3); break;
    case 'ice':
      poly(ctx, [-r, 0, 0, -r * 0.55, r * 1.2, 0, 0, r * 0.55]); fs(ctx, '#d6f3ff', 3); break;
    case 'shadow':
      ctx.shadowColor = '#c77dff'; ctx.shadowBlur = 16;
      ell(ctx, 0, 0, r, r); fs(ctx, '#7b2cbf', 3); ell(ctx, 0, 0, r * 0.45, r * 0.45); ctx.fillStyle = '#1a1033'; ctx.fill(); break;
    case 'gear':
      gearShape(ctx, 0, 0, r, 8, t * 10 * dir); fs(ctx, '#ff8c2b', 3); ell(ctx, 0, 0, r * 0.3, r * 0.3); ctx.fillStyle = OUT; ctx.fill(); break;
  }
  ctx.restore();
}

// ---------- icons (for buttons; picture-first, text-light) ----------
function drawIcon(ctx, name, x, y, s, col) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s / 40, s / 40);
  ctx.fillStyle = col || '#fff';
  ctx.strokeStyle = col || '#fff';
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  switch (name) {
    case 'home':
      poly(ctx, [-18, -2, 0, -18, 18, -2, 13, -2, 13, 16, -13, 16, -13, -2]); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; rrect(ctx, -5, 4, 10, 12, 2); ctx.fill(); break;
    case 'back':
      ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(8, -14); ctx.lineTo(-8, 0); ctx.lineTo(8, 14); ctx.stroke(); break;
    case 'left': poly(ctx, [10, -16, -14, 0, 10, 16]); ctx.fill(); break;
    case 'right': poly(ctx, [-10, -16, 14, 0, -10, 16]); ctx.fill(); break;
    case 'up': poly(ctx, [-16, 10, 0, -14, 16, 10]); ctx.fill(); break;
    case 'play': poly(ctx, [-12, -18, 18, 0, -12, 18]); ctx.fill(); break;
    case 'again':
      ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(0, 0, 14, -Math.PI * 0.9, Math.PI * 0.6); ctx.stroke();
      poly(ctx, [-20, -14, -6, -14, -14, -2]); ctx.fill(); break;
    case 'sound':
    case 'mute':
      poly(ctx, [-18, -6, -8, -6, 4, -16, 4, 16, -8, 6, -18, 6]); ctx.fill();
      ctx.lineWidth = 4;
      if (name === 'sound') { ctx.beginPath(); ctx.arc(6, 0, 9, -0.8, 0.8); ctx.stroke(); ctx.beginPath(); ctx.arc(6, 0, 16, -0.8, 0.8); ctx.stroke(); }
      else { ctx.beginPath(); ctx.moveTo(10, -8); ctx.lineTo(20, 8); ctx.moveTo(20, -8); ctx.lineTo(10, 8); ctx.stroke(); }
      break;
    case 'fist':
      rrect(ctx, -16, -12, 30, 26, 8); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-8, -12); ctx.lineTo(-8, 0); ctx.moveTo(0, -12); ctx.lineTo(0, 0); ctx.moveTo(8, -12); ctx.lineTo(8, 0); ctx.stroke();
      rrect(ctx, -20, -2, 12, 14, 5); ctx.fillStyle = col || '#fff'; ctx.fill(); break;
    case 'star': star(ctx, 0, 0, 20, 5, 0.45); ctx.fill(); break;
    case 'lock':
      ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, -6, 10, Math.PI, 0); ctx.stroke();
      rrect(ctx, -15, -6, 30, 24, 5); ctx.fill(); break;
    case 'blast':
      star(ctx, 0, 0, 20, 8, 0.5); ctx.fill(); break;
  }
  ctx.restore();
}

window.MMArt = { FIGHTERS, BUDDIES, fighterById, buddyById, drawFighter, drawBuddy, drawShadow, drawProjectile, drawIcon, rrect, ell, fs, poly, star, shade, flame, ELEMENT_COLORS, OUT };
