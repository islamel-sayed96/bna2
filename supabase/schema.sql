-- نماء — Supabase schema
-- Paste this whole file into Supabase → SQL Editor → Run.
-- Every table is protected by Row Level Security: each user only sees their own rows.

create table if not exists public.habits (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name        text not null,
  icon        text not null default '✨',
  color       text not null default 'teal',
  days        int[] not null default '{0,1,2,3,4,5,6}', -- 0 = Sunday … 6 = Saturday
  note        text,
  archived    boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists public.habit_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  habit_id    uuid not null references public.habits(id) on delete cascade,
  date        date not null,
  created_at  timestamptz not null default now(),
  unique (habit_id, date)
);

create table if not exists public.events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title       text not null,
  notes       text,
  date        date not null,
  start_time  text,  -- 'HH:MM'
  end_time    text,
  category    text not null default 'work',
  priority    text not null default 'normal',
  done        boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists public.questions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  category    text not null,
  text        text not null,
  options     jsonb not null,  -- array of strings
  answer      int not null,    -- index of the correct option
  explanation text,
  created_at  timestamptz not null default now()
);

create table if not exists public.quiz_attempts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  mode        text not null,
  category    text,
  total       int not null,
  correct     int not null,
  details     jsonb not null default '[]', -- [{ qid, chosen, correct }]
  created_at  timestamptz not null default now()
);

create index if not exists habit_logs_user_date on public.habit_logs (user_id, date);
create index if not exists events_user_date on public.events (user_id, date);
create index if not exists quiz_attempts_user on public.quiz_attempts (user_id, created_at);

do $$
declare t text;
begin
  foreach t in array array['habits','habit_logs','events','questions','quiz_attempts'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "own rows" on public.%I', t);
    execute format(
      'create policy "own rows" on public.%I for all to authenticated
         using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
  end loop;
end $$;
