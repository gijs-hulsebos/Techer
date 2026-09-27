import type {Category,Post} from './radar';
const sections:Record<string,Category>={robotics:'ROBOTICS',xr:'XR',spatial:'XR',chips:'HARDWARE',hardware:'HARDWARE',infrastructure:'HARDWARE',dev:'DEV',coding:'DEV','events-hackathons':'DEV',security:'DEV',startups:'STARTUPS',business:'STARTUPS',funding:'STARTUPS',jobs:'STARTUPS',science:'SCIENCE',papers:'SCIENCE',models:'AI',agents:'AI',openclaw:'AI'};
const topics:[Category,RegExp][]=[
 ['XR',/\b(xr|vr|augmented reality|virtual reality|mixed reality|spatial computing|vision pro|visionos|smart glasses|audio glasses|meta glasses|ray.ban|meta quest|quest [234]|ar glasses|headsets?|holograph\w*)\b/i],
 ['DEV',/\b(developers?|coding|programming|programmers?|codebase|github|gitlab|sdk|apis?|javascript|typescript|python|rust|compiler|debugg\w*|software engineer\w*|software development|vibe.cod\w*|hackathon|devtools|claude code|cursor|copilot|codex|open.source|pull requests?|coding.agent\w*|software secur\w*)\b/i],
 ['ROBOTICS',/\b(robots?|robotics|humanoids?|embodied|robotic\w*)\b/i],
 ['HARDWARE',/\b(chips?|semiconductors?|gpus?|cpus?|datacenters?|data centers?|processors?|hardware|snapdragon|silicon)\b/i],
 ['STARTUPS',/\b(startups?|fundraising|funding round|venture capital|seed round|series [abc]|acquisition|acquires)\b/i],
 ['SCIENCE',/\b(research|researchers?|scientific|scientists?|biology|physics|benchmark|papers?|quantum|clinical)\b/i],
 ['AI',/\b(ai|artificial intelligence|llms?|models?|agents?|inference|neural)\b/i]
];
export function classifyPost(post:Post):Post{
 const text=post.title+' '+post.text+' '+post.tags.join(' '),matches=topics.filter(([,r])=>r.test(text)).map(([c])=>c);
 const section=sections[post.sourceCategory.toLowerCase()];
 // Specific source sections remain authoritative; cross-topic matches are searchable too.
 const category=section??matches[0]??'AI';
 return {...post,category,related:[...new Set([...matches,...post.related])].filter(c=>c!==category)};
}
