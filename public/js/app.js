/**
 * DialIn — App Controller v3
 */
const DialIn = {
  init() {
    i18n.init();
    this._initMatrixRain();
    updateNavStats();

    document.getElementById('btn-confirm').addEventListener('click', () => { audio.init(); game.submitGuess(); });
    document.getElementById('btn-next').addEventListener('click', () => { audio.init(); game.nextRound(); });
    document.querySelectorAll('.lang-switch').forEach(b => b.addEventListener('click', () => { audio.init(); i18n.toggle(); updateNavStats(); }));

    window.addEventListener('hashchange', () => this._route());
    this._route();
  },

  navigate(path) { audio.init(); window.location.hash = path; },

  _route() {
    const path = (window.location.hash || '#/').replace('#','');
    if (path === '/' || path === '') this._showPage('home');
    else if (path === '/free') { this._showPage('game'); game.start('free', getPlayerLevel()); }
    else if (path === '/daily') { this._showPage('daily'); this._renderDaily(); }
    else if (path === '/duel') this._showPage('duel');
    else this._showPage('home');
  },

  _showPage(page) {
    const c = document.getElementById('app');
    c.classList.add('page-transition');
    setTimeout(() => c.classList.remove('page-transition'), 300);
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${page}`)?.classList.add('active');
  },

  startDaily() {
    if (hasPlayedDaily()) { this.showToast(i18n.t('alreadyPlayed')); return; }
    this._showPage('game');
    game.start('daily', 3);
  },

  _renderDaily() {
    document.getElementById('daily-date').textContent = getDailyDate();
    document.getElementById('daily-theme').textContent = getDailyTheme().name;
    const btn = document.getElementById('btn-daily-play');
    const resultDiv = document.getElementById('daily-result');
    if (hasPlayedDaily()) {
      const data = loadPlayerData();
      btn.textContent = i18n.t('dailyPlayed', { score: (data.lastDailyScore||0).toFixed(1) });
      btn.disabled = true; btn.style.opacity = '0.4';
      resultDiv.classList.remove('hidden');
      resultDiv.innerHTML = `<div style="text-align:center;padding:8px;color:var(--neon-cyan)">${i18n.t('dailyScore')}: ${data.lastDailyScore?.toFixed(1) || '0'} / 50</div>`;
    } else {
      btn.textContent = i18n.t('dailyPlay');
      btn.disabled = false; btn.style.opacity = '1';
      resultDiv.classList.add('hidden');
    }
  },

  playAgain() {
    if (game.mode === 'daily') { this.showToast(i18n.t('alreadyPlayed')); return; }
    game.start('free', getPlayerLevel());
  },

  shareResult() { const r = game.getResults(); if (r) shareResult(r); },

  showToast(msg) {
    const t = document.createElement('div');
    t.className = 'toast'; t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => { t.style.animation = 'fadeOut 0.3s ease-out forwards'; setTimeout(() => t.remove(), 300); }, 2000);
  },

  _initMatrixRain() {
    const canvas = document.getElementById('matrix-bg');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize(); window.addEventListener('resize', resize);
    const chars = '0123456789ABCDEF'.split(''), fs = 14;
    let cols = Math.floor(canvas.width/fs), drops = Array(cols).fill(1);
    const colors = ['#00F0FF','#A855F7','#FF0066','#00FF88','#FFE500'];
    function draw() {
      ctx.fillStyle = 'rgba(10,10,15,0.08)'; ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.font = fs+'px monospace';
      for (let i=0;i<drops.length;i++) {
        ctx.fillStyle = colors[Math.floor(Math.random()*colors.length)];
        ctx.globalAlpha = 0.4+Math.random()*0.6;
        ctx.fillText(chars[Math.floor(Math.random()*chars.length)], i*fs, drops[i]*fs);
        ctx.globalAlpha = 1;
        if (drops[i]*fs > canvas.height && Math.random()>0.975) drops[i]=0;
        drops[i]++;
      }
    }
    setInterval(draw, 50);
    window.addEventListener('resize', () => { cols = Math.floor(canvas.width/fs); drops = Array(cols).fill(1); });
  }
};

function updateNavStats() {
  const level = getPlayerLevel();
  const cfg = getLevelConfig(level);
  const progress = getLevelProgress();
  const streak = getPlayerStreak();
  document.getElementById('nav-level').textContent = `Level ${level}`;
  const info = document.getElementById('home-level-info');
  const bar = document.getElementById('home-level-bar');
  const next = document.getElementById('home-level-next');
  const streakEl = document.getElementById('home-streak');
  if (info) info.textContent = getLevelDescription(level);
  if (bar) bar.style.width = (progress * 100) + '%';
  if (next) next.textContent = level < 5 ? `Next: ${getLevelUpDescription(level+1)}` : '🏆 Max Level';
  if (streakEl) streakEl.textContent = streak > 0 ? i18n.t('streakDay',{n:streak}) : '';
}

document.addEventListener('DOMContentLoaded', () => DialIn.init());
