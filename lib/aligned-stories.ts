import {isPost,type Post} from './radar';
import {classifyPost} from './post-topics';
import {xPostId} from './x-post';
export function parseStories(data:unknown):Post[]{
 const root=data as {sections?:Record<string,unknown[]>};
 const entries=Array.isArray(data)?data:root?.sections?Object.entries(root.sections).flatMap(([section,items])=>Array.isArray(items)?items.filter(r=>r&&typeof r==='object').map(value=>{const r=value as Record<string,unknown>;return {...r,section:r.section??section}}):[]):[];
 const result=new Map<string,Post>();
 for(const raw of entries){if(!raw||typeof raw!=='object')continue;const r=raw as Record<string,unknown>;
 const title=String(r.headline??'').replace(/<[^>]*>/g,' ').slice(0,2000),text=String(r.summary??r.body??'').replace(/<[^>]*>/g,' ').slice(0,20000),date=Date.parse(String(r.published_at??''));if(!title||!Number.isFinite(date))continue;
 const section=String(r.section??r.tag??'ai');
 // Include public X references as well as primary sources; previously these were discarded.
 const links=[r.source_url,...(Array.isArray(r.sources)?r.sources.filter(v=>v&&typeof v==='object'&&(v.type==='primary'||xPostId(String(v.url)))).map(v=>v.url):[])];
 for(const value of links){try{const url=new URL(String(value));if(!['https:','http:'].includes(url.protocol))continue;url.hash='';for(const k of [...url.searchParams.keys()])if(k.startsWith('utm_')||(xPostId(url.href)&&['s','t'].includes(k)))url.searchParams.delete(k);
 const id='aligned:'+url.href,xid=xPostId(url.href),handle=xid?url.pathname.split('/')[1]:String(r.author_handle??'');
 const post=classifyPost({id,title,text,url:url.href,category:'AI',tags:[section,...(typeof r.tag==='string'?[r.tag]:[])],author:handle?'@'+handle:String(r.author_name??url.hostname).slice(0,300),handle:handle?'@'+handle:'',source:'Aligned News',sourceCategory:section,related:[],publishedAt:new Date(date).toISOString()});
 const key=xid?'x:'+xid:id;if(isPost(post)){const previous=result.get(key);if(!previous)result.set(key,post);else result.set(key,{...previous,related:[...new Set([...previous.related,post.category,...post.related])].filter(c=>c!==previous.category)})}
 }catch{}}
 }return [...result.values()];
}
