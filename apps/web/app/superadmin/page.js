'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  getSuperadminStats,
  getSuperadminTenants,
  updateSuperadminTenantPlan,
  updateSuperadminTenantStatus,
} from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import DatabaseSettingsPanel from '@/components/superadmin/DatabaseSettingsPanel';

const formatCurrency = (val) => `Rp ${Number(val || 0).toLocaleString('id-ID')}`;

export default function SuperadminPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('tenants'); // 'tenants' | 'database'
  const [stats, setStats] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);
  const [notification, setNotification] = useState(null);

  const isSuper = user?.role === 'superadmin';

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sRes, tRes] = await Promise.all([
        getSuperadminStats(),
        getSuperadminTenants(),
      ]);
      setStats(sRes.data?.data || null);
      setTenants(tRes.data?.data || []);
    } catch (err) {
      console.error('[superadmin fetch error]:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuper) {
      fetchData();
    }
  }, [isSuper]);

  const handlePlanChange = async (tenantId, newPlan) => {
    setActionLoading(tenantId);
    try {
      await updateSuperadminTenantPlan(tenantId, newPlan);
      setTenants((prev) =>
        prev.map((t) => (t.id === tenantId ? { ...t, plan_code: newPlan } : t))
      );
      setNotification({ type: 'success', text: `Paket tenant berhasil diubah menjadi ${newPlan.toUpperCase()}` });
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      setNotification({ type: 'error', text: err.response?.data?.message || 'Gagal mengubah paket' });
      setTimeout(() => setNotification(null), 4000);
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusToggle = async (tenantId, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    setActionLoading(tenantId);
    try {
      await updateSuperadminTenantStatus(tenantId, nextStatus);
      setTenants((prev) =>
        prev.map((t) => (t.id === tenantId ? { ...t, status: nextStatus } : t))
      );
      setNotification({ type: 'success', text: `Status tenant berhasil diubah menjadi ${nextStatus.toUpperCase()}` });
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      setNotification({ type: 'error', text: err.response?.data?.message || 'Gagal mengubah status' });
      setTimeout(() => setNotification(null), 4000);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredTenants = useMemo(() => {
    return tenants.filter((t) => {
      const q = searchQuery.toLowerCase();
      const matchQuery =
        !q ||
        t.name?.toLowerCase().includes(q) ||
        t.slug?.toLowerCase().includes(q) ||
        t.owner_email?.toLowerCase().includes(q) ||
        t.owner_name?.toLowerCase().includes(q);

      const matchPlan = planFilter === 'all' || t.plan_code === planFilter;
      const matchStatus = statusFilter === 'all' || t.status === statusFilter;

      return matchQuery && matchPlan && matchStatus;
    });
  }, [tenants, searchQuery, planFilter, statusFilter]);

  if (!isSuper) {
    return (
      <div className="min-h-screen bg-[#0D0B08] text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-2xl bg-slate-900/90 border border-amber-500/20 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center text-3xl mx-auto">
            🔒
          </div>
          <h1 className="text-xl font-bold">Akses Super Admin Terbatas</h1>
          <p className="text-slate-400 text-sm">
            Halaman ini khusus diperuntukkan bagi pengelola platform SaaS Santapos. Silakan masuk dengan akun Super Admin.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 text-sm hover:bg-slate-800 transition"
            >
              Ke Dashboard
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl bg-amber-400 text-black font-bold text-sm hover:bg-amber-300 transition"
            >
              Ganti Akun
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0B08] text-slate-100 flex flex-col selection:bg-amber-500/30 selection:text-white">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(201,168,76,0.3),rgba(0,0,0,0))]" />

      {/* Top Header */}
      <header className="relative z-10 border-b border-amber-500/10 px-6 py-4 flex items-center justify-between backdrop-blur-md bg-black/40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-700 flex items-center justify-center font-black text-black text-xl shadow-lg shadow-amber-500/20">
            S
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-wider text-amber-400 text-lg">SANTAPOS</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                SUPERADMIN PORTAL
              </span>
            </div>
            <span className="text-[10px] block text-slate-400 uppercase tracking-widest font-mono">Platform SaaS Management</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-3.5 py-1.5 rounded-xl border border-slate-700 hover:border-slate-500 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <span>🔄</span>
            <span>Refresh</span>
          </button>
          <Link
            href="/dashboard"
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            Ke Dashboard Resto
          </Link>
        </div>
      </header>

      {/* Toast Notification */}
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-xl border text-sm font-semibold shadow-2xl backdrop-blur-md ${
            notification.type === 'success'
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200'
              : 'bg-red-500/20 border-red-500/40 text-red-200'
          }`}
        >
          {notification.text}
        </motion.div>
      )}

      {/* Main Content */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('tenants')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'tenants'
                ? 'bg-amber-400 text-black shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <span>🏢 Mitra Restoran</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              activeTab === 'tenants' ? 'bg-black/20 text-black font-bold' : 'bg-slate-800 text-slate-300'
            }`}>
              {tenants.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('database')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'database'
                ? 'bg-amber-400 text-black shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <span>☁️ Koneksi Database & Cloud Storage</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          </button>
        </div>

        {/* TAB 2: DATABASE & CLOUD STORAGE SETTINGS */}
        {activeTab === 'database' && (
          <DatabaseSettingsPanel />
        )}

        {/* TAB 1: MITRA RESTORAN & STATS */}
        {activeTab === 'tenants' && (
          <div className="space-y-6">
            {/* Metric Cards Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
                <span className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Total Restoran</span>
                <div className="text-3xl font-black text-amber-400 mt-2">
                  {stats?.tenants?.total || tenants.length}
                </div>
                <div className="text-xs text-slate-500 mt-1 flex gap-2">
                  <span className="text-emerald-400">● {stats?.tenants?.active || 0} Aktif</span>
                  <span className="text-red-400">● {stats?.tenants?.suspended || 0} Suspended</span>
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
                <span className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Total Cabang / Outlet</span>
                <div className="text-3xl font-black text-emerald-400 mt-2">
                  {stats?.branches?.total || 0}
                </div>
                <span className="text-xs text-slate-500 mt-1 block">Di seluruh restoran mitra</span>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
                <span className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Distribusi Paket</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-xs font-bold text-slate-300">S: {stats?.tenants?.by_plan?.starter || 0}</span>
                  <span className="text-xs font-bold text-amber-300">P: {stats?.tenants?.by_plan?.pro || 0}</span>
                  <span className="text-xs font-bold text-emerald-300">F: {stats?.tenants?.by_plan?.franchise || 0}</span>
                </div>
                <span className="text-xs text-slate-500 mt-2 block">Starter / Pro / Franchise</span>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
                <span className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Platform GMV</span>
                <div className="text-2xl font-black text-yellow-400 mt-2 truncate">
                  {formatCurrency(stats?.platform?.total_gmv || 0)}
                </div>
                <span className="text-xs text-slate-500 mt-1 block">{stats?.platform?.total_transactions || 0} Transaksi</span>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
              <div className="flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Cari restoran, subdomain, pemilik, atau email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 focus:border-amber-400 text-white placeholder-slate-500 text-sm outline-none transition"
                />
              </div>

              <div className="flex flex-wrap gap-2 items-center">
                <select
                  value={planFilter}
                  onChange={(e) => setPlanFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-300 outline-none"
                >
                  <option value="all">Semua Paket</option>
                  <option value="starter">Starter</option>
                  <option value="pro">Pro</option>
                  <option value="franchise">Franchise</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-300 outline-none"
                >
                  <option value="all">Semua Status</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>

            {/* Tenants Table */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
                <h2 className="font-bold text-white text-base">Daftar Mitra Restoran ({filteredTenants.length})</h2>
                <Link
                  href="/onboarding"
                  target="_blank"
                  className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs transition"
                >
                  + Daftarkan Restoran Baru
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-800/60 text-slate-400 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-6">Restoran & Subdomain</th>
                      <th className="py-3 px-6">Pemilik</th>
                      <th className="py-3 px-6">Paket SaaS</th>
                      <th className="py-3 px-6 text-center">Cabang</th>
                      <th className="py-3 px-6 text-center">Pengguna</th>
                      <th className="py-3 px-6 text-center">Status</th>
                      <th className="py-3 px-6 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredTenants.map((tenant) => {
                      const isActioning = actionLoading === tenant.id;
                      return (
                        <tr key={tenant.id} className="hover:bg-slate-800/40 transition">
                          {/* Name & Subdomain */}
                          <td className="py-4 px-6">
                            <div className="font-bold text-white">{tenant.name}</div>
                            <div className="text-xs text-amber-400/90 font-mono mt-0.5">
                              {tenant.slug}.santapos.id
                            </div>
                          </td>

                          {/* Owner */}
                          <td className="py-4 px-6">
                            <div className="text-slate-200 text-xs font-semibold">{tenant.owner_name || 'Admin'}</div>
                            <div className="text-xs text-slate-400">{tenant.owner_email || '-'}</div>
                          </td>

                          {/* Plan */}
                          <td className="py-4 px-6">
                            <select
                              value={tenant.plan_code || 'starter'}
                              disabled={isActioning}
                              onChange={(e) => handlePlanChange(tenant.id, e.target.value)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border cursor-pointer outline-none ${
                                tenant.plan_code === 'franchise'
                                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                  : tenant.plan_code === 'pro'
                                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                  : 'bg-slate-700/60 text-slate-300 border-slate-600'
                              }`}
                            >
                              <option value="starter" className="bg-slate-900 text-slate-200">STARTER</option>
                              <option value="pro" className="bg-slate-900 text-amber-300">PRO</option>
                              <option value="franchise" className="bg-slate-900 text-emerald-300">FRANCHISE</option>
                            </select>
                          </td>

                          {/* Branch Count */}
                          <td className="py-4 px-6 text-center font-mono font-semibold text-slate-300">
                            {tenant.branch_count}
                          </td>

                          {/* User Count */}
                          <td className="py-4 px-6 text-center font-mono font-semibold text-slate-300">
                            {tenant.user_count}
                          </td>

                          {/* Status */}
                          <td className="py-4 px-6 text-center">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                                tenant.status === 'active'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-red-500/10 text-red-400 border border-red-500/30'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${tenant.status === 'active' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                              {tenant.status}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-6 text-right">
                            <button
                              type="button"
                              disabled={isActioning}
                              onClick={() => handleStatusToggle(tenant.id, tenant.status)}
                              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                                tenant.status === 'active'
                                  ? 'border border-red-500/30 text-red-400 hover:bg-red-500/10'
                                  : 'border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                              }`}
                            >
                              {isActioning ? '...' : tenant.status === 'active' ? 'Suspend' : 'Aktifkan'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredTenants.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-500 text-sm">
                          Tidak ada data restoran yang sesuai dengan filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
