alter table public.techer_swipes drop constraint techer_swipes_direction_check;
alter table public.techer_swipes add constraint techer_swipes_direction_check check(direction in ('LEFT','RIGHT','SUPER'));
alter table public.techer_swipes add column user_rating smallint generated always as (case direction when 'LEFT' then 0 when 'RIGHT' then 1 when 'SUPER' then 2 end) stored;
alter table public.techer_swipes add constraint techer_swipes_rating_check check(user_rating between 0 and 2);
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
 from jsonb_array_elements(p_state->'interactions') e where e->>'action' in ('RIGHT','LEFT','SUPER');
 delete from public.techer_bookmarks where user_id=p_user_id;
 insert into public.techer_bookmarks(user_id,post_id,post_snapshot)
 select p_user_id,e->>'id',e from jsonb_array_elements(p_state->'saved') e;
 return current_revision+1;
end; $$;
revoke all on function public.techer_save_profile(text,bigint,jsonb) from public, anon, authenticated;
grant execute on function public.techer_save_profile(text,bigint,jsonb) to service_role;

-- A view stays in sync with undo and imported history without a separate counter.
create or replace view public.techer_category_ratings with (security_invoker=true) as
select p.user_id,c.id as category,
 count(s.event_id)::integer as rated_posts,
 count(s.event_id) filter(where s.user_rating=1)::integer as likes,
 count(s.event_id) filter(where s.user_rating=0)::integer as dislikes,
 round(100.0*(coalesce(sum(s.user_rating),0)+4)/(2*count(s.event_id)+8),2) as preference_score,
 coalesce(avg(s.dwell_time_ms),0)::integer as average_dwell_ms,
 max(s.created_at) as last_rated_at,
 count(s.event_id) filter(where s.user_rating=2)::integer as superlikes
from public.techer_profiles p cross join public.techer_categories c
left join public.techer_swipes s on s.user_id=p.user_id and s.category=c.id
group by p.user_id,c.id;
revoke all on public.techer_category_ratings from anon, authenticated;
grant select on public.techer_category_ratings to service_role;
comment on view public.techer_category_ratings is
 'Observed category preference with a neutral Beta(2,2) prior, 0–100; not a JEV prediction. Filter by user_id on every server request.';

create table public.techer_news_archive (
 seq bigint generated always as identity primary key,
 post_id text not null unique,
 post jsonb not null,
 first_seen_at timestamptz not null default now()
);
create table public.techer_news_sync (
 id text primary key, attempted_at timestamptz, completed_at timestamptz, fetched_count integer not null default 0
);
alter table public.techer_news_archive enable row level security;
alter table public.techer_news_sync enable row level security;
revoke all on public.techer_news_archive,public.techer_news_sync from public,anon,authenticated;
grant select,insert,update on public.techer_news_archive,public.techer_news_sync to service_role;
grant usage,select on sequence public.techer_news_archive_seq_seq to service_role;
create function public.techer_claim_news_sync() returns boolean language plpgsql security invoker set search_path='' as $$
declare claimed text;
begin
 insert into public.techer_news_sync(id,attempted_at) values('aligned',now())
 on conflict(id) do update set attempted_at=now() where techer_news_sync.attempted_at<now()-interval '5 minutes'
 returning id into claimed;
 return claimed is not null;
end;$$;
create function public.techer_news_page(p_user text,p_before bigint default null,p_limit integer default 100)
returns setof public.techer_news_archive language sql stable security invoker set search_path='' as $$
 select n.* from public.techer_news_archive n
 where (p_before is null or n.seq<p_before)
 and not exists(select 1 from public.techer_swipes s where s.user_id=p_user and s.post_id=n.post_id)
 order by n.seq desc limit least(greatest(p_limit,1),200);
$$;
revoke all on function public.techer_claim_news_sync() from public,anon,authenticated;
revoke all on function public.techer_news_page(text,bigint,integer) from public,anon,authenticated;
grant execute on function public.techer_claim_news_sync() to service_role;
grant execute on function public.techer_news_page(text,bigint,integer) to service_role;
create index techer_swipes_user_post on public.techer_swipes(user_id,post_id);
