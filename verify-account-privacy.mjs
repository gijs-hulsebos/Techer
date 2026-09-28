import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
const state={user:{id:'account-A',email:'a@example.invalid'},deleted:[],exported:[],failDelete:false};globalThis.privacyTest=state;
const stubs={
 '@/lib/auth-server':`export async function authenticatedUser(){return globalThis.privacyTest.user} export async function authClient(){return {auth:{signOut:async()=>({error:null})}}}`,
 '@/lib/account-admin':`export async function deleteAuthAccount(id){if(globalThis.privacyTest.failDelete)throw Error('failed');globalThis.privacyTest.deleted.push(id)}`,
 '@/lib/supabase-store':`export async function supabaseRequest(path,init){const id=JSON.parse(init.body).p_user_id;globalThis.privacyTest.exported.push(id);return {profiles:[{user_id:id}],swipes:[]}}`,
};
registerHooks({resolve(s,c,next){if(stubs[s])return{url:'data:text/javascript,'+encodeURIComponent(stubs[s]),shortCircuit:true};if(s==='@/lib/account-access')return next(new URL('./lib/account-access.ts',import.meta.url).href,c);return next(s,c)}});
const {GET,DELETE}=await import('./app/api/account/route.ts');
const base='https://techer-three.vercel.app';
function req(body,origin=base){return new Request(base+'/api/account?userId=account-B',{method:'DELETE',headers:{origin,'Content-Type':'application/json','x-user-id':'account-B'},body:JSON.stringify(body)})}
const exported=await GET();assert.equal(exported.status,200);assert.match(exported.headers.get('cache-control'),/no-store/);assert.equal((await exported.json()).userId,'account-A');assert.deepEqual(state.exported,['account-A']);
assert.equal((await DELETE(req({userId:'account-A',confirmation:'DELETE'},'https://evil.invalid'))).status,403);
assert.equal((await DELETE(req({userId:'account-B',confirmation:'DELETE'}))).status,409);
assert.equal((await DELETE(req({confirmation:'DELETE'}))).status,409);
assert.equal((await DELETE(req({userId:'account-A',confirmation:'no'}))).status,400);
assert.deepEqual(state.deleted,[]);
state.user=null;assert.equal((await GET()).status,401);assert.equal((await DELETE(req({userId:'account-A',confirmation:'DELETE'}))).status,401);
state.user={id:'account-A'};state.failDelete=true;assert.equal((await DELETE(req({userId:'account-A',confirmation:'DELETE'}))).status,503);assert.deepEqual(state.deleted,[]);
state.failDelete=false;assert.equal((await DELETE(req({userId:'account-A',confirmation:'DELETE'}))).status,200);assert.deepEqual(state.deleted,['account-A']);
console.log('PASS: export binds to verified identity; deletion rejects cross-origin, cross-account, missing confirmation and logged-out requests; failures do not report success; only the verified account is deleted.');
