import test from 'node:test';
import assert from 'node:assert/strict';
import {cleanupHosting} from '../scripts/cleanup-hosting.mjs';
const site='sites/king-rico',live=site+'/channels/live',preview=site+'/channels/test';
const version=n=>({name:site+'/versions/v'+n,status:'FINALIZED',createTime:'2026-10-01T00:00:00Z'});
function fixture(){
 const calls=[],channels=[{name:live,release:{version:version(9)}},{name:preview,release:{version:version(1)}}];
 let liveReads=0;
 const request=async(method,path,data)=>{
  calls.push({method,path,data});
  const [resource,query]=path.split('?');
  if(method==='GET'){
   if(resource===site+'/channels')return {channels};
   if(resource===live){liveReads++;return channels[0];}
   if(resource===preview)return channels[1];
   if(resource===live+'/releases')return {releases:Array.from({length:9},(_,i)=>({releaseTime:`2026-10-${String(9-i).padStart(2,'0')}T00:00:00Z`,version:version(9-i)}))};
   if(resource===preview+'/releases')return {releases:[{releaseTime:'2026-10-01T00:00:00Z',version:version(1)}]};
   if(resource===site+'/versions')return new URLSearchParams(query).has('pageToken')
    ?{versions:[{...version('old-orphan'),status:'CREATED'},{...version('new-upload'),status:'CREATED',createTime:'2026-10-28T11:59:00Z'}]}
    :{versions:Array.from({length:9},(_,i)=>version(i+1)),nextPageToken:'next'};
  }
  if(method==='DELETE'||method==='PATCH')return {};
  throw Error('Unexpected request');
 };
 return {request,calls,channels,get liveReads(){return liveReads;}};
}
const options={now:Date.parse('2026-10-28T12:00:00Z')};
test('Hosting cleanup defaults to read-only and paginates before planning',async()=>{
 const f=fixture(),result=await cleanupHosting(f.request,options);
 assert.equal(result.retained,6);assert.equal(result.candidates,4);assert.equal(result.deleted,0);
 assert.ok(f.calls.every(c=>c.method==='GET'));
});
test('Hosting cleanup keeps live, five newest releases, preview versions and a new upload',async()=>{
 const f=fixture(),result=await cleanupHosting(f.request,{...options,apply:true});
 assert.equal(result.deleted,4);
 assert.deepEqual(f.calls.filter(c=>c.method==='DELETE').map(c=>c.path),[2,3,4,'old-orphan'].map(n=>version(n).name));
 assert.ok(f.liveReads>=5);
 assert.deepEqual(f.calls.find(c=>c.method==='PATCH'),{method:'PATCH',path:live+'?updateMask=retainedReleaseCount',data:{retainedReleaseCount:5}});
});
test('Hosting cleanup aborts before deleting if the live release changes',async()=>{
 const f=fixture(),request=async(method,path,data)=>method==='GET'&&path===live?{release:{version:version(3)}}:f.request(method,path,data);
 await assert.rejects(cleanupHosting(request,{...options,apply:true}),/ativa mudou/);
 assert.ok(!f.calls.some(c=>c.method==='DELETE'||c.method==='PATCH'));
});
test('Hosting cleanup refuses a foreign version without any mutations',async()=>{
 const f=fixture();f.channels[1].release.version.name='sites/another-site/versions/v1';
 await assert.rejects(cleanupHosting(f.request,{...options,apply:true}),/fora do Hosting/);
 assert.ok(f.calls.every(c=>c.method==='GET'));
});
test('Hosting cleanup stops on a denied deletion instead of expanding its targets',async()=>{
 const f=fixture(),request=async(method,path,data)=>{if(method==='DELETE'){const error=Error('denied');error.status=403;throw error;}return f.request(method,path,data);};
 await assert.rejects(cleanupHosting(request,{...options,apply:true}),/denied/);
 assert.ok(!f.calls.some(c=>c.method==='PATCH'));
});
