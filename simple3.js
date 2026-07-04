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
  e.style.position = 'absolute';
  e.style.left = x;
  e.style.top = y;
  e.style.width = w;
  e.style.padding = '12px';
  e.style.borderRadius = '14px';
  e.style.background = 'linear-gradient(180deg, rgba(12,9,14,.88), rgba(7,6,8,.76))';
  e.style.border = '1px solid rgba(246,212,123,.24)';
  e.style.boxShadow = '0 12px 36px rgba(0,0,0,.35)';
  e.style.pointerEvents = 'auto';
  ui.appendChild(e);
  return e;
}

const hud = panelBox('16px', '16px', 'min(940px,calc(100vw - 32px))');
const quest = panelBox('16px', 'auto', 'min(390px,calc(100vw - 32px))'); quest.style.bottom = '20px';
const region = panelBox('50%', '80px', 'auto'); region.style.transform = 'translateX(-50%)'; region.style.display = 'none'; region.style.fontWeight = '900';
const card = panelBox('50%', 'auto', 'min(900px,94vw)'); card.style.bottom = '20px'; card.style.transform = 'translateX(-50%)'; card.style.display = 'none';
const tip = panelBox('50%', 'auto', 'auto'); tip.style.bottom = '168px'; tip.style.transform = 'translateX(-50%)'; tip.style.display = 'none';
const mapBox = panelBox('auto', '16px', '180px'); mapBox.style.right = '16px'; mapBox.style.left = 'auto';
const mini = document.createElement('canvas'); mini.width = 180; mini.height = 180; mini.style.display = 'block'; mini.style.borderRadius = '12px'; mapBox.appendChild(mini);
const menu = document.createElement('div');
menu.style.position = 'fixed'; menu.style.inset = '0'; menu.style.zIndex = '20'; menu.style.pointerEvents = 'auto';
menu.style.background = 'radial-gradient(circle at center, rgba(60,40,20,.96), rgba(5,5,8,.98))';
menu.style.display = 'grid'; menu.style.placeItems = 'center'; ui.appendChild(menu);

const SAVE_KEY = 'tahtin-golgesi-save-v1';
const clock = new THREE.Clock();
let walkPhase = 0, idlePhase = 0, near = null, mouse = false, angle = Math.PI, started = false, lastRegion = '', regionTimer = 0, autosaveTimer = 0;
const keys = {};

const state = {
  day: 1, inf: 24, mil: 18, pub: 22, gold: 42, trust: 12, sus: 4,
  visited: {}, quests: { king: false, princes: false, council: false, final: false },
  rivals: { selim: 46, orhan: 42, cem: 44 }, log: []
};
ctx.gameState = state;
if (ctx.player && ctx.player.userData.baseY === undefined) ctx.player.userData.baseY = ctx.player.position.y;

function clamp(v) { return Math.max(0, Math.min(100, Math.round(v))); }
function score() { return state.inf + state.mil + state.pub + state.trust - Math.floor(state.sus * 1.35); }
function qMark(done) { return done ? '✓' : '□'; }
function pushLog(t) { state.log.unshift(t); state.log = state.log.slice(0, 4); }
function hudUpdate() {
  const s = score();
  hud.innerHTML = '<b>Tahtın Gölgesi</b> | Gün ' + state.day + ' | Nüfuz ' + state.inf + ' | Asker ' + state.mil + ' | Halk ' + state.pub + ' | Altın ' + state.gold + ' | Kral ' + state.trust + ' | Şüphe ' + state.sus + ' | <b>Taht Puanı ' + s + '/145</b>';
  const pDone = state.visited.selim && state.visited.orhan && state.visited.cem;
  state.quests.princes = !!pDone;
  state.quests.council = !!(state.visited.vezir && state.visited.komutan && state.visited.halk && state.visited.katip);
  state.quests.final = s >= 145;
  quest.innerHTML = '<b>Görevler</b><br>' +
    qMark(state.quests.king) + ' Kral ile ilk görüşme<br>' +
    qMark(state.quests.princes) + ' Selim, Orhan ve Cem sancaklarını ziyaret et<br>' +
    qMark(state.quests.council) + ' Vezir, komutan, halk ve katip desteği topla<br>' +
    qMark(state.quests.final) + ' Taht puanını 145 üstüne çıkar<br><br>' +
    '<b>Rakip Güçleri</b><br>Selim ' + state.rivals.selim + ' | Orhan ' + state.rivals.orhan + ' | Cem ' + state.rivals.cem + '<br>' +
    '<small>' + (state.log[0] || 'M: harita, F5: kaydet, F9: yükle') + '</small>';
}
function makeBtn(t, fn) {
  const b = document.createElement('button');
  b.textContent = t; b.style.margin = '5px'; b.style.padding = '10px 12px'; b.style.border = '0'; b.style.borderRadius = '10px';
  b.style.background = '#d8953f'; b.style.color = '#201209'; b.style.fontWeight = '900'; b.style.cursor = 'pointer'; b.onclick = fn; return b;
}
function showMessage(title, txt) {
  card.style.display = 'block'; card.textContent = '';
  const h = document.createElement('h2'); h.textContent = title; h.style.margin = '0 0 8px';
  const p = document.createElement('p'); p.textContent = txt; p.style.lineHeight = '1.45';
  card.append(h, p, makeBtn('Kapat', () => card.style.display = 'none'));
}
function saveGame(silent = false) {
  const pos = ctx.player.position;
  const data = { state, pos: [pos.x, pos.y, pos.z], angle };
  localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  if (!silent) showMessage('Kaydedildi', 'Oyun ilerlemesi tarayıcıya kaydedildi. F9 ile yükleyebilirsin.');
}
function loadGame() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) { showMessage('Kayıt Yok', 'Henüz kayıt bulunamadı. Yeni oyun başlat.'); return false; }
  try {
    const data = JSON.parse(raw);
    Object.assign(state, data.state || {});
    if (data.pos) ctx.player.position.set(...data.pos);
    angle = data.angle || Math.PI;
    started = true; menu.style.display = 'none'; hudUpdate(); pushLog('Kayıt yüklendi.'); return true;
  } catch { showMessage('Kayıt Bozuk', 'Kayıt okunamadı. Yeni oyun başlatman gerekiyor.'); return false; }
}
function newGame() { localStorage.removeItem(SAVE_KEY); started = true; menu.style.display = 'none'; intro(); hudUpdate(); }
function showMenu() {
  const hasSave = !!localStorage.getItem(SAVE_KEY);
  menu.innerHTML = '<div style="max-width:720px;text-align:center;padding:28px;border:1px solid rgba(246,212,123,.3);border-radius:22px;background:rgba(8,6,10,.72);box-shadow:0 20px 70px rgba(0,0,0,.55)"><h1 style="font-size:46px;margin:0 0 6px">Tahtın Gölgesi</h1><p style="font-size:18px;line-height:1.5">Sancakları gez, ittifak kur, rakipleri zayıflat ve final divanında taht iddianı açıkla.</p><p>WASD hareket, Shift koşu, E konuşma, M harita, F5 kaydet, F9 yükle</p></div>';
  const box = menu.firstChild;
  box.appendChild(makeBtn('Yeni Oyun', newGame));
  if (hasSave) box.appendChild(makeBtn('Devam Et', loadGame));
}
function intro() { showMessage('Bölüm 1: Sancaklar Ayrıldı', 'Oyun artık ana menü, kayıt sistemi, mini harita, bölge bildirimi, görev takibi, rakip hamleleri ve basit çatışma sistemiyle çalışıyor. Önce merkez saraya git ve kral ile konuş.'); }
function rivalTurn() {
  const ids = ['selim', 'orhan', 'cem'];
  const id = ids[Math.floor(Math.random() * ids.length)];
  const gain = 2 + Math.floor(Math.random() * 5);
  state.rivals[id] = clamp(state.rivals[id] + gain);
  const names = { selim: 'Selim', orhan: 'Orhan', cem: 'Cem' };
  pushLog(names[id] + ' sancağı güç topladı: +' + gain);
}
function apply(e) {
  for (const k in e) state[k] = clamp((state[k] || 0) + e[k]);
  state.day++;
  if (state.day % 2 === 0) rivalTurn();
  hudUpdate(); saveGame(true);
}
function final() {
  let title = 'Eksik Destek', txt = 'Taht için yeterli güç topladın ama dengeler zayıf kaldı.';
  const maxRival = Math.max(state.rivals.selim, state.rivals.orhan, state.rivals.cem);
  if (state.sus > 70) { title = 'Gölgen Ağır Bastı'; txt = 'Entrika ağın büyüdü. Saray seni durduramadı ama halk seni korkuyla andı.'; }
  else if (maxRival > score()) { title = 'Rakip Sancaklar Üstün Geldi'; txt = 'Rakip şehzadelerin orduları senden güçlü kaldı. Divan karar veremedi.'; }
  else if (state.trust >= 55 && state.pub >= 55) { title = 'Adaletle Gelen Taht'; txt = 'Kral ve halk seni meşru varis kabul etti.'; }
  else if (state.mil >= 65 && state.inf >= 45) { title = 'Sancakların Seçtiği Şehzade'; txt = 'Komutanlar ve sancak beyleri senin yanında birleşti.'; }
  else if (state.inf >= 70) { title = 'Sarayın Sessiz Galibi'; txt = 'Mühürler, defterler ve gizli ittifaklar seni tahta taşıdı.'; }
  card.style.display = 'block'; card.textContent = '';
  const h = document.createElement('h1'); h.textContent = title;
  const p = document.createElement('p'); p.textContent = txt;
  card.append(h, p, makeBtn('Baştan Oyna', () => location.reload()));
}
const story = {
  king: { t: 'Kral merkez divanda oturur. İlk görüşme taht yolunun kapısını açar.', o: [['Devlet düzenini anlat', { trust: 9, inf: 5, gold: -4 }], ['Halkı koruyacağını söyle', { trust: 6, pub: 8, gold: -7 }], ['Taht iddiamı açıkla', { trust: -2, inf: 7, sus: 5 }]] },
  vezir: { t: 'Vezir Nizam, mühürlerin kılıçtan uzun yaşadığını söyler.', o: [['Defterleri kontrol et', { inf: 14, gold: -8, sus: 3 }], ['Sessiz bürokrasi kur', { inf: 8, sus: -2 }]] },
  komutan: { t: 'Komutan Boran, ordunun kimi destekleyeceğini ölçer.', o: [['Talim emri ver', { mil: 16, gold: -9 }], ['Disiplin vaadi ver', { mil: 8, trust: 5 }]] },
  halk: { t: 'Elçi Derya, pazar ve köylünün rızasını taşır.', o: [['Erzak dağıt', { pub: 17, gold: -12 }], ['Vergiyi hafifletme sözü ver', { pub: 10, trust: 3 }]] },
  katip: { t: 'Sır Katibi Rafi, gizli bağlılıkları bilir.', o: [['Gizli rapor iste', { inf: 12, sus: 8 }], ['Sadece dinle', { inf: 5, sus: -4 }]] },
  selim: { t: 'Selim’in sancağı askerî disipline dayanır.', o: [['Geçici ittifak kur', { mil: 10, inf: 5, trust: -2 }], ['Komutanlarını yanına çek', { mil: 12, sus: 8 }], ['Küçük çatışma başlat', { mil: -4, sus: 10 }, 'battle']] },
  orhan: { t: 'Orhan’ın ocağı talim ve düzen üzerine kurulu.', o: [['Talim ortaklığı kur', { mil: 13, gold: -7 }], ['Dürüst anlaşma yap', { trust: 6, mil: 5, sus: -3 }], ['Kampına baskın yap', { mil: -5, sus: 9 }, 'battle']] },
  cem: { t: 'Cem’in divanı bilgi ve sabırla güçlenir.', o: [['Bilgi takası yap', { inf: 15, sus: 6 }], ['Akrabalık ittifakı öner', { trust: 6, inf: 5, gold: -6 }], ['Gizli ağını boz', { inf: 10, sus: 12 }, 'battle']] }
};
function battle(id) {
  const names = { selim: 'Selim', orhan: 'Orhan', cem: 'Cem' };
  const our = state.mil + Math.floor(state.inf / 2) + Math.floor(Math.random() * 20);
  const their = state.rivals[id] + Math.floor(Math.random() * 20);
  if (our >= their) { state.rivals[id] = clamp(state.rivals[id] - 16); apply({ mil: 5, inf: 4, sus: 7 }); showMessage('Çatışma Kazanıldı', names[id] + ' sancağı geri çekildi. Rakip güç azaldı.'); }
  else { state.rivals[id] = clamp(state.rivals[id] + 6); apply({ mil: -10, pub: -4, sus: 10 }); showMessage('Çatışma Kaybedildi', names[id] + ' bu hamleden güçlenerek çıktı.'); }
}
function openNpc(n) {
  const d = n.userData; state.visited[d.id] = true; if (d.id === 'king') state.quests.king = true;
  card.style.display = 'block'; card.textContent = '';
  const h = document.createElement('h2'); h.textContent = d.name + ' - ' + d.role;
  const p = document.createElement('p'); p.style.lineHeight = '1.45'; card.append(h, p);
  if (d.id === 'king' && score() >= 145) { p.textContent = 'Divan hazır. Taht iddianı açıklayabilirsin.'; card.append(makeBtn('Final Divanı Topla', () => { apply({ trust: 8, inf: 6 }); final(); }), makeBtn('Ayrıl', () => card.style.display = 'none')); return; }
  const s = story[d.id] || { t: 'Bu kişi saray dengesini etkiler.', o: [['Destek iste', { inf: 6, pub: 4 }]] };
  p.textContent = s.t;
  s.o.forEach(o => card.appendChild(makeBtn(o[0], () => { if (o[2] === 'battle') battle(d.id); else { apply(o[1]); openNpc(n); } })));
  card.appendChild(makeBtn('Ayrıl', () => card.style.display = 'none'));
  hudUpdate(); saveGame(true);
}
function setAction(root, moving) { const a = root.userData.actions; if (!a) return; if (a.walk) { a.walk.setEffectiveWeight(moving ? 1 : 0); a.walk.timeScale = moving ? 1.35 : .2; } if (a.idle) a.idle.setEffectiveWeight(moving && a.walk ? .05 : 1); }
function animateCharacter(root, moving, dt) {
  if (!root) return; if (root.userData.baseY === undefined) root.userData.baseY = root.position.y; const baseY = root.userData.baseY;
  if (moving) { walkPhase += dt * 11.5; root.position.y = baseY + Math.abs(Math.sin(walkPhase)) * 0.09; root.rotation.z = THREE.MathUtils.lerp(root.rotation.z, Math.sin(walkPhase) * 0.035, .32); }
  else { idlePhase += dt * 2; root.position.y = THREE.MathUtils.lerp(root.position.y, baseY + Math.sin(idlePhase) * .018, .08); root.rotation.z = THREE.MathUtils.lerp(root.rotation.z, 0, .12); }
  setAction(root, moving);
}
function findRegion() {
  let best = '', dist = 999;
  for (const l of ctx.locations || []) { const d = ctx.player.position.distanceTo(new THREE.Vector3(...l.pos)); if (d < dist) { dist = d; best = l.name; } }
  if (dist < 30 && best !== lastRegion) { lastRegion = best; region.textContent = best; region.style.display = 'block'; regionTimer = 2.4; }
}
function drawMiniMap() {
  const g = mini.getContext('2d'); g.clearRect(0, 0, 180, 180); g.fillStyle = 'rgba(20,26,20,.92)'; g.fillRect(0, 0, 180, 180); g.strokeStyle = 'rgba(246,212,123,.55)'; g.strokeRect(6, 6, 168, 168);
  function px(x) { return 90 + x * .7; } function pz(z) { return 90 + (z + 20) * .58; }
  for (const l of ctx.locations || []) { g.fillStyle = '#d8953f'; g.beginPath(); g.arc(px(l.pos[0]), pz(l.pos[2]), 4, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = '#70b7ff'; g.beginPath(); g.arc(px(ctx.player.position.x), pz(ctx.player.position.z), 5, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#f8ead3'; g.font = '11px system-ui'; g.fillText('Mini Harita', 12, 20);
}
addEventListener('keydown', e => { keys[e.code] = true; if (e.code === 'KeyE' && near && started) openNpc(near); if (e.code === 'KeyM') showMessage('Harita', 'Güney: Mavi Hanedan. Merkez: Kral Sarayı. Batı: Selim. Doğu: Orhan. Kuzey: Cem.'); if (e.code === 'F5') { e.preventDefault(); saveGame(); } if (e.code === 'F9') { e.preventDefault(); loadGame(); } });
addEventListener('keyup', e => keys[e.code] = false);
addEventListener('mousedown', () => mouse = true); addEventListener('mouseup', () => mouse = false);
addEventListener('mousemove', e => { if (mouse) angle -= e.movementX * .006; });
addEventListener('resize', () => { ctx.camera.aspect = innerWidth / innerHeight; ctx.camera.updateProjectionMatrix(); ctx.renderer.setSize(innerWidth, innerHeight); });
function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(clock.getDelta(), .05); if (ctx.mixers) for (const m of ctx.mixers) m.update(dt);
  let moving = false;
  if (started) {
    const v = new THREE.Vector3((keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0), 0, (keys.KeyS ? 1 : 0) - (keys.KeyW ? 1 : 0));
    if (v.lengthSq()) { moving = true; v.normalize(); const f = new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle)); const r = new THREE.Vector3(f.z, 0, -f.x); const speed = keys.ShiftLeft || keys.ShiftRight ? .22 : .13; const mv = r.multiplyScalar(v.x).add(f.multiplyScalar(v.z)).multiplyScalar(speed); ctx.player.position.add(mv); ctx.player.position.x = Math.max(-ctx.mapBounds.x, Math.min(ctx.mapBounds.x, ctx.player.position.x)); ctx.player.position.z = Math.max(ctx.mapBounds.zMin, Math.min(ctx.mapBounds.zMax, ctx.player.position.z)); ctx.player.rotation.y = Math.atan2(mv.x, mv.z); }
    autosaveTimer += dt; if (autosaveTimer > 8) { autosaveTimer = 0; saveGame(true); }
  }
  animateCharacter(ctx.player, moving, dt); for (const n of ctx.npcs) animateCharacter(n, false, dt);
  let best = null, dist = 999; for (const n of ctx.npcs) { const d = n.position.distanceTo(ctx.player.position); if (d < dist) { dist = d; best = n; } }
  near = dist < 5.2 ? best : null; tip.style.display = near && started ? 'block' : 'none'; if (near) tip.textContent = 'E - ' + near.userData.name + ' ile konuş';
  findRegion(); if (regionTimer > 0) { regionTimer -= dt; if (regionTimer <= 0) region.style.display = 'none'; }
  drawMiniMap();
  const target = ctx.player.position.clone().add(new THREE.Vector3(0, 2.1, 0)); const off = new THREE.Vector3(Math.sin(angle) * 15, 10.2, Math.cos(angle) * 15);
  ctx.camera.position.lerp(target.clone().add(off), .075); ctx.camera.lookAt(target); ctx.renderer.render(ctx.scene, ctx.camera);
}
ctx.camera.position.set(0, 16, 104); ctx.camera.lookAt(ctx.player.position); hudUpdate(); showMenu(); loop();
