import {readFile,writeFile} from 'node:fs/promises';
const project=process.env.KING_RICO_PREVIEW_PROJECT_ID;
const provider=process.env.KING_RICO_PREVIEW_PROVIDER;
if(!/^king-rico-previa-[a-z0-9-]+$/.test(project||''))throw Error('Configure KING_RICO_PREVIEW_PROJECT_ID with the isolated preview project; production is forbidden.');
if(!/^projects\/\d+\/locations\/global\/workloadIdentityPools\/king-rico-preview-github\/providers\/github$/.test(provider||''))throw Error('Configure KING_RICO_PREVIEW_PROVIDER for the isolated project.');
const {hosting}=JSON.parse(await readFile('firebase.json','utf8'));
await writeFile('firebase.preview.generated.json',JSON.stringify({hosting:{...hosting,site:project}},null,2)+'\n');
