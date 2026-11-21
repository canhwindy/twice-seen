// The twin loupe and the mirror cursor: wherever you point in one picture, a ghost cursor shows
// the same spot in the other, and with the loupe on both spots are magnified side by side.
import { pointToScene, sceneToPoint } from './panels.js';
import { TAU } from './shapes.js';

const ZOOM = 2.3;
const RADIUS = 72;

export function drawAim(ctx, layout, pictures, cursor, loupeOn) {
  if (!cursor) return;
  const at = pointToScene(layout, cursor.x, cursor.y);
  if (!at) return;
  for (const panel of layout.panels) {
    const p = sceneToPoint(panel, at.x, at.y);
    if (loupeOn) drawLens(ctx, panel, pictures[panel.side], at, p);
    if (panel.side !== at.side) ghost(ctx, p.x, p.y);
  }
  if (!loupeOn) crosshair(ctx, cursor.x, cursor.y);
}

function drawLens(ctx, panel, picture, at, p) {
  const k = panel.w / 640;
  const src = picture.width / 640;
  const half = RADIUS / (ZOOM * k);
  ctx.save();
  ctx.beginPath();
  ctx.arc(p.x, p.y, RADIUS, 0, TAU);
  ctx.clip();
  ctx.fillStyle = '#000';
  ctx.fill();
  ctx.drawImage(picture, (at.x - half) * src, (at.y - half) * src, half * 2 * src, half * 2 * src, p.x - RADIUS, p.y - RADIUS, RADIUS * 2, RADIUS * 2);
  ctx.restore();
  ctx.beginPath();
  ctx.arc(p.x, p.y, RADIUS, 0, TAU);
  ctx.lineWidth = 7;
  ctx.strokeStyle = '#2a1f4d';
  ctx.stroke();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#ffcf5a';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(p.x - RADIUS * 0.35, p.y - RADIUS * 0.4, RADIUS * 0.28, Math.PI * 1.05, Math.PI * 1.6);
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = 4;
  ctx.stroke();
}

function ghost(ctx, x, y) {
  ctx.beginPath();
  ctx.arc(x, y, 11, 0, TAU);
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(20,16,40,0.6)';
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#ffffff';
  ctx.setLineDash([4, 4]);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.arc(x, y, 2.5, 0, TAU);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
}

function crosshair(ctx, x, y) {
  for (const [w, c] of [[4.5, 'rgba(20,16,40,0.6)'], [2, '#ffffff']]) {
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, TAU);
    ctx.moveTo(x - 18, y);
    ctx.lineTo(x - 6, y);
    ctx.moveTo(x + 6, y);
    ctx.lineTo(x + 18, y);
    ctx.moveTo(x, y - 18);
    ctx.lineTo(x, y - 6);
    ctx.moveTo(x, y + 6);
    ctx.lineTo(x, y + 18);
    ctx.lineWidth = w;
    ctx.strokeStyle = c;
    ctx.stroke();
  }
}
