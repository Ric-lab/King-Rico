import * as T from 'three';
import {mergeVertices} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
const TYPES=[
 {id:'happeach',name:'Happeach',art:'./assets/claw/happeach-plush.webp'},
 {id:'diamond',name:'Diamante',art:'./assets/symbols/sym-gem.png'},
 {id:'coin',name:'Moeda',art:'./assets/symbols/sym-coin.webp'},
 {id:'giraffe',name:'Nick Neck',art:'./assets/girafa/head.webp'},
 {id:'king',name:'King Rico',art:'./assets/king-rico/view-front.png'}
];
export const toyInfo=(seed,index)=>TYPES[(seed+index)%TYPES.length];

// A closed, stuffed silhouette: artwork on the face, rounded fabric edge and a
// plain fabric back. The same mesh is carried by its physics body throughout.
function cushion(texture,color){
 const n=96,c=document.createElement('canvas');c.width=c.height=n;
 const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(texture.image,0,0,n,n);
 const pixels=g.getImageData(0,0,n,n).data,inside=(x,y)=>x>=0&&y>=0&&x<n&&y<n&&pixels[(y*n+x)*4+3]>90;
 const edges=new Map(),key=(x,y)=>`${x},${y}`;
 for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(inside(x,y)){
  if(!inside(x,y-1))edges.set(key(x,y),[x+1,y]);
  if(!inside(x+1,y))edges.set(key(x+1,y),[x+1,y+1]);
  if(!inside(x,y+1))edges.set(key(x+1,y+1),[x,y+1]);
  if(!inside(x-1,y))edges.set(key(x,y+1),[x,y]);
 }
 let outline=[];
 while(edges.size){let first=edges.keys().next().value,at=first,loop=[];do{loop.push(at.split(',').map(Number));const next=edges.get(at);edges.delete(at);at=next?key(...next):null;}while(at&&at!==first&&edges.has(at));if(loop.length>outline.length)outline=loop;}
 const scale=.78/n,control=outline.filter((_,i)=>i%6===0).map(([x,y])=>new T.Vector3((x-n/2)*scale,(n/2-y)*scale,0));
 const points=new T.CatmullRomCurve3(control,true,'centripetal').getPoints(160).slice(0,-1).map(p=>new T.Vector2(p.x,p.y));
 const shape=new T.Shape(points),depth=.04;
 let geometry=new T.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelThickness:.09,bevelSize:.025,bevelSegments:5,steps:1,curveSegments:8,
  UVGenerator:{generateTopUV(_,v,a,b,c){return[a,b,c].map(i=>new T.Vector2(v[i*3]/.78+.5,v[i*3+1]/.78+.5));},generateSideWallUV(_,v,a,b,c,d){return[a,b,c,d].map(i=>new T.Vector2(v[i*3]/.78+.5,v[i*3+1]/.78+.5));}}});
 // Bulge both faces gently; the edge remains a sewn, closed volume.
 const p=geometry.attributes.position;
 for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),bulge=.07*Math.max(0,1-(x*x+y*y)/.18);p.setZ(i,z-depth/2+(z>depth/2?bulge:-bulge));}
 geometry.deleteAttribute('normal');geometry=mergeVertices(geometry,1e-5);geometry.computeVertexNormals();
 const front=new T.MeshLambertMaterial({map:texture}),fabric=new T.MeshLambertMaterial({color});
 // ExtrudeGeometry combines both cap faces: assign the rear triangles fabric.
 const indices=geometry.index,position=geometry.attributes.position;
 const groups=[...geometry.groups];geometry.clearGroups();
 for(const group of groups){if(group.materialIndex!==0){geometry.addGroup(group.start,group.count,1);continue;}
  for(let i=group.start;i<group.start+group.count;i+=3){const a=indices?indices.getX(i):i,material=position.getZ(a)>0?0:1,last=geometry.groups.at(-1);if(last&&last.materialIndex===material&&last.start+last.count===i)last.count+=3;else geometry.addGroup(i,3,material);}}
 const root=new T.Group(),mesh=new T.Mesh(geometry,[front,fabric]);mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);
 const seamPoints=points.map(p=>new T.Vector3(p.x,p.y,0));seamPoints.push(seamPoints[0]);
 const seam=new T.Line(new T.BufferGeometry().setFromPoints(seamPoints),new T.LineDashedMaterial({color:0xffe7b5,dashSize:.017,gapSize:.013,transparent:true,opacity:.7}));seam.computeLineDistances();root.add(seam);
 return root;
}
function normalize(model){
 model.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(model),center=bounds.getCenter(new T.Vector3()),size=bounds.getSize(new T.Vector3()),s=.82/Math.max(size.x,size.y,size.z);
 model.traverse(o=>{if(o.isMesh){o.material=new T.MeshLambertMaterial({map:o.material.map,color:0xffffff});o.castShadow=o.receiveShadow=true;}});
 const root=new T.Group();model.scale.multiplyScalar(s);model.position.copy(center).multiplyScalar(-s);root.add(model);return root;
}
export async function loadToyModels(){
 const loader=new GLTFLoader(),textures=new T.TextureLoader();
 const [peach,king,diamond,giraffe,coin]=await Promise.all([
  loader.loadAsync('./assets/models/happeach-toy.glb'),loader.loadAsync('./assets/models/king-rico-toy.glb'),
  textures.loadAsync(TYPES[1].art),textures.loadAsync(TYPES[3].art),textures.loadAsync(TYPES[2].art)
 ]);
 for(const t of[diamond,giraffe,coin]){t.colorSpace=T.SRGBColorSpace;t.anisotropy=2;}
 return [normalize(peach.scene),cushion(diamond,0x743ea8),cushion(coin,0xd6a22f),cushion(giraffe,0xc99036),normalize(king.scene)];
}
