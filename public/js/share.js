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
  
  return `🎨 DialIn — ${result.mode}\n${blocks}  ${result.totalScore.toFixed(1)}/${result.maxScore}\n${result.personality?.name || ''}\ndialin.gg`;
}

function generateShareCard(result) {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 400;
  const ctx = canvas.getContext('2d');
  
  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, 600, 400);
  gradient.addColorStop(0, '#0A0A0F');
  gradient.addColorStop(1, '#1A1A2E');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 600, 400);
  
  // Title
  ctx.fillStyle = '#E0E0FF';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('🎨 DialIn', 30, 40);
  
  // Divider
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(30, 55);
  ctx.lineTo(570, 55);
  ctx.stroke();
  
  // Color pairs
  const blockSize = 50;
  const gap = 15;
  const startX = 30;
  const y1 = 80;
  const y2 = 145;
  
  result.rounds.forEach((round, i) => {
    const x = startX + i * (blockSize + gap);
    
    // Original
    const rgbOrig = hsbToRgb(round.original.h, round.original.s, round.original.b);
    ctx.fillStyle = `rgb(${rgbOrig.r}, ${rgbOrig.g}, ${rgbOrig.b})`;
    roundRect(ctx, x, y1, blockSize, blockSize, 8);
    ctx.fill();
    
    // Guess
    const rgbGuess = hsbToRgb(round.guess.h, round.guess.s, round.guess.b);
    ctx.fillStyle = `rgb(${rgbGuess.r}, ${rgbGuess.g}, ${rgbGuess.b})`;
    roundRect(ctx, x, y2, blockSize, blockSize, 8);
    ctx.fill();
    
    // Score
    const scoreColor = round.score >= 7 ? '#00FF88' : round.score >= 4 ? '#FFE500' : '#FF0066';
    ctx.fillStyle = scoreColor;
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(round.score.toFixed(1), x + blockSize / 2, 220);
  });
  
  // Total score bar
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
  
  // Total
  ctx.fillStyle = '#E0E0FF';
  ctx.font = 'bold 20px monospace';
  ctx.textAlign = 'right';
  ctx.fillText(`${result.totalScore.toFixed(1)} / ${result.maxScore}`, 570, 280);
  
  // Personality
  if (result.personality) {
    ctx.fillStyle = '#00F0FF';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(result.personality.name, 30, 310);
    
    if (result.percentile) {
      ctx.textAlign = 'right';
      ctx.fillStyle = '#6B7294';
      ctx.fillText(`Top ${100 - result.percentile}%`, 570, 310);
    }
  }
  
  // Streak + Rank
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'left';
  const streak = result.streak ? `Day ${result.streak} 🔥` : '';
  const rank = result.rank || '';
  ctx.fillText([streak, rank].filter(Boolean).join(' | '), 30, 340);
  
  // Watermark
  ctx.textAlign = 'right';
  ctx.font = '12px monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fillText(`dialin.gg | ${new Date().toISOString().slice(0,10)}`, 570, 380);
  
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
  // Try Web Share API first
  if (navigator.share) {
    const text = generateWordleText(result);
    try {
      await navigator.share({ title: 'DialIn', text });
      return;
    } catch (e) { /* fallback */ }
  }
  
  // Fallback: copy to clipboard
  const text = generateWordleText(result);
  try {
    await navigator.clipboard.writeText(text);
    DialIn.showToast('📋 Copied to clipboard!');
  } catch (e) {
    // Last resort: download card image
    const dataUrl = generateShareCard(result);
    const link = document.createElement('a');
    link.download = `dialin-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  }
}
