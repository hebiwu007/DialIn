/**
 * DialIn — Main App Controller
 */

const DialIn = {
  currentPage: 'home',
  lastDifficulty: 'medium',

  init() {
    // Matrix rain background
    this._initMatrixRain();
    
    // Update stats
    updateNavStats();
    
    // Bind dial-in button
    document.getElementById('btn-dial-in').addEventListener('click', () => {
      audio.init();
      game.submitGuess();
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
      }
    } else if (path === '/duel') {
      // TODO: Duel mode
      this._showPage('home');
      this.showToast('⚔ Duel mode coming soon!');
    } else {
      this._showPage('home');
    }
  },

  _showPage(page) {
    // Glitch transition
    const container = document.getElementById('page-container');
    container.classList.add('page-transition');
    setTimeout(() => container.classList.remove('page-transition'), 300);
    
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${page}`).classList.add('active');
    this.currentPage = page;
  },

  _startFreeDial() {
    // Recommend difficulty
    const data = loadPlayerData();
    const history = data.gameHistory || [];
    const difficulty = recommendDifficulty(history);
    this.lastDifficulty = difficulty;
    game.start('free', difficulty);
  },

  _renderDailyPage() {
    const dateStr = getDailyDate();
    const theme = getDailyTheme();
    document.getElementById('daily-date').textContent = dateStr;
    document.getElementById('daily-theme').textContent = theme.name;
    
    // Show played state
    const data = loadPlayerData();
    const btn = document.getElementById('btn-daily-play');
    btn.textContent = `✓ PLAYED — ${data.lastDailyScore?.toFixed(1) || '0'}/50`;
    btn.disabled = true;
    btn.style.opacity = '0.5';
  },

  playAgain() {
    if (game.mode === 'daily') {
      this.showToast('✓ Already played today!');
      return;
    }
    game.start('free', this.lastDifficulty);
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

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    }

    setInterval(draw, 50);

    // Re-init on resize
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
  if (homeStreak) homeStreak.textContent = streak > 0 ? `Day ${streak} 🔥` : '—';
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
