/* Vrchní (the ROBO2026 waiter robot) drives along the bottom edge as the page scrolls.
   Position follows scroll progress, wheels turn by the distance driven, the water in the cup
   leans with acceleration and the eye blinks now and then. Click → the ROBO2026 page. */
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const svg = `
<svg viewBox="0 -14 124 121" aria-hidden="true">
  <defs><clipPath id="vr-cup"><polygon points="37,-10 83,-10 73,36 47,36"/></clipPath></defs>
  <g class="vr__wheel" style="transform-origin:36px 92px"><circle cx="36" cy="92" r="12" fill="#0e0e12" stroke="#34343f" stroke-width="2"/><path d="M36 81v22M25 92h22" stroke="#4a4a57" stroke-width="2.5"/></g>
  <circle cx="92" cy="98" r="6" fill="#cfd2da"/>
  <g class="vr__body">
    <polygon class="vr__cup" points="37,-10 83,-10 73,36 47,36"/>
    <g clip-path="url(#vr-cup)"><g class="vr__water"><rect x="20" y="8" width="80" height="40" fill="#5b9af0" opacity=".6"/></g></g>
    <rect x="32" y="34" width="56" height="7" rx="3" fill="#f2f2f2"/>
    <rect x="12" y="40" width="98" height="54" rx="11" fill="#17171c" stroke="#2c2c36" stroke-width="1.5"/>
    <circle cx="101" cy="52" r="10.5" fill="#f2f2f2"/>
    <g class="vr__eye"><circle cx="104" cy="53" r="4.6" fill="#111"/></g>
    <path d="M94 68c4 3 9 3 12-1c3 4 8 4 11 1" fill="none" stroke="#f2f2f2" stroke-width="3" stroke-linecap="round"/>
    <path d="M101 75l7 4-7 4zM115 75l-7 4 7 4z" fill="#e0453a"/>
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
    rot += (v * dt) / 12 * 57.3;            // wheel radius 12 svg px
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
