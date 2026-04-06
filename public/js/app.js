/**
 * DialIn — Main App Controller
 */

const DialIn = {
  currentPage: 'home',
  lastDifficulty: 'medium',

  init() {
    // Initialize i18n
    i18n.init();

    // Matrix rain background
    this._initMatrixRain();

    // Update stats
    updateNavStats();

    // Bind dial-in button
    document.getElementById('btn-dial-in').addEventListener('click', () => {
      audio.init();
      game.submitGuess();
    });

    // Bind all language toggle buttons
    document.querySelectorAll('.lang-switch').forEach(btn => {
      btn.addEventListener('click', () => {
        audio.init();
        i18n.toggle();
        updateNavStats();
        this._updateGameLabels();
      });
    });

    // Handle hash routing
    window.addEventListener('hashchange', () => this._route());

    // Initial route
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
      this._startFreeDial();
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

  _startFreeDial() {
    const data = loadPlayerData();
    const history = data.gameHistory || [];
    const difficulty = recommendDifficulty(history);
    this.lastDifficulty = difficulty;
    game.start('free', difficulty);
    this._updateGameLabels();
  },

  _updateGameLabels() {
    // Update game mode label
    const modeLabel = document.getElementById('game-mode-label');
    if (modeLabel) {
      const modeMap = { free: 'gameFree', daily: 'gameDaily', duel: 'gameDuel' };
      modeLabel.textContent = i18n.t(modeMap[game.mode] || 'gameFree');
    }
    // Update Dial In button
    const dialBtn = document.getElementById('btn-dial-in');
    if (dialBtn) dialBtn.textContent = i18n.t('btnDialIn');
    // Update preview label
    const previewLabel = document.querySelector('.preview-label');
    if (previewLabel) previewLabel.textContent = i18n.t('labelYourSelection');
    // Update round label
    const roundLabel = document.getElementById('game-round');
    if (roundLabel && game.colors.length > 0) {
      roundLabel.textContent = i18n.t('gameRound', { current: game.currentRound + 1, total: game.colors.length });
    }
  },

  _renderDailyPage() {
    const dateStr = getDailyDate();
    const theme = getDailyTheme();
    document.getElementById('daily-date').textContent = dateStr;
    document.getElementById('daily-theme').textContent = theme.name;

    const data = loadPlayerData();
    const btn = document.getElementById('btn-daily-play');
    if (hasPlayedDaily()) {
      btn.textContent = i18n.t('dailyPlayed', { score: (data.lastDailyScore || 0).toFixed(1) });
      btn.disabled = true;
      btn.style.opacity = '0.5';
    } else {
      btn.textContent = i18n.t('dailyPlay');
      btn.disabled = false;
      btn.style.opacity = '1';
    }
  },

  playAgain() {
    if (game.mode === 'daily') {
      this.showToast(i18n.t('toastAlreadyPlayed'));
      return;
    }
    game.start('free', this.lastDifficulty);
    this._updateGameLabels();
  },

  shareResult() {
    const results = game.getResults();
    if (!results) return;
    shareResult(results);
  },

  showToast(msg) {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
      background: var(--bg-card); border: 1px solid var(--neon-cyan);
      color: var(--neon-cyan); padding: 10px 24px; border-radius: 4px;
      font-family: var(--font-body); font-size: 14px; z-index: 10000;
      box-shadow: 0 0 15px var(--neon-cyan-dim);
      animation: fadeIn 0.3s ease-out;
    `;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'fadeOut 0.3s ease-out forwards';
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  },

  _initMatrixRain() {
    const canvas = document.getElementById('matrix-bg');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const chars = '0123456789ABCDEF'.split('');
    const fontSize = 14;
    let columns = Math.floor(canvas.width / fontSize);
    let drops = Array(columns).fill(1);
    const colors = ['#00F0FF', '#A855F7', '#FF0066', '#00FF88', '#FFE500'];

    function draw() {
      ctx.fillStyle = 'rgba(10, 10, 15, 0.08)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = fontSize + 'px monospace';
      for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
        ctx.globalAlpha = 0.4 + Math.random() * 0.6;
        ctx.fillText(char, i * fontSize, drops[i] * fontSize);
        ctx.globalAlpha = 1;
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
    }
    setInterval(draw, 50);
    window.addEventListener('resize', () => {
      columns = Math.floor(canvas.width / fontSize);
      drops = Array(columns).fill(1);
    });
  }
};

// ===== Helpers =====

function updateNavStats() {
  const rating = getPlayerRating();
  const rank = getRank(rating);
  const streak = getPlayerStreak();

  document.getElementById('rank-badge').textContent = `${rank.icon} ${rank.tier} ${rank.division}`;
  document.getElementById('rating-display').textContent = rating;

  const homeRank = document.getElementById('home-rank');
  const homeRating = document.getElementById('home-rating');
  const homeBar = document.getElementById('home-rating-bar');
  const homeStreak = document.getElementById('home-streak');

  if (homeRank) homeRank.textContent = `${rank.icon} ${rank.tier} ${rank.division}`;
  if (homeRating) homeRating.textContent = `${rating} / ${rank.nextRating}`;
  if (homeBar) homeBar.style.width = (rank.progress * 100) + '%';
  if (homeStreak) {
    homeStreak.textContent = streak > 0
      ? i18n.t('streakDay', { n: streak })
      : i18n.t('streakNone');
  }
}

function recommendDifficulty(history) {
  if (history.length === 0) return 'easy';
  const recent = history.slice(-5);
  const avg = recent.reduce((s, g) => s + g.scorePercent, 0) / recent.length;
  const levels = ['tutorial', 'easy', 'medium', 'hard', 'expert'];
  const current = levels.indexOf(recent[recent.length - 1].difficulty);
  if (avg >= 0.75 && current < levels.length - 1) return levels[current + 1];
  if (avg < 0.35 && current > 0) return levels[current - 1];
  return recent[recent.length - 1].difficulty;
}

// ===== Boot =====
document.addEventListener('DOMContentLoaded', () => {
  DialIn.init();
});
