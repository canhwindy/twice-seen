// The game's rules: starting a level, judging each click, the clock, combos, hints and stars.
import { makePuzzle } from './differences.js';
import { levelPlan } from './levels.js';
import { hashSeed } from './rng.js';

export const MISS_PENALTY = 4;
export const HINTS_PER_LEVEL = 3;
const COMBO_WINDOW = 6;

export function createSession(runSeed) {
  return { state: 'title', runSeed, levelIndex: 0, score: 0, best: 0, effects: [], muted: false };
}

export function startLevel(session, index, now) {
  const plan = levelPlan(index);
  Object.assign(session, {
    state: 'intro',
    levelIndex: index,
    plan,
    puzzle: makePuzzle(plan.scene, hashSeed(session.runSeed, index, plan.scene.id), plan.count, plan.subtle),
    pictures: null,
    introUntil: now + 1.8,
    timeMax: plan.time,
    timeLeft: plan.time,
    combo: 0,
    bestCombo: 0,
    lastFindAt: -99,
    lockUntil: 0,
    hints: HINTS_PER_LEVEL,
    hint: null,
    misses: 0,
    levelScore: 0,
    effects: [],
    result: null,
  });
}

export function remaining(session) {
  return session.puzzle ? session.puzzle.diffs.filter((d) => !d.found).length : 0;
}

export function tick(session, dt, now) {
  if (session.state === 'intro' && now >= session.introUntil) session.state = 'play';
  if (session.state !== 'play') return null;
  session.timeLeft = Math.max(0, session.timeLeft - dt);
  if (session.hint && now > session.hint.until) session.hint = null;
  if (session.timeLeft <= 0) {
    session.state = 'timeup';
    session.result = { stars: 0, timeBonus: 0, found: session.puzzle.diffs.length - remaining(session) };
    session.best = Math.max(session.best, session.score);
    return 'timeup';
  }
  return null;
}

export function clickAt(session, side, x, y, now) {
  if (session.state !== 'play') return { result: 'idle' };
  if (now < session.lockUntil) return { result: 'locked' };
  const hit = nearest(session.puzzle.diffs, x, y);
  if (hit && hit.found) return { result: 'already', diff: hit };
  if (hit) return find(session, hit, side, now);
  session.misses += 1;
  session.combo = 0;
  session.timeLeft = Math.max(0, session.timeLeft - MISS_PENALTY);
  session.lockUntil = now + 0.45;
  session.effects.push({ type: 'miss', side, x, y, at: now });
  session.effects.push({ type: 'float', side, x, y: y - 18, text: `-${MISS_PENALTY}s`, color: '#ff5a5f', at: now });
  return { result: 'miss' };
}

function find(session, diff, side, now) {
  diff.found = true;
  diff.foundAt = now;
  diff.foundSide = side;
  session.combo = now - session.lastFindAt < COMBO_WINDOW ? session.combo + 1 : 1;
  session.bestCombo = Math.max(session.bestCombo, session.combo);
  session.lastFindAt = now;
  const points = Math.round((100 + session.plan.subtle * 100) * Math.min(session.combo, 5));
  session.score += points;
  session.levelScore += points;
  if (session.hint && session.hint.diff === diff.id) session.hint = null;
  const label = session.combo > 1 ? `+${points}  combo x${session.combo}` : `+${points}`;
  session.effects.push({ type: 'float', side, x: diff.x, y: diff.y - diff.r - 8, text: label, color: '#ffe066', at: now });
  session.effects.push({ type: 'burst', x: diff.x, y: diff.y, r: diff.r, at: now });
  if (remaining(session) === 0) return { result: 'found', diff, cleared: clearLevel(session, now) };
  return { result: 'found', diff };
}

function clearLevel(session, now) {
  const share = session.timeLeft / session.timeMax;
  const timeBonus = Math.round(session.timeLeft) * 20;
  const accuracyBonus = Math.max(0, 500 - session.misses * 100);
  const hintBonus = session.hints * 150;
  session.score += timeBonus + accuracyBonus + hintBonus;
  const stars = share > 0.45 && session.misses <= 2 ? 3 : share > 0.2 ? 2 : 1;
  session.state = 'clear';
  session.clearedAt = now;
  session.hint = null;
  session.best = Math.max(session.best, session.score);
  session.result = { stars, timeBonus, accuracyBonus, hintBonus, found: session.puzzle.diffs.length };
  return session.result;
}

export function useHint(session, now) {
  if (session.state !== 'play' || session.hints <= 0 || session.hint) return false;
  const open = session.puzzle.diffs.filter((d) => !d.found);
  if (!open.length) return false;
  const target = open.reduce((a, b) => (b.r < a.r ? b : a));
  const wobble = target.r * 0.6;
  const angle = (session.hints * 2.1 + target.id) % (Math.PI * 2);
  session.hints -= 1;
  session.hint = {
    diff: target.id,
    x: target.x + Math.cos(angle) * wobble,
    y: target.y + Math.sin(angle) * wobble,
    r: target.r * 2.4,
    start: now,
    until: now + 3.2,
  };
  return true;
}

export function togglePause(session) {
  if (session.state === 'play') session.state = 'paused';
  else if (session.state === 'paused') session.state = 'play';
}

function nearest(diffs, x, y) {
  let best = null;
  let bestD = Infinity;
  for (const d of diffs) {
    const dist = Math.hypot(d.x - x, d.y - y);
    if (dist <= d.r && dist / d.r < bestD) {
      best = d;
      bestD = dist / d.r;
    }
  }
  return best;
}
