-- AutoMailX · planes (gratis / Premium), administradores y dominios de envío propios

alter table public.users add column if not exists plan text not null default 'free';
alter table public.users drop constraint if exists users_plan_check;
alter table public.users add constraint users_plan_check check (plan in ('free','pro'));
alter table public.users add column if not exists is_admin boolean not null default false;

-- Un dominio propio por usuario (Premium). Se da de alta en la cuenta de Resend de AutoMailX.
create table if not exists public.sender_domains (
  user_id uuid primary key references public.users(id) on delete cascade,
  resend_id text not null unique,
  name text not null unique,
  from_local text not null default 'hola',
  status text not null default 'not_started',
  records jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  checked_at timestamptz,
  verified_at timestamptz
);
alter table public.sender_domains enable row level security;
