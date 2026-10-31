'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getSuperadminTenants } from '@/lib/api';

const ROLE_VIEWPORTS = [
  {
    id: 'kitchen',
    label: '🍳 Role Kitchen (KDS Board & Floor Plan)',
    badge: 'Tavola Kanban + Drag & Drop',
    defaultPath: '/kitchen',
    description:
      'Tampilan langsung Kitchen Display System: Kanban 4 kolom (New, Cooking, Ready, Served) & Floor Plan interaktif.',
    subRoutes: [
      { label: 'Kitchen Board & Floor Plan', path: '/kitchen' },
    ],
  },
  {
    id: 'kasir',
    label: '💳 Role Kasir (POS + Pilih Meja Sesuai Kapasitas)',
    badge: 'Interactive Floor Selector + QRIS',
    defaultPath: '/pos',
    description:
      'Tampilan langsung Kasir POS: Pilih produk makanan -> Pilih meja sesuai kapasitas tamu pada peta lantai -> Bayar.',
    subRoutes: [
      { label: 'Kasir POS Terminal', path: '/pos' },
      { label: 'Riwayat Transaksi Kasir', path: '/orders' },
    ],
  },
  {
    id: 'admin',
    label: '🛡️ Role Admin Cabang (Backoffice & Master Data)',
    badge: 'Full Restaurant Admin',
    defaultPath: '/dashboard',
    description:
      'Tampilan langsung Admin Restoran: Ringkasan cabang, manajemen menu, stok bahan, meja QR, dan staf.',
    subRoutes: [
      { label: 'Dashboard Admin', path: '/dashboard' },
      { label: 'Menu & Produk', path: '/products' },
      { label: 'Kategori', path: '/categories' },
      { label: 'Meja & QR Code', path: '/tables' },
      { label: 'Staf & Kehadiran', path: '/users' },
      { label: 'Laporan Order', path: '/orders' },
    ],
  },
];

export default function SuperadminRoleInspectorPage() {
  const [activeRole, setActiveRole] = useState('kitchen');
  const [activePath, setActivePath] = useState('/kitchen');
  const [tenants, setTenants] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState('Santapos Resto HQ (Default)');
  const [deviceSize, setDeviceSize] = useState('100%'); // '100%' | '1280px' | '1024px'
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    getSuperadminTenants()
      .then((res) => {
        if (Array.isArray(res?.data?.data) && res.data.data.length > 0) {
          setTenants(res.data.data);
          setSelectedTenant(res.data.data[0].name);
        }
      })
      .catch(() => {});
  }, []);

  const currentRoleObj = ROLE_VIEWPORTS.find((r) => r.id === activeRole) || ROLE_VIEWPORTS[0];

  const handleSelectRole = (role) => {
    setActiveRole(role.id);
    setActivePath(role.defaultPath);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F5F4EE',
        backgroundImage:
          'radial-gradient(circle at 12% 8%, rgba(212, 238, 226, 0.85) 0%, rgba(245, 244, 238, 0) 48%)',
        color: '#14171D',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* TOP CONTROL BAR FOR LIVE MULTI-ROLE INSPECTOR */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 60,
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(14px)',
          borderBottom: '1px solid rgba(20, 23, 29, 0.08)',
          padding: '12px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px',
          }}
        >
          {/* Left: Back to Superadmin CRM + Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Link
              href="/superadmin"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '999px',
                background: '#161920',
                color: '#FFFFFF',
                textDecoration: 'none',
                fontSize: '12px',
                fontWeight: 700,
              }}
            >
              <span>←</span>
              <span>Kembali ke Superadmin CRM</span>
            </Link>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontFamily: 'Georgia, serif',
                    fontSize: '19px',
                    fontWeight: 600,
                    color: '#14171D',
                  }}
                >
                  Live Multi-Role System Inspector
                </span>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: '#E3F5EE',
                    color: '#0E7C5B',
                    fontSize: '10.5px',
                    fontWeight: 700,
                  }}
                >
                  ● Live Real-Time Viewport
                </span>
              </div>
              <div style={{ fontSize: '11.5px', color: '#5A6065' }}>
                Halaman khusus Superadmin untuk menginspeksi & mengoperasikan langsung role{' '}
                <strong>Admin</strong>, <strong>Kasir POS</strong>, dan <strong>Kitchen KDS</strong> secara terpisah dari CRM.
              </div>
            </div>
          </div>

          {/* Center: 3 Role Switcher Pills */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#EBEAE2',
              padding: '4px',
              borderRadius: '999px',
              border: '1px solid rgba(20, 23, 29, 0.08)',
              flexWrap: 'wrap',
            }}
          >
            {ROLE_VIEWPORTS.map((role) => {
              const active = activeRole === role.id;
              return (
                <button
                  key={role.id}
                  onClick={() => handleSelectRole(role)}
                  style={{
                    padding: '7px 15px',
                    borderRadius: '999px',
                    border: 'none',
                    background: active ? '#161920' : 'transparent',
                    color: active ? '#FFFFFF' : '#5A6065',
                    fontSize: '12px',
                    fontWeight: active ? 700 : 600,
                    cursor: 'pointer',
                    transition: 'all 0.16s ease',
                  }}
                >
                  {role.label}
                </button>
              );
            })}
          </div>

          {/* Right: Tenant Context Selector & Open Fullscreen */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <select
              value={selectedTenant}
              onChange={(e) => {
                setSelectedTenant(e.target.value);
                setReloadKey((k) => k + 1);
              }}
              style={{
                padding: '7px 12px',
                borderRadius: '999px',
                border: '1px solid rgba(20, 23, 29, 0.14)',
                background: '#FFFFFF',
                color: '#14171D',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {tenants.length > 0 ? (
                tenants.map((t) => (
                  <option key={t.id} value={t.name}>
                    🏪 Tenant: {t.name} ({t.plan_code?.toUpperCase()})
                  </option>
                ))
              ) : (
                <>
                  <option value="Santapos Resto HQ">🏪 Tenant: Santapos Resto HQ</option>
                  <option value="Ember & Oak Flagship">🏪 Tenant: Ember & Oak Flagship</option>
                  <option value="Ramen Ya! Grand Indonesia">🏪 Tenant: Ramen Ya! GI</option>
                </>
              )}
            </select>

            <button
              onClick={() => setReloadKey((k) => k + 1)}
              title="Refresh Role Viewport"
              style={{
                padding: '7px 12px',
                borderRadius: '999px',
                border: '1px solid rgba(20, 23, 29, 0.12)',
                background: '#FFFFFF',
                color: '#14171D',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              ↻ Reload
            </button>

            <Link
              href={activePath}
              style={{
                padding: '7px 14px',
                borderRadius: '999px',
                background: '#0E7C5B',
                color: '#FFFFFF',
                textDecoration: 'none',
                fontSize: '12px',
                fontWeight: 700,
              }}
            >
              Buka Fullscreen ({activePath}) ↗
            </Link>
          </div>
        </div>

        {/* Sub-route Navigation Bar for Active Role */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            paddingTop: '4px',
            borderTop: '1px dashed rgba(20, 23, 29, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#8C9196',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Sub-Halaman {activeRole.toUpperCase()}:
            </span>
            {currentRoleObj.subRoutes.map((sr) => {
              const isCurrent = activePath === sr.path;
              return (
                <button
                  key={sr.path}
                  onClick={() => setActivePath(sr.path)}
                  style={{
                    padding: '4px 12px',
                    borderRadius: '999px',
                    border: isCurrent
                      ? '1px solid #0E7C5B'
                      : '1px solid rgba(20, 23, 29, 0.1)',
                    background: isCurrent ? '#E3F5EE' : '#FFFFFF',
                    color: isCurrent ? '#0E7C5B' : '#14171D',
                    fontSize: '11.5px',
                    fontWeight: isCurrent ? 700 : 500,
                    cursor: 'pointer',
                  }}
                >
                  {sr.label} ({sr.path})
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11.5px', color: '#5A6065' }}>
              {currentRoleObj.description}
            </span>
            <div
              style={{
                display: 'inline-flex',
                background: '#EBEAE2',
                borderRadius: '999px',
                padding: '2px',
              }}
            >
              {[
                { label: 'Desktop 100%', val: '100%' },
                { label: 'Tablet POS 1024px', val: '1024px' },
              ].map((sz) => (
                <button
                  key={sz.val}
                  onClick={() => setDeviceSize(sz.val)}
                  style={{
                    padding: '3px 10px',
                    borderRadius: '999px',
                    border: 'none',
                    background: deviceSize === sz.val ? '#FFFFFF' : 'transparent',
                    color: '#14171D',
                    fontSize: '10.5px',
                    fontWeight: deviceSize === sz.val ? 700 : 500,
                    cursor: 'pointer',
                  }}
                >
                  {sz.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* LIVE INTERACTIVE ROLE VIEWPORT CONTAINER */}
      <div
        style={{
          flex: 1,
          padding: '16px 24px 24px 24px',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: deviceSize,
            maxWidth: '100%',
            height: 'calc(100vh - 138px)',
            background: '#0B111E',
            borderRadius: '20px',
            overflow: 'hidden',
            border: '1px solid rgba(20, 23, 29, 0.14)',
            boxShadow: '0 20px 50px rgba(20, 23, 29, 0.14)',
            position: 'relative',
          }}
        >
          <iframe
            key={`${activePath}-${reloadKey}`}
            src={activePath}
            title={`Live Role Viewport - ${activePath}`}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              display: 'block',
            }}
          />
        </div>
      </div>
    </div>
  );
}

