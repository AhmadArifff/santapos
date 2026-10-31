'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';

const ROLE_CARDS = [
  {
    id: 'admin',
    badge: 'ROLE 1 · BACKOFFICE',
    title: '🛡️ Role Admin Cabang',
    subtitle: 'Manajemen menu, stok bahan baku, laporan keuangan, vocher & staf',
    accent: '#F59E0B',
    softBg: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.3)',
    links: [
      { label: '📊 Dashboard Analitik', href: '/dashboard' },
      { label: '🍔 Produk & Menu', href: '/products' },
      { label: '📈 Laporan Penjualan', href: '/reports' },
      { label: '🎟️ Vocher & Diskon', href: '/discounts' },
      { label: '💳 Metode Payment', href: '/payment' },
      { label: '👥 Tim & Jadwal Kasir', href: '/users' },
      { label: '🧾 Riwayat POS', href: '/pos/history' },
      { label: '⚙️ Pengaturan Sistem', href: '/admin/settings' },
    ],
  },
  {
    id: 'kasir',
    badge: 'ROLE 2 · FRONT OF HOUSE',
    title: '💳 Role Kasir (POS & Floor)',
    subtitle: 'Pilih menu makanan -> Pilih meja sesuai kapasitas kursi -> Bayar QRIS/Tunai',
    accent: '#38BDF8',
    softBg: 'rgba(56, 189, 248, 0.12)',
    border: 'rgba(56, 189, 248, 0.3)',
    links: [
      { label: '🖥️ Terminal Kasir POS + Floor Plan', href: '/pos' },
      { label: '🪑 Pesanan Meja QR Self-Order', href: '/admin/customer-orders' },
      { label: '📦 Stok Cabang & Request Bahan', href: '/stock' },
    ],
  },
  {
    id: 'kitchen',
    badge: 'ROLE 3 · BACK OF HOUSE',
    title: '🍳 Role Kitchen (KDS & Floor)',
    subtitle: 'Kanban 4 kolom (New, Cooking, Ready, Served) dengan Drag & Drop + Peta Meja',
    accent: '#10B981',
    softBg: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(16, 185, 129, 0.3)',
    links: [
      { label: '🔥 Kitchen Board (Tab Orders Kanban)', href: '/kitchen' },
      { label: '🗺️ Interactive Floor Plan & Waitlist', href: '/kitchen' },
    ],
  },
];

export default function UnifiedThreeRoleBanner() {
  const { user } = useAuthStore();
  // 'overview' (Admin Analytics + 3-Role Cards) | 'kasir_live' | 'kitchen_live'
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState('overview');
  const [showRoleMatrix, setShowRoleMatrix] = useState(true);

  const isSuperadmin = user?.role === 'superadmin';

  return (
    <div className="space-y-4">
      {/* TOP UNIFIED 3-ROLE COMMAND BAR */}
      <div
        className="rounded-2xl p-4 sm:p-5 border transition-all"
        style={{
          background:
            'linear-gradient(135deg, rgba(24, 32, 52, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          boxShadow: '0 14px 34px rgba(0, 0, 0, 0.35)',
        }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left Title & Context */}
          <div className="flex items-start sm:items-center gap-3.5">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 font-bold"
              style={{
                background: 'linear-gradient(135deg, #F59E0B 0%, #0E7C5B 100%)',
                color: '#FFFFFF',
                boxShadow: '0 8px 20px rgba(14, 124, 91, 0.3)',
              }}
            >
              🎛️
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-white font-black text-base sm:text-lg tracking-tight">
                  Unified 3-Role Operational Dashboard
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Admin · Kasir · Kitchen Terpadu
                </span>
              </div>
              <p className="text-slate-400 text-xs mt-0.5">
                Seluruh menu operasional <strong>Admin</strong>, <strong>Kasir POS</strong>, dan{' '}
                <strong>Kitchen KDS</strong> disatukan di halaman ini & di Sidebar kiri.
              </p>
            </div>
          </div>

          {/* Right Mode Switcher Pills + Back to Superadmin CRM */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Segmented Switcher: Admin Overview | Live Kasir POS | Live Kitchen KDS */}
            <div className="inline-flex bg-slate-900/90 p-1 rounded-xl border border-white/10 flex-wrap">
              {[
                { id: 'overview', label: '🛡️ Dashboard Admin & 3-Role' },
                { id: 'kasir_live', label: '💳 Live Kasir POS + Floor' },
                { id: 'kitchen_live', label: '🍳 Live Kitchen Orders + Floor' },
              ].map((tab) => {
                const active = activeWorkspaceTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveWorkspaceTab(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      active
                        ? 'bg-amber-400 text-slate-950 shadow-md'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setShowRoleMatrix((v) => !v)}
              className="px-3 py-2 rounded-xl text-xs font-bold border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 transition cursor-pointer"
            >
              {showRoleMatrix ? 'Sembunyikan Peta Role ⌃' : 'Tampilkan Peta 3-Role ⌄'}
            </button>

            {isSuperadmin && (
              <Link
                href="/superadmin"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold text-white transition"
                style={{
                  background: 'linear-gradient(135deg, #0E7C5B 0%, #095840 100%)',
                  boxShadow: '0 6px 18px rgba(14, 124, 91, 0.35)',
                }}
              >
                <span>👑</span>
                <span>Kembali ke Superadmin CRM</span>
                <span>↗</span>
              </Link>
            )}
          </div>
        </div>

        {/* 3-ROLE QUICK LAUNCH MATRIX (Admin, Kasir, Kitchen) */}
        {showRoleMatrix && activeWorkspaceTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-4 pt-4 border-t border-white/10">
            {ROLE_CARDS.map((role) => (
              <div
                key={role.id}
                className="rounded-xl p-3.5 flex flex-col justify-between gap-3 transition-all"
                style={{
                  background: role.softBg,
                  border: `1px solid ${role.border}`,
                }}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span
                      className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={{
                        background: 'rgba(15, 23, 42, 0.65)',
                        color: role.accent,
                      }}
                    >
                      {role.badge}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveWorkspaceTab(
                          role.id === 'kasir'
                            ? 'kasir_live'
                            : role.id === 'kitchen'
                            ? 'kitchen_live'
                            : 'overview'
                        )
                      }
                      className="text-[11px] font-bold underline cursor-pointer"
                      style={{ color: role.accent }}
                    >
                      {role.id === 'admin' ? 'Aktif di Bawah ↓' : 'Buka Live View →'}
                    </button>
                  </div>
                  <h3 className="text-white font-bold text-sm">{role.title}</h3>
                  <p className="text-slate-300/80 text-[11.5px] leading-relaxed mt-0.5">
                    {role.subtitle}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {role.links.map((lk) => (
                    <Link
                      key={lk.href + lk.label}
                      href={lk.href}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-950/70 hover:bg-slate-900 text-white border border-white/10 transition"
                    >
                      {lk.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* LIVE EMBEDDED VIEWPORT WHEN USER CLICKS "Live Kasir POS" OR "Live Kitchen Orders" */}
      {activeWorkspaceTab !== 'overview' && (
        <div className="rounded-2xl overflow-hidden border border-white/15 bg-slate-950 shadow-2xl">
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-white">
                {activeWorkspaceTab === 'kasir_live'
                  ? '💳 Mode Live Role Kasir — POS + Interactive Floor Plan Selector'
                  : '🍳 Mode Live Role Kitchen — Tavola Orders Kanban + Floor Plan'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={activeWorkspaceTab === 'kasir_live' ? '/pos' : '/kitchen'}
                className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition"
              >
                Buka Halaman Penuh ({activeWorkspaceTab === 'kasir_live' ? '/pos' : '/kitchen'}) ↗
              </Link>
              <button
                type="button"
                onClick={() => setActiveWorkspaceTab('overview')}
                className="px-3 py-1 rounded-lg text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              >
                ✕ Tutup Live View
              </button>
            </div>
          </div>
          <iframe
            src={activeWorkspaceTab === 'kasir_live' ? '/pos' : '/kitchen'}
            title="Live Role Viewport"
            style={{
              width: '100%',
              height: '78vh',
              border: 'none',
              display: 'block',
            }}
          />
        </div>
      )}
    </div>
  );
}

