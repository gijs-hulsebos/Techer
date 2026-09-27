import {categories,type Category,type Post,type Profile} from './radar';
import {xPostId} from './x-post';
export type PreferenceEstimate={category:string;score:number;confidence:number};
export function discoveryPreferences(profile:Profile,estimates:PreferenceEstimate[]=[]){
 const counts=Object.fromEntries(categories.map(c=>[c,{count:0,sum:0}])) as Record<Category,{count:number;sum:number}>;
 const latest=new Map<string,Profile['interactions'][number]>();for(const e of profile.interactions)if(['LEFT','RIGHT','SUPER'].includes(e.action))latest.set(e.postId,e);
 for(const e of latest.values()){counts[e.category].count++;counts[e.category].sum+=e.action==='SUPER'?2:e.action==='RIGHT'?1:0;}
 return Object.fromEntries(categories.map(c=>{const n=counts[c],observed=(n.sum+4)/(2*n.count+8),jev=estimates.find(v=>v.category===c),weight=jev&&Number.isFinite(jev.score)&&Number.isFinite(jev.confidence)?Math.min(.25,Math.max(0,jev.confidence)*Math.min(1,n.count/10)*.25):0;
 return [c,{count:n.count,preference:observed*(1-weight)+(Math.min(100,Math.max(0,jev?.score??50))/100)*weight+(profile.interests.includes(c)?.08:0)}];})) as Record<Category,{count:number;preference:number}>;
}
export function blindSpotOrder(posts:Post[],profile:Profile,estimates:PreferenceEstimate[]=[]){
 const preferences=discoveryPreferences(profile,estimates),used=new Set<string>();
 const rated=new Set(profile.interactions.filter(e=>['LEFT','RIGHT','SUPER'].includes(e.action)).flatMap(e=>[e.postId,...(e.post?[xPostId(e.post.url)??e.postId]:[])]));
 const pool=posts.filter(p=>{const key=xPostId(p.url);if(!key||used.has(key)||rated.has(key)||rated.has(p.id))return false;used.add(key);return true}).map(post=>{const p=preferences[post.category];return {post,score:(1-p.preference)*2+1/Math.sqrt(1+p.count)+Math.max(0,1-(Date.now()-Date.parse(post.publishedAt))/86400000/30)*.15}});
 const queues=categories.map(category=>({category,used:0,items:pool.filter(p=>p.post.category===category).sort((a,b)=>b.score-a.score||b.post.publishedAt.localeCompare(a.post.publishedAt))}));
 const result:Post[]=[];
 while(result.length<pool.length){const next=queues.filter(q=>q.used<q.items.length).sort((a,b)=>(b.items[b.used].score-b.used*.4)-(a.items[a.used].score-a.used*.4))[0];if(!next)break;result.push(next.items[next.used++].post)}
 return result;
}
