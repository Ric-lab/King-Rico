// Keep the last intent while older settings writes are awaiting confirmation.
export function createSettingsBuffer({owner,confirmed,send,changed,error,delay=400}) {
  let account=null,pending={},inFlight={},timer,busy=false,generation=0;
  const syncOwner=()=>{const next=owner();if(next!==account){account=next;pending={};inFlight={};clearTimeout(timer);generation++;busy=false;}return next;};
  const overlay=settings=>{syncOwner();return {...settings,...inFlight,...pending};};
  async function flush(){
    clearTimeout(timer);
    if(!syncOwner()||busy||!Object.keys(pending).length)return;
    const epoch=generation,uid=account;
    inFlight=pending;pending={};busy=true;
    try {await send(inFlight,uid);}
    catch(e){if(epoch===generation)error(e);}
    finally {
      if(epoch!==generation)return;
      inFlight={};busy=false;changed();
      clearTimeout(timer);
      if(Object.keys(pending).length)timer=setTimeout(flush,delay);
    }
  }
  function set(values){
    if(!syncOwner())return;
    for(const [key,value] of Object.entries(values)) {
      // Returning to the confirmed value cancels a queued edit. An in-flight
      // older value still needs a compensating write, including this return.
      if(Object.hasOwn(inFlight,key)||value!==confirmed()?.[key])pending[key]=value;
      else delete pending[key];
    }
    changed();clearTimeout(timer);
    if(Object.keys(pending).length)timer=setTimeout(flush,delay);
  }
  function reset(){account=null;pending={};inFlight={};clearTimeout(timer);generation++;busy=false;}
  return {set,overlay,flush,reset};
}
