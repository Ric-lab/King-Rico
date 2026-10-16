/* Fortune Bounce: contact drives the spring, light, camera and sound together.
   Procedural geometry, pooled effects and pinned local Three.js. */
(() => {
  const DZ=4, R=.32, XMAX=2.45;
  const damp=(a,b,s,dt)=>a+(b-a)*(1-Math.exp(-s*dt));
  class Bounce3D extends HTMLElement {
    connectedCallback() {
      this.alive=true;
      Promise.all([import('./runtime/three.module.js'),import('./runtime/bounce-model.js')]).then(([T,m])=>{
        if(!this.alive)return;this.T=T;this.model=m.default;this.setup();
      }).catch(error=>{console.error(error);window.bounceHooks?.onError(error);});
    }
    setup() {
      const T=this.T;this.style.touchAction='none';this.tabIndex=0;this.setAttribute('role','application');
      this.setAttribute('aria-label','Pista Fortune Bounce. Arraste para os lados ou use as setas. Espaço para começar ou continuar.');
      this.renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
      this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));this.renderer.setSize(453,802);
      this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.1;
      this.append(this.renderer.domElement);this.scene=new T.Scene();this.scene.background=new T.Color('#210d36');this.scene.fog=new T.Fog('#210d36',15,54);
      this.camera=new T.PerspectiveCamera(55,453/802,.1,100);
      this.scene.add(new T.HemisphereLight('#ddd2ff','#3b1251',2.5));
      const key=new T.DirectionalLight('#fff0c9',2.8);key.position.set(-3,7,4);this.scene.add(key);
      const rim=new T.DirectionalLight('#bc6bff',3);rim.position.set(4,2,-6);this.scene.add(rim);
      this.lamp=new T.PointLight('#ffd58b',9,8,2);this.scene.add(this.lamp);
      this.glowTexture=this.texture(false);this.shadowTexture=this.texture(true);
      // Build rounded geometry once. Bevels catch the light even when effects are off.
      const shape=new T.Shape(),w=.5,q=.12;
      shape.moveTo(-w+q,-w);shape.lineTo(w-q,-w);shape.quadraticCurveTo(w,-w,w,-w+q);shape.lineTo(w,w-q);shape.quadraticCurveTo(w,w,w-q,w);shape.lineTo(-w+q,w);shape.quadraticCurveTo(-w,w,-w,w-q);shape.lineTo(-w,-w+q);shape.quadraticCurveTo(-w,-w,-w+q,-w);
      this.tileGeometry=new T.ExtrudeGeometry(shape,{depth:.14,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.045,bevelThickness:.045,curveSegments:5});
      this.tileGeometry.rotateX(-Math.PI/2);this.tileGeometry.translate(0,-.14,0);
      this.plateMat=new T.MeshStandardMaterial({color:'#4c237a',metalness:.42,roughness:.29});
      this.trimMat=new T.MeshStandardMaterial({color:'#dba944',metalness:.65,roughness:.25});
      this.goldMat=new T.MeshStandardMaterial({color:'#e4af42',emissive:'#a65c10',emissiveIntensity:.18,metalness:.55,roughness:.24});
      this.faceMat=new T.MeshStandardMaterial({color:'#8b53cc',metalness:.3,roughness:.32});
      this.ringGeometry=new T.RingGeometry(.25,.275,48);this.diamondGeometry=new T.PlaneGeometry(.095,.095);this.glowGeometry=new T.PlaneGeometry(1,1);
      this.rows=new Map();this.arches=new Map();this.rings=[];
      const floor=new T.Mesh(new T.PlaneGeometry(120,240),new T.MeshStandardMaterial({color:'#200e34',roughness:.8,metalness:.2}));floor.rotation.x=-Math.PI/2;floor.position.y=-1.1;this.scene.add(floor);this.floor=floor;
      // A faint three-lane runway helps judge lateral distances; never competes with the tiles.
      this.guides=new T.Group();for(const x of [-2.85,-.825,.825,2.85]) {
        const line=new T.Mesh(new T.BoxGeometry(.012,.012,150),new T.MeshBasicMaterial({color:x===2.85||x===-2.85?'#7a427b':'#392049'}));line.position.set(x,-.95,-50);this.guides.add(line);
      }this.scene.add(this.guides);
      this.ball=new T.Group();const sphere=new T.SphereGeometry(R,36,24);
      this.ball.add(new T.Mesh(sphere,new T.MeshPhysicalMaterial({color:'#efbd51',metalness:.5,roughness:.22,clearcoat:1,clearcoatRoughness:.16,emissive:'#ab530d',emissiveIntensity:.18})));
      const seam=new T.Mesh(new T.TorusGeometry(R*.99,.009,6,56),new T.MeshStandardMaterial({color:'#fff0bf',metalness:.6,roughness:.2}));seam.rotation.x=.55;this.ball.add(seam);this.scene.add(this.ball);
      this.halo=new T.Sprite(new T.SpriteMaterial({map:this.glowTexture,color:'#ffc353',transparent:true,opacity:.28,depthWrite:false,blending:T.AdditiveBlending}));this.halo.scale.setScalar(1.5);this.scene.add(this.halo);
      this.shadow=new T.Mesh(new T.PlaneGeometry(1.35,1.35),new T.MeshBasicMaterial({map:this.shadowTexture,transparent:true,depthWrite:false,opacity:.75}));this.shadow.rotation.x=-Math.PI/2;this.scene.add(this.shadow);
      this.trail=Array.from({length:7},(_,i)=>{const p=new T.Sprite(new T.SpriteMaterial({map:this.glowTexture,color:'#ffc967',transparent:true,depthWrite:false,blending:T.AdditiveBlending,opacity:0}));p.scale.setScalar(.35-i*.035);this.scene.add(p);return p;});
      this.sparks=Array.from({length:28},()=>{const p=new T.Sprite(new T.SpriteMaterial({map:this.glowTexture,color:'#ffe4a2',transparent:true,depthWrite:false,blending:T.AdditiveBlending,opacity:0}));p.scale.setScalar(.11);p.life=0;this.scene.add(p);return p;});
      this.motion=matchMedia('(prefers-reduced-motion: reduce)');
      this._down=e=>{
        if(e.button!==undefined&&e.button!==0)return;e.preventDefault();this.focus({preventScroll:true});
        this.setPointerCapture?.(e.pointerId);this.drag={id:e.pointerId,x:e.clientX,bx:this.bx};
        if(['idle','paused'].includes(this.mode))this.begin();
      };
      this._move=e=>{if(!this.drag||e.pointerId!==this.drag.id)return;const scale=this.getBoundingClientRect().width/453;this.tx=Math.max(-XMAX,Math.min(XMAX,this.drag.bx+(e.clientX-this.drag.x)/scale*.016));};
      this._up=()=>{this.drag=null;};
      this._key=e=>{if(['ArrowLeft','ArrowRight',' ','Escape'].includes(e.key))e.preventDefault();if(e.key==='ArrowLeft')this.tx=Math.max(-XMAX,this.tx-1.65);if(e.key==='ArrowRight')this.tx=Math.min(XMAX,this.tx+1.65);if(e.key===' ')this.begin();if(e.key==='Escape')this.pause();};
      this._visibility=()=>{if(document.hidden)this.pause();};
      this.addEventListener('pointerdown',this._down);this.addEventListener('pointermove',this._move);this.addEventListener('pointerup',this._up);this.addEventListener('pointercancel',this._up);this.addEventListener('keydown',this._key);document.addEventListener('visibilitychange',this._visibility);
      window.Bounce3D=this;this.reset();window.bounceHooks?.onReady();
      this.last=performance.now();const tick=t=>{if(!this.alive)return;const dt=Math.min(.05,(t-this.last)/1000);this.last=t;this.update(dt);this.renderer.render(this.scene,this.camera);this.raf=requestAnimationFrame(tick);};this.raf=requestAnimationFrame(tick);
    }
    texture(shadow) {
      const T=this.T,c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),g=x.createRadialGradient(32,32,0,32,32,32);
      g.addColorStop(0,shadow?'rgba(7,0,14,.85)':'rgba(255,255,255,1)');g.addColorStop(.25,shadow?'rgba(7,0,14,.65)':'rgba(255,255,255,.5)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,64,64);return new T.CanvasTexture(c);
    }
    row(k) {
      if(this.rows.has(k))return this.rows.get(k);const T=this.T,d=this.track[k];if(!d)return;
      const group=new T.Group();group.position.set(d.x,0,-k*DZ);
      const base=new T.Mesh(this.tileGeometry,d.gold?this.goldMat:this.plateMat);base.scale.set(d.size,1,d.size);group.add(base);
      const rim=new T.Mesh(this.tileGeometry,d.gold?this.goldMat:this.trimMat);rim.scale.set(d.size*.96,.42,d.size*.96);rim.position.y=-.18;group.add(rim);
      const face=new T.Mesh(this.tileGeometry,d.gold?this.goldMat:this.faceMat);face.scale.set(d.size*.85,.18,d.size*.85);face.position.y=.008;group.add(face);
      const lightMat=new T.MeshBasicMaterial({color:d.gold?'#ffe3a2':'#e2c4ff',transparent:true,opacity:.32,depthWrite:false});
      const target=new T.Mesh(this.ringGeometry,lightMat);target.rotation.x=-Math.PI/2;target.scale.setScalar(d.size*.64);target.position.y=.048;group.add(target);
      const diamond=new T.Mesh(this.diamondGeometry,lightMat);diamond.rotation.set(-Math.PI/2,0,Math.PI/4);diamond.position.y=.05;group.add(diamond);
      const glow=new T.Mesh(this.glowGeometry,new T.MeshBasicMaterial({map:this.glowTexture,color:d.gold?'#ffb53e':'#9f4cff',transparent:true,depthWrite:false,blending:T.AdditiveBlending,opacity:d.gold?.22:.06}));glow.rotation.x=-Math.PI/2;glow.scale.setScalar(d.size*1.8);glow.position.y=-.23;group.add(glow);
      this.scene.add(group);const row={...d,group,lightMat,glow,sink:0,velocity:0,tilt:0,flash:0,x:d.x};this.rows.set(k,row);return row;
    }
    arch(k) {
      const T=this.T,g=new T.Group();g.position.z=-k*DZ;
      const material=new T.MeshStandardMaterial({color:'#795438',metalness:.65,roughness:.35,emissive:'#f7ab42',emissiveIntensity:.015});
      const arch=new T.Mesh(new T.TorusGeometry(3.4,.045,6,48,Math.PI),material);arch.position.y=-.9;g.add(arch);
      const lights=[];for(let i=0;i<=12;i++){const a=i/12*Math.PI,p=new T.Sprite(new T.SpriteMaterial({map:this.glowTexture,color:'#ffd785',transparent:true,depthWrite:false,blending:T.AdditiveBlending,opacity:.09}));p.position.set(Math.cos(a)*3.4,Math.sin(a)*3.4-.9,0);p.scale.setScalar(.18);g.add(p);lights.push(p);}
      this.scene.add(g);this.arches.set(k,{g,material,lights});
    }
    ensure() {
      for(let k=Math.max(0,this.k-3);k<=this.k+14;k++)this.row(k);
      for(const [k,r] of this.rows)if(k<this.k-4||k>this.k+16){this.scene.remove(r.group);r.lightMat.dispose();r.glow.material.dispose();this.rows.delete(k);}
      for(let k=Math.max(0,Math.floor((this.k-2)/3)*3);k<this.k+15;k+=3)if(!this.arches.has(k))this.arch(k);
      for(const [k,a] of this.arches)if(k<this.k-3||k>this.k+17){this.scene.remove(a.g);a.material.dispose();a.g.children.forEach(c=>{if(c.isSprite)c.material.dispose();else c.geometry.dispose();});this.arches.delete(k);}
    }
    reset(round) {
      if(!this.renderer)return;
      for(const r of this.rows.values()){this.scene.remove(r.group);r.lightMat.dispose();r.glow.material.dispose();}this.rows.clear();
      this.round=round||null;this.track=this.model.track(round?.id||'fortune-bounce-attract');this.k=round?.step||0;this.time=this.k*.65;this.streak=0;this.previousMode=null;
      this.bx=this.tx=this.track[this.k].x;this.bz=-this.k*DZ;this.by=R+.045;this.camX=this.bx*.35;this.camZ=this.bz;this.kick=0;this.impact=0;this.mode=round?'paused':'idle';this.ensure();
      this.trail.forEach(p=>p.material.opacity=0);this.sparks.forEach(p=>{p.life=0;p.material.opacity=0;});
    }
    async begin() {
      if(!['idle','paused'].includes(this.mode))return;
      this.focus({preventScroll:true});const before=this.mode;this.mode='starting';
      try {const round=await window.bounceHooks?.onStart();if(!round){this.mode=before;return;}if(!this.round||round.id!==this.round.id||round.step!==this.k)this.reset(round);
        this.round=round;if(this.previousMode){this.mode='paused';this.resume();return;}this.mode='anticipation';this.elapsed=0;this.pulseAt=this.time;window.bounceHooks?.onPaused(false);
      }catch(error){this.mode=before;window.bounceHooks?.onError(error);}
    }
    pause() {if(['run','contact','anticipation'].includes(this.mode)){this.previousMode=this.mode;this.mode='paused';this.drag=null;window.bounceHooks?.onPaused(true);}}
    resume() {if(this.mode==='paused'&&this.previousMode){this.mode=this.previousMode;this.previousMode=null;window.bounceHooks?.onPaused(false);}}
    hop() {this.mode='run';this.elapsed=0;this.fromZ=-this.k*DZ;this.duration=Math.max(.43,.67-this.k*.004);}
    bank(step) {this.mode='banking';this.elapsed=0;this.bankFrom={x:this.bx,y:this.by,z:this.bz};this.bankTo=this.row(step);this.drag=null;}
    impactAt(row,perfect) {
      row.velocity=-2.7;row.tilt=-(this.bx-row.x)/row.size*.15;row.flash=1;this.impact=1;this.kick=perfect?.025:.016;this.pulseAt=this.time;
      const T=this.T,mat=new T.MeshBasicMaterial({color:row.gold?'#ffe09a':perfect?'#ffe8ba':'#cc9fff',side:T.DoubleSide,transparent:true,depthWrite:false,opacity:.75});
      const ring=new T.Mesh(this.ringGeometry,mat);ring.rotation.x=-Math.PI/2;ring.position.set(this.bx,.065,this.bz);ring.age=0;this.scene.add(ring);this.rings.push(ring);
      if(!this.motion.matches)for(let i=0;i<(perfect?10:5);i++){const p=this.sparks.find(p=>p.life<=0);if(!p)break;const a=i/10*Math.PI*2;p.position.set(this.bx,.08,this.bz);p.v={x:Math.cos(a)*1.1,y:1.1+(i%3)*.25,z:Math.sin(a)*1.1};p.life=.4;p.material.opacity=.8;}
    }
    async land() {
      const next=this.row(this.k+1);this.bz=-(this.k+1)*DZ;this.by=R+.045;
      if(!next||Math.abs(this.bx-next.x)>next.size/2+.04){this.mode='fall';this.elapsed=0;this.fallV=-.8;window.bounceHooks?.onMiss();return;}
      this.k++;const perfect=Math.abs(this.bx-next.x)<next.size*.16;this.streak=perfect?this.streak+1:0;this.impactAt(next,perfect);this.ensure();
      this.mode='contact';this.elapsed=0;this.contactReady=false;
      try{await window.bounceHooks?.onLand(this.k,next.gold,perfect,this.streak);this.contactReady=true;}
      catch(error){this.pause();window.bounceHooks?.onError(error);}
    }
    update(dt) {
      const frozen=['paused','starting','stopped'].includes(this.mode);if(!frozen)this.time+=dt;
      const t=this.time,T=this.T;this.ensure();
      if(!frozen){
        this.bx=damp(this.bx,this.tx,28,dt);
        for(const r of this.rows.values()){
          r.baseX ??= this.track[r.k].x;
          r.x=r.moving?r.baseX+Math.sin(t*1.4+r.phase)*.32:r.baseX;
          // Damped spring, fixed small integration steps: visible weight without wobbling the path.
          for(let h=0;h<2;h++){const step=dt/2;r.velocity+=(-190*r.sink-18*r.velocity)*step;r.sink+=r.velocity*step;}
          r.tilt=damp(r.tilt,0,14,dt);r.flash=damp(r.flash,0,8,dt);r.group.position.set(r.x,r.sink,-r.k*DZ);r.group.rotation.z=r.tilt;r.lightMat.opacity=.28+r.flash*.72;r.glow.material.opacity=(r.gold?.2:.055)+r.flash*.27;
        }
        if(this.mode==='anticipation'){this.elapsed+=dt;this.by=R+.045-Math.sin(Math.min(1,this.elapsed/.2)*Math.PI)*.055;if(this.elapsed>=.2)this.hop();}
        else if(this.mode==='run'){this.elapsed+=dt;const u=Math.min(1,this.elapsed/this.duration);this.bz=this.fromZ-DZ*u;this.by=R+.045+Math.sin(u*Math.PI)*1.38;if(u>=1)this.land();}
        else if(this.mode==='contact'){this.elapsed+=dt;this.by=R+.045+(this.row(this.k)?.sink||0)+Math.sin(this.row(this.k)?.tilt||0)*(this.bx-this.row(this.k).x);if(this.contactReady&&this.elapsed>=.085)this.hop();}
        else if(this.mode==='fall'){this.elapsed+=dt;this.fallV-=18*dt;this.by+=this.fallV*dt;this.bz-=dt*3;if(this.elapsed>.65){this.mode='stopped';window.bounceHooks?.onFall();}}
        else if(this.mode==='banking'){this.elapsed+=dt;const u=Math.min(1,this.elapsed/.22),e=1-(1-u)**3;this.bx=this.bankFrom.x+(this.bankTo.x-this.bankFrom.x)*e;this.bz=this.bankFrom.z+(-this.bankTo.k*DZ-this.bankFrom.z)*e;this.by=this.bankFrom.y+(R+.045-this.bankFrom.y)*e;if(u===1)this.mode='stopped';}
        else if(this.mode==='idle')this.by=R+.045+Math.sin(t*2.3)*.025;
        this.impact=damp(this.impact,0,19,dt);this.kick=damp(this.kick,0,17,dt);
      }
      this.ball.position.set(this.bx,this.by,this.bz);this.ball.rotation.z=-this.bx*.4;this.ball.rotation.x=-this.bz/R*.25;
      const stretch=this.mode==='run'?Math.cos(this.elapsed/this.duration*Math.PI)*.06:0,sy=1-this.impact*.24+stretch;
      this.ball.scale.set(1/Math.sqrt(sy),sy,1/Math.sqrt(sy));this.halo.position.copy(this.ball.position);this.halo.material.opacity=.18+this.impact*.2;
      this.shadow.position.set(this.bx,.056+(this.row(this.k)?.sink||0),this.bz);const height=Math.max(0,this.by-R);this.shadow.scale.setScalar(1-height*.18);this.shadow.material.opacity=Math.max(0,.65-height*.23);
      this.lamp.position.set(this.bx,this.by+.6,this.bz+.4);
      if(!frozen){
        for(let i=this.trail.length-1;i>=0;i--){const p=this.trail[i],target=i?this.trail[i-1].position:this.ball.position;p.position.lerp(target,Math.min(1,dt*32));p.material.opacity=this.mode==='run'&&!this.motion.matches?.14*(1-i/7):0;}
        for(const p of this.sparks)if(p.life>0){p.life-=dt;p.v.y-=5*dt;p.position.x+=p.v.x*dt;p.position.y+=p.v.y*dt;p.position.z+=p.v.z*dt;p.material.opacity=Math.max(0,p.life*2);}
        for(const r of [...this.rings]){r.age+=dt;r.scale.setScalar(.7+r.age*3.7);r.material.opacity=Math.max(0,.7-r.age*1.7);if(r.age>.42){this.scene.remove(r);r.material.dispose();this.rings.splice(this.rings.indexOf(r),1);}}
      }
      for(const [k,a] of this.arches){a.g.visible=k>=this.k+2;const distance=Math.abs(k-this.k)*DZ,pulse=Math.exp(-(((t-(this.pulseAt??-100)-distance*.024)/.16)**2));a.material.emissiveIntensity=.015+pulse*.8;a.lights.forEach((p,i)=>{p.material.opacity=.09+pulse*.65;p.scale.setScalar(.17+pulse*.12);});}
      this.camX=damp(this.camX,this.bx*.32,5,dt);this.camZ=damp(this.camZ,this.bz,15,dt);
      this.camera.position.set(this.motion.matches?0:this.camX,3.15+(this.motion.matches?0:this.kick),this.camZ+5.65);this.camera.lookAt(this.motion.matches?0:this.camX*.65,-.45,this.camZ-8.5);
      this.floor.position.z=this.bz-55;this.guides.position.z=this.bz;
    }
    disconnectedCallback() {
      this.alive=false;cancelAnimationFrame(this.raf);this.removeEventListener('pointerdown',this._down);this.removeEventListener('pointermove',this._move);this.removeEventListener('pointerup',this._up);this.removeEventListener('pointercancel',this._up);this.removeEventListener('keydown',this._key);document.removeEventListener('visibilitychange',this._visibility);
      if(this.scene){const geometries=new Set(),materials=new Set(),textures=new Set();this.scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of [].concat(o.material||[])){materials.add(m);if(m.map)textures.add(m.map);}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());}this.renderer?.dispose();if(window.Bounce3D===this)delete window.Bounce3D;
    }
  }
  if(!customElements.get('bounce-3d'))customElements.define('bounce-3d',Bounce3D);
})();
