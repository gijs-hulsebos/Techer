import {z} from 'zod';
export const sourceKinds=['X_LIST','X_ACCOUNT','RSS','WEBSITE','HACKER_NEWS'] as const;
export type Source = {id:string;kind:typeof sourceKinds[number];locator:string};
export const classificationSchema=z.object({category:z.enum(['AI','ROBOTICS','XR','DEV','HARDWARE','STARTUPS','SCIENCE']),topics:z.array(z.string()).max(30),entities:z.array(z.string()).max(30),contentType:z.enum(['PRODUCT_LAUNCH','RESEARCH','ANALYSIS','TUTORIAL','NEWS']),technicalDepth:z.number().min(0).max(1),novelty:z.number().min(0).max(1),signalScore:z.number().min(0).max(1)}).strict();
export const normalizedSchema=z.object({externalId:z.string().min(1),sourceId:z.string().min(1),author:z.string(),handle:z.string().optional(),text:z.string().min(1),url:z.string().url().refine(v=>v.startsWith('https://'),'Only HTTPS URLs are accepted'),publishedAt:z.string().datetime(),media:z.array(z.object({type:z.enum(['IMAGE','VIDEO','LINK']),url:z.string().url().refine(v=>v.startsWith('https://'))})).default([])});
export type NormalizedPost=z.infer<typeof normalizedSchema>;
export type ClassifiedPost=NormalizedPost&{id:string;classification:z.infer<typeof classificationSchema>;embedding:number[]};
export interface SourceAdapter {fetch(source:Source):Promise<NormalizedPost[]>}
export interface IntelligenceProvider {classify(post:NormalizedPost):Promise<unknown>;embed(post:NormalizedPost):Promise<number[]>}
export interface PostRepository {exists(id:string):Promise<boolean>;insertOnce(post:ClassifiedPost):Promise<void>}
export type AdapterRegistry=Partial<Record<Source['kind'],SourceAdapter>>;

/** Server-only contract: wire a verified JEV SDK implementation here after configuration.
 * Never call an invented provider URL or use a demo vector as a semantic embedding. */
export function jevProvider(classify:(post:NormalizedPost)=>Promise<unknown>,embed:(post:NormalizedPost)=>Promise<number[]>):IntelligenceProvider{return {classify,embed}}
export function canonicalUrl(raw:string){const u=new URL(raw);u.hash='';for(const key of [...u.searchParams.keys()])if(key.startsWith('utm_')||['fbclid','gclid'].includes(key))u.searchParams.delete(key);u.searchParams.sort();u.pathname=u.pathname.replace(/\/$/,'')||'/';return u.toString()}
async function fingerprint(value:string){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));return [...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,'0')).join('')}
export async function ingest(source:Source,adapters:AdapterRegistry,ai:IntelligenceProvider,repository:PostRepository,dimensions:number){const adapter=adapters[source.kind];if(!adapter)throw Error(`Adapter not configured: ${source.kind}`);const incoming=await adapter.fetch(source);let inserted=0,duplicates=0;const batch=new Set<string>();for(const raw of incoming){const post=normalizedSchema.parse({...raw,sourceId:source.id,url:canonicalUrl(raw.url)});const id=await fingerprint(post.url);if(batch.has(id)||await repository.exists(id)){duplicates++;continue}batch.add(id);const classification=classificationSchema.parse(await ai.classify(post));const embedding=await ai.embed(post);if(!Number.isInteger(dimensions)||dimensions<1||embedding.length!==dimensions||!embedding.every(Number.isFinite)||embedding.every(n=>n===0))throw Error('Invalid embedding dimensions or values');await repository.insertOnce({...post,id,classification,embedding});inserted++}return {inserted,duplicates}}

async function getJson(url:string){const r=await fetch(url,{signal:AbortSignal.timeout(12000)});if(!r.ok)throw Error(`Source fetch failed (${r.status})`);return r.json()}
const hnItem=z.object({id:z.number(),title:z.string().optional(),by:z.string().optional(),url:z.string().optional(),time:z.number(),deleted:z.boolean().optional(),dead:z.boolean().optional()}).nullable();
/** Public HN API adapter. Invoked only by an explicitly configured ingestion job. */
export const hackerNewsAdapter:SourceAdapter={async fetch(source){if(source.kind!=='HACKER_NEWS')throw Error('Wrong adapter');const ids=z.array(z.number().int()).parse(await getJson('https://hacker-news.firebaseio.com/v0/topstories.json'));const records=await Promise.all(ids.slice(0,20).map(async id=>hnItem.parse(await getJson(`https://hacker-news.firebaseio.com/v0/item/${id}.json`))));return records.flatMap(r=>!r||r.deleted||r.dead||!r.title?[]:[{externalId:String(r.id),sourceId:source.id,author:r.by||'Hacker News',text:r.title,url:r.url?.startsWith('https://')?r.url:`https://news.ycombinator.com/item?id=${r.id}`,publishedAt:new Date(r.time*1000).toISOString(),media:[]}])}};
/** Connect a server-side X/RSS/website client that returns normalized posts. */
export function sourceAdapter(kind:Source['kind'],fetchNormalized:(locator:string)=>Promise<NormalizedPost[]>):SourceAdapter{return {async fetch(source){if(source.kind!==kind)throw Error('Wrong source kind');return (await fetchNormalized(source.locator)).map(p=>normalizedSchema.parse({...p,sourceId:source.id}))}}}
