// Layout v7 (dono): máquina maior no meio, ocupando o espaço das barras laterais.
// Escala ÚNICA em volta do centro dos rolos para todas as peças da máquina (moldura, luzes, rolos 3D, linhas, efeitos).
const S=1.1,CX=226.5,CY=410;
const SEL='.park-part-base,.park-machine-plate,.park-machine-lights,.park-reel-window-back,.park-reels,.park-reel-frame,.park-reel-effects,.park-win-lines,.park-part-prize';
function apply(){const st=document.querySelector('.park-circus-stage');if(!st)return;
 for(const el of st.querySelectorAll(SEL)){if(el.parentElement?.closest(SEL)||el.dataset.v7s)continue;
  let l=0,t=0,n=el;while(n&&n!==st){l+=n.offsetLeft;t+=n.offsetTop;n=n.offsetParent;}
  el.style.transformOrigin=(CX-l)+'px '+(CY-t)+'px';el.style.scale=String(S);el.dataset.v7s='1';}}
new MutationObserver(apply).observe(document.documentElement,{childList:true,subtree:true});apply();
