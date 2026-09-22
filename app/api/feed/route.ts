import {fetchAligned,ALIGNED_FEED} from '@/lib/aligned';
export async function GET(){try{const data=await fetchAligned();return Response.json({...data,mode:'live',source:'Aligned News',sourceUrl:ALIGNED_FEED},{headers:{'Cache-Control':data.stale?'no-store':'public, max-age=60, s-maxage=300'}})}catch(error){console.error("Aligned RSS fetch failed",error);return Response.json({error:'Aligned News is tijdelijk niet bereikbaar.',posts:[]},{status:503,headers:{'Cache-Control':'no-store'}})}}

