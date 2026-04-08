-- ─── Enums ────────────────────────────────────────────────────────────────────
create type subscription_plan   as enum ('monthly', 'annual');
create type subscription_status as enum ('active', 'expired', 'trial', 'cancelled');

-- ─── Subscriptions ────────────────────────────────────────────────────────────
-- One subscription per org (unique on org_id)
create table subscriptions (
  id                  uuid primary key default uuid_generate_v4(),
  org_id              uuid not null references organizations on delete cascade unique,
  plan                subscription_plan   not null default 'monthly',
  status              subscription_status not null default 'trial',
  amount              numeric(10,2) not null default 15.00,
  currency            text not null default 'USD',
  -- WayForPay recurring token (saved after first successful payment)
  rec_token           text,
  rec_token_lifetime  date,
  -- Billing cycle
  next_billing_date   date,
  trial_ends_at       date,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create trigger set_updated_at before update on subscriptions
  for each row execute procedure set_updated_at();

-- ─── Payment History ──────────────────────────────────────────────────────────
create table payment_history (
  id                        uuid primary key default uuid_generate_v4(),
  org_id                    uuid not null references organizations on delete cascade,
  subscription_id           uuid references subscriptions on delete set null,
  plan                      subscription_plan,
  amount                    numeric(10,2) not null,
  currency                  text not null default 'USD',
  status                    text not null, -- approved | declined | pending | refunded
  -- WayForPay fields
  wayforpay_order_id        text unique,
  wayforpay_transaction_id  text,
  wayforpay_reason          text,       -- decline reason if any
  wayforpay_rec_token       text,       -- recToken from this payment (if first)
  is_recurring              boolean not null default false,
  created_at                timestamptz not null default now()
);

create index on payment_history (org_id, created_at desc);

-- ─── RLS ──────────────────────────────────────────────────────────────────────
alter table subscriptions  enable row level security;
alter table payment_history enable row level security;

-- Subscriptions
create policy "superadmin: full access" on subscriptions
  using (is_superadmin());

create policy "client: read own subscription" on subscriptions
  for select using (org_id = auth_org_id());

-- Payment history
create policy "superadmin: full access" on payment_history
  using (is_superadmin());

create policy "client: read own payment history" on payment_history
  for select using (org_id = auth_org_id());

-- ─── Auto-create trial subscription when org is created ───────────────────────
create or replace function create_trial_subscription()
returns trigger language plpgsql security definer as $$
begin
  insert into subscriptions (org_id, plan, status, trial_ends_at)
  values (new.id, 'monthly', 'trial', (now() + interval '14 days')::date);
  return new;
end;
$$;

create trigger on_org_created
  after insert on organizations
  for each row execute procedure create_trial_subscription();

-- ─── Sync payment_status on organizations from subscriptions ─────────────────
create or replace function sync_org_payment_status()
returns trigger language plpgsql security definer as $$
begin
  update organizations set
    payment_status = case new.status
      when 'active'    then 'paid'::payment_status
      when 'expired'   then 'overdue'::payment_status
      when 'cancelled' then 'unpaid'::payment_status
      when 'trial'     then 'trial'::payment_status
    end,
    paid_until = new.next_billing_date,
    plan       = new.plan::text,
    updated_at = now()
  where id = new.org_id;
  return new;
end;
$$;

create trigger sync_org_on_subscription_change
  after insert or update on subscriptions
  for each row execute procedure sync_org_payment_status();
