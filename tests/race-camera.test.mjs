import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import race from '../cloud/race.cjs';
import {LENGTH,RADIUS,point,ballPoint,viewPose} from '../games/race/course.mjs';
test('Gravity course has a real height drop and varied descending grades',()=>{
 assert.equal(LENGTH,96);let gentle=0,down=0;
 for(let d=0;d<LENGTH;d+=.1){const slope=point(d+.1).y-point(d).y;if(slope>-.006)gentle++;if(slope<-.01)down++;}
 assert.ok(gentle>60&&down>300);assert.ok(point(0).y-point(LENGTH).y>20);
});
test('Every selected marble stays inside portrait framing over hills, including reduced motion and historical rounds',()=>{
 for(const version of[1,2])for(const reduced of[false,true])for(const aspect of[.59,.77,1.05])for(let seed=0;seed<32;seed++)for(let selected=0;selected<(version===2?5:4);selected++){
  const count=version===2?5:4,camera=new T.PerspectiveCamera(40,aspect,.1,160);
  for(let time=0;time<20;time+=.5){const ps=Array.from({length:count},(_,i)=>race.progress(seed,i,time,version)),pose=viewPose(ps,selected,aspect,reduced),ball=ballPoint(ps[selected],selected,count);camera.position.copy(pose.position);camera.lookAt(pose.target);camera.updateMatrixWorld();
   for(const offset of[[0,.65,0],[-RADIUS,0,0],[RADIUS,0,0],[0,-RADIUS,0]]){const p=ball.clone().add(new T.Vector3(...offset)).project(camera),x=(p.x+1)/2,y=(1-p.y)/2;assert.ok(x>.035&&x<.965&&y>.025&&y<.97,JSON.stringify({version,reduced,aspect,seed,selected,time,x,y}));}
  }
 }
});
