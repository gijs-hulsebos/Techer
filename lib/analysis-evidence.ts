import type {Profile} from './radar';
const categories=['AI','ROBOTICS','XR','DEV','HARDWARE','STARTUPS','SCIENCE'];
export function longitudinalEvidence(profile:Profile,now=Date.now()){
 const events=profile.interactions.filter(e=>(e.action==='LEFT'||e.action==='RIGHT'||e.action==='SUPER')&&Number.isFinite(Date.parse(e.createdAt))&&Date.parse(e.createdAt)<=now);
 const day=86400000;
 const counts=(items:typeof events)=>({count:items.length,likes:items.filter(e=>e.action==='RIGHT'||e.action==='SUPER').length,superlikes:items.filter(e=>e.action==='SUPER').length,dislikes:items.filter(e=>e.action==='LEFT').length});
 return {total:events.length,activeDays:new Set(events.map(e=>e.createdAt.slice(0,10))).size,firstSwipe:events.reduce<string|null>((v,e)=>!v||e.createdAt<v?e.createdAt:v,null),categories:categories.map(category=>{const all=events.filter(e=>e.category===category);const recent=all.filter(e=>Date.parse(e.createdAt)>=now-30*day);const previous=all.filter(e=>Date.parse(e.createdAt)>=now-60*day&&Date.parse(e.createdAt)<now-30*day);const a=counts(recent),b=counts(previous);return {category,lifetime:counts(all),recent30:a,previous30:b,change:a.count>=5&&b.count>=5?Math.round(100*(a.likes/a.count-b.likes/b.count)):null}})};
}
