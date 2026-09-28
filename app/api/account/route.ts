import {authenticatedUser,authClient} from '@/lib/auth-server';
import {supabaseRequest} from '@/lib/supabase-store';
import {assertExpectedAccount} from '@/lib/account-access';
import {deleteAuthAccount} from '@/lib/account-admin';

const headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
export async function GET(){
 try{
  const user=await authenticatedUser();
  if(!user)return Response.json({error:'Please sign in with Google.'},{status:401,headers});
  const records=await supabaseRequest('rpc/techer_export_account',{method:'POST',body:JSON.stringify({p_user_id:user.id})});
  return Response.json({exportedAt:new Date().toISOString(),userId:user.id,
   scope:'Your account details and all account-owned Techer database records. Security credentials, internal job tokens, infrastructure logs and provider backups are excluded. Shared public news is not personal account data.',
   privacy:'We do not sell your data. We use it to personalise your feed and provide your analytics. Requested JEV analyses process your ratings and post context through OpenRouter.',
   account:{id:user.id,email:user.email,phone:user.phone,created_at:user.created_at,updated_at:user.updated_at,last_sign_in_at:user.last_sign_in_at,email_confirmed_at:user.email_confirmed_at,app_metadata:user.app_metadata,user_metadata:user.user_metadata,identities:user.identities},records,
  },{headers});
 }catch{return Response.json({error:'Could not retrieve your data. Please try again.'},{status:503,headers})}
}

export async function DELETE(request:Request){
 const origin=request.headers.get('origin');
 if(!origin||origin!==new URL(request.url).origin)return Response.json({error:'Invalid origin.'},{status:403,headers});
 try{
  const user=await authenticatedUser();
  if(!user)return Response.json({error:'Please sign in with Google.'},{status:401,headers});
  const raw=await request.text();
  if(raw.length>1024)return Response.json({error:'Invalid request.'},{status:400,headers});
  const body=JSON.parse(raw);
  assertExpectedAccount(user.id,body.userId);
  if(body.confirmation!=='DELETE')return Response.json({error:'Confirm deletion first.'},{status:400,headers});
  // Only the verified session selects the account. The submitted ID is a stale-tab guard.
  await deleteAuthAccount(user.id);
  // Auth deletion already removed server sessions. Cookie cleanup must not turn a
  // successful deletion into an apparent failure if the old session is now invalid.
  try{const client=await authClient();await client.auth.signOut({scope:'local'})}catch{}
  return Response.json({deleted:true,userId:user.id},{headers});
 }catch(error){
  const changed=error instanceof Error&&error.message==='ACCOUNT_CHANGED';
  return Response.json({error:changed?'Your account changed. Reload before deleting.':'Account deletion failed. Please try again.'},{status:changed?409:503,headers});
 }
}
