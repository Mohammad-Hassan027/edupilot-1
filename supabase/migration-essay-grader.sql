-- Create a table to store essay evaluations
create table if not exists essay_evaluations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  rubric text,
  content text not null,
  grade text,
  feedback jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for essay_evaluations
alter table essay_evaluations enable row level security;

create policy "Users can view their own essay evaluations"
  on essay_evaluations for select
  using (auth.uid() = user_id);

create policy "Users can insert their own essay evaluations"
  on essay_evaluations for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own essay evaluations"
  on essay_evaluations for delete
  using (auth.uid() = user_id);
