# DialIn 🎨

> Dial In Your Colors — A Cyberpunk Color Memory Game

**DialIn** is a cyberpunk-themed online color memory game where players memorize colors and recreate them using HSB sliders.

🔗 **Live Demo:** Coming Soon

## Features

- 🎮 **Free Dial** — Solo practice with progressive difficulty
- ☀️ **Daily Dial** — Global daily challenge with themed colors
- ⚔️ **DialIn Duel** — Real-time multiplayer battles
- 🧠 **Your Dial** — Personal color bias analysis & personality
- 🏆 **DialRank** — Bronze to Master ranking system
- 📤 **DialCard** — Share results like Wordle

## Tech Stack

- **Frontend:** HTML + Tailwind CSS + Vanilla JS
- **Backend:** Cloudflare Workers
- **Database:** Cloudflare D1 (SQLite)
- **Realtime:** Supabase (Duel mode)
- **Deploy:** Cloudflare Pages + Workers
- **Fonts:** Orbitron + Exo 2 (Google Fonts)

## Scoring

Uses **CIEDE2000** color difference algorithm (professional color science), not simple RGB comparison.

Pipeline: `HSB → RGB → XYZ → CIELAB → CIEDE2000 → S-Curve Score`

## Local Development

```bash
# Clone
git clone https://github.com/hebiwu007/DialIn.git
cd DialIn

# Install dependencies
npm install

# Run dev server
npm run dev

# Deploy to Cloudflare
npm run deploy
```

## Design Document

📄 [DialIn Detailed Design (Feishu)](https://feishu.cn/docx/EeJPdQDNTo93r1x4bXfcvn5Bnwe)

## License

MIT
