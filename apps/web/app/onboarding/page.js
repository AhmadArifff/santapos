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
    features: [
      '1 Outlet Cabang',
      'POS Kasir Cepat & Responsif',
      'QR Self-Order Meja Pelanggan',
      'Cetak Struk Thermal & Laporan',
    ],
    badge: 'Paling Terjangkau',
    highlight: false,
    accentColor: 'border-slate-700 hover:border-amber-400/50',
  },
  {
    code: 'pro',
    name: 'Pro Resto',
    tagline: 'Bisnis berkembang dengan manajemen stok & voucher',
    price: 'Rp 249.000',
    period: '/bulan',
    features: [
      'Hingga 3 Cabang Outlet',
      'Manajemen Stok Gudang (HPP)',
      'Voucher & Review Rewards',
      'AI Assistant Bisnis Restoran',
      'Export PDF & Excel/CSV Laporan',
    ],
    badge: 'Paling Populer',
    highlight: true,
    accentColor: 'border-amber-500/60 shadow-amber-500/10',
  },
  {
    code: 'franchise',
    name: 'Franchise Enterprise',
    tagline: 'Jaringan cabang nasional dengan kantor pusat',
    price: 'Rp 599.000',
    period: '/bulan',
    features: [
      'Cabang Outlet Tanpa Batas',
      'Dashboard Franchise HQ Terpusat',
      'Transfer Stok Antar-Cabang',
      'Role Granular (Pusat & Cabang)',
      'Dukungan Teknis Prioritas 24/7',
    ],
    badge: 'Multi-Cabang',
    highlight: false,
    accentColor: 'border-slate-700 hover:border-amber-400/50',
  },
];

const STEPS = [
  { num: 1, label: 'Profil Resto', icon: '🏪' },
  { num: 2, label: 'Pilih Paket', icon: '💎' },
  { num: 3, label: 'Cabang & Meja', icon: '🪑' },
  { num: 4, label: 'Menu Awal', icon: '🍜' },
  { num: 5, label: 'Aktivasi', icon: '🚀' },
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
    slugManuallyEdited: false,
    owner_name: '',
    phone: '',
    owner_email: '',
    password: '',
    plan_code: 'pro',
    branch_name: 'Cabang Utama',
    branch_address: '',
    table_count: 10,
    first_category_name: 'Makanan & Minuman',
    first_product_name: 'Menu Rekomendasi Resto',
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
      if (!formData.owner_email.trim() || !formData.owner_email.includes('@')) return setErrorMsg('Email login pemilik tidak valid');
      if (!formData.password || formData.password.length < 6) return setErrorMsg('Password minimal 6 karakter');
    }
    if (step === 3) {
      if (!formData.branch_name.trim()) return setErrorMsg('Nama cabang utama wajib diisi');
    }
    if (step === 4) {
      if (!formData.first_category_name.trim()) return setErrorMsg('Nama kategori awal wajib diisi');
      if (!formData.first_product_name.trim()) return setErrorMsg('Nama produk pertama wajib diisi');
      if (!formData.first_product_price || formData.first_product_price <= 0) return setErrorMsg('Harga produk pertama wajib lebih dari 0');
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
      setErrorMsg(err.response?.data?.message || err.message || 'Gagal melakukan pendaftaran restoran. Silakan coba kembali.');
    } finally {
      setLoading(false);
    }
  };

  const selectedPlanObj = PLANS.find((p) => p.code === formData.plan_code) || PLANS[1];

  return (
    <div className="min-h-screen bg-[#0D0B08] text-slate-100 flex flex-col justify-between selection:bg-[#C9A84C]/30 selection:text-white">
      {/* Background radial glow & ambient mesh */}
      <div className="fixed inset-0 pointer-events-none opacity-25 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(201,168,76,0.22),rgba(0,0,0,0))]" />
      <div className="fixed inset-0 pointer-events-none opacity-10 bg-[radial-gradient(ellipse_50%_40%_at_80%_80%,rgba(14,124,91,0.25),rgba(0,0,0,0))]" />

      {/* Top Header */}
      <header className="relative z-10 border-b border-amber-500/10 px-6 py-4 flex items-center justify-between backdrop-blur-md bg-black/40">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 flex items-center justify-center font-black text-black text-xl shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform duration-200">
              S
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-wider text-amber-400 text-lg">SANTAPOS</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  Onboarding
                </span>
              </div>
              <span className="text-[10px] block text-slate-400 uppercase tracking-widest font-mono">
                Multi-Tenant Restaurant SaaS
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <span className="text-slate-400 hidden sm:inline">Sudah memiliki restoran di Santapos?</span>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl border border-amber-500/30 text-amber-300 hover:bg-amber-500/10 hover:border-amber-400 transition font-medium flex items-center gap-1.5"
            >
              <span>Masuk ke Akun</span>
              <span>→</span>
            </Link>
          </motion.div>
        </div>
      </header>

      {/* Main Wizard Container */}
      <main className="relative z-10 flex-1 max-w-4xl mx-auto w-full px-4 py-8 flex flex-col justify-center">
        {/* Progress Stepper Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-3">
            {STEPS.map((s) => {
              const isPassed = step > s.num;
              const isCurrent = step === s.num;
              return (
                <div key={s.num} className="flex flex-col items-center flex-1 relative">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    onClick={() => {
                      if (isPassed) setStep(s.num);
                    }}
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 cursor-pointer ${
                      isCurrent
                        ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-black shadow-lg shadow-amber-500/40 ring-4 ring-amber-400/20 scale-105'
                        : isPassed
                        ? 'bg-amber-400/20 text-amber-300 border border-amber-500/40 hover:bg-amber-400/30'
                        : 'bg-slate-800/80 text-slate-500 border border-slate-700/80'
                    }`}
                  >
                    {isPassed ? '✓' : s.num}
                  </motion.div>
                  <div className="flex items-center gap-1 mt-1.5 hidden sm:flex">
                    <span className="text-xs">{s.icon}</span>
                    <span
                      className={`text-[11px] font-medium tracking-wide ${
                        isCurrent
                          ? 'text-amber-400 font-bold'
                          : isPassed
                          ? 'text-slate-300'
                          : 'text-slate-500'
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Connected Progress Line */}
          <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
            <motion.div
              className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300 h-full rounded-full shadow-sm shadow-amber-500/50"
              initial={{ width: '0%' }}
              animate={{ width: `${((step - 1) / 4) * 100}%` }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Wizard Main Card */}
        <div className="bg-slate-900/90 border border-amber-500/20 rounded-2xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          {/* Subtle Corner Glow Accent */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

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
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                      Langkah 1 dari 5
                    </span>
                    <span className="text-xs text-slate-400">Identitas Restoran</span>
                  </div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">Daftarkan Restoran Anda</h2>
                  <p className="text-slate-400 text-sm mt-1">
                    Mulai gunakan Santapos dalam hitungan menit untuk kasir POS, KDS Dapur, dan QR Self-Order Meja.
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 pt-2">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Nama Restoran / Brand *
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Kedai Kopi Senja, Resto Padang Sejahtera"
                      value={formData.restaurant_name}
                      onChange={(e) => updateField('restaurant_name', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-800/90 border border-slate-700 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 text-white placeholder-slate-500 text-sm outline-none transition"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        Subdomain Toko (Self-Order Meja Pelanggan)
                      </label>
                      <span className="text-[11px] text-emerald-400 font-medium">✓ Siap Digunakan</span>
                    </div>
                    <div className="flex items-center rounded-xl bg-slate-800/90 border border-slate-700 overflow-hidden text-sm focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-400/20 transition">
                      <span className="px-3.5 text-slate-500 font-mono text-xs select-none">https://</span>
                      <input
                        type="text"
                        placeholder="namaresto"
                        value={formData.slug}
                        onChange={(e) => {
                          setFormData((prev) => ({ ...prev, slugManuallyEdited: true }));
                          updateField('slug', e.target.value);
                        }}
                        className="flex-1 py-3 bg-transparent text-amber-300 font-mono text-sm outline-none font-semibold"
                      />
                      <span className="px-3.5 text-slate-400 font-mono text-xs select-none bg-slate-800/40 border-l border-slate-700/60">
                        .santapos.id
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1.5">
                      Pelanggan dapat memesan makanan langsung dari meja melalui tautan ini via pemindaian QR code.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Nama Pemilik Resto *
                    </label>
                    <input
                      type="text"
                      placeholder="Budi Santoso"
                      value={formData.owner_name}
                      onChange={(e) => updateField('owner_name', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-800/90 border border-slate-700 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 text-white placeholder-slate-500 text-sm outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      No. WhatsApp Aktif
                    </label>
                    <input
                      type="tel"
                      placeholder="081234567890"
                      value={formData.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-800/90 border border-slate-700 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 text-white placeholder-slate-500 text-sm outline-none transition"
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
                      className="w-full px-4 py-3 rounded-xl bg-slate-800/90 border border-slate-700 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 text-white placeholder-slate-500 text-sm outline-none transition"
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
                      className="w-full px-4 py-3 rounded-xl bg-slate-800/90 border border-slate-700 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 text-white placeholder-slate-500 text-sm outline-none transition"
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
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                      Langkah 2 dari 5
                    </span>
                    <span className="text-xs text-slate-400">Pilihan Paket Bisnis</span>
                  </div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">Pilih Paket SaaS Santapos</h2>
                  <p className="text-slate-400 text-sm mt-1">
                    Dapat disesuaikan (upgrade atau downgrade) kapan saja secara fleksibel dari panel admin restoran.
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-4 pt-2">
                  {PLANS.map((plan) => {
                    const isSelected = formData.plan_code === plan.code;
                    return (
                      <motion.div
                        key={plan.code}
                        whileHover={{ y: -6, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => updateField('plan_code', plan.code)}
                        className={`cursor-pointer rounded-2xl p-5 border transition-all duration-200 flex flex-col justify-between relative overflow-hidden ${
                          isSelected
                            ? 'bg-gradient-to-b from-amber-500/15 to-slate-900 border-amber-400 shadow-xl shadow-amber-500/20 ring-2 ring-amber-400/40'
                            : 'bg-slate-800/60 border-slate-700/80 hover:border-amber-400/40 hover:bg-slate-800/90'
                        }`}
                      >
                        {plan.highlight && (
                          <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-400 to-amber-600 text-black font-extrabold text-[9px] px-3 py-1 rounded-bl-xl uppercase tracking-wider shadow-md">
                            Rekomendasi
                          </div>
                        )}

                        <div>
                          <div className="flex justify-between items-start mb-3">
                            <span
                              className={`text-[11px] px-2.5 py-1 rounded-full font-bold ${
                                isSelected
                                  ? 'bg-amber-400 text-black shadow-sm'
                                  : 'bg-slate-700/70 text-slate-300 border border-slate-600/50'
                              }`}
                            >
                              {plan.badge}
                            </span>
                            {isSelected && (
                              <span className="text-amber-400 text-xs font-bold flex items-center gap-1 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/30">
                                <span>✓</span>
                                <span>Terpilih</span>
                              </span>
                            )}
                          </div>

                          <h3 className="font-extrabold text-lg text-white tracking-tight">{plan.name}</h3>
                          <p className="text-slate-400 text-xs mt-1 mb-4 leading-relaxed">{plan.tagline}</p>

                          <div className="text-2xl font-black text-amber-400 mb-4 flex items-baseline gap-1">
                            {plan.price}
                            <span className="text-xs font-normal text-slate-400">{plan.period}</span>
                          </div>

                          <ul className="space-y-2.5 text-xs text-slate-300 border-t border-slate-700/60 pt-4">
                            {plan.features.map((f, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-emerald-400 font-bold">✓</span>
                                <span className="leading-snug">{f}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="mt-5 pt-3 border-t border-slate-700/40">
                          <div
                            className={`w-full py-2 rounded-xl text-center text-xs font-bold transition ${
                              isSelected
                                ? 'bg-amber-400 text-black shadow-md'
                                : 'bg-slate-700/50 text-slate-300 group-hover:bg-slate-700'
                            }`}
                          >
                            {isSelected ? 'Paket Aktif' : 'Pilih Paket Ini'}
                          </div>
                        </div>
                      </motion.div>
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
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                      Langkah 3 dari 5
                    </span>
                    <span className="text-xs text-slate-400">Konfigurasi Cabang & Meja</span>
                  </div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">Konfigurasi Outlet & Meja Resto</h2>
                  <p className="text-slate-400 text-sm mt-1">
                    Santapos otomatis menerbitkan token QR unik untuk setiap nomor meja pelanggan di outlet Anda.
                  </p>
                </div>

                <div className="space-y-5 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Nama Outlet / Cabang Utama *
                    </label>
                    <input
                      type="text"
                      value={formData.branch_name}
                      onChange={(e) => updateField('branch_name', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-800/90 border border-slate-700 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 text-white text-sm outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Alamat Lengkap Outlet
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Jl. Riau No. 45, Coblong, Kota Bandung"
                      value={formData.branch_address}
                      onChange={(e) => updateField('branch_address', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-800/90 border border-slate-700 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 text-white placeholder-slate-500 text-sm outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      Jumlah Meja Self-Order Pelanggan
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[5, 10, 15, 20].map((num) => {
                        const isSelected = formData.table_count === num;
                        return (
                          <motion.button
                            key={num}
                            type="button"
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => updateField('table_count', num)}
                            className={`py-3.5 rounded-xl border font-bold text-sm transition flex flex-col items-center justify-center gap-1 ${
                              isSelected
                                ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-black border-amber-400 shadow-lg shadow-amber-500/20 ring-2 ring-amber-400/30'
                                : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:border-slate-500 hover:bg-slate-800'
                            }`}
                          >
                            <span className="text-lg">🪑</span>
                            <span>{num} Meja</span>
                          </motion.button>
                        );
                      })}
                    </div>

                    {/* Live Visual Floor / Table Preview */}
                    <div className="mt-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/70">
                      <div className="flex items-center justify-between mb-3 text-xs">
                        <span className="text-slate-400 font-medium">Pratinjau Meja Dibuat Otomatis:</span>
                        <span className="text-amber-400 font-mono font-semibold">
                          Total {formData.table_count} Meja Aktif
                        </span>
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {Array.from({ length: Math.min(formData.table_count, 6) }).map((_, idx) => (
                          <div
                            key={idx}
                            className="bg-slate-900/80 border border-amber-500/20 rounded-lg p-2 text-center"
                          >
                            <span className="text-[10px] text-slate-400 block">Meja</span>
                            <span className="font-extrabold text-amber-300 text-sm">
                              {String(idx + 1).padStart(2, '0')}
                            </span>
                            <span className="text-[9px] text-emerald-400 block mt-0.5">📱 QR Ready</span>
                          </div>
                        ))}
                      </div>
                      {formData.table_count > 6 && (
                        <p className="text-[11px] text-slate-400 text-center mt-2.5">
                          ... dan {formData.table_count - 6} meja lainnya siap dicetak stiker QR-nya dari panel Admin.
                        </p>
                      )}
                    </div>
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
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                      Langkah 4 dari 5
                    </span>
                    <span className="text-xs text-slate-400">Katalog Produk Pertama</span>
                  </div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">Kategori & Menu Pertama Restoran</h2>
                  <p className="text-slate-400 text-sm mt-1">
                    Masukkan 1 produk menu pertama Anda untuk inisialisasi awal. Anda dapat menambahkan ratusan menu lain di Dashboard.
                  </p>
                </div>

                <div className="grid sm:grid-cols-5 gap-6 pt-2">
                  {/* Form Inputs */}
                  <div className="sm:col-span-3 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                        Nama Kategori Menu Awal *
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Makanan Utama, Minuman Segar, Kopi"
                        value={formData.first_category_name}
                        onChange={(e) => updateField('first_category_name', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-800/90 border border-slate-700 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 text-white text-sm outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                        Nama Produk / Menu Pertama *
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Nasi Goreng Spesial, Es Kopi Susu Aren"
                        value={formData.first_product_name}
                        onChange={(e) => updateField('first_product_name', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-800/90 border border-slate-700 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 text-white text-sm outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                        Harga Jual Produk (Rp) *
                      </label>
                      <input
                        type="number"
                        placeholder="25000"
                        value={formData.first_product_price}
                        onChange={(e) => updateField('first_product_price', Number(e.target.value))}
                        className="w-full px-4 py-3 rounded-xl bg-slate-800/90 border border-slate-700 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 text-white text-sm outline-none transition font-mono font-bold"
                      />
                    </div>
                  </div>

                  {/* Live Menu Card Preview */}
                  <div className="sm:col-span-2 flex flex-col justify-center">
                    <div className="bg-slate-800/60 border border-amber-500/20 rounded-2xl p-4 shadow-lg relative overflow-hidden">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                          Pratinjau Menu Tamu
                        </span>
                        <span className="text-xs">✨</span>
                      </div>

                      <div className="w-full h-28 rounded-xl bg-gradient-to-br from-amber-900/40 via-amber-700/20 to-slate-900 flex items-center justify-center border border-amber-500/10 mb-3">
                        <span className="text-4xl">🍲</span>
                      </div>

                      <span className="text-[10px] text-amber-300 font-semibold uppercase tracking-wider block">
                        {formData.first_category_name || 'Kategori Menu'}
                      </span>
                      <h4 className="font-bold text-white text-sm mt-0.5 line-clamp-1">
                        {formData.first_product_name || 'Nama Menu Makanan'}
                      </h4>
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-700/60">
                        <span className="text-amber-400 font-extrabold text-sm font-mono">
                          Rp {Number(formData.first_product_price || 0).toLocaleString('id-ID')}
                        </span>
                        <span className="text-[10px] px-2 py-1 bg-amber-400 text-black font-bold rounded-lg shadow-sm">
                          + Pesan
                        </span>
                      </div>
                    </div>
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
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                      Langkah 5 dari 5
                    </span>
                    <span className="text-xs text-slate-400">Konfirmasi Akhir</span>
                  </div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">Siap Meluncurkan Restoran Anda!</h2>
                  <p className="text-slate-400 text-sm mt-1">
                    Periksa kembali ringkasan konfigurasi sebelum mengaktifkan ekosistem Santapos Anda.
                  </p>
                </div>

                <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700/80 space-y-3.5 text-sm">
                  <div className="flex justify-between items-center border-b border-slate-700/60 pb-2.5">
                    <span className="text-slate-400 text-xs">Nama Restoran & Brand</span>
                    <span className="font-bold text-white text-base">{formData.restaurant_name}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-700/60 pb-2.5">
                    <span className="text-slate-400 text-xs">Subdomain QR Self-Order</span>
                    <span className="font-mono text-amber-300 font-semibold text-xs bg-slate-900/60 px-2.5 py-1 rounded-lg border border-slate-700">
                      https://{formData.slug}.santapos.id
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-700/60 pb-2.5">
                    <span className="text-slate-400 text-xs">Paket Langganan Dipilih</span>
                    <span className="font-bold text-amber-400 uppercase tracking-wider text-xs bg-amber-400/10 px-2.5 py-1 rounded-lg border border-amber-400/20">
                      {selectedPlanObj.name} ({selectedPlanObj.price}{selectedPlanObj.period})
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-700/60 pb-2.5">
                    <span className="text-slate-400 text-xs">Cabang Utama & Meja</span>
                    <span className="text-white font-medium">
                      {formData.branch_name} ({formData.table_count} Meja QR Aktif)
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-700/60 pb-2.5">
                    <span className="text-slate-400 text-xs">Akun Login Pemilik Resto</span>
                    <span className="text-white font-mono text-xs">
                      {formData.owner_name} ({formData.owner_email})
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-xs">Menu & Kategori Pertama</span>
                    <span className="text-emerald-300 font-medium text-xs">
                      {formData.first_product_name} (Rp {Number(formData.first_product_price).toLocaleString('id-ID')})
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-center gap-3">
                  <span className="text-2xl">💡</span>
                  <span className="leading-relaxed">
                    Setelah aktivasi selesai, seluruh database tenant, token QR meja, dan menu awal akan otomatis aktif, dan Anda langsung diarahkan ke Dashboard Restoran tanpa proses konfigurasi rumit.
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Navigation Buttons */}
          <div className="flex items-center justify-between border-t border-slate-800 pt-6 mt-8">
            {step > 1 ? (
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleBack}
                disabled={loading}
                className="px-5 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-sm font-semibold transition flex items-center gap-2"
              >
                <span>←</span>
                <span>Kembali</span>
              </motion.button>
            ) : (
              <div />
            )}

            {step < 5 ? (
              <motion.button
                type="button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleNext}
                className="px-7 py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-black font-extrabold text-sm shadow-xl shadow-amber-500/20 transition flex items-center gap-2"
              >
                <span>Lanjutkan</span>
                <span>→</span>
              </motion.button>
            ) : (
              <motion.button
                type="button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleSubmit}
                disabled={loading}
                className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 hover:from-emerald-300 hover:to-emerald-500 text-black font-black text-sm shadow-xl shadow-emerald-500/30 transition flex items-center gap-2.5"
              >
                {loading ? (
                  <>
                    <span className="animate-spin text-lg">⏳</span>
                    <span>Menyiapkan Restoran Anda...</span>
                  </>
                ) : (
                  <>
                    <span>Aktivasi Restoran Sekarang</span>
                    <span>🚀</span>
                  </>
                )}
              </motion.button>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-5 text-center text-xs text-slate-500 border-t border-amber-500/5">
        © {new Date().getFullYear()} Santapos SaaS Platform · Hak Cipta Dilindungi
      </footer>
    </div>
  );
}
