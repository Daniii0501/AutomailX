-- AutoMailX · cobro de Premium con Stripe

alter table public.users add column if not exists stripe_customer_id text unique;
alter table public.users add column if not exists stripe_subscription_id text;
alter table public.users add column if not exists subscription_status text;
alter table public.users add column if not exists current_period_end timestamptz;
alter table public.users add column if not exists cancel_at_period_end boolean not null default false;
