import * as T from 'three';
export const LENGTH=96,RADIUS=.32;
import track from '../../cloud/race-track.cjs';
const {surface}=track;
export function point(d,lane=0){const p=surface(d,lane);return new T.Vector3(p.x,p.y,p.z);}
export function ballPoint(progress,index,count,active=true){
 const d=progress*LENGTH,lane=(index-(count-1)/2)*.73+(active?.10*Math.sin(d*.32+index*2)*Math.sin(Math.PI*progress):0),p=point(d,lane);p.y+=RADIUS;return p;
}
// Look ahead over the grade while keeping the chosen marble inside the frame.
// Position and target are interpolated together by the renderer.
export function viewPose(positions,selected,aspect,reduced=false,active=true,ownOverride=null){
 const lead=positions.indexOf(Math.max(...positions)),d=active?(positions[lead]*.28+positions[selected]*.72)*LENGTH:1.2,spread=active?(Math.max(...positions)-Math.min(...positions))*LENGTH:0;
 const focus=point(d),own=ownOverride??ballPoint(positions[selected],selected,positions.length,active),target=point(d+2).add(new T.Vector3(0,.4,0)),position=point(d-2.5).add(new T.Vector3(.8,6.8+Math.min(1.8,spread*.12),aspect<.85?8.2:7.4));
 target.x=T.MathUtils.lerp(target.x,own.x,.5);target.z=T.MathUtils.lerp(target.z,own.z,.2);position.x+=(selected-(positions.length-1)/2)*.25;
 if(reduced){position.x=target.x=T.MathUtils.lerp(focus.x,own.x,.5);position.y+=1.3;position.z+=1;}
 return {focus,target,position};
}
