/**
 * DialIn — Daily Mode v3 (with D1 leaderboard)
 */

const DAILY_THEMES = [
  { name: '🌿 自然色', nameEn: '🌿 Nature',   desc: '今天的颜色来自大自然', descEn: "Today's colors come from nature", hueRanges: [[80, 160]], satRange: [30, 80], briRange: [30, 80] },
  { name: '🌅 日落色', nameEn: '🌅 Sunset',    desc: '今天的颜色像日落', descEn: "Today's colors are like a sunset", hueRanges: [[0, 40]],   satRange: [60, 100],briRange: [50, 90] },
  { name: '🌊 海洋色', nameEn: '🌊 Ocean',    desc: '今天的颜色来自深海', descEn: "Today's colors are from the deep sea", hueRanges: [[180, 240]],satRange: [40, 90], briRange: [40, 80] },
  { name: '🍬 糖果色', nameEn: '🍬 Candy',     desc: '今天的颜色很甜', descEn: "Today's colors are sweet", hueRanges: [[300, 360], [0, 60]], satRange: [50, 90], briRange: [60, 95] },
  { name: '🏜️ 大地色', nameEn: '🏜️ Earth',    desc: '今天的颜色很沉稳', descEn: "Today's colors are grounded", hueRanges: [[20, 50]],   satRange: [20, 60], briRange: [30, 70] },
  { name: '💡 霓虹色', nameEn: '💡 Neon',      desc: '今天的颜色很鲜艳', descEn: "Today's colors are neon bright", hueRanges: [[0, 360]],   satRange: [80, 100],briRange: [60, 100] },
  { name: '🌈 彩虹色', nameEn: '🌈 Rainbow',   desc: '今天不设限，什么颜色都可能出现', descEn: "Anything goes — expect any color today!", hueRanges: [[0, 360]],   satRange: [10, 100], briRange: [10, 100] },
];

const API_BASE = '/api/daily';

function getDailyDate() {
  return new Date().toISOString().slice(0, 10);
}

function getDailyTheme() {
  const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  return DAILY_THEMES[dayOfYear % DAILY_THEMES.length];
}

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) { hash = ((hash << 5) - hash) + str.charCodeAt(i); hash |= 0; }
  return Math.abs(hash);
}

function seedRandom(seed) {
  let s = seed;
  return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
}

function generateDailyColors(dateStr) {
  const seed = hashCode(dateStr);
  const rng = seedRandom(seed);
  const theme = getDailyTheme();
  const colors = [];
  for (let i = 0; i < 5; i++) {
    const rangeIdx = Math.floor(rng() * theme.hueRanges.length);
    const range = theme.hueRanges[rangeIdx];
    const h = Math.round(range[0] + rng() * (range[1] - range[0]));
    const s = Math.round(theme.satRange[0] + rng() * (theme.satRange[1] - theme.satRange[0]));
    const b = Math.round(theme.briRange[0] + rng() * (theme.briRange[1] - theme.briRange[0]));
    colors.push({ h: h % 360, s: Math.min(100, s), b: Math.min(100, b) });
  }
  return { colors, theme, date: dateStr };
}

function hasPlayedDaily() {
  const data = loadPlayerData();
  return data.lastDailyDate === getDailyDate();
}

function markDailyPlayed(score) {
  const data = loadPlayerData();
  data.lastDailyDate = getDailyDate();
  data.lastDailyScore = score;
  data.dailyNickname = data.dailyNickname || '';
  savePlayerData(data);
}

function getDailyNickname() {
  return loadPlayerData().dailyNickname || '';
}

function setDailyNickname(name) {
  const data = loadPlayerData();
  data.dailyNickname = name;
  savePlayerData(data);
}

// ===== API Calls =====

async function submitDailyScore(nickname, score, maxScore, rounds, personality) {
  try {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'submit',
        date: getDailyDate(),
        nickname,
        score,
        maxScore,
        rounds,
        personality,
      }),
    });
    return await res.json();
  } catch (err) {
    console.error('Submit daily score failed:', err);
    return null;
  }
}

async function fetchDailyLeaderboard(date) {
  try {
    const res = await fetch(`${API_BASE}?action=leaderboard&date=${date || getDailyDate()}`);
    return await res.json();
  } catch (err) {
    console.error('Fetch leaderboard failed:', err);
    return null;
  }
}
