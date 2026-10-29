-- =======================================================
-- SANTAPOS MIGRATION 002: MIDTRANS GATEWAY & FINANCIAL AUDIT
-- =======================================================

-- 1. Table: payment_gateway_configs (Per-Tenant / SaaS Gateway Settings)
CREATE TABLE IF NOT EXISTS payment_gateway_configs (
  id BIGSERIAL PRIMARY KEY,
  tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL DEFAULT 'midtrans',
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  environment VARCHAR(20) NOT NULL DEFAULT 'sandbox', -- 'sandbox' or 'production'
  merchant_id VARCHAR(100) NULL,
  client_key VARCHAR(255) NULL,
  server_key TEXT NULL, -- Stored securely
  webhook_url TEXT NULL,
  extra_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_tenant_gateway_provider UNIQUE(tenant_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_gateway_configs_tenant ON payment_gateway_configs(tenant_id, provider);

-- 2. Table: payment_audit_logs (Financial Security Audit Trail)
CREATE TABLE IF NOT EXISTS payment_audit_logs (
  id BIGSERIAL PRIMARY KEY,
  tenant_id BIGINT NULL REFERENCES tenants(id) ON DELETE SET NULL,
  order_id BIGINT NULL,
  order_code VARCHAR(100) NOT NULL,
  event_type VARCHAR(50) NOT NULL, -- 'charge_created', 'webhook_received', 'signature_verified', 'signature_failed', 'order_settled', 'order_expired', 'idempotency_skipped'
  gross_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  payment_type VARCHAR(50) NULL, -- 'qris', 'bank_transfer', 'gopay', etc.
  transaction_status VARCHAR(50) NULL, -- 'settlement', 'pending', 'expire', 'deny', 'cancel'
  signature_hash TEXT NULL,
  is_signature_valid BOOLEAN NOT NULL DEFAULT FALSE,
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address VARCHAR(80) NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_audit_tenant_created ON payment_audit_logs(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_audit_order_code ON payment_audit_logs(order_code);
CREATE INDEX IF NOT EXISTS idx_payment_audit_event_type ON payment_audit_logs(event_type);

-- 3. Update customer_orders to track Midtrans Snap Token & Transaction ID
ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS midtrans_snap_token VARCHAR(255) NULL;
ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS midtrans_transaction_id VARCHAR(255) NULL;
ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS midtrans_payment_type VARCHAR(50) NULL;

CREATE INDEX IF NOT EXISTS idx_customer_orders_midtrans_token ON customer_orders(midtrans_snap_token);

