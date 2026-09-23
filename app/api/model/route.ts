import {siteUser,readProfile,supabaseRequest} from '@/lib/supabase-store';
import {examples,modelValid,type RankModel,type TrainingState} from '@/lib/personal-model';
export async function GET(request:Request){
 try{const user=await siteUser(request);const profile=await readProfile(user);const rows=await supabaseRequest<{active:RankModel|null;state:TrainingState|null;checked_at:string}[]>('techer_personal_models?'+new URLSearchParams({user_id:'eq.'+user,select:'active,state,checked_at',limit:'1'}));
 const history=await supabaseRequest<{created_at:string;state:TrainingState}[]>('techer_training_runs?'+new URLSearchParams({user_id:'eq.'+user,select:'created_at,state',order:'created_at.desc',limit:'20'}));
 const row=rows[0],samples=profile?examples(profile.state):[];const valid=modelValid(row?.active??null,samples);
 return Response.json({active:valid?row.active:null,state:row?.state??null,available:samples.length,invalidated:!!row?.active&&!valid,history},{headers:{'Cache-Control':'private, no-store'}});
 }catch(e){return Response.json({error:'Model niet beschikbaar.'},{status:e instanceof Error&&e.message==='AUTH_REQUIRED'?401:503,headers:{'Cache-Control':'no-store'}})}
}
