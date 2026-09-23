
import {siteUser,storageConfigured,supabaseRequest} from '@/lib/supabase-store';
export async function GET(request:Request){
 const headers={'Cache-Control':'no-store'};
 if(!storageConfigured())return Response.json({enabled:false,ratings:[]},{headers});
 try{const user=await siteUser(request);const q=new URLSearchParams({user_id:'eq.'+user,select:'category,rated_posts,likes,dislikes,preference_score,average_dwell_ms,last_rated_at'});const ratings=await supabaseRequest('techer_category_ratings?'+q);return Response.json({enabled:true,ratings,jevEnabled:process.env.TECHER_JEV_ENABLED==='true'&&Boolean(process.env.OPENROUTER_API_KEY)},{headers})}
 catch(error){return Response.json({error:'Ratings niet beschikbaar.'},{status:error instanceof Error&&error.message==='AUTH_REQUIRED'?401:503,headers})}
}
