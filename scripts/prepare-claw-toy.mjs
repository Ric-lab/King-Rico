// Reuse approved character meshes; preserve UVs while reducing mobile geometry.
import {NodeIO} from '@gltf-transform/core';
import {simplify,weld,prune,dedup} from '@gltf-transform/functions';
import {MeshoptSimplifier} from 'meshoptimizer';
const io=new NodeIO();
for(const [source,target,ratio] of [['sym-peach-game','happeach-toy',.12],['king-rico','king-rico-toy',.07]]){
 const doc=await io.read(`assets/models/${source}.glb`);
 // Toy materials only use the original color map, not metallic/normal maps.
 for(const material of doc.getRoot().listMaterials()){
  material.setNormalTexture(null).setMetallicRoughnessTexture(null).setOcclusionTexture(null).setEmissiveTexture(null);
 }
 await doc.transform(weld(),simplify({simplifier:MeshoptSimplifier,ratio,error:.006}),prune(),dedup());
 await io.write(`assets/models/${target}.glb`,doc);
 console.log(target,doc.getRoot().listMeshes().flatMap(m=>m.listPrimitives().map(p=>({vertices:p.getAttribute('POSITION').getCount(),triangles:p.getIndices().getCount()/3}))));
}
