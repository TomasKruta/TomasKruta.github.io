/* Vrchní (the ROBO2026 waiter robot) drives along the bottom edge as the page scrolls.
   Position follows scroll progress, wheels turn by the distance driven, the water in the cup
   leans with acceleration and the eye blinks now and then. Click → the ROBO2026 page. */
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const svg = `
<svg viewBox="0 -34 132 146" style="overflow:visible" aria-hidden="true">
  <defs><clipPath id="vr-cup"><path d="M33 -26H79L72 31Q71.5 34 68 34H44Q40.5 34 40 31Z"/></clipPath></defs>
  <g class="vr__wheel" style="transform-origin:44px 96px"><circle cx="44" cy="96" r="11" fill="#0e0e12" stroke="#34343f" stroke-width="2"/><path d="M44 86v20M34 96h20" stroke="#4a4a57" stroke-width="2.5"/></g>
  <circle cx="106" cy="100" r="5" fill="#9a9ca4"/>
  <g class="vr__body">
    <path d="M33 -26H79L72 31Q71.5 34 68 34H44Q40.5 34 40 31Z" fill="#d8f0f7" opacity=".5"/>
    <g clip-path="url(#vr-cup)"><g class="vr__water"><path d="M10 2Q22 -2 34 2T58 2T82 2T106 2V50H10Z" fill="#4f8fe8" opacity=".75"/><path d="M10 2Q22 -2 34 2T58 2T82 2T106 2" fill="none" stroke="#a9ccff" stroke-width="1.4"/></g><path d="M39 -18L44 24" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".55"/></g>
    <path d="M33 -26H79L72 31Q71.5 34 68 34H44Q40.5 34 40 31Z" fill="none" stroke="#22313c" stroke-width="1.6" stroke-linejoin="round"/>
    <rect x="30" y="-30" width="52" height="5" rx="2.5" fill="#eaf6fa" stroke="#22313c" stroke-width="1.4"/>
    <rect x="20" y="34" width="72" height="5" rx="2" fill="#d6d6d6"/>
    <path d="M8 47Q8 39 16 39H88L99 30H113Q122 30 122 39V88Q122 97 113 97H16Q8 97 8 89Z" fill="#17171c" stroke="#2c2c36" stroke-width="1.5"/>
    <path d="M9 49H121" stroke="#2c2c36" stroke-width="1"/>
    <circle cx="117" cy="32" r="18.5" fill="#1d1d22"/>
    <circle cx="117" cy="32" r="15" fill="#ffffff"/>
    <g class="vr__eye"><circle cx="121" cy="32.5" r="5.8" fill="#1d1d22"/></g>
    <path transform="translate(114 61) scale(2.2) translate(-118 -62)" d="M108 60c4 4 9 4 13 0c3 3 6 3 8 0c-1 4-5 6-8 4c-5 3-10 3-13-4z" fill="#ffffff"/>
    <g transform="translate(120 84) scale(2.2) translate(-123 -75)"><path d="M115 70l8 5-8 5zM131 70l-8 5 8 5z" fill="#b8322b"/><rect x="121" y="72.5" width="4" height="5" fill="#b8322b"/></g>
  </g>
</svg>`;

  const a = document.createElement('a');
  a.className = 'vrchni';
  a.href = 'projects/robo2026/';
  a.title = 'Vrchní, ROBO2026';
  a.setAttribute('aria-label', 'Vrchní, vozítko ze soutěže ROBO2026');
  a.innerHTML = svg;
  document.body.appendChild(a);

  const wheels = a.querySelectorAll('.vr__wheel');
  const water = a.querySelector('.vr__water');
  const body = a.querySelector('.vr__body');

  let x = 0, v = 0, rot = 0, tilt = 0, last = performance.now(), raf = 0;
  const target = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
    return p * (innerWidth - a.offsetWidth - 32);
  };

  function frame(now) {
    const dt = Math.min(50, now - last) / 1000; last = now;
    const t = target();
    const nv = (t - x) * 6;                 // px/s, eased follow
    const acc = (nv - v) / Math.max(dt, 1e-3);
    v = nv; x += v * dt;
    rot += (v * dt) / 11 * 57.3;            // wheel radius 11 svg px
    tilt += (Math.max(-14, Math.min(14, -acc / 120)) - tilt) * Math.min(1, dt * 8);
    a.style.transform = `translateX(${x.toFixed(1)}px)`;
    for (const w of wheels) w.style.transform = `rotate(${rot.toFixed(1)}deg)`;
    water.style.transform = `rotate(${tilt.toFixed(2)}deg)`;
    body.style.transform = `translateY(${(Math.abs(v) > 5 ? Math.sin(now / 70) * 0.8 : 0).toFixed(2)}px)`;
    raf = Math.abs(t - x) > 0.3 || Math.abs(tilt) > 0.05 ? requestAnimationFrame(frame) : 0;
  }
  const wake = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };
  addEventListener('scroll', wake, { passive: true });
  addEventListener('resize', wake);
  x = target(); wake();

  // blink every few seconds
  const blink = () => {
    a.classList.add('is-blink');
    setTimeout(() => a.classList.remove('is-blink'), 160);
    setTimeout(blink, 2500 + Math.random() * 4000);
  };
  setTimeout(blink, 2000);
})();
