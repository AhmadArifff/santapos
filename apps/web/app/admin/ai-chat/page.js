'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import AdminLayout from '@/components/layout/AdminLayout';
import AuthGuard from '@/components/ui/AuthGuard';
import AIChatBox from '@/components/admin/AIChatBox';
import { checkAIChatHealth } from '@/lib/api';

/**
 * AI Chat Admin Page
 * Admin-only page untuk konsultasi dengan AI tentang data operasional & bisnis
 */
export default function AIChatPage() {
  useEffect(() => {
    // Optional: Check AI service health
    checkAIChatHealth()
      .then(() => console.log('AI Chat service is ready'))
      .catch(() => console.log('AI Chat service might be unavailable'));
  }, []);

  return (
    <AuthGuard requiredRole="admin">
      <AdminLayout>
        <div className="space-y-6">
          {/* Page Header */}
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-400">Intelligent Assistant</p>
            <h1 className="mt-2 text-3xl font-black text-white">AI Business Analyst</h1>
            <p className="mt-2 text-sm text-slate-400">
              Tanya AI tentang tren penjualan real-time, evaluasi stok bahan baku, estimasi margin HPP, dan analisis performa tim outlet.
            </p>
          </div>

          {/* Main Chat Container */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Chat Box - Main */}
            <div className="h-[600px] lg:col-span-2">
              <AIChatBox />
            </div>

            {/* Info Sidebar */}
            <div className="space-y-4">
              {/* Features Info */}
              <motion.div
                whileHover={{ y: -3, scale: 1.015 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                className="murmura-card-vibrate rounded-2xl border border-sky-500/25 bg-slate-900/80 p-5 shadow-lg backdrop-blur-sm transition-all duration-300 hover:border-sky-500/50"
              >
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-xl">📊</span>
                  <h3 className="text-sm font-black tracking-wide text-sky-300">Fitur AI Chat</h3>
                </div>
                <ul className="space-y-2 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <span className="font-bold text-sky-400">✓</span> Analisis penjualan real-time
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="font-bold text-sky-400">✓</span> Perhitungan profit & estimasi HPP
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="font-bold text-sky-400">✓</span> Status stok kritis & reorder
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="font-bold text-sky-400">✓</span> Performa produk menu terlaris
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="font-bold text-sky-400">✓</span> Komparasi omzet antar periode
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="font-bold text-sky-400">✓</span> Insight produktivitas tim kasir
                  </li>
                </ul>
              </motion.div>

              {/* Tips */}
              <motion.div
                whileHover={{ y: -3, scale: 1.015 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                className="murmura-card-vibrate rounded-2xl border border-amber-500/25 bg-slate-900/80 p-5 shadow-lg backdrop-blur-sm transition-all duration-300 hover:border-amber-500/50"
              >
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-xl">💡</span>
                  <h3 className="text-sm font-black tracking-wide text-amber-300">Tips Prompt Efektif</h3>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-300">
                  <li className="rounded-xl border border-slate-800 bg-slate-950/60 p-2.5">
                    <p className="font-black text-amber-200">Spesifik & Kontekstual</p>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      "Revenue bulan ini dibanding bulan lalu" lebih terarah daripada sekadar "berapa omzet".
                    </p>
                  </li>
                  <li className="rounded-xl border border-slate-800 bg-slate-950/60 p-2.5">
                    <p className="font-black text-amber-200">Rentang Waktu Pasti</p>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      "Penjualan 7 hari terakhir di kasir aktif".
                    </p>
                  </li>
                  <li className="rounded-xl border border-slate-800 bg-slate-950/60 p-2.5">
                    <p className="font-black text-amber-200">Rekomendasi Tindakan</p>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      "Menu mana yang marginnya tinggi tapi penjualannya lambat?".
                    </p>
                  </li>
                </ul>
              </motion.div>

              {/* Data Available */}
              <motion.div
                whileHover={{ y: -3, scale: 1.015 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                className="murmura-card-vibrate rounded-2xl border border-emerald-500/25 bg-slate-900/80 p-5 shadow-lg backdrop-blur-sm transition-all duration-300 hover:border-emerald-500/50"
              >
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-xl">📈</span>
                  <h3 className="text-sm font-black tracking-wide text-emerald-300">Cakupan Data Terhubung</h3>
                </div>
                <div className="flex flex-wrap gap-1.5 text-xs">
                  {['Transaksi POS', 'Menu & Kategori', 'Stok & Gudang', 'Resep & Bahan Baku', 'Metrik Finansial', 'Aktivitas Kasir'].map((tag) => (
                    <span
                      key={tag}
                      className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>

          {/* Developer Info - Only in dev mode */}
          {process.env.NODE_ENV === 'development' && (
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-xs font-mono text-slate-400">
              <p>
                Engine Backend: <code className="text-orange-300">POST /api/ai-chat/query</code> (Powered by OpenRouter Multi-Model)
              </p>
            </div>
          )}
        </div>
      </AdminLayout>
    </AuthGuard>
  );
}
