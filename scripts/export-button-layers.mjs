// Non-destructive layer exports: retain the approved pixels, split only their aperture.
import {readFile,writeFile} from 'node:fs/promises';
const dir='assets/machine/';
async function layer(name,source,width,height,shape,part){
 const bytes=await readFile(source),uri='data:image/webp;base64,'+bytes.toString('base64');
 const defs=part==='rim'?`<mask id="part"><rect width="100%" height="100%" fill="white"/>${shape.replace('fill="white"','fill="black"')}</mask>`:`<clipPath id="part">${shape}</clipPath>`;
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs>${defs}</defs><image width="${width}" height="${height}" href="${uri}" ${part==='rim'?'mask':'clip-path'}="url(#part)"/></svg>\n`;
 await writeFile(dir+name+'.svg',svg);
}
const circle='<circle cx="128" cy="128" r="102" fill="white"/>';
const contour=JSON.parse(await readFile(dir+'spin-green-contour-v2.json','utf8'));
const pill='<path d="'+contour.path+'" fill="white"/>';
// Shared smooth gold rim is authored directly in button-round-rim-v2.svg.
for(const name of ['auto','turbo'])await layer(name+'-face-v1','assets/machine/'+name+'-v1.webp',256,256,circle,'face');
await layer('spin-rim-v2','assets/spin/spin-base.webp',1071,234,pill,'rim');
await layer('spin-face-lit-v2','assets/spin/spin-base.webp',1071,234,pill,'face');
await layer('spin-face-idle-v2','assets/spin/spin-pressed.webp',1071,234,pill,'face');

await writeFile(dir+'spin-aperture-v2.svg',`<svg xmlns="http://www.w3.org/2000/svg" width="1071" height="234" viewBox="0 0 1071 234">${pill}</svg>\n`);
