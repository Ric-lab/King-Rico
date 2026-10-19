// Mount the generated portrait after DC resolves its data URL, avoiding a
// premature request for the literal template expression in a native img tag.
function ClownMarker({src}) {
  return src ? React.createElement('img',{src,alt:'','data-clown-marker':'',
    style:{position:'absolute',inset:0,width:'100%',height:'100%',borderRadius:'50%'}}) : null;
}
module.exports={ClownMarker};
