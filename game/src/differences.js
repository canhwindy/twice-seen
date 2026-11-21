// Builds a puzzle: one scene drawn twice, with a chosen number of changes hidden in one picture
// or the other. Subtlety (0 easy to 1 hard) steers which kinds of change are picked.
import { makeRng } from './rng.js';
import { hitCenter } from './scenes/place.js';

export const CHANGES = {
  missing: { subtle: 0.12, label: 'vanished' },
  color: { subtle: 0.3, label: 'recoloured' },
  size: { subtle: 0.45, label: 'resized' },
  flip: { subtle: 0.5, label: 'turned around' },
  alt: { subtle: 0.62, label: 'new trim' },
  rotate: { subtle: 0.66, label: 'tilted' },
  detail: { subtle: 0.72, label: 'detail changed' },
  shift: { subtle: 0.82, label: 'moved' },
};

export function makePuzzle(scene, seed, count, subtlety) {
  const rng = makeRng(seed);
  const base = scene.build(rng);
  const left = base.map((item) => ({ ...item }));
  const right = base.map((item) => ({ ...item }));
  const diffs = [];
  for (const item of rng.shuffle(base)) {
    if (diffs.length >= count) break;
    const kind = scene.kinds[item.kind];
    const options = changesFor(kind, item);
    if (!options.length) continue;
    const spot = hitCenter(item, kind);
    if (spot.x < 22 || spot.x > 618 || spot.y < 26 || spot.y > 462) continue;
    const crowded = diffs.some((d) => Math.hypot(d.x - spot.x, d.y - spot.y) < d.r + spot.r * 0.7 + 14);
    if (crowded) continue;
    const change = pickChange(rng, options, subtlety);
    const side = rng.chance(0.5) ? 'right' : 'left';
    const target = (side === 'right' ? right : left)[item.id];
    const region = applyChange(rng, change, target, item, kind, scene, subtlety);
    diffs.push({ id: diffs.length, item: item.id, change, side, label: CHANGES[change].label, ...region, found: false });
  }
  return { scene, seed, left, right, diffs };
}

function changesFor(kind, item) {
  return (kind.muts || []).filter((change) => {
    if (change === 'alt' && kind.altNeedsDetail && item.detail === 0) return false;
    if (change === 'detail' && kind.details < 2) return false;
    return true;
  });
}

function pickChange(rng, options, subtlety) {
  const weights = options.map((c) => 1 / (0.12 + Math.abs(CHANGES[c].subtle - subtlety)));
  let roll = rng.next() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < options.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return options[i];
  }
  return options[options.length - 1];
}

function applyChange(rng, change, target, original, kind, scene, subtlety) {
  const centre = hitCenter(original, kind);
  let region = { x: centre.x, y: centre.y, r: centre.r };
  switch (change) {
    case 'missing':
      target.hidden = true;
      break;
    case 'color':
      target.color = otherColour(rng, scene.palette, original.color);
      break;
    case 'alt':
      target.alt = otherColour(rng, scene.altPalette || scene.palette, original.alt);
      break;
    case 'size':
      target.s *= subtlety > 0.6 ? rng.pick([0.8, 1.22]) : rng.pick([0.66, 1.4]);
      region.r = Math.max(region.r, hitCenter(target, kind).r);
      break;
    case 'flip':
      target.flip = -(original.flip || 1);
      break;
    case 'rotate':
      target.rot += rng.pick([-1, 1]) * (subtlety > 0.6 ? 0.42 : 0.7);
      break;
    case 'detail': {
      const n = kind.details;
      target.detail = (original.detail + 1 + rng.int(0, Math.max(0, n - 2))) % n;
      if (kind.spot) region = localToScene(original, kind.spot(original, target.detail));
      break;
    }
    case 'shift': {
      const dx = rng.pick([-1, 1]) * (subtlety > 0.6 ? rng.range(15, 22) : rng.range(24, 34));
      const dy = rng.range(-8, 8);
      target.x += dx;
      target.y += dy;
      region = { x: centre.x + dx / 2, y: centre.y + dy / 2, r: centre.r + Math.abs(dx) / 2 };
      break;
    }
  }
  region.r = Math.min(64, Math.max(20, region.r * 1.08));
  return region;
}

function otherColour(rng, palette, current) {
  const choices = palette.filter((c) => c.toLowerCase() !== String(current).toLowerCase());
  return rng.pick(choices.length ? choices : palette);
}

function localToScene(item, local) {
  const cos = Math.cos(item.rot || 0);
  const sin = Math.sin(item.rot || 0);
  const lx = local.x * item.s * (item.flip || 1);
  const ly = local.y * item.s;
  return { x: item.x + lx * cos - ly * sin, y: item.y + lx * sin + ly * cos, r: local.r * item.s };
}
