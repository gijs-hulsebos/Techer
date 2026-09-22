import {env} from 'cloudflare:workers';
import {analyzeWithJev} from '@/lib/jev-analysis';
import {readProfile,siteUser,storageConfigured,supabaseRequest} from '@/lib/supabase-store';
const headers={'Cache-Control':'no-store'};
function configured(){const e=env as Record<string,unknown>;return e.TECHER_JEV_ENABLED==='true'&&typeof e.OPENROUTER_API_KEY==='string'}
export async function GET(request:Request){try{const user=siteUser(request);if(!storageConfigured())return Response.json({enabled:false},{headers});const q=new URLSearchParams({user_id:'eq.'+user,select:'status,result,profile_revision,completed_at',limit:'1'});const rows=await supabaseRequest<unknown[]>('techer_analyses?'+q);return Response.json({enabled:configured(),analysis:rows[0]??null},{headers})}catch{return Response.json({error:'Analyse niet beschikbaar.'},{status:503,headers})}}
export async function POST(request:Request){
 if(request.headers.get('origin')!==new URL(request.url).origin)return Response.json({error:'Ongeldige herkomst.'},{status:403,headers});
 let user='';let reserved=false;
 try{
  user=siteUser(request);if(!configured())return Response.json({error:'JEV is niet aangesloten.'},{status:503,headers});
  const profile=await readProfile(user);if(!profile||profile.state.interactions.filter(e=>e.action==='LEFT'||e.action==='RIGHT').length<1)return Response.json({error:'Geef eerst minimaal 1 post een like of dislike.'},{status:422,headers});
  reserved=await supabaseRequest<boolean>('rpc/techer_reserve_analysis',{method:'POST',body:JSON.stringify({p_user_id:user,p_revision:profile.revision})});
  if(!reserved)return Response.json({error:'Je kunt elke 10 minuten analyseren, maximaal 12 keer per dag.'},{status:429,headers});
  const result=await analyzeWithJev(profile.state,(env as Record<string,string>).OPENROUTER_API_KEY);
  const q=new URLSearchParams({user_id:'eq.'+user});await supabaseRequest('techer_analyses?'+q,{method:'PATCH',body:JSON.stringify({status:'ready',result,completed_at:result.createdAt})});
  return Response.json({enabled:true,analysis:{status:'ready',result,profile_revision:profile.revision,completed_at:result.createdAt}},{headers});
 }catch(error){if(reserved)try{await supabaseRequest('techer_analyses?'+new URLSearchParams({user_id:'eq.'+user}),{method:'PATCH',body:JSON.stringify({status:'failed'})})}catch{}return Response.json({error:'JEV-analyse mislukt. Je swipes blijven bewaard.'},{status:error instanceof Error&&error.message==='AUTH_REQUIRED'?401:503,headers})}
}
