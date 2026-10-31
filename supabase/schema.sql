-- Rogue Rose Property & Accounting
-- Run in Supabase SQL Editor after creating the project.
-- Every business record is scoped to the signed-in owner. RLS is enabled on every table.

create extension if not exists pgcrypto;

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  address text,
  monthly_rent numeric(12,2) not null default 0 check (monthly_rent >= 0),
  status text not null default 'Vacant' check (status in ('Vacant','Occupied','Maintenance')),
  notes text,
  created_at timestamptz not null default now(),
  unique (id, owner_id)
);

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  property_id uuid,
  name text not null,
  email text,
  phone text,
  lease_start date,
  lease_end date,
  notes text,
  created_at timestamptz not null default now(),
  unique (id, owner_id),
  constraint tenants_property_owner_fk
    foreign key (property_id, owner_id)
    references public.properties(id, owner_id) on delete set null
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  property_id uuid,
  tenant_id uuid,
  transaction_date date not null default current_date,
  description text not null,
  type text not null check (type in ('Income','Expense')),
  category text not null default 'Other',
  amount numeric(12,2) not null check (amount >= 0),
  reference text,
  notes text,
  created_at timestamptz not null default now(),
  constraint transactions_property_owner_fk
    foreign key (property_id, owner_id)
    references public.properties(id, owner_id) on delete set null,
  constraint transactions_tenant_owner_fk
    foreign key (tenant_id, owner_id)
    references public.tenants(id, owner_id) on delete set null
);

create table if not exists public.maintenance (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  property_id uuid,
  issue text not null,
  reported_date date not null default current_date,
  priority text not null default 'Normal' check (priority in ('Low','Normal','Urgent')),
  status text not null default 'Open' check (status in ('Open','In progress','Complete')),
  vendor text,
  cost numeric(12,2) check (cost is null or cost >= 0),
  notes text,
  created_at timestamptz not null default now(),
  constraint maintenance_property_owner_fk
    foreign key (property_id, owner_id)
    references public.properties(id, owner_id) on delete set null
);

create table if not exists public.workspace_settings (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  business_name text not null default 'Rogue Rose Property & Accounting',
  owner_name text,
  updated_at timestamptz not null default now()
);

create index if not exists properties_owner_idx on public.properties(owner_id);
create index if not exists tenants_owner_idx on public.tenants(owner_id);
create index if not exists transactions_owner_date_idx on public.transactions(owner_id, transaction_date desc);
create index if not exists maintenance_owner_date_idx on public.maintenance(owner_id, reported_date desc);

alter table public.properties enable row level security;
alter table public.tenants enable row level security;
alter table public.transactions enable row level security;
alter table public.maintenance enable row level security;
alter table public.workspace_settings enable row level security;

drop policy if exists "Owner manages own properties" on public.properties;
create policy "Owner manages own properties" on public.properties
  for all to authenticated using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

drop policy if exists "Owner manages own tenants" on public.tenants;
create policy "Owner manages own tenants" on public.tenants
  for all to authenticated using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

drop policy if exists "Owner manages own transactions" on public.transactions;
create policy "Owner manages own transactions" on public.transactions
  for all to authenticated using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

drop policy if exists "Owner manages own maintenance" on public.maintenance;
create policy "Owner manages own maintenance" on public.maintenance
  for all to authenticated using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

drop policy if exists "Owner manages own workspace settings" on public.workspace_settings;
create policy "Owner manages own workspace settings" on public.workspace_settings
  for all to authenticated using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

-- No public/anonymous access policies are created. Use Supabase Auth for sign-in.
