const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// In-memory data store
const presets = [
  { id: 'spiral', name: 'Spiral Labyrinth', difficulty: 'Hard', recommendedAlgo: 'A*' },
  { id: 'random-dense', name: 'Dense Cluster (35% walls)', difficulty: 'Medium', recommendedAlgo: 'Dijkstra' },
  { id: 'choke-point', name: 'Dual Choke Trench', difficulty: 'Easy', recommendedAlgo: 'BFS' }
];

const benchmarks = [
  { id: 'bm_1', algorithm: 'A* Search', type: 'Pathfinding', nodesVisited: 142, timeMs: 4.8, pathLength: 58, efficiency: 'Optimal' },
  { id: 'bm_2', algorithm: 'Dijkstra', type: 'Pathfinding', nodesVisited: 480, timeMs: 12.3, pathLength: 58, efficiency: 'Guaranteed' },
  { id: 'bm_3', algorithm: 'QuickSort', type: 'Sorting', operations: 620, timeMs: 1.9, elements: 100, efficiency: 'O(N log N)' },
  { id: 'bm_4', algorithm: 'MergeSort', type: 'Sorting', operations: 672, timeMs: 2.1, elements: 100, efficiency: 'O(N log N)' }
];

const savedMazes = new Map();

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'algo-matrix-studio-api',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

// Presets
app.get('/api/presets', (req, res) => {
  res.json({ count: presets.length, presets });
});

// Benchmarks list
app.get('/api/benchmarks', (req, res) => {
  const type = req.query.type;
  let filtered = benchmarks;
  if (type) {
    filtered = benchmarks.filter(b => b.type.toLowerCase() === type.toLowerCase());
  }
  res.json({ count: filtered.length, benchmarks: filtered });
});

// Submit benchmark
app.post('/api/benchmarks', (req, res) => {
  const { algorithm, type, timeMs, metrics } = req.body || {};

  if (!algorithm || typeof algorithm !== 'string') {
    return res.status(400).json({ error: 'Valid algorithm name required.' });
  }

  const newEntry = {
    id: `bm_${Date.now()}`,
    algorithm: algorithm.trim().slice(0, 30),
    type: type || 'Custom',
    timeMs: Number(timeMs) || 0,
    metrics: metrics || {},
    createdAt: new Date().toISOString()
  };

  benchmarks.unshift(newEntry);
  if (benchmarks.length > 50) benchmarks.pop();

  res.status(201).json({ success: true, entry: newEntry });
});

// Custom maze saving
app.post('/api/mazes', (req, res) => {
  const { title, grid } = req.body || {};
  if (!title || !grid || !Array.isArray(grid)) {
    return res.status(400).json({ error: 'Title and grid matrix are required.' });
  }

  const id = `maze_${Date.now().toString(36)}`;
  const maze = {
    id,
    title: String(title).slice(0, 40),
    grid,
    createdAt: new Date().toISOString()
  };

  savedMazes.set(id, maze);
  res.status(201).json({ success: true, id, message: 'Maze persisted' });
});

app.get('/api/mazes/:id', (req, res) => {
  const maze = savedMazes.get(req.params.id);
  if (!maze) {
    return res.status(404).json({ error: 'Maze not found' });
  }
  res.json(maze);
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[AlgoMatrix Studio] Running at http://localhost:${PORT}`);
  });
}

module.exports = app;
