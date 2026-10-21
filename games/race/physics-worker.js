const {recording}=require('../../cloud/race-physics.cjs');
self.onmessage=({data:{seed,id}})=>{try{self.postMessage({id,recording:recording(seed)});}catch(error){self.postMessage({id,error:error.message});}};
