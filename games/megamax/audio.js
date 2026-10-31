// MegaMax — synthesized sound effects, music loops and spoken words.
'use strict';

const MMAudio = (() => {
  let ac = null, master, music, sfxBus, noiseBuf;
  let muted = false;
  let song = null, pendingSong = null, timer = null, step = 0, nextT = 0;

  function wake() { if (ac && ac.state !== 'running') { try { ac.resume(); } catch (e) { /* ignore */ } } }
  function init() {
    // iPad Safari can leave audio 'suspended' or 'interrupted' (after speech, app switching, a call...):
    // every touch tries to wake it back up.
    if (ac) { wake(); return; }
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* older Safari */ }
    try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ac = null; return; }
    ['touchend', 'pointerup', 'keydown'].forEach((t) => window.addEventListener(t, wake, { passive: true }));
    document.addEventListener('visibilitychange', () => { if (!document.hidden) wake(); });
    master = ac.createGain(); master.gain.value = muted ? 0 : 0.8; master.connect(ac.destination);
    music = ac.createGain(); music.gain.value = 0.2; music.connect(master);
    sfxBus = ac.createGain(); sfxBus.gain.value = 0.6; sfxBus.connect(master);
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    if (pendingSong) { const p = pendingSong; pendingSong = null; play(p); }
  }

  function tone(f, dur, type, vol, when, slide, dest) {
    if (!ac) return;
    const t = ac.currentTime + (when || 0);
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.3, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || sfxBus);
    o.start(t); o.stop(t + dur + 0.05);
  }
  function noise(dur, vol, when, freq, dest, type) {
    if (!ac) return;
    const t = ac.currentTime + (when || 0);
    const s = ac.createBufferSource(); s.buffer = noiseBuf;
    const f = ac.createBiquadFilter(); f.type = type || 'lowpass'; f.frequency.value = freq || 1500;
    const g = ac.createGain();
    g.gain.setValueAtTime(vol || 0.3, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(dest || sfxBus);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
  }

  const N = (n) => 440 * Math.pow(2, (n - 69) / 12);

  const SFX = {
    swing() { noise(0.09, 0.25, 0, 2600, null, 'bandpass'); },
    hit() { noise(0.14, 0.5, 0, 1400); tone(190, 0.14, 'square', 0.25, 0, 70); },
    nip() { tone(900, 0.06, 'square', 0.15, 0, 1300); noise(0.05, 0.2, 0, 3000); },
    power() { tone(260, 0.28, 'sawtooth', 0.18, 0, 900); tone(390, 0.28, 'square', 0.08, 0.02, 1200); },
    jump() { tone(320, 0.14, 'square', 0.12, 0, 700); },
    mega() {
      [0, 4, 7, 12].forEach((s, i) => tone(N(57 + s), 1.2, 'sawtooth', 0.12, i * 0.06));
      noise(1.2, 0.3, 0, 600); tone(110, 1.2, 'sine', 0.4, 0, 55);
    },
    boom() { noise(0.35, 0.55, 0, 900); tone(120, 0.35, 'sine', 0.5, 0, 40); },
    ko() { tone(500, 0.9, 'sawtooth', 0.2, 0, 50); noise(0.6, 0.4, 0, 700); },
    tap() { tone(N(76), 0.07, 'square', 0.12); tone(N(83), 0.08, 'square', 0.1, 0.05); },
    nope() { tone(220, 0.15, 'square', 0.12); tone(180, 0.2, 'square', 0.12, 0.12); },
    whistle() { tone(2200, 0.25, 'sine', 0.18, 0, 2350); tone(2300, 0.18, 'triangle', 0.08, 0.04); },
    catch() { [72, 76, 79, 84, 88].forEach((n, i) => tone(N(n), 0.22, 'square', 0.12, i * 0.08)); },
    grow() { for (let i = 0; i < 10; i++) tone(N(60 + i * 2), 0.12, 'triangle', 0.15, i * 0.07); },
    fanfare() { [[67, 0], [72, 0.15], [76, 0.3], [79, 0.45], [76, 0.62], [79, 0.75], [84, 0.9]].forEach(([n, w]) => { tone(N(n), 0.3, 'square', 0.12, w); tone(N(n - 12), 0.3, 'triangle', 0.15, w); }); },
    rustle() { noise(0.25, 0.15, 0, 4000, null, 'highpass'); },
    lose() { [67, 63, 60, 55].forEach((n, i) => tone(N(n), 0.3, 'triangle', 0.18, i * 0.2)); },
  };

  // ---- music ----
  const SONGS = {
    arena: {
      bpm: 138,
      bass: [45, 0, 45, 57, 0, 45, 0, 43, 41, 0, 41, 53, 0, 43, 0, 44],
      lead: [69, 0, 72, 0, 76, 0, 72, 74, 0, 72, 0, 69, 67, 0, 69, 0, 65, 0, 69, 0, 72, 0, 69, 72, 0, 74, 0, 76, 74, 0, 72, 0],
      hat: [1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1], kick: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0],
      leadType: 'square', leadVol: 0.07,
    },
    island: {
      bpm: 96,
      bass: [48, 0, 0, 0, 55, 0, 0, 0, 53, 0, 0, 0, 55, 0, 0, 0],
      lead: [72, 76, 79, 0, 81, 79, 76, 0, 74, 76, 72, 0, 67, 69, 72, 0, 72, 76, 79, 81, 84, 0, 81, 79, 77, 76, 74, 0, 72, 0, 0, 0],
      hat: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0], kick: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
      leadType: 'triangle', leadVol: 0.14,
    },
    menu: {
      bpm: 112,
      bass: [48, 0, 55, 0, 52, 0, 55, 0, 53, 0, 57, 0, 55, 0, 59, 0],
      lead: [72, 0, 76, 79, 0, 76, 72, 0, 77, 0, 81, 84, 0, 81, 79, 0, 76, 0, 79, 84, 0, 79, 76, 0, 74, 0, 77, 79, 0, 74, 71, 0],
      hat: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0], kick: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
      leadType: 'square', leadVol: 0.05,
    },
  };

  function tick() {
    if (!ac || !song) return;
    const sp = 60 / song.bpm / 4;
    while (nextT < ac.currentTime + 0.12) {
      const w = nextT - ac.currentTime;
      const i16 = step % 16, i32 = step % 32;
      const b = song.bass[i16]; if (b) tone(N(b), sp * 1.8, 'triangle', 0.35, w, null, music);
      const l = song.lead[i32]; if (l) tone(N(l), sp * 1.6, song.leadType, song.leadVol * 3, w, null, music);
      if (song.hat[i16]) noise(0.03, 0.12, w, 7000, music, 'highpass');
      if (song.kick[i16]) tone(140, 0.12, 'sine', 0.6, w, 45, music);
      nextT += sp; step++;
    }
  }
  function play(name) {
    if (!ac) { pendingSong = name; return; }
    if (song === SONGS[name]) return;
    song = SONGS[name] || null; step = 0; nextT = ac.currentTime + 0.05;
    if (!timer) timer = setInterval(tick, 30);
  }
  function stop() { song = null; }

  // ---- voice (text-light game: the game talks) ----
  let lastSay = '';
  function say(text, opts) {
    if (muted) return;
    try {
      const s = window.speechSynthesis; if (!s) return;
      if (!(opts && opts.queue)) s.cancel();
      if (s.paused) s.resume();
      const u = new SpeechSynthesisUtterance(text);
      u.onend = wake;
      u.rate = (opts && opts.rate) || 1.0; u.pitch = (opts && opts.pitch) || 1.25; u.volume = 1;
      s.speak(u); lastSay = text;
    } catch (e) { /* no voice available */ }
  }

  function setMuted(m) {
    muted = m;
    if (master) master.gain.value = m ? 0 : 0.8;
    if (m) try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch (e) {}
  }

  return {
    init, play, stop, say, setMuted,
    get muted() { return muted; },
    sfx: (name) => { if (ac && SFX[name]) SFX[name](); },
  };
})();
window.MMAudio = MMAudio;
