/* EPIC Tower Hackathon: the brewery truck drives into the Světovar yard, then the camera rises over the
   compound. Units m, Y up, +X east, +Z south (brewery recentred, see the export notes). */
const BASE = new URL('../../projects/epic-tower-hackathon-2026/model/', import.meta.url).href;

const FINISH = [65.2, 0, 20.5]; // truck stop in front of the loading ramp, facing -X
const truckAt = (k) => 102 + (FINISH[0] - 102) * k.drive;
const follow = (dx, y, dz) => (k) => [truckAt(k) + dx, y, FINISH[2] + dz];

export default {
  exposure: 1.0,
  logDepth: true, // road/paving layers are only millimetres apart
  near: 0.3, far: 1600,
  animate: true, // wheels/flags tick even without scroll
  // key names match the data-s3d attributes on the page (header + sections)
  viewer: {
    cs: "Jízda auta", en: "Truck drive", slider: true, initial: 1, base: 2, minDistance: 8, maxDistance: 700,
    labels: ["truck", "ramp", "clock", "chimney", "varna", "cellars"],
    key: (v) => ({ drive: v }),
  },
  keys: [
    // truck close-up, still out on the road east of the gate
    { name: 'truck', cam: [91.9, 2.7, 31.3], target: [101.5, 1.4, 20.5], fov: 34, orbit: 0.1, drive: 0, labels: ['truck', 'barrels'] },
    // truck rolls into the yard
    { name: 'theme', cam: [55.2, 3.6, 30.7], target: [66, 1.4, 20.5], fov: 34, orbit: 0, drive: 1, labels: ['ramp'] },
    // the whole compound from the south-east, like the aerial postcard
    { name: 'aerial', cam: [228, 162, 247], target: [0, 0, -5], fov: 36, orbit: 0.12, drive: 1, labels: [] },
    { name: 'levels', cam: [228, 162, 247], target: [0, 0, -5], fov: 36, orbit: 0.1, drive: 1, labels: ['l1', 'l2', 'l3', 'l4', 'l5'] },
    // brewhouse and clock tower
    { name: 'clock', cam: [65, 32.6, 26], target: [-13, 17, -22], fov: 38, orbit: 0.1, drive: 1, labels: ['clock', 'varna'] },
    // the yard and the rail siding
    { name: 'yard', cam: [134, 61.6, 72.8], target: [38, 4, 8], fov: 36, orbit: 0.08, drive: 1, labels: ['ramp', 'tracks'] },
    { name: 'chimney', cam: [141.2, 9.2, -2], target: [62, 26, -50], fov: 40, orbit: 0.1, drive: 1, labels: ['chimney'] },
    // built from the period photo: truck close-up again
    { name: 'truck2', cam: [55.2, 3.6, 30.7], target: [66, 1.4, 20.5], fov: 34, orbit: 0.25, drive: 1, labels: ['truck'] },
    { name: 'end', cam: [228, 162, 247], target: [0, 0, -5], fov: 36, orbit: 0.3, drive: 1, labels: [] },
  ],
  labels: [
    { id: 'truck', anchor: [0, 0, 0], anchorFn: follow(-1.9, 2.6, 0.9), side: 'left', cs: 'Pivovarský vůz', en: 'Brewery truck' },
    { id: 'barrels', anchor: [0, 0, 0], anchorFn: follow(1.4, 2.7, -0.6), side: 'right', cs: '10 sudů', en: '10 barrels' },
    { id: 'ramp', anchor: [44.8, 1.6, 27], side: 'left', cs: 'Expedice a rampa', en: 'Dispatch and ramp' },
    { id: 'cellars', anchor: [-38, 9, 30], side: 'left', cs: 'Ležácké sklepy', en: 'Lager cellars' },
    { id: 'tracks', anchor: [96, 1, -5], side: 'right', cs: 'Vlečka', en: 'Rail siding' },
    { id: 'clock', anchor: [-16.1, 33, -18.8], side: 'right', cs: 'Hodinová věž', en: 'Clock tower' },
    { id: 'varna', anchor: [-6, 16.5, -18], side: 'right', cs: 'Varna', en: 'Brewhouse' },
    { id: 'chimney', anchor: [65.2, 47, -51], side: 'left', cs: 'Komín', en: 'Chimney' },
    { id: 'malt', anchor: [20, 12, -83], side: 'left', cs: 'Sladovna', en: 'Malt house' },
    { id: 'l1', anchor: [65.2, 2, 20.5], side: 'right', cs: 'Level 1', en: 'Level 1' },
    { id: 'l2', anchor: [-38, 9, 32], side: 'left', cs: 'Level 2', en: 'Level 2' },
    { id: 'l3', anchor: [-2, 16, -30], side: 'right', cs: 'Level 3', en: 'Level 3' },
    { id: 'l4', anchor: [-19.8, 28.5, 18], side: 'left', cs: 'Level 4', en: 'Level 4' },
    { id: 'l5', anchor: [14, 11, 27], side: 'right', cs: 'Level 5', en: 'Level 5' },
  ],

  async setup({ THREE, scene, loader, renderer }) {
    const [brew, truck] = await Promise.all([loader.loadAsync(BASE + 'svetovar.glb'), loader.loadAsync(BASE + 'truck.glb')]);
    const fix = (root) => root.traverse((o) => {
      if (!o.isMesh) return;
      const m = o.material;
      if (m.map) { m.map.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy()); }
      m.metalness = 0; m.roughness = 0.95;
    });
    fix(brew.scene); fix(truck.scene);
    scene.add(brew.scene);

    const truckRoot = new THREE.Group();
    truckRoot.add(truck.scene);
    truckRoot.rotation.y = -Math.PI / 2; // model front is +Z -> face -X (towards the ramp)
    scene.add(truckRoot);

    // wheel roots: transform nodes around wheel height, away from the centreline
    const wheels = [];
    truck.scene.traverse((o) => {
      if (o.isMesh || !o.children.length || o === truck.scene) return;
      const p = o.position;
      if (p.y > 0.3 && p.y < 0.75 && Math.abs(p.x) > 0.4 && o.children.some((c) => c.isMesh)) wheels.push(o);
    });

    // afternoon light like the menu film
    scene.add(new THREE.HemisphereLight(0xfff1d6, 0x6b5a45, 1.5));
    const sun = new THREE.DirectionalLight(0xffe2b0, 2.6); sun.position.set(120, 160, 90); scene.add(sun);

    // no ground or fog around it: the compound floats as a diorama on the page background

    return { truckRoot, wheels, wheelR: 0.5 };
  },

  update(k, { model }) {
    // drive from the gate road (x ≈ 102) to the finish in front of the ramp
    const x = truckAt(k);
    model.truckRoot.position.set(x, 0, FINISH[2]);
    const dist = 102 - x;
    for (const w of model.wheels) w.rotation.x = dist / model.wheelR;
  },
};

