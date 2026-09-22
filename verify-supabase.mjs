import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const ref='akxsectksxkywgmrwhpo';
const result=JSON.parse(execFileSync(process.execPath,['C:/Program Files/nodejs/node_modules/npm/bin/npx-cli.js','--yes','supabase@2.117.0','projects','api-keys','--project-ref',ref],{encoding:'utf8'}));
const secret=result.keys.find(k=>k.name==='service_role').api_key;
const anon=result.keys.find(k=>k.name==='anon').api_key;
const base=`https://${ref}.supabase.co/rest/v1/`;
async function req(path,body,method=body?'POST':'GET',key=secret){const r=await fetch(base+path,{method,headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});const text=await r.text();if(!r.ok)throw Error(`Database request failed ${r.status}: ${text.slice(0,300)}`);return text?JSON.parse(text):null}
const a='test:'+crypto.randomUUID(),b='test:'+crypto.randomUUID();
const post={id:'test-post',title:'Database test',text:'Test',category:'AI',tags:[],author:'test',handle:'test',url:'https://example.com',source:'test',sourceCategory:'AI',related:[],publishedAt:new Date().toISOString()};
const event={id:crypto.randomUUID(),postId:post.id,post,category:'AI',action:'RIGHT',dwellTime:100,createdAt:new Date().toISOString()};
const profile={interests:['AI'],interactions:[event],saved:[post]};
const write=(u,revision,p)=>req('rpc/techer_save_profile',{p_user_id:u,p_expected_revision:revision,p_state:p});
try{
 assert.equal(await write(a,0,profile),1);
 assert.equal(await write(b,0,{interests:[],interactions:[],saved:[]}),1);
 assert.equal(await write(a,0,{interests:[],interactions:[],saved:[]}),-1);
 const ratings=await req('techer_category_ratings?user_id=eq.'+encodeURIComponent(a));
 assert.equal(ratings.length,7);assert.equal(ratings.find(x=>x.category==='AI').likes,1);assert.equal(Number(ratings.find(x=>x.category==='AI').preference_score),60);
 assert.equal((await req('techer_swipes?user_id=eq.'+encodeURIComponent(b))).length,0);
 const blocked=await fetch(base+'techer_profiles',{headers:{apikey:anon}});assert.ok([401,403].includes(blocked.status));
 const race=await Promise.all([write(a,1,profile),write(a,1,profile)]);assert.deepEqual(race.sort((x,y)=>x-y),[-1,2]);
 assert.equal(await write(a,2,{...profile,interactions:[]}),3);
 assert.equal((await req('techer_category_ratings?user_id=eq.'+encodeURIComponent(a))).find(x=>x.category==='AI').likes,0);
 assert.equal((await req('techer_bookmarks?user_id=eq.'+encodeURIComponent(a))).length,1);
 console.log('PASS live Supabase: seven categories, save/reload, separate users, anonymous denied, atomic concurrent revisions, undo updates ratings, bookmarks independent.');
}finally{for(const u of [a,b])await req('techer_profiles?user_id=eq.'+encodeURIComponent(u),undefined,'DELETE')}
