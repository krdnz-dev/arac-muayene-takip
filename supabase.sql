-- Supabase hazır olduğunda SQL Editor'da çalıştırılacak
create table public.vehicles (id uuid primary key default gen_random_uuid(),user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,company text not null,plate text not null,serial_no text,location text,inspection_date date not null,expiry_date date not null,notes text,created_at timestamptz default now(),updated_at timestamptz default now(),constraint expiry_after_inspection check(expiry_date>=inspection_date));
alter table public.vehicles enable row level security;
create policy "own select" on public.vehicles for select to authenticated using(auth.uid()=user_id);
create policy "own insert" on public.vehicles for insert to authenticated with check(auth.uid()=user_id);
create policy "own update" on public.vehicles for update to authenticated using(auth.uid()=user_id) with check(auth.uid()=user_id);
create policy "own delete" on public.vehicles for delete to authenticated using(auth.uid()=user_id);
