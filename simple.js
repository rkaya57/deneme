const THREE = globalThis.THREE;
const ctx = globalThis.gameCtx;
const canvas = document.getElementById('gameCanvas');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x08070b);
scene.fog = new THREE.Fog(0x08070b, 24, 72);
const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 140);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const sun = new THREE.DirectionalLight(0xffd39a, 2.4);
sun.position.set(-8, 18, 10); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
scene.add(new THREE.HemisphereLight(0xeed7bd, 0x101018, 1.15), sun);
const hallLight = new THREE.PointLight(0xff9f4a, 2.2, 25); hallLight.position.set(0, 5, -14); scene.add(hallLight);
const mat = {
  stone: new THREE.MeshStandardMaterial({ color: 0x75614d, roughness: .82 }),
  dark: new THREE.MeshStandardMaterial({ color: 0x27222d, roughness: .88 }),
  gold: new THREE.MeshStandardMaterial({ color: 0xd7a23a, metalness: .45, roughness: .32 }),
  red: new THREE.MeshStandardMaterial({ color: 0x7d1f21, roughness: .72 }),
  blue: new THREE.MeshStandardMaterial({ color: 0x1e4776, roughness: .68 }),
  green: new THREE.MeshStandardMaterial({ color: 0x23543a, roughness: .72 }),
  purple: new THREE.MeshStandardMaterial({ color: 0x59316d, roughness: .68 }),
  white: new THREE.MeshStandardMaterial({ color: 0xe6ded1, roughness: .6 }),
  skin: new THREE.MeshStandardMaterial({ color: 0xb9825c, roughness: .62 }),
  wood: new THREE.MeshStandardMaterial({ color: 0x5a3824, roughness: .72 }),
  black: new THREE.MeshStandardMaterial({ color: 0x0f0b0b, roughness: .8 }),
  carpet: new THREE.MeshStandardMaterial({ color: 0x8d1f27, roughness: .8 }),
  water: new THREE.MeshStandardMaterial({ color: 0x17344a, roughness: .35, metalness: .05 })
};
function mesh(geo, material, pos = [0,0,0], rot = [0,0,0], scale = [1,1,1]) {
  const o = new THREE.Mesh(geo, material); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scale); o.castShadow = true; o.receiveShadow = true; return o;
}
function char(color, kind = 'prince') {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CapsuleGeometry(.5, 1.25, 8, 16), color, [0, 1.35, 0]));
  g.add(mesh(new THREE.SphereGeometry(.42, 24, 16), mat.skin, [0, 2.45, 0]));
  g.add(mesh(new THREE.CylinderGeometry(.55, .48, .26, 24), mat.white, [0, 2.86, 0]));
  g.add(mesh(new THREE.SphereGeometry(.18, 16, 10), mat.red, [0, 3.04, 0]));
  g.add(mesh(new THREE.BoxGeometry(.18,.08,.08), mat.black, [-.16,2.52,.38]));
  g.add(mesh(new THREE.BoxGeometry(.18,.08,.08), mat.black, [.16,2.52,.38]));
  g.add(mesh(new THREE.ConeGeometry(.18,.55,16), mat.gold, [.58,1.55,.35], [0,0,.65]));
  if (kind === 'king') { g.add(mesh(new THREE.CylinderGeometry(.62,.54,.42,7), mat.gold, [0,3.05,0])); g.scale.set(1.18,1.18,1.18); }
  if (kind === 'guard') g.add(mesh(new THREE.BoxGeometry(.18,1.35,.18), mat.gold, [.72,1.4,.18]));
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return g;
}
function buildWorld() {
  scene.add(mesh(new THREE.BoxGeometry(44,.4,60), mat.dark, [0,-.22,-4]));
  scene.add(mesh(new THREE.BoxGeometry(8,.05,44), mat.carpet, [0,.02,-6]));
  scene.add(mesh(new THREE.BoxGeometry(42,8,.7), mat.stone, [0,4,-30]));
  scene.add(mesh(new THREE.BoxGeometry(42,8,.7), mat.stone, [0,4,22]));
  scene.add(mesh(new THREE.BoxGeometry(.7,8,52), mat.stone, [-21,4,-4]));
  scene.add(mesh(new THREE.BoxGeometry(.7,8,52), mat.stone, [21,4,-4]));
  for (let z=-26; z<20; z+=8) for (const x of [-17,-11,11,17]) { const c = new THREE.Group(); c.add(mesh(new THREE.CylinderGeometry(.55,.75,5.6,18), mat.stone, [0,2.8,0])); c.add(mesh(new THREE.CylinderGeometry(.95,.95,.28,18), mat.gold, [0,5.7,0])); c.add(mesh(new THREE.CylinderGeometry(.95,.95,.28,18), mat.gold, [0,-.05,0])); c.position.set(x,0,z); scene.add(c); }
  for (let z=-24; z<16; z+=10) { const a = mesh(new THREE.BoxGeometry(.12,3.6,2.8), mat.red, [-20.55,3.4,z]); const b = a.clone(); b.position.x = 20.55; scene.add(a,b); }
  scene.add(mesh(new THREE.BoxGeometry(8,1,5), mat.stone, [0,.5,-25]));
  const th = new THREE.Group(); th.add(mesh(new THREE.BoxGeometry(2.8,2.1,1.4), mat.gold, [0,1.1,0])); th.add(mesh(new THREE.BoxGeometry(2.2,3.8,.55), mat.gold, [0,2.2,.52])); th.add(mesh(new THREE.CylinderGeometry(.18,.18,3.9,12), mat.red, [-1.28,2.3,.55])); th.add(mesh(new THREE.CylinderGeometry(.18,.18,3.9,12), mat.red, [1.28,2.3,.55])); th.position.set(0,1.05,-25.5); scene.add(th);
  const f = new THREE.Group(); f.add(mesh(new THREE.CylinderGeometry(3.2,3.2,.55,48), mat.stone, [0,.15,12])); f.add(mesh(new THREE.CylinderGeometry(2.3,2.3,.18,48), mat.water, [0,.5,12])); f.add(mesh(new THREE.CylinderGeometry(.5,.7,2.4,24), mat.gold, [0,1.55,12])); scene.add(f);
}
buildWorld();
const player = char(mat.blue); player.position.set(0,0,10); scene.add(player);
const data = [
  ['king','Kral Alparslan','Yaşlı Hükümdar',0,1.05,-23.2,'king',mat.purple], ['vezir','Vezir Nizam','Saray Aklı',-7,0,-18,'prince',mat.green], ['komutan','Komutan Boran','Ordu Temsilcisi',8,0,-17,'guard',mat.red], ['halk','Elçi Derya','Halkın Sesi',-10,0,8,'prince',mat.blue], ['katip','Sır Katibi Rafi','Bilgi Ağı',12,0,8,'prince',mat.black], ['selim','Şehzade Selim','Büyük Rakip',-9,0,-5,'prince',mat.red], ['orhan','Şehzade Orhan','Savaşçı Rakip',9,0,-4,'prince',mat.green], ['cem','Şehzade Cem','Kurnaz Rakip',0,0,2,'prince',mat.purple]
];
const npcs = data.map(d => { const o = char(d[7], d[6]); o.position.set(d[3],d[4],d[5]); o.userData = { id:d[0], name:d[1], role:d[2] }; scene.add(o); return o; });
Object.assign(ctx, { scene, camera, renderer, player, npcs });
