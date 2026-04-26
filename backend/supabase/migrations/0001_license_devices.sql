-- 0001_license_devices.sql
--
-- Goal: replace the licenses.machine_id column (single bound device) with a
-- license_devices table so we can:
--   * enforce real seat limits (count active devices, not boolean)
--   * soft-revoke individual devices and have the backend reject the next sync
--   * embed device_id as the JWT jti claim, binding tokens to a specific row
--
-- Idempotent: safe to run on a fresh DB or one that already has machine_id data.

-- 1. Ensure the licenses table exists with the columns the new code expects.
create table if not exists public.licenses (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  status text not null default 'active' check (status in ('active', 'revoked', 'expired')),
  plan text not null default 'pro',
  features jsonb not null default '["wa_send","wa_group_add","wa_extract","wa_validate","wa_auto_responder"]'::jsonb,
  expires_at timestamptz,
  seat_limit integer not null default 1 check (seat_limit >= 1 and seat_limit <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Backfill any missing columns on an existing table.
alter table public.licenses add column if not exists plan text default 'pro';
alter table public.licenses add column if not exists features jsonb default '["wa_send","wa_group_add","wa_extract","wa_validate","wa_auto_responder"]'::jsonb;
alter table public.licenses add column if not exists seat_limit integer default 1;
alter table public.licenses add column if not exists updated_at timestamptz default now();

-- 2. The new bindings table.
create table if not exists public.license_devices (
  id uuid primary key default gen_random_uuid(),
  license_id uuid not null references public.licenses(id) on delete cascade,
  hwid text not null,
  bound_at timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  revoked_at timestamptz,
  user_agent text,
  -- Only one *active* binding per (license, hwid). Revoked rows can coexist.
  constraint license_devices_active_unique
    exclude using btree (license_id with =, hwid with =) where (revoked_at is null)
);

create index if not exists license_devices_license_active_idx
  on public.license_devices (license_id) where (revoked_at is null);

create index if not exists license_devices_revoked_at_idx
  on public.license_devices (revoked_at);

-- 3. Migrate existing single-device bindings (licenses.machine_id) into rows.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'licenses' and column_name = 'machine_id'
  ) then
    insert into public.license_devices (license_id, hwid, bound_at, last_seen)
    select l.id, l.machine_id, coalesce(l.created_at, now()), now()
    from public.licenses l
    where l.machine_id is not null
      and not exists (
        select 1 from public.license_devices d
        where d.license_id = l.id and d.hwid = l.machine_id and d.revoked_at is null
      );
  end if;
end $$;

-- 4. Keep the legacy machine_id column for one release so a partial rollback
-- doesn't break the prior code path. A follow-up migration drops it once the
-- new code has shipped to all users.
-- alter table public.licenses drop column machine_id;  -- defer to 0002

-- 5. Lock down with RLS. Only service_role (backend) reads/writes; anon and
-- authenticated (admin via Supabase Auth) get nothing — the admin UI uses the
-- service-role client server-side.
alter table public.licenses        enable row level security;
alter table public.license_devices enable row level security;

drop policy if exists "deny all" on public.licenses;
drop policy if exists "deny all" on public.license_devices;

-- No policies = deny by default for non-service-role. service_role bypasses RLS.

-- 6. updated_at trigger so we don't have to remember to set it everywhere.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists licenses_touch_updated_at on public.licenses;
create trigger licenses_touch_updated_at
  before update on public.licenses
  for each row execute function public.touch_updated_at();
