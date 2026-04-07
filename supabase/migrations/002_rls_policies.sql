-- ─── Row Level Security ────────────────────────────────────────────────────────
-- RLS ensures each client only sees their own data.
-- Superadmins (org_id IS NULL) see everything.

-- Helper: get current user's role and org
create or replace function auth_role() returns user_role language sql security definer as $$
  select role from profiles where id = auth.uid();
$$;

create or replace function auth_org_id() returns uuid language sql security definer as $$
  select org_id from profiles where id = auth.uid();
$$;

create or replace function is_superadmin() returns boolean language sql security definer as $$
  select role = 'superadmin' from profiles where id = auth.uid();
$$;

-- ─── Organizations ────────────────────────────────────────────────────────────
alter table organizations enable row level security;

create policy "superadmin: full access" on organizations
  using (is_superadmin());

create policy "client: own org only" on organizations
  for select using (id = auth_org_id());

create policy "client admin: update own org" on organizations
  for update using (id = auth_org_id() and auth_role() = 'admin');

-- ─── Profiles ─────────────────────────────────────────────────────────────────
alter table profiles enable row level security;

create policy "superadmin: full access" on profiles
  using (is_superadmin());

create policy "user: own profile" on profiles
  for select using (id = auth.uid());

create policy "admin: see org members" on profiles
  for select using (org_id = auth_org_id() and auth_role() in ('admin', 'editor'));

-- ─── Pages ────────────────────────────────────────────────────────────────────
alter table pages enable row level security;

create policy "superadmin: full access" on pages
  using (is_superadmin());

create policy "client: own org pages" on pages
  using (org_id = auth_org_id());

create policy "client editor+: insert/update" on pages
  for all using (org_id = auth_org_id() and auth_role() in ('admin', 'editor'));

-- Public read for published pages (used by site itself via anon key)
create policy "public: read published pages" on pages
  for select using (status = 'published');

-- ─── Leads ────────────────────────────────────────────────────────────────────
alter table leads enable row level security;

create policy "superadmin: full access" on leads
  using (is_superadmin());

create policy "client: own org leads" on leads
  using (org_id = auth_org_id());

-- Anon can INSERT (form submissions from public site)
create policy "public: submit lead" on leads
  for insert with check (true);

-- ─── Analytics Events ─────────────────────────────────────────────────────────
alter table analytics_events enable row level security;

create policy "superadmin: full access" on analytics_events
  using (is_superadmin());

create policy "client: own org events" on analytics_events
  for select using (org_id = auth_org_id());

-- Anon can INSERT (tracking from public site)
create policy "public: track event" on analytics_events
  for insert with check (true);

-- ─── Audit Logs ────────────────────────────────────────────────────────────────
alter table audit_logs enable row level security;

create policy "superadmin: full access" on audit_logs
  using (is_superadmin());

create policy "client admin: own org logs" on audit_logs
  for select using (org_id = auth_org_id() and auth_role() = 'admin');
