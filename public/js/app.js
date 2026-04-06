/**
 * DialIn — App Controller v2
 */

const DialIn = {
  currentPage: 'home',
  lastDifficulty: 'medium',

  init() {
    i18n.init();
    this._initMatrixRain();
    updateNavStats();

    // Submit guess
    document.getElementById('btn-dial-in').addEventListener('click', () => {
      audio.init();
      game.submitGuess();
    });

    // Next round
    document.getElementById('btn-next-round').addEventListener('click', () => {
      audio.init();
      game.nextRound();
    });

    // Language toggles
    document.querySelectorAll('.lang-switch').forEach(btn => {
      btn.addEventListener('click', () => {
        audio.init();
        i18n.toggle();
        updateNavStats();
        this._updateGameLabels();
      });
    });

    window.addEventListener('hashchange', () => this._route());
    this._route();
  },

  navigate(path) {
    audio.init();
    window.location.hash = path;
  },

  _route() {
    const hash = window.location.hash || '#/';
    const path = hash.replace('#', '');
    if (path === '/' || path === '') {
      this._showPage('home');
    } else if (path === '/free') {
      this._showPage('game');
      const data = loadPlayerData();
      const diff = recommendDifficulty(data.gameHistory || []);
      this.lastDifficulty = diff;
      game.start('free', diff);
      this._updateGameLabels();
    } else if (path === '/daily') {
      if (hasPlayedDaily()) {
        this._showPage('daily');
        this._renderDailyPage();
      } else {
        this._showPage('game');
        game.start('daily', 'medium');
        this._updateGameLabels();
      }
    } else if (path === '/duel') {
      this._showPage('home');
      this.showToast(i18n.t('toastDuelSoon'));
    } else {
      this._showPage('home');
    }
  },

  _showPage(page) {
    const container = document.getElementById('page-container');
    container.classList.add('page-transition');
    setTimeout(() => container.classList.remove('page-transition'), 300);
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${page}`).classList.add('active');
    this.currentPage = page;
  },

  _updateGameLabels() {
    const instrEl = document.getElementById('guess-instruction');
    if (instrEl && game.colors.length > 0) {
      instrEl.textContent = i18n.t('guessInstruction', { current: game.currentRound + 1, total: game.colors.length });
    }
  },

  _renderDailyPage() {
    document.getElementById('daily-date').textContent = getDailyDate();
    document.getElementById('daily-theme').textContent = getDailyTheme().name;
    const data = loadPlayerData();
    const btn = document.getElementById('btn-daily-play');
    if (hasPlayedDaily()) {
      btn.textContent = i18n.t('dailyPlayed', { score: (data.lastDailyScore || 0).toFixed(1) });
      btn.disabled = true; btn.style.opacity = '0.5';
    } else {
      btn.textContent = i18n.t('dailyPlay');
      btn.disabled = false; btn.style.opacity = '1';
    }
  },

  playAgain() {
    if (game.mode === 'daily') { this.showToast(i18n.t('toastAlreadyPlayed')); return; }
    game.start('free', this.lastDifficulty);
    this._updateGameLabels();
  },

  shareResult() {
    const r = game.getResults();
    if (r) shareResult(r);
  },

  showToast(msg) {
    const t = document.createElement('div');
    t.style.cssText = `position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:var(--bg-card);border:1px solid var(--neon-cyan);color:var(--neon-cyan);padding:10px 24px;border-radius:4px;font-family:var(--font-body);font-size:14px;z-index:10000;box-shadow:0 0 15px var(--neon-cyan-dim);animation:fadeIn 0.3s ease-out;`;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => { t.style.animation = 'fadeOut 0.3s ease-out forwards'; setTimeout(() => t.remove(), 300); }, 2000);
  },

  _initMatrixRain() {
    const canvas = document.getElementById('matrix-bg');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize(); window.addEventListener('resize', resize);
    const chars = '0123456789ABCDEF'.split('');
    const fontSize = 14;
    let columns = Math.floor(canvas.width / fontSize);
    let drops = Array(columns).fill(1);
    const colors = ['#00F0FF', '#A855F7', '#FF0066', '#00FF88', '#FFE500'];
    function draw() {
      ctx.fillStyle = 'rgba(10, 10, 15, 0.08)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = fontSize + 'px monospace';
      for (let i = 0; i < drops.length; i++) {
        ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
        ctx.globalAlpha = 0.4 + Math.random() * 0.6;
        ctx.fillText(chars[Math.floor(Math.random() * chars.length)], i * fontSize, drops[i] * fontSize);
        ctx.globalAlpha = 1;
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
    }
    setInterval(draw, 50);
    window.addEventListener('resize', () => { columns = Math.floor(canvas.width / fontSize); drops = Array(columns).fill(1); });
  }
};

function updateNavStats() {
  const rating = getPlayerRating();
  const rank = getRank(rating);
  const streak = getPlayerStreak();
  document.getElementById('rank-badge').textContent = `${rank.icon} ${rank.tier} ${rank.division}`;
  const hr = document.getElementById('home-rank');
  const hrt = document.getElementById('home-rating');
  const hb = document.getElementById('home-rating-bar');
  const hs = document.getElementById('home-streak');
  if (hr) hr.textContent = `${rank.icon} ${rank.tier} ${rank.division}`;
  if (hrt) hrt.textContent = `${rating} / ${rank.nextRating}`;
  if (hb) hb.style.width = (rank.progress * 100) + '%';
  if (hs) hs.textContent = streak > 0 ? i18n.t('streakDay', { n: streak }) : i18n.t('streakNone');
}

function recommendDifficulty(history) {
  if (history.length === 0) return 'easy';
  const recent = history.slice(-5);
  const avg = recent.reduce((s, g) => s + g.scorePercent, 0) / recent.length;
  const levels = ['tutorial', 'easy', 'medium', 'hard', 'expert'];
  const cur = levels.indexOf(recent[recent.length - 1].difficulty);
  if (avg >= 0.75 && cur < levels.length - 1) return levels[cur + 1];
  if (avg < 0.35 && cur > 0) return levels[cur - 1];
  return recent[recent.length - 1].difficulty;
}

document.addEventListener('DOMContentLoaded', () => DialIn.init());
