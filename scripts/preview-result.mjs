import {readFile,appendFile} from 'node:fs/promises';
const result=JSON.parse(await readFile(process.argv[2],'utf8'));
const urls=[];
function walk(value){if(typeof value==='string'){try{const u=new URL(value);if(u.protocol==='https:'&&/^king-rico--previa-[a-z0-9-]+\.web\.app$/.test(u.hostname))urls.push(u.origin);}catch{}}else if(value&&typeof value==='object')Object.values(value).forEach(walk);}
walk(result);
const url=urls[0];if(!url)throw Error('O Firebase não devolveu uma URL do canal previa; confira a publicação.');
console.log('Prévia: '+url);
if(process.env.GITHUB_OUTPUT)await appendFile(process.env.GITHUB_OUTPUT,`url=${url}\n`);
if(process.env.GITHUB_STEP_SUMMARY)await appendFile(process.env.GITHUB_STEP_SUMMARY,`### Prévia compartilhada\n\n${url}/circus\n\nCommit: ${process.env.GITHUB_SHA}\n\nCanal previa; moedas fictícias; expira em 30 dias sem nova publicação. Live e regras não são publicados.\n`);
