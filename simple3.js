const ctx = globalThis.gameCtx;
const THREE = globalThis.THREE;
const ui = document.getElementById('ui');
ui.style.position = 'fixed';
ui.style.inset = '0';
ui.style.color = '#f8ead3';
ui.style.fontFamily = 'system-ui, Segoe UI, sans-serif';
ui.style.pointerEvents = 'none';
function panelBox(x, y, w) {
  const e = document.createElement('div');
  e.style.position = 'absolute'; e.style.left = x; e.style.top = y; e.style.width = w;
  e.style.padding = '12px'; e.style.borderRadius = '14px';
  e.style.background = 'linear-gradient(180deg, rgba(12,9,14,.88), rgba(7,6,8,.76))';
  e.style.border = '1px solid rgba(246,212,123,.22)';
  e.style.boxShadow = '0 12px 36px rgba(0,0,0,.35)';
  e.style.pointerEvents = 'auto';
  ui.appendChild(e);
  return e;
}
const hud = panelBox('16px', '16px', 'min(920px,calc(100vw - 32px))');
const quest = panelBox('16px', 'auto', 'min(360px,calc(100vw - 32px))'); quest.style.bottom = '20px';
const card = panelBox('50%', 'auto', 'min(860px,94vw)'); card.style.bottom = '20px'; card.style.transform = 'translateX(-50%)'; card.style.display = 'none';
const tip = panelBox('50%', 'auto', 'auto'); tip.style.bottom = '160px'; tip.style.transform = 'translateX(-50%)'; tip.style.display = 'none';
const state = { day: 1, inf: 24, mil: 18, pub: 22, gold: 42, trust: 12, sus: 4, act: 1, visited: {} };
function clamp(v) { return Math.max(0, Math.min(100, v)); }
function score() { return state.inf + state.mil + state.pub + state.trust - Math.floor(state.sus * 1.4); }
function hudUpdate() {
  hud.textContent = 'Tahtın Gölgesi | Gün ' + state.day + ' | Nüfuz ' + state.inf + ' | Asker ' + state.mil + ' | Halk ' + state.pub + ' | Altın ' + state.gold + ' | Kral Güveni ' + state.trust + ' | Şüphe ' + state.sus + ' | Taht Puanı ' + score() + '/145';
  quest.innerHTML = '<b>Görev Akışı</b><br>1) Mavi Hanedan’dan çıkıp Merkez Saray’a git.<br>2) Kral, Vezir ve Komutanla konuş.<br>3) Batı Selim, Doğu Orhan, Kuzey Cem sancaklarını ziyaret et.<br>4) Puan 145 olunca kralın final divanını başlat.';
}
function apply(e) {
  for (const k in e) state[k] = clamp((state[k] || 0) + e[k]);
  state.day++;
  hudUpdate();
}
function makeBtn(t, fn) {
  const b = document.createElement('button');
  b.textContent = t;
  b.style.margin = '5px'; b.style.padding = '10px 12px'; b.style.border = '0'; b.style.borderRadius = '10px';
  b.style.background = '#d8953f'; b.style.color = '#201209'; b.style.fontWeight = '900'; b.style.cursor = 'pointer';
  b.onclick = fn;
  return b;
}
function showMessage(title, txt) {
  card.style.display = 'block'; card.textContent = '';
  const h = document.createElement('h2'); h.textContent = title; h.style.margin = '0 0 8px';
  const p = document.createElement('p'); p.textContent = txt; p.style.lineHeight = '1.45';
  card.append(h, p, makeBtn('Kapat', () => card.style.display = 'none'));
}
function intro() {
  showMessage('Bölüm 1: Sancaklar Ayrıldı', 'Artık tek saray yok. Dünya haritası gerçek asset bölgelerine bölündü: güneyde Mavi Hanedan, merkezde kral sarayı, batıda Selim’in askerî sancağı, doğuda Orhan’ın talim ocağı, kuzeyde Cem’in gizli divanı. WASD ile yürü, mouse ile kamerayı çevir, E ile konuş.');
}
function final() {
  let title = 'Eksik Destek', txt = 'Taht için yeterli güç topladın ama dengeler zayıf kaldı. Divan seni bekletmeye aldı.';
  if (state.sus > 70) { title = 'Gölgen Ağır Bastı'; txt = 'Entrika ağın büyüdü. Saray seni durduramadı ama halk seni korkuyla andı.'; }
  else if (state.trust >= 55 && state.pub >= 55) { title = 'Adaletle Gelen Taht'; txt = 'Kral ve halk seni meşru varis olarak kabul etti. Taht kılıçla değil rızayla alındı.'; }
  else if (state.mil >= 65 && state.inf >= 45) { title = 'Sancakların Seçtiği Şehzade'; txt = 'Ordular ve sancak beyleri senin yanında birleşti. Divan askerin gölgesinde karar verdi.'; }
  else if (state.inf >= 70) { title = 'Sarayın Sessiz Galibi'; txt = 'Mühürler, defterler ve gizli ittifaklar seni tahta taşıdı.'; }
  card.style.display = 'block'; card.textContent = '';
  const h = document.createElement('h1'); h.textContent = title;
  const p = document.createElement('p'); p.textContent = txt;
  card.append(h, p, makeBtn('Baştan Oyna', () => location.reload()));
}
const story = {
  king: { t: 'Kral merkez divanda oturur. Gözleri yaşlıdır ama zihni hâlâ keskindir.', o: [['Devlet düzenini anlat', { trust: 9, inf: 5, gold: -4 }], ['Halkı koruyacağını söyle', { trust: 6, pub: 8, gold: -7 }], ['Taht iddiamı açıkla', { trust: -2, inf: 7, sus: 5 }]] },
  vezir: { t: 'Vezir Nizam, mührün kılıçtan daha uzun yaşadığını fısıldar.', o: [['Defterleri kontrol et', { inf: 14, gold: -8, sus: 3 }], ['Sessiz bürokrasi kur', { inf: 8, sus: -2 }]] },
  komutan: { t: 'Komutan Boran, sancakların kime döneceğini ordunun belirleyeceğini söyler.', o: [['Talim emri ver', { mil: 16, gold: -9 }], ['Disiplin vaadi ver', { mil: 8, trust: 5 }]] },
  halk: { t: 'Elçi Derya, pazarın ve köylünün desteği olmadan tahtın boş kalacağını söyler.', o: [['Erzak dağıt', { pub: 17, gold: -12 }], ['Vergiyi hafifletme sözü ver', { pub: 10, trust: 3 }]] },
  katip: { t: 'Sır Katibi Rafi, hangi sancakta kimin kime bağlı olduğunu bilir.', o: [['Gizli rapor iste', { inf: 12, sus: 8 }], ['Sadece dinle', { inf: 5, sus: -4 }]] },
  selim: { t: 'Selim’in kırmızı sancağında kışla, kule ve savaş meydanı var. Gücü askerî disipline dayanır.', o: [['Geçici ittifak kur', { mil: 10, inf: 5, trust: -2 }], ['Onun komutanlarını yanına çek', { mil: 12, sus: 8 }], ['Açık rekabet ilan et', { inf: 7, sus: 4 }]] },
  orhan: { t: 'Orhan’ın yeşil ocağı talim ve düzen üzerine kurulu. Asker sever ama saray entrikasından hoşlanmaz.', o: [['Talim ortaklığı kur', { mil: 13, gold: -7 }], ['Dürüst anlaşma yap', { trust: 6, mil: 5, sus: -3 }], ['Kampını gözlet', { inf: 8, sus: 7 }]] },
  cem: { t: 'Cem’in mor divanı kuzeyde, yüksek kuleler ve gizli yollar arasında. Onun gücü bilgi ve sabırdır.', o: [['Bilgi takası yap', { inf: 15, sus: 6 }], ['Evlilik/akrabalık ittifakı öner', { trust: 6, inf: 5, gold: -6 }], ['Gizli ağını boz', { inf: 10, sus: 12 }]] }
};
function openNpc(n) {
  const d = n.userData;
  state.visited[d.id] = true;
  card.style.display = 'block'; card.textContent = '';
  const h = document.createElement('h2'); h.textContent = d.name + ' - ' + d.role;
  const p = document.createElement('p'); p.style.lineHeight = '1.45';
  card.append(h, p);
  if (d.id === 'king' && score() >= 145) {
    p.textContent = 'Divan hazır. Sancaklar sözünü söyledi. Taht iddianı açıklayabilirsin.';
    card.append(makeBtn('Final Divanı Topla', () => { apply({ trust: 8, inf: 6 }); final(); }), makeBtn('Biraz daha hazırlan', () => card.style.display = 'none'));
    return;
  }
  const s = story[d.id] || { t: 'Bu kişi saray dengesini etkiler.', o: [['Destek iste', { inf: 6, pub: 4 }]] };
  p.textContent = s.t;
  s.o.forEach(o => card.appendChild(makeBtn(o[0], () => { apply(o[1]); openNpc(n); })));
  card.appendChild(makeBtn('Ayrıl', () => card.style.display = 'none'));
}
const keys = {}; let angle = Math.PI, mouse = false, near = null;
addEventListener('keydown', e => { keys[e.code] = true; if (e.code === 'KeyE' && near) openNpc(near); if (e.code === 'KeyM') showMessage('Harita', 'Güney: Mavi Hanedan. Merkez: Kral Sarayı. Batı: Selim. Doğu: Orhan. Kuzey: Cem.'); });
addEventListener('keyup', e => keys[e.code] = false);
addEventListener('mousedown', () => mouse = true);
addEventListener('mouseup', () => mouse = false);
addEventListener('mousemove', e => { if (mouse) angle -= e.movementX * .006; });
addEventListener('resize', () => { ctx.camera.aspect = innerWidth / innerHeight; ctx.camera.updateProjectionMatrix(); ctx.renderer.setSize(innerWidth, innerHeight); });
function loop(t = 0) {
  requestAnimationFrame(loop);
  const v = new THREE.Vector3((keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0), 0, (keys.KeyS ? 1 : 0) - (keys.KeyW ? 1 : 0));
  if (v.lengthSq()) {
    v.normalize();
    const f = new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle));
    const r = new THREE.Vector3(f.z, 0, -f.x);
    const speed = keys.ShiftLeft || keys.ShiftRight ? 0.22 : 0.13;
    const mv = r.multiplyScalar(v.x).add(f.multiplyScalar(v.z)).multiplyScalar(speed);
    ctx.player.position.add(mv);
    ctx.player.position.x = Math.max(-ctx.mapBounds.x, Math.min(ctx.mapBounds.x, ctx.player.position.x));
    ctx.player.position.z = Math.max(ctx.mapBounds.zMin, Math.min(ctx.mapBounds.zMax, ctx.player.position.z));
    ctx.player.rotation.y = Math.atan2(mv.x, mv.z);
  }
  let best = null, dist = 999;
  for (const n of ctx.npcs) {
    const d = n.position.distanceTo(ctx.player.position);
    if (d < dist) { dist = d; best = n; }
  }
  near = dist < 5.2 ? best : null;
  if (near) { tip.style.display = 'block'; tip.textContent = 'E - ' + near.userData.name + ' ile konuş'; } else tip.style.display = 'none';
  const target = ctx.player.position.clone().add(new THREE.Vector3(0, 2.1, 0));
  const off = new THREE.Vector3(Math.sin(angle) * 15, 10.2, Math.cos(angle) * 15);
  ctx.camera.position.lerp(target.clone().add(off), .075);
  ctx.camera.lookAt(target);
  ctx.renderer.render(ctx.scene, ctx.camera);
}
ctx.camera.position.set(0, 16, 104);
ctx.camera.lookAt(ctx.player.position);
hudUpdate();
intro();
loop();
