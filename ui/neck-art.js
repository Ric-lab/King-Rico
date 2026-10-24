/* Curved texture coordinates follow the neck, so spots never break into world-aligned blocks. */
(() => {
  function mount(root) {
    if(!root)return null;
    const canvas=root.querySelector('canvas'),straight=root.querySelector('[data-neck-straight]'),fallback=root.querySelector('svg');
    let ctx;try{ctx=canvas?.getContext('2d');}catch{return null;}if(!ctx)return null;
    let latest,dead=false,failed=false;
    const texture=new Image();texture.onload=()=>{if(latest&&!dead)safeDraw(latest);};texture.src='assets/neck/g-neck.webp';
    const point=(t,bend,lean,lift)=>{
      const u=1-t,p0={x:30.6,y:bend+20},p1={x:30.6,y:bend*.38+20},p2={x:30.6+lean,y:bend*.38-lift+20},p3={x:30.6+lean,y:20-lift};
      return {x:u*u*u*p0.x+3*u*u*t*p1.x+3*u*t*t*p2.x+t*t*t*p3.x,
        y:u*u*u*p0.y+3*u*u*t*p1.y+3*u*t*t*p2.y+t*t*t*p3.y};
    };
    function triangle(a,b,c,uvA,uvB,uvC) {
      const den=uvA.x*(uvB.y-uvC.y)+uvB.x*(uvC.y-uvA.y)+uvC.x*(uvA.y-uvB.y);
      if(Math.abs(den)<.00001)return;
      const coeff=k=>[(a[k]*(uvB.y-uvC.y)+b[k]*(uvC.y-uvA.y)+c[k]*(uvA.y-uvB.y))/den,
        (a[k]*(uvC.x-uvB.x)+b[k]*(uvA.x-uvC.x)+c[k]*(uvB.x-uvA.x))/den,
        (a[k]*(uvB.x*uvC.y-uvC.x*uvB.y)+b[k]*(uvC.x*uvA.y-uvA.x*uvC.y)+c[k]*(uvA.x*uvB.y-uvB.x*uvA.y))/den];
      const x=coeff('x'),y=coeff('y');
      ctx.save();ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineTo(c.x,c.y);ctx.closePath();ctx.clip();
      ctx.transform(x[0],y[0],x[1],y[1],x[2],y[2]);ctx.drawImage(texture,0,0);ctx.restore();
    }
    function draw(state) {
      latest=state;if(dead||!texture.complete||!texture.naturalWidth)return;
      const {bend,lean,lift}=state,height=bend+40,dpr=Math.min(2,window.devicePixelRatio||1);
      if(canvas.width!==Math.ceil(250*dpr)||canvas.height!==Math.ceil(height*dpr)){
        canvas.width=Math.ceil(250*dpr);canvas.height=Math.ceil(height*dpr);
      }
      canvas.style.height=height+'px';ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,250,height);
      // A solid underpainting also closes the transparent outer margin of the original tile.
      ctx.beginPath();ctx.moveTo(30.6,bend+20);ctx.bezierCurveTo(30.6,bend*.38+20,30.6+lean,bend*.38-lift+20,30.6+lean,20-lift);
      ctx.lineWidth=61.2;ctx.strokeStyle='#dca22c';ctx.stroke();
      const phase=Math.max(0,root.clientHeight-bend)%34;
      const samples=[{...point(0,bend,lean,lift),s:0}],steps=80;
      for(let i=1;i<=steps;i++){
        const p=point(i/steps,bend,lean,lift),last=samples.at(-1),length=Math.hypot(p.x-last.x,p.y-last.y);
        // Insert exact repeat boundaries; each quad samples one contiguous piece of the texture.
        const end=last.s+length,boundary=(Math.floor((last.s+phase+.0001)/34)+1)*34-phase;
        if(boundary<end-.0001){const k=(boundary-last.s)/length;samples.push({x:last.x+(p.x-last.x)*k,y:last.y+(p.y-last.y)*k,s:boundary});}
        samples.push({...p,s:end});
      }
      const edges=samples.map((p,i)=>{
        const prev=samples[Math.max(0,i-1)],next=samples[Math.min(samples.length-1,i+1)],dx=next.x-prev.x,dy=next.y-prev.y,n=Math.hypot(dx,dy)||1;
        return {left:{x:p.x+dy/n*30.6,y:p.y-dx/n*30.6},right:{x:p.x-dy/n*30.6,y:p.y+dx/n*30.6},s:p.s};
      });
      const w=texture.naturalWidth,h=texture.naturalHeight;
      for(let i=1;i<edges.length;i++){
        const a=edges[i-1],b=edges[i],offset=(a.s+phase+.0001)%34,v0=h*(1-offset/34),v1=h*(1-(offset+b.s-a.s)/34);
        triangle(a.left,a.right,b.left,{x:0,y:v0},{x:w,y:v0},{x:0,y:Math.max(0,v1)});
        triangle(a.right,b.right,b.left,{x:w,y:v0},{x:w,y:Math.max(0,v1)},{x:0,y:Math.max(0,v1)});
      }
      canvas.hidden=false;straight.style.opacity='1';fallback.style.opacity='0';
    }
    function safeDraw(state){if(failed)return;try{draw(state);}catch{failed=true;canvas.hidden=true;straight.style.opacity='0';fallback.style.opacity='1';}}
    return {draw:safeDraw,destroy(){dead=true;texture.onload=null;}};
  }
  window.KingRicoNeckArt={mount};
})();
