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
const chambers = [
  { name: 'Altin Salon', top: '#7a4519', mid: '#2f1609', floor: '#3a210f', accent: '#ffd166' },
  { name: 'Mavi Tapinak', top: '#163f57', mid: '#102034', floor: '#18243a', accent: '#2ec4ff' },
  { name: 'Lanetli Koridor', top: '#46234f', mid: '#1d1028', floor: '#2a1432', accent: '#b197fc' }
];
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

function rr(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

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
  msg('Altin Salon');
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
    state.particles.push({ x, y, vx: (Math.random() - 0.5) * 170, vy: (Math.random() - 0.5) * 170, life: 0.62, color });
  }
}

function spawnObstacle() {
  const lane = Math.floor(Math.random() * 3);
  const roll = Math.random();
  const type = roll > 0.82 ? 'laser' : roll > 0.62 ? 'blade' : roll > 0.42 ? 'scarab' : roll > 0.22 ? 'spike' : 'block';
  const h = type === 'laser' ? 18 : type === 'blade' ? 62 : type === 'scarab' ? 40 : 50;
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
  if (state.shield > 0) { state.shield = 0; state.invincible = 1.0; msg('Kalkan kirildi'); addParticles(state.player.x, state.player.y, 24, '#2ec4ff'); return; }
  state.lives -= 1;
  state.invincible = 1.15;
  state.shake = 14;
  addParticles(state.player.x, state.player.y, 28, '#ef476f');
  sound(150, 0.14);
  if (state.lives <= 0) endGame('hit');
}

function update(dt) {
  state.elapsed += dt;
  state.timeLeft = Math.max(0, 60 - state.elapsed);
  const nextFloor = 1 + Math.floor(state.elapsed / 15);
  if (nextFloor !== state.floor) {
    state.floor = nextFloor;
    msg(chambers[(state.floor - 1) % chambers.length].name);
  }
  state.speed = 260 + (state.floor - 1) * 55;
  const slowFactor = state.slow > 0 ? 0.55 : 1;
  const moveSpeed = state.speed * slowFactor;

  state.spawnTimer -= dt; state.coinTimer -= dt; state.powerTimer -= dt;
  state.comboTimer -= dt; state.invincible -= dt; state.shield -= dt; state.magnet -= dt; state.slow -= dt;
  if (state.comboTimer <= 0) state.combo = 1;

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
    if (got && !c.hit) { c.hit = true; state.coins++; state.combo = Math.min(8, state.combo + 1); state.comboTimer = 3.2; state.score += 10 * state.combo; addParticles(c.x, c.y, 12, '#ffd166'); sound(760, 0.045); }
  });

  state.powers.forEach(function (p) {
    p.y += (moveSpeed + 20) * dt; p.pulse += dt * 7;
    const got = Math.abs(state.player.x - p.x) < 44 && Math.abs(state.player.y - state.jump - p.y) < 54;
    if (got && !p.hit) {
      p.hit = true; state.score += 60; addParticles(p.x, p.y, 20, '#2ec4ff'); sound(900, 0.07);
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

  if (state.coins >= state.missionCoins) { state.score += 160; state.missionCoins += 25; msg('Gorev tamam'); addParticles(W / 2, 155, 34, '#ffd166'); }
  if (state.timeLeft <= 0) endGame('time');
}

function drawTorch(x, y, scale, tint) {
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
  ctx.fillStyle = '#3a1c0a'; rr(-7, 8, 14, 50, 4); ctx.fill();
  ctx.fillStyle = tint; ctx.shadowColor = tint; ctx.shadowBlur = 18;
  ctx.beginPath(); ctx.moveTo(0, -22); ctx.bezierCurveTo(18, -3, 8, 18, 0, 27); ctx.bezierCurveTo(-15, 10, -8, -7, 0, -22); ctx.fill();
  ctx.fillStyle = '#fff1a8'; ctx.beginPath(); ctx.moveTo(0, -10); ctx.bezierCurveTo(7, 2, 4, 13, 0, 18); ctx.bezierCurveTo(-6, 6, -4, -2, 0, -10); ctx.fill();
  ctx.restore(); ctx.shadowBlur = 0;
}

function drawStatue(x, y, side, tint) {
  ctx.save(); ctx.translate(x, y); ctx.scale(side, 1);
  ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fillRect(-27, 94, 54, 12);
  ctx.fillStyle = '#6f5539'; rr(-20, 24, 40, 75, 10); ctx.fill();
  ctx.fillStyle = tint; ctx.globalAlpha = .8; rr(-15, 38, 30, 22, 8); ctx.fill(); ctx.globalAlpha = 1;
  ctx.fillStyle = '#4e3925'; ctx.beginPath(); ctx.moveTo(-16, 25); ctx.lineTo(-2, -8); ctx.lineTo(18, 24); ctx.lineTo(7, 34); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#21140b'; ctx.beginPath(); ctx.arc(3, 17, 3, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#8b6b42'; ctx.fillRect(-23, 97, 46, 11);
  ctx.restore();
}

function drawHieroglyphs(x, y, alpha) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = '#c9a45d'; ctx.lineWidth = 2;
  for (let i = 0; i < 7; i++) {
    const yy = y + i * 23;
    ctx.beginPath(); ctx.arc(x, yy, 6, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 16, yy - 6); ctx.lineTo(x + 28, yy + 6); ctx.lineTo(x + 40, yy - 6); ctx.stroke();
    ctx.strokeRect(x + 52, yy - 7, 12, 14);
  }
  ctx.restore();
}

function drawTemple() {
  const c = chambers[(state.floor - 1) % chambers.length];
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, c.top); g.addColorStop(.42, c.mid); g.addColorStop(1, '#070302');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

  const t = state.elapsed * state.speed * .22;
  ctx.fillStyle = 'rgba(0,0,0,.32)';
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(W * .18, 0); ctx.lineTo(W * .06, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(W, 0); ctx.lineTo(W * .82, 0); ctx.lineTo(W * .94, H); ctx.lineTo(W, H); ctx.closePath(); ctx.fill();

  ctx.strokeStyle = 'rgba(255,235,180,.12)'; ctx.lineWidth = 2;
  for (let i = 0; i < 13; i++) {
    const y = (t * 1.4 + i * 68) % (H + 90) - 60;
    ctx.beginPath(); ctx.moveTo(W * .11, y); ctx.lineTo(W * .89, y); ctx.stroke();
  }
  for (let i = 0; i < 18; i++) {
    const y = (t * 1.1 + i * 54) % (H + 90) - 70;
    ctx.fillStyle = i % 2 ? 'rgba(255,209,102,.10)' : 'rgba(255,255,255,.05)';
    ctx.fillRect(20, y, 43, 22); ctx.fillRect(W - 63, y + 22, 43, 22);
  }

  ctx.fillStyle = c.floor;
  ctx.beginPath(); ctx.moveTo(W * .28, 0); ctx.lineTo(W * .72, 0); ctx.lineTo(W * .94, H); ctx.lineTo(W * .06, H); ctx.closePath(); ctx.fill();
  lanes.forEach(function (x) { ctx.strokeStyle = 'rgba(255,236,190,.17)'; ctx.setLineDash([12, 18]); ctx.beginPath(); ctx.moveTo(W / 2 + (x - W / 2) * .35, 0); ctx.lineTo(x, H); ctx.stroke(); ctx.setLineDash([]); });

  const farPulse = Math.sin(state.elapsed * 2) * 5;
  ctx.fillStyle = 'rgba(255,209,102,.10)'; rr(W * .37, 40 + farPulse, W * .26, 90, 18); ctx.fill();
  ctx.strokeStyle = c.accent; ctx.globalAlpha = .38; ctx.lineWidth = 3; ctx.stroke(); ctx.globalAlpha = 1;

  for (let i = 0; i < 4; i++) {
    const y = (t * 1.65 + i * 210) % (H + 230) - 120;
    drawStatue(53, y, 1, c.accent); drawStatue(W - 53, y + 95, -1, c.accent);
    drawTorch(96, y + 55, .55, c.accent); drawTorch(W - 96, y + 150, .55, c.accent);
  }
  drawHieroglyphs(22, 84 - (t % 46), .28);
  drawHieroglyphs(W - 86, 110 - (t % 46), .28);

  const glow = ctx.createRadialGradient(W / 2, H * .48, 20, W / 2, H * .5, H * .58);
  glow.addColorStop(0, 'rgba(255,209,102,.10)'); glow.addColorStop(1, 'rgba(0,0,0,.18)');
  ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
}

function drawHero() {
  const p = state.player;
  const y = p.y - state.jump;
  const run = Math.sin(state.elapsed * 13);
  ctx.save(); ctx.translate(p.x, y);
  ctx.fillStyle = 'rgba(0,0,0,.34)'; ctx.beginPath(); ctx.ellipse(0, 39 + state.jump * .25, 34, 10, 0, 0, Math.PI * 2); ctx.fill();

  if (state.shield > 0) { ctx.strokeStyle = 'rgba(46,196,255,.9)'; ctx.lineWidth = 4; ctx.shadowColor = '#2ec4ff'; ctx.shadowBlur = 18; ctx.beginPath(); ctx.arc(0, 0, 39 + Math.sin(state.elapsed * 9) * 3, 0, Math.PI * 2); ctx.stroke(); ctx.shadowBlur = 0; }
  ctx.globalAlpha = state.invincible > 0 && Math.floor(state.elapsed * 16) % 2 ? .48 : 1;

  ctx.strokeStyle = '#33200f'; ctx.lineWidth = 8; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-12, 16); ctx.lineTo(-20, 35 + run * 6); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(12, 16); ctx.lineTo(20, 35 - run * 6); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-16, -2); ctx.lineTo(-28, 14 - run * 5); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(16, -2); ctx.lineTo(28, 14 + run * 5); ctx.stroke();

  ctx.fillStyle = '#bf6f2f'; rr(-19, -2, 38, 38, 10); ctx.fill();
  ctx.fillStyle = '#ffd166'; rr(-23, 6, 46, 9, 4); ctx.fill();
  ctx.fillStyle = '#2d1a0d'; rr(-12, 14, 24, 21, 5); ctx.fill();
  ctx.fillStyle = '#2ec4ff'; ctx.beginPath(); ctx.moveTo(18, -4); ctx.quadraticCurveTo(42 + run * 4, 4, 30, 20); ctx.lineTo(15, 10); ctx.closePath(); ctx.fill();

  ctx.fillStyle = '#f3ba6b'; ctx.beginPath(); ctx.arc(0, -24, 18, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#2b1609'; ctx.beginPath(); ctx.arc(0, -35, 18, Math.PI, Math.PI * 2); ctx.fill(); rr(-19, -43, 38, 11, 5); ctx.fill();
  ctx.fillStyle = '#101010'; ctx.fillRect(-8, -28, 4, 5); ctx.fillRect(7, -28, 4, 5);
  ctx.strokeStyle = '#6b3418'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(1, -20, 7, .2, Math.PI - .2); ctx.stroke();
  ctx.fillStyle = '#8b4b22'; rr(-18, -11, 36, 7, 4); ctx.fill();
  ctx.fillStyle = '#f0c15d'; ctx.beginPath(); ctx.moveTo(-4, -48); ctx.lineTo(5, -65); ctx.lineTo(13, -48); ctx.closePath(); ctx.fill();
  ctx.restore();
}

function drawObstacle(o) {
  ctx.save(); ctx.translate(o.x, o.y);
  if (o.type === 'laser') { ctx.fillStyle = '#ef476f'; ctx.shadowColor = '#ef476f'; ctx.shadowBlur = 18; rr(-44, -9, 88, 18, 9); ctx.fill(); ctx.fillStyle = '#fff'; rr(-34, -2, 68, 4, 2); ctx.fill(); }
  else if (o.type === 'blade') { ctx.rotate(o.spin); ctx.fillStyle = '#c9b28a'; for (let i = 0; i < 4; i++) { ctx.rotate(Math.PI / 2); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(10, -40); ctx.lineTo(-10, -40); ctx.closePath(); ctx.fill(); } ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); ctx.fill(); }
  else if (o.type === 'scarab') { ctx.fillStyle = '#1c8f80'; ctx.shadowColor = '#2ec4ff'; ctx.shadowBlur = 10; ctx.beginPath(); ctx.ellipse(0, 0, 25, 18, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#0a3d3a'; ctx.fillRect(-3, -18, 6, 36); ctx.strokeStyle = '#0a3d3a'; ctx.lineWidth = 3; for (let i = -1; i <= 1; i += 2) { ctx.beginPath(); ctx.moveTo(i * 14, -6); ctx.lineTo(i * 31, -18); ctx.stroke(); ctx.beginPath(); ctx.moveTo(i * 14, 6); ctx.lineTo(i * 31, 20); ctx.stroke(); } }
  else if (o.type === 'spike') { ctx.fillStyle = '#8d6e4b'; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(i * 18, -25); ctx.lineTo(i * 18 - 17, 25); ctx.lineTo(i * 18 + 17, 25); ctx.closePath(); ctx.fill(); } ctx.fillStyle = '#d6b06a'; ctx.fillRect(-45, 22, 90, 10); }
  else { ctx.fillStyle = '#7d5632'; rr(-29, -26, 58, 52, 12); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,.22)'; rr(-14, -9, 28, 10, 3); ctx.fill(); ctx.strokeStyle = '#a57c4b'; ctx.strokeRect(-20, -17, 40, 34); }
  ctx.shadowBlur = 0; ctx.restore();
}

function drawCoin(c) { ctx.save(); ctx.translate(c.x, c.y); const s = 1 + Math.sin(c.pulse) * .1; ctx.scale(s, s); ctx.fillStyle = '#ffd166'; ctx.shadowColor = '#ffd166'; ctx.shadowBlur = 14; ctx.beginPath(); ctx.arc(0, 0, c.r, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#8f5d0d'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, c.r - 4, 0, Math.PI * 2); ctx.stroke(); ctx.fillStyle = '#8f5d0d'; ctx.fillRect(-2, -8, 4, 16); ctx.restore(); }
function drawPower(p) { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.sin(p.pulse) * .15); ctx.fillStyle = p.type === 'shield' ? '#2ec4ff' : p.type === 'magnet' ? '#95f985' : '#b197fc'; ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 18; rr(-19, -19, 38, 38, 11); ctx.fill(); ctx.fillStyle = '#061018'; ctx.font = 'bold 20px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(p.type === 'shield' ? 'S' : p.type === 'magnet' ? 'M' : 'T', 0, 1); ctx.restore(); }
function drawParticles() { state.particles.forEach(function (p) { ctx.globalAlpha = Math.max(0, p.life * 2); ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, 3.2, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }); }

function render() {
  ctx.save();
  if (state.shake > 0) ctx.translate((Math.random() - .5) * state.shake, (Math.random() - .5) * state.shake);
  drawTemple();
  state.coinsOnMap.forEach(drawCoin);
  state.powers.forEach(drawPower);
  state.obstacles.forEach(drawObstacle);
  drawParticles();
  drawHero();
  if (state.slow > 0) { ctx.fillStyle = 'rgba(46,196,255,.08)'; ctx.fillRect(0, 0, W, H); }
  const vignette = ctx.createRadialGradient(W / 2, H / 2, 120, W / 2, H / 2, H * .72);
  vignette.addColorStop(0, 'rgba(0,0,0,0)'); vignette.addColorStop(1, 'rgba(0,0,0,.42)');
  ctx.fillStyle = vignette; ctx.fillRect(0, 0, W, H);
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
  state.last = now;
  update(dt);
  render();
  syncHud();
  rafId = requestAnimationFrame(loop);
}

resetState(); render(); syncHud();