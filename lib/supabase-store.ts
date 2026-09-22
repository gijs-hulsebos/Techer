// Server-only module. Never import into a client component.
import type {Profile} from './radar';
export function storageConfigured(){return process.env.TECHER_CLOUD_ENABLED==='true'&&Boolean(process.env.SUPABASE_URL&&process.env.SUPABASE_SECRET_KEY)}
export function siteUser(request:Request){const id=request.headers.get('oai-authenticated-user-id');if(!id||id.length>200)throw Error('AUTH_REQUIRED');return id}
export async function supabaseRequest<T>(path:string,init:RequestInit={}):Promise<T>{
 if(!storageConfigured())throw Error('NOT_CONFIGURED');
 const origin=new URL(process.env.SUPABASE_URL!);if(origin.protocol!=='https:')throw Error('HTTPS_REQUIRED');
 const response=await fetch(new URL('/rest/v1/'+path,origin),{...init,headers:{apikey:process.env.SUPABASE_SECRET_KEY!,'Content-Type':'application/json',...init.headers},signal:AbortSignal.timeout(12000),redirect:'manual'});
 if(!response.ok)throw Error('DATABASE_UNAVAILABLE');
 if(response.status===204)return undefined as T;return await response.json() as T;
}
export async function readProfile(userId:string){const q=new URLSearchParams({user_id:'eq.'+userId,select:'state,revision',limit:'1'});const rows=await supabaseRequest<Array<{state:Profile;revision:number}>>('techer_profiles?'+q);return rows[0]??null}
export async function writeProfile(userId:string,revision:number,profile:Profile){return supabaseRequest<number>('rpc/techer_save_profile',{method:'POST',body:JSON.stringify({p_user_id:userId,p_expected_revision:revision,p_state:profile})})}
