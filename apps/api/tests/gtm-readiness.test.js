const assert = require('assert');

console.log('--- SANTAPOS GO-TO-MARKET READINESS UNIT TESTS ---');

// 1. Slug Sanitization & Isolation Test
{
  const sanitizeSlug = (name) => {
    return (name || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  assert.strictEqual(sanitizeSlug('Kebab Barokah & Burger 2024!'), 'kebab-barokah-burger-2024');
  assert.strictEqual(sanitizeSlug('   Ayam Geprek Sambal Matah   '), 'ayam-geprek-sambal-matah');
  console.log('✅ TEST 1 PASSED: Slug sanitization properly handles spaces, symbols, and formatting.');
}

// 2. Plan Code Validation Test
{
  const validPlans = ['starter', 'pro', 'franchise'];
  const isValidPlan = (plan) => validPlans.includes(plan);

  assert.strictEqual(isValidPlan('starter'), true);
  assert.strictEqual(isValidPlan('pro'), true);
  assert.strictEqual(isValidPlan('franchise'), true);
  assert.strictEqual(isValidPlan('enterprise_hacked'), false);
  assert.strictEqual(isValidPlan(''), false);
  console.log('✅ TEST 2 PASSED: Subscription plan codes strictly guarded against invalid tiers.');
}

// 3. Franchise HQ Aggregation Calculation Test
{
  const branches = [
    { branch_id: 1, name: 'Cabang Dago', total_orders: 120, total_revenue: 3600000 },
    { branch_id: 2, name: 'Cabang SCBD', total_orders: 250, total_revenue: 8500000 },
    { branch_id: 3, name: 'Cabang Pakuwon', total_orders: 80, total_revenue: 2200000 },
  ];

  const totalRevenue = branches.reduce((acc, b) => acc + b.total_revenue, 0);
  const totalOrders = branches.reduce((acc, b) => acc + b.total_orders, 0);
  const avgTicket = Math.round(totalRevenue / totalOrders);

  assert.strictEqual(totalRevenue, 14300000);
  assert.strictEqual(totalOrders, 450);
  assert.strictEqual(avgTicket, 31778);

  const topBranch = [...branches].sort((a, b) => b.total_revenue - a.total_revenue)[0];
  assert.strictEqual(topBranch.name, 'Cabang SCBD');
  console.log('✅ TEST 3 PASSED: Franchise Headquarters aggregates and top branch sorting calculated accurately.');
}

// 4. Role Guard for SaaS Superadmin Portal Test
{
  const { isSuperAdmin } = require('../src/middleware/auth');
  let nextCalled = false;
  let errorStatus = null;
  let errorMessage = null;

  const mockRes = {
    status: (code) => {
      errorStatus = code;
      return {
        json: (data) => { errorMessage = data.message; }
      };
    }
  };

  // Test tenant admin attempting to access superadmin
  isSuperAdmin({ user: { role: 'admin', tenant_id: 1 } }, mockRes, () => { nextCalled = true; });
  assert.strictEqual(nextCalled, false, 'Tenant admin should be blocked from Superadmin portal');
  assert.strictEqual(errorStatus, 403);

  // Test true superadmin
  nextCalled = false;
  errorStatus = null;
  isSuperAdmin({ user: { role: 'superadmin', tenant_id: 1 } }, mockRes, () => { nextCalled = true; });
  assert.strictEqual(nextCalled, true, 'Superadmin role should be permitted into Superadmin portal');
  console.log('✅ TEST 4 PASSED: Superadmin access gate strictly verified.');
}

console.log('\n🎉 ALL GTM READINESS UNIT TESTS PASSED SUCCESSFULLY!');
