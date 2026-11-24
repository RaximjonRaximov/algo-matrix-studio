// ALGO MATRIX STUDIO // Core Engine
(function() {
  'use strict';

  // --- AUDIO SYNTHESIZER ---
  class AudioSynth {
    constructor() {
      this.ctx = null;
      this.enabled = true;
    }
    init() {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    }
    playTone(freq, duration = 0.04) {
      if (!this.enabled || !this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    }
    toggle() {
      this.enabled = !this.enabled;
      return this.enabled;
    }
  }

  const synth = new AudioSynth();
  const canvas = document.getElementById('main-canvas');
  const ctx = canvas.getContext('2d');

  let mode = 'path'; // 'path' or 'sort'
  let isRunning = false;
  let abortController = false;

  // --- RESIZE CANVAS ---
  function resize() {
    const stage = document.getElementById('stage');
    canvas.width = stage.clientWidth;
    canvas.height = stage.clientHeight;
    if (mode === 'path') initGrid();
    else if (mode === 'sort') renderSorting();
  }
  window.addEventListener('resize', resize);

  // ==========================================
  // PATHFINDING MODULE
  // ==========================================
  const ROWS = 28;
  const COLS = 50;
  let grid = [];
  let startNode = { r: 14, c: 8 };
  let endNode = { r: 14, c: 42 };
  let isMouseDown = false;

  function initGrid() {
    grid = [];
    for (let r = 0; r < ROWS; r++) {
      const row = [];
      for (let c = 0; c < COLS; c++) {
        row.push({
          r, c,
          isWall: false,
          isVisited: false,
          isPath: false,
          g: Infinity,
          h: 0,
          f: Infinity,
          parent: null
        });
      }
      grid.push(row);
    }
    renderPathfinding();
  }

  function renderPathfinding() {
    if (mode !== 'path') return;
    const cellW = canvas.width / COLS;
    const cellH = canvas.height / ROWS;

    ctx.fillStyle = '#06070e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const node = grid[r][c];
        const x = c * cellW;
        const y = r * cellH;

        if (r === startNode.r && c === startNode.c) {
          ctx.fillStyle = '#00ff66'; // Green Start
          ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2);
        } else if (r === endNode.r && c === endNode.c) {
          ctx.fillStyle = '#ff007f'; // Pink Target
          ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2);
        } else if (node.isPath) {
          ctx.fillStyle = '#ffee00'; // Shortest Path
          ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2);
        } else if (node.isVisited) {
          ctx.fillStyle = 'rgba(0, 243, 255, 0.45)'; // Visited Cyan
          ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2);
        } else if (node.isWall) {
          ctx.fillStyle = '#222738'; // Obstacle
          ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2);
        } else {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
          ctx.strokeRect(x, y, cellW, cellH);
        }
      }
    }
  }

  // Mouse interaction for drawing walls
  canvas.addEventListener('mousedown', e => {
    if (mode !== 'path' || isRunning) return;
    isMouseDown = true;
    handleGridClick(e);
  });
  window.addEventListener('mouseup', () => { isMouseDown = false; });
  canvas.addEventListener('mousemove', e => {
    if (isMouseDown && mode === 'path' && !isRunning) handleGridClick(e);
  });

  function handleGridClick(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const c = Math.floor((x / canvas.width) * COLS);
    const r = Math.floor((y / canvas.height) * ROWS);

    if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
      if ((r === startNode.r && c === startNode.c) || (r === endNode.r && c === endNode.c)) return;
      grid[r][c].isWall = true;
      renderPathfinding();
    }
  }

  async function runAStar() {
    const startTime = performance.now();
    const openSet = [grid[startNode.r][startNode.c]];
    const start = grid[startNode.r][startNode.c];
    start.g = 0;
    start.h = Math.hypot(startNode.r - endNode.r, startNode.c - endNode.c);
    start.f = start.h;

    let visitedCount = 0;
    const speed = 101 - Number(document.getElementById('slider-speed').value);

    while (openSet.length > 0) {
      if (abortController) break;

      // Find node with lowest f score
      let lowestIdx = 0;
      for (let i = 1; i < openSet.length; i++) {
        if (openSet[i].f < openSet[lowestIdx].f) lowestIdx = i;
      }
      const current = openSet.splice(lowestIdx, 1)[0];

      if (current.r === endNode.r && current.c === endNode.c) {
        // Trace back path
        let curr = current;
        let pathLength = 0;
        while (curr.parent) {
          curr.isPath = true;
          curr = curr.parent;
          pathLength++;
        }
        renderPathfinding();
        const duration = (performance.now() - startTime).toFixed(1);
        updateHUD('SOLVED', visitedCount, `${duration} ms`, 'Optimal O(E)');
        postBenchmark('A* Search', 'Pathfinding', duration, { visitedCount, pathLength });
        return;
      }

      current.isVisited = true;
      visitedCount++;
      synth.playTone(200 + (current.r * 15 + current.c * 8));

      // Neighbors (Up, Down, Left, Right)
      const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      for (const [dr, dc] of dirs) {
        const nr = current.r + dr;
        const nc = current.c + dc;
        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
          const neighbor = grid[nr][nc];
          if (!neighbor.isWall && !neighbor.isVisited) {
            const tentativeG = current.g + 1;
            if (tentativeG < neighbor.g) {
              neighbor.parent = current;
              neighbor.g = tentativeG;
              neighbor.h = Math.hypot(nr - endNode.r, nc - endNode.c);
              neighbor.f = neighbor.g + neighbor.h;
              if (!openSet.includes(neighbor)) openSet.push(neighbor);
            }
          }
        }
      }

      if (visitedCount % 3 === 0) {
        renderPathfinding();
        document.getElementById('metric-steps').textContent = visitedCount;
        await sleep(speed);
      }
    }

    updateHUD('NO PATH', visitedCount, `${(performance.now() - startTime).toFixed(1)} ms`, 'Exhausted');
  }

  // ==========================================
  // SORTING MODULE
  // ==========================================
  let sortArray = [];
  let sortHighlights = { active: -1, compare: -1 };

  function initSortArray() {
    const size = Number(document.getElementById('slider-size').value) || 50;
    sortArray = [];
    for (let i = 0; i < size; i++) {
      sortArray.push(Math.floor(Math.random() * 85) + 10);
    }
    sortHighlights = { active: -1, compare: -1 };
    renderSorting();
  }

  function renderSorting() {
    if (mode !== 'sort') return;
    ctx.fillStyle = '#06070e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const barW = canvas.width / sortArray.length;
    for (let i = 0; i < sortArray.length; i++) {
      const val = sortArray[i];
      const h = (val / 100) * (canvas.height - 40);
      const x = i * barW;
      const y = canvas.height - h;

      if (i === sortHighlights.active) {
        ctx.fillStyle = '#00ff66';
      } else if (i === sortHighlights.compare) {
        ctx.fillStyle = '#ff007f';
      } else {
        ctx.fillStyle = '#00f3ff';
      }
      ctx.fillRect(x + 1, y, barW - 2, h);
    }
  }

  async function runQuickSort(arr, low = 0, high = arr.length - 1) {
    if (low < high) {
      const pi = await partition(arr, low, high);
      await runQuickSort(arr, low, pi - 1);
      await runQuickSort(arr, pi + 1, high);
    }
  }

  async function partition(arr, low, high) {
    const pivot = arr[high];
    let i = low - 1;
    const speed = 101 - Number(document.getElementById('slider-speed').value);

    for (let j = low; j < high; j++) {
      if (abortController) return i + 1;
      sortHighlights.compare = j;
      sortHighlights.active = high;
      synth.playTone(150 + arr[j] * 8);

      if (arr[j] < pivot) {
        i++;
        [arr[i], arr[j]] = [arr[j], arr[i]];
        renderSorting();
        await sleep(speed);
      }
    }
    [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
    renderSorting();
    return i + 1;
  }

  // ==========================================
  // UTILITIES & HUD
  // ==========================================
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function updateHUD(status, steps, time, efficiency) {
    document.getElementById('metric-status').textContent = status;
    document.getElementById('metric-steps').textContent = steps;
    document.getElementById('metric-time').textContent = time;
    document.getElementById('metric-efficiency').textContent = efficiency;
  }

  async function postBenchmark(algorithm, type, timeMs, metrics) {
    try {
      await fetch('/api/benchmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ algorithm, type, timeMs, metrics })
      });
    } catch (_) {}
  }

  async function fetchBenchmarks() {
    const tbody = document.getElementById('benchmarks-table-body');
    tbody.innerHTML = '<tr><td colspan="5" class="center-text">Loading telemetry...</td></tr>';
    try {
      const res = await fetch('/api/benchmarks');
      const data = await res.json();
      tbody.innerHTML = '';
      data.benchmarks.forEach(b => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="color:#00f3ff">${b.algorithm}</td>
          <td>${b.type}</td>
          <td>${b.timeMs} ms</td>
          <td>${b.nodesVisited || b.operations || '--'}</td>
          <td style="color:#ffee00">${b.efficiency || 'O(N)'}</td>
        `;
        tbody.appendChild(tr);
      });
    } catch (err) {
      tbody.innerHTML = '<tr><td colspan="5" class="center-text">Failed to fetch telemetry.</td></tr>';
    }
  }

  // ==========================================
  // EVENT LISTENERS
  // ==========================================
  document.getElementById('tab-path').addEventListener('click', () => {
    mode = 'path';
    document.getElementById('tab-path').classList.add('active');
    document.getElementById('tab-sort').classList.remove('active');
    document.getElementById('path-controls').style.display = 'flex';
    document.getElementById('sort-controls').style.display = 'none';
    document.getElementById('canvas-overlay').textContent = 'Click & drag on grid to draw obstacles. Press EXECUTE to solve.';
    initGrid();
  });

  document.getElementById('tab-sort').addEventListener('click', () => {
    mode = 'sort';
    document.getElementById('tab-sort').classList.add('active');
    document.getElementById('tab-path').classList.remove('active');
    document.getElementById('sort-controls').style.display = 'flex';
    document.getElementById('path-controls').style.display = 'none';
    document.getElementById('canvas-overlay').textContent = 'Press EXECUTE to run sort simulation with audio harmonic feedback.';
    initSortArray();
  });

  document.getElementById('btn-run').addEventListener('click', async () => {
    synth.init();
    if (isRunning) return;
    isRunning = true;
    abortController = false;
    updateHUD('RUNNING', 0, '0.0 ms', 'In Progress');

    if (mode === 'path') {
      await runAStar();
    } else {
      const startTime = performance.now();
      await runQuickSort(sortArray);
      sortHighlights = { active: -1, compare: -1 };
      renderSorting();
      const dur = (performance.now() - startTime).toFixed(1);
      updateHUD('SORTED', sortArray.length, `${dur} ms`, 'O(N log N)');
      postBenchmark('QuickSort', 'Sorting', dur, { elements: sortArray.length });
    }
    isRunning = false;
  });

  document.getElementById('btn-reset').addEventListener('click', () => {
    abortController = true;
    isRunning = false;
    if (mode === 'path') initGrid();
    else initSortArray();
    updateHUD('READY', 0, '0.0 ms', '--');
  });

  document.getElementById('btn-generate-maze').addEventListener('click', () => {
    initGrid();
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (Math.random() < 0.28) {
          if ((r !== startNode.r || c !== startNode.c) && (r !== endNode.r || c !== endNode.c)) {
            grid[r][c].isWall = true;
          }
        }
      }
    }
    renderPathfinding();
  });

  document.getElementById('btn-clear-walls').addEventListener('click', () => {
    initGrid();
  });

  document.getElementById('btn-shuffle').addEventListener('click', () => {
    initSortArray();
  });

  document.getElementById('slider-size').addEventListener('input', () => {
    initSortArray();
  });

  document.getElementById('btn-audio').addEventListener('click', () => {
    synth.init();
    const on = synth.toggle();
    document.getElementById('btn-audio').textContent = on ? '🔊' : '🔇';
  });

  document.getElementById('btn-benchmarks').addEventListener('click', () => {
    document.getElementById('benchmarks-modal').classList.add('active');
    fetchBenchmarks();
  });

  document.getElementById('btn-close-modal').addEventListener('click', () => {
    document.getElementById('benchmarks-modal').classList.remove('active');
  });

  // Init
  resize();
  initGrid();
})();
