import { cp, mkdir, rm, writeFile, readFile, lstat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = path.join(root, 'prototypes/browser');
const output = path.join(root, 'dist/pages');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const name of ['index.html', 'game.css', 'game.mjs', 'engine.mjs', 'render.mjs', 'art.html', 'art.css', 'art.js']) {
  await cp(path.join(source, name), path.join(output, name));
}
await cp(path.join(root, 'src/assets/icon.svg'), path.join(output, 'favicon.svg'));
await cp(path.join(root, 'src/assets/cinema'), path.join(output, 'assets'), {
  recursive: true,
  filter: sourcePath => !sourcePath.endsWith('.import') && !sourcePath.endsWith('.uid'),
});
await cp(path.join(root, 'prototypes/art-pack/lumen-cinema-props-01.zip'), path.join(output, 'assets/lumen-cinema-props-01.zip'));
await writeFile(path.join(output, '.nojekyll'), '');
const atlas = JSON.parse(await readFile(path.join(output, 'assets/atlas.json'), 'utf8'));
for (const asset of atlas.assets) {
  for (const name of [asset.file, `props/${asset.id}.tres`]) {
    const entry = await lstat(path.join(output, 'assets', name));
    if (!entry.isFile() || entry.isSymbolicLink()) throw Error(`Expected regular asset file: ${name}`);
  }
}
console.log(`GitHub Pages build ready: ${output} (${atlas.assets.length} sprites; no runtime dependencies)`);
