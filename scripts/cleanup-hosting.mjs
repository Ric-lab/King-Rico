// Hosting history only. Never touches Firestore, Auth, files in the live version,
// other sites, or versions currently being uploaded by another publisher.
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';

const SITE='sites/king-rico';
const VERSION=/^sites\/king-rico\/versions\/[A-Za-z0-9_-]+$/;
const CHANNEL=/^sites\/king-rico\/channels\/[A-Za-z0-9_-]+$/;
const API='https://firebasehosting.googleapis.com/v1beta1';
const DAY=24*60*60*1000;

async function list(request,path,key){
  const result=[];let token;const seen=new Set();
  do{
    const query=new URLSearchParams({pageSize:'100',...(token?{pageToken:token}:{})});
    const page=await request('GET',path+'?'+query);
    result.push(...(page[key]||[]));token=page.nextPageToken;
    if(token&&seen.has(token))throw Error('Paginação repetida; limpeza interrompida.');
    if(token)seen.add(token);
  }while(token);
  return result;
}
function versionName(value){
  const name=value?.name;
  if(!VERSION.test(name))throw Error('Versão fora do Hosting king-rico; limpeza interrompida.');
  return name;
}
export async function cleanupHosting(request,{apply=false,keep=5,now=Date.now(),report=()=>{}}={}){
  if(!Number.isInteger(keep)||keep<5||keep>100)throw Error('Preservar entre 5 e 100 versões recentes.');
  const channels=await list(request,SITE+'/channels','channels');
  if(!channels.some(c=>c.name===SITE+'/channels/live'))throw Error('Canal ativo ausente; limpeza interrompida.');
  const protectedNames=new Set(),released=new Set(),active=new Map();
  for(const channel of channels){
    if(!CHANNEL.test(channel.name))throw Error('Canal fora do site esperado.');
    if(channel.release?.version){const current=versionName(channel.release.version);active.set(channel.name,current);protectedNames.add(current);}
    else if(channel.name===SITE+'/channels/live')throw Error('Versão ativa ausente; limpeza interrompida.');
    const releases=await list(request,channel.name+'/releases','releases');
    releases.sort((a,b)=>Date.parse(b.releaseTime)-Date.parse(a.releaseTime));
    const recent=new Set();
    for(const release of releases){
      // SITE_DISABLE records have no version. They are never deletion targets.
      if(!release.version)continue;
      if(!Number.isFinite(Date.parse(release.releaseTime)))throw Error('Data de publicação inválida.');
      const name=versionName(release.version);released.add(name);
      if(recent.size<keep)recent.add(name);
    }
    for(const name of recent)protectedNames.add(name);
  }
  const versions=await list(request,SITE+'/versions','versions');
  const candidates=versions.filter(v=>{
    const name=versionName(v);
    if(protectedNames.has(name)||!['CREATED','FINALIZED','ABANDONED'].includes(v.status))return false;
    const age=now-Date.parse(v.createTime);
    // Unreleased uploads are only garbage after a full day, never during deploy.
    return released.has(name)||(Number.isFinite(age)&&age>DAY);
  });
  const plan={retained:protectedNames.size,candidates:candidates.length,deleted:0};report({event:'plan',...plan});
  if(!apply)return plan;
  for(const version of candidates){
    // Abort if any live/preview channel changed since the deletion plan was made.
    for(const [name,expected] of active){
      const current=await request('GET',name);
      if(versionName(current.release?.version)!==expected)throw Error('Publicação ativa mudou; limpeza interrompida.');
    }
    try{await request('DELETE',version.name);plan.deleted++;}
    catch(error){if(error.status!==404)throw error;}
    report({event:'deleted',name:version.name});
  }
  await request('PATCH',SITE+'/channels/live?updateMask=retainedReleaseCount',{retainedReleaseCount:keep});
  for(const [name,expected] of active){
    const current=await request('GET',name);
    if(versionName(current.release?.version)!==expected)throw Error('A versão ativa mudou durante a limpeza.');
  }
  report({event:'complete',...plan});return plan;
}

async function main(){
  const require=createRequire(import.meta.url),firebaseRequire=createRequire(require.resolve('firebase-tools/package.json'));
  const {GoogleAuth}=firebaseRequire('google-auth-library');
  const auth=new GoogleAuth({scopes:['https://www.googleapis.com/auth/cloud-platform']});
  const token=await auth.getAccessToken();if(!token)throw Error('Falha na autenticação do publicador.');
  const request=async(method,path,data)=>{
    if(!path.startsWith(SITE+'/'))throw Error('Recurso fora do site esperado.');
    const response=await fetch(API+'/'+path,{method,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:data===undefined?undefined:JSON.stringify(data),redirect:'error',signal:AbortSignal.timeout(30000)});
    if(!response.ok){const error=Error(`Hosting ${method} ${path.split('?')[0]}: HTTP ${response.status}`);error.status=response.status;error.safeMessage=error.message;throw error;}
    return response.status===204?{}:response.json();
  };
  const result=await cleanupHosting(request,{apply:process.argv.includes('--apply'),report:event=>console.log(JSON.stringify(event))});
  console.log(`Histórico Hosting: ${result.deleted} versões removidas; ${result.retained} preservadas.`);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)main().catch(error=>{
  console.error(error.safeMessage||'Limpeza do Hosting interrompida; consulte a etapa sem expor credenciais.');
  process.exitCode=1;
});
