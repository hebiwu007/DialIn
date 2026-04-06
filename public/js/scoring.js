/**
 * DialIn — Scoring Engine
 * CIEDE2000 Color Difference + S-Curve Scoring
 */

// ===== Color Space Conversions =====

function hsbToRgb(h, s, b) {
  s /= 100;
  b /= 100;
  const k = (n) => (n + h / 60) % 6;
  const f = (n) => b * (1 - s * Math.max(0, Math.min(k(n), 4 - k(n), 1)));
  return {
    r: Math.round(255 * f(5)),
    g: Math.round(255 * f(3)),
    b: Math.round(255 * f(1))
  };
}

function rgbToXyz(r, g, b) {
  const linearize = (c) => {
    c /= 255;
    return c > 0.04045 ? Math.pow((c + 0.055) / 1.055, 2.4) : c / 12.92;
  };
  const rl = linearize(r), gl = linearize(g), bl = linearize(b);
  return {
    x: rl * 0.4124564 + gl * 0.3575761 + bl * 0.1804375,
    y: rl * 0.2126729 + gl * 0.7151522 + bl * 0.0721750,
    z: rl * 0.0193339 + gl * 0.1191920 + bl * 0.9503041
  };
}

function xyzToLab(x, y, z) {
  const Xn = 0.95047, Yn = 1.0, Zn = 1.08883;
  const epsilon = 0.008856;
  const kappa = 903.3;
  const f = (t) => t > epsilon ? Math.cbrt(t) : (kappa * t + 16) / 116;
  const fx = f(x / Xn), fy = f(y / Yn), fz = f(z / Zn);
  return {
    L: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz)
  };
}

function hsbToLab(h, s, b) {
  const rgb = hsbToRgb(h, s, b);
  const xyz = rgbToXyz(rgb.r, rgb.g, rgb.b);
  return xyzToLab(xyz.x, xyz.y, xyz.z);
}

// ===== CIEDE2000 =====

function ciede2000(lab1, lab2) {
  const { L: L1, a: a1, b: b1 } = lab1;
  const { L: L2, a: a2, b: b2 } = lab2;

  const C1ab = Math.sqrt(a1 * a1 + b1 * b1);
  const C2ab = Math.sqrt(a2 * a2 + b2 * b2);
  const CabMean = (C1ab + C2ab) / 2;
  const G = 0.5 * (1 - Math.sqrt(Math.pow(CabMean, 7) / (Math.pow(CabMean, 7) + Math.pow(25, 7))));
  const a1p = a1 * (1 + G);
  const a2p = a2 * (1 + G);
  const C1p = Math.sqrt(a1p * a1p + b1 * b1);
  const C2p = Math.sqrt(a2p * a2p + b2 * b2);

  const h1pRaw = Math.atan2(b1, a1p);
  const h1p = (C1p === 0 ? 0 : h1pRaw * 180 / Math.PI + (h1pRaw < 0 ? 360 : 0));
  const h2pRaw = Math.atan2(b2, a2p);
  const h2p = (C2p === 0 ? 0 : h2pRaw * 180 / Math.PI + (h2pRaw < 0 ? 360 : 0));

  const dLp = L2 - L1;
  const dCp = C2p - C1p;

  let dhp;
  if (C1p * C2p === 0) {
    dhp = 0;
  } else if (Math.abs(h2p - h1p) <= 180) {
    dhp = h2p - h1p;
  } else if (h2p - h1p > 180) {
    dhp = h2p - h1p - 360;
  } else {
    dhp = h2p - h1p + 360;
  }
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin(dhp * Math.PI / 360);

  const LpMean = (L1 + L2) / 2;
  const CpMean = (C1p + C2p) / 2;

  let hpMean;
  if (C1p * C2p === 0) {
    hpMean = h1p + h2p;
  } else if (Math.abs(h1p - h2p) <= 180) {
    hpMean = (h1p + h2p) / 2;
  } else if (h1p + h2p < 360) {
    hpMean = (h1p + h2p + 360) / 2;
  } else {
    hpMean = (h1p + h2p - 360) / 2;
  }

  const T = 1 - 0.17 * Math.cos((hpMean - 30) * Math.PI / 180) +
            0.24 * Math.cos(2 * hpMean * Math.PI / 180) +
            0.32 * Math.cos((3 * hpMean + 6) * Math.PI / 180) -
            0.20 * Math.cos((4 * hpMean - 63) * Math.PI / 180);

  const SL = 1 + 0.015 * (LpMean - 50) * (LpMean - 50) /
             Math.sqrt(20 + (LpMean - 50) * (LpMean - 50));
  const SC = 1 + 0.045 * CpMean;
  const SH = 1 + 0.015 * CpMean * T;

  const dTheta = 30 * Math.PI / 180 * Math.exp(-Math.pow((hpMean - 275 / 180 * Math.PI * 180) / 25, 2));
  const RC = 2 * Math.sqrt(Math.pow(CpMean, 7) / (Math.pow(CpMean, 7) + Math.pow(25, 7)));
  const RT = -Math.sin(2 * dTheta) * RC;

  const dE = Math.sqrt(
    Math.pow(dLp / SL, 2) +
    Math.pow(dCp / SC, 2) +
    Math.pow(dHp / SH, 2) +
    RT * (dCp / SC) * (dHp / SH)
  );

  return dE;
}

// ===== S-Curve Scoring =====

function calculateScore(original, guess) {
  const lab1 = hsbToLab(original.h, original.s, original.b);
  const lab2 = hsbToLab(guess.h, guess.s, guess.b);
  const dE = ciede2000(lab1, lab2);

  // S-curve — tuned so 10.0 requires near-perfect match (dE < 2)
  // dE=0  → 10.0, dE=2 → 9.7, dE=5 → 8.5, dE=10 → 6.2, dE=20 → 2.8
  const MIDPOINT = 12;
  const STEEPNESS = 1.8;
  const score = 10 / (1 + Math.pow(dE / MIDPOINT, STEEPNESS));

  return {
    score: Math.round(score * 100) / 100,
    dE: Math.round(dE * 100) / 100,
    breakdown: {
      dE: Math.round(dE * 100) / 100,
      hueDiff: Math.round(Math.min(Math.abs(original.h - guess.h), 360 - Math.abs(original.h - guess.h)) * 10) / 10,
      satDiff: guess.s - original.s,
      brightDiff: guess.b - original.b
    }
  };
}
