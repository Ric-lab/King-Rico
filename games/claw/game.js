import {createClawScene} from './scene.js';
import {mountGameMenu} from '../../ui/game-menu.jsx';
const {BETS}=require('../../cloud/engine.cjs');
const $=id=>document.getElementById(id),cloud=window.KingRicoCloud,fmt=n=>n.toLocaleString('pt-BR');
let scene,player=null,displayedBalance=null,bet=10,busy=false,paused=false,loading=true,current=null,prefs={sfx:2,vib:2},audio;
const storageKey=()=>`kingRico.claw.${cloud?.uid}`;
const stored=()=>{try{return JSON.parse(localStorage.getItem(storageKey()));}catch{return null;}};
const save=x=>localStorage.setItem(storageKey(),JSON.stringify(x));
function resize(){const w=document.documentElement.clientWidth,h=document.documentElement.clientHeight,s=Math.min(w/453,h/802);$('game').style.setProperty('--scene-scale',s);$('game').style.setProperty('--scene-height',h/s+'px');}
new ResizeObserver(resize).observe(document.documentElement);resize();
function sound(win=false,cue='tap'){
 if(prefs.vib&&cue!=='motor')navigator.vibrate?.(win?[25,35,40]:cue==='close'?[15,20,22]:16);
 if(!prefs.sfx)return;
 try{
  audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume();
  const notes=cue==='motor'?[125,145]:cue==='close'?[180,90]:win?[523,659,784]:[310,220];
  const level=prefs.sfx===1?.022:.044;
  for(const[i,f]of notes.entries()){
   const o=audio.createOscillator(),g=audio.createGain(),t=audio.currentTime+i*(cue==='motor'?.14:.075),duration=cue==='motor'?.3:.11;
   o.type='triangle';o.frequency.setValueAtTime(f,t);if(cue==='motor')o.frequency.linearRampToValueAtTime(f*.78,t+duration);
   g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(level,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+duration);
   o.connect(g);g.connect(audio.destination);o.start(t);o.stop(t+duration+.02);
  }
 }catch{}
}
function render(){if(player){const text=fmt(displayedBalance??player.balance);$('balance').textContent=text;$('balance').style.fontSize=(text.length<=6?19:text.length<=8?16.5:14)+'px';}$('bet').textContent=fmt(bet);const blocked=busy||loading||paused||!player;$('grab').disabled=blocked||player.balance<bet;$('bet-down').disabled=blocked||bet===BETS[0];$('bet-up').disabled=blocked||bet===BETS.at(-1);$('grab').querySelector('span').textContent=busy?'PEGANDO…':player?.balance<1?'RECARREGAR':'PEGAR';if(player?.balance<1&&!blocked)$('grab').disabled=false;$('grab-hint').textContent=loading?'ABRINDO A MÁQUINA':busy?'ESPERE A GARRA TERMINAR':player?.balance<bet?'DIMINUA A APOSTA':`APOSTAR ${fmt(bet)} MOEDAS`;}
function aim(x){if(busy)return;$('multiplier').textContent='×'+fmt(x.multiplier);$('prize').textContent=fmt(Math.round(bet*x.multiplier*100)/100)+' moedas';$('aim-label').textContent='PEGAR quando a mira passar no centro';}
const royal=x=>x.quality>=700&&Math.round(x.winUnits/x.betUnits*10)===30;
function phase(name,outcome){$('machine').dataset.phase=name;$('machine').dataset.win=String((outcome?.quality??0)>=700);if(!busy)return;const captions={start:'Preparando a garra…',lower:'Descendo…',close:'Fechando a garra…',lift:'Segura, Happeach!',travel:'Levando até a saída…',release:'Soltando…',delivery:outcome?.quality>=700?'O Happeach chegou!':'Vamos ver o resultado…'};$('aim-label').textContent=captions[name]||'';if(name==='close'||name==='release')sound(false,'close');if(name==='lower'||name==='lift')sound(false,'motor');}
function showResult(outcome){current=outcome;busy=true;scene?.setPaused(true);const win=outcome.quality>=700,refund=outcome.quality>=400;$('result-title').textContent=win?'Pegou o Happeach!':refund?'Foi por pouco!':'Escapou da garra';$('result-detail').textContent=win?'Direto para a saída. Boa mira!':refund?'A garra pegou na borda. Sua aposta voltou.':'Ajuste a posição e tente outra vez.';$('result-art').src=win?(royal(outcome)?'./assets/claw/happeach-royal.webp':'./assets/claw/happeach-plush.webp'):'./assets/happeach/f-drop.webp';$('result-amount').textContent=outcome.winUnits?fmt(outcome.winUnits/100):'−'+fmt(outcome.betUnits/100);$('result-caption').textContent=win?'MOEDAS RECEBIDAS · APOSTA INCLUÍDA':refund?'MOEDAS DEVOLVIDAS':'MOEDAS DESTA APOSTA';$('result-dialog').showModal();sound(win);render();}
async function recover(){if(!scene||!player||busy)return;const pending=stored();if(!pending||pending.shown)return;busy=true;render();try{const result=await cloud.clawResult(pending.roundId);if(result){scene.reset(result.outcome.seed);showResult(result.outcome);}else{
 const data=JSON.parse(localStorage.getItem(`kingRico.pending.${cloud.uid}`)||'null');
 if(data?.action==='claw'&&data.roundId===pending.roundId){const restored=await cloud.claw(data.bet,data.selected,data.aimX,data.aimZ,data.seed,data.roundId);showResult(restored.outcome);}
 else if(Date.now()-(pending.createdAt||0)<10000){busy=false;setTimeout(recover,600);render();}
 else{localStorage.removeItem(storageKey());busy=false;render();}
 }}catch(e){busy=false;cloud.error(e);render();}}
async function grab(){if(busy||loading||paused||!player)return;if(player.balance<1){try{await cloud.recharge();}catch(e){cloud.error(e);}return;}if(player.balance<bet)return;
 const previous=stored();if(previous&&!previous.shown){await recover();return;}
 busy=true;scene.setPaused(true);const pick=scene.freeze(),roundId=crypto.randomUUID();save({roundId,shown:false,createdAt:Date.now()});sound();render();
 try{const result=await cloud.claw(bet,pick.selected,pick.aimX,pick.aimZ,pick.seed,roundId);displayedBalance=result.balanceDebited;render();scene.setPaused(false);scene.play(result.outcome,pick);current=result.outcome;}catch(e){if(['king-rico/invalid-argument','king-rico/failed-precondition','king-rico/resource-exhausted','permission-denied','king-rico/recovered'].includes(e.code))localStorage.removeItem(storageKey());busy=false;displayedBalance=cloud.player.balance;scene.setPaused(false);cloud.error(e);render();}}
$('grab').onclick=grab;
for(const [id,delta]of[['bet-down',-1],['bet-up',1]])$(id).onclick=()=>{if(busy||loading)return;bet=BETS[Math.max(0,Math.min(BETS.length-1,BETS.indexOf(bet)+delta))];cloud.settings({clawBetIdx:BETS.indexOf(bet)});sound();render();if(scene)aim(scene.pick());};
function flyCoins(done){
 if(matchMedia('(prefers-reduced-motion: reduce)').matches){done();return;}
 const from=$('claw-canvas').getBoundingClientRect(),to=$('balance').getBoundingClientRect();
 for(let i=0;i<7;i++){const img=new Image();img.src='./assets/symbols/sym-coin.webp';img.className='claw-coin';const x=from.x+from.width/2-14,y=from.y+from.height*.8;img.style.left=x+'px';img.style.top=y+'px';document.body.append(img);const a=img.animate([{transform:'translate(0,0) scale(.5)',opacity:0},{transform:`translate(${(i-3)*12}px,-30px) scale(1)`,opacity:1,offset:.2},{transform:`translate(${to.x+to.width/2-x}px,${to.y-y}px) scale(.45)`,opacity:1}],{duration:520,delay:i*35,easing:'cubic-bezier(.4,0,.65,1)',fill:'both'});a.finished.then(()=>img.remove()).catch(()=>img.remove());}
 setTimeout(done,750);
}
$('result-done').onclick=()=>{const p=stored();if(p)save({...p,shown:true});$('result-dialog').close();const win=current?.quality>=700;current=null;scene.reset();scene.setPaused(false);if(win){busy=true;render();flyCoins(()=>{displayedBalance=player.balance;busy=false;render();});}else{busy=false;displayedBalance=player.balance;render();}};
function help(){paused=true;scene?.setPaused(true);$('help-dialog').showModal();render();}
for(const id of ['close-help','help-done'])$(id).onclick=()=>$('help-dialog').close();$('help-dialog').addEventListener('close',()=>{paused=false;scene?.setPaused(false);render();});
mountGameMenu({screen:'Claw Machine',details:'Acerte a mira e leve o Happeach até a saída. A aposta e o prêmio usam o saldo compartilhado do King Rico.',onOpen(v){paused=v;scene?.setPaused(v);render();},onHelp:help,onPreferences(p){prefs=p;cloud.settings({sfxLvl:p.sfx,vibLvl:p.vib});}});
cloud?.watch(p=>{player=p;if(!busy)displayedBalance=p.balance;prefs={sfx:p.settings.sfxLvl,vib:p.settings.vibLvl};if(!busy)bet=BETS[p.settings.clawBetIdx??3];render();});
try{scene=await createClawScene($('claw-canvas'),{onAim:aim,onFinish:showResult,onPhase:phase,onGrab:()=>$('grab').click()});loading=false;$('loading').hidden=true;render();await cloud?.ready;await recover();}catch(e){$('loading').textContent='Não foi possível abrir a máquina.';$('error').hidden=false;$('error').textContent='Tente recarregar a página. Sua aposta não foi cobrada.';console.error(e);}
window.KingRicoClaw={isBusy:()=>busy,scene};window.addEventListener('pagehide',()=>scene?.destroy());
