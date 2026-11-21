// Lantern Rooftops: a moonlit town of crooked houses, glowing windows, paper lanterns, rooftop
// cats and a drifting hot air balloon.
import { makeRng } from '../rng.js';
import { circle, curve, ellipse, line, poly, roundRect, shade, star, TAU } from '../shapes.js';
import { finishItems, scatter } from './place.js';

const WALLS = ['#c96f53', '#d9a05b', '#7f9bb3', '#9c7bb5', '#6fa38b', '#c4866e'];
const LANTERNS = ['#ff5d5d', '#ffb347', '#ff7ac6', '#7ee0ff', '#b6ff6b'];
const WINDOW_SLOTS = [[-24, -78], [8, -78], [-24, -44], [8, -44]];

const kinds = {
  house: {
    r: 52, cy: -62, muts: ['color', 'detail', 'alt'], details: 5,
    spot: (it, detail) => {
      const changed = detail === 0 ? it.detail - 1 : detail - 1;
      const [x, y] = WINDOW_SLOTS[Math.max(0, changed)];
      return { x: x + 8, y: y + 9, r: 24 };
    },
    draw(ctx, it) {
      roundRect(ctx, -46, -110, 92, 110, 3, it.color, '#1a1430', 2.5);
      for (let i = 0; i < 6; i++) line(ctx, -46, -96 + i * 18, 46, -96 + i * 18, shade(it.color, -0.07), 1.2);
      poly(ctx, [[-56, -108], [0, -152], [56, -108]], it.alt, '#1a1430', 2.5);
      roundRect(ctx, 22, -150, 13, 30, 2, shade(it.color, -0.2), '#1a1430', 2);
      const pattern = (it.seed & 15) ^ (it.detail ? 1 << (it.detail - 1) : 0);
      WINDOW_SLOTS.forEach(([x, y], i) => {
        const lit = (pattern >> i) & 1;
        roundRect(ctx, x, y, 18, 20, 2, lit ? '#ffe28a' : '#2c2a4a', '#1a1430', 2);
        if (lit) roundRect(ctx, x + 2, y + 2, 14, 16, 2, 'rgba(255,190,80,0.45)');
        line(ctx, x + 9, y, x + 9, y + 20, '#1a1430', 1.5);
      });
      roundRect(ctx, -10, -22, 20, 22, [8, 8, 0, 0], shade(it.color, -0.3), '#1a1430', 2);
      circle(ctx, 5, -11, 1.6, '#ffd166');
    },
  },
  cat: {
    r: 20, cy: -16, muts: ['missing', 'flip', 'detail', 'color'], details: 2,
    draw(ctx, it) {
      curve(ctx, it.detail ? [[10, -4], [24, -10], [22, -30], [28, -36]] : [[10, -4], [24, 0], [30, 2], [34, -4]], it.color, 4.5);
      ellipse(ctx, 0, -12, 13, 14, it.color);
      circle(ctx, -2, -30, 9, it.color);
      poly(ctx, [[-10, -34], [-8, -46], [-2, -38]], it.color);
      poly(ctx, [[2, -38], [7, -46], [8, -33]], it.color);
      circle(ctx, -5, -31, 1.8, '#ffe066');
      circle(ctx, 2, -31, 1.8, '#ffe066');
    },
  },
  lantern: {
    r: 18, cy: 8, muts: ['color', 'missing', 'detail', 'size'], details: 2,
    draw(ctx, it) {
      line(ctx, 0, -16, 0, -4, '#1a1430', 1.5);
      ctx.save();
      ctx.shadowColor = it.color;
      ctx.shadowBlur = 14;
      ellipse(ctx, 0, 8, 11, 13, it.color, '#3a1020', 2);
      ctx.restore();
      line(ctx, -9, 4, 9, 4, shade(it.color, -0.25), 1.4);
      line(ctx, -9, 12, 9, 12, shade(it.color, -0.25), 1.4);
      roundRect(ctx, -5, -6, 10, 4, 1, '#3a1020');
      roundRect(ctx, -5, 20, 10, 4, 1, '#3a1020');
      if (it.detail) line(ctx, 0, 24, 0, 34, '#ffd166', 2.5);
    },
  },
  balloon: {
    r: 34, cy: -6, muts: ['color', 'alt', 'missing', 'detail', 'size', 'shift'], details: 3,
    draw(ctx, it) {
      line(ctx, -9, 22, -6, 34, '#2a2140', 1.5);
      line(ctx, 9, 22, 6, 34, '#2a2140', 1.5);
      roundRect(ctx, -8, 33, 16, 11, 2, '#8a5a3b', '#2a2140', 1.5);
      ctx.beginPath();
      ctx.moveTo(-10, 24);
      ctx.bezierCurveTo(-40, 0, -30, -44, 0, -44);
      ctx.bezierCurveTo(30, -44, 40, 0, 10, 24);
      ctx.closePath();
      ctx.fillStyle = it.color;
      ctx.fill();
      ctx.save();
      ctx.clip();
      const stripes = 2 + it.detail;
      for (let i = 0; i < stripes; i++) {
        const x = -30 + ((i + 0.5) * 60) / stripes;
        ctx.fillStyle = it.alt;
        ctx.fillRect(x - 4, -50, 8, 80);
      }
      ctx.restore();
      ctx.strokeStyle = '#2a2140';
      ctx.lineWidth = 2;
      ctx.stroke();
    },
  },
  antenna: {
    r: 18, cy: -18, muts: ['missing', 'flip', 'detail'], details: 2,
    draw(ctx, it) {
      line(ctx, 0, 0, 0, -38, '#b8b0e6', 2.5);
      line(ctx, -12, -30, 12, -30, '#b8b0e6', 2.5);
      line(ctx, -8, -22, 8, -22, '#b8b0e6', 2.5);
      if (it.detail) line(ctx, 0, -38, 12, -46, '#b8b0e6', 2.5);
      circle(ctx, 0, -40, 2.5, '#ff5d5d');
    },
  },
  star: {
    r: 12, muts: ['missing', 'size', 'color'], details: 1,
    draw(ctx, it) {
      ctx.save();
      ctx.shadowColor = it.color;
      ctx.shadowBlur = 10;
      star(ctx, 0, 0, 4, 11, 3.2, it.color);
      ctx.restore();
    },
  },
  moon: {
    r: 34, muts: ['detail', 'size', 'color'], details: 2,
    draw(ctx, it) {
      ctx.save();
      ctx.shadowColor = it.color;
      ctx.shadowBlur = 30;
      circle(ctx, 0, 0, 30, it.color);
      ctx.restore();
      circle(ctx, -9, -6, 6, shade(it.color, -0.08));
      circle(ctx, 9, 9, 4, shade(it.color, -0.08));
      if (it.detail) circle(ctx, 10, -11, 3.5, shade(it.color, -0.1));
      else circle(ctx, -6, 14, 3, shade(it.color, -0.08));
    },
  },
  wire: {
    r: 0, muts: [],
    draw(ctx) {
      const pts = [];
      for (let x = -340; x <= 340; x += 20) pts.push([x, 36 * (1 - (x / 340) ** 2)]);
      curve(ctx, pts, '#d8cff5', 1.6);
    },
  },
  bird: {
    r: 14, muts: ['missing', 'flip', 'shift'], details: 1,
    draw(ctx, it) {
      curve(ctx, [[-14, -2], [-7, -8], [0, 0], [7, -8], [14, -2]], '#e9e4ff', 2.5);
    },
  },
};

function backdrop(ctx, rng) {
  const sky = ctx.createLinearGradient(0, 0, 0, 480);
  sky.addColorStop(0, '#0d1236');
  sky.addColorStop(0.6, '#2b2866');
  sky.addColorStop(1, '#5b3f7e');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 640, 480);
  for (let i = 0; i < 90; i++) circle(ctx, rng.range(0, 640), rng.range(0, 300), rng.range(0.5, 1.5), `rgba(255,255,255,${rng.range(0.3, 0.9)})`);
  ctx.fillStyle = '#231d4f';
  ctx.beginPath();
  ctx.moveTo(0, 480);
  let x = 0;
  while (x < 640) {
    const w = rng.range(24, 60);
    const h = rng.range(250, 320);
    ctx.lineTo(x, h);
    ctx.lineTo(x + w, h);
    x += w;
  }
  ctx.lineTo(640, 480);
  ctx.fill();
  for (let i = 0; i < 26; i++) roundRect(ctx, rng.range(0, 630), rng.range(270, 340), 5, 7, 1, 'rgba(255,214,120,0.35)');
}

function foreground(ctx) {
  const g = ctx.createLinearGradient(0, 455, 0, 480);
  g.addColorStop(0, '#2a1f40');
  g.addColorStop(1, '#170f2a');
  ctx.fillStyle = g;
  ctx.fillRect(0, 462, 640, 18);
}

function build(rng) {
  const items = [];
  const k = kinds;
  const count = 5;
  for (let i = 0; i < count; i++) {
    const x = 64 + i * 128 + rng.range(-10, 10);
    const s = rng.range(1.28, 1.42);
    const base = 476 - rng.range(10, 40) * (i % 2);
    items.push({ kind: 'house', x, y: base, s, color: WALLS[(i + rng.int(0, 5)) % WALLS.length], alt: rng.pick(['#4b3b6e', '#7a3b4a', '#3d5a6e', '#5a4636']), rot: 0, flip: 1, detail: 0, seed: rng.int(1, 1e9), layer: 1, hidden: false });
    const peak = base - 152 * s;
    if (rng.chance(0.55)) items.push({ kind: 'cat', x: x - 20 * s, y: base - 128 * s, s: 1.25, color: rng.pick(['#1b1530', '#3b2f4f', '#f0a55a']), alt: '#000', rot: 0, flip: rng.chance(0.5) ? 1 : -1, detail: rng.int(0, 1), seed: 1, layer: 2, hidden: false });
    else items.push({ kind: 'antenna', x, y: peak + 2, s: 1.3, color: '#000', alt: '#000', rot: 0, flip: rng.chance(0.5) ? 1 : -1, detail: rng.int(0, 1), seed: 1, layer: 2, hidden: false });
  }
  const wireY = rng.range(150, 175);
  items.push({ kind: 'wire', x: 320, y: wireY, s: 1, color: '#000', alt: '#000', rot: 0, flip: 1, detail: 0, seed: 1, layer: 3, hidden: false });
  for (let i = 0; i < 5; i++) {
    const x = 70 + i * 125 + rng.range(-12, 12);
    const u = (x - 320) / 340;
    items.push({ kind: 'lantern', x, y: wireY + 36 * (1 - u * u) + 20, s: 1.25, color: rng.pick(LANTERNS), alt: '#000', rot: 0, flip: 1, detail: rng.int(0, 1), seed: 1, layer: 3, hidden: false });
  }
  scatter(rng, items, k, { kind: 'moon', count: 1, x: [70, 570], y: [50, 90], s: [0.9, 1.1], colors: ['#fff4c9', '#ffe9a8'], details: 2, flip: false });
  scatter(rng, items, k, { kind: 'balloon', count: 1, x: [80, 560], y: [70, 110], s: [1.1, 1.3], colors: ['#ff6b6b', '#4dabf7', '#ffd43b'], alts: ['#ffffff', '#845ef7', '#20c997'], details: 3, flip: false });
  scatter(rng, items, k, { kind: 'star', count: 8, x: [24, 616], y: [34, 250], s: [0.8, 1.2], colors: ['#ffffff', '#fff3bf', '#c5f6fa'], flip: false });
  scatter(rng, items, k, { kind: 'bird', count: 4, x: [40, 600], y: [40, 140], s: [1, 1.3] });
  return finishItems(items);
}

export default {
  id: 'rooftops',
  name: 'Lantern Rooftops',
  frame: '#3b2f7a',
  palette: [...WALLS, ...LANTERNS, '#1b1530', '#f0a55a', '#fff4c9', '#c5f6fa', '#ff6b6b', '#4dabf7'],
  altPalette: ['#4b3b6e', '#7a3b4a', '#3d5a6e', '#5a4636', '#2f6b4f', '#ffffff', '#845ef7', '#20c997'],
  kinds,
  backdrop,
  foreground,
  build,
};
