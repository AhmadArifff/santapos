'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { getSuperadminTenants } from '@/lib/api';

const ROLE_VIEWPORTS = [
  {
    id: 'kitchen',
    label: '🍳 Kitchen KDS',
    badge: 'Tavola Kanban + Floor Plan',
    defaultPath: '/kitchen',
    description:
      'Tampilan langsung Kitchen Display System: Kanban pesanan realtime, timer durasi memasak, dan alert tiket terlambat.',
    subRoutes: [
      { label: 'Kitchen Board & Tiket Dapur', path: '/kitchen' },
    ],
  },
  {
    id: 'kasir',
    label: '💳 Kasir POS',
    badge: 'Fast POS + QRIS Ready',
    defaultPath: '/pos',
    description:
      'Tampilan langsung Kasir POS: Katalog menu cepat, kalkulasi subtotal otomatis, cetak thermal, dan audit riwayat transaksi.',
    subRoutes: [
      { label: 'Terminal Kasir POS', path: '/pos' },
      { label: 'Riwayat Transaksi & Void', path: '/pos/history' },
      { label: 'Pesanan Tamu QR Meja', path: '/customer-orders' },
    ],
  },
  {
    id: 'admin',
    label: '🛡️ Admin Backoffice',
    badge: 'Full Restaurant Admin',
    defaultPath: '/dashboard',
    description:
      'Tampilan langsung Backoffice Restoran: Ringkasan omzet, manajemen menu, stok HPP, laporan keuangan, dan staf shift.',
    subRoutes: [
      { label: 'Dashboard Omzet', path: '/dashboard' },
      { label: 'Menu & Produk', path: '/products' },
      { label: 'Stok Bahan & HPP', path: '/stock' },
      { label: 'Laporan & Ekspor', path: '/reports' },
      { label: 'Voucher & Diskon', path: '/discounts' },
      { label: 'Metode Pembayaran', path: '/payment' },
      { label: 'Manajemen Staf', path: '/users' },
      { label: 'AI Business Chat', path: '/admin/ai-chat' },
    ],
  },
  {
    id: 'customer',
    label: '📱 Tamu QR Meja',
    badge: 'Self-Order & Onboarding',
    defaultPath: '/order',
    description:
      'Tampilan langsung layar tamu restoran saat memindai QR code di meja untuk memesan makanan mandiri.',
    subRoutes: [
      { label: 'Portal Menu Tamu', path: '/order' },
      { label: 'Wizard Onboarding Baru', path: '/onboarding' },
    ],
  },
];

const DEVICE_SIZES = [
  { id: 'desktop', label: '🖥️ Desktop 100%', val: '100%', hint: 'Full Wide Screen' },
  { id: 'tablet', label: '📱 Tablet POS 1024px', val: '1024px', hint: 'iPad / Android Tablet' },
  { id: 'mobile', label: '📲 Mobile 420px', val: '420px', hint: 'Smartphone QR Guest' },
];

export default function SuperadminRoleInspectorPage() {
  const [activeRole, setActiveRole] = useState('kitchen');
  const [activePath, setActivePath] = useState('/kitchen');
  const [tenants, setTenants] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState('Santapos Resto HQ (Default)');
  const [deviceSize, setDeviceSize] = useState('100%');
  const [reloadKey, setReloadKey] = useState(0);
  const [isReloading, setIsReloading] = useState(false);

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

  const handleReload = () => {
    setIsReloading(true);
    setReloadKey((k) => k + 1);
    setTimeout(() => setIsReloading(false), 500);
  };

  return (
    <div className="min-h-screen bg-[#F5F4EE] text-[#14171D] flex flex-col font-sans selection:bg-amber-400/30 selection:text-black">
      {/* Background radial subtle ambient */}
      <div
        className="fixed inset-0 pointer-events-none opacity-60"
        style={{
          backgroundImage:
            'radial-gradient(circle at 12% 8%, rgba(212, 238, 226, 0.7) 0%, rgba(245, 244, 238, 0) 50%)',
        }}
      />

      {/* TOP CONTROL BAR FOR LIVE MULTI-ROLE INSPECTOR */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-black/10 px-5 py-3 flex flex-col gap-2.5 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-3.5">
          {/* Left: Back to Superadmin CRM + Title */}
          <div className="flex items-center gap-3.5">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link
                href="/superadmin"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#161920] text-white text-xs font-bold hover:bg-black transition shadow-sm"
              >
                <span>←</span>
                <span>Kembali ke CRM</span>
              </Link>
            </motion.div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-lg font-bold text-[#14171D] tracking-tight">
                  Live Multi-Role Inspector
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10.5px] font-bold border border-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Viewport
                </span>
              </div>
              <div className="text-[11px] text-[#5A6065]">
                Inspeksi & operasikan langsung modul <strong>Kitchen</strong>, <strong>Kasir</strong>, <strong>Admin</strong>, dan <strong>Tamu QR</strong> secara realtime.
              </div>
            </div>
          </div>

          {/* Center: Role Switcher Pills */}
          <div className="flex items-center gap-1.5 bg-[#EBEAE2] p-1 rounded-full border border-black/10 shadow-inner flex-wrap">
            {ROLE_VIEWPORTS.map((role) => {
              const active = activeRole === role.id;
              return (
                <motion.button
                  key={role.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelectRole(role)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                    active
                      ? 'bg-[#161920] text-white shadow-sm'
                      : 'text-[#5A6065] hover:text-black hover:bg-black/5'
                  }`}
                >
                  <span>{role.label}</span>
                </motion.button>
              );
            })}
          </div>

          {/* Right: Tenant Context Selector, Device Size & Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedTenant}
              onChange={(e) => {
                setSelectedTenant(e.target.value);
                handleReload();
              }}
              className="px-3 py-1.5 rounded-full border border-black/15 bg-white text-[#14171D] text-xs font-semibold cursor-pointer outline-none hover:border-black/30 transition shadow-sm"
            >
              {tenants.length > 0 ? (
                tenants.map((t) => (
                  <option key={t.id} value={t.name}>
                    🏪 Tenant: {t.name} ({t.plan_code?.toUpperCase()})
                  </option>
                ))
              ) : (
                <>
                  <option value="Santapos Resto HQ">🏪 Tenant: Santapos Resto HQ (PRO)</option>
                  <option value="Ember & Oak Flagship">🏪 Tenant: Ember & Oak (FRANCHISE)</option>
                  <option value="Ramen Ya! Grand Indonesia">🏪 Tenant: Ramen Ya! GI (FRANCHISE)</option>
                </>
              )}
            </select>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleReload}
              title="Refresh Viewport"
              className="px-3 py-1.5 rounded-full border border-black/15 bg-white text-[#14171D] text-xs font-bold cursor-pointer hover:bg-black/5 transition shadow-sm flex items-center gap-1"
            >
              <span className={`text-xs ${isReloading ? 'animate-spin' : ''}`}>↻</span>
              <span>Reload</span>
            </motion.button>

            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link
                href={activePath}
                target="_blank"
                className="px-3.5 py-1.5 rounded-full bg-[#0E7C5B] text-white text-xs font-bold hover:bg-[#0b6348] transition shadow-sm inline-flex items-center gap-1"
              >
                <span>Fullscreen</span>
                <span>↗</span>
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Sub-route Navigation & Device Size Selector */}
        <div className="flex items-center justify-between flex-wrap gap-2.5 pt-2 border-t border-dashed border-black/10">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10.5px] font-bold text-[#8C9196] uppercase tracking-wider">
              Sub-Route {activeRole.toUpperCase()}:
            </span>
            {currentRoleObj.subRoutes.map((sr) => {
              const isCurrent = activePath === sr.path;
              return (
                <motion.button
                  key={sr.path}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setActivePath(sr.path)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                    isCurrent
                      ? 'border border-[#0E7C5B] bg-[#E3F5EE] text-[#0E7C5B] font-bold shadow-xs'
                      : 'border border-black/10 bg-white text-[#14171D] hover:bg-black/5'
                  }`}
                >
                  {sr.label}
                </motion.button>
              );
            })}
          </div>

          {/* Device Size Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#5A6065] hidden md:inline">
              Ukuran Layar:
            </span>
            <div className="inline-flex bg-[#EBEAE2] rounded-full p-0.5 border border-black/10">
              {DEVICE_SIZES.map((sz) => {
                const isSelected = deviceSize === sz.val;
                return (
                  <motion.button
                    key={sz.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setDeviceSize(sz.val)}
                    title={sz.hint}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition ${
                      isSelected
                        ? 'bg-white text-black shadow-xs'
                        : 'text-[#5A6065] hover:text-black'
                    }`}
                  >
                    {sz.label}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      {/* LIVE INTERACTIVE ROLE VIEWPORT CONTAINER */}
      <main className="flex-1 p-4 md:p-6 flex flex-col items-center justify-start relative z-10">
        <div
          className="transition-all duration-300 ease-out flex flex-col items-center"
          style={{
            width: deviceSize,
            maxWidth: '100%',
          }}
        >
          {/* Mockup Header Bar if Mobile or Tablet */}
          {deviceSize !== '100%' && (
            <div className="w-full bg-[#1A1D24] text-slate-300 px-4 py-2 rounded-t-2xl flex items-center justify-between text-xs border border-b-0 border-black/20 shadow-md">
              <div className="flex items-center gap-2 font-mono text-[11px]">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="ml-2 font-sans font-semibold text-white">
                  {deviceSize === '420px' ? 'iPhone Smartphone (QR Self-Order)' : 'iPad Tablet (POS Kasir)'}
                </span>
              </div>
              <span className="text-[10.5px] text-slate-400 font-mono">
                {activePath}
              </span>
            </div>
          )}

          {/* Live Viewport iFrame */}
          <div
            className={`w-full overflow-hidden border border-black/15 shadow-2xl relative bg-[#0D0B08] ${
              deviceSize !== '100%' ? 'rounded-b-2xl' : 'rounded-2xl'
            }`}
            style={{
              height: deviceSize !== '100%' ? 'calc(100vh - 180px)' : 'calc(100vh - 145px)',
              minHeight: '620px',
            }}
          >
            <iframe
              key={`${activePath}-${reloadKey}`}
              src={activePath}
              title={`Live Role Viewport - ${activePath}`}
              className="w-full h-full border-none block"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
