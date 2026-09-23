import {authClient} from '@/lib/auth-server';
export async function GET(){
 const origin=process.env.TECHER_SITE_URL;
 if(!origin||process.env.TECHER_GOOGLE_AUTH_ENABLED!=='true')return new Response('Google-login wordt nog ingesteld.',{status:503,headers:{'Cache-Control':'no-store'}});
 const client=await authClient();const {data,error}=await client.auth.signInWithOAuth({provider:'google',options:{redirectTo:new URL('/auth/finish',origin).href,scopes:'openid email profile'}});
 if(error||!data.url)return new Response('Inloggen is tijdelijk niet beschikbaar.',{status:503});return Response.redirect(data.url,302);
}
