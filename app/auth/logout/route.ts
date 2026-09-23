import {authClient} from '@/lib/auth-server';
export async function POST(request:Request){
 const origin=process.env.TECHER_SITE_URL;
 if(!origin||request.headers.get('origin')!==new URL(origin).origin)return new Response('Ongeldige herkomst.',{status:403});
 const client=await authClient();const {error}=await client.auth.signOut({scope:'local'});
 if(error)return new Response('Uitloggen mislukt. Probeer opnieuw.',{status:503,headers:{'Cache-Control':'no-store'}});
 return new Response(null,{status:303,headers:{Location:new URL('/',origin).href,'Cache-Control':'no-store'}});
}
