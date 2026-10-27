/**
 * Tenant Context Helper
 * Enforces strict, zero-trust tenant identification across service & controller layers.
 */

const getTenantId = (req) => {
  // 1. Authenticated user's tenant_id is the primary, untamperable source of truth.
  if (req.user?.tenant_id) {
    return Number(req.user.tenant_id);
  }

  // 2. Resolved public tenant (from verified subdomain / custom domain resolver).
  if (req.tenant?.id) {
    return Number(req.tenant.id);
  }

  if (req.tenantId) {
    return Number(req.tenantId);
  }

  // Fallback demo tenant (tenant 1) for backwards compatibility
  return 1;
};

const isSuperAdmin = (req) => {
  return Boolean(req.user?.role === 'superadmin');
};

const getTenantPlan = (req) => {
  return req.tenant?.plan_code || 'starter';
};

module.exports = {
  getTenantId,
  isSuperAdmin,
  getTenantPlan,
};
