let WORLD_SIZE = 360;
const WORLD_SIZE_MIN = 40;
const WORLD_SIZE_MAX = 400;
const WORLD_SIZE_DEFAULT = 360;
const PARTICLE_RADIUS = 0.8;
const SIMULATION_SPEED = 0.5;
const INTERACTION_RANGE = 52;
const CLOSE_REPULSION_RANGE = PARTICLE_RADIUS * 3.6;
const GLOBAL_FRICTION = 0.975;
const MOVE_TOWARD_FORCE = 3.2;
const SURROUND_FORCE = 2.6;
const EAT_FORCE = 4.1;
const EAT_RADIUS = 2.1;
const CONDITION_NEAR_RANGE = 12;
const MAX_PARTICLES = 50000;
const SURROUND_RADIUS = 7.5;
const MULTI_SURROUND_GROUP_RANGE = INTERACTION_RANGE;
const MULTI_SURROUND_RADIUS_PADDING = 2.6;
const MULTI_SURROUND_MIN_RADIUS = 9.5;
const MULTI_SURROUND_INNER_CLEARANCE = PARTICLE_RADIUS * 3.2;
const MULTI_SURROUND_WALL_PARTICLE_SPACING = PARTICLE_RADIUS * 2.45;
const MULTI_SURROUND_WALL_SPACING_FORCE = 1.8;
const MULTI_SURROUND_TARGET_COHESION_FORCE = 1.5;
const POSSESSION_MANUAL_FORCE = 4.4;
const POSSESSION_KILL_RANGE = PARTICLE_RADIUS * 3.2;
const MATRIX_INTERACTION_RANGE = INTERACTION_RANGE;
const MATRIX_CLOSE_RANGE_FRACTION = 0.045;
const MATRIX_FORCE = 3;
const MATRIX_MAX_SPEED = 4.5;
const MOVEMENT_ACTIONS = new Set(["moveToward", "surround", "eat"]);
const ACTION_OPTIONS = [
  { value: "moveToward", label: "move toward" },
  { value: "surround", label: "surround" },
  { value: "eat", label: "eat (kill)" },
  { value: "spawn", label: "spawn (make copy of self)" },
];
const STRENGTH_MIN = -1;
const STRENGTH_MAX = 1;
const STRENGTH_STEP = 0.1;
const STRENGTH_DEFAULT = 1;
const COLORS = [
  { value: "red", label: "Red", fill: "#ff4a4a" },
  { value: "orange", label: "Orange", fill: "#ff9b42" },
  { value: "yellow", label: "Yellow", fill: "#ffd84a" },
  { value: "green", label: "Green", fill: "#50df67" },
  { value: "blue", label: "Blue", fill: "#53a7ff" },
  { value: "purple", label: "Purple", fill: "#b773ff" },
  { value: "pink", label: "Pink", fill: "#ff74bf" },
  { value: "brown", label: "Brown", fill: "#9c6a42" },
  { value: "white", label: "White", fill: "#f4f4ef" },
];
const CONDITION_TYPE_OPTIONS = [
  { value: "buttonPressed", label: "button # pressed" },
  { value: "buttonReleased", label: "button # released" },
  { value: "switchOn", label: "switch # on" },
  { value: "switchOff", label: "switch # off" },
  { value: "nearColor", label: "near particle of color" },
  { value: "touching", label: "touching" },
];
const IO_CONDITION_TYPES = new Set(["buttonPressed", "buttonReleased", "switchOn", "switchOff"]);
const IO_COUNT = 8;
const IO_NUMBER_OPTIONS = Array.from({ length: IO_COUNT }, (_, index) => {
  const number = String(index + 1);
  return { value: number, label: number };
});
const CONDITION_OPERATOR_OPTIONS = [
  { value: "and", label: "AND" },
  { value: "or", label: "OR" },
];

const refs = {
  addScriptBtn: document.getElementById("addScriptBtn"),
  scriptsList: document.getElementById("scriptsList"),
  buttonInputsList: document.getElementById("buttonInputsList"),
  switchInputsList: document.getElementById("switchInputsList"),
  exportCodeBtn: document.getElementById("exportCodeBtn"),
  importCodeBtn: document.getElementById("importCodeBtn"),
  importCodeInput: document.getElementById("importCodeInput"),
  exportCodeOutput: document.getElementById("exportCodeOutput"),
  resetCounts: document.getElementById("resetCounts"),
  worldCanvas: document.getElementById("worldCanvas"),
  worldCanvasWrap: document.getElementById("worldCanvasWrap"),
  worldPanel: document.getElementById("worldPanel"),
  multiSurroundToggle: document.getElementById("multiSurroundToggle"),
  disableSideWarpToggle: document.getElementById("disableSideWarpToggle"),
  useMatrixToggle: document.getElementById("useMatrixToggle"),
  randomRunToggle: document.getElementById("randomRunToggle"),
  randomiseBtn: document.getElementById("randomiseBtn"),
  maxSurroundPerParticleInput: document.getElementById("maxSurroundPerParticleInput"),
  maxSurroundPerGroupInput: document.getElementById("maxSurroundPerGroupInput"),
  pauseBtn: document.getElementById("pauseBtn"),
  resetBtn: document.getElementById("resetBtn"),
  fullscreenWorldBtn: document.getElementById("fullscreenWorldBtn"),
  particleCount: document.getElementById("particleCount"),
  scriptCount: document.getElementById("scriptCount"),
  playState: document.getElementById("playState"),
  infoExitFullscreenBtn: document.getElementById("infoExitFullscreenBtn"),
  selectedParticle: document.getElementById("selectedParticle"),
  selfTestOutput: document.getElementById("selfTestOutput"),
  matrixActiveNotice: document.getElementById("matrixActiveNotice"),
  worldSizeInput: document.getElementById("worldSizeInput"),
  worldSizeLabel: document.getElementById("worldSizeLabel"),
  colorCountsList: document.getElementById("colorCountsList"),
};

const state = {
  ctx: null,
  renderScale: 1,
  particles: [],
  scripts: [],
  buttons: Object.fromEntries(Array.from({ length: IO_COUNT }, (_, index) => [index + 1, false])),
  switches: Object.fromEntries(Array.from({ length: IO_COUNT }, (_, index) => [index + 1, false])),
  resetCounts: {
    red: 1,
    orange: 0,
    yellow: 0,
    green: 1,
    blue: 0,
    purple: 0,
    pink: 0,
    brown: 0,
    white: 0,
  },
  paused: false,
  fullscreenWorld: false,
  multiSurround: false,
  disableSideWarp: false,
  useMatrix: false,
  maxSurroundPerParticle: 0,
  maxSurroundPerGroup: 0,
  selectedParticleId: null,
  possessedParticleId: null,
  possessionScriptEnabled: {},
  possessionKillTouchingOnF: false,
  pressedKeys: new Set(),
  nextParticleId: 1,
  lastFrame: performance.now(),
  matrixInputsGrid: [],
};

initialize();

function initialize() {
  applyQueryConfig();
  setWorldSize(WORLD_SIZE);
  state.ctx = setupCanvasContext(refs.worldCanvas, WORLD_SIZE, WORLD_SIZE);
  state.matrixInputsGrid = buildMatrixInputsGrid();
  state.useMatrix = Boolean(refs.useMatrixToggle?.checked);
  applyMatrixControlsEnabled();
  resetWorld();
  bindEvents();
  renderScripts();
  renderResetCounts();
  renderButtonInputs();
  renderSwitchInputs();
  refs.infoExitFullscreenBtn.hidden = true;
  updateHud();
  maybeRunSelfTest();
  requestAnimationFrame(loop);
}

function bindEvents() {
  refs.addScriptBtn.addEventListener("click", () => {
    state.scripts.push(createScript());
    renderScripts();
    updateHud();
  });

  refs.pauseBtn.addEventListener("click", togglePause);
  refs.resetBtn.addEventListener("click", resetWorld);
  refs.fullscreenWorldBtn.addEventListener("click", toggleWorldFullscreen);
  refs.exportCodeBtn.addEventListener("click", exportConfigCode);
  refs.importCodeBtn.addEventListener("click", importConfigCode);
  refs.randomiseBtn?.addEventListener("click", () => {
    if (!state.useMatrix) return;
    randomiseMatrixInputs();
  });
  refs.multiSurroundToggle.addEventListener("change", (event) => {
    state.multiSurround = event.target.checked;
  });
  refs.worldSizeInput?.addEventListener("change", (event) => {
    setWorldSize(event.target.value);
  });
  refs.disableSideWarpToggle?.addEventListener("change", (event) => {
    state.disableSideWarp = event.target.checked;
  });
  refs.useMatrixToggle?.addEventListener("change", (event) => {
    state.useMatrix = event.target.checked;
    applyMatrixControlsEnabled();
  });
  refs.maxSurroundPerParticleInput.addEventListener("change", (event) => {
    state.maxSurroundPerParticle = clampInt(event.target.value, 0, MAX_PARTICLES, 0);
    refs.maxSurroundPerParticleInput.value = String(state.maxSurroundPerParticle);
  });
  refs.maxSurroundPerGroupInput.addEventListener("change", (event) => {
    state.maxSurroundPerGroup = clampInt(event.target.value, 0, MAX_PARTICLES, 0);
    refs.maxSurroundPerGroupInput.value = String(state.maxSurroundPerGroup);
  });
  document.querySelectorAll(".matrix-input").forEach((input) => {
    input.addEventListener("change", () => normalizeMatrixInput(input));
  });
  refs.infoExitFullscreenBtn.addEventListener("click", () => {
    if (!state.fullscreenWorld) return;
    toggleWorldFullscreen();
  });
  refs.worldCanvas.addEventListener("click", handleCanvasPick);
  window.addEventListener("resize", handleResize);
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);
  window.addEventListener("blur", () => state.pressedKeys.clear());
}

function setupCanvasContext(canvas, width, height) {
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  const displayWidth = Math.max(1, Math.round(rect.width || canvas.clientWidth || 600));
  const displayHeight = Math.max(1, Math.round(rect.height || canvas.clientHeight || displayWidth));
  canvas.width = displayWidth * ratio;
  canvas.height = displayHeight * ratio;
  const ctx = canvas.getContext("2d");
  state.renderScale = Math.min(displayWidth / width, displayHeight / height);
  ctx.setTransform(ratio * state.renderScale, 0, 0, ratio * state.renderScale, 0, 0);
  ctx.imageSmoothingEnabled = true;
  return ctx;
}

function setWorldSize(rawValue) {
  const previousSize = WORLD_SIZE;
  const nextSize = clampInt(rawValue, WORLD_SIZE_MIN, WORLD_SIZE_MAX, WORLD_SIZE);

  if (refs.worldSizeInput) refs.worldSizeInput.value = String(nextSize);
  if (refs.worldSizeLabel) refs.worldSizeLabel.textContent = `${nextSize} x ${nextSize} square units`;

  if (nextSize === previousSize) return;

  // Rescale existing particles proportionally so their relative layout is preserved
  // instead of being clamped/wrapped into an arbitrary new spot.
  const scale = nextSize / previousSize;
  WORLD_SIZE = nextSize;
  state.particles.forEach((particle) => {
    particle.x = placeCoordinate(particle.x * scale);
    particle.y = placeCoordinate(particle.y * scale);
  });

  state.ctx = setupCanvasContext(refs.worldCanvas, WORLD_SIZE, WORLD_SIZE);
}

function renderColorCounts() {
  if (!refs.colorCountsList) return;

  const counts = {};
  COLORS.forEach((color) => {
    counts[color.value] = 0;
  });
  state.particles.forEach((particle) => {
    if (counts[particle.color] !== undefined) counts[particle.color] += 1;
  });

  if (refs.colorCountsList.childElementCount !== COLORS.length) {
    refs.colorCountsList.innerHTML = "";
    COLORS.forEach((color) => {
      const item = document.createElement("div");
      item.className = "color-count-item";
      item.dataset.color = color.value;

      const dot = document.createElement("span");
      dot.className = `color-dot ${color.value}`;

      const text = document.createElement("span");
      text.className = "color-count-value";
      text.textContent = `${color.label}: ${counts[color.value]}`;

      item.append(dot, text);
      refs.colorCountsList.appendChild(item);
    });
    return;
  }

  COLORS.forEach((color) => {
    const text = refs.colorCountsList.querySelector(`[data-color="${color.value}"] .color-count-value`);
    if (text) text.textContent = `${color.label}: ${counts[color.value]}`;
  });
}

function createScript() {
  return {
    id: `script-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    sourceColor: "red",
    action: "moveToward",
    strength: STRENGTH_DEFAULT,
    targetColor: "green",
    spawnColor: "red",
    spawnCount: 1,
    conditions: [],
  };
}

function resetWorld() {
  const previousSelectedParticleId = state.selectedParticleId;
  const previousPossessedParticleId = state.possessedParticleId;
  if (state.useMatrix && refs.randomRunToggle?.checked) {
    randomiseMatrixInputs();
  }
  state.nextParticleId = 1;
  const initialParticles = buildResetParticles();

  state.particles = initialParticles.map((particle) => ({
    id: state.nextParticleId++,
    color: particle.color,
    x: particle.x,
    y: particle.y,
    vx: particle.vx,
    vy: particle.vy,
    heading: Math.atan2(particle.vy, particle.vx),
    spawnCooldown: particle.spawnCooldown || 0,
    eatCooldown: particle.eatCooldown || 0,
  }));
  stabilizeResetState();
  state.particles.forEach((particle) => {
    particle.vx = 0;
    particle.vy = 0;
    particle.heading = 0;
  });
  state.selectedParticleId = state.particles.some((particle) => particle.id === previousSelectedParticleId)
    ? previousSelectedParticleId
    : null;
  state.possessedParticleId = state.particles.some((particle) => particle.id === previousPossessedParticleId)
    ? previousPossessedParticleId
    : null;
  const possessedParticle = state.particles.find((particle) => particle.id === state.possessedParticleId);
  if (possessedParticle) {
    seedPossessionScriptSettings(possessedParticle);
  }
  state.pressedKeys.clear();
  state.lastFrame = performance.now();
  updateHud();
  renderSelectedParticle();
}

function renderScripts() {
  refs.scriptsList.innerHTML = "";

  if (state.scripts.length === 0) {
    const empty = document.createElement("div");
    empty.className = "notes-box";
    empty.innerHTML =
      '<p class="microcopy">No scripts yet. Add one to connect colors, like <strong>green surround red</strong> or <strong>red eat green</strong>.</p>';
    refs.scriptsList.appendChild(empty);
    return;
  }

  state.scripts.forEach((script) => {
    const card = document.createElement("div");
    card.className = "rule-card";

    const sourceField = document.createElement("label");
    sourceField.textContent = "Particle";
    const sourceSelect = buildColorSelect(script.sourceColor);
    sourceSelect.addEventListener("change", (event) => {
      script.sourceColor = event.target.value;
      renderSelectedParticle();
    });
    sourceField.appendChild(sourceSelect);

    const actionField = document.createElement("label");
    actionField.textContent = "Action";
    const actionSelect = document.createElement("select");
    ACTION_OPTIONS.forEach((option) => {
      actionSelect.appendChild(createOption(option.value, option.label, script.action));
    });
    actionSelect.addEventListener("change", (event) => {
      script.action = event.target.value;
      renderScripts();
      renderSelectedParticle();
    });
    actionField.appendChild(actionSelect);

    const strengthField = document.createElement("label");
    strengthField.textContent = "Strength (-1 to 1)";
    const strengthInput = document.createElement("input");
    strengthInput.type = "number";
    strengthInput.min = String(STRENGTH_MIN);
    strengthInput.max = String(STRENGTH_MAX);
    strengthInput.step = String(STRENGTH_STEP);
    strengthInput.value = String(getScriptStrength(script));
    strengthInput.addEventListener("change", (event) => {
      script.strength = clampStrength(event.target.value);
      strengthInput.value = String(script.strength);
    });
    strengthField.appendChild(strengthInput);

    const targetField = document.createElement("label");
    targetField.textContent = script.action === "spawn" ? "Spawn color" : "Particle";
    const targetSelect = buildColorSelect(script.targetColor);
    targetSelect.disabled = script.action === "spawn";
    targetSelect.addEventListener("change", (event) => {
      script.targetColor = event.target.value;
    });
    if (script.action === "spawn") {
      targetSelect.value = script.spawnColor || script.sourceColor;
      targetSelect.disabled = false;
      targetSelect.addEventListener("change", (event) => {
        script.spawnColor = event.target.value;
      });
    }
    targetField.appendChild(targetSelect);

    let cloneCountField = null;
    if (script.action === "spawn") {
      cloneCountField = document.createElement("label");
      cloneCountField.textContent = "Copies";
      const cloneCountInput = document.createElement("input");
      cloneCountInput.type = "number";
      cloneCountInput.min = "1";
      cloneCountInput.max = "10";
      cloneCountInput.step = "1";
      cloneCountInput.value = String(clampInt(script.spawnCount ?? 1, 1, 10, 1));
      cloneCountInput.addEventListener("change", (event) => {
        script.spawnCount = clampInt(event.target.value, 1, 10, 1);
        cloneCountInput.value = String(script.spawnCount);
      });
      cloneCountField.appendChild(cloneCountInput);
    }

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "button danger";
    removeBtn.textContent = "Remove";
    removeBtn.addEventListener("click", () => {
      state.scripts = state.scripts.filter((entry) => entry.id !== script.id);
      delete state.possessionScriptEnabled[script.id];
      renderScripts();
      updateHud();
      renderSelectedParticle();
    });

    const conditionBlock = document.createElement("div");
    conditionBlock.className = "condition-block";
    const conditionTitle = document.createElement("div");
    conditionTitle.className = "condition-title";
    conditionTitle.textContent = "If";
    conditionBlock.appendChild(conditionTitle);

    if ((script.conditions || []).length === 0) {
      const always = document.createElement("div");
      always.className = "condition-chip";
      always.textContent = "Always runs";
      conditionBlock.appendChild(always);
    } else {
      script.conditions.forEach((condition, conditionIndex) => {
        const row = document.createElement("div");
        row.className = "condition-row";

        if (conditionIndex === 0) {
          const chip = document.createElement("div");
          chip.className = "condition-chip";
          chip.textContent = "IF";
          row.appendChild(chip);
        } else {
          const operatorSelect = document.createElement("select");
          CONDITION_OPERATOR_OPTIONS.forEach((option) => {
            operatorSelect.appendChild(createOption(option.value, option.label, condition.operator || "and"));
          });
          operatorSelect.addEventListener("change", (event) => {
            condition.operator = event.target.value;
          });
          row.appendChild(operatorSelect);
        }

        const notSelect = document.createElement("select");
        notSelect.appendChild(createOption("false", "normal", String(Boolean(condition.negated))));
        notSelect.appendChild(createOption("true", "NOT", String(Boolean(condition.negated))));
        notSelect.addEventListener("change", (event) => {
          condition.negated = event.target.value === "true";
        });
        row.appendChild(notSelect);

        const typeSelect = document.createElement("select");
        CONDITION_TYPE_OPTIONS.forEach((option) => {
          typeSelect.appendChild(createOption(option.value, option.label, condition.type || "buttonPressed"));
        });
        typeSelect.addEventListener("change", (event) => {
          condition.type = event.target.value;
          if (condition.type !== "nearColor" && condition.type !== "touching") {
            delete condition.color;
            delete condition.primaryColor;
            delete condition.secondaryColor;
          } else if (condition.type === "nearColor" && !condition.color) {
            condition.color = "red";
          } else if (condition.type === "touching") {
            condition.primaryColor = condition.primaryColor || script.sourceColor || "red";
            condition.secondaryColor = condition.secondaryColor || script.targetColor || "green";
          }
          if (IO_CONDITION_TYPES.has(condition.type)) {
            if (!condition.number) condition.number = 1;
          } else {
            delete condition.number;
          }
          if (condition.type !== "touching") {
            delete condition.cooldownSeconds;
          } else if (!Number.isFinite(condition.cooldownSeconds)) {
            condition.cooldownSeconds = 0;
          }
          renderScripts();
        });
        row.appendChild(typeSelect);

        if (condition.type === "nearColor") {
          const colorSelect = buildColorSelect(condition.color || "red");
          colorSelect.addEventListener("change", (event) => {
            condition.color = event.target.value;
          });
          row.appendChild(colorSelect);
        } else if (condition.type === "touching") {
          const primarySelect = buildColorSelect(condition.primaryColor || script.sourceColor || "red");
          primarySelect.addEventListener("change", (event) => {
            condition.primaryColor = event.target.value;
          });
          row.appendChild(primarySelect);

          const secondarySelect = buildColorSelect(condition.secondaryColor || script.targetColor || "green");
          secondarySelect.addEventListener("change", (event) => {
            condition.secondaryColor = event.target.value;
          });
          row.appendChild(secondarySelect);
        } else if (IO_CONDITION_TYPES.has(condition.type)) {
          const numberSelect = document.createElement("select");
          IO_NUMBER_OPTIONS.forEach((option) => {
            numberSelect.appendChild(createOption(option.value, option.label, String(condition.number || 1)));
          });
          numberSelect.addEventListener("change", (event) => {
            condition.number = Number(event.target.value);
          });
          row.appendChild(numberSelect);
        }

        if (condition.type === "touching") {
          const cooldownInput = document.createElement("input");
          cooldownInput.type = "number";
          cooldownInput.min = "0";
          cooldownInput.max = "60";
          cooldownInput.step = "0.1";
          cooldownInput.value = String(condition.cooldownSeconds ?? 0);
          cooldownInput.addEventListener("change", (event) => {
            condition.cooldownSeconds = clamp(Number(event.target.value) || 0, 0, 60);
            cooldownInput.value = String(condition.cooldownSeconds);
          });
          row.appendChild(cooldownInput);
        } else {
          const chipTextByType = {
            nearColor: "Nearby now",
            buttonPressed: "Pressed now",
            buttonReleased: "Released now",
            switchOn: "On now",
            switchOff: "Off now",
          };
          const chip = document.createElement("div");
          chip.className = "condition-chip";
          chip.textContent = chipTextByType[condition.type] || "True now";
          row.appendChild(chip);
        }

        const removeConditionBtn = document.createElement("button");
        removeConditionBtn.type = "button";
        removeConditionBtn.className = "button danger";
        removeConditionBtn.textContent = "Remove if";
        removeConditionBtn.addEventListener("click", () => {
          script.conditions.splice(conditionIndex, 1);
          renderScripts();
        });
        row.appendChild(removeConditionBtn);

        conditionBlock.appendChild(row);
      });
    }

    const addConditionBtn = document.createElement("button");
    addConditionBtn.type = "button";
    addConditionBtn.className = "button ghost";
    addConditionBtn.textContent = "Add if";
    addConditionBtn.addEventListener("click", () => {
      script.conditions = script.conditions || [];
      script.conditions.push(createCondition());
      renderScripts();
    });
    conditionBlock.appendChild(addConditionBtn);

    if (cloneCountField) {
      card.append(sourceField, actionField, strengthField, targetField, cloneCountField, removeBtn, conditionBlock);
    } else {
      card.append(sourceField, actionField, strengthField, targetField, removeBtn, conditionBlock);
    }
    refs.scriptsList.appendChild(card);
  });
}

function renderResetCounts() {
  refs.resetCounts.innerHTML = "";

  COLORS.forEach((color) => {
    const row = document.createElement("label");
    row.className = "count-row";
    row.textContent = `${color.label} particles`;

    const input = document.createElement("input");
    input.type = "number";
    input.min = "0";
    input.max = "1000";
    input.step = "1";
    input.value = String(state.resetCounts[color.value] || 0);
    input.addEventListener("change", (event) => {
      state.resetCounts[color.value] = clampInt(event.target.value, 0, 1000, 0);
      input.value = String(state.resetCounts[color.value]);
    });

    row.appendChild(input);
    refs.resetCounts.appendChild(row);
  });
}

function buildColorSelect(selectedColor) {
  const select = document.createElement("select");
  COLORS.forEach((color) => {
    select.appendChild(createOption(color.value, color.label, selectedColor));
  });
  return select;
}

function createOption(value, label, selectedValue) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  option.selected = value === selectedValue;
  return option;
}

function loop(now) {
  const deltaSeconds = Math.min((now - state.lastFrame) / 1000, 0.05);
  state.lastFrame = now;

  if (!state.paused) {
    updateSimulation(deltaSeconds);
  }

  renderWorld();
  requestAnimationFrame(loop);
}

function updateSimulation(deltaSeconds) {
  const stepSeconds = deltaSeconds * SIMULATION_SPEED;
  const forces = new Map();

  state.particles.forEach((particle) => {
    particle.spawnCooldown = Math.max(0, (particle.spawnCooldown || 0) - stepSeconds);
    particle.eatCooldown = Math.max(0, (particle.eatCooldown || 0) - stepSeconds);
    forces.set(particle.id, { x: 0, y: 0 });
  });

  if (!state.useMatrix) {
    applyGlobalRepulsion(forces);
  }
  if (state.useMatrix) {
    applyMatrixForces(forces);
  } else {
    applyScriptForces(forces);
  }
  applyPossessionControl(forces);

  state.particles.forEach((particle) => {
    const force = forces.get(particle.id) || { x: 0, y: 0 };
    particle.vx = particle.vx * GLOBAL_FRICTION + force.x * stepSeconds;
    particle.vy = particle.vy * GLOBAL_FRICTION + force.y * stepSeconds;
    const speedCap = state.useMatrix ? MATRIX_MAX_SPEED : 0.9;
    dampVelocity(particle, speedCap, speedCap);
    moveParticle(particle, particle.vx * stepSeconds * 28, particle.vy * stepSeconds * 28);
    particle.heading = Math.atan2(particle.vy, particle.vx);
  });

  resolveParticleCollisions();
  applyEatActions();
  applySpawnActions();
  sanitizeParticlePositions();
  updateHud();
}

// Safety net: guarantees every particle stays at a finite, in-bounds position no
// matter what force calculation produced it. Without this, a single bad value
// (e.g. from an exact-overlap edge case) could silently push a particle far off
// the visible canvas forever, making the sim look "broken" until a reload.
function sanitizeParticlePositions() {
  state.particles.forEach((particle) => {
    if (!Number.isFinite(particle.x) || !Number.isFinite(particle.y)) {
      particle.x = WORLD_SIZE / 2;
      particle.y = WORLD_SIZE / 2;
      particle.vx = 0;
      particle.vy = 0;
      return;
    }
    if (!Number.isFinite(particle.vx)) particle.vx = 0;
    if (!Number.isFinite(particle.vy)) particle.vy = 0;
    particle.x = placeCoordinate(particle.x);
    particle.y = placeCoordinate(particle.y);
  });
}

function applyScriptForces(forces) {
  state.scripts.forEach((script) => {
    const sources = state.particles.filter((particle) => particle.color === script.sourceColor);
    const targets = state.particles.filter((particle) => particle.color === script.targetColor);
    if (sources.length === 0) return;

    if (script.action === "surround") {
      if (targets.length === 0) return;
      applySurroundForces(forces, sources, targets, getScriptStrength(script), script);
      return;
    }

    sources.forEach((source) => {
      if (!isScriptMovementEnabledForParticle(script, source)) return;
      if (!evaluateScriptConditions(script, source)) return;
      const strengthValue = getScriptStrength(script);

      // `moveToward` uses the same distance-vs-force curve as the matrix: positive
      // strength attracts, negative strength repels (replacing the old `move away` action),
      // and every particle within range contributes its own pull/push, just like the matrix.
      if (script.action === "moveToward") {
        if (targets.length === 0) return;
        targets.forEach((target) => {
          if (target.id === source.id) return;
          const offset = getWrappedOffset(source, target);
          const distance = Math.hypot(offset.dx, offset.dy);
          if (distance === 0 || distance > INTERACTION_RANGE) return;

          const normalizedDistance = distance / INTERACTION_RANGE;
          const magnitude = getMatrixForceMagnitude(normalizedDistance, strengthValue);
          if (magnitude === 0) return;
          addForce(forces, source.id, offset.dx / distance, offset.dy / distance, magnitude * MOVE_TOWARD_FORCE);
        });
        return;
      }

      if (script.action === "eat") {
        if (targets.length === 0) return;
        const nearest = findNearestTargetsInRange(source, targets, INTERACTION_RANGE, 1)[0];
        if (!nearest) return;
        const normalizedDistance = nearest.distance / INTERACTION_RANGE;
        const magnitude = getMatrixForceMagnitude(normalizedDistance, strengthValue);
        if (magnitude === 0) return;
        addForce(
          forces,
          source.id,
          nearest.dx / nearest.distance,
          nearest.dy / nearest.distance,
          magnitude * EAT_FORCE
        );
        return;
      }

      if (script.action === "spawn") {
        return;
      }
    });
  });
}

function applySurroundForces(forces, sources, targets, strengthValue, script) {
  if (state.multiSurround) {
    applyMultiSurroundForces(forces, sources, targets, strengthValue, script);
    return;
  }

  const groups = new Map();
  const limit = getSurroundLimit(state.maxSurroundPerParticle);

  sources.forEach((source) => {
    if (!isScriptMovementEnabledForParticle(script, source)) return;
    if (!evaluateScriptConditions(script, source)) return;
    const nearest = findNearestAvailableSurroundTarget(source, targets, groups, limit);
    if (!nearest) return;

    const entry = groups.get(nearest.target.id) || { target: nearest.target, sources: [] };
    entry.sources.push(source);
    groups.set(nearest.target.id, entry);
  });

  groups.forEach(({ target, sources: groupedSources }) => {
    const orderedSources = [...groupedSources].sort((a, b) => a.id - b.id);
    const count = orderedSources.length;
    const baseAngle = (target.id * 0.73) % (Math.PI * 2);

    orderedSources.forEach((source, index) => {
      const angle = baseAngle + (Math.PI * 2 * index) / Math.max(count, 1);
      const desiredPoint = {
        x: placeCoordinate(target.x + Math.cos(angle) * SURROUND_RADIUS),
        y: placeCoordinate(target.y + Math.sin(angle) * SURROUND_RADIUS),
      };
      const offset = getWrappedOffset(source, desiredPoint);
      const distance = Math.hypot(offset.dx, offset.dy);
      if (distance === 0) return;

      // Same distance-vs-force curve as the matrix, normalized over the interaction range.
      const normalizedDistance = distance / INTERACTION_RANGE;
      const magnitude = SURROUND_FORCE * getMatrixForceMagnitude(normalizedDistance, strengthValue);
      if (magnitude === 0) return;
      addForce(forces, source.id, offset.dx / distance, offset.dy / distance, magnitude);
    });
  });
}

function applyMultiSurroundForces(forces, sources, targets, strengthValue, script) {
  const targetGroups = buildSurroundTargetGroups(targets);
  const groups = new Map();
  const limit = getSurroundLimit(state.maxSurroundPerGroup);
  const structuralScale = getStrengthScale(strengthValue);

  sources.forEach((source) => {
    if (!isScriptMovementEnabledForParticle(script, source)) return;
    if (!evaluateScriptConditions(script, source)) return;
    const nearestGroup = findNearestAvailableSurroundGroup(source, targetGroups, groups, limit);
    if (!nearestGroup) return;

    const entry = groups.get(nearestGroup.group.id) || { targetGroup: nearestGroup.group, sources: [] };
    entry.sources.push(source);
    groups.set(nearestGroup.group.id, entry);
  });

  groups.forEach(({ targetGroup, sources: groupedSources }) => {
    applyMultiSurroundTargetCohesion(forces, targetGroup, structuralScale);

    const orderedSources = [...groupedSources].sort((a, b) => {
      return getWrappedPolar(targetGroup, a).angle - getWrappedPolar(targetGroup, b).angle;
    });
    const count = orderedSources.length;
    const baseAngle = (targetGroup.id * 0.73) % (Math.PI * 2);
    const surroundRadius = getMultiSurroundRadius(targetGroup, count);

    orderedSources.forEach((source, index) => {
      const angle = baseAngle + (Math.PI * 2 * index) / Math.max(count, 1);
      applyMultiSurroundWallForce(forces, source, targetGroup, angle, surroundRadius, strengthValue, structuralScale);
    });

    applyMultiSurroundWallSpacing(forces, orderedSources, surroundRadius, structuralScale);
  });
}

function getSurroundLimit(value) {
  const limit = clampInt(value, 0, MAX_PARTICLES, 0);
  return limit > 0 ? limit : Infinity;
}

function findNearestAvailableSurroundTarget(source, targets, groups, limit) {
  const candidates = findNearestTargetsInRange(source, targets, INTERACTION_RANGE, targets.length);
  return candidates.find((candidate) => {
    const entry = groups.get(candidate.target.id);
    return !entry || entry.sources.length < limit;
  });
}

function findNearestAvailableSurroundGroup(source, targetGroups, groups, limit) {
  const candidates = targetGroups
    .map((group) => {
      let distance = Infinity;
      group.members.forEach((target) => {
        distance = Math.min(distance, getWrappedDistance(source, target));
      });
      return { group, distance };
    })
    .filter((candidate) => candidate.distance <= INTERACTION_RANGE)
    .sort((a, b) => a.distance - b.distance);

  return candidates.find((candidate) => {
    const entry = groups.get(candidate.group.id);
    return !entry || entry.sources.length < limit;
  });
}

function getMultiSurroundRadius(targetGroup, sourceCount) {
  const targetRadius = SURROUND_RADIUS + targetGroup.radius + MULTI_SURROUND_RADIUS_PADDING;
  const wallCapacityRadius = (sourceCount * MULTI_SURROUND_WALL_PARTICLE_SPACING) / (Math.PI * 2);
  return Math.max(MULTI_SURROUND_MIN_RADIUS, targetRadius, wallCapacityRadius);
}

function applyMultiSurroundTargetCohesion(forces, targetGroup, structuralScale) {
  if (targetGroup.members.length < 2) return;

  targetGroup.members.forEach((target) => {
    const offset = getWrappedOffset(target, targetGroup);
    const distance = Math.hypot(offset.dx, offset.dy);
    if (distance === 0) return;

    const magnitude =
      MULTI_SURROUND_TARGET_COHESION_FORCE *
      structuralScale *
      Math.min(distance / SURROUND_RADIUS, 1.4);
    addForce(forces, target.id, offset.dx / distance, offset.dy / distance, magnitude);
  });
}

function applyMultiSurroundWallForce(forces, source, targetGroup, slotAngle, surroundRadius, strengthValue, structuralScale) {
  const polar = getWrappedPolar(targetGroup, source);
  const sourceAngle = polar.radius === 0 ? slotAngle : polar.angle;
  const ux = Math.cos(sourceAngle);
  const uy = Math.sin(sourceAngle);
  const innerClearance = targetGroup.radius + MULTI_SURROUND_INNER_CLEARANCE;
  if (polar.radius < innerClearance) {
    const clearanceMagnitude =
      SURROUND_FORCE * structuralScale * Math.min((innerClearance - polar.radius) / PARTICLE_RADIUS, 1.4);
    addForce(forces, source.id, ux, uy, clearanceMagnitude);
    applyMultiSurroundTangentForce(forces, source, sourceAngle, slotAngle, polar.radius, surroundRadius, structuralScale);
    return;
  }

  const desiredPoint = {
    x: placeCoordinate(targetGroup.x + Math.cos(slotAngle) * surroundRadius),
    y: placeCoordinate(targetGroup.y + Math.sin(slotAngle) * surroundRadius),
  };
  const offset = getWrappedOffset(source, desiredPoint);
  const distance = Math.hypot(offset.dx, offset.dy);
  if (distance === 0) return;

  // Same distance-vs-force curve as the matrix, normalized over the interaction range.
  const normalizedDistance = distance / INTERACTION_RANGE;
  const magnitude = SURROUND_FORCE * getMatrixForceMagnitude(normalizedDistance, strengthValue);
  if (magnitude === 0) return;
  addForce(forces, source.id, offset.dx / distance, offset.dy / distance, magnitude);
}

function applyMultiSurroundTangentForce(
  forces,
  source,
  sourceAngle,
  slotAngle,
  sourceRadius,
  surroundRadius,
  structuralScale
) {
  const angleDelta = getSignedAngleDelta(sourceAngle, slotAngle);
  const tangentDistance = Math.abs(angleDelta) * Math.max(sourceRadius, surroundRadius * 0.4);
  const tangentMagnitude =
    SURROUND_FORCE * structuralScale * Math.min(tangentDistance / SURROUND_RADIUS, 1.4);

  if (tangentMagnitude === 0) return;
  const ux = Math.cos(sourceAngle);
  const uy = Math.sin(sourceAngle);
  const tangentDirection = angleDelta > 0 ? 1 : -1;
  addForce(forces, source.id, -uy * tangentDirection, ux * tangentDirection, tangentMagnitude);
}

function applyMultiSurroundWallSpacing(forces, sources, surroundRadius, structuralScale) {
  if (sources.length < 2) return;

  const desiredSpacing = Math.max(PARTICLE_RADIUS * 2.1, (Math.PI * 2 * surroundRadius) / sources.length);

  for (let index = 0; index < sources.length; index += 1) {
    const source = sources[index];
    for (let otherIndex = index + 1; otherIndex < sources.length; otherIndex += 1) {
      const other = sources[otherIndex];
      const offset = getWrappedOffset(source, other);
      const distance = Math.hypot(offset.dx, offset.dy);
      if (distance === 0 || distance >= desiredSpacing) continue;

      const magnitude =
        MULTI_SURROUND_WALL_SPACING_FORCE *
        structuralScale *
        Math.min((desiredSpacing - distance) / desiredSpacing, 1);
      addForce(forces, source.id, -offset.dx / distance, -offset.dy / distance, magnitude);
      addForce(forces, other.id, offset.dx / distance, offset.dy / distance, magnitude);
    }
  }
}

function buildSurroundTargetGroups(targets) {
  const visited = new Set();
  const groups = [];

  targets.forEach((target) => {
    if (visited.has(target.id)) return;

    const members = [];
    const stack = [target];
    visited.add(target.id);

    while (stack.length > 0) {
      const current = stack.pop();
      members.push(current);

      targets.forEach((candidate) => {
        if (visited.has(candidate.id)) return;
        if (getWrappedDistance(current, candidate) > MULTI_SURROUND_GROUP_RANGE) return;
        visited.add(candidate.id);
        stack.push(candidate);
      });
    }

    groups.push(createSurroundTargetGroup(members));
  });

  return groups;
}

function createSurroundTargetGroup(members) {
  const anchor = members[0];
  let sumX = 0;
  let sumY = 0;

  members.forEach((member) => {
    const offset = getWrappedOffset(anchor, member);
    sumX += offset.dx;
    sumY += offset.dy;
  });

  const center = {
    x: placeCoordinate(anchor.x + sumX / members.length),
    y: placeCoordinate(anchor.y + sumY / members.length),
  };
  const radius = members.reduce((maxRadius, member) => {
    return Math.max(maxRadius, getWrappedDistance(center, member));
  }, 0);

  return {
    id: Math.min(...members.map((member) => member.id)),
    members,
    x: center.x,
    y: center.y,
    radius,
  };
}

function applyDrift(particle, deltaSeconds, strength) {
  const wobble = performance.now() * 0.0015 + particle.id * 1.17;
  particle.vx += Math.cos(wobble) * strength * deltaSeconds;
  particle.vy += Math.sin(wobble * 0.9) * strength * deltaSeconds;
}

function dampVelocity(particle, maxSpeed, maxFleeSpeed) {
  const cap = Math.max(maxSpeed, maxFleeSpeed);
  particle.vx *= 0.992;
  particle.vy *= 0.992;
  const speed = Math.hypot(particle.vx, particle.vy);
  if (speed > cap) {
    particle.vx = (particle.vx / speed) * cap;
    particle.vy = (particle.vy / speed) * cap;
  }
}

function findNearestTarget(source, targets) {
  let best = null;
  let bestDistance = Infinity;

  targets.forEach((target) => {
    if (target.id === source.id) return;
    const offset = getWrappedOffset(source, target);
    const distance = Math.hypot(offset.dx, offset.dy);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = { particle: target, dx: offset.dx / (distance || 1), dy: offset.dy / (distance || 1), distance };
    }
  });

  return best;
}

function getWrappedOffset(from, to) {
  let dx = to.x - from.x;
  let dy = to.y - from.y;

  if (!state.disableSideWarp) {
    if (dx > WORLD_SIZE / 2) dx -= WORLD_SIZE;
    if (dx < -WORLD_SIZE / 2) dx += WORLD_SIZE;
    if (dy > WORLD_SIZE / 2) dy -= WORLD_SIZE;
    if (dy < -WORLD_SIZE / 2) dy += WORLD_SIZE;
  }

  return { dx, dy };
}

function getWrappedDistance(from, to) {
  const offset = getWrappedOffset(from, to);
  return Math.hypot(offset.dx, offset.dy);
}

function getWrappedPolar(from, to) {
  const offset = getWrappedOffset(from, to);
  return {
    angle: normalizeAngle(Math.atan2(offset.dy, offset.dx)),
    radius: Math.hypot(offset.dx, offset.dy),
  };
}

function normalizeAngle(angle) {
  const fullTurn = Math.PI * 2;
  return ((angle % fullTurn) + fullTurn) % fullTurn;
}

function getSignedAngleDelta(fromAngle, toAngle) {
  const fullTurn = Math.PI * 2;
  let delta = normalizeAngle(toAngle) - normalizeAngle(fromAngle);
  if (delta > Math.PI) delta -= fullTurn;
  if (delta < -Math.PI) delta += fullTurn;
  return delta;
}

function wrapCoordinate(value) {
  const remainder = value % WORLD_SIZE;
  return remainder < 0 ? remainder + WORLD_SIZE : remainder;
}

function boundCoordinate(value) {
  return clamp(value, PARTICLE_RADIUS, WORLD_SIZE - PARTICLE_RADIUS);
}

function moveParticle(particle, dx, dy) {
  if (!state.disableSideWarp) {
    particle.x = wrapCoordinate(particle.x + dx);
    particle.y = wrapCoordinate(particle.y + dy);
    return;
  }

  particle.x += dx;
  particle.y += dy;

  if (particle.x < PARTICLE_RADIUS || particle.x > WORLD_SIZE - PARTICLE_RADIUS) {
    particle.x = boundCoordinate(particle.x);
    particle.vx *= -0.72;
  }

  if (particle.y < PARTICLE_RADIUS || particle.y > WORLD_SIZE - PARTICLE_RADIUS) {
    particle.y = boundCoordinate(particle.y);
    particle.vy *= -0.72;
  }
}

function placeCoordinate(value) {
  return state.disableSideWarp ? boundCoordinate(value) : wrapCoordinate(value);
}

function getInitialParticleSeparation() {
  const canvasWidth = refs.worldCanvas.getBoundingClientRect().width || 600;
  const twoInchesInPixels = 96 * 2;
  const units = (twoInchesInPixels / canvasWidth) * WORLD_SIZE;
  return Math.max(PARTICLE_RADIUS * 4, Math.min(units, WORLD_SIZE * 0.45));
}

function getDesiredChaseDistance() {
  return getInitialParticleSeparation();
}

function resolveParticleCollisions() {
  const minDistance = PARTICLE_RADIUS * 2;

  for (let index = 0; index < state.particles.length; index += 1) {
    const a = state.particles[index];

    for (let otherIndex = index + 1; otherIndex < state.particles.length; otherIndex += 1) {
      const b = state.particles[otherIndex];
      const offset = getWrappedOffset(a, b);
      const distance = Math.hypot(offset.dx, offset.dy);

      if (distance >= minDistance) continue;

      let nx;
      let ny;
      if (distance === 0) {
        // Exact overlap: push apart along a fixed axis instead of dividing by a
        // near-zero distance, which previously produced a huge, corrupting displacement.
        nx = 1;
        ny = 0;
      } else {
        nx = offset.dx / distance;
        ny = offset.dy / distance;
      }

      const overlap = minDistance - distance;

      a.x = placeCoordinate(a.x - nx * overlap * 0.5);
      a.y = placeCoordinate(a.y - ny * overlap * 0.5);
      b.x = placeCoordinate(b.x + nx * overlap * 0.5);
      b.y = placeCoordinate(b.y + ny * overlap * 0.5);

      const relativeVx = b.vx - a.vx;
      const relativeVy = b.vy - a.vy;
      const separatingSpeed = relativeVx * nx + relativeVy * ny;
      if (separatingSpeed >= 0) continue;

      const bounce = 0.9;
      const impulse = (-(1 + bounce) * separatingSpeed) / 2;
      a.vx -= impulse * nx;
      a.vy -= impulse * ny;
      b.vx += impulse * nx;
      b.vy += impulse * ny;
    }
  }
}

function buildResetParticles() {
  const center = WORLD_SIZE / 2;
  const spacing = getInitialParticleSeparation();
  const particles = [];
  let colorIndex = 0;
  const totalCount = COLORS.reduce((sum, color) => sum + (state.resetCounts[color.value] || 0), 0);

  if (totalCount === 2 && (state.resetCounts.red || 0) === 1 && (state.resetCounts.green || 0) === 1) {
    const angle = randomFloat(0, Math.PI * 2);
    const jitter = spacing * 0.08;
    return [
      {
        color: "red",
        x: placeCoordinate(center + Math.cos(angle + Math.PI) * spacing * 0.5 + randomFloat(-jitter, jitter)),
        y: placeCoordinate(center + Math.sin(angle + Math.PI) * spacing * 0.5 + randomFloat(-jitter, jitter)),
        vx: randomFloat(-0.03, 0.03),
        vy: randomFloat(-0.03, 0.03),
      },
      {
        color: "green",
        x: placeCoordinate(center + Math.cos(angle) * spacing * 0.5 + randomFloat(-jitter, jitter)),
        y: placeCoordinate(center + Math.sin(angle) * spacing * 0.5 + randomFloat(-jitter, jitter)),
        vx: randomFloat(-0.03, 0.03),
        vy: randomFloat(-0.03, 0.03),
      },
    ];
  }

  const baseRotation = randomFloat(0, Math.PI * 2);

  COLORS.forEach((color) => {
    const count = state.resetCounts[color.value] || 0;
    for (let index = 0; index < count; index += 1) {
      const ring = Math.floor(colorIndex / 10);
      const slotsPerRing = 10 + ring * 4;
      const slot = colorIndex % slotsPerRing;
      const angle = baseRotation + (Math.PI * 2 * slot) / slotsPerRing + ring * 0.22 + randomFloat(-0.12, 0.12);
      const radius = spacing * (0.75 + ring * 0.42) + randomFloat(-spacing * 0.12, spacing * 0.12);
      const jitter = spacing * 0.06;

      particles.push({
        color: color.value,
        x: placeCoordinate(center + Math.cos(angle) * radius + randomFloat(-jitter, jitter)),
        y: placeCoordinate(center + Math.sin(angle) * radius + randomFloat(-jitter, jitter)),
        vx: randomFloat(-0.03, 0.03),
        vy: randomFloat(-0.03, 0.03),
        spawnCooldown: 0,
        eatCooldown: 0,
      });
      colorIndex += 1;
    }
  });

  if (particles.length === 0) {
    const angle = randomFloat(0, Math.PI * 2);
    const jitter = spacing * 0.08;
    particles.push(
      {
        color: "red",
        x: placeCoordinate(center + Math.cos(angle + Math.PI) * spacing * 0.5 + randomFloat(-jitter, jitter)),
        y: placeCoordinate(center + Math.sin(angle + Math.PI) * spacing * 0.5 + randomFloat(-jitter, jitter)),
        vx: randomFloat(-0.03, 0.03),
        vy: randomFloat(-0.03, 0.03),
      },
      {
        color: "green",
        x: placeCoordinate(center + Math.cos(angle) * spacing * 0.5 + randomFloat(-jitter, jitter)),
        y: placeCoordinate(center + Math.sin(angle) * spacing * 0.5 + randomFloat(-jitter, jitter)),
        vx: randomFloat(-0.03, 0.03),
        vy: randomFloat(-0.03, 0.03),
      }
    );
  }

  return particles;
}

function stabilizeResetState() {
  for (let iteration = 0; iteration < 4; iteration += 1) {
    resolveParticleCollisions();
  }
}

function renderWorld() {
  const ctx = state.ctx;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, refs.worldCanvas.width, refs.worldCanvas.height);
  ctx.restore();
  ctx.save();
  ctx.setTransform(
    (window.devicePixelRatio || 1) * state.renderScale,
    0,
    0,
    (window.devicePixelRatio || 1) * state.renderScale,
    0,
    0
  );
  ctx.imageSmoothingEnabled = true;
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, WORLD_SIZE, WORLD_SIZE);

  drawGrid(ctx);

  state.particles.forEach((particle) => {
    const color = COLORS.find((entry) => entry.value === particle.color) || COLORS[0];
    const gradient = ctx.createRadialGradient(
      particle.x - PARTICLE_RADIUS * 0.35,
      particle.y - PARTICLE_RADIUS * 0.4,
      PARTICLE_RADIUS * 0.2,
      particle.x,
      particle.y,
      PARTICLE_RADIUS
    );
    gradient.addColorStop(0, "#ffffff");
    gradient.addColorStop(0.12, "#ffffff");
    gradient.addColorStop(0.28, color.fill);
    gradient.addColorStop(1, shadeColor(color.fill, -22));

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, PARTICLE_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    if (particle.id === state.selectedParticleId) {
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 0.18;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, PARTICLE_RADIUS + 0.35, 0, Math.PI * 2);
      ctx.stroke();
    }
  });
  ctx.restore();
}

function drawGrid(ctx) {
  ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
  ctx.lineWidth = 0.05;

  for (let index = 0; index <= WORLD_SIZE; index += 10) {
    ctx.beginPath();
    ctx.moveTo(index + 0.5, 0);
    ctx.lineTo(index + 0.5, WORLD_SIZE);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, index + 0.5);
    ctx.lineTo(WORLD_SIZE, index + 0.5);
    ctx.stroke();
  }
}

function handleCanvasPick(event) {
  const rect = refs.worldCanvas.getBoundingClientRect();
  const scaleX = WORLD_SIZE / Math.max(rect.width, 1);
  const scaleY = WORLD_SIZE / Math.max(rect.height, 1);
  const x = (event.clientX - rect.left) * scaleX;
  const y = (event.clientY - rect.top) * scaleY;

  let selected = null;
  let bestDistance = Infinity;

  state.particles.forEach((particle) => {
    const distance = Math.hypot(particle.x - x, particle.y - y);
    if (distance < PARTICLE_RADIUS + 1 && distance < bestDistance) {
      selected = particle;
      bestDistance = distance;
    }
  });

  state.selectedParticleId = selected ? selected.id : null;
  renderSelectedParticle();
}

function renderSelectedParticle() {
  const particle = state.particles.find((entry) => entry.id === state.selectedParticleId);

  if (!particle) {
    refs.selectedParticle.textContent = "Click a particle in the world to inspect it.";
    return;
  }

  const isPossessed = particle.id === state.possessedParticleId;
  const movementScripts = getMovementScriptsForParticle(particle);
  const manualControlActive = isManualPossessionControlActive(particle);

  refs.selectedParticle.innerHTML = "";

  const details = document.createElement("div");
  details.innerHTML = [
    `<strong>${capitalize(particle.color)} particle</strong>`,
    `Position: ${particle.x.toFixed(2)}, ${particle.y.toFixed(2)}`,
    `Velocity: ${particle.vx.toFixed(2)}, ${particle.vy.toFixed(2)}`,
  ].join("<br />");
  refs.selectedParticle.appendChild(details);

  const actions = document.createElement("div");
  actions.className = "possession-actions";

  const possessBtn = document.createElement("button");
  possessBtn.type = "button";
  possessBtn.className = isPossessed ? "button danger" : "button ghost";
  possessBtn.textContent = isPossessed ? "Release possession" : "Possess particle";
  possessBtn.addEventListener("click", () => {
    if (isPossessed) {
      state.possessedParticleId = null;
      state.pressedKeys.clear();
    } else {
      state.possessedParticleId = particle.id;
      seedPossessionScriptSettings(particle);
    }
    renderSelectedParticle();
  });
  actions.appendChild(possessBtn);
  refs.selectedParticle.appendChild(actions);

  if (!isPossessed) return;

  const panel = document.createElement("div");
  panel.className = "possession-panel";

  const title = document.createElement("div");
  title.className = "condition-title";
  title.textContent = "Possession scripts";
  panel.appendChild(title);

  if (movementScripts.length === 0) {
    const empty = document.createElement("div");
    empty.className = "condition-chip possession-chip";
    empty.textContent = "No movement scripts affect this particle";
    panel.appendChild(empty);
  } else {
    movementScripts.forEach((script) => {
      const row = document.createElement("label");
      row.className = "possession-toggle";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = getPossessionScriptEnabled(script.id);
      checkbox.addEventListener("change", (event) => {
        state.possessionScriptEnabled[script.id] = event.target.checked;
        renderSelectedParticle();
      });

      const text = document.createElement("span");
      text.textContent = describeScript(script);

      row.append(checkbox, text);
      panel.appendChild(row);
    });
  }

  const killTouchingRow = document.createElement("label");
  killTouchingRow.className = "possession-toggle";

  const killTouchingCheckbox = document.createElement("input");
  killTouchingCheckbox.type = "checkbox";
  killTouchingCheckbox.checked = state.possessionKillTouchingOnF;
  killTouchingCheckbox.addEventListener("change", (event) => {
    state.possessionKillTouchingOnF = event.target.checked;
    renderSelectedParticle();
  });

  const killTouchingText = document.createElement("span");
  killTouchingText.textContent = "F kills touching or very close particles";
  killTouchingRow.append(killTouchingCheckbox, killTouchingText);
  panel.appendChild(killTouchingRow);

  const hint = document.createElement("div");
  hint.className = manualControlActive ? "possession-hint is-active" : "possession-hint";
  hint.textContent = manualControlActive
    ? "Manual control active: use WASD or arrow keys."
    : "Turn off every movement script above to control movement.";
  panel.appendChild(hint);

  refs.selectedParticle.appendChild(panel);
}

function seedPossessionScriptSettings(particle) {
  getMovementScriptsForParticle(particle).forEach((script) => {
    if (state.possessionScriptEnabled[script.id] === undefined) {
      state.possessionScriptEnabled[script.id] = true;
    }
  });
}

function getMovementScriptsForParticle(particle) {
  return state.scripts.filter((script) => script.sourceColor === particle.color && MOVEMENT_ACTIONS.has(script.action));
}

function getPossessionScriptEnabled(scriptId) {
  return state.possessionScriptEnabled[scriptId] !== false;
}

function isScriptMovementEnabledForParticle(script, particle) {
  if (!MOVEMENT_ACTIONS.has(script.action)) return true;
  if (particle.id !== state.possessedParticleId) return true;
  return getPossessionScriptEnabled(script.id);
}

function isManualPossessionControlActive(particle) {
  if (!particle || particle.id !== state.possessedParticleId) return false;
  const movementScripts = getMovementScriptsForParticle(particle);
  return movementScripts.every((script) => !getPossessionScriptEnabled(script.id));
}

function applyPossessionControl(forces) {
  const particle = state.particles.find((entry) => entry.id === state.possessedParticleId);
  if (!isManualPossessionControlActive(particle)) return;

  let x = 0;
  let y = 0;
  if (state.pressedKeys.has("arrowleft") || state.pressedKeys.has("a")) x -= 1;
  if (state.pressedKeys.has("arrowright") || state.pressedKeys.has("d")) x += 1;
  if (state.pressedKeys.has("arrowup") || state.pressedKeys.has("w")) y -= 1;
  if (state.pressedKeys.has("arrowdown") || state.pressedKeys.has("s")) y += 1;

  const length = Math.hypot(x, y);
  if (length === 0) return;
  addForce(forces, particle.id, x / length, y / length, POSSESSION_MANUAL_FORCE);
}

function handleKeyDown(event) {
  const key = event.key.toLowerCase();
  if (key === "f") {
    if (state.possessedParticleId !== null) {
      event.preventDefault();
      killTouchingParticlesFromPossession();
    }
    return;
  }
  if (!isPossessionMovementKey(key)) return;
  state.pressedKeys.add(key);
  if (state.possessedParticleId !== null) {
    event.preventDefault();
  }
}

function handleKeyUp(event) {
  const key = event.key.toLowerCase();
  if (!isPossessionMovementKey(key)) return;
  state.pressedKeys.delete(key);
  if (state.possessedParticleId !== null) {
    event.preventDefault();
  }
}

function isPossessionMovementKey(key) {
  return ["arrowleft", "arrowright", "arrowup", "arrowdown", "w", "a", "s", "d"].includes(key);
}

function killTouchingParticlesFromPossession() {
  if (!state.possessionKillTouchingOnF) return 0;
  const possessed = state.particles.find((particle) => particle.id === state.possessedParticleId);
  if (!possessed) return 0;

  const touchingIds = getTouchingParticles(possessed).map((particle) => particle.id);
  if (touchingIds.length === 0) return 0;

  const killedIds = new Set(touchingIds);
  state.particles = state.particles.filter((particle) => !killedIds.has(particle.id));
  if (state.selectedParticleId && !state.particles.some((particle) => particle.id === state.selectedParticleId)) {
    state.selectedParticleId = state.possessedParticleId;
  }
  updateHud();
  renderSelectedParticle();
  return killedIds.size;
}

function getTouchingParticles(source) {
  return state.particles.filter((particle) => {
    if (particle.id === source.id) return false;
    return getWrappedDistance(source, particle) <= POSSESSION_KILL_RANGE;
  });
}

function describeScript(script) {
  const source = capitalize(script.sourceColor);
  const target = capitalize(script.targetColor || script.spawnColor || script.sourceColor);
  const action = ACTION_OPTIONS.find((option) => option.value === script.action)?.label || script.action;
  const strength = getScriptStrength(script);
  return `${source} ${action} ${target} (strength ${strength})`;
}

function updateHud() {
  refs.particleCount.textContent = String(state.particles.length);
  refs.scriptCount.textContent = String(state.scripts.length);
  refs.playState.textContent = state.paused ? "Pause" : "Play";
  refs.pauseBtn.textContent = state.paused ? "Play" : "Pause";
  renderColorCounts();
}

function togglePause() {
  state.paused = !state.paused;
  updateHud();
}

function toggleWorldFullscreen() {
  state.fullscreenWorld = !state.fullscreenWorld;
  refs.worldPanel.classList.toggle("is-fullscreen", state.fullscreenWorld);
  document.body.classList.toggle("world-fullscreen", state.fullscreenWorld);
  refs.fullscreenWorldBtn.textContent = state.fullscreenWorld ? "Exit fullscreen" : "Fullscreen world";
  refs.infoExitFullscreenBtn.hidden = !state.fullscreenWorld;
  requestAnimationFrame(handleResize);
}

function handleResize() {
  state.ctx = setupCanvasContext(refs.worldCanvas, WORLD_SIZE, WORLD_SIZE);
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function shadeColor(hex, amount) {
  const value = hex.replace("#", "");
  const num = Number.parseInt(value, 16);
  const clampChannel = (channel) => Math.max(0, Math.min(255, channel + amount));
  const red = clampChannel((num >> 16) & 0xff);
  const green = clampChannel((num >> 8) & 0xff);
  const blue = clampChannel(num & 0xff);
  return `rgb(${red}, ${green}, ${blue})`;
}

function getPrimaryPairDistance() {
  const red = state.particles.find((particle) => particle.color === "red");
  const green = state.particles.find((particle) => particle.color === "green");
  if (!red || !green) return 0;
  const offset = getWrappedOffset(red, green);
  return Math.hypot(offset.dx, offset.dy);
}

function maybeRunSelfTest() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("selfTest") !== "1") return;

  if (state.scripts.length === 0) {
    state.scripts = [createScript()];
  }
  renderScripts();
  resetWorld();

  const distanceSamples = [];
  let minDistance = Infinity;
  let maxDistance = 0;
  for (let step = 0; step < 900; step += 1) {
    updateSimulation(1 / 60);
    const distance = getPrimaryPairDistance();
    minDistance = Math.min(minDistance, distance);
    maxDistance = Math.max(maxDistance, distance);
    if (step % 90 === 0) {
      distanceSamples.push(distance.toFixed(3));
    }
  }

  const initialDistance = Number(distanceSamples[0]);
  const finalDistance = Number(getPrimaryPairDistance().toFixed(3));
  const aggregateMetric = getAggregateScriptMetric();
  const possession = runPossessionSelfTest();
  const possessionKill = runPossessionKillSelfTest();
  const sideWarp = runSideWarpSelfTest();
  const result = {
    counts: { ...state.resetCounts },
    scripts: state.scripts.map((script) => ({
      sourceColor: script.sourceColor,
      action: script.action,
      strength: getScriptStrength(script),
      targetColor: script.targetColor,
      conditions: (script.conditions || []).map((condition) => ({ ...condition })),
    })),
    initialDistance: initialDistance.toFixed(3),
    finalDistance: finalDistance.toFixed(3),
    minimumDistance: minDistance.toFixed(3),
    maximumDistance: maxDistance.toFixed(3),
    samples: distanceSamples,
    drift: Math.abs(finalDistance - initialDistance).toFixed(3),
    aggregateMetric,
    multiSurround: state.multiSurround,
    disableSideWarp: state.disableSideWarp,
    possession,
    possessionKill,
    sideWarp,
    pass: Number.isFinite(finalDistance) && possession.pass && possessionKill.pass && sideWarp.pass,
  };

  refs.selfTestOutput.hidden = false;
  refs.selfTestOutput.textContent = JSON.stringify(result, null, 2);
  document.body.dataset.selfTestResult = result.pass ? "pass" : "fail";
}

function runPossessionSelfTest() {
  resetWorld();
  const movementScript = state.scripts.find((script) => MOVEMENT_ACTIONS.has(script.action));
  const particle = state.particles.find((entry) => entry.color === movementScript?.sourceColor) || state.particles[0];
  if (!particle) {
    return { pass: false, reason: "No particle available" };
  }

  state.possessedParticleId = particle.id;
  seedPossessionScriptSettings(particle);
  getMovementScriptsForParticle(particle).forEach((script) => {
    state.possessionScriptEnabled[script.id] = false;
  });

  const initialX = particle.x;
  state.pressedKeys.add("d");
  for (let step = 0; step < 45; step += 1) {
    updateSimulation(1 / 60);
  }
  state.pressedKeys.clear();

  const movedRight = particle.x > initialX + 0.05;
  const manualControlActive = isManualPossessionControlActive(particle);
  const retainedId = particle.id;
  state.selectedParticleId = retainedId;
  resetWorld();
  const retainedAfterReset = state.possessedParticleId === retainedId && state.selectedParticleId === retainedId;
  state.possessedParticleId = null;
  state.possessionScriptEnabled = {};

  return {
    pass: movedRight && manualControlActive && retainedAfterReset,
    movedRight,
    manualControlActive,
    retainedAfterReset,
    retainedId,
    startX: initialX.toFixed(3),
    endX: particle.x.toFixed(3),
  };
}

function runSideWarpSelfTest() {
  const previousDisableSideWarp = state.disableSideWarp;
  state.disableSideWarp = true;
  if (refs.disableSideWarpToggle) refs.disableSideWarpToggle.checked = true;

  const particle = {
    id: -1,
    color: "red",
    x: WORLD_SIZE - PARTICLE_RADIUS * 0.5,
    y: WORLD_SIZE / 2,
    vx: 1,
    vy: 0,
  };
  moveParticle(particle, 6, 0);

  const stayedOnRightEdge = particle.x >= WORLD_SIZE - PARTICLE_RADIUS - 0.001;
  const bouncedLeft = particle.vx < 0;

  state.disableSideWarp = previousDisableSideWarp;
  if (refs.disableSideWarpToggle) refs.disableSideWarpToggle.checked = state.disableSideWarp;

  return {
    pass: stayedOnRightEdge && bouncedLeft,
    stayedOnRightEdge,
    bouncedLeft,
    x: particle.x.toFixed(3),
    vx: particle.vx.toFixed(3),
  };
}

function runPossessionKillSelfTest() {
  const previousKillSetting = state.possessionKillTouchingOnF;
  const previousDisableSideWarp = state.disableSideWarp;

  state.disableSideWarp = false;
  state.possessionKillTouchingOnF = true;
  state.particles = [
    { id: 1, color: "red", x: 50, y: 50, vx: 0, vy: 0, heading: 0, spawnCooldown: 0, eatCooldown: 0 },
    {
      id: 2,
      color: "green",
      x: 50 + POSSESSION_KILL_RANGE - 0.1,
      y: 50,
      vx: 0,
      vy: 0,
      heading: 0,
      spawnCooldown: 0,
      eatCooldown: 0,
    },
    {
      id: 3,
      color: "blue",
      x: 50 + POSSESSION_KILL_RANGE + 1.2,
      y: 50,
      vx: 0,
      vy: 0,
      heading: 0,
      spawnCooldown: 0,
      eatCooldown: 0,
    },
  ];
  state.selectedParticleId = 1;
  state.possessedParticleId = 1;

  let prevented = false;
  handleKeyDown({
    key: "f",
    repeat: false,
    preventDefault() {
      prevented = true;
    },
  });

  const killedNearby = !state.particles.some((particle) => particle.id === 2);
  state.particles.push({
    id: 4,
    color: "yellow",
    x: 50,
    y: 50 + POSSESSION_KILL_RANGE - 0.1,
    vx: 0,
    vy: 0,
    heading: 0,
    spawnCooldown: 0,
    eatCooldown: 0,
  });

  let preventedRepeat = false;
  handleKeyDown({
    key: "f",
    repeat: true,
    preventDefault() {
      preventedRepeat = true;
    },
  });

  const killedRepeatNearby = !state.particles.some((particle) => particle.id === 4);
  const keptFar = state.particles.some((particle) => particle.id === 3);
  const keptPossessed = state.particles.some((particle) => particle.id === 1);

  state.possessedParticleId = null;
  state.selectedParticleId = null;
  state.possessionKillTouchingOnF = previousKillSetting;
  state.disableSideWarp = previousDisableSideWarp;
  resetWorld();

  return {
    pass: prevented && preventedRepeat && killedNearby && killedRepeatNearby && keptFar && keptPossessed,
    prevented,
    preventedRepeat,
    killedNearby,
    killedRepeatNearby,
    keptFar,
    keptPossessed,
    range: POSSESSION_KILL_RANGE.toFixed(3),
  };
}

function applyQueryConfig() {
  const params = new URLSearchParams(window.location.search);
  if (params.has("worldSize")) {
    WORLD_SIZE = clampInt(params.get("worldSize"), WORLD_SIZE_MIN, WORLD_SIZE_MAX, WORLD_SIZE);
  }
  state.multiSurround = params.get("multiSurround") === "1";
  refs.multiSurroundToggle.checked = state.multiSurround;
  state.disableSideWarp = params.get("disableSideWarp") === "1";
  if (refs.disableSideWarpToggle) refs.disableSideWarpToggle.checked = state.disableSideWarp;
  state.maxSurroundPerParticle = clampInt(params.get("maxPerParticle"), 0, MAX_PARTICLES, state.maxSurroundPerParticle);
  state.maxSurroundPerGroup = clampInt(params.get("maxPerGroup"), 0, MAX_PARTICLES, state.maxSurroundPerGroup);
  refs.maxSurroundPerParticleInput.value = String(state.maxSurroundPerParticle);
  refs.maxSurroundPerGroupInput.value = String(state.maxSurroundPerGroup);

  COLORS.forEach((color) => {
    const raw = params.get(color.value);
    if (raw === null) return;
    state.resetCounts[color.value] = clampInt(raw, 0, 1000, state.resetCounts[color.value] || 0);
  });

  const scripts = [];
  for (let index = 1; index <= 6; index += 1) {
    const raw = params.get(`script${index}`);
    if (!raw) continue;
    const [sourceColor, action, targetColor] = raw.split(",");
    if (!COLORS.some((color) => color.value === sourceColor)) continue;
    if (!ACTION_OPTIONS.some((option) => option.value === action)) continue;
    if (!COLORS.some((color) => color.value === targetColor)) continue;
    scripts.push({
      id: `query-script-${index}`,
      sourceColor,
      action,
      strength: params.has(`strength${index}`) ? clampStrength(params.get(`strength${index}`)) : STRENGTH_DEFAULT,
      targetColor,
      conditions: [],
    });
  }

  if (scripts.length > 0) {
    state.scripts = scripts;
  }
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function clampInt(value, min, max, fallback) {
  const number = Number(value);
  if (Number.isNaN(number)) return fallback;
  return Math.round(clamp(number, min, max));
}

function normalizeMatrixInput(input) {
  if (input.value === "") return;
  const value = Number(input.value);
  if (Number.isNaN(value)) {
    input.value = "";
    return;
  }
  input.value = (Math.round(clamp(value, -1, 1) * 10) / 10).toFixed(1);
}

function applyMatrixControlsEnabled() {
  const enabled = state.useMatrix;
  document.querySelectorAll(".matrix-input").forEach((input) => {
    input.disabled = !enabled;
  });
  if (refs.randomiseBtn) refs.randomiseBtn.disabled = !enabled;
  if (refs.randomRunToggle) refs.randomRunToggle.disabled = !enabled;
  document.querySelectorAll(".matrix-wrap").forEach((el) => {
    el.classList.toggle("is-disabled", !enabled);
  });
  const randomRunLabel = refs.randomRunToggle?.closest("label");
  randomRunLabel?.classList.toggle("is-disabled", !enabled);
  if (refs.matrixActiveNotice) refs.matrixActiveNotice.hidden = !enabled;
}

function randomiseMatrixInputs() {
  document.querySelectorAll(".matrix-input").forEach((input) => {
    input.value = (Math.floor(Math.random() * 21 - 10) / 10).toFixed(1);
  });
}

function randomFloat(min, max) {
  return min + Math.random() * (max - min);
}

function clampStrength(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return STRENGTH_DEFAULT;
  return Math.round(clamp(number, STRENGTH_MIN, STRENGTH_MAX) * 10) / 10;
}

function getScriptStrength(script) {
  return clampStrength(script.strength ?? STRENGTH_DEFAULT);
}

// Structural (non-directional) forces such as collision clearance, wall spacing, and
// target cohesion should always push/pull the way they're supposed to regardless of
// sign, so they use the magnitude of the strength rather than the signed value.
function getStrengthScale(strengthValue) {
  return Math.max(0.2, Math.abs(strengthValue));
}

// Cooldown timers aren't a distance-based force, so they use a simple positive multiplier
// derived from strength: 0 behaves like the old "moderate" default, +1 is twice as fast,
// -1 is slowed to a crawl (never fully zero, to avoid divide-by-zero).
function getStrengthCooldownMultiplier(script) {
  return Math.max(0.15, 1 + getScriptStrength(script));
}

function exportConfigCode() {
  refs.exportCodeOutput.value = encodeConfigCode();
  refs.exportCodeOutput.focus();
  refs.exportCodeOutput.select();
}

function encodeConfigCode() {
  const countsPart = COLORS.map((color) => `${color.value}:${clampInt(state.resetCounts[color.value] || 0, 0, 1000, 0)}`).join(",");
  const optionsPart = [
    `worldSize:${WORLD_SIZE}`,
    `multiSurround:${state.multiSurround ? 1 : 0}`,
    `disableSideWarp:${state.disableSideWarp ? 1 : 0}`,
    `maxPerParticle:${clampInt(state.maxSurroundPerParticle, 0, MAX_PARTICLES, 0)}`,
    `maxPerGroup:${clampInt(state.maxSurroundPerGroup, 0, MAX_PARTICLES, 0)}`,
  ].join(",");
  const scriptsPart = state.scripts
    .map((script) => {
      const conditions = (script.conditions || [])
        .map((condition) =>
          [
            `op:${condition.operator || "and"}`,
            `not:${condition.negated ? 1 : 0}`,
            `type:${condition.type || "buttonPressed"}`,
            `num:${condition.number ?? ""}`,
            `color:${condition.color || ""}`,
            `cool:${condition.cooldownSeconds ?? 0}`,
          ].join("&")
        )
        .join("+") || "none";

      return [
        `src:${script.sourceColor}`,
        `act:${script.action}`,
        `str:${getScriptStrength(script)}`,
        `tgt:${script.targetColor || ""}`,
        `spc:${script.spawnColor || ""}`,
        `spn:${clampInt(script.spawnCount ?? 1, 1, 10, 1)}`,
        `if:${conditions}`,
      ].join(",");
    })
    .join(";");

  return `CL1~counts=${countsPart}~options=${optionsPart}~scripts=${scriptsPart || "none"}`;
}

function importConfigCode() {
  const raw = refs.importCodeInput.value.trim();
  if (!raw) return;

  try {
    decodeConfigCode(raw);
    renderScripts();
    renderResetCounts();
    resetWorld();
  } catch (error) {
    window.alert("Import code is invalid.");
  }
}

function decodeConfigCode(raw) {
  if (!raw.startsWith("CL1~")) {
    throw new Error("Invalid header");
  }

  const segments = raw.split("~").slice(1);
  const map = new Map();
  segments.forEach((segment) => {
    const [key, ...rest] = segment.split("=");
    map.set(key, rest.join("="));
  });

  const countsValue = map.get("counts");
  if (countsValue) {
    countsValue.split(",").forEach((entry) => {
      const [color, value] = entry.split(":");
      if (!COLORS.some((item) => item.value === color)) return;
      state.resetCounts[color] = clampInt(value, 0, 1000, state.resetCounts[color] || 0);
    });
  }

  const optionsValue = map.get("options");
  if (optionsValue) {
    optionsValue.split(",").forEach((entry) => {
      const [option, value] = entry.split(":");
      if (option === "worldSize") {
        setWorldSize(value);
      }
      if (option === "multiSurround") {
        state.multiSurround = value === "1";
        refs.multiSurroundToggle.checked = state.multiSurround;
      }
      if (option === "disableSideWarp") {
        state.disableSideWarp = value === "1";
        if (refs.disableSideWarpToggle) refs.disableSideWarpToggle.checked = state.disableSideWarp;
      }
      if (option === "maxPerParticle") {
        state.maxSurroundPerParticle = clampInt(value, 0, MAX_PARTICLES, state.maxSurroundPerParticle);
        refs.maxSurroundPerParticleInput.value = String(state.maxSurroundPerParticle);
      }
      if (option === "maxPerGroup") {
        state.maxSurroundPerGroup = clampInt(value, 0, MAX_PARTICLES, state.maxSurroundPerGroup);
        refs.maxSurroundPerGroupInput.value = String(state.maxSurroundPerGroup);
      }
    });
  }

  const scriptsValue = map.get("scripts");
  if (!scriptsValue || scriptsValue === "none") {
    state.scripts = [];
    return;
  }

  state.scripts = scriptsValue.split(";").filter(Boolean).map((scriptChunk, index) => {
    const script = createScript();
    script.id = `import-script-${index}`;
    script.conditions = [];

    scriptChunk.split(",").forEach((part) => {
      const [key, ...rest] = part.split(":");
      const value = rest.join(":");
      if (key === "src" && COLORS.some((item) => item.value === value)) script.sourceColor = value;
      if (key === "act" && ACTION_OPTIONS.some((item) => item.value === value)) script.action = value;
      if (key === "str" && value !== "") script.strength = clampStrength(value);
      if (key === "tgt" && COLORS.some((item) => item.value === value)) script.targetColor = value;
      if (key === "spc" && COLORS.some((item) => item.value === value)) script.spawnColor = value;
      if (key === "spn") script.spawnCount = clampInt(value, 1, 10, 1);
      if (key === "if" && value !== "none") {
        script.conditions = value.split("+").map((conditionChunk) => {
          const condition = createCondition();
          conditionChunk.split("&").forEach((conditionPart) => {
            const [conditionKey, ...conditionRest] = conditionPart.split(":");
            const conditionValue = conditionRest.join(":");
            if (conditionKey === "op" && CONDITION_OPERATOR_OPTIONS.some((item) => item.value === conditionValue)) {
              condition.operator = conditionValue;
            }
            if (conditionKey === "not") condition.negated = conditionValue === "1";
            if (conditionKey === "type" && CONDITION_TYPE_OPTIONS.some((item) => item.value === conditionValue)) {
              condition.type = conditionValue;
            }
            if (conditionKey === "num" && conditionValue !== "") {
              condition.number = clampInt(conditionValue, 1, IO_COUNT, 1);
            }
            if (conditionKey === "color" && COLORS.some((item) => item.value === conditionValue)) {
              condition.color = conditionValue;
            }
            if (conditionKey === "cool") {
              condition.cooldownSeconds = clamp(Number(conditionValue) || 0, 0, 60);
            }
          });
          return condition;
        });
      }
    });

    return script;
  });
}

function createCondition() {
  return {
    operator: "and",
    negated: false,
    type: "buttonPressed",
    number: 1,
    primaryColor: "red",
    secondaryColor: "green",
    cooldownSeconds: 0,
  };
}

function renderButtonInputs() {
  if (!refs.buttonInputsList) return;
  refs.buttonInputsList.innerHTML = "";
  const releaseHandlers = [];

  for (let number = 1; number <= IO_COUNT; number += 1) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "button ghost io-button-chip";
    btn.textContent = String(number);
    btn.setAttribute("aria-label", `Button ${number}`);

    const setPressed = (pressed) => {
      state.buttons[number] = pressed;
      btn.classList.toggle("is-pressed", pressed);
    };

    btn.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      setPressed(true);
    });
    btn.addEventListener("pointerup", () => setPressed(false));
    btn.addEventListener("pointerleave", () => setPressed(false));
    btn.addEventListener("pointercancel", () => setPressed(false));
    releaseHandlers.push(setPressed);

    refs.buttonInputsList.appendChild(btn);
  }

  // Releasing the pointer anywhere on the page lets go of any held button.
  window.addEventListener("pointerup", () => releaseHandlers.forEach((release) => release(false)));
}

function renderSwitchInputs() {
  if (!refs.switchInputsList) return;
  refs.switchInputsList.innerHTML = "";

  for (let number = 1; number <= IO_COUNT; number += 1) {
    const label = document.createElement("label");
    label.className = "possession-toggle io-switch-chip";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = Boolean(state.switches[number]);
    input.addEventListener("change", (event) => {
      state.switches[number] = event.target.checked;
    });

    const span = document.createElement("span");
    span.textContent = `Switch ${number}`;

    label.append(input, span);
    refs.switchInputsList.appendChild(label);
  }
}

function evaluateScriptConditions(script, source) {
  const conditions = script.conditions || [];
  if (conditions.length === 0) return true;

  let result = evaluateCondition(conditions[0], source);
  for (let index = 1; index < conditions.length; index += 1) {
    const condition = conditions[index];
    const value = evaluateCondition(condition, source);
    result = condition.operator === "or" ? result || value : result && value;
  }
  return result;
}

function evaluateCondition(condition, source) {
  let value = false;

  if (condition.type === "buttonPressed") {
    value = Boolean(state.buttons[condition.number || 1]);
  } else if (condition.type === "buttonReleased") {
    value = !state.buttons[condition.number || 1];
  } else if (condition.type === "switchOn") {
    value = Boolean(state.switches[condition.number || 1]);
  } else if (condition.type === "switchOff") {
    value = !state.switches[condition.number || 1];
  } else if (condition.type === "nearColor") {
    const targets = state.particles.filter(
      (particle) => particle.color === condition.color && particle.id !== source.id
    );
    value = findNearestTargetsInRange(source, targets, CONDITION_NEAR_RANGE, 1).length > 0;
  } else if (condition.type === "touching") {
    value = evaluateTouchingCondition(condition);
  }

  return condition.negated ? !value : value;
}

function evaluateTouchingCondition(condition) {
  const primaryColor = condition.primaryColor || "red";
  const secondaryColor = condition.secondaryColor || "green";
  const primaryParticles = state.particles.filter((particle) => particle.color === primaryColor);
  const secondaryParticles = state.particles.filter((particle) => particle.color === secondaryColor);
  const isSameColor = primaryColor === secondaryColor;
  let isTouching = false;

  for (let index = 0; index < primaryParticles.length; index += 1) {
    const primary = primaryParticles[index];
    const targets = isSameColor
      ? secondaryParticles.filter((particle) => particle.id !== primary.id)
      : secondaryParticles;
    if (findNearestTargetsInRange(primary, targets, PARTICLE_RADIUS * 2.1, 1).length > 0) {
      isTouching = true;
      break;
    }
  }

  state.touchConditionMemory = state.touchConditionMemory || {};
  const key = `${primaryColor}:${secondaryColor}:${condition.cooldownSeconds ?? 0}`;
  const reverseKey = `${secondaryColor}:${primaryColor}:${condition.cooldownSeconds ?? 0}`;
  const memoryKey = primaryColor <= secondaryColor ? key : reverseKey;
  const memory = state.touchConditionMemory[memoryKey] || { latched: false, cooldownUntil: 0 };

  if (isTouching) {
    if (!memory.latched && state.lastFrame >= memory.cooldownUntil) {
      memory.latched = true;
      state.touchConditionMemory[memoryKey] = memory;
      return true;
    }
    state.touchConditionMemory[memoryKey] = memory;
    return false;
  }

  if (memory.latched) {
    memory.latched = false;
    memory.cooldownUntil = state.lastFrame + (condition.cooldownSeconds || 0) * 1000;
  }

  state.touchConditionMemory[memoryKey] = memory;
  return false;
}

function applyEatActions() {
  const eatenIds = new Set();

  state.scripts.forEach((script) => {
    if (script.action !== "eat") return;

    const sources = state.particles.filter((particle) => particle.color === script.sourceColor);
    const targets = state.particles.filter((particle) => particle.color === script.targetColor);
    if (sources.length === 0 || targets.length === 0) return;

    sources.forEach((source) => {
      if (!isScriptMovementEnabledForParticle(script, source)) return;
      if (source.eatCooldown > 0 || !evaluateScriptConditions(script, source)) return;
      const nearby = findNearestTargetsInRange(source, targets, EAT_RADIUS, 1)[0];
      if (!nearby) return;
      eatenIds.add(nearby.target.id);
      source.eatCooldown = 0.45 / getStrengthCooldownMultiplier(script);
    });
  });

  if (eatenIds.size > 0) {
    state.particles = state.particles.filter((particle) => !eatenIds.has(particle.id));
    if (state.selectedParticleId && !state.particles.some((particle) => particle.id === state.selectedParticleId)) {
      state.selectedParticleId = null;
      renderSelectedParticle();
    }
    if (state.possessedParticleId && !state.particles.some((particle) => particle.id === state.possessedParticleId)) {
      state.possessedParticleId = null;
      state.pressedKeys.clear();
    }
  }
}

function applySpawnActions() {
  if (state.particles.length >= MAX_PARTICLES) return;

  const spawnedParticles = [];

  state.scripts.forEach((script) => {
    if (script.action !== "spawn") return;

    const sources = state.particles.filter((particle) => particle.color === script.sourceColor);
    sources.forEach((source) => {
      if (
        source.spawnCooldown > 0 ||
        !evaluateScriptConditions(script, source) ||
        state.particles.length + spawnedParticles.length >= MAX_PARTICLES
      ) {
        return;
      }

      const angle = randomFloat(0, Math.PI * 2);
      const distance = PARTICLE_RADIUS * 3 + randomFloat(0.2, 1.2);
      const copies = clampInt(script.spawnCount ?? 1, 1, 10, 1);
      for (
        let copyIndex = 0;
        copyIndex < copies && state.particles.length + spawnedParticles.length < MAX_PARTICLES;
        copyIndex += 1
      ) {
        const copyAngle = angle + (Math.PI * 2 * copyIndex) / Math.max(copies, 1);
        spawnedParticles.push({
          id: state.nextParticleId++,
          color: script.spawnColor || source.color,
          x: placeCoordinate(source.x + Math.cos(copyAngle) * distance),
          y: placeCoordinate(source.y + Math.sin(copyAngle) * distance),
          vx: source.vx + Math.cos(copyAngle) * 0.08,
          vy: source.vy + Math.sin(copyAngle) * 0.08,
          heading: source.heading,
          spawnCooldown: 1.2 / getStrengthCooldownMultiplier(script),
          eatCooldown: 0,
        });
      }
      source.spawnCooldown = 1.4 / getStrengthCooldownMultiplier(script);
    });
  });

  if (spawnedParticles.length > 0) {
    state.particles.push(...spawnedParticles);
  }
}

function getAggregateScriptMetric() {
  const script = state.scripts[0];
  if (!script) return null;

  const sources = state.particles.filter((particle) => particle.color === script.sourceColor);
  const targets = state.particles.filter((particle) => particle.color === script.targetColor);
  if (sources.length === 0 || targets.length === 0) return null;

  const distances = sources
    .map((source) => {
      const nearest = findNearestTargetsInRange(source, targets, WORLD_SIZE, 1)[0];
      return nearest?.distance ?? null;
    })
    .filter((distance) => Number.isFinite(distance));

  if (distances.length === 0) return null;

  const average = distances.reduce((sum, distance) => sum + distance, 0) / distances.length;
  return {
    averageSourceToTargetDistance: average.toFixed(3),
    minSourceToTargetDistance: Math.min(...distances).toFixed(3),
    maxSourceToTargetDistance: Math.max(...distances).toFixed(3),
  };
}

function buildMatrixInputsGrid() {
  const rows = Array.from(document.querySelectorAll(".particle-matrix tbody tr"));
  return rows.map((row) => Array.from(row.querySelectorAll("input.matrix-input")));
}

function getMatrixValue(rowColor, colColor) {
  const rowIndex = COLORS.findIndex((color) => color.value === rowColor);
  const colIndex = COLORS.findIndex((color) => color.value === colColor);
  if (rowIndex === -1 || colIndex === -1) return 0;
  const input = state.matrixInputsGrid[rowIndex]?.[colIndex];
  if (!input) return 0;
  const value = Number(input.value);
  return Number.isFinite(value) ? value : 0;
}

function getMatrixForceMagnitude(normalizedDistance, value) {
  const beta = MATRIX_CLOSE_RANGE_FRACTION;
  if (normalizedDistance < beta) {
    // Universal close-range repulsion regardless of the matrix value, so particles never fully overlap.
    return normalizedDistance / beta - 1;
  }
  if (normalizedDistance < 1) {
    return value * (1 - Math.abs(2 * normalizedDistance - 1 - beta) / (1 - beta));
  }
  return 0;
}

function applyMatrixForces(forces) {
  const particles = state.particles;
  for (let i = 0; i < particles.length; i += 1) {
    const a = particles[i];
    for (let j = i + 1; j < particles.length; j += 1) {
      const b = particles[j];
      const offset = getWrappedOffset(a, b);
      const distance = Math.hypot(offset.dx, offset.dy);
      if (distance === 0 || distance > MATRIX_INTERACTION_RANGE) continue;

      const normalizedDistance = distance / MATRIX_INTERACTION_RANGE;
      const nx = offset.dx / distance;
      const ny = offset.dy / distance;

      // Column ("top") color is the affected particle; row ("side") color is the one exerting the pull/push.
      const valueForA = getMatrixValue(b.color, a.color);
      const valueForB = getMatrixValue(a.color, b.color);
      const magnitudeForA = getMatrixForceMagnitude(normalizedDistance, valueForA);
      const magnitudeForB = getMatrixForceMagnitude(normalizedDistance, valueForB);

      if (magnitudeForA !== 0) {
        addForce(forces, a.id, nx, ny, magnitudeForA * MATRIX_FORCE);
      }
      if (magnitudeForB !== 0) {
        addForce(forces, b.id, -nx, -ny, magnitudeForB * MATRIX_FORCE);
      }
    }
  }
}

function applyGlobalRepulsion(forces) {
  for (let index = 0; index < state.particles.length; index += 1) {
    const a = state.particles[index];
    for (let otherIndex = index + 1; otherIndex < state.particles.length; otherIndex += 1) {
      const b = state.particles[otherIndex];
      const offset = getWrappedOffset(a, b);
      const distance = Math.hypot(offset.dx, offset.dy);
      if (distance === 0 || distance > CLOSE_REPULSION_RANGE) continue;
      const strength = 1 - distance / CLOSE_REPULSION_RANGE;
      addForce(forces, a.id, -offset.dx / distance, -offset.dy / distance, strength * 1.8);
      addForce(forces, b.id, offset.dx / distance, offset.dy / distance, strength * 1.8);
    }
  }
}

function addForce(forces, particleId, nx, ny, magnitude) {
  const current = forces.get(particleId);
  if (!current) return;
  current.x += nx * magnitude;
  current.y += ny * magnitude;
}

function findNearestTargetsInRange(source, targets, maxDistance, limit) {
  const matches = [];

  targets.forEach((target) => {
    if (target.id === source.id) return;
    const offset = getWrappedOffset(source, target);
    const distance = Math.hypot(offset.dx, offset.dy);
    if (distance === 0 || distance > maxDistance) return;
    matches.push({ target, dx: offset.dx, dy: offset.dy, distance });
  });

  matches.sort((a, b) => a.distance - b.distance);
  return matches.slice(0, limit);
}
