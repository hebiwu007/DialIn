/**
 * DialIn — Game Engine v3
 * Flow: show color → countdown → guess → compare → next → summary
 */
class GameEngine {
  constructor() {
    this.colors = []; this.guesses = []; this.currentRound = 0;
    this.phase = 'idle'; this.mode = 'free'; this.level = 1;
    this.timer = null; this.results = null; this.biasHistory = [];
  }

  start(mode, level) {
    this.mode = mode; this.level = level || getPlayerLevel();
    this.currentRound = 0; this.guesses = []; this.biasHistory = [];
    this.phase = 'show';

    const cfg = mode === 'daily' ? { colors: 5, showTime: 5 } : getLevelConfig(this.level);

    if (mode === 'daily') {
      this.colors = generateDailyColors(getDailyDate()).colors;
    } else {
      this.colors = [];
      for (let i = 0; i < cfg.colors; i++) {
        this.colors.push({ h: Math.floor(Math.random()*360), s: 20+Math.floor(Math.random()*80), b: 20+Math.floor(Math.random()*80) });
      }
    }

    const data = loadPlayerData();
    this.biasHistory = data.biasHistory || [];

    this._renderProgress();
    this._showPhase('phase-show');
    this._showColor(cfg.showTime);
  }

  _renderProgress() {
    const container = document.getElementById('progress-dots');
    container.innerHTML = '';
    for (let i = 0; i < this.colors.length; i++) {
      const dot = document.createElement('span');
      dot.className = 'progress-dot';
      dot.id = `dot-${i}`;
      container.appendChild(dot);
    }
    this._updateProgress();
  }

  _updateProgress() {
    for (let i = 0; i < this.colors.length; i++) {
      const dot = document.getElementById(`dot-${i}`);
      if (!dot) continue;
      dot.className = 'progress-dot';
      if (i < this.currentRound) dot.classList.add('done');
      else if (i === this.currentRound) dot.classList.add('active');
    }
  }

  _showColor(seconds) {
    const color = this.colors[this.currentRound];
    const rgb = hsbToRgb(color.h, color.s, color.b);
    const el = document.getElementById('show-color');
    el.style.backgroundColor = `rgb(${rgb.r},${rgb.g},${rgb.b})`;

    const timerEl = document.getElementById('show-timer-value');
    const ring = document.getElementById('show-timer-ring');
    ring.classList.remove('warning');

    let left = seconds * 10;
    const total = left;
    timerEl.textContent = (left/10).toFixed(1);

    this.timer = setInterval(() => {
      left--;
      timerEl.textContent = (left/10).toFixed(1);
      if (left <= 30) { ring.classList.add('warning'); if (left%10===0) audio.play('warning'); }
      if (left <= 0) { clearInterval(this.timer); this._startGuess(); }
    }, 100);
  }

  _startGuess() {
    this.phase = 'guess';
    colorPicker.bind();
    colorPicker.reset(180, 50, 50);
    this._updateProgress();
    this._showPhase('phase-guess');
  }

  submitGuess() {
    if (this.phase !== 'guess') return;
    const guess = colorPicker.getColor();
    const original = this.colors[this.currentRound];
    const result = calculateScore(original, guess);

    if (result.score >= 7) audio.play('highScore');
    else if (result.score < 4) audio.play('lowScore');
    else audio.play('confirm');

    this.biasHistory.push(collectBiasData(original, guess));
    this.guesses.push({ original, guess, score: result.score, dE: result.dE });

    this._showCompare(original, guess, result.score);
  }

  _showCompare(original, guess, score) {
    this.phase = 'compare';
    const rgbO = hsbToRgb(original.h, original.s, original.b);
    const rgbG = hsbToRgb(guess.h, guess.s, guess.b);
    const cls = score >= 7 ? 'high' : score >= 4 ? 'mid' : 'low';

    document.getElementById('compare-wrap').innerHTML = `
      <div class="compare-pair fade-in">
        <div class="compare-swatch" style="background:rgb(${rgbO.r},${rgbO.g},${rgbO.b})">
          <span class="compare-label" data-i18n="labelOriginal">ORIGINAL</span>
        </div>
        <span class="compare-vs">VS</span>
        <div class="compare-swatch" style="background:rgb(${rgbG.r},${rgbG.g},${rgbG.b})">
          <span class="compare-label" data-i18n="labelYours">YOURS</span>
        </div>
      </div>
      <div class="compare-score score-reveal ${cls}">${score.toFixed(1)}</div>
      <div class="compare-out-of">/ 10</div>`;

    const nextBtn = document.getElementById('btn-next');
    nextBtn.textContent = (this.currentRound >= this.colors.length - 1) ? i18n.t('btnSummary') : i18n.t('btnNext');
    this._showPhase('phase-compare');
  }

  nextRound() {
    this.currentRound++;
    if (this.currentRound >= this.colors.length) {
      this._showSummary();
    } else {
      this.phase = 'show';
      this._updateProgress();
      this._showPhase('phase-show');
      const cfg = this.mode === 'daily' ? { showTime: 5 } : getLevelConfig(this.level);
      this._showColor(cfg.showTime);
    }
  }

  _showSummary() {
    this.phase = 'summary';
    audio.play('complete');

    const total = this.guesses.reduce((s,g) => s+g.score, 0);
    const max = this.colors.length * 10;
    const pct = total / max;
    const bias = analyzeColorBias(this.biasHistory);

    // Record & check level
    recordGame(pct, this.level);
    updateStreak();
    const levelChange = this.mode === 'free' ? checkLevelChange() : null;

    const container = document.getElementById('summary-wrap');
    let html = `<h2 class="summary-title slide-up">${i18n.t('summaryTitle')}</h2><div class="summary-colors stagger-children">`;
    this.guesses.forEach(r => {
      const o = hsbToRgb(r.original.h,r.original.s,r.original.b);
      const g = hsbToRgb(r.guess.h,r.guess.s,r.guess.b);
      const sc = r.score>=7?'high':r.score>=4?'mid':'low';
      html += `<div class="summary-pair">
        <div class="summary-swatch" style="background:rgb(${o.r},${o.g},${o.b})"></div>
        <div class="summary-swatch" style="background:rgb(${g.r},${g.g},${g.b})"></div>
        <span class="summary-score ${sc}">${r.score.toFixed(1)}</span></div>`;
    });
    html += `</div>`;
    html += `<div class="slide-up"><div class="summary-total">${total.toFixed(1)}</div><div class="summary-total-label">${i18n.t('outOf',{max})}</div></div>`;

    const bc = pct>=0.7?'var(--neon-green)':pct>=0.4?'var(--neon-yellow)':'var(--neon-pink)';
    html += `<div class="summary-bar"><div class="summary-bar-fill" style="background:${bc};box-shadow:0 0 8px ${bc}"></div></div>`;

    html += `<div class="summary-personality cyber-panel fade-in">
      <div class="personality-name">${bias.personality.name}</div>
      <div class="personality-desc">${bias.personality.desc}</div></div>`;

    const streak = getPlayerStreak();
    if (streak > 0) html += `<div class="level-streak">${i18n.t('streakDay',{n:streak})}</div>`;

    container.innerHTML = html;
    this._showPhase('phase-summary');

    // Animate bar
    setTimeout(() => { const fill = container.querySelector('.summary-bar-fill'); if (fill) fill.style.width = (pct*100)+'%'; }, 100);

    // Level change overlay
    if (levelChange) this._showLevelOverlay(levelChange);

    // Save for sharing
    this.results = { mode:this.mode, level:this.level, rounds:this.guesses, totalScore:Math.round(total*10)/10, maxScore:max, personality:bias.personality, streak, levelChange };

    updateNavStats();
  }

  _showLevelOverlay(change) {
    const overlay = document.createElement('div');
    overlay.className = 'level-overlay';
    const isUp = change.type === 'up';
    const color = isUp ? 'var(--neon-green)' : 'var(--neon-yellow)';
    const title = isUp ? i18n.t('levelUp') : i18n.t('levelDown');
    const oldDesc = getLevelDescription(change.oldLevel);
    const newDesc = getLevelUpDescription(change.newLevel);
    overlay.innerHTML = `<div class="level-overlay-content" style="border-color:${color}">
      <div class="level-overlay-title" style="color:${color}">${title}</div>
      <div class="level-overlay-detail">${oldDesc} → ${newDesc}</div>
      <div class="level-overlay-sub">${isUp ? i18n.t('levelUpMsg') : i18n.t('levelDownMsg')}</div>
      <button class="neon-btn neon-btn-cyan" style="width:100%" onclick="this.closest('.level-overlay').remove()">${isUp ? i18n.t('levelUpBtn') : i18n.t('levelDownBtn')}</button>
    </div>`;
    document.body.appendChild(overlay);
    if (isUp) audio.play('levelUp');
  }

  _showPhase(id) {
    document.querySelectorAll('.game-phase').forEach(p => {
      p.classList.remove('active-phase');
    });
    const target = document.getElementById(id);
    if (target) target.classList.add('active-phase');
  }

  getResults() { return this.results; }
}
const game = new GameEngine();
