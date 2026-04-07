/**
 * DialIn — App Controller v3
 */
const DialIn = {
  currentDuelId: null,
  duelColors: null,

  init() {
    i18n.init();
    this._initMatrixRain();
    this._initNickname();
    this._initSoundToggle();
    this._initTheme();
    updateNavStats();

    document.getElementById('btn-confirm').addEventListener('click', () => { audio.init(); game.submitGuess(); });
    document.getElementById('btn-next').addEventListener('click', () => { audio.init(); game.nextRound(); });
    document.querySelectorAll('.lang-switch').forEach(b => b.addEventListener('click', () => { audio.init(); i18n.toggle(); updateNavStats(); }));

    window.addEventListener('hashchange', () => this._route());
    this._route();
  },

  navigate(path) { audio.init(); window.location.hash = path; },

  _route() {
    const hash = (window.location.hash || '#/').replace('#', '');
    const parts = hash.split('/').filter(Boolean);

    if (hash === '/' || hash === '') this._showPage('home');
    else if (hash === '/free') { this._showPage('game'); game.start('free', getPlayerLevel()); }
    else if (hash === '/daily') { this._showPage('daily'); this._renderDaily(); }
    else if (hash === '/duel' || hash === '/duel/') { this._showPage('duel'); this._showDuelHome(); }
    else if (parts[0] === 'duel' && parts[1]) {
      this._showPage('duel');
      this.currentDuelId = parts[1];
      this._showDuelAccept(parts[1]);
    }
    else this._showPage('home');
  },

  _showPage(page) {
    const c = document.getElementById('app');
    c.classList.add('page-transition');
    setTimeout(() => c.classList.remove('page-transition'), 300);
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${page}`)?.classList.add('active');
  },

  // ===== FREE =====
  playAgain() {
    if (game.mode === 'daily') { this.showToast(i18n.t('alreadyPlayed')); return; }
    game.start('free', getPlayerLevel());
  },

  // ===== DAILY =====
  startDaily() {
    if (hasPlayedDaily()) { this.showToast(i18n.t('alreadyPlayed')); return; }
    this._showPage('game');
    game.start('daily', 3);
  },

  async _renderDaily() {
    const date = getDailyDate();
    const theme = getDailyTheme();
    const lang = i18n.getLang();
    document.getElementById('daily-date').textContent = date;
    document.getElementById('daily-theme').textContent = lang === 'zh' ? theme.desc : theme.descEn;

    const btn = document.getElementById('btn-daily-play');
    const resultDiv = document.getElementById('daily-result');
    const lbDiv = document.getElementById('daily-leaderboard');

    const data = await fetchDailyLeaderboard(date);
    if (data && data.leaderboard && data.leaderboard.length > 0) {
      let html = `<div style="font-family:var(--font-display);font-size:12px;color:var(--neon-purple);letter-spacing:2px;text-align:center;margin-bottom:8px;">
        ${i18n.t('dailyLeaderboard')} · ${data.totalPlayers} ${i18n.t('dailyPlayers')}</div>`;
      data.leaderboard.slice(0, 10).forEach(e => {
        const medal = e.rank===1?'🥇':e.rank===2?'🥈':e.rank===3?'🥉':`${e.rank}.`;
        html += `<div style="display:flex;justify-content:space-between;padding:4px 8px;font-size:12px;">
          <span>${medal} ${e.nickname}</span><span class="mono" style="color:var(--neon-yellow)">${e.score.toFixed(1)}</span></div>`;
      });
      lbDiv.innerHTML = html;
    } else {
      lbDiv.innerHTML = `<div style="text-align:center;font-size:12px;color:var(--text-muted);padding:8px;">${i18n.t('dailyNoPlayers')}</div>`;
    }

    if (hasPlayedDaily()) {
      const pd = loadPlayerData();
      btn.textContent = i18n.t('dailyPlayed', { score: (pd.lastDailyScore||0).toFixed(1) });
      btn.disabled = true; btn.style.opacity = '0.4';
      resultDiv.classList.remove('hidden');
      resultDiv.innerHTML = `<div style="text-align:center;padding:8px;color:var(--neon-cyan)">
        ${i18n.t('dailyScore')}: ${pd.lastDailyScore?.toFixed(1) || '0'} / 50</div>`;
    } else {
      btn.textContent = i18n.t('dailyPlay');
      btn.disabled = false; btn.style.opacity = '1';
      resultDiv.classList.add('hidden');
    }
  },

  // ===== DUEL =====
  _showDuelHome() {
    document.querySelectorAll('.duel-section').forEach(s => s.classList.add('hidden'));
    document.getElementById('duel-home').classList.remove('hidden');
  },

  duelCreate() {
    audio.init();
    this.duelColors = generateDuelColors();
    this.currentDuelId = null;
    // Start game in duel mode
    this._showPage('game');
    game._startDuel(this.duelColors);
  },

  async duelCreateFinish(results) {
    const nick = this.getNickname() || 'Player';
    const data = await createDuel(
      nick,
      this.duelColors || game.colors,
      results.totalScore,
      results.rounds.map(r => ({ s: r.score.toFixed(1) })),
      results.personality.name
    );
    if (data && data.id) {
      this.currentDuelId = data.id;
      this._showPage('duel');
      document.querySelectorAll('.duel-section').forEach(s => s.classList.add('hidden'));
      document.getElementById('duel-created').classList.remove('hidden');
      document.getElementById('duel-created-score').innerHTML =
        `<div style="font-size:24px;color:var(--neon-cyan);font-family:var(--font-display);">${results.totalScore} / ${results.maxScore}</div>`;
      document.getElementById('duel-link-url').textContent = data.url;
      document.getElementById('duel-code-display').textContent = data.id.toUpperCase();
    }
  },

  duelCopyLink() {
    const url = document.getElementById('duel-link-url').textContent;
    const nick = this.getNickname() || 'Someone';
    const text = `🎨 DialIn — Color Duel!\n${nick} challenges you to a color memory duel!\nCan you beat their score? 🎯\n${url}`;
    copyToClipboard(text);
    this.showToast('📋 Copied! Share with friends!');
  },

  copyDuelCode() {
    const code = document.getElementById('duel-code-display')?.textContent || '';
    if (!code) return;
    const nick = this.getNickname() || 'Someone';
    const text = `🎨 DialIn — Color Duel!\n${nick} challenges you! Enter code: ${code}\nat https://dialin.cc`;
    copyToClipboard(code);
    this.showToast('📋 Code copied!');
  },

  async duelJoin() {
    const code = document.getElementById('duel-join-code').value.trim().toUpperCase();
    if (!code || code.length < 4) { this.showToast(i18n.t('duelInvalidCode')); return; }
    this.currentDuelId = code;
    this.navigate(`/duel/${code}`);
  },

  async _showDuelAccept(duelId) {
    const data = await fetchDuel(duelId);
    if (!data || data.error) {
      this.showToast(data?.error || 'Duel not found');
      this.navigate('/duel');
      return;
    }
    document.querySelectorAll('.duel-section').forEach(s => s.classList.add('hidden'));
    document.getElementById('duel-accept').classList.remove('hidden');
    document.getElementById('duel-accept-creator').textContent = data.leaderboard?.[0]?.nickname || 'Someone';

    // Show current leaderboard
    const lbDiv = document.getElementById('duel-accept-lb');
    if (data.leaderboard && data.leaderboard.length > 0) {
      let html = '<div style="font-size:12px;text-align:center;margin-bottom:6px;color:var(--text-secondary);">' +
        `${data.totalPlayers} ${i18n.t('dailyPlayers')} · ${i18n.t('duelTopScore')}: ${data.leaderboard[0].score.toFixed(1)}</div>`;
      data.leaderboard.slice(0, 5).forEach(e => {
        const medal = e.rank===1?'🥇':e.rank===2?'🥈':e.rank===3?'🥉':`${e.rank}.`;
        html += `<div style="display:flex;justify-content:space-between;padding:3px 8px;font-size:12px;">
          <span>${medal} ${e.nickname}</span><span class="mono" style="color:var(--neon-yellow)">${e.score.toFixed(1)}</span></div>`;
      });
      lbDiv.innerHTML = html;
    } else {
      lbDiv.innerHTML = '';
    }

    // Store colors for game
    this.duelColors = data.colors;

    // Pre-fill nickname
    const savedNick = this.getNickname();
    if (savedNick) document.getElementById('duel-accept-nick').value = savedNick;
  },

  async duelAccept() {
    const nick = document.getElementById('duel-accept-nick').value.trim();
    if (!nick) return;
    this.setNickname(nick);
    this._showPage('game');
    game._startDuel(this.duelColors);
  },

  async duelJoinFinish(results) {
    const nick = this.getNickname() || 'Player';
    const data = await joinDuel(
      this.currentDuelId,
      nick,
      results.totalScore,
      results.rounds.map(r => ({ s: r.score.toFixed(1) })),
      results.personality.name
    );
    if (data && data.leaderboard) {
      this._showPage('duel');
      document.querySelectorAll('.duel-section').forEach(s => s.classList.add('hidden'));
      document.getElementById('duel-result').classList.remove('hidden');
      this._renderDuelLeaderboard('duel-result-lb', data, nick);
    }
  },

  _renderDuelLeaderboard(containerId, data, myNick) {
    const container = document.getElementById(containerId);
    let html = `<div style="font-family:var(--font-display);font-size:13px;color:var(--neon-pink);letter-spacing:2px;text-align:center;margin-bottom:10px;">
      ⚔ ${i18n.t('duelLeaderboard')}</div>`;
    html += '<div style="display:flex;flex-direction:column;gap:4px;">';
    data.leaderboard.forEach(e => {
      const isMe = e.nickname === myNick;
      const medal = e.rank===1?'🥇':e.rank===2?'🥈':e.rank===3?'🥉':`${e.rank}.`;
      const bg = isMe ? 'background:rgba(255,0,102,0.08);border:1px solid var(--neon-pink);' : '';
      html += `<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;border-radius:4px;font-size:13px;${bg}">
        <span><span style="margin-right:6px;">${medal}</span><span style="color:${isMe?'var(--neon-pink)':'var(--text-primary)'}">${e.nickname}${e.isCreator?' 👑':''}</span></span>
        <span style="font-family:var(--font-mono);color:var(--neon-yellow)">${e.score.toFixed(1)}</span>
      </div>`;
    });
    html += '</div>';
    // Winner announcement
    if (data.leaderboard.length >= 2) {
      const winner = data.leaderboard[0];
      html += `<div style="text-align:center;margin-top:12px;font-family:var(--font-display);font-size:14px;color:var(--neon-green);">
        🏆 ${winner.nickname} ${i18n.t('duelWins')}!</div>`;
    }
    container.innerHTML = html;
  },

  // ===== SHARE =====
  shareResult() {
    const r = game.getResults();
    if (!r) return;
    shareResult(r);
  },

  showToast(msg) {
    const t = document.createElement('div');
    t.className = 'toast'; t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => { t.style.animation = 'fadeOut 0.3s ease-out forwards'; setTimeout(() => t.remove(), 300); }, 2000);
  },

  // ===== NICKNAME =====
  _initNickname() {
    const nick = this.getNickname();
    this._updateNickDisplay(nick);
  },

  getNickname() {
    return localStorage.getItem('dialin_nickname') || localStorage.getItem('dialin_daily_nick') || '';
  },

  setNickname(name) {
    localStorage.setItem('dialin_nickname', name);
    if (typeof setDailyNickname === 'function') setDailyNickname(name);
    this._updateNickDisplay(name);
  },

  _updateNickDisplay(name) {
    const el = document.getElementById('nav-nick-text');
    if (!el) return;
    if (name) {
      el.textContent = name;
    } else {
      el.textContent = i18n.getLang() === 'zh' ? '点击设置昵称' : 'Tap to set name';
    }
  },

  editNickname() {
    const current = this.getNickname();
    const name = prompt(i18n.getLang() === 'zh' ? '输入你的昵称：' : 'Enter your nickname:', current || '');
    if (name !== null && name.trim()) {
      this.setNickname(name.trim());
      this.showToast((i18n.getLang() === 'zh' ? '昵称已更新: ' : 'Nickname: ') + name.trim());
    }
  },

  // ===== SOUND TOGGLE =====
  _initSoundToggle() {
    const muted = localStorage.getItem('dialin_muted') === 'true';
    if (muted) audio.enabled = false;
    this._updateSoundBtn();
  },

  toggleSound() {
    const enabled = audio.toggle();
    localStorage.setItem('dialin_muted', enabled ? '' : 'true');
    this._updateSoundBtn();
  },

  _updateSoundBtn() {
    const btn = document.getElementById('nav-sound');
    if (btn) btn.textContent = audio.enabled ? '🔊' : '🔇';
  },

  // ===== THEME TOGGLE =====
  _initTheme() {
    const saved = localStorage.getItem('dialin_theme');
    if (saved === 'light') document.documentElement.setAttribute('data-theme', 'light');
    this._updateThemeBtn();
  },

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'light' ? '' : 'light';
    if (next) {
      document.documentElement.setAttribute('data-theme', next);
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem('dialin_theme', next || 'dark');
    this._updateThemeBtn();
  },

  _updateThemeBtn() {
    const btn = document.getElementById('nav-theme');
    if (!btn) return;
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    btn.textContent = isLight ? '☀️' : '🌙';
  },

  // ===== DUEL REFRESH =====
  async refreshDuelLeaderboard() {
    if (!this.currentDuelId) return;
    const nick = this.getNickname();
    const data = await fetchDuel(this.currentDuelId);
    if (data && data.leaderboard) {
      this._renderDuelLeaderboard('duel-created-lb', data, nick);
    }
  },

  // ===== RESET =====
  resetAllData() {
    const msg = i18n.getLang() === 'zh'
      ? '确定要重置吗？等级、战绩、昵称都会清除，此操作不可恢复。'
      : 'Reset all data? Level, history, nickname will be cleared. This cannot be undone.';
    if (confirm(msg)) {
      localStorage.removeItem('dialin_player');
      localStorage.removeItem('dialin_nickname');
      localStorage.removeItem('dialin_muted');
      localStorage.removeItem('dialin_daily_nick');
      location.reload();
    }
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
