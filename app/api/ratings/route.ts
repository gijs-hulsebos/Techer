
import {siteUser,storageConfigured,supabaseRequest,readProfile} from '@/lib/supabase-store';
export async function GET(request:Request){
 const headers={'Cache-Control':'no-store'};
 if(!storageConfigured())return Response.json({enabled:false,ratings:[]},{headers});
 try{const user=await siteUser(request);const q=new URLSearchParams({user_id:'eq.'+user,select:'category,rated_posts,likes,dislikes,preference_score,average_dwell_ms,last_rated_at,superlikes'});const ratings=await supabaseRequest('techer_category_ratings?'+q);const profile=await readProfile(user);const activity=Array.from({length:14},(_,i)=>({date:new Date(Date.now()-(13-i)*86400000).toISOString().slice(0,10),dislike:0,like:0,superlike:0}));for(const e of profile?.state.interactions??[]){const day=activity.find(d=>d.date===e.createdAt.slice(0,10));if(day){if(e.action==='LEFT')day.dislike++;if(e.action==='RIGHT')day.like++;if(e.action==='SUPER')day.superlike++}}return Response.json({enabled:true,ratings,activity,jevEnabled:process.env.TECHER_JEV_ENABLED==='true'&&Boolean(process.env.OPENROUTER_API_KEY)},{headers})}
 catch(error){return Response.json({error:'Ratings niet beschikbaar.'},{status:error instanceof Error&&error.message==='AUTH_REQUIRED'?401:503,headers})}
}
