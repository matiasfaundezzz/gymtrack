# 🏋️ GymTrack

A mobile-first progressive overload tracker built with React + Vite. Designed to help athletes log sets, track PRs, and visualize strength progress over time — without distractions.

![GymTrack Preview](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react) ![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat&logo=vite) ![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

- **Daily session logging** — quickly log sets, reps, and weight for any exercise
- **Progressive overload reference** — always shows your last session when logging, so you know exactly what to beat
- **Exercise library** — organize exercises by muscle group with color-coded tags
- **PR tracking** — automatic personal record detection per exercise
- **Progress charts** — sparkline chart showing max weight per session over time
- **Volume metrics** — total volume (kg × reps) per session
- **Weekly streak** — tracks how many weeks you've trained each exercise
- **Offline-ready** — all data persists in localStorage, no account needed

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 📦 Deploy to GitHub Pages

```bash
# One-time setup: update vite.config.js base with your repo name
# base: '/your-repo-name/'

npm run deploy
```

Your app will be live at `https://yourusername.github.io/gymtrack/`

## 🗂 Project Structure

```
gymtrack/
├── index.html          # Entry HTML
├── vite.config.js      # Vite config (base path for GH Pages)
├── src/
│   ├── main.jsx        # React root
│   ├── App.jsx         # Full application (screens + logic)
│   └── index.css       # Global reset + font imports
└── package.json
```

## 🛠 Tech Stack

| Tool | Purpose |
|------|---------|
| React 18 | UI & state management |
| Vite 5 | Build tool & dev server |
| localStorage | Data persistence (no backend needed) |
| SVG | Custom sparkline charts |
| gh-pages | GitHub Pages deployment |

## 📱 Design Decisions

- **Zero dependencies beyond React** — no UI library, charts library, or router. Keeps the bundle small and the code transparent.
- **localStorage only** — intentionally simple. No auth, no sync, no server. Your data stays on your device.
- **Mobile-first layout** — max-width 430px, touch-friendly tap targets, swipeable filter pills.
- **Muscle group color system** — each muscle group has a consistent accent color across tags, charts, and highlights.

## 🔮 Potential Improvements

- [ ] Export data as CSV/JSON
- [ ] Rest timer between sets
- [ ] Workout templates (push/pull/legs)
- [ ] PWA support for home screen install
- [ ] Cloud sync with Supabase or Firebase

## 📄 License

MIT — free to use, modify, and distribute.
