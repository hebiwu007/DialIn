/**
 * DialIn — Game Engine v2 (Simpler UX)
 * Flow: Memorize → Guess one-by-one → Round feedback → Next → Final Results
 */

const DIFFICULTY = {
  tutorial: { name: '教程', colorCount: 2, showTime: 10, icon: '🎒' },
  easy:     { name: '简单', colorCount: 3, showTime: 8,  icon: '🟢' },
  medium:   { name: '普通', colorCount: 4, showTime: 5,  icon: '🟡' },
  hard:     { name: '困难', colorCount: 5, showTime: 3,  icon: '🔴' },
  expert:   { name: '专家', colorCount: 5, showTime: 2,  icon: '💀' }
};

class GameEngine {
  constructor() {
    this.colors = [];
    this.guesses = [];
    this.currentRound = 0;
    this.phase = 'idle';
    this.mode = 'free';
    this.difficulty = 'medium';
    this.timer = null;
    this.results = null;
    this.biasHistory = [];
  }

  start(mode, difficulty) {
    this.mode = mode;
    this.difficulty = difficulty || 'medium';
    this.currentRound = 0;
    this.guesses = [];
    this.phase = 'memorize';

    const config = DIFFICULTY[this.difficulty];

    if (mode === 'daily') {
      const daily = generateDailyColors(getDailyDate());
      this.colors = daily.colors;
    } else {
      this.colors = this._generateColors(config.colorCount);
    }

    const data = loadPlayerData();
    this.biasHistory = data.biasHistory || [];

    this._renderColorSlots();
    this._showPhase('phase-memorize');
    this._startCountdown(config.showTime);
  }

  _generateColors(count) {
    const colors = [];
    for (let i = 0; i < count; i++) {
      colors.push({
        h: Math.floor(Math.random() * 360),
        s: 20 + Math.floor(Math.random() * 80),
        b: 20 + Math.floor(Math.random() * 80)
      });
    }
    return colors;
  }

  _renderColorSlots() {
    const container = document.getElementById('color-slots');
    container.innerHTML = '';
    this.colors.forEach((color, i) => {
      const slot = document.createElement('div');
      slot.className = 'color-slot slot-appear';
      slot.id = `slot-${i}`;
      const rgb = hsbToRgb(color.h, color.s, color.b);
      slot.style.backgroundColor = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
      slot.style.animationDelay = (i * 0.08) + 's';
      container.appendChild(slot);
    });
  }

  _startCountdown(seconds) {
    const timerEl = document.getElementById('timer-value');
    const timerRing = timerEl.parentElement;
    const progressBar = document.getElementById('display-progress-fill');
    timerRing.classList.remove('warning');

    let timeLeft = seconds * 10;
    const totalTime = timeLeft;

    this.timer = setInterval(() => {
      timeLeft--;
      timerEl.textContent = (timeLeft / 10).toFixed(1);
      progressBar.style.width = (timeLeft / totalTime * 100) + '%';

      if (timeLeft <= 30) {
        timerRing.classList.add('warning');
        if (timeLeft % 10 === 0) audio.play('warning');
      }
      if (timeLeft <= 0) {
        clearInterval(this.timer);
        this._startGuessPhase();
      }
    }, 100);
  }

  _startGuessPhase() {
    this.phase = 'guess';

    // Update instruction
    const instrEl = document.getElementById('guess-instruction');
    instrEl.textContent = i18n.t('guessInstruction', { current: this.currentRound + 1, total: this.colors.length });

    // Update slot indicators
    this.colors.forEach((_, i) => {
      const slot = document.getElementById(`slot-${i}`);
      if (!slot) return;
      slot.className = 'color-slot';
      if (i < this.currentRound) slot.classList.add('done');
      else if (i === this.currentRound) slot.classList.add('active');
      else slot.classList.add('pending');
      if (i >= this.currentRound) slot.style.backgroundColor = 'var(--bg-card)';
    });

    // Reset picker
    colorPicker.bind();
    colorPicker.reset(180, 50, 50);

    this._showPhase('phase-guess');
  }

  submitGuess() {
    if (this.phase !== 'guess') return;

    const guess = colorPicker.getColor();
    const original = this.colors[this.currentRound];
    const result = calculateScore(original, guess);

    // Sound
    if (result.score >= 7) audio.play('highScore');
    else if (result.score < 4) audio.play('lowScore');
    else audio.play('confirm');

    // Collect bias
    this.biasHistory.push(collectBiasData(original, guess));

    this.guesses.push({ original, guess, score: result.score, dE: result.dE, breakdown: result.breakdown });

    // Show round feedback
    this._showRoundResult(original, guess, result.score);
  }

  _showRoundResult(original, guess, score) {
    this.phase = 'round-result';

    const container = document.getElementById('round-feedback');
    const rgbOrig = hsbToRgb(original.h, original.s, original.b);
    const rgbGuess = hsbToRgb(guess.h, guess.s, guess.b);
    const scoreClass = score >= 7 ? 'high' : score >= 4 ? 'mid' : 'low';

    container.innerHTML = `
      <div class="round-compare fade-in">
        <div class="round-swatch" style="background:rgb(${rgbOrig.r},${rgbOrig.g},${rgbOrig.b})"></div>
        <span class="round-vs">VS</span>
        <div class="round-swatch" style="background:rgb(${rgbGuess.r},${rgbGuess.g},${rgbGuess.b})"></div>
      </div>
      <div class="round-score-big score-reveal ${scoreClass}">${score.toFixed(1)}</div>
      <div class="round-score-label">${i18n.t('roundScoreLabel')}</div>
    `;

    // Update "next" button text
    const nextBtn = document.getElementById('btn-next-round');
    const isLast = this.currentRound >= this.colors.length - 1;
    nextBtn.querySelector('span').textContent = isLast ? i18n.t('btnSeeResults') : i18n.t('btnNext');

    this._showPhase('phase-round-result');
  }

  nextRound() {
    this.currentRound++;
    if (this.currentRound >= this.colors.length) {
      this._showFinalResults();
    } else {
      this._startGuessPhase();
    }
  }

  _showFinalResults() {
    this.phase = 'results';
    audio.play('complete');

    const totalScore = this.guesses.reduce((s, g) => s + g.score, 0);
    const maxScore = this.colors.length * 10;
    const scorePercent = totalScore / maxScore;
    const biasAnalysis = analyzeColorBias(this.biasHistory);
    const ratingChange = calculateRatingChange(scorePercent, this.difficulty, this.mode === 'daily', getPlayerRating());
    const oldRating = getPlayerRating();
    const newRating = Math.max(0, oldRating + ratingChange);
    const rank = getRank(newRating);

    // Save
    const data = loadPlayerData();
    data.rating = newRating;
    data.biasHistory = this.biasHistory.slice(-50);
    savePlayerData(data);
    if (this.mode === 'daily') markDailyPlayed(totalScore);
    updateStreak();

    this.results = {
      mode: this.mode, difficulty: this.difficulty,
      rounds: this.guesses, totalScore: Math.round(totalScore * 10) / 10,
      maxScore, personality: biasAnalysis.personality,
      ratingChange, newRating,
      rank: `${rank.icon} ${rank.tier} ${rank.division}`,
      streak: getPlayerStreak()
    };

    // Render
    const container = document.getElementById('results-container');
    container.innerHTML = '';

    // Title
    const title = document.createElement('h2');
    title.className = 'results-title slide-up';
    title.textContent = i18n.t('resultsTitle');
    container.appendChild(title);

    // Color pairs
    const colorsDiv = document.createElement('div');
    colorsDiv.className = 'results-colors stagger-children';
    this.guesses.forEach((round) => {
      const pair = document.createElement('div');
      pair.className = 'result-pair';
      const rgbO = hsbToRgb(round.original.h, round.original.s, round.original.b);
      const rgbG = hsbToRgb(round.guess.h, round.guess.s, round.guess.b);
      const sc = round.score >= 7 ? 'high' : round.score >= 4 ? 'mid' : 'low';
      pair.innerHTML = `
        <div class="result-original" style="background:rgb(${rgbO.r},${rgbO.g},${rgbO.b})"></div>
        <div class="result-guess" style="background:rgb(${rgbG.r},${rgbG.g},${rgbG.b})"></div>
        <span class="result-score ${sc}">${round.score.toFixed(1)}</span>`;
      colorsDiv.appendChild(pair);
    });
    container.appendChild(colorsDiv);

    // Total
    const totalDiv = document.createElement('div');
    totalDiv.className = 'slide-up';
    totalDiv.innerHTML = `<div class="results-total">${totalScore.toFixed(1)}</div><div class="results-total-label">${i18n.t('resultsOutof', { max: maxScore })}</div>`;
    container.appendChild(totalDiv);

    // Bar
    const barDiv = document.createElement('div');
    barDiv.className = 'results-bar';
    const barFill = document.createElement('div');
    barFill.className = 'results-bar-fill';
    const bc = scorePercent >= 0.7 ? 'var(--neon-green)' : scorePercent >= 0.4 ? 'var(--neon-yellow)' : 'var(--neon-pink)';
    barFill.style.background = bc;
    barFill.style.boxShadow = `0 0 8px ${bc}`;
    setTimeout(() => { barFill.style.width = (scorePercent * 100) + '%'; }, 100);
    barDiv.appendChild(barFill);
    container.appendChild(barDiv);

    // Personality
    const persDiv = document.createElement('div');
    persDiv.className = 'results-personality cyber-panel fade-in';
    persDiv.innerHTML = `
      <div class="personality-name">${biasAnalysis.personality.name}</div>
      <div class="personality-desc">${biasAnalysis.personality.desc}</div>
      <div class="personality-stats">
        <div class="personality-stat"><span class="personality-stat-label">${i18n.t('labelRatingChange')}</span><span class="personality-stat-value">${ratingChange >= 0 ? '+' : ''}${ratingChange}</span></div>
        <div class="personality-stat"><span class="personality-stat-label">${i18n.t('labelRankShort')}</span><span class="personality-stat-value">${rank.icon} ${rank.tier} ${rank.division}</span></div>
        <div class="personality-stat"><span class="personality-stat-label">${i18n.t('labelStreakShort')}</span><span class="personality-stat-value">${i18n.t('streakDay', { n: getPlayerStreak() })}</span></div>
      </div>`;
    container.appendChild(persDiv);

    this._showPhase('phase-results');
    updateNavStats();
  }

  _showPhase(phaseId) {
    document.querySelectorAll('.game-phase').forEach(p => p.classList.remove('active-phase'));
    const el = document.getElementById(phaseId);
    if (el) el.classList.add('active-phase');
  }

  getResults() { return this.results; }
}

const game = new GameEngine();
