const db = require('../config/db');

exports.getStats = async (req, res) => {
  try {
    // 1. Tenant counts
    const [tenantRows] = await db.query(`
      SELECT
        COUNT(*) AS total_tenants,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active_tenants,
        SUM(CASE WHEN status = 'suspended' THEN 1 ELSE 0 END) AS suspended_tenants,
        SUM(CASE WHEN plan_code = 'starter' THEN 1 ELSE 0 END) AS starter_plans,
        SUM(CASE WHEN plan_code = 'pro' THEN 1 ELSE 0 END) AS pro_plans,
        SUM(CASE WHEN plan_code = 'franchise' THEN 1 ELSE 0 END) AS franchise_plans
      FROM tenants
    `);

    // 2. Branch counts
    const [branchRows] = await db.query(`
      SELECT COUNT(*) AS total_branches FROM branches
    `);

    // 3. User counts
    const [userRows] = await db.query(`
      SELECT
        COUNT(*) AS total_users,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) AS admin_users,
        SUM(CASE WHEN role = 'kasir' THEN 1 ELSE 0 END) AS cashier_users
      FROM users
    `);

    // 4. Platform GMV / Transactions
    let totalTrx = 0;
    let totalGmv = 0;
    try {
      const [trxRows] = await db.query(`
        SELECT COUNT(*) AS total_trx, COALESCE(SUM(grand_total), 0) AS total_gmv
        FROM transactions
      `);
      totalTrx = Number(trxRows?.[0]?.total_trx || 0);
      totalGmv = Number(trxRows?.[0]?.total_gmv || 0);
    } catch (_) {}

    res.json({
      success: true,
      data: {
        tenants: {
          total: Number(tenantRows?.[0]?.total_tenants || 0),
          active: Number(tenantRows?.[0]?.active_tenants || 0),
          suspended: Number(tenantRows?.[0]?.suspended_tenants || 0),
          by_plan: {
            starter: Number(tenantRows?.[0]?.starter_plans || 0),
            pro: Number(tenantRows?.[0]?.pro_plans || 0),
            franchise: Number(tenantRows?.[0]?.franchise_plans || 0),
          }
        },
        branches: {
          total: Number(branchRows?.[0]?.total_branches || 0),
        },
        users: {
          total: Number(userRows?.[0]?.total_users || 0),
          admins: Number(userRows?.[0]?.admin_users || 0),
          cashiers: Number(userRows?.[0]?.cashier_users || 0),
        },
        platform: {
          total_transactions: totalTrx,
          total_gmv: totalGmv,
        }
      }
    });
  } catch (err) {
    console.error('[superadmin getStats error]:', err);
    res.status(500).json({ message: 'Gagal mengambil ringkasan platform: ' + err.message });
  }
};

exports.getTenants = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        t.id,
        t.name,
        t.slug,
        t.domain,
        t.plan_code,
        t.status,
        t.created_at,
        t.branding,
        (SELECT COUNT(*) FROM branches b WHERE b.tenant_id = t.id) AS branch_count,
        (SELECT COUNT(*) FROM users u WHERE u.tenant_id = t.id) AS user_count,
        (SELECT email FROM users u WHERE u.tenant_id = t.id AND u.role = 'admin' ORDER BY u.id ASC LIMIT 1) AS owner_email,
        (SELECT name FROM users u WHERE u.tenant_id = t.id AND u.role = 'admin' ORDER BY u.id ASC LIMIT 1) AS owner_name
      FROM tenants t
      ORDER BY t.id DESC
    `);

    res.json({
      success: true,
      data: rows.map(r => ({
        ...r,
        branch_count: Number(r.branch_count || 0),
        user_count: Number(r.user_count || 0),
      }))
    });
  } catch (err) {
    console.error('[superadmin getTenants error]:', err);
    res.status(500).json({ message: 'Gagal mengambil data tenant: ' + err.message });
  }
};

exports.updateTenantPlan = async (req, res) => {
  const { id } = req.params;
  const { plan_code } = req.body;

  const validPlans = ['starter', 'pro', 'franchise'];
  if (!validPlans.includes(plan_code)) {
    return res.status(400).json({ message: 'Kode plan tidak valid. Pilihan: starter, pro, franchise' });
  }

  try {
    const [result] = await db.query(
      'UPDATE tenants SET plan_code = ?, updated_at = NOW() WHERE id = ?',
      [plan_code, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Tenant tidak ditemukan' });
    }

    res.json({ success: true, message: `Plan tenant berhasil diubah menjadi ${plan_code}` });
  } catch (err) {
    console.error('[superadmin updateTenantPlan error]:', err);
    res.status(500).json({ message: 'Gagal memperbarui plan tenant: ' + err.message });
  }
};

exports.updateTenantStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatus = ['active', 'suspended', 'trial'];
  if (!validStatus.includes(status)) {
    return res.status(400).json({ message: 'Status tidak valid. Pilihan: active, suspended, trial' });
  }

  try {
    const [result] = await db.query(
      'UPDATE tenants SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Tenant tidak ditemukan' });
    }

    res.json({ success: true, message: `Status tenant berhasil diubah menjadi ${status}` });
  } catch (err) {
    console.error('[superadmin updateTenantStatus error]:', err);
    res.status(500).json({ message: 'Gagal memperbarui status tenant: ' + err.message });
  }
};

const detectProvider = (urlStr) => {
  if (!urlStr) return 'unknown';
  const low = urlStr.toLowerCase();
  if (low.includes('supabase.co') || low.includes('pooler.supabase.com')) return 'supabase';
  if (low.includes('neon.tech')) return 'neon';
  if (low.includes('render.com')) return 'render';
  if (low.includes('aivencloud.com') || low.includes('aiven.io')) return 'aiven';
  if (low.includes('oracle') || low.includes('adb.')) return 'oracle';
  return 'custom';
};

const maskConnectionString = (urlStr) => {
  if (!urlStr) return '';
  try {
    const parsed = new URL(urlStr);
    if (parsed.password) parsed.password = '••••••••';
    return parsed.toString();
  } catch (_) {
    return 'postgresql://••••••••:••••••••@••••••••/••••••••';
  }
};

exports.getDatabaseConfig = async (req, res) => {
  try {
    const rawUrl = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL || '';
    const provider = detectProvider(rawUrl);

    let latencyMs = 0;
    let version = 'Unknown';
    let totalTables = 0;
    let isConnected = false;

    const start = Date.now();
    try {
      const [verRows] = await db.query('SELECT version() AS ver, current_database() AS db_name');
      latencyMs = Date.now() - start;
      version = verRows?.[0]?.ver || 'PostgreSQL';
      isConnected = true;

      const [tableRows] = await db.query(
        "SELECT COUNT(*) AS total FROM information_schema.tables WHERE table_schema = 'public'"
      );
      totalTables = Number(tableRows?.[0]?.total || 0);
    } catch (e) {
      latencyMs = Date.now() - start;
      console.warn('[getDatabaseConfig test query warning]:', e.message);
    }

    let parsedHost = '-';
    let parsedPort = 5432;
    let parsedDb = 'postgres';
    let parsedUser = '-';

    try {
      const parsed = new URL(rawUrl);
      parsedHost = parsed.hostname;
      parsedPort = parsed.port || 5432;
      parsedDb = parsed.pathname?.replace(/^\//, '') || 'postgres';
      parsedUser = parsed.username || '-';
    } catch (_) {}

    res.json({
      success: true,
      data: {
        active_provider: provider,
        is_connected: isConnected,
        latency_ms: latencyMs,
        version,
        total_tables: totalTables,
        connection: {
          masked_url: maskConnectionString(rawUrl),
          host: parsedHost,
          port: parsedPort,
          database: parsedDb,
          user: parsedUser,
          ssl: process.env.DB_SSL === 'true' || process.env.DB_SSL === true,
        },
        storage: {
          driver: process.env.STORAGE_DRIVER || 'supabase',
          bucket: process.env.SUPABASE_STORAGE_BUCKET || 'restaurant-pos-assets',
          url: process.env.SUPABASE_URL || 'https://igmenzwhhkrqtsrbgfne.supabase.co',
        },
        supported_providers: [
          {
            id: 'supabase',
            name: 'Supabase PostgreSQL',
            dialect: 'postgres',
            badge: 'Default / Aktif',
            free_tier: '500MB DB, 1GB Storage, 50k MAU, Realtime & Auth',
            docs_url: 'https://supabase.com',
            format_hint: 'postgresql://postgres.[REF]:[PASS]@[HOST]:6543/postgres?sslmode=require',
            status: 'compatible'
          },
          {
            id: 'neon',
            name: 'Neon Serverless Postgres',
            dialect: 'postgres',
            badge: 'Always Free',
            free_tier: '0.5 GB Storage, Serverless Autoscaling, Git-like Branching',
            docs_url: 'https://neon.tech',
            format_hint: 'postgresql://[USER]:[PASS]@[HOST]/neondb?sslmode=require',
            status: 'compatible'
          },
          {
            id: 'render',
            name: 'Render PostgreSQL',
            dialect: 'postgres',
            badge: '90-Day Free',
            free_tier: '1 GB RAM, Shared CPU, Full Postgres 16',
            docs_url: 'https://render.com',
            format_hint: 'postgresql://[USER]:[PASS]@[HOST].render.com/[DBNAME]',
            status: 'compatible'
          },
          {
            id: 'aiven',
            name: 'Aiven Cloud Postgres',
            dialect: 'postgres',
            badge: 'Free Tier',
            free_tier: '1 vCPU, 1 GB RAM, 5 GB Storage, Automated Backups',
            docs_url: 'https://aiven.io',
            format_hint: 'postgres://avnadmin:[PASS]@[HOST]:[PORT]/defaultdb?sslmode=require',
            status: 'compatible'
          },
          {
            id: 'oracle',
            name: 'Oracle Cloud Autonomous Database',
            dialect: 'oracle',
            badge: '2x 20GB Always Free',
            free_tier: '20 GB Storage, OCPU Dedicated, mTLS Wallets',
            docs_url: 'https://www.oracle.com/cloud/free/',
            format_hint: 'Memerlukan Oracle Wallet / mTLS. Disarankan deploy PostgreSQL di Oracle Always Free Compute VM.',
            status: 'vm_recommended'
          }
        ]
      }
    });
  } catch (err) {
    console.error('[superadmin getDatabaseConfig error]:', err);
    res.status(500).json({ message: 'Gagal mengambil konfigurasi database: ' + err.message });
  }
};

exports.testDatabaseConnection = async (req, res) => {
  const { connection_string } = req.body;
  if (!connection_string) {
    return res.status(400).json({ message: 'Connection string wajib diisi' });
  }

  const { Client } = require('pg');
  let client;
  const start = Date.now();

  try {
    const url = new URL(connection_string);
    url.searchParams.delete('sslmode');
    url.searchParams.delete('sslcert');
    url.searchParams.delete('sslkey');
    url.searchParams.delete('sslrootcert');

    client = new Client({
      connectionString: url.toString(),
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 7000,
    });

    await client.connect();
    const verRes = await client.query('SELECT version() AS ver, current_database() AS db_name, NOW() AS current_time');
    const latency = Date.now() - start;

    await client.end();

    const provider = detectProvider(connection_string);

    res.json({
      success: true,
      message: `Koneksi ke database (${provider.toUpperCase()}) berhasil diverifikasi!`,
      data: {
        provider,
        latency_ms: latency,
        version: verRes.rows[0]?.ver || 'PostgreSQL',
        database: verRes.rows[0]?.db_name,
        time: verRes.rows[0]?.current_time,
      }
    });
  } catch (err) {
    if (client) {
      try { await client.end(); } catch (_) {}
    }
    console.error('[testDatabaseConnection error]:', err.message);
    res.status(400).json({
      success: false,
      message: 'Gagal terhubung ke database: ' + err.message,
    });
  }
};

exports.updateDatabaseConfig = async (req, res) => {
  const { connection_string, storage_bucket, supabase_url, supabase_service_role_key } = req.body;

  if (!connection_string) {
    return res.status(400).json({ message: 'Connection string wajib diisi' });
  }

  try {
    // 1. Verify connection before updating
    const { Client } = require('pg');
    const url = new URL(connection_string);
    url.searchParams.delete('sslmode');

    const client = new Client({
      connectionString: url.toString(),
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 7000,
    });

    await client.connect();
    await client.end();

    // 2. Update process.env runtime
    process.env.DATABASE_URL = connection_string;
    process.env.SUPABASE_DATABASE_URL = connection_string;
    if (storage_bucket) process.env.SUPABASE_STORAGE_BUCKET = storage_bucket;
    if (supabase_url) process.env.SUPABASE_URL = supabase_url;
    if (supabase_service_role_key) process.env.SUPABASE_SERVICE_ROLE_KEY = supabase_service_role_key;

    // 3. Persist to apps/api/.env file
    const fs = require('fs');
    const path = require('path');
    const envPath = path.join(__dirname, '../.env');

    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf8');
      envContent = envContent.replace(/^DATABASE_URL=.*$/m, `DATABASE_URL=${connection_string}`);
      envContent = envContent.replace(/^SUPABASE_DATABASE_URL=.*$/m, `SUPABASE_DATABASE_URL=${connection_string}`);
      if (storage_bucket) {
        envContent = envContent.replace(/^SUPABASE_STORAGE_BUCKET=.*$/m, `SUPABASE_STORAGE_BUCKET=${storage_bucket}`);
      }
      if (supabase_url) {
        envContent = envContent.replace(/^SUPABASE_URL=.*$/m, `SUPABASE_URL=${supabase_url}`);
      }
      if (supabase_service_role_key) {
        envContent = envContent.replace(/^SUPABASE_SERVICE_ROLE_KEY=.*$/m, `SUPABASE_SERVICE_ROLE_KEY=${supabase_service_role_key}`);
      }
      fs.writeFileSync(envPath, envContent, 'utf8');
    }

    res.json({
      success: true,
      message: 'Konfigurasi database berhasil disimpan dan diverifikasi aktif!',
    });
  } catch (err) {
    console.error('[updateDatabaseConfig error]:', err.message);
    res.status(500).json({ message: 'Gagal memperbarui konfigurasi database: ' + err.message });
  }
};
