'use client';
import {createContext,useContext,useEffect,useState,type ReactNode} from 'react';
import messages from './translations.json';
export type Language='en'|'fr'|'de'|'nl';
export const languages=[{id:'en',label:'ENG · English'},{id:'fr',label:'FR · Français'},{id:'de',label:'DE · Deutsch'},{id:'nl',label:'NL · Nederlands'}] as const;
export function isLanguage(value:unknown):value is Language{return languages.some(l=>l.id===value)}
const LanguageContext=createContext<{language:Language;setLanguage:(l:Language)=>void}>({language:'en',setLanguage:()=>{}});
export function LanguageProvider({children,initialLanguage='en'}:{children:ReactNode;initialLanguage?:Language}){
 const [language,setLanguage]=useState<Language>(initialLanguage);
 useEffect(()=>{document.documentElement.lang=language},[language]);
 function change(next:Language){if(!isLanguage(next))return;setLanguage(next);document.cookie=`techer-language=${next}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol==='https:'?'; Secure':''}`;}
 return <LanguageContext.Provider value={{language,setLanguage:change}}>{children}</LanguageContext.Provider>;
}
export function useLanguage(){const context=useContext(LanguageContext);const locale={en:'en-GB',fr:'fr-FR',de:'de-DE',nl:'nl-NL'}[context.language];
 function t(key:string,values:Record<string,string|number>={}){const entry=(messages as Record<string,string[]>)[key];const text=context.language==='nl'?key:entry?.[{en:0,fr:1,de:2}[context.language]]??key;return text.replace(/\{(\w+)\}/g,(match,k)=>String(values[k]??match))}
 return {...context,locale,t};
}
export function LanguageSelect(){const {language,setLanguage,t}=useLanguage();return <div className="language-setting"><label htmlFor="techer-language">{t('Taal')}</label><select id="techer-language" value={language} onChange={e=>{if(isLanguage(e.target.value))setLanguage(e.target.value)}}>{languages.map(l=><option value={l.id} key={l.id}>{l.label}</option>)}</select><p>{t('Interfacetaal. Nieuws blijft in de oorspronkelijke taal.')}</p></div>}
