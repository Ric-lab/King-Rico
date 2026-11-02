// Shared paint and separate rigid parts for the native Circus controls.
import {writeFile} from 'node:fs/promises';
const dir='assets/machine/';
const paint={top:'#22a7c7',bottom:'#188dac',edge:'#07536b',ink:'#fff0bd',gold:'#d4ab4f',goldEdge:'#956d2e'};
const rr=(x,y,w,h,r)=>`M${x+r} ${y}H${x+w-r}Q${x+w} ${y} ${x+w} ${y+r}V${y+h-r}Q${x+w} ${y+h} ${x+w-r} ${y+h}H${x+r}Q${x} ${y+h} ${x} ${y+h-r}V${y+r}Q${x} ${y} ${x+r} ${y}Z`;
const defs=`<defs><linearGradient id="paint" x2="0" y2="1"><stop stop-color="${paint.top}"/><stop offset="1" stop-color="${paint.bottom}"/></linearGradient></defs>`;
const svg=(w,h,body)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${w*3}" height="${h*3}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">${defs}${body}</svg>\n`;
await writeFile(dir+'spin-front-blue-v1.svg',svg(333,60,`<rect x=".5" y=".5" width="332" height="59" rx="19" fill="url(#paint)" stroke="#147a96"/>`));
const outer=rr(1,1,355,76,27),inner=rr(8,7,341,64,21);
await writeFile(dir+'spin-rim-matte-v1.svg',svg(357,78,`<path d="${outer} ${inner}" fill="${paint.gold}" fill-rule="evenodd"/><path d="${outer}" fill="none" stroke="${paint.goldEdge}" stroke-width="1"/><path d="${inner}" fill="none" stroke="#b18736" stroke-width="1"/>`));
// A restrained gold sheen follows the same fixed contour; no travelling glare.
await writeFile(dir+'spin-rim-gold-v2.svg',svg(357,78,`<defs><linearGradient id="gold" x2="0" y2="1"><stop stop-color="#f6d879"/><stop offset=".3" stop-color="#ebc15c"/><stop offset=".7" stop-color="#dfb34b"/><stop offset="1" stop-color="#c99130"/></linearGradient></defs><path d="${outer} ${inner}" fill="url(#gold)" fill-rule="evenodd"/><path d="${outer}" fill="none" stroke="#a87a2e" stroke-width="1"/><path d="${inner}" fill="none" stroke="#f7d77a" stroke-width="1"/>`));
const face='M24 5H42Q47 5 47 10V35Q47 40 42 40H24Q6 40 6 22.5Q6 5 24 5Z';
for(const name of ['auto','turbo']){
 const flip=name==='auto'?'translate(52 0) scale(-1 1)':'';
 const glyph=name==='turbo'?'<path d="M29 11L18 25H25L22 34L36 20H29Z"/>':'<path transform="translate(-3 0)" d="M23 12Q22 11 22 14V31Q22 33 24 32L37 24Q39 23 37 22Z"/>';
 await writeFile(dir+name+'-socket-face-v6.svg',svg(52,46,`<path d="${face}" transform="${flip}" fill="url(#paint)" stroke="#147a96" stroke-width=".7"/><g fill="${paint.ink}" stroke="#07506d" stroke-width="1" stroke-linejoin="round">${glyph}</g>`));
}
