(() => {
  'use strict';

  // ---------- Config ----------
  // The screen's shorter side is fixed at 30 cells; cell size is derived
  // from that, and the longer side fills with however many cells fit.
  const SHORT_SIDE_CELLS = 30;
  const MAX_AGE = 40; // age at which a cell reaches its oldest color
  let CELL_SIZE = 32;
  let COLS = SHORT_SIDE_CELLS;
  let ROWS = 10;

  // ---------- State ----------
  // 0 = dead. 1..255 = alive, value is the cell's age in generations
  // (how many steps it has survived in a row). Color is derived from age.
  let grid = makeGrid(COLS, ROWS);
  let rule = parseRule('B3/S23'); // default: Conway's Game of Life
  let running = false;
  let generation = 0;
  let lastStepTime = 0;
  let stepsPerSecond = 10;
  let isPointerDown = false;
  let paintValue = 1; // 1 = draw alive, 0 = erase (decided on mousedown)

  // ---------- DOM ----------
  const canvas = document.getElementById('grid');
  const ctx = canvas.getContext('2d');
  const ruleInput = document.getElementById('rule-input');
  const ruleStatus = document.getElementById('rule-status');
  const playPauseBtn = document.getElementById('play-pause');
  const stepBtn = document.getElementById('step');
  const randomizeBtn = document.getElementById('randomize');
  const clearBtn = document.getElementById('clear');
  const speedSlider = document.getElementById('speed');
  const genCounter = document.getElementById('gen-counter');

  // ---------- Grid helpers ----------
  function makeGrid(cols, rows) {
    return new Uint8Array(cols * rows);
  }

  function idx(x, y) {
    return y * COLS + x;
  }

  function wrap(v, max) {
    return (v + max) % max;
  }

  function countNeighbors(g, x, y) {
    let count = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = wrap(x + dx, COLS);
        const ny = wrap(y + dy, ROWS);
        if (g[idx(nx, ny)] !== 0) count++;
      }
    }
    return count;
  }

  // Newborn cells are cool blue-violet; as a cell survives generation after
  // generation its color sweeps warmer, ending on hot red-orange at MAX_AGE.
  function ageColor(age) {
    const t = Math.min(age, MAX_AGE) / MAX_AGE;
    const hue = 235 - t * 235; // 235 (blue-violet) -> 0 (red)
    const light = 42 + t * 18; // young cells slightly dimmer, old cells brighter/hotter
    return `hsl(${hue.toFixed(0)}, 90%, ${light.toFixed(0)}%)`;
  }

  // ---------- Rule parsing: B[digits]/S[digits] ----------
  function parseRule(str) {
    const cleaned = str.trim().toUpperCase().replace(/\s+/g, '');
    const match = cleaned.match(/^B([0-8]*)\/S([0-8]*)$/);
    if (!match) return null;
    const born = new Set(match[1].split('').map(Number));
    const survive = new Set(match[2].split('').map(Number));
    return { born, survive, text: cleaned };
  }

  function applyRuleInput() {
    const parsed = parseRule(ruleInput.value);
    if (parsed) {
      rule = parsed;
      ruleInput.classList.remove('invalid');
      ruleStatus.textContent = '';
      ruleStatus.classList.remove('error');
    } else {
      ruleInput.classList.add('invalid');
      ruleStatus.textContent = 'Invalid rule — expected format like B3/S23';
      ruleStatus.classList.add('error');
    }
  }

  // ---------- Simulation ----------
  function step() {
    const next = makeGrid(COLS, ROWS);
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const current = grid[idx(x, y)];
        const alive = current !== 0;
        const n = countNeighbors(grid, x, y);
        let nextValue = 0;
        if (alive) {
          nextValue = rule.survive.has(n) ? Math.min(current + 1, 255) : 0;
        } else {
          nextValue = rule.born.has(n) ? 1 : 0;
        }
        next[idx(x, y)] = nextValue;
      }
    }
    grid = next;
    generation++;
    genCounter.textContent = `Gen ${generation}`;
    draw();
  }

  function randomize() {
    for (let i = 0; i < grid.length; i++) {
      grid[i] = Math.random() < 0.25 ? 1 : 0;
    }
    generation = 0;
    genCounter.textContent = `Gen ${generation}`;
    draw();
  }

  function clearGrid() {
    grid.fill(0);
    generation = 0;
    genCounter.textContent = `Gen ${generation}`;
    draw();
  }

  // ---------- Rendering ----------
  function resizeCanvas() {
    const shell = canvas.parentElement;
    const rect = shell.getBoundingClientRect();
    const availableWidth = Math.max(rect.width, 200);
    const availableHeight = Math.max(rect.height, 200);

    const shortSide = Math.min(availableWidth, availableHeight);
    const newCellSize = Math.max(4, Math.floor(shortSide / SHORT_SIDE_CELLS));

    const newCols = Math.max(5, Math.floor(availableWidth / newCellSize));
    const newRows = Math.max(5, Math.floor(availableHeight / newCellSize));

    if (newCellSize !== CELL_SIZE || newCols !== COLS || newRows !== ROWS) {
      CELL_SIZE = newCellSize;
      COLS = newCols;
      ROWS = newRows;
      grid = makeGrid(COLS, ROWS);
      generation = 0;
      genCounter.textContent = `Gen ${generation}`;
    }

    canvas.width = CELL_SIZE * COLS;
    canvas.height = CELL_SIZE * ROWS;
    draw();
  }

  function draw() {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const age = grid[idx(x, y)];
        if (age !== 0) {
          ctx.fillStyle = ageColor(age);
          ctx.fillRect(x * CELL_SIZE + 1, y * CELL_SIZE + 1, CELL_SIZE - 1, CELL_SIZE - 1);
        }
      }
    }

    // faint grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= COLS; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL_SIZE + 0.5, 0);
      ctx.lineTo(x * CELL_SIZE + 0.5, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= ROWS; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL_SIZE + 0.5);
      ctx.lineTo(canvas.width, y * CELL_SIZE + 0.5);
      ctx.stroke();
    }
  }

  // ---------- Playback loop ----------
  function loop(timestamp) {
    if (running) {
      const interval = 1000 / stepsPerSecond;
      if (timestamp - lastStepTime >= interval) {
        step();
        lastStepTime = timestamp;
      }
    }
    requestAnimationFrame(loop);
  }

  function setRunning(value) {
    running = value;
    playPauseBtn.setAttribute('aria-pressed', String(running));
    playPauseBtn.textContent = running ? '⏸ Pause' : '▶ Play';
  }

  // ---------- Pointer interaction ----------
  function cellFromEvent(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const x = Math.floor((clientX - rect.left) / CELL_SIZE);
    const y = Math.floor((clientY - rect.top) / CELL_SIZE);
    return { x, y };
  }

  function toggleCellAt(e, forcedValue) {
    const { x, y } = cellFromEvent(e);
    if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return;
    grid[idx(x, y)] = forcedValue !== undefined ? forcedValue : (grid[idx(x, y)] !== 0 ? 0 : 1);
    draw();
  }

  canvas.addEventListener('mousedown', (e) => {
    isPointerDown = true;
    const { x, y } = cellFromEvent(e);
    if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return;
    paintValue = grid[idx(x, y)] !== 0 ? 0 : 1;
    toggleCellAt(e, paintValue);
  });

  canvas.addEventListener('mousemove', (e) => {
    if (isPointerDown) toggleCellAt(e, paintValue);
  });

  window.addEventListener('mouseup', () => {
    isPointerDown = false;
  });

  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    isPointerDown = true;
    const { x, y } = cellFromEvent(e);
    if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return;
    paintValue = grid[idx(x, y)] !== 0 ? 0 : 1;
    toggleCellAt(e, paintValue);
  }, { passive: false });

  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (isPointerDown) toggleCellAt(e, paintValue);
  }, { passive: false });

  window.addEventListener('touchend', () => {
    isPointerDown = false;
  });

  // ---------- Controls ----------
  playPauseBtn.addEventListener('click', () => setRunning(!running));
  stepBtn.addEventListener('click', () => {
    if (running) setRunning(false);
    step();
  });
  randomizeBtn.addEventListener('click', () => {
    setRunning(false);
    randomize();
  });
  clearBtn.addEventListener('click', () => {
    setRunning(false);
    clearGrid();
  });

  ruleInput.addEventListener('input', applyRuleInput);

  speedSlider.addEventListener('input', () => {
    stepsPerSecond = Number(speedSlider.value);
  });

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resizeCanvas, 120);
  });

  // ---------- Init ----------
  stepsPerSecond = Number(speedSlider.value);
  resizeCanvas();
  setRunning(false); // start paused
  requestAnimationFrame(loop);
})();
