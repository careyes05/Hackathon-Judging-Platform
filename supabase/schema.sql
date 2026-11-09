create extension if not exists pgcrypto;

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'judge')),
  created_at timestamptz not null default now()
);

create table if not exists public.hackathons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null,
  event_date date,
  location text,
  themes text[] not null default '{}',
  rubric jsonb not null default '[]'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  hackathon_id uuid not null references public.hackathons(id) on delete cascade,
  team_name text not null,
  project_title text not null,
  description text not null default '',
  repository_url text,
  demo_url text,
  access_code_hash text not null,
  file_path text,
  file_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists submissions_one_team_per_event
  on public.submissions (hackathon_id, lower(team_name));

create table if not exists public.judgments (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  judge_id uuid not null references auth.users(id) on delete cascade,
  scores jsonb not null default '{}'::jsonb,
  feedback text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (submission_id, judge_id)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists submissions_set_updated_at on public.submissions;
create trigger submissions_set_updated_at
before update on public.submissions
for each row execute function public.set_updated_at();

drop trigger if exists judgments_set_updated_at on public.judgments;
create trigger judgments_set_updated_at
before update on public.judgments
for each row execute function public.set_updated_at();

alter table public.user_roles enable row level security;
alter table public.hackathons enable row level security;
alter table public.submissions enable row level security;
alter table public.judgments enable row level security;

insert into storage.buckets (id, name, public, file_size_limit)
values ('hackathon-submissions', 'hackathon-submissions', false, 4194304)
on conflict (id) do update
set public = false, file_size_limit = 4194304;
