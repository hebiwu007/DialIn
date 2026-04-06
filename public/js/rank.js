/**
 * DialIn — Rank System
 */

const RANKS = [
  { tier: 'Bronze',   divisions: ['IV', 'III', 'II', 'I'], icon: '🥉', minRating: 0,    color: '#CD7F32' },
  { tier: 'Silver',   divisions: ['IV', 'III', 'II', 'I'], icon: '🥈', minRating: 400,  color: '#C0C0C0' },
  { tier: 'Gold',     divisions: ['IV', 'III', 'II', 'I'], icon: '🥇', minRating: 800,  color: '#FFD700' },
  { tier: 'Platinum', divisions: ['IV', 'III', 'II', 'I'], icon: '💎', minRating: 1200, color: '#E5E4E2' },
  { tier: 'Diamond',  divisions: ['IV', 'III', 'II', 'I'], icon: '💠', minRating: 1600, color: '#B9F2FF' },
  { tier: 'Master',   divisions: ['I'],                    icon: '👑', minRating: 2000, color: '#FF6B00' },
];

function getRank(rating) {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    const rank = RANKS[i];
    if (rating >= rank.minRating) {
      const divIndex = Math.min(
        Math.floor((rating - rank.minRating) / 100),
        rank.divisions.length - 1
      );
      return {
        tier: rank.tier,
        division: rank.divisions[divIndex],
        icon: rank.icon,
        color: rank.color,
        rating,
        nextRating: i < RANKS.length - 1 ? RANKS[i + 1].minRating : rank.minRating + 100,
        progress: ((rating - rank.minRating) % 100) / 100
      };
    }
  }
  return { tier: 'Bronze', division: 'IV', icon: '🥉', color: '#CD7F32', rating: 0, nextRating: 100, progress: 0 };
}

function calculateRatingChange(scorePercent, difficulty, isDaily, currentRating) {
  const diffMult = { tutorial: 0.5, easy: 0.8, medium: 1.0, hard: 1.3, expert: 1.6 };
  const mult = diffMult[difficulty] || 1.0;
  const dailyBonus = isDaily ? 1.5 : 1.0;
  const kFactor = currentRating > 1500 ? 0.7 : 1.0;
  const baseChange = (scorePercent - 0.35) * 80;
  return Math.max(-20, Math.min(40, Math.round(baseChange * mult * dailyBonus * kFactor)));
}

function loadPlayerData() {
  try {
    return JSON.parse(localStorage.getItem('dialin_player') || '{}');
  } catch { return {}; }
}

function savePlayerData(data) {
  localStorage.setItem('dialin_player', JSON.stringify(data));
}

function getPlayerRating() {
  return loadPlayerData().rating || 0;
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
  if (data.lastPlayDate === yesterday) {
    data.streak = (data.streak || 0) + 1;
  } else {
    data.streak = 1;
  }
  data.lastPlayDate = today;
  savePlayerData(data);
  return data.streak;
}
