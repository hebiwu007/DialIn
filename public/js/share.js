/**
 * DialIn — Share Text Generator
 */

function generateWordleText(result) {
  const blocks = result.rounds.map(r => {
    if (r.score >= 8) return '🟩';
    if (r.score >= 5) return '🟨';
    if (r.score >= 2) return '🟧';
    return '🟥';
  }).join('');

  const isZh = i18n.getLang() === 'zh';
  const nick = DialIn.getNickname() || (isZh ? '有人' : 'Someone');
  const score = `${result.totalScore.toFixed(1)}/${result.maxScore}`;
  const personality = result.personality?.name || '';
  const mode = result.mode || 'free';

  if (mode === 'daily') {
    const date = new Date().toISOString().slice(0, 10);
    const topPct = result.percentile ? ` · ${isZh ? '前' : 'Top '}${Math.round(100 - result.percentile)}%` : '';
    const lines = isZh ? [
      `☀ DialIn 每日挑战 — ${date}`,
      `${blocks}  ${score}`,
      personality ? `${personality}${topPct}` : '',
      `来挑战今天的颜色吧! 👇`,
      `https://dialin.cc`
    ] : [
      `☀ DialIn Daily — ${date}`,
      `${blocks}  ${score}`,
      personality ? `${personality}${topPct}` : '',
      `Challenge today's colors! 👇`,
      `https://dialin.cc`
    ];
    return lines.filter(Boolean).join('\n');
  }

  // Free play
  const lines = isZh ? [
    `🎨 DialIn — 色彩记忆游戏`,
    `${blocks}  ${score}`,
    personality ? personality : '',
    `${nick} 在玩这个游戏，来一起挑战! 👇`,
    `https://dialin.cc`
  ] : [
    `🎨 DialIn — Color Memory Game`,
    `${blocks}  ${score}`,
    personality ? personality : '',
    `${nick} is playing! Come join the challenge 👇`,
    `https://dialin.cc`
  ];
  return lines.filter(Boolean).join('\n');
}

// Reliable cross-browser copy
function _shareCopyText(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0;';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch (e) {}
  ta.remove();
  if (!ok && navigator.clipboard) {
    navigator.clipboard.writeText(text);
    ok = true;
  }
  return ok;
}

async function shareResult(result) {
  const text = generateWordleText(result);
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

  // Mobile: try Web Share API first (native share sheet)
  if (isMobile && navigator.share) {
    try {
      await navigator.share({ title: 'DialIn', text });
      return;
    } catch (e) {
      if (e.name === 'AbortError') return;
    }
  }

  // Desktop & fallback: copy text to clipboard
  const ok = _shareCopyText(text);
  const isZh = i18n.getLang() === 'zh';
  DialIn.showToast(ok
    ? (isZh ? '📋 已复制! 分享给朋友吧!' : '📋 Copied! Share with friends!')
    : (isZh ? '分享失败，请手动复制' : 'Copy failed'));
}
