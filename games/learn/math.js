// Math Buddies — curriculum (Kindergarten through Grade 3).
// Levels: 10 steps per grade (K = 0–9, Grade 1 = 10–19, Grade 2 = 20–29, Grade 3 = 30–39).
// Each skill has a level window [min, max] and a generator gen(L, X) that returns a question.
'use strict';
(function () {
  const S = (window.LEARN_SUBJECTS = window.LEARN_SUBJECTS || {});

  function numChoices(X, ans, count, lo, hi, spread, fmt) {
    const set = new Set([ans]);
    let guard = 0;
    while (set.size < count && guard++ < 300) {
      const d = X.ri(-spread, spread), v = ans + d;
      if (d !== 0 && v >= lo && v <= hi) set.add(v);
    }
    let v = lo;
    while (set.size < count) { if (!set.has(v)) set.add(v); v++; }
    return X.shuffle([...set]).map((n) => ({ value: n, label: fmt ? fmt(n) : String(n), kind: 'num' }));
  }
  const nC = (L) => (L < 10 ? 3 : 4);
  const plural = (b) => b.name + 's';

  const SHAPES_2D = ['circle', 'square', 'triangle', 'rectangle'];
  const SHAPES_2D_MORE = ['hexagon'];
  const SHAPES_3D = ['cube', 'sphere', 'cone', 'cylinder'];
  const SHAPE_FACTS = {
    circle: 'A circle is round, with no corners.', square: 'A square has 4 sides that are all the same.',
    triangle: 'A triangle has 3 sides and 3 corners.', rectangle: 'A rectangle has 4 sides, two long and two short.',
    hexagon: 'A hexagon has 6 sides.', cube: 'A cube is like a box, or a block.', sphere: 'A sphere is round like a ball.',
    cone: 'A cone is like an ice cream cone.', cylinder: 'A cylinder is like a can.',
  };

  const skills = [
    // ---------------- Kindergarten ----------------
    { id: 'count', name: 'Counting objects', min: 0, max: 14, gen(L, X) {
      const [lo, hi] = L < 1 ? [1, 5] : L < 2 ? [1, 7] : L < 3 ? [1, 10] : L < 5 ? [3, 12] : L < 6 ? [5, 15] : [8, 20];
      const n = X.ri(lo, hi), b = X.buddy();
      return { prompt: `How many ${plural(b)}? Tap them to count!`, visual: { kind: 'group', n, buddy: b.id, tapCount: true },
        choices: numChoices(X, n, nC(L), Math.max(0, lo - 1), hi + 2, L < 3 ? 2 : 3), answer: n, hint: 'countAll', style: 'bubble' };
    } },
    { id: 'compare', name: 'More / fewer', min: 1, max: 12, gen(L, X) {
      const maxN = L < 3 ? 5 : L < 5 ? 8 : 10, minDiff = L < 3 ? 2 : 1;
      let a, b;
      do { a = X.ri(1, maxN); b = X.ri(1, maxN); } while (Math.abs(a - b) < minDiff);
      const fewer = L >= 4 && Math.random() < 0.35;
      const [ba, bb] = X.twoBuddies();
      const ans = fewer ? (a < b ? 'left' : 'right') : (a > b ? 'left' : 'right');
      return { prompt: `Which side has ${fewer ? 'fewer' : 'more'}?`, visual: { kind: 'compare', a, b, buddyA: ba.id, buddyB: bb.id },
        choices: [{ value: 'left', kind: 'side' }, { value: 'right', kind: 'side' }], answer: ans, hint: 'compare', fewer };
    } },
    { id: 'shapes', name: 'Shapes', min: 0, max: 11, gen(L, X) {
      const threeD = L >= 6 && Math.random() < 0.45;
      const pool = threeD ? SHAPES_3D : SHAPES_2D.concat(L >= 3 ? SHAPES_2D_MORE : []);
      const t = X.pick(pool);
      const others = X.shuffle(pool.filter((s) => s !== t)).slice(0, Math.min(pool.length - 1, nC(L) - 1));
      return { prompt: `Tap the ${t}!`, visual: { kind: 'mascot' },
        choices: X.shuffle([t, ...others]).map((s) => ({ value: s, kind: 'shape' })), answer: t, hint: 'fact', fact: SHAPE_FACTS[t], style: 'balloon' };
    } },
    { id: 'next', name: 'Counting on / what comes next', min: 2, max: 15, gen(L, X) {
      let seq, ans;
      if (L >= 7 && Math.random() < 0.35) { const s = 10 * X.ri(1, 6); seq = [s, s + 10, s + 20]; ans = s + 30; }
      else { const hi = L < 4 ? 10 : L < 7 ? 20 : L < 10 ? 30 : 100; const s = X.ri(L < 4 ? 1 : 0, hi - 3); seq = [s, s + 1, s + 2]; ans = s + 3; }
      const step = seq[1] - seq[0];
      return { prompt: `${seq.join(', ')}... What comes next?`, visual: { kind: 'path', seq: [...seq, null] },
        choices: numChoices(X, ans, nC(L), Math.max(0, ans - 3 * step), ans + 3 * step, step === 10 ? 20 : 2).map((c) => (step === 10 ? c : c)), answer: ans, hint: 'path', style: 'stone' };
    } },
    { id: 'add', name: 'Addition', min: 3, max: 19, gen(L, X) {
      const max = L < 5 ? 5 : L < 10 ? 10 : 20;
      const a = X.ri(1, max - 1), b = X.ri(1, max - a), s = a + b, bd = X.buddy();
      const eq = L >= 15;
      return { prompt: eq ? `What is ${a} plus ${b}?` : `${a} ${a === 1 ? bd.name : plural(bd)}, and ${b} more jump in! How many in all?`,
        visual: eq ? { kind: 'equation', text: `${a} + ${b} = ?` } : { kind: 'add', a, b, buddy: bd.id, showNums: L >= 5 },
        choices: numChoices(X, s, nC(L), 0, max + 2, 2), answer: s, hint: eq ? 'reveal' : 'countAll', style: 'bubble' };
    } },
    { id: 'sub', name: 'Subtraction', min: 4, max: 19, gen(L, X) {
      const max = L < 6 ? 5 : L < 10 ? 10 : 20;
      const n = X.ri(2, max), k = X.ri(1, n - 1), bd = X.buddy();
      const eq = L >= 15;
      return { prompt: eq ? `What is ${n} minus ${k}?` : `${n} ${plural(bd)}. ${k} fly away! How many are left?`,
        visual: eq ? { kind: 'equation', text: `${n} − ${k} = ?` } : { kind: 'sub', n, k, buddy: bd.id, showNums: L >= 6 },
        choices: numChoices(X, n - k, nC(L), 0, max, 2), answer: n - k, hint: eq ? 'reveal' : 'countLeft', style: 'bubble' };
    } },
    { id: 'make10', name: 'Make 10', min: 6, max: 14, gen(L, X) {
      const f = X.ri(L < 8 ? 4 : 1, 9), bd = X.buddy();
      return { prompt: 'How many more to make 10?', visual: { kind: 'tenframe', filled: f, buddy: bd.id },
        choices: numChoices(X, 10 - f, nC(L), 0, 10, 2), answer: 10 - f, hint: 'countEmpty', style: 'bubble' };
    } },
    { id: 'teen', name: 'Teen numbers (10 and some more)', min: 7, max: 13, gen(L, X) {
      const o = X.ri(1, 9), bd = X.buddy();
      return { prompt: 'Ten, and some more! How many in all?', visual: { kind: 'teen', ones: o, buddy: bd.id },
        choices: numChoices(X, 10 + o, nC(L), 10, 20, 3), answer: 10 + o, hint: 'countOn', style: 'bubble' };
    } },
    // ---------------- Grade 1 ----------------
    { id: 'missing', name: 'Missing addend', min: 11, max: 22, gen(L, X) {
      const c = X.ri(5, L < 15 ? 10 : 20), a = X.ri(1, c - 1);
      return { prompt: `${a} plus what makes ${c}?`, visual: { kind: 'equation', text: `${a} + ? = ${c}` },
        choices: numChoices(X, c - a, 4, 0, 20, 3), answer: c - a, hint: 'reveal' };
    } },
    { id: 'addTens', name: 'Adding tens', min: 14, max: 22, gen(L, X) {
      let a, b;
      if (Math.random() < 0.5) { a = 10 * X.ri(1, 5); b = 10 * X.ri(1, 4); } else { a = 10 * X.ri(1, 8) + X.ri(0, 5); b = X.ri(1, 4); }
      return { prompt: `What is ${a} plus ${b}?`, visual: { kind: 'equation', text: `${a} + ${b} = ?` },
        choices: numChoices(X, a + b, 4, 0, 120, b >= 10 ? 20 : 5), answer: a + b, hint: 'reveal' };
    } },
    { id: 'place', name: 'Place value (tens & ones)', min: 12, max: 27, gen(L, X) {
      const h = L >= 20 ? X.ri(1, 9) : 0, t = X.ri(L < 14 ? 1 : 0, L < 14 ? 5 : 9), o = X.ri(0, 9), v = h * 100 + t * 10 + o;
      return { prompt: h ? 'How many? Count the hundreds, tens, and ones.' : 'How many? Count the tens, then the ones.',
        visual: { kind: 'place', h, t, o }, choices: numChoices(X, v, 4, 0, 999, h ? 110 : 11), answer: v, hint: 'place' };
    } },
    { id: 'compare2', name: 'Compare numbers', min: 13, max: 26, gen(L, X) {
      const big = L >= 20 ? 999 : 99, lo = L >= 20 ? 100 : 10;
      let a, b; do { a = X.ri(lo, big); b = X.ri(lo, big); } while (a === b);
      if (Math.random() < 0.5) b = Math.floor(a / 10) * 10 + ((a % 10) + X.ri(1, 8)) % 10; // same tens: trickier
      if (a === b) b = a + 1;
      return { prompt: 'Which number is bigger?', visual: { kind: 'mascot' },
        choices: X.shuffle([a, b]).map((n) => ({ value: n, label: String(n), kind: 'num' })), answer: Math.max(a, b), hint: 'reveal', style: 'balloon' };
    } },
    { id: 'clock', name: 'Telling time', min: 15, max: 29, gen(L, X) {
      const h = X.ri(1, 12), m = L < 20 ? X.pick([0, 30]) : 5 * X.ri(0, 11);
      const fmt = (hh, mm) => `${hh}:${String(mm).padStart(2, '0')}`;
      const opts = new Set([fmt(h, m)]);
      const alt = [[h % 12 + 1, m], [(h + 10) % 12 + 1, m], [h, (m + 30) % 60], [h % 12 + 1, (m + 30) % 60], [h, (m + 15) % 60]];
      for (const [hh, mm] of X.shuffle(alt)) { if (opts.size >= 4) break; opts.add(fmt(hh, mm)); }
      return { prompt: 'What time is it?', visual: { kind: 'clock', h, m },
        choices: X.shuffle([...opts]).map((s) => ({ value: s, label: s, kind: 'label' })), answer: fmt(h, m), hint: 'clock' };
    } },
    { id: 'shares', name: 'Halves and fourths', min: 16, max: 26, gen(L, X) {
      const parts = X.pick(L >= 20 ? [2, 3, 4] : [2, 4]);
      const word = { 2: 'halves', 3: 'thirds', 4: 'fourths' }[parts];
      const shape = X.pick(['circle', 'rect']);
      const ch = [{ id: 'ok', shape, parts, equal: true }, { id: 'u1', shape, parts, equal: false }];
      const otherParts = parts === 2 ? 4 : 2;
      ch.push(Math.random() < 0.5 ? { id: 'u2', shape: shape === 'circle' ? 'rect' : 'circle', parts, equal: false } : { id: 'o', shape, parts: otherParts, equal: true });
      return { prompt: `Which one is cut into ${word}? Equal parts!`, visual: { kind: 'mascot' },
        choices: X.shuffle(ch).map((c) => ({ value: c.id, kind: 'share', share: c })), answer: 'ok', hint: 'reveal' };
    } },
    // ---------------- Grade 2 ----------------
    { id: 'add100', name: 'Add within 100', min: 20, max: 33, gen(L, X) {
      let a, b; const regroup = L >= 24 && Math.random() < 0.6;
      do { a = X.ri(10, 89); b = X.ri(10, 99 - a); } while (regroup !== ((a % 10) + (b % 10) >= 10) && Math.random() < 0.95);
      const c = numChoices(X, a + b, 4, 0, 200, 12);
      return { prompt: `What is ${a} plus ${b}?`, visual: { kind: 'equation', text: `${a} + ${b} = ?` }, choices: c, answer: a + b, hint: 'reveal' };
    } },
    { id: 'sub100', name: 'Subtract within 100', min: 21, max: 33, gen(L, X) {
      let a, b; const regroup = L >= 25 && Math.random() < 0.6;
      do { a = X.ri(20, 99); b = X.ri(10, a - 1); } while (regroup !== ((a % 10) < (b % 10)) && Math.random() < 0.95);
      return { prompt: `What is ${a} minus ${b}?`, visual: { kind: 'equation', text: `${a} − ${b} = ?` }, choices: numChoices(X, a - b, 4, 0, 100, 12), answer: a - b, hint: 'reveal' };
    } },
    { id: 'skip', name: 'Skip counting', min: 20, max: 28, gen(L, X) {
      const step = X.pick(L < 24 ? [2, 5, 10] : [5, 10, 100]);
      const s = step === 100 ? 100 * X.ri(1, 5) : step * X.ri(0, 6), seq = [s, s + step, s + 2 * step], ans = s + 3 * step;
      return { prompt: `Count by ${step}s. ${seq.join(', ')}... what comes next?`, visual: { kind: 'path', seq: [...seq, null] },
        choices: numChoices(X, ans, 4, 0, 1000, step).map((c) => c), answer: ans, hint: 'path', style: 'stone' };
    } },
    { id: 'coins', name: 'Money (coins)', min: 22, max: 33, gen(L, X) {
      const kinds = L < 26 ? [1, 5, 10] : [1, 5, 10, 25];
      let coins, tot;
      do { coins = Array.from({ length: X.ri(2, 5) }, () => X.pick(kinds)).sort((p, q) => q - p); tot = coins.reduce((p, q) => p + q, 0); } while (tot > 99);
      return { prompt: 'How many cents?', visual: { kind: 'coins', coins }, choices: numChoices(X, tot, 4, 1, 99, 10, (n) => n + '¢'), answer: tot, hint: 'coins' };
    } },
    { id: 'evenOdd', name: 'Even and odd', min: 21, max: 27, gen(L, X) {
      const n = X.ri(2, L < 24 ? 12 : 20), bd = X.buddy();
      return { prompt: 'Make pairs. Is it even or odd?', visual: { kind: 'pairs', n, buddy: bd.id },
        choices: [{ value: 'even', label: 'Even', kind: 'label' }, { value: 'odd', label: 'Odd', kind: 'label' }], answer: n % 2 ? 'odd' : 'even', hint: 'reveal' };
    } },
    { id: 'array', name: 'Arrays (rows of)', min: 24, max: 34, gen(L, X) {
      const r = X.ri(2, 5), c = X.ri(2, 5), bd = X.buddy();
      return { prompt: `${r} rows of ${c}. How many in all?`, visual: { kind: 'array', r, c, buddy: bd.id },
        choices: numChoices(X, r * c, 4, 1, 30, 4), answer: r * c, hint: 'countAll' };
    } },
    // ---------------- Grade 3 ----------------
    { id: 'mult', name: 'Multiplication', min: 30, max: 60, gen(L, X) {
      const a = X.ri(L < 35 ? 1 : 2, L < 35 ? 5 : 10), b = X.ri(1, 10);
      return { prompt: `What is ${a} times ${b}?`, visual: { kind: 'equation', text: `${a} × ${b} = ?` }, choices: numChoices(X, a * b, 4, 0, 120, Math.max(3, a)), answer: a * b, hint: 'reveal' };
    } },
    { id: 'div', name: 'Division', min: 32, max: 60, gen(L, X) {
      const b = X.ri(2, L < 38 ? 5 : 10), q = X.ri(1, 10);
      return { prompt: `What is ${b * q} divided by ${b}?`, visual: { kind: 'equation', text: `${b * q} ÷ ${b} = ?` }, choices: numChoices(X, q, 4, 0, 12, 3), answer: q, hint: 'reveal' };
    } },
    { id: 'fraction', name: 'Fractions', min: 31, max: 50, gen(L, X) {
      const parts = X.pick([2, 3, 4, 6, 8]), sh = L < 35 ? 1 : X.ri(1, parts - 1), shape = X.pick(['circle', 'rect']);
      const f = (a, b) => `${a}/${b}`;
      const opts = new Set([f(sh, parts)]);
      [[parts - sh, parts], [sh, parts + 1], [sh, Math.max(2, parts - 1)], [sh + 1, parts]].forEach(([a, b]) => { if (opts.size < 4 && a > 0 && a < b) opts.add(f(a, b)); });
      while (opts.size < 4) opts.add(f(1, X.ri(2, 9)));
      return { prompt: 'What fraction is colored in?', visual: { kind: 'fraction', shape, parts, shaded: sh },
        choices: X.shuffle([...opts]).map((s) => ({ value: s, label: s, kind: 'frac' })), answer: f(sh, parts), hint: 'reveal' };
    } },
    { id: 'round', name: 'Rounding', min: 33, max: 50, gen(L, X) {
      const big = L >= 38 && Math.random() < 0.5, n = big ? X.ri(101, 999) : X.ri(11, 99), u = big ? 100 : 10;
      const ans = Math.round(n / u) * u;
      const opts = new Set([ans, ans - u, ans + u, Math.floor(n / u) * u === ans ? ans + u : Math.floor(n / u) * u]);
      return { prompt: `Round ${n} to the nearest ${big ? 'hundred' : 'ten'}.`, visual: { kind: 'equation', text: `${n} ≈ ?` },
        choices: X.shuffle([...opts].filter((v) => v >= 0)).slice(0, 4).map((v) => ({ value: v, label: String(v), kind: 'num' })), answer: ans, hint: 'reveal' };
    } },
    { id: 'area', name: 'Area', min: 33, max: 50, gen(L, X) {
      const w = X.ri(2, 7), h = X.ri(2, 5);
      return { prompt: 'How many squares cover this shape?', visual: { kind: 'area', w, h }, choices: numChoices(X, w * h, 4, 1, 40, 4), answer: w * h, hint: 'reveal' };
    } },
  ];

  S.math = { id: 'math', title: 'Math Buddies', color: '#4361ee', skills };
})();
