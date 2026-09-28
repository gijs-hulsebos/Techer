import type {Profile} from './radar';
export async function loadCloudProfile():Promise<{enabled:boolean;userId?:string;state?:Profile;revision?:number}>{const r=await fetch('/api/profile',{cache:'no-store'});if(r.status===401)throw Error('AUTH_REQUIRED');if(!r.ok)throw Error('CLOUD_LOAD_FAILED');return await r.json()}
export async function saveCloudProfile(profile:Profile,revision:number,userId:string){
 const r=await fetch('/api/profile',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({profile,revision,userId})});
 if(r.status===401)throw Error('AUTH_REQUIRED');
 if(r.status===409){const body=await r.json().catch(()=>({}));throw Error(body.code==='ACCOUNT_CHANGED'?'ACCOUNT_CHANGED':'REVISION_CONFLICT')}
 if(!r.ok)throw Error('CLOUD_SAVE_FAILED');return await r.json() as {revision:number};
}
