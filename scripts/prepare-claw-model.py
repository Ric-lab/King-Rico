"""Prepare an offline Happeach LOD; preserve original texture bytes and source GLB.
Developer helper (Python + NumPy); the checked-in output is served directly.
"""
from pathlib import Path
import json,struct,numpy as np
source=Path('assets/models/sym-peach-game.glb');b=source.read_bytes();size=struct.unpack_from('<I',b,12)[0];doc=json.loads(b[20:20+size]);data=b[28+size:];primitive=doc['meshes'][0]['primitives'][0]
def read(index):
 a=doc['accessors'][index];v=doc['bufferViews'][a['bufferView']];width={'VEC3':3,'VEC2':2,'SCALAR':1}[a['type']]
 return np.frombuffer(data,dtype={5126:'<f4',5125:'<u4',5123:'<u2'}[a['componentType']],count=a['count']*width,offset=v.get('byteOffset',0)+a.get('byteOffset',0)).reshape(-1,width)
pos=read(primitive['attributes']['POSITION']);uv=read(primitive['attributes']['TEXCOORD_0']);normals=read(primitive['attributes']['NORMAL']);indices=read(primitive['indices']).reshape(-1,3)
keys=np.column_stack([np.round((pos-pos.min(0))/(pos.max(0)-pos.min(0))*48),np.floor(uv*32)]).astype('int32');unique,mapping=np.unique(keys,axis=0,return_inverse=True);counts=np.bincount(mapping)
def average(values):return np.column_stack([np.bincount(mapping,weights=values[:,i])/counts for i in range(values.shape[1])]).astype('<f4')
p=average(pos);n=average(normals);n/=np.maximum(np.linalg.norm(n,axis=1,keepdims=True),1e-9);u=average(uv)
i=mapping[indices];i=i[(i[:,0]!=i[:,1])&(i[:,0]!=i[:,2])&(i[:,1]!=i[:,2])].astype('<u2')
oldviews=doc['bufferViews'];images=[]
for im in doc.get('images',[]):
 view=oldviews[im['bufferView']];images.append(data[view.get('byteOffset',0):view.get('byteOffset',0)+view['byteLength']])
blob=bytearray();views=[];accessors=[]
def append(raw,target=None):
 while len(blob)%4:blob.append(0)
 v={'buffer':0,'byteOffset':len(blob),'byteLength':len(raw)}
 if target:v['target']=target
 views.append(v);blob.extend(raw);return len(views)-1
for array,kind,component in [(p,'VEC3',5126),(u,'VEC2',5126),(n,'VEC3',5126),(i.reshape(-1,1),'SCALAR',5123)]:
 v=append(array.tobytes(),34963 if component==5123 else 34962);a={'bufferView':v,'componentType':component,'count':len(array),'type':kind}
 if v==0:a.update(min=p.min(0).tolist(),max=p.max(0).tolist())
 accessors.append(a)
for im,raw in zip(doc.get('images',[]),images):im['bufferView']=append(raw)
doc['accessors']=accessors;doc['bufferViews']=views;doc['buffers']=[{'byteLength':len(blob)}];primitive['attributes']={'POSITION':0,'TEXCOORD_0':1,'NORMAL':2};primitive['indices']=3
payload=json.dumps(doc,separators=(',',':')).encode();payload+=b' '*((-len(payload))%4);blob.extend(b'\0'*((-len(blob))%4))
out=struct.pack('<III',0x46546c67,2,28+len(payload)+len(blob))+struct.pack('<II',len(payload),0x4e4f534a)+payload+struct.pack('<II',len(blob),0x004e4942)+blob
path=Path('assets/models/happeach-claw.glb');path.write_bytes(out);print(json.dumps({'source_vertices':len(pos),'vertices':len(p),'triangles':len(i),'bytes':len(out),'texture_bytes_unchanged':True}))
