-- AutoMailX · Premium: límites semanales y solicitudes de Premium (hasta que haya pago con tarjeta)

-- Como amx_hit pero por semana (lunes a domingo, hora de España).
create or replace function public.amx_hit_week(p_key text, p_limit int)
returns boolean
language sql
set search_path = public
as $$
  insert into public.usage(key, day, count)
  values (p_key, date_trunc('week', now() at time zone 'Europe/Madrid')::date, 1)
  on conflict (key, day) do update set count = public.usage.count + 1
  returning count <= p_limit;
$$;

create or replace function public.amx_count_week(p_key text)
returns int
language sql stable
set search_path = public
as $$
  select coalesce((select count from public.usage
    where key = p_key and day = date_trunc('week', now() at time zone 'Europe/Madrid')::date), 0);
$$;

-- Quien pulsa "Quiero Premium" (una fila por usuario; se reabre si vuelve a pedirlo).
create table if not exists public.premium_requests (
  user_id uuid primary key references public.users(id) on delete cascade,
  billing text not null default 'monthly' check (billing in ('monthly','yearly')),
  message text not null default '',
  created_at timestamptz not null default now(),
  handled_at timestamptz
);
alter table public.premium_requests enable row level security;

revoke all on function public.amx_hit_week(text, int) from public, anon, authenticated;
revoke all on function public.amx_count_week(text) from public, anon, authenticated;
grant execute on function public.amx_hit_week(text, int) to service_role;
grant execute on function public.amx_count_week(text) to service_role;
