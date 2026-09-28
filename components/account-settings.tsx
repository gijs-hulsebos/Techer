'use client';
import {useState} from 'react';
import {useLanguage} from '@/lib/i18n';

const copy={
 en:{title:'Your account & data',request:'Request my data',remove:'Delete account',privacy:'We do not sell your data. We use it to personalise your feed and provide your analytics.',jev:'When you request a JEV analysis, your ratings and post context are processed through OpenRouter.',download:'Download JSON',cancel:'Cancel',confirm:'Permanently delete my account',warning:'This permanently deletes your Techer account, swipes, bookmarks, scores, analyses and model history. It cannot be undone. Your Google account is not deleted.',type:'Type DELETE to confirm',busy:'Please wait…',failed:'Something went wrong. Please try again.',scope:'These are your current account details and stored Techer records. Security credentials, internal job tokens, infrastructure logs and provider backups are excluded. Backups expire under provider retention policies. Shared public news is not personal account data.',empty:'No records',close:'Close data view'},
 nl:{title:'Je account en gegevens',request:'Mijn gegevens opvragen',remove:'Account verwijderen',privacy:'Wij verkopen je gegevens niet. We gebruiken ze om je feed te personaliseren en je analyses te maken.',jev:'Als je een JEV-analyse aanvraagt, worden je beoordelingen en postcontext via OpenRouter verwerkt.',download:'JSON downloaden',cancel:'Annuleren',confirm:'Mijn account definitief verwijderen',warning:'Dit verwijdert je Techer-account, swipes, bladwijzers, scores, analyses en modelgeschiedenis definitief. Dit kan niet ongedaan worden gemaakt. Je Google-account wordt niet verwijderd.',type:'Typ DELETE ter bevestiging',busy:'Even wachten…',failed:'Er ging iets mis. Probeer het opnieuw.',scope:'Dit zijn je huidige accountgegevens en opgeslagen Techer-records. Beveiligingsgegevens, interne taaktokens, infrastructuurlogs en back-ups van providers zijn uitgesloten. Back-ups verlopen volgens het bewaarbeleid van de provider. Openbaar nieuws is geen persoonlijk accountgegeven.',empty:'Geen gegevens',close:'Gegevens sluiten'},
 fr:{title:'Votre compte et vos données',request:'Demander mes données',remove:'Supprimer le compte',privacy:'Nous ne vendons pas vos données. Nous les utilisons pour personnaliser votre fil et fournir vos analyses.',jev:'Lorsque vous demandez une analyse JEV, vos évaluations et le contexte des publications sont traités via OpenRouter.',download:'Télécharger le JSON',cancel:'Annuler',confirm:'Supprimer définitivement mon compte',warning:'Cette action supprime définitivement votre compte Techer, vos choix, favoris, scores, analyses et historique du modèle. Elle est irréversible. Votre compte Google ne sera pas supprimé.',type:'Saisissez DELETE pour confirmer',busy:'Veuillez patienter…',failed:'Une erreur est survenue. Réessayez.',scope:'Voici vos informations de compte actuelles et vos données Techer. Les identifiants secrets, jetons internes, journaux techniques et sauvegardes du fournisseur sont exclus. Les sauvegardes expirent selon la politique du fournisseur. Les actualités publiques ne sont pas des données personnelles du compte.',empty:'Aucune donnée',close:'Fermer les données'},
 de:{title:'Dein Konto und deine Daten',request:'Meine Daten anfordern',remove:'Konto löschen',privacy:'Wir verkaufen deine Daten nicht. Wir nutzen sie, um deinen Feed zu personalisieren und deine Analysen bereitzustellen.',jev:'Wenn du eine JEV-Analyse anforderst, werden deine Bewertungen und Beitragsinhalte über OpenRouter verarbeitet.',download:'JSON herunterladen',cancel:'Abbrechen',confirm:'Mein Konto endgültig löschen',warning:'Dadurch werden dein Techer-Konto, Swipes, Lesezeichen, Bewertungen, Analysen und Modellverlauf endgültig gelöscht. Dies kann nicht rückgängig gemacht werden. Dein Google-Konto wird nicht gelöscht.',type:'Zur Bestätigung DELETE eingeben',busy:'Bitte warten…',failed:'Etwas ist schiefgelaufen. Bitte erneut versuchen.',scope:'Dies sind deine aktuellen Kontodaten und gespeicherten Techer-Datensätze. Zugangsdaten, interne Job-Token, Infrastrukturprotokolle und Anbieter-Backups sind ausgeschlossen. Backups verfallen nach den Aufbewahrungsregeln des Anbieters. Öffentliche Nachrichten sind keine persönlichen Kontodaten.',empty:'Keine Datensätze',close:'Datenansicht schließen'},
};
type AccountData={userId:string;exportedAt:string;account:{email?:string};records:Record<string,unknown[]>};
export function AccountSettings(){
 const {language}=useLanguage(),c=copy[language];
 const [data,setData]=useState<AccountData|null>(null),[showData,setShowData]=useState(false),[deleting,setDeleting]=useState(false),[confirmation,setConfirmation]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 async function load(forDeletion:boolean){
  setBusy(true);setError('');setData(null);setShowData(false);setDeleting(false);setConfirmation('');
  try{const r=await fetch('/api/account',{cache:'no-store'});if(!r.ok)throw Error();const next=await r.json();setData(next);setShowData(!forDeletion);setDeleting(forDeletion)}catch{setError(c.failed)}finally{setBusy(false)}
 }
 function download(){if(!data)return;const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='techer-my-data.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
 async function remove(){
  if(!data||confirmation!=='DELETE')return;
  setBusy(true);setError('');
  try{
   const r=await fetch('/api/account',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({userId:data.userId,confirmation})});
   if(!r.ok)throw Error();
   try{const prefix=`techer-outbox:${encodeURIComponent(data.userId)}:`;for(const key of Object.keys(localStorage))if(key.startsWith(prefix)||key==='techer-v2')localStorage.removeItem(key)}catch{}
   window.location.replace('/');
  }catch{setError(c.failed);setBusy(false)}
 }
 return <section className="account-settings" aria-labelledby="account-settings-title">
  <h3 id="account-settings-title">{c.title}</h3><p>{c.privacy}</p><p>{c.jev}</p>
  <div className="account-actions"><button type="button" disabled={busy} onClick={()=>void load(false)}>{c.request}</button><button type="button" className="account-danger" disabled={busy} onClick={()=>void load(true)}>{c.remove}</button></div>
  {busy&&<p role="status">{c.busy}</p>}{error&&<p role="alert">{error}</p>}
  {showData&&data&&<div className="account-data"><p>{c.scope}</p><p>{data.account.email} · {new Date(data.exportedAt).toLocaleString(language)}</p><button type="button" onClick={download}>{c.download}</button>
   {Object.entries({account:data.account,...data.records}).map(([key,value])=><details key={key}><summary>{key.replaceAll('_',' ')}{Array.isArray(value)?` (${value.length})`:''}</summary>{Array.isArray(value)&&!value.length?<p>{c.empty}</p>:<pre>{JSON.stringify(value,null,2)}</pre>}</details>)}
   <button type="button" onClick={()=>{setShowData(false);setData(null)}}>{c.close}</button>
  </div>}
  {deleting&&data&&<div className="account-delete"><strong>{data.account.email}</strong><p>{c.warning}</p><label htmlFor="delete-confirmation">{c.type}</label><input id="delete-confirmation" autoComplete="off" value={confirmation} disabled={busy} onChange={e=>setConfirmation(e.target.value)}/><button type="button" className="account-danger" disabled={busy||confirmation!=='DELETE'} onClick={()=>void remove()}>{c.confirm}</button><button type="button" disabled={busy} onClick={()=>{setDeleting(false);setConfirmation('');setData(null)}}>{c.cancel}</button></div>}
 </section>;
}
