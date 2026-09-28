import 'server-only';
import {createClient} from '@supabase/supabase-js';

export async function deleteAuthAccount(userId:string){
 const client=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_SECRET_KEY!,{
  auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},
 });
 // Hard deletion also removes sessions and cascades to all owned application rows.
 const {error}=await client.auth.admin.deleteUser(userId,false);
 if(error)throw Error('DELETE_FAILED');
}
