import {isPost,type Post,type Category} from './radar';
export function parseStories(data:unknown):Post[]{
 const root=data as {sections?:Record<string,unknown[]>};const entries=Array.isArray(data)?data:root?.sections?Object.values(root.sections).flat():[];
 const categoryMap:Record<string,Category>={robotics:'ROBOTICS',xr:'XR',spatial:'XR',chips:'HARDWARE',hardware:'HARDWARE',dev:'DEV',coding:'DEV',startups:'STARTUPS',business:'STARTUPS',science:'SCIENCE',papers:'SCIENCE',jobs:'STARTUPS'};
 const result=new Map<string,Post>();
 for(const raw of entries){if(!raw||typeof raw!=='object')continue;const r=raw as Record<string,unknown>;const title=String(r.headline??'').replace(/<[^>]*>/g,' ').slice(0,2000),text=String(r.summary??r.body??'').replace(/<[^>]*>/g,' ').slice(0,20000);const date=Date.parse(String(r.published_at??''));if(!title||!Number.isFinite(date))continue;
 const section=String(r.section??r.tag??'ai');const links=[r.source_url,...(Array.isArray(r.sources)?r.sources.filter(v=>v&&v.type==='primary').map(v=>v.url):[])];
 for(const value of links){try{const url=new URL(String(value));if(!['https:','http:'].includes(url.protocol))continue;url.hash='';for(const k of [...url.searchParams.keys()])if(k.startsWith('utm_'))url.searchParams.delete(k);const id='aligned:'+url.href;const handle=String(r.author_handle??'');const post:Post={id,title,text,url:url.href,category:categoryMap[section]??'AI',tags:[section],author:String(r.author_name??(handle?'@'+handle:url.hostname)).slice(0,300),handle:handle?'@'+handle:'',source:'Aligned News',sourceCategory:section,related:[],publishedAt:new Date(date).toISOString()};if(isPost(post)&&!result.has(id))result.set(id,post)}catch{}}
 }return [...result.values()];
}
