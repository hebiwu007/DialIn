/**
 * DialIn Duel API — Link-based multiplayer color challenge
 * Cloudflare Pages Function with D1 binding
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

async function ensureSchema(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS duels (
    id TEXT PRIMARY KEY,
    colors_json TEXT NOT NULL,
    creator_nick TEXT NOT NULL,
    creator_score REAL NOT NULL,
    creator_rounds TEXT,
    creator_personality TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    expires_at INTEGER NOT NULL
  )`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS duel_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    duel_id TEXT NOT NULL,
    nickname TEXT NOT NULL,
    score REAL NOT NULL,
    rounds_json TEXT,
    personality TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_duel_entries ON duel_entries(duel_id)`).run();
}

function generateId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = '';
  for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json();
    const { action } = body;
    const db = env.DB;
    if (!db) return jsonError('Database not configured', 500);
    await ensureSchema(db);

    if (action === 'create') {
      const { colors, nickname, score, rounds, personality } = body;
      if (!colors || !nickname || score === undefined) return jsonError('Missing fields');
      const id = generateId();
      const expiresAt = Math.floor(Date.now() / 1000) + 86400; // 24h
      await db.prepare(
        'INSERT INTO duels (id, colors_json, creator_nick, creator_score, creator_rounds, creator_personality, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).bind(id, JSON.stringify(colors), nickname.slice(0, 30), score,
        rounds ? JSON.stringify(rounds) : null, personality || null, expiresAt).run();
      return jsonResponse({ id, url: `${new URL(request.url).origin}/#/duel/${id}` });

    } else if (action === 'join') {
      const { duelId, nickname, score, rounds, personality } = body;
      if (!duelId || !nickname || score === undefined) return jsonError('Missing fields');
      const duel = await db.prepare('SELECT * FROM duels WHERE id = ?').bind(duelId).first();
      if (!duel) return jsonError('Duel not found', 404);
      if (duel.expires_at < Math.floor(Date.now() / 1000)) return jsonError('Duel expired', 410);
      await db.prepare(
        'INSERT INTO duel_entries (duel_id, nickname, score, rounds_json, personality) VALUES (?, ?, ?, ?, ?)'
      ).bind(duelId, nickname.slice(0, 30), score,
        rounds ? JSON.stringify(rounds) : null, personality || null).run();
      return await getDuelLeaderboard(db, duelId);

    } else {
      return jsonError('Unknown action');
    }
  } catch (err) {
    return jsonError(err.message, 500);
  }
}

export async function onRequestGet(context) {
  const { request, env } = context;
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const duelId = url.searchParams.get('id');
    const db = env.DB;
    if (!db) return jsonError('Database not configured', 500);
    await ensureSchema(db);

    if (action === 'get' && duelId) {
      const duel = await db.prepare('SELECT * FROM duels WHERE id = ?').bind(duelId).first();
      if (!duel) return jsonError('Duel not found', 404);
      if (duel.expires_at < Math.floor(Date.now() / 1000)) return jsonError('Duel expired', 410);
      return await getDuelLeaderboard(db, duelId);
    }

    return jsonError('Unknown action');
  } catch (err) {
    return jsonError(err.message, 500);
  }
}

async function getDuelLeaderboard(db, duelId) {
  const duel = await db.prepare('SELECT * FROM duels WHERE id = ?').bind(duelId).first();
  if (!duel) return jsonError('Duel not found', 404);

  const entries = await db.prepare(
    'SELECT nickname, score, personality FROM duel_entries WHERE duel_id = ? ORDER BY score DESC'
  ).bind(duelId).all();

  // Combine creator + entries into one sorted leaderboard
  const all = [
    { nickname: duel.creator_nick, score: duel.creator_score, personality: duel.creator_personality, isCreator: true },
    ...(entries.results || []).map(e => ({ ...e, isCreator: false })),
  ].sort((a, b) => b.score - a.score);

  return jsonResponse({
    id: duelId,
    colors: JSON.parse(duel.colors_json),
    totalPlayers: all.length,
    leaderboard: all.map((p, i) => ({ rank: i + 1, ...p })),
    expiresAt: duel.expires_at,
  });
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

function jsonError(msg, status = 400) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}
