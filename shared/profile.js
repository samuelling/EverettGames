// Grown-up setup, shared by the console and the learning games.
// Asks once per device for the child's birthday, converts it to the school year the child is
// (or was) in Kindergarten, lets the grown-up confirm/correct the grade, and saves ONLY that
// school year on this device. The birthday itself is never stored and nothing leaves the device.
'use strict';
(function () {
  const KEY = 'everett-profile-v1';
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; } };
  const write = (v) => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) { /* private mode */ } };
  const schoolYear = (d) => (d.getMonth() >= 8 ? d.getFullYear() : d.getFullYear() - 1);
  // Kindergarten starts the school year the child turns 5 by Sept 1 (common US cutoff; districts vary,
  // which is why the grown-up can correct the grade).
  function kYearFromBirth(b) {
    const y5 = b.getFullYear() + 5;
    return new Date(y5, b.getMonth(), b.getDate()) <= new Date(y5, 8, 1) ? y5 : y5 + 1;
  }
  const gradeName = (g) => (g <= -2 ? 'Preschool' : g === -1 ? 'Pre-K' : g === 0 ? 'Kindergarten' : (['1st', '2nd', '3rd'][g - 1] || g + 'th') + ' grade');

  const CSS = `
  .evp-wrap{position:fixed;inset:0;z-index:2000;background:rgba(20,14,40,.72);display:flex;align-items:center;justify-content:center;padding:16px;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;color:#1d1b2f;-webkit-user-select:text;user-select:text}
  .evp{background:#fff;border:5px solid #1d1b2f;border-radius:22px;box-shadow:0 10px 0 #1d1b2f;max-width:560px;width:100%;max-height:100%;overflow:auto;padding:22px 24px}
  .evp h2{margin:0 0 6px;font-size:24px}
  .evp p{margin:6px 0;line-height:1.4;font-size:15px}
  .evp label{display:block;font-weight:700;margin:14px 0 6px}
  .evp input[type=date]{font-size:18px;padding:8px 10px;border:2px solid #1d1b2f;border-radius:10px;width:100%;max-width:260px;background:#fff;color:#1d1b2f}
  .evp .chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}
  .evp .chip{border:2px solid #1d1b2f;border-radius:999px;padding:6px 12px;background:#fff;font-size:14px;cursor:pointer}
  .evp .chip.on{background:#1d1b2f;color:#fff}
  .evp .note{background:#eef6ff;border:2px solid #4361ee;border-radius:14px;padding:10px 12px;margin:14px 0;font-size:14px}
  .evp .note b{display:block;margin-bottom:2px}
  .evp .row{display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;margin-top:12px}
  .evp button.act{border:3px solid #1d1b2f;border-radius:12px;padding:9px 16px;font-size:16px;font-weight:700;cursor:pointer;background:#fff;color:#1d1b2f}
  .evp button.go{background:#52d273}
  .evp button.go:disabled{opacity:.4;cursor:default}
  .evp button.erase{margin-right:auto;background:#fff0f3;border-color:#c9184a;color:#c9184a}
  .evp .result{font-size:16px;margin-top:10px}
  `;

  function open(opts) {
    opts = opts || {};
    if (!document.getElementById('evp-css')) { const st = document.createElement('style'); st.id = 'evp-css'; st.textContent = CSS; document.head.appendChild(st); }
    const cur = read();
    const now = new Date(), sy = schoolYear(now);
    let kYear = cur && cur.kYear ? cur.kYear : null;
    const wrap = document.createElement('div');
    wrap.className = 'evp-wrap';
    const maxD = now.toISOString().slice(0, 10), minD = new Date(now.getFullYear() - 14, 0, 1).toISOString().slice(0, 10);
    wrap.innerHTML = `
      <div class="evp" role="dialog" aria-modal="true" aria-labelledby="evp-t">
        <h2 id="evp-t">${opts.first ? 'Hi, grown-up! 👋' : 'Grown-up settings'}</h2>
        <p>The learning games (Math Buddies and Letter Land) start at the right level for your child's grade, then adjust to how they're doing.</p>
        <label for="evp-date">Child's birthday</label>
        <input type="date" id="evp-date" min="${minD}" max="${maxD}">
        <div class="result" id="evp-res">${kYear ? `Currently set to <b>${gradeName(sy - kYear)}</b> this school year.` : ''}</div>
        <label>Grade this school year <span style="font-weight:400">(change it if it's not right)</span></label>
        <div class="chips" id="evp-chips"></div>
        <div class="note"><b>🔒 Only for setting difficulty.</b>
          This is used for one thing: choosing how hard the learning questions start (titration). Only the school
          grade it works out is saved — the birthday itself is not kept — and it stays in this browser on this
          device. It is never sent anywhere or shared. You can change or erase it any time: hold the ⚙︎ button for 2 seconds.</div>
        <div class="row">
          ${cur ? '<button class="act erase" id="evp-erase">Erase</button>' : ''}
          <button class="act" id="evp-skip">${opts.first ? 'Skip for now' : 'Cancel'}</button>
          <button class="act go" id="evp-save" ${kYear ? '' : 'disabled'}>Save</button>
        </div>
      </div>`;
    document.body.appendChild(wrap);
    const $ = (id) => wrap.querySelector('#' + id);
    const chips = $('evp-chips');
    function drawChips() {
      chips.innerHTML = '';
      for (let g = -1; g <= 6; g++) {
        const c = document.createElement('button');
        c.type = 'button'; c.className = 'chip' + (kYear != null && sy - kYear === g ? ' on' : ''); c.textContent = gradeName(g);
        c.addEventListener('click', () => { kYear = sy - g; drawChips(); $('evp-save').disabled = false; $('evp-res').innerHTML = `Set to <b>${gradeName(g)}</b> this school year.`; });
        chips.appendChild(c);
      }
    }
    drawChips();
    $('evp-date').addEventListener('change', (e) => {
      const v = e.target.value; if (!v) return;
      const [y, m, d] = v.split('-').map(Number), b = new Date(y, m - 1, d);
      kYear = kYearFromBirth(b);
      const ageY = (now - b) / (365.25 * 864e5);
      $('evp-res').innerHTML = `That's about <b>${gradeName(sy - kYear)}</b> this school year (age ${Math.floor(ageY)}). If that's not right, tap the correct grade below.`;
      $('evp-save').disabled = false; drawChips();
    });
    const close = () => { wrap.remove(); if (opts.onDone) opts.onDone(read()); };
    $('evp-save').addEventListener('click', () => { if (kYear == null) return; write({ kYear, setAt: new Date().toISOString().slice(0, 10) }); close(); });
    $('evp-skip').addEventListener('click', () => { if (opts.first && !cur) write({ kYear: null, skipped: true }); close(); });
    if (cur) $('evp-erase').addEventListener('click', () => { try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ } close(); });
    // stop taps on the dialog leaking to the page underneath
    ['pointerdown', 'click', 'touchstart'].forEach((t) => wrap.addEventListener(t, (e) => e.stopPropagation()));
  }

  window.EverettProfile = {
    get: read,
    kYear() { const p = read(); return p && p.kYear ? p.kYear : null; },
    needsSetup() { return !read(); },
    open, schoolYear, gradeName, kYearFromBirth,
  };
})();
