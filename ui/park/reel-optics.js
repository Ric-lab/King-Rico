import {installDrumDepth} from './drum-depth.js';
// Light belongs to the drum window, so idle and moving symbols share its volume.
export function installReelOptics(stage){
 const reels=stage?.querySelector('.park-reels');if(!reels||reels.dataset.reelOptics)return;
 const independent=!!reels.querySelector('.park-reel-paper');
 reels.dataset.reelOptics=independent?'nine':'three';
 if(independent){void installDrumDepth(stage,reels);return;}
 for(const shell of reels.querySelectorAll('.park-reel-shell')){
  const light=document.createElement('div'),style=getComputedStyle(shell);
  light.className='park-roll-light';light.setAttribute('aria-hidden','true');
  Object.assign(light.style,{left:style.left,top:style.top,width:style.width,height:style.height});
  reels.append(light);
 }
}
