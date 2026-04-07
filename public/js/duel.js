/**
 * DialIn — Duel Mode (link-based multiplayer)
 */

const DUEL_API = '/api/duel';

function generateDuelColors() {
  const colors = [];
  for (let i = 0; i < 5; i++) {
    colors.push({
      h: Math.floor(Math.random() * 360),
      s: 20 + Math.floor(Math.random() * 80),
      b: 20 + Math.floor(Math.random() * 80),
    });
  }
  return colors;
}

async function createDuel(nickname, colors, score, rounds, personality) {
  try {
    const res = await fetch(DUEL_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create',
        nickname, colors, score, rounds, personality,
      }),
    });
    return await res.json();
  } catch (err) {
    console.error('Create duel failed:', err);
    return null;
  }
}

async function joinDuel(duelId, nickname, score, rounds, personality) {
  try {
    const res = await fetch(DUEL_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'join',
        duelId, nickname, score, rounds, personality,
      }),
    });
    return await res.json();
  } catch (err) {
    console.error('Join duel failed:', err);
    return null;
  }
}

async function fetchDuel(duelId) {
  try {
    const res = await fetch(`${DUEL_API}?action=get&id=${duelId}`);
    return await res.json();
  } catch (err) {
    console.error('Fetch duel failed:', err);
    return null;
  }
}

function copyToClipboard(text) {
  // Use textarea fallback — most reliable across mobile browsers
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0;';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try {
    document.execCommand('copy');
  } catch (e) {
    // Try clipboard API as fallback
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
  }
  ta.remove();
}
