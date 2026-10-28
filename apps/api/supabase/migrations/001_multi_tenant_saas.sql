-- =======================================================
-- SANTAPOS MULTI-TENANT SAAS MIGRATION
-- =======================================================

create extension if not exists pgcrypto;

-- Ensure roles include superadmin and kitchen
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'superadmin';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'kitchen';

-- 1. Table: plans (Starter, Pro, Franchise)
create table if not exists plans (
  id bigserial primary key,
  code varchar(50) unique not null,
  name varchar(100) not null,
  price numeric(12,2) not null default 0,
  billing_interval varchar(20) not null default 'monthly',
  max_outlets integer not null default 1,
  max_cashiers integer not null default 2,
  capabilities jsonb not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Seed plans
insert into plans (code, name, price, max_outlets, max_cashiers, capabilities)
values
  ('starter', 'Santapos Starter (UMKM)', 99000, 1, 2, '{"has_self_order_qr":true,"has_manual_payment":true,"has_vouchers_rewards":false,"has_recipe_hpp":false,"has_central_warehouse":false,"has_cashier_schedule":false,"has_ai_assistant":false,"has_custom_domain":false,"can_remove_powered_by":false,"can_export_pdf_reports":false,"has_headquarters_overview":false}'::jsonb),
  ('pro', 'Santapos Pro', 249000, 3, 10, '{"has_self_order_qr":true,"has_manual_payment":true,"has_vouchers_rewards":true,"has_recipe_hpp":true,"has_central_warehouse":true,"has_cashier_schedule":true,"has_ai_assistant":true,"has_custom_domain":false,"can_remove_powered_by":false,"can_export_pdf_reports":true,"has_headquarters_overview":false}'::jsonb),
  ('franchise', 'Santapos Franchise Multi-Cabang', 599000, 9999, 9999, '{"has_self_order_qr":true,"has_manual_payment":true,"has_vouchers_rewards":true,"has_recipe_hpp":true,"has_central_warehouse":true,"has_cashier_schedule":true,"has_ai_assistant":true,"has_custom_domain":true,"can_remove_powered_by":true,"can_export_pdf_reports":true,"has_headquarters_overview":true}'::jsonb)
on conflict (code) do update set
  name = excluded.name,
  price = excluded.price,
  max_outlets = excluded.max_outlets,
  max_cashiers = excluded.max_cashiers,
  capabilities = excluded.capabilities;

-- 2. Table: tenants
create table if not exists tenants (
  id bigserial primary key,
  name varchar(150) not null,
  slug varchar(60) unique not null,
  custom_domain varchar(150) unique null,
  plan_id bigint not null references plans(id) on delete restrict,
  status varchar(30) not null default 'active',
  trial_ends_at timestamptz null,
  subscription_ends_at timestamptz null,
  feature_overrides jsonb null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Seed demo tenant: Sultan Kebab
insert into tenants (id, name, slug, plan_id, status)
values (
  1,
  'Sultan Kebab',
  'sultan-kebab',
  (select id from plans where code = 'franchise' limit 1),
  'active'
)
on conflict (id) do nothing;

-- 3. Add tenant_id to all operational tables
alter table branches add column if not exists tenant_id bigint null references tenants(id) on delete cascade;
alter table users add column if not exists tenant_id bigint null references tenants(id) on delete cascade;
alter table categories add column if not exists tenant_id bigint null references tenants(id) on delete cascade;
alter table products add column if not exists tenant_id bigint null references tenants(id) on delete cascade;
alter table transactions add column if not exists tenant_id bigint null references tenants(id) on delete cascade;
alter table stock_items add column if not exists tenant_id bigint null references tenants(id) on delete cascade;
alter table attendance add column if not exists tenant_id bigint null references tenants(id) on delete cascade;
alter table main_stock add column if not exists tenant_id bigint null references tenants(id) on delete cascade;
alter table stock_requests add column if not exists tenant_id bigint null references tenants(id) on delete cascade;
alter table website_settings add column if not exists tenant_id bigint null references tenants(id) on delete cascade;
alter table stock_issues add column if not exists tenant_id bigint null references tenants(id) on delete cascade;
alter table dining_tables add column if not exists tenant_id bigint null references tenants(id) on delete cascade;
alter table customer_orders add column if not exists tenant_id bigint null references tenants(id) on delete cascade;
alter table discount_programs add column if not exists tenant_id bigint null references tenants(id) on delete cascade;
alter table discount_redemptions add column if not exists tenant_id bigint null references tenants(id) on delete cascade;
alter table review_reward_vouchers add column if not exists tenant_id bigint null references tenants(id) on delete cascade;
alter table payment_methods add column if not exists tenant_id bigint null references tenants(id) on delete cascade;
alter table customer_table_sessions add column if not exists tenant_id bigint null references tenants(id) on delete cascade;
alter table customer_table_queue add column if not exists tenant_id bigint null references tenants(id) on delete cascade;

-- 4. Backfill existing data to default tenant (id = 1)
update branches set tenant_id = 1 where tenant_id is null;
update users set tenant_id = 1 where tenant_id is null;
update categories set tenant_id = 1 where tenant_id is null;
update products set tenant_id = 1 where tenant_id is null;
update transactions set tenant_id = 1 where tenant_id is null;
update stock_items set tenant_id = 1 where tenant_id is null;
update attendance set tenant_id = 1 where tenant_id is null;
update main_stock set tenant_id = 1 where tenant_id is null;
update stock_requests set tenant_id = 1 where tenant_id is null;
update website_settings set tenant_id = 1 where tenant_id is null;
update stock_issues set tenant_id = 1 where tenant_id is null;
update dining_tables set tenant_id = 1 where tenant_id is null;
update customer_orders set tenant_id = 1 where tenant_id is null;
update discount_programs set tenant_id = 1 where tenant_id is null;
update discount_redemptions set tenant_id = 1 where tenant_id is null;
update review_reward_vouchers set tenant_id = 1 where tenant_id is null;
update payment_methods set tenant_id = 1 where tenant_id is null;
update customer_table_sessions set tenant_id = 1 where tenant_id is null;
update customer_table_queue set tenant_id = 1 where tenant_id is null;

-- Set NOT NULL constraint where applicable
alter table branches alter column tenant_id set not null;
alter table users alter column tenant_id set not null;
alter table categories alter column tenant_id set not null;
alter table products alter column tenant_id set not null;
alter table transactions alter column tenant_id set not null;
alter table stock_items alter column tenant_id set not null;
alter table attendance alter column tenant_id set not null;
alter table main_stock alter column tenant_id set not null;
alter table stock_requests alter column tenant_id set not null;
alter table website_settings alter column tenant_id set not null;
alter table stock_issues alter column tenant_id set not null;
alter table dining_tables alter column tenant_id set not null;
alter table customer_orders alter column tenant_id set not null;
alter table discount_programs alter column tenant_id set not null;
alter table payment_methods alter column tenant_id set not null;

-- 5. Multi-tenant composite uniqueness & indexes
alter table branches drop constraint if exists branches_branch_key_key;
create unique index if not exists unique_tenant_branch_key on branches(tenant_id, branch_key);

alter table website_settings drop constraint if exists website_settings_setting_key_key;
create unique index if not exists unique_tenant_setting_key on website_settings(tenant_id, setting_key);

alter table payment_methods drop constraint if exists payment_methods_method_key_key;
create unique index if not exists unique_tenant_payment_method on payment_methods(tenant_id, method_key);

create index if not exists idx_users_tenant_role on users(tenant_id, role);
create index if not exists idx_categories_tenant_name on categories(tenant_id, name);
create index if not exists idx_products_tenant_cat on products(tenant_id, category_id);
create index if not exists idx_products_tenant_name on products(tenant_id, name);
create index if not exists idx_transactions_tenant_created on transactions(tenant_id, created_at desc);
create index if not exists idx_transactions_tenant_branch on transactions(tenant_id, branch_id);
create index if not exists idx_stock_items_tenant_name on stock_items(tenant_id, name);
create index if not exists idx_attendance_tenant_date on attendance(tenant_id, date);
create index if not exists idx_main_stock_tenant_branch on main_stock(tenant_id, branch_id);
create index if not exists idx_stock_requests_tenant_branch on stock_requests(tenant_id, branch_id, status);
create index if not exists idx_stock_issues_tenant_branch on stock_issues(tenant_id, branch_id, status);
create index if not exists idx_dining_tables_tenant_branch on dining_tables(tenant_id, branch_id);
create index if not exists idx_dining_tables_tenant_qr on dining_tables(tenant_id, qr_token);
create index if not exists idx_customer_orders_tenant_status on customer_orders(tenant_id, status, created_at desc);
create index if not exists idx_customer_orders_tenant_code on customer_orders(tenant_id, order_code);
create index if not exists idx_discount_programs_tenant_status on discount_programs(tenant_id, status, type);

-- 6. Row Level Security (RLS) policies
alter table tenants enable row level security;
alter table branches enable row level security;
alter table users enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table transactions enable row level security;
alter table stock_items enable row level security;
alter table attendance enable row level security;
alter table main_stock enable row level security;
alter table stock_requests enable row level security;
alter table stock_issues enable row level security;
alter table dining_tables enable row level security;
alter table customer_orders enable row level security;
alter table discount_programs enable row level security;
alter table payment_methods enable row level security;
alter table website_settings enable row level security;

-- Helper RLS isolation macro / function
create or replace function current_app_tenant_id()
returns bigint as $$
begin
  return nullif(current_setting('app.current_tenant_id', true), '')::bigint;
end;
$$ language plpgsql stable;

-- Create isolation policies
drop policy if exists tenant_isolation_branches on branches;
create policy tenant_isolation_branches on branches for all
  using (current_setting('app.is_superadmin', true) = 'true' or tenant_id = current_app_tenant_id());

drop policy if exists tenant_isolation_users on users;
create policy tenant_isolation_users on users for all
  using (current_setting('app.is_superadmin', true) = 'true' or tenant_id = current_app_tenant_id());

drop policy if exists tenant_isolation_categories on categories;
create policy tenant_isolation_categories on categories for all
  using (current_setting('app.is_superadmin', true) = 'true' or tenant_id = current_app_tenant_id());

drop policy if exists tenant_isolation_products on products;
create policy tenant_isolation_products on products for all
  using (current_setting('app.is_superadmin', true) = 'true' or tenant_id = current_app_tenant_id());

drop policy if exists tenant_isolation_transactions on transactions;
create policy tenant_isolation_transactions on transactions for all
  using (current_setting('app.is_superadmin', true) = 'true' or tenant_id = current_app_tenant_id());

drop policy if exists tenant_isolation_stock_items on stock_items;
create policy tenant_isolation_stock_items on stock_items for all
  using (current_setting('app.is_superadmin', true) = 'true' or tenant_id = current_app_tenant_id());

drop policy if exists tenant_isolation_attendance on attendance;
create policy tenant_isolation_attendance on attendance for all
  using (current_setting('app.is_superadmin', true) = 'true' or tenant_id = current_app_tenant_id());

drop policy if exists tenant_isolation_main_stock on main_stock;
create policy tenant_isolation_main_stock on main_stock for all
  using (current_setting('app.is_superadmin', true) = 'true' or tenant_id = current_app_tenant_id());

drop policy if exists tenant_isolation_stock_requests on stock_requests;
create policy tenant_isolation_stock_requests on stock_requests for all
  using (current_setting('app.is_superadmin', true) = 'true' or tenant_id = current_app_tenant_id());

drop policy if exists tenant_isolation_stock_issues on stock_issues;
create policy tenant_isolation_stock_issues on stock_issues for all
  using (current_setting('app.is_superadmin', true) = 'true' or tenant_id = current_app_tenant_id());

drop policy if exists tenant_isolation_dining_tables on dining_tables;
create policy tenant_isolation_dining_tables on dining_tables for all
  using (current_setting('app.is_superadmin', true) = 'true' or tenant_id = current_app_tenant_id());

drop policy if exists tenant_isolation_customer_orders on customer_orders;
create policy tenant_isolation_customer_orders on customer_orders for all
  using (current_setting('app.is_superadmin', true) = 'true' or tenant_id = current_app_tenant_id());

drop policy if exists tenant_isolation_discount_programs on discount_programs;
create policy tenant_isolation_discount_programs on discount_programs for all
  using (current_setting('app.is_superadmin', true) = 'true' or tenant_id = current_app_tenant_id());

drop policy if exists tenant_isolation_payment_methods on payment_methods;
create policy tenant_isolation_payment_methods on payment_methods for all
  using (current_setting('app.is_superadmin', true) = 'true' or tenant_id = current_app_tenant_id());

drop policy if exists tenant_isolation_website_settings on website_settings;
create policy tenant_isolation_website_settings on website_settings for all
  using (current_setting('app.is_superadmin', true) = 'true' or tenant_id = current_app_tenant_id());
