const crypto = require('crypto');
const axios = require('axios');
const db = require('../config/db');

const getBaseUrl = (environment) => {
  return environment === 'production'
    ? 'https://app.midtrans.com/snap/v1/transactions'
    : 'https://app.sandbox.midtrans.com/snap/v1/transactions';
};

const getApiBaseUrl = (environment) => {
  return environment === 'production'
    ? 'https://api.midtrans.com'
    : 'https://api.sandbox.midtrans.com';
};

// Helper: Mask Server Key for safe display
const maskKey = (key) => {
  if (!key) return '';
  const str = String(key);
  if (str.length <= 10) return '••••••••';
  return str.slice(0, 8) + '••••••••••••' + str.slice(-4);
};

// Helper: Log financial audit entry
const logAudit = async ({
  tenantId = null,
  orderId = null,
  orderCode = '-',
  eventType,
  grossAmount = 0,
  paymentType = null,
  transactionStatus = null,
  signatureHash = null,
  isSignatureValid = false,
  rawPayload = {},
  ipAddress = null,
}) => {
  try {
    await db.query(`
      INSERT INTO payment_audit_logs
        (tenant_id, order_id, order_code, event_type, gross_amount, payment_type,
         transaction_status, signature_hash, is_signature_valid, raw_payload, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      tenantId,
      orderId,
      orderCode,
      eventType,
      grossAmount,
      paymentType,
      transactionStatus,
      signatureHash,
      isSignatureValid,
      JSON.stringify(rawPayload),
      ipAddress,
    ]);
  } catch (err) {
    console.error('[Financial Audit Log Error]:', err.message);
  }
};

/**
 * Mengambil konfigurasi Midtrans per Tenant
 */
const getMidtransConfig = async (tenantId = 1) => {
  const [rows] = await db.query(`
    SELECT * FROM payment_gateway_configs
    WHERE tenant_id = ? AND provider = 'midtrans'
    LIMIT 1
  `, [tenantId]);

  if (rows && rows.length > 0) {
    const config = rows[0];
    return {
      is_active: Boolean(config.is_active),
      environment: config.environment || 'sandbox',
      merchant_id: config.merchant_id || '',
      client_key: config.client_key || '',
      server_key: config.server_key || '',
      masked_server_key: maskKey(config.server_key),
      webhook_url: config.webhook_url || '',
    };
  }

  // Fallback to process.env if available
  const envServerKey = process.env.MIDTRANS_SERVER_KEY || '';
  const envClientKey = process.env.MIDTRANS_CLIENT_KEY || '';
  const envIsProd = process.env.MIDTRANS_IS_PRODUCTION === 'true';

  return {
    is_active: Boolean(envServerKey),
    environment: envIsProd ? 'production' : 'sandbox',
    merchant_id: process.env.MIDTRANS_MERCHANT_ID || '',
    client_key: envClientKey,
    server_key: envServerKey,
    masked_server_key: maskKey(envServerKey),
    webhook_url: '',
  };
};

/**
 * Menyimpan konfigurasi Midtrans dari panel admin
 */
const saveMidtransConfig = async ({
  tenantId = 1,
  serverKey,
  clientKey,
  merchantId,
  environment = 'sandbox',
  isActive = true,
  webhookUrl,
}) => {
  // If serverKey is not passed or masked, retain existing
  let finalServerKey = serverKey;
  if (!finalServerKey || finalServerKey.includes('••••')) {
    const existing = await getMidtransConfig(tenantId);
    finalServerKey = existing.server_key;
  }

  await db.query(`
    INSERT INTO payment_gateway_configs
      (tenant_id, provider, is_active, environment, merchant_id, client_key, server_key, webhook_url, updated_at)
    VALUES (?, 'midtrans', ?, ?, ?, ?, ?, ?, NOW())
    ON CONFLICT (tenant_id, provider) DO UPDATE SET
      is_active = EXCLUDED.is_active,
      environment = EXCLUDED.environment,
      merchant_id = EXCLUDED.merchant_id,
      client_key = EXCLUDED.client_key,
      server_key = CASE WHEN EXCLUDED.server_key IS NOT NULL AND EXCLUDED.server_key != '' THEN EXCLUDED.server_key ELSE payment_gateway_configs.server_key END,
      webhook_url = EXCLUDED.webhook_url,
      updated_at = NOW()
  `, [
    tenantId,
    Boolean(isActive),
    environment,
    merchantId || null,
    clientKey || null,
    finalServerKey || null,
    webhookUrl || null,
  ]);

  return getMidtransConfig(tenantId);
};

/**
 * Menguji apakah kredensial Midtrans valid dengan memanggil API Midtrans
 */
const testMidtransCredentials = async ({ serverKey, environment = 'sandbox' }) => {
  if (!serverKey) {
    throw new Error('Server Key wajib diisi untuk melakukan pengujian');
  }

  const authHeader = 'Basic ' + Buffer.from(serverKey.trim() + ':').toString('base64');
  const testUrl = `${getApiBaseUrl(environment)}/v2/token`;

  try {
    // Panggil token API untuk verifikasi Basic Auth
    await axios.get(testUrl, {
      headers: {
        Authorization: authHeader,
        Accept: 'application/json',
      },
    });
    return { success: true, message: 'Autentikasi Midtrans Server Key berhasil diverifikasi!' };
  } catch (err) {
    // Midtrans returns 400 for missing query parameters, but 401 for bad auth!
    if (err.response?.status === 400) {
      // 400 means authorized, but query parameter was omitted -> valid auth!
      return { success: true, message: 'Autentikasi Midtrans Server Key berhasil diverifikasi!' };
    }
    if (err.response?.status === 401) {
      throw new Error('Midtrans menolak Server Key (401 Unauthorized). Periksa Server Key dan pilihan Sandbox/Production.');
    }
    throw new Error(err.response?.data?.status_message || err.message || 'Gagal terhubung ke Midtrans API.');
  }
};

/**
 * Membuat Snap Token Midtrans untuk pembayaran pesanan QR meja
 */
const createSnapToken = async ({ tenantId = 1, order }) => {
  const config = await getMidtransConfig(tenantId);
  if (!config.is_active || !config.server_key) {
    throw new Error('Metode pembayaran otomatis Midtrans belum diaktifkan oleh admin restoran.');
  }

  const grossAmount = Math.round(Number(order.total_amount || order.total_price || order.total || 0));
  if (grossAmount <= 0) {
    throw new Error('Nominal transaksi harus lebih dari 0.');
  }

  const authHeader = 'Basic ' + Buffer.from(config.server_key.trim() + ':').toString('base64');
  const snapUrl = getBaseUrl(config.environment);

  const payload = {
    transaction_details: {
      order_id: String(order.order_code),
      gross_amount: grossAmount,
    },
    customer_details: {
      first_name: order.customer_name || 'Pelanggan Santapos',
      phone: order.customer_phone || undefined,
    },
    item_details: (order.items || []).map((i) => ({
      id: String(i.product_id || i.id || 'item'),
      price: Math.round(Number(i.price || 0)),
      quantity: Number(i.qty || 1),
      name: String(i.name || i.product_name || 'Menu').slice(0, 50),
    })),
    callbacks: {
      finish: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/order/status/${order.order_code}`,
    },
  };

  const response = await axios.post(snapUrl, payload, {
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  const snapData = response.data || {};

  // Update order with snap token
  await db.query(`
    UPDATE customer_orders
    SET midtrans_snap_token = ?
    WHERE id = ?
  `, [snapData.token, order.id]);

  // Catat Audit Finansial
  await logAudit({
    tenantId,
    orderId: order.id,
    orderCode: order.order_code,
    eventType: 'charge_created',
    grossAmount,
    rawPayload: { snap_token: snapData.token, snap_redirect_url: snapData.redirect_url },
    isSignatureValid: true,
  });

  return {
    token: snapData.token,
    redirect_url: snapData.redirect_url,
    client_key: config.client_key,
    environment: config.environment,
  };
};

/**
 * Validasi Tanda Tangan SHA-512 Midtrans (Anti-Tamper & Anti-Spoofing)
 */
const verifyMidtransSignature = ({ order_id, status_code, gross_amount, signature_key, serverKey }) => {
  if (!order_id || !status_code || !gross_amount || !signature_key || !serverKey) {
    return false;
  }
  const input = String(order_id) + String(status_code) + String(gross_amount) + String(serverKey.trim());
  const calculated = crypto.createHash('sha512').update(input).digest('hex');
  return calculated.toLowerCase() === String(signature_key).trim().toLowerCase();
};

/**
 * Memproses Notifikasi Webhook Midtrans dengan Keamanan Finansial Ketat & Idempotency
 */
const handleWebhookNotification = async (payload, clientIp = null) => {
  const {
    order_id,
    status_code,
    gross_amount,
    signature_key,
    transaction_status,
    fraud_status,
    payment_type,
    transaction_id,
  } = payload || {};

  if (!order_id) {
    throw new Error('Payload webhook tidak valid: order_id tidak ditemukan');
  }

  // 1. Ambil data pesanan dari database
  const [orderRows] = await db.query(`
    SELECT * FROM customer_orders
    WHERE order_code = ?
    LIMIT 1
  `, [order_id]);

  const order = orderRows?.[0];
  if (!order) {
    await logAudit({
      orderCode: order_id,
      eventType: 'order_not_found',
      grossAmount: Number(gross_amount || 0),
      rawPayload: payload,
      ipAddress: clientIp,
    });
    throw new Error(`Pesanan dengan order_code ${order_id} tidak ditemukan.`);
  }

  const tenantId = order.tenant_id || 1;
  const config = await getMidtransConfig(tenantId);

  // 2. Verifikasi Keaslian Tanda Tangan SHA-512
  const isValidSignature = verifyMidtransSignature({
    order_id,
    status_code,
    gross_amount,
    signature_key,
    serverKey: config.server_key,
  });

  if (!isValidSignature) {
    await logAudit({
      tenantId,
      orderId: order.id,
      orderCode: order_id,
      eventType: 'signature_failed',
      grossAmount: Number(gross_amount || 0),
      paymentType,
      transactionStatus: transaction_status,
      signatureHash: signature_key,
      isSignatureValid: false,
      rawPayload: payload,
      ipAddress: clientIp,
    });
    throw new Error('Tanda tangan digital (SHA-512 Signature Hash) tidak valid! Notifikasi pembayaran ditolak demi keamanan.');
  }

  // 3. ATOMIC LOCK & IDEMPOTENCY CHECK
  const conn = await db.getConnection();
  try {
    await conn.query('BEGIN');

    // Kunci baris pesanan secara atomik untuk mencegah double-processing
    const [lockedRows] = await conn.query(`
      SELECT id, status, payment_status, total_amount, table_id
      FROM customer_orders
      WHERE id = ?
      FOR UPDATE
    `, [order.id]);

    const lockedOrder = lockedRows?.[0];
    if (!lockedOrder) {
      await conn.query('ROLLBACK');
      throw new Error('Gagal mengunci pesanan');
    }

    // IDEMPOTENCY: Jika sudah lunas, jangan proses ulang (aman dari retry webhook berulang)
    if (lockedOrder.payment_status === 'paid') {
      await logAudit({
        tenantId,
        orderId: order.id,
        orderCode: order_id,
        eventType: 'idempotency_skipped',
        grossAmount: Number(gross_amount || 0),
        paymentType,
        transactionStatus: transaction_status,
        signatureHash: signature_key,
        isSignatureValid: true,
        rawPayload: payload,
        ipAddress: clientIp,
      });

      await conn.query('COMMIT');
      return { status: 'already_paid', message: 'Pesanan sudah berstatus lunas sebelumnya. Notifikasi ganda dilewati secara aman.' };
    }

    // 4. Logika Perubahan Status
    let nextStatus = lockedOrder.status;
    let nextPaymentStatus = lockedOrder.payment_status;
    let auditEventType = 'webhook_processed';

    const isSettled = transaction_status === 'settlement'
      || (transaction_status === 'capture' && fraud_status === 'accept');

    if (isSettled) {
      nextPaymentStatus = 'paid';
      nextStatus = 'accepted'; // Otomatis diterima masuk ke dapur!
      auditEventType = 'order_settled';

      await conn.query(`
        UPDATE customer_orders
        SET payment_status = 'paid',
            status = 'accepted',
            midtrans_transaction_id = ?,
            midtrans_payment_type = ?,
            payment_submitted_at = NOW(),
            updated_at = NOW()
        WHERE id = ?
      `, [transaction_id || null, payment_type || 'qris', order.id]);
    } else if (['expire', 'cancel', 'deny'].includes(transaction_status)) {
      nextStatus = 'cancelled';
      auditEventType = 'order_expired';

      await conn.query(`
        UPDATE customer_orders
        SET status = 'cancelled',
            midtrans_transaction_id = ?,
            midtrans_payment_type = ?,
            updated_at = NOW()
        WHERE id = ?
      `, [transaction_id || null, payment_type || null, order.id]);
    } else if (transaction_status === 'pending') {
      auditEventType = 'order_pending';
    }

    await conn.query('COMMIT');

    // Catat Audit Keuangan Sukses
    await logAudit({
      tenantId,
      orderId: order.id,
      orderCode: order_id,
      eventType: auditEventType,
      grossAmount: Number(gross_amount || 0),
      paymentType,
      transactionStatus: transaction_status,
      signatureHash: signature_key,
      isSignatureValid: true,
      rawPayload: payload,
      ipAddress: clientIp,
    });

    return {
      success: true,
      order_id,
      payment_status: nextPaymentStatus,
      order_status: nextStatus,
    };
  } catch (err) {
    try { await conn.query('ROLLBACK'); } catch (_) {}
    throw err;
  } finally {
    conn.release();
  }
};

/**
 * Mengambil Log Audit Transaksi Keuangan untuk Panel Verifikasi / Audit
 */
const getPaymentAuditLogs = async ({ tenantId = null, limit = 50 }) => {
  const params = [];
  let where = 'WHERE 1=1';
  if (tenantId) {
    where += ' AND tenant_id = ?';
    params.push(tenantId);
  }
  params.push(Number(limit));

  const [rows] = await db.query(`
    SELECT * FROM payment_audit_logs
    ${where}
    ORDER BY created_at DESC
    LIMIT ?
  `, params);

  return rows;
};

module.exports = {
  getMidtransConfig,
  saveMidtransConfig,
  testMidtransCredentials,
  createSnapToken,
  verifyMidtransSignature,
  handleWebhookNotification,
  getPaymentAuditLogs,
};

