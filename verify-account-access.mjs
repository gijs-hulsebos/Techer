import assert from 'node:assert/strict';
import {hasGoogleIdentity,assertExpectedAccount} from './lib/account-access.ts';
assert.equal(hasGoogleIdentity({identities:[{provider:'google'}]}),true);
assert.equal(hasGoogleIdentity({identities:[{provider:'email'}]}),false);
assert.equal(hasGoogleIdentity({user_metadata:{provider:'google'},identities:[]}),false);
assert.equal(hasGoogleIdentity(null),false);
assert.doesNotThrow(()=>assertExpectedAccount('A','A'));
for(const expected of ['B',undefined,null,{},1])assert.throws(()=>assertExpectedAccount('A',expected),/ACCOUNT_CHANGED/);
const {saveCloudProfile}=await import('./lib/cloud-profile-client.ts');
let sent;globalThis.fetch=async(_url,init)=>{sent=JSON.parse(init.body);return new Response(JSON.stringify({code:'ACCOUNT_CHANGED'}),{status:409})};
await assert.rejects(saveCloudProfile({interests:[],saved:[],interactions:[]},1,'A'),/ACCOUNT_CHANGED/);assert.equal(sent.userId,'A');
globalThis.fetch=async()=>new Response('{}',{status:409});await assert.rejects(saveCloudProfile({interests:[],saved:[],interactions:[]},1,'A'),/REVISION_CONFLICT/);
console.log('PASS: Google identity gate, spoofed metadata rejection, account binding, and account-change vs revision conflict handling.');

// Exercise the real route with only its storage boundary replaced.
const {registerHooks}=await import('node:module');
const storageStub=`export function storageConfigured(){return true} export async function siteUser(){if(!globalThis.auditUser)throw Error('AUTH_REQUIRED');return globalThis.auditUser} export async function readProfile(){return {state:null,revision:0}} export async function writeProfile(user,revision,profile){globalThis.auditWrites.push({user,revision,profile});return revision+1}`;
const hook=registerHooks({resolve(specifier,context,next){if(specifier==='@/lib/supabase-store')return {url:'data:text/javascript,'+encodeURIComponent(storageStub),shortCircuit:true};if(specifier.startsWith('@/lib/'))return next(new URL('./lib/'+specifier.slice(6)+'.ts',import.meta.url).href,context);return next(specifier,context)}});
const {GET,PUT}=await import('./app/api/profile/route.ts');
globalThis.auditUser='B';globalThis.auditWrites=[];
const profile={interests:['AI'],saved:[],interactions:[]};
function request(userId){return new Request('https://techer-three.vercel.app/api/profile',{method:'PUT',headers:{origin:'https://techer-three.vercel.app'},body:JSON.stringify({userId,revision:0,profile})})}
for(const identity of ['A',undefined]){const r=await PUT(request(identity));assert.equal(r.status,409);assert.equal((await r.json()).code,'ACCOUNT_CHANGED')}
assert.equal(globalThis.auditWrites.length,0,'stale account writes must never reach storage');
assert.equal((await PUT(request('B'))).status,200);assert.equal(globalThis.auditWrites[0].user,'B');
const fresh=await (await GET(new Request('https://techer-three.vercel.app/api/profile'))).json();assert.equal(fresh.userId,'B');assert.equal(fresh.state,null);assert.equal(fresh.revision,0);
globalThis.auditUser=null;assert.equal((await PUT(request('B'))).status,401);assert.equal(globalThis.auditWrites.length,1);
hook.deregister();console.log('PASS: real profile route rejects cross-account/missing identity before storage, accepts own writes, and returns a clean new profile.');
