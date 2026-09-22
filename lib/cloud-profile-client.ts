// Prepared client contract. Not activated in the live UI until a project is connected.
import type {Profile} from './radar';
export async function loadCloudProfile():Promise<{enabled:boolean;state?:Profile;revision?:number}>{const r=await fetch('/api/profile',{cache:'no-store'});if(!r.ok)throw Error('CLOUD_LOAD_FAILED');return await r.json() as {enabled:boolean;state?:Profile;revision?:number}}
export async function saveCloudProfile(profile:Profile,revision:number){const r=await fetch('/api/profile',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({profile,revision})});if(r.status===409)throw Error('REVISION_CONFLICT');if(!r.ok)throw Error('CLOUD_SAVE_FAILED');return await r.json() as {revision:number}}
