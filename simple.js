const THREE = globalThis.THREE;
const ctx = globalThis.gameCtx;
const canvas = document.getElementById('gameCanvas');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x10151f);
scene.fog = new THREE.Fog(0x10151f, 75, 230);
const camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.1, 420);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const hemi = new THREE.HemisphereLight(0xdde9ff, 0x202010, 1.25);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffd59a, 2.6);
sun.position.set(-45, 85, 55);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -150;
sun.shadow.camera.right = 150;
sun.shadow.camera.top = 150;
sun.shadow.camera.bottom = -150;
scene.add(sun);
const torchLight = new THREE.PointLight(0xffa64a, 1.8, 70);
torchLight.position.set(0, 9, -28);
scene.add(torchLight);
const loader = globalThis.GLTFLoader ? new globalThis.GLTFLoader() : null;
const mat = {
  ground: new THREE.MeshStandardMaterial({ color: 0x273422, roughness: 0.92 }),
  road: new THREE.MeshStandardMaterial({ color: 0x66513b, roughness: 0.88 }),
  plaza: new THREE.MeshStandardMaterial({ color: 0x75614d, roughness: 0.82 }),
  water: new THREE.MeshStandardMaterial({ color: 0x15354a, roughness: 0.38, metalness: 0.05 }),
  gold: new THREE.MeshStandardMaterial({ color: 0xd7a23a, metalness: 0.42, roughness: 0.28 }),
  red: new THREE.MeshStandardMaterial({ color: 0x8b1f25, roughness: 0.72 }),
  blue: new THREE.MeshStandardMaterial({ color: 0x1e4776, roughness: 0.72 }),
  green: new THREE.MeshStandardMaterial({ color: 0x23543a, roughness: 0.72 }),
  purple: new THREE.MeshStandardMaterial({ color: 0x59316d, roughness: 0.72 }),
  white: new THREE.MeshStandardMaterial({ color: 0xe8dcc9, roughness: 0.68 }),
  skin: new THREE.MeshStandardMaterial({ color: 0xb9825c, roughness: 0.7 }),
  dark: new THREE.MeshStandardMaterial({ color: 0x17151d, roughness: 0.82 }),
  wood: new THREE.MeshStandardMaterial({ color: 0x5a3824, roughness: 0.75 })
};
function mesh(geo, material, pos = [0, 0, 0], rot = [0, 0, 0], scale = [1, 1, 1]) {
  const o = new THREE.Mesh(geo, material);
  o.position.set(...pos);
  o.rotation.set(...rot);
  o.scale.set(...scale);
  o.castShadow = true;
  o.receiveShadow = true;
  return o;
}
function fallbackBox(color = 0x777777, h = 3) {
  const g = new THREE.Group();
  const m = new THREE.MeshStandardMaterial({ color, roughness: 0.7 });
  g.add(mesh(new THREE.BoxGeometry(4, h, 4), m, [0, h / 2, 0]));
  g.add(mesh(new THREE.ConeGeometry(3.2, 2.4, 4), mat.gold, [0, h + 1.2, 0], [0, Math.PI / 4, 0]));
  return g;
}
function fallbackPerson(color = 0x2455a0) {
  const g = new THREE.Group();
  const m = new THREE.MeshStandardMaterial({ color, roughness: 0.7 });
  g.add(mesh(new THREE.CapsuleGeometry(0.38, 1.05, 8, 14), m, [0, 1.15, 0]));
  g.add(mesh(new THREE.SphereGeometry(0.28, 18, 12), mat.skin, [0, 1.92, 0]));
  g.add(mesh(new THREE.CylinderGeometry(0.36, 0.32, 0.2, 18), mat.white, [0, 2.22, 0]));
  return g;
}
const cache = new Map();
function loadModel(url) {
  if (!loader) return Promise.resolve(null);
  if (!cache.has(url)) {
    cache.set(url, new Promise(resolve => {
      loader.load(url, gltf => {
        const s = gltf.scene;
        s.traverse(n => { if (n.isMesh) { n.castShadow = true; n.receiveShadow = true; } });
        resolve(s);
      }, undefined, () => resolve(null));
    }));
  }
  return cache.get(url);
}
function addAsset(url, pos, scale = 1, rot = [0, 0, 0], fallback = null, parent = scene) {
  const g = new THREE.Group();
  g.position.set(...pos);
  g.rotation.set(...rot);
  g.scale.setScalar(scale);
  if (fallback) g.add(fallback.clone ? fallback.clone() : fallback());
  parent.add(g);
  loadModel(url).then(src => {
    if (!src) return;
    g.clear();
    const o = src.clone(true);
    g.add(o);
  });
  return g;
}
function bannerTexture(bg, title, mark) {
  const c = document.createElement('canvas');
  c.width = 384; c.height = 512;
  const x = c.getContext('2d');
  x.fillStyle = bg; x.fillRect(0, 0, c.width, c.height);
  x.fillStyle = '#f6d47b'; x.textAlign = 'center';
  x.font = 'bold 120px serif'; x.fillText(mark, 192, 215);
  x.font = 'bold 34px system-ui'; x.fillText(title, 192, 340);
  x.fillStyle = 'rgba(255,255,255,.18)'; x.fillRect(22, 22, 340, 18); x.fillRect(22, 472, 340, 18);
  return new THREE.CanvasTexture(c);
}
function addBanner(f, pos, rotY = 0, scale = 1) {
  const g = new THREE.Group();
  g.position.set(...pos); g.rotation.y = rotY; g.scale.setScalar(scale);
  g.add(mesh(new THREE.CylinderGeometry(0.08, 0.12, 5.2, 12), mat.wood, [0, 2.6, 0]));
  g.add(mesh(new THREE.PlaneGeometry(2.7, 3.6), new THREE.MeshStandardMaterial({ map: bannerTexture(f.css, f.name, f.mark), side: THREE.DoubleSide, roughness: 0.72 }), [1.35, 3.45, 0]));
  scene.add(g);
  return g;
}
function road(pos, scale, rot = 0) {
  scene.add(mesh(new THREE.BoxGeometry(1, 0.08, 1), mat.road, pos, [0, rot, 0], scale));
}
function buildTerrain() {
  scene.add(mesh(new THREE.BoxGeometry(240, 0.35, 260), mat.ground, [0, -0.35, -25]));
  scene.add(mesh(new THREE.CylinderGeometry(14, 14, 0.18, 48), mat.plaza, [0, -0.08, -25]));
  road([0, -0.05, 20], [8, 1, 112]);
  road([-42, -0.04, -12], [86, 1, 7]);
  road([42, -0.04, -12], [86, 1, 7]);
  road([0, -0.04, -72], [8, 1, 96]);
  road([0, -0.04, 65], [38, 1, 7]);
  scene.add(mesh(new THREE.CylinderGeometry(9, 9, 0.12, 64), mat.water, [0, 0.02, 14]));
  scene.add(mesh(new THREE.CylinderGeometry(1.2, 1.5, 4, 24), mat.gold, [0, 2, 14]));
}
const A = '/assets/';
const F = {
  player: { id: 'player', name: 'Mavi Hanedan', mark: '☾', css: '#1e4776', color: 0x1e4776, pos: [0, 0, 72], palace: 'town_center', hero: '/assets/characters/player_prince.glb' },
  selim: { id: 'selim', name: 'Selim Sancağı', mark: 'S', css: '#8b1f25', color: 0x8b1f25, pos: [-82, 0, -15], palace: 'barracks', hero: '/assets/characters/selim_prince.glb' },
  orhan: { id: 'orhan', name: 'Orhan Ocağı', mark: 'O', css: '#23543a', color: 0x23543a, pos: [82, 0, -15], palace: 'temple', hero: '/assets/characters/orhan_prince.glb' },
  cem: { id: 'cem', name: 'Cem Divanı', mark: 'C', css: '#59316d', color: 0x59316d, pos: [0, 0, -112], palace: 'wonder', hero: '/assets/characters/cem_prince.glb' }
};
const BUILD = {
  town_center: A + 'buildings/town_center.glb', barracks: A + 'buildings/barracks.glb', temple: A + 'buildings/temple.glb', wonder: A + 'buildings/wonder.glb', market: A + 'buildings/market.glb', archery: A + 'buildings/archery.glb', watchtower: A + 'buildings/watchtower.glb', wall: A + 'buildings/wall.glb', gate: A + 'buildings/gate.glb', houseA: A + 'buildings/house_a.glb', houseB: A + 'buildings/house_b.glb', farm: A + 'buildings/farm.glb', storage: A + 'buildings/storage.glb', towerHouse: A + 'buildings/tower_house.glb', tree: A + 'nature/tree_group.glb', pine: A + 'nature/pine_group.glb', rock: A + 'nature/rock_group.glb', crate: A + 'props/crate.glb', barrel: A + 'props/barrel.glb', crateStack: A + 'props/crate_stack.glb'
};
function addWalls(cx, cz, size = 34) {
  for (let i = -2; i <= 2; i++) {
    addAsset(BUILD.wall, [cx + i * 7, 0, cz - size / 2], 4.8, [0, 0, 0], fallbackBox(0x6b5b4b, 1));
    addAsset(BUILD.wall, [cx + i * 7, 0, cz + size / 2], 4.8, [0, Math.PI, 0], fallbackBox(0x6b5b4b, 1));
  }
  for (let i = -1; i <= 1; i++) {
    addAsset(BUILD.wall, [cx - size / 2, 0, cz + i * 8], 4.8, [0, Math.PI / 2, 0], fallbackBox(0x6b5b4b, 1));
    addAsset(BUILD.wall, [cx + size / 2, 0, cz + i * 8], 4.8, [0, -Math.PI / 2, 0], fallbackBox(0x6b5b4b, 1));
  }
  addAsset(BUILD.gate, [cx, 0, cz + size / 2 + 1.5], 5, [0, Math.PI, 0], fallbackBox(0x5b4a38, 2));
  for (const p of [[cx-size/2,cz-size/2],[cx+size/2,cz-size/2],[cx-size/2,cz+size/2],[cx+size/2,cz+size/2]]) addAsset(BUILD.watchtower, [p[0],0,p[1]], 5.5, [0,0,0], fallbackBox(0x444444, 5));
}
function addArmy(f, baseX, baseZ) {
  for (let r = 0; r < 4; r++) for (let c = 0; c < 7; c++) {
    const g = addAsset('/assets/characters/guard_knight.glb', [baseX + (c - 3) * 2.1, 0, baseZ + r * 2.2], 0.42, [0, Math.PI, 0], fallbackPerson(f.color));
    g.userData.kind = 'soldier';
  }
}
function addSettlement(f) {
  const [x,,z] = f.pos;
  addWalls(x, z, 42);
  addAsset(BUILD[f.palace], [x, 0, z], 8.8, [0, 0, 0], fallbackBox(f.color, 4));
  addAsset(BUILD.market, [x - 18, 0, z + 10], 5.7, [0, .25, 0], fallbackBox(0x9a7a3a, 2));
  addAsset(BUILD.archery, [x + 18, 0, z + 9], 5.5, [0, -.25, 0], fallbackBox(0x7b4a2a, 2));
  addAsset(BUILD.houseA, [x - 16, 0, z - 12], 5.5, [0, .7, 0], fallbackBox(0x8d765f, 2));
  addAsset(BUILD.houseB, [x + 16, 0, z - 12], 5.5, [0, -.7, 0], fallbackBox(0x8d765f, 2));
  addAsset(BUILD.storage, [x + 25, 0, z + 21], 4.8, [0, 0, 0], fallbackBox(0x755d43, 2));
  addAsset(BUILD.farm, [x - 26, 0, z + 23], 5.4, [0, 0, 0], fallbackBox(0x6b5b25, 1));
  addBanner(f, [x - 9, 0, z + 24], 0, 1.35);
  addBanner(f, [x + 9, 0, z + 24], 0, 1.35);
  addArmy(f, x - 7, z + 28);
}
function addNature() {
  const pts = [];
  for (let i = 0; i < 38; i++) pts.push([Math.random()*210-105, Math.random()*230-145]);
  for (const [x,z] of pts) if (Math.abs(x) > 20 || Math.abs(z + 25) > 35) addAsset(Math.random() > .5 ? BUILD.tree : BUILD.pine, [x, 0, z], 5.5 + Math.random() * 2, [0, Math.random()*Math.PI, 0], fallbackBox(0x234c2e, 2));
  for (const p of [[-32,-54],[34,-60],[-62,45],[60,48],[-96,-80],[96,-84]]) addAsset(BUILD.rock, [p[0],0,p[1]], 4.5, [0,0,0], fallbackBox(0x777777,1));
}
function addCourt() {
  addAsset(BUILD.towerHouse, [0, 0, -25], 8.5, [0, 0, 0], fallbackBox(0x75614d, 4));
  addWalls(0, -25, 34);
  addAsset(BUILD.crateStack, [-10, 0, -8], 5, [0, .6, 0], fallbackBox(0x5a3824, 1));
  addAsset(BUILD.barrel, [10, 0, -8], 5, [0, -.3, 0], fallbackBox(0x5a3824, 1));
  const throne = new THREE.Group();
  throne.add(mesh(new THREE.BoxGeometry(4, 2.1, 2.4), mat.gold, [0, 1.05, 0]));
  throne.add(mesh(new THREE.BoxGeometry(3.2, 5, .65), mat.gold, [0, 2.7, .8]));
  throne.add(mesh(new THREE.CylinderGeometry(.18,.18,5.2,12), mat.red, [-1.8,2.9,.9]));
  throne.add(mesh(new THREE.CylinderGeometry(.18,.18,5.2,12), mat.red, [1.8,2.9,.9]));
  throne.position.set(0, 0, -38); scene.add(throne);
}
function addCharacter(url, pos, scale, rotY, fallbackColor, data) {
  const g = addAsset(url, pos, scale, [0, rotY, 0], fallbackPerson(fallbackColor));
  g.userData = data;
  return g;
}
buildTerrain();
addNature();
addCourt();
Object.values(F).forEach(addSettlement);
const player = addCharacter('/assets/characters/player_prince.glb', [0, 0, 84], 1.15, Math.PI, F.player.color, { id: 'player', name: 'Şehzade Rıdvan', role: 'Mavi Hanedan Varisi', faction: 'player' });
const npcs = [
  addCharacter('/assets/characters/king.glb', [0, 0, -34], 1.15, 0, 0x59316d, { id: 'king', name: 'Kral Alparslan', role: 'Yaşlı Hükümdar', faction: 'center' }),
  addCharacter('/assets/characters/king.glb', [-7, 0, -30], 1.0, .4, 0x23543a, { id: 'vezir', name: 'Vezir Nizam', role: 'Saray Aklı', faction: 'center' }),
  addCharacter('/assets/characters/guard_knight.glb', [7, 0, -30], .42, -.4, 0x8b1f25, { id: 'komutan', name: 'Komutan Boran', role: 'Ordu Temsilcisi', faction: 'center' }),
  addCharacter('/assets/characters/halk_elcisi.glb', [-8, 0, 66], 1.05, 0, 0x1e4776, { id: 'halk', name: 'Elçi Derya', role: 'Halkın Sesi', faction: 'player' }),
  addCharacter('/assets/characters/katip.glb', [8, 0, 66], 1.05, 0, 0x17151d, { id: 'katip', name: 'Sır Katibi Rafi', role: 'Bilgi Ağı', faction: 'player' }),
  addCharacter(F.selim.hero, [-82, 0, 8], 1.05, Math.PI, F.selim.color, { id: 'selim', name: 'Şehzade Selim', role: 'Batı Sancağı', faction: 'selim' }),
  addCharacter(F.orhan.hero, [82, 0, 8], 1.05, Math.PI, F.orhan.color, { id: 'orhan', name: 'Şehzade Orhan', role: 'Doğu Ocağı', faction: 'orhan' }),
  addCharacter(F.cem.hero, [0, 0, -92], 1.05, 0, F.cem.color, { id: 'cem', name: 'Şehzade Cem', role: 'Kuzey Divanı', faction: 'cem' })
];
const locations = [
  { name: 'Mavi Hanedan', pos: [0, 0, 72] }, { name: 'Merkez Saray', pos: [0, 0, -25] }, { name: 'Selim Sancağı', pos: [-82, 0, -15] }, { name: 'Orhan Ocağı', pos: [82, 0, -15] }, { name: 'Cem Divanı', pos: [0, 0, -112] }
];
Object.assign(ctx, { scene, camera, renderer, player, npcs, factions: F, locations, mapBounds: { x: 112, zMin: -132, zMax: 102 } });
