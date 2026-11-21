// Screenshot set-ups (?shot=hunt|loupe|rush|reveal): each plays a level forward with real clicks
// through the session's own rules, then freezes the clock so the frame can be captured.
import { sceneToPoint } from './panels.js';
import { clickAt, startLevel, tick, useHint } from './session.js';

const PRESETS = {
  hunt: { level: 4, finds: 4, timeShare: 0.63, score: 9840 },
  loupe: { level: 5, finds: 3, timeShare: 0.48, score: 15210, hint: true, loupe: true },
  rush: { level: 6, finds: 5, timeShare: 0.09, score: 21460, miss: true },
  reveal: { level: 7, finds: 5, timeShare: 0, score: 28730 },
  clear: { level: 2, finds: 99, timeShare: 0.52, score: 5120 },
};

export function applyShot(name, session, layout) {
  const p = PRESETS[name] || PRESETS.hunt;
  const T = 200;
  startLevel(session, p.level, 0);
  session.state = 'play';
  session.score = p.score;
  const diffs = session.puzzle.diffs;
  const finds = Math.min(p.finds, diffs.length);
  const startAt = T - 4 - finds * 2.5;
  const order = diffs.slice().sort((a, b) => a.x - b.x);
  order.slice(0, finds).forEach((d, i) => {
    const side = i % 2 ? 'right' : 'left';
    const at = finds === diffs.length ? T - 2.6 - (finds - i) * 1.2 : startAt + i * (i === finds - 1 ? 3 : 2.5);
    if (i === 1 && p.miss) {
      const spot = emptySpot(diffs, d.x, d.y);
      clickAt(session, 'left', spot.x, spot.y, at - 1);
    }
    clickAt(session, side, d.x, d.y, at);
  });
  session.effects = session.effects.filter((fx) => fx.type !== 'miss' && fx.type !== 'float');
  if (session.state === 'play') session.timeLeft = Math.max(0, session.timeMax * p.timeShare);
  let cursor = null;
  if (p.hint) useHint(session, T - 1.1);
  if (p.miss) {
    const open = diffs.find((d) => !d.found);
    const spot = emptySpot(diffs, open.x, open.y);
    clickAt(session, 'right', spot.x, spot.y, T - 0.25);
    session.lockUntil = 0;
  }
  if (p.loupe) {
    const open = diffs.filter((d) => !d.found && d.id !== session.hint?.diff)[0];
    const pt = sceneToPoint(layout.panels[1], open.x, open.y);
    cursor = { x: pt.x + 6, y: pt.y + 4 };
  }
  if (session.state === 'play' && p.timeShare === 0) tick(session, 1, T);
  if (session.state === 'clear') session.clearedAt = T - 2;
  if (session.state === 'play' && !p.loupe && !p.miss) {
    const pt = sceneToPoint(layout.panels[0], 320, 260);
    cursor = { x: pt.x, y: pt.y };
  }
  return { clock: T, cursor, loupe: !!p.loupe };
}

function emptySpot(diffs, x, y) {
  let best = { x, y };
  let bestScore = -Infinity;
  for (let gx = 60; gx <= 580; gx += 20) {
    for (let gy = 60; gy <= 420; gy += 20) {
      const room = Math.min(...diffs.map((d) => Math.hypot(d.x - gx, d.y - gy) - d.r));
      if (room < 30) continue;
      const score = -Math.hypot(gx - x, gy - y);
      if (score > bestScore) {
        best = { x: gx, y: gy };
        bestScore = score;
      }
    }
  }
  return best;
}
