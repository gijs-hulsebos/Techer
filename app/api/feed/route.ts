import {posts} from '@/lib/radar';
export async function GET(){return Response.json({mode:'demo',liveConnected:false,posts},{headers:{'Cache-Control':'public, max-age=300'}})}
