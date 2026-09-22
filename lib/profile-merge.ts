import type {Profile} from './radar';
// Apply only changes made relative to base. Preserve unrelated remote writes.
function mergeRecords<T extends {id:string}>(base:T[],local:T[],remote:T[]){
 const before=new Map(base.map(x=>[x.id,x])),after=new Map(local.map(x=>[x.id,x]));
 const result=new Map(remote.map(x=>[x.id,x]));
 for(const id of before.keys())if(!after.has(id))result.delete(id);
 for(const [id,value] of after)if(!before.has(id)||JSON.stringify(before.get(id))!==JSON.stringify(value))result.set(id,value);
 return [...result.values()];
}
export function mergeProfile(base:Profile,local:Profile,remote:Profile):Profile{
 const interests=new Set(remote.interests);
 for(const c of base.interests)if(!local.interests.includes(c))interests.delete(c);
 for(const c of local.interests)if(!base.interests.includes(c))interests.add(c);
 return {interests:[...interests],saved:mergeRecords(base.saved,local.saved,remote.saved),interactions:mergeRecords(base.interactions,local.interactions,remote.interactions).sort((a,b)=>a.createdAt.localeCompare(b.createdAt))};
}
