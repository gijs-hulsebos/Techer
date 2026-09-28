begin;
-- Auth deletion cascades atomically through the profile and its seven child tables.
-- Unclaimed legacy profiles remain unassociated; ownership is never inferred.
alter table public.techer_profiles add column auth_user_id uuid unique references auth.users(id) on delete cascade;
update public.techer_profiles p set auth_user_id=u.id from auth.users u where p.user_id=u.id::text;
alter table public.techer_profiles add constraint techer_profile_identity_matches
 check(auth_user_id is null or user_id=auth_user_id::text);
create function public.techer_bind_profile_owner() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
 new.auth_user_id := new.user_id::uuid;
 return new;
end; $$;
revoke all on function public.techer_bind_profile_owner() from public,anon,authenticated;
create trigger techer_profile_owner before insert or update on public.techer_profiles
for each row execute function public.techer_bind_profile_owner();

-- Aggregate inside Postgres: exports are complete, not capped by REST row limits.
create function public.techer_export_account(p_user_id text) returns jsonb
language sql stable security invoker set search_path='' as $$
 select jsonb_build_object(
 'profiles',(select coalesce(jsonb_agg(to_jsonb(t)),'[]') from public.techer_profiles t where user_id=p_user_id),
 'swipes',(select coalesce(jsonb_agg(to_jsonb(t)),'[]') from public.techer_swipes t where user_id=p_user_id),
 'bookmarks',(select coalesce(jsonb_agg(to_jsonb(t)),'[]') from public.techer_bookmarks t where user_id=p_user_id),
 'scores',(select coalesce(jsonb_agg(to_jsonb(t)),'[]') from public.techer_scores t where user_id=p_user_id),
 'analyses',(select coalesce(jsonb_agg(to_jsonb(t)),'[]') from public.techer_analyses t where user_id=p_user_id),
 'analysis_history',(select coalesce(jsonb_agg(to_jsonb(t)),'[]') from public.techer_analysis_history t where user_id=p_user_id),
 'personal_models',(select coalesce(jsonb_agg(to_jsonb(t)-'lease_token'),'[]') from public.techer_personal_models t where user_id=p_user_id),
 'training_runs',(select coalesce(jsonb_agg(to_jsonb(t)),'[]') from public.techer_training_runs t where user_id=p_user_id),
 'category_ratings',(select coalesce(jsonb_agg(to_jsonb(t)),'[]') from public.techer_category_ratings t where user_id=p_user_id)
 );
$$;
revoke all on function public.techer_export_account(text) from public,anon,authenticated;
grant execute on function public.techer_export_account(text) to service_role;
commit;
