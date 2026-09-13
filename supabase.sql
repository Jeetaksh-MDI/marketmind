-- MarketMind: run this once in Supabase SQL Editor.
-- The public browser never receives your service-role key; only Vercel serverless functions use it.

create table if not exists public.sessions (
  session_id uuid primary key,
  name text not null check (char_length(name) between 1 and 40),
  seed bigint,
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  current_round integer not null default 0 check (current_round between 0 and 9),
  completed boolean not null default false,
  personality_type text,
  decisions jsonb not null default '[]'::jsonb,
  scores jsonb not null default '{}'::jsonb,
  final_state jsonb not null default '{}'::jsonb,
  user_agent text,
  referrer text
);

create index if not exists sessions_started_at_idx on public.sessions (started_at desc);
create index if not exists sessions_completed_idx on public.sessions (completed, completed_at desc);
create index if not exists sessions_personality_idx on public.sessions (personality_type) where completed = true;

alter table public.sessions enable row level security;

-- No browser-facing RLS policy is required. All writes/reads go through serverless
-- functions using SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS.
