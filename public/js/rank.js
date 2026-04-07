/**
 * DialIn — Level System (no ranks, just Level 1-5)
 */

const LEVELS = [
  { level: 1, colors: 2, showTime: 10, hasDistractors: false },
  { level: 2, colors: 3, showTime: 8,  hasDistractors: false },
  { level: 3, colors: 4, showTime: 5,  hasDistractors: false },
  { level: 4, colors: 5, showTime: 3,  hasDistractors: false },
  { level: 5, colors: 5, showTime: 2,  hasDistractors: true  },
];

function getLevelConfig(level) {
  return LEVELS[Math.min(Math.max(level, 1), 5) - 1];
}

function getLevelDescription(level) {
  const cfg = getLevelConfig(level);
  return `Level ${cfg.level} · ${cfg.colors} colors · ${cfg.showTime}s`;
}

function getLevelUpDescription(level) {
  const cfg = getLevelConfig(level);
  return `Level ${cfg.level} · ${cfg.colors} colors · ${cfg.showTime}s`;
}

function loadPlayerData() {
  try { return JSON.parse(localStorage.getItem('dialin_player') || '{}'); } catch { return {}; }
}

function savePlayerData(data) {
  localStorage.setItem('dialin_player', JSON.stringify(data));
}

function getPlayerLevel() {
  return loadPlayerData().level || 1;
}

function setPlayerLevel(level) {
  const data = loadPlayerData();
  const oldLevel = data.level || 1;
  data.level = Math.min(Math.max(level, 1), 5);
  savePlayerData(data);
  return { oldLevel, newLevel: data.level, changed: oldLevel !== data.level };
}

function getLevelProgress() {
  const data = loadPlayerData();
  const history = data.gameHistory || [];
  if (history.length === 0) return 0;
  const recent = history.slice(-5);
  const avg = recent.reduce((s, g) => s + g.scorePercent, 0) / recent.length;
  return Math.min(avg / 0.75, 1); // 75% = level up
}

function checkLevelChange() {
  const data = loadPlayerData();
  const history = data.gameHistory || [];
  if (history.length < 3) return null;
  const recent = history.slice(-5);
  const avg = recent.reduce((s, g) => s + g.scorePercent, 0) / recent.length;
  const currentLevel = data.level || 1;

  if (avg >= 0.75 && currentLevel < 5) {
    const result = setPlayerLevel(currentLevel + 1);
    if (result.changed) return { type: 'up', ...result };
  } else if (avg < 0.35 && currentLevel > 1) {
    const result = setPlayerLevel(currentLevel - 1);
    if (result.changed) return { type: 'down', ...result };
  }
  return null;
}

function getPlayerStreak() {
  const data = loadPlayerData();
  return data.streak || 0;
}

function updateStreak() {
  const data = loadPlayerData();
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (data.lastPlayDate === today) return data.streak || 0;
  data.streak = (data.lastPlayDate === yesterday) ? (data.streak || 0) + 1 : 1;
  data.lastPlayDate = today;
  savePlayerData(data);
  return data.streak;
}

function recordGame(scorePercent, difficulty) {
  const data = loadPlayerData();
  if (!data.gameHistory) data.gameHistory = [];
  data.gameHistory.push({ scorePercent, difficulty, ts: Date.now() });
  data.gameHistory = data.gameHistory.slice(-20);
  // Save bias history for cross-game personality analysis
  if (typeof game !== 'undefined' && game.biasHistory) {
    data.biasHistory = (data.biasHistory || []).concat(game.biasHistory).slice(-30);
  }
  savePlayerData(data);
}
