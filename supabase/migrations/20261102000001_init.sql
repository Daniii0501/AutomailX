-- AutoMailX · esquema inicial (reconstrucción)
-- Se aplica UNA vez (Supabase > SQL Editor o `supabase db push`). La web nunca cambia el esquema.
-- La app entra con la clave secreta (rol service_role), que salta RLS. RLS activado y sin
-- políticas = la API pública de Supabase (clave anon/publishable) no puede leer ni escribir nada.

create extension if not exists pgcrypto;

-- Las tablas de la versión anterior se guardan con el prefijo legacy_ (no se borra nada).
do $$
declare t text;
begin
  foreach t in array array['users','sessions','login_tokens','publications','writers','subscribers','newsletters','usage','topics','amx_meta'] loop
    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = t) then
      execute format('alter table public.%I rename to %I', t, 'legacy_' || t);
    end if;
  end loop;
end $$;

create table public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

create table public.sessions (
  token_hash text primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index sessions_user_idx on public.sessions(user_id);

create table public.login_tokens (
  token_hash text primary key,
  email text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create index login_tokens_email_idx on public.login_tokens(email, created_at);

create table public.publications (
  user_id uuid primary key references public.users(id) on delete cascade,
  slug text not null unique,
  name text not null,
  sender_name text not null,
  reply_to text,
  cadence_day int check (cadence_day between 0 and 6),
  created_at timestamptz not null default now()
);

create table public.writers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  kind text not null default 'animal' check (kind in ('animal','custom')),
  animal text not null default 'zorro',
  name text not null,
  avatar text not null default '',
  color text not null default '',
  about text not null default '',
  formality int not null default 35 check (formality between 0 and 100),
  length text not null default 'medio' check (length in ('corto','medio','largo')),
  emojis int not null default 1 check (emojis between 0 and 2),
  sample text not null default '',
  format text not null default 'auto',
  custom jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index writers_user_idx on public.writers(user_id, created_at);

create table public.subscribers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  email text not null,
  name text not null default '',
  status text not null default 'pending' check (status in ('pending','confirmed','unsubscribed')),
  token text not null unique,
  source text not null default 'manual',
  created_at timestamptz not null default now(),
  confirmed_at timestamptz,
  unique (user_id, email)
);
create index subscribers_user_idx on public.subscribers(user_id, status);

create table public.newsletters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  writer_id uuid references public.writers(id) on delete set null,
  look jsonb not null default '{}'::jsonb,
  brief text not null default '',
  format text not null default 'auto',
  content jsonb not null,
  warnings jsonb not null default '[]'::jsonb,
  source text not null default 'simulated',
  status text not null default 'draft' check (status in ('draft','sending','sent')),
  delivery text,
  recipients int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sent_at timestamptz
);
create index newsletters_user_idx on public.newsletters(user_id, created_at desc);

create table public.topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  writer_id uuid references public.writers(id) on delete set null,
  title text not null,
  notes text not null default '',
  format text not null default 'auto',
  scheduled_day date,
  send_hour int not null default 8 check (send_hour between 0 and 23),
  mode text not null default 'draft' check (mode in ('draft','send')),
  status text not null default 'idea' check (status in ('idea','scheduled','running','drafted','sent','failed')),
  newsletter_id uuid references public.newsletters(id) on delete set null,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index topics_user_idx on public.topics(user_id, scheduled_day);
create index topics_due_idx on public.topics(status, scheduled_day, send_hour);

-- Contadores para límites (por clave y día de España)
create table public.usage (
  key text not null,
  day date not null,
  count int not null default 0,
  primary key (key, day)
);

-- Suma 1 al contador de hoy y dice si sigue dentro del límite. Atómico.
create or replace function public.amx_hit(p_key text, p_limit int)
returns boolean
language sql
set search_path = public
as $$
  insert into public.usage(key, day, count)
  values (p_key, (now() at time zone 'Europe/Madrid')::date, 1)
  on conflict (key, day) do update set count = public.usage.count + 1
  returning count <= p_limit;
$$;

-- Lectura del contador sin sumar.
create or replace function public.amx_count(p_key text)
returns int
language sql stable
set search_path = public
as $$
  select coalesce((select count from public.usage
    where key = p_key and day = (now() at time zone 'Europe/Madrid')::date), 0);
$$;

-- RLS en todo, sin políticas: solo la clave secreta del servidor puede tocar datos.
alter table public.users enable row level security;
alter table public.sessions enable row level security;
alter table public.login_tokens enable row level security;
alter table public.publications enable row level security;
alter table public.writers enable row level security;
alter table public.subscribers enable row level security;
alter table public.newsletters enable row level security;
alter table public.topics enable row level security;
alter table public.usage enable row level security;

revoke all on function public.amx_hit(text, int) from public, anon, authenticated;
revoke all on function public.amx_count(text) from public, anon, authenticated;
grant execute on function public.amx_hit(text, int) to service_role;
grant execute on function public.amx_count(text) to service_role;
