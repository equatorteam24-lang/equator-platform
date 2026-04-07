-- ─── Extensions ───────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── Enums ────────────────────────────────────────────────────────────────────
create type org_status     as enum ('active', 'suspended', 'trial');
create type user_role      as enum ('superadmin', 'admin', 'editor');
create type lead_status    as enum ('new', 'in_progress', 'closed', 'spam');
create type payment_status as enum ('paid', 'unpaid', 'overdue', 'trial');
create type page_status    as enum ('published', 'draft');

-- ─── Organizations ────────────────────────────────────────────────────────────
create table organizations (
  id             uuid primary key default uuid_generate_v4(),
  name           text not null,
  domain         text unique,
  slug           text not null unique,
  status         org_status     not null default 'trial',
  payment_status payment_status not null default 'trial',
  paid_until     date,
  plan           text,
  settings       jsonb not null default '{}',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ─── Profiles (extends auth.users) ────────────────────────────────────────────
create table profiles (
  id          uuid primary key references auth.users on delete cascade,
  org_id      uuid references organizations on delete cascade,
  role        user_role not null default 'admin',
  full_name   text,
  avatar_url  text,
  created_at  timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, role)
  values (new.id, 'admin');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ─── Pages (CMS) ──────────────────────────────────────────────────────────────
create table pages (
  id         uuid primary key default uuid_generate_v4(),
  org_id     uuid not null references organizations on delete cascade,
  slug       text not null,
  title      text not null,
  status     page_status not null default 'draft',
  seo        jsonb not null default '{}',
  content    jsonb not null default '{"blocks":[]}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, slug)
);

-- ─── Leads (CRM) ──────────────────────────────────────────────────────────────
create table leads (
  id          uuid primary key default uuid_generate_v4(),
  org_id      uuid not null references organizations on delete cascade,
  name        text not null,
  email       text,
  phone       text,
  message     text,
  source_page text,
  utm_source  text,
  utm_medium  text,
  utm_campaign text,
  status      lead_status not null default 'new',
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ─── Analytics Events ─────────────────────────────────────────────────────────
create table analytics_events (
  id         uuid primary key default uuid_generate_v4(),
  org_id     uuid not null references organizations on delete cascade,
  session_id text not null,
  event      text not null,
  page       text not null,
  referrer   text,
  country    text,
  device     text,
  created_at timestamptz not null default now()
);

-- Analytics is append-only, partition by month for performance
create index on analytics_events (org_id, created_at desc);
create index on analytics_events (org_id, page);

-- ─── Audit Log ────────────────────────────────────────────────────────────────
create table audit_logs (
  id          uuid primary key default uuid_generate_v4(),
  org_id      uuid references organizations on delete set null,
  user_id     uuid references auth.users on delete set null,
  action      text not null,
  resource    text not null,
  resource_id uuid,
  old_value   jsonb,
  new_value   jsonb,
  ip          text,
  created_at  timestamptz not null default now()
);

create index on audit_logs (org_id, created_at desc);

-- ─── updated_at trigger ────────────────────────────────────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on organizations for each row execute procedure set_updated_at();
create trigger set_updated_at before update on pages        for each row execute procedure set_updated_at();
create trigger set_updated_at before update on leads        for each row execute procedure set_updated_at();
