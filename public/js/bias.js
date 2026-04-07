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
    return { status: 'insufficient', personality: { name: i18n.t('personalityExplorer.name'), desc: i18n.t('personalityExplorer.desc') }};
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
    { key: 'personalityFlame', condition: satErr > 10 && briErr > 5 },
    { key: 'personalityMist', condition: satErr < -10 && briErr < -5 },
    { key: 'personalityNeon', condition: satErr > 10 && briErr < -5 },
    { key: 'personalityMoon', condition: satErr < -5 && briErr > 10 },
    { key: 'personalityPrecise', condition: Math.abs(satErr) < 5 && Math.abs(briErr) < 5 },
    { key: 'personalityImpressionist', condition: Math.abs(chromaErr) > 8 }
  ];

  const match = types.find(t => t.condition);
  if (match) {
    return { name: i18n.t(match.key + '.name'), desc: i18n.t(match.key + '.desc') };
  }
  return { name: i18n.t('personalityExplorer.name'), desc: i18n.t('personalityExplorer.desc') };
}
