const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const coinsEl = document.getElementById('coins');
const timeEl = document.getElementById('time');
const bestEl = document.getElementById('best');
const missionText = document.getElementById('missionText');
const comboText = document.getElementById('comboText');
const factText = document.getElementById('factText');
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
const lanes = [W * 0.22, W * 0.5, W * 0.78];
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
    speed: 250,
    spawnTimer: 0,
    coinTimer: 0,
    laneIndex: 1,
    targetX: lanes[1],
    player: { x: lanes[1], y: H - 105, w: 42, h: 54 },
    obstacles: [],
    coinsOnMap: [],
    particles: [],
    last: 0,
    missionCoins: 20
  };
}

function startGame() {
  resetState();
  state.running = true;
  startPanel.classList.remove('active');
  gameOverPanel.classList.remove('active');
  factText.textContent = facts[Math.floor(Math.random() * facts.length)];
  cancelAnimationFrame(rafId);
  state.last = performance.now();
  rafId = requestAnimationFrame(loop);
}

function endGame(reason) {
  state.running = false;
  cancelAnimationFrame(rafId);
  if (state.score > best) {
    best = state.score;
    localStorage.setItem('hazineKacisiBest', String(best));
    resultBadge.textContent = 'Yeni rekor';
    resultTitle.textContent = 'Harika kacis';
    resultText.textContent = 'Yeni rekor kirdin. Simdi bunu daha da yukselt.';
  } else if (reason === 'time') {
    resultBadge.textContent = '60 saniye tamamlandi';
    resultTitle.textContent = 'Hazineden ciktin';
    resultText.textContent = 'Sureyi bitirdin. Daha fazla altinla rekoru gecebilirsin.';
  } else {
    resultBadge.textContent = 'Tuzak yakaladi';
    resultTitle.textContent = 'Bir tur daha';
    resultText.textContent = 'Skorunu gecmek icin tekrar dene.';
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

window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') moveLane(-1);
  if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') moveLane(1);
  if ((e.key === 'Enter' || e.key === ' ') && (!state || !state.running)) startGame();
});

let touchStartX = 0;
canvas.addEventListener('touchstart', (e) => { touchStartX = e.changedTouches[0].clientX; }, { passive: true });
canvas.addEventListener('touchend', (e) => {
  const diff = e.changedTouches[0].clientX - touchStartX;
  if (Math.abs(diff) > 22) moveLane(diff > 0 ? 1 : -1);
}, { passive: true });
canvas.addEventListener('pointerdown', (e) => {
  if (!state.running) return;
  const rect = canvas.getBoundingClientRect();
  moveLane(e.clientX - rect.left < rect.width / 2 ? -1 : 1);
});

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);
soundBtn.addEventListener('click', () => {
  muted = !muted;
  soundBtn.textContent = muted ? '🔇' : '🔊';
});

function spawnObstacle() {
  const lane = Math.floor(Math.random() * 3);
  const types = ['rock', 'spike', 'guardian'];
  state.obstacles.push({ lane, x: lanes[lane], y: -70, w: 52, h: 46, type: types[Math.floor(Math.random() * types.length)], passed: false });
}

function spawnCoin() {
  const lane = Math.floor(Math.random() * 3);
  state.coinsOnMap.push({ lane, x: lanes[lane], y: -40, r: 13, pulse: Math.random() * 10 });
}

function addParticles(x, y, count, color) {
  for (let i = 0; i < count; i++) {
    state.particles.push({ x, y, vx: (Math.random() - 0.5) * 130, vy: (Math.random() - 0.5) * 130, life: 0.45, color });
  }
}

function hitPlayer(a, b) {
  return Math.abs(a.x - b.x) < (a.w + b.w) * 0.42 && Math.abs(a.y - b.y) < (a.h + b.h) * 0.42;
}

function update(dt) {
  state.elapsed += dt;
  state.timeLeft = Math.max(0, 60 - state.elapsed);
  state.speed = 250 + Math.floor(state.elapsed / 10) * 45;
  state.spawnTimer -= dt;
  state.coinTimer -= dt;
  state.comboTimer -= dt;
  if (state.comboTimer <= 0) state.combo = 1;
  state.player.x += (state.targetX - state.player.x) * Math.min(1, dt * 14);

  if (state.spawnTimer <= 0) {
    spawnObstacle();
    state.spawnTimer = Math.max(0.55, 1.12 - state.elapsed * 0.008) + Math.random() * 0.32;
  }
  if (state.coinTimer <= 0) {
    spawnCoin();
    state.coinTimer = 0.42 + Math.random() * 0.35;
  }

  state.obstacles.forEach(o => {
    o.y += state.speed * dt;
    if (!o.passed && o.y > state.player.y + 45) {
      o.passed = true;
      state.score += 3;
    }
    if (hitPlayer(state.player, o)) endGame('hit');
  });

  state.coinsOnMap.forEach(c => {
    c.y += (state.speed + 25) * dt;
    c.pulse += dt * 8;
    const got = Math.abs(state.player.x - c.x) < 38 && Math.abs(state.player.y - c.y) < 46;
    if (got && !c.hit) {
      c.hit = true;
      state.coins += 1;
      state.score += 10 * state.combo;
      state.combo = Math.min(5, state.combo + 1);
      state.comboTimer = 3;
      addParticles(c.x, c.y, 8, '#ffc857');
    }
  });

  state.obstacles = state.obstacles.filter(o => o.y < H + 90);
  state.coinsOnMap = state.coinsOnMap.filter(c => !c.hit && c.y < H + 60);
  state.particles.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; p.vy += 150 * dt; });
  state.particles = state.particles.filter(p => p.life > 0);

  if (state.coins >= state.missionCoins) {
    state.score += 100;
    state.missionCoins += 20;
    addParticles(W / 2, 150, 28, '#ffc857');
  }
  missionText.textContent = `Gorev: ${state.missionCoins} altin topla`;
  if (state.timeLeft <= 0 && state.running) endGame('time');
}

function drawBackground() {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#4b2b12');
  g.addColorStop(0.5, '#2b190a');
  g.addColorStop(1, '#120d07');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(255,200,87,.12)';
  for (let i = 0; i < 9; i++) {
    const y = ((state.elapsed || 0) * state.speed * 0.35 + i * 96) % (H + 120) - 80;
    ctx.fillRect(W * 0.18, y, W * 0.64, 6);
  }
  ctx.fillStyle = 'rgba(0,0,0,.24)';
  ctx.fillRect(0, 0, W * 0.12, H);
  ctx.fillRect(W * 0.88, 0, W * 0.12, H);
  lanes.forEach(x => {
    ctx.strokeStyle = 'rgba(245,215,161,.15)';
    ctx.lineWidth = 2;
    ctx.setLineDash([14, 22]);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
    ctx.setLineDash([]);
  });
}

function drawPlayer() {
  const p = state.player;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.fillStyle = 'rgba(0,0,0,.28)';
  ctx.beginPath(); ctx.ellipse(0, 33, 28, 9, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f4c76f';
  ctx.beginPath(); ctx.arc(0, -14, 18, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#222'; ctx.fillRect(-9, -18, 5, 5); ctx.fillRect(5, -18, 5, 5);
  ctx.fillStyle = '#2f1a0a'; ctx.fillRect(-11, -35, 22, 10);
  ctx.fillStyle = '#3b2a17'; ctx.fillRect(-16, 3, 32, 34);
  ctx.fillStyle = '#ffc857'; ctx.fillRect(-18, 8, 36, 7);
  ctx.restore();
}

function drawObstacle(o) {
  ctx.save();
  ctx.translate(o.x, o.y);
  if (o.type === 'guardian') {
    ctx.fillStyle = '#d9c8a1'; ctx.fillRect(-20, -28, 40, 56);
    ctx.strokeStyle = '#8f7d61';
    for (let y = -20; y < 25; y += 9) { ctx.beginPath(); ctx.moveTo(-20, y); ctx.lineTo(20, y + 5); ctx.stroke(); }
    ctx.fillStyle = '#15100a'; ctx.fillRect(-9, -12, 18, 5);
  } else if (o.type === 'spike') {
    ctx.fillStyle = '#8d6e4b';
    for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(i * 17, -24); ctx.lineTo(i * 17 - 15, 22); ctx.lineTo(i * 17 + 15, 22); ctx.closePath(); ctx.fill(); }
  } else {
    ctx.fillStyle = '#7d5632'; ctx.beginPath(); ctx.roundRect(-26, -22, 52, 44, 12); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(-12, -8, 24, 7);
  }
  ctx.restore();
}

function drawCoin(c) {
  ctx.save();
  ctx.translate(c.x, c.y);
  const s = 1 + Math.sin(c.pulse) * 0.08;
  ctx.scale(s, s);
  ctx.fillStyle = '#ffc857'; ctx.beginPath(); ctx.arc(0, 0, c.r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#8f5d0d'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, c.r - 4, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}

function drawParticles() {
  state.particles.forEach(p => {
    ctx.globalAlpha = Math.max(0, p.life * 2.2);
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  });
}

function render() {
  drawBackground();
  state.coinsOnMap.forEach(drawCoin);
  state.obstacles.forEach(drawObstacle);
  drawParticles();
  drawPlayer();
}

function syncHud() {
  scoreEl.textContent = state.score;
  coinsEl.textContent = state.coins;
  timeEl.textContent = Math.ceil(state.timeLeft);
  comboText.textContent = `Kombo x${state.combo}`;
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

resetState();
render();
syncHud();
