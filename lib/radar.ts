import {xPostId} from './x-post';
export const categories = ['AI','ROBOTICS','XR','DEV','HARDWARE','STARTUPS','SCIENCE'] as const;
export type Category = typeof categories[number];
export type Action = 'RIGHT'|'LEFT'|'SUPER'|'SAVE'|'OPEN';
export type Post = {id:string;title:string;text:string;category:Category;tags:string[];author:string;handle:string;url:string;source:string;sourceCategory:string;related:Category[];publishedAt:string};
export type Interaction = {id:string;postId:string;category:Category;post?:Post;action:Action;user_rating?:0|1|2;dwellTime:number;createdAt:string};
export type Profile = {interests:Category[];interactions:Interaction[];saved:Post[]};
export const initialProfile:Profile={interests:['AI','DEV'],interactions:[],saved:[]};
export function affinity(profile:Profile,category:Category){return Math.max(-3,Math.min(6,(profile.interests.includes(category)?1:0)+profile.interactions.reduce((n,e)=>n+(e.category===category?{RIGHT:.7,SUPER:1.4,LEFT:-.5,SAVE:0,OPEN:0}[e.action]:0),0)))}
export function rank(posts:Post[],profile:Profile,filter:string){
 const seen=new Set(profile.interactions.filter(e=>['RIGHT','LEFT','SUPER'].includes(e.action)).flatMap(e=>[e.postId,...(e.post?[xPostId(e.post.url)??e.postId]:[])])),unique=new Set<string>();
 return posts.filter(p=>{const key=xPostId(p.url)??p.id;if(seen.has(p.id)||seen.has(key)||unique.has(key))return false;unique.add(key);return filter==='ALL'||filter==='BLIND SPOT'||p.category===filter||p.related.includes(filter as Category)}).map(post=>{const freshness=Math.max(0,1-(Date.now()-Date.parse(post.publishedAt))/86400000/7);return {post,score:affinity(profile,post.category)+freshness*.2+(xPostId(post.url)?.3:0)+(post.category===filter?1:0)}}).sort((a,b)=>b.score-a.score).map(p=>p.post);
}
export function isPost(value:unknown):value is Post {if(!value||typeof value!=='object')return false;const p=value as Post;return typeof p.id==='string'&&typeof p.title==='string'&&typeof p.text==='string'&&typeof p.url==='string'&&/^https?:\/\//.test(p.url)&&categories.includes(p.category)&&Array.isArray(p.related)&&p.related.every(c=>categories.includes(c))&&Array.isArray(p.tags)&&p.tags.every(t=>typeof t==='string')&&typeof p.author==='string'&&typeof p.source==='string'&&typeof p.sourceCategory==='string'&&typeof p.publishedAt==='string'&&Number.isFinite(Date.parse(p.publishedAt))}

