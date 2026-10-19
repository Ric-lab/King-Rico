import * as THREE from 'three';
import Matter from 'matter-js';
import {mountMenu} from './menu-entry.js';
import {TOTAL,WIDTH,HEIGHT,BONUS_PER_GATE,MAX_BALLS,GATE_X,availableIds,marblePlan,begin,resolveBall,payout,settle} from './cascade-state.mjs';
const {Engine,Bodies,Body,Composite,Events}=Matter;
const $=id=>document.getElementById(id),fmt=n=>new Intl.NumberFormat('pt-BR').format(n);
const KEY='king-rico-cascade-demo-v2',COLORS=[0xffca55,0xb577f5,0x62d9b8],CSS_COLORS=['#ffca55','#b577f5','#62d9b8'],BETS=[10,25,50,100],CATCH_MIN=83,CATCH_MAX=277;
const fresh=()=>({version:2,balance:1000,bet:25,settings:{sfx:1,vib:1},round:null});
let memory=fresh();
function read(){try{const s=JSON.parse(localStorage.getItem(KEY));if(s?.version===2&&Number.isFinite(s.balance))return s;}catch{}return memory;}
function write(){memory=state;try{localStorage.setItem(KEY,JSON.stringify(state));}catch{}}
let state=read(),catcher=state.round?.catcher??WIDTH/2,paused=false,pointer=null,clock=0,last=0,acc=0,lastSave=0,catchPulse=0,comboUntil=0,avalancheUntil=0;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const canvas=$('game'),arena=$('arena');
let renderer;
try{renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});}catch{$('compatibility').hidden=false;throw Error('WebGL indisponível');}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.setClearColor(0,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.04;
const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-190,190,260,-260,1,1800);camera.position.set(WIDTH/2,HEIGHT/2,900);camera.lookAt(WIDTH/2,HEIGHT/2,0);
scene.add(new THREE.HemisphereLight(0xfff0dc,0x3b2051,2));
const light=new THREE.DirectionalLight(0xffe5b4,3.5);light.position.set(-100,700,500);scene.add(light);
const rim=new THREE.DirectionalLight(0xdec0ff,2);rim.position.set(500,200,150);scene.add(rim);
const mat=(color,metalness=.2,roughness=.35,extra={})=>new THREE.MeshStandardMaterial({color,metalness,roughness,...extra});
const gold=mat(0xf3be5c,.65,.24),darkGold=mat(0x8d582b,.6,.33),plum=mat(0x461d4e,.1,.5),cream=mat(0xffe3a4,.45,.26);
const envCanvas=document.createElement('canvas');envCanvas.width=512;envCanvas.height=256;const ec=envCanvas.getContext('2d'),eg=ec.createLinearGradient(0,0,0,256);eg.addColorStop(0,'#fff2d6');eg.addColorStop(.45,'#8d6c9b');eg.addColorStop(.55,'#2e163e');eg.addColorStop(1,'#d7a969');ec.fillStyle=eg;ec.fillRect(0,0,512,256);ec.fillStyle='#fff9de';ec.fillRect(40,20,95,85);ec.fillRect(340,35,22,110);const env=new THREE.CanvasTexture(envCanvas);env.mapping=THREE.EquirectangularReflectionMapping;env.colorSpace=THREE.SRGBColorSpace;const pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromEquirectangular(env).texture;scene.environmentIntensity=.7;env.dispose();pmrem.dispose();
function place(o,x,y,z,parent=scene){o.position.set(x,HEIGHT-y,z);parent.add(o);return o;}
function panel(w,h,r,d,material){const s=new THREE.Shape(),x=-w/2,y=-h/2;s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return new THREE.Mesh(new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:true,bevelSize:1.6,bevelThickness:1.5,bevelSegments:3,steps:1}),material);}
// Generated cabinet art is a backplate; every marble, pin and gate is live geometry.
const textures=new THREE.TextureLoader();
const cabinetTexture=textures.load('./assets/cascade/cabinet.webp');cabinetTexture.colorSpace=THREE.SRGBColorSpace;
place(new THREE.Mesh(new THREE.PlaneGeometry(360,540),new THREE.MeshBasicMaterial({map:cabinetTexture,toneMapped:false})),180,250,-18);
const shutters=[],chargePips=[],reservoirGlass=[];
for(let color=0;color<3;color++){
  const x=GATE_X[color];
  place(panel(74,82,16,3,gold),x,94,2);
  place(panel(67,77,14,2,mat(0x211026,.2,.3)),x,93,7);
  const pane=place(panel(63,72,13,1,mat(COLORS[color],.15,.12,{transparent:true,opacity:.08,depthWrite:false})),x,93,27);reservoirGlass.push(pane);
  const crest=place(new THREE.Mesh(new THREE.OctahedronGeometry(7),mat(COLORS[color],.4,.14)),x,52,25);crest.scale.y=1.15;
  const pips=[];for(let n=0;n<3;n++)pips.push(place(new THREE.Mesh(new THREE.SphereGeometry(2.7,12,8),mat(0x503c3c,.5,.25)),x+(n-1)*11,144,22));chargePips.push(pips);
  const blade=place(panel(61,6,2,3,gold.clone()),x,134,23);shutters.push(blade);
  place(new THREE.Mesh(new THREE.SphereGeometry(4.3,14,10),cream),x-30.5,134,26);
}
// The main feed sits below the bonus jars, leaving all three reserves visible.
place(panel(44,9,4,3,darkGold),180,155,10);
const pegPositions=[];for(let row=0;row<6;row++)for(let col=0;col<7;col++){
  const x=61+col*39+(row%2?19.5:0),y=179+row*42;if(x>313)continue;pegPositions.push({x,y});
}
const pegGeo=new THREE.SphereGeometry(5.4,16,12),pegs=new THREE.InstancedMesh(pegGeo,mat(0xffffff,.65,.25),pegPositions.length),dummy=new THREE.Object3D();scene.add(pegs);
const pegFlashes=new Float32Array(pegPositions.length),goldColor=new THREE.Color(0xd6a34f),whiteColor=new THREE.Color(0xfff0c6);
pegPositions.forEach((p,i)=>{dummy.position.set(p.x,HEIGHT-p.y,12);dummy.scale.set(1,1,.65);dummy.updateMatrix();pegs.setMatrixAt(i,dummy.matrix);pegs.setColorAt(i,goldColor);});
const ballsMesh=new THREE.InstancedMesh(new THREE.SphereGeometry(7.4,22,16),mat(0xffffff,.28,.16),MAX_BALLS);ballsMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);scene.add(ballsMesh);
const basket=new THREE.Group();scene.add(basket);
const cupShape=new THREE.Shape();cupShape.moveTo(-46,18);cupShape.lineTo(-43,-17);cupShape.quadraticCurveTo(-42,-25,-33,-25);cupShape.lineTo(33,-25);cupShape.quadraticCurveTo(42,-25,43,-17);cupShape.lineTo(46,18);cupShape.lineTo(38,18);cupShape.lineTo(35,-14);cupShape.quadraticCurveTo(35,-17,30,-17);cupShape.lineTo(-30,-17);cupShape.quadraticCurveTo(-35,-17,-35,-14);cupShape.lineTo(-38,18);cupShape.closePath();const fallbackCup=new THREE.Mesh(new THREE.ExtrudeGeometry(cupShape,{depth:7,bevelEnabled:true,bevelSize:1.5,bevelThickness:1.5,bevelSegments:3}),gold);basket.add(fallbackCup);
const glass=panel(77,29,8,2,mat(0x8e4f95,.3,.2,{transparent:true,opacity:.3,depthWrite:false}));glass.position.set(0,-1,3);basket.add(glass);
const basketTexture=textures.load('./assets/cascade/collector.webp',t=>{fallbackCup.visible=false;glass.visible=false;basketArt.scale.y=115*t.image.height/t.image.width/77;});basketTexture.colorSpace=THREE.SRGBColorSpace;
const basketArt=new THREE.Mesh(new THREE.PlaneGeometry(115,77),new THREE.MeshBasicMaterial({map:basketTexture,transparent:true,alphaTest:.01,depthWrite:false,toneMapped:false}));basketArt.position.set(0,-3,12);basket.add(basketArt);
const slotOrbs=[];for(let i=0;i<3;i++){const o=new THREE.Mesh(new THREE.SphereGeometry(6,16,12),mat(COLORS[0],.25,.2));o.position.set((i-1)*17,7,17);o.visible=false;basket.add(o);slotOrbs.push(o);}
const fxMesh=new THREE.InstancedMesh(new THREE.OctahedronGeometry(2.4),new THREE.MeshBasicMaterial({color:0xffdf8f}),72);scene.add(fxMesh);const fx=Array.from({length:72},()=>({life:0,x:0,y:0,vx:0,vy:0}));let fxIndex=0;
function sparks(x,y,n=5){if(reduced)n=2;for(let i=0;i<n;i++){const p=fx[fxIndex++%fx.length],a=Math.random()*Math.PI*2;p.x=x;p.y=y;p.vx=Math.cos(a)*(20+Math.random()*50);p.vy=Math.sin(a)*(20+Math.random()*50)-30;p.life=.25+Math.random()*.35;}}

// All marble/pin contacts use Matter's fixed timestep, not hand-picked outcomes.
const engine=Engine.create({enableSleeping:false,positionIterations:8,velocityIterations:8});engine.gravity.y=1.05;
const live=new Map(),bodies=[];
for(const x of [37,323])bodies.push(Bodies.rectangle(x,HEIGHT/2,14,HEIGHT+100,{isStatic:true,restitution:.8}));
const gateBodies=GATE_X.map(x=>Bodies.rectangle(x,134,61,6,{isStatic:true,restitution:.65,friction:.015}));bodies.push(...gateBodies);
for(const x of GATE_X)for(const side of [-1,1])bodies.push(Bodies.rectangle(x+side*33,94,4,79,{isStatic:true,restitution:.6,friction:.02}));
pegPositions.forEach((p,i)=>{const b=Bodies.circle(p.x,p.y,5.4,{isStatic:true,restitution:.75,friction:.015});b.plugin.peg=i;bodies.push(b);});Composite.add(engine.world,bodies);
function addMarble(id,snapshot){const p=marblePlan(state.round.seed,id),b=Bodies.circle(snapshot?.x??p.x,snapshot?.y??p.y,7.4,{restitution:.72,friction:.008,frictionAir:.0015,density:.001});b.plugin.marble=id;Body.setVelocity(b,{x:snapshot?.vx??p.vx,y:snapshot?.vy??.4});if(snapshot){Body.setAngle(b,snapshot.angle||0);Body.setAngularVelocity(b,snapshot.av||0);}live.set(id,b);Composite.add(engine.world,b);}
function syncShutters(){const r=state.round;gateBodies.forEach((b,i)=>{const g=r?.gates[i],progress=g?.openedAt==null?0:Math.min(1,(r.tick-g.openedAt)/30),angle=progress*1.12,x=GATE_X[i]-30.5+Math.cos(angle)*30.5,y=134+Math.sin(angle)*30.5;Body.setPosition(b,{x,y});Body.setAngle(b,angle);shutters[i].position.set(x,HEIGHT-y,23);shutters[i].rotation.z=-angle;});}
function restore(){for(const b of live.values())Composite.remove(engine.world,b);live.clear();Engine.clear(engine);catcher=state.round?.catcher??180;syncShutters();if(state.round?.phase==='playing')for(const s of state.round.balls||[])if(!state.round.resolved.includes(s.id))addMarble(s.id,s);renderUI();}
function checkpoint(){if(state.round?.phase==='playing'){state.round.catcher=catcher;state.round.balls=[...live.entries()].map(([id,b])=>({id,x:b.position.x,y:b.position.y,vx:b.velocity.x,vy:b.velocity.y,angle:b.angle,av:b.angularVelocity}));}write();lastSave=clock;}
let audio,lastTone=-10;
function unlockAudio(){try{audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume();}catch{}}
function tone(freq,duration=.08,volume=.07,delay=0){if(!audio||!state.settings.sfx)return;const t=audio.currentTime+delay,o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.setValueAtTime(freq,t);o.frequency.exponentialRampToValueAtTime(freq*.8,t+duration);g.gain.setValueAtTime(volume*(state.settings.sfx===1?.4:1),t);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g).connect(audio.destination);o.start(t);o.stop(t+duration+.01);}
function haptic(ms){if(state.settings.vib)navigator.vibrate?.(state.settings.vib===1?Math.ceil(ms/2):ms);}
Events.on(engine,'collisionStart',event=>{for(const pair of event.pairs){const a=pair.bodyA,b=pair.bodyB,peg=a.plugin.peg!==undefined?a:b,marble=peg===a?b:a;if(peg.plugin.peg===undefined||marble.plugin.marble===undefined)continue;pegFlashes[peg.plugin.peg]=1;if(clock-lastTone>.055){lastTone=clock;const p=peg.position;sparks(p.x,p.y,2);tone([392,440,523,587,659][peg.plugin.peg%5],.09,.025);}}});
function renderUI(){
  const r=state.round,p=r?.phase||'idle';$('balance').textContent=fmt(state.balance);$('gain-label').textContent=r?.practice?'PONTOS':'COLHIDO';$('gain').textContent=fmt(r?(r.practice?r.points:payout(r)):0);$('remaining').textContent=r?r.total-r.resolved.length:TOTAL;
  $('bet-value').textContent=fmt(state.bet);$('play-value').textContent=fmt(state.bet)+' MOEDAS';$('play').disabled=state.balance<state.bet;$('bet-less').disabled=state.bet===BETS[0];$('bet-more').disabled=state.bet===BETS.at(-1);
  $('idle-controls').hidden=p!=='idle';$('playing-controls').hidden=p!=='playing';$('result-controls').hidden=p!=='paid';
  $('touch-hint').hidden=p==='paid';$('progress').style.width=(r?(r.total-r.resolved.length)/r.total*100:100)+'%';
  $('gate-status').textContent=`${r?.gates.filter(g=>g.openedAt!==null).length||0} / 3 AVALANCHES`;
  document.querySelectorAll('.combo-slots i').forEach((o,i)=>{const filled=i<(r?.comboCount||0);o.classList.toggle('filled',filled);o.style.background=filled?CSS_COLORS[r.comboColor]:'';});
  slotOrbs.forEach((o,i)=>{o.visible=i<(r?.comboCount||0);if(o.visible)o.material.color.setHex(COLORS[r.comboColor]);});
  if(p==='paid'){const prize=payout(r),net=prize-r.bet;$('result-title').textContent=r.practice?'Ensaio completo!':prize?'Recebeu!':'Fim da rodada.';$('result-amount').textContent=r.practice?r.points+' PTS':'+'+fmt(prize);$('result-feedback').textContent=r.practice?`${r.caught} bolinhas · ${r.combos} trincas · sem gastar moedas`:`Aposta ${fmt(r.bet)} · ${r.caught} bolinhas · rodada ${net>=0?'+':''}${fmt(net)}`;$('again').textContent=r.practice?'ENSAIAR DE NOVO':'DE NOVO';}
}
function start(practice=false){state=read();if(state.round?.phase==='playing')return;state=begin(state,crypto.randomUUID(),crypto.getRandomValues(new Uint32Array(1))[0],practice);if(state.round?.phase!=='playing')return;for(const b of live.values())Composite.remove(engine.world,b);live.clear();Engine.clear(engine);catcher=180;acc=0;checkpoint();unlockAudio();tone(330,.15,.09);renderUI();}
function resolve(id,caught){const b=live.get(id);if(!b)return;Composite.remove(engine.world,b);live.delete(id);const previous=state.round,combos=previous.combos;state=resolveBall(state,id,caught);
  if(caught){catchPulse=1;sparks(b.position.x,HEIGHT-48,7);haptic(5);tone(520+(state.round.comboCount||3)*100,.08,.045);if(state.round.combos>combos){$('combo-pop').textContent='TRINCA! +3 PTS';$('combo-pop').classList.remove('show');void $('combo-pop').offsetWidth;$('combo-pop').classList.add('show');comboUntil=clock+.8;sparks(catcher,HEIGHT-48,22);tone(523,.22,.12);tone(659,.25,.11,.07);tone(784,.35,.1,.14);haptic(22);}}
  const opened=state.round.gates.findIndex((g,i)=>g.openedAt!==null&&previous.gates[i].openedAt===null);
  if(opened>=0){$('combo-pop').textContent='AVALANCHE! +12';$('combo-pop').classList.remove('show');void $('combo-pop').offsetWidth;$('combo-pop').classList.add('show');comboUntil=clock+1.4;avalancheUntil=clock+1.3;sparks(GATE_X[opened],135,24);tone(196,.2,.09);tone(392,.35,.08,.12);haptic(30);}
  checkpoint();renderUI();
}
function tick(){const r=state.round;r.tick++;syncShutters();if(r.spawned<TOTAL&&r.tick%7===0){addMarble(r.spawned);r.spawned++;}
  r.gates.forEach((g,color)=>{if(g.openedAt===null)return;const age=r.tick-g.openedAt;while(g.spawned<BONUS_PER_GATE&&age>=g.spawned*2){addMarble(TOTAL+color*BONUS_PER_GATE+(BONUS_PER_GATE-1-g.spawned));g.spawned++;}});Engine.update(engine,1000/60);
  for(const[id,b]of [...live.entries()]){if(b.position.y>HEIGHT-57&&b.position.y<HEIGHT-17&&Math.abs(b.position.x-catcher)<41)resolve(id,true);else if(b.position.y>HEIGHT+16||b.position.x<-35||b.position.x>WIDTH+35)resolve(id,false);}
  if(state.round.tick>=state.round.deadline){for(const id of [...live.keys()])resolve(id,false);for(const id of availableIds(state.round))if(!state.round.resolved.includes(id))state=resolveBall(state,id,false);}
  if(state.round.resolved.length===state.round.total){state=settle(state);checkpoint();renderUI();tone(523,.23,.09);tone(784,.35,.08,.12);}
}
function release(e,save=true){if(!pointer||e&&e.pointerId!==pointer.id)return;const p=pointer;pointer=null;try{canvas.releasePointerCapture(p.id);}catch{}$('touch-hint').classList.remove('moving');if(save)checkpoint();}
canvas.addEventListener('pointerdown',e=>{if(paused||pointer||!e.isPrimary||e.button!==0||state.round?.phase==='paid')return;e.preventDefault();unlockAudio();pointer={id:e.pointerId,x:e.clientX};canvas.setPointerCapture(e.pointerId);$('touch-hint').classList.add('moving');});
canvas.addEventListener('pointermove',e=>{if(!pointer||e.pointerId!==pointer.id)return;e.preventDefault();const scale=canvas.getBoundingClientRect().width/(camera.right-camera.left);catcher=Math.max(CATCH_MIN,Math.min(CATCH_MAX,catcher+(e.clientX-pointer.x)/scale));pointer.x=e.clientX;});
for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,release);
document.addEventListener('visibilitychange',()=>{release();last=0;checkpoint();});window.addEventListener('blur',()=>release());
$('play').onclick=()=>start(false);$('practice').onclick=()=>start(true);$('again').onclick=()=>start(!!state.round?.practice);
$('back').onclick=()=>{if(state.round?.phase==='playing')return;state.round=null;write();restore();};
for(const[id,delta]of[['bet-less',-1],['bet-more',1]])$(id).onclick=()=>{if(state.round?.phase==='playing')return;state.bet=BETS[Math.max(0,Math.min(BETS.length-1,BETS.indexOf(state.bet)+delta))];write();renderUI();};
$('reset-demo').onclick=()=>{if(state.round?.phase==='playing')return;const settings=state.settings;state={...fresh(),settings};write();restore();};
function help(){release();paused=true;$('how-to').showModal();}$('help').onclick=help;for(const id of ['close-help','got-it'])$(id).onclick=()=>$('how-to').close();$('how-to').addEventListener('close',()=>{paused=false;last=0;});
mountMenu(state.settings,settings=>{state.settings=settings;write();unlockAudio();},help,open=>{paused=open;release();last=0;},{screen:'Fortune Cascata'});
window.addEventListener('storage',e=>{if(e.key!==KEY)return;release(null,false);state=read();restore();last=0;});
function resize(){const w=arena.clientWidth,h=arena.clientHeight,half=Math.max(190,(HEIGHT/2+5)*w/h);camera.left=-half;camera.right=half;camera.top=half*h/w;camera.bottom=-half*h/w;camera.updateProjectionMatrix();renderer.setSize(w,h,false);}
new ResizeObserver(resize).observe(arena);resize();restore();
function frame(now){requestAnimationFrame(frame);const dt=last?Math.min((now-last)/1000,.09):0;last=now;if(paused||document.hidden){renderer.render(scene,camera);return;}clock+=dt;
  if(state.round?.phase==='playing'){acc+=dt;while(acc>=1/60&&state.round.phase==='playing'){tick();acc-=1/60;}if(clock-lastSave>.4)checkpoint();}
  const r=state.round,roundSeed=r?.seed??12345;for(let i=0;i<MAX_BALLS;i++){const b=live.get(i),resolved=r?.resolved.includes(i);let x=0,y=0,scale=1;
    if(b){x=b.position.x;y=b.position.y;}else if(i>=TOTAL){const color=Math.floor((i-TOTAL)/BONUS_PER_GATE),local=(i-TOTAL)%BONUS_PER_GATE,g=r?.gates[color];if(!g||local<BONUS_PER_GATE-g.spawned){const p=marblePlan(roundSeed,i);x=p.x;y=p.y;}else scale=0;
    }else if((!r||i>=r.spawned)&&i<(r?.spawned||0)+4){x=159+(i%4)*14;y=155;scale=.82;}else scale=0;
    if(resolved)scale=0;dummy.position.set(x,HEIGHT-y,22);dummy.scale.setScalar(scale);dummy.rotation.z=b?.angle||0;dummy.updateMatrix();ballsMesh.setMatrixAt(i,dummy.matrix);ballsMesh.setColorAt(i,new THREE.Color(COLORS[marblePlan(roundSeed,i).color]));}
  ballsMesh.instanceMatrix.needsUpdate=true;ballsMesh.instanceColor.needsUpdate=true;
  pegPositions.forEach((p,i)=>{pegFlashes[i]=Math.max(0,pegFlashes[i]-dt*5);pegs.setColorAt(i,goldColor.clone().lerp(whiteColor,pegFlashes[i]));});pegs.instanceColor.needsUpdate=true;
  catchPulse=Math.max(0,catchPulse-dt*6);basket.position.set(catcher,HEIGHT-(HEIGHT-44)-catchPulse*3,22);basket.scale.set(1+catchPulse*.04,1-catchPulse*.08,1);
  chargePips.forEach((row,color)=>{const g=r?.gates[color],charge=r?.comboColor===color?r.comboCount:0;row.forEach((o,n)=>{const on=g?.openedAt!=null||n<charge;o.material.color.setHex(on?COLORS[color]:0x503c3c);o.material.emissive.setHex(on?COLORS[color]:0);o.material.emissiveIntensity=on?.6:0;});shutters[color].material.emissive.setHex(COLORS[color]);shutters[color].material.emissiveIntensity=g?.openedAt!=null?.23:charge*.13;reservoirGlass[color].material.opacity=.06+(charge*.025);});
  $('playing-copy').textContent=clock<avalancheUntil?'Comporta aberta! Mais bolinhas!':'Arraste para pegar as bolinhas.';
  for(let i=0;i<fx.length;i++){const p=fx[i];p.life-=dt;if(p.life>0){p.vy+=120*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;dummy.position.set(p.x,HEIGHT-p.y,30);dummy.scale.setScalar(p.life*1.5);}else dummy.scale.setScalar(0);dummy.updateMatrix();fxMesh.setMatrixAt(i,dummy.matrix);}fxMesh.instanceMatrix.needsUpdate=true;
  if(clock>comboUntil)$('combo-pop').classList.remove('show');renderer.render(scene,camera);
}
requestAnimationFrame(frame);
window.cascade={snapshot:()=>structuredClone({state,catcher,balls:[...live.entries()].map(([id,b])=>({id,x:b.position.x,y:b.position.y,color:marblePlan(state.round.seed,id).color})),pointer:pointer?.id??null,paused}),project:(x,y)=>{const p=new THREE.Vector3(x,HEIGHT-y,22).project(camera),b=canvas.getBoundingClientRect();return{x:b.left+(p.x+1)*b.width/2,y:b.top+(1-p.y)*b.height/2};}};
