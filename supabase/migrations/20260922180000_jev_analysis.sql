create table public.techer_analyses (
 user_id text primary key references public.techer_profiles(user_id) on delete cascade,
 profile_revision bigint not null,
 status text not null check(status in ('pending','ready','failed')),
 started_at timestamptz not null default now(),
 completed_at timestamptz,
 budget_day date not null default current_date,
 calls_today integer not null default 1,
 result jsonb
);
alter table public.techer_analyses enable row level security;
revoke all on public.techer_analyses from anon,authenticated;
grant select,insert,update,delete on public.techer_analyses to service_role;
create function public.techer_reserve_analysis(p_user_id text,p_revision bigint)
returns boolean language plpgsql security invoker set search_path='' as $$
declare claimed text;
begin
 insert into public.techer_analyses(user_id,profile_revision,status)
 values(p_user_id,p_revision,'pending')
 on conflict(user_id) do update set profile_revision=p_revision,status='pending',
 started_at=now(),completed_at=null,budget_day=current_date,
 calls_today=case when techer_analyses.budget_day=current_date then techer_analyses.calls_today+1 else 1 end
 where techer_analyses.started_at<now()-interval '10 minutes'
 and (techer_analyses.budget_day<>current_date or techer_analyses.calls_today<12)
 returning user_id into claimed;
 return claimed is not null;
end;$$;
revoke all on function public.techer_reserve_analysis(text,bigint) from public,anon,authenticated;
grant execute on function public.techer_reserve_analysis(text,bigint) to service_role;
