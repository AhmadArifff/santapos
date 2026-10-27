'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getFranchiseHqReport } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

const formatCurrency = (val) => `Rp ${Number(val || 0).toLocaleString('id-ID')}`;

export default function FranchiseHqOverview() {
  const { user } = useAuthStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isFranchisePlan = user?.plan_code === 'franchise' || user?.role === 'superadmin';

  useEffect(() => {
    if (!isFranchisePlan) {
      setLoading(false);
      return;
    }

    const fetchHqData = async () => {
      setLoading(true);
      try {
        const res = await getFranchiseHqReport();
        setData(res.data?.data || null);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Gagal memuat data Franchise HQ');
      } finally {
        setLoading(false);
      }
    };

    fetchHqData();
  }, [isFranchisePlan]);

  // Upgrade banner if not on franchise plan
  if (!isFranchisePlan) {
    return (
      <div className="rounded-2xl p-8 bg-gradient-to-br from-amber-500/10 via-slate-900 to-black border border-amber-500/30 text-center space-y-4 shadow-xl">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center text-3xl mx-auto border border-amber-500/30">
          🏢
        </div>
        <div className="max-w-xl mx-auto">
          <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase tracking-wider">
            Fitur Paket Franchise
          </span>
          <h3 className="text-2xl font-bold text-white mt-3">Konsolidasi Multi-Cabang & Kantor Pusat HQ</h3>
          <p className="text-slate-400 text-sm mt-2">
            Pantau performa penjualan seluruh cabang restoran Anda dalam 1 layar terpadu, lacak cabang terlaris, dan bandingkan kontribusi omzet antar-outlet secara real-time.
          </p>
        </div>

        <div className="pt-2 flex justify-center gap-4">
          <Link
            href="/onboarding"
            target="_blank"
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-600 text-black font-bold text-sm shadow-lg shadow-amber-500/20 hover:from-amber-300 hover:to-amber-500 transition"
          >
            Upgrade ke Paket Franchise
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 text-sm">
        <span className="inline-block animate-spin mr-2">⏳</span>
        Memuat data konsolidasi seluruh cabang...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
        {error}
      </div>
    );
  }

  const summary = data?.summary || {};
  const branches = data?.branches || [];
  const topProducts = data?.top_products || [];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5 rounded-2xl bg-slate-900/90 border border-amber-500/20">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-white">Kantor Pusat (HQ) — Konsolidasi Multi-Cabang</h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
              Franchise Mode
            </span>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Data agregat transaksi dan omzet dari seluruh cabang aktif restoran Anda.
          </p>
        </div>
        <div className="text-xs text-amber-300 font-mono bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20">
          🏢 {summary.total_branches || branches.length} Outlet Terhubung
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
          <span className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Total Omzet Lintas Cabang</span>
          <div className="text-2xl sm:text-3xl font-black text-amber-400 mt-2 truncate">
            {formatCurrency(summary.total_revenue || 0)}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">Gabungan seluruh cabang</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
          <span className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Total Transaksi</span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-2">
            {summary.total_orders || 0}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">Pesanan terlayani</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
          <span className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Rata-Rata Nilai Tiket (AOV)</span>
          <div className="text-2xl sm:text-3xl font-black text-sky-400 mt-2 truncate">
            {formatCurrency(summary.avg_ticket || 0)}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">Per transaksi</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
          <span className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Cabang Terlaris (Bintang)</span>
          <div className="text-lg font-bold text-yellow-300 mt-2 truncate">
            ⭐ {summary.top_branch?.name || '-'}
          </div>
          <span className="text-xs text-slate-400 mt-1 block truncate">
            {summary.top_branch ? formatCurrency(summary.top_branch.revenue) : '-'}
          </span>
        </div>
      </div>

      {/* Branch Performance Comparison Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800">
          <h4 className="font-bold text-white text-sm">Peringkat & Kinerja Penjualan Cabang</h4>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-800/60 text-slate-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="py-3 px-6">Nama Cabang</th>
                <th className="py-3 px-6">Alamat</th>
                <th className="py-3 px-6 text-center">Total Transaksi</th>
                <th className="py-3 px-6 text-right">Total Omzet</th>
                <th className="py-3 px-6 text-right">Rata-rata (AOV)</th>
                <th className="py-3 px-6 text-right">Kontribusi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {branches.map((b, index) => {
                const totalRev = Number(summary.total_revenue || 0);
                const contrib = totalRev > 0 ? Math.round((b.total_revenue / totalRev) * 100) : 0;
                return (
                  <tr key={b.branch_id} className="hover:bg-slate-800/40 transition">
                    <td className="py-4 px-6 font-semibold text-white flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-800 text-[10px] flex items-center justify-center font-bold text-slate-400">
                        {index + 1}
                      </span>
                      <span>{b.branch_name}</span>
                      {b.is_main ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                          Pusat
                        </span>
                      ) : null}
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-400 truncate max-w-xs">
                      {b.address || '-'}
                    </td>
                    <td className="py-4 px-6 text-center font-mono text-slate-200">
                      {b.total_orders} trx
                    </td>
                    <td className="py-4 px-6 text-right font-mono font-bold text-amber-400">
                      {formatCurrency(b.total_revenue)}
                    </td>
                    <td className="py-4 px-6 text-right font-mono text-slate-300">
                      {formatCurrency(b.avg_ticket)}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className="font-mono text-xs font-bold text-emerald-400">
                        {contrib}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top 5 Best Selling Products across Franchise */}
      {topProducts.length > 0 && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
          <h4 className="font-bold text-white text-sm mb-4">Top 5 Produk Terlaris di Seluruh Cabang</h4>
          <div className="grid sm:grid-cols-2 md:grid-cols-5 gap-3">
            {topProducts.map((p, idx) => (
              <div key={p.id} className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80">
                <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                  #{idx + 1} Terlaris
                </div>
                <div className="font-bold text-white text-sm mt-1 truncate">{p.name}</div>
                <div className="text-xs text-slate-400 mt-0.5">{p.category_name}</div>
                <div className="mt-3 flex justify-between items-baseline border-t border-slate-700/60 pt-2 text-xs">
                  <span className="text-slate-400">{p.total_sold} terjual</span>
                  <span className="font-bold text-emerald-400">{formatCurrency(p.total_sales)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
