create table public.techer_analysis_history (
 user_id text not null references public.techer_profiles(user_id) on delete cascade,
 completed_at timestamptz not null,
 profile_revision bigint not null,
 result jsonb not null,
 primary key(user_id,completed_at)
);
alter table public.techer_analysis_history enable row level security;
revoke all on public.techer_analysis_history from public,anon,authenticated;
grant select,insert,update,delete on public.techer_analysis_history to service_role;
insert into public.techer_analysis_history(user_id,completed_at,profile_revision,result)
select user_id,(result->>'createdAt')::timestamptz,profile_revision,result from public.techer_analyses
where result is not null and result->>'createdAt' is not null on conflict do nothing;
create function public.techer_archive_analysis() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if new.status='ready' and new.result is not null and new.completed_at is not null and new.result is distinct from old.result then
 insert into public.techer_analysis_history(user_id,completed_at,profile_revision,result)
 values(new.user_id,new.completed_at,new.profile_revision,new.result) on conflict do nothing;
 end if;
 return new;
end;$$;
revoke all on function public.techer_archive_analysis() from public,anon,authenticated;
grant execute on function public.techer_archive_analysis() to service_role;
create trigger techer_analysis_history_saved after update on public.techer_analyses
for each row execute function public.techer_archive_analysis();
