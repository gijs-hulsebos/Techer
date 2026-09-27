'use client';
import {useLanguage} from '@/lib/i18n';
import {useEffect,useState} from 'react';
import {Heart,RefreshCw,X,BarChart3} from 'lucide-react';
import {RatingsOverview,type Activity} from './ratings-overview';
import {ModelPanel} from './model-panel';
import {AnalysisHistory} from './analysis-history';
import {AnalysisCharts} from './analysis-charts';
import type {JevAnalysis} from '@/lib/jev-analysis';
type Rating={category:string;rated_posts:number;likes:number;superlikes:number;dislikes:number;preference_score:number;average_dwell_ms:number};
const names:Record<string,string>={AI:'AI',ROBOTICS:'Robotics',XR:'XR',DEV:'Dev',HARDWARE:'Hardware',STARTUPS:'Startups',SCIENCE:'Science'};
export function Analytics({revision}:{revision:number}){
 const {t,locale,language}=useLanguage();

 const [history,setHistory]=useState<JevAnalysis[]>([]);
 const [analysis,setAnalysis]=useState<JevAnalysis|null>(null),[jevEnabled,setJevEnabled]=useState(false),[analyzing,setAnalyzing]=useState(false),[analysisError,setAnalysisError]=useState('');
 useEffect(()=>{let live=true;fetch('/api/analysis',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json()}).then(raw=>{const d=raw as {enabled:boolean;history?:JevAnalysis[];analysis?:{result?:JevAnalysis}};if(live){setJevEnabled(d.enabled);setHistory(d.history??[]);setAnalysis(d.analysis?.result??null)}}).catch(()=>{if(live)setAnalysisError(t("JEV-status niet beschikbaar."))});return()=>{live=false}},[]);
 async function runAnalysis(){setAnalyzing(true);setAnalysisError('');try{const r=await fetch('/api/analysis',{method:'POST'});const d=await r.json() as {error?:string;analysis?:{result:JevAnalysis}};if(!r.ok||!d.analysis)throw Error(d.error||t("Analyse mislukt."));setAnalysis(d.analysis.result);setHistory(h=>[d.analysis!.result,...h].slice(0,90))}catch(e){setAnalysisError(e instanceof Error?e.message:t("Analyse mislukt."))}finally{setAnalyzing(false)}}
 const [activity,setActivity]=useState<Activity[]>([]);
 const [rows,setRows]=useState<Rating[]>([]),[state,setState]=useState('loading'),[attempt,setAttempt]=useState(0);
 useEffect(()=>{const controller=new AbortController();setState('loading');fetch('/api/ratings',{cache:'no-store',signal:controller.signal}).then(async r=>{if(!r.ok)throw Error();const data=await r.json() as {enabled:boolean;ratings:Rating[];activity?:Activity[]};if(!data.enabled){setState('disabled');return}setRows(data.ratings);setActivity(data.activity??[]);setState('ready')}).catch(e=>{if(e.name!=='AbortError')setState('error')});return()=>controller.abort()},[revision,attempt]);
 const total=rows.reduce((n,r)=>n+r.rated_posts,0),likes=rows.reduce((n,r)=>n+r.likes,0),dislikes=rows.reduce((n,r)=>n+r.dislikes,0);
 return <section className="analytics"><div className="analytics-heading"><div><span className="eyebrow">{""}{t("JOUW VOORKEUREN")}{' '}</span><h1>Analytics</h1></div><button aria-label={t("Analytics vernieuwen")} onClick={()=>setAttempt(n=>n+1)}><RefreshCw size={19}/></button></div>
 {state==='loading'?<p role="status">{""}{t("Je ratings laden…")}{' '}</p>:state==='error'?<div className="analytics-message"><p>{""}{t("Je ratings konden niet worden geladen.")}{' '}</p><button onClick={()=>setAttempt(n=>n+1)}>{""}{t("Opnieuw proberen")}{' '}</button></div>:state==='disabled'?<p>{""}{t("Analytics is beschikbaar zodra de database is verbonden.")}{' '}</p>:<>
 <RatingsOverview rows={rows} activity={activity}/><ModelPanel/><div className="metric-grid" style={{marginTop:20}}><div><BarChart3 size={18}/><strong>{total}</strong><span>Swipes</span></div><div><Heart size={18}/><strong>{likes}</strong><span>Likes</span></div><div><X size={18}/><strong>{dislikes}</strong><span>Dislikes</span></div></div>
 <div className="analytics-section-title"><h2>{""}{t("Per categorie")}{' '}</h2><span>Dislike / like / superlike</span></div>
 {!total&&<p className="analytics-empty">{""}{t("Je eerste swipe is het begin. Hier zie je welke onderwerpen je aanspreken.")}{' '}</p>}
 <div className="category-ratings">{rows.map(r=><article key={r.category}><div className="rating-label"><h3>{names[r.category]??r.category}</h3><span>{r.dislikes} / {r.likes} / {r.superlikes??0}</span></div><div className="rating-track" aria-label={`${names[r.category]}: ${r.likes} likes, ${r.superlikes??0} superlikes, ${r.dislikes} dislikes`}><span style={{width:r.rated_posts?`${(r.likes+(r.superlikes??0))/r.rated_posts*100}%`:'0%'}}/></div><div className="rating-detail"><span>{r.rated_posts?t('{count}% geliket',{count:Math.round((r.likes+(r.superlikes??0))/r.rated_posts*100)}):t("Nog geen swipes")}</span><span>{r.rated_posts?t('Voorkeur {score}/100',{score:Math.round(Number(r.preference_score))}):'—'}</span></div></article>)}</div>
 <p className="analytics-note">{""}{t("Voorkeur weegt dislike, like en superlike als 0, 1 en 2, met een neutrale startscore van 50. Met meer swipes krijgt je eigen gedrag meer gewicht. Bewaren telt niet als like.")}{' '}</p>
 <div className="jev-status"><span>{""}{t("JEV-analyse")}{' '}</span><strong>{jevEnabled?t("Verbonden"):t("Niet actief")}</strong><p>{analysis?(analysis.evidence?t('{count} swipes in historisch profiel · ',{count:analysis.evidence.total}):'')+t('{count} recente postfragmenten · {date}',{count:analysis.swipesUsed,date:new Date(analysis.createdAt).toLocaleDateString(locale)}):t("Laat JEV je voorkeuren uit je likes en dislikes analyseren.")}</p>{analysis&&<AnalysisCharts analysis={analysis} rows={rows}/>}{analysis&&<AnalysisHistory analysis={analysis} history={history}/>}{jevEnabled&&<button className="primary" disabled={analyzing||!total} onClick={()=>void runAnalysis()}>{analyzing?t("Analyseren…"):analysis?t("Opnieuw analyseren"):t("Analyseer met JEV")}</button>}{analysisError&&<p role="alert">{analysisError}</p>}<p>{""}{t("JEV schat voorkeuren; de scores zijn geen zekerheid. Een hoge confidence bij 50 kan betekenen dat er onvoldoende bewijs is. Maximaal één analyse per 10 minuten en 12 per dag.")}{' '}</p></div>
 </> }</section>;
}
