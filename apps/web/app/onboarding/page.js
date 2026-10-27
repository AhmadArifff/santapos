'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { onboardTenant } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

const PLANS = [
  {
    code: 'starter',
    name: 'Starter UMKM',
    tagline: 'Ideal untuk kedai, kafe, atau resto 1 cabang',
    price: 'Rp 99.000',
    period: '/bulan',
    features: ['1 Outlet Cabang', 'POS Kasir Cepat', 'QR Self-Order Meja', 'Cetak Struk & Laporan Kasir'],
    badge: 'Paling Terjangkau',
    highlight: false,
  },
  {
    code: 'pro',
    name: 'Pro Resto',
    tagline: 'Bisnis berkembang dengan manajemen stok & voucher',
    price: 'Rp 249.000',
    period: '/bulan',
    features: ['Hingga 3 Cabang', 'Manajemen Stok Gudang (HPP)', 'Voucher & Review Rewards', 'AI Assistant Bisnis', 'Export PDF Laporan'],
    badge: 'Paling Populer',
    highlight: true,
  },
  {
    code: 'franchise',
    name: 'Franchise Enterprise',
    tagline: 'Jaringan cabang nasional dengan kantor pusat',
    price: 'Rp 599.000',
    period: '/bulan',
    features: ['Cabang Tanpa Batas', 'Dashboard Franchise HQ', 'Transfer Stok Antar-Cabang', 'Role Granular (Pusat/Cabang)', 'Dukungan Prioritas 24/7'],
    badge: 'Multi-Cabang',
    highlight: false,
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    restaurant_name: '',
    slug: '',
    owner_name: '',
    phone: '',
    owner_email: '',
    password: '',
    plan_code: 'pro',
    branch_name: 'Cabang Utama',
    branch_address: '',
    table_count: 10,
    first_category_name: 'Makanan & Minuman',
    first_product_name: 'Menu Rekomendasi',
    first_product_price: 25000,
  });

  const updateField = (key, val) => {
    setFormData((prev) => {
      const next = { ...prev, [key]: val };
      if (key === 'restaurant_name' && !prev.slugManuallyEdited) {
        next.slug = val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
      }
      return next;
    });
  };

  const handleNext = () => {
    setErrorMsg('');
    if (step === 1) {
      if (!formData.restaurant_name.trim()) return setErrorMsg('Nama restoran wajib diisi');
      if (!formData.owner_name.trim()) return setErrorMsg('Nama pemilik wajib diisi');
      if (!formData.owner_email.trim() || !formData.owner_email.includes('@')) return setErrorMsg('Email tidak valid');
      if (!formData.password || formData.password.length < 6) return setErrorMsg('Password minimal 6 karakter');
    }
    setStep((prev) => Math.min(prev + 1, 5));
  };

  const handleBack = () => {
    setErrorMsg('');
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await onboardTenant(formData);
      if (res.data?.token) {
        localStorage.setItem('token', res.data.token);
        if (res.data.user) {
          useAuthStore.getState().setUser?.(res.data.user);
        }
        router.push('/dashboard?onboarded=true');
      } else {
        router.push('/login?registered=true');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Gagal melakukan pendaftaran');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0B08] text-slate-100 flex flex-col justify-between selection:bg-[#C9A84C]/30 selection:text-white">
      {/* Background radial glow */}
      <div className="fixed inset-0 pointer-events-none opacity-30 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(201,168,76,0.25),rgba(0,0,0,0))]" />

      {/* Top Header */}
      <header className="relative z-10 border-b border-amber-500/10 px-6 py-4 flex items-center justify-between backdrop-blur-md bg-black/30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-700 flex items-center justify-center font-black text-black text-xl shadow-lg shadow-amber-500/20">
            S
          </div>
          <div>
            <span className="font-extrabold tracking-wider text-amber-400 text-lg">SANTAPOS</span>
            <span className="text-[10px] block text-slate-400 uppercase tracking-widest font-mono">Restaurant SaaS Platform</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <span className="text-slate-400 hidden sm:inline">Sudah memiliki restoran di Santapos?</span>
          <Link
            href="/login"
            className="px-3.5 py-1.5 rounded-lg border border-amber-500/30 text-amber-300 hover:bg-amber-500/10 transition"
          >
            Masuk ke Akun
          </Link>
        </div>
      </header>

      {/* Main Wizard Container */}
      <main className="relative z-10 flex-1 max-w-4xl mx-auto w-full px-4 py-8 flex flex-col justify-center">
        {/* Progress Bar & Steps */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            {[
              { num: 1, label: 'Profil Resto' },
              { num: 2, label: 'Pilih Paket' },
              { num: 3, label: 'Cabang & Meja' },
              { num: 4, label: 'Menu Awal' },
              { num: 5, label: 'Aktivasi' },
            ].map((s) => (
              <div key={s.num} className="flex flex-col items-center flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                    step >= s.num
                      ? 'bg-amber-400 text-black shadow-md shadow-amber-500/30 scale-105'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {s.num}
                </div>
                <span className={`text-[11px] mt-1 hidden sm:block ${step >= s.num ? 'text-amber-400 font-semibold' : 'text-slate-500'}`}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
            <div
              className="bg-gradient-to-r from-amber-500 to-amber-300 h-full transition-all duration-500 ease-out"
              style={{ width: `${((step - 1) / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Wizard Card */}
        <div className="bg-slate-900/90 border border-amber-500/20 rounded-2xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-center gap-3"
            >
              <span className="text-lg">⚠️</span>
              <span>{errorMsg}</span>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {/* STEP 1: Profil Resto */}
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">Daftarkan Restoran Anda</h2>
                  <p className="text-slate-400 text-sm mt-1">Mulai gunakan Santapos dalam hitungan menit untuk kasir & QR Self-Order.</p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 pt-2">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Nama Restoran / Brand *
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Kebab Barokah, Cafe Kopi Senja"
                      value={formData.restaurant_name}
                      onChange={(e) => updateField('restaurant_name', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 focus:border-amber-400 text-white placeholder-slate-500 text-sm outline-none transition"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Subdomain Toko (Self-Order Meja)
                    </label>
                    <div className="flex items-center rounded-xl bg-slate-800/80 border border-slate-700 overflow-hidden text-sm">
                      <span className="px-3 text-slate-500">https://</span>
                      <input
                        type="text"
                        placeholder="namaresto"
                        value={formData.slug}
                        onChange={(e) => {
                          setFormData((prev) => ({ ...prev, slugManuallyEdited: true }));
                          updateField('slug', e.target.value);
                        }}
                        className="flex-1 py-2.5 bg-transparent text-amber-300 font-mono outline-none"
                      />
                      <span className="px-3 text-slate-500">.santapos.id</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Nama Pemilik *
                    </label>
                    <input
                      type="text"
                      placeholder="Budi Santoso"
                      value={formData.owner_name}
                      onChange={(e) => updateField('owner_name', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 focus:border-amber-400 text-white placeholder-slate-500 text-sm outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      No. WhatsApp
                    </label>
                    <input
                      type="tel"
                      placeholder="081234567890"
                      value={formData.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 focus:border-amber-400 text-white placeholder-slate-500 text-sm outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Email Login Pemilik *
                    </label>
                    <input
                      type="email"
                      placeholder="owner@restoran.com"
                      value={formData.owner_email}
                      onChange={(e) => updateField('owner_email', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 focus:border-amber-400 text-white placeholder-slate-500 text-sm outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Password Login *
                    </label>
                    <input
                      type="password"
                      placeholder="Minimal 6 karakter"
                      value={formData.password}
                      onChange={(e) => updateField('password', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 focus:border-amber-400 text-white placeholder-slate-500 text-sm outline-none transition"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Pilih Paket SaaS */}
            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">Pilih Paket SaaS Santapos</h2>
                  <p className="text-slate-400 text-sm mt-1">Dapat di-upgrade atau di-downgrade kapan saja dari panel admin.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-4 pt-2">
                  {PLANS.map((plan) => {
                    const isSelected = formData.plan_code === plan.code;
                    return (
                      <div
                        key={plan.code}
                        onClick={() => updateField('plan_code', plan.code)}
                        className={`cursor-pointer rounded-2xl p-5 border transition-all duration-200 flex flex-col justify-between ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-400 shadow-xl shadow-amber-500/10 ring-1 ring-amber-400'
                            : 'bg-slate-800/60 border-slate-700/80 hover:border-slate-600'
                        }`}
                      >
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                              {plan.badge}
                            </span>
                            {isSelected && <span className="text-amber-400 text-sm font-bold">✓ Terpilih</span>}
                          </div>
                          <h3 className="font-bold text-lg text-white">{plan.name}</h3>
                          <p className="text-slate-400 text-xs mt-1 mb-4">{plan.tagline}</p>
                          <div className="text-2xl font-extrabold text-amber-400 mb-4">
                            {plan.price}
                            <span className="text-xs font-normal text-slate-400">{plan.period}</span>
                          </div>
                          <ul className="space-y-2 text-xs text-slate-300 border-t border-slate-700/60 pt-3">
                            {plan.features.map((f, i) => (
                              <li key={i} className="flex items-center gap-2">
                                <span className="text-emerald-400 text-sm">✓</span>
                                <span>{f}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* STEP 3: Setup Cabang & Meja */}
            {step === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">Konfigurasi Outlet & Meja</h2>
                  <p className="text-slate-400 text-sm mt-1">Santapos otomatis membuatkan QR Token unik untuk setiap meja pelanggan Anda.</p>
                </div>

                <div className="space-y-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Nama Outlet / Cabang Utama *
                    </label>
                    <input
                      type="text"
                      value={formData.branch_name}
                      onChange={(e) => updateField('branch_name', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 focus:border-amber-400 text-white text-sm outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Alamat Outlet
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Jl. Riau No. 45, Bandung"
                      value={formData.branch_address}
                      onChange={(e) => updateField('branch_address', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 focus:border-amber-400 text-white placeholder-slate-500 text-sm outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      Jumlah Meja Self-Order (QR Meja Otomatis Dibuat)
                    </label>
                    <div className="grid grid-cols-4 gap-3">
                      {[5, 10, 15, 20].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => updateField('table_count', num)}
                          className={`py-3 rounded-xl border font-bold text-sm transition ${
                            formData.table_count === num
                              ? 'bg-amber-400 text-black border-amber-400 shadow-md'
                              : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:border-slate-500'
                          }`}
                        >
                          {num} Meja
                        </button>
                      ))}
                    </div>
                    <p className="text-slate-400 text-xs mt-2">
                      Sistem akan membuat meja mulai dari Meja 01 s.d Meja {String(formData.table_count).padStart(2, '0')} yang siap dicetak QR-nya.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 4: Menu Pertama */}
            {step === 4 && (
              <motion.div
                key="step-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">Kategori & Menu Pertama</h2>
                  <p className="text-slate-400 text-sm mt-1">Masukkan 1 produk pertama Anda. Anda dapat menambahkan ratusan menu lain di Dashboard.</p>
                </div>

                <div className="space-y-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Nama Kategori Pertama
                    </label>
                    <input
                      type="text"
                      placeholder="Makanan Utama, Minuman Dingin, Snack"
                      value={formData.first_category_name}
                      onChange={(e) => updateField('first_category_name', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 focus:border-amber-400 text-white text-sm outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Nama Produk Pertama
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Kebab Daging Sapi Special"
                      value={formData.first_product_name}
                      onChange={(e) => updateField('first_product_name', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 focus:border-amber-400 text-white text-sm outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Harga Jual (Rp)
                    </label>
                    <input
                      type="number"
                      placeholder="25000"
                      value={formData.first_product_price}
                      onChange={(e) => updateField('first_product_price', Number(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 focus:border-amber-400 text-white text-sm outline-none transition"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 5: Konfirmasi & Aktivasi */}
            {step === 5 && (
              <motion.div
                key="step-5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">Siap Meluncurkan Restoran Anda!</h2>
                  <p className="text-slate-400 text-sm mt-1">Periksa kembali ringkasan pengaturan sebelum mengaktifkan akun Santapos.</p>
                </div>

                <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700 space-y-3 text-sm">
                  <div className="flex justify-between border-b border-slate-700/60 pb-2">
                    <span className="text-slate-400">Restoran</span>
                    <span className="font-bold text-white">{formData.restaurant_name}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-700/60 pb-2">
                    <span className="text-slate-400">Subdomain QR Meja</span>
                    <span className="font-mono text-amber-300">https://{formData.slug}.santapos.id</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-700/60 pb-2">
                    <span className="text-slate-400">Paket Terpilih</span>
                    <span className="font-bold text-amber-400 uppercase tracking-wider">{formData.plan_code}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-700/60 pb-2">
                    <span className="text-slate-400">Cabang Pertama</span>
                    <span className="text-white">{formData.branch_name} ({formData.table_count} Meja Aktif)</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-700/60 pb-2">
                    <span className="text-slate-400">Pemilik & Email</span>
                    <span className="text-white">{formData.owner_name} ({formData.owner_email})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Menu Awal</span>
                    <span className="text-white">{formData.first_product_name} (Rp {Number(formData.first_product_price).toLocaleString('id-ID')})</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200">
                  💡 Setelah aktivasi, Anda akan langsung diarahkan ke Dashboard Kasir & Admin Restoran Anda.
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Navigation Buttons */}
          <div className="flex items-center justify-between border-t border-slate-800 pt-6 mt-8">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                disabled={loading}
                className="px-5 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-sm font-semibold transition"
              >
                ← Kembali
              </button>
            ) : (
              <div />
            )}

            {step < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-black font-bold text-sm shadow-lg shadow-amber-500/20 transition"
              >
                Lanjutkan →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-600 hover:from-emerald-300 hover:to-emerald-500 text-black font-extrabold text-sm shadow-xl shadow-emerald-500/20 transition flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="animate-spin text-lg">⏳</span>
                    <span>Menyiapkan Restoran...</span>
                  </>
                ) : (
                  <>
                    <span>Aktivasi Restoran Sekarang 🚀</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-4 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} Santapos SaaS Platform · All Rights Reserved
      </footer>
    </div>
  );
}
