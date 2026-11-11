// Relocate only generated preview URLs. Production and the default / preview stay unchanged.
import {readdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
export function normalizeBase(value=''){
 const base=value.replace(/\/$/,'');
 if(base&&!/^(\/[A-Za-z0-9_.-]+)+$/.test(base)||base.split('/').some(p=>p==='.'||p==='..'))throw Error('Invalid preview base path');
 return base;
}
const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
export function rewritePreviewPaths(text,base,roots){
 base=normalizeBase(base);if(!base)return text;
 const names=[...new Set(roots)].sort((a,b)=>b.length-a.length).map(escape).join('|');
 const root=`/(?:${names})(?=[/?!#\\s"'\x60)]|$)`;
 // Do not replace '/' separators, arbitrary regexes, external URLs or the intercepted /api/play.
 text=text.replace(new RegExp(`(["'\x60])(${root})`,'g'),(_,quote,url)=>quote+base+url);
 text=text.replace(new RegExp(`(url\\(\\s*)(${root})`,'g'),(_,start,url)=>start+base+url);
 return text.replace(/((?:href|action)=["'])\/(?=["'])/g,(_,start)=>start+base+'/');
}
export async function relocatePreview(directory,base){
 base=normalizeBase(base);if(!base)return;
 const entries=await readdir(directory,{withFileTypes:true});
 const routes=JSON.parse(await readFile(new URL('../site/routes.json',import.meta.url),'utf8'));
 const roots=['assets','ui','runtime','cloud','games',...routes.map(r=>r.path.slice(1)),'home',
  ...entries.filter(e=>e.isFile()).flatMap(e=>[e.name,encodeURIComponent(e.name)])];
 async function walk(dir){
  for(const e of await readdir(dir,{withFileTypes:true})){
   const file=path.join(dir,e.name);
   if(e.isDirectory())await walk(file);
   else if(/\.(html|js|css|json|svg|webmanifest)$/.test(e.name)){
    const old=await readFile(file,'utf8'),next=rewritePreviewPaths(old,base,roots);
    if(old!==next)await writeFile(file,next);
   }
  }
 }
 await walk(directory);
 await writeFile(path.join(directory,'.nojekyll'),'');
 console.log('Preview base path: '+base);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 await relocatePreview('dist',process.argv.find(a=>a.startsWith('--base='))?.slice(7)||'');
}
