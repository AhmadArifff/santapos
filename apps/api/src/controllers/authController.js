const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { ensureDefaultBranches } = require('./branchController');
const { getRequestBranchId } = require('../utils/branchContext');
const { ensureAttendanceAutomationSchema } = require('../services/attendanceKeepaliveService');
const { getTenantId } = require('../utils/tenantContext');

let ensureCashierScheduleTablePromise = null;

const ensureCashierScheduleTable = async () => {
  if (!ensureCashierScheduleTablePromise) {
    ensureCashierScheduleTablePromise = (async () => {
      if (db.isPostgres) {
        await db.query(`
          CREATE TABLE IF NOT EXISTS cashier_schedules (
            id BIGSERIAL PRIMARY KEY,
            user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            work_date DATE NOT NULL,
            start_time VARCHAR(5) NOT NULL,
            end_time VARCHAR(5) NOT NULL,
            branch_id BIGINT NULL REFERENCES branches(id) ON DELETE SET NULL,
            shift_name VARCHAR(80) NULL,
            status VARCHAR(24) NOT NULL DEFAULT 'scheduled',
            note TEXT NULL,
            created_by BIGINT NULL REFERENCES users(id) ON DELETE SET NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          )
        `);
        await db.query('ALTER TABLE cashier_schedules ADD COLUMN IF NOT EXISTS branch_id BIGINT NULL REFERENCES branches(id) ON DELETE SET NULL');
        await db.query(`
          UPDATE cashier_schedules cs
          SET branch_id = u.default_branch_id
          FROM users u
          WHERE cs.user_id = u.id AND cs.branch_id IS NULL
        `);
        await db.query('CREATE INDEX IF NOT EXISTS idx_cashier_schedules_date_user ON cashier_schedules(work_date, user_id)');
        await db.query('CREATE INDEX IF NOT EXISTS idx_cashier_schedules_branch_date ON cashier_schedules(branch_id, work_date)');
        return;
      }

      await db.query(`
        CREATE TABLE IF NOT EXISTS cashier_schedules (
          id BIGINT AUTO_INCREMENT PRIMARY KEY,
          user_id BIGINT NOT NULL,
          work_date DATE NOT NULL,
          start_time VARCHAR(5) NOT NULL,
          end_time VARCHAR(5) NOT NULL,
          branch_id BIGINT NULL,
          shift_name VARCHAR(80) NULL,
          status VARCHAR(24) NOT NULL DEFAULT 'scheduled',
          note TEXT NULL,
          created_by BIGINT NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_cashier_schedules_date_user (work_date, user_id),
          INDEX idx_cashier_schedules_branch_date (branch_id, work_date),
          CONSTRAINT fk_cashier_schedules_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          CONSTRAINT fk_cashier_schedules_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
          CONSTRAINT fk_cashier_schedules_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
        )
      `);
      try {
        await db.query('ALTER TABLE cashier_schedules ADD COLUMN branch_id BIGINT NULL');
      } catch (_) {}
      await db.query(`
        UPDATE cashier_schedules cs
        JOIN users u ON u.id = cs.user_id
        SET cs.branch_id = u.default_branch_id
        WHERE cs.branch_id IS NULL
      `);
    })().catch((err) => {
      ensureCashierScheduleTablePromise = null;
      throw err;
    });
  }
  return ensureCashierScheduleTablePromise;
};

const isValidDateKey = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));
const isValidTime = (value) => /^([01]\d|2[0-3]):[0-5]\d$/.test(String(value || ''));

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email dan password wajib diisi' });

    await ensureDefaultBranches();

    const [rows] = await db.query(`
      SELECT u.*, b.name AS branch_name, b.branch_key
      FROM users u
      LEFT JOIN branches b ON b.id = u.default_branch_id
      WHERE u.email = ?
    `, [email]);
    if (!rows.length)
      return res.status(401).json({ message: 'Email tidak ditemukan' });

    const valid = await bcrypt.compare(password, rows[0].password);
    if (!valid)
      return res.status(401).json({ message: 'Password salah' });

    const user = rows[0];

    // Fetch tenant and plan metadata
    let tenantInfo = null;
    try {
      const [tRows] = await db.query(`
        SELECT t.id, t.name, t.slug, t.custom_domain, t.status,
               p.code AS plan_code, p.name AS plan_name, p.capabilities AS plan_capabilities
        FROM tenants t
        JOIN plans p ON p.id = t.plan_id
        WHERE t.id = ?
      `, [user.tenant_id || 1]);
      tenantInfo = tRows?.[0] || null;
    } catch (_) {}

    const tenantId = Number(tenantInfo?.id || user.tenant_id || 1);
    const tenantSlug = tenantInfo?.slug || (tenantId === 1 ? 'sultan-kebab' : `tenant-${tenantId}`);
    const tenantName = tenantInfo?.name || (tenantId === 1 ? 'Sultan Kebab (Demo)' : 'Santapos Restaurant');
    const planCode = tenantInfo?.plan_code || 'franchise';

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        branch_id: user.default_branch_id || null,
        tenant_id: tenantId,
        tenant_slug: tenantSlug,
        plan_code: planCode,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES || '7d' }
    );

    // ── Catat kehadiran ──
    try {
      await ensureAttendanceAutomationSchema();
      const today = new Date().toISOString().split('T')[0];
      const [existing] = await db.query(
        "SELECT id FROM attendance WHERE user_id = ? AND date = ? AND source = 'user'",
        [user.id, today]
      );
      if (!existing.length) {
        await db.query(
          "INSERT INTO attendance (tenant_id, user_id, date, login_at, source) VALUES (?, ?, ?, NOW(), 'user')",
          [tenantId, user.id, today]
        );
      } else {
        // Update login_at jika login ulang
        await db.query(
          "UPDATE attendance SET login_at = NOW(), logout_at = NULL, tenant_id = COALESCE(tenant_id, ?) WHERE user_id = ? AND date = ? AND source = 'user'",
          [tenantId, user.id, today]
        );
      }
    } catch (attendanceErr) {
      console.warn('⚠️ Peringatan pencatatan absensi:', attendanceErr.message);
    }

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenant_id: tenantId,
        tenant_name: tenantName,
        tenant_slug: tenantSlug,
        plan_code: planCode,
        plan_capabilities: tenantInfo?.plan_capabilities || {},
        default_branch_id: user.default_branch_id || null,
        branch_name: user.branch_name || null,
        branch_key: user.branch_key || null,
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.logout = async (req, res) => {
  try {
    await ensureAttendanceAutomationSchema();
    const today = new Date().toISOString().split('T')[0];
    await db.query(
      "UPDATE attendance SET logout_at = NOW() WHERE user_id = ? AND date = ? AND logout_at IS NULL AND source = 'user'",
      [req.user.id, today]
    );
    res.json({ message: 'Logout berhasil' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getActiveUsers = async (req, res) => {
  try {
    await ensureAttendanceAutomationSchema();
    const today = new Date().toISOString().split('T')[0];
    // User aktif = login hari ini & belum logout
    const [rows] = await db.query(`
      SELECT u.id, u.name, u.role, a.login_at,
             TIMESTAMPDIFF(MINUTE, a.login_at, NOW()) AS active_minutes
      FROM attendance a
      JOIN users u ON a.user_id = u.id
      WHERE a.date = ? AND a.logout_at IS NULL AND a.source = 'user'
      ORDER BY a.login_at ASC
    `, [today]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT u.id, u.name, u.email, u.role, u.default_branch_id, u.tenant_id,
              b.name AS branch_name, b.branch_key, u.created_at
       FROM users u
       LEFT JOIN branches b ON b.id = u.default_branch_id
       WHERE u.id = ?`,
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'User tidak ditemukan' });
    const user = rows[0];

    let tenantInfo = null;
    try {
      const [tRows] = await db.query(`
        SELECT t.id, t.name, t.slug, t.custom_domain, t.status,
               p.code AS plan_code, p.name AS plan_name, p.capabilities AS plan_capabilities
        FROM tenants t
        JOIN plans p ON p.id = t.plan_id
        WHERE t.id = ?
      `, [user.tenant_id || req.user.tenant_id || 1]);
      tenantInfo = tRows?.[0] || null;
    } catch (_) {}

    const tenantId = Number(tenantInfo?.id || user.tenant_id || 1);
    res.json({
      ...user,
      tenant_id: tenantId,
      tenant_name: tenantInfo?.name || (tenantId === 1 ? 'Sultan Kebab (Demo)' : 'Santapos Restaurant'),
      tenant_slug: tenantInfo?.slug || (tenantId === 1 ? 'sultan-kebab' : `tenant-${tenantId}`),
      plan_code: tenantInfo?.plan_code || 'franchise',
      plan_capabilities: tenantInfo?.plan_capabilities || {},
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'Semua field wajib diisi' });

    const [exists] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (exists.length)
      return res.status(400).json({ message: 'Email sudah digunakan' });

    const hash = await bcrypt.hash(password, 10);
    const branchId = getRequestBranchId(req) || req.user.branch_id || req.body.default_branch_id || null;
    const tenantId = getTenantId(req);

    const [result] = await db.query(
      "INSERT INTO users (name, email, password, role, default_branch_id, tenant_id) VALUES (?, ?, ?, ?, ?, ?)",
      [name, email, hash, role || 'kasir', branchId, tenantId]
    );

    res.status(201).json({ message: 'User berhasil dibuat', id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const isSuper = req.user?.role === 'superadmin';
    const [rows] = await db.query(
      `SELECT u.id, u.name, u.email, u.role, u.default_branch_id, u.tenant_id,
              b.name AS branch_name, u.created_at
       FROM users u
       LEFT JOIN branches b ON b.id = u.default_branch_id
       WHERE (? = true OR u.tenant_id = ?)
       ORDER BY u.created_at DESC`,
      [isSuper, tenantId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getCashierSchedules = async (req, res) => {
  try {
    await ensureCashierScheduleTable();
    const today = new Date().toISOString().split('T')[0];
    const dateFrom = isValidDateKey(req.query.date_from) ? req.query.date_from : today;
    const dateTo = isValidDateKey(req.query.date_to) ? req.query.date_to : dateFrom;
    const branchId = req.query.include_all_branches_for_conflict === '1'
      ? 'all'
      : (getRequestBranchId(req) || req.user.branch_id || null);
    const params = [dateFrom, dateTo];
    let userFilter = '';

    if (req.query.user_id) {
      userFilter = ' AND cs.user_id = ?';
      params.push(req.query.user_id);
    }
    if (branchId && branchId !== 'all') {
      userFilter += ' AND cs.branch_id = ?';
      params.push(branchId);
    }

    const [rows] = await db.query(`
      SELECT
        cs.id, cs.user_id, cs.branch_id, cs.work_date, cs.start_time, cs.end_time,
        cs.shift_name, cs.status, cs.note, cs.created_by, cs.created_at, cs.updated_at,
        u.name AS user_name, u.email AS user_email, u.role AS user_role,
        b.name AS branch_name,
        creator.name AS created_by_name
      FROM cashier_schedules cs
      JOIN users u ON u.id = cs.user_id
      LEFT JOIN branches b ON b.id = cs.branch_id
      LEFT JOIN users creator ON creator.id = cs.created_by
      WHERE cs.work_date BETWEEN ? AND ?${userFilter}
      ORDER BY cs.work_date ASC, cs.start_time ASC, u.name ASC
    `, params);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Gagal memuat jadwal kasir' });
  }
};

exports.createCashierSchedule = async (req, res) => {
  try {
    await ensureCashierScheduleTable();
    const { user_id, work_date, start_time, end_time, shift_name, status, note } = req.body || {};
    const branchId = getRequestBranchId(req) || req.user.branch_id || null;

    if (!user_id || !isValidDateKey(work_date) || !isValidTime(start_time) || !isValidTime(end_time)) {
      return res.status(400).json({ message: 'Kasir, tanggal, jam mulai, dan jam selesai wajib valid' });
    }
    if (start_time >= end_time) {
      return res.status(400).json({ message: 'Jam selesai harus lebih besar dari jam mulai' });
    }
    if (!branchId || branchId === 'all') {
      return res.status(400).json({ message: 'Pilih cabang aktif sebelum membuat jadwal kasir' });
    }

    const [users] = await db.query("SELECT id FROM users WHERE id = ? AND role IN ('kasir', 'admin')", [user_id]);
    if (!users.length) return res.status(404).json({ message: 'Kasir tidak ditemukan' });

    const [conflicts] = await db.query(`
      SELECT cs.id, b.name AS branch_name
      FROM cashier_schedules cs
      LEFT JOIN branches b ON b.id = cs.branch_id
      WHERE cs.user_id = ? AND cs.work_date = ?
      LIMIT 1
    `, [user_id, work_date]);
    if (conflicts.length) {
      return res.status(400).json({
        message: `Kasir ini sudah punya jadwal pada tanggal tersebut${conflicts[0].branch_name ? ` di ${conflicts[0].branch_name}` : ''}.`,
      });
    }

    const [result] = await db.query(`
      INSERT INTO cashier_schedules (user_id, branch_id, work_date, start_time, end_time, shift_name, status, note, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      user_id,
      branchId,
      work_date,
      start_time,
      end_time,
      shift_name || 'Shift Kasir',
      status || 'scheduled',
      note || null,
      req.user.id,
    ]);

    res.status(201).json({ message: 'Jadwal kasir berhasil dibuat', id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: 'Gagal membuat jadwal kasir' });
  }
};

exports.updateCashierSchedule = async (req, res) => {
  try {
    await ensureCashierScheduleTable();
    const { id } = req.params;
    const { user_id, work_date, start_time, end_time, shift_name, status, note } = req.body || {};
    const branchId = getRequestBranchId(req) || req.user.branch_id || null;

    if (!user_id || !isValidDateKey(work_date) || !isValidTime(start_time) || !isValidTime(end_time)) {
      return res.status(400).json({ message: 'Kasir, tanggal, jam mulai, dan jam selesai wajib valid' });
    }
    if (start_time >= end_time) {
      return res.status(400).json({ message: 'Jam selesai harus lebih besar dari jam mulai' });
    }
    if (!branchId || branchId === 'all') {
      return res.status(400).json({ message: 'Pilih cabang aktif sebelum memperbarui jadwal kasir' });
    }

    const existingParams = [id];
    let existingBranchWhere = '';
    if (branchId && branchId !== 'all') {
      existingBranchWhere = ' AND cs.branch_id = ?';
      existingParams.push(branchId);
    }
    const [existing] = await db.query(`
      SELECT cs.id
      FROM cashier_schedules cs
      JOIN users u ON u.id = cs.user_id
      WHERE cs.id = ?${existingBranchWhere}
    `, existingParams);
    if (!existing.length) return res.status(404).json({ message: 'Jadwal tidak ditemukan' });

    const [users] = await db.query("SELECT id FROM users WHERE id = ? AND role IN ('kasir', 'admin')", [user_id]);
    if (!users.length) return res.status(404).json({ message: 'Kasir tidak ditemukan' });

    const [conflicts] = await db.query(`
      SELECT cs.id, b.name AS branch_name
      FROM cashier_schedules cs
      LEFT JOIN branches b ON b.id = cs.branch_id
      WHERE cs.user_id = ? AND cs.work_date = ? AND cs.id <> ?
      LIMIT 1
    `, [user_id, work_date, id]);
    if (conflicts.length) {
      return res.status(400).json({
        message: `Kasir ini sudah punya jadwal pada tanggal tersebut${conflicts[0].branch_name ? ` di ${conflicts[0].branch_name}` : ''}.`,
      });
    }

    await db.query(`
      UPDATE cashier_schedules
      SET user_id = ?, branch_id = ?, work_date = ?, start_time = ?, end_time = ?, shift_name = ?, status = ?, note = ?, updated_at = NOW()
      WHERE id = ?
    `, [
      user_id,
      branchId,
      work_date,
      start_time,
      end_time,
      shift_name || 'Shift Kasir',
      status || 'scheduled',
      note || null,
      id,
    ]);

    res.json({ message: 'Jadwal kasir berhasil diperbarui' });
  } catch (err) {
    res.status(500).json({ message: 'Gagal memperbarui jadwal kasir' });
  }
};

exports.deleteCashierSchedule = async (req, res) => {
  try {
    await ensureCashierScheduleTable();
    const branchId = getRequestBranchId(req) || req.user.branch_id || null;
    const params = [req.params.id];
    let branchWhere = '';
    if (branchId && branchId !== 'all') {
      branchWhere = ' AND cs.branch_id = ?';
      params.push(branchId);
    }
    const [existing] = await db.query(`
      SELECT cs.id
      FROM cashier_schedules cs
      JOIN users u ON u.id = cs.user_id
      WHERE cs.id = ?${branchWhere}
    `, params);
    if (!existing.length) return res.status(404).json({ message: 'Jadwal tidak ditemukan' });

    await db.query('DELETE FROM cashier_schedules WHERE id = ?', [req.params.id]);
    res.json({ message: 'Jadwal kasir berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ message: 'Gagal menghapus jadwal kasir' });
  }
};

exports.onboardTenant = async (req, res) => {
  const {
    restaurant_name,
    slug,
    owner_name,
    owner_email,
    password,
    phone,
    plan_code = 'starter',
    branch_name = 'Cabang Utama',
    branch_address = '',
    table_count = 5,
    first_category_name = 'Makanan & Minuman',
    first_product_name = 'Menu Spesial',
    first_product_price = 25000,
  } = req.body;

  if (!restaurant_name || !owner_email || !password || !owner_name) {
    return res.status(400).json({ message: 'Nama restoran, nama pemilik, email, dan password wajib diisi' });
  }

  let cleanSlug = (slug || restaurant_name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!cleanSlug) cleanSlug = `resto-${Date.now().toString(36)}`;

  try {
    const [existingUsers] = await db.query('SELECT id FROM users WHERE email = ? LIMIT 1', [owner_email]);
    if (existingUsers?.length > 0) {
      return res.status(400).json({ message: 'Email sudah terdaftar. Silakan gunakan email lain atau login.' });
    }

    const [existingTenants] = await db.query('SELECT id FROM tenants WHERE slug = ? LIMIT 1', [cleanSlug]);
    if (existingTenants?.length > 0) {
      cleanSlug = `${cleanSlug}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const branding = JSON.stringify({
      primary_color: '#C9A84C',
      accent_color: '#E0C068',
      store_name: restaurant_name,
    });
    const settings = JSON.stringify({
      store_name: restaurant_name,
      phone: phone || '',
      address: branch_address || '',
    });

    const [tenantResult] = await db.query(`
      INSERT INTO tenants (name, slug, plan_code, status, branding, settings)
      VALUES (?, ?, ?, 'active', ?, ?)
    `, [restaurant_name, cleanSlug, plan_code, branding, settings]);

    const tenantId = tenantResult.insertId;

    const [branchResult] = await db.query(`
      INSERT INTO branches (tenant_id, name, address, phone, is_main, status)
      VALUES (?, ?, ?, ?, true, 'active')
    `, [tenantId, branch_name, branch_address, phone || '']);

    const branchId = branchResult.insertId;

    const hashedPassword = await bcrypt.hash(password, 10);
    const [userResult] = await db.query(`
      INSERT INTO users (tenant_id, name, email, password, role, default_branch_id)
      VALUES (?, ?, ?, ?, 'admin', ?)
    `, [tenantId, owner_name, owner_email, hashedPassword, branchId]);

    const userId = userResult.insertId;

    const tablesNum = Math.min(Math.max(Number(table_count) || 5, 1), 50);
    for (let i = 1; i <= tablesNum; i++) {
      const tableNumber = `Meja ${String(i).padStart(2, '0')}`;
      const token = `${cleanSlug}-t${i}-${Math.random().toString(36).substring(2, 8)}`;
      await db.query(`
        INSERT INTO dining_tables
          (table_number, table_name, capacity, qr_token, status, branch_id, tenant_id, created_by)
        VALUES (?, ?, ?, ?, 'active', ?, ?, ?)
      `, [tableNumber, tableNumber, 4, token, branchId, tenantId, userId]);
    }

    let categoryId = null;
    if (first_category_name) {
      const [catResult] = await db.query(`
        INSERT INTO categories (tenant_id, name, sort_order)
        VALUES (?, ?, 1)
      `, [tenantId, first_category_name]);
      categoryId = catResult.insertId;
    }

    if (first_product_name) {
      await db.query(`
        INSERT INTO products (tenant_id, category_id, name, price, status)
        VALUES (?, ?, ?, ?, 'active')
      `, [tenantId, categoryId, first_product_name, Number(first_product_price) || 25000]);
    }

    try {
      await db.query(`
        INSERT INTO payment_methods
          (tenant_id, method_key, name, type, provider_name, account_name, instructions, status, sort_order)
        VALUES
          (?, 'qris', 'QRIS', 'qris', 'QRIS', ?, 'Scan QRIS dan upload bukti bayar.', 'active', 1),
          (?, 'cash', 'Tunai di Kasir', 'cash', 'Kasir', ?, 'Bayar langsung di meja kasir.', 'active', 2)
      `, [tenantId, restaurant_name, tenantId, restaurant_name]);
    } catch (_) {}

    const token = jwt.sign(
      {
        id: userId,
        role: 'admin',
        branch_id: branchId,
        tenant_id: tenantId,
        tenant_slug: cleanSlug,
        plan_code: plan_code,
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Selamat! Restoran Anda berhasil didaftarkan ke Santapos.',
      token,
      user: {
        id: userId,
        name: owner_name,
        email: owner_email,
        role: 'admin',
        tenant_id: tenantId,
        tenant_name: restaurant_name,
        tenant_slug: cleanSlug,
        plan_code: plan_code,
        default_branch_id: branchId,
        branch_name: branch_name,
      },
      tenant: {
        id: tenantId,
        name: restaurant_name,
        slug: cleanSlug,
        plan_code: plan_code,
      }
    });
  } catch (err) {
    console.error('[onboardTenant error]:', err);
    return res.status(500).json({ message: 'Gagal melakukan onboarding: ' + err.message });
  }
};

