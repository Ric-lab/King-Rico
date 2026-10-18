import * as THREE from 'three';
import {DT,START,GOAL_Z,makeLayout,velocityFromGesture,createBall,stepBall,simulateShot,applyOutcome,collect} from './physics.mjs';
import {mountMenu} from './menu-entry.js';

const $=id=>document.getElementById(id),format=n=>new Intl.NumberFormat('pt-BR').format(n);
const KEY='king-rico-impulso-demo-v1',bets=[10,25,50,100],fresh=()=>({version:1,balance:1000,bet:25,nextSeed:crypto.getRandomValues(new Uint32Array(1))[0],settings:{sfx:1,vib:1},round:null});
let memory=fresh();
function read(){try{const s=JSON.parse(localStorage.getItem(KEY));if(s?.version===1&&Number.isFinite(s.balance))return s;}catch{}return memory;}
function write(s){memory=s;try{localStorage.setItem(KEY,JSON.stringify(s));}catch{}return s;}
let state=read(),layout=makeLayout(state.round?.seed??state.nextSeed,state.round?Math.min(state.round.stage,2):0);
if(state.round?.status==='flight')state=write(applyOutcome(state));
let paused=false,gesture=null,flight=null,flightAccumulator=0,lastTime=0,clock=0,impact=0,lightWave=-100,toastUntil=0,finishAt=0;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const canvas=$('game'),arena=$('arena');
let renderer;
try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});}catch{$('compatibility').hidden=false;throw Error('WebGL indisponível');}
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(0x000000,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.98;
const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-5.4,5.4,7,-7,.1,80);
camera.position.set(0,16,12);camera.lookAt(0,0,-.55);
scene.add(new THREE.HemisphereLight(0xffefde,0x512958,1.35));
const key=new THREE.DirectionalLight(0xffeed0,3);key.position.set(-4,10,5);scene.add(key);
const rim=new THREE.DirectionalLight(0xd9b7ff,1.8);rim.position.set(6,6,-5);scene.add(rim);
const warm=new THREE.PointLight(0xffcb80,22,16,2);warm.position.set(0,5,-4);scene.add(warm);
const envCanvas=document.createElement('canvas');envCanvas.width=512;envCanvas.height=256;
const ex=envCanvas.getContext('2d'),gradient=ex.createLinearGradient(0,0,0,256);gradient.addColorStop(0,'#ffeece');gradient.addColorStop(.42,'#9c7784');gradient.addColorStop(.5,'#301e40');gradient.addColorStop(.8,'#4a294e');gradient.addColorStop(1,'#e8c38b');ex.fillStyle=gradient;ex.fillRect(0,0,512,256);ex.fillStyle='#fff5d8';ex.fillRect(48,25,95,75);ex.fillStyle='#f3d8ff';ex.fillRect(350,35,24,120);
const env=new THREE.CanvasTexture(envCanvas);env.mapping=THREE.EquirectangularReflectionMapping;env.colorSpace=THREE.SRGBColorSpace;
const pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromEquirectangular(env).texture;scene.environmentIntensity=.7;env.dispose();pmrem.dispose();
const mat=(color,metalness=0,roughness=.4,extra={})=>new THREE.MeshStandardMaterial({color,metalness,roughness,...extra});
const gold=mat(0xe9b350,.72,.26),lightGold=mat(0xffdfa0,.55,.25),darkGold=mat(0x8a542b,.65,.4),plum=mat(0x512d58,.2,.31),dark=mat(0x170f27,.15,.48),velvet=mat(0x713143,.15,.65);
function rounded(w,d,h,r,material){
  const s=new THREE.Shape(),x=-w/2,y=-d/2;s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+d-r);s.quadraticCurveTo(x+w,y+d,x+w-r,y+d);s.lineTo(x+r,y+d);s.quadraticCurveTo(x,y+d,x,y+d-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);
  const g=new THREE.ExtrudeGeometry(s,{depth:h,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.035,bevelThickness:.035,curveSegments:8});g.rotateX(-Math.PI/2);return new THREE.Mesh(g,material);
}
function place(mesh,x,y,z,parent=scene){mesh.position.set(x,y,z);parent.add(mesh);return mesh;}
function cylinder(r,h,material){return new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,40),material);}
function ring(r,width,color){const m=new THREE.Mesh(new THREE.RingGeometry(r,r+width,64),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.5,side:THREE.DoubleSide,depthWrite:false}));m.rotation.x=-Math.PI/2;return m;}
function glowTexture(){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d'),g=x.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.25,'rgba(255,255,255,.5)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,128,128);return new THREE.CanvasTexture(c);}
const glowMap=glowTexture();
function glow(color,size,x,y,z){const mesh=new THREE.Mesh(new THREE.PlaneGeometry(size,size),new THREE.MeshBasicMaterial({map:glowMap,color,transparent:true,opacity:.4,depthWrite:false,blending:THREE.AdditiveBlending}));mesh.rotation.x=-Math.PI/2;return place(mesh,x,Math.max(.13,y),z);}
function label(text,color='#ffe7b2',size=1.4){const c=document.createElement('canvas');c.height=128;let x=c.getContext('2d');x.font='800 88px "Baloo 2", sans-serif';c.width=Math.ceil(x.measureText(text).width+40);x=c.getContext('2d');x.font='800 88px "Baloo 2", sans-serif';x.textAlign='center';x.textBaseline='middle';x.shadowColor='#1a091e';x.shadowBlur=4;x.shadowOffsetY=4;x.fillStyle=color;x.fillText(text,c.width/2,68);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false}));sprite.scale.set(size,size*128/c.width,1);return sprite;}

// The cabinet, enamel, metal edging and all physics objects are procedural geometry.
place(rounded(9.8,13.5,.45,.7,darkGold),0,-.85,-.1);
place(rounded(9.6,13.3,.35,.65,plum),0,-.5,-.1);
place(rounded(9.25,13,.1,.6,gold),0,-.2,-.1);
place(rounded(8.9,12.7,.1,.52,mat(0x351d43,.25,.37)),0,-.08,-.1);
place(rounded(8.3,11.6,.015,.5,mat(0x281631,.08,.57)),0,.03,-.05);
for(const side of [-1,1]){
  place(rounded(.2,11.8,.26,.09,gold),side*4.32,.06,-.1);
  place(rounded(.14,11.5,.12,.06,lightGold),side*4.32,.32,-.1);
  place(rounded(.22,11.8,.28,.09,velvet),side*4.6,-.08,-.1);
}
// A recessed return gutter makes a missed shot physically legible.
place(rounded(8.2,.27,.04,.1,dark),0,.055,5.62);
for(let i=-3;i<=3;i++)place(rounded(.1,.13,.025,.02,mat(0xbc747b,.3,.45)),i*.65,.1,5.64);
const launchRing=place(ring(.57,.026,0xc9a26e),0,.135,START.z);
place(ring(.66,.01,0x89638a),0,.135,START.z);
for(const s of [-1,1]){
  place(cylinder(.22,1.7,darkGold),s*4.45,.8,-5.65);
  place(cylinder(.16,1.68,velvet),s*4.45,.9,-5.65);
  place(new THREE.Mesh(new THREE.SphereGeometry(.23,20,16),lightGold),s*4.45,1.8,-5.65);
}
const engrave=label('KING RICO','#795579',2.9);engrave.material.opacity=.55;engrave.rotation.x=-Math.PI/2;engrave.position.set(0,.075,1.35); // A plane below replaces sprite billboarding for the engraving.
const engravedPlane=new THREE.Mesh(new THREE.PlaneGeometry(2.5,.63),new THREE.MeshBasicMaterial({map:engrave.material.map,transparent:true,opacity:.27,depthWrite:false}));engravedPlane.rotation.x=-Math.PI/2;place(engravedPlane,0,.135,1.8);

const bulbs=[];
for(let i=0;i<18;i++)for(const side of [-1,1]){
  const z=5.25-i*.62,m=mat(0xb88a48,.1,.3,{emissive:0xffc86b,emissiveIntensity:.08});
  place(cylinder(.095,.06,darkGold),side*4.63,.25,z);
  const b=place(new THREE.Mesh(new THREE.SphereGeometry(.065,12,8),m),side*4.63,.32,z);bulbs.push({mesh:b,index:i});
}
let targetGroup=new THREE.Group(),targetMeshes=[],bumperMeshes=[];
scene.add(targetGroup);
function disposeTree(group){const shared=new Set([gold,lightGold,darkGold,plum,dark,velvet]);group.traverse(o=>{if(o.isMesh||o.isSprite){o.geometry?.dispose();if(o.material?.map&&o.material.map!==glowMap&&o.material.map!==shadow.material.map)o.material.map.dispose();if(o.material&&!shared.has(o.material))o.material.dispose();}});scene.remove(group);}
function rebuildLayout(next){
  layout=next;disposeTree(targetGroup);targetGroup=new THREE.Group();scene.add(targetGroup);targetMeshes=[];bumperMeshes=[];
  layout.goals.forEach((g,index)=>{
    const group=new THREE.Group();targetGroup.add(group);group.position.set(g.x,0,GOAL_Z-.22);
    const tint=mat(g.color,.35,.3,{emissive:g.color,emissiveIntensity:.13});
    const pad=place(rounded(g.width,1.05,.13,.17,tint),0,.055,-.1,group);
    place(rounded(g.width-.14,.85,.018,.12,dark),0,.2,-.1,group);
    const inner=place(rounded(g.width-.33,.66,.02,.13,mat(g.color,.4,.3,{emissive:g.color,emissiveIntensity:.32})),0,.23,-.1,group);
    for(const side of [-1,1]){
      place(cylinder(.085,1.15,gold),side*(g.width/2+.04),.68,-.39,group);
      place(new THREE.Mesh(new THREE.SphereGeometry(.105,16,12),lightGold),side*(g.width/2+.04),1.29,-.39,group);
    }
    place(rounded(g.width+.22,.28,.16,.09,gold),0,1.25,-.39,group);
    const bg=place(rounded(g.width-.02,.18,.66,.12,dark),0,.53,-.48,group);
    const text=label('×'+String(g.mult).replace('.',','),new THREE.Color(g.color).getStyle(),g.width*.78);text.scale.y=.47;text.material.depthTest=false;text.renderOrder=20;place(text,0,.95,-.28,group);
    const name=label(g.name,'#efdbc0',g.width*.82);name.scale.y=.24;name.material.depthTest=false;name.renderOrder=20;place(name,0,1.66,-.44,group);name.material.opacity=.75;
    // Each target has its own pool of light, visible before the swipe.
    const halo=glow(g.color,g.width*1.6,g.x,.075,GOAL_Z-.15);scene.remove(halo);targetGroup.add(halo);halo.material.opacity=.18;
    targetMeshes.push({group,pad,inner,tint,halo,pulse:0,index});
  });
  layout.bumpers.forEach((p,index)=>{
    const group=new THREE.Group();group.position.set(p.x,0,p.z);targetGroup.add(group);
    place(cylinder(p.r+.07,.1,darkGold),0,.09,0,group);
    place(cylinder(p.r,.25,mat(0x45213f,.05,.65)),0,.25,0,group);
    place(cylinder(p.r*.92,.15,gold),0,.44,0,group);
    const cap=place(cylinder(p.r*.75,.075,lightGold),0,.55,0,group);
    place(cylinder(p.r*.32,.024,plum),0,.601,0,group);
    const halo=glow(0xffca6c,p.r*5,p.x,.07,p.z);scene.remove(halo);targetGroup.add(halo);halo.material.opacity=.08;
    const contact=new THREE.Mesh(new THREE.PlaneGeometry(p.r*3.9,p.r*3.9),new THREE.MeshBasicMaterial({map:shadow.material.map,transparent:true,opacity:.75,depthWrite:false}));contact.rotation.x=-Math.PI/2;place(contact,p.x+.04,.135,p.z+.12,targetGroup);
    const impactRing=place(ring(p.r+.05,.045,0xffd77e),p.x,.12,p.z,targetGroup);impactRing.material.opacity=0;
    bumperMeshes.push({group,cap,halo,impactRing,pulse:0,index});
  });
}

const ballGroup=new THREE.Group();scene.add(ballGroup);
const ballGold=mat(0xffd777,.72,.18);const sphere=new THREE.Mesh(new THREE.SphereGeometry(.3,40,32),ballGold);ballGroup.add(sphere);
const stripe=new THREE.Mesh(new THREE.TorusGeometry(.299,.012,8,48),mat(0x754d72,.55,.3));stripe.rotation.x=.7;ballGroup.add(stripe);
const ballGlow=glow(0xf6bb4b,1.8,0,.09,START.z);ballGlow.material.opacity=.12;
const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=64;const sc=shadowCanvas.getContext('2d'),sg=sc.createRadialGradient(32,32,2,32,32,32);sg.addColorStop(0,'rgba(0,0,0,.85)');sg.addColorStop(1,'rgba(0,0,0,0)');sc.fillStyle=sg;sc.fillRect(0,0,64,64);
const shadow=new THREE.Mesh(new THREE.PlaneGeometry(1.15,1.15),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(shadowCanvas),transparent:true,opacity:.8,depthWrite:false}));shadow.rotation.x=-Math.PI/2;place(shadow,0,.095,START.z);
ballGroup.position.set(START.x,.34,START.z);
const aimDots=[];for(let i=0;i<16;i++){const d=place(new THREE.Mesh(new THREE.SphereGeometry(.035,8,6),new THREE.MeshBasicMaterial({color:0xffe7b6,transparent:true,opacity:.65})),0,.2,0);d.visible=false;aimDots.push(d);}
const particles=[],particleGeometry=new THREE.SphereGeometry(.035,6,4);
function burst(x,z,color,count=18){for(let i=0;i<count;i++){
  const mesh=new THREE.Mesh(particleGeometry,new THREE.MeshBasicMaterial({color,transparent:true}));place(mesh,x,.5,z);
  const a=Math.random()*Math.PI*2,s=1.5+Math.random()*2;particles.push({mesh,vx:Math.cos(a)*s,vz:Math.sin(a)*s,vy:2+Math.random()*3,life:.45+Math.random()*.4});
}}
function toast(text){$('toast').textContent=text;$('toast').classList.add('show');toastUntil=clock+1.5;}
let audio;
function unlockAudio(){try{audio??=new(window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();}catch{}}
function tone(freq,duration=.1,type='sine',delay=0,volume=.1,end=freq){
  if(!audio||!state.settings.sfx)return;const now=audio.currentTime+delay,osc=audio.createOscillator(),gain=audio.createGain();osc.type=type;osc.frequency.setValueAtTime(freq,now);osc.frequency.exponentialRampToValueAtTime(Math.max(20,end),now+duration);gain.gain.setValueAtTime(volume*(state.settings.sfx===1?.45:1),now);gain.gain.exponentialRampToValueAtTime(.0001,now+duration);osc.connect(gain).connect(audio.destination);osc.start(now);osc.stop(now+duration+.02);
}
function haptic(ms){if(state.settings.vib)navigator.vibrate?.(state.settings.vib===1?Math.ceil(ms/2):ms);}
function celebrate(){tone(523,.25,'sine',0,.13);tone(659,.28,'sine',.08,.11);tone(784,.4,'sine',.17,.12);haptic(30);}

function phase(){const status=state.round?.status;return !status?'idle':status;}
function renderUI(){
  const p=phase(),r=state.round,amount=r?.amount??state.bet;
  $('balance').textContent=format(state.balance);$('at-stake').textContent=format(p==='lost'?0:amount);
  $('bet-value').textContent=format(state.bet);$('play').querySelector('span').textContent=format(state.bet)+' MOEDAS';$('again-bet').textContent=format(state.bet)+' MOEDAS';
  $('play').disabled=state.balance<state.bet;$('again').disabled=state.balance<state.bet;
  $('bet-less').disabled=state.bet===bets[0];$('bet-more').disabled=state.bet===bets.at(-1);
  $('round-count').innerHTML=Math.min(3,(r?.stage??0)+(p==='aim'||p==='flight'||p==='idle'?1:0))+' <small>/ 3</small>';
  const sections={idle:'idle',aim:'aim',flight:'flight',choice:'choice',paid:'result',lost:'result'};
  for(const name of ['idle','aim','flight','choice','result'])$(name+'-controls').hidden=sections[p]!==name;
  document.querySelectorAll('.steps i').forEach((e,i)=>{e.classList.toggle('done',i<(r?.stage??0));e.classList.toggle('current',i===(r?.stage??0)&&['idle','aim','flight'].includes(p));});
  $('gesture-hint').classList.toggle('inactive',p!=='aim'||!!gesture);
  $('aim-title').textContent=r?.stage?'A mesa mudou. Escolha sua mira.':'A mira é sua.';
  if(p==='choice'){$('choice-amount').textContent='+'+format(r.amount);$('collect-value').textContent=format(r.amount);$('choice-mult').textContent='×'+String(r.outcome.mult).replace('.',',');}
  if(p==='paid'||p==='lost'){
    $('result-title').textContent=p==='paid'?(r.stage===3?'Três acertos!':'Recebeu!'):'Bateu e voltou.';
    $('result-amount').textContent=p==='paid'?'+'+format(r.amount):'−'+format(r.stake)+' moedas';
    $('result-title').parentElement.classList.toggle('loss',p==='lost');
  }
}
function updateLayoutForState(){
  const r=state.round;rebuildLayout(makeLayout(r?.seed??state.nextSeed,r?Math.min(r.stage-(r.status==='choice'||r.status==='paid'?1:0),2):0));
}
function start(){
  state=read();if(['aim','flight','choice'].includes(phase()))return;if(state.balance<state.bet){toast('Use REPOR para testar mais.');return;}
  unlockAudio();const seed=state.nextSeed;state.balance-=state.bet;state.round={id:crypto.randomUUID(),seed,stake:state.bet,amount:state.bet,stage:0,status:'aim'};state.nextSeed=crypto.getRandomValues(new Uint32Array(1))[0];write(state);
  rebuildLayout(makeLayout(seed,0));resetBall();renderUI();tone(320,.2,'sine',0,.09,520);lightWave=clock;
}
function resetBall(){flight=null;finishAt=0;ballGroup.visible=true;ballGroup.position.set(0,.34,START.z);ballGroup.scale.set(1,1,1);sphere.rotation.set(0,0,0);shadow.visible=true;ballGlow.visible=true;impact=0;}
function finish(){
  state=read();if(state.round?.status!=='flight')return;
  const result=state.round.outcome;state=write(applyOutcome(state));flight=null;finishAt=0;renderUI();
  if(result.kind==='hit'){
    $('floating-score').textContent='+'+format(state.round.amount);$('floating-score').classList.remove('show');void $('floating-score').offsetWidth;$('floating-score').classList.add('show');
    if(phase()==='paid'){celebrate();toast('Rodada completa!');}
  }else tone(190,.35,'sine',0,.075,85);
}
function launch(v){
  state=read();if(phase()!=='aim')return;
  state.round.status='flight';state.round.velocity=v;state.round.outcome=simulateShot(layout,v);write(state);
  flight=createBall(v);flightAccumulator=0;renderUI();tone(160,.2,'triangle',0,.065,650);haptic(15);impact=.4;lightWave=clock;
}
function releaseGesture(event,cancel=false){
  if(!gesture||event&&event.pointerId!==gesture.id)return;
  const old=gesture;gesture=null;try{canvas.releasePointerCapture(old.id);}catch{}
  aimDots.forEach(d=>d.visible=false);$('power').hidden=true;
  if(!cancel&&old.velocity)launch(old.velocity);else if(!cancel)toast('Arraste para cima e solte.');renderUI();
}
canvas.addEventListener('pointerdown',e=>{
  if(paused||phase()!=='aim'||gesture||!e.isPrimary||e.button!==0)return;e.preventDefault();unlockAudio();
  gesture={id:e.pointerId,x:e.clientX,y:e.clientY,velocity:null};canvas.setPointerCapture(e.pointerId);$('gesture-hint').classList.add('inactive');
});
canvas.addEventListener('pointermove',e=>{
  if(!gesture||e.pointerId!==gesture.id)return;e.preventDefault();const box=canvas.getBoundingClientRect();
  const v=velocityFromGesture(e.clientX-gesture.x,e.clientY-gesture.y,box.width);gesture.velocity=v;
  $('power').hidden=!v;if(!v){aimDots.forEach(d=>d.visible=false);return;}
  $('power').querySelector('i').style.width=(v.power*100)+'%';
  const b=createBall(v);for(let i=0;i<16;i++){for(let j=0;j<3;j++)stepBall(b,layout);const dot=aimDots[i];dot.visible=!b.done;dot.position.set(b.x,.25,b.z);dot.material.opacity=.72*(1-i/18);}
});
canvas.addEventListener('pointerup',e=>releaseGesture(e));canvas.addEventListener('pointercancel',e=>releaseGesture(e,true));canvas.addEventListener('lostpointercapture',e=>releaseGesture(e,true));
document.addEventListener('visibilitychange',()=>{releaseGesture(null,true);lastTime=0;});window.addEventListener('blur',()=>releaseGesture(null,true));
$('play').onclick=start;$('again').onclick=start;
$('change-bet').onclick=()=>{state=read();if(!['paid','lost'].includes(phase()))return;state.round=null;write(state);updateLayoutForState();resetBall();renderUI();};
$('collect').onclick=()=>{state=write(collect(read()));renderUI();celebrate();lightWave=clock;};
$('risk').onclick=()=>{state=read();if(phase()!=='choice')return;state.round.status='aim';write(state);rebuildLayout(makeLayout(state.round.seed,state.round.stage));resetBall();renderUI();tone(390,.15,'sine',0,.08,580);lightWave=clock;};
for(const [id,delta]of[['bet-less',-1],['bet-more',1]])$(id).onclick=()=>{state=read();if(phase()!=='idle')return;state.bet=bets[Math.max(0,Math.min(bets.length-1,bets.indexOf(state.bet)+delta))];write(state);renderUI();tone(350,.07);};
$('reset-demo').onclick=()=>{if(['flight','choice','aim'].includes(phase())){toast('Termine a rodada para repor.');return;}const settings=state.settings;state=write({...fresh(),settings});updateLayoutForState();resetBall();renderUI();toast('1.000 moedas para testar.');};
function help(){releaseGesture(null,true);paused=true;$('how-to').showModal();}
$('help').onclick=help;for(const id of ['close-help','got-it'])$(id).onclick=()=>$('how-to').close();$('how-to').addEventListener('close',()=>{paused=false;lastTime=0;});$('how-to').addEventListener('click',e=>{if(e.target===$('how-to')){const b=$('how-to').getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)$('how-to').close();}});
mountMenu(state.settings,prefs=>{state=read();state.settings=prefs;write(state);unlockAudio();},help,open=>{paused=open;releaseGesture(null,true);lastTime=0;});
window.addEventListener('storage',e=>{if(e.key===KEY){releaseGesture(null,true);state=read();flight=null;if(phase()==='flight')state=write(applyOutcome(state));updateLayoutForState();resetBall();renderUI();toast('Rodada atualizada neste navegador.');}});
function resize(){const w=arena.clientWidth,h=arena.clientHeight;renderer.setSize(w,h,false);const halfWidth=Math.max(5.25,6.1*w/h);camera.left=-halfWidth;camera.right=halfWidth;camera.top=halfWidth*h/w;camera.bottom=-halfWidth*h/w;camera.updateProjectionMatrix();}
new ResizeObserver(resize).observe(arena);resize();updateLayoutForState();renderUI();
// Wait for the actual brand font before drawing the labels onto texture canvases.
document.fonts.ready.then(()=>{updateLayoutForState();});
if(['choice','paid','lost'].includes(phase())){ballGroup.visible=false;shadow.visible=false;ballGlow.visible=false;}

function onPhysicsEvent(event){
  if(event.kind==='bumper'){
    bumperMeshes[event.index].pulse=1;impact=.8;burst(event.x,event.z,0xffd777,8);tone(280+event.index*95,.14,'sine',0,.09,420);haptic(12);
  }else if(event.kind==='wall'){
    impact=.5;tone(205,.095,'triangle',0,.05,120);haptic(7);lightWave=clock-.15;
  }else if(event.kind==='hit'){
    const target=targetMeshes[event.index];target.pulse=1;burst(event.x,event.z,layout.goals[event.index].color,28);celebrate();lightWave=clock;finishAt=clock+.65;
  }else if(event.kind==='miss'){finishAt=clock+.4;haptic(20);}
}
function frame(now){
  requestAnimationFrame(frame);const dt=lastTime?Math.min((now-lastTime)/1000,.04):0;lastTime=now;
  if(paused||document.hidden){renderer.render(scene,camera);return;}clock+=dt;
  if(flight&&!flight.done){
    flightAccumulator+=dt;while(flightAccumulator>=DT&&!flight.done){const oldX=flight.x,oldZ=flight.z;const events=stepBall(flight,layout);sphere.rotation.x+=(flight.z-oldZ)/.25;sphere.rotation.z-=(flight.x-oldX)/.25;events.forEach(onPhysicsEvent);flightAccumulator-=DT;}
    ballGroup.position.set(flight.x,.34,flight.z);
  }
  if(flight?.done&&finishAt&&clock>=finishAt)finish();
  if(flight?.done&&flight.result.kind==='hit'){ballGroup.position.y=Math.max(.03,ballGroup.position.y-dt*.7);ballGroup.scale.multiplyScalar(Math.exp(-dt*3));}
  else if(phase()==='aim'||phase()==='idle'){
    ballGroup.position.y=.34+(reduced?0:Math.sin(clock*2)*.018);const s=1+impact*.2;ballGroup.scale.set(s,1-impact*.26,s);
  }else if(flight){ballGroup.scale.set(1+impact*.18,1-impact*.26,1+impact*.18);}
  impact=Math.max(0,impact-dt*5);launchRing.material.opacity=(phase()==='aim'||phase()==='idle')?.22+(Math.sin(clock*2)+1)*.09:0;
  shadow.position.x=ballGlow.position.x=ballGroup.position.x;shadow.position.z=ballGlow.position.z=ballGroup.position.z;
  if(flight?.done&&flight.result.kind==='hit'){shadow.material.opacity*=Math.exp(-dt*4);ballGlow.material.opacity*=Math.exp(-dt*2);}else{shadow.material.opacity=.8;ballGlow.material.opacity=.12;}
  for(const b of bumperMeshes){b.pulse=Math.max(0,b.pulse-dt*3);b.cap.position.y=.55-b.pulse*.13;b.group.scale.y=1-b.pulse*.12;b.halo.material.opacity=.08+b.pulse*.5;b.impactRing.material.opacity=b.pulse*.75;b.impactRing.scale.setScalar(1+(1-b.pulse)*.8);}
  for(const t of targetMeshes){t.pulse=Math.max(0,t.pulse-dt*1.4);t.pad.position.y=.055-t.pulse*.16;t.inner.position.y=.23-t.pulse*.16;t.tint.emissiveIntensity=.12+t.pulse*.9;t.halo.material.opacity=.14+t.pulse*.65;}
  for(const b of bulbs){const wave=clock-lightWave-b.index*.032;const energy=wave>0?Math.max(0,1-wave*2):0;b.mesh.material.emissiveIntensity=.08+energy*3.5;}
  for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.life-=dt;p.vy-=9*dt;p.mesh.position.x+=p.vx*dt;p.mesh.position.z+=p.vz*dt;p.mesh.position.y+=p.vy*dt;p.mesh.material.opacity=Math.max(0,p.life*2);p.mesh.scale.setScalar(Math.max(.01,p.life*1.4));if(p.life<=0){scene.remove(p.mesh);p.mesh.material.dispose();particles.splice(i,1);}}
  if(clock>toastUntil)$('toast').classList.remove('show');renderer.render(scene,camera);
}
requestAnimationFrame(frame);
// Read-only inspection for local QA. No ability to credit or force a result.
window.impulso={snapshot:()=>structuredClone({state,layout,ball:flight,gesture:gesture&&{id:gesture.id,velocity:gesture.velocity},paused}),project:(x,z)=>{const p=new THREE.Vector3(x,.34,z).project(camera),b=canvas.getBoundingClientRect();return{x:b.left+(p.x+1)*b.width/2,y:b.top+(1-p.y)*b.height/2};}};
