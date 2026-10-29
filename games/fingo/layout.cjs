// Visible peg coordinates shared by the physical board and its Home cover.
const W=453,H=570,PR=W*.022;
const gap=(W-60-8*PR)/5;
const ENTRY_CENTERS=Array.from({length:5},(_,i)=>30+gap/2+i*(gap+2*PR));
const ENTRY_PEG_XS=Array.from({length:4},(_,i)=>30+(i+1)*gap+(2*i+1)*PR);
const endY=H-150,gy=(endY-44)/7;
const PEGS=Array.from({length:8},(_,row)=>{
 const y=44+row*gy,m=PR+8+18*(1-y/H),step=(W-2*m)/6;
 const xs=row===0?ENTRY_PEG_XS:Array.from({length:row%2?6:7},(_,c)=>m+step*(c+(row%2?.5:0)));
 return xs.map(x=>({x,y}));
}).flat();
module.exports={W,H,PR,ENTRY_CENTERS,ENTRY_PEG_XS,endY,gy,PEGS};
