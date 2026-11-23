// Monochrome inlays: readable silhouettes, not colored stickers or emoji fonts.
export function paintDieMark(c,kind,cx,cy,size=40){
 c.save();c.translate(cx,cy);c.scale(size/40,size/40);
 c.fillStyle='#fff2df';c.shadowColor='#62101a';c.shadowBlur=2;c.shadowOffsetY=2;
 c.beginPath();
 if(kind==='ray'){
  c.moveTo(0,-37);c.bezierCurveTo(12,-28,26,-24,34,-26);c.lineTo(31,2);c.bezierCurveTo(28,22,11,33,0,41);c.bezierCurveTo(-11,33,-28,22,-31,2);c.lineTo(-34,-26);c.bezierCurveTo(-26,-24,-12,-28,0,-37);c.fill();
 }else if(kind==='tucker'){
  c.arc(0,0,38,0,Math.PI*2);c.fill();c.shadowBlur=0;c.shadowOffsetY=0;
  c.strokeStyle='#b81e2c';c.lineWidth=4;
  for(let i=0;i<8;i++){const a=i*Math.PI/4;c.beginPath();c.moveTo(0,0);c.lineTo(Math.cos(a)*33,Math.sin(a)*33);c.stroke();}
  c.fillStyle='#fff2df';c.beginPath();c.arc(0,0,10,0,Math.PI*2);c.fill();
 }else{
  c.moveTo(-21,11);c.bezierCurveTo(-18,-9,-5,-8,0,-14);c.bezierCurveTo(7,-8,18,-9,24,12);c.bezierCurveTo(31,32,9,29,1,24);c.bezierCurveTo(-9,28,-30,31,-21,11);c.fill();
  for(const [x,y,a]of [[-28,-11,-.45],[-11,-29,-.18],[11,-29,.18],[29,-10,.45]]){c.beginPath();c.ellipse(x,y,10,14,a,0,Math.PI*2);c.fill();}
 }
 c.restore();
}
