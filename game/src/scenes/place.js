// Scatters a scene's props without heavy overlap, so every difference can be seen and clicked.

export function hitCenter(item, kind) {
  return { x: item.x, y: item.y + (kind.cy || 0) * item.s, r: kind.r * item.s };
}

export function scatter(rng, items, kinds, spec) {
  const kind = kinds[spec.kind];
  for (let n = 0; n < spec.count; n++) {
    let best = null;
    let bestOverlap = Infinity;
    for (let attempt = 0; attempt < 70; attempt++) {
      const item = makeItem(rng, spec);
      const me = hitCenter(item, kind);
      let overlap = 0;
      for (const other of items) {
        const them = hitCenter(other, kinds[other.kind]);
        const room = (me.r + them.r) * (spec.gap ?? 0.9);
        const d = Math.hypot(me.x - them.x, me.y - them.y);
        if (d < room) overlap += room - d;
      }
      if (overlap < bestOverlap) {
        best = item;
        bestOverlap = overlap;
      }
      if (overlap === 0) break;
    }
    if (best && bestOverlap < (spec.tolerance ?? 30)) items.push(best);
  }
  return items;
}

export function makeItem(rng, spec) {
  const kind = spec.kind;
  return {
    kind,
    x: rng.range(spec.x[0], spec.x[1]),
    y: rng.range(spec.y[0], spec.y[1]),
    s: spec.s ? rng.range(spec.s[0], spec.s[1]) : 1,
    color: spec.colors ? rng.pick(spec.colors) : '#ffffff',
    alt: spec.alts ? rng.pick(spec.alts) : '#ffffff',
    rot: spec.rot ? rng.range(spec.rot[0], spec.rot[1]) : 0,
    flip: spec.flip === false ? 1 : rng.chance(0.5) ? -1 : 1,
    detail: spec.details ? rng.int(0, spec.details - 1) : 0,
    seed: rng.int(1, 1e9),
    layer: spec.layer ?? 1,
    hidden: false,
  };
}

export function finishItems(items) {
  items.sort((a, b) => a.layer - b.layer || a.y - b.y);
  items.forEach((item, i) => (item.id = i));
  return items;
}
