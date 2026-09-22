'use client';
import {useCallback,useEffect,useRef,useState,type SetStateAction} from 'react';
import {initialProfile,type Profile} from './radar';
import {profileSchema} from './profile-schema';
import {loadCloudProfile,saveCloudProfile} from './cloud-profile-client';
import {mergeProfile} from './profile-merge';
type Pending={id:string;created:number;base:Profile;local:Profile};
type Status='loading'|'local'|'saved'|'saving'|'offline'|'error';
const LEGACY='techer-v2';
export function useCloudProfile(){
 const [profile,render]=useState<Profile>(initialProfile),[ready,setReady]=useState(false),[status,setStatus]=useState<Status>('loading');
 const current=useRef(initialProfile),user=useRef(''),mode=useRef('loading'),active=useRef(false),alive=useRef(true);
 const prefix=()=>`techer-outbox:${encodeURIComponent(user.current)}:`;
 function pending(){const result:Pending[]=[];for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i)!;if(key.startsWith(prefix())){const item=JSON.parse(localStorage.getItem(key)!);profileSchema.parse(item.base);profileSchema.parse(item.local);result.push(item)}}return result.sort((a,b)=>a.created-b.created||a.id.localeCompare(b.id))}
 function display(p:Profile){current.current=p;if(alive.current)render(p)}
 function queue(base:Profile,local:Profile){const id=crypto.randomUUID();localStorage.setItem(prefix()+id,JSON.stringify({id,created:Date.now(),base,local}));}
 const flush=useRef<()=>Promise<void>>(async()=>{});
 flush.current=async()=>{
  if(active.current||mode.current!=='cloud')return;
  active.current=true;
  try{
   const work=async()=>{
    let remote=await loadCloudProfile();
    if(!remote.enabled||remote.userId!==user.current)throw Error('ACCOUNT_CHANGED');
    for(const item of pending()){
     setStatus('saving');let saved=false;
     for(let attempt=0;attempt<3;attempt++){
      const next=mergeProfile(item.base,item.local,remote.state??initialProfile);profileSchema.parse(next);
      try{const result=await saveCloudProfile(next,remote.revision??0);remote={...remote,state:next,revision:result.revision};localStorage.removeItem(prefix()+item.id);saved=true;break}
      catch(error){if(!(error instanceof Error)||error.message!=='REVISION_CONFLICT')throw error;remote=await loadCloudProfile();if(remote.userId!==user.current)throw Error('ACCOUNT_CHANGED')}
     }
     if(!saved)throw Error('BUSY');
    }
    const remaining=pending();display(remaining.reduce((p,item)=>mergeProfile(item.base,item.local,p),remote.state??initialProfile));
    setStatus(remaining.length?'saving':'saved');
   };
   if(navigator.locks)await navigator.locks.request('techer-sync:'+user.current,work);else await work();
  }catch{if(alive.current)setStatus('offline')}finally{active.current=false}
 };
 const initialize=useRef<()=>Promise<void>>(async()=>{});
 initialize.current=async()=>{
  if(mode.current==='cloud'){await flush.current();return}
  setStatus('loading');
  try{
   const remote=await loadCloudProfile();if(!alive.current)return;
   let legacy:Profile|undefined;try{const raw=localStorage.getItem(LEGACY);if(raw)legacy=profileSchema.parse(JSON.parse(raw))}catch{}
   if(!remote.enabled){mode.current='local';display(legacy??initialProfile);setStatus('local');setReady(true);return}
   if(!remote.userId)throw Error('AUTH_REQUIRED');user.current=remote.userId;
   const marker='techer-imported:'+encodeURIComponent(user.current);
   const legacyOwner=localStorage.getItem('techer-legacy-owner');
   if(!localStorage.getItem(marker)){
    // Import once. Events retain their UUIDs, so retries cannot duplicate swipes.
    if(legacy&&(!legacyOwner||legacyOwner===user.current)){queue(initialProfile,legacy);localStorage.setItem('techer-legacy-owner',user.current)}
    localStorage.setItem(marker,'1');
   }
   const merged=pending().reduce((p,item)=>mergeProfile(item.base,item.local,p),remote.state??initialProfile);
   display(merged);mode.current='cloud';setReady(true);await flush.current();
  }catch{if(alive.current)setStatus('error')}
 };
 useEffect(()=>{alive.current=true;void initialize.current();const retry=()=>void initialize.current();const timer=setInterval(retry,15000);window.addEventListener('online',retry);window.addEventListener('focus',retry);return()=>{alive.current=false;clearInterval(timer);window.removeEventListener('online',retry);window.removeEventListener('focus',retry)}},[]);
 const setProfile=useCallback((value:SetStateAction<Profile>)=>{
  if(mode.current==='loading')return;
  const next=typeof value==='function'?value(current.current):value;
  try{profileSchema.parse(next);if(mode.current==='cloud')queue(current.current,next);else localStorage.setItem(LEGACY,JSON.stringify(next));display(next);if(mode.current==='cloud'){setStatus('saving');void flush.current()}}
  catch{setStatus('error')}
 },[]);
 return {profile,setProfile,ready,status,retry:()=>void initialize.current()};
}
