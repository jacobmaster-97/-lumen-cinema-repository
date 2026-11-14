import {readFile,writeFile} from 'node:fs/promises';
const fragment=await readFile(new URL('./cinema-layout-editor.html',import.meta.url),'utf8');
const shell='<!doctype html>\n<html lang="zh-Hant"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>光影大亨地圖編排器</title><style>:root{color-scheme:light dark}body{margin:0;padding:24px;background:light-dark(#faf9f4,#102630)}@media(max-width:500px){body{padding:10px}}</style>\n';
await writeFile(new URL('./index.html',import.meta.url),shell+fragment+'\n</html>\n');
console.log('Built self-contained offline editor');
