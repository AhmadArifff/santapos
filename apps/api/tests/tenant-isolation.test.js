const assert = require('assert');
const { getTenantId, isSuperAdmin } = require('../src/utils/tenantContext');

console.log('--- SANTAPOS MULTI-TENANT ISOLATION UNIT TESTS ---');

// 1. Test Zero-Trust Security: JWT token strictly overrides client headers
{
  const spoofedReq = {
    user: { id: 10, role: 'admin', tenant_id: 1 },
    headers: {
      'x-tenant-id': '999',
      'x-tenant-slug': 'malicious-competitor',
    },
    tenant: { id: 999, slug: 'malicious-competitor' },
  };

  const resolvedTenantId = getTenantId(spoofedReq);
  assert.strictEqual(
    resolvedTenantId,
    1,
    'SECURITY BREACH: Client managed to spoof tenant_id via headers despite having a valid JWT!'
  );
  console.log('✅ TEST 1 PASSED: Zero-trust verified - JWT user.tenant_id strictly overrides spoofed headers.');
}

// 2. Test Public Tenant Resolution: unauthenticated request resolves from verified tenant context
{
  const publicReq = {
    user: null,
    headers: {
      'x-tenant-slug': 'kebab-dago',
    },
    tenant: { id: 2, slug: 'kebab-dago' },
  };

  const resolvedTenantId = getTenantId(publicReq);
  assert.strictEqual(
    resolvedTenantId,
    2,
    'Public customer request failed to resolve tenant from verified tenant context'
  );
  console.log('✅ TEST 2 PASSED: Public customer request accurately resolves to tenant from verified resolver context.');
}

// 3. Test Superadmin role detection
{
  const normalAdminReq = { user: { id: 1, role: 'admin', tenant_id: 1 } };
  const superAdminReq = { user: { id: 99, role: 'superadmin', tenant_id: 1 } };

  assert.strictEqual(isSuperAdmin(normalAdminReq), false, 'Normal admin should not be recognized as superadmin');
  assert.strictEqual(isSuperAdmin(superAdminReq), true, 'Superadmin role not detected correctly');
  console.log('✅ TEST 3 PASSED: Role boundary between Tenant Admin and SaaS Super Admin is strictly enforced.');
}

// 4. Test Mock In-Memory Tenant Isolation Simulation (Product & Category Queries)
{
  const mockDb = [
    { id: 101, name: 'Kebab Sultan Large', tenant_id: 1, price: 25000 },
    { id: 102, name: 'Kebab Sultan Medium', tenant_id: 1, price: 18000 },
    { id: 201, name: 'Burger Barokah Special', tenant_id: 2, price: 30000 },
    { id: 202, name: 'Es Teh Manis Jumbo', tenant_id: 2, price: 5000 },
  ];

  const queryProducts = (req) => {
    const tenantId = getTenantId(req);
    const isSuper = isSuperAdmin(req);
    return mockDb.filter((p) => isSuper || p.tenant_id === tenantId);
  };

  const tenant1Req = { user: { id: 1, role: 'admin', tenant_id: 1 } };
  const tenant2Req = { user: { id: 2, role: 'admin', tenant_id: 2 } };
  const platformSuperAdminReq = { user: { id: 99, role: 'superadmin', tenant_id: 1 } };

  const tenant1Products = queryProducts(tenant1Req);
  const tenant2Products = queryProducts(tenant2Req);
  const superAdminProducts = queryProducts(platformSuperAdminReq);

  assert.strictEqual(tenant1Products.length, 2, 'Tenant 1 should have exactly 2 products');
  assert.strictEqual(tenant1Products.some((p) => p.tenant_id !== 1), false, 'Tenant 1 saw foreign tenant data!');

  assert.strictEqual(tenant2Products.length, 2, 'Tenant 2 should have exactly 2 products');
  assert.strictEqual(tenant2Products.some((p) => p.tenant_id !== 2), false, 'Tenant 2 saw Tenant 1 data!');

  assert.strictEqual(superAdminProducts.length, 4, 'Superadmin should see all tenant products across platform');
  console.log('✅ TEST 4 PASSED: Query isolation verified - Zero cross-tenant leakage between Tenant 1 & 2.');
}

console.log('--- ALL MULTI-TENANT ISOLATION TESTS PASSED SUCCESSFULLY! ---');
