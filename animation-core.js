const ctx = globalThis.gameCtx;
const THREE = globalThis.THREE;
const Loader = globalThis.GLTFLoader;
const Cloner = globalThis.SkeletonUtils;
ctx.mixers = ctx.mixers || [];
const loader = Loader ? new Loader() : null;
const files = {
  player: '/assets/animated/player.glb',
  king: '/assets/animated/king.glb',
  vezir: '/assets/animated/king.glb',
  komutan: '/assets/animated/guard.glb',
  halk: '/assets/animated/halk.glb',
  katip: '/assets/animated/katip.glb',
  selim: '/assets/animated/selim.glb',
  orhan: '/assets/animated/orhan.glb',
  cem: '/assets/animated/cem.glb'
};
function choose(clips, names) {
  return clips.find(c => names.some(n => c.name.toLowerCase().includes(n)));
}
function fit(root, model, scale) {
  const box = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  box.getSize(size);
  const max = Math.max(size.x, size.y, size.z) || 1;
  model.scale.setScalar(scale / max);
  const box2 = new THREE.Box3().setFromObject(model);
  model.position.y -= box2.min.y;
}
function applyAnimated(root, url, scale = 2.15) {
  if (!loader || !root) return;
  loader.load(url, gltf => {
    const model = Cloner && Cloner.clone ? Cloner.clone(gltf.scene) : gltf.scene.clone(true);
    model.traverse(n => { if (n.isMesh) { n.castShadow = true; n.receiveShadow = true; } });
    fit(root, model, scale);
    root.clear();
    root.add(model);
    const mixer = new THREE.AnimationMixer(model);
    const clips = gltf.animations || [];
    const idleClip = choose(clips, ['idle_neutral', 'idle', 'stand']) || clips[0];
    const walkClip = choose(clips, ['run', 'walk']);
    const actions = {};
    if (idleClip) { actions.idle = mixer.clipAction(idleClip); actions.idle.play(); actions.idle.setEffectiveWeight(1); }
    if (walkClip) { actions.walk = mixer.clipAction(walkClip); actions.walk.play(); actions.walk.setEffectiveWeight(0); actions.walk.timeScale = 1.05; }
    root.userData.actions = actions;
    root.userData.animatedReady = true;
    ctx.mixers.push(mixer);
  }, undefined, () => {});
}
function install() {
  applyAnimated(ctx.player, files.player, 2.4);
  for (const n of ctx.npcs || []) {
    const id = n.userData && n.userData.id;
    applyAnimated(n, files[id] || files.halk, id === 'komutan' ? 2.1 : 2.25);
  }
}
setTimeout(install, 900);
