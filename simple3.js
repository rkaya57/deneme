const ctx = globalThis.gameCtx;
const THREE = globalThis.THREE;
const ui = document.getElementById('ui');
ui.textContent = 'Tahtın Gölgesi - WASD ile hareket, mouse ile kamera';
ui.style.position = 'fixed';
ui.style.left = '16px';
ui.style.top = '16px';
ui.style.color = '#f8ead3';
ui.style.fontFamily = 'system-ui, sans-serif';
ui.style.background = 'rgba(10,8,13,.7)';
ui.style.padding = '12px';
ui.style.borderRadius = '12px';
const keys = {};
let angle = Math.PI;
let mouse = false;
addEventListener('keydown', e => keys[e.code] = true);
addEventListener('keyup', e => keys[e.code] = false);
addEventListener('mousedown', () => mouse = true);
addEventListener('mouseup', () => mouse = false);
addEventListener('mousemove', e => { if (mouse) angle -= e.movementX * 0.006; });
addEventListener('resize', () => { ctx.camera.aspect = innerWidth / innerHeight; ctx.camera.updateProjectionMatrix(); ctx.renderer.setSize(innerWidth, innerHeight); });
function loop(){
  requestAnimationFrame(loop);
  const v = new THREE.Vector3((keys.KeyD?1:0)-(keys.KeyA?1:0),0,(keys.KeyS?1:0)-(keys.KeyW?1:0));
  if(v.lengthSq()){
    v.normalize();
    const f = new THREE.Vector3(Math.sin(angle),0,Math.cos(angle));
    const r = new THREE.Vector3(f.z,0,-f.x);
    const mv = r.multiplyScalar(v.x).add(f.multiplyScalar(v.z)).multiplyScalar(0.075);
    ctx.player.position.add(mv);
    ctx.player.position.x = Math.max(-18, Math.min(18, ctx.player.position.x));
    ctx.player.position.z = Math.max(-27, Math.min(19, ctx.player.position.z));
    ctx.player.rotation.y = Math.atan2(mv.x, mv.z);
  }
  const target = ctx.player.position.clone().add(new THREE.Vector3(0,1.6,0));
  const off = new THREE.Vector3(Math.sin(angle)*8,5.2,Math.cos(angle)*8);
  ctx.camera.position.lerp(target.clone().add(off),0.08);
  ctx.camera.lookAt(target);
  ctx.renderer.render(ctx.scene, ctx.camera);
}
loop();
