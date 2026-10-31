// MegaMax — all drawing (no image files). Characters are drawn from shapes
// so they can scale up smoothly when they grow.
'use strict';

const OUT = '#1d1b2f';

const FIGHTERS = [
  // order = unlock order. Every 5th level is a boss (Jack, Magma, Bonez, Sir Clank, Drako).
  { id: 'boulder', name: 'Boulder',   body: '#8d8f99', belly: '#c3c6d1', accent: '#5b5d66', element: 'rock',   speed: 0.92, power: 1.12 },
  { id: 'torch',   name: 'Torch',     body: '#e8452c', belly: '#ffb347', accent: '#ffd23f', element: 'fire',   speed: 1.05, power: 1.0 },
  { id: 'volt',    name: 'Volt',      body: '#ffd23f', belly: '#fff3b0', accent: '#3a86ff', element: 'bolt',   speed: 1.18, power: 0.92 },
  { id: 'chomp',   name: 'Chomp',     body: '#5c7d99', belly: '#e8f1f7', accent: '#3d5a73', element: 'water',  look: 'shark',    speed: 1.08, power: 1.02 },
  { id: 'sprout',  name: 'Sprout',    body: '#6ab04c', belly: '#d4f5a8', accent: '#3d7a2a', element: 'leaf',   speed: 1.06, power: 0.96 },
  { id: 'hopper',  name: 'Hopper',    body: '#f8f9fa', belly: '#ffd6e0', accent: '#ff8fab', element: 'bolt',   look: 'bunny',    speed: 1.25, power: 0.88 },
  { id: 'jack',    name: 'Jack',      body: '#2d6a4f', belly: '#40916c', accent: '#ff8c1a', element: 'fire',   look: 'pumpkin',  speed: 1.0,  power: 1.08 },
  { id: 'ripple',  name: 'Ripple',    body: '#2ec4b6', belly: '#c8f7f0', accent: '#1b6ca8', element: 'water',  speed: 1.0,  power: 1.0 },
  { id: 'buzz',    name: 'Buzz',      body: '#ffd23f', belly: '#ffd23f', accent: '#1d1b2f', element: 'bolt',   look: 'bee',      speed: 1.2,  power: 0.92 },
  { id: 'frosty',  name: 'Frosty',    body: '#e6f4ff', belly: '#ffffff', accent: '#6cc4ff', element: 'ice',    speed: 0.95, power: 1.1 },
  { id: 'flicker', name: 'Flicker',   body: '#ff7b39', belly: '#fff3e6', accent: '#1d1b2f', element: 'fire',   look: 'fox',      speed: 1.18, power: 0.95 },
  { id: 'magma',   name: 'Magma',     body: '#4a3b3b', belly: '#ff7b00', accent: '#ff4800', element: 'fire',   look: 'magma',    speed: 0.88, power: 1.2 },
  { id: 'shade',   name: 'Shade',     body: '#7b4fd6', belly: '#c3a6ff', accent: '#2b1a4f', element: 'shadow', speed: 1.15, power: 0.95 },
  { id: 'blizz',   name: 'Blizz',     body: '#2b2d42', belly: '#ffffff', accent: '#ff9f1c', element: 'ice',    look: 'penguin', foot: '#ff9f1c', speed: 1.0, power: 1.0 },
  { id: 'gizmo',   name: 'Gizmo',     body: '#ff8c2b', belly: '#ffd0a1', accent: '#4a4e69', element: 'gear',   speed: 1.0,  power: 1.05 },
  { id: 'hoot',    name: 'Hoot',      body: '#8d6e63', belly: '#efdcc5', accent: '#5d4037', element: 'wind',   look: 'owl', foot: '#ffb703', speed: 1.05, power: 1.0 },
  { id: 'bonez',   name: 'Bonez',     body: '#f1f1e6', belly: '#d8d8c8', accent: '#1d1b2f', element: 'bone',   look: 'skeleton', speed: 1.12, power: 1.05 },
  { id: 'ruby',    name: 'Ruby',      body: '#ff6fa5', belly: '#ffc2dc', accent: '#c9184a', element: 'gem',    look: 'crystal',  speed: 1.0,  power: 1.08 },
  { id: 'inky',    name: 'Inky',      body: '#c77dff', belly: '#e0aaff', accent: '#7b2cbf', element: 'goo',    look: 'octopus',  speed: 1.0,  power: 1.02 },
  { id: 'shroom',  name: 'Shroom',    body: '#f5ebe0', belly: '#ffffff', accent: '#e63946', element: 'leaf',   look: 'mushroom', speed: 0.98, power: 1.02 },
  { id: 'rexo',    name: 'Rexo',      body: '#52b788', belly: '#d8f3dc', accent: '#ff8c2b', element: 'rock',   look: 'dino',     speed: 0.95, power: 1.15 },
  { id: 'clank',   name: 'Sir Clank', body: '#adb5bd', belly: '#dee2e6', accent: '#e63946', element: 'star',   look: 'knight',   speed: 0.92, power: 1.15 },
  { id: 'gusty',   name: 'Gusty',     body: '#e9f5ff', belly: '#ffffff', accent: '#90caf9', element: 'wind',   look: 'cloud',    speed: 1.15, power: 0.95 },
  { id: 'gloop',   name: 'Gloop',     body: '#80ed99', belly: '#c7f9cc', accent: '#38b000', element: 'goo',    look: 'slime',    speed: 0.95, power: 1.05 },
  { id: 'spike',   name: 'Spike',     body: '#3fa34d', belly: '#7bd389', accent: '#ff6fa5', element: 'leaf',   look: 'cactus',   speed: 1.0,  power: 1.08 },
  { id: 'cosmo',   name: 'Cosmo',     body: '#f1f3f5', belly: '#ced4da', accent: '#4361ee', element: 'star',   look: 'astro',    speed: 1.08, power: 1.0 },
  { id: 'drako',   name: 'Drako',     body: '#7209b7', belly: '#f72585', accent: '#ffd60a', element: 'fire',   look: 'dragon',   speed: 1.05, power: 1.18 },
  { id: 'stripes', name: 'Stripes',   body: '#ff9500', belly: '#fff3e0', accent: '#1d1b2f', element: 'wind',   look: 'tiger',    speed: 1.15, power: 1.05 },
];

const BUDDIES = [
  { id: 'pip',      name: 'Pip',      color: '#ffe066', accent: '#ff9f1c', element: 'bolt' },
  { id: 'mossy',    name: 'Mossy',    color: '#7bd389', accent: '#2d6a4f', element: 'leaf' },
  { id: 'bubbles',  name: 'Bubbles',  color: '#8ecae6', accent: '#219ebc', element: 'water' },
  { id: 'ember',    name: 'Ember',    color: '#ff7b54', accent: '#ffd166', element: 'fire' },
  { id: 'nib',      name: 'Nib',      color: '#b388eb', accent: '#5a189a', element: 'shadow' },
  { id: 'snowpuff', name: 'Snowpuff', color: '#f4fbff', accent: '#8fc9ff', element: 'ice' },
  { id: 'spook',    name: 'Spook',    color: '#f8f9ff', accent: '#c3a6ff', element: 'shadow' },
  { id: 'pebble',   name: 'Pebble',   color: '#a8a29e', accent: '#6bbf59', element: 'rock' },
  { id: 'cogs',     name: 'Cogs',     color: '#ffb347', accent: '#4a4e69', element: 'gear' },
  { id: 'gloopy',   name: 'Gloopy',   color: '#80ed99', accent: '#38b000', element: 'goo' },
  { id: 'twinkle',  name: 'Twinkle',  color: '#ffe14d', accent: '#ff9f1c', element: 'star' },
  { id: 'puff',     name: 'Puff',     color: '#ffffff', accent: '#90caf9', element: 'wind' },
  { id: 'gemmy',    name: 'Gemmy',    color: '#ff8fc7', accent: '#c9184a', element: 'gem' },
  { id: 'skully',   name: 'Skully',   color: '#f1f1e6', accent: '#1d1b2f', element: 'bone' },
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
  if (def.look) def = Object.assign({}, def, { element: def.look });
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
  const LP = { t, C, body, belly, acc, pose, o, hx: 4, hy: -104 };
  drawBack(ctx, def, t, C, acc);
  look(ctx, def, 'back', LP);
  drawArm(ctx, -4, -70, armB, dark, t, false);
  const foot = def.foot ? C(def.foot) : null;
  drawLeg(ctx, -12, legB, dark, def, foot);
  drawLeg(ctx, 12, legA, body, def, foot);
  if (!look(ctx, def, 'torso', LP)) drawTorso(ctx, def, body, belly, acc, t, C);
  look(ctx, def, 'torsoOver', LP);
  drawHead(ctx, def, body, belly, acc, t, pose, C, o);
  drawArm(ctx, 12, -68, armF, body, t, true);
  ctx.restore();
}

function drawLeg(ctx, x, swing, col, def, foot) {
  ctx.save();
  ctx.translate(x, -34);
  ctx.rotate(-swing * 0.035);
  if (def.element === 'octopus') {
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-12, 16, 4, 28); ctx.quadraticCurveTo(14, 34, 18, 24);
    ctx.strokeStyle = OUT; ctx.lineWidth = 19; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = 11; ctx.stroke();
  } else if (def.element === 'shadow') {
    rrect(ctx, -9, 0, 18, 30, 7); fs(ctx, col);
  } else {
    rrect(ctx, -9, 0, 18, 30, 7); fs(ctx, col);
    ell(ctx, 4, 31, 13, 7); fs(ctx, foot || col);
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
  const LP = { t, C, body, belly, acc, pose, o, hx, hy, hurt: pose === 'hurt' || pose === 'ko', angry: pose === 'punch' || pose === 'power' };
  look(ctx, def, 'headBehind', LP);
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
  if (look(ctx, def, 'head', LP)) { /* custom head */ } else if (def.element === 'rock') {
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

  look(ctx, def, 'headOver', LP);
  if (o.silhouette) return;
  const angry = pose === 'punch' || pose === 'power';
  const hurt = pose === 'hurt' || pose === 'ko';
  // eyes
  if (look(ctx, def, 'eyes', LP)) { /* custom eyes + mouth */ } else if (def.element === 'shadow') {
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
    if (look(ctx, def, 'mouth', LP)) { /* custom mouth */ } else if (angry || hurt) {
      ell(ctx, hx + 9, hy + 12, 5, 4); ctx.fillStyle = '#7a1f2b'; ctx.fill(); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.arc(hx + 9, hy + 8, 6, 0.2, Math.PI - 0.2); ctx.stroke();
    }
    if (def.element === 'ice' || def.element === 'leaf') {
      ctx.fillStyle = 'rgba(255,120,150,0.5)'; ell(ctx, hx + 24, hy + 6, 4, 3); ctx.fill();
    }
  }
  look(ctx, def, 'face', LP);
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
  if (buddyBody(ctx, def, col, acc, t, C)) { /* custom body */ } else if (def.id === 'snowpuff') {
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
  if (['spook', 'twinkle', 'puff'].includes(def.id)) { ctx.restore(); return; }
  ell(ctx, -10, -1, 8, 4); fs(ctx, def.id === 'snowpuff' ? acc : C(shade(def.color, -0.2)), 3);
  ell(ctx, 10, -1, 8, 4); fs(ctx, def.id === 'snowpuff' ? acc : C(shade(def.color, -0.2)), 3);
  ctx.restore();
}

// ---------- projectiles ----------
const ELEMENT_COLORS = {
  wind: '#bfe9ff', gem: '#ff6fa5', goo: '#80ed99', bone: '#f1f1e6', star: '#ffd23f',
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
    case 'wind':
      ctx.rotate(t * 14 * dir); ctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(0, 0, r * (0.4 + i * 0.3), i * 2, i * 2 + 3.6); ctx.strokeStyle = OUT; ctx.lineWidth = 7; ctx.stroke(); ctx.strokeStyle = i % 2 ? '#ffffff' : '#9fd8ff'; ctx.lineWidth = 3.5; ctx.stroke(); }
      break;
    case 'gem':
      ctx.rotate(Math.sin(t * 10) * 0.3);
      poly(ctx, [0, -r, r * 0.8, -r * 0.2, 0, r, -r * 0.8, -r * 0.2]); fs(ctx, '#ff6fa5', 3);
      poly(ctx, [0, -r, r * 0.8, -r * 0.2, 0, -r * 0.1]); ctx.fillStyle = '#ffc2dc'; ctx.fill(); break;
    case 'goo':
      ell(ctx, 0, 0, r, r * 0.85); fs(ctx, '#80ed99', 3);
      ell(ctx, -dir * r * 0.9, r * 0.3, r * 0.35, r * 0.3); fs(ctx, '#80ed99', 2);
      ell(ctx, -r * 0.3, -r * 0.3, r * 0.25, r * 0.15); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fill(); break;
    case 'bone':
      ctx.rotate(t * 14 * dir);
      rrect(ctx, -r, -r * 0.22, r * 2, r * 0.44, r * 0.2); fs(ctx, '#f1f1e6', 3);
      [[-r, -r * 0.3], [-r, r * 0.3], [r, -r * 0.3], [r, r * 0.3]].forEach(([x, y]) => { ell(ctx, x, y, r * 0.3, r * 0.3); fs(ctx, '#f1f1e6', 3); });
      rrect(ctx, -r * 0.9, -r * 0.18, r * 1.8, r * 0.36, r * 0.15); ctx.fillStyle = '#f1f1e6'; ctx.fill(); break;
    case 'star':
      ctx.shadowColor = '#fff6a0'; ctx.shadowBlur = 12; ctx.rotate(t * 10 * dir);
      star(ctx, 0, 0, r * 1.1, 5, 0.48); fs(ctx, '#ffd23f', 3); break;
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

// ---------- character "looks" ----------
// Each look adds pieces to the basic fighter at a few layers:
// back, torso (replace), torsoOver, headBehind, head (replace), headOver,
// eyes (replace eyes + mouth), mouth (replace), face (on top).
// Return true when the layer was handled.
function lava(ctx, lines, C) {
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  [[C('#ff7b00'), 5], [C('#ffe14d'), 2]].forEach(([c, w]) => {
    ctx.strokeStyle = c; ctx.lineWidth = w;
    lines.forEach((l) => { ctx.beginPath(); ctx.moveTo(l[0], l[1]); for (let i = 2; i < l.length; i += 2) ctx.lineTo(l[i], l[i + 1]); ctx.stroke(); });
  });
}
function bumpy(ctx, cx, cy, r, n, fill) {
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2, am = (a0 + a1) / 2;
    const x0 = cx + Math.cos(a0) * r * 0.86, y0 = cy + Math.sin(a0) * r * 0.86;
    if (i === 0) ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo(cx + Math.cos(am) * r * 1.22, cy + Math.sin(am) * r * 1.22, cx + Math.cos(a1) * r * 0.86, cy + Math.sin(a1) * r * 0.86);
  }
  ctx.closePath(); fs(ctx, fill);
}
function curve(ctx, pts, col, w) {
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); ctx.quadraticCurveTo(pts[2], pts[3], pts[4], pts[5]);
  ctx.strokeStyle = OUT; ctx.lineWidth = w + 7; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke();
}

function look(ctx, def, layer, P) {
  const { hx, hy, t, C, body, belly, acc } = P;
  switch (def.element + ':' + layer) {
    // ----- Chomp the shark -----
    case 'shark:back': poly(ctx, [-12, -84, -42, -116, -34, -70]); fs(ctx, body); return true;
    case 'shark:mouth':
      if (P.hurt) return false;
      rrect(ctx, hx - 4, hy + 5, 30, 10, 4); fs(ctx, '#ffffff', 3);
      ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.beginPath();
      for (let i = 0; i < 5; i++) { ctx.moveTo(hx - 3 + i * 6, hy + 5); ctx.lineTo(hx + i * 6, hy + 11); ctx.lineTo(hx + 3 + i * 6, hy + 5); }
      ctx.stroke(); return true;
    case 'shark:face':
      ctx.strokeStyle = shade(def.body, -0.35); ctx.lineWidth = 2.5;
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(hx - 18 + i * 5, hy); ctx.lineTo(hx - 16 + i * 5, hy + 12); ctx.stroke(); }
      return true;
    // ----- Hopper the bunny -----
    case 'bunny:headBehind':
      [[-10, -0.18], [12, 0.22]].forEach(([dx, rot], i) => {
        ctx.save(); ctx.translate(hx + dx, hy - 20); ctx.rotate(rot + Math.sin(t * 3 + i) * 0.06);
        ell(ctx, 0, -24, 9, 26); fs(ctx, body); ell(ctx, 0, -22, 4, 17); ctx.fillStyle = acc; ctx.fill(); ctx.restore();
      });
      return true;
    case 'bunny:back': ell(ctx, -30, -42, 11, 11); fs(ctx, C('#ffffff')); return true;
    case 'bunny:face':
      ell(ctx, hx + 9, hy + 3, 4, 3); ctx.fillStyle = acc; ctx.fill();
      if (!P.hurt && !P.angry) { rrect(ctx, hx + 5, hy + 12, 9, 7, 2); fs(ctx, '#ffffff', 2); }
      return true;
    // ----- Jack the pumpkin -----
    case 'pumpkin:headBehind':
      rrect(ctx, hx - 3, hy - 40, 9, 18, 3); fs(ctx, C('#6b4226'), 3);
      ell(ctx, hx + 14, hy - 32, 11, 5, -0.4); fs(ctx, C('#52b788'), 3); return true;
    case 'pumpkin:head':
      ell(ctx, hx, hy, 35, 27); fs(ctx, acc);
      ctx.strokeStyle = C('#c45f00'); ctx.lineWidth = 3;
      ell(ctx, hx, hy, 12, 26); ctx.stroke(); ell(ctx, hx, hy, 24, 26); ctx.stroke();
      ell(ctx, hx, hy, 35, 27); ctx.strokeStyle = OUT; ctx.lineWidth = 4; ctx.stroke(); return true;
    case 'pumpkin:eyes': {
      const glow = P.o.flash ? '#ffffff' : '#ffe14d';
      ctx.fillStyle = glow; ctx.shadowColor = '#ffb703'; ctx.shadowBlur = 10;
      if (P.hurt) { ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('x   x', hx + 8, hy); }
      else { poly(ctx, [hx - 12, hy, hx + 2, hy, hx - 5, hy - (P.angry ? 8 : 14)]); ctx.fill(); poly(ctx, [hx + 10, hy, hx + 24, hy, hx + 17, hy - (P.angry ? 8 : 14)]); ctx.fill(); }
      poly(ctx, [hx - 14, hy + 6, hx - 7, hy + 12, hx, hy + 7, hx + 7, hy + 13, hx + 14, hy + 7, hx + 21, hy + 12, hx + 28, hy + 6, hx + 22, hy + 19, hx - 8, hy + 19]); ctx.fill();
      ctx.shadowBlur = 0; return true;
    }
    // ----- Buzz the bee -----
    case 'bee:back': {
      const f = Math.sin(t * 30) * 0.3;
      ctx.save(); ctx.globalAlpha *= 0.8;
      ell(ctx, -22, -92, 13, 25, -0.6 + f); fs(ctx, C('#e0f7ff'), 3);
      ell(ctx, -6, -96, 10, 21, -0.15 - f); fs(ctx, C('#e0f7ff'), 3);
      ctx.restore();
      poly(ctx, [-28, -48, -48, -42, -28, -36]); fs(ctx, acc, 3); return true;
    }
    case 'bee:torsoOver':
      ctx.save(); ell(ctx, 0, -58, 29, 28); ctx.clip(); ctx.fillStyle = acc;
      for (let i = 0; i < 3; i++) ctx.fillRect(-40, -78 + i * 17, 80, 7);
      ctx.restore(); return true;
    case 'bee:headBehind':
      curve(ctx, [hx - 6, hy - 22, hx - 10, hy - 40, hx - 20, hy - 46], acc, 3);
      curve(ctx, [hx + 10, hy - 24, hx + 14, hy - 42, hx + 24, hy - 48], acc, 3);
      ell(ctx, hx - 20, hy - 46, 5, 5); fs(ctx, acc, 2); ell(ctx, hx + 24, hy - 48, 5, 5); fs(ctx, acc, 2); return true;
    // ----- Flicker the fox -----
    case 'fox:back':
      ctx.beginPath(); ctx.moveTo(-16, -46); ctx.quadraticCurveTo(-74, -40, -62, -96); ctx.quadraticCurveTo(-40, -72, -20, -62); ctx.closePath(); fs(ctx, body);
      ctx.beginPath(); ctx.moveTo(-68, -78); ctx.quadraticCurveTo(-70, -94, -62, -96); ctx.quadraticCurveTo(-56, -86, -68, -78); ctx.fillStyle = C('#ffffff'); ctx.fill(); return true;
    case 'fox:headBehind':
      poly(ctx, [hx - 22, hy - 10, hx - 20, hy - 48, hx - 2, hy - 22]); fs(ctx, body);
      poly(ctx, [hx + 30, hy - 10, hx + 28, hy - 48, hx + 10, hy - 22]); fs(ctx, body);
      ctx.fillStyle = acc; poly(ctx, [hx - 21, hy - 36, hx - 20, hy - 48, hx - 12, hy - 36]); ctx.fill(); poly(ctx, [hx + 29, hy - 36, hx + 28, hy - 48, hx + 20, hy - 36]); ctx.fill();
      return true;
    case 'fox:head':
      ell(ctx, hx, hy, 28, 26); fs(ctx, body);
      ell(ctx, hx + 14, hy + 9, 17, 11); ctx.fillStyle = belly; ctx.fill(); return true;
    case 'fox:face': ell(ctx, hx + 29, hy + 4, 4.5, 3.5); ctx.fillStyle = OUT; ctx.fill(); return true;
    // ----- Magma the lava golem -----
    case 'magma:torso':
      poly(ctx, [-28, -82, 0, -92, 30, -82, 36, -54, 26, -30, -24, -30, -34, -54]); fs(ctx, body);
      lava(ctx, [[-16, -80, -4, -66, -14, -50], [12, -86, 14, -66, 26, -58], [-2, -50, 10, -38]], C); return true;
    case 'magma:head':
      poly(ctx, [hx - 24, hy - 18, hx - 8, hy - 30, hx + 18, hy - 28, hx + 30, hy - 8, hx + 26, hy + 18, hx - 4, hy + 24, hx - 26, hy + 10]); fs(ctx, body);
      lava(ctx, [[hx - 16, hy - 20, hx - 8, hy - 10], [hx + 20, hy - 22, hx + 12, hy - 14, hx + 22, hy - 4]], C); return true;
    case 'magma:headBehind':
      flame(ctx, hx - 8, hy - 26, 0.7, t, C('#ff4800'), C('#ffd23f')); flame(ctx, hx + 12, hy - 28, 0.9, t + 0.7, C('#ff4800'), C('#ffd23f')); return true;
    // ----- Blizz the penguin -----
    case 'penguin:head':
      ell(ctx, hx, hy, 28, 26); fs(ctx, body); ell(ctx, hx + 8, hy + 2, 18, 18); ctx.fillStyle = belly; ctx.fill(); return true;
    case 'penguin:torsoOver':
      poly(ctx, [-16, -84, -32, -58, -20, -58, -10, -80]); fs(ctx, C('#e63946'), 3);
      rrect(ctx, -26, -92, 54, 12, 6); fs(ctx, C('#e63946'), 3); return true;
    case 'penguin:mouth':
      if (P.hurt) return false;
      poly(ctx, [hx + 12, hy + 2, hx + 32, hy + 8, hx + 12, hy + 14]); fs(ctx, acc, 3); return true;
    // ----- Hoot the owl -----
    case 'owl:back':
      ctx.beginPath(); ctx.moveTo(-20, -86); ctx.quadraticCurveTo(-58, -72, -46, -34); ctx.quadraticCurveTo(-32, -50, -18, -44); ctx.closePath(); fs(ctx, acc); return true;
    case 'owl:headBehind':
      poly(ctx, [hx - 26, hy - 10, hx - 24, hy - 42, hx - 8, hy - 22]); fs(ctx, body);
      poly(ctx, [hx + 32, hy - 10, hx + 30, hy - 42, hx + 14, hy - 22]); fs(ctx, body); return true;
    case 'owl:head':
      ell(ctx, hx, hy, 30, 27); fs(ctx, body);
      ctx.fillStyle = belly; ell(ctx, hx - 2, hy - 3, 12, 12); ctx.fill(); ell(ctx, hx + 15, hy - 3, 12, 12); ctx.fill(); return true;
    case 'owl:mouth':
      if (P.hurt) return false;
      poly(ctx, [hx + 2, hy + 5, hx + 12, hy + 5, hx + 7, hy + 15]); fs(ctx, C('#ffb703'), 3); return true;
    case 'owl:torsoOver':
      ctx.strokeStyle = C(shade(def.belly, -0.3)); ctx.lineWidth = 2.5;
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-2, -66 + i * 10); ctx.lineTo(6, -61 + i * 10); ctx.lineTo(14, -66 + i * 10); ctx.stroke(); }
      return true;
    // ----- Bonez the skeleton -----
    case 'skeleton:torso':
      ell(ctx, 0, -58, 30, 30); fs(ctx, C('#2b2840'));
      ctx.strokeStyle = body; ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(2, -84); ctx.lineTo(2, -34); ctx.stroke();
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-18, -76 + i * 12); ctx.quadraticCurveTo(2, -68 + i * 12, 22, -76 + i * 12); ctx.stroke(); }
      return true;
    case 'skeleton:head':
      rrect(ctx, hx - 12, hy + 6, 32, 18, 6); fs(ctx, body);
      ell(ctx, hx, hy - 4, 28, 25); fs(ctx, body); return true;
    case 'skeleton:eyes':
      ctx.fillStyle = OUT; ell(ctx, hx - 3, hy - 6, 8, 9); ctx.fill(); ell(ctx, hx + 16, hy - 6, 8, 9); ctx.fill();
      ctx.fillStyle = P.o.flash ? '#fff' : '#ff4d6d';
      if (!P.hurt) { ell(ctx, hx - 1, hy - 5, 2.6, 2.6); ctx.fill(); ell(ctx, hx + 18, hy - 5, 2.6, 2.6); ctx.fill(); }
      ctx.fillStyle = OUT; poly(ctx, [hx + 5, hy + 3, hx + 10, hy + 3, hx + 7.5, hy + 8]); ctx.fill();
      ctx.strokeStyle = OUT; ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(hx - 6 + i * 7, hy + 12); ctx.lineTo(hx - 6 + i * 7, hy + 22); ctx.stroke(); }
      return true;
    // ----- Ruby the crystal -----
    case 'crystal:back':
      poly(ctx, [-30, -82, -42, -114, -18, -88]); fs(ctx, C(shade(def.body, 0.35)));
      poly(ctx, [-18, -88, -20, -120, -6, -90]); fs(ctx, C(shade(def.body, 0.5))); return true;
    case 'crystal:torso':
      poly(ctx, [-20, -90, 20, -90, 34, -60, 22, -30, -22, -30, -34, -60]); fs(ctx, body);
      poly(ctx, [-20, -90, 0, -90, -8, -60, -34, -60]); ctx.fillStyle = C(shade(def.body, 0.35)); ctx.fill(); return true;
    case 'crystal:headBehind':
      [[hx - 12, hy - 22, hx - 6, hy - 54, hx + 2, hy - 24], [hx, hy - 24, hx + 8, hy - 64, hx + 16, hy - 24], [hx + 14, hy - 22, hx + 24, hy - 50, hx + 26, hy - 18]]
        .forEach((p) => { poly(ctx, p); fs(ctx, C(shade(def.body, 0.45))); });
      return true;
    case 'crystal:head':
      poly(ctx, [hx - 18, hy - 26, hx + 22, hy - 26, hx + 32, hy, hx + 20, hy + 24, hx - 16, hy + 24, hx - 28, hy]); fs(ctx, body);
      poly(ctx, [hx - 18, hy - 26, hx + 2, hy - 26, hx - 6, hy, hx - 28, hy]); ctx.fillStyle = C(shade(def.body, 0.35)); ctx.fill(); return true;
    // ----- Inky the octopus -----
    case 'octopus:back':
      curve(ctx, [-20, -40, -38, -20, -30, -2], C(shade(def.body, -0.2)), 10);
      curve(ctx, [18, -40, 36, -20, 30, -2], C(shade(def.body, -0.2)), 10); return true;
    case 'octopus:head':
      ell(ctx, hx, hy - 8, 31, 34); fs(ctx, body);
      ctx.fillStyle = belly; [[hx - 16, hy - 28, 5], [hx + 12, hy - 34, 4], [hx + 22, hy - 16, 3], [hx - 6, hy - 40, 3]].forEach(([x, y, r]) => { ell(ctx, x, y, r, r); ctx.fill(); });
      return true;
    // ----- Shroom the mushroom -----
    case 'mushroom:headOver':
      ctx.beginPath(); ctx.moveTo(hx - 42, hy - 8); ctx.quadraticCurveTo(hx - 40, hy - 56, hx + 4, hy - 58);
      ctx.quadraticCurveTo(hx + 48, hy - 56, hx + 48, hy - 8); ctx.quadraticCurveTo(hx + 4, hy - 20, hx - 42, hy - 8); fs(ctx, acc);
      ctx.fillStyle = C('#ffffff'); [[hx - 20, hy - 34, 8, 6], [hx + 8, hy - 46, 9, 6], [hx + 30, hy - 26, 7, 5]].forEach(([x, y, rx, ry]) => { ell(ctx, x, y, rx, ry); ctx.fill(); });
      return true;
    // ----- Rexo the dino -----
    case 'dino:back':
      curve(ctx, [-18, -42, -60, -32, -76, -12], body, 14);
      [[-26, -88], [-36, -72], [-40, -54]].forEach(([x, y]) => { poly(ctx, [x, y - 8, x - 16, y, x, y + 8]); fs(ctx, acc, 3); });
      return true;
    case 'dino:headBehind':
      [[hx - 16, hy - 16], [hx - 4, hy - 24], [hx + 10, hy - 24]].forEach(([x, y]) => { poly(ctx, [x - 6, y + 4, x, y - 14, x + 6, y + 4]); fs(ctx, acc, 3); });
      return true;
    case 'dino:head':
      ell(ctx, hx + 8, hy + 2, 34, 24); fs(ctx, body);
      ell(ctx, hx + 22, hy + 11, 17, 9); ctx.fillStyle = belly; ctx.fill(); return true;
    case 'dino:face':
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 3; i++) { poly(ctx, [hx + 22 + i * 6, hy + 14, hx + 28 + i * 6, hy + 14, hx + 25 + i * 6, hy + 20]); ctx.fill(); }
      ell(ctx, hx + 36, hy + 2, 2, 2); ctx.fillStyle = OUT; ctx.fill(); return true;
    // ----- Sir Clank the knight -----
    case 'knight:back':
      ctx.beginPath(); ctx.moveTo(-18, -90); ctx.quadraticCurveTo(-44, -60 + Math.sin(t * 4) * 4, -46, -26); ctx.lineTo(-6, -32); ctx.closePath(); fs(ctx, acc); return true;
    case 'knight:headBehind':
      ctx.beginPath(); ctx.moveTo(hx - 4, hy - 26); ctx.quadraticCurveTo(hx - 30, hy - 62, hx - 52, hy - 36 + Math.sin(t * 5) * 3);
      ctx.quadraticCurveTo(hx - 26, hy - 44, hx - 12, hy - 22); ctx.closePath(); fs(ctx, acc); return true;
    case 'knight:head':
      rrect(ctx, hx - 26, hy - 28, 56, 54, 16); fs(ctx, body);
      ctx.strokeStyle = C(shade(def.body, -0.25)); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(hx + 2, hy - 26); ctx.lineTo(hx + 2, hy - 12); ctx.stroke(); return true;
    case 'knight:eyes':
      rrect(ctx, hx - 16, hy - 9, 42, 9, 4); ctx.fillStyle = OUT; ctx.fill();
      ctx.fillStyle = P.hurt ? '#ff4d6d' : '#5ef2ff'; ell(ctx, hx - 2, hy - 4.5, 3, 2.5); ctx.fill(); ell(ctx, hx + 16, hy - 4.5, 3, 2.5); ctx.fill();
      ctx.fillStyle = OUT; for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) { ell(ctx, hx + 2 + c * 6, hy + 8 + r * 6, 1.6, 1.6); ctx.fill(); }
      return true;
    case 'knight:torsoOver':
      poly(ctx, [-4, -80, 24, -80, 24, -60, 10, -46, -4, -60]); fs(ctx, C('#ffd23f'), 3); return true;
    // ----- Gusty the cloud -----
    case 'cloud:torso': bumpy(ctx, 0, -58, 32, 9, body); return true;
    case 'cloud:head': bumpy(ctx, hx, hy, 28, 8, body); return true;
    case 'cloud:back':
      ctx.strokeStyle = acc; ctx.lineWidth = 3; ctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(-40 - i * 4, -80 + i * 18, 8 + i * 2, t * 4 + i, t * 4 + i + 4); ctx.stroke(); }
      return true;
    // ----- Gloop the slime -----
    case 'slime:torso':
      ell(ctx, 0, -58, 32, 30); fs(ctx, body);
      ell(ctx, -18, -28, 6, 10); fs(ctx, body, 3); ell(ctx, 16, -26, 5, 8); fs(ctx, body, 3);
      ell(ctx, -12, -74, 8, 4, -0.5); ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fill(); return true;
    case 'slime:head':
      ctx.beginPath(); ctx.moveTo(hx - 28, hy + 18); ctx.bezierCurveTo(hx - 36, hy - 34, hx + 36, hy - 44, hx + 30, hy + 18); ctx.closePath(); fs(ctx, body);
      ell(ctx, hx - 10, hy - 16, 8, 4, -0.5); ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fill(); return true;
    // ----- Spike the cactus -----
    case 'cactus:back':
      rrect(ctx, -52, -104, 16, 44, 8); fs(ctx, body); rrect(ctx, -48, -68, 26, 12, 6); fs(ctx, body); return true;
    case 'cactus:headBehind':
      for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2 + t * 0.5; ell(ctx, hx + Math.cos(a) * 8, hy - 40 + Math.sin(a) * 8, 7, 7); fs(ctx, acc, 3); }
      ell(ctx, hx, hy - 40, 5, 5); ctx.fillStyle = C('#ffd23f'); ctx.fill(); return true;
    case 'cactus:head': ell(ctx, hx, hy - 4, 25, 31); fs(ctx, body); return true;
    case 'cactus:torsoOver':
    case 'cactus:face': {
      ctx.strokeStyle = C('#f1faee'); ctx.lineWidth = 2;
      const pts = layer === 'face' ? [[hx - 14, hy - 24], [hx + 16, hy - 26], [hx - 20, hy + 8], [hx + 24, hy + 14]] : [[-20, -72], [-8, -82], [22, -76], [-24, -50], [26, -46]];
      pts.forEach(([x, y]) => { ctx.beginPath(); ctx.moveTo(x - 3, y - 3); ctx.lineTo(x + 3, y + 3); ctx.moveTo(x + 3, y - 3); ctx.lineTo(x - 3, y + 3); ctx.stroke(); });
      return true;
    }
    // ----- Cosmo the space alien -----
    case 'astro:back':
      rrect(ctx, -50, -92, 26, 46, 7); fs(ctx, C('#adb5bd'));
      ell(ctx, -37, -44, 6, 4); ctx.fillStyle = C('#4cc9f0'); ctx.fill(); return true;
    case 'astro:headBehind':
      ctx.strokeStyle = OUT; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(hx + 4, hy - 32); ctx.lineTo(hx + 4, hy - 50); ctx.stroke();
      ell(ctx, hx + 4, hy - 52, 5, 5); fs(ctx, C('#ff4d6d'), 3); return true;
    case 'astro:head': ell(ctx, hx, hy, 27, 25); fs(ctx, C('#95d5b2')); return true;
    case 'astro:face':
      ell(ctx, hx + 2, hy, 35, 33); ctx.fillStyle = 'rgba(190,235,255,0.22)'; ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 4; ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(hx + 2, hy, 27, -2.6, -1.9); ctx.stroke(); return true;
    // ----- Drako the dragon -----
    case 'dragon:back':
      for (let i = 0; i < 2; i++) {
        ctx.save(); ctx.translate(-10, -82); ctx.rotate(-0.25 + Math.sin(t * 4) * 0.12 - i * 0.3);
        poly(ctx, [0, 0, -58, -44, -48, -16, -64, -8, -44, 4, -52, 18, 0, 10]); fs(ctx, i ? C(shade(def.body, -0.2)) : belly);
        ctx.restore();
      }
      curve(ctx, [-18, -40, -58, -30, -70, -10], body, 10);
      poly(ctx, [-70, -22, -84, -6, -62, -4]); fs(ctx, acc, 3); return true;
    case 'dragon:headBehind':
      ctx.beginPath(); ctx.moveTo(hx - 16, hy - 18); ctx.quadraticCurveTo(hx - 28, hy - 40, hx - 38, hy - 44); ctx.quadraticCurveTo(hx - 22, hy - 30, hx - 6, hy - 24); ctx.closePath(); fs(ctx, acc, 3);
      ctx.beginPath(); ctx.moveTo(hx + 6, hy - 24); ctx.quadraticCurveTo(hx + 8, hy - 48, hx, hy - 58); ctx.quadraticCurveTo(hx + 22, hy - 42, hx + 18, hy - 22); ctx.closePath(); fs(ctx, acc, 3); return true;
    case 'dragon:head':
      ell(ctx, hx + 4, hy, 30, 26); fs(ctx, body);
      ell(ctx, hx + 20, hy + 10, 17, 10); ctx.fillStyle = belly; ctx.fill(); return true;
    case 'dragon:face':
      ctx.fillStyle = OUT; ell(ctx, hx + 30, hy + 6, 2, 2); ctx.fill(); ell(ctx, hx + 25, hy + 6, 2, 2); ctx.fill(); return true;
    // ----- Stripes the tiger -----
    case 'tiger:headBehind':
      ell(ctx, hx - 16, hy - 22, 10, 10); fs(ctx, body); ell(ctx, hx + 20, hy - 22, 10, 10); fs(ctx, body); return true;
    case 'tiger:torsoOver':
      ctx.strokeStyle = acc; ctx.lineWidth = 4; ctx.lineCap = 'round';
      [[-30, -74, -18, -70], [-32, -58, -20, -56], [-28, -42, -18, -42], [26, -80, 30, -70]].forEach(([a, b, c, d]) => { ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c, d); ctx.stroke(); });
      return true;
    case 'tiger:face':
      ctx.strokeStyle = OUT; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
      [[hx - 6, hy - 26, hx - 2, hy - 18], [hx + 6, hy - 27, hx + 6, hy - 19], [hx + 16, hy - 25, hx + 12, hy - 18], [hx - 24, hy - 2, hx - 16, hy]].forEach(([a, b, c, d]) => { ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c, d); ctx.stroke(); });
      return true;
  }
  return false;
}

// new buddy body shapes; return true when handled
function buddyBody(ctx, def, col, acc, t, C) {
  switch (def.id) {
    case 'spook': {
      ctx.beginPath(); ctx.moveTo(-25, -4); ctx.lineTo(-25, -28); ctx.arc(0, -28, 25, Math.PI, 0); ctx.lineTo(25, -4);
      for (let i = 0; i < 4; i++) { const x = 25 - i * 12.5; ctx.quadraticCurveTo(x - 6, -4 + (i % 2 ? -8 : 8) + Math.sin(t * 6 + i) * 2, x - 12.5, -4); }
      ctx.closePath(); ctx.save(); ctx.globalAlpha *= 0.92; fs(ctx, col); ctx.restore(); return true;
    }
    case 'pebble':
      poly(ctx, [-26, -4, -28, -30, -10, -46, 16, -44, 28, -24, 26, -4]); fs(ctx, col);
      ctx.fillStyle = acc; poly(ctx, [-10, -46, 16, -44, 20, -38, 2, -36, -14, -40]); ctx.fill(); return true;
    case 'cogs':
      ctx.strokeStyle = OUT; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, -46); ctx.lineTo(0, -58); ctx.stroke();
      ell(ctx, 0, -60, 4, 4); fs(ctx, C('#ff4d6d'), 2);
      rrect(ctx, -25, -46, 50, 44, 12); fs(ctx, col);
      gearShape(ctx, 18, -8, 7, 6, t * 3); fs(ctx, acc, 2); return true;
    case 'gloopy':
      ctx.beginPath(); ctx.moveTo(-6, -54); ctx.quadraticCurveTo(-2, -44, 12, -40);
      ctx.bezierCurveTo(32, -30, 30, -2, 0, -2); ctx.bezierCurveTo(-30, -2, -32, -32, -12, -40); ctx.quadraticCurveTo(-8, -46, -6, -54); ctx.closePath(); fs(ctx, col);
      ell(ctx, -12, -28, 4, 7, 0.4); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fill(); return true;
    case 'twinkle':
      ctx.save(); ctx.rotate(Math.sin(t * 2) * 0.1); star(ctx, 0, -26, 32, 5, 0.58); fs(ctx, col); ctx.restore(); return true;
    case 'puff': bumpy(ctx, 0, -26, 26, 9, col); return true;
    case 'gemmy':
      poly(ctx, [-14, -50, 14, -50, 28, -26, 16, -2, -16, -2, -28, -26]); fs(ctx, col);
      ctx.fillStyle = C('#ffd6ea'); poly(ctx, [-14, -50, 0, -50, -6, -26, -28, -26]); ctx.fill(); return true;
    case 'skully':
      rrect(ctx, -14, -16, 28, 16, 5); fs(ctx, col);
      ell(ctx, 0, -30, 26, 22); fs(ctx, col);
      ctx.strokeStyle = OUT; ctx.lineWidth = 2; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-6 + i * 6, -8); ctx.lineTo(-6 + i * 6, -1); ctx.stroke(); }
      return true;
  }
  return false;
}

window.MMArt = { FIGHTERS, BUDDIES, fighterById, buddyById, drawFighter, drawBuddy, drawShadow, drawProjectile, drawIcon, rrect, ell, fs, poly, star, shade, flame, ELEMENT_COLORS, OUT };
