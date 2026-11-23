import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
// Real geometry around the collision perimeter: raised walnut, not a screen overlay.
export function createWoodTable(scene){
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=256;
 const ctx=canvas.getContext('2d'),image=ctx.createImageData(canvas.width,canvas.height);
 let seed=2367;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(let y=0;y<256;y++)for(let x=0;x<1024;x++){
  const grain=y+5*Math.sin(x/180)+2*Math.sin(x/73+y/31);
  const fibers=Math.sin(grain*1.1)*3+Math.sin(grain*.34)*5+Math.sin(grain*.09)*8+(random()-.5)*7;
  const i=(y*1024+x)*4;image.data[i]=128+fibers;image.data[i+1]=71+fibers*.62;image.data[i+2]=35+fibers*.35;image.data[i+3]=255;
 }
 ctx.putImageData(image,0,0);
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(3,1);texture.anisotropy=4;
 const railMaterial=new THREE.MeshPhysicalMaterial({map:texture,roughness:.38,clearcoat:.35,clearcoatRoughness:.38});
 const baseMaterial=new THREE.MeshStandardMaterial({map:texture,color:0xb88866,roughness:.55});
 const group=new THREE.Group();scene.add(group);let last='';
 function piece(length,height,width,x,y,z,turn,material){
  const mesh=new THREE.Mesh(new RoundedBoxGeometry(length,height,width,3,Math.min(.1,height/3)),material);
  mesh.position.set(x,y,z);mesh.rotation.y=turn;mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);
 }
 return {
  resize({halfX,halfZ}){
   const key=halfX+':'+halfZ;if(key===last)return;last=key;
   for(const mesh of [...group.children]){mesh.geometry.dispose();group.remove(mesh);}
   piece(halfX*2+.8,.65,halfZ*2+.8,0,-.42,0,0,baseMaterial);
   for(const sign of [-1,1]){
    // Inner lip is halfX/Z - .11, exactly the inner face of the physics wall.
    piece(halfZ*2+.8,.42,.5,sign*(halfX+.14),.13,0,Math.PI/2,railMaterial);
    piece(halfX*2-.22,.42,.5,0,.13,sign*(halfZ+.14),0,railMaterial);
   }
  },
  dispose(){railMaterial.dispose();baseMaterial.dispose();texture.dispose();}
 };
}
