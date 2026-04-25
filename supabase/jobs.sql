create extension if not exists pgcrypto;

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  company text not null,
  link text not null,
  date timestamptz not null,
  source text not null,
  location text,
  description text,
  salary_min numeric,
  salary_max numeric,
  job_key text not null unique,
  created_at timestamptz not null default now()
);

create unique index if not exists jobs_link_key on public.jobs (link);
create index if not exists jobs_date_idx on public.jobs (date desc);

alter table public.jobs enable row level security;

create policy if not exists "public can read jobs"
on public.jobs
for select
to anon, authenticated
using (true);
