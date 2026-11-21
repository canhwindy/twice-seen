// Glasshouse Garden: a warm greenhouse of potted flowers, cacti, butterflies, a snail on the
// shelf, hanging baskets and a watering can.
import { makeRng } from '../rng.js';
import { circle, curve, ellipse, line, poly, roundRect, shade, TAU } from '../shapes.js';
import { finishItems, scatter } from './place.js';

const POTS = ['#d9734e', '#5c7cfa', '#f6c453', '#e8e2d0', '#69b578', '#c56cf0'];
const BLOOMS = ['#ff6b9a', '#ffd43b', '#ff922b', '#be4bdb', '#ffffff', '#4dabf7'];

function pot(ctx, it) {
  poly(ctx, [[-20, -26], [20, -26], [15, 0], [-15, 0]], it.color, '#3b2a20', 2);
  roundRect(ctx, -23, -32, 46, 9, 3, shade(it.color, 0.08), '#3b2a20', 2);
}

const kinds = {
  flower: {
    r: 30, cy: -44, muts: ['color', 'alt', 'missing', 'detail', 'size'], details: 3,
    spot: () => ({ x: 0, y: -66, r: 22 }),
    draw(ctx, it) {
      line(ctx, 0, -30, 0, -66, '#3c8d4a', 3.5);
      ellipse(ctx, -9, -46, 8, 4, '#4caf50', '#2f6b3a', 1.2);
      const petals = 5 + it.detail;
      for (let i = 0; i < petals; i++) {
        const a = (i / petals) * TAU;
        ellipse(ctx, Math.cos(a) * 9, -66 + Math.sin(a) * 9, 7, 7, it.alt, shade(it.alt, -0.3), 1.2);
      }
      circle(ctx, 0, -66, 6, '#ffcc33', '#8a5a00', 1.4);
      pot(ctx, it);
    },
  },
  cactus: {
    r: 30, cy: -40, muts: ['color', 'missing', 'detail', 'flip'], details: 3,
    spot: () => ({ x: 0, y: -56, r: 26 }),
    draw(ctx, it) {
      const green = '#4fa86b';
      roundRect(ctx, -9, -86, 18, 60, 9, green, '#24583a', 2);
      if (it.detail >= 1) {
        roundRect(ctx, 6, -64, 18, 9, 4, green, '#24583a', 2);
        roundRect(ctx, 16, -80, 9, 22, 4.5, green, '#24583a', 2);
      }
      if (it.detail >= 2) {
        roundRect(ctx, -24, -58, 18, 9, 4, green, '#24583a', 2);
        roundRect(ctx, -25, -72, 9, 20, 4.5, green, '#24583a', 2);
      }
      for (let y = -78; y < -32; y += 10) line(ctx, -2, y, 2, y + 3, '#dff5d0', 1.2);
      circle(ctx, 0, -88, 4, '#ff6b9a');
      pot(ctx, it);
    },
  },
  fern: {
    r: 32, cy: -40, muts: ['color', 'missing', 'detail', 'size'], details: 3,
    draw(ctx, it) {
      const leaves = 4 + it.detail;
      for (let i = 0; i < leaves; i++) {
        const a = -Math.PI / 2 + (i - (leaves - 1) / 2) * 0.45;
        const ex = Math.cos(a) * 46;
        const ey = -28 + Math.sin(a) * 50;
        curve(ctx, [[0, -28], [ex * 0.5, ey - 10], [ex, ey]], '#2e7d32', 5);
        curve(ctx, [[0, -28], [ex * 0.5, ey - 10], [ex, ey]], '#66bb6a', 2.5);
      }
      pot(ctx, it);
    },
  },
  butterfly: {
    r: 18, muts: ['color', 'alt', 'missing', 'flip', 'shift'], details: 1,
    draw(ctx, it) {
      ellipse(ctx, -9, -5, 9, 8, it.color, '#2b1d3a', 1.5);
      ellipse(ctx, 9, -5, 9, 8, it.color, '#2b1d3a', 1.5);
      ellipse(ctx, -7, 7, 6, 5, it.alt, '#2b1d3a', 1.5);
      ellipse(ctx, 7, 7, 6, 5, it.alt, '#2b1d3a', 1.5);
      ellipse(ctx, 0, 0, 2.5, 10, '#2b1d3a');
      curve(ctx, [[0, -9], [-4, -16], [-6, -18]], '#2b1d3a', 1.2);
      curve(ctx, [[0, -9], [4, -16], [7, -17]], '#2b1d3a', 1.2);
    },
  },
  snail: {
    r: 20, cy: -10, muts: ['color', 'missing', 'flip', 'detail'], details: 2,
    draw(ctx, it) {
      ellipse(ctx, 0, -3, 22, 5, '#c7b299', '#5e4b3c', 1.5);
      line(ctx, 16, -6, 22, -18, '#c7b299', 2.5);
      circle(ctx, 22, -19, 2.4, '#5e4b3c');
      if (it.detail) {
        line(ctx, 12, -6, 15, -16, '#c7b299', 2.5);
        circle(ctx, 15, -17, 2, '#5e4b3c');
      }
      circle(ctx, -3, -14, 13, it.color, '#5e4b3c', 2);
      ctx.beginPath();
      for (let a = 0; a < TAU * 2.2; a += 0.2) {
        const r = 1 + a * 1.6;
        ctx.lineTo(-3 + Math.cos(a) * r, -14 + Math.sin(a) * r);
      }
      ctx.strokeStyle = shade(it.color, -0.3);
      ctx.lineWidth = 1.6;
      ctx.stroke();
    },
  },
  can: {
    r: 30, cy: -18, muts: ['color', 'missing', 'flip', 'size'], details: 1,
    draw(ctx, it) {
      poly(ctx, [[16, -20], [40, -42], [44, -38], [20, -12]], it.color, '#25313d', 2);
      roundRect(ctx, -22, -36, 40, 36, 5, it.color, '#25313d', 2);
      ctx.beginPath();
      ctx.arc(-2, -36, 14, Math.PI, TAU);
      ctx.strokeStyle = '#25313d';
      ctx.lineWidth = 4;
      ctx.stroke();
      line(ctx, -18, -14, 14, -14, shade(it.color, 0.2), 3);
    },
  },
  basket: {
    r: 32, cy: 10, muts: ['missing', 'detail', 'color'], details: 3,
    draw(ctx, it) {
      line(ctx, -20, -10, 0, -60, '#6d4c41', 1.5);
      line(ctx, 20, -10, 0, -60, '#6d4c41', 1.5);
      const vines = 2 + it.detail;
      for (let i = 0; i < vines; i++) {
        const x = -16 + (32 * i) / Math.max(1, vines - 1);
        curve(ctx, [[x, 2], [x + 5, 18], [x - 3, 34], [x + 2, 46]], '#43a047', 3);
        circle(ctx, x + 2, 46, 4, it.color);
      }
      ctx.beginPath();
      ctx.ellipse(0, -8, 24, 16, 0, 0, Math.PI);
      ctx.closePath();
      ctx.fillStyle = '#a1887f';
      ctx.fill();
      ctx.strokeStyle = '#5d4037';
      ctx.lineWidth = 2;
      ctx.stroke();
      ellipse(ctx, 0, -8, 24, 5, '#558b2f', '#33691e', 1.5);
    },
  },
  mushroom: {
    r: 16, cy: -10, muts: ['color', 'missing', 'detail', 'size'], details: 3,
    draw(ctx, it) {
      roundRect(ctx, -5, -12, 10, 13, 3, '#fff3e0', '#6d4c41', 1.5);
      ctx.beginPath();
      ctx.ellipse(0, -12, 15, 12, 0, Math.PI, TAU);
      ctx.closePath();
      ctx.fillStyle = it.color;
      ctx.fill();
      ctx.strokeStyle = '#6d4c41';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      const dots = [[0, -19], [-8, -15], [8, -15], [-3, -14]].slice(0, it.detail + 1);
      dots.forEach(([x, y]) => circle(ctx, x, y, 2.4, '#ffffff'));
    },
  },
};

function backdrop(ctx, rng) {
  const g = ctx.createLinearGradient(0, 0, 0, 480);
  g.addColorStop(0, '#d8f3dc');
  g.addColorStop(0.6, '#b7e4c7');
  g.addColorStop(1, '#95d5b2');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 640, 480);
  for (let i = 0; i < 14; i++) ellipse(ctx, rng.range(0, 640), rng.range(150, 300), rng.range(30, 70), rng.range(20, 40), 'rgba(82,183,136,0.35)');
  ctx.globalAlpha = 0.85;
  for (let x = 0; x <= 640; x += 80) line(ctx, x, 0, x, 480, '#f8f9f4', 4);
  for (let y = 40; y < 300; y += 90) line(ctx, 0, y, 640, y, '#f8f9f4', 3);
  ctx.globalAlpha = 0.25;
  for (let i = 0; i < 5; i++) poly(ctx, [[i * 150, 0], [i * 150 + 40, 0], [i * 150 - 60, 300], [i * 150 - 100, 300]], '#ffffff');
  ctx.globalAlpha = 1;
  roundRect(ctx, -10, 296, 660, 14, 3, '#a47148', '#5c3d2e', 2);
  for (const x of [40, 600]) roundRect(ctx, x - 6, 310, 12, 130, 2, '#8b5e3c', '#5c3d2e', 2);
  ctx.fillStyle = '#c9a77c';
  ctx.fillRect(0, 440, 640, 40);
  for (let x = 0; x < 640; x += 64) line(ctx, x, 440, x + 20, 480, 'rgba(92,61,46,0.35)', 2);
  line(ctx, 0, 440, 640, 440, '#5c3d2e', 3);
}

function build(rng) {
  const items = [];
  const k = kinds;
  scatter(rng, items, k, { kind: 'basket', count: 3, x: [60, 580], y: [70, 100], s: [1.1, 1.3], colors: BLOOMS, details: 3, flip: false });
  scatter(rng, items, k, { kind: 'flower', count: 3, x: [50, 590], y: [296, 297], s: [1.3, 1.45], colors: POTS, alts: BLOOMS, details: 3, flip: false, gap: 1 });
  scatter(rng, items, k, { kind: 'cactus', count: 1, x: [50, 590], y: [296, 297], s: [1.3, 1.45], colors: POTS, details: 3, gap: 1 });
  scatter(rng, items, k, { kind: 'fern', count: 1, x: [50, 590], y: [296, 297], s: [1.25, 1.35], colors: POTS, details: 3, flip: false, gap: 1 });
  scatter(rng, items, k, { kind: 'snail', count: 1, x: [50, 590], y: [296, 297], s: [1.3, 1.4], colors: ['#d4a373', '#e76f51', '#9c89b8'], details: 2, layer: 2, gap: 1 });
  scatter(rng, items, k, { kind: 'can', count: 1, x: [100, 540], y: [440, 445], s: [1.35, 1.5], colors: ['#4dabf7', '#ff8787', '#63e6be'] });
  scatter(rng, items, k, { kind: 'flower', count: 3, x: [60, 590], y: [440, 448], s: [1.35, 1.55], colors: POTS, alts: BLOOMS, details: 3, flip: false });
  scatter(rng, items, k, { kind: 'mushroom', count: 4, x: [30, 610], y: [450, 472], s: [1.2, 1.5], colors: ['#e03131', '#f08c00', '#9c36b5'], details: 3, flip: false, layer: 2 });
  scatter(rng, items, k, { kind: 'butterfly', count: 5, x: [40, 600], y: [110, 230], s: [1.2, 1.5], colors: BLOOMS, alts: POTS, rot: [-0.3, 0.3], layer: 3 });
  return finishItems(items);
}

export default {
  id: 'glasshouse',
  name: 'Glasshouse Garden',
  frame: '#2d6a4f',
  palette: [...POTS, '#e03131', '#f08c00', '#4dabf7', '#ff8787', '#63e6be', '#d4a373', '#9c89b8'],
  altPalette: BLOOMS,
  kinds,
  backdrop,
  build,
};
