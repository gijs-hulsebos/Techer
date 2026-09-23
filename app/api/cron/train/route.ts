import {timingSafeEqual,randomUUID} from 'node:crypto';
import {readProfile,supabaseRequest} from '@/lib/supabase-store';
import {train,type RankModel,type TrainingState} from '@/lib/personal-model';
export const maxDuration=300;
export async function GET(request:Request){
 const secret=process.env.CRON_SECRET,auth=request.headers.get('authorization')??'';
 if(!secret||auth.length!==`Bearer ${secret}`.length||!timingSafeEqual(Buffer.from(auth),Buffer.from(`Bearer ${secret}`)))return new Response('Unauthorized',{status:401});
 const token=randomUUID(),started=Date.now();let completed=0,failed=0;
 try{const jobs=await supabaseRequest<{user_id:string;active:RankModel|null;state:TrainingState|null}[]>('rpc/techer_claim_training',{method:'POST',body:JSON.stringify({p_token:token})});
 for(const job of jobs){if(Date.now()-started>240000)break;try{const profile=await readProfile(job.user_id);if(!profile)continue;const result=train(profile.state,job.active,job.state);const saved=await supabaseRequest<boolean>('rpc/techer_finish_training',{method:'POST',body:JSON.stringify({p_user:job.user_id,p_token:token,p_revision:profile.revision,p_active:result.active,p_state:result.state,p_candidate:result.candidate})});if(saved)completed++;}catch{failed++}}
 return Response.json({claimed:jobs.length,completed,failed},{status:failed?500:200,headers:{'Cache-Control':'no-store'}});
 }catch{return Response.json({error:'Training tijdelijk niet beschikbaar.'},{status:503})}
}
