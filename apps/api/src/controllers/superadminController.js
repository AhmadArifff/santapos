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
