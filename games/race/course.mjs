// Circus course (v4): pure math, no physics and no three.js, so it loads instantly
// and tests can import it. d = distance along the course, lane = metres from centre.
export const LENGTH=92,RADIUS=.32,RAMP=58,FUNNEL=[76,84],RUNOUT=8;
export const PINS=[];
for(const [d,lanes]of[[14,[-1.095,-.365,.365,1.095]],[16.5,[-1.46,-.365,.365,1.46]],[19,[-1.095,-.365,.365,1.095]],[21.5,[-1.46,-.365,.365,1.46]],[24,[-1.095,-.365,.365,1.095]]])for(const lane of lanes)PINS.push({d,lane,r:.07});
export const DRUMS=[{d:36,lane:-.85,r:.34},{d:40,lane:.85,r:.34},{d:44,lane:0,r:.34}];
const kick=d=>d>RAMP-4&&d<=RAMP?.55*((d-RAMP+4)/4)**2:0;
export const halfWidth=d=>{const [a,b]=FUNNEL;return d<a?2:d<b?2-.8*(.5-.5*Math.cos(Math.PI*(d-a)/(b-a))):d<LENGTH+1?1.2:Math.min(2,1.2+(d-LENGTH-1)*.3);};
export function center(d){
 const x=3*Math.sin(d*.085)+1.1*Math.sin(d*.19+1),dx=.255*Math.cos(d*.085)+.209*Math.cos(d*.19+1),r=1/Math.sqrt(1+dx*dx);
 return {x,y:24-d*.22-.7*Math.sin(d*.2)+kick(d),z:-d,nx:r,nz:dx*r};
}
export function at(d,lane=0){const c=center(d);return {x:c.x+lane*c.nx,y:c.y,z:c.z+lane*c.nz};}
// Marble height including the hop off the ramp lip.
export function ballY(d){
 const floor=center(d).y+RADIUS;if(d<RAMP||d>RAMP+3.6)return floor;
 const s=(d-RAMP)/3.6,lip=center(RAMP).y+RADIUS;return lip+(floor-lip)*s+1.5*s*(1-s);
}
export function phase(d){return d<12?'Descida':d<26?'Floresta de pinos':d<48?'Tambores do circo':d<RAMP+4?'Rampa do salto':d<FUNNEL[0]?'Reta final':'Funil da chegada';}
