/* Scroll-driven 3D story for project subpages.
   Markup: <div class="s3d"> with .s3d__stage (canvas host). The page's own sections/header carry data-s3d="<keyname>";
   scrolling through them (DOM order) blends the keyframes of the config (key.name === attribute, else DOM index). */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const ease = (x) => x * x * (3 - 2 * x);
const lerp = (a, b, t) => a + (b - a) * t;
const lerp3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

function webglOK() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
}

/** Blend two keyframes. Numbers, [x,y,z] arrays and {name: number} maps are interpolated, the rest snaps. */
function blend(a, b, t) {
  const out = {};
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const va = a[k] ?? b[k], vb = b[k] ?? a[k];
    if (typeof va === 'number') out[k] = lerp(va, vb, t);
    else if (Array.isArray(va) && typeof va[0] === 'number') out[k] = lerp3(va, vb, t);
    else if (va && typeof va === 'object' && !Array.isArray(va)) {
      const o = {};
      for (const n of new Set([...Object.keys(va), ...Object.keys(vb)])) o[n] = lerp(va[n] ?? 0, vb[n] ?? 0, t);
      out[k] = o;
    } else out[k] = t < 0.5 ? va : vb;
  }
  return out;
}

export async function mountScroll3D(section, config) {
  const stage = section.querySelector('.s3d__stage');
  const steps = [...document.querySelectorAll('[data-s3d]')];
  const keyMap = steps.map((el, n) => { const i = config.keys.findIndex((k) => k.name === el.dataset.s3d); return i >= 0 ? i : Math.min(n, config.keys.length - 1); });
  const inFlow = matchMedia('(max-width: 1099px)');
  const labelsHost = section.querySelector('.s3d__labels');
  const loading = section.querySelector('.s3d__loading');
  if (!webglOK()) { section.classList.add('s3d--fallback'); return; }

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance', logarithmicDepthBuffer: !!config.logDepth });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = config.exposure ?? 1;
  stage.prepend(renderer.domElement);
  renderer.domElement.className = 's3d__canvas';

  const scene = new THREE.Scene();
  if (config.environment) {
    const pm = new THREE.PMREMGenerator(renderer);
    scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = config.environment;
  }
  const camera = new THREE.PerspectiveCamera(config.keys[0].fov ?? 30, 1, config.near ?? 1, config.far ?? 5000);

  const ctx = { THREE, scene, camera, renderer, loader: new GLTFLoader(), section, stage };
  let model;
  try {
    model = await config.setup(ctx);
  } catch (e) {
    console.error('[scroll3d]', e);
    section.classList.add('s3d--fallback');
    renderer.dispose(); renderer.domElement.remove();
    return;
  }
  loading?.remove();
  section.classList.add('s3d--ready');

  // labels: HTML elements projected from 3D anchors (text comes from data-cs/data-en, so the language toggle works)
  const labels = (config.labels || []).map((l) => {
    const el = document.createElement('div');
    el.className = 's3d__label s3d__label--' + (l.side || 'right');
    el.innerHTML = '<span class="s3d__dot"></span><span class="s3d__line"></span><span class="s3d__tag"><b></b><small></small></span>';
    const b = el.querySelector('b'), s = el.querySelector('small');
    const lang = document.documentElement.lang === 'en' ? 'en' : 'cs';
    b.dataset.cs = l.cs; b.dataset.en = l.en; b.textContent = lang === 'en' ? l.en : l.cs;
    if (l.subCs) { s.dataset.cs = l.subCs; s.dataset.en = l.subEn; s.textContent = lang === 'en' ? l.subEn : l.subCs; } else s.remove();
    labelsHost.appendChild(el);
    return { ...l, el, v: new THREE.Vector3() };
  });

  let W = 0, H = 0, host = stage, vw = null;
  const resize = () => {
    const r = host.getBoundingClientRect();
    W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
    renderer.setSize(W, H, false);
    camera.aspect = W / H; camera.updateProjectionMatrix();
    dirty = true;
  };
  const ro = new ResizeObserver(resize); ro.observe(stage);

  // scroll position -> continuous step index t in [0, steps-1]
  const target = { t: 0 };
  const measure = () => {
    const anchor = innerHeight * 0.5;
    let t = -0.5;
    for (const s of steps) { const r = s.getBoundingClientRect(); t += clamp((anchor - r.top) / r.height, 0, 1); }
    // at the very top the first key is shown in full; it gives way to the next one within the first half screen
    t = Math.min(t, scrollY / (innerHeight * 0.5));
    // the last element can never reach the anchor line: ease into the final key over the last stretch of the page
    const rest = document.documentElement.scrollHeight - innerHeight - scrollY;
    t = lerp(t, steps.length - 1, clamp(1 - rest / (innerHeight * 0.6), 0, 1));
    target.t = clamp(t, 0, Math.max(0, steps.length - 1));
  };
  addEventListener('scroll', () => { measure(); wake(); }, { passive: true });
  addEventListener('resize', () => { measure(); wake(); });

  let cur = 0, dirty = true, running = false, visible = false, last = performance.now(), clock = 0;
  const tmpT = new THREE.Vector3();

  const frame = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; clock += dt;
    if (vw) {
      // full-page viewer: free orbit camera, slider and label toggle
      const base = config.keys[config.viewer.base ?? 0];
      const k = { ...base, ...config.viewer.key(vw.value) };
      vw.controls.update();
      config.update?.(k, { t: 0, dt, clock, active: config.viewer.base ?? 0, ctx, model });
      const ids = new Set(vw.labels ? config.viewer.labels || [] : []);
      for (const l of labels) {
        const p = l.anchorFn ? l.anchorFn(k, model) : l.anchor;
        l.v.set(...p).project(camera);
        const on = ids.has(l.id) && !(vw.value < 0.35 && (config.viewer.inner || []).includes(l.id)) && l.v.z < 1 && Math.abs(l.v.x) < 1.05 && Math.abs(l.v.y) < 1.05;
        l.el.classList.toggle("is-on", on);
        if (on) l.el.style.transform = `translate(${((l.v.x + 1) / 2) * W}px, ${((1 - l.v.y) / 2) * H}px)`;
      }
      renderer.render(scene, camera);
      requestAnimationFrame(frame);
      return;
    }
    const prev = cur;
    cur = reduced ? target.t : lerp(cur, target.t, 1 - Math.exp(-dt * 6));
    if (Math.abs(cur - target.t) < 1e-4) cur = target.t;
    const i = Math.floor(cur), f = cur - i;
    const k = blend(config.keys[keyMap[i]], config.keys[keyMap[Math.min(i + 1, steps.length - 1)]], ease(f));
    const active = keyMap[Math.round(cur)];

    // idle orbit around the target, so the model never looks frozen
    const orbit = (k.orbit || 0) * (reduced ? 0 : 1);
    const spin = inFlow.matches && !reduced; // narrow layout: the hero model turns slowly on its own
    const ang = Math.sin(clock * 0.25) * orbit + (spin ? clock * 0.2 : 0);
    tmpT.set(...k.target);
    if (inFlow.matches && config.narrowLift) tmpT.y -= config.narrowLift; // phone layout: lift the model into the middle of its box
    const off = new THREE.Vector3(...k.cam).sub(tmpT).applyAxisAngle(new THREE.Vector3(0, 1, 0), ang);
    if (inFlow.matches && config.narrowZoom) off.multiplyScalar(config.narrowZoom); // phone layout: move closer (the fit below still prevents clipping)
    let fov = k.fov || camera.fov;
    if (config.fitRadius) {
      // never closer than needed to keep a sphere of fit radius fully inside the stage (width and height)
      const R = k.fit ?? config.fitRadius, half = (fov * Math.PI) / 360;
      const hHalf = Math.atan(Math.tan(half) * Math.min(camera.aspect, 3));
      const need = R / Math.sin(Math.min(half, hHalf));
      const d = off.length();
      if (d < need) off.multiplyScalar(need / d);
    } else if (k.fov) fov = Math.min(70, k.fov / Math.pow(Math.min(1, camera.aspect), 0.75));
    camera.position.copy(tmpT).add(off);
    if (Math.abs(camera.fov - fov) > 1e-3) { camera.fov = fov; camera.updateProjectionMatrix(); }
    camera.lookAt(tmpT);

    config.update?.(k, { t: cur, dt, clock, active, ctx, model });

    // labels
    const show = new Set(config.keys[active].labels || []);
    for (const l of labels) {
      const p = l.anchorFn ? l.anchorFn(k, model) : l.anchor;
      l.v.set(...p).project(camera);
      const on = show.has(l.id) && l.v.z < 1 && Math.abs(l.v.x) < 1.05 && Math.abs(l.v.y) < 1.05;
      l.el.classList.toggle('is-on', on);
      if (on) l.el.style.transform = `translate(${((l.v.x + 1) / 2) * W}px, ${((1 - l.v.y) / 2) * H}px)`;
    }

    renderer.render(scene, camera);
    const moving = Math.abs(prev - cur) > 1e-5 || orbit > 0 || spin || config.animate;
    if (visible && (moving || dirty)) { dirty = false; requestAnimationFrame(frame); } else running = false;
  };
  function wake() { if (!running && visible) { running = true; last = performance.now(); requestAnimationFrame(frame); } }

  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) { measure(); wake(); } }, { rootMargin: '100px' }).observe(stage);
  // ---- full-page viewer (orbit / zoom, explode slider, labels checkbox) ----
  if (config.viewer) {
    const lang = () => (document.documentElement.lang === "en" ? "en" : "cs");
    const btn = document.createElement("button");
    btn.type = "button"; btn.className = "s3d__open";
    btn.dataset.cs = "Prohlédnout 3D"; btn.dataset.en = "Explore in 3D"; btn.textContent = btn.dataset[lang()];
    stage.appendChild(btn);
    const el = document.createElement("div");
    el.className = "s3d-viewer"; el.hidden = true; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true");
    const v = config.viewer;
    el.innerHTML = '<div class="s3d-viewer__wrap"></div><div class="s3d-viewer__bar"><label class="s3d-viewer__ctl"><span data-role="sl"></span><input type="range" min="0" max="1" step="0.005" value="0"></label><label class="s3d-viewer__ctl s3d-viewer__chk"><input type="checkbox" checked><span data-role="lb"></span></label><span class="s3d-viewer__hint" data-role="hint"></span></div><button type="button" class="s3d-viewer__close" aria-label="Close">×</button>';
    document.body.appendChild(el);
    const setTxt = (sel, cs, en) => { const n = el.querySelector(sel); n.dataset.cs = cs; n.dataset.en = en; n.textContent = lang() === "en" ? en : cs; };
    setTxt('[data-role="sl"]', v.cs, v.en);
    setTxt('[data-role="lb"]', "Popisky", "Labels");
    setTxt('[data-role="hint"]', "Táhni myší pro otáčení, kolečko přibližuje, pravé tlačítko posouvá.", "Drag to rotate, scroll to zoom, right-drag to pan.");
    const wrap = el.querySelector(".s3d-viewer__wrap"), slider = el.querySelector("input[type=range]"), chk = el.querySelector("input[type=checkbox]");
    if (!v.slider) el.querySelector(".s3d-viewer__ctl").hidden = true;
    const close = () => {
      if (!vw) return;
      vw.controls.dispose(); vw = null;
      host = stage; stage.prepend(renderer.domElement); stage.appendChild(labelsHost);
      ro.unobserve(wrap); el.hidden = true; document.body.style.overflow = "";
      resize(); measure(); wake(); btn.focus();
    };
    const open = () => {
      el.hidden = false; document.body.style.overflow = "hidden";
      wrap.appendChild(renderer.domElement); wrap.appendChild(labelsHost); host = wrap; ro.observe(wrap);
      const base = config.keys[v.base ?? 0];
      camera.fov = base.fov || 34; resize();
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true; controls.dampingFactor = 0.08;
      controls.target.set(...base.target);
      camera.position.set(...base.cam); camera.lookAt(controls.target);
      controls.minDistance = v.minDistance ?? 50; controls.maxDistance = v.maxDistance ?? 2000;
      slider.value = v.initial ?? 0; chk.checked = true;
      vw = { controls, value: v.initial ?? 0, labels: true };
      el.querySelector(".s3d-viewer__close").focus();
      requestAnimationFrame(frame);
    };
    slider.addEventListener("input", () => { if (vw) vw.value = +slider.value; });
    chk.addEventListener("change", () => { if (vw) vw.labels = chk.checked; });
    btn.addEventListener("click", open);
    if (location.hash === "#3d") open(); // deep link to the viewer
    el.querySelector(".s3d-viewer__close").addEventListener("click", close);
    document.addEventListener("keydown", (e) => { if (!el.hidden && e.key === "Escape") close(); });
  }

  section.s3dState = () => ({ cur, target: target.t, fov: camera.fov, aspect: camera.aspect, pos: camera.position.toArray().map(Math.round) });
  resize(); measure(); cur = target.t; dirty = true; visible = true; wake();
}

/** Boot once the stage is near the viewport (right away: it sits in the hero). */
export function lazyMount(section, loadConfig) {
  const io = new IntersectionObserver(async ([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    const cfg = await loadConfig();
    mountScroll3D(section, cfg);
  }, { rootMargin: '600px 0px' });
  io.observe(section.querySelector('.s3d__stage'));
}
