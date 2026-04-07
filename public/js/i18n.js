/**
 * DialIn — i18n v3
 */
const LANG = {
  en: {
    heroSubtitle: 'Dial In Your Colors',
    heroDesc: 'Remember colors. Recreate them. See how close you get.',
    modeFree: 'FREE DIAL', modeFreeSub: 'Solo Practice',
    modeDaily: 'DAILY DIAL', modeDailySub: "Today's Challenge",
    modeDuel: 'DUEL', modeDuelSub: 'Challenge Friends',
    hintRemember: 'Remember this color',
    hintRecreate: 'Recreate this color',
    labelHue: 'Color', labelSat: 'Vividness', labelBri: 'Brightness',
    labelOriginal: 'ORIGINAL', labelYours: 'YOURS',
    btnConfirm: '✓ CONFIRM', btnNext: 'NEXT →', btnSummary: 'SEE RESULTS →',
    btnShare: '📤 SHARE', btnChallenge: '⚔ CONTINUE', btnHome: '🏠 HOME',
    btnReset: '🔄 Switch User',
    summaryTitle: 'SUMMARY', outOf: 'out of {max}',
    dailyTitle: '☀ DAILY DIAL', dailyPlay: "▶ PLAY TODAY'S CHALLENGE",
    dailyPlayed: '✓ PLAYED — {score}/50', dailyScore: 'Your score',
    dailyEnterNick: 'ENTER NICKNAME', dailyNickPlaceholder: 'Your name',
    dailySubmitScore: 'SUBMIT TO LEADERBOARD',
    dailyLeaderboard: 'LEADERBOARD', dailyPlayers: 'players',
    dailyBeatPercent: 'Beat {pct}% of players!',
    dailyNoPlayers: 'No players yet today. Be the first!',
    alreadyPlayed: '✓ Already played today!',
    streakDay: 'Day {n} 🔥',
    levelUp: '⬆ LEVEL UP!', levelDown: '💡 LEVEL CHANGE',
    levelUpMsg: 'Great work! Keep it up!', levelDownMsg: 'Take it easy, you got this!',
    levelUpBtn: "Let's go!", levelDownBtn: 'Keep practicing',
    duelComing: 'Coming Soon',
    duelCreate: 'CREATE CHALLENGE', duelCreateSub: 'Play & share link',
    duelJoin: 'JOIN', duelInvalidCode: 'Invalid code',
    duelCreatedTitle: '⚔ CHALLENGE CREATED!', duelShareLink: 'Share this link:',
    duelCopyLink: '📋 COPY LINK', duelCopied: '✓ Link copied!',
    duelMethod1: '📤 Option 1: Share link',
    duelMethod2: '💬 Option 2: Tell your friend the code',
    duelCodeHint2: 'Your friend can enter this code on the Duel page to join',
    duelInvitesYou: 'invites you to a color challenge!',
    duelAccept: '▶ ACCEPT CHALLENGE',
    duelResultTitle: '⚔ BATTLE RESULT',
    duelLeaderboard: 'LEADERBOARD', duelTopScore: 'Top score',
    duelWins: 'wins', duelRematch: '🔄 REMATCH',
    langSwitch: '中文', langCode: 'en',
    footerPrivacy: 'Privacy', footerAbout: 'About',
    personalityExplorer: { name: '🎨 Explorer', desc: 'Your color personality is forming...' },
    personalityFlame: { name: '🔥 Flame Artist', desc: 'You remember colors brighter and more vivid!' },
    personalityMist: { name: '🌫️ Mist Poet', desc: 'You tend to remember softer, muted tones.' },
    personalityNeon: { name: '💎 Neon Hunter', desc: 'You prefer deep, saturated but not bright colors.' },
    personalityMoon: { name: '🌙 Moonlight Painter', desc: 'You remember colors lighter and paler.' },
    personalityPrecise: { name: '🎯 Precise Eye', desc: 'Extremely accurate color memory!' },
    personalityImpressionist: { name: '🎨 Impressionist', desc: 'Unique chroma perception.' },
  },
  zh: {
    heroSubtitle: '调校你的颜色',
    heroDesc: '记住颜色，复现颜色，看你能多接近。',
    modeFree: '自由练习', modeFreeSub: '单人模式',
    modeDaily: '每日挑战', modeDailySub: '全球同题',
    modeDuel: '对战', modeDuelSub: '挑战好友',
    hintRemember: '记住这个颜色',
    hintRecreate: '复现这个颜色',
    labelHue: '色调', labelSat: '鲜艳度', labelBri: '亮度',
    labelOriginal: '原始', labelYours: '我的',
    btnConfirm: '✓ 确认', btnNext: '下一个 →', btnSummary: '查看结果 →',
    btnShare: '📤 分享', btnChallenge: '⚔ 继续挑战', btnHome: '🏠 首页',
    btnReset: '🔄 切换用户',
    summaryTitle: '本轮总结', outOf: '满分 {max}',
    dailyTitle: '☀ 每日挑战', dailyPlay: '▶ 开始今日挑战',
    dailyPlayed: '✓ 已完成 — {score}/50', dailyScore: '你的成绩',
    dailyEnterNick: '输入昵称', dailyNickPlaceholder: '你的名字',
    dailySubmitScore: '提交到排行榜',
    dailyLeaderboard: '排行榜', dailyPlayers: '人参与',
    dailyBeatPercent: '打败了 {pct}% 的玩家！',
    dailyNoPlayers: '今天还没人玩，来当第一个！',
    alreadyPlayed: '✓ 今天已经玩过了',
    streakDay: '第{n}天 🔥',
    levelUp: '⬆ 升级了！', levelDown: '💡 难度调整',
    levelUpMsg: '做得好！继续加油！', levelDownMsg: '放松一下，你可以的！',
    levelUpBtn: '开始挑战', levelDownBtn: '继续练习',
    duelComing: '即将上线',
    duelCreate: '创建挑战', duelCreateSub: '玩完分享链接',
    duelJoin: '加入', duelInvalidCode: '无效的代码',
    duelCreatedTitle: '⚔ 挑战已创建！', duelShareLink: '分享这个链接：',
    duelCopyLink: '📋 复制链接', duelCopied: '✓ 已复制！',
    duelMethod1: '📤 方式一：分享链接',
    duelMethod2: '💬 方式二：告诉朋友挑战码',
    duelCodeHint2: '朋友在 Duel 页面输入这个码即可加入',
    duelInvitesYou: '邀请你参加颜色挑战！',
    duelAccept: '▶ 接受挑战',
    duelResultTitle: '⚔ 对战结果',
    duelLeaderboard: '排行榜', duelTopScore: '最高分',
    duelWins: '获胜', duelRematch: '🔄 再来一局',
    langSwitch: 'EN', langCode: 'zh',
    footerPrivacy: '隐私政策', footerAbout: '关于我们',
    personalityExplorer: { name: '🎨 探索中的调色师', desc: '你的色彩人格正在形成中...' },
    personalityFlame: { name: '🔥 烈焰调色师', desc: '你眼中的世界比实际更鲜艳明亮！' },
    personalityMist: { name: '🌫️ 迷雾诗人', desc: '你倾向于记住更柔和、朦胧的色调。' },
    personalityNeon: { name: '💎 霓虹猎手', desc: '你喜欢浓烈但不明亮的颜色。' },
    personalityMoon: { name: '🌙 月光画师', desc: '你记住的颜色总是偏亮偏淡。' },
    personalityPrecise: { name: '🎯 精准之眼', desc: '极其准确的色彩记忆！' },
    personalityImpressionist: { name: '🎨 浪漫印象派', desc: '你对颜色的彩度感知独特。' },
  }
};

const i18n = {
  currentLang: 'en',
  init() {
    this.currentLang = (localStorage.getItem('dialin_lang') || (navigator.language?.startsWith('zh') ? 'zh' : 'en'));
    this.apply();
  },
  toggle() { this.currentLang = this.currentLang === 'en' ? 'zh' : 'en'; localStorage.setItem('dialin_lang', this.currentLang); this.apply(); return this.currentLang; },
  t(key, params) {
    const parts = key.split('.');
    let val = LANG[this.currentLang];
    for (const p of parts) { if (val && typeof val === 'object' && p in val) val = val[p]; else if (val && val[p] !== undefined) val = val[p]; else return key; }
    if (typeof val === 'string' && params) Object.entries(params).forEach(([k,v]) => { val = val.replace(`{${k}}`, v); });
    return val;
  },
  getLang() { return this.currentLang; },
  apply() {
    const lang = this.currentLang;
    document.querySelectorAll('.lang-switch').forEach(e => e.textContent = LANG[lang].langSwitch);
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    // Apply all data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      const val = this.t(key);
      if (val && val !== key) el.textContent = val;
    });
  }
};
