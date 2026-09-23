create table public.techer_personal_models (
 user_id text primary key references public.techer_profiles(user_id) on delete cascade,
 active jsonb, state jsonb,
 checked_at timestamptz not null default 'epoch',
 lease_until timestamptz not null default 'epoch',
 lease_token uuid
);
create table public.techer_training_runs (
 id bigint generated always as identity primary key,
 user_id text not null references public.techer_profiles(user_id) on delete cascade,
 created_at timestamptz not null default now(),
 state jsonb not null,
 candidate jsonb
);
create index techer_training_runs_user_time on public.techer_training_runs(user_id,created_at desc);
alter table public.techer_personal_models enable row level security;
alter table public.techer_training_runs enable row level security;
revoke all on public.techer_personal_models,public.techer_training_runs from public,anon,authenticated;
grant select,insert,update,delete on public.techer_personal_models,public.techer_training_runs to service_role;
grant usage,select on sequence public.techer_training_runs_id_seq to service_role;
create function public.techer_claim_training(p_token uuid) returns setof public.techer_personal_models
language plpgsql security invoker set search_path='' as $$
begin
 insert into public.techer_personal_models(user_id) select user_id from public.techer_profiles on conflict do nothing;
 return query with picked as (
 select user_id from public.techer_personal_models where checked_at<now()-interval '23 hours' and lease_until<now()
 order by checked_at,user_id limit 50 for update skip locked
 ) update public.techer_personal_models m set lease_token=p_token,lease_until=now()+interval '10 minutes'
 from picked where m.user_id=picked.user_id returning m.*;
end;$$;
create function public.techer_finish_training(p_user text,p_token uuid,p_revision bigint,p_active jsonb,p_state jsonb,p_candidate jsonb)
returns boolean language plpgsql security invoker set search_path='' as $$
declare current_revision bigint;
begin
 select revision into current_revision from public.techer_profiles where user_id=p_user for update;
 if current_revision is distinct from p_revision then
 update public.techer_personal_models set lease_until='epoch',lease_token=null where user_id=p_user and lease_token=p_token;
 return false;
 end if;
 update public.techer_personal_models set active=p_active,state=p_state,checked_at=now(),lease_until='epoch',lease_token=null where user_id=p_user and lease_token=p_token;
 if not found then return false; end if;
 if p_candidate is not null then insert into public.techer_training_runs(user_id,state,candidate) values(p_user,p_state,p_candidate); end if;
 return true;
end;$$;
revoke all on function public.techer_claim_training(uuid) from public,anon,authenticated;
revoke all on function public.techer_finish_training(text,uuid,bigint,jsonb,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.techer_claim_training(uuid) to service_role;
grant execute on function public.techer_finish_training(text,uuid,bigint,jsonb,jsonb,jsonb) to service_role;
