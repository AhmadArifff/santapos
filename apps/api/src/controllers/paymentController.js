const db = require('../config/db');
const midtransService = require('../services/midtransService');
const {
  ensurePaymentTables,
  getPaymentMethodById,
  listPaymentMethods,
  normalizePaymentPayload,
  removePaymentAsset,
  uploadPaymentAsset,
} = require('../services/paymentService');

const sendSafeError = (res, status, message) => res.status(status).json({ message });

exports.listPublicMethods = async (req, res) => {
  try {
    const rows = await listPaymentMethods({ includeInactive: false });
    const tenantId = req.query.tenant_id || 1;
    const midtransConfig = await midtransService.getMidtransConfig(tenantId);
    if (midtransConfig?.is_active && midtransConfig?.client_key) {
      rows.unshift({
        id: 'midtrans-instant',
        method_key: 'midtrans',
        name: 'Bayar Otomatis (QRIS / GoPay / ShopeePay / VA)',
        type: 'midtrans',
        provider_name: 'Midtrans Payment Gateway',
        account_name: 'Verifikasi Otomatis',
        account_number: 'Instan & Bebas Upload Bukti',
        instructions: 'Pilih pembayaran otomatis untuk membayar dengan QRIS Dinamis atau E-Wallet. Pesanan langsung diproses tanpa upload bukti transfer.',
        payment_timeout_minutes: 15,
        status: 'active',
        sort_order: -1,
      });
    }
    res.json(rows);
  } catch (_) {
    sendSafeError(res, 500, 'Gagal mengambil metode pembayaran');
  }
};

exports.listMethods = async (req, res) => {
  try {
    const rows = await listPaymentMethods({ includeInactive: true });
    res.json(rows);
  } catch (_) {
    sendSafeError(res, 500, 'Gagal mengambil metode pembayaran');
  }
};

exports.createMethod = async (req, res) => {
  try {
    await ensurePaymentTables();
    const payload = normalizePaymentPayload(req.body);
    const qrImageUrl = req.file
      ? await uploadPaymentAsset({ file: req.file, folder: 'payments', prefix: payload.method_key })
      : null;

    const [result] = await db.query(`
      INSERT INTO payment_methods
        (method_key, name, type, provider_name, account_name, account_number, qr_image_url,
         instructions, payment_timeout_minutes, status, sort_order, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      payload.method_key,
      payload.name,
      payload.type,
      payload.provider_name,
      payload.account_name,
      payload.account_number,
      qrImageUrl,
      payload.instructions,
      payload.payment_timeout_minutes,
      payload.status,
      payload.sort_order,
      req.user?.id || null,
    ]);

    const [rows] = await db.query('SELECT * FROM payment_methods WHERE id = ?', [result.insertId]);
    res.status(201).json({ message: 'Metode pembayaran berhasil dibuat', data: rows[0] });
  } catch (err) {
    if (/duplicate|unique/i.test(err.message)) {
      return sendSafeError(res, 400, 'Kode metode pembayaran sudah digunakan');
    }
    sendSafeError(res, 500, 'Gagal menyimpan metode pembayaran');
  }
};

exports.updateMethod = async (req, res) => {
  try {
    await ensurePaymentTables();
    const existing = await getPaymentMethodById(req.params.id, { activeOnly: false });
    if (!existing) return sendSafeError(res, 404, 'Metode pembayaran tidak ditemukan');

    const payload = normalizePaymentPayload(req.body);
    let qrImageUrl = existing.qr_image_url || null;
    if (req.file) {
      await removePaymentAsset(qrImageUrl);
      qrImageUrl = await uploadPaymentAsset({ file: req.file, folder: 'payments', prefix: payload.method_key });
    }
    if (String(req.body.remove_qr || '') === '1') {
      await removePaymentAsset(qrImageUrl);
      qrImageUrl = null;
    }

    await db.query(`
      UPDATE payment_methods
      SET method_key = ?,
          name = ?,
          type = ?,
          provider_name = ?,
          account_name = ?,
          account_number = ?,
          qr_image_url = ?,
          instructions = ?,
          payment_timeout_minutes = ?,
          status = ?,
          sort_order = ?
      WHERE id = ?
    `, [
      payload.method_key,
      payload.name,
      payload.type,
      payload.provider_name,
      payload.account_name,
      payload.account_number,
      qrImageUrl,
      payload.instructions,
      payload.payment_timeout_minutes,
      payload.status,
      payload.sort_order,
      req.params.id,
    ]);

    const [rows] = await db.query('SELECT * FROM payment_methods WHERE id = ?', [req.params.id]);
    res.json({ message: 'Metode pembayaran berhasil diupdate', data: rows[0] });
  } catch (err) {
    if (/duplicate|unique/i.test(err.message)) {
      return sendSafeError(res, 400, 'Kode metode pembayaran sudah digunakan');
    }
    sendSafeError(res, 500, 'Gagal mengupdate metode pembayaran');
  }
};

exports.deleteMethod = async (req, res) => {
  try {
    await ensurePaymentTables();
    const existing = await getPaymentMethodById(req.params.id, { activeOnly: false });
    if (!existing) return sendSafeError(res, 404, 'Metode pembayaran tidak ditemukan');

    if (String(req.query.hard || '') === '1') {
      await removePaymentAsset(existing.qr_image_url);
      await db.query('DELETE FROM payment_methods WHERE id = ?', [req.params.id]);
      return res.json({ message: 'Metode pembayaran berhasil dihapus' });
    }

    await db.query("UPDATE payment_methods SET status = 'inactive' WHERE id = ?", [req.params.id]);
    res.json({ message: 'Metode pembayaran dinonaktifkan' });
  } catch (_) {
    sendSafeError(res, 500, 'Gagal menghapus metode pembayaran');
  }
};

exports.getMidtransConfig = async (req, res) => {
  try {
    const tenantId = req.user?.tenant_id || 1;
    const config = await midtransService.getMidtransConfig(tenantId);
    res.json({ success: true, data: config });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.saveMidtransConfig = async (req, res) => {
  try {
    const tenantId = req.user?.tenant_id || 1;
    const { server_key, client_key, merchant_id, environment, is_active } = req.body;
    const saved = await midtransService.saveMidtransConfig({
      tenantId,
      serverKey: server_key,
      clientKey: client_key,
      merchantId: merchant_id,
      environment,
      isActive: is_active,
      webhookUrl: `${process.env.FRONTEND_URL || ''}/api/payments/midtrans/notification`,
    });
    res.json({ success: true, message: 'Konfigurasi Midtrans berhasil disimpan!', data: saved });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.testMidtransConfig = async (req, res) => {
  try {
    const { server_key, environment } = req.body;
    const result = await midtransService.testMidtransCredentials({
      serverKey: server_key,
      environment,
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.createMidtransSnapToken = async (req, res) => {
  try {
    const { orderCode } = req.params;
    const [orderRows] = await db.query('SELECT * FROM customer_orders WHERE order_code = ? LIMIT 1', [orderCode]);
    const order = orderRows?.[0];
    if (!order) return res.status(404).json({ message: 'Pesanan tidak ditemukan' });

    const [items] = await db.query('SELECT * FROM customer_order_items WHERE order_id = ?', [order.id]);
    order.items = items;

    const snapResult = await midtransService.createSnapToken({
      tenantId: order.tenant_id || 1,
      order,
    });
    res.json({ success: true, data: snapResult });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.handleMidtransNotification = async (req, res) => {
  try {
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const result = await midtransService.handleWebhookNotification(req.body, clientIp);
    res.json(result);
  } catch (err) {
    console.error('[Midtrans Webhook Error]:', err.message);
    res.status(400).json({ message: err.message });
  }
};

exports.getMidtransAuditLogs = async (req, res) => {
  try {
    const tenantId = req.user?.tenant_id || 1;
    const logs = await midtransService.getPaymentAuditLogs({
      tenantId: req.user?.role === 'superadmin' ? null : tenantId,
      limit: 100,
    });
    res.json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.checkOrderStatus = async (req, res) => {
  try {
    const tenantId = req.user?.tenant_id || 1;
    const { orderCode } = req.params;
    const result = await midtransService.checkMidtransOrderStatus({
      tenantId,
      orderCode,
      autoSettleIfPaid: true,
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.syncMidtransRange = async (req, res) => {
  try {
    const tenantId = req.user?.tenant_id || 1;
    const { start_date, end_date, status_filter, limit } = req.body || {};
    const result = await midtransService.syncMidtransOrdersByRange({
      tenantId,
      startDate: start_date,
      endDate: end_date,
      statusFilter: status_filter,
      limit,
    });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.manualApprovePayment = async (req, res) => {
  try {
    const tenantId = req.user?.tenant_id || 1;
    const { orderCode } = req.params;
    const { reason } = req.body || {};
    const result = await midtransService.manualApproveOrderPayment({
      tenantId,
      orderCode,
      reason,
      userId: req.user?.id || null,
      userName: req.user?.name || 'Admin',
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
