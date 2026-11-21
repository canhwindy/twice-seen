// Boots the game: sizes the canvas, wires input and sound to the session's rules, runs the frame
// loop and draws each frame in layers (pictures, markers, aim and loupe, HUD, cards).
import { createAudio } from './audio.js';
import { makePuzzle } from './differences.js';
import { drawHud } from './hud.js';
import { attachInput } from './input.js';
import { SCENES } from './levels.js';
import { drawAim } from './loupe.js';
import { drawMarkers, pruneEffects } from './markers.js';
import { layoutPanels, paintPuzzle, pointToScene } from './panels.js';
import { drawBackdrop, drawClear, drawIntro, drawPause, drawTimeUp, drawTitle } from './screens.js';
import { clickAt, createSession, startLevel, tick, togglePause, useHint } from './session.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const status = document.getElementById('status');
const params = new URLSearchParams(location.search);
const view = { w: 0, h: 0, dpr: 1 };
const audio = createAudio();
const session = createSession(Number(params.get('seed')) || (Date.now() >>> 0));
let layout = null;
let paintedKey = '';
let clock = 0;
let frozen = false;
let loupeOn = false;
let scoreAtLevelStart = 0;
let lastTickSecond = Infinity;
let demo = null;

const input = attachInput(canvas, {
  pick: (x, y) => press({ x, y }),
  confirm: (cursor) => press(cursor || homePoint()),
  hint: () => {
    if (useHint(session, clock)) {
      audio.play('hint');
      announce('Hint: look inside the bright circle.');
    }
  },
  loupe: () => (loupeOn = !loupeOn),
  pause: () => togglePause(session),
  mute: () => (session.muted = audio.toggle()),
  restart: () => {
    if (session.puzzle && session.state !== 'title') retry();
  },
  next: () => session.state === 'clear' && nextLevel(),
});

function press(point) {
  audio.unlock();
  if (session.state === 'title') return begin();
  if (session.state === 'clear') return nextLevel();
  if (session.state === 'timeup') return retry();
  if (session.state !== 'play' || !point) return;
  const at = pointToScene(layout, point.x, point.y);
  if (!at) return;
  const outcome = clickAt(session, at.side, at.x, at.y, clock);
  if (outcome.result === 'found') {
    audio.play('find', session.combo);
    announce(`Found one: ${outcome.diff.label}.`);
    if (outcome.cleared) {
      audio.play('clear');
      announce(`Level clear with ${outcome.cleared.stars} stars.`);
    }
  } else if (outcome.result === 'miss') {
    audio.play('miss');
  } else if (outcome.result === 'already') {
    audio.play('already');
  }
}

function begin() {
  session.score = 0;
  scoreAtLevelStart = 0;
  startLevel(session, 0, clock);
  audio.play('start');
}

function nextLevel() {
  scoreAtLevelStart = session.score;
  startLevel(session, session.levelIndex + 1, clock);
  audio.play('start');
}

function retry() {
  session.score = scoreAtLevelStart;
  startLevel(session, session.levelIndex, clock);
  audio.play('start');
}

function homePoint() {
  const p = layout.panels[0];
  return { x: p.x + p.w / 2, y: p.y + p.h / 2 };
}

function announce(text) {
  status.textContent = text;
}

function resize() {
  view.dpr = window.devicePixelRatio || 1;
  view.w = window.innerWidth;
  view.h = window.innerHeight;
  canvas.width = Math.round(view.w * view.dpr);
  canvas.height = Math.round(view.h * view.dpr);
  ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
  layout = layoutPanels(view.w, view.h);
  paintedKey = '';
  demo = null;
}

function ensurePictures() {
  const key = `${session.puzzle.seed}:${layout.panels[0].w}:${view.dpr}`;
  if (session.pictures && paintedKey === key) return;
  session.pictures = paintPuzzle(session.puzzle, layout.scale * view.dpr);
  paintedKey = key;
}

function ensureDemo() {
  if (demo) return demo;
  const puzzle = makePuzzle(SCENES[0], 2026, 5, 0.1);
  const pictures = paintPuzzle(puzzle, Math.min(1, (view.w * 0.3) / 640) * view.dpr);
  demo = { ...pictures, ring: puzzle.diffs.slice(0, 2) };
  return demo;
}

function drawPictures() {
  const shakeFx = session.effects.filter((fx) => fx.type === 'miss').pop();
  const shake = shakeFx ? Math.max(0, 0.3 - (clock - shakeFx.at)) * 30 : 0;
  const low = session.state === 'play' && session.timeLeft < 15;
  for (const panel of layout.panels) {
    const dx = shake ? Math.sin(clock * 90) * shake : 0;
    ctx.save();
    ctx.translate(dx, 0);
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#000';
    ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
    ctx.shadowBlur = 0;
    if (session.state === 'paused') {
      ctx.fillStyle = '#2a2350';
      ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
    } else {
      ctx.drawImage(session.pictures[panel.side], panel.x, panel.y, panel.w, panel.h);
    }
    ctx.lineWidth = 5;
    ctx.strokeStyle = low ? `rgba(255,77,94,${0.6 + 0.4 * Math.sin(clock * 10)})` : '#f4efe1';
    ctx.strokeRect(panel.x - 2.5, panel.y - 2.5, panel.w + 5, panel.h + 5);
    ctx.restore();
  }
}

function render() {
  ctx.clearRect(0, 0, view.w, view.h);
  canvas.style.cursor = session.state === 'play' ? 'none' : 'pointer';
  if (session.state === 'title') {
    drawTitle(ctx, view, ensureDemo(), session.best, clock);
    return;
  }
  drawBackdrop(ctx, view, clock);
  ensurePictures();
  drawPictures();
  if (session.state !== 'paused') drawMarkers(ctx, layout, session, clock);
  if (session.state === 'play') drawAim(ctx, layout, session.pictures, input.state.cursor, loupeOn);
  drawHud(ctx, view, layout, session, clock);
  if (session.state === 'intro') drawIntro(ctx, view, session, clock);
  if (session.state === 'paused') drawPause(ctx, view);
  if (session.state === 'clear') drawClear(ctx, view, session, clock);
  if (session.state === 'timeup') drawTimeUp(ctx, view, session);
}

function step(dt) {
  if (!frozen) clock += dt;
  input.update(dt, homePoint());
  const event = tick(session, frozen ? 0 : dt, clock);
  if (event === 'timeup') {
    audio.play('timeup');
    announce("Time's up. The missed changes are circled in red.");
  }
  if (session.state === 'play' && session.timeLeft < 10) {
    const second = Math.ceil(session.timeLeft);
    if (second < lastTickSecond) audio.play('tick');
    lastTickSecond = second;
  } else {
    lastTickSecond = Infinity;
  }
  if (!frozen) pruneEffects(session, clock);
}

let last = performance.now();
function frame(ts) {
  const dt = Math.min(0.05, (ts - last) / 1000);
  last = ts;
  step(dt);
  render();
  requestAnimationFrame(frame);
}

window.addEventListener('resize', resize);
resize();
const shot = params.get('shot');
if (shot) {
  const setup = applyShot(shot, session, layout);
  clock = setup.clock;
  frozen = true;
  loupeOn = setup.loupe;
  input.state.cursor = setup.cursor;
  window.__shotReady = true;
}
requestAnimationFrame(frame);
