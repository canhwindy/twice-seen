// Twice Seen hands itself in: copy the static game and its screenshots to the output folder and
// write the dossier the judge reads, using the kit's own library (vendor/makefun-game.ts).
// Locally: mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const root = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function copyFolder(name: string): void {
  const from = join(root, name);
  const to = join(outDir, name);
  mkdirSync(to, { recursive: true });
  if (existsSync(from)) cpSync(from, to, { recursive: true });
}

mkdirSync(outDir, { recursive: true });
copyFolder('game');
copyFolder('screenshots');

const shots = readdirSync(join(outDir, 'screenshots')).filter((name) => !name.startsWith('.'));
if (shots.length < 3 || shots.length > 4) console.warn(`Twice Seen: expected 3 or 4 screenshots, found ${shots.length}`);

// The gate's caps: more than 4 screenshots, one over 256 KiB, or a game/ past 993 entries or
// 48 MiB is refused; the dossier text is capped at 160 KiB.
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
console.log(`Twice Seen: wrote ${join(outDir, 'dossier.json')}`);
