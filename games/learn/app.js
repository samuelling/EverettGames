// Everett Learns — shared engine for Math Buddies (?s=math) and Letter Land (?s=read).
//
// Difficulty = date-based curriculum level + an adaptive staircase offset.
//  * Date: Everett is in Kindergarten in the 2026–27 school year. Each Sept 1 starts a new grade;
//    within a year the level climbs ~1 step per month (K: 0–9, Grade 1: 10–19, ...).
//  * Staircase: transformed 3-down / 1-up on first-try correctness. Three right in a row → one step
//    harder; any miss → one step easier. That converges on ~79% correct (Levitt, 1971): hard enough
//    to stretch, easy enough to stay fun. Step size shrinks after reversals (1 → 0.5 → 0.35 levels).
'use strict';
(() => {
  const AU = window.MMAudio, A = window.MMArt;
  const params = new URLSearchParams(location.search);
  const SUBJ = params.get('s') === 'read' ? 'read' : 'math';
  const subject = window.LEARN_SUBJECTS[SUBJ];
  if (SUBJ === 'read') document.body.classList.add('read');
  document.title = subject.title;

  // ---------------- zoom lock ----------------
  ['gesturestart', 'gesturechange', 'gestureend', 'dblclick'].forEach((t) => document.addEventListener(t, (e) => { if (e.cancelable) e.preventDefault(); }, { passive: false }));
  document.addEventListener('touchmove', (e) => { if (e.touches.length > 1 && e.cancelable) e.preventDefault(); }, { passive: false });

  // ---------------- save ----------------
  const KEY = 'everett-learn-' + SUBJ + '-v1', STICK = 'everett-stickers-v1';
  // Starting guess: early Kindergarten (level ~0.5). The staircase offset is set so the first
  // question lands there, then it adapts. (Calendar alone would say level ~2 on Oct 31.)
  const START_LEVEL = 0.5;
  const freshStair = () => ({ offset: 0, step: 1, dir: 0, rev: 0, run: 0, anchored: false });
  const fresh = () => ({ gradeOffset: 0, stair: freshStair(), stats: {}, rounds: 0, history: [], muted: false });
  const load = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k) || 'null'); return v ? Object.assign(d, v) : d; } catch (e) { return d; } };
  let st = load(KEY, fresh());
  let stickers = load(STICK, { have: [], gold: 0 });
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); localStorage.setItem(STICK, JSON.stringify(stickers)); } catch (e) { /* ignore */ } };
  AU.setMuted(!!st.muted);

  // ---------------- curriculum level ----------------
  // Kindergarten school year comes from the grown-up setup (birthday → grade, saved on this device).
  // Fallback if setup was skipped: Everett's Kindergarten year, 2026–27.
  const kYear = () => (window.EverettProfile && EverettProfile.kYear()) || 2026;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const schoolYear = (d) => (d.getMonth() >= 8 ? d.getFullYear() : d.getFullYear() - 1);
  function baseLevel(d = new Date()) {
    const sy = schoolYear(d), grade = sy - kYear() + st.gradeOffset;
    const months = (d - new Date(sy, 8, 1)) / (30.44 * 864e5);
    const prog = clamp(months * 1.05, 0, 9.6);
    return { grade, level: grade * 10 + prog };
  }
  // (in later grades a fresh start begins one step behind the calendar instead)
  const anchorOffset = () => (baseLevel().grade <= 0 ? clamp(START_LEVEL - baseLevel().level, -6, 0) : -1);
  // (re)anchor the staircase on first run, or if the grown-up changed the grade setting
  function ensureAnchor() {
    if (!st.stair.anchored || st.stair.kYear !== kYear()) { st.stair = freshStair(); st.stair.offset = anchorOffset(); st.stair.anchored = true; st.stair.kYear = kYear(); save(); }
  }
  ensureAnchor();
  const effLevel = () => clamp(baseLevel().level + st.stair.offset, 0, 60);
  const gradeName = (g) => (g < 0 ? 'Pre-K' : g === 0 ? 'Kindergarten' : 'Grade ' + g);
  function stairUpdate(ok) {
    const s = st.stair;
    const move = (dir) => {
      if (s.dir && dir !== s.dir) s.rev++;
      s.dir = dir; s.step = s.rev < 2 ? 1 : s.rev < 4 ? 0.5 : 0.35;
      s.offset = clamp(s.offset + dir * s.step, Math.max(-6, -baseLevel().level), 8); // never below level 0 (no wind-up)
    };
    if (ok) { s.run++; if (s.run >= 3) { s.run = 0; move(+1); } } else { s.run = 0; move(-1); }
  }

  // ---------------- helpers for generators ----------------
  const BUDS = A.BUDDIES;
  const X = {
    ri: (a, b) => a + Math.floor(Math.random() * (b - a + 1)),
    pick: (a) => a[Math.floor(Math.random() * a.length)],
    shuffle: (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
    buddy: () => X.pick(BUDS),
    twoBuddies: () => { const s = X.shuffle(BUDS); return [s[0], s[1]]; },
  };
  let lastSkill = null;
  function pickSkill(L) {
    let avail = subject.skills.filter((s) => L >= s.min && L <= s.max);
    if (!avail.length) { const top = Math.max(...subject.skills.map((s) => s.max)); avail = subject.skills.filter((s) => s.max >= top - 10); }
    const w = avail.map((s) => {
      let k = 1;
      if (L - s.min < 2) k += 0.8;                         // newly unlocked: practise it
      const sd = st.stats[s.id]; if (sd && sd.n >= 4 && sd.c / sd.n < 0.7) k += 0.8; // weak spot
      if (s.id === lastSkill) k *= 0.2;                    // variety
      return k;
    });
    let r = Math.random() * w.reduce((p, q) => p + q, 0);
    for (let i = 0; i < avail.length; i++) { r -= w[i]; if (r <= 0) return avail[i]; }
    return avail[avail.length - 1];
  }

  // ---------------- drawing helpers ----------------
  const cache = {};
  function budImg(id, mood) {
    const k = id + (mood || '');
    if (!cache[k]) {
      const c = document.createElement('canvas'); c.width = 120; c.height = 104;
      A.drawBuddy(c.getContext('2d'), A.buddyById(id), { x: 60, y: 100, scale: 1.4, t: 0.35, mood: mood || 'idle' });
      cache[k] = c.toDataURL();
    }
    return cache[k];
  }
  function fighterImg(id) {
    const k = 'f-' + id;
    if (!cache[k]) {
      const c = document.createElement('canvas'); c.width = 220; c.height = 260;
      A.drawFighter(c.getContext('2d'), A.fighterById(id), { x: 105, y: 250, scale: 1.55, facing: 1, pose: 'win', t: 0.2 });
      cache[k] = c.toDataURL();
    }
    return cache[k];
  }
  const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const ICONS = {
    home: '<svg class="ico" viewBox="0 0 40 40"><path d="M4 20 20 5l16 15h-5v15H9V20z" fill="#fff"/><rect x="16" y="24" width="8" height="11" fill="#3a3f7a"/></svg>',
    back: '<svg class="ico" viewBox="0 0 40 40"><path d="M26 6 12 20l14 14" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    sound: '<svg class="ico" viewBox="0 0 40 40"><path d="M4 15h8l10-9v28l-10-9H4z" fill="#fff"/><path d="M27 13a10 10 0 0 1 0 14M31 8a16 16 0 0 1 0 24" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/></svg>',
    mute: '<svg class="ico" viewBox="0 0 40 40"><path d="M4 15h8l10-9v28l-10-9H4z" fill="#fff"/><path d="M27 14l10 12M37 14L27 26" stroke="#fff" stroke-width="4" stroke-linecap="round"/></svg>',
    say: '<svg class="ico" viewBox="0 0 40 40"><path d="M6 6h28a4 4 0 0 1 4 4v16a4 4 0 0 1-4 4H18l-8 7v-7H6a4 4 0 0 1-4-4V10a4 4 0 0 1 4-4z" fill="#fff" stroke="#1d1b2f" stroke-width="3.5" stroke-linejoin="round"/><text x="20" y="25" text-anchor="middle" font-size="18" font-weight="800" font-family="Baloo 2, sans-serif" fill="#1d1b2f">?</text></svg>',
  };
  const RING = '<svg class="ring" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" pathLength="100"/></svg>';
  const STAR = '<svg viewBox="0 0 40 40"><path d="M20 3l5 11 12 1.5-9 8 2.5 12L20 29.5 9.5 35.5 12 23.5l-9-8L15 14z" fill="rgba(255,255,255,.35)" stroke="#1d1b2f" stroke-width="3" stroke-linejoin="round"/></svg>';

  function shapeSVG(s) {
    const o = 'stroke="#1d1b2f" stroke-width="5" stroke-linejoin="round"';
    const m = {
      circle: `<circle cx="50" cy="50" r="40" fill="#ff4d6d" ${o}/>`,
      square: `<rect x="14" y="14" width="72" height="72" fill="#4cc9f0" ${o}/>`,
      triangle: `<polygon points="50,10 92,86 8,86" fill="#ffd23f" ${o}/>`,
      rectangle: `<rect x="6" y="26" width="88" height="48" fill="#52d273" ${o}/>`,
      hexagon: `<polygon points="28,12 72,12 94,50 72,88 28,88 6,50" fill="#c77dff" ${o}/>`,
      cube: `<polygon points="20,32 52,18 84,32 52,46" fill="#7fd6ff" ${o}/><polygon points="20,32 52,46 52,88 20,74" fill="#4cc9f0" ${o}/><polygon points="52,46 84,32 84,74 52,88" fill="#2a9bc4" ${o}/>`,
      sphere: `<defs><radialGradient id="sg" cx="35%" cy="32%" r="70%"><stop offset="0" stop-color="#fff"/><stop offset=".35" stop-color="#ff8fab"/><stop offset="1" stop-color="#c9184a"/></radialGradient></defs><circle cx="50" cy="50" r="40" fill="url(#sg)" ${o}/>`,
      cone: `<path d="M50 8 L84 80 A34 11 0 0 1 16 80 Z" fill="#ffb347" ${o}/><ellipse cx="50" cy="80" rx="34" ry="11" fill="#ff9f1c" ${o}/>`,
      cylinder: `<path d="M18 22 V78 A32 11 0 0 0 82 78 V22" fill="#52d273" ${o}/><ellipse cx="50" cy="22" rx="32" ry="11" fill="#8be39f" ${o}/>`,
    };
    return `<svg viewBox="0 0 100 100">${m[s]}</svg>`;
  }
  function shareSVG(c) {
    const o = 'stroke="#1d1b2f" stroke-width="5"';
    let base, lines = '';
    if (c.shape === 'circle') {
      base = `<circle cx="50" cy="50" r="42" fill="#ffd166" ${o}/>`;
      if (c.parts === 2) lines = c.equal ? '<line x1="50" y1="8" x2="50" y2="92"/>' : '<line x1="30" y1="13" x2="30" y2="87"/>';
      if (c.parts === 4) lines = c.equal ? '<line x1="50" y1="8" x2="50" y2="92"/><line x1="8" y1="50" x2="92" y2="50"/>' : '<line x1="35" y1="11" x2="35" y2="89"/><line x1="8" y1="62" x2="92" y2="62"/>';
      if (c.parts === 3) lines = c.equal ? '<line x1="50" y1="50" x2="50" y2="8"/><line x1="50" y1="50" x2="86.4" y2="71"/><line x1="50" y1="50" x2="13.6" y2="71"/>' : '<line x1="50" y1="50" x2="50" y2="8"/><line x1="50" y1="50" x2="92" y2="50"/><line x1="50" y1="50" x2="8" y2="50"/>';
    } else {
      base = `<rect x="8" y="22" width="84" height="56" fill="#a0e7e5" ${o}/>`;
      const xs = c.parts === 2 ? (c.equal ? [50] : [32]) : c.parts === 3 ? (c.equal ? [36, 64] : [26, 46]) : (c.equal ? [29, 50, 71] : [20, 34, 70]);
      lines = xs.map((x) => `<line x1="${x}" y1="22" x2="${x}" y2="78"/>`).join('');
    }
    return `<svg viewBox="0 0 100 100">${base}<g ${o} stroke-linecap="round">${lines}</g></svg>`;
  }
  function fractionSVG(v) {
    const o = 'stroke="#1d1b2f" stroke-width="4"';
    let out = '';
    if (v.shape === 'circle') {
      for (let i = 0; i < v.parts; i++) {
        const a0 = -Math.PI / 2 + (i / v.parts) * Math.PI * 2, a1 = -Math.PI / 2 + ((i + 1) / v.parts) * Math.PI * 2;
        const x0 = 50 + 42 * Math.cos(a0), y0 = 50 + 42 * Math.sin(a0), x1 = 50 + 42 * Math.cos(a1), y1 = 50 + 42 * Math.sin(a1);
        out += `<path d="M50 50 L${x0} ${y0} A42 42 0 ${v.parts === 1 ? 1 : 0} 1 ${x1} ${y1} Z" fill="${i < v.shaded ? '#f15bb5' : '#fff'}" ${o}/>`;
      }
    } else {
      const w = 84 / v.parts;
      for (let i = 0; i < v.parts; i++) out += `<rect x="${8 + i * w}" y="30" width="${w}" height="40" fill="${i < v.shaded ? '#f15bb5' : '#fff'}" ${o}/>`;
    }
    return `<svg class="vis" viewBox="0 0 100 100">${out}</svg>`;
  }
  function clockSVG(hh, mm) {
    let ticks = '';
    for (let i = 1; i <= 12; i++) { const a = (i / 12) * Math.PI * 2 - Math.PI / 2; ticks += `<text x="${50 + 36 * Math.cos(a)}" y="${50 + 36 * Math.sin(a) + 4.5}" font-size="12" font-weight="800" text-anchor="middle" font-family="Baloo 2, sans-serif">${i}</text>`; }
    const ha = ((hh % 12) + mm / 60) * 30, ma = mm * 6;
    return `<svg class="vis" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="#fff" stroke="#1d1b2f" stroke-width="5"/>${ticks}
      <line x1="50" y1="50" x2="50" y2="26" stroke="#1d1b2f" stroke-width="6" stroke-linecap="round" transform="rotate(${ha} 50 50)"/>
      <line x1="50" y1="50" x2="50" y2="14" stroke="#4361ee" stroke-width="4" stroke-linecap="round" transform="rotate(${ma} 50 50)"/>
      <circle cx="50" cy="50" r="4" fill="#1d1b2f"/></svg>`;
  }
  function coinsHTML(coins) {
    const look = { 1: ['#c87533', 13, '1¢'], 5: ['#b8bfc7', 16, '5¢'], 10: ['#c9d1d9', 12, '10¢'], 25: ['#aeb6bf', 18, '25¢'] };
    return '<div class="row" style="align-items:center;gap:calc(var(--u)*2)">' + coins.map((c) => {
      const [col, r, l] = look[c];
      return `<svg class="coin" style="width:calc(var(--u)*${r * 1.25});height:calc(var(--u)*${r * 1.25})" viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" fill="${col}" stroke="#1d1b2f" stroke-width="3"/><circle cx="20" cy="20" r="14" fill="none" stroke="rgba(0,0,0,.2)" stroke-width="2"/><text x="20" y="25" text-anchor="middle" font-size="12" font-weight="800" font-family="Baloo 2, sans-serif">${l}</text></svg>`;
    }).join('') + '</div>';
  }

  // ---------------- buttons that must be held ----------------
  function holdable(btn, ms, fn) {
    btn.insertAdjacentHTML('beforeend', RING);
    let timer = null;
    const cancel = () => { clearTimeout(timer); timer = null; btn.classList.remove('holding'); };
    btn.addEventListener('pointerdown', () => { cancel(); void btn.offsetWidth; btn.classList.add('holding'); timer = setTimeout(() => { cancel(); fn(); }, ms); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((t) => btn.addEventListener(t, cancel));
    btn.addEventListener('click', (e) => { if (e.detail === 0) fn(); });
    btn.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  const toConsole = () => {
    if (window.parent !== window) { try { window.parent.postMessage({ type: 'everett-console-home' }, '*'); return; } catch (e) { /* fall through */ } }
    location.href = '../../';
  };
  function setMuteIcons() { ['muteT', 'muteP'].forEach((id) => { const b = document.getElementById(id); b.querySelector('svg.ico').outerHTML = st.muted ? ICONS.mute : ICONS.sound; }); }
  function toggleMute() { st.muted = !st.muted; AU.setMuted(st.muted); save(); setMuteIcons(); if (!st.muted) AU.sfx('tap'); }
  ['homeT', 'homeR'].forEach((id) => { const b = document.getElementById(id); b.innerHTML = ICONS.home; holdable(b, 800, toConsole); });
  ['muteT', 'muteP'].forEach((id) => { const b = document.getElementById(id); b.innerHTML = ICONS.sound; holdable(b, 800, toggleMute); });
  const homeP = document.getElementById('homeP'); homeP.innerHTML = ICONS.home; holdable(homeP, 800, () => show('title'));
  setMuteIcons();
  document.getElementById('sayBtn').innerHTML = ICONS.say;
  document.getElementById('bookBack').innerHTML = ICONS.back;
  document.addEventListener('pointerdown', () => AU.init(), { passive: true });

  // ---------------- screens ----------------
  function show(id) {
    document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('on', s.id === id));
    hintToken++;
    if (id === 'title') { AU.play('menu'); drawTitle(); }
    else if (id === 'play') AU.stop();
  }

  // ---------------- title ----------------
  function drawTitle() {
    const logo = document.getElementById('logo');
    const cols = ['#ff4d6d', '#ffd23f', '#4cc9f0', '#fff', '#c77dff', '#ff8c2b', '#52d273'];
    logo.innerHTML = subject.title.split('').map((c, i) => (c === ' ' ? '<span class="sp"></span>' : `<span style="color:${cols[i % cols.length]}">${c}</span>`)).join('');
    const crew = document.getElementById('crew');
    const ids = SUBJ === 'math' ? ['pip', 'twinkle', 'cogs'] : ['mossy', 'bubbles', 'spook'];
    crew.innerHTML = ids.map((id) => `<img src="${budImg(id, 'happy')}" alt="">`).join('');
  }
  document.getElementById('playBtn').addEventListener('click', () => {
    AU.init(); AU.sfx('tap');
    AU.say(SUBJ === 'math' ? "Let's do math!" : "Let's read!");
    startRound();
  });
  document.getElementById('stickBtn').addEventListener('click', () => { AU.sfx('tap'); openBook(); });

  // ---------------- round ----------------
  const ROUND = 8;
  let round = null, q = null, hintToken = 0;
  const jar = document.getElementById('jar');
  const scene = document.getElementById('scene'), choicesEl = document.getElementById('choices'), helper = document.getElementById('helper');

  function startRound() {
    round = { i: 0, got: 0, firstTry: 0, helperBuddy: X.pick(stickers.have.length ? stickers.have : ['pip', 'mossy', 'twinkle']) };
    jar.innerHTML = Array.from({ length: ROUND }, () => `<i>${STAR}</i>`).join('');
    helper.src = budImg(round.helperBuddy);
    show('play');
    setTimeout(nextQuestion, 350);
  }

  function nextQuestion() {
    hintToken++;
    if (round.i >= ROUND) return finishRound();
    const L = effLevel();
    const skill = pickSkill(L);
    lastSkill = skill.id;
    q = skill.gen(L, X);
    q.skill = skill.id; q.wrong = 0; q.done = false; q.level = L;
    render(q);
    setTimeout(() => AU.say(q.prompt, { rate: 0.95 }), 250);
  }
  document.getElementById('sayBtn').addEventListener('click', () => { if (q) AU.say(q.prompt, { rate: 0.95 }); });

  // ---------------- rendering ----------------
  function budEl(id, size, extra) {
    const wrap = h('div', 'budwrap');
    const img = h('img', 'bud' + (extra ? ' ' + extra : '')); img.src = budImg(id); img.style.setProperty('--bw', size); img.alt = '';
    wrap.appendChild(img);
    return wrap;
  }
  function groupEl(n, id, opts) {
    opts = opts || {};
    const size = opts.size || (n <= 5 ? 'calc(var(--u)*21)' : n <= 10 ? 'calc(var(--u)*16)' : 'calc(var(--u)*11.5)');
    const rows = h('div', 'rows');
    for (let r = 0; r < Math.ceil(n / 5); r++) {
      const row = h('div', 'row');
      for (let c = 0; c < 5 && r * 5 + c < n; c++) {
        const idx = r * 5 + c;
        row.appendChild(budEl(id, size, opts.away && idx >= n - opts.away ? 'away' : ''));
      }
      rows.appendChild(row);
    }
    return rows;
  }
  function tenFrame(filled, id, fillAll) {
    const t = h('div', 'ten');
    for (let i = 0; i < 10; i++) {
      const cell = h('div', i < filled ? 'full' : 'empty');
      if (i < filled) { const img = h('img', 'bud'); img.src = budImg(id); img.style.setProperty('--bw', '92%'); cell.appendChild(img); }
      t.appendChild(cell);
    }
    return t;
  }

  function render(q) {
    scene.innerHTML = ''; choicesEl.innerHTML = ''; choicesEl.className = q.style ? 'st-' + q.style : '';
    const v = q.visual;
    switch (v.kind) {
      case 'group': {
        const g = groupEl(v.n, v.buddy);
        if (v.tapCount) enableTapCount(g);
        scene.appendChild(g); break;
      }
      case 'compare': {
        const row = h('div', 'row'); row.style.gap = 'calc(var(--u)*5)';
        [['left', v.a, v.buddyA], ['right', v.b, v.buddyB]].forEach(([side, n, id]) => {
          const box = h('button', 'groupbox ch side'); box.dataset.value = side;
          box.style.cssText = 'height:auto;min-height:calc(var(--u)*34);background:rgba(255,255,255,.55)';
          box.appendChild(groupEl(n, id, { size: 'calc(var(--u)*12)' }));
          box.addEventListener('click', () => answer(box, side));
          row.appendChild(box);
        });
        scene.appendChild(row); break;
      }
      case 'add': {
        const row = h('div', 'row'); row.style.alignItems = 'center';
        const ga = h('div', 'groupbox'), gb = h('div', 'groupbox');
        const as = v.a + v.b <= 10 ? 'calc(var(--u)*13)' : 'calc(var(--u)*9.5)';
        ga.appendChild(groupEl(v.a, v.buddy, { size: as })); gb.appendChild(groupEl(v.b, v.buddy, { size: as }));
        if (v.showNums) { ga.appendChild(h('div', 'numtag', v.a)); gb.appendChild(h('div', 'numtag', v.b)); }
        gb.style.animation = 'reveal .7s cubic-bezier(.3,1.7,.5,1) .4s both';
        row.append(ga, h('div', 'op', '+'), gb, h('div', 'op', '= ?'));
        scene.appendChild(row); break;
      }
      case 'sub': {
        const box = h('div', 'groupbox');
        const g = groupEl(v.n, v.buddy, { size: v.n <= 10 ? 'calc(var(--u)*15)' : 'calc(var(--u)*11)' });
        box.appendChild(g);
        if (v.showNums) box.appendChild(h('div', 'numtag', `${v.n} − ${v.k} = ?`));
        // the last k fly away after a moment
        const imgs = [...g.querySelectorAll('.bud')];
        setTimeout(() => { imgs.slice(v.n - v.k).forEach((im) => im.classList.add('away')); AU.sfx('jump'); }, 700);
        scene.appendChild(box); break;
      }
      case 'tenframe': scene.appendChild(tenFrame(v.filled, v.buddy)); break;
      case 'teen': {
        const row = h('div', 'row'); row.style.gap = 'calc(var(--u)*4)'; row.style.alignItems = 'center';
        const a = h('div', 'rows'); a.append(tenFrame(10, v.buddy), h('div', 'numtag', '10'));
        const b = h('div', 'rows'); b.append(tenFrame(v.ones, v.buddy), h('div', 'numtag', '+ ?'));
        row.append(a, b); scene.appendChild(row); break;
      }
      case 'path': {
        const p = h('div', 'path');
        v.seq.forEach((n, i) => {
          const s = h('div', 'stone' + (n == null ? ' q' : ''), n == null ? '?' : String(n));
          if (i === v.seq.length - 2) { const im = h('img'); im.src = budImg(X.buddy().id, 'happy'); s.appendChild(im); }
          p.appendChild(s);
        });
        scene.appendChild(p); break;
      }
      case 'equation': scene.appendChild(h('div', 'eqn', v.text)); break;
      case 'bigText': scene.appendChild(h('div', 'bigtext', v.text)); break;
      case 'mascot': { const im = h('img', 'mascot'); im.src = budImg(round.helperBuddy, 'happy'); scene.appendChild(im); break; }
      case 'pic': {
        const box = h('div', 'picbox');
        const em = h('div', 'em', v.pic);
        if (v.word) em.addEventListener('click', () => AU.say(v.claps ? v.claps.join('... ') : v.word));
        box.appendChild(em);
        if (v.gap) box.appendChild(h('div', 'gap', v.gap));
        scene.appendChild(box); break;
      }
      case 'sentence': scene.appendChild(h('div', 'sentence', v.text.replace('___', '<u>&nbsp;</u>'))); break;
      case 'story': scene.appendChild(h('div', 'story', `<p>${v.text}</p><p class="q">${v.q}</p>`)); break;
      case 'place': {
        const p = h('div', 'place');
        for (let i = 0; i < v.h; i++) { const f = h('div', 'flat'); f.innerHTML = '<i></i>'.repeat(100); p.appendChild(f); }
        for (let i = 0; i < v.t; i++) { const r = h('div', 'rod'); r.innerHTML = '<i></i>'.repeat(10); p.appendChild(r); }
        const ones = h('div', 'ones'); for (let i = 0; i < v.o; i++) ones.appendChild(h('div', 'cube')); p.appendChild(ones);
        scene.appendChild(p); break;
      }
      case 'clock': scene.innerHTML = clockSVG(v.h, v.m); break;
      case 'coins': scene.innerHTML = coinsHTML(v.coins); break;
      case 'pairs': {
        const row = h('div', 'row'); row.style.alignItems = 'flex-start';
        for (let i = 0; i < Math.ceil(v.n / 2); i++) {
          const col = h('div', 'rows'); col.style.cssText = 'background:rgba(255,255,255,.4);border:3px solid #1d1b2f;border-radius:14px;padding:4px';
          for (let j = 0; j < 2 && i * 2 + j < v.n; j++) col.appendChild(budEl(v.buddy, v.n <= 12 ? 'calc(var(--u)*12)' : 'calc(var(--u)*9)'));
          if (i * 2 + 1 >= v.n) col.style.borderStyle = 'dashed';
          row.appendChild(col);
        }
        scene.appendChild(row); break;
      }
      case 'array': {
        const g = h('div', 'rows');
        for (let r = 0; r < v.r; r++) { const row = h('div', 'row'); for (let c = 0; c < v.c; c++) row.appendChild(budEl(v.buddy, 'calc(var(--u)*10)')); g.appendChild(row); }
        enableTapCount(g); scene.appendChild(g); break;
      }
      case 'fraction': scene.innerHTML = fractionSVG(v); break;
      case 'area': {
        const g = h('div', 'flat'); g.style.cssText = `grid-template-columns:repeat(${v.w},calc(var(--u)*6));grid-auto-rows:calc(var(--u)*6);background:#a0e7e5`;
        g.innerHTML = '<i></i>'.repeat(v.w * v.h); scene.appendChild(g); break;
      }
    }
    if (q.mode === 'spell') return renderSpell(q);
    if (v.kind === 'compare') return;
    q.choices.forEach((c) => {
      const b = h('button', 'ch k-' + c.kind);
      b.dataset.value = String(c.value);
      if (c.kind === 'shape') b.innerHTML = shapeSVG(c.value);
      else if (c.kind === 'share') b.innerHTML = shareSVG(c.share);
      else if (c.kind === 'pic') b.innerHTML = `<span>${c.pic}</span>`;
      else if (c.kind === 'frac') { const [a, d] = c.label.split('/'); b.innerHTML = `<span class="frac"><span>${a}</span><b>${d}</b></span>`; }
      else { b.innerHTML = `<span class="lbl">${c.label}</span>`; if (c.kind === 'word' && c.label.length > 9) b.classList.add('long'); }
      b.addEventListener('click', () => answer(b, c.value, c));
      choicesEl.appendChild(b);
    });
  }

  // tap each buddy to count it out loud (one-to-one counting)
  function enableTapCount(root) {
    let k = 0;
    root.querySelectorAll('.budwrap').forEach((w) => {
      w.addEventListener('click', () => {
        if (w.dataset.n) { AU.say(w.dataset.n); return; }
        k++; w.dataset.n = k;
        w.querySelector('.bud').classList.add('counted');
        w.appendChild(h('div', 'badge', k));
        AU.sfx('tap'); AU.say(String(k), { rate: 1.1 });
      });
    });
  }

  // ---------------- spelling ----------------
  function renderSpell(q) {
    const slots = h('div', 'slots');
    q.answer.split('').forEach(() => slots.appendChild(h('div', 'slot')));
    scene.querySelector('.picbox').appendChild(slots);
    let pos = 0;
    q.tiles.forEach((ch) => {
      const t = h('button', 'ch tile', ch);
      t.addEventListener('click', () => {
        if (q.done) return;
        if (ch === q.answer[pos]) {
          slots.children[pos].textContent = ch; slots.children[pos].classList.add('filled');
          t.classList.add('used'); pos++;
          AU.sfx('tap'); AU.say(subject.SOUND ? subject.SOUND[ch] || ch : ch, { rate: 1.1 });
          choicesEl.querySelectorAll('.reveal').forEach((e) => e.classList.remove('reveal'));
          if (pos === q.answer.length) { setTimeout(() => AU.say(q.answer + '!'), 450); correct(t); }
        } else {
          t.classList.add('wrong'); setTimeout(() => t.classList.remove('wrong'), 600);
          q.wrong++; AU.sfx('nope'); bump('oops');
          if (q.wrong === 1) AU.say('Try again! Listen: ' + q.answer);
          if (q.wrong >= 2) { const nextT = [...choicesEl.querySelectorAll('.tile:not(.used)')].find((e) => e.textContent === q.answer[pos]); if (nextT) nextT.classList.add('reveal'); }
        }
      });
      choicesEl.appendChild(t);
    });
  }

  // ---------------- answering ----------------
  function bump(cls) { helper.classList.remove('yay', 'oops'); void helper.offsetWidth; helper.classList.add(cls); }
  const PRAISE = ['Yes!', 'You got it!', 'Great job!', 'Awesome!', 'Super!', 'Nice!', 'Woo hoo!', "That's right!", 'Amazing!'];
  function answer(el, value, c) {
    if (q.done) return;
    if (c && c.say && SUBJ === 'read' && c.kind !== 'claps') { /* letters/words say themselves when tapped */ }
    if (String(value) === String(q.answer)) return correct(el);
    q.wrong++;
    el.classList.add('wrong'); AU.sfx('nope'); bump('oops');
    if (q.wrong === 1) { AU.say('Try again!'); setTimeout(() => runHint(q), 900); }
    else reveal();
  }
  function reveal() {
    const right = [...document.querySelectorAll('#choices .ch, #scene .ch')].find((e) => e.dataset.value === String(q.answer));
    if (right) right.classList.add('reveal');
    const c = q.choices && q.choices.find((x) => String(x.value) === String(q.answer));
    AU.say(`It's ${c && (c.say || c.label) ? (c.say || c.label) : q.answer}! Tap it.`);
  }
  function correct(el) {
    q.done = true; hintToken++;
    el.classList.remove('reveal'); el.classList.add('right');
    const first = q.wrong === 0;
    // stats + staircase use first-try correctness only
    const sd = (st.stats[q.skill] = st.stats[q.skill] || { n: 0, c: 0 }); sd.n++; if (first) sd.c++;
    stairUpdate(first); save();
    round.got++; if (first) round.firstTry++;
    AU.sfx('catch'); AU.say(first ? X.pick(PRAISE) : 'You got it!');
    bump('yay'); helper.src = budImg(round.helperBuddy, 'happy');
    confetti(el, first ? 22 : 10);
    flyStar(el, round.i);
    round.i++;
    setTimeout(() => { helper.src = budImg(round.helperBuddy); nextQuestion(); }, 1700);
  }
  function flyStar(from, idx) {
    const r = from.getBoundingClientRect(), slot = jar.children[idx]; if (!slot) return;
    const t = slot.getBoundingClientRect();
    const s = h('div', 'flystar', STAR.replace('rgba(255,255,255,.35)', '#ffd23f')); document.body.appendChild(s);
    const x0 = r.left + r.width / 2 - 30, y0 = r.top + r.height / 2 - 30, x1 = t.left + t.width / 2 - 30, y1 = t.top + t.height / 2 - 30;
    const anim = s.animate([{ transform: `translate(${x0}px,${y0}px) scale(1.4) rotate(0)` }, { transform: `translate(${(x0 + x1) / 2}px,${Math.min(y0, y1) - 80}px) scale(1.8) rotate(180deg)` }, { transform: `translate(${x1}px,${y1}px) scale(.7) rotate(360deg)` }], { duration: 800, easing: 'ease-in-out' });
    anim.onfinish = () => { s.remove(); slot.classList.add('got'); };
  }
  function confetti(el, n) {
    const r = el.getBoundingClientRect(), cols = ['#ff4d6d', '#ffd23f', '#4cc9f0', '#52d273', '#c77dff', '#fff'];
    for (let i = 0; i < n; i++) {
      const p = h('div', 'conf'); p.style.background = cols[i % cols.length]; document.body.appendChild(p);
      const x = r.left + r.width / 2, y = r.top + r.height / 2, a = Math.random() * Math.PI * 2, d = 80 + Math.random() * 160;
      p.animate([{ transform: `translate(${x}px,${y}px) rotate(0)`, opacity: 1 }, { transform: `translate(${x + Math.cos(a) * d}px,${y + Math.sin(a) * d + 120}px) rotate(${Math.random() * 720}deg)`, opacity: 0 }], { duration: 900 + Math.random() * 500, easing: 'cubic-bezier(.2,.7,.4,1)' }).onfinish = () => p.remove();
    }
  }

  // ---------------- hints (shown after the first miss) ----------------
  function seq(steps) {
    const tok = hintToken;
    let tAcc = 0;
    steps.forEach((s) => { tAcc += s.wait || 650; setTimeout(() => { if (tok !== hintToken) return; s.fn && s.fn(); if (s.say) AU.say(s.say, { rate: 1.05 }); }, tAcc); });
  }
  function countEls(els, start, label) {
    start = start || 0;
    return els.map((e, i) => ({ fn: () => { els.forEach((x) => x.classList.remove('lit')); e.classList.add('lit'); }, say: String(start + i + 1) }))
      .concat([{ fn: () => els.forEach((x) => x.classList.remove('lit')), say: label || '', wait: 700 }]);
  }
  function runHint(q) {
    const v = q.visual;
    switch (q.hint) {
      case 'countAll': {
        const els = [...scene.querySelectorAll('.bud')];
        seq([{ say: "Let's count together!", wait: 10 }].concat(countEls(els, 0, ''), [{ wait: 600 }]));
        break;
      }
      case 'countLeft': {
        const els = [...scene.querySelectorAll('.bud:not(.away)')];
        seq([{ say: "Let's count the ones that stayed.", wait: 10 }].concat(countEls(els)));
        break;
      }
      case 'countEmpty': {
        const els = [...scene.querySelectorAll('.ten .empty')];
        seq([{ say: "Count the empty spots!", wait: 10 }].concat(els.map((e, i) => ({ fn: () => e.classList.add('lit'), say: String(i + 1) }))));
        break;
      }
      case 'countOn': {
        const frames = scene.querySelectorAll('.ten');
        const els = [...frames[1].querySelectorAll('.bud')];
        seq([{ fn: () => frames[0].classList.add('lit2'), say: 'Ten!', wait: 10 }].concat(countEls(els, 10)));
        break;
      }
      case 'compare': {
        const boxes = [...scene.querySelectorAll('.side')];
        const a = [...boxes[0].querySelectorAll('.bud')], b = [...boxes[1].querySelectorAll('.bud')];
        seq([{ say: "Let's count each side.", wait: 10 }].concat(countEls(a, 0, `${a.length}.`), countEls(b, 0, `${b.length}.`)));
        break;
      }
      case 'path': AU.say(v.seq.filter((n) => n != null).join(', ') + ', and then...', { rate: 0.85 }); break;
      case 'fact': AU.say(q.fact); break;
      case 'sound': AU.say(q.sound, { rate: 0.9 }); break;
      case 'blend': {
        const w = q.word || q.answer;
        if (/^[a-z]{3}$/.test(w) && subject.SOUND) AU.say(`Let's sound it out. ${w.split('').map((c) => subject.SOUND[c]).join('... ')}... ${w}!`, { rate: 0.85 });
        else AU.say(`Let's sound it out slowly. ${w}.`, { rate: 0.75 });
        break;
      }
      case 'readAloud': AU.say(q.read || (v.read || v.text), { rate: 0.85 }); break;
      case 'clock': AU.say(`The short hand points to ${v.h}. The long hand shows the minutes.`); break;
      case 'coins': { let tot = 0; AU.say(v.coins.map((c) => (tot += c)).join(', ') + ' cents', { rate: 0.85 }); break; }
      case 'place': AU.say(`${v.h ? v.h + ' hundreds, ' : ''}${v.t} tens, and ${v.o} ones.`); break;
      default: break; // 'reveal': next miss shows the answer
    }
  }

  // ---------------- reward ----------------
  function finishRound() {
    st.rounds++;
    st.history.push({ t: Date.now(), L: +effLevel().toFixed(2), first: round.firstTry, n: ROUND });
    if (st.history.length > 200) st.history.shift();
    const missing = BUDS.map((b) => b.id).filter((id) => !stickers.have.includes(id));
    let got = null;
    if (missing.length) { got = X.pick(missing); stickers.have.push(got); } else { stickers.gold++; got = X.pick(BUDS).id; }
    save();
    show('reward');
    const gift = document.getElementById('gift'); gift.classList.remove('open');
    document.getElementById('giftImg').src = budImg(got, 'happy');
    document.getElementById('rewardTitle').textContent = round.firstTry >= 6 ? 'SUPERSTAR!' : 'YOU DID IT!';
    AU.sfx('fanfare');
    AU.say('You did it! Tap the present!');
    gift.onclick = () => {
      if (gift.classList.contains('open')) return;
      gift.classList.add('open'); AU.sfx('catch'); confetti(gift, 40);
      const name = A.buddyById(got).name;
      AU.say(missing.length ? `You got a new buddy sticker! ${name}!` : `A golden ${name}! You have all the buddies!`);
    };
  }
  document.getElementById('again').addEventListener('click', () => { AU.sfx('tap'); startRound(); });
  document.getElementById('toBook').addEventListener('click', () => { AU.sfx('tap'); openBook(); });

  // ---------------- sticker book ----------------
  function openBook() {
    show('stickers');
    const book = document.getElementById('book'); book.innerHTML = '';
    BUDS.forEach((b) => {
      const have = stickers.have.includes(b.id);
      const btn = h('button');
      const im = h('img'); im.src = budImg(b.id); if (!have) im.style.filter = 'brightness(0) opacity(.25)';
      btn.appendChild(im);
      btn.addEventListener('click', () => { if (have) { AU.say(b.name); im.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-25%)' }, { transform: 'translateY(0)' }], 450); } else AU.say('Keep playing to find this buddy!'); });
      book.appendChild(btn);
    });
    AU.say(`You have ${stickers.have.length} buddies!`);
  }
  document.getElementById('bookBack').addEventListener('click', () => { AU.sfx('tap'); show('title'); });

  // ---------------- grown-ups panel (hold the gear) ----------------
  holdable(document.getElementById('gear'), 1500, openParent);
  function openParent() {
    const p = document.getElementById('parent');
    const b = baseLevel(), L = effLevel(), s = st.stair;
    const now = new Date();
    const rows = subject.skills.filter((k) => st.stats[k.id]).map((k) => { const d = st.stats[k.id]; return `<tr><td>${k.name}</td><td>${d.c}/${d.n}</td><td>${Math.round((100 * d.c) / d.n)}%</td></tr>`; }).join('');
    const active = subject.skills.filter((k) => L >= k.min && L <= k.max).map((k) => k.name).join(', ');
    const recent = st.history.slice(-10);
    const acc = recent.length ? Math.round((100 * recent.reduce((a, r) => a + r.first, 0)) / recent.reduce((a, r) => a + r.n, 0)) : null;
    p.innerHTML = `<h3>${subject.title} — grown-ups</h3>
      <p><b>Today:</b> ${now.toDateString()} · school year ${schoolYear(now)}–${(schoolYear(now) + 1) % 100}</p>
      <p><b>Grade (from the date):</b> ${gradeName(b.grade)}${st.gradeOffset ? ` (adjusted ${st.gradeOffset > 0 ? '+' : ''}${st.gradeOffset})` : ''} ·
         <b>curriculum level</b> ${b.level.toFixed(1)} · <b>staircase</b> ${s.offset >= 0 ? '+' : ''}${s.offset.toFixed(2)} (step ${s.step}, ${s.rev} reversals) ·
         <b>playing at level ${L.toFixed(1)}</b> (${gradeName(Math.floor(L / 10))}, step ${Math.floor(L % 10) + 1} of 10)</p>
      <p><b>Grade setting:</b> ${EverettProfile.kYear() ? `from the grown-up setup (Kindergarten in ${kYear()}–${(kYear() + 1) % 100})` : 'not set up on this device — using Kindergarten in 2026–27'}
        <button class="pbtn" id="pProfile">Change birthday / grade</button></p>
      <p><b>Right now it practises:</b> ${active || '—'}</p>
      <p><b>Rounds played:</b> ${st.rounds}${acc != null ? ` · first-try accuracy, last ${recent.length} rounds: ${acc}% (the staircase aims for ~79%)` : ''}</p>
      <table><tr><th>Skill</th><th>First try</th><th></th></tr>${rows || '<tr><td colspan="3">No answers yet</td></tr>'}</table>
      <p><b>Grade setting:</b>
        <button class="pbtn" data-g="-1">One grade easier</button><button class="pbtn ${st.gradeOffset === 0 ? 'on' : ''}" data-g="0">Automatic (by date)</button><button class="pbtn" data-g="1">One grade harder</button></p>
      <p><button class="pbtn" id="pReset">Restart the staircase</button><button class="pbtn" id="pWipe">Erase all progress</button><button class="pbtn" id="pClose">Close</button></p>
      <p style="color:#667;max-width:720px">How it works: the level follows the calendar (Kindergarten in 2026–27, a new grade every September, about one step per month), and a 3-down/1-up staircase nudges it up after three first-try answers in a row and down after any miss, settling around 79% correct.</p>`;
    p.querySelectorAll('[data-g]').forEach((btn) => btn.addEventListener('click', () => { const g = +btn.dataset.g; st.gradeOffset = g === 0 ? 0 : st.gradeOffset + g; save(); openParent(); }));
    const reanchor = () => { st.stair.offset = anchorOffset(); st.stair.anchored = true; st.stair.kYear = kYear(); };
    p.querySelector('#pReset').addEventListener('click', () => { st.stair = freshStair(); reanchor(); save(); openParent(); });
    p.querySelector('#pWipe').addEventListener('click', () => { if (confirm('Erase all progress for ' + subject.title + '?')) { st = fresh(); reanchor(); save(); openParent(); } });
    p.querySelector('#pClose').addEventListener('click', () => show('title'));
    p.querySelector('#pProfile').addEventListener('click', () => EverettProfile.open({ onDone: () => { ensureAnchor(); openParent(); } }));
    show('parent');
  }

  show('title');
  // opened directly (not inside the console) on a device with no setup yet: ask here
  if (window.parent === window && EverettProfile.needsSetup()) EverettProfile.open({ first: true, onDone: () => ensureAnchor() });
  // test hooks (automated playtests)
  window.__learn = {
    force(id, L) { // render one specific skill (for playtests)
      if (!round) { round = { i: 0, got: 0, firstTry: 0, helperBuddy: 'pip' }; jar.innerHTML = Array.from({ length: ROUND }, () => `<i>${STAR}</i>`).join(''); helper.src = budImg('pip'); }
      show('play'); const sk = subject.skills.find((k) => k.id === id); q = sk.gen(L, X); q.skill = id; q.wrong = 0; q.done = false; render(q); return q;
    },
    get st() { return st; }, get q() { return q; }, effLevel, baseLevel, stairUpdate, startRound, nextQuestion, subject, X, setOffset: (o) => { st.stair.offset = o; } };
})();
