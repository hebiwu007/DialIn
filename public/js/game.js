/**
 * DialIn — Game Engine
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
    this.phase = 'idle'; // idle, display, pick, results
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
    this.phase = 'display';

    const config = DIFFICULTY[this.difficulty];

    if (mode === 'daily') {
      const daily = generateDailyColors(getDailyDate());
      this.colors = daily.colors;
    } else {
      this.colors = this._generateColors(config.colorCount);
    }

    // Load bias history
    const data = loadPlayerData();
    this.biasHistory = data.biasHistory || [];

    // Update UI
    const modeLabel = mode === 'daily' ? '☀ DAILY DIAL' : mode === 'duel' ? '⚔ DUEL' : '▶ FREE DIAL';
    document.getElementById('game-mode-label').textContent = modeLabel;

    this._renderColorSlots();
    this._startDisplayPhase(config.showTime);
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
    container.classList.add('stagger-children');

    this.colors.forEach((color, i) => {
      const slot = document.createElement('div');
      slot.className = 'color-slot slot-appear';
      slot.id = `slot-${i}`;
      const rgb = hsbToRgb(color.h, color.s, color.b);
      slot.style.backgroundColor = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
      container.appendChild(slot);
    });
  }

  _startDisplayPhase(seconds) {
    const phaseDisplay = document.getElementById('phase-display');
    const phasePick = document.getElementById('phase-pick');
    phaseDisplay.classList.remove('hidden');
    phasePick.classList.add('hidden');

    const progressBar = document.getElementById('display-progress-fill');
    const timerEl = document.getElementById('timer-value');
    const timerContainer = document.getElementById('game-timer');
    timerContainer.classList.remove('warning');

    this._updateRoundLabel();

    let timeLeft = seconds * 10; // 10ths of a second
    const totalTime = timeLeft;

    this.timer = setInterval(() => {
      timeLeft--;
      const seconds = (timeLeft / 10).toFixed(1);
      timerEl.textContent = seconds;
      progressBar.style.width = (timeLeft / totalTime * 100) + '%';

      // Warning at 3 seconds
      if (timeLeft <= 30) {
        timerContainer.classList.add('warning');
        if (timeLeft % 10 === 0) audio.play('warning');
      }

      if (timeLeft <= 0) {
        clearInterval(this.timer);
        this._startPickPhase();
      }
    }, 100);
  }

  _startPickPhase() {
    this.phase = 'pick';

    const phaseDisplay = document.getElementById('phase-display');
    const phasePick = document.getElementById('phase-pick');
    const timerEl = document.getElementById('timer-value');
    const timerContainer = document.getElementById('game-timer');

    phaseDisplay.classList.add('hidden');
    phasePick.classList.remove('hidden');

    // Clear timer display
    timerEl.textContent = '—';
    timerContainer.classList.remove('warning');

    // Mark current slot as active
    this.colors.forEach((_, i) => {
      const slot = document.getElementById(`slot-${i}`);
      slot.className = 'color-slot';
      if (i < this.currentRound) slot.classList.add('done');
      else if (i === this.currentRound) slot.classList.add('active');
      else slot.classList.add('pending');

      // Hide color for current and future
      if (i >= this.currentRound) {
        slot.style.backgroundColor = 'var(--bg-card)';
      }
    });

    // Reset picker
    colorPicker.bind();
    colorPicker.reset(180, 50, 50);
    colorPicker.onChange = (color) => {
      // Live feedback
    };
  }

  submitGuess() {
    if (this.phase !== 'pick') return;

    const guess = colorPicker.getColor();
    const original = this.colors[this.currentRound];
    const result = calculateScore(original, guess);

    // Play sound
    if (result.score >= 7) audio.play('highScore');
    else if (result.score < 4) audio.play('lowScore');
    else audio.play('confirm');

    // Collect bias
    const biasData = collectBiasData(original, guess);
    this.biasHistory.push(biasData);

    this.guesses.push({
      original,
      guess,
      score: result.score,
      dE: result.dE,
      breakdown: result.breakdown
    });

    // Mark slot done
    const slot = document.getElementById(`slot-${this.currentRound}`);
    slot.className = 'color-slot done';

    this.currentRound++;
    this._updateRoundLabel();

    if (this.currentRound >= this.colors.length) {
      // All done
      this._showResults();
    } else {
      // Next round
      this._startPickPhase();
    }
  }

  _updateRoundLabel() {
    document.getElementById('game-round').textContent = `Round ${this.currentRound + 1}/${this.colors.length}`;
  }

  _showResults() {
    this.phase = 'results';
    audio.play('complete');

    const phasePick = document.getElementById('phase-pick');
    const phaseResults = document.getElementById('phase-results');
    phasePick.classList.add('hidden');
    phaseResults.classList.remove('hidden');

    const totalScore = this.guesses.reduce((s, g) => s + g.score, 0);
    const maxScore = this.colors.length * 10;
    const scorePercent = totalScore / maxScore;

    // Analyze bias
    const biasAnalysis = analyzeColorBias(this.biasHistory);

    // Calculate rating change
    const ratingChange = calculateRatingChange(scorePercent, this.difficulty, this.mode === 'daily', getPlayerRating());
    const oldRating = getPlayerRating();
    const newRating = Math.max(0, oldRating + ratingChange);
    const rank = getRank(newRating);

    // Update rating
    const data = loadPlayerData();
    data.rating = newRating;
    data.biasHistory = this.biasHistory.slice(-50); // Keep last 50
    savePlayerData(data);

    // Update streak
    if (this.mode === 'daily') {
      markDailyPlayed(totalScore);
    }
    updateStreak();

    // Store results for sharing
    this.results = {
      mode: this.mode,
      difficulty: this.difficulty,
      rounds: this.guesses,
      totalScore: Math.round(totalScore * 10) / 10,
      maxScore,
      personality: biasAnalysis.personality,
      ratingChange,
      newRating,
      rank: `${rank.icon} ${rank.tier} ${rank.division}`,
      streak: getPlayerStreak()
    };

    // Render results
    const container = document.getElementById('results-container');
    container.innerHTML = '';

    // Title
    const title = document.createElement('h2');
    title.className = 'results-title';
    title.textContent = 'RESULTS';
    container.appendChild(title);

    // Color pairs
    const colorsDiv = document.createElement('div');
    colorsDiv.className = 'results-colors stagger-children';

    this.guesses.forEach((round, i) => {
      const pair = document.createElement('div');
      pair.className = 'result-pair';

      const origBlock = document.createElement('div');
      origBlock.className = 'result-original';
      const rgbO = hsbToRgb(round.original.h, round.original.s, round.original.b);
      origBlock.style.backgroundColor = `rgb(${rgbO.r}, ${rgbO.g}, ${rgbO.b})`;

      const guessBlock = document.createElement('div');
      guessBlock.className = 'result-guess';
      const rgbG = hsbToRgb(round.guess.h, round.guess.s, round.guess.b);
      guessBlock.style.backgroundColor = `rgb(${rgbG.r}, ${rgbG.g}, ${rgbG.b})`;

      const scoreEl = document.createElement('span');
      scoreEl.className = 'result-score score-reveal';
      scoreEl.classList.add(round.score >= 7 ? 'high' : round.score >= 4 ? 'mid' : 'low');
      scoreEl.textContent = round.score.toFixed(1);

      pair.appendChild(origBlock);
      pair.appendChild(guessBlock);
      pair.appendChild(scoreEl);
      colorsDiv.appendChild(pair);
    });
    container.appendChild(colorsDiv);

    // Total score
    const totalDiv = document.createElement('div');
    totalDiv.className = 'slide-up';
    totalDiv.innerHTML = `
      <div class="results-total">${totalScore.toFixed(1)}</div>
      <div class="results-total-label">out of ${maxScore}</div>
    `;
    container.appendChild(totalDiv);

    // Progress bar
    const barDiv = document.createElement('div');
    barDiv.className = 'results-bar';
    const barFill = document.createElement('div');
    barFill.className = 'results-bar-fill';
    const barColor = scorePercent >= 0.7 ? 'var(--neon-green)' : scorePercent >= 0.4 ? 'var(--neon-yellow)' : 'var(--neon-pink)';
    barFill.style.background = barColor;
    barFill.style.boxShadow = `0 0 10px ${barColor}`;
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
        <div class="personality-stat">
          <span class="personality-stat-label">RATING</span>
          <span class="personality-stat-value ${ratingChange >= 0 ? '' : ''}">${ratingChange >= 0 ? '+' : ''}${ratingChange}</span>
        </div>
        <div class="personality-stat">
          <span class="personality-stat-label">RANK</span>
          <span class="personality-stat-value">${rank.icon} ${rank.tier} ${rank.division}</span>
        </div>
        <div class="personality-stat">
          <span class="personality-stat-label">STREAK</span>
          <span class="personality-stat-value">Day ${getPlayerStreak()} 🔥</span>
        </div>
      </div>
    `;
    container.appendChild(persDiv);

    // Update nav stats
    updateNavStats();
  }

  getResults() {
    return this.results;
  }
}

const game = new GameEngine();
