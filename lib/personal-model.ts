import {categories, type Post, type Profile} from './radar';
export const FEATURE_VERSION=2;
export const MIN_LABELS=100;
export const NEW_LABELS=20;
const SIZE=72;
export type Sample={id:string;postId:string;at:string;y:number;x:number[];signature:string};
export type RankModel={version:number;weights:number[];trainedAt:string;trainedThrough:string;trainedCount:number;examples:Record<string,string>};
export type Metrics={candidate:number;baseline:number;incumbent:number|null;accuracy:number;testCount:number;trainCount:number;testStart:string;testEnd:string};
export type TrainingState={status:string;available:number;newLabels:number;checkedAt:string;metrics?:Metrics;reason:string};
export function hash(text:string){let n=2166136261;for(let i=0;i<text.length;i++)n=Math.imul(n^text.charCodeAt(i),16777619);return n>>>0}
export function features(post:Post){
 const x=Array(SIZE).fill(0) as number[];x[0]=1;const c=categories.indexOf(post.category);if(c>=0)x[1+c]=1;
 const words=new Set((post.title+' '+post.text.slice(0,1500)+' '+post.tags.join(' ')).toLowerCase().match(/[\p{L}\p{N}]{3,}/gu)??[]);
 for(const word of [...words].slice(0,250))x[8+hash(word)%64]+=1;
 const norm=Math.sqrt(x.slice(8).reduce((sum,v)=>sum+v*v,0))||1;for(let i=8;i<SIZE;i++)x[i]/=norm;
 return x;
}
export function examples(profile:Profile,now=Date.now()):Sample[]{
 const posts=new Map<string,Sample>();
 const ordered=[...profile.interactions].sort((a,b)=>a.createdAt.localeCompare(b.createdAt)||a.id.localeCompare(b.id));
 for(const e of ordered){if(!e.post||!['LEFT','RIGHT','SUPER'].includes(e.action)||!Number.isFinite(Date.parse(e.createdAt))||Date.parse(e.createdAt)>now)continue;
 const x=features(e.post);posts.set(e.postId,{id:e.id,postId:e.postId,at:e.createdAt,y:e.action==='SUPER'?1:e.action==='RIGHT'?.65:0,x,signature:JSON.stringify([e.id,e.action,e.createdAt,x])});}
 return [...posts.values()].sort((a,b)=>a.at.localeCompare(b.at)||a.id.localeCompare(b.id));
}
export function modelValid(model:RankModel|null,rows:Sample[]){if(!model||model.version!==FEATURE_VERSION||model.weights.length!==SIZE||model.weights.some(w=>!Number.isFinite(w)))return false;const current=new Map(rows.map(r=>[r.postId,r.signature]));return Object.entries(model.examples).every(([id,s])=>current.get(id)===s)}
function probability(weights:number[],x:number[]){const z=weights.reduce((s,w,i)=>s+w*x[i],0);return 1/(1+Math.exp(-Math.max(-25,Math.min(25,z))))}
export function predict(model:RankModel,post:Post){return probability(model.weights,features(post))}
export function fit(rows:Sample[],now:number){
 const w=Array(SIZE).fill(0) as number[];w[0]=Math.log((rows.reduce((n,r)=>n+r.y,0)+2)/(rows.reduce((n,r)=>n+1-r.y,0)+2));
 const recency=rows.map(r=>Math.max(.15,Math.exp(-(now-Date.parse(r.at))/(90*86400000))));const sum=recency.reduce((a,b)=>a+b,0);
 for(let epoch=0;epoch<160;epoch++){const grad=Array(SIZE).fill(0);for(let j=0;j<rows.length;j++){const r=rows[j],error=(probability(w,r.x)-r.y)*recency[j];for(let i=0;i<SIZE;i++)grad[i]+=error*r.x[i]}for(let i=0;i<SIZE;i++)w[i]-=.7*(grad[i]/sum+(i===0?0:.01*w[i]))}
 return w;
}
function loss(p:number,y:number){return -(y*Math.log(Math.max(1e-8,p))+(1-y)*Math.log(Math.max(1e-8,1-p)))}
export function train(profile:Profile,previous:RankModel|null,prior:TrainingState|null,now=Date.now()):{active:RankModel|null;state:TrainingState;candidate:RankModel|null}{
 const all=examples(profile,now),valid=modelValid(previous,all),active=valid?previous:null,rows=all.slice(-2000);
 const fresh=active?rows.filter(r=>Date.parse(r.at)>Date.parse(active.trainedThrough)):rows;
 const state:TrainingState={status:'collecting',available:all.length,newLabels:fresh.length,checkedAt:new Date(now).toISOString(),reason:'Minimaal 100 unieke posts, met minstens 15 likes en 15 dislikes nodig.'};
 if(rows.length<MIN_LABELS||rows.filter(r=>r.y).length<15||rows.filter(r=>!r.y).length<15)return {active,state,candidate:null};
 if(active&&fresh.length<NEW_LABELS){state.status='waiting';state.reason='Wachten op 20 nieuwe beoordeelde posts na de vorige training.';return {active,state,candidate:null}}
 // A rejected batch is not repeatedly reused as a holdout: wait for genuinely newer data.
 if(prior?.status==='rejected'&&rows.filter(r=>Date.parse(r.at)>Date.parse(prior.checkedAt)).length<NEW_LABELS&&(!previous||valid)){state.checkedAt=prior.checkedAt;state.status='rejected';state.reason='Vorige kandidaat niet beter; wachten op 20 nieuwe swipes.';state.metrics=prior.metrics;return {active,state,candidate:null}}
 const testSize=Math.min(100,Math.max(20,Math.floor(rows.length*.2)),active?fresh.length:rows.length-60);
 const test=rows.slice(-testSize),cutoff=test[0].at,training=rows.filter(r=>r.at<cutoff);
 if(training.length<60||test.filter(r=>r.y).length<3||test.filter(r=>!r.y).length<3){state.reason='Meer likes én dislikes verspreid over tijd nodig voor een eerlijke test.';return {active,state,candidate:null}}
 const weights=fit(training,now),base=(training.reduce((n,r)=>n+r.y,0)+2)/(training.length+4);
 const average=(fn:(r:Sample)=>number)=>test.reduce((s,r)=>s+fn(r),0)/test.length;
 const metrics:Metrics={candidate:average(r=>loss(probability(weights,r.x),r.y)),baseline:average(r=>loss(base,r.y)),incumbent:active?average(r=>loss(probability(active.weights,r.x),r.y)):null,accuracy:average(r=>Number((probability(weights,r.x)>=.5)===Boolean(r.y))),testCount:test.length,trainCount:training.length,testStart:test[0].at,testEnd:test.at(-1)!.at};
 const promoted=metrics.candidate<metrics.baseline*.98&&(metrics.incumbent===null||metrics.candidate<metrics.incumbent*.98);
 state.metrics=metrics;state.status=promoted?'active':'rejected';state.reason=promoted?'Kandidaat voorspelde minstens 2% beter op de apart gehouden recente swipes.':'Kandidaat niet duidelijk beter; vorige rangschikking blijft actief.';
 const candidate:RankModel={version:FEATURE_VERSION,weights:promoted?fit(rows,now):weights,trainedAt:new Date(now).toISOString(),trainedThrough:rows.at(-1)!.at,trainedCount:rows.length,examples:Object.fromEntries(rows.map(r=>[r.postId,r.signature]))};
 return {active:promoted?candidate:active,state,candidate};
}
export function personalizedOrder(posts:Post[],model:RankModel,seed:string,offset=0){
 const ranked=[...posts].sort((a,b)=>predict(model,b)-predict(model,a)||a.id.localeCompare(b.id));const pool=[...posts].sort((a,b)=>hash(seed+a.id)-hash(seed+b.id));const result:Post[]=[];const used=new Set<string>();
 for(let slot=0;slot<posts.length;slot++){const source=(slot+offset)%7===6?pool:ranked;const next=source.find(p=>!used.has(p.id));if(next){result.push(next);used.add(next.id)}}return result;
}
