import {syncNews} from '@/lib/news-archive';
export const maxDuration=60;
export async function GET(request:Request){if(!process.env.CRON_SECRET||request.headers.get('authorization')!==`Bearer ${process.env.CRON_SECRET}`)return new Response('Unauthorized',{status:401});try{return Response.json(await syncNews(),{headers:{'Cache-Control':'no-store'}})}catch{return Response.json({error:'Feed ophalen mislukt.'},{status:503})}}
