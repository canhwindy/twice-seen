// Full screens and cards: the title, the level intro, pause, the level-clear card with its stars
// and score breakdown, and the time-up card that sends you back with the missed changes circled.
import { FONT, chip } from './hud.js';
import { CAMPAIGN_LENGTH, SCENES, tierName } from './levels.js';
import { star, TAU } from './shapes.js';

export function drawBackdrop(ctx, view, now) {
  const g = ctx.createLinearGradient(0, 0, view.w, view.h);
  g.addColorStop(0, '#231c46');
  g.addColorStop(1, '#120f26');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, view.w, view.h);
  ctx.globalAlpha = 0.06;
  for (let i = 0; i < 9; i++) {
    ctx.beginPath();
    ctx.arc((i * 211 + now * 6) % (view.w + 200) - 100, (i * 137) % view.h, 60 + (i % 4) * 30, 0, TAU);
    ctx.fillStyle = i % 2 ? '#ffcf5a' : '#7c5cff';
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export function drawTitle(ctx, view, demo, best, now) {
  drawBackdrop(ctx, view, now);
  const cx = view.w / 2;
  ctx.textAlign = 'center';
  ctx.font = `900 ${Math.round(view.h * 0.12)}px ${FONT}`;
  const ty = view.h * 0.2;
  ctx.fillStyle = '#7c5cff';
  ctx.fillText('Twice Seen', cx + 5, ty + 5);
  ctx.fillStyle = '#ffcf5a';
  ctx.fillText('Twice Seen', cx, ty);
  ctx.font = `600 ${Math.round(view.h * 0.032)}px ${FONT}`;
  ctx.fillStyle = '#d9d3ff';
  ctx.fillText('Two pictures. A handful of sly changes. One ticking clock.', cx, ty + view.h * 0.065);

  if (demo) {
    const w = Math.min(view.w * 0.3, 380);
    const h = w * 0.75;
    const y = view.h * 0.36;
    [[cx - w - 10, demo.left], [cx + 10, demo.right]].forEach(([x, pic]) => {
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 18;
      ctx.drawImage(pic, x, y, w, h);
      ctx.restore();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#ffffff';
      ctx.strokeRect(x, y, w, h);
    });
    const pulse = 1 + Math.sin(now * 3) * 0.08;
    for (const d of demo.ring) {
      for (const x of [cx - w - 10, cx + 10]) {
        ctx.beginPath();
        ctx.arc(x + (d.x / 640) * w, y + (d.y / 480) * h, (d.r / 640) * w * pulse, 0, TAU);
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#ffd43b';
        ctx.stroke();
      }
    }
  }

  const sy = view.h * 0.83;
  let total = 0;
  ctx.font = `800 13px ${FONT}`;
  const widths = SCENES.map((s) => ctx.measureText(s.name).width + 18);
  total = widths.reduce((a, b) => a + b, 0) + (SCENES.length - 1) * 10;
  let x = cx - total / 2;
  SCENES.forEach((s, i) => {
    chip(ctx, x, sy, s.name, s.frame);
    x += widths[i] + 10;
  });
  ctx.textAlign = 'center';
  ctx.font = `800 ${Math.round(view.h * 0.036)}px ${FONT}`;
  ctx.fillStyle = `rgba(255,255,255,${0.7 + 0.3 * Math.sin(now * 4)})`;
  ctx.fillText('Click or press Enter to begin the hunt', cx, view.h * 0.92);
  ctx.font = `600 14px ${FONT}`;
  ctx.fillStyle = '#9d96cc';
  ctx.fillText(`${CAMPAIGN_LENGTH} levels across 4 scenes, then an endless run${best ? `   Best score ${best.toLocaleString('en-US')}` : ''}`, cx, view.h * 0.965);
}

function card(ctx, view, w, h) {
  ctx.fillStyle = 'rgba(10,8,26,0.55)';
  ctx.fillRect(0, 0, view.w, view.h);
  const x = (view.w - w) / 2;
  const y = (view.h - h) / 2;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 30;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 22);
  ctx.fillStyle = '#211b42';
  ctx.fill();
  ctx.restore();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#ffcf5a';
  ctx.stroke();
  return { x, y, cx: view.w / 2 };
}

export function drawIntro(ctx, view, session, now) {
  const { plan } = session;
  const t = Math.min(1, (now - (session.introUntil - 1.8)) / 0.3);
  ctx.save();
  ctx.globalAlpha = t;
  const c = card(ctx, view, 460, 190);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffcf5a';
  ctx.font = `800 16px ${FONT}`;
  ctx.fillText(plan.endless ? `ENDLESS HUNT ${plan.index + 1}` : `LEVEL ${plan.index + 1} OF ${CAMPAIGN_LENGTH}`, c.cx, c.y + 44);
  ctx.fillStyle = '#ffffff';
  ctx.font = `900 36px ${FONT}`;
  ctx.fillText(plan.scene.name, c.cx, c.y + 90);
  ctx.font = `600 18px ${FONT}`;
  ctx.fillStyle = '#d9d3ff';
  ctx.fillText(`${plan.count} differences   ${plan.time} seconds   ${tierName(plan.subtle)} eyes`, c.cx, c.y + 128);
  ctx.font = `600 14px ${FONT}`;
  ctx.fillStyle = '#9d96cc';
  ctx.fillText('Changes hide in either picture. Wrong clicks cost 4 seconds.', c.cx, c.y + 160);
  ctx.restore();
}

export function drawPause(ctx, view) {
  const c = card(ctx, view, 380, 150);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = `900 34px ${FONT}`;
  ctx.fillText('Paused', c.cx, c.y + 62);
  ctx.font = `600 16px ${FONT}`;
  ctx.fillStyle = '#d9d3ff';
  ctx.fillText('The pictures are covered while the clock waits.', c.cx, c.y + 96);
  ctx.fillText('Press P to carry on.', c.cx, c.y + 122);
}

export function drawClear(ctx, view, session, now) {
  const r = session.result;
  const age = now - session.clearedAt;
  const c = card(ctx, view, 480, 300);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#2fbf71';
  ctx.font = `800 16px ${FONT}`;
  ctx.fillText(`ALL ${r.found} DIFFERENCES FOUND`, c.cx, c.y + 40);
  ctx.fillStyle = '#ffffff';
  ctx.font = `900 34px ${FONT}`;
  ctx.fillText(session.plan.scene.name, c.cx, c.y + 80);
  for (let i = 0; i < 3; i++) {
    const shown = age > 0.25 + i * 0.25;
    const pop = shown ? Math.min(1, (age - 0.25 - i * 0.25) / 0.2) : 0;
    const s = 26 * (i === 1 ? 1.25 : 1) * (0.6 + 0.4 * pop);
    const x = c.cx + (i - 1) * 72;
    const y = c.y + 128 - (i === 1 ? 8 : 0);
    const won = i < r.stars;
    star(ctx, x, y, 5, s, s * 0.48, won && shown ? '#ffd43b' : '#3a3366', won && shown ? '#fff3bf' : '#544c8a', 3);
  }
  const rows = [['Time bonus', r.timeBonus], ['Accuracy bonus', r.accuracyBonus], ['Unused hints', r.hintBonus]];
  ctx.font = `600 16px ${FONT}`;
  rows.forEach(([label, value], i) => {
    const y = c.y + 186 + i * 24;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#c9c3ef';
    ctx.fillText(label, c.x + 90, y);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`+${value.toLocaleString('en-US')}`, c.x + 390, y);
  });
  ctx.textAlign = 'center';
  ctx.font = `800 17px ${FONT}`;
  ctx.fillStyle = '#ffcf5a';
  const last = session.plan.index + 1 === CAMPAIGN_LENGTH;
  ctx.fillText(last ? 'Campaign complete! Enter starts the endless hunt' : 'Press Enter or click for the next level', c.cx, c.y + 280);
}

export function drawTimeUp(ctx, view, session) {
  const r = session.result;
  const w = 560;
  const h = 132;
  const x = (view.w - w) / 2;
  const y = view.h - h - 66;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 24;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 20);
  ctx.fillStyle = 'rgba(33,27,66,0.96)';
  ctx.fill();
  ctx.restore();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#ff4d5e';
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ff4d5e';
  ctx.font = `900 30px ${FONT}`;
  ctx.fillText("Time's up!", view.w / 2, y + 42);
  ctx.fillStyle = '#ffffff';
  ctx.font = `600 16px ${FONT}`;
  ctx.fillText(`You found ${r.found} of ${session.puzzle.diffs.length}. The ones you missed are circled in red.`, view.w / 2, y + 76);
  ctx.fillStyle = '#ffcf5a';
  ctx.font = `800 16px ${FONT}`;
  ctx.fillText('Press R or click to try this level again', view.w / 2, y + 108);
}
