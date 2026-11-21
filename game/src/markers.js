// Everything drawn over the pictures: the ring on each find (on both pictures), the red cross of a
// miss, sparkle bursts, floating points, the hint spotlight and, at time up, the changes missed.
import { TAU } from './shapes.js';
import { sceneToPoint } from './panels.js';

const RING_DRAW = 0.38;

export function drawMarkers(ctx, layout, session, now) {
  const { puzzle } = session;
  for (const panel of layout.panels) {
    const k = panel.w / 640;
    ctx.save();
    ctx.beginPath();
    ctx.rect(panel.x, panel.y, panel.w, panel.h);
    ctx.clip();
    if (session.hint) drawHint(ctx, panel, session.hint, k, now);
    for (const diff of puzzle.diffs) {
      if (diff.found) drawFoundRing(ctx, panel, diff, k, now);
      else if (session.state === 'timeup') drawMissedRing(ctx, panel, diff, k, now);
    }
    for (const fx of session.effects) drawEffect(ctx, panel, fx, k, now);
    ctx.restore();
  }
}

export function pruneEffects(session, now) {
  session.effects = session.effects.filter((fx) => now - fx.at < 1.6);
}

function drawFoundRing(ctx, panel, diff, k, now) {
  const p = Math.min(1, (now - diff.foundAt) / RING_DRAW);
  const ease = 1 - Math.pow(1 - p, 3);
  const c = sceneToPoint(panel, diff.x, diff.y);
  const r = diff.r * k * (1 + 0.35 * (1 - ease));
  const start = -Math.PI / 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(c.x, c.y, r, start, start + TAU * ease);
  ctx.strokeStyle = 'rgba(20,16,40,0.55)';
  ctx.lineWidth = 9;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(c.x, c.y, r, start, start + TAU * ease);
  ctx.strokeStyle = '#ffd43b';
  ctx.lineWidth = 5;
  ctx.stroke();
  if (p < 1) return;
  const bx = c.x + r * 0.72;
  const by = c.y - r * 0.72;
  ctx.beginPath();
  ctx.arc(bx, by, 10, 0, TAU);
  ctx.fillStyle = '#2fbf71';
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(bx - 4.5, by);
  ctx.lineTo(bx - 1, by + 3.6);
  ctx.lineTo(bx + 5, by - 3.6);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.6;
  ctx.stroke();
}

function drawMissedRing(ctx, panel, diff, k, now) {
  const c = sceneToPoint(panel, diff.x, diff.y);
  const pulse = 1 + Math.sin(now * 5 + diff.id) * 0.06;
  ctx.save();
  ctx.setLineDash([10, 7]);
  ctx.lineDashOffset = -now * 30;
  ctx.beginPath();
  ctx.arc(c.x, c.y, diff.r * k * pulse, 0, TAU);
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 7;
  ctx.stroke();
  ctx.strokeStyle = '#ff4d5e';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.restore();
}

function drawHint(ctx, panel, hint, k, now) {
  const t = Math.min(1, (now - hint.start) / 0.7);
  const fade = Math.min(1, (hint.until - now) / 0.5);
  const c = sceneToPoint(panel, hint.x, hint.y);
  const r = hint.r * k * (1.8 - 0.8 * t);
  ctx.save();
  ctx.globalAlpha = Math.max(0, fade);
  ctx.beginPath();
  ctx.rect(panel.x, panel.y, panel.w, panel.h);
  ctx.arc(c.x, c.y, r, 0, TAU, true);
  ctx.fillStyle = 'rgba(8,10,30,0.55)';
  ctx.fill();
  ctx.setLineDash([12, 8]);
  ctx.lineDashOffset = now * 40;
  ctx.beginPath();
  ctx.arc(c.x, c.y, r, 0, TAU);
  ctx.strokeStyle = '#7ef3ff';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();
}

function drawEffect(ctx, panel, fx, k, now) {
  const age = now - fx.at;
  if (fx.type === 'miss' && fx.side === panel.side) {
    const c = sceneToPoint(panel, fx.x, fx.y);
    const a = Math.max(0, 1 - age / 0.8);
    const s = 13 + age * 10;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.lineCap = 'round';
    for (const [w, col] of [[8, 'rgba(0,0,0,0.5)'], [4.5, '#ff4d5e']]) {
      ctx.beginPath();
      ctx.moveTo(c.x - s, c.y - s);
      ctx.lineTo(c.x + s, c.y + s);
      ctx.moveTo(c.x + s, c.y - s);
      ctx.lineTo(c.x - s, c.y + s);
      ctx.strokeStyle = col;
      ctx.lineWidth = w;
      ctx.stroke();
    }
    ctx.restore();
  } else if (fx.type === 'burst') {
    const c = sceneToPoint(panel, fx.x, fx.y);
    const a = Math.max(0, 1 - age / 0.9);
    if (a <= 0) return;
    ctx.save();
    ctx.globalAlpha = a;
    for (let i = 0; i < 12; i++) {
      const ang = (i / 12) * TAU + fx.x;
      const dist = (fx.r * k) * (0.9 + age * 2.2);
      const x = c.x + Math.cos(ang) * dist;
      const y = c.y + Math.sin(ang) * dist;
      sparkle(ctx, x, y, 5 * a + 2, i % 3 ? '#fff3bf' : '#ffd43b');
    }
    ctx.restore();
  } else if (fx.type === 'float' && fx.side === panel.side) {
    const c = sceneToPoint(panel, Math.min(560, Math.max(80, fx.x)), Math.max(40, fx.y));
    const a = Math.max(0, 1 - age / 1.3);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.font = '800 20px "Trebuchet MS", "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'rgba(20,16,40,0.8)';
    ctx.strokeText(fx.text, c.x, c.y - age * 34);
    ctx.fillStyle = fx.color;
    ctx.fillText(fx.text, c.x, c.y - age * 34);
    ctx.restore();
  }
}

function sparkle(ctx, x, y, s, color) {
  ctx.beginPath();
  ctx.moveTo(x, y - s * 1.6);
  ctx.quadraticCurveTo(x, y, x + s * 1.6, y);
  ctx.quadraticCurveTo(x, y, x, y + s * 1.6);
  ctx.quadraticCurveTo(x, y, x - s * 1.6, y);
  ctx.quadraticCurveTo(x, y, x, y - s * 1.6);
  ctx.fillStyle = color;
  ctx.fill();
}
