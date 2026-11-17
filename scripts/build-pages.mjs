import { cp, mkdir, rm, writeFile, readFile, lstat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = path.join(root, 'prototypes/browser');
const output = path.join(root, 'dist/pages');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const name of ['index.html', 'game.css', 'game.mjs', 'engine.mjs', 'render.mjs', 'world.mjs', 'scene.mjs', 'assets.mjs', 'audio.mjs', 'strategy.mjs','strategy-ui.mjs','operations.mjs','operations-world.mjs','operations-ui.mjs','construction.mjs','construction-ui.mjs','map-data.mjs','map-world.mjs','studio.css','mobile.css','mobile-input.mjs','touch-map.mjs', 'art.html', 'art.css', 'art.js']) {
  await cp(path.join(source, name), path.join(output, name));
  if(name.endsWith('.mjs')){const file=path.join(output,name),code=await readFile(file,'utf8');await writeFile(file,code.replace(/(['"])(\.\.?\/[^'"?]+\.mjs)(?:\?v=[^'"]+)?\1/g,(_,q,p)=>q+p+'?v=0.7.2'+q));}
}
await cp(path.join(root, 'src/assets/icon.svg'), path.join(output, 'favicon.svg'));
await cp(path.join(root, 'src/assets/cinema'), path.join(output, 'assets'), {
  recursive: true,
  filter: sourcePath => !sourcePath.endsWith('.import') && !sourcePath.endsWith('.uid'),
});
await cp(path.join(root, 'prototypes/art-pack/lumen-cinema-props-01.zip'), path.join(output, 'assets/lumen-cinema-props-01.zip'));
await writeFile(path.join(output, '.nojekyll'), '');
// Publish the approved design independently of the playable game's save/map contracts.
const designSource=path.join(root,'design/art/selected-layout-v2');
const mapOutput=path.join(output,'map-preview');
await mkdir(path.join(mapOutput,'zones'),{recursive:true});
for(const name of ['layout.json','selected-config.json','confirmed-config.json'])await cp(path.join(designSource,name),path.join(mapOutput,name));
await cp(path.join(designSource,'preview.html'),path.join(mapOutput,'index.html'));
let preview=await readFile(path.join(designSource,'preview.mjs'),'utf8');
for(const [from,to]of [
  ['../../../prototypes/browser/world.mjs','../world.mjs'],
  ['../../../src/assets/cinema/runtime/','../assets/runtime/'],
  ['../integrated-zones-v2/','./zones/'],
]){
  if(!preview.includes(from))throw Error('Design preview dependency moved: '+from);
  preview=preview.replaceAll(from,to);
}
await writeFile(path.join(mapOutput,'preview.mjs'),preview);
for(const name of ['tickets','snacks','toilets'])await cp(path.join(root,'design/art/integrated-zones-v2',name+'.png'),path.join(mapOutput,'zones',name+'.png'));
await mkdir(path.join(output,'layout-editor'),{recursive:true});
await cp(path.join(root,'design/tools/layout-editor/index.html'),path.join(output,'layout-editor/index.html'));
await cp(path.join(root,'design/art/upgrades-v1'),path.join(output,'upgrade-art'),{recursive:true});
await mkdir(path.join(output,'design'),{recursive:true});
await cp(path.join(root,'design/tools/design-hub.html'),path.join(output,'design/index.html'));
const approved=JSON.parse(await readFile(path.join(mapOutput,'confirmed-config.json'),'utf8'));
if(approved.rooms.find(r=>r.id==='toilets')?.door!=='east')throw Error('Expected confirmed bathroom entry east');
const designRelease={schemaVersion:1,revision:1,commit:process.env.GITHUB_SHA||null,builtAt:new Date().toISOString(),confirmedConfig:'../map-preview/confirmed-config.json',bathroomDoor:'east'};
await writeFile(path.join(output,'design/version.json'),JSON.stringify(designRelease,null,2)+'\n');
const atlas = JSON.parse(await readFile(path.join(output, 'assets/atlas.json'), 'utf8'));
for (const asset of atlas.assets) {
  for (const name of [asset.file, `props/${asset.id}.tres`]) {
    const entry = await lstat(path.join(output, 'assets', name));
    if (!entry.isFile() || entry.isSymbolicLink()) throw Error(`Expected regular asset file: ${name}`);
  }
}
const release = {version:'0.7.2',commit:process.env.GITHUB_SHA || null,builtAt:new Date().toISOString()};
await writeFile(path.join(output,'version.json'),JSON.stringify(release,null,2)+'\n');
const runtime=JSON.parse(await readFile(path.join(output,'assets/runtime/manifest.json'),'utf8'));
for(const file of Object.values(runtime.files)){if(!(await lstat(path.join(output,'assets/runtime',file))).isFile())throw Error('Missing runtime asset: '+file);}
console.log(`GitHub Pages build ready: ${output} (${runtime.assets.length} prop sprites, ${runtime.posters.film_ids.length} posters, ${runtime.actors.frames.length} actor frames; no runtime dependencies)`);
