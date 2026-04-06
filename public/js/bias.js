/**
 * DialIn — Bias Analysis
 */

function collectBiasData(original, guess) {
  const lab1 = hsbToLab(original.h, original.s, original.b);
  const lab2 = hsbToLab(guess.h, guess.s, guess.b);
  
  const shortAngleDist = (a, b) => ((b - a + 540) % 360) - 180;
  const getHueQuadrant = (h) => {
    if (h < 90) return 'red-yellow';
    if (h < 180) return 'yellow-green';
    if (h < 270) return 'green-blue';
    return 'blue-red';
  };
  
  return {
    hueError: shortAngleDist(original.h, guess.h),
    saturationError: guess.s - original.s,
    brightnessError: guess.b - original.b,
    chromaError: Math.sqrt(lab2.a**2 + lab2.b**2) - Math.sqrt(lab1.a**2 + lab1.b**2),
    hueQuadrant: getHueQuadrant(original.h),
    score: calculateScore(original, guess).score
  };
}

function analyzeColorBias(biasHistory) {
  if (biasHistory.length < 3) {
    return { status: 'insufficient', personality: { name: '🎨 探索中的调色师', desc: '继续玩来解锁你的色彩人格...' }};
  }

  const n = biasHistory.length;
  const avgSatErr = biasHistory.reduce((s, d) => s + d.saturationError, 0) / n;
  const avgBriErr = biasHistory.reduce((s, d) => s + d.brightnessError, 0) / n;
  const avgChromaErr = biasHistory.reduce((s, d) => s + d.chromaError, 0) / n;

  const personality = generatePersonality(avgSatErr, avgBriErr, avgChromaErr);
  
  return {
    status: 'ok',
    avgSatError: Math.round(avgSatErr * 10) / 10,
    avgBriError: Math.round(avgBriErr * 10) / 10,
    personality
  };
}

function generatePersonality(satErr, briErr, chromaErr) {
  const types = [
    { name: '🔥 烈焰调色师', desc: '你眼中的世界比实际更鲜艳明亮！', condition: satErr > 10 && briErr > 5 },
    { name: '🌫️ 迷雾诗人', desc: '你倾向于记住更柔和、朦胧的色调。', condition: satErr < -10 && briErr < -5 },
    { name: '💎 霓虹猎手', desc: '你喜欢浓烈但不明亮的颜色——深沉的宝石色调。', condition: satErr > 10 && briErr < -5 },
    { name: '🌙 月光画师', desc: '你记住的颜色总是偏亮偏淡，像月光下的世界。', condition: satErr < -5 && briErr > 10 },
    { name: '🎯 精准之眼', desc: '极其准确的色彩记忆，可能是天生的设计师！', condition: Math.abs(satErr) < 5 && Math.abs(briErr) < 5 },
    { name: '🎨 浪漫印象派', desc: '你对颜色的彩度感知独特，像印象派画家一样主观。', condition: Math.abs(chromaErr) > 8 }
  ];

  return types.find(t => t.condition) || { name: '🎨 探索中的调色师', desc: '你的色彩人格正在形成中...' };
}
