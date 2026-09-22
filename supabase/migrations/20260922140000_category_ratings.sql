-- One database, category-scoped records. Bookmarks do not count as ratings.
create table public.techer_categories (
 id text primary key,
 label text not null
);
insert into public.techer_categories values
 ('AI','AI'),('ROBOTICS','Robotics'),('XR','XR'),('DEV','Dev'),
 ('HARDWARE','Hardware'),('STARTUPS','Startups'),('SCIENCE','Science');
alter table public.techer_categories enable row level security;
revoke all on public.techer_categories from anon, authenticated;
grant select on public.techer_categories to service_role;
alter table public.techer_swipes add constraint techer_swipes_category_fk
 foreign key (category) references public.techer_categories(id);
create index techer_swipes_category_recent on public.techer_swipes(user_id,category,created_at desc);
alter table public.techer_scores add column category text references public.techer_categories(id);
alter table public.techer_scores add column algorithm_version text not null default 'jev-relevance-v1';
create index techer_scores_category on public.techer_scores(user_id,category,created_at desc);

-- A view stays in sync with undo and imported history without a separate counter.
create view public.techer_category_ratings with (security_invoker=true) as
select p.user_id,c.id as category,
 count(s.event_id)::integer as rated_posts,
 count(s.event_id) filter(where s.direction='RIGHT')::integer as likes,
 count(s.event_id) filter(where s.direction='LEFT')::integer as dislikes,
 round(100.0*(count(s.event_id) filter(where s.direction='RIGHT')+2)/(count(s.event_id)+4),2) as preference_score,
 coalesce(avg(s.dwell_time_ms),0)::integer as average_dwell_ms,
 max(s.created_at) as last_rated_at
from public.techer_profiles p cross join public.techer_categories c
left join public.techer_swipes s on s.user_id=p.user_id and s.category=c.id
group by p.user_id,c.id;
revoke all on public.techer_category_ratings from anon, authenticated;
grant select on public.techer_category_ratings to service_role;
comment on view public.techer_category_ratings is
 'Observed category preference with a neutral Beta(2,2) prior, 0–100; not a JEV prediction. Filter by user_id on every server request.';
