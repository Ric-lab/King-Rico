import * as THREE from 'three';
import Matter from 'matter-js';
import {mountMenu} from './menu-entry.js';
import {createMarbles} from './marble-renderer.js';
import {TOTAL,WIDTH,HEIGHT,RADIUS,BONUS_PER_GATE,MAX_BALLS,GATE_X,GATE_Y,availableIds,marblePlan,begin,resolveBall,payout,settle} from './cascade-state.mjs';
const {Engine,Bodies,Body,Composite,Events}=Matter;
const $=id=>document.getElementById(id),fmt=n=>new Intl.NumberFormat('pt-BR').format(n);
const KEY='king-rico-cascade-demo-v4',COLORS=[0xffb125,0x9251ee,0x04caa3],CSS_COLORS=['#ffbf45','#b182ff','#42e6c0'],BETS=[10,25,50,100],CATCH_MIN=83,CATCH_MAX=277;
const fresh=()=>({version:2,balance:1000,bet:25,settings:{sfx:1,vib:1},round:null});
let memory=fresh();
function read(){try{const s=JSON.parse(localStorage.getItem(KEY));if(s?.version===2&&Number.isFinite(s.balance))return s;}catch{}return memory;}
function write(){memory=state;try{localStorage.setItem(KEY,JSON.stringify(state));}catch{}}
let state=read(),catcher=state.round?.catcher??WIDTH/2,paused=false,pointer=null,clock=0,last=0,acc=0,lastSave=0,catchPulse=0,comboUntil=0,avalancheUntil=0,perfectUntil=0,basketX=catcher,launchAt=0;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const canvas=$('game'),arena=$('arena');
let renderer;
try{renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});}catch{$('compatibility').hidden=false;throw Error('WebGL indisponível');}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.setClearColor(0,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.84;
const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-190,190,270,-270,1,1800);camera.position.set(WIDTH/2,HEIGHT-270,900);camera.lookAt(WIDTH/2,HEIGHT-270,0);
scene.add(new THREE.HemisphereLight(0xfff4e9,0x281536,.75));
const light=new THREE.DirectionalLight(0xfff2da,2.1);light.position.set(-100,700,500);scene.add(light);
const rim=new THREE.DirectionalLight(0xdfd2ff,.9);rim.position.set(500,200,150);scene.add(rim);
const mat=(color,metalness=.2,roughness=.35,extra={})=>new THREE.MeshStandardMaterial({color,metalness,roughness,...extra});
const gold=mat(0xffc52d,.42,.25),darkGold=mat(0x8d582b,.6,.33),plum=mat(0x461d4e,.1,.5),cream=mat(0xffe3a4,.45,.26);
const envCanvas=document.createElement('canvas');envCanvas.width=512;envCanvas.height=256;const ec=envCanvas.getContext('2d'),eg=ec.createLinearGradient(0,0,0,256);eg.addColorStop(0,'#fff2d6');eg.addColorStop(.45,'#8d6c9b');eg.addColorStop(.55,'#2e163e');eg.addColorStop(1,'#d7a969');ec.fillStyle=eg;ec.fillRect(0,0,512,256);ec.fillStyle='#fff9de';ec.fillRect(40,20,95,85);ec.fillRect(340,35,22,110);const env=new THREE.CanvasTexture(envCanvas);env.mapping=THREE.EquirectangularReflectionMapping;env.colorSpace=THREE.SRGBColorSpace;const pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromEquirectangular(env).texture;scene.environmentIntensity=.7;env.dispose();pmrem.dispose();
function place(o,x,y,z,parent=scene){o.position.set(x,HEIGHT-y,z);parent.add(o);return o;}
function panel(w,h,r,d,material){const s=new THREE.Shape(),x=-w/2,y=-h/2;s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return new THREE.Mesh(new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:true,bevelSize:1.6,bevelThickness:1.5,bevelSegments:3,steps:1}),material);}
// Existing cabinet art frames the live table; no new generated artwork is needed.
const textures=new THREE.TextureLoader();
const cabinetTexture=textures.load('./assets/cascade/cabinet-v7.webp');cabinetTexture.colorSpace=THREE.SRGBColorSpace;
const cabinetMaterial=new THREE.MeshBasicMaterial({map:cabinetTexture,transparent:true,alphaTest:.02,depthWrite:false,toneMapped:false});
place(new THREE.Mesh(new THREE.PlaneGeometry(360,540),cabinetMaterial),180,270,-18);
const ramps=[{x1:53,y1:260,x2:122,y2:277},{x1:307,y1:315,x2:238,y2:332},{x1:53,y1:365,x2:125,y2:384}];
for(const r of ramps){const curve=new THREE.LineCurve3(new THREE.Vector3(r.x1,HEIGHT-r.y1,11),new THREE.Vector3(r.x2,HEIGHT-r.y2,11));scene.add(new THREE.Mesh(new THREE.TubeGeometry(curve,1,3.2,12,false),gold));}
const shutters=[],chargePips=[],reservoirGlass=[];
for(let color=0;color<3;color++){
  const x=GATE_X[color];
  const pane=place(panel(64,94,13,1,mat(COLORS[color],.05,.15,{transparent:true,opacity:.025,depthWrite:false})),x,117,37);reservoirGlass.push(pane);
  const pips=[];for(let n=0;n<3;n++)pips.push(place(new THREE.Mesh(new THREE.SphereGeometry(4.3,16,10),mat(0x351129,.35,.3)),x+(n-1)*23.5,190,25));chargePips.push(pips);
  const blade=place(panel(62,6,2,3,gold.clone()),x,GATE_Y,30);shutters.push(blade);
  place(new THREE.Mesh(new THREE.SphereGeometry(3.8,14,10),cream),x-31,GATE_Y,33);
}
// Lamp centers are measured from the actual raster art; the halos are live.
const glowCanvas=document.createElement('canvas');glowCanvas.width=glowCanvas.height=64;const gx=glowCanvas.getContext('2d'),gg=gx.createRadialGradient(32,32,0,32,32,32);gg.addColorStop(0,'rgba(255,255,235,1)');gg.addColorStop(.2,'rgba(255,232,137,.9)');gg.addColorStop(.52,'rgba(255,178,39,.32)');gg.addColorStop(1,'rgba(255,150,30,0)');gx.fillStyle=gg;gx.fillRect(0,0,64,64);
const glowTexture=new THREE.CanvasTexture(glowCanvas),lamps=[];
for(const x of [25.3,334.3])for(const y of [144.8,189.8,234,278.4,322.6,366.9,409.4]){
 const m=new THREE.SpriteMaterial({map:glowTexture,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false,opacity:0});const lamp=place(new THREE.Sprite(m),x,y,48);lamp.scale.set(31,31,1);lamps.push({lamp,y});
}
// The main feed sits below the bonus jars, leaving all three reserves visible.
const feedLip=place(panel(36,5,2,3,darkGold),180,219,8);
const pegPositions=[];for(let row=0;row<4;row++)for(let col=0;col<4;col++){
  const x=74+col*64+(row%2?32:0),y=236+row*48;
  // Leave a full marble diameter between pegs and the ends of each ramp.
  // Measuring only vertical distance left small pockets that could trap balls.
  const nearRamp=ramps.some(r=>{const dx=r.x2-r.x1,dy=r.y2-r.y1,t=Math.max(0,Math.min(1,((x-r.x1)*dx+(y-r.y1)*dy)/(dx*dx+dy*dy)));return Math.hypot(x-r.x1-t*dx,y-r.y1-t*dy)<38;});
  if(x>303||nearRamp)continue;pegPositions.push({x,y});
}
const pegGeo=new THREE.SphereGeometry(4.4,16,12),pegs=new THREE.InstancedMesh(pegGeo,mat(0xffffff,.55,.32),pegPositions.length),dummy=new THREE.Object3D();scene.add(pegs);
const pegFlashes=new Float32Array(pegPositions.length),goldColor=new THREE.Color(0xd6a34f),whiteColor=new THREE.Color(0xfff0c6);
pegPositions.forEach((p,i)=>{dummy.position.set(p.x,HEIGHT-p.y,12);dummy.scale.set(1,1,.65);dummy.updateMatrix();pegs.setMatrixAt(i,dummy.matrix);pegs.setColorAt(i,goldColor);});
const marbles=createMarbles(renderer,MAX_BALLS,RADIUS),ballsMesh=marbles.mesh;scene.add(marbles.shadows,ballsMesh);
const marbleColors=COLORS.map(c=>new THREE.Color(c));let marbleColorSeed=null;
const basket=new THREE.Group();scene.add(basket);
const cupShape=new THREE.Shape();cupShape.moveTo(-48,12);cupShape.quadraticCurveTo(-44,-28,0,-29);cupShape.quadraticCurveTo(44,-28,48,12);cupShape.lineTo(40,12);cupShape.quadraticCurveTo(34,-18,0,-20);cupShape.quadraticCurveTo(-34,-18,-40,12);cupShape.closePath();const fallbackCup=new THREE.Mesh(new THREE.ExtrudeGeometry(cupShape,{depth:7,bevelEnabled:true,bevelSize:2,bevelThickness:2,bevelSegments:4}),gold);basket.add(fallbackCup);
const inner=new THREE.Mesh(new THREE.CircleGeometry(42,48),mat(0x39094f,.08,.55));inner.scale.y=.28;inner.position.set(0,9,7);basket.add(inner);
const structuralRim=new THREE.Mesh(new THREE.TorusGeometry(45,2.4,12,64),gold);structuralRim.scale.y=.29;structuralRim.position.set(0,9,24);basket.add(structuralRim);
const redEnamel=mat(0xc70820,.25,.2,{emissive:0x4b0009,emissiveIntensity:.12});
const faceShape=new THREE.Shape();faceShape.moveTo(-40,-5);faceShape.quadraticCurveTo(-32,-25,0,-26);faceShape.quadraticCurveTo(32,-25,40,-5);faceShape.quadraticCurveTo(0,-12,-40,-5);const front=new THREE.Mesh(new THREE.ExtrudeGeometry(faceShape,{depth:5,bevelEnabled:true,bevelSize:1.8,bevelThickness:2,bevelSegments:4}),redEnamel);front.position.z=15;basket.add(front);
const coinTexture=textures.load('./assets/prize-coin.webp');coinTexture.colorSpace=THREE.SRGBColorSpace;
const badge=new THREE.Mesh(new THREE.PlaneGeometry(23,23),new THREE.MeshBasicMaterial({map:coinTexture,transparent:true,depthWrite:false,toneMapped:false}));badge.position.set(0,-15,24);basket.add(badge);
const catchRim=new THREE.Mesh(new THREE.TorusGeometry(43,1.1,8,64),new THREE.MeshBasicMaterial({color:0xffdb86,transparent:true,opacity:.45}));catchRim.scale.y=.18;catchRim.position.set(0,15,27);basket.add(catchRim);
const centerMark=new THREE.Mesh(new THREE.OctahedronGeometry(4),cream);centerMark.position.set(0,15,29);basket.add(centerMark);
const slotOrbs=[];for(let i=0;i<3;i++){const o=new THREE.Mesh(new THREE.SphereGeometry(8,24,18),marbles.material(COLORS[0]));o.position.set((i-1)*21,1,22);o.visible=false;basket.add(o);slotOrbs.push(o);}
const fxMesh=new THREE.InstancedMesh(new THREE.OctahedronGeometry(2.4),new THREE.MeshBasicMaterial({color:0xffdf8f}),72);scene.add(fxMesh);const fx=Array.from({length:72},()=>({life:0,x:0,y:0,vx:0,vy:0}));let fxIndex=0;
function sparks(x,y,n=5){if(reduced)n=2;for(let i=0;i<n;i++){const p=fx[fxIndex++%fx.length],a=Math.random()*Math.PI*2;p.x=x;p.y=y;p.vx=Math.cos(a)*(20+Math.random()*50);p.vy=Math.sin(a)*(20+Math.random()*50)-30;p.life=.25+Math.random()*.35;}}

// All marble/pin contacts use Matter's fixed timestep, not hand-picked outcomes.
const engine=Engine.create({enableSleeping:false,positionIterations:8,velocityIterations:8});engine.gravity.y=1.05;
const live=new Map(),bodies=[];
for(const x of [37,323])bodies.push(Bodies.rectangle(x,HEIGHT/2,14,HEIGHT+100,{isStatic:true,restitution:.8}));
const gateBodies=GATE_X.map(x=>Bodies.rectangle(x,GATE_Y,62,6,{isStatic:true,restitution:.6,friction:.015}));bodies.push(...gateBodies);
for(const x of GATE_X)for(const side of [-1,1])bodies.push(Bodies.rectangle(x+side*35,117,4,105,{isStatic:true,restitution:.6,friction:.02}));
for(const r of ramps){const angle=Math.atan2(r.y2-r.y1,r.x2-r.x1),length=Math.hypot(r.x2-r.x1,r.y2-r.y1);bodies.push(Bodies.rectangle((r.x1+r.x2)/2,(r.y1+r.y2)/2,length,6.4,{isStatic:true,angle,restitution:.45,friction:.008}));for(const [x,y]of[[r.x1,r.y1],[r.x2,r.y2]])bodies.push(Bodies.circle(x,y,3.2,{isStatic:true,restitution:.45,friction:.008}));}
pegPositions.forEach((p,i)=>{const b=Bodies.circle(p.x,p.y,4.4,{isStatic:true,restitution:.65,friction:.015});b.plugin.peg=i;bodies.push(b);});Composite.add(engine.world,bodies);
function addMarble(id,snapshot){const p=marblePlan(state.round.seed,id),b=Bodies.circle(snapshot?.x??p.x,snapshot?.y??p.y,RADIUS,{restitution:.61,friction:.008,frictionAir:.002,density:.001});b.plugin.marble=id;Body.setVelocity(b,{x:snapshot?.vx??p.vx,y:snapshot?.vy??.4});if(snapshot){Body.setAngle(b,snapshot.angle||0);Body.setAngularVelocity(b,snapshot.av||0);}live.set(id,b);Composite.add(engine.world,b);}
function syncShutters(){const r=state.round;gateBodies.forEach((b,i)=>{const g=r?.gates[i],progress=g?.openedAt==null?0:Math.min(1,(r.tick-g.openedAt)/30),angle=progress*1.12,x=GATE_X[i]-31+Math.cos(angle)*31,y=GATE_Y+Math.sin(angle)*31;Body.setPosition(b,{x,y});Body.setAngle(b,angle);shutters[i].position.set(x,HEIGHT-y,30);shutters[i].rotation.z=-angle;});}
function restore(){for(const b of live.values())Composite.remove(engine.world,b);live.clear();Engine.clear(engine);catcher=state.round?.catcher??180;syncShutters();if(state.round?.phase==='playing')for(const s of state.round.balls||[])if(!state.round.resolved.includes(s.id))addMarble(s.id,s);renderUI();}
function checkpoint(){if(state.round?.phase==='playing'){state.round.catcher=catcher;state.round.balls=[...live.entries()].map(([id,b])=>({id,x:b.position.x,y:b.position.y,vx:b.velocity.x,vy:b.velocity.y,angle:b.angle,av:b.angularVelocity}));}write();lastSave=clock;}
let audio,lastTone=-10;
function unlockAudio(){try{audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume();}catch{}}
function tone(freq,duration=.08,volume=.07,delay=0){if(!audio||!state.settings.sfx)return;const t=audio.currentTime+delay,o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.setValueAtTime(freq,t);o.frequency.exponentialRampToValueAtTime(freq*.8,t+duration);g.gain.setValueAtTime(volume*(state.settings.sfx===1?.4:1),t);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g).connect(audio.destination);o.start(t);o.stop(t+duration+.01);}
function haptic(ms){if(state.settings.vib)navigator.vibrate?.(state.settings.vib===1?Math.ceil(ms/2):ms);}
Events.on(engine,'collisionStart',event=>{for(const pair of event.pairs){const a=pair.bodyA,b=pair.bodyB,peg=a.plugin.peg!==undefined?a:b,marble=peg===a?b:a;if(peg.plugin.peg===undefined||marble.plugin.marble===undefined)continue;pegFlashes[peg.plugin.peg]=1;if(clock-lastTone>.055){lastTone=clock;const p=peg.position;sparks(p.x,p.y,2);tone([392,440,523,587,659][peg.plugin.peg%5],.09,.025);}}});
function renderUI(){
  const r=state.round,p=r?.phase||'idle';$('balance').textContent=fmt(state.balance);$('gain-label').textContent=r?.practice?'PONTOS':'COLHIDO';$('gain').textContent=fmt(r?(r.practice?r.points:payout(r)):0);$('remaining').textContent=r?r.total-r.resolved.length:TOTAL;
  $('bet-value').textContent=fmt(state.bet);$('play-value').textContent=fmt(state.bet)+' MOEDAS';$('play').disabled=state.balance<state.bet;$('bet-less').disabled=p==='playing'||state.bet===BETS[0];$('bet-more').disabled=p==='playing'||state.bet===BETS.at(-1);$('practice').disabled=p==='playing';
  $('idle-controls').hidden=p!=='idle';$('playing-controls').hidden=p!=='playing';$('result-controls').hidden=p!=='paid';
  $('touch-hint').hidden=p==='paid';$('progress').style.width=(r?(r.total-r.resolved.length)/r.total*100:100)+'%';
  $('gate-status').textContent=`${r?.gates.filter(g=>g.openedAt!==null).length||0} / 3 AVALANCHES`;
  const colorName=['douradas','roxas','verdes'][r?.comboColor];
  $('combo-target').textContent=r?.comboCount?`${r.comboCount} de 3 ${colorName}`:'3 iguais liberam a cascata';
  $('gain-multiplier').textContent=r?('×'+(r.points/25).toLocaleString('pt-BR',{maximumFractionDigits:2})):'CENTRO ×2';
  arena.classList.toggle('running',p==='playing');
  document.querySelectorAll('.combo-slots i').forEach((o,i)=>{const filled=i<(r?.comboCount||0);o.classList.toggle('filled',filled);o.style.background=filled?CSS_COLORS[r.comboColor]:'';});
  slotOrbs.forEach((o,i)=>{o.visible=i<(r?.comboCount||0);if(o.visible)o.material.color.setHex(COLORS[r.comboColor]);});
  if(p==='paid'){const prize=payout(r),net=prize-r.bet;$('result-title').textContent=r.practice?'Ensaio completo':net>0?'Boa colheita!':'Rodada concluída';$('result-amount').textContent=r.practice?r.points+' PTS':'+'+fmt(prize);$('result-feedback').textContent=r.practice?`${r.caught} bolinhas · ${r.perfect||0} no centro · sem gastar moedas`:`${r.caught} bolinhas · ${r.perfect||0} no centro · ${r.combos} trincas`;$('result-net').textContent=r.practice?'Treino livre, sem moedas':`Aposta ${fmt(r.bet)} · resultado ${net>=0?'+':''}${fmt(net)}`;$('again').textContent=r.practice?'ENSAIAR DE NOVO':'JOGAR DE NOVO';if(!$('result-dialog').open)$('result-dialog').showModal();}
}
function start(practice=false){state=read();if(state.round?.phase==='playing')return;state=begin(state,crypto.randomUUID(),crypto.getRandomValues(new Uint32Array(1))[0],practice);if(state.round?.phase!=='playing')return;$('result-dialog').close();for(const b of live.values())Composite.remove(engine.world,b);live.clear();Engine.clear(engine);catcher=basketX=180;acc=0;launchAt=clock+.28;document.querySelector('.app').classList.add('launching');setTimeout(()=>document.querySelector('.app').classList.remove('launching'),520);checkpoint();unlockAudio();tone(330,.15,.09);renderUI();}
function resolve(id,caught){const b=live.get(id);if(!b)return;Composite.remove(engine.world,b);live.delete(id);const previous=state.round,combos=previous.combos,perfect=caught&&Math.abs(b.position.x-catcher)<=12;state=resolveBall(state,id,caught,perfect);
  if(perfect){perfectUntil=clock+.55;$('perfect-pop').classList.remove('show');void $('perfect-pop').offsetWidth;$('perfect-pop').classList.add('show');}
  if(caught){catchPulse=1;sparks(b.position.x,HEIGHT-48,7);haptic(5);tone(520+(state.round.comboCount||3)*100,.08,.045);if(state.round.combos>combos){$('combo-pop').textContent='TRINCA! +3 PTS';$('combo-pop').classList.remove('show');void $('combo-pop').offsetWidth;$('combo-pop').classList.add('show');comboUntil=clock+.8;sparks(catcher,HEIGHT-48,22);tone(523,.22,.12);tone(659,.25,.11,.07);tone(784,.35,.1,.14);haptic(22);}}
  const opened=state.round.gates.findIndex((g,i)=>g.openedAt!==null&&previous.gates[i].openedAt===null);
  if(opened>=0){$('combo-pop').textContent='CASCATA! +12';$('combo-pop').classList.remove('show');void $('combo-pop').offsetWidth;$('combo-pop').classList.add('show');comboUntil=clock+1.4;avalancheUntil=clock+1.3;sparks(GATE_X[opened],GATE_Y,24);tone(196,.2,.09);tone(392,.35,.08,.12);haptic(30);}
  checkpoint();renderUI();
}
function tick(){const r=state.round;r.tick++;syncShutters();if(r.spawned<TOTAL&&r.tick%9===0){addMarble(r.spawned);r.spawned++;}
  r.gates.forEach((g,color)=>{if(g.openedAt===null)return;const age=r.tick-g.openedAt;while(g.spawned<BONUS_PER_GATE&&age>=g.spawned*2){addMarble(TOTAL+color*BONUS_PER_GATE+(BONUS_PER_GATE-1-g.spawned));g.spawned++;}});Engine.update(engine,1000/60);
  for(const[id,b]of [...live.entries()]){if(b.position.y>HEIGHT-57&&b.position.y<HEIGHT-17&&Math.abs(b.position.x-catcher)<41)resolve(id,true);else if(b.position.y>HEIGHT+16||b.position.x<-35||b.position.x>WIDTH+35)resolve(id,false);}
  if(state.round.tick>=state.round.deadline){for(const id of [...live.keys()])resolve(id,false);for(const id of availableIds(state.round))if(!state.round.resolved.includes(id))state=resolveBall(state,id,false);}
  if(state.round.resolved.length===state.round.total){state=settle(state);release(null,false);checkpoint();renderUI();tone(523,.23,.09);tone(784,.35,.08,.12);}
}
function release(e,save=true){if(!pointer||e&&e.pointerId!==pointer.id)return;const p=pointer;pointer=null;try{canvas.releasePointerCapture(p.id);}catch{}$('touch-hint').classList.remove('moving');if(save)checkpoint();}
canvas.addEventListener('pointerdown',e=>{if(paused||pointer||!e.isPrimary||e.button!==0||state.round?.phase==='paid')return;e.preventDefault();unlockAudio();pointer={id:e.pointerId,x:e.clientX};canvas.setPointerCapture(e.pointerId);$('touch-hint').classList.add('moving');});
canvas.addEventListener('pointermove',e=>{if(!pointer||e.pointerId!==pointer.id)return;e.preventDefault();const scale=canvas.getBoundingClientRect().width/(camera.right-camera.left);catcher=Math.max(CATCH_MIN,Math.min(CATCH_MAX,catcher+(e.clientX-pointer.x)/scale));pointer.x=e.clientX;});
for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,release);
document.addEventListener('visibilitychange',()=>{release();last=0;checkpoint();});window.addEventListener('blur',()=>release());
function flyPrize(){
 const r=state.round;if(!r||r.practice||!payout(r))return;
 const wallet=document.querySelector('.wallet'),target=wallet.getBoundingClientRect(),box=canvas.getBoundingClientRect();
 wallet.classList.remove('receiving');void wallet.offsetWidth;wallet.classList.add('receiving');setTimeout(()=>wallet.classList.remove('receiving'),700);
 if(reduced)return;
 for(let i=0;i<6;i++){const coin=document.createElement('img');coin.src='./assets/prize-coin.webp';coin.alt='';coin.className='payout-coin';const x=box.x+box.width*.5-16,y=box.y+box.height*.8-16;coin.style.left=x+'px';coin.style.top=y+'px';document.body.append(coin);coin.animate([{transform:'translate(0,0) scale(.7)',opacity:0},{transform:`translate(${(i-2.5)*17}px,-35px) scale(1)`,opacity:1,offset:.25},{transform:`translate(${target.x+target.width*.5-x-16}px,${target.y+target.height*.5-y-16}px) scale(.55)`,opacity:0}],{duration:570,delay:i*35,easing:'cubic-bezier(.3,.1,.3,1)',fill:'both'}).onfinish=()=>coin.remove();}
}
$('play').onclick=()=>start(false);$('practice').onclick=()=>start(true);$('again').onclick=()=>{flyPrize();start(!!state.round?.practice);};
$('back').onclick=()=>{if(state.round?.phase==='playing')return;flyPrize();$('result-dialog').close();state.round=null;write();restore();};
$('result-dialog').addEventListener('cancel',e=>{e.preventDefault();$('back').click();});
for(const[id,delta]of[['bet-less',-1],['bet-more',1]])$(id).onclick=()=>{if(state.round?.phase==='playing')return;state.bet=BETS[Math.max(0,Math.min(BETS.length-1,BETS.indexOf(state.bet)+delta))];write();renderUI();};
$('reset-demo').onclick=()=>{if(state.round?.phase==='playing')return;const settings=state.settings;state={...fresh(),settings};write();restore();};
function pause(open){paused=open;document.querySelector('.app').classList.toggle('paused',open);release();last=0;}
function help(){pause(true);$('how-to').showModal();}$('help').onclick=help;for(const id of ['close-help','got-it'])$(id).onclick=()=>$('how-to').close();$('how-to').addEventListener('close',()=>pause(false));
mountMenu(state.settings,settings=>{state.settings=settings;write();unlockAudio();},help,pause,{screen:'Fortune Cascata',buttonSize:51});
window.addEventListener('storage',e=>{if(e.key!==KEY)return;release(null,false);state=read();restore();last=0;});
function resize(){
 const app=document.querySelector('.app'),viewport=document.documentElement,scale=Math.min(viewport.clientWidth/453,viewport.clientHeight/802);app.style.setProperty('--stage-scale',scale);app.style.setProperty('--stage-height',viewport.clientHeight/scale+'px');
 const w=arena.clientWidth,h=arena.clientHeight,half=Math.max(180,270*w/h);camera.left=-half;camera.right=half;camera.top=half*h/w;camera.bottom=-half*h/w;camera.updateProjectionMatrix();renderer.setSize(w,h,false);
 for(const[id,x,y]of[['machine-title',180,35],['touch-hint',180,506],['perfect-pop',180,417]]){const p=new THREE.Vector3(x,HEIGHT-y,22).project(camera),el=$(id);el.style.left=(p.x+1)*w/2+'px';el.style.top=(1-p.y)*h/2+'px';}
}
const layoutObserver=new ResizeObserver(resize);layoutObserver.observe(arena);layoutObserver.observe(document.documentElement);window.addEventListener('resize',resize);resize();restore();
function frame(now){requestAnimationFrame(frame);const dt=last?Math.min((now-last)/1000,.09):0;last=now;if(paused||document.hidden){renderer.render(scene,camera);return;}clock+=dt;
  if(state.round?.phase==='playing'&&clock>=launchAt){acc+=dt;while(acc>=1/60&&state.round.phase==='playing'){tick();acc-=1/60;}if(clock-lastSave>.4)checkpoint();}
  const active=state.round?.phase==='playing',age=clock-launchAt+.28;cabinetMaterial.color.setScalar(active?1:.82);
  for(const{lamp,y}of lamps){const reach=(409-y)/264*.42;lamp.material.opacity=active?Math.min(1,.22+Math.exp(-(((age-reach)/.12)**2))*.75+(clock<avalancheUntil?.22:0)):0;}
  const r=state.round,roundSeed=r?.seed??12345;if(marbleColorSeed!==roundSeed){for(let i=0;i<MAX_BALLS;i++)ballsMesh.setColorAt(i,marbleColors[marblePlan(roundSeed,i).color]);ballsMesh.instanceColor.needsUpdate=true;marbleColorSeed=roundSeed;}
  for(let i=0;i<MAX_BALLS;i++){const b=live.get(i),resolved=r?.resolved.includes(i);let x=0,y=0,scale=1;
    if(b){x=b.position.x;y=b.position.y;}else if(i>=TOTAL){const color=Math.floor((i-TOTAL)/BONUS_PER_GATE),local=(i-TOTAL)%BONUS_PER_GATE,g=r?.gates[color];if(!g||local<BONUS_PER_GATE-g.spawned){const p=marblePlan(roundSeed,i);x=p.x;y=p.y;}else scale=0;
    }else if((!r||i>=r.spawned)&&i===(r?.spawned||0)){const p=marblePlan(roundSeed,i);x=p.x;y=220;scale=.9;}else scale=0;
    if(resolved)scale=0;marbles.set(i,x,HEIGHT-y,22,scale,b?.angle||0);}
  marbles.flush();
  pegPositions.forEach((p,i)=>{pegFlashes[i]=Math.max(0,pegFlashes[i]-dt*5);pegs.setColorAt(i,goldColor.clone().lerp(whiteColor,pegFlashes[i]));});pegs.instanceColor.needsUpdate=true;
  catchPulse=Math.max(0,catchPulse-dt*6);const lean=reduced?0:THREE.MathUtils.clamp((catcher-basketX)*-.005,-.07,.07);basketX=catcher;basket.rotation.z=THREE.MathUtils.lerp(basket.rotation.z,lean,1-Math.exp(-dt*15));basket.position.set(catcher,44-(reduced?0:catchPulse*4),22);
  catchRim.material.color.setHex(clock<perfectUntil?0xfff6cf:r?.comboCount?COLORS[r.comboColor]:0xffdb86);catchRim.material.opacity=.45+catchPulse*.5;
  feedLip.position.x=marblePlan(roundSeed,Math.min(TOTAL-1,r?.spawned||0)).x;
  chargePips.forEach((row,color)=>{const g=r?.gates[color],charge=r?.comboColor===color?r.comboCount:0;row.forEach((o,n)=>{const on=g?.openedAt!=null||n<charge;o.material.color.setHex(on?COLORS[color]:0x503c3c);o.material.emissive.setHex(on?COLORS[color]:0);o.material.emissiveIntensity=on?.6:0;});shutters[color].material.emissive.setHex(COLORS[color]);shutters[color].material.emissiveIntensity=g?.openedAt!=null?.23:charge*.13;reservoirGlass[color].material.opacity=.06+(charge*.025);});
  $('playing-copy').textContent=clock<avalancheUntil?'COMPORTA ABERTA!':r?.comboCount===2?'FALTA SÓ UMA!':'ARRASTE PARA COLHER';
  for(let i=0;i<fx.length;i++){const p=fx[i];p.life-=dt;if(p.life>0){p.vy+=120*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;dummy.position.set(p.x,HEIGHT-p.y,30);dummy.scale.setScalar(p.life*1.5);}else dummy.scale.setScalar(0);dummy.updateMatrix();fxMesh.setMatrixAt(i,dummy.matrix);}fxMesh.instanceMatrix.needsUpdate=true;
  if(clock>comboUntil)$('combo-pop').classList.remove('show');renderer.render(scene,camera);
}
requestAnimationFrame(frame);
window.cascade={snapshot:()=>structuredClone({state,catcher,balls:[...live.entries()].map(([id,b])=>({id,x:b.position.x,y:b.position.y,color:marblePlan(state.round.seed,id).color})),pointer:pointer?.id??null,paused}),project:(x,y)=>{const p=new THREE.Vector3(x,HEIGHT-y,22).project(camera),b=canvas.getBoundingClientRect();return{x:b.left+(p.x+1)*b.width/2,y:b.top+(1-p.y)*b.height/2};}};
