import { cp, mkdir, rm, writeFile, readFile, lstat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = path.join(root, 'prototypes/browser');
const output = path.join(root, 'dist/pages');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const name of ['index.html', 'game.css', 'game.mjs', 'engine.mjs', 'render.mjs', 'world.mjs', 'scene.mjs', 'assets.mjs', 'audio.mjs', 'studio.css', 'art.html', 'art.css', 'art.js']) {
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
const release = {version:'0.3.0',commit:process.env.GITHUB_SHA || null,builtAt:new Date().toISOString()};
await writeFile(path.join(output,'version.json'),JSON.stringify(release,null,2)+'\n');
const runtime=JSON.parse(await readFile(path.join(output,'assets/runtime/manifest.json'),'utf8'));
for(const file of Object.values(runtime.files)){if(!(await lstat(path.join(output,'assets/runtime',file))).isFile())throw Error('Missing runtime asset: '+file);}
console.log(`GitHub Pages build ready: ${output} (${runtime.assets.length} prop sprites, ${runtime.posters.film_ids.length} posters, ${runtime.actors.frames.length} actor frames; no runtime dependencies)`);
