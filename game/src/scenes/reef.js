// Tidewater Reef: a sunlit shallow sea of striped fish, coral fans, shells and a shy crab.
import { makeRng } from '../rng.js';
import { circle, curve, ellipse, line, poly, shade, star, TAU, withItem } from '../shapes.js';
import { finishItems, scatter } from './place.js';

const FISH = ['#ff8a3d', '#ffd23f', '#4fd1c5', '#f2668b', '#8f7cf7', '#7bd389'];
const CORAL = ['#ff6f91', '#ff9671', '#c493ff', '#ffc75f', '#f9f871'];
const SHELL = ['#ffe3c2', '#f7b2bd', '#ffd6a5', '#cdeac0'];

const kinds = {
  fish: {
    r: 30, muts: ['color', 'alt', 'missing', 'flip', 'detail', 'size', 'shift'], details: 4, altNeedsDetail: true,
    draw(ctx, it) {
      poly(ctx, [[-22, 0], [-42, -15], [-38, 0], [-42, 15]], shade(it.color, -0.12), '#1d2b4a', 2);
      poly(ctx, [[-4, -14], [6, -26], [14, -12]], shade(it.color, -0.08), '#1d2b4a', 2);
      ellipse(ctx, 0, 0, 27, 16, it.color, '#1d2b4a', 2.5);
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(0, 0, 26, 15, 0, 0, TAU);
      ctx.clip();
      for (let i = 0; i < it.detail; i++) {
        const x = -8 + i * 8 - (it.detail - 1) * 2;
        ctx.fillStyle = it.alt;
        ctx.fillRect(x, -16, 4, 32);
      }
      ctx.restore();
      circle(ctx, 15, -4, 5, '#ffffff', '#1d2b4a', 1.5);
      circle(ctx, 16.5, -4, 2.4, '#1d2b4a');
      curve(ctx, [[20, 6], [24, 7], [26, 4]], '#1d2b4a', 1.6);
    },
  },
  jelly: {
    r: 30, cy: 12, muts: ['color', 'missing', 'detail', 'size', 'shift'], details: 3,
    draw(ctx, it) {
      const tentacles = 3 + it.detail;
      for (let i = 0; i < tentacles; i++) {
        const x = -16 + (32 * i) / (tentacles - 1);
        curve(ctx, [[x, 0], [x + 5, 14], [x - 4, 28], [x + 3, 44]], shade(it.color, 0.15), 3);
      }
      ctx.beginPath();
      ctx.ellipse(0, 0, 24, 22, 0, Math.PI, TAU);
      ctx.closePath();
      ctx.fillStyle = it.color;
      ctx.globalAlpha = 0.9;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#1d2b4a';
      ctx.lineWidth = 2;
      ctx.stroke();
      ellipse(ctx, -8, -12, 6, 4, 'rgba(255,255,255,0.55)');
    },
  },
  bubbles: {
    r: 20, muts: ['missing', 'detail', 'shift'], details: 3, flipless: true,
    draw(ctx, it) {
      const rng = makeRng(it.seed);
      for (let i = 0; i < 3 + it.detail; i++) {
        const r = rng.range(3, 8);
        circle(ctx, rng.range(-12, 12), 18 - i * 11, r, 'rgba(220,250,255,0.25)', 'rgba(235,252,255,0.9)', 1.6);
      }
    },
  },
  coral: {
    r: 44, cy: -40, muts: ['color', 'missing', 'detail', 'size', 'flip'], details: 3,
    draw(ctx, it) {
      const rng = makeRng(it.seed);
      const tips = [];
      const grow = (x, y, a, len, depth) => {
        const x2 = x + Math.cos(a) * len;
        const y2 = y + Math.sin(a) * len;
        line(ctx, x, y, x2, y2, shade(it.color, -0.18), 7 - depth * 1.4);
        line(ctx, x, y, x2, y2, it.color, 4.6 - depth * 1.1);
        if (depth >= 2 + (it.detail > 1 ? 1 : 0)) return tips.push([x2, y2]);
        const spread = 0.45 + rng.next() * 0.25;
        grow(x2, y2, a - spread, len * 0.74, depth + 1);
        grow(x2, y2, a + spread, len * 0.74, depth + 1);
        if (it.detail === 1 && depth === 0) grow(x2, y2, a, len * 0.8, depth + 2);
      };
      grow(0, 0, -Math.PI / 2, 34, 0);
      tips.forEach(([x, y]) => circle(ctx, x, y, 3.6, shade(it.color, 0.2), shade(it.color, -0.25), 1.2));
    },
  },
  weed: {
    r: 36, cy: -46, muts: ['color', 'missing', 'detail', 'size'], details: 3,
    draw(ctx, it) {
      const strands = 2 + it.detail;
      for (let i = 0; i < strands; i++) {
        const x = (i - (strands - 1) / 2) * 9;
        const h = 70 + ((it.seed >> i) & 15) * 2;
        curve(ctx, [[x, 0], [x + 10, -h * 0.3], [x - 8, -h * 0.6], [x + 7, -h]], shade(it.color, -0.2), 7);
        curve(ctx, [[x, 0], [x + 10, -h * 0.3], [x - 8, -h * 0.6], [x + 7, -h]], it.color, 4);
      }
    },
  },
  shell: {
    r: 20, cy: -8, muts: ['color', 'missing', 'detail', 'size', 'flip'], details: 3,
    draw(ctx, it) {
      ctx.beginPath();
      ctx.moveTo(0, 6);
      ctx.arc(0, 0, 20, Math.PI * 1.05, TAU * 0.975);
      ctx.closePath();
      ctx.fillStyle = it.color;
      ctx.fill();
      ctx.strokeStyle = '#6b4a3a';
      ctx.lineWidth = 2;
      ctx.stroke();
      const ridges = 4 + it.detail * 2;
      for (let i = 1; i < ridges; i++) {
        const a = Math.PI * 1.05 + (i / ridges) * Math.PI * 0.9;
        line(ctx, 0, 5, Math.cos(a) * 18, Math.sin(a) * 18, shade(it.color, -0.25), 1.5);
      }
      poly(ctx, [[-6, 4], [6, 4], [3, 10], [-3, 10]], shade(it.color, -0.1), '#6b4a3a', 1.5);
    },
  },
  starfish: {
    r: 20, muts: ['color', 'missing', 'detail', 'size', 'rotate'], details: 3, flipless: true,
    draw(ctx, it) {
      star(ctx, 0, 0, 5, 21, 9, it.color, shade(it.color, -0.35), 2);
      const dots = [0, 3, 6][it.detail];
      for (let i = 0; i < dots; i++) {
        const a = -Math.PI / 2 + (i * TAU) / dots;
        circle(ctx, Math.cos(a) * 9, Math.sin(a) * 9, 2, '#fff6e0');
      }
      circle(ctx, 0, 0, 3, shade(it.color, 0.25));
    },
  },
  crab: {
    r: 28, cy: -6, muts: ['color', 'missing', 'detail', 'shift'], details: 2, flipless: true,
    draw(ctx, it) {
      for (const side of [-1, 1]) {
        for (let i = 0; i < 3; i++) line(ctx, side * 12, -2 + i * 4, side * (26 + i * 2), 6 + i * 5, shade(it.color, -0.2), 3);
        const up = it.detail === 1 && side === 1 ? -16 : 0;
        line(ctx, side * 16, -10, side * 26, -20 + up, shade(it.color, -0.2), 4);
        ellipse(ctx, side * 28, -26 + up, 8, 6, it.color, '#4a1f1f', 1.8);
        line(ctx, side * 6, -12, side * 8, -22, '#4a1f1f', 2);
        circle(ctx, side * 8, -24, 3.5, '#ffffff', '#4a1f1f', 1.2);
        circle(ctx, side * 8, -24, 1.5, '#1b1b1b');
      }
      ellipse(ctx, 0, -6, 20, 13, it.color, '#4a1f1f', 2);
      curve(ctx, [[-6, -2], [0, 2], [6, -2]], '#4a1f1f', 1.6);
    },
  },
  rock: {
    r: 30, cy: -10, muts: ['color', 'size'], flipless: true,
    draw(ctx, it) {
      const rng = makeRng(it.seed);
      const pts = [];
      for (let i = 0; i <= 9; i++) {
        const a = Math.PI + (i / 9) * Math.PI;
        const r = 30 * (0.8 + rng.next() * 0.3);
        pts.push([Math.cos(a) * r * 1.3, Math.sin(a) * r * 0.85]);
      }
      poly(ctx, pts, it.color, shade(it.color, -0.3), 2);
      ellipse(ctx, -10, -14, 9, 4, shade(it.color, 0.12));
    },
  },
};

function backdrop(ctx, rng) {
  const sea = ctx.createLinearGradient(0, 0, 0, 480);
  sea.addColorStop(0, '#3fc1d9');
  sea.addColorStop(0.55, '#1b7fa8');
  sea.addColorStop(1, '#0f4c75');
  ctx.fillStyle = sea;
  ctx.fillRect(0, 0, 640, 480);
  ctx.globalAlpha = 0.13;
  for (let i = 0; i < 6; i++) {
    const x = rng.range(-40, 640);
    poly(ctx, [[x, 0], [x + 50, 0], [x + 170, 480], [x + 60, 480]], '#e9fbff');
  }
  ctx.globalAlpha = 1;
  for (let i = 0; i < 3; i++) {
    const x = 100 + i * 220 + rng.range(-40, 40);
    ellipse(ctx, x, 400, 120, 70, 'rgba(15,60,100,0.45)');
  }
  const sand = ctx.createLinearGradient(0, 380, 0, 480);
  sand.addColorStop(0, '#f2d49b');
  sand.addColorStop(1, '#d9a866');
  ctx.beginPath();
  ctx.moveTo(0, 400);
  for (let x = 0; x <= 640; x += 40) ctx.quadraticCurveTo(x + 20, 388 + rng.range(-8, 8), x + 40, 398 + rng.range(-6, 6));
  ctx.lineTo(640, 480);
  ctx.lineTo(0, 480);
  ctx.closePath();
  ctx.fillStyle = sand;
  ctx.fill();
  for (let i = 0; i < 70; i++) circle(ctx, rng.range(0, 640), rng.range(410, 478), rng.range(0.8, 2.2), 'rgba(140,96,50,0.45)');
}

function build(rng) {
  const items = [];
  const k = kinds;
  scatter(rng, items, k, { kind: 'rock', count: 3, x: [40, 600], y: [430, 465], s: [1, 1.4], colors: ['#7d8ca3', '#8e8f7a'], layer: 0 });
  scatter(rng, items, k, { kind: 'coral', count: 4, x: [40, 600], y: [420, 460], s: [1.15, 1.5], colors: CORAL, details: 3 });
  scatter(rng, items, k, { kind: 'weed', count: 4, x: [30, 610], y: [425, 465], s: [1.05, 1.4], colors: ['#3fa34d', '#5cc26b', '#2e8b57'], details: 3 });
  scatter(rng, items, k, { kind: 'shell', count: 3, x: [40, 600], y: [440, 470], s: [1.1, 1.4], colors: SHELL, details: 3, layer: 2 });
  scatter(rng, items, k, { kind: 'starfish', count: 3, x: [40, 600], y: [430, 465], s: [1.05, 1.35], colors: ['#ff7a59', '#ffb347', '#e85d75'], rot: [-0.6, 0.6], details: 3, layer: 2 });
  scatter(rng, items, k, { kind: 'crab', count: 1, x: [80, 560], y: [445, 465], s: [1.2, 1.4], colors: ['#e8553e', '#f08a24'], details: 2, layer: 2 });
  scatter(rng, items, k, { kind: 'fish', count: 9, x: [60, 580], y: [60, 330], s: [1, 1.5], colors: FISH, alts: ['#ffffff', '#1d2b4a', '#fff3b0'], details: 4, layer: 3 });
  scatter(rng, items, k, { kind: 'jelly', count: 2, x: [60, 580], y: [60, 230], s: [1.1, 1.35], colors: ['#f7a8d8', '#b8a9ff', '#a8e6ff'], details: 3, layer: 3 });
  scatter(rng, items, k, { kind: 'bubbles', count: 4, x: [30, 610], y: [50, 340], s: [1, 1.3], details: 3, layer: 4 });
  return finishItems(items);
}

export default {
  id: 'reef',
  name: 'Tidewater Reef',
  frame: '#0f4c75',
  palette: [...FISH, ...CORAL, ...SHELL, '#ff7a59', '#e8553e', '#3fa34d', '#7d8ca3'],
  kinds,
  backdrop,
  build,
};
