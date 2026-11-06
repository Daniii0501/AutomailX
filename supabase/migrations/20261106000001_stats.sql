-- AutoMailX · estadísticas de campañas (entregas, aperturas, clics, rebotes, quejas y bajas)

-- Suscriptores: nuevo estado "bounced" (rebote permanente) y de qué campaña se dieron de baja.
alter table public.subscribers drop constraint if exists subscribers_status_check;
alter table public.subscribers add constraint subscribers_status_check
  check (status in ('pending','confirmed','unsubscribed','bounced'));
alter table public.subscribers add column if not exists unsubscribed_at timestamptz;
alter table public.subscribers add column if not exists unsubscribed_from uuid references public.newsletters(id) on delete set null;
create index if not exists subscribers_unsub_idx on public.subscribers(unsubscribed_from);

-- Un correo enviado a una persona. El id es el que da Resend.
create table if not exists public.deliveries (
  id text primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  newsletter_id uuid not null references public.newsletters(id) on delete cascade,
  subscriber_id uuid references public.subscribers(id) on delete set null,
  email text not null,
  sent_at timestamptz not null default now(),
  delivered_at timestamptz,
  delayed_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  bounced_at timestamptz,
  complained_at timestamptz,
  opens int not null default 0,
  clicks int not null default 0
);
create index if not exists deliveries_news_idx on public.deliveries(newsletter_id);
create index if not exists deliveries_user_idx on public.deliveries(user_id, sent_at);
alter table public.deliveries enable row level security;

-- Clics por enlace y campaña.
create table if not exists public.link_clicks (
  newsletter_id uuid not null references public.newsletters(id) on delete cascade,
  url text not null,
  clicks int not null default 0,
  primary key (newsletter_id, url)
);
alter table public.link_clicks enable row level security;

-- Apunta un evento de Resend. Devuelve false si el correo no es nuestro.
create or replace function public.amx_track(p_id text, p_type text, p_at timestamptz, p_link text default null, p_hard boolean default false)
returns boolean
language plpgsql
set search_path = public
as $$
declare d public.deliveries%rowtype;
begin
  select * into d from public.deliveries where id = p_id;
  if not found then return false; end if;

  if p_type = 'email.delivered' then
    update public.deliveries set delivered_at = coalesce(delivered_at, p_at) where id = p_id;
  elsif p_type = 'email.delivery_delayed' then
    update public.deliveries set delayed_at = coalesce(delayed_at, p_at) where id = p_id;
  elsif p_type = 'email.opened' then
    update public.deliveries set opened_at = coalesce(opened_at, p_at), opens = opens + 1 where id = p_id;
  elsif p_type = 'email.clicked' then
    -- un clic implica que se abrió (aunque el programa de correo bloquee las imágenes)
    update public.deliveries set clicked_at = coalesce(clicked_at, p_at), opened_at = coalesce(opened_at, p_at), clicks = clicks + 1 where id = p_id;
    if p_link is not null and length(p_link) <= 2000 then
      insert into public.link_clicks(newsletter_id, url, clicks) values (d.newsletter_id, p_link, 1)
      on conflict (newsletter_id, url) do update set clicks = public.link_clicks.clicks + 1;
    end if;
  elsif p_type = 'email.bounced' then
    update public.deliveries set bounced_at = coalesce(bounced_at, p_at) where id = p_id;
    if p_hard and d.subscriber_id is not null then
      update public.subscribers set status = 'bounced' where id = d.subscriber_id and status = 'confirmed';
    end if;
  elsif p_type = 'email.complained' then
    -- quien marca como spam no quiere más correos: se le da de baja
    update public.deliveries set complained_at = coalesce(complained_at, p_at) where id = p_id;
    if d.subscriber_id is not null then
      update public.subscribers set status = 'unsubscribed', unsubscribed_at = coalesce(unsubscribed_at, p_at),
        unsubscribed_from = coalesce(unsubscribed_from, d.newsletter_id)
      where id = d.subscriber_id and status <> 'unsubscribed';
    end if;
  end if;
  return true;
end;
$$;

-- Métricas por campaña enviada (desde p_since). Devuelve un array JSON.
create or replace function public.amx_campaign_stats(p_user uuid, p_since timestamptz default null)
returns jsonb
language sql stable
set search_path = public
as $$
  select coalesce(jsonb_agg(row_to_json(t) order by t.sent_at desc), '[]'::jsonb) from (
    select n.id, n.content->>'subject' as subject, n.sent_at, n.recipients, n.delivery, n.look,
      count(d.id)::int as tracked,
      count(d.delivered_at)::int as delivered,
      count(d.opened_at)::int as opened,
      count(d.clicked_at)::int as clicked,
      count(d.bounced_at)::int as bounced,
      count(d.complained_at)::int as complained,
      coalesce(sum(d.opens), 0)::int as total_opens,
      coalesce(sum(d.clicks), 0)::int as total_clicks,
      (select count(*) from public.subscribers s where s.unsubscribed_from = n.id)::int as unsubscribed
    from public.newsletters n
    left join public.deliveries d on d.newsletter_id = n.id
    where n.user_id = p_user and n.status = 'sent' and (p_since is null or n.sent_at >= p_since)
    group by n.id
  ) t;
$$;

-- Altas confirmadas y bajas por semana (lunes, hora de España), últimas p_weeks semanas.
create or replace function public.amx_growth(p_user uuid, p_weeks int default 12)
returns jsonb
language sql stable
set search_path = public
as $$
  with weeks as (
    select generate_series(
      date_trunc('week', (now() at time zone 'Europe/Madrid'))::date - (p_weeks - 1) * 7,
      date_trunc('week', (now() at time zone 'Europe/Madrid'))::date,
      interval '7 days')::date as week
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'week', w.week,
    'joined', (select count(*) from public.subscribers s where s.user_id = p_user and s.confirmed_at is not null
               and date_trunc('week', s.confirmed_at at time zone 'Europe/Madrid')::date = w.week),
    'left', (select count(*) from public.subscribers s where s.user_id = p_user and s.unsubscribed_at is not null
               and date_trunc('week', s.unsubscribed_at at time zone 'Europe/Madrid')::date = w.week)
  ) order by w.week), '[]'::jsonb) from weeks w;
$$;

revoke all on function public.amx_track(text, text, timestamptz, text, boolean) from public, anon, authenticated;
revoke all on function public.amx_campaign_stats(uuid, timestamptz) from public, anon, authenticated;
revoke all on function public.amx_growth(uuid, int) from public, anon, authenticated;
grant execute on function public.amx_track(text, text, timestamptz, text, boolean) to service_role;
grant execute on function public.amx_campaign_stats(uuid, timestamptz) to service_role;
grant execute on function public.amx_growth(uuid, int) to service_role;
