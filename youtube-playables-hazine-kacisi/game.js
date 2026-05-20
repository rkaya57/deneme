const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const coinsEl = document.getElementById('coins');
const timeEl = document.getElementById('time');
const livesEl = document.getElementById('lives');
const floorEl = document.getElementById('floor');
const bestEl = document.getElementById('best');
const missionText = document.getElementById('missionText');
const comboText = document.getElementById('comboText');
const progressBar = document.getElementById('progressBar');
const factText = document.getElementById('factText');
const messageText = document.getElementById('messageText');
const startPanel = document.getElementById('startPanel');
const gameOverPanel = document.getElementById('gameOverPanel');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const soundBtn = document.getElementById('soundBtn');
const finalScore = document.getElementById('finalScore');
const finalCoins = document.getElementById('finalCoins');
const finalBest = document.getElementById('finalBest');
const resultTitle = document.getElementById('resultTitle');
const resultText = document.getElementById('resultText');
const resultBadge = document.getElementById('resultBadge');

const W = canvas.width;
const H = canvas.height;
const lanes = [W * 0.2, W * 0.5, W * 0.8];
const facts = [
  'Antik Misirda bazi isciler ucretlerini tahil ve erzak olarak alirdi.',
  'Papirus, Nil cevresinde yetisen bitkilerden yapilan onemli bir yazi malzemesiydi.',
  'Misirlilar zamani takip etmek icin gunes ve su saatleri kullanirdi.',
  'Skarabe sembolu Antik Misirda yenilenme ve koruma fikriyle iliskilendirilirdi.'
];

let state;
let rafId;
let muted = false;
let best = Number(localStorage.getItem('hazineKacisiBest') || 0);
bestEl.textContent = best;

function resetState() {
  state = {
    running: false,
    timeLeft: 60,
    elapsed: 0,
    score: 0,
    coins: 0,
    combo: 1,
    comboTimer: 0,
    lives: 3,
    floor: 1,
    speed: 260,
    spawnTimer: 0,
    coinTimer: 0,
    powerTimer: 4,
    laneIndex: 1,
    targetX: lanes[1],
    jump: 0,
    jumpVel: 0,
    invincible: 0,
    shield: 0,
    magnet: 0,
    slow: 0,
    flash: 0,
    shake: 0,
    player: { x: lanes[1], y: H - 108, w: 42, h: 54 },
    obstacles: [],
    coinsOnMap: [],
    powers: [],
    particles: [],
    last: 0,
    missionCoins: 25
  };
}

function msg(text) {
  messageText.textContent = text;
  messageText.classList.add('show');
  setTimeout(function () { messageText.classList.remove('show'); }, 900);
}

function sound(freq, dur) {
  if (muted) return;
  try {
    const ac = new (window.AudioContext || window.webkitAudioContext)();
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.frequency.value = freq;
    o.type = 'triangle';
    g.gain.value = 0.025;
    o.connect(g); g.connect(ac.destination); o.start();
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
    o.stop(ac.currentTime + dur);
  } catch (e) {}
}

function startGame() {
  resetState();
  state.running = true;
  startPanel.classList.remove('active');
  gameOverPanel.classList.remove('active');
  factText.textContent = facts[Math.floor(Math.random() * facts.length)];
  msg('Tapinak 1');
  sound(640, 0.08);
  cancelAnimationFrame(rafId);
  state.last = performance.now();
  rafId = requestAnimationFrame(loop);
}

function endGame(reason) {
  if (!state.running) return;
  state.running = false;
  cancelAnimationFrame(rafId);
  if (state.score > best) {
    best = state.score;
    localStorage.setItem('hazineKacisiBest', String(best));
    resultBadge.textContent = 'Yeni rekor';
    resultTitle.textContent = 'Efsane kacis';
    resultText.textContent = 'Yeni rekor kirdin. Bir sonraki turda daha yuksek combo yap.';
  } else if (reason === 'time') {
    resultBadge.textContent = '60 saniye tamamlandi';
    resultTitle.textContent = 'Hazineden ciktin';
    resultText.textContent = 'Sureyi bitirdin. Power-up toplayarak skoru buyutebilirsin.';
  } else {
    resultBadge.textContent = 'Tapinak seni durdurdu';
    resultTitle.textContent = 'Bir tur daha';
    resultText.textContent = 'Kalkan ve yavas zaman guclerini toplayarak daha uzun dayan.';
  }
  finalScore.textContent = state.score;
  finalCoins.textContent = state.coins;
  finalBest.textContent = best;
  bestEl.textContent = best;
  gameOverPanel.classList.add('active');
}

function moveLane(dir) {
  if (!state.running) return;
  state.laneIndex = Math.max(0, Math.min(2, state.laneIndex + dir));
  state.targetX = lanes[state.laneIndex];
}

function jump() {
  if (!state.running || state.jump > 2) return;
  state.jumpVel = 570;
  sound(500, 0.05);
}

window.addEventListener('keydown', function (e) {
  const k = e.key.toLowerCase();
  if (e.key === 'ArrowLeft' || k === 'a') moveLane(-1);
  if (e.key === 'ArrowRight' || k === 'd') moveLane(1);
  if (e.key === 'ArrowUp' || k === 'w') jump();
  if ((e.key === 'Enter' || e.key === ' ') && (!state || !state.running)) startGame();
});

let tx = 0, ty = 0;
canvas.addEventListener('touchstart', function (e) { tx = e.changedTouches[0].clientX; ty = e.changedTouches[0].clientY; }, { passive: true });
canvas.addEventListener('touchend', function (e) {
  const dx = e.changedTouches[0].clientX - tx;
  const dy = e.changedTouches[0].clientY - ty;
  if (Math.abs(dy) > 28 && dy < 0) jump();
  else if (Math.abs(dx) > 22) moveLane(dx > 0 ? 1 : -1);
}, { passive: true });
canvas.addEventListener('pointerdown', function (e) {
  if (!state.running) return;
  const r = canvas.getBoundingClientRect();
  moveLane(e.clientX - r.left < r.width / 2 ? -1 : 1);
});

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);
soundBtn.addEventListener('click', function () { muted = !muted; soundBtn.textContent = muted ? '🔇' : '🔊'; });

function addParticles(x, y, count, color) {
  for (let i = 0; i < count; i++) {
    state.particles.push({ x, y, vx: (Math.random() - 0.5) * 160, vy: (Math.random() - 0.5) * 160, life: 0.55, color });
  }
}

function spawnObstacle() {
  const lane = Math.floor(Math.random() * 3);
  const roll = Math.random();
  const type = roll > 0.78 ? 'laser' : roll > 0.54 ? 'blade' : roll > 0.28 ? 'spike' : 'rock';
  const h = type === 'laser' ? 18 : type === 'blade' ? 62 : 48;
  state.obstacles.push({ lane, x: lanes[lane], y: -70, w: 58, h, type, passed: false, spin: 0 });
}

function spawnCoin() {
  const lane = Math.floor(Math.random() * 3);
  state.coinsOnMap.push({ lane, x: lanes[lane], y: -40, r: 13, pulse: Math.random() * 10 });
}

function spawnPower() {
  const lane = Math.floor(Math.random() * 3);
  const arr = ['shield', 'magnet', 'slow'];
  state.powers.push({ lane, x: lanes[lane], y: -50, r: 17, type: arr[Math.floor(Math.random() * arr.length)], pulse: 0 });
}

function hit(a, b) {
  return Math.abs(a.x - b.x) < (a.w + b.w) * 0.42 && Math.abs(a.y - b.y) < (a.h + b.h) * 0.42;
}

function damage() {
  if (state.invincible > 0) return;
  if (state.shield > 0) { state.shield = 0; state.invincible = 1.0; msg('Kalkan kirildi'); addParticles(state.player.x, state.player.y, 20, '#2ec4ff'); return; }
  state.lives -= 1;
  state.invincible = 1.15;
  state.shake = 12;
  addParticles(state.player.x, state.player.y, 24, '#ef476f');
  sound(150, 0.14);
  if (state.lives <= 0) endGame('hit');
}

function update(dt) {
  state.elapsed += dt;
  state.timeLeft = Math.max(0, 60 - state.elapsed);
  state.floor = 1 + Math.floor(state.elapsed / 15);
  state.speed = 260 + (state.floor - 1) * 55;
  const slowFactor = state.slow > 0 ? 0.55 : 1;
  const moveSpeed = state.speed * slowFactor;

  state.spawnTimer -= dt; state.coinTimer -= dt; state.powerTimer -= dt;
  state.comboTimer -= dt; state.invincible -= dt; state.shield -= dt; state.magnet -= dt; state.slow -= dt; state.flash -= dt;
  if (state.comboTimer <= 0) state.combo = 1;

  const oldFloor = floorEl.textContent;
  if (String(state.floor) !== oldFloor) msg('Tapinak ' + state.floor);

  state.player.x += (state.targetX - state.player.x) * Math.min(1, dt * 14);
  if (state.jumpVel > 0 || state.jump > 0) {
    state.jumpVel -= 1400 * dt;
    state.jump = Math.max(0, state.jump + state.jumpVel * dt);
  }

  if (state.spawnTimer <= 0) { spawnObstacle(); state.spawnTimer = Math.max(0.42, 1.0 - state.floor * 0.08) + Math.random() * 0.25; }
  if (state.coinTimer <= 0) { spawnCoin(); state.coinTimer = 0.33 + Math.random() * 0.26; }
  if (state.powerTimer <= 0) { spawnPower(); state.powerTimer = 6 + Math.random() * 5; }

  state.obstacles.forEach(function (o) {
    o.y += moveSpeed * dt; o.spin += dt * 8;
    if (!o.passed && o.y > state.player.y + 45) { o.passed = true; state.score += 5; }
    const playerBox = { x: state.player.x, y: state.player.y - state.jump, w: state.player.w, h: state.player.h };
    if (hit(playerBox, o) && state.jump < 38) damage();
  });

  state.coinsOnMap.forEach(function (c) {
    if (state.magnet > 0) { c.x += (state.player.x - c.x) * dt * 3.8; }
    c.y += (moveSpeed + 35) * dt; c.pulse += dt * 8;
    const got = Math.abs(state.player.x - c.x) < 42 && Math.abs(state.player.y - state.jump - c.y) < 52;
    if (got && !c.hit) { c.hit = true; state.coins++; state.combo = Math.min(8, state.combo + 1); state.comboTimer = 3.2; state.score += 10 * state.combo; addParticles(c.x, c.y, 10, '#ffd166'); sound(760, 0.045); }
  });

  state.powers.forEach(function (p) {
    p.y += (moveSpeed + 20) * dt; p.pulse += dt * 7;
    const got = Math.abs(state.player.x - p.x) < 44 && Math.abs(state.player.y - state.jump - p.y) < 54;
    if (got && !p.hit) {
      p.hit = true; state.score += 60; addParticles(p.x, p.y, 18, '#2ec4ff'); sound(900, 0.07);
      if (p.type === 'shield') { state.shield = 8; msg('Kalkan aktif'); }
      if (p.type === 'magnet') { state.magnet = 8; msg('Miknatis aktif'); }
      if (p.type === 'slow') { state.slow = 5; msg('Zaman yavasladi'); }
    }
  });

  state.obstacles = state.obstacles.filter(function (o) { return o.y < H + 100; });
  state.coinsOnMap = state.coinsOnMap.filter(function (c) { return !c.hit && c.y < H + 60; });
  state.powers = state.powers.filter(function (p) { return !p.hit && p.y < H + 70; });
  state.particles.forEach(function (p) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; p.vy += 190 * dt; });
  state.particles = state.particles.filter(function (p) { return p.life > 0; });
  state.shake = Math.max(0, state.shake - 40 * dt);

  if (state.coins >= state.missionCoins) { state.score += 160; state.missionCoins += 25; msg('Gorev tamam'); addParticles(W / 2, 155, 30, '#ffd166'); }
  if (state.timeLeft <= 0) endGame('time');
}

function bg() {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#6b3a17'); g.addColorStop(.38, '#291207'); g.addColorStop(1, '#080403');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const t = state.elapsed * state.speed * .28;
  for (let i = 0; i < 9; i++) { const y = (t + i * 95) % (H + 120) - 80; ctx.fillStyle = i % 2 ? 'rgba(255,209,102,.09)' : 'rgba(255,255,255,.04)'; ctx.fillRect(W*.15, y, W*.7, 7); }
  ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(0,0,W*.1,H); ctx.fillRect(W*.9,0,W*.1,H);
  for (let i = 0; i < 18; i++) { const y = (t * 1.4 + i * 52) % (H + 60) - 40; ctx.fillStyle = 'rgba(255,209,102,.12)'; ctx.fillRect(28, y, 34, 18); ctx.fillRect(W-62, y+20, 34, 18); }
  lanes.forEach(function (x) { ctx.strokeStyle = 'rgba(245,215,161,.16)'; ctx.lineWidth = 2; ctx.setLineDash([14,20]); ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); ctx.setLineDash([]); });
}

function drawPlayer() {
  const p = state.player; const y = p.y - state.jump;
  ctx.save(); ctx.translate(p.x, y);
  ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(0, 36 + state.jump * .25, 30, 9, 0, 0, Math.PI*2); ctx.fill();
  if (state.shield > 0) { ctx.strokeStyle = 'rgba(46,196,255,.9)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, 36 + Math.sin(state.elapsed*9)*3, 0, Math.PI*2); ctx.stroke(); }
  ctx.globalAlpha = state.invincible > 0 && Math.floor(state.elapsed*14)%2 ? .45 : 1;
  ctx.fillStyle = '#f7c46b'; ctx.beginPath(); ctx.arc(0,-17,18,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = '#211207'; ctx.fillRect(-13,-37,26,11); ctx.fillRect(-8,-19,5,5); ctx.fillRect(5,-19,5,5);
  ctx.fillStyle = '#2b1b10'; ctx.fillRect(-17,2,34,35); ctx.fillStyle = '#ffd166'; ctx.fillRect(-20,8,40,7);
  ctx.restore();
}

function drawObstacle(o) {
  ctx.save(); ctx.translate(o.x, o.y);
  if (o.type === 'laser') { ctx.fillStyle = '#ef476f'; ctx.shadowColor = '#ef476f'; ctx.shadowBlur = 16; ctx.fillRect(-42,-8,84,16); }
  else if (o.type === 'blade') { ctx.rotate(o.spin); ctx.fillStyle = '#c9b28a'; for (let i=0;i<4;i++){ ctx.rotate(Math.PI/2); ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(9,-38); ctx.lineTo(-9,-38); ctx.closePath(); ctx.fill(); } ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(0,0,10,0,Math.PI*2); ctx.fill(); }
  else if (o.type === 'spike') { ctx.fillStyle = '#8d6e4b'; for (let i=-1;i<=1;i++){ ctx.beginPath(); ctx.moveTo(i*18,-24); ctx.lineTo(i*18-16,24); ctx.lineTo(i*18+16,24); ctx.closePath(); ctx.fill(); } }
  else { ctx.fillStyle = '#7d5632'; ctx.beginPath(); ctx.roundRect(-27,-23,54,46,12); ctx.fill(); ctx.fillStyle='rgba(0,0,0,.2)'; ctx.fillRect(-13,-8,26,8); }
  ctx.shadowBlur = 0; ctx.restore();
}

function drawCoin(c) { ctx.save(); ctx.translate(c.x,c.y); const s=1+Math.sin(c.pulse)*.1; ctx.scale(s,s); ctx.fillStyle='#ffd166'; ctx.shadowColor='#ffd166'; ctx.shadowBlur=12; ctx.beginPath(); ctx.arc(0,0,c.r,0,Math.PI*2); ctx.fill(); ctx.strokeStyle='#8f5d0d'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(0,0,c.r-4,0,Math.PI*2); ctx.stroke(); ctx.restore(); }
function drawPower(p) { ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(Math.sin(p.pulse)*.15); ctx.fillStyle = p.type==='shield'?'#2ec4ff':p.type==='magnet'?'#95f985':'#b197fc'; ctx.shadowColor=ctx.fillStyle; ctx.shadowBlur=16; ctx.beginPath(); ctx.roundRect(-18,-18,36,36,10); ctx.fill(); ctx.fillStyle='#061018'; ctx.font='20px Arial'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(p.type==='shield'?'S':p.type==='magnet'?'M':'T',0,1); ctx.restore(); }
function drawParticles() { state.particles.forEach(function(p){ ctx.globalAlpha=Math.max(0,p.life*2); ctx.fillStyle=p.color; ctx.beginPath(); ctx.arc(p.x,p.y,3.2,0,Math.PI*2); ctx.fill(); ctx.globalAlpha=1; }); }

function render() {
  ctx.save(); if (state.shake > 0) ctx.translate((Math.random()-.5)*state.shake, (Math.random()-.5)*state.shake);
  bg(); state.coinsOnMap.forEach(drawCoin); state.powers.forEach(drawPower); state.obstacles.forEach(drawObstacle); drawParticles(); drawPlayer();
  if (state.slow > 0) { ctx.fillStyle='rgba(46,196,255,.08)'; ctx.fillRect(0,0,W,H); }
  ctx.restore();
}

function syncHud() {
  scoreEl.textContent = state.score; coinsEl.textContent = state.coins; timeEl.textContent = Math.ceil(state.timeLeft); livesEl.textContent = state.lives; floorEl.textContent = state.floor; bestEl.textContent = best;
  comboText.textContent = 'Carpan x' + state.combo;
  missionText.textContent = 'Gorev: ' + state.missionCoins + ' altin topla';
  progressBar.style.width = Math.min(100, (state.elapsed / 60) * 100) + '%';
}

function loop(now) {
  if (!state.running) return;
  const dt = Math.min(0.035, (now - state.last) / 1000);
  state.last = now; update(dt); render(); syncHud(); rafId = requestAnimationFrame(loop);
}

resetState(); render(); syncHud();