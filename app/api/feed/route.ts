import {syncNews} from '@/lib/news-archive';
import {siteUser,supabaseRequest} from '@/lib/supabase-store';
import type {Post} from '@/lib/radar';
export const maxDuration=60;
export async function GET(request:Request){
 const headers={'Cache-Control':'private, no-store'};
 try{const user=await siteUser(request);const before=new URL(request.url).searchParams.get('before');if(before&&(!/^\d+$/.test(before)||!Number.isSafeInteger(Number(before))))return Response.json({error:'Ongeldige pagina.'},{status:400,headers});
 let stale=false;if(!before)try{await syncNews()}catch{stale=true}
 const rows=await supabaseRequest<{seq:number;post:Post}[]>('rpc/techer_news_page',{method:'POST',body:JSON.stringify({p_user:user,p_before:before?Number(before):null,p_limit:100})});
 const sync=await supabaseRequest<{completed_at:string}[]>('techer_news_sync?id=eq.aligned&select=completed_at');const fetchedAt=sync[0]?.completed_at??'';
 return Response.json({posts:rows.map(r=>r.post),nextCursor:rows.length===100?rows.at(-1)!.seq:null,stale:stale||!fetchedAt||Date.now()-Date.parse(fetchedAt)>86400000,fetchedAt,mode:'live',source:'Aligned News'},{headers});
 }catch(e){return Response.json({error:'Nieuws tijdelijk niet beschikbaar.',posts:[]},{status:e instanceof Error&&e.message==='AUTH_REQUIRED'?401:503,headers})}
}
