const db = require('../config/db');

let superadminSchemaReady = false;

async function ensureSuperadminSchema() {
  if (superadminSchemaReady) return;
  try {
    // Ensure backward/forward compatible columns on tenants
    await db.query(`
      ALTER TABLE tenants ADD COLUMN IF NOT EXISTS plan_code VARCHAR(50) DEFAULT 'starter';
      ALTER TABLE tenants ADD COLUMN IF NOT EXISTS domain VARCHAR(255);
      ALTER TABLE tenants ADD COLUMN IF NOT EXISTS branding JSONB DEFAULT '{}'::jsonb;
    `);

    // Sync plan_code from plans table if plan_id is set
    await db.query(`
      UPDATE tenants t
      SET plan_code = p.code
      FROM plans p
      WHERE t.plan_id = p.id AND (t.plan_code IS NULL OR t.plan_code = '')
    `);

    // Create saas_crm_deals table for Superadmin Kanban Board & Floor Matrix
    await db.query(`
      CREATE TABLE IF NOT EXISTS saas_crm_deals (
        id SERIAL PRIMARY KEY,
        ticket_number VARCHAR(32) NOT NULL,
        table_label VARCHAR(120) NOT NULL,
        tenant_brand VARCHAR(160) NOT NULL,
        pic_name VARCHAR(120) NOT NULL,
        channel_type VARCHAR(40) DEFAULT 'Dine-in',
        plan_code VARCHAR(40) DEFAULT 'franchise',
        station_region VARCHAR(80) DEFAULT 'Jabodetabek',
        stage VARCHAR(32) NOT NULL DEFAULT 'new',
        amount_usd NUMERIC(12, 2) NOT NULL DEFAULT 70,
        amount_idr BIGINT NOT NULL DEFAULT 7000000,
        elapsed_minutes INT NOT NULL DEFAULT 4,
        alert_badge VARCHAR(120),
        alert_tone VARCHAR(32) DEFAULT 'dark',
        items_json JSONB NOT NULL DEFAULT '[]'::jsonb,
        payment_status VARCHAR(32) DEFAULT 'Unpaid',
        avatar_seed VARCHAR(64) DEFAULT 'A',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const [countRows] = await db.query('SELECT COUNT(*) AS cnt FROM saas_crm_deals');
    const totalDeals = Number(countRows?.[0]?.cnt || 0);

    if (totalDeals === 0) {
      const seedDeals = [
        // Column 1: NEW (Butter Cream cards)
        {
          ticket_number: '#1069',
          table_label: 'Table 1 · Bebek Bengil HQ',
          tenant_brand: 'Bebek Bengil Franchise',
          pic_name: 'Hendra Wijaya',
          channel_type: 'Dine-in',
          plan_code: 'franchise',
          station_region: 'Jabodetabek',
          stage: 'new',
          amount_usd: 70,
          amount_idr: 14500000,
          elapsed_minutes: 4,
          alert_badge: 'Well done · Custom ERP',
          alert_tone: 'dark',
          items_json: JSON.stringify([
            '1x Beef carpaccio (Franchise Multi-Cabang)',
            '1x Pizza Margherita (POS + KDS Dapur)',
            '2x Negroni (QR Table Self-Order)',
            '1x Tiramisu (Midtrans QRIS Sync)'
          ]),
          payment_status: 'Unpaid',
          avatar_seed: 'HW'
        },
        {
          ticket_number: '#1070',
          table_label: 'Table B1 · Kopi Kenangan',
          tenant_brand: 'Kopi Kenangan Senopati',
          pic_name: 'Nadia Putri',
          channel_type: 'Dine-in',
          plan_code: 'franchise',
          station_region: 'Jabodetabek',
          stage: 'new',
          amount_usd: 60,
          amount_idr: 12000000,
          elapsed_minutes: 3,
          alert_badge: null,
          alert_tone: 'dark',
          items_json: JSON.stringify([
            '1x Cacio e pepe (Pro Multi-Outlet)',
            '1x Burrata & heirloom tom. (Inventory HPP)',
            '2x Aperol spritz (Cloud Printer Thermal)'
          ]),
          payment_status: 'Unpaid',
          avatar_seed: 'NP'
        },
        {
          ticket_number: '#1071',
          table_label: 'Nina B. · Gelato Secrets',
          tenant_brand: 'Gelato Secrets Canggu',
          pic_name: 'Nina B.',
          channel_type: 'Takeaway',
          plan_code: 'pro',
          station_region: 'Jawa & Bali',
          stage: 'new',
          amount_usd: 32,
          amount_idr: 6400000,
          elapsed_minutes: 2,
          alert_badge: null,
          alert_tone: 'dark',
          items_json: JSON.stringify([
            '1x Pizza Diavola (Lisensi Pro Tahunan)',
            '1x Negroni (Integrasi GrabFood & GoFood)'
          ]),
          payment_status: 'Unpaid',
          avatar_seed: 'NB'
        },
        {
          ticket_number: '#1072',
          table_label: 'Table 11 · Sate Senayan',
          tenant_brand: 'Sate Khas Senayan',
          pic_name: 'Budi Santoso',
          channel_type: 'Dine-in',
          plan_code: 'franchise',
          station_region: 'Jabodetabek',
          stage: 'new',
          amount_usd: 122,
          amount_idr: 24400000,
          elapsed_minutes: 1,
          alert_badge: 'No onions · Migrasi DB',
          alert_tone: 'dark',
          items_json: JSON.stringify([
            '1x Pizza Margherita (Enterprise 12 Cabang)',
            '2x Tagliatelle al ragu (Dedicated Supabase)',
            '1x Saffron arancini (Audit Log Midtrans)',
            '2x Montepulciano, glass (Training Kasir)'
          ]),
          payment_status: 'Unpaid',
          avatar_seed: 'BS'
        },

        // Column 2: COOKING (Warm Peach/Coral cards)
        {
          ticket_number: '#1063',
          table_label: 'Table T5 · Sushi Tei Plaza',
          tenant_brand: 'Sushi Tei Indonesia',
          pic_name: 'Kevin Tan',
          channel_type: 'Dine-in',
          plan_code: 'franchise',
          station_region: 'Jabodetabek',
          stage: 'cooking',
          amount_usd: 185,
          amount_idr: 37000000,
          elapsed_minutes: 18,
          alert_badge: null,
          alert_tone: 'amber',
          items_json: JSON.stringify([
            '2x Cacio e pepe (Franchise HQ Suite)',
            '1x Beef carpaccio (Realtime Belt KDS)',
            '1x Pizza Margherita (30 Tablet Meja)',
            '1x Tomato bruschetta (Custom Domain)',
            '1x Grilled branzino (SLA 99.9% Priority)',
            '+2 more items'
          ]),
          payment_status: 'Unpaid',
          avatar_seed: 'KT'
        },
        {
          ticket_number: '#1064',
          table_label: 'Table B4 · Bakmi GM',
          tenant_brand: 'Bakmi GM Express',
          pic_name: 'Rina Gunawan',
          channel_type: 'Dine-in',
          plan_code: 'pro',
          station_region: 'Jabodetabek',
          stage: 'cooking',
          amount_usd: 53,
          amount_idr: 10600000,
          elapsed_minutes: 14,
          alert_badge: null,
          alert_tone: 'amber',
          items_json: JSON.stringify([
            '1x Saffron arancini (Paket Pro 5 Cabang)',
            '2x Tagliatelle al ragu (Setup Menu & HPP)'
          ]),
          payment_status: 'Unpaid',
          avatar_seed: 'RG'
        },
        {
          ticket_number: '#1065',
          table_label: 'Table T1 · Solaria Resto',
          tenant_brand: 'Solaria Mall Kelapa Gading',
          pic_name: 'Dian Sastro',
          channel_type: 'Dine-in',
          plan_code: 'franchise',
          station_region: 'Jabodetabek',
          stage: 'cooking',
          amount_usd: 59,
          amount_idr: 11800000,
          elapsed_minutes: 11,
          alert_badge: null,
          alert_tone: 'amber',
          items_json: JSON.stringify([
            '1x Cacio e pepe (Lisensi Franchise)',
            '1x Pizza Margherita (QRIS Dynamic Midtrans)',
            '2x Aperol spritz (Sinkronisasi Gudang)'
          ]),
          payment_status: 'Unpaid',
          avatar_seed: 'DS'
        },
        {
          ticket_number: '#1067',
          table_label: 'Ben C. · Ayam Bensu',
          tenant_brand: 'Geprek Bensu Kemang',
          pic_name: 'Ben C.',
          channel_type: 'Delivery',
          plan_code: 'starter',
          station_region: 'Jawa & Bali',
          stage: 'cooking',
          amount_usd: 43,
          amount_idr: 8600000,
          elapsed_minutes: 9,
          alert_badge: 'Allergy: nuts · Custom Tax',
          alert_tone: 'amber',
          items_json: JSON.stringify([
            '1x Tagliatelle al ragu (Starter Cloud POS)',
            '1x Montepulciano, glass (2 Terminal Kasir)',
            '1x Tiramisu (Laporan Shift Otomatis)'
          ]),
          payment_status: 'Unpaid',
          avatar_seed: 'BC'
        },
        {
          ticket_number: '#1068',
          table_label: 'Jo K. · Holycow Steak',
          tenant_brand: 'Holycow Steakhouse',
          pic_name: 'Jo K.',
          channel_type: 'Takeaway',
          plan_code: 'pro',
          station_region: 'Luar Jawa',
          stage: 'cooking',
          amount_usd: 40,
          amount_idr: 8000000,
          elapsed_minutes: 6,
          alert_badge: null,
          alert_tone: 'amber',
          items_json: JSON.stringify([
            '1x Saffron arancini (Pro Steakhouse POS)',
            '1x Vanilla panna cotta (Kitchen Printer)'
          ]),
          payment_status: 'Unpaid',
          avatar_seed: 'JK'
        },

        // Column 3: READY (Soft Mint Green cards)
        {
          ticket_number: '#1062',
          table_label: 'Table 7 · Ramen Ya! GI',
          tenant_brand: 'Ramen Ya! Grand Indonesia',
          pic_name: 'Yuki Tanaka',
          channel_type: 'Dine-in',
          plan_code: 'franchise',
          station_region: 'Jabodetabek',
          stage: 'ready',
          amount_usd: 127,
          amount_idr: 25400000,
          elapsed_minutes: 21,
          alert_badge: 'Floating Preview · Priority',
          alert_tone: 'mint',
          items_json: JSON.stringify([
            '2x Tagliatelle al ragu (Full Franchise Deal)',
            '1x Pizza Margherita (Database Provisioned)',
            '1x Cacio e pepe (Domain ramenya.santapos.id)',
            '4x Aperol spritz (Siap Go-Live Hari Ini)'
          ]),
          payment_status: 'Paid',
          avatar_seed: 'YT'
        },
        {
          ticket_number: '#1061',
          table_label: 'Table T3 · Sultan Kebab',
          tenant_brand: 'Sultan Kebab Nusantara',
          pic_name: 'Hugo Lam',
          channel_type: 'Dine-in',
          plan_code: 'pro',
          station_region: 'Jabodetabek',
          stage: 'ready',
          amount_usd: 59,
          amount_idr: 11800000,
          elapsed_minutes: 23,
          alert_badge: null,
          alert_tone: 'mint',
          items_json: JSON.stringify([
            '1x Pizza Margherita (Pro Multi-Cabang)',
            '2x Negroni (UAT Kasir & Kitchen Lulus)'
          ]),
          payment_status: 'Paid',
          avatar_seed: 'HL'
        },
        {
          ticket_number: '#1066',
          table_label: 'Jo K. · Kopi Soe HQ',
          tenant_brand: 'Kopi Soe Flagship',
          pic_name: 'Jo K.',
          channel_type: 'Takeaway',
          plan_code: 'pro',
          station_region: 'Jawa & Bali',
          stage: 'ready',
          amount_usd: 55,
          amount_idr: 11000000,
          elapsed_minutes: 13,
          alert_badge: 'No onions · Zero Hold DB',
          alert_tone: 'dark',
          items_json: JSON.stringify([
            '1x Saffron arancini (Pro Cloud Roastery)',
            '1x Cacio e pepe (Inventory Bahan Baku)',
            '2x Aperol spritz (Live QR Table Order)'
          ]),
          payment_status: 'Paid',
          avatar_seed: 'JK'
        },

        // Column 4: SERVED / CLOSED WON (Dark Slate Navy cards)
        {
          ticket_number: '#1056',
          table_label: 'Lucy H. · Santapos Resto',
          tenant_brand: 'Santapos Restaurant (Default)',
          pic_name: 'Lucy H.',
          channel_type: 'Dine-in',
          plan_code: 'franchise',
          station_region: 'Jabodetabek',
          stage: 'served',
          amount_usd: 51,
          amount_idr: 10200000,
          elapsed_minutes: 18,
          alert_badge: 'Well done · Active Tenant',
          alert_tone: 'amber',
          items_json: JSON.stringify([
            '1x Pizza Margherita (Franchise Utama)',
            '1x Saffron arancini (Supabase Connected)',
            '1x Beef carpaccio (Midtrans Live)',
            '1x Affogato (32 Tabel Aktif)'
          ]),
          payment_status: 'Paid',
          avatar_seed: 'LH'
        },
        {
          ticket_number: '#1058',
          table_label: 'Ravi N. · Mie Gacoan',
          tenant_brand: 'Mie Gacoan Surabaya',
          pic_name: 'Ravi N.',
          channel_type: 'Dine-in',
          plan_code: 'franchise',
          station_region: 'Jawa & Bali',
          stage: 'served',
          amount_usd: 80,
          amount_idr: 16000000,
          elapsed_minutes: 14,
          alert_badge: null,
          alert_tone: 'dark',
          items_json: JSON.stringify([
            '2x Chicken milanese (High-Concurrency POS)',
            '2x Montepulciano, glass (6 Terminal Aktif)'
          ]),
          payment_status: 'Paid',
          avatar_seed: 'RN'
        },
        {
          ticket_number: '#1059',
          table_label: 'Table 3 · Burger King',
          tenant_brand: 'Burger King Kemang',
          pic_name: 'Dimas Pratama',
          channel_type: 'Dine-in',
          plan_code: 'franchise',
          station_region: 'Jabodetabek',
          stage: 'served',
          amount_usd: 122,
          amount_idr: 24400000,
          elapsed_minutes: 15,
          alert_badge: 'Allergy: nuts · Renewal Due',
          alert_tone: 'amber',
          items_json: JSON.stringify([
            '1x Chicken milanese (Drive-Thru KDS)',
            '1x Tomato bruschetta (Self-Order Kiosk)',
            '1x Tagliatelle al ragu (Multi-Branch Sync)',
            '1x Burrata & heirloom tom. (Warehouse API)',
            '4x Montepulciano, glass (24/7 Support)'
          ]),
          payment_status: 'Unpaid',
          avatar_seed: 'DP'
        },
        {
          ticket_number: '#1054',
          table_label: 'Lucy H. · Fore Coffee',
          tenant_brand: 'Fore Coffee SCBD',
          pic_name: 'Lucy H.',
          channel_type: 'Delivery',
          plan_code: 'pro',
          station_region: 'Jabodetabek',
          stage: 'served',
          amount_usd: 67,
          amount_idr: 13400000,
          elapsed_minutes: 20,
          alert_badge: null,
          alert_tone: 'dark',
          items_json: JSON.stringify([
            '1x Porcini risotto (Pro App Integration)',
            '1x Tagliatelle al ragu (Loyalty Point CRM)',
            '2x Montepulciano, glass (QRIS Otomatis)'
          ]),
          payment_status: 'Paid',
          avatar_seed: 'FC'
        },
        {
          ticket_number: '#1053',
          table_label: 'Ben C. · Bumbu Desa',
          tenant_brand: 'Bumbu Desa Bandung',
          pic_name: 'Ben C.',
          channel_type: 'Dine-in',
          plan_code: 'pro',
          station_region: 'Jawa & Bali',
          stage: 'served',
          amount_usd: 51,
          amount_idr: 10200000,
          elapsed_minutes: 15,
          alert_badge: null,
          alert_tone: 'dark',
          items_json: JSON.stringify([
            '1x Pizza Diavola (Paket Pro Resto)',
            '1x Tomato bruschetta (Kasir + Tablet Meja)',
            '2x Montepulciano, glass (Laporan Keuangan)'
          ]),
          payment_status: 'Paid',
          avatar_seed: 'BD'
        }
      ];

      for (const d of seedDeals) {
        await db.query(
          `INSERT INTO saas_crm_deals
            (ticket_number, table_label, tenant_brand, pic_name, channel_type, plan_code, station_region, stage, amount_usd, amount_idr, elapsed_minutes, alert_badge, alert_tone, items_json, payment_status, avatar_seed)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?::jsonb, ?, ?)`,
          [
            d.ticket_number,
            d.table_label,
            d.tenant_brand,
            d.pic_name,
            d.channel_type,
            d.plan_code,
            d.station_region,
            d.stage,
            d.amount_usd,
            d.amount_idr,
            d.elapsed_minutes,
            d.alert_badge,
            d.alert_tone,
            d.items_json,
            d.payment_status,
            d.avatar_seed
          ]
        );
      }
    }

    superadminSchemaReady = true;
  } catch (err) {
    console.warn('[ensureSuperadminSchema warning]:', err.message);
  }
}

exports.getStats = async (req, res) => {
  try {
    await ensureSuperadminSchema();

    // 1. Tenant counts (joining plans for reliable plan_code resolution)
    const [tenantRows] = await db.query(`
      SELECT
        COUNT(*) AS total_tenants,
        SUM(CASE WHEN t.status = 'active' THEN 1 ELSE 0 END) AS active_tenants,
        SUM(CASE WHEN t.status = 'suspended' THEN 1 ELSE 0 END) AS suspended_tenants,
        SUM(CASE WHEN COALESCE(t.plan_code, p.code, 'starter') = 'starter' THEN 1 ELSE 0 END) AS starter_plans,
        SUM(CASE WHEN COALESCE(t.plan_code, p.code, 'starter') = 'pro' THEN 1 ELSE 0 END) AS pro_plans,
        SUM(CASE WHEN COALESCE(t.plan_code, p.code, 'starter') = 'franchise' THEN 1 ELSE 0 END) AS franchise_plans
      FROM tenants t
      LEFT JOIN plans p ON p.id = t.plan_id
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

    // 4. Platform GMV / Transactions (uses total_price in schema.sql)
    let totalTrx = 0;
    let totalGmv = 0;
    try {
      const [trxRows] = await db.query(`
        SELECT COUNT(*) AS total_trx, COALESCE(SUM(total_price), 0) AS total_gmv
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
    await ensureSuperadminSchema();

    const [rows] = await db.query(`
      SELECT
        t.id,
        t.name,
        t.slug,
        COALESCE(t.domain, t.custom_domain) AS domain,
        COALESCE(t.plan_code, p.code, 'starter') AS plan_code,
        t.status,
        t.created_at,
        COALESCE(t.branding, t.feature_overrides, '{}'::jsonb) AS branding,
        (SELECT COUNT(*) FROM branches b WHERE b.tenant_id = t.id) AS branch_count,
        (SELECT COUNT(*) FROM users u WHERE u.tenant_id = t.id) AS user_count,
        (SELECT email FROM users u WHERE u.tenant_id = t.id AND u.role = 'admin' ORDER BY u.id ASC LIMIT 1) AS owner_email,
        (SELECT name FROM users u WHERE u.tenant_id = t.id AND u.role = 'admin' ORDER BY u.id ASC LIMIT 1) AS owner_name
      FROM tenants t
      LEFT JOIN plans p ON p.id = t.plan_id
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
    await ensureSuperadminSchema();

    const [result] = await db.query(
      `UPDATE tenants
       SET plan_code = ?,
           plan_id = COALESCE((SELECT id FROM plans WHERE code = ? LIMIT 1), plan_id),
           updated_at = NOW()
       WHERE id = ?`,
      [plan_code, plan_code, id]
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
            badge: 'Default / All-in-One',
            free_tier: 'Gratis 500MB DB, 1GB S3 Storage (Foto Menu & Struk), Auth & Realtime',
            docs_url: 'https://supabase.com',
            format_hint: 'postgresql://postgres.[REF]:[PASS]@aws-0-eu-west-2.pooler.supabase.com:6543/postgres?sslmode=require',
            advantages: [
              'Paket komplit: Database + S3 Storage foto dalam satu akun',
              'Didukung fitur Anti-Pause Keep-Alive (tidak pernah di-hold)',
              'Shared transaction pooler port 6543 hemat koneksi'
            ],
            status: 'recommended'
          },
          {
            id: 'neon',
            name: 'Neon Serverless Postgres',
            dialect: 'postgres',
            badge: 'Auto Wake-up / Zero Hold',
            free_tier: 'Gratis Selamanya 0.5 GB Storage, Serverless, Auto Wake-up dalam 0.5s',
            docs_url: 'https://neon.tech',
            format_hint: 'postgresql://[USER]:[PASS]@[ENDPOINT].neon.tech/neondb?sslmode=require',
            advantages: [
              '100% Free selamanya tanpa kartu kredit',
              'Zero manual hold (otomatis bangun saat kasir/web dibuka)',
              'Koneksi serverless cepat dengan driver pg bawaan'
            ],
            status: 'recommended'
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

exports.pingDatabaseKeepAlive = async (req, res) => {
  try {
    const start = Date.now();
    const [rows] = await db.query('SELECT 1 AS heartbeat, NOW() AS ping_time, current_database() AS db_name');
    const latency = Date.now() - start;

    res.json({
      success: true,
      message: 'Keep-Alive Berhasil! Database telah menerima query aktif sehingga terbebas dari auto-pause / hold.',
      data: {
        latency_ms: latency,
        ping_time: rows?.[0]?.ping_time,
        database: rows?.[0]?.db_name,
      }
    });
  } catch (err) {
    console.error('[pingDatabaseKeepAlive error]:', err);
    res.status(500).json({ message: 'Gagal melakukan heartbeat ping: ' + err.message });
  }
};

exports.migrateDatabaseAndStorage = async (req, res) => {
  const {
    connection_string,
    supabase_url,
    supabase_service_role_key,
    storage_bucket,
  } = req.body || {};

  const targetConn = connection_string || process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;
  if (!targetConn) {
    return res.status(400).json({ message: 'Connection string database wajib diisi atau diset di .env' });
  }

  const { Client } = require('pg');
  const bcrypt = require('bcryptjs');
  const path = require('path');
  const fs = require('fs');
  const { createClient } = require('@supabase/supabase-js');

  let client;
  const logs = [];

  try {
    const url = new URL(targetConn);
    url.searchParams.delete('sslmode');
    url.searchParams.delete('sslcert');
    url.searchParams.delete('sslkey');
    url.searchParams.delete('sslrootcert');

    client = new Client({
      connectionString: url.toString(),
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 20000,
    });

    await client.connect();
    logs.push('Berhasil terhubung ke database target');

    // 1. Terapkan Base Schema (30 Tabel Dasar)
    const schemaPath = path.join(__dirname, '../../supabase/schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8')
        .replace(/^\uFEFF/, '')
        .replace(/\uFEFF/g, '');
      await client.query(schemaSql);
      logs.push('Base schema.sql berhasil diterapkan (30 tabel & relasi foreign key dibuat)');
    }

    // 2. Terapkan Multi-Tenant SaaS Migration
    const saasPath = path.join(__dirname, '../../supabase/migrations/001_multi_tenant_saas.sql');
    if (fs.existsSync(saasPath)) {
      const saasSql = fs.readFileSync(saasPath, 'utf8')
        .replace(/^\uFEFF/, '')
        .replace(/\uFEFF/g, '');
      await client.query(saasSql);
      logs.push('Multi-tenant SaaS migration diterapkan (tabel tenants, plans, dan indeks komposit)');
    }

    // 3. Pastikan user_role enum lengkap & akun superadmin siap
    await client.query("ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'superadmin'");
    await client.query("ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'kitchen'");

    const superEmail = 'superadmin@santapos.id';
    const { rows: superRows } = await client.query('SELECT id FROM users WHERE email = $1', [superEmail]);
    if (superRows.length === 0) {
      const hash = await bcrypt.hash('santapos123', 10);
      await client.query(`
        INSERT INTO users (name, email, password, role, tenant_id)
        VALUES ('Super Admin Santapos', $1, $2, 'superadmin', 1)
      `, [superEmail, hash]);
      logs.push('Akun Super Admin dibuat: superadmin@santapos.id / santapos123');
    } else {
      logs.push('Akun Super Admin sudah terverifikasi siap pakai');
    }

    // 4. Pastikan default admin demo siap
    const adminEmail = 'admin@santapos.id';
    const { rows: adminRows } = await client.query('SELECT id FROM users WHERE email = $1', [adminEmail]);
    if (adminRows.length === 0) {
      const hash = await bcrypt.hash('santapos123', 10);
      await client.query(`
        INSERT INTO users (name, email, password, role, tenant_id)
        VALUES ('Admin Demo', $1, $2, 'admin', 1)
      `, [adminEmail, hash]);
      logs.push('Akun Admin Demo dibuat: admin@santapos.id / santapos123');
    }

    // 5. Hitung total tabel yang terbentuk
    const { rows: tableRows } = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    const totalTables = tableRows.length;
    logs.push(`Verifikasi akhir: ${totalTables} tabel aktif di skema public`);

    await client.end();

    // 6. Inisialisasi Storage Bucket jika Supabase
    let bucketStatus = 'Tidak dikonfigurasi (Database-only / Neon)';
    const targetSupabaseUrl = supabase_url || process.env.SUPABASE_URL;
    const targetServiceKey = supabase_service_role_key || process.env.SUPABASE_SERVICE_ROLE_KEY;
    const targetBucketName = storage_bucket || process.env.SUPABASE_STORAGE_BUCKET || 'restaurant-pos-assets';

    if (targetSupabaseUrl && targetServiceKey) {
      try {
        const supabase = createClient(targetSupabaseUrl, targetServiceKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        });

        const { data: bucketData, error: getErr } = await supabase.storage.getBucket(targetBucketName);
        if (!getErr && bucketData) {
          bucketStatus = `Bucket public '${targetBucketName}' sudah aktif.`;
          logs.push(bucketStatus);
        } else {
          const { error: createErr } = await supabase.storage.createBucket(targetBucketName, { public: true });
          if (!createErr || /already exists|duplicate/i.test(createErr.message || '')) {
            bucketStatus = `Bucket public '${targetBucketName}' berhasil dibuat dan siap untuk upload asset.`;
            logs.push(bucketStatus);
          } else {
            bucketStatus = `Info bucket: ${createErr.message}`;
            logs.push(bucketStatus);
          }
        }
      } catch (bucketErr) {
        bucketStatus = `Gagal inisialisasi bucket: ${bucketErr.message}`;
        logs.push(bucketStatus);
      }
    } else {
      logs.push('Inisialisasi bucket dilewati (kredensial Supabase Storage tidak disertakan)');
    }

    res.json({
      success: true,
      message: `Migrasi selesai! ${totalTables} tabel dan konfigurasi multi-tenant berhasil diinisialisasi.`,
      data: {
        total_tables: totalTables,
        tables: tableRows.map((t) => t.table_name),
        bucket_status: bucketStatus,
        logs,
      },
    });
  } catch (err) {
    if (client) {
      try { await client.end(); } catch (_) {}
    }
    console.error('[migrateDatabaseAndStorage error]:', err);
    res.status(500).json({
      success: false,
      message: 'Gagal menjalankan migrasi database: ' + err.message,
      logs,
    });
  }
};

exports.getCrmDeals = async (req, res) => {
  try {
    await ensureSuperadminSchema();
    const [rows] = await db.query(`
      SELECT *
      FROM saas_crm_deals
      ORDER BY id ASC
    `);

    const formatted = rows.map((r) => ({
      ...r,
      amount_usd: Number(r.amount_usd || 0),
      amount_idr: Number(r.amount_idr || 0),
      elapsed_minutes: Number(r.elapsed_minutes || 1),
      items: Array.isArray(r.items_json)
        ? r.items_json
        : typeof r.items_json === 'string'
        ? JSON.parse(r.items_json || '[]')
        : [],
    }));

    res.json({
      success: true,
      data: formatted,
    });
  } catch (err) {
    console.error('[superadmin getCrmDeals error]:', err);
    res.status(500).json({ message: 'Gagal memuat data CRM Deals: ' + err.message });
  }
};

exports.createCrmDeal = async (req, res) => {
  try {
    await ensureSuperadminSchema();
    const {
      ticket_number,
      table_label,
      tenant_brand,
      pic_name,
      channel_type = 'Dine-in',
      plan_code = 'franchise',
      station_region = 'Jabodetabek',
      stage = 'new',
      amount_usd = 75,
      amount_idr = 15000000,
      elapsed_minutes = 1,
      alert_badge = null,
      alert_tone = 'dark',
      items = [],
      payment_status = 'Unpaid',
    } = req.body || {};

    if (!tenant_brand && !table_label) {
      return res.status(400).json({ message: 'Nama tenant / meja wajib diisi' });
    }

    const finalTicket = ticket_number || `#${Math.floor(1073 + Math.random() * 900)}`;
    const finalLabel = table_label || `Table ${Math.floor(1 + Math.random() * 15)} · ${tenant_brand}`;
    const finalBrand = tenant_brand || table_label;
    const finalPic = pic_name || 'Owner Resto';
    const initials = finalPic
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'TN';

    const defaultItems = Array.isArray(items) && items.length > 0
      ? items
      : [
          `1x Paket ${String(plan_code).toUpperCase()} Multi-Cabang`,
          '1x POS Kasir + Kitchen Display',
          '1x Integrasi Midtrans QRIS Otomatis'
        ];

    const [inserted] = await db.query(
      `INSERT INTO saas_crm_deals
        (ticket_number, table_label, tenant_brand, pic_name, channel_type, plan_code, station_region, stage, amount_usd, amount_idr, elapsed_minutes, alert_badge, alert_tone, items_json, payment_status, avatar_seed)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?::jsonb, ?, ?)
       RETURNING *`,
      [
        finalTicket,
        finalLabel,
        finalBrand,
        finalPic,
        channel_type,
        plan_code,
        station_region,
        stage,
        Number(amount_usd || 75),
        Number(amount_idr || 15000000),
        Number(elapsed_minutes || 1),
        alert_badge || null,
        alert_tone || 'dark',
        JSON.stringify(defaultItems),
        payment_status,
        initials,
      ]
    );

    const row = inserted?.[0] || {};
    res.status(201).json({
      success: true,
      message: `Deal ${finalTicket} (${finalBrand}) berhasil ditambahkan ke pipeline!`,
      data: {
        ...row,
        amount_usd: Number(row.amount_usd || amount_usd),
        amount_idr: Number(row.amount_idr || amount_idr),
        items: defaultItems,
      },
    });
  } catch (err) {
    console.error('[superadmin createCrmDeal error]:', err);
    res.status(500).json({ message: 'Gagal membuat deal baru: ' + err.message });
  }
};

exports.updateCrmDeal = async (req, res) => {
  try {
    await ensureSuperadminSchema();
    const { id } = req.params;
    const { stage, payment_status, table_label, plan_code, amount_usd, amount_idr, provision_tenant } = req.body || {};

    const [existingRows] = await db.query('SELECT * FROM saas_crm_deals WHERE id = ?', [id]);
    const deal = existingRows?.[0];
    if (!deal) {
      return res.status(404).json({ message: 'Deal tidak ditemukan' });
    }

    const nextStage = stage || deal.stage;
    const nextPayment = payment_status || (nextStage === 'served' ? 'Paid' : deal.payment_status);
    const nextLabel = table_label || deal.table_label;
    const nextPlan = plan_code || deal.plan_code;
    const nextUsd = amount_usd !== undefined ? Number(amount_usd) : Number(deal.amount_usd);
    const nextIdr = amount_idr !== undefined ? Number(amount_idr) : Number(deal.amount_idr);

    await db.query(
      `UPDATE saas_crm_deals
       SET stage = ?,
           payment_status = ?,
           table_label = ?,
           plan_code = ?,
           amount_usd = ?,
           amount_idr = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [nextStage, nextPayment, nextLabel, nextPlan, nextUsd, nextIdr, id]
    );

    // Optional: If deal moves to 'served' and provision_tenant is true, ensure tenant exists in `tenants` table
    let provisionedTenant = null;
    if (nextStage === 'served' && provision_tenant) {
      const slug = String(deal.tenant_brand || deal.table_label)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') + '-' + deal.id;

      const [existingTenant] = await db.query(
        'SELECT id, name, slug FROM tenants WHERE LOWER(name) = LOWER(?) LIMIT 1',
        [deal.tenant_brand]
      );

      if (!existingTenant || existingTenant.length === 0) {
        const [newTenants] = await db.query(
          `INSERT INTO tenants (name, slug, plan_code, plan_id, status)
           VALUES (?, ?, ?, (SELECT id FROM plans WHERE code = ? LIMIT 1), 'active')
           RETURNING id, name, slug, plan_code, status`,
          [deal.tenant_brand, slug, nextPlan, nextPlan]
        );
        provisionedTenant = newTenants?.[0] || null;
      }
    }

    res.json({
      success: true,
      message: `Deal ${deal.ticket_number} berhasil diperbarui ke tahap ${nextStage.toUpperCase()}`,
      data: {
        ...deal,
        stage: nextStage,
        payment_status: nextPayment,
        table_label: nextLabel,
        plan_code: nextPlan,
        amount_usd: nextUsd,
        amount_idr: nextIdr,
        provisioned_tenant: provisionedTenant,
      },
    });
  } catch (err) {
    console.error('[superadmin updateCrmDeal error]:', err);
    res.status(500).json({ message: 'Gagal memperbarui deal: ' + err.message });
  }
};

exports.deleteCrmDeal = async (req, res) => {
  try {
    await ensureSuperadminSchema();
    const { id } = req.params;
    await db.query('DELETE FROM saas_crm_deals WHERE id = ?', [id]);
    res.json({ success: true, message: 'Deal berhasil dihapus dari pipeline' });
  } catch (err) {
    console.error('[superadmin deleteCrmDeal error]:', err);
    res.status(500).json({ message: 'Gagal menghapus deal: ' + err.message });
  }
};
