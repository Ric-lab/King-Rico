import {createRaceScene} from './scene.js';
import {COMPETITORS} from './competitors.js';
import {mountGameMenu} from '../../ui/game-menu.jsx';
const {BETS}=require('../../cloud/engine.cjs');
const {PAY,finishTime}=require('../../cloud/race.cjs');
const $=id=>document.getElementById(id),cloud=window.KingRicoCloud,fmt=n=>n.toLocaleString('pt-BR');
let scene,player=null,balance=null,selected=0,bet=10,busy=false,loading=true,paused=false,result=null,prefs={sfx:2,vib:2},audio,lastElapsed=0,lastSaved=-1,lastPlace=null;
const key=()=>`kingRico.race.${cloud?.uid}`;
function pending(){try{return JSON.parse(localStorage.getItem(key()));}catch{return null;}}
const save=x=>localStorage.setItem(key(),JSON.stringify(x));
function resize(){const w=document.documentElement.clientWidth,h=document.documentElement.clientHeight,s=Math.min(w/453,h/802);$('game').style.setProperty('--scene-scale',s);$('game').style.setProperty('--scene-height',h/s+'px');}new ResizeObserver(resize).observe(document.documentElement);resize();
COMPETITORS.forEach((c,i)=>{
 const button=document.createElement('button');button.className='choice';button.dataset.index=i;button.style.setProperty('--ball-color',c.css);button.setAttribute('aria-label',`Bolinha ${i+1}: ${c.name}`);button.innerHTML=`<span class="number">${i+1}</span><img src="${c.art}" alt=""><span class="name">${c.name}</span>`;button.onclick=()=>{if(busy||loading||paused)return;selected=i;scene.select(i);cue('tap');render();};$('choices').append(button);
 const label=document.createElement('span');label.className='ball-label';label.style.setProperty('--ball-color',c.css);label.textContent=i+1;$('ball-labels').append(label);
});
function cue(type){
 if(prefs.vib&&(type==='win'||type==='start'))navigator.vibrate?.(type==='win'?[25,40,40]:18);
 if(!prefs.sfx)return;
 try{audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume();const notes=type==='win'?[523,659,784,1047]:type==='start'?[440,660]:type==='count'?[440]:type==='marble'?[680,960]:[320];for(const[i,f]of notes.entries()){const o=audio.createOscillator(),g=audio.createGain(),t=audio.currentTime+i*.09;o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime((prefs.sfx===1?.025:.05)*(type==='marble'?.25:1),t+.015);g.gain.exponentialRampToValueAtTime(.0001,t+.14);o.connect(g);g.connect(audio.destination);o.start(t);o.stop(t+.16);}}catch{}
}
function render(){const live=busy&&!!result;$('game').dataset.running=String(live);$('live-art').src=COMPETITORS[selected].art;$('live-name').textContent=COMPETITORS[selected].name;$('live-stake').textContent=`Aposta ${fmt(bet)} · vitória ${fmt(Math.round(bet*(result&&result.outcome.version!==2?3.8:PAY)*100)/100)}`;const blocked=busy||paused||loading||!player;
 if(player){const text=fmt(balance??player.balance);$('balance').textContent=text;$('balance').style.fontSize=(text.length<=6?19:text.length<=8?16.5:14)+'px';}
 $('bet').textContent=fmt(bet);$('prize').textContent=fmt(Math.round(bet*PAY*100)/100);
 for(const [i,b]of[...$('choices').children].entries()){b.disabled=blocked;b.setAttribute('aria-pressed',String(i===selected));}
 $('bet-down').disabled=blocked||bet===BETS[0];$('bet-up').disabled=blocked||bet===BETS.at(-1);$('start').disabled=blocked||player.balance<bet;
 if(player?.balance<1&&!blocked)$('start').disabled=false;
 $('start').querySelector('span').textContent=busy?'TORCENDO…':player?.balance<1?'RECARREGAR':'LARGAR';$('start-hint').textContent=loading?'PREPARANDO A PISTA':busy?`SUA BOLINHA: ${COMPETITORS[selected].name.toUpperCase()}`:player?.balance<bet?'DIMINUA A APOSTA':`APOSTAR ${fmt(bet)} MOEDAS`;
 [...$('ball-labels').children].forEach((el,i)=>el.classList.toggle('selected',i===selected));
}
let lastCount=0,lastChime=-1;
function tick(x){lastElapsed=x.elapsed;
 x.labels.forEach(({i,x,y,visible})=>{const label=$('ball-labels').children[i];label.hidden=!visible;label.style.left=x*100+'%';label.style.top=y*100+'%';});
 $('progress').style.width=(busy?Math.max(...x.positions)*100:0)+'%';$('countdown').hidden=!busy||!x.countdown;
 if(x.countdown){$('countdown').textContent=x.countdown;if(x.countdown!==lastCount&&busy){lastCount=x.countdown;cue('count');}}
 if(busy&&result){const milestone=Math.floor(Math.max(...x.positions)*6);if(!x.countdown&&milestone!==lastChime){lastChime=milestone;cue('marble');}const place=x.order.indexOf(selected)+1,caption=x.countdown?'Vai começar…':x.positions[x.lead]>=1?`${COMPETITORS[x.lead].name} cruzou a chegada!`:`${x.phase} · ${COMPETITORS[x.lead].name} na ponta`;$('live-place').textContent=x.countdown?'—':`${place}º`; if($('race-status').textContent!==caption)$('race-status').textContent=caption;
  if(Math.floor(x.elapsed)!==lastSaved){lastSaved=Math.floor(x.elapsed);const p=pending();if(p&&!p.shown)save({...p,elapsed:x.elapsed});}
  if(place!==lastPlace){lastPlace=place;document.querySelector('.race-game').dataset.place=place;}
 }
}
function showResult(){if(!result)return;busy=true;scene.setPaused(true);const x=result.outcome,win=x.selected===x.winner,c=COMPETITORS[x.winner];$('countdown').hidden=true;$('result-art').src=c.art;$('result-title').textContent=win?'A sua venceu!':`${c.name} venceu`;$('result-detail').textContent=win?`${c.name} chegou em primeiro.`:`${COMPETITORS[selected].name} chegou em ${Array.from({length:x.version===2?5:4},(_,i)=>i).sort((a,b)=>finishTime(x.seed,a,x.version)-finishTime(x.seed,b,x.version)).indexOf(selected)+1}º lugar.`;$('result-amount').textContent=win?'+'+fmt(x.winUnits/100):'−'+fmt(x.betUnits/100);$('result-caption').textContent=win?'MOEDAS RECEBIDAS · APOSTA INCLUÍDA':'MOEDAS DESTA APOSTA';$('result-dialog').showModal();if(win)cue('win');render();}
function play(r,elapsed=0){result=r;selected=r.outcome.selected;bet=r.outcome.betUnits/100;balance=r.balanceDebited;busy=true;lastCount=0;lastChime=-1;lastSaved=-1;lastPlace=null;scene.setPaused(false);scene.play(r.outcome,elapsed);render();}
async function recover(){const p=pending();if(!p||p.shown||!scene||!player)return;busy=true;render();try{let r=await cloud.raceResult(p.roundId);if(!r){const op=JSON.parse(localStorage.getItem(`kingRico.pending.${cloud.uid}`)||'null');if(op?.action==='race'&&op.roundId===p.roundId)r=await cloud.race(op.bet,op.selected,op.seed,op.roundId,op.version??1);}
 if(r)play(r,p.elapsed||0);else if(Date.now()-p.createdAt<12000){busy=false;setTimeout(recover,700);}else{localStorage.removeItem(key());busy=false;render();}
 }catch(e){busy=false;cloud.error(e);render();}}
async function start(){if(busy||paused||loading||!player)return;if(player.balance<1){try{await cloud.recharge();}catch(e){cloud.error(e);}return;}if(player.balance<bet)return;const p=pending();if(p&&!p.shown){await recover();return;}
 busy=true;scene.setPaused(true);cue('start');render();const roundId=crypto.randomUUID();let seed;do{seed=crypto.getRandomValues(new Uint16Array(1))[0];}while(seed===65535);save({roundId,createdAt:Date.now(),elapsed:0,shown:false});
 try{play(await cloud.race(bet,selected,seed,roundId,2));}catch(e){if(['king-rico/invalid-argument','king-rico/failed-precondition','king-rico/resource-exhausted','king-rico/recovered','permission-denied'].includes(e.code))localStorage.removeItem(key());busy=false;scene.setPaused(false);cloud.error(e);balance=cloud.player.balance;render();}}
$('start').onclick=start;
for(const [id,delta]of[['bet-down',-1],['bet-up',1]])$(id).onclick=()=>{if(busy||loading||paused)return;bet=BETS[Math.max(0,Math.min(BETS.length-1,BETS.indexOf(bet)+delta))];cloud.settings({raceBetIdx:BETS.indexOf(bet)});cue('tap');render();};
$('result-done').onclick=()=>{const p=pending();if(p)save({...p,shown:true});$('result-dialog').close();result=null;busy=false;balance=player.balance;lastElapsed=0;scene.reset(selected);scene.setPaused(false);$('race-status').textContent='Escolha sua bolinha e torça';render();};
function help(){paused=true;scene?.setPaused(true);$('help-dialog').showModal();render();}for(const id of['help-done','close-help'])$(id).onclick=()=>$('help-dialog').close();$('help-dialog').addEventListener('close',()=>{paused=false;scene?.setPaused(false);render();});
mountGameMenu({screen:'Fortune Race',details:'Escolha sua bolinha e torça pela chegada. Saldo compartilhado do King Rico.',onOpen(v){paused=v;scene?.setPaused(v);render();},onHelp:help,onPreferences(p){prefs=p;cloud.settings({sfxLvl:p.sfx,vibLvl:p.vib});}});
cloud?.watch(p=>{player=p;prefs={sfx:p.settings.sfxLvl,vib:p.settings.vibLvl};if(!busy){balance=p.balance;bet=BETS[p.settings.raceBetIdx??3];}render();});
try{scene=await createRaceScene($('race-canvas'),{onTick:tick,onFinish:showResult});loading=false;$('loading').hidden=true;render();await cloud.ready;await recover();}catch(e){$('loading').textContent='Não foi possível abrir a pista.';$('error').hidden=false;$('error').textContent='Recarregue para tentar novamente. Sua aposta não foi cobrada.';console.error(e);}
window.KingRicoRace={scene,isBusy:()=>busy};
document.addEventListener('visibilitychange',()=>{const p=pending();if(document.hidden&&busy&&p&&!p.shown)save({...p,elapsed:lastElapsed});});window.addEventListener('pagehide',()=>scene?.destroy());
