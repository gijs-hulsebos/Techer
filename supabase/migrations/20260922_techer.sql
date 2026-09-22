-- Prepared migration. Not applied: no Supabase project has been connected.
-- Sites supplies the verified user identity; clients never receive a database secret.
create table public.techer_profiles (
 user_id text primary key,
 revision bigint not null default 0,
 state jsonb not null default '{"interests":["AI","DEV"],"interactions":[],"saved":[]}',
 updated_at timestamptz not null default now()
);
create table public.techer_swipes (
 user_id text not null references public.techer_profiles(user_id) on delete cascade,
 event_id uuid not null,
 post_id text not null,
 direction text not null check (direction in ('RIGHT','LEFT')),
 post_snapshot jsonb,
 category text not null,
 dwell_time_ms integer not null check (dwell_time_ms >= 0),
 created_at timestamptz not null,
 primary key(user_id,event_id)
);
create table public.techer_bookmarks (
 user_id text not null references public.techer_profiles(user_id) on delete cascade,
 post_id text not null,
 post_snapshot jsonb not null,
 primary key(user_id,post_id)
);
create table public.techer_scores (
 user_id text not null references public.techer_profiles(user_id) on delete cascade,
 post_id text not null,
 profile_revision bigint not null,
 score double precision not null check(score between 0 and 100),
 confidence double precision not null check(confidence between 0 and 1),
 model text not null,
 created_at timestamptz not null default now(),
 primary key(user_id,post_id,profile_revision)
);
create index techer_swipes_recent on public.techer_swipes(user_id,created_at desc);
alter table public.techer_profiles enable row level security;
alter table public.techer_swipes enable row level security;
alter table public.techer_bookmarks enable row level security;
alter table public.techer_scores enable row level security;
-- No browser policies: all access goes through the authenticated Sites server.
revoke all on public.techer_profiles, public.techer_swipes, public.techer_bookmarks, public.techer_scores from anon, authenticated;
grant select, insert, update, delete on public.techer_profiles, public.techer_swipes, public.techer_bookmarks, public.techer_scores to service_role;

-- A revision conflict returns -1, leaving all rows untouched. The client must
-- preserve its unsynced work and fetch/merge explicitly, never overwrite blindly.
create or replace function public.techer_save_profile(p_user_id text,p_expected_revision bigint,p_state jsonb)
returns bigint language plpgsql security invoker set search_path = '' as $$
declare current_revision bigint;
begin
 if p_user_id is null or length(p_user_id) < 1
 or p_expected_revision is null or p_expected_revision < 0
 or jsonb_typeof(p_state->'interactions') is distinct from 'array'
 or jsonb_typeof(p_state->'saved') is distinct from 'array'
 or jsonb_typeof(p_state->'interests') is distinct from 'array' then
  raise exception 'Invalid profile';
 end if;
 insert into public.techer_profiles(user_id) values(p_user_id) on conflict do nothing;
 select revision into current_revision from public.techer_profiles where user_id=p_user_id for update;
 if current_revision <> p_expected_revision then return -1; end if;
 update public.techer_profiles set state=p_state,revision=revision+1,updated_at=now() where user_id=p_user_id;
 delete from public.techer_swipes where user_id=p_user_id;
 insert into public.techer_swipes(user_id,event_id,post_id,direction,post_snapshot,category,dwell_time_ms,created_at)
 select p_user_id,(e->>'id')::uuid,e->>'postId',e->>'action',e->'post',e->>'category',
 (e->>'dwellTime')::integer,(e->>'createdAt')::timestamptz
 from jsonb_array_elements(p_state->'interactions') e where e->>'action' in ('RIGHT','LEFT');
 delete from public.techer_bookmarks where user_id=p_user_id;
 insert into public.techer_bookmarks(user_id,post_id,post_snapshot)
 select p_user_id,e->>'id',e from jsonb_array_elements(p_state->'saved') e;
 return current_revision+1;
end; $$;
revoke all on function public.techer_save_profile(text,bigint,jsonb) from public, anon, authenticated;
grant execute on function public.techer_save_profile(text,bigint,jsonb) to service_role;
