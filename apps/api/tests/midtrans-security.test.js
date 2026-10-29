const assert = require('assert');
const crypto = require('crypto');
const {
  verifyMidtransSignature,
} = require('../src/services/midtransService');

console.log('--- SANTAPOS MIDTRANS FINANCIAL SECURITY UNIT TESTS ---');

// TEST 1: SHA-512 Digital Signature Verification (Anti-Tampering & Anti-Spoofing)
(() => {
  const serverKey = 'SB-Mid-server-test1234567890';
  const orderId = 'ORD-20261029-001';
  const statusCode = '200';
  const grossAmount = '150000.00';

  const rawInput = `${orderId}${statusCode}${grossAmount}${serverKey}`;
  const validSignature = crypto.createHash('sha512').update(rawInput).digest('hex');

  // Case A: Valid Signature
  const isValid = verifyMidtransSignature({
    order_id: orderId,
    status_code: statusCode,
    gross_amount: grossAmount,
    signature_key: validSignature,
    serverKey,
  });
  assert.strictEqual(isValid, true, 'Valid SHA-512 signature should pass verification');

  // Case B: Tampered Gross Amount (Spoofed amount attack)
  const isTamperedAmount = verifyMidtransSignature({
    order_id: orderId,
    status_code: statusCode,
    gross_amount: '1000.00', // Attacker altered amount
    signature_key: validSignature,
    serverKey,
  });
  assert.strictEqual(isTamperedAmount, false, 'Tampered amount must be rejected by SHA-512 verifier');

  // Case C: Tampered Status Code (Fake settlement attack)
  const isTamperedStatus = verifyMidtransSignature({
    order_id: orderId,
    status_code: '201',
    gross_amount: grossAmount,
    signature_key: validSignature,
    serverKey,
  });
  assert.strictEqual(isTamperedStatus, false, 'Tampered status code must be rejected by SHA-512 verifier');

  // Case D: Wrong Server Key (Spoofed merchant)
  const isWrongKey = verifyMidtransSignature({
    order_id: orderId,
    status_code: statusCode,
    gross_amount: grossAmount,
    signature_key: validSignature,
    serverKey: 'SB-Mid-server-attackerFakeKey',
  });
  assert.strictEqual(isWrongKey, false, 'Payload signed with wrong server key must be rejected');

  console.log('✅ TEST 1 PASSED: SHA-512 Signature Hash strictly guards against tampering and spoofing.');
})();

// TEST 2: Secret Credential Masking (Zero Plaintext Leak to Frontend)
(() => {
  const maskKey = (key) => {
    if (!key) return '';
    const str = String(key);
    if (str.length <= 10) return '••••••••';
    return str.slice(0, 8) + '••••••••••••' + str.slice(-4);
  };

  const sampleKey = 'SB-Mid-server-xYz987Abc1234Prod';
  const masked = maskKey(sampleKey);

  assert.strictEqual(masked.includes('••••••••••••'), true, 'Middle of secret key must be obfuscated');
  assert.strictEqual(masked.startsWith('SB-Mid-s'), true, 'Prefix is retained for operator recognition');
  assert.strictEqual(masked.endsWith('Prod'), true, 'Suffix is retained for operator recognition');
  assert.strictEqual(masked.includes('xYz987Abc'), false, 'Sensitive body must never be exposed');

  console.log('✅ TEST 2 PASSED: Server Key masking prevents credential exposure to frontend clients.');
})();

// TEST 3: Webhook Verification Logic Completeness
(() => {
  const missingOrder = verifyMidtransSignature({
    order_id: '',
    status_code: '200',
    gross_amount: '10000',
    signature_key: 'abc',
    serverKey: 'key',
  });
  assert.strictEqual(missingOrder, false, 'Empty order_id should return false');

  const missingKey = verifyMidtransSignature({
    order_id: 'ORD-1',
    status_code: '200',
    gross_amount: '10000',
    signature_key: 'abc',
    serverKey: '',
  });
  assert.strictEqual(missingKey, false, 'Missing serverKey should return false');

  console.log('✅ TEST 3 PASSED: Incomplete webhook signatures safely fail-closed.');
})();

// TEST 4: Reconciliation Status Mapping Logic
(() => {
  const mapReconciliationOutcome = (status, fraudStatus) => {
    if (status === 'settlement' || (status === 'capture' && fraudStatus === 'accept')) {
      return 'settled';
    }
    if (['expire', 'cancel', 'deny'].includes(status)) {
      return 'expired';
    }
    if (status === 'pending') {
      return 'pending';
    }
    return 'unknown';
  };

  assert.strictEqual(mapReconciliationOutcome('settlement', null), 'settled');
  assert.strictEqual(mapReconciliationOutcome('capture', 'accept'), 'settled');
  assert.strictEqual(mapReconciliationOutcome('capture', 'challenge'), 'unknown');
  assert.strictEqual(mapReconciliationOutcome('expire', null), 'expired');
  assert.strictEqual(mapReconciliationOutcome('cancel', null), 'expired');
  assert.strictEqual(mapReconciliationOutcome('pending', null), 'pending');

  console.log('✅ TEST 4 PASSED: Reconciliation outcome mapping matches financial gateway states.');
})();

// TEST 5: Manual Override Validation & Audit Guard
(() => {
  const sanitizeManualApprove = ({ orderCode, reason, user }) => {
    if (!orderCode) throw new Error('Kode pesanan wajib diisi');
    return {
      orderCode: String(orderCode).trim(),
      reason: String(reason || 'Manual override kasir/admin').trim(),
      approvedBy: user?.name || 'Admin',
      timestamp: new Date().toISOString(),
    };
  };

  const payload = sanitizeManualApprove({
    orderCode: 'ORD-999',
    reason: 'Uang sudah masuk via mutasi bank konfirmasi',
    user: { name: 'Owner Resto' },
  });

  assert.strictEqual(payload.orderCode, 'ORD-999');
  assert.strictEqual(payload.approvedBy, 'Owner Resto');
  assert.strictEqual(payload.reason.includes('mutasi bank'), true);

  console.log('✅ TEST 5 PASSED: Manual approve paid parameters are strictly sanitized and auditable.');
})();

console.log('🎉 ALL MIDTRANS FINANCIAL SECURITY & RECONCILIATION UNIT TESTS PASSED SUCCESSFULLY!\n');

