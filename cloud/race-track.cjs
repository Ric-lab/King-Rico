'use strict';
function surface(d,lane=0){
 const x=3.2*Math.sin(d*.12)-.8*Math.sin(d*.24),dx=.384*Math.cos(d*.12)-.192*Math.cos(d*.24),r=1/Math.sqrt(1+dx*dx);
 return {x:x+lane*r,y:28-d*.25-1.4*Math.sin(d*Math.PI/18)-.5*Math.sin(d*Math.PI/9)+lane*Math.sin(d*.12)*.10+lane*lane*.045,z:-d+lane*dx*r};
}
module.exports={surface};
