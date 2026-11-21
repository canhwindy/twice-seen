// Harbor Market: a sunny quay of striped market stalls, fruit crates, barrels, bunting flags,
// gulls overhead and sailboats out on the bay.
import { makeRng } from '../rng.js';
import { circle, curve, ellipse, line, poly, roundRect, shade } from '../shapes.js';
import { finishItems, scatter } from './place.js';

const CANVAS = ['#e64980', '#228be6', '#fab005', '#12b886', '#7950f2', '#fd7e14'];
const FRUIT = ['#ff6b6b', '#ffd43b', '#ff922b', '#69db7c', '#9775fa'];

const kinds = {
  stall: {
    r: 58, cy: -60, muts: ['color', 'alt', 'detail'], details: 3,
    spot: () => ({ x: 0, y: -104, r: 40 }),
    draw(ctx, it) {
      line(ctx, -48, -96, -48, 0, '#6b4f3a', 5);
      line(ctx, 48, -96, 48, 0, '#6b4f3a', 5);
      roundRect(ctx, -56, -40, 112, 40, 3, '#b08968', '#5a3e2b', 2);
      line(ctx, -56, -26, 56, -26, '#8a6a50', 1.5);
      const stripes = 4 + it.detail;
      const w = 120 / stripes;
      for (let i = 0; i < stripes; i++) {
        poly(ctx, [[-60 + i * w, -122], [-60 + (i + 1) * w, -122], [-62 + (i + 1) * w * 1.03, -94], [-62 + i * w * 1.03, -94]], i % 2 ? it.alt : it.color);
      }
      poly(ctx, [[-60, -122], [60, -122], [62, -94], [-62, -94]], null, '#3d2b1f', 2.5);
      for (let i = 0; i < stripes; i++) {
        ctx.beginPath();
        ctx.arc(-62 + (i + 0.5) * w * 1.03, -94, w / 2, 0, Math.PI);
        ctx.fillStyle = i % 2 ? it.alt : it.color;
        ctx.fill();
        ctx.strokeStyle = '#3d2b1f';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      const rng = makeRng(it.seed);
      for (let i = 0; i < 6; i++) circle(ctx, -40 + i * 16, -46, 7, rng.pick(FRUIT), '#3d2b1f', 1.2);
    },
  },
  crate: {
    r: 24, cy: -16, muts: ['alt', 'missing', 'detail', 'shift'], details: 3,
    draw(ctx, it) {
      const fruits = 3 + it.detail;
      for (let i = 0; i < fruits; i++) circle(ctx, -15 + (30 * i) / (fruits - 1), -30 - (i % 2) * 4, 6.5, it.alt, shade(it.alt, -0.35), 1.3);
      roundRect(ctx, -22, -30, 44, 30, 2, '#c08552', '#5a3e2b', 2);
      line(ctx, -22, -15, 22, -15, '#8d5b34', 2);
      line(ctx, -14, -30, -14, 0, '#8d5b34', 1.5);
      line(ctx, 14, -30, 14, 0, '#8d5b34', 1.5);
    },
  },
  barrel: {
    r: 22, cy: -22, muts: ['color', 'missing', 'detail', 'size'], details: 3,
    draw(ctx, it) {
      roundRect(ctx, -17, -44, 34, 44, 10, it.color, '#3d2b1f', 2);
      const bands = 1 + it.detail;
      for (let i = 0; i < bands; i++) line(ctx, -17, -40 + ((i + 1) * 40) / (bands + 1), 17, -40 + ((i + 1) * 40) / (bands + 1), '#495057', 3);
    },
  },
  flag: {
    r: 22, cy: -40, muts: ['color', 'missing', 'flip', 'detail'], details: 2,
    draw(ctx, it) {
      line(ctx, 0, 0, 0, -66, '#495057', 3);
      circle(ctx, 0, -68, 3, '#fab005');
      poly(ctx, it.detail ? [[0, -64], [34, -56], [0, -46]] : [[0, -64], [34, -64], [26, -55], [34, -46], [0, -46]], it.color, shade(it.color, -0.3), 1.5);
    },
  },
  gull: {
    r: 16, muts: ['missing', 'flip', 'shift', 'size'], details: 1,
    draw(ctx, it) {
      curve(ctx, [[-16, -2], [-8, -9], [0, 0]], '#343a40', 3);
      curve(ctx, [[0, 0], [8, -9], [16, -2]], '#343a40', 3);
      circle(ctx, 0, 1, 2.5, '#ffffff', '#343a40', 1);
    },
  },
  boat: {
    r: 30, cy: -20, muts: ['color', 'alt', 'missing', 'flip', 'shift'], details: 1,
    draw(ctx, it) {
      poly(ctx, [[-30, 0], [30, 0], [22, 10], [-22, 10]], it.alt, '#1c2b3a', 2);
      line(ctx, 0, 0, 0, -50, '#1c2b3a', 2);
      poly(ctx, [[2, -48], [26, -6], [2, -6]], it.color, '#1c2b3a', 1.5);
      poly(ctx, [[-2, -40], [-20, -6], [-2, -6]], shade(it.color, 0.25), '#1c2b3a', 1.5);
    },
  },
  buoy: {
    r: 14, cy: -6, muts: ['color', 'missing', 'shift'], details: 1,
    draw(ctx, it) {
      ellipse(ctx, 0, -6, 10, 11, it.color, '#1c2b3a', 1.6);
      line(ctx, -10, -6, 10, -6, '#ffffff', 3);
      line(ctx, 0, -17, 0, -24, '#1c2b3a', 1.5);
    },
  },
  cloud: {
    r: 34, muts: ['missing', 'size', 'shift'], details: 1,
    draw(ctx) {
      for (const [x, y, r] of [[-22, 4, 14], [0, -4, 20], [22, 4, 14], [0, 8, 14]]) circle(ctx, x, y, r, '#ffffff');
    },
  },
};

function backdrop(ctx, rng) {
  const sky = ctx.createLinearGradient(0, 0, 0, 220);
  sky.addColorStop(0, '#74c0fc');
  sky.addColorStop(1, '#d0ebff');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 640, 220);
  circle(ctx, 560, 54, 28, '#fff3bf');
  ctx.beginPath();
  ctx.moveTo(0, 200);
  for (let x = 0; x <= 640; x += 80) ctx.quadraticCurveTo(x + 40, 150 + rng.range(-25, 15), x + 80, 196);
  ctx.lineTo(640, 220);
  ctx.lineTo(0, 220);
  ctx.fillStyle = '#8ce99a';
  ctx.fill();
  const sea = ctx.createLinearGradient(0, 200, 0, 300);
  sea.addColorStop(0, '#339af0');
  sea.addColorStop(1, '#1864ab');
  ctx.fillStyle = sea;
  ctx.fillRect(0, 210, 640, 90);
  for (let i = 0; i < 30; i++) {
    const x = rng.range(0, 640);
    const y = rng.range(220, 292);
    line(ctx, x, y, x + rng.range(8, 20), y, 'rgba(255,255,255,0.5)', 1.5);
  }
  ctx.fillStyle = '#d9b38c';
  ctx.fillRect(0, 296, 640, 184);
  for (let y = 312; y < 480; y += 22) line(ctx, 0, y, 640, y, 'rgba(120,80,50,0.4)', 2);
  for (let i = 0; i < 40; i++) {
    const y = 312 + Math.floor(rng.range(0, 8)) * 22;
    const x = rng.range(0, 640);
    line(ctx, x, y, x, y + 22, 'rgba(120,80,50,0.3)', 1.5);
  }
  line(ctx, 0, 297, 640, 297, '#8d5b34', 4);
}

function build(rng) {
  const items = [];
  const k = kinds;
  for (let i = 0; i < 3; i++) {
    const c = rng.int(0, CANVAS.length - 1);
    items.push({ kind: 'stall', x: 110 + i * 210 + rng.range(-12, 12), y: 420 + rng.range(-6, 8), s: rng.range(1.22, 1.32), color: CANVAS[c], alt: rng.pick(['#ffffff', '#fff3bf']), rot: 0, flip: 1, detail: rng.int(0, 2), seed: rng.int(1, 1e9), layer: 1, hidden: false });
  }
  scatter(rng, items, k, { kind: 'crate', count: 4, x: [30, 610], y: [452, 474], s: [1.25, 1.45], alts: FRUIT, details: 3, flip: false, layer: 2 });
  scatter(rng, items, k, { kind: 'barrel', count: 3, x: [30, 610], y: [444, 474], s: [1.2, 1.4], colors: ['#a0522d', '#b5835a', '#6c757d'], details: 3, flip: false, layer: 2 });
  scatter(rng, items, k, { kind: 'flag', count: 3, x: [20, 620], y: [300, 306], s: [1.1, 1.3], colors: CANVAS, details: 2, layer: 0, gap: 0.8 });
  scatter(rng, items, k, { kind: 'boat', count: 3, x: [40, 600], y: [250, 285], s: [0.95, 1.25], colors: ['#ffffff', '#ffe066', '#ff8787'], alts: ['#c92a2a', '#1971c2', '#2b8a3e', '#5f3dc4'], layer: 0 });
  scatter(rng, items, k, { kind: 'buoy', count: 3, x: [30, 610], y: [255, 290], s: [1.1, 1.3], colors: ['#fa5252', '#fab005'], layer: 0 });
  scatter(rng, items, k, { kind: 'cloud', count: 3, x: [50, 500], y: [40, 120], s: [1, 1.4], layer: 0 });
  scatter(rng, items, k, { kind: 'gull', count: 5, x: [40, 600], y: [40, 190], s: [1.1, 1.5], layer: 3 });
  return finishItems(items);
}

export default {
  id: 'harbor',
  name: 'Harbor Market',
  frame: '#1864ab',
  palette: [...CANVAS, '#ffffff', '#ffe066', '#ff8787', '#a0522d', '#6c757d', '#fa5252'],
  altPalette: [...FRUIT, '#ffffff', '#fff3bf', '#c92a2a', '#1971c2', '#2b8a3e'],
  kinds,
  backdrop,
  build,
};
