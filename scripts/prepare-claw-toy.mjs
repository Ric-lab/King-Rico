import {NodeIO} from '@gltf-transform/core';
import {simplify,weld,prune,dedup} from '@gltf-transform/functions';
import {MeshoptSimplifier} from 'meshoptimizer';
const io=new NodeIO();
const doc=await io.read('assets/models/sym-peach-game.glb');
await doc.transform(weld(),simplify({simplifier:MeshoptSimplifier,ratio:.12,error:.006}),prune(),dedup());
await io.write('assets/models/happeach-toy.glb',doc);
const p=doc.getRoot().listMeshes()[0].listPrimitives()[0];
console.log(JSON.stringify({vertices:p.getAttribute('POSITION').getCount(),triangles:p.getIndices().getCount()/3}));
