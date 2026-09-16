/* ============================================================================
   portfolio — behaviour
   ----------------------------------------------------------------------------
     1. language toggle (cs / en)
     2. competition table + filters
     3. scroll reveal — reversible
     4. detection cursor (the reticle) — scroll-aware
   ========================================================================== */

(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ==========================================================================
     1. language
     ========================================================================== */

  let lang = 'cs';

  // Copy buttons carry their own bilingual hints outside the data-cs/data-en
  // sweep; each registers a reset here so a language switch relabels it.
  const copyResetters = [];

  const applyLang = () => {
    document.documentElement.lang = lang;
    for (const el of document.querySelectorAll('[data-cs][data-en]')) {
      const next = el.dataset[lang];
      if (next != null) el.textContent = next;
    }
    syncHeroCyclerLang();
    const toggle = document.getElementById('lang-toggle');
    toggle.textContent = lang === 'en' ? 'CS' : 'EN';
    toggle.setAttribute('aria-label', lang === 'en' ? 'Přepnout do češtiny' : 'Switch to English');
    renderCompetitions();
    renderChips();
    for (const reset of copyResetters) reset();
  };

  /* ==========================================================================
     1b. hero headline cycler
     --------------------------------------------------------------------------
     Autoplay-only: types/deletes between a short list of phrases, keeping any
     prefix shared with the previous one on screen instead of clearing and
     retyping it. Ordered most-distinctive-first; a language switch jumps
     straight to the translated phrase at the same index.
     ========================================================================== */

  const HERO_PHRASES = {
    cs: [
      'Programuji roboty.',
      'Programuji hry.',
      'Programuji nástroje.',
      'Modeluji díly pro 3D tisk.',
      'Propojuji hardware se softwarem.',
    ],
    en: [
      'I build robots.',
      'I build games.',
      'I build tools.',
      'I model parts for 3D printing.',
      'I connect hardware and software.',
    ],
  };

  let heroPhraseIndex = 0;
  let syncHeroCyclerLang = () => {};

  function setupHeroCycler() {
    const h1 = document.getElementById('hero-h1');
    const textEl = h1 && h1.querySelector('[data-hero-text]');
    if (!h1 || !textEl) return;

    let charTimer = null;
    let autoplayTimer = null;

    const clearTimers = () => {
      clearTimeout(charTimer);
      clearTimeout(autoplayTimer);
    };

    const scheduleAutoplay = () => {
      if (reduceMotion) return;
      clearTimeout(autoplayTimer);
      autoplayTimer = setTimeout(advance, 2400);
    };

    // Deletes down to the prefix current and target have in common, then
    // types the rest of target — so a shared start (e.g. "Programuji ") is
    // never cleared and retyped.
    const setText = (target, done) => {
      if (reduceMotion) {
        textEl.textContent = target;
        done && done();
        return;
      }
      const current = textEl.textContent;
      let common = 0;
      const max = Math.min(current.length, target.length);
      while (common < max && current[common] === target[common]) common++;
      let pos = current.length;

      // Two separate phases rather than one combined check — once typing
      // passes `common` again, pos > common is true too, so a single check
      // would flip back into deleting forever.
      const deleteStep = () => {
        if (pos > common) {
          pos--;
          textEl.textContent = current.slice(0, pos);
          charTimer = setTimeout(deleteStep, 26);
          return;
        }
        typeStep();
      };
      const typeStep = () => {
        if (pos < target.length) {
          pos++;
          textEl.textContent = target.slice(0, pos);
          charTimer = setTimeout(typeStep, 42);
          return;
        }
        done && done();
      };
      deleteStep();
    };

    function advance() {
      clearTimers();
      const list = HERO_PHRASES[lang] || HERO_PHRASES.cs;
      heroPhraseIndex = (heroPhraseIndex + 1) % list.length;
      setText(list[heroPhraseIndex], scheduleAutoplay);
    }

    syncHeroCyclerLang = () => {
      clearTimers();
      h1.setAttribute('aria-label', h1.dataset[lang === 'en' ? 'ariaEn' : 'ariaCs']);
      const list = HERO_PHRASES[lang] || HERO_PHRASES.cs;
      setText(list[heroPhraseIndex] ?? list[0], scheduleAutoplay);
    };

    scheduleAutoplay();
  }

  document.getElementById('lang-toggle').addEventListener('click', () => {
    lang = lang === 'en' ? 'cs' : 'en';
    applyLang();
  });

  /* ==========================================================================
     2. competitions
     ========================================================================== */

  const COMPETITIONS = [
    { n: 'Programuj.si', y: '2025/26', c: 'žáci', cEn: 'pupils', f: 'prog', r: 'krajské kolo', rEn: 'regional', p: '1.', pEn: '1st', best: true },
    { n: 'Programuj.si', y: '2025/26', c: 'žáci', cEn: 'pupils', f: 'prog', r: 'ústřední kolo', rEn: 'national', p: '13.', pEn: '13th', best: true },
    { n: 'AI olympiáda', y: '2025/26', c: 'AI tech', f: 'prog', r: 'krajské kolo', rEn: 'regional', p: '2.', pEn: '2nd', best: true },
    { n: 'Technická olympiáda', y: '2025/26', c: 'NeuroRace', f: 'prog', r: '—', p: '3. místo ve skupině', pEn: '3rd-place group', best: true },
    { n: 'Náboj Junior', y: '2025/26', f: 'math', r: 'kraj', rEn: 'regional', p: '1.', pEn: '1st', best: true },
    { n: 'Náboj Junior', y: '2025/26', f: 'math', r: 'celorepublikově', rEn: 'national', p: '7.', pEn: '7th', best: true },
    { n: 'Náboj Junior', y: '2025/26', f: 'math', r: 'mezinárodně', rEn: 'international', p: '18.', pEn: '18th', best: true },
    { n: 'MaSO', y: '2025/26', f: 'math', r: 'jaro, kraj', rEn: 'spring, regional', p: '1.', pEn: '1st', best: true },
    { n: 'MaSO', y: '2025/26', f: 'math', r: 'jaro, celostátně', rEn: 'spring, national', p: '31.', pEn: '31st' },
    { n: 'Matematická olympiáda', y: '2025/26', c: 'P', f: 'math', r: 'krajské kolo', rEn: 'regional', p: '2.–3.', pEn: '2nd–3rd', best: true },
    { n: 'Matematická olympiáda', y: '2025/26', c: 'Z9', f: 'math', r: 'okresní kolo', rEn: 'district', p: '3.', pEn: '3rd', best: true },
    { n: 'Matematická olympiáda', y: '2025/26', c: 'Z9', f: 'math', r: 'krajské kolo', rEn: 'regional', p: '10.–13.', pEn: '10th–13th' },
    { n: 'Fyzikální olympiáda', y: '2025/26', c: 'E', f: 'phys', r: 'okresní kolo', rEn: 'district', p: '2.', pEn: '2nd', best: true },
    { n: 'Fyzikální olympiáda', y: '2025/26', c: 'E', f: 'phys', r: 'krajské kolo', rEn: 'regional', p: '12.', pEn: '12th' },
    { n: 'MaSO', y: '2024/25', f: 'math', r: 'jaro, kraj', rEn: 'spring, regional', p: '6.', pEn: '6th' },
    { n: 'Matematická olympiáda', y: '2024/25', c: 'Z8', f: 'math', r: 'okresní kolo', rEn: 'district', p: '3.–6.', pEn: '3rd–6th' },
    { n: 'Fyzikální olympiáda', y: '2024/25', c: 'F', f: 'phys', r: 'okresní kolo', rEn: 'district', p: '5.', pEn: '5th' },
    { n: 'Matematická olympiáda', y: '2023/24', c: 'Z7', f: 'math', r: 'okresní kolo', rEn: 'district', p: '2.', pEn: '2nd', best: true },
    { n: 'Fyzikální olympiáda', y: '2023/24', c: 'G', f: 'phys', r: 'okresní kolo', rEn: 'district', p: '3.', pEn: '3rd', best: true },
    { n: 'Matematická olympiáda', y: '2022/23', c: 'Z6', f: 'math', r: 'okresní kolo', rEn: 'district', p: '3.', pEn: '3rd', best: true },
  ];

  const filters = { focus: 'all', year: 'all', scope: 'best' };

  const FILTER_GROUPS = {
    focus: [
      { value: 'all', cs: 'Vše', en: 'All' },
      { value: 'prog', cs: 'Programování', en: 'Programming' },
      { value: 'math', cs: 'Matematika', en: 'Maths' },
      { value: 'phys', cs: 'Fyzika', en: 'Physics' },
    ],
    year: [
      { value: 'all', cs: 'Vše', en: 'All' },
      { value: '2025/26', cs: '2025/26', en: '2025/26' },
      { value: '2024/25', cs: '2024/25', en: '2024/25' },
      { value: '2023/24', cs: '2023/24', en: '2023/24' },
      { value: '2022/23', cs: '2022/23', en: '2022/23' },
    ],
    scope: [
      { value: 'best', cs: 'Nejlepší výsledky', en: 'Best results' },
      { value: 'all', cs: 'Vše', en: 'Everything' },
    ],
  };

  function renderChips() {
    for (const [key, options] of Object.entries(FILTER_GROUPS)) {
      const host = document.getElementById('filter-' + key);
      host.textContent = '';
      for (const option of options) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'chip';
        btn.textContent = option[lang];
        btn.setAttribute('aria-pressed', String(filters[key] === option.value));
        btn.addEventListener('click', () => {
          filters[key] = option.value;
          renderChips();
          renderCompetitions();
        });
        host.appendChild(btn);
      }
    }
  }

  // Organiser marks in assets/competitions. `cls` adds a per-logo treatment.
  // Technická olympiáda has no mark of its own; its Plzeň round runs at ZČU,
  // so the university's mark stands in.
  const COMP_LOGOS = {
    'Programuj.si': { src: 'assets/competitions/programujsi.png' },
    'AI olympiáda': { src: 'assets/competitions/aiolympiada.png' },
    'Technická olympiáda': { src: 'assets/competitions/technickaolympiada-zcu.svg' },
    'Náboj Junior': { src: 'assets/competitions/naboj.svg' },
    'MaSO': { src: 'assets/competitions/maso.png' },
    'Matematická olympiáda': { src: 'assets/competitions/matematickaolympiada.svg' },
    // The FO logo is a tall badge that turns into a dark sliver at row size, so
    // it is shown as its galaxy alone: a round crop that turns on hover.
    'Fyzikální olympiáda': { src: 'assets/competitions/fyzikalniolympiada-galaxy.png', cls: 'complogo--fo' },
  };

  function competitionLogo(name) {
    const entry = COMP_LOGOS[name];
    if (!entry) return null;
    const img = document.createElement('img');
    img.className = 'complogo' + (entry.cls ? ' ' + entry.cls : '');
    img.src = entry.src;
    img.alt = '';
    img.width = 96;
    img.height = 96;
    img.loading = 'lazy';
    return img;
  }

  function renderCompetitions() {
    const en = lang === 'en';
    const { focus, year, scope } = filters;

    const inScope = (r) =>
      (focus === 'all' || r.f === focus) && (year === 'all' || r.y === year);
    const matching = COMPETITIONS.filter((r) => inScope(r) && (scope === 'all' || r.best));
    const total = COMPETITIONS.filter(inScope).length;

    const body = document.getElementById('competitions-body');
    body.textContent = '';
    for (const r of matching) {
      const tr = document.createElement('tr');
      const cells = [
        r.n,
        r.y,
        (en ? (r.cEn || r.c) : r.c) || '—',
        (en ? (r.rEn || r.r) : r.r) || '—',
        en ? (r.pEn || r.p) : r.p,
      ];
      cells.forEach((value, i) => {
        const td = document.createElement('td');
        const mark = i === 0 ? competitionLogo(value) : null;
        if (mark) {
          const cell = document.createElement('span');
          cell.className = 'compcell';
          cell.append(mark, value);
          td.appendChild(cell);
        } else {
          td.textContent = value;
        }
        tr.appendChild(td);
      });
      body.appendChild(tr);
    }

    document.getElementById('competitions-empty').hidden = matching.length !== 0;
    document.getElementById('competitions-count').textContent = en
      ? matching.length + ' of ' + total + ' results shown'
      : 'Zobrazeno ' + matching.length + ' z ' + total + ' výsledků';
  }

  /* ==========================================================================
     3. scroll reveal — reversible
     --------------------------------------------------------------------------
     An element that leaves through the BOTTOM edge is re-hidden, so scrolling
     back down plays the entrance again. Leaving through the TOP is ignored:
     re-hiding content above the viewport would make the page twitch behind you
     on the way up.
     ========================================================================== */

  const REVEAL_SEL =
    '#projekty > h2, #projekty > h3, #projekty > div, #o-mne > div, #o-mne > figure, ' +
    '#cv > h2, #cv > h3, #cv > div, #uspechy > h2, #uspechy > h3, #uspechy > div, #kontakt > div';

  function setupReveal() {
    if (reduceMotion || !('IntersectionObserver' in window)) return;

    const targets = Array.from(document.querySelectorAll(REVEAL_SEL));
    if (!targets.length) return;

    for (const el of targets) {
      el.classList.add('reveal');
      // Only what starts below the fold begins hidden — anything already on
      // screen must not flash out on load.
      if (el.getBoundingClientRect().top > window.innerHeight * 0.85) {
        el.classList.add('is-hidden');
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.remove('is-hidden');
          } else if (entry.boundingClientRect.top > 0) {
            // Below the viewport: we scrolled up past it. Arm it again.
            entry.target.classList.add('is-hidden');
          }
        }
      },
      // 12% bottom inset mirrors the original `top < innerHeight * 0.88` gate.
      { rootMargin: '0px 0px -12% 0px' }
    );
    for (const el of targets) observer.observe(el);

    window.addEventListener('beforeprint', () => {
      for (const el of targets) el.classList.remove('is-hidden');
    });
  }

  /* ==========================================================================
     4. detection cursor — scroll-aware
     --------------------------------------------------------------------------
     The reticle used to update only on pointermove, so scrolling left it
     pointing at a stale rectangle. Two fixes:
       - the locked element's rect is re-read every animation frame, so the
         frame stays glued to it through smooth and momentum scrolling;
       - a scroll or resize re-runs the hit test at the last known cursor
         position, so the reticle re-targets whatever slid under the cursor.
     ========================================================================== */

  // closest() walks outward from the pointer, so the small targets first in
  // this list win over the block around them. Three blocks are deliberately
  // NOT targets: the whole tech stack (only its columns are), the whole
  // contact area (only each channel is) and the whole filter panel (only its
  // chips are).
  const RETICLE_SEL =
    '.chip, .creds__all, .gh-btn, .award__link, .contact__item, .stackgroup, ' +
    '.btn, .nav a, .table tbody tr, .creds__lead, .portrait, .award, ' +
    '#projekty > div, #cv > div:not(.stackgroups), #uspechy > div:not(.filters)';

  function setupReticle() {
    if (reduceMotion) return;

    const box = document.getElementById('reticle');
    if (!box) return;

    const label = box.querySelector('[data-reticle-label]');
    const text = box.querySelector('[data-reticle-text]');
    const scan = box.querySelector('[data-reticle-scan]');

    const cur = { x: innerWidth / 2, y: innerHeight / 2, w: 24, h: 24 };
    const dest = { ...cur };
    const pointer = { x: 0, y: 0, known: false };
    let locked = null;
    let retest = false;
    let active = false;

    const captionFor = (hit) => {
      const src = hit.querySelector('h4, h3, p, td') || hit;
      let t = (src.textContent || '').trim().replace(/\s+/g, ' ');
      if (t.length > 40) {
        const cut = t.slice(0, 40);
        const sp = cut.lastIndexOf(' ');
        t = (sp > 12 ? cut.slice(0, sp) : cut) + '…';
      }
      return t;
    };

    // Point the reticle at an element and size it to that element's box.
    const aimAt = (hit) => {
      const r = hit.getBoundingClientRect();
      dest.x = r.left + r.width / 2;
      dest.y = r.top + r.height / 2;
      dest.w = r.width + 20;
      dest.h = r.height + 14;

      if (locked !== hit) {
        locked = hit;
        const t = captionFor(hit);
        text.textContent = t;
        label.style.opacity = t ? '1' : '0';
        scan.style.opacity = '1';
      }

      // Flip the caption above the frame when it would fall off-screen.
      const below = r.bottom + 34 > innerHeight;
      label.style.top = below ? 'auto' : '100%';
      label.style.bottom = below ? '100%' : 'auto';
      label.style.marginTop = below ? '0' : '7px';
      label.style.marginBottom = below ? '7px' : '0';
    };

    // Free-floating: a small square that just follows the cursor.
    const aimFree = (x, y) => {
      locked = null;
      dest.x = x;
      dest.y = y;
      dest.w = 24;
      dest.h = 24;
      label.style.opacity = '0';
      scan.style.opacity = '0';
    };

    const hitTestAtPointer = () => {
      if (!pointer.known) return;
      const under = document.elementFromPoint(pointer.x, pointer.y);
      const hit = under && under.closest ? under.closest(RETICLE_SEL) : null;
      if (hit) aimAt(hit);
      else aimFree(pointer.x, pointer.y);
    };

    const onMove = (e) => {
      box.style.opacity = '1';
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.known = true;
      const hit = e.target && e.target.closest ? e.target.closest(RETICLE_SEL) : null;
      if (hit) aimAt(hit);
      else aimFree(e.clientX, e.clientY);
    };

    window.addEventListener('pointerleave', () => {
      box.style.opacity = '0';
    });

    // Scroll and resize both invalidate the current aim. Flag it and let the
    // next frame do the work, so a fast scroll costs one hit test per frame
    // rather than one per event.
    const invalidate = () => { retest = true; };
    window.addEventListener('scroll', invalidate, { passive: true });
    window.addEventListener('resize', invalidate, { passive: true });

    const tick = () => {
      if (retest) {
        retest = false;
        hitTestAtPointer();
      } else if (locked) {
        // Still on the same element — re-read its box so the frame tracks it
        // through smooth scrolling without a fresh hit test.
        if (locked.isConnected) aimAt(locked);
        else locked = null;
      }

      const k = 0.22;
      cur.x += (dest.x - cur.x) * k;
      cur.y += (dest.y - cur.y) * k;
      cur.w += (dest.w - cur.w) * k;
      cur.h += (dest.h - cur.h) * k;
      box.style.width = cur.w + 'px';
      box.style.height = cur.h + 'px';
      box.style.transform =
        'translate3d(' + (cur.x - cur.w / 2) + 'px,' + (cur.y - cur.h / 2) + 'px,0)';
      requestAnimationFrame(tick);
    };

    // A static `(pointer: fine)` check used to gate this whole feature at
    // startup — but on a touchscreen Windows laptop with a mouse or trackpad
    // also attached, Chromium can report the PRIMARY pointer as "coarse"
    // (the touchscreen) even while the visitor drives the page with the
    // mouse, which silently killed the reticle for a real mouse user with no
    // way to recover short of a reload. Activating on the first real,
    // non-touch pointermove instead reacts to what the visitor is actually
    // doing rather than to what the device claims about itself, so it is
    // correct on every device, hybrid ones included.
    const activate = (e) => {
      if (active || e.pointerType === 'touch') return;
      active = true;
      window.removeEventListener('pointermove', activate);
      window.addEventListener('pointermove', onMove, { passive: true });
      requestAnimationFrame(tick);
      onMove(e);
    };
    window.addEventListener('pointermove', activate, { passive: true });
  }

  /* ==========================================================================
     5. scroll spy + reading progress
     --------------------------------------------------------------------------
     Answers "where am I on this page" two ways: the nav link for the section
     you are reading lights up and grows a rule, and a hairline across the
     bottom of the nav tracks how far down the document you are.
     ========================================================================== */

  function setupScrollSpy() {
    const bar = document.getElementById('nav-progress');
    const links = [...document.querySelectorAll('.nav-links a[href^="#"]')];
    const sections = links
      .map((a) => ({ link: a, el: document.querySelector(a.getAttribute('href')) }))
      .filter((s) => s.el);
    if (!sections.length && !bar) return;

    let queued = false;
    let active = null;

    const update = () => {
      queued = false;

      if (bar) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
        bar.style.width = (ratio * 100).toFixed(2) + '%';
      }

      // The section whose top has passed just under the sticky nav wins.
      const nav = document.querySelector('.nav');
      const line = (nav ? nav.getBoundingClientRect().bottom : 0) + 8;
      let current = null;
      for (const s of sections) {
        if (s.el.getBoundingClientRect().top <= line) current = s;
      }

      // The last section can sit too close to the end of the document to ever
      // be scrolled under that line — #kontakt stops 371px short of it — so the
      // final stretch of the page belongs to it outright.
      const de = document.documentElement;
      const remaining = de.scrollHeight - (window.scrollY + window.innerHeight);
      if (remaining <= 120) current = sections[sections.length - 1];

      if (current !== active) {
        if (active) active.link.classList.remove('is-active');
        if (current) current.link.classList.add('is-active');
        active = current;
      }
    };

    const queue = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(update);
    };

    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue, { passive: true });
    update();
  }

  /* ==========================================================================
     6. copy-to-clipboard
     --------------------------------------------------------------------------
     A Discord username is not a URL, so there is nothing to link to. Copying it
     is the action someone actually wants.
     ========================================================================== */

  function setupCopy() {
    for (const btn of document.querySelectorAll('[data-copy]')) {
      const hint = () =>
        lang === 'en' ? 'click to copy' : 'klikni pro zkopírování';
      const done = () => btn.dataset['copyLabel' + (lang === 'en' ? 'En' : 'Cs')];

      const reset = () => {
        btn.dataset.hint = hint();
        btn.classList.remove('is-copied');
      };
      reset();
      copyResetters.push(reset);

      btn.addEventListener('click', async () => {
        const text = btn.dataset.copy;
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          // Clipboard API needs a secure context; fall back to a selection so
          // the value can still be copied by hand.
          const r = document.createRange();
          r.selectNodeContents(btn);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(r);
          return;
        }
        btn.dataset.hint = done();
        btn.classList.add('is-copied');
        clearTimeout(btn._copyTimer);
        btn._copyTimer = setTimeout(reset, 1800);
      });
    }
  }

  /* ==========================================================================
     boot
     ========================================================================== */

  /* ==========================================================================
     7. nav auto-hide (phones)
     --------------------------------------------------------------------------
     Scrolling down hides the nav, any upward scroll brings it back. Only acts
     while the phone layout is active; never hides at the top of the page or
     while focus is inside the nav (keyboard users).
     ========================================================================== */

  function setupNavAutoHide() {
    const nav = document.querySelector('.nav');
    if (!nav) return;
    const phone = window.matchMedia('(max-width: 680px)');
    let lastY = window.scrollY;
    let queued = false;

    const update = () => {
      queued = false;
      const y = window.scrollY;
      const delta = y - lastY;
      if (!phone.matches || y < nav.offsetHeight || nav.contains(document.activeElement)) {
        nav.classList.remove('nav--hidden');
      } else if (delta > 6) {
        nav.classList.add('nav--hidden');
      } else if (delta < -6) {
        nav.classList.remove('nav--hidden');
      }
      if (Math.abs(delta) > 6) lastY = y;
    };

    window.addEventListener('scroll', () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(update);
    }, { passive: true });
    phone.addEventListener('change', () => nav.classList.remove('nav--hidden'));
    nav.addEventListener('focusin', () => nav.classList.remove('nav--hidden'));
  }

  /* ==========================================================================
     8. project details toggle (phones)
     --------------------------------------------------------------------------
     Adds a "Detail" button under each project title. CSS only shows it at
     phone width, where it folds the description and tags away; on desktop the
     button is hidden and the body is always open.
     ========================================================================== */

  function setupProjectToggles() {
    const NS = 'http://www.w3.org/2000/svg';
    document.querySelectorAll('#projekty .entry').forEach((entry, i) => {
      const head = entry.querySelector('.entry__head');
      const body = entry.querySelector('.entry__body');
      if (!head || !body) return;
      if (!body.id) body.id = 'project-body-' + i;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'entry__toggle';
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-controls', body.id);

      // data-cs/data-en: the language sweep relabels it like any other text
      const label = document.createElement('span');
      label.dataset.cs = 'Detail';
      label.dataset.en = 'Details';
      label.textContent = lang === 'en' ? 'Details' : 'Detail';

      const svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('viewBox', '0 0 12 12');
      svg.setAttribute('aria-hidden', 'true');
      const path = document.createElementNS(NS, 'path');
      path.setAttribute('d', 'M2.5 4.5 6 8l3.5-3.5');
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', 'currentColor');
      path.setAttribute('stroke-width', '1.6');
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('stroke-linejoin', 'round');
      svg.appendChild(path);

      btn.append(label, svg);
      btn.addEventListener('click', () => {
        const open = entry.classList.toggle('is-open');
        btn.setAttribute('aria-expanded', String(open));
      });
      head.appendChild(btn);
    });
  }

  // Toggles first: they change project heights, which the reveal measures.
  setupProjectToggles();
  renderChips();
  renderCompetitions();
  setupReveal();
  setupReticle();
  setupScrollSpy();
  setupCopy();
  setupNavAutoHide();
  setupHeroCycler();
})();
