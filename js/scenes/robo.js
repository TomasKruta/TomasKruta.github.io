/* Vrchní (ROBO2026): exploding assembly. Units mm, Y up, front of the vehicle = +X,
   the vehicle's right side = +Z. Groups come from the Fusion export (see fusion2glb). */
const MODEL = new URL('../../projects/robo2026/model/vrchni.glb', import.meta.url).href;

// explode direction per group (mm at amount 1); mirror = flip Z by the side the part sits on
const GROUPS = {
  shell: { dir: [0, 150, 0] },
  eyes: { dir: [55, 150, 0] },
  mustache: { dir: [70, 150, 0] },
  bowtie: { dir: [70, 150, 0] },
  oled: { dir: [0, 150, 0] },
  cup: { dir: [0, 175, 0] },
  holder: { dir: [0, 125, 0] },
  tray: { dir: [0, 85, 0] },
  deck: { dir: [0, 42, 0] },
  base: { dir: [0, 0, 0] },
  sensor: { dir: [55, -12, 0] },
  wheels: { dir: [0, 0, 70], mirror: true },
  motors: { dir: [0, 0, 32], mirror: true },
};
const FACE = ['shell', 'eyes', 'mustache', 'bowtie', 'oled'];
const ex = (o) => o; // readability helper for keyframe maps
const all = (v, names) => Object.fromEntries(names.map((n) => [n, v]));

export default {
  environment: 0.45,
  fitRadius: 125,
  narrowLift: 100,
  narrowZoom: 0.62, // mm that must stay visible horizontally (narrow stages widen the fov)
  exposure: 0.9,
  near: 5, far: 4000,
  // key names match the data-s3d attributes on the page (header + sections)
  viewer: {
    cs: "Rozložení", en: "Explode", slider: true, base: 0, minDistance: 120, maxDistance: 1500,
    inner: ["deck", "base", "wheels", "motors", "sensor", "holder"], // hidden inside until the model is pulled apart
    labels: ["eyes", "mustache", "bowtie", "cup", "holder", "tray", "deck", "base", "wheels", "motors", "sensor"],
    // slider 0..1: every group moves out by its explode direction, the cover ghosts a little
    key: (v) => ({ ex: Object.fromEntries(Object.keys(GROUPS).map((n) => [n, v * 1.6])), fade: Object.fromEntries(FACE.map((n) => [n, 1 - 0.7 * Math.min(1, v * 1.5)])), axis: 0 }),
  },
  keys: [
    { name: 'hero', cam: [528, 358, 410], target: [35, 170, 0], fov: 34, orbit: 0.5, ex: ex({}), fade: all(1, FACE), axis: 0, labels: [] },
    { name: 'soutez', cam: [389, 223, 326], target: [35, 105, 0], fov: 30, orbit: 0.3, ex: ex({}), fade: all(1, FACE), axis: 0, labels: ['cup'] },
    // cover lifted and ghosted: the cup stack
    { name: 'fusion', cam: [377, 333, 266], target: [30, 120, 0], fov: 32, orbit: 0.25, ex: ex({ ...all(1, FACE) }), fade: all(0.14, FACE), axis: 0, labels: ['cup', 'holder', 'tray'] },
    // side view: cup right above the wheel axle (not mapped to a section, kept for reuse)
    { name: 'axle', fit: 215, cam: [41, 155, 616], target: [30, 95, 0], fov: 30, orbit: 0, ex: ex({ ...all(1.25, FACE) }), fade: all(0.06, FACE), axis: 1, labels: ['axis', 'battery'] },
    // exploded floors
    { name: 'elektronika', fit: 215, cam: [650, 418, 523], target: [30, 160, 0], fov: 34, orbit: 0.2, ex: ex({ ...all(1.6, FACE), cup: 1, holder: 1, tray: 1, deck: 1 }), fade: all(0, FACE), axis: 0, labels: ['deck', 'base'] },
    // drive and sensor
    { name: 'firmware', fit: 215, cam: [490, 217, 615], target: [40, 70, 0], fov: 34, orbit: 0.25, ex: ex({ ...all(1.6, FACE), cup: 1, holder: 1, tray: 1, deck: 1, sensor: 1, wheels: 1, motors: 1 }), fade: all(0, FACE), axis: 0, labels: ['sensor', 'motors'] },
    { name: 'tezke', fit: 215, cam: [650, 418, 523], target: [30, 160, 0], fov: 34, orbit: 0.2, ex: ex({ ...all(1.6, FACE), cup: 1, holder: 1, tray: 1, deck: 1 }), fade: all(0, FACE), axis: 0, labels: ['deck', 'sensor'] },
    // the waiter's face
    { name: 'face', cam: [406, 108, 89], target: [80, 75, 0], fov: 26, orbit: 0.12, ex: ex({}), fade: all(1, FACE), axis: 0, labels: ['eyes', 'mustache', 'bowtie'] },
    { name: 'end', cam: [387, 214, 293], target: [35, 80, 0], fov: 34, orbit: 0.6, ex: ex({}), fade: all(1, FACE), axis: 0, labels: [] },
  ],
  labels: [
    { id: 'eyes', anchor: [124, 95, 26], group: 'eyes', side: 'right', cs: 'Oči', en: 'Eyes' },
    { id: 'mustache', anchor: [121, 63, -20], group: 'mustache', side: 'left', cs: 'Knír', en: 'Moustache' },
    { id: 'bowtie', anchor: [125, 31, 15], group: 'bowtie', side: 'right', cs: 'Motýlek', en: 'Bow tie' },
    { id: 'cup', anchor: [22, 165, -22], group: 'cup', side: 'left', cs: 'Kelímek', en: 'Cup' },
    { id: 'holder', anchor: [-33, 87, -20], group: 'holder', side: 'left', cs: 'Oficiální držák', en: 'Official holder' },
    { id: 'tray', anchor: [0, 86, 50], group: 'tray', side: 'right', cs: 'Podnos', en: 'Tray' },
    { id: 'axis', anchor: [0, 16, 64], side: 'right', cs: 'Osa kol', en: 'Wheel axle' },
    { id: 'battery', anchor: [-30, 24, 30], side: 'left', cs: 'Baterie 2S', en: '2S battery' },
    { id: 'deck', anchor: [60, 44, 45], group: 'deck', side: 'right', cs: 'Elektronika: ESP32-S3, DRV8833', en: 'Electronics: ESP32-S3, DRV8833' },
    { id: 'base', anchor: [70, 9, 50], group: 'base', side: 'right', cs: 'Základ: motory, baterie', en: 'Base: motors, battery' },
    { id: 'wheels', anchor: [0, 16, 68], group: 'wheels', side: 'right', cs: 'Kola Pololu', en: 'Pololu wheels' },
    { id: 'motors', anchor: [0, 18, -45], group: 'motors', side: 'left', cs: 'Motory HPCB 30:1', en: 'HPCB 30:1 motors' },
    { id: 'sensor', anchor: [95, 4, 30], group: 'sensor', side: 'right', cs: 'Senzor čáry QTR-8A', en: 'QTR-8A line sensor' },
  ].map((l) => ({
    ...l,
    // anchors ride along with their group's explode offset
    anchorFn: l.group ? (k) => {
      const g = GROUPS[l.group], a = k.ex[l.group] || 0, s = g.mirror ? Math.sign(l.anchor[2]) : 1;
      return [l.anchor[0] + g.dir[0] * a, l.anchor[1] + g.dir[1] * a, l.anchor[2] + g.dir[2] * a * s];
    } : null,
  })),

  async setup({ THREE, scene, loader }) {
    const gltf = await loader.loadAsync(MODEL);
    const root = gltf.scene;
    const groups = {};
    root.traverse((o) => {
      if (!o.isMesh) return;
      o.geometry.computeVertexNormals();
      o.material = o.material.clone();
      // eye lenses: frosted light-grey PLA like the real print, not see-through glass (blending made them flicker)
      if (/Translucent/.test(o.material.name)) {
        o.material.transparent = false; o.material.opacity = 1; o.material.alphaMode = undefined;
        o.material.color.set(0xcfd2cf); o.material.roughness = 0.55;
      }
      o.userData.baseTransparent = o.material.transparent; // the cover fade switches transparency on only while it fades
      const g = o.parent.name;
      (groups[g] ||= []).push(o);
      o.geometry.computeBoundingBox();
      o.userData.side = Math.sign(o.geometry.boundingBox.getCenter(new THREE.Vector3()).z) || 1;
    });
    // part colours (the Fusion appearances are neutral greys)
    const paint = (m, hex, rough = 0.5, metal = 0.05) => { m.material.color.set(hex); m.material.roughness = rough; m.material.metalness = metal; };
    const BLACK = 0x15161a;
    for (const m of groups.sensor || []) paint(m, 0xd7262b);
    for (const m of groups.cup || []) paint(m, 0x14257a, 0.85, 0);
    for (const m of groups.holder || []) paint(m, 0xffffff, 0.4);
    for (const m of groups.tray || []) paint(m, 0xffffff, 0.4);
    for (const m of groups.wheels || []) paint(m, BLACK, 0.7);
    for (const m of groups.motors || []) if (/bracket/.test(m.userData.occ || "")) paint(m, BLACK, 0.7);
    for (const m of groups.base || []) paint(m, BLACK, 0.6);
    for (const m of groups.deck || []) paint(m, 0xe8346f, 0.5);
    // two perfboards on the deck (approximate size, the Fusion assembly has no board models)
    const boardMat = new THREE.MeshStandardMaterial({ color: 0x1f8a3a, roughness: 0.55, metalness: 0.05 });
    for (const [x0, x1, z0, z1] of [[-10, 50, -40, 40], [-46, -14, -28, 28]]) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, 1.6, z1 - z0).translate((x0 + x1) / 2, 45.0, (z0 + z1) / 2), boardMat.clone());
      b.userData = { side: 1, baseTransparent: false };
      root.add(b); (groups.deck ||= []).push(b);
    }
    // render the ghosted cover after the opaque inside
    for (const n of FACE) for (const m of groups[n] || []) m.renderOrder = 2;
    scene.add(root);

    // lights
    scene.add(new THREE.HemisphereLight(0xffffff, 0x2a2633, 0.6));
    const key = new THREE.DirectionalLight(0xffffff, 1.5); key.position.set(300, 500, 250); scene.add(key);
    const fill = new THREE.DirectionalLight(0xdfe6ff, 0.5); fill.position.set(-400, 200, -300); scene.add(fill);

    // soft contact shadow
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g2 = c.getContext('2d'); const grd = g2.createRadialGradient(64, 64, 4, 64, 64, 64);
    grd.addColorStop(0, 'rgba(0,0,0,0.55)'); grd.addColorStop(1, 'rgba(0,0,0,0)'); g2.fillStyle = grd; g2.fillRect(0, 0, 128, 128);
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(320, 260), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2; shadow.position.set(35, -0.5, 0); scene.add(shadow);

    // wheel axle + vertical line through the cup (side-view step)
    const axisMat = new THREE.LineDashedMaterial({ color: 0xf2b866, dashSize: 6, gapSize: 4, transparent: true, opacity: 0, depthTest: false });
    const axis = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 16, -95), new THREE.Vector3(0, 16, 95),
      new THREE.Vector3(0, 16, 0), new THREE.Vector3(0, 235, 0),
    ]), axisMat);
    axis.computeLineDistances(); axis.renderOrder = 5; scene.add(axis);

    return { root, groups, axisMat };
  },

  update(k, { model }) {
    for (const [name, meshes] of Object.entries(model.groups)) {
      const g = GROUPS[name]; if (!g) continue;
      const a = k.ex[name] || 0;
      const op = k.fade[name] ?? 1;
      for (const m of meshes) {
        m.position.set(g.dir[0] * a, g.dir[1] * a, g.dir[2] * a * (g.mirror ? m.userData.side : 1));
        m.material.opacity = op * (m.userData.baseOpacity ??= m.material.opacity);
        m.material.transparent = m.userData.baseTransparent || op < 0.999;
        m.material.depthWrite = op > 0.9;
        m.visible = op > 0.01;
      }
    }
    model.axisMat.opacity = k.axis;
  },
};
