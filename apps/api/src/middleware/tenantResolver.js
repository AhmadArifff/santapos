const db = require('../config/db');
const jwt = require('jsonwebtoken');

// In-memory cache for high-throughput tenant lookups (2 minutes TTL)
const tenantCache = new Map();
const CACHE_TTL_MS = 2 * 60 * 1000;

const getCachedTenant = (key) => {
  const cached = tenantCache.get(key);
  if (!cached) return null;
  if (Date.now() - cached.cachedAt > CACHE_TTL_MS) {
    tenantCache.delete(key);
    return null;
  }
  return cached.data;
};

const setCachedTenant = (key, data) => {
  tenantCache.set(key, { data, cachedAt: Date.now() });
};

const extractSubdomain = (host) => {
  if (!host) return null;
  const cleaned = String(host).split(':')[0].toLowerCase();

  // Ignored root / dev hosts
  if (
    cleaned === 'localhost' ||
    cleaned === '127.0.0.1' ||
    cleaned === 'santapos.id' ||
    cleaned === 'app.santapos.id' ||
    cleaned === 'api.santapos.id' ||
    cleaned.endsWith('.vercel.app')
  ) {
    return null;
  }

  if (cleaned.endsWith('.santapos.id')) {
    const parts = cleaned.replace('.santapos.id', '').split('.');
    return parts[parts.length - 1] || null;
  }

  return cleaned; // Potential custom domain
};

const resolveTenantFromDb = async ({ slug, id, customDomain }) => {
  const cacheKey = slug ? `slug:${slug}` : id ? `id:${id}` : `domain:${customDomain}`;
  const cached = getCachedTenant(cacheKey);
  if (cached) return cached;

  let query = `
    SELECT 
      t.id, t.name, t.slug, t.custom_domain, t.status, t.feature_overrides,
      p.code as plan_code, p.name as plan_name, p.capabilities as plan_capabilities
    FROM tenants t
    JOIN plans p ON p.id = t.plan_id
  `;
  const params = [];

  if (id) {
    query += ` WHERE t.id = ?`;
    params.push(id);
  } else if (slug) {
    query += ` WHERE t.slug = ?`;
    params.push(slug);
  } else if (customDomain) {
    query += ` WHERE t.custom_domain = ? OR t.slug = ?`;
    params.push(customDomain, customDomain);
  } else {
    // Default demo tenant
    query += ` WHERE t.id = 1`;
  }

  try {
    const [rows] = await db.query(query, params);
    const tenant = rows?.[0] || null;
    if (tenant) {
      setCachedTenant(cacheKey, tenant);
    }
    return tenant;
  } catch (err) {
    console.warn('[tenantResolver] DB lookup failed, falling back to default:', err.message);
    return {
      id: 1,
      name: 'Sultan Kebab',
      slug: 'sultan-kebab',
      plan_code: 'franchise',
      plan_capabilities: {},
    };
  }
};

const tenantResolver = async (req, res, next) => {
  try {
    // 1. If already authenticated via JWT or Authorization Bearer header is present
    let authTenantId = req.user?.tenant_id;
    if (!authTenantId && req.headers.authorization?.startsWith('Bearer ')) {
      try {
        const rawToken = req.headers.authorization.split(' ')[1];
        const decoded = jwt.decode(rawToken);
        if (decoded?.tenant_id) {
          authTenantId = decoded.tenant_id;
        }
      } catch (_) {}
    }

    if (authTenantId) {
      const tenant = await resolveTenantFromDb({ id: authTenantId });
      if (tenant) {
        req.tenant = tenant;
        req.tenantId = Number(authTenantId);
        return next();
      }
    }

    // 2. Read explicit headers injected by Next.js edge middleware
    const explicitSlug = req.headers['x-tenant-slug'];
    const explicitId = req.headers['x-tenant-id'];

    if (explicitSlug) {
      const tenant = await resolveTenantFromDb({ slug: String(explicitSlug).toLowerCase() });
      if (tenant) {
        req.tenant = tenant;
        req.tenantId = tenant.id;
        return next();
      }
    }

    if (explicitId && Number(explicitId) > 0) {
      const tenant = await resolveTenantFromDb({ id: Number(explicitId) });
      if (tenant) {
        req.tenant = tenant;
        req.tenantId = tenant.id;
        return next();
      }
    }

    // 3. Resolve from Host header (subdomain or custom domain)
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const domainOrSubdomain = extractSubdomain(host);

    if (domainOrSubdomain) {
      const tenant = await resolveTenantFromDb({ customDomain: domainOrSubdomain });
      if (tenant) {
        req.tenant = tenant;
        req.tenantId = tenant.id;
        return next();
      }
    }

    // 4. Default fallback to Demo Tenant (tenant 1) for seamless development
    const defaultTenant = await resolveTenantFromDb({ id: 1 });
    req.tenant = defaultTenant || {
      id: 1,
      name: 'Sultan Kebab',
      slug: 'sultan-kebab',
      plan_code: 'franchise',
      plan_capabilities: {},
    };
    req.tenantId = req.tenant.id;

    next();
  } catch (error) {
    console.error('[tenantResolver] Unexpected error:', error);
    next();
  }
};

module.exports = tenantResolver;
