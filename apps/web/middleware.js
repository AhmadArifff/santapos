import { NextResponse } from 'next/server';

export function middleware(request) {
  const host = request.headers.get('host') || '';
  const cleaned = host.split(':')[0].toLowerCase();

  let tenantSlug = null;
  let isSuperAdminPortal = false;

  if (cleaned === 'santapos.id' || cleaned === 'www.santapos.id') {
    // Main SaaS marketing website
    tenantSlug = null;
  } else if (cleaned === 'app.santapos.id') {
    // Superadmin SaaS headquarters portal
    isSuperAdminPortal = true;
  } else if (cleaned.endsWith('.santapos.id')) {
    const parts = cleaned.replace('.santapos.id', '').split('.');
    tenantSlug = parts[parts.length - 1] || null;
  } else if (cleaned === 'localhost' || cleaned === '127.0.0.1') {
    // In local dev, allow query param override ?tenant=slug or cookie
    const url = new URL(request.url);
    tenantSlug = url.searchParams.get('tenant') || request.cookies.get('santapos_tenant')?.value || 'sultan-kebab';
  } else {
    // Potential custom domain mapped to a tenant
    tenantSlug = cleaned;
  }

  const requestHeaders = new Headers(request.headers);
  if (tenantSlug) {
    requestHeaders.set('x-tenant-slug', tenantSlug);
  }
  if (isSuperAdminPortal) {
    requestHeaders.set('x-is-superadmin-portal', 'true');
  }
  requestHeaders.set('x-forwarded-host', host);

  if (isSuperAdminPortal && request.nextUrl.pathname === '/') {
    return NextResponse.rewrite(new URL('/superadmin', request.url), {
      request: {
        headers: requestHeaders,
      },
    });
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  if (tenantSlug) {
    response.cookies.set('santapos_tenant', tenantSlug, { path: '/', httpOnly: false });
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images/).*)',
  ],
};
