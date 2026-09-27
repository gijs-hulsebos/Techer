import 'server-only';
import {fetchAligned} from './aligned';
import {parseStories} from './aligned-stories';
import {supabaseRequest} from './supabase-store';
import type {Post} from './radar';
import {classifyPost} from './post-topics';
async function jsonSource(path:string){const r=await fetch('https://alignednews.com'+path,{cache:'no-store',signal:AbortSignal.timeout(12000),redirect:'error'});if(!r.ok)throw Error('SOURCE_UNAVAILABLE');const text=await r.text();if(text.length>5000000)throw Error('SOURCE_TOO_LARGE');return parseStories(JSON.parse(text))}
export async function syncNews(){
 const claimed=await supabaseRequest<boolean>('rpc/techer_claim_news_sync',{method:'POST',body:'{}'});if(!claimed)return {skipped:true};
 const results=await Promise.allSettled([jsonSource('/api/stories?limit=500'),jsonSource('/api/stories-archive?days=30&limit=2000'),jsonSource('/api/news-feed'),fetchAligned().then(r=>r.posts)]);
 const posts=new Map<string,Post>();for(const r of results)if(r.status==='fulfilled')for(const p of r.value)if(!posts.has(p.id))posts.set(p.id,classifyPost(p));
 if(!posts.size)throw Error('ALL_SOURCES_UNAVAILABLE');
 const list=[...posts.values()].sort((a,b)=>a.publishedAt.localeCompare(b.publishedAt));
 for(let i=0;i<list.length;i+=100)await supabaseRequest('techer_news_archive?on_conflict=post_id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(list.slice(i,i+100).map(post=>({post_id:post.id,post})))});
 await supabaseRequest('techer_news_sync?id=eq.aligned',{method:'PATCH',body:JSON.stringify({completed_at:new Date().toISOString(),fetched_count:posts.size})});
 return {fetched:posts.size,sourcesSucceeded:results.filter(r=>r.status==='fulfilled').length};
}
