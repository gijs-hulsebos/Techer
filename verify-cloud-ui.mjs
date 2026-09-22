import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const url='http://127.0.0.1:3017';const user='local_seedy';
const keys=JSON.parse(execFileSync(process.execPath,['C:/Program Files/nodejs/node_modules/npm/bin/npx-cli.js','--yes','supabase@2.117.0','projects','api-keys','--project-ref','akxsectksxkywgmrwhpo'],{encoding:'utf8'})).keys;
const secret=keys.find(k=>k.name==='service_role').api_key;
const browser=await chromium.launch({channel:'msedge',headless:true});
let ownsTestIdentity=false;
try{
 const existing=await fetch('https://akxsectksxkywgmrwhpo.supabase.co/rest/v1/techer_profiles?user_id=eq.local_seedy',{headers:{apikey:secret,Authorization:`Bearer ${secret}`}});assert.deepEqual(await existing.json(),[], 'Local test identity already has data; refusing to modify it');
 ownsTestIdentity=true;
 const context=await browser.newContext({viewport:{width:390,height:844}});const page=await context.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(url+'/signin-with-chatgpt?return_to=/');
 const saved=()=>page.getByText('Opgeslagen in Supabase',{exact:true}).waitFor({timeout:25000});
 await saved();await page.getByRole('button',{name:'Like',exact:true}).waitFor();
 await page.getByRole('button',{name:'Bewaar in leeslijst',exact:true}).click();await saved();
 await page.getByRole('button',{name:'Like',exact:true}).click();await page.waitForTimeout(400);await saved();
 let profile=await (await context.request.get(url+'/api/profile')).json();assert.equal(profile.state.interactions.length,1);assert.equal(profile.state.saved.length,1);
 const rating=await (await context.request.get(url+'/api/ratings')).json();assert.equal(rating.ratings.reduce((n,r)=>n+r.likes,0),1);
 await page.reload();await saved();await page.getByRole('button',{name:'Leeslijst',exact:true}).click();assert.equal(await page.locator('.library article').count(),1);
 await page.getByRole('button',{name:'Terug naar feed',exact:true}).click();
 // A transient outage must leave a durable outbox and recover on reload.
 await page.route('**/api/profile',route=>route.abort());await page.getByRole('button',{name:'Dislike',exact:true}).click();await page.waitForTimeout(400);
 assert.ok(await page.evaluate(()=>Object.keys(localStorage).some(k=>k.startsWith('techer-outbox:'))));
 await page.unroute('**/api/profile');await page.reload();await saved();
 profile=await (await context.request.get(url+'/api/profile')).json();assert.equal(profile.state.interactions.length,2);
 // Two independently opened tabs must preserve both new events.
 const second=await context.newPage();await second.goto(url);await second.getByText('Opgeslagen in Supabase',{exact:true}).waitFor();
 await Promise.all([page.getByRole('button',{name:'Like',exact:true}).click(),second.getByRole('button',{name:'Dislike',exact:true}).click()]);
 await page.waitForTimeout(500);await saved();await second.getByText('Opgeslagen in Supabase',{exact:true}).waitFor();
 profile=await (await context.request.get(url+'/api/profile')).json();assert.equal(profile.state.interactions.length,4);
 await page.getByRole('button',{name:'Vorige swipe herstellen'}).click();await saved();
 profile=await (await context.request.get(url+'/api/profile')).json();assert.equal(profile.state.interactions.length,3);
 assert.deepEqual(errors,[]);await page.screenshot({path:'preview-cloud-mobile.png'});
 console.log('PASS live UI + Supabase: bookmark, swipe, category ratings, reload, offline outbox recovery, two tabs, undo.');
}finally{
 await browser.close();
 if(ownsTestIdentity){const cleanup=await fetch('https://akxsectksxkywgmrwhpo.supabase.co/rest/v1/techer_profiles?user_id=eq.'+encodeURIComponent(user),{method:'DELETE',headers:{apikey:secret,Authorization:`Bearer ${secret}`}});if(!cleanup.ok)throw Error('Test cleanup failed')}
}
