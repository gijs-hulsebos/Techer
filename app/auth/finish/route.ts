import {authClient} from '@/lib/auth-server';
export async function GET(request:Request){
 const origin=process.env.TECHER_SITE_URL;if(!origin)return new Response('Loginconfiguratie ontbreekt.',{status:503});
 const code=new URL(request.url).searchParams.get('code');if(code){const client=await authClient();const {error}=await client.auth.exchangeCodeForSession(code);if(!error)return Response.redirect(new URL('/',origin),303)}
 return Response.redirect(new URL('/?login=failed',origin),303);
}
