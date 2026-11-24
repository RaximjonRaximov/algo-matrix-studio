# ⚡ ALGO MATRIX STUDIO // Interactive Visualizer & Benchmark API

[![CI Pipeline](https://github.com/RaximjonRaximov/algo-matrix-studio/actions/workflows/ci.yml/badge.svg)](https://github.com/RaximjonRaximov/algo-matrix-studio/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)

> **ALGO MATRIX STUDIO** is an interactive, cyberpunk-inspired algorithm simulator and benchmark platform. Features dual visualization modes (Pathfinding + Sorting), real-time Web Audio sound synthesis, obstacle drawing, and an Express REST API with automated benchmark telemetry.

---

## 🌟 Key Features

- **🗺️ Pathfinding Engine:**
  - **A\* Search (Heuristic)** with Manhattan distance calculation.
  - **Dijkstra's Algorithm** for guaranteed shortest path verification.
  - Interactive grid canvas: draw walls, randomize labyrinths, adjust start/end nodes.
  - Step-by-step visual exploration and shortest-path trace animation.

- **📊 Sorting Array Engine:**
  - **QuickSort** (Dual-pointer partitioning with active comparison coloring).
  - Dynamic array size and speed sliders.
  - Audio pitch generator using Web Audio API: each array element plays a unique frequency based on its height.

- **⚡ REST Telemetry Backend:**
  - `GET /api/health` — Uptime check and telemetry.
  - `GET /api/presets` — Pre-configured community mazes and labyrinths.
  - `GET /api/benchmarks` — Performance rankings and execution times.
  - `POST /api/benchmarks` — Live submission of client simulation benchmark data.
  - `POST /api/mazes` — Save custom obstacle matrices.

- **🐳 Production Ready:**
  - Lightweight Alpine `Dockerfile`.
  - Zero-dependency automated test runner (`node:test`).
  - Automated CI pipeline with GitHub Actions.

---

## 🚀 Quick Start

### 1. Local Run

```bash
# Clone repository
git clone https://github.com/RaximjonRaximov/algo-matrix-studio.git
cd algo-matrix-studio

# Install dependencies
npm install

# Run test suite
npm test

# Start server
npm start
```

Visit **`http://localhost:3000`** in your browser.

---

### 2. Docker Run

```bash
docker build -t algo-matrix-studio .
docker run -d -p 3000:3000 --name algo-studio algo-matrix-studio
```

---

## 📄 License

MIT © [Raximjon Raximov](https://github.com/RaximjonRaximov)
