'use client';
import {useEffect,useState} from 'react';
import {Heart,RefreshCw,X,BarChart3} from 'lucide-react';
type Rating={category:string;rated_posts:number;likes:number;dislikes:number;preference_score:number;average_dwell_ms:number};
const names:Record<string,string>={AI:'AI',ROBOTICS:'Robotics',XR:'XR',DEV:'Dev',HARDWARE:'Hardware',STARTUPS:'Startups',SCIENCE:'Science'};
export function Analytics({revision}:{revision:number}){
 const [rows,setRows]=useState<Rating[]>([]),[state,setState]=useState('loading'),[attempt,setAttempt]=useState(0);
 useEffect(()=>{const controller=new AbortController();setState('loading');fetch('/api/ratings',{cache:'no-store',signal:controller.signal}).then(async r=>{if(!r.ok)throw Error();const data=await r.json() as {enabled:boolean;ratings:Rating[]};if(!data.enabled){setState('disabled');return}setRows(data.ratings);setState('ready')}).catch(e=>{if(e.name!=='AbortError')setState('error')});return()=>controller.abort()},[revision,attempt]);
 const total=rows.reduce((n,r)=>n+r.rated_posts,0),likes=rows.reduce((n,r)=>n+r.likes,0),dislikes=rows.reduce((n,r)=>n+r.dislikes,0);
 return <section className="analytics"><div className="analytics-heading"><div><span className="eyebrow">JOUW VOORKEUREN</span><h1>Analytics</h1></div><button aria-label="Analytics vernieuwen" onClick={()=>setAttempt(n=>n+1)}><RefreshCw size={19}/></button></div>
 {state==='loading'?<p role="status">Je ratings laden…</p>:state==='error'?<div className="analytics-message"><p>Je ratings konden niet worden geladen.</p><button onClick={()=>setAttempt(n=>n+1)}>Opnieuw proberen</button></div>:state==='disabled'?<p>Analytics is beschikbaar zodra de database is verbonden.</p>:<>
 <div className="metric-grid"><div><BarChart3 size={18}/><strong>{total}</strong><span>Swipes</span></div><div><Heart size={18}/><strong>{likes}</strong><span>Likes</span></div><div><X size={18}/><strong>{dislikes}</strong><span>Dislikes</span></div></div>
 <div className="analytics-section-title"><h2>Per categorie</h2><span>Like / dislike</span></div>
 {!total&&<p className="analytics-empty">Je eerste swipe is het begin. Hier zie je welke onderwerpen je aanspreken.</p>}
 <div className="category-ratings">{rows.map(r=><article key={r.category}><div className="rating-label"><h3>{names[r.category]??r.category}</h3><span>{r.likes} / {r.dislikes}</span></div><div className="rating-track" aria-label={`${names[r.category]}: ${r.likes} likes en ${r.dislikes} dislikes`}><span style={{width:r.rated_posts?`${r.likes/r.rated_posts*100}%`:'0%'}}/></div><div className="rating-detail"><span>{r.rated_posts?`${Math.round(r.likes/r.rated_posts*100)}% geliket`:'Nog geen swipes'}</span><span>{r.rated_posts?`Voorkeur ${Math.round(Number(r.preference_score))}/100`:'—'}</span></div></article>)}</div>
 <p className="analytics-note">Voorkeur gebruikt een neutrale startscore van 50. Met meer swipes krijgt je eigen gedrag meer gewicht. Bewaren telt niet als like.</p>
 <div className="jev-status"><span>JEV-analyse</span><strong>Nog niet actief</strong><p>Je ratings worden al opgeslagen. JEV-scores volgen zodra de koppeling is geactiveerd.</p></div>
 </> }</section>;
}
