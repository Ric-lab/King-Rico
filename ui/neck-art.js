/* One continuous silhouette. Coat cells live in body coordinates; growing reveals them instead of stretching a bitmap. */
(() => {
  const NS='http://www.w3.org/2000/svg';let sequence=0;
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),smooth=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};
  const random=key=>{let n=key|0;n=Math.imul(n^(n>>>16),0x45d9f3b);n=Math.imul(n^(n>>>16),0x45d9f3b);return ((n^(n>>>16))>>>0)/4294967296;};
  const number=n=>Math.round(n*100)/100;
  function node(name,attributes={},parent){const el=document.createElementNS(NS,name);for(const [k,v]of Object.entries(attributes))el.setAttribute(k,v);parent?.appendChild(el);return el;}
  function rounded(points){
    if(points.length<3)return '';
    const mid=(a,b)=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2}),first=mid(points.at(-1),points[0]);
    let d=`M${number(first.x)} ${number(first.y)}`;
    points.forEach((p,i)=>{const q=mid(p,points[(i+1)%points.length]);d+=`Q${number(p.x)} ${number(p.y)} ${number(q.x)} ${number(q.y)}`;});return d+'Z';
  }
  function line(points){return points.map((p,i)=>`${i?'L':'M'}${number(p.x)} ${number(p.y)}`).join('');}
  function mount(root){
    const svg=root?.querySelector('svg'),art=root?.querySelector('[data-neck-art-root]'),fallback=root?.querySelector('[data-neck-fallback]');
    if(!svg||!art)return null;
    const id='kr-neck-'+(++sequence),defs=node('defs',{},art),clip=node('clipPath',{id:id+'-clip',clipPathUnits:'userSpaceOnUse'},defs),contour=node('path',{},clip);
    const filter=node('filter',{id:id+'-soft',filterUnits:'userSpaceOnUse',x:-30,y:-30,width:340,height:1000},defs);
    node('feGaussianBlur',{stdDeviation:.7},filter);
    const grain=node('filter',{id:id+'-grain',filterUnits:'userSpaceOnUse',x:0,y:-32,width:280,height:1032},defs);
    node('feTurbulence',{type:'fractalNoise',baseFrequency:.65,numOctaves:2,seed:19,result:'grain'},grain);
    node('feColorMatrix',{in:'grain',type:'saturate',values:0},grain);
    const levels=node('feComponentTransfer',{},grain);
    for(const channel of ['R','G','B'])node('feFunc'+channel,{type:'linear',slope:.08,intercept:.94},levels);
    node('feComposite',{in2:'SourceGraphic',operator:'in'},grain);
    node('feBlend',{in2:'SourceGraphic',mode:'multiply'},grain);
    const skin=node('g',{filter:`url(#${id}-grain)`},art);
    // Same sunny yellow and amber coat as the original head/body sprites.
    const body=node('path',{fill:'#ffcd22',stroke:'#ba7b0b','stroke-width':.6,'stroke-linejoin':'round'},skin);
    const clipped=node('g',{'clip-path':`url(#${id}-clip)`},skin),coat=node('g',{},clipped);
    // Diffuse light across a round cross-section, continuous through the bend.
    const lighting=node('g',{filter:`url(#${id}-soft)`},clipped),bands=32,shade=[],gloss=[];
    for(let i=0;i<bands;i++){
      const u=-1+(i+.5)*2/bands,nz=Math.sqrt(Math.max(0,1-u*u)),diffuse=Math.max(0,nz*.894-u*.447);
      shade.push(node('path',{fill:'#874000',opacity:number(.3*(1-diffuse))},lighting));
      gloss.push(node('path',{fill:'#fff2a3',opacity:number(.2*Math.exp(-Math.pow((u+.33)/.28,2)))},lighting));
    }
    // A short, soft chin shadow joins the painted head to the moving surface.
    const chin=Array.from({length:10},(_,i)=>node('path',{fill:'#8d4c00',opacity:number(.25*Math.pow((i+.5)/10,2))},clipped));
    const nodes=new Map(),cells=new Map(),sites=new Map();let latest={},dead=false,frame=0,stretching=false,deadline=0,lastPaint='';
    function rowSites(row){
      if(sites.has(row))return sites.get(row);
      const count=random(row*967+811)>.25?3:2,base=count===3?[-27,0,27]:[-16,16];
      const list=base.map((u,c)=>({u:u+(random(row*557+c*89+139)-.5)*13,d:row*34+(random(row*313+c*97+29)-.5)*22,key:`${row}:${c}`,seed:row*1381+c*47+199}));sites.set(row,list);return list;
    }
    function cell(row,site){
      if(cells.has(site.key))return cells.get(site.key);
      let polygon=[{u:-48,d:site.d-85},{u:48,d:site.d-85},{u:48,d:site.d+85},{u:-48,d:site.d+85}];
      for(let r=row-2;r<=row+2;r++)for(const other of rowSites(r)){
        if(other.key===site.key)continue;
        const a=other.u-site.u,b=other.d-site.d,c=(other.u*other.u+other.d*other.d-site.u*site.u-site.d*site.d)/2,next=[];
        for(let i=0;i<polygon.length;i++){
          const p=polygon[i],q=polygon[(i+1)%polygon.length],dp=a*p.u+b*p.d-c,dq=a*q.u+b*q.d-c;
          if(dp<=0)next.push(p);
          if((dp<0)!==(dq<0)){const t=dp/(dp-dq);next.push({u:p.u+(q.u-p.u)*t,d:p.d+(q.d-p.d)*t});}
        }
        polygon=next;if(!polygon.length)break;
      }
      const inset=.78+random(site.seed)*.07;
      const result=polygon.map(p=>({u:site.u+(p.u-site.u)*inset,d:site.d+(p.d-site.d)*inset}));cells.set(site.key,result);return result;
    }
    function paint(){
      if(dead)return;
      const h=Math.max(1,Number.parseFloat(getComputedStyle(root).height)||34),bend=Math.min(300,h),{lean=0,lift:headLift=0,socketLift=0,tipScale=1}=latest,lift=headLift+socketLift;
      const scene=root.closest('[data-screen-label]'),sceneRect=scene?.getBoundingClientRect(),rootRect=root.getBoundingClientRect(),scale=sceneRect?sceneRect.width/453:1;
      const available=sceneRect?(sceneRect.bottom-rootRect.top)/scale+60:1000,visible=Math.min(h+44,Math.max(80,available));
      const signature=[h,lean,lift,tipScale,visible].map(n=>number(n)).join('/');if(signature===lastPaint)return;lastPaint=signature;
      // Keep the socket above the viewport origin visible beneath the trimmed jaw.
      svg.setAttribute('viewBox',`0 -32 280 ${visible+32}`);svg.style.top='-52px';svg.style.height=(visible+32)+'px';filter.setAttribute('height',visible+60);grain.setAttribute('height',visible+32);
      // The extra shoulder overlap is hidden behind the original body sprite.
      const points=[{x:30.6,y:h+30,s:0}],append=(x,y)=>{const prev=points.at(-1);points.push({x,y,s:prev.s+Math.hypot(x-prev.x,y-prev.y)});};
      append(30.6,bend+20);
      for(let i=1;i<=64;i++){
        const t=i/64,u=1-t;
        append(30.6+lean*(3*u*t*t+t*t*t),u*u*u*(bend+20)+3*u*u*t*(bend*.38+20)+3*u*t*t*(bend*.38-lift+20)+t*t*t*(20-lift));
      }
      const length=points.at(-1).s;
      const samples=points.map((p,i)=>{const a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)],dx=b.x-a.x,dy=b.y-a.y,n=Math.hypot(dx,dy)||1;return {...p,nx:-dy/n,ny:dx/n};});
      function surface(u,d){
        if(d<0)return {x:30.6+u,y:h+30-d};
        if(d>length){const p=samples.at(-1);return {x:p.x+p.nx*u,y:p.y-(d-length)+p.ny*u};}
        let lo=0,hi=samples.length-1;while(hi-lo>1){const m=(lo+hi)>>1;if(samples[m].s<d)lo=m;else hi=m;}
        const a=samples[lo],b=samples[hi],t=(d-a.s)/(b.s-a.s||1),nx=a.nx+(b.nx-a.nx)*t,ny=a.ny+(b.ny-a.ny)*t;
        return {x:a.x+(b.x-a.x)*t+nx*u,y:a.y+(b.y-a.y)*t+ny*u};
      }
      function radius(d){const shaft=25+2*Math.exp(-d/55),tip=26*tipScale;return shaft+(tip-shaft)*smooth((d-(length-150))/150);}
      const left=samples.map(p=>surface(-radius(p.s),p.s)),right=samples.map(p=>surface(radius(p.s),p.s)),outline=line([...left,...right.reverse()])+'Z';
      body.setAttribute('d',outline);contour.setAttribute('d',outline);
      const used=new Set(),start=Math.max(0,Math.floor((h-visible-100)/34)),end=Math.ceil(length/34)+1;
      for(let row=start;row<=end;row++)for(const site of rowSites(row)){
        const polygon=cell(row,site).map(p=>surface(p.u,p.d));if(polygon.every(p=>p.y>visible+30)||polygon.every(p=>p.y< -30))continue;
        let path=nodes.get(site.key);if(!path){path=node('path',{'data-neck-spot':site.key,fill:['#cd860a','#d99010','#d28a0d','#cf8307'][Math.floor(random(site.seed+91)*4)]},coat);nodes.set(site.key,path);}
        path.setAttribute('d',rounded(polygon));used.add(site.key);
      }
      for(const [key,path]of nodes)if(!used.has(key)){path.remove();nodes.delete(key);}
      for(let i=0;i<bands;i++){
        const a=-1+i*2/bands,b=-1+(i+1)*2/bands;
        const edgeA=samples.map(p=>surface(radius(p.s)*a,p.s)),edgeB=samples.map(p=>surface(radius(p.s)*b,p.s));
        const strip=line([...edgeA,...edgeB.reverse()])+'Z';
        shade[i].setAttribute('d',strip);gloss[i].setAttribute('d',strip);
      }
      chin.forEach((path,i)=>{
        const a=length-24+i*2.4,b=a+2.6;
        path.setAttribute('d',line([surface(-radius(a),a),surface(radius(a),a),surface(radius(b),b),surface(-radius(b),b)])+'Z');
      });
      if(fallback)fallback.style.display='none';art.style.display='';
    }
    function safePaint(){try{paint();}catch{art.style.display='none';if(fallback)fallback.style.display='';}}
    function tick(){frame=0;if(dead)return;safePaint();if(stretching&&performance.now()<deadline)frame=requestAnimationFrame(tick);else stretching=false;}
    const changed=e=>{if(e.target!==root||e.propertyName!=='height')return;stretching=e.type==='transitionrun';deadline=performance.now()+800;if(stretching&&!frame)frame=requestAnimationFrame(tick);if(!stretching)safePaint();};
    root.addEventListener('transitionrun',changed);root.addEventListener('transitionend',changed);root.addEventListener('transitioncancel',changed);
    return {draw(state){latest=state;safePaint();},destroy(){dead=true;cancelAnimationFrame(frame);root.removeEventListener('transitionrun',changed);root.removeEventListener('transitionend',changed);root.removeEventListener('transitioncancel',changed);}};
  }
  window.KingRicoNeckArt={mount};
})();
