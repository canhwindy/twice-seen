// Lays out the two pictures side by side, paints each one once to an offscreen canvas and maps
// screen points back to scene coordinates (both pictures share one 640 by 480 scene space).
import { makeRng } from './rng.js';
import { withItem } from './shapes.js';

export const SCENE_W = 640;
export const SCENE_H = 480;
export const HUD_TOP = 112;
export const HUD_BOTTOM = 52;

export function layoutPanels(viewW, viewH) {
  const gap = Math.max(16, Math.round(viewW * 0.018));
  const margin = Math.max(14, Math.round(viewW * 0.014));
  const availW = (viewW - margin * 2 - gap) / 2;
  const availH = viewH - HUD_TOP - HUD_BOTTOM - 12;
  const scale = Math.min(availW / SCENE_W, availH / SCENE_H);
  const w = Math.floor(SCENE_W * scale);
  const h = Math.floor(SCENE_H * scale);
  const x0 = Math.round((viewW - (w * 2 + gap)) / 2);
  const y = Math.round(HUD_TOP + (availH - h) / 2 + 6);
  return {
    scale,
    gap,
    panels: [
      { side: 'left', x: x0, y, w, h },
      { side: 'right', x: x0 + w + gap, y, w, h },
    ],
  };
}

export function paintPicture(scene, items, seed, pixelScale) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(SCENE_W * pixelScale);
  canvas.height = Math.round(SCENE_H * pixelScale);
  const ctx = canvas.getContext('2d');
  ctx.scale(pixelScale, pixelScale);
  scene.backdrop(ctx, makeRng(seed ^ 0x5eed));
  for (const item of items) {
    if (item.hidden) continue;
    const kind = scene.kinds[item.kind];
    withItem(ctx, item, () => kind.draw(ctx, item));
  }
  if (scene.foreground) scene.foreground(ctx, makeRng(seed ^ 0xf00d));
  return canvas;
}

export function paintPuzzle(puzzle, pixelScale) {
  return {
    left: paintPicture(puzzle.scene, puzzle.left, puzzle.seed, pixelScale),
    right: paintPicture(puzzle.scene, puzzle.right, puzzle.seed, pixelScale),
  };
}

export function pointToScene(layout, px, py) {
  for (const panel of layout.panels) {
    if (px >= panel.x && px < panel.x + panel.w && py >= panel.y && py < panel.y + panel.h) {
      return { side: panel.side, x: ((px - panel.x) / panel.w) * SCENE_W, y: ((py - panel.y) / panel.h) * SCENE_H };
    }
  }
  return null;
}

export function sceneToPoint(panel, x, y) {
  return { x: panel.x + (x / SCENE_W) * panel.w, y: panel.y + (y / SCENE_H) * panel.h };
}
