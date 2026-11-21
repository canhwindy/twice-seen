// The heads-up display: level and scene, the big "left to find" counter with one pip per change,
// the score and combo, the hint bulbs, the draining clock bar and the key guide along the bottom.
import { HUD_BOTTOM, HUD_TOP } from './panels.js';
import { remaining } from './session.js';
import { tierName } from './levels.js';
import { TAU } from './shapes.js';

export const FONT = '"Trebuchet MS", "Segoe UI", "Helvetica Neue", Arial, sans-serif';

export function drawHud(ctx, view, layout, session, now) {
  const { puzzle, plan } = session;
  const left = remaining(session);
  const total = puzzle.diffs.length;
  const bg = ctx.createLinearGradient(0, 0, 0, HUD_TOP);
  bg.addColorStop(0, '#1f1a3a');
  bg.addColorStop(1, '#151229');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, view.w, HUD_TOP - 28);

  const x0 = layout.panels[0].x;
  const x1 = layout.panels[1].x + layout.panels[1].w;
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffcf5a';
  ctx.font = `800 15px ${FONT}`;
  ctx.fillText('TWICE SEEN', x0, 28);
  ctx.fillStyle = '#ffffff';
  ctx.font = `700 24px ${FONT}`;
  const title = `Level ${plan.index + 1}: ${plan.scene.name}`;
  ctx.fillText(title, x0, 58);
  const tw = ctx.measureText(title).width;
  chip(ctx, x0 + tw + 12, 40, tierName(plan.subtle), '#7c5cff');

  drawCounter(ctx, view.w / 2, 40, left, total, puzzle, now);
  drawScore(ctx, x1, session, now);
  drawClock(ctx, x0, x1, session, now);
  drawFooter(ctx, view, layout, session);
}

function drawCounter(ctx, cx, cy, left, total, puzzle, now) {
  const lastFind = Math.max(-9, ...puzzle.diffs.filter((d) => d.found).map((d) => d.foundAt));
  const pop = Math.max(0, 1 - (now - lastFind) / 0.35);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(1 + pop * 0.18, 1 + pop * 0.18);
  ctx.beginPath();
  ctx.roundRect(-108, -30, 216, 54, 27);
  ctx.fillStyle = left === 0 ? '#2fbf71' : '#ffcf5a';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#2a1f4d';
  ctx.stroke();
  ctx.fillStyle = '#2a1f4d';
  ctx.textAlign = 'center';
  ctx.font = `900 34px ${FONT}`;
  ctx.fillText(String(left), -60, 9);
  ctx.textAlign = 'left';
  ctx.font = `800 14px ${FONT}`;
  ctx.fillText(left === 1 ? 'DIFFERENCE' : 'DIFFERENCES', -34, -4);
  ctx.fillText('LEFT TO FIND', -34, 13);
  ctx.restore();
  const gap = 19;
  const start = cx - ((total - 1) * gap) / 2;
  puzzle.diffs.forEach((d, i) => {
    const x = start + i * gap;
    ctx.beginPath();
    ctx.arc(x, cy + 34, 6.5, 0, TAU);
    ctx.fillStyle = d.found ? '#ffd43b' : 'rgba(255,255,255,0.08)';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = d.found ? '#fff3bf' : 'rgba(255,255,255,0.55)';
    ctx.stroke();
  });
}

function drawScore(ctx, right, session, now) {
  ctx.textAlign = 'right';
  ctx.fillStyle = '#b9b3e0';
  ctx.font = `700 13px ${FONT}`;
  ctx.fillText('SCORE', right, 24);
  ctx.fillStyle = '#ffffff';
  ctx.font = `800 26px ${FONT}`;
  ctx.fillText(session.score.toLocaleString('en-US'), right, 52);
  const sw = Math.max(110, ctx.measureText(session.score.toLocaleString('en-US')).width + 14);
  if (session.state === 'play' && session.combo > 1 && now - session.lastFindAt < 6) {
    chip(ctx, right - sw - 8 - 74, 36, `COMBO x${session.combo}`, '#ff6b9a', true);
  }
  for (let i = 0; i < 3; i++) bulb(ctx, right - sw - 22 - i * 26, 64, i < session.hints, session.hint);
}

function drawClock(ctx, x0, x1, session, now) {
  const y = HUD_TOP - 16;
  const w = x1 - x0;
  const share = session.timeLeft / session.timeMax;
  const low = session.timeLeft < 15 && session.state === 'play';
  ctx.beginPath();
  ctx.roundRect(x0, y - 6, w, 12, 6);
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.fill();
  const colour = share > 0.5 ? '#46d39a' : share > 0.2 ? '#ffb02e' : '#ff4d5e';
  ctx.beginPath();
  ctx.roundRect(x0, y - 6, Math.max(12, w * share), 12, 6);
  ctx.fillStyle = colour;
  if (low) ctx.globalAlpha = 0.65 + 0.35 * Math.sin(now * 10);
  ctx.fill();
  ctx.globalAlpha = 1;
  const secs = Math.ceil(session.timeLeft);
  const text = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
  ctx.font = `800 15px ${FONT}`;
  ctx.textAlign = 'center';
  const tx = Math.max(x0 + 26, x0 + w * share - 24);
  ctx.beginPath();
  ctx.roundRect(tx - 24, y - 12, 48, 24, 12);
  ctx.fillStyle = '#151229';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = colour;
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, tx, y + 5);
}

function drawFooter(ctx, view, layout, session) {
  const y = view.h - HUD_BOTTOM / 2;
  const keys = [['Click', 'spot a change'], ['H', 'hint'], ['L', 'twin loupe'], ['Arrows + Space', 'aim and pick'], ['P', 'pause'], ['M', session.muted ? 'sound off' : 'sound on']];
  ctx.font = `700 14px ${FONT}`;
  let width = 0;
  const parts = keys.map(([key, what]) => {
    ctx.font = `800 13px ${FONT}`;
    const kw = ctx.measureText(key).width + 16;
    ctx.font = `600 14px ${FONT}`;
    const ww = ctx.measureText(what).width;
    width += kw + 8 + ww + 26;
    return { key, what, kw, ww };
  });
  let x = view.w / 2 - width / 2;
  for (const part of parts) {
    ctx.beginPath();
    ctx.roundRect(x, y - 12, part.kw, 24, 6);
    ctx.fillStyle = '#2d2752';
    ctx.fill();
    ctx.strokeStyle = '#5c54a4';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = `800 13px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(part.key, x + part.kw / 2, y + 5);
    ctx.textAlign = 'left';
    ctx.font = `600 14px ${FONT}`;
    ctx.fillStyle = '#c9c3ef';
    ctx.fillText(part.what, x + part.kw + 8, y + 5);
    x += part.kw + 8 + part.ww + 26;
  }
}

export function chip(ctx, x, y, text, colour, glow = false) {
  ctx.font = `800 13px ${FONT}`;
  const w = ctx.measureText(text).width + 18;
  ctx.beginPath();
  ctx.roundRect(x, y - 13, w, 24, 12);
  ctx.fillStyle = colour;
  if (glow) {
    ctx.shadowColor = colour;
    ctx.shadowBlur = 12;
  }
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.fillText(text, x + 9, y + 4);
  return w;
}

function bulb(ctx, x, y, lit, active) {
  ctx.beginPath();
  ctx.arc(x, y - 4, 8, 0, TAU);
  ctx.fillStyle = lit ? '#ffe066' : 'rgba(255,255,255,0.12)';
  if (lit && active) {
    ctx.shadowColor = '#ffe066';
    ctx.shadowBlur = 10;
  }
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = lit ? '#c9a227' : 'rgba(255,255,255,0.2)';
  ctx.fillRect(x - 4, y + 4, 8, 5);
}
