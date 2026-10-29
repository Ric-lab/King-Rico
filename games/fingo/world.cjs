// Shared by the visible board and the offline Matter.js trajectory generator.
const W=453,H=570,BW=W/5,R=W*.039,PR=W*.022;
const gap=(W-60-8*PR)/5;
const ENTRY_CENTERS=Array.from({length:5},(_,i)=>30+gap/2+i*(gap+2*PR));
const ENTRY_PEG_XS=Array.from({length:4},(_,i)=>30+(i+1)*gap+(2*i+1)*PR);
function createWorld(M){
 const engine=M.Engine.create();engine.world.gravity.y=1.6;
 const bodies=[],pegs=[],funnels=[],endY=H-150,gy=(endY-44)/7;
 for(const side of [-1,1]){
  const x0=side<0?18:W-18,x1=side<0?0:W,y0=-60,y1=H+40,len=Math.hypot(x1-x0,y1-y0),a=Math.atan2(x1-x0,y1-y0);
  bodies.push(M.Bodies.rectangle((x0+x1)/2+Math.cos(a)*side*30,(y0+y1)/2+Math.sin(a)*side*30,60,len,{isStatic:true,angle:-a,label:side<0?'wall-left':'wall-right',friction:0,restitution:1.3}));
 }
 bodies.push(M.Bodies.rectangle(W/2,H+25,W,50,{isStatic:true,label:'floor',restitution:0,friction:1}));
 for(let row=0;row<8;row++){
  const y=44+row*gy,m=PR+8+18*(1-y/H),step=(W-2*m)/6;
  const xs=row===0?ENTRY_PEG_XS:Array.from({length:row%2?6:7},(_,c)=>m+step*(c+(row%2?.5:0)));
  for(const x of xs){const peg=M.Bodies.circle(x,y,PR,{isStatic:true,restitution:.9,label:'peg'});pegs.push(peg);bodies.push(peg);}
 }
 for(let i=1;i<5;i++){
  const f=M.Bodies.rectangle(i*BW,H-46,12,92,{isStatic:true,friction:0,frictionStatic:0,label:'funnel',restitution:.1});
  funnels.push(f);bodies.push(f,M.Bodies.circle(i*BW,H-94,10,{isStatic:true,restitution:.5,label:'funnel'}));
 }
 for(let i=0;i<5;i++)bodies.push(M.Bodies.rectangle(i*BW+BW/2,H-16,BW+2,10,{isStatic:true,isSensor:true,label:'bin-'+i}));
 M.Composite.add(engine.world,bodies);
 return {engine,pegs,funnels,endY,gy};
}
function createBall(M,column,vx){
 const ball=M.Bodies.circle(ENTRY_CENTERS[column],-20,R,{restitution:.75,friction:.005,frictionAir:.004,density:1.5,label:'ball'});
 M.Body.setVelocity(ball,{x:vx,y:0});return ball;
}
module.exports={W,H,BW,R,ENTRY_CENTERS,ENTRY_PEG_XS,createWorld,createBall};
