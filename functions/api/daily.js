/**
 * DialIn API — Daily Leaderboard + Score Submission
 * Cloudflare Pages Function with D1 binding
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const INIT_SQL = `
CREATE TABLE IF NOT EXISTS daily_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  nickname TEXT NOT NULL,
  score REAL NOT NULL,
  max_score REAL NOT NULL DEFAULT 50,
  rounds_json TEXT,
  personality TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_daily_date ON daily_scores(date);
CREATE INDEX IF NOT EXISTS idx_daily_score ON daily_scores(date, score DESC);
`;

async function ensureSchema(db) {
  await db.exec(INIT_SQL);
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json();
    const { action, date, nickname, score, maxScore, rounds, personality } = body;

    const db = env.DB;
    if (!db) return jsonError('Database not configured', 500);

    await ensureSchema(db);

    if (action === 'submit') {
      if (!date || !nickname || score === undefined) {
        return jsonError('Missing required fields: date, nickname, score');
      }
      // Check if already submitted today
      const existing = await db.prepare(
        'SELECT id FROM daily_scores WHERE date = ? AND nickname = ?'
      ).bind(date, nickname).first();
      if (existing) {
        return jsonError('Already submitted today', 409);
      }
      await db.prepare(
        'INSERT INTO daily_scores (date, nickname, score, max_score, rounds_json, personality) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(
        date, nickname.slice(0, 30), score, maxScore || 50,
        rounds ? JSON.stringify(rounds) : null,
        personality || null
      ).run();

      // Return leaderboard
      return await getLeaderboard(db, date);
    }

    return jsonError('Unknown action');
  } catch (err) {
    return jsonError(err.message, 500);
  }
}

export async function onRequestGet(context) {
  const { request, env } = context;
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const date = url.searchParams.get('date') || new Date().toISOString().slice(0, 10);

    const db = env.DB;
    if (!db) return jsonError('Database not configured', 500);

    await ensureSchema(db);

    if (action === 'leaderboard') {
      return await getLeaderboard(db, date);
    }

    if (action === 'stats') {
      const total = await db.prepare('SELECT COUNT(*) as count FROM daily_scores WHERE date = ?').bind(date).first();
      return new Response(JSON.stringify({ date, totalPlayers: total?.count || 0 }), {
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
    }

    return jsonError('Unknown action');
  } catch (err) {
    return jsonError(err.message, 500);
  }
}

async function getLeaderboard(db, date) {
  const results = await db.prepare(
    'SELECT nickname, score, max_score, personality, created_at FROM daily_scores WHERE date = ? ORDER BY score DESC LIMIT 100'
  ).bind(date).all();

  const total = await db.prepare('SELECT COUNT(*) as count FROM daily_scores WHERE date = ?').bind(date).first();

  const leaderboard = results.results.map((r, i) => ({
    rank: i + 1,
    nickname: r.nickname,
    score: r.score,
    maxScore: r.max_score,
    personality: r.personality,
  }));

  return new Response(JSON.stringify({
    date,
    totalPlayers: total?.count || 0,
    leaderboard,
  }), {
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

function jsonError(msg, status = 400) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}
