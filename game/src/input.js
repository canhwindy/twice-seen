// Mouse and keyboard: the mouse points and clicks; arrow keys or WASD steer the same cursor and
// Space or Enter picks, so the whole hunt can be played from either.

const MOVE_KEYS = {
  ArrowLeft: [-1, 0], KeyA: [-1, 0],
  ArrowRight: [1, 0], KeyD: [1, 0],
  ArrowUp: [0, -1], KeyW: [0, -1],
  ArrowDown: [0, 1], KeyS: [0, 1],
};

export function attachInput(canvas, actions) {
  const held = new Set();
  const state = { cursor: null, fast: false };

  canvas.addEventListener('mousemove', (e) => {
    state.cursor = { x: e.offsetX, y: e.offsetY };
  });
  canvas.addEventListener('mouseleave', () => (state.cursor = null));
  canvas.addEventListener('mousedown', (e) => {
    state.cursor = { x: e.offsetX, y: e.offsetY };
    if (e.button === 0) actions.pick(e.offsetX, e.offsetY);
    if (e.button === 2) actions.loupe();
  });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  window.addEventListener('keydown', (e) => {
    if (MOVE_KEYS[e.code]) {
      held.add(e.code);
      e.preventDefault();
      return;
    }
    if (e.repeat) return;
    state.fast = e.shiftKey;
    switch (e.code) {
      case 'Space':
      case 'Enter':
        e.preventDefault();
        actions.confirm(state.cursor);
        break;
      case 'KeyH': actions.hint(); break;
      case 'KeyL': actions.loupe(); break;
      case 'KeyP':
      case 'Escape': actions.pause(); break;
      case 'KeyM': actions.mute(); break;
      case 'KeyR': actions.restart(); break;
      case 'KeyN': actions.next(); break;
    }
  });
  window.addEventListener('keyup', (e) => {
    held.delete(e.code);
    state.fast = e.shiftKey;
  });
  window.addEventListener('blur', () => held.clear());

  return {
    state,
    update(dt, home) {
      if (!held.size) return;
      if (!state.cursor) state.cursor = { ...home };
      let dx = 0;
      let dy = 0;
      for (const code of held) {
        dx += MOVE_KEYS[code][0];
        dy += MOVE_KEYS[code][1];
      }
      const speed = state.fast ? 620 : 280;
      state.cursor = { x: state.cursor.x + dx * speed * dt, y: state.cursor.y + dy * speed * dt };
    },
  };
}
