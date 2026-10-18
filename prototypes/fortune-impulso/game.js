import * as THREE from 'three';
import {DT,START,FLIGHT_TIME,makeLayout,velocityFromGesture,createBall,stepBall,simulateShot,applyOutcome,collect} from './physics.mjs';
import {mountMenu} from './menu-entry.js';
const $=id=>document.getElementById(id),format=n=>new Intl.NumberFormat('pt-BR').format(n);
const KEY='king-rico-impulso-demo-v2',bets=[10,25,50,100],seed=()=>crypto.getRandomValues(new Uint32Array(1))[0];
const fresh=()=>({version:2,balance:1000,bet:25,nextSeed:seed(),best:0,settings:{sfx:1,vib:1},round:null});
let memory=fresh();
function read(){try{const s=JSON.parse(localStorage.getItem(KEY));if(s?.version===2&&Number.isFinite(s.balance))return s;}catch{}return memory;}
function write(s){memory=s;try{localStorage.setItem(KEY,JSON.stringify(s));}catch{}return s;}
let state=read();if(state.round?.status==='flight')state=write(applyOutcome(state));
const phase=()=>state.round?.status||'idle';
let layout,paused=false,gesture=null,flight=null,accumulator=0,finishAt=0,lastTime=0,clock=0;
let impact=0,wave=-100,toastUntil=0,landedAt=0,cameraKick=0,waveOrigin={x:START.x,z:START.z};
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,canvas=$('game'),arena=$('arena');
let renderer;
try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});}catch{$('compatibility').hidden=false;throw Error('WebGL indisponível');}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.setClearColor(0x000000,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.04;
const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-5.2,5.2,6.5,-6.5,.1,80);
camera.position.set(0,12,14);camera.lookAt(0,.3,.15);
scene.add(new THREE.HemisphereLight(0xffefdc,0x30203f,1.8));
const key=new THREE.DirectionalLight(0xffe9c0,3.5);key.position.set(-5,9,6);scene.add(key);
const rim=new THREE.DirectionalLight(0xd2aaff,2.2);rim.position.set(5,6,-5);scene.add(rim);
const contactLight=new THREE.PointLight(0xffc669,0,11,2);scene.add(contactLight);
const environment=document.createElement('canvas');environment.width=512;environment.height=256;
const ec=environment.getContext('2d'),eg=ec.createLinearGradient(0,0,0,256);eg.addColorStop(0,'#fff2d3');eg.addColorStop(.38,'#987ba0');eg.addColorStop(.52,'#261330');eg.addColorStop(1,'#74532f');ec.fillStyle=eg;ec.fillRect(0,0,512,256);ec.fillStyle='#fff8db';ec.fillRect(45,25,110,78);ec.fillStyle='#e1d5ff';ec.fillRect(355,30,24,125);
const env=new THREE.CanvasTexture(environment);env.mapping=THREE.EquirectangularReflectionMapping;env.colorSpace=THREE.SRGBColorSpace;
const pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromEquirectangular(env).texture;scene.environmentIntensity=.8;env.dispose();pmrem.dispose();
const mat=(color,metalness=0,roughness=.4,extra={})=>new THREE.MeshStandardMaterial({color,metalness,roughness,...extra});
const gold=mat(0xf0b64c,.74,.22),paleGold=mat(0xffdea0,.6,.24),goldShade=mat(0x855024,.6,.32),plum=mat(0x57234e,.25,.38),red=mat(0x9f2e42,.2,.4),dark=mat(0x211029,.2,.48);
const fixedMaterials=new Set([gold,paleGold,goldShade,plum,red,dark]);
function place(o,x,y,z,parent=scene){o.position.set(x,y,z);parent.add(o);return o;}
function cyl(r,h,m,segments=64){return new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,segments),m);}
function torus(r,t,m){const o=new THREE.Mesh(new THREE.TorusGeometry(r,t,10,80),m);o.rotation.x=-Math.PI/2;return o;}
function circle(r,m){const o=new THREE.Mesh(new THREE.CircleGeometry(r,64),m);o.rotation.x=-Math.PI/2;return o;}
function haloMap(){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d'),g=x.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'#fff');g.addColorStop(.2,'#fff8');g.addColorStop(1,'#fff0');x.fillStyle=g;x.fillRect(0,0,128,128);return new THREE.CanvasTexture(c);}
const glowMap=haloMap();
function halo(size,color,opacity=.35){return circle(size,new THREE.MeshBasicMaterial({map:glowMap,color,transparent:true,opacity,depthWrite:false,blending:THREE.AdditiveBlending}));}
function shadow(size,opacity=.6){return circle(size,new THREE.MeshBasicMaterial({map:glowMap,color:0x09020d,transparent:true,opacity,depthWrite:false}));}
function crown(size,material){const s=new THREE.Shape();s.moveTo(-.5,-.22);s.lineTo(-.62,.26);s.lineTo(-.23,.04);s.lineTo(0,.43);s.lineTo(.23,.04);s.lineTo(.62,.26);s.lineTo(.5,-.22);s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth:.04,bevelEnabled:true,bevelThickness:.02,bevelSize:.02,bevelSegments:2});g.rotateX(-Math.PI/2);const o=new THREE.Mesh(g,material);o.scale.setScalar(size);return o;}

// The quiet circular stage gives the ball and concentric landing target priority.
place(cyl(5.35,.35,goldShade),0,-1.04,.45);place(cyl(5.28,.18,red),0,-.81,.45);place(torus(5.23,.065,paleGold),0,-.69,.45);place(cyl(5.13,.1,mat(0x3b173b,.13,.65)),0,-.66,.45);
for(let i=0;i<24;i++){const a=i/24*Math.PI*2;place(cyl(.07,.05,gold),Math.sin(a)*5.25,-.7,Math.cos(a)*5.25+.45);}
place(torus(4.83,.025,mat(0xbb875a,.5,.36)),0,-.595,.45);
const launch=new THREE.Group();place(launch,START.x,0,START.z);
place(cyl(1.03,.28,goldShade),0,-.05,0,launch);place(cyl(.98,.2,red),0,.1,0,launch);place(torus(.91,.065,paleGold),0,.23,0,launch);place(cyl(.86,.08,plum),0,.23,0,launch);place(crown(.8,gold),0,.28,0,launch);
const launchGlow=place(halo(1.65,0xffbe64,.12),0,.285,0,launch);
let targetRoot=new THREE.Group(),platform,padSpring,zoneMeshes=[],targetGlow,impactRing;scene.add(targetRoot);
function clearTarget(){targetRoot.traverse(o=>{o.geometry?.dispose();if(o.material&&!fixedMaterials.has(o.material))o.material.dispose();});scene.remove(targetRoot);}
function buildTarget(next){
  layout=next;clearTarget();targetRoot=new THREE.Group();place(targetRoot,next.target.x,0,next.target.z);const r=next.target.radius;
  place(shadow(r*1.25,.55),.1,-.57,.2,targetRoot);place(cyl(r*.7,.23,goldShade),0,-.42,0,targetRoot);
  const points=[];for(let i=0;i<=160;i++){const a=i/160*Math.PI*8;points.push(new THREE.Vector3(Math.cos(a)*r*.37,-.4+i/160*.5,Math.sin(a)*r*.37));}
  padSpring=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),160,.045,6,false),gold);targetRoot.add(padSpring);
  platform=new THREE.Group();targetRoot.add(platform);place(cyl(r+.09,.2,goldShade),0,.1,0,platform);place(cyl(r+.04,.12,gold),0,.24,0,platform);
  zoneMeshes=[];const colors=[0x8d4d89,0xf3d8c0,0xffcc65];
  for(let i=0;i<3;i++){const zone=next.goals[i],m=mat(colors[i],i===2?.65:.1,i===2?.25:.48,{emissive:colors[i],emissiveIntensity:.015});zoneMeshes.push(place(cyl(zone.radius,.035,m),0,.315+i*.013,0,platform));place(torus(zone.radius,.022,i===0?paleGold:goldShade),0,.34+i*.013,0,platform);}
  place(crown(r*.48,goldShade),0,.377,0,platform);targetGlow=place(halo(r*1.65,0xffc66e,.1),0,.29,0,targetRoot);
  impactRing=place(torus(r+.15,.035,mat(0xffdc8c,.4,.2,{transparent:true,opacity:0,emissive:0xffc66e,emissiveIntensity:.6})),0,.16,0,targetRoot);updateLabels();
}
const bulbs=[];for(let i=0;i<18;i++){const a=i/18*Math.PI*2,m=mat(0xd5a666,.2,.32,{emissive:0xffc46a,emissiveIntensity:.1});const o=place(new THREE.Mesh(new THREE.SphereGeometry(.075,10,8),m),Math.sin(a)*4.76,-.52,Math.cos(a)*4.76+.45);bulbs.push({o,index:i});}
const ballGroup=new THREE.Group();scene.add(ballGroup);const ball=new THREE.Mesh(new THREE.SphereGeometry(.4,40,32),mat(0xffd86c,.7,.19));ballGroup.add(ball);
const seam=new THREE.Mesh(new THREE.TorusGeometry(.397,.016,8,48),plum);seam.rotation.x=.8;ball.add(seam);
const crownBall=crown(.29,goldShade);crownBall.rotation.x=Math.PI/2;crownBall.position.set(0,.02,.395);ball.add(crownBall);
const ballShadow=place(shadow(.65,.6),START.x,.29,START.z),ballHalo=place(halo(1.05,0xffc56c,.13),START.x,.3,START.z);
const trail=[];for(let i=0;i<9;i++){const o=new THREE.Mesh(new THREE.SphereGeometry(.05,8,6),new THREE.MeshBasicMaterial({color:0xffdf9f,transparent:true,opacity:0,depthWrite:false}));scene.add(o);trail.push(o);}
const aimDots=[];for(let i=0;i<19;i++){const o=new THREE.Mesh(new THREE.SphereGeometry(.035,8,6),new THREE.MeshBasicMaterial({color:0xffe7bb,transparent:true,opacity:.65,depthWrite:false}));o.visible=false;scene.add(o);aimDots.push(o);}
const landingMark=place(torus(.28,.018,paleGold),0,-.54,0);landingMark.visible=false;
const particles=[],particleGeo=new THREE.OctahedronGeometry(.055);
function burst(x,y,z,count=24){if(reduced)count=8;for(let i=0;i<count;i++){const o=new THREE.Mesh(particleGeo,new THREE.MeshBasicMaterial({color:i%3===0?0xfff2c1:0xf5bf50,transparent:true}));place(o,x,y,z);const a=Math.random()*Math.PI*2,s=1+Math.random()*2.8;particles.push({o,vx:Math.cos(a)*s,vy:2+Math.random()*3,vz:Math.sin(a)*s,life:.55+Math.random()*.4});}}
function project(x,y,z){const p=new THREE.Vector3(x,y,z).project(camera),b=canvas.getBoundingClientRect();return{x:b.left+(p.x+1)*b.width/2,y:b.top+(1-p.y)*b.height/2};}
function updateLabels(){if(!layout)return;const b=canvas.getBoundingClientRect(),p=project(layout.target.x,1.3,layout.target.z-.5);$('target-label').style.left=(p.x-b.left)+'px';$('target-label').style.top=(p.y-b.top)+'px';}
function toast(text){$('toast').textContent=text;$('toast').classList.add('show');toastUntil=clock+1.7;}
let audio;
function unlockAudio(){try{audio??=new(window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();}catch{}}
function tone(freq,duration=.12,delay=0,volume=.1,end=freq,type='sine'){if(!audio||!state.settings.sfx)return;const now=audio.currentTime+delay,osc=audio.createOscillator(),gain=audio.createGain();osc.type=type;osc.frequency.setValueAtTime(freq,now);osc.frequency.exponentialRampToValueAtTime(Math.max(20,end),now+duration);gain.gain.setValueAtTime(volume*(state.settings.sfx===1?.45:1),now);gain.gain.exponentialRampToValueAtTime(.0001,now+duration);osc.connect(gain).connect(audio.destination);osc.start(now);osc.stop(now+duration+.02);}
function haptic(ms){if(state.settings.vib)navigator.vibrate?.(state.settings.vib===1?Math.ceil(ms/2):ms);}
function celebrate(perfect=false){tone(523,.22,0,.13);tone(perfect?784:659,.3,.08,.12);tone(perfect?1046:784,.42,.17,.1);haptic(perfect?35:18);}
function coinFlight(){if(reduced)return;const to=$('balance').getBoundingClientRect(),from=project(layout.target.x,1,layout.target.z);for(let i=0;i<7;i++){const o=document.createElement('i');o.className='flying-coin coin';document.body.append(o);const dx=to.x-from.x+to.width*.5,dy=to.y-from.y;o.style.left=from.x+'px';o.style.top=from.y+'px';const a=o.animate([{transform:'translate(0,0) scale(.7)',opacity:0},{transform:`translate(${dx*.25+(i-3)*12}px,${dy*.5-50}px) scale(1)`,opacity:1,offset:.45},{transform:`translate(${dx}px,${dy}px) scale(.45)`,opacity:0}],{duration:650,delay:i*45,easing:'ease-in'});a.onfinish=()=>o.remove();}}
function resetBall(){flight=null;finishAt=0;landedAt=0;impact=0;ballGroup.visible=true;ballShadow.visible=true;ballHalo.visible=true;ballGroup.position.set(START.x,START.y,START.z);ballGroup.scale.set(1,1,1);ball.rotation.set(0,0,0);landingMark.visible=false;trail.forEach(t=>t.material.opacity=0);}
function updateLayout(){const r=state.round,stage=r?Math.min(r.stage-(['choice','paid'].includes(r.status)?1:0),2):0;buildTarget(makeLayout(r?.seed??state.nextSeed,Math.max(0,stage)));}
function renderUI(){
  const p=phase(),r=state.round,training=r?.training;$('balance').textContent=format(state.balance);$('best').textContent=(state.best||0)+'%';$('stake-label').textContent=training?'ENSAIO':'NA MESA';$('at-stake').textContent=training?'GRÁTIS':format(p==='lost'?0:r?.amount??state.bet);
  $('bet-value').textContent=format(state.bet);$('play-value').textContent=format(state.bet)+' MOEDAS';$('again-bet').textContent=training?'GRÁTIS':format(state.bet)+' MOEDAS';$('again-label').textContent=training?'ENSAIAR DE NOVO':'JOGAR DE NOVO';$('play').disabled=state.balance<state.bet;$('again').disabled=!training&&state.balance<state.bet;$('bet-less').disabled=state.bet===bets[0];$('bet-more').disabled=state.bet===bets.at(-1);
  $('round-count').innerHTML=training?'LIVRE':Math.min(3,(r?.stage??0)+(['idle','aim','flight'].includes(p)?1:0))+' <small>/ 3</small>';
  const selected={idle:'idle',aim:'aim',flight:'flight',choice:'choice',paid:'result',lost:'result'}[p];for(const name of ['idle','aim','flight','choice','result'])$(name+'-controls').hidden=name!==selected;
  document.querySelectorAll('.steps i').forEach((e,i)=>{e.classList.toggle('done',i<(r?.stage??0));e.classList.toggle('current',i===(r?.stage??0)&&['idle','aim','flight'].includes(p));});$('gesture-hint').classList.toggle('inactive',p!=='aim'||!!gesture);$('target-label').classList.toggle('faded',p==='flight'||p==='lost');$('aim-title').textContent=training?'Encontre o seu toque.':r?.stage?'Novo salto. Mais precisão.':'Acerte o centro.';
  if(p==='choice'){$('hit-label').textContent=r.outcome.quality;$('choice-amount').textContent='+'+format(r.amount);$('collect-value').textContent=format(r.amount);$('choice-mult').textContent='×'+String(r.outcome.mult).replace('.',',');$('precision-score').textContent=r.outcome.points+'% DE PRECISÃO';}
  if(p==='paid'||p==='lost'){$('result-title').textContent=training?(p==='paid'?r.outcome.quality:'Ajuste o próximo gesto.'):(p==='paid'?(r.stage===3?'Três acertos!':'Recebeu!'):'Fora do alvo.');$('result-amount').textContent=training?r.outcome.points+'%':p==='paid'?'+'+format(r.amount):'−'+format(r.stake);$('result-feedback').textContent=p==='lost'?r.outcome.hint:training?'Repita o gesto e tente chegar mais perto do centro.':'Moedas recebidas.';$('result-title').parentElement.classList.toggle('loss',p==='lost');}
}
function start(training=false){state=read();if(['aim','flight','choice'].includes(phase()))return;if(!training&&state.balance<state.bet){toast('Use REPOR para testar mais.');return;}unlockAudio();const roundSeed=state.nextSeed;if(!training)state.balance-=state.bet;state.round={id:crypto.randomUUID(),seed:roundSeed,stake:training?0:state.bet,amount:training?0:state.bet,training,stage:0,status:'aim'};if(!training)state.nextSeed=seed();write(state);buildTarget(makeLayout(roundSeed,0));resetBall();if(training&&state.practiceLast?.seed===roundSeed){const last=state.practiceLast;landingMark.visible=true;landingMark.position.set(last.x,last.kind==='hit'?.39:-.53,last.z);landingMark.material=last.kind==='hit'?paleGold:red;}renderUI();tone(330,.15,0,.08,550);waveOrigin={x:START.x,z:START.z};wave=clock;}
function finish(){state=read();if(state.round?.status!=='flight')return;const result=state.round.outcome;state.best=Math.max(state.best||0,result.points);if(state.round.training)state.practiceLast={seed:state.round.seed,...result};state=write(applyOutcome(state));flight=null;finishAt=0;renderUI();if(result.kind==='hit'&&phase()==='paid'&&!state.round.training){coinFlight();celebrate(true);}}
function onLanding(result){landedAt=clock;landingMark.visible=true;landingMark.position.set(result.x,result.kind==='hit'?.39:-.53,result.z);landingMark.material=result.kind==='hit'?paleGold:red;if(result.kind==='hit'){impact=1;cameraKick=reduced?0:result.index===2?.08:.035;waveOrigin={x:result.x,z:result.z};wave=clock;contactLight.position.set(result.x,1.7,result.z);burst(result.x,.7,result.z,result.index===2?40:20);celebrate(result.index===2);$('floating-score').textContent=result.quality;$('floating-score').classList.remove('show');void $('floating-score').offsetWidth;$('floating-score').classList.add('show');finishAt=clock+.8;}else{toast(result.hint);tone(180,.27,0,.05,90);haptic(14);finishAt=clock+.65;}}
function launchShot(v){state=read();if(phase()!=='aim')return;state.round.status='flight';state.round.velocity=v;state.round.outcome=simulateShot(layout,v);write(state);flight=createBall(v);accumulator=0;waveOrigin={x:START.x,z:START.z};wave=clock;renderUI();tone(220,.22,0,.07,700,'triangle');haptic(12);}
function releaseGesture(event,cancel=false){if(!gesture||event&&event.pointerId!==gesture.id)return;const old=gesture;gesture=null;try{canvas.releasePointerCapture(old.id);}catch{}aimDots.forEach(d=>d.visible=false);$('power').hidden=true;$('aim-readout').hidden=true;if(!cancel&&old.velocity)launchShot(old.velocity);else if(!cancel)toast('Arraste para cima e solte.');renderUI();}
canvas.addEventListener('pointerdown',e=>{if(paused||phase()!=='aim'||gesture||!e.isPrimary||e.button!==0)return;e.preventDefault();unlockAudio();gesture={id:e.pointerId,x:e.clientX,y:e.clientY,velocity:null};canvas.setPointerCapture(e.pointerId);$('gesture-hint').classList.add('inactive');});
canvas.addEventListener('pointermove',e=>{if(!gesture||e.pointerId!==gesture.id)return;e.preventDefault();const v=velocityFromGesture(e.clientX-gesture.x,e.clientY-gesture.y,canvas.getBoundingClientRect().width);gesture.velocity=v;$('power').hidden=!v;if(!v){aimDots.forEach(d=>d.visible=false);return;}$('power').querySelector('i').style.width=(v.power*100)+'%';const b=createBall(v);for(let i=0;i<aimDots.length;i++){stepBall(b,layout,FLIGHT_TIME*.62/aimDots.length);const o=aimDots[i];o.visible=true;o.position.set(b.x,b.y,b.z);o.material.opacity=.78*(1-i/22);}$('aim-readout').hidden=false;$('aim-readout').textContent=v.power<.32?'GESTO CURTO':v.power>.8?'GESTO FORTE':'SEGURE, AJUSTE E SOLTE';ballGroup.scale.set(1.06,.91,1.06);});
canvas.addEventListener('pointerup',e=>releaseGesture(e));canvas.addEventListener('pointercancel',e=>releaseGesture(e,true));canvas.addEventListener('lostpointercapture',e=>releaseGesture(e,true));document.addEventListener('visibilitychange',()=>{releaseGesture(null,true);lastTime=0;});window.addEventListener('blur',()=>releaseGesture(null,true));
$('play').onclick=()=>start(false);$('practice').onclick=()=>start(true);$('again').onclick=()=>start(!!state.round?.training);
$('collect').onclick=()=>{state=write(collect(read()));renderUI();celebrate();coinFlight();wave=clock;};
$('risk').onclick=()=>{state=read();if(phase()!=='choice')return;state.round.status='aim';write(state);buildTarget(makeLayout(state.round.seed,state.round.stage));resetBall();renderUI();tone(420,.17,0,.08,610);wave=clock;};
$('change-bet').onclick=()=>{state=read();if(!['paid','lost'].includes(phase()))return;state.round=null;write(state);updateLayout();resetBall();renderUI();};
for(const[id,delta]of[['bet-less',-1],['bet-more',1]])$(id).onclick=()=>{state=read();if(phase()!=='idle')return;state.bet=bets[Math.max(0,Math.min(bets.length-1,bets.indexOf(state.bet)+delta))];write(state);renderUI();};
$('reset-demo').onclick=()=>{if(['aim','flight','choice'].includes(phase())){toast('Termine a rodada para repor.');return;}const settings=state.settings;state=write({...fresh(),settings});updateLayout();resetBall();renderUI();toast('1.000 moedas para testar.');};
function help(){releaseGesture(null,true);paused=true;$('how-to').showModal();}$('help').onclick=help;for(const id of ['close-help','got-it'])$(id).onclick=()=>$('how-to').close();$('how-to').addEventListener('close',()=>{paused=false;lastTime=0;});mountMenu(state.settings,prefs=>{state=read();state.settings=prefs;write(state);unlockAudio();},help,open=>{paused=open;releaseGesture(null,true);lastTime=0;});
window.addEventListener('storage',e=>{if(e.key!==KEY)return;releaseGesture(null,true);state=read();if(phase()==='flight')state=write(applyOutcome(state));flight=null;updateLayout();resetBall();renderUI();toast('Rodada atualizada neste navegador.');});
function resize(){const w=arena.clientWidth,h=arena.clientHeight;renderer.setSize(w,h,false);const half=Math.max(4.8,5.5*w/h);camera.left=-half;camera.right=half;camera.top=half*h/w;camera.bottom=-half*h/w;camera.updateProjectionMatrix();updateLabels();}
new ResizeObserver(resize).observe(arena);resize();updateLayout();resetBall();renderUI();if(['choice','paid','lost'].includes(phase())){ballGroup.visible=false;ballShadow.visible=false;ballHalo.visible=false;}
function frame(now){
  requestAnimationFrame(frame);const dt=lastTime?Math.min((now-lastTime)/1000,.08):0;lastTime=now;if(paused||document.hidden){renderer.render(scene,camera);return;}clock+=dt;
  if(flight&&!flight.done){accumulator+=dt;while(accumulator>=DT&&!flight.done){stepBall(flight,layout).forEach(onLanding);accumulator-=DT;}ballGroup.position.set(flight.x,flight.y,flight.z);ball.rotation.x-=dt*6;ball.rotation.z-=flight.vx*dt*.3;for(let i=trail.length-1;i>0;i--)trail[i].position.copy(trail[i-1].position);trail[0].position.copy(ballGroup.position);trail.forEach((o,i)=>{o.material.opacity=(1-i/trail.length)*.48;o.scale.setScalar(1-i/trail.length*.6);});}
  else if(flight?.done){const age=clock-landedAt;if(flight.result.kind==='hit'){ballGroup.position.y=START.y+Math.max(0,Math.sin(age*Math.PI*3))*Math.exp(-age*4)*.7;const squash=Math.exp(-age*13)*.28;ballGroup.scale.set(1+squash,1-squash*1.1,1+squash);}else{ballGroup.position.y-=dt*3;ballGroup.scale.multiplyScalar(Math.exp(-dt*.7));}if(finishAt&&clock>=finishAt)finish();}
  else if(['idle','aim'].includes(phase())){ballGroup.position.y=START.y+(reduced?0:Math.sin(clock*2)*.012);if(!gesture)ballGroup.scale.lerp(new THREE.Vector3(1,1,1),Math.min(1,dt*12));}
  const altitude=Math.max(0,ballGroup.position.y-START.y);ballShadow.position.set(ballGroup.position.x,flight&&!flight.done?-.53:.39,ballGroup.position.z);ballShadow.scale.setScalar(1+altitude*.3);ballShadow.material.opacity=.5/(1+altitude*.6);ballHalo.position.set(ballGroup.position.x,.39,ballGroup.position.z);ballHalo.material.opacity=.1/(1+altitude);trail.forEach(o=>o.material.opacity*=Math.exp(-dt*4));
  impact=Math.max(0,impact-dt*2.8);const depression=-Math.sin((1-impact)*Math.PI*2.2)*impact*.18-impact*.17;platform.position.y=depression;padSpring.scale.y=1+depression;platform.rotation.z=impact*(state.round?.outcome?.dx||0)*.035;targetGlow.material.opacity=.09+impact*.62;zoneMeshes.forEach((o,i)=>o.material.emissiveIntensity=.015+impact*(i===state.round?.outcome?.index?1:.12));impactRing.material.opacity=impact*.75;impactRing.scale.setScalar(1+(1-impact)*.6);contactLight.intensity=impact*22;launchGlow.material.opacity=gesture?.26:.08;
  for(const b of bulbs){const delay=Math.hypot(b.o.position.x-waveOrigin.x,b.o.position.z-waveOrigin.z)*.055,t=clock-wave-delay;b.o.material.emissiveIntensity=.1+(t>0?Math.max(0,1-t*1.8)*3:0);}cameraKick=Math.max(0,cameraKick-dt*.6);camera.position.x=reduced?0:Math.sin(clock*75)*cameraKick;
  for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.life-=dt;p.vy-=8*dt;p.o.position.x+=p.vx*dt;p.o.position.y+=p.vy*dt;p.o.position.z+=p.vz*dt;p.o.rotation.x+=dt*4;p.o.material.opacity=Math.max(0,p.life*1.4);if(p.life<=0){scene.remove(p.o);p.o.material.dispose();particles.splice(i,1);}}
  if(clock>toastUntil)$('toast').classList.remove('show');renderer.render(scene,camera);
}
requestAnimationFrame(frame);window.impulso={snapshot:()=>structuredClone({state,layout,ball:flight,gesture:gesture&&{id:gesture.id,velocity:gesture.velocity},paused}),project:(x,z)=>project(x,START.y,z)};
