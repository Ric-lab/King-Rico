// One coordinate system for the bar and its two recessed, independently moving keys.
import {readFile,writeFile} from 'node:fs/promises';
const dir='assets/machine/';
const defs=`<defs>
<linearGradient id="gold" x2="0" y2="1"><stop stop-color="#fff3ad"/><stop offset=".15" stop-color="#ffdf70"/><stop offset=".4" stop-color="#d29420"/><stop offset=".7" stop-color="#b46a0f"/><stop offset=".88" stop-color="#f6cf55"/><stop offset="1" stop-color="#80501a"/></linearGradient>
<linearGradient id="red" x2="0" y2="1"><stop stop-color="#80142b"/><stop offset=".5" stop-color="#640c24"/><stop offset="1" stop-color="#3f091c"/></linearGradient>
<linearGradient id="purple" x2="0" y2="1"><stop stop-color="#b77cf0"/><stop offset=".24" stop-color="#893dc5"/><stop offset=".7" stop-color="#62238f"/><stop offset="1" stop-color="#43105f"/></linearGradient>
<linearGradient id="cream" x2="0" y2="1"><stop stop-color="#fffce4"/><stop offset="1" stop-color="#ffe28a"/></linearGradient>
</defs>`;
// The outer edge follows the bar's cap. The inside edge echoes the bet well.
const hole='M24 4H43Q48 4 48 9V37Q48 42 43 42H24Q4 42 4 23Q4 4 24 4Z';
const face='M24 5H42Q47 5 47 10V35Q47 40 42 40H24Q6 40 6 22.5Q6 5 24 5Z';
const svg=(w,h,body)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${w*6}" height="${h*6}" viewBox="0 0 ${w} ${h}">${defs}${body}</svg>\n`;
const at=name=>name==='turbo'?'translate(6 4)':'translate(411 4) scale(-1 1)';
const sockets=['turbo','auto'].map(name=>`<g transform="${at(name)}"><path d="${hole}" fill="#092d40" stroke="#e3b754" stroke-width="1"/><path d="${face}" fill="#0c3f54"/></g>`).join('');
await writeFile(dir+'base-controls-v4.svg',svg(417,54,`
<rect x=".75" y=".75" width="415.5" height="52.5" rx="26" fill="url(#gold)" stroke="#815019" stroke-width="1.5"/>
<rect x="4" y="4" width="409" height="46" rx="22" fill="url(#red)" stroke="#ffe9a3" stroke-opacity=".8" stroke-width="1"/>
<path d="M30 5H387" stroke="#ffebb1" stroke-width=".7" opacity=".45"/>
${sockets}`));
for(const name of ['turbo','auto']){
 const flip=name==='auto'?'translate(52 0) scale(-1 1)':'';
 const glyph=name==='turbo'?'<path d="M29 11L18 25H25L22 34L36 20H29Z"/>':'<path d="M23 12Q22 11 22 14V31Q22 33 24 32L37 24Q39 23 37 22Z"/>';
 // A socket lip only. The outer gold belongs to the shared bar, not a second plate.
 await writeFile(dir+name+'-socket-rim-v3.svg',svg(52,46,`<g transform="${flip}"><path d="${hole}" fill="none" stroke="#072d3d" stroke-width="1.6"/><path d="${face}" fill="none" stroke="#d5a95b" stroke-opacity=".65" stroke-width=".6"/></g>`));
 const iconTransform=name==='auto'?' transform="translate(-3 0)"':'';
 const capDefs=`<defs><linearGradient id="cap" x1="0" y1="0" x2=".15" y2="1"><stop stop-color="#6ff1f4"/><stop offset=".25" stop-color="#28d3e0"/><stop offset=".7" stop-color="#11a8c9"/><stop offset="1" stop-color="#087eaa"/></linearGradient></defs>`;
 await writeFile(dir+name+'-socket-face-v5.svg',svg(52,46,`${capDefs}<path d="${face}" transform="${flip}" fill="url(#cap)" stroke="#a3f8ff" stroke-opacity=".75" stroke-width=".7"/><g${iconTransform} fill="url(#cream)" stroke="#07506d" stroke-width="1" stroke-linejoin="round">${glyph}</g>`));
 const path=`<path d="${hole}" transform="${flip}" fill="white"/>`;
 await writeFile(dir+name+'-socket-mask-v2.svg',svg(52,46,path));
}

// A centered front-facing cap sits inside a fixed bevel and cavity.
const contour=JSON.parse(await readFile(dir+'spin-green-contour-v2.json','utf8'));
const frameDefs=`<defs><linearGradient id="frame" x2="0" y2="1"><stop stop-color="#fff5bf"/><stop offset=".2" stop-color="#ffe077"/><stop offset=".52" stop-color="#ba7718"/><stop offset=".78" stop-color="#f4c951"/><stop offset="1" stop-color="#84501a"/></linearGradient><mask id="ring"><rect width="1071" height="234" fill="white"/><path d="${contour.path}" fill="black"/></mask></defs>`;
await writeFile(dir+'spin-rim-v3.svg',`<svg xmlns="http://www.w3.org/2000/svg" width="1071" height="234" viewBox="0 0 1071 234">${frameDefs}<g mask="url(#ring)" fill="none"><path d="${contour.path}" stroke="#794018" stroke-width="44"/><path d="${contour.path}" stroke="url(#frame)" stroke-width="38"/><path d="${contour.path}" stroke="#fff0ad" stroke-opacity=".7" stroke-width="5"/></g></svg>\n`);

// Depth cues follow the real green contour, independent from the gold rim and text.
const spinSvg=body=>`<svg xmlns="http://www.w3.org/2000/svg" width="1071" height="234" viewBox="0 0 1071 234" preserveAspectRatio="none">${body}</svg>\n`;
const contourClip=`<clipPath id="green"><path d="${contour.path}"/></clipPath>`;
await writeFile(dir+'spin-cavity-front-v1.svg',spinSvg(`<defs>${contourClip}<linearGradient id="well" x2="0" y2="1"><stop stop-color="#00190e"/><stop offset="1" stop-color="#074627"/></linearGradient></defs><path d="${contour.path}" fill="url(#well)"/><path d="${contour.path}" clip-path="url(#green)" fill="none" stroke="#00190b" stroke-width="22"/>`));
await writeFile(dir+'spin-shadow-front-v1.svg',spinSvg(`<defs>${contourClip}<linearGradient id="shade" x2="0" y2="1"><stop stop-color="#001b0c" stop-opacity=".9"/><stop offset=".45" stop-color="#002812" stop-opacity=".45"/><stop offset="1" stop-color="#9bffae" stop-opacity=".18"/></linearGradient></defs><path d="${contour.path}" clip-path="url(#green)" fill="none" stroke="url(#shade)" stroke-width="26"/>`));

// Let the cap fill its inset viewport; default SVG letterboxing widens the end bevels.
for(const state of ['lit','idle']){
 const original=await readFile(dir+'spin-face-'+state+'-v2.svg','utf8');
 await writeFile(dir+'spin-face-'+state+'-v3.svg',original.replace('<svg ','<svg preserveAspectRatio="none" '));
}
