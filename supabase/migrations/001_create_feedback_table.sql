-- Feedback table for beta bug reports and suggestions
create table if not exists public.feedback (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users not null default auth.uid(),
  message    text not null,
  category   text not null check (category in ('bug', 'suggestion', 'general')),
  page_url   text,
  created_at timestamptz not null default now()
);

-- RLS: users can insert their own rows
alter table public.feedback enable row level security;

create policy "Users can insert own feedback"
  on public.feedback for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can view own feedback"
  on public.feedback for select
  to authenticated
  using (auth.uid() = user_id);
