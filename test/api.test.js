const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const app = require('../server.js');

let server;
let baseUrl;

test.before((t, done) => {
  server = http.createServer(app);
  server.listen(0, () => {
    baseUrl = `http://127.0.0.1:${server.address().port}`;
    done();
  });
});

test.after((t, done) => {
  server.close(done);
});

test('GET /api/health returns ok status', async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.status, 'ok');
  assert.equal(data.service, 'algo-matrix-studio-api');
});

test('GET /api/presets returns community labyrinth presets', async () => {
  const res = await fetch(`${baseUrl}/api/presets`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(Array.isArray(data.presets));
  assert.ok(data.presets.length >= 2);
});

test('POST /api/benchmarks saves algorithm metric record', async () => {
  const res = await fetch(`${baseUrl}/api/benchmarks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      algorithm: 'A* Search',
      type: 'Pathfinding',
      timeMs: 3.4,
      metrics: { nodesVisited: 45, pathLength: 12 }
    })
  });
  assert.equal(res.status, 201);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.entry.algorithm, 'A* Search');
});

test('POST /api/mazes saves custom obstacle layout', async () => {
  const res = await fetch(`${baseUrl}/api/mazes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Trench Maze',
      grid: [[0, 1], [1, 0]]
    })
  });
  assert.equal(res.status, 201);
  const data = await res.json();
  assert.ok(data.id);

  // Retrieve it
  const getRes = await fetch(`${baseUrl}/api/mazes/${data.id}`);
  assert.equal(getRes.status, 200);
  const mazeData = await getRes.json();
  assert.equal(mazeData.title, 'Trench Maze');
});
