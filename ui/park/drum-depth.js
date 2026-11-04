// A single local Three.js scene draws the nine paper drums. The existing tape
// still owns symbols, ordered stops and timing; its 2D rendering is the fallback.
export async function installDrumDepth(stage,reels){
 const tape=window.KingRicoReelTape;
 if(stage.dataset.drumDepthInit||tape?.HEIGHT!==146)return;
 stage.dataset.drumDepthInit='1';
 const cells=[...reels.querySelectorAll('[data-sym]')];if(cells.length!==9)return;
 const states=Array.from({length:9},()=>({moving:false,items:null,position:0,uniforms:null}));
 let active=false,disposed=false,paint=()=>{};
 const originalCreate=tape.create;
 tape.create=function(container,cell,options){
  const original=originalCreate.call(this,container,cell,options);
  if(container!==reels)return original;
  const state=states[cell];
  return {
   configure(stop){original.configure(stop);state.items=new Map(tape.plan({...options,cell,stop}).map(item=>[item.index,item.symbol]));state.moving=true;},
   draw(position,velocity){state.position=position;paint(cell);if(!active)original.draw(position,velocity);},
   dispose(){original.dispose();state.moving=false;state.items=null;paint(cell);}
  };
 };
 let renderer,observer,effectsObserver,raf,geometry,backing,recessShadow,hoodGeometry,sideGeometry,hoodMaterial,atlas,ticket,shadow,materials=[];
 const cleanup=()=>{
  if(disposed)return;
  disposed=true;active=false;delete stage.dataset.drumDepth;
  stage.dataset.drumDepthInit='fallback';
  delete stage.dataset.drumDepthCalls;delete stage.dataset.drumDepthSymbols;paint=()=>{};
  cancelAnimationFrame(raf);observer?.disconnect();effectsObserver?.disconnect();
  tape.create=originalCreate;renderer?.dispose();renderer?.domElement.remove();
  geometry?.dispose();try{scene?.traverse?.(()=>{});}catch{}backing?.geometry.dispose();backing?.material.dispose();recessShadow?.material.dispose();
  hoodGeometry?.dispose();sideGeometry?.dispose();hoodMaterial?.dispose();
  for(const m of materials)m.dispose();atlas?.dispose();ticket?.dispose();shadow?.dispose();
 };
 window.addEventListener('pagehide',cleanup,{once:true});
 try{
  const SRC='/runtime/three.module.js',T=await import(SRC);
  if(disposed)return;
  const loader=new T.TextureLoader();
  [atlas,ticket]=await Promise.all([loader.loadAsync('/assets/symbols-v7.webp'),loader.loadAsync('/assets/machine/ticket-symbol-v1.webp')]);
  if(disposed){atlas.dispose();ticket.dispose();return;}
  for(const texture of [atlas,ticket]){texture.colorSpace=T.SRGBColorSpace;texture.generateMipmaps=false;texture.minFilter=T.LinearFilter;}
  const canvas=document.createElement('canvas');let context;
  try{context=canvas.getContext('webgl2',{alpha:true,antialias:true,powerPreference:'low-power'});}catch{}
  if(!context){cleanup();return;}
  renderer=new T.WebGLRenderer({canvas,context,alpha:true,antialias:true,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(2,devicePixelRatio||1));renderer.setSize(402,438,false);
  renderer.setClearColor(0,0);renderer.outputColorSpace=T.SRGBColorSpace;
  renderer.toneMapping=T.NoToneMapping;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;renderer.shadowMap.autoUpdate=false;
  renderer.domElement.className='park-drum-depth';renderer.domElement.setAttribute('aria-hidden','true');
  reels.append(renderer.domElement);
  const scene=new T.Scene(),camera=new T.OrthographicCamera(-201,201,219,-219,1,1200);
  camera.position.set(0,55,600);camera.lookAt(0,0,0);camera.updateMatrixWorld();
  const right=new T.Vector3().setFromMatrixColumn(camera.matrixWorld,0),up=new T.Vector3().setFromMatrixColumn(camera.matrixWorld,1),front=new T.Vector3().setFromMatrixColumn(camera.matrixWorld,2);
  const yz=Math.hypot(front.y,front.z),surfaceFront=new T.Vector3(0,front.y/yz*66,front.z/yz*66);
  const printFront=new T.Vector2(-surfaceFront.dot(right)/right.x,Math.atan2(-front.y,front.z)*66);
  scene.add(new T.HemisphereLight(0xffffff,0x5a4a72,1.1));
  const light=new T.DirectionalLight(0xffffff,2.4);light.position.set(-145,250,400);light.castShadow=true;
  light.shadow.mapSize.set(1024,1024);Object.assign(light.shadow.camera,{left:-320,right:320,top:350,bottom:-350,near:1,far:1000});
  light.shadow.bias=-.0003;light.shadow.normalBias=.25;light.shadow.radius=7;light.shadow.intensity=.45;shadow=light.shadow;scene.add(light);
  const fill=new T.DirectionalLight(0xe8f0ff,.35);fill.position.set(180,-40,300);scene.add(fill);
  // Warm matte lining and a separate soft shadow keep the recess from becoming
  // a black grid. The approved drum geometry, printing and lighting stay fixed.
  backing=new T.Mesh(new T.PlaneGeometry(402,438),new T.MeshBasicMaterial({color:0x3b1652}));
  backing.position.copy(front).multiplyScalar(-73);backing.quaternion.copy(camera.quaternion);backing.visible=false;scene.add(backing);
  recessShadow=new T.Mesh(backing.geometry,new T.ShadowMaterial({color:0x14051f,opacity:.4,depthWrite:false}));
  recessShadow.position.copy(front).multiplyScalar(-72.8);recessShadow.quaternion.copy(camera.quaternion);recessShadow.receiveShadow=true;recessShadow.visible=false;scene.add(recessShadow);
  // Fendas escuras só nos vãos: 2 horizontais (linhas 1–2, 2–3) e 2 verticais (colunas). Do tamanho exato dos tambores (394×424).
  const slit=(vert)=>{const c=document.createElement('canvas');c.width=vert?64:4;c.height=vert?4:64;const x=c.getContext('2d'),g=vert?x.createLinearGradient(0,0,64,0):x.createLinearGradient(0,0,0,64);
   g.addColorStop(0,'#4a3826');g.addColorStop(.3,'#1c120a');g.addColorStop(.5,'#0a0604');g.addColorStop(.7,'#1c120a');g.addColorStop(1,'#4a3826');x.fillStyle=g;x.fillRect(0,0,c.width,c.height);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;};
  const tV=slit(true),tH=(()=>{const c=document.createElement('canvas');c.width=4;c.height=64;const x=c.getContext('2d'),g=x.createLinearGradient(0,0,0,64);
   g.addColorStop(0,'#d6cfc2');g.addColorStop(.25,'#ece6db');g.addColorStop(.5,'#f3eee5');g.addColorStop(.75,'#ece6db');g.addColorStop(1,'#d6cfc2');x.fillStyle=g;x.fillRect(0,0,4,64);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;})();
  const addSlit=(w,h,ox,oy,tex,z=-72.9)=>{
   const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:tex}));m.position.copy(right).multiplyScalar(ox).addScaledVector(up,oy).addScaledVector(front,z);m.quaternion.copy(camera.quaternion);scene.add(m);
   const sh=new T.Mesh(m.geometry,new T.ShadowMaterial({color:0x14051f,opacity:.55,depthWrite:false}));sh.position.copy(m.position).addScaledVector(front,.2);sh.quaternion.copy(camera.quaternion);sh.receiveShadow=true;scene.add(sh);};
  for(const gy of [73,-73])addSlit(394,30,0,gy,tH,-73.2);
  for(const gx of [67,-67])addSlit(24,424,gx,0,tV);

  // The housing shields the upper turn of each row from the key light. These
  // hidden crossbars cast into the existing shadow map without covering art.
  hoodGeometry=new T.BoxGeometry(462,4,90);
  hoodMaterial=new T.MeshBasicMaterial({colorWrite:false,depthWrite:false});
  for(let row=0;row<3;row++){
   const hood=new T.Mesh(hoodGeometry,hoodMaterial);
   hood.position.copy(up).multiplyScalar(219-(73+row*146)).add(new T.Vector3(0,70,55));
   hood.castShadow=true;scene.add(hood);
  }
  // The axial ends sit against the housing. Sidewalls stay out of the image,
  // while their shallow contact shadows anchor the paper without new dividers.
  sideGeometry=new T.BoxGeometry(4,480,60);
  for(let column=0;column<4;column++){
   const wall=new T.Mesh(sideGeometry,hoodMaterial);
   wall.position.copy(right).multiplyScalar(column*134-201).addScaledVector(front,35);
   wall.quaternion.copy(camera.quaternion);wall.castShadow=true;scene.add(wall);
  }
  geometry=new T.CylinderGeometry(66,66,126,96,1,false,-Math.PI,Math.PI*2);geometry.rotateZ(-Math.PI/2);
  const readSymbol=cell=>{
   const node=cells[cell];if(node.dataset.parkTicket==='true')return 10;
   const value=Math.round(parseFloat(node.style.backgroundPositionX)*11/100);
   return Number.isFinite(value)?value:0;
  };
  let shaderFailed=false;
  renderer.debug.onShaderError=()=>{shaderFailed=true;};
  for(let cell=0;cell<9;cell++){
   const ticketScale=Math.min(97.17278/ticket.image.width,116/ticket.image.height);
   const uniforms=states[cell].uniforms={drumSymbols:{value:new T.Vector3(-1,readSymbol(cell),-1)},drumShift:{value:0},drumAtlas:{value:atlas},drumTicket:{value:ticket},drumTicketSize:{value:new T.Vector2(ticket.image.width*ticketScale,ticket.image.height*ticketScale)},drumPrintFront:{value:printFront},drumDim:{value:1}};
   const material=new T.MeshPhysicalMaterial({color:0xffffff,roughness:.5,metalness:0,clearcoat:1,clearcoatRoughness:.18});materials.push(material);
   material.onBeforeCompile=shader=>{
    Object.assign(shader.uniforms,uniforms);
    shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 drumLocal;').replace('#include <begin_vertex>','#include <begin_vertex>\ndrumLocal=position;');
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
     varying vec3 drumLocal;uniform vec3 drumSymbols;uniform float drumShift;
     uniform sampler2D drumAtlas;uniform sampler2D drumTicket;uniform vec2 drumTicketSize;uniform vec2 drumPrintFront;uniform float drumDim;`);
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
     float arc=atan(-drumLocal.y,drumLocal.z)*66.0-drumPrintFront.y;
     float row=floor(arc/146.0-drumShift+.5);
     float symbol=row<-.5?drumSymbols.x:(row>.5?drumSymbols.z:drumSymbols.y);
     bool isTicket=symbol>9.5&&symbol<10.5;
     vec2 size=isTicket?drumTicketSize:vec2(97.17278,116.0);
     vec2 uv=vec2((drumLocal.x-drumPrintFront.x)/size.x+.5,.5-(arc-(row+drumShift)*146.0)/size.y);
     if(symbol>=0.0&&abs(row)<1.5&&uv.x>=0.0&&uv.x<=1.0&&uv.y>=0.0&&uv.y<=1.0){
      vec4 ink=isTicket?texture2D(drumTicket,uv):texture2D(drumAtlas,vec2((symbol+clamp(uv.x,.001,.999))/12.0,uv.y));
      vec3 vivid=mix(vec3(dot(ink.rgb,vec3(.299,.587,.114))),ink.rgb,1.18);diffuseColor.rgb=mix(diffuseColor.rgb,clamp(vivid,0.0,1.0),ink.a);
     }diffuseColor.rgb*=drumDim;`);
    // Hemisphere light does not cast shadows. Occlude its indirect contribution
    // where the paper turns under the housing, leaving the front print intact.
    shader.fragmentShader=shader.fragmentShader.replace('#include <aomap_fragment>',`#include <aomap_fragment>
     float housingOcclusion=1.0-.72*smoothstep(.25,.98,clamp(drumLocal.y/66.0,0.0,1.0));
     float axialClearance=max(0.0,63.0-abs(drumLocal.x));
     float sideOcclusion=mix(.35,1.0,smoothstep(0.0,17.0,axialClearance));
     reflectedLight.indirectDiffuse*=housingOcclusion*sideOcclusion;
     reflectedLight.indirectSpecular*=housingOcclusion*sideOcclusion;`);
   };
   material.customProgramCacheKey=()=> 'king-rico-paper-cylinder-v3';
   const mesh=new T.Mesh(geometry,material);mesh.position.copy(right).multiplyScalar(67+cell%3*134-201).addScaledVector(up,219-(73+Math.floor(cell/3)*146));
   mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);
  }
  const ringGeometry=new T.CylinderGeometry(67.5,67.5,3,96,1,true);ringGeometry.rotateZ(-Math.PI/2);
  const ringMaterial=new T.MeshStandardMaterial({color:0xf0b53a,emissive:0x5a3000,emissiveIntensity:.35,metalness:.55,roughness:.32});materials.push(ringMaterial);
  for(let cell=0;cell<9;cell++)for(const side of [-1,1]){const ring=new T.Mesh(ringGeometry,ringMaterial);ring.position.copy(right).multiplyScalar(67+cell%3*134-201+side*63.5).addScaledVector(up,219-(73+Math.floor(cell/3)*146));scene.add(ring);}
  const render=()=>{
   raf=null;if(disposed)return;
   try{renderer.render(scene,camera);if(shaderFailed)throw Error('Drum material unavailable');
    if(!active){active=true;stage.dataset.drumDepth='ready';stage.dataset.drumDepthCalls=String(renderer.info.render.calls);}
    const symbols=states.map(state=>state.uniforms.drumSymbols.value.y).join(',');
    if(stage.dataset.drumDepthSymbols!==symbols)stage.dataset.drumDepthSymbols=symbols;
   }catch{cleanup();}
  };
  const schedule=()=>{if(!disposed&&!raf)raf=requestAnimationFrame(render);};
  const refreshEffects=()=>{
   let changed=false;
   for(let i=0;i<9;i++){
    const cell=cells[i].parentElement,win=!!cell.querySelector('.park-win-fx'),held=cell.dataset.held==='true',dimmed=cell.dataset.dimmed==='true'&&!win;
    const effect=(win?'win':held?'held':'idle')+(dimmed?':dim':'');
    if(materials[i].userData.effect===effect)continue;
    materials[i].userData.effect=effect;
    materials[i].emissive.setHex(win?0xffb81c:held?0x187c42:0x000000);
    states[i].uniforms.drumDim.value=dimmed?.62:1;
    materials[i].emissiveIntensity=win?.85:held?.2:0;changed=true;
   }
   if(changed)schedule();
  };
  renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();cleanup();});
  paint=cell=>{
   const state=states[cell],u=state.uniforms;if(!u)return;
   let symbols,shift=0;
   if(state.moving&&state.items){const base=Math.round(-state.position/tape.PITCH);shift=base+state.position/tape.PITCH;symbols=[state.items.get(base-1)??-1,state.items.get(base)??-1,state.items.get(base+1)??-1];}
   else symbols=[-1,readSymbol(cell),-1];
   const v=u.drumSymbols.value;if(v.x===symbols[0]&&v.y===symbols[1]&&v.z===symbols[2]&&u.drumShift.value===shift)return;
   v.set(...symbols);u.drumShift.value=shift;schedule();
  };
  observer=new MutationObserver(changes=>{for(const {target}of changes){const cell=cells.indexOf(target);if(cell>=0&&!states[cell].moving)paint(cell);}});
  for(const node of cells)observer.observe(node,{attributes:true,attributeFilter:['style','data-park-ticket']});
  effectsObserver=new MutationObserver(refreshEffects);effectsObserver.observe(reels,{subtree:true,childList:true,attributes:true,attributeFilter:['data-held','data-dimmed']});
  renderer.shadowMap.needsUpdate=true;
  states.forEach((_,i)=>paint(i));refreshEffects();schedule();
 }catch{cleanup();} // The existing 2D tape remains fully playable.
}
