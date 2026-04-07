---
title: "I Built a Cyberpunk Color Memory Game — Here's How It Works"
published: true
description: "DialIn is a color memory game with CIEDE2000 scoring, Daily challenges, and real-time Duels. Built with vanilla JS on Cloudflare."
tags: javascript, webdev, gamedev, cloudflare
cover_image: https://dialin.cc
series: "Building DialIn"
---

I've always been fascinated by how differently people perceive color. So I built **[DialIn](https://dialin.cc)** — a cyberpunk-themed color memory game that tests your ability to remember and reproduce colors.

![DialIn gameplay](https://dialin.cc)

## How It Works

The concept is deceptively simple:

1. **See** a color flashed on screen
2. **Remember** it
3. **Recreate** it using a color picker
4. **Get scored** on how close your guess is

You play 5 rounds per game. The better you score, the higher your level climbs. Struggle too much? You drop down. It's addictive in that "just one more try" kind of way.

## The Scoring System

This is where it gets interesting. I didn't want a simple "close or far" metric. I used **CIEDE2000** — the same color difference algorithm used in professional color science.

The scoring formula is an S-curve:

```javascript
score = 10 / (1 + (deltaE / 25.25) ** 1.55)
```

Where `deltaE` is the CIEDE2000 color difference between the original and your guess. This means:

- **deltaE < 5** → You get 8-10 points (excellent match)
- **deltaE ~ 25** → You get ~5 points (decent)
- **deltaE > 50** → You get 1-2 points (way off)

There's also a **hue bonus** — if your hue is within 30° of the original, you get an extra 0.5 points. This rewards getting the "right color" even if saturation or brightness is off.

## Game Modes

### 🎨 Free Play
Practice anytime, 5 rounds, automatic difficulty scaling through 5 levels. Higher levels introduce distractor colors to mess with your memory.

### ☀️ Daily Challenge
Everyone gets the **same 5 colors** each day. Compete on a global leaderboard. Come back daily to build your streak.

### ⚔️ Color Duel
Challenge a friend! Create a duel, share the link or a 6-character code. Both players face the same colors and compare scores.

## Color Personality

After each game, you get assigned a "color personality" based on your bias patterns:

| Type | Description |
|------|-------------|
| 🎯 Precision Eye | Near-perfect color memory |
| 🌈 Color Dreamer | Tends toward more vivid, saturated colors |
| 🌙 Shadow Watcher | Prefers darker shades |
| ☀️ Light Chaser | Draws toward brighter tones |
| 🔥 Warm Soul | Biased toward warm hues |
| 🧊 Cool Mind | Leans toward cool hues |
| 🎲 Free Spirit | No consistent pattern — unpredictable! |

It tracks your bias history across games, so your personality evolves as you play.

## Tech Stack

I deliberately kept it simple:

- **Frontend:** Vanilla HTML + CSS + JavaScript (no framework)
- **Styling:** CSS custom properties + Tailwind-inspired utility classes
- **Scoring:** CIEDE2000 implemented in pure JS
- **Backend:** Cloudflare Workers (API routes)
- **Database:** Cloudflare D1 (SQLite) for Daily leaderboard
- **Hosting:** Cloudflare Pages
- **Domain:** dialin.cc

The entire frontend is **under 50KB** (unminified). No build step, no bundler, no `node_modules`. Just files served directly.

### Why No Framework?

For a game like this, the DOM interactions are straightforward — show/hide sections, update scores, render color blocks. A framework would add complexity without clear benefit. The codebase is clean enough that vanilla JS is actually easier to reason about.

## Design Choices

### Cyberpunk Aesthetic

The dark theme uses CSS custom properties with neon accents (cyan, pink, purple). There's a Matrix-rain background effect and scanline overlay. The light theme is available for those who prefer it.

### Mobile-First

The game works equally well on phone and desktop. On mobile, the nav bar collapses to a "⋯" menu. Touch-friendly color picker with large hit targets.

### i18n

Full English and Chinese support. Language detection from `navigator.language`, with manual toggle.

## What I Learned

### 1. `navigator.share` Is Not Mobile-Only
Desktop Chrome now supports the Web Share API. If you're using it to detect mobile, you'll have a bad time. Use `userAgent` or `matchMedia` instead.

### 2. Clipboard API Is Unreliable in Embedded Browsers
WeChat, Feishu, and other embedded browsers don't support `navigator.clipboard`. The old-school `textarea + document.execCommand('copy')` is still the most reliable cross-browser copy method.

### 3. CIEDE2000 Is Worth It
Simple RGB distance produces weird results — colors that look similar to humans score poorly, and vice versa. CIEDE2000 actually matches human perception. The math is complex but there are good JS implementations available.

### 4. Cloudflare Pages + D1 Is a Sweet Spot
For a small project like this, having a SQLite database at the edge with zero configuration is amazing. The Workers API routes are just JavaScript functions.

## What's Next

- [ ] More detailed stats and progress tracking
- [ ] Duel tournament mode
- [ ] Custom color themes
- [ ] Accessibility improvements (colorblind mode?)

## Try It

**[dialin.cc](https://dialin.cc)** — No signup required, works on any device.

I'd love to hear your feedback! What's your color personality? 🎨

---

*Follow me on [X/Twitter](https://x.com/billy_He007) for updates.*
