/**
 * DialIn — Share Card Generator
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

function generateShareCard(result) {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 400;
  const ctx = canvas.getContext('2d');
  
  const gradient = ctx.createLinearGradient(0, 0, 600, 400);
  gradient.addColorStop(0, '#0A0A0F');
  gradient.addColorStop(1, '#1A1A2E');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 600, 400);
  
  ctx.fillStyle = '#E0E0FF';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('🎨 DialIn', 30, 40);
  
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(30, 55);
  ctx.lineTo(570, 55);
  ctx.stroke();
  
  const blockSize = 50;
  const gap = 15;
  const startX = 30;
  const y1 = 80;
  const y2 = 145;
  
  result.rounds.forEach((round, i) => {
    const x = startX + i * (blockSize + gap);
    
    const rgbOrig = hsbToRgb(round.original.h, round.original.s, round.original.b);
    ctx.fillStyle = `rgb(${rgbOrig.r}, ${rgbOrig.g}, ${rgbOrig.b})`;
    roundRect(ctx, x, y1, blockSize, blockSize, 8);
    ctx.fill();
    
    const rgbGuess = hsbToRgb(round.guess.h, round.guess.s, round.guess.b);
    ctx.fillStyle = `rgb(${rgbGuess.r}, ${rgbGuess.g}, ${rgbGuess.b})`;
    roundRect(ctx, x, y2, blockSize, blockSize, 8);
    ctx.fill();
    
    const scoreColor = round.score >= 7 ? '#00FF88' : round.score >= 4 ? '#FFE500' : '#FF0066';
    ctx.fillStyle = scoreColor;
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(round.score.toFixed(1), x + blockSize / 2, 220);
  });
  
  const barY = 240;
  const barWidth = 540;
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  roundRect(ctx, 30, barY, barWidth, 12, 6);
  ctx.fill();
  
  const progress = result.totalScore / result.maxScore;
  const barColor = progress >= 0.7 ? '#00FF88' : progress >= 0.4 ? '#FFE500' : '#FF0066';
  ctx.fillStyle = barColor;
  roundRect(ctx, 30, barY, barWidth * progress, 12, 6);
  ctx.fill();
  
  ctx.fillStyle = '#E0E0FF';
  ctx.font = 'bold 20px monospace';
  ctx.textAlign = 'right';
  ctx.fillText(`${result.totalScore.toFixed(1)} / ${result.maxScore}`, 570, 280);
  
  if (result.personality) {
    ctx.fillStyle = '#00F0FF';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(result.personality.name, 30, 310);
  }
  
  const streak = result.streak ? `Day ${result.streak} 🔥` : '';
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'left';
  if (streak) ctx.fillText(streak, 30, 340);
  
  ctx.textAlign = 'right';
  ctx.font = '12px monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fillText(`dialin.cc | ${new Date().toISOString().slice(0,10)}`, 570, 380);
  
  return canvas.toDataURL('image/png');
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

async function shareResult(result) {
  const text = generateWordleText(result);

  // Mobile: try Web Share API
  if (navigator.share) {
    try {
      await navigator.share({ title: 'DialIn', text });
      return;
    } catch (e) { /* cancelled */ }
    return;
  }

  // Desktop: copy to clipboard
  try {
    await navigator.clipboard.writeText(text);
    DialIn.showToast('📋 Copied! Share it with your friends!');
  } catch (e) {
    // Last resort: download image
    const dataUrl = generateShareCard(result);
    const link = document.createElement('a');
    link.download = `dialin-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  }
}

function _showShareModal(text, dataUrl) {
  const existing = document.getElementById('share-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'share-modal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.85);padding:20px;';
  modal.innerHTML = `
    <div style="background:#1A1A2E;border:1px solid #2A2A3E;border-radius:12px;padding:20px;max-width:420px;width:100%;text-align:center;">
      <div style="font-family:'Orbitron',sans-serif;font-size:16px;color:#00F0FF;letter-spacing:2px;margin-bottom:16px;">SHARE YOUR SCORE</div>
      <img src="${dataUrl}" style="width:100%;max-width:400px;border-radius:8px;margin-bottom:12px;">
      <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">
        <button class="neon-btn neon-btn-cyan" style="flex:1;min-width:160px;" id="share-copy-btn">📋 Copy Text</button>
        <button class="neon-btn neon-btn-purple" style="flex:1;min-width:160px;" id="share-save-btn">💾 Save Image</button>
      </div>
      <div style="margin-top:8px;">
        <button class="neon-btn" style="width:100%;background:none;border:1px solid #2A2A3E;color:#6B7294;" id="share-close-btn">✕ Close</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // Button handlers
  document.getElementById('share-copy-btn').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(text);
      DialIn.showToast('📋 Copied!');
    } catch (e) { DialIn.showToast('Copy failed'); }
  });
  document.getElementById('share-save-btn').addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = `dialin-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  });
  document.getElementById('share-close-btn').addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
}
