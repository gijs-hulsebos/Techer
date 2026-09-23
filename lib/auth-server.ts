import 'server-only';
import {createServerClient} from '@supabase/ssr';
import {cookies} from 'next/headers';
export async function authClient(){
 const jar=await cookies();
 if(!process.env.SUPABASE_URL||!process.env.SUPABASE_ANON_KEY)throw Error('AUTH_NOT_CONFIGURED');
 return createServerClient(process.env.SUPABASE_URL,process.env.SUPABASE_ANON_KEY,{cookieOptions:{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/'},cookies:{getAll:()=>jar.getAll(),setAll(values){try{values.forEach(({name,value,options})=>jar.set(name,value,options))}catch{/* Server components cannot set cookies; route handlers refresh sessions. */}}}});
}
export async function authenticatedUser(){if(!process.env.SUPABASE_URL||!process.env.SUPABASE_ANON_KEY)return null;const client=await authClient();const {data,error}=await client.auth.getUser();return error?null:data.user}
