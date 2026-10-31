// Letter Land — reading curriculum (Kindergarten through Grade 3).
// Same level scale as math: 10 steps per grade (K = 0–9, G1 = 10–19, G2 = 20–29, G3 = 30–39).
'use strict';
(function () {
  const S = (window.LEARN_SUBJECTS = window.LEARN_SUBJECTS || {});

  // picture words (emoji pictures; widely supported on iPad)
  const PIC = {
    cat: '🐱', hat: '🎩', bat: '🦇', rat: '🐀', map: '🗺️', van: '🚐', can: '🥫', bag: '👜', cap: '🧢', pan: '🍳',
    bed: '🛏️', hen: '🐔', pen: '🖊️', web: '🕸️', net: '🥅', ten: '🔟',
    pig: '🐷', pin: '📌', lip: '👄', kid: '🧒',
    dog: '🐶', fox: '🦊', box: '📦', log: '🪵', pot: '🍯',
    sun: '☀️', bus: '🚌', cup: '🥤', bug: '🐛', nut: '🥜', mug: '☕', tub: '🛁',
    apple: '🍎', ball: '⚽', egg: '🥚', fish: '🐟', goat: '🐐', kite: '🪁', lion: '🦁', moon: '🌙', owl: '🦉',
    queen: '👸', ring: '💍', snake: '🐍', tree: '🌳', umbrella: '☂️', violin: '🎻', worm: '🪱', yoyo: '🪀', zebra: '🦓',
    octopus: '🐙', elephant: '🐘', ant: '🐜', frog: '🐸', bee: '🐝', key: '🔑', cake: '🎂', star: '⭐', car: '🚗',
    spoon: '🥄', bear: '🐻', chair: '🪑', pear: '🍐', mouse: '🐭', house: '🏠', boat: '⛵', coat: '🧥', king: '🤴',
    socks: '🧦', sled: '🛷', light: '💡', rabbit: '🐰', pizza: '🍕', monkey: '🐒', tiger: '🐯', rocket: '🚀',
    turtle: '🐢', robot: '🤖', pumpkin: '🎃', cookie: '🍪', banana: '🍌', butterfly: '🦋', dinosaur: '🦕',
    broccoli: '🥦', tomato: '🍅', kangaroo: '🦘', watermelon: '🍉', avocado: '🥑', caterpillar: '🐛', helicopter: '🚁',
    alligator: '🐊', ship: '🚢', shell: '🐚', sheep: '🐑', shoe: '👟', chick: '🐥', cheese: '🧀', cherry: '🍒',
    thumb: '👍', whale: '🐳', phone: '📱', crab: '🦀', drum: '🥁', snail: '🐌', flag: '🚩', clock: '🕐', plane: '✈️',
    grapes: '🍇', bread: '🍞', swan: '🦢', skunk: '🦨', glove: '🧤', brush: '🖌️', bone: '🦴', cube: '🧊', nose: '👃',
    rose: '🌹', bike: '🚲', dice: '🎲', cone: '🍦', home: '🏡', globe: '🌍', rain: '🌧️', train: '🚆', feet: '🦶',
    leaf: '🍃', peach: '🍑', seal: '🦭', soap: '🧼', boot: '👢', book: '📖', cow: '🐄', crown: '👑', cloud: '☁️',
    coin: '🪙', boy: '👦', smile: '😊', ghost: '👻', bow: '🎀', corn: '🌽', horse: '🐴', duck: '🦆', nest: '🪺',
  };
  const SYL = {
    cat: ['cat'], dog: ['dog'], sun: ['sun'], ball: ['ball'], fish: ['fish'], frog: ['frog'], star: ['star'],
    apple: ['ap', 'ple'], rabbit: ['rab', 'bit'], pizza: ['piz', 'za'], monkey: ['mon', 'key'], tiger: ['ti', 'ger'], rocket: ['rock', 'et'],
    turtle: ['tur', 'tle'], robot: ['ro', 'bot'], pumpkin: ['pump', 'kin'], cookie: ['cook', 'ie'], zebra: ['ze', 'bra'],
    banana: ['ba', 'na', 'na'], butterfly: ['but', 'ter', 'fly'], elephant: ['el', 'e', 'phant'], dinosaur: ['di', 'no', 'saur'],
    octopus: ['oc', 'to', 'pus'], broccoli: ['broc', 'co', 'li'], tomato: ['to', 'ma', 'to'], kangaroo: ['kan', 'ga', 'roo'],
    watermelon: ['wa', 'ter', 'mel', 'on'], avocado: ['av', 'o', 'ca', 'do'], caterpillar: ['cat', 'er', 'pil', 'lar'],
    helicopter: ['hel', 'i', 'cop', 'ter'], alligator: ['al', 'li', 'ga', 'tor'],
  };
  const CVC = ['cat', 'hat', 'bat', 'rat', 'map', 'van', 'can', 'bag', 'cap', 'pan', 'bed', 'hen', 'pen', 'web', 'net', 'ten',
    'pig', 'pin', 'lip', 'kid', 'dog', 'fox', 'box', 'log', 'pot', 'sun', 'bus', 'cup', 'bug', 'nut', 'mug', 'tub'];
  const DIGRAPH = { sh: ['ship', 'shell', 'sheep', 'shoe'], ch: ['chick', 'cheese', 'chair', 'cherry'], th: ['thumb'], wh: ['whale'], ph: ['phone'] };
  const BLENDS = ['frog', 'crab', 'drum', 'star', 'snail', 'flag', 'clock', 'plane', 'grapes', 'tree', 'bread', 'sled', 'spoon', 'swan', 'snake', 'skunk', 'glove', 'brush'];
  const SILENT_E = ['cake', 'kite', 'bone', 'cube', 'nose', 'rose', 'snake', 'plane', 'smile', 'whale', 'bike', 'dice', 'cone', 'home', 'globe'];
  const TEAMS = ['rain', 'train', 'snail', 'tree', 'bee', 'sheep', 'feet', 'leaf', 'peach', 'seal', 'boat', 'goat', 'coat', 'soap', 'moon', 'spoon', 'boot', 'book', 'cow', 'owl', 'crown', 'house', 'mouse', 'cloud', 'coin', 'boy'];
  const FIRST = ['apple', 'ball', 'cat', 'dog', 'egg', 'fish', 'goat', 'hat', 'kite', 'lion', 'moon', 'nest', 'octopus', 'pig', 'queen', 'ring', 'sun', 'tree', 'umbrella', 'van', 'worm', 'yoyo', 'zebra', 'bus', 'cake', 'duck', 'horse', 'rocket', 'zebra', 'monkey', 'banana', 'ghost', 'jet'];
  const RHYMES = [['cat', 'hat', 'bat', 'rat'], ['dog', 'log', 'frog'], ['bee', 'tree', 'key'], ['cake', 'snake'], ['star', 'car'],
    ['moon', 'spoon'], ['bear', 'chair', 'pear'], ['mouse', 'house'], ['goat', 'boat', 'coat'], ['king', 'ring'], ['fox', 'box', 'socks'],
    ['bed', 'sled'], ['bug', 'mug'], ['hen', 'pen', 'ten'], ['kite', 'light'], ['pig'], ['sun'], ['fish'], ['bus'], ['cup'], ['egg'], ['corn', 'horn']];
  const SIGHT = [
    ['a', 'I', 'the', 'to', 'and', 'see', 'can', 'is', 'it', 'my', 'we', 'go', 'you', 'me', 'in', 'up', 'big', 'red', 'look', 'like'],
    ['he', 'she', 'was', 'are', 'they', 'what', 'do', 'have', 'this', 'that', 'with', 'all', 'on', 'at', 'no', 'yes', 'but', 'for', 'said', 'come', 'play', 'here'],
    ['of', 'his', 'had', 'from', 'were', 'when', 'there', 'an', 'by', 'could', 'put', 'saw', 'again', 'after', 'every', 'know', 'some', 'them', 'where', 'want'],
  ];
  const SOUND = { a: 'ah', b: 'buh', c: 'kuh', d: 'duh', e: 'eh', f: 'fff', g: 'guh', h: 'huh', i: 'ih', j: 'juh', k: 'kuh', l: 'lll', m: 'mmm', n: 'nnn', o: 'aw', p: 'puh', q: 'kwuh', r: 'rrr', s: 'sss', t: 'tuh', u: 'uh', v: 'vvv', w: 'wuh', x: 'ks', y: 'yuh', z: 'zzz' };
  const EASY_LETTERS = 'ABCDEMOPST'.split('');
  const ALL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const CLOZE = [
    { s: 'I eat with a ___.', a: 'spoon', d: ['tree', 'sun'], lv: 12 },
    { s: 'The cat sat on the ___.', a: 'mat', d: ['sky', 'cup'], lv: 12 },
    { s: 'A fish can ___.', a: 'swim', d: ['fly', 'read'], lv: 12 },
    { s: 'The sun is ___.', a: 'hot', d: ['wet', 'sad'], lv: 12 },
    { s: 'I wear a hat on my ___.', a: 'head', d: ['feet', 'cake'], lv: 13 },
    { s: 'A bird has two ___.', a: 'wings', d: ['wheels', 'cups'], lv: 13 },
    { s: 'We go to bed at ___.', a: 'night', d: ['lunch', 'school'], lv: 14 },
    { s: 'Snow is cold and ___.', a: 'white', d: ['loud', 'hot'], lv: 14 },
    { s: 'The dog likes to dig in the ___.', a: 'dirt', d: ['sky', 'milk'], lv: 15 },
    { s: 'I brush my ___ every morning.', a: 'teeth', d: ['shoes', 'cloud'], lv: 15 },
    { s: 'A frog can jump very ___.', a: 'high', d: ['green', 'soft'], lv: 16 },
    { s: 'Please shut the ___ when it is cold.', a: 'door', d: ['moon', 'song'], lv: 17 },
    { s: 'The baby bird is in the ___.', a: 'nest', d: ['bus', 'sock'], lv: 18 },
    { s: 'We plant seeds so they can ___.', a: 'grow', d: ['sing', 'melt'], lv: 20 },
    { s: 'The ice cube will ___ in the sun.', a: 'melt', d: ['bark', 'build'], lv: 21 },
    { s: 'My kite flew high because it was ___.', a: 'windy', d: ['sleepy', 'empty'], lv: 22 },
    { s: 'The library is a quiet place to ___ books.', a: 'read', d: ['throw', 'cook'], lv: 23 },
    { s: 'Bears sleep all winter in a warm ___.', a: 'den', d: ['pool', 'store'], lv: 24 },
    { s: 'The firefighter climbed the ___ to save the cat.', a: 'ladder', d: ['pillow', 'puddle'], lv: 26 },
    { s: 'A caterpillar turns into a ___.', a: 'butterfly', d: ['bumblebee', 'dragon'], lv: 27 },
    { s: 'The scientist looked at the cell through a ___.', a: 'microscope', d: ['telephone', 'blanket'], lv: 32 },
    { s: 'The explorer used a ___ to find north.', a: 'compass', d: ['spatula', 'trumpet'], lv: 33 },
  ];
  const OPPOSITES = [['hot', 'cold'], ['big', 'small'], ['up', 'down'], ['day', 'night'], ['happy', 'sad'], ['fast', 'slow'], ['open', 'closed'],
    ['wet', 'dry'], ['full', 'empty'], ['loud', 'quiet'], ['in', 'out'], ['old', 'new'], ['hard', 'soft'], ['tall', 'short'], ['push', 'pull'], ['light', 'dark']];
  const COMPOUND = [['sun', 'flower', 'sunflower'], ['rain', 'bow', 'rainbow'], ['cup', 'cake', 'cupcake'], ['star', 'fish', 'starfish'],
    ['foot', 'ball', 'football'], ['snow', 'man', 'snowman'], ['pop', 'corn', 'popcorn'], ['butter', 'fly', 'butterfly'], ['bed', 'room', 'bedroom'], ['tooth', 'brush', 'toothbrush']];
  const AFFIX = [['unhappy', 'not happy', ['happy again', 'very happy']], ['redo', 'do again', ['not do', 'do before']], ['careful', 'full of care', ['without care', 'care again']],
    ['helpless', 'without help', ['full of help', 'help again']], ['unlock', 'opposite of lock', ['lock again', 'lock before']], ['preheat', 'heat before', ['heat again', 'not heat']],
    ['quickly', 'in a quick way', ['not quick', 'quick again']], ['rewrite', 'write again', ['not write', 'write before']], ['fearless', 'without fear', ['full of fear', 'fear again']]];
  const NAMES = ['Mia', 'Leo', 'Ava', 'Sam', 'Zoe', 'Max', 'Ivy', 'Ben'];
  const PETS = ['dog', 'cat', 'frog', 'bird', 'bunny', 'turtle'];
  const COLORS = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
  const PLACES = ['park', 'beach', 'zoo', 'farm', 'lake', 'library'];
  const FOODS = ['apples', 'pizza', 'soup', 'pancakes', 'grapes', 'carrots'];

  const nC = (L) => (L < 10 ? 3 : 4);
  const pic = (w) => ({ value: w, kind: 'pic', pic: PIC[w], say: w });
  const wordChoice = (w) => ({ value: w, label: w, kind: 'word' });
  function similarWords(X, target, pool, n) {
    // distractors that look alike (share letters) make it real reading, not guessing
    const scored = [...new Set(pool)].filter((w) => w !== target).map((w) => {
      let sc = 0; for (let i = 0; i < Math.min(w.length, target.length); i++) if (w[i] === target[i]) sc++;
      if (w.length === target.length) sc += 0.5; return [w, sc + Math.random() * 1.2];
    }).sort((p, q) => q[1] - p[1]);
    return scored.slice(0, n).map((p) => p[0]);
  }
  function wordPool(L) {
    const p = L < 10 ? CVC : L < 14 ? CVC.concat(BLENDS, ...Object.values(DIGRAPH)) : L < 20 ? BLENDS.concat(SILENT_E, ...Object.values(DIGRAPH)) : SILENT_E.concat(TEAMS, BLENDS);
    return [...new Set(p)];
  }

  const skills = [
    // ---------------- Kindergarten ----------------
    { id: 'letterFind', name: 'Letter names', min: 0, max: 9, gen(L, X) {
      const lower = L >= 4 && Math.random() < 0.5;
      const pool = L < 1 ? EASY_LETTERS : ALL;
      const t = X.pick(pool), others = X.shuffle(pool.filter((c) => c !== t)).slice(0, nC(L) - 1);
      const f = (c) => (lower ? c.toLowerCase() : c);
      return { prompt: `Pop the letter ${t}!`, visual: { kind: 'mascot' }, style: 'balloon',
        choices: X.shuffle([t, ...others]).map((c) => ({ value: c, label: f(c), kind: 'letter', say: c })), answer: t, hint: 'reveal' };
    } },
    { id: 'letterMatch', name: 'Big & little letters', min: 2, max: 10, gen(L, X) {
      const t = X.pick(ALL), others = X.shuffle(ALL.filter((c) => c !== t)).slice(0, nC(L) - 1);
      return { prompt: `Find the little letter that matches big ${t}.`, visual: { kind: 'bigText', text: t }, style: 'balloon',
        choices: X.shuffle([t, ...others]).map((c) => ({ value: c, label: c.toLowerCase(), kind: 'letter', say: c })), answer: t, hint: 'reveal' };
    } },
    { id: 'firstSound', name: 'Beginning sounds', min: 2, max: 12, gen(L, X) {
      const w = X.pick(FIRST.filter((x) => PIC[x])), t = w[0].toUpperCase();
      const others = X.shuffle(ALL.filter((c) => c !== t && 'QXJ'.indexOf(c) < 0)).slice(0, nC(L) - 1);
      return { prompt: `${w}. What letter does ${w} start with?`, visual: { kind: 'pic', pic: PIC[w], word: w }, style: 'cookie',
        choices: X.shuffle([t, ...others]).map((c) => ({ value: c, label: L < 4 ? c : c.toLowerCase(), kind: 'letter', say: c })), answer: t,
        hint: 'sound', sound: `${w}... ${SOUND[w[0]]}, ${SOUND[w[0]]}, ${w}. It starts with ${t}.` };
    } },
    { id: 'rhyme', name: 'Rhyming', min: 3, max: 12, gen(L, X) {
      const fams = RHYMES.filter((f) => f.length >= 2 && f.every((w) => PIC[w]));
      const fam = X.pick(fams), [w, r] = X.shuffle(fam);
      const others = X.shuffle(RHYMES.filter((f) => f !== fam).map((f) => f[0]).filter((x) => PIC[x])).slice(0, nC(L) - 1);
      const ch = X.shuffle([r, ...others]);
      return { prompt: `Which one rhymes with ${w}? ${ch.join(', ')}?`, visual: { kind: 'pic', pic: PIC[w], word: w }, style: 'card',
        choices: ch.map(pic), answer: r, hint: 'sound', sound: `${w}, ${r}. They both end the same way!` };
    } },
    { id: 'syllables', name: 'Syllables (clap it)', min: 4, max: 13, gen(L, X) {
      const words = Object.keys(SYL).filter((w) => PIC[w] && (L < 7 ? SYL[w].length <= 3 : true));
      const w = X.pick(words), n = SYL[w].length;
      return { prompt: `${w}. Clap it! How many claps?`, visual: { kind: 'pic', pic: PIC[w], word: w, claps: SYL[w] }, style: 'bubble',
        choices: X.shuffle([1, 2, 3, 4]).slice(0, 0).concat([1, 2, 3, 4].filter((k) => k <= Math.max(3, n)).map((k) => ({ value: k, label: '👏'.repeat(k), kind: 'claps', say: String(k) }))), answer: n,
        hint: 'sound', sound: SYL[w].join('... ') + '. ' + n + (n === 1 ? ' clap.' : ' claps.') };
    } },
    { id: 'sight', name: 'Sight words', min: 5, max: 22, gen(L, X) {
      const list = L < 9 ? SIGHT[0].slice(0, 10 + Math.round(L)) : L < 14 ? SIGHT[0].concat(SIGHT[1]) : SIGHT[1].concat(SIGHT[2]);
      const t = X.pick(list), others = similarWords(X, t, list, nC(L) - 1);
      return { prompt: `Pop the word: ${t}!`, visual: { kind: 'mascot' }, style: 'balloon',
        choices: X.shuffle([t, ...others]).map(wordChoice), answer: t, hint: 'reveal' };
    } },
    { id: 'readPic', name: 'Read a word, find the picture', min: 5, max: 30, gen(L, X) {
      const pool = wordPool(L).filter((w) => PIC[w]);
      const w = X.pick(pool), others = similarWords(X, w, pool, nC(L) - 1);
      return { prompt: 'Read the word. Which picture is it?', visual: { kind: 'bigText', text: w, sound: w }, style: 'card',
        choices: X.shuffle([w, ...others]).map(pic), answer: w, hint: 'blend', word: w };
    } },
    { id: 'spell', name: 'Spelling (letter tiles)', min: 6, max: 30, gen(L, X) {
      const pool = (L < 10 ? CVC : L < 16 ? CVC.concat(BLENDS, ...Object.values(DIGRAPH)) : L < 22 ? SILENT_E.concat(BLENDS) : TEAMS).filter((w) => PIC[w] && w.length <= 6);
      const w = X.pick(pool);
      const extra = X.shuffle('abcdefghilmnoprstu'.split('').filter((c) => w.indexOf(c) < 0)).slice(0, L < 10 ? 1 : 2);
      return { prompt: `Spell ${w}!`, visual: { kind: 'pic', pic: PIC[w], word: w }, mode: 'spell', word: w,
        tiles: X.shuffle(w.split('').concat(extra)), answer: w, hint: 'blend' };
    } },
    { id: 'missingVowel', name: 'Missing vowel', min: 8, max: 16, gen(L, X) {
      const w = X.pick(CVC.filter((x) => PIC[x])), v = w[1];
      const others = X.shuffle('aeiou'.split('').filter((c) => c !== v)).slice(0, nC(L) - 1);
      return { prompt: `${w}. Which letter is missing?`, visual: { kind: 'pic', pic: PIC[w], word: w, gap: w[0] + '_' + w[2] }, style: 'cookie',
        choices: X.shuffle([v, ...others]).map((c) => ({ value: c, label: c, kind: 'letter', say: SOUND[c] })), answer: v, hint: 'blend' };
    } },
    // ---------------- Grade 1 ----------------
    { id: 'digraph', name: 'sh / ch / th / wh', min: 10, max: 18, gen(L, X) {
      const keys = Object.keys(DIGRAPH), d = X.pick(keys), w = X.pick(DIGRAPH[d]);
      const others = X.shuffle(keys.filter((k) => k !== d)).slice(0, 3);
      return { prompt: `${w}. Which sound does ${w} start with?`, visual: { kind: 'pic', pic: PIC[w], word: w }, style: 'cookie',
        choices: X.shuffle([d, ...others]).map((c) => ({ value: c, label: c, kind: 'letter' })), answer: d, hint: 'reveal' };
    } },
    { id: 'picWord', name: 'Picture → word', min: 9, max: 32, gen(L, X) {
      const pool = wordPool(L).filter((w) => PIC[w]);
      const w = X.pick(pool), others = similarWords(X, w, pool.concat(CVC), 3);
      return { prompt: 'Which word matches the picture?', visual: { kind: 'pic', pic: PIC[w] }, style: 'bubble',
        choices: X.shuffle([w, ...others]).map(wordChoice), answer: w, hint: 'blend', word: w };
    } },
    { id: 'cloze', name: 'Sentences (missing word)', min: 12, max: 40, gen(L, X) {
      const items = CLOZE.filter((c) => c.lv <= L + 1 && c.lv >= L - 8);
      const c = X.pick(items.length ? items : CLOZE);
      return { prompt: 'Read the sentence. Which word fits?', visual: { kind: 'sentence', text: c.s, read: c.s.replace('___', 'blank') }, style: 'bubble',
        choices: X.shuffle([c.a, ...c.d]).map(wordChoice), answer: c.a, hint: 'readAloud' };
    } },
    { id: 'opposite', name: 'Opposites', min: 13, max: 24, gen(L, X) {
      const p = X.pick(OPPOSITES), [w, o] = Math.random() < 0.5 ? p : [p[1], p[0]];
      const others = X.shuffle(OPPOSITES.filter((q) => q !== p).map((q) => q[0])).slice(0, 3);
      return { prompt: `What is the opposite of ${w}?`, visual: { kind: 'bigText', text: w }, style: 'bubble',
        choices: X.shuffle([o, ...others]).map(wordChoice), answer: o, hint: 'reveal' };
    } },
    // ---------------- Grade 2 ----------------
    { id: 'compound', name: 'Compound words', min: 20, max: 30, gen(L, X) {
      const c = X.pick(COMPOUND), others = X.shuffle(COMPOUND.filter((q) => q !== c)).slice(0, 3).map((q) => q[2]);
      return { prompt: `${c[0]} plus ${c[1]} makes...?`, visual: { kind: 'equation', text: `${c[0]} + ${c[1]}` }, style: 'bubble',
        choices: X.shuffle([c[2], ...others]).map(wordChoice), answer: c[2], hint: 'reveal' };
    } },
    { id: 'story', name: 'Reading a story', min: 21, max: 45, gen(L, X) {
      const n = X.pick(NAMES), p = X.pick(PETS), col = X.pick(COLORS), pl = X.pick(PLACES), fd = X.pick(FOODS);
      const he = ['Mia', 'Ava', 'Zoe', 'Ivy'].includes(n) ? 'She' : 'He';
      let text = `${n} has a ${col} ${p}. Every Saturday, ${n} and the ${p} go to the ${pl}. At the ${pl}, the ${p} likes to eat ${fd}.`;
      if (L >= 30) text += ` One day it rained, so ${he.toLowerCase()} stayed home and read a book about ${p}s instead.`;
      const qs = [
        ['What color is the ' + p + '?', col, COLORS], ['Where do they go?', pl, PLACES], ['What does the ' + p + ' like to eat?', fd, FOODS],
        ['Who has the ' + p + '?', n, NAMES],
      ];
      if (L >= 30) qs.push(['Why did they stay home?', 'it rained', ['it was hot', 'the zoo closed', 'they were sick']]);
      const [q, a, pool] = X.pick(qs);
      const others = X.shuffle(pool.filter((x) => x !== a)).slice(0, 3);
      return { prompt: 'Read the story, then answer: ' + q, visual: { kind: 'story', text, q }, style: 'bubble',
        choices: X.shuffle([a, ...others]).map(wordChoice), answer: a, hint: 'readAloud', read: text };
    } },
    // ---------------- Grade 3 ----------------
    { id: 'affix', name: 'Prefixes & suffixes', min: 30, max: 50, gen(L, X) {
      const [w, a, d] = X.pick(AFFIX);
      return { prompt: `What does ${w} mean?`, visual: { kind: 'bigText', text: w }, style: 'bubble',
        choices: X.shuffle([a, ...d]).map(wordChoice), answer: a, hint: 'reveal' };
    } },
  ];

  S.read = { id: 'read', title: 'Letter Land', color: '#f15bb5', skills, SOUND };
})();
