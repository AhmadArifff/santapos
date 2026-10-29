'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '@/components/layout/AdminLayout';
import AuthGuard from '@/components/ui/AuthGuard';
import {
  createPaymentMethod,
  deletePaymentMethod,
  getPaymentMethods,
  hardDeletePaymentMethod,
  updatePaymentMethod,
  getMidtransConfig,
  saveMidtransConfig,
  testMidtransConfig,
  getMidtransAuditLogs,
} from '@/lib/api';
import { showConfirm } from '@/lib/modalDialog';
import PaymentMethodCard from '@/components/payment/PaymentMethodCard';
import { IMAGE_EXTENSIONS, acceptFromExtensions, getFileValidationError } from '@/lib/fileValidation';

const emptyForm = {
  method_key: '',
  name: '',
  type: 'qris',
  provider_name: '',
  account_name: '',
  account_number: '',
  instructions: '',
  payment_timeout_minutes: 15,
  sort_order: 0,
  status: 'active',
  qr_image: null,
  remove_qr: '0',
};

const formatTimeout = (minutes) => `${Number(minutes || 0)} menit`;
const formatRp = (value) => `Rp ${Number(value || 0).toLocaleString('id-ID')}`;

const formatDateTime = (value) => {
  if (!value) return '-';
  const d = new Date(value);
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

const toFormData = (form) => {
  const data = new FormData();
  const payload = {
    ...form,
    qr_image: form.type === 'qris' ? form.qr_image : null,
    remove_qr: form.type === 'transfer' ? '1' : form.remove_qr,
  };

  Object.entries(payload).forEach(([key, value]) => {
    if (key === 'qr_image') {
      if (value) data.append('qr_image', value);
      return;
    }
    data.append(key, value ?? '');
  });
  return data;
};

export default function PaymentManagementPage() {
  const [activeTab, setActiveTab] = useState('manual'); // 'manual' | 'midtrans' | 'audit'

  // --- MANUAL METHODS STATE ---
  const [methods, setMethods] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [qrPreviewUrl, setQrPreviewUrl] = useState('');
  const [fileError, setFileError] = useState(null);
  const loadSeqRef = useRef(0);
  const hasLoadedRef = useRef(false);

  // --- MIDTRANS STATE ---
  const [midtransForm, setMidtransForm] = useState({
    is_active: false,
    environment: 'sandbox',
    merchant_id: '',
    client_key: '',
    server_key: '',
    masked_server_key: '',
    webhook_url: '',
  });
  const [midtransLoading, setMidtransLoading] = useState(false);
  const [savingMidtrans, setSavingMidtrans] = useState(false);
  const [unlockServerKey, setUnlockServerKey] = useState(false);
  const [testingMidtrans, setTestingMidtrans] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [midtransFeedback, setMidtransFeedback] = useState(null);
  const [copyWebhookMsg, setCopyWebhookMsg] = useState('');

  // --- AUDIT LOGS STATE ---
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditFilter, setAuditFilter] = useState('all');
  const [auditSearch, setAuditSearch] = useState('');
  const [selectedPayload, setSelectedPayload] = useState(null);
  const [copyPayloadMsg, setCopyPayloadMsg] = useState('');

  const activeCount = useMemo(() => methods.filter((item) => item.status === 'active').length, [methods]);
  const previewMethod = useMemo(() => ({
    ...form,
    id: editing?.id || 'preview',
    name: form.name || (form.type === 'transfer' ? 'Transfer Bank' : 'QRIS Pembayaran'),
    provider_name: form.provider_name || (form.type === 'transfer' ? 'Bank' : 'QRIS'),
    account_name: form.account_name || 'Santapos Resto',
    account_number: form.account_number || (form.type === 'transfer' ? '0000000000' : '0895353025503'),
    qr_image_url: form.type === 'qris'
      ? (qrPreviewUrl || (form.remove_qr === '1' ? '' : editing?.qr_image_url || ''))
      : '',
  }), [editing, form, qrPreviewUrl]);

  // Load Manual Methods
  const load = async ({ silent = false } = {}) => {
    const seq = loadSeqRef.current + 1;
    loadSeqRef.current = seq;
    const shouldRefreshSilently = silent || hasLoadedRef.current || methods.length > 0;
    if (shouldRefreshSilently) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await getPaymentMethods();
      if (loadSeqRef.current !== seq) return;
      setMethods(res.data || []);
      hasLoadedRef.current = true;
    } finally {
      if (loadSeqRef.current === seq) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  // Load Midtrans Config
  const loadMidtrans = async () => {
    setMidtransLoading(true);
    try {
      const res = await getMidtransConfig();
      if (res.data?.data) {
        const d = res.data.data;
        setMidtransForm({
          is_active: Boolean(d.is_active),
          environment: d.environment || 'sandbox',
          merchant_id: d.merchant_id || '',
          client_key: d.client_key || '',
          server_key: '',
          masked_server_key: d.masked_server_key || '',
          webhook_url: d.webhook_url || '',
        });
        setUnlockServerKey(!d.masked_server_key);
      }
    } catch (err) {
      console.error('Failed to load Midtrans config:', err);
    } finally {
      setMidtransLoading(false);
    }
  };

  // Load Audit Logs
  const loadAudit = async () => {
    setAuditLoading(true);
    try {
      const res = await getMidtransAuditLogs();
      setAuditLogs(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => {
    load();
    loadMidtrans();
  }, []);

  useEffect(() => {
    if (activeTab === 'audit') {
      loadAudit();
    }
  }, [activeTab]);

  useEffect(() => {
    if (!form.qr_image) {
      setQrPreviewUrl('');
      return undefined;
    }

    const url = URL.createObjectURL(form.qr_image);
    setQrPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [form.qr_image]);

  const resetForm = () => {
    setEditing(null);
    setForm(emptyForm);
    setQrPreviewUrl('');
    setFileError(null);
  };

  const editMethod = (method) => {
    setEditing(method);
    setForm({
      method_key: method.method_key || '',
      name: method.name || '',
      type: method.type || 'qris',
      provider_name: method.provider_name || '',
      account_name: method.account_name || '',
      account_number: method.account_number || '',
      instructions: method.instructions || '',
      payment_timeout_minutes: method.payment_timeout_minutes || 15,
      sort_order: method.sort_order || 0,
      status: method.status || 'active',
      qr_image: null,
      remove_qr: '0',
    });
    setQrPreviewUrl('');
    setFileError(null);
  };

  const handleQrImageSelect = (event) => {
    const file = event.target.files?.[0] || null;
    if (!file) {
      setForm((prev) => ({ ...prev, qr_image: null }));
      setFileError(null);
      return;
    }

    const validationError = getFileValidationError(file, {
      allowedExtensions: IMAGE_EXTENSIONS,
      label: 'gambar QRIS',
      maxSizeMB: 5,
    });
    if (validationError) {
      setFileError(validationError);
      setForm((prev) => ({ ...prev, qr_image: null }));
      event.target.value = '';
      return;
    }

    setFileError(null);
    setForm((prev) => ({ ...prev, qr_image: file, remove_qr: '0' }));
  };

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await updatePaymentMethod(editing.id, toFormData(form));
      } else {
        await createPaymentMethod(toFormData(form));
      }
      resetForm();
      await load({ silent: true });
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menyimpan metode pembayaran');
    } finally {
      setSaving(false);
    }
  };

  const disableMethod = async (method) => {
    const confirmed = await showConfirm(`Nonaktifkan metode pembayaran ${method.name}?`, {
      title: 'Nonaktifkan Payment',
      confirmText: 'Nonaktifkan',
      tone: 'warning',
    });
    if (!confirmed) return;
    try {
      await deletePaymentMethod(method.id);
      await load({ silent: true });
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menonaktifkan metode pembayaran');
    }
  };

  const removeMethod = async (method) => {
    const confirmed = await showConfirm(`Hapus permanen metode pembayaran ${method.name}? Data ini tidak bisa dikembalikan.`, {
      title: 'Hapus Payment',
      confirmText: 'Hapus Permanen',
      tone: 'danger',
    });
    if (!confirmed) return;
    try {
      await hardDeletePaymentMethod(method.id);
      if (editing?.id === method.id) resetForm();
      await load({ silent: true });
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus metode pembayaran');
    }
  };

  // --- MIDTRANS HANDLERS ---
  const handleTestMidtrans = async () => {
    setTestingMidtrans(true);
    setTestResult(null);
    try {
      const res = await testMidtransConfig({
        server_key: midtransForm.server_key || undefined,
        environment: midtransForm.environment,
      });
      setTestResult({
        success: true,
        message: res.data?.message || 'Koneksi ke Midtrans Server Key berhasil diverifikasi!',
      });
    } catch (err) {
      setTestResult({
        success: false,
        message: err.response?.data?.message || err.message || 'Gagal menguji koneksi Midtrans.',
      });
    } finally {
      setTestingMidtrans(false);
    }
  };

  const handleSaveMidtrans = async (e) => {
    e.preventDefault();
    setSavingMidtrans(true);
    setMidtransFeedback(null);
    try {
      await saveMidtransConfig({
        is_active: midtransForm.is_active,
        environment: midtransForm.environment,
        merchant_id: midtransForm.merchant_id,
        client_key: midtransForm.client_key,
        server_key: midtransForm.server_key,
      });
      setMidtransFeedback({
        type: 'success',
        text: 'Konfigurasi Midtrans Payment Gateway berhasil disimpan!',
      });
      await loadMidtrans();
      window.setTimeout(() => setMidtransFeedback(null), 4000);
    } catch (err) {
      setMidtransFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Gagal menyimpan konfigurasi Midtrans.',
      });
    } finally {
      setSavingMidtrans(false);
    }
  };

  const resolvedWebhookUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/payments/midtrans/notification`
    : '/api/payments/midtrans/notification';

  const copyWebhookUrl = async () => {
    try {
      await navigator.clipboard.writeText(resolvedWebhookUrl);
      setCopyWebhookMsg('Webhook URL disalin!');
      window.setTimeout(() => setCopyWebhookMsg(''), 2000);
    } catch {
      setCopyWebhookMsg('Gagal menyalin');
      window.setTimeout(() => setCopyWebhookMsg(''), 2000);
    }
  };

  const copyPayloadJson = async () => {
    if (!selectedPayload) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(selectedPayload, null, 2));
      setCopyPayloadMsg('JSON disalin!');
      window.setTimeout(() => setCopyPayloadMsg(''), 2000);
    } catch {
      setCopyPayloadMsg('Gagal menyalin');
      window.setTimeout(() => setCopyPayloadMsg(''), 2000);
    }
  };

  // Filtered Audit Logs
  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      if (auditFilter !== 'all') {
        if (auditFilter === 'settled' && log.event_type !== 'order_settled') return false;
        if (auditFilter === 'charge' && log.event_type !== 'charge_created') return false;
        if (auditFilter === 'skipped' && log.event_type !== 'idempotency_skipped') return false;
        if (auditFilter === 'failed' && !['signature_failed', 'order_not_found'].includes(log.event_type)) return false;
      }
      if (auditSearch.trim()) {
        const q = auditSearch.toLowerCase();
        const matchesCode = (log.order_code || '').toLowerCase().includes(q);
        const matchesType = (log.payment_type || '').toLowerCase().includes(q);
        const matchesEvent = (log.event_type || '').toLowerCase().includes(q);
        return matchesCode || matchesType || matchesEvent;
      }
      return true;
    });
  }, [auditLogs, auditFilter, auditSearch]);

  return (
    <AuthGuard>
      <AdminLayout>
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Header & Tabs */}
          <div data-tour="payment-header" className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-orange-500/20 px-3 py-1 text-xs font-black uppercase tracking-[0.22em] text-orange-400">
                  Payment Center
                </span>
                {midtransForm.is_active && (
                  <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-black text-emerald-400">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                    Midtrans Gateway Aktif ({midtransForm.environment.toUpperCase()})
                  </span>
                )}
              </div>
              <h1 className="mt-2 text-3xl font-black text-white">Metode Pembayaran & Gateway</h1>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-400">
                Kelola pembayaran manual QRIS/Transfer struk, integrasikan Midtrans Snap payment gateway otomatis, dan pantau log audit transaksi keuangan.
              </p>
            </div>

            {/* Quick Stats */}
            <div data-tour="payment-stats" className="grid grid-cols-2 gap-3 sm:w-72">
              {refreshing && (
                <div className="col-span-2 rounded-full border border-sky-500/25 bg-sky-500/10 px-3 py-1.5 text-center text-xs font-bold text-sky-200">
                  Sinkronisasi payment...
                </div>
              )}
              <div className="rounded-2xl border border-slate-700 bg-slate-800 p-3.5">
                <p className="text-xs text-slate-500">Metode Aktif</p>
                <strong className="mt-0.5 block text-xl text-emerald-300">
                  {activeCount + (midtransForm.is_active ? 1 : 0)}
                </strong>
              </div>
              <div className="rounded-2xl border border-slate-700 bg-slate-800 p-3.5">
                <p className="text-xs text-slate-500">Total Audit Log</p>
                <strong className="mt-0.5 block text-xl text-white">{auditLogs.length}</strong>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
            <button
              onClick={() => setActiveTab('manual')}
              className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-black transition ${
                activeTab === 'manual'
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <span>📋</span>
              <span>Metode Manual (QRIS & Struk)</span>
              <span className="rounded-full bg-black/25 px-2 py-0.5 text-xs">
                {methods.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('midtrans')}
              className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-black transition ${
                activeTab === 'midtrans'
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <span>⚡</span>
              <span>Integrasi Midtrans Gateway</span>
              {midtransForm.is_active && (
                <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-xs text-black font-extrabold">
                  ON
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-black transition ${
                activeTab === 'audit'
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <span>🛡️</span>
              <span>Audit Trail Log Transaksi</span>
              {auditLogs.length > 0 && (
                <span className="rounded-full bg-slate-900 px-2 py-0.5 text-xs text-sky-400">
                  {auditLogs.length}
                </span>
              )}
            </button>
          </div>

          {/* TAB 1: METODE MANUAL */}
          {activeTab === 'manual' && (
            <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
              <section data-tour="payment-list" className="space-y-4">
                <div data-tour="payment-flow" className="rounded-3xl border border-sky-500/20 bg-sky-500/10 p-5">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-sky-300">Alur pembayaran manual</p>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl border border-sky-200/15 bg-slate-900/60 p-4">
                      <h3 className="font-black text-white">QRIS Statis Toko</h3>
                      <ol className="mt-3 list-decimal space-y-2 pl-4 text-sm leading-6 text-slate-300">
                        <li>Pelanggan memilih QRIS dan melihat QR statis toko serta countdown batas bayar.</li>
                        <li>Pelanggan scan dan bayar melalui e-wallet / mobile banking.</li>
                        <li>Pelanggan upload foto bukti pembayaran untuk diverifikasi oleh kasir.</li>
                      </ol>
                    </div>
                    <div className="rounded-2xl border border-emerald-200/15 bg-slate-900/60 p-4">
                      <h3 className="font-black text-white">Transfer Rekening Bank</h3>
                      <ol className="mt-3 list-decimal space-y-2 pl-4 text-sm leading-6 text-slate-300">
                        <li>Pelanggan melihat kartu rekening bank toko dengan tombol salin nomor rekening.</li>
                        <li>Pelanggan melakukan transfer sesuai nominal pesanan.</li>
                        <li>Pelanggan upload struk transfer, lalu menunggu konfirmasi kasir.</li>
                      </ol>
                    </div>
                  </div>
                </div>

                {loading && methods.length === 0 && (
                  <div className="rounded-3xl border border-slate-700 bg-slate-800 p-6 text-slate-400">
                    Memuat metode pembayaran...
                  </div>
                )}
                {!loading && methods.length === 0 && (
                  <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-800/50 p-10 text-center text-slate-400">
                    Belum ada metode pembayaran manual.
                  </div>
                )}
                {methods.map((method, index) => (
                  <motion.article
                    key={method.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    data-tour="payment-card"
                    className="rounded-3xl border border-slate-700 bg-slate-800 p-5"
                  >
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px_auto] lg:items-start">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-orange-500/15 px-3 py-1 text-xs font-black uppercase text-orange-300">
                            {method.type}
                          </span>
                          <span className={`rounded-full px-3 py-1 text-xs font-black uppercase ${
                            method.status === 'active' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-700 text-slate-400'
                          }`}>
                            {method.status === 'active' ? 'Aktif' : 'Nonaktif'}
                          </span>
                          <span className="rounded-full bg-slate-700 px-3 py-1 text-xs font-bold text-slate-300">
                            {formatTimeout(method.payment_timeout_minutes)}
                          </span>
                        </div>
                        <h2 className="mt-3 break-words text-xl font-black text-white">{method.name}</h2>
                        <p className="mt-1 break-words text-sm text-slate-400">
                          {method.provider_name || '-'} {method.account_number ? `- ${method.account_number}` : ''}
                        </p>
                        {method.account_name && <p className="mt-1 text-xs text-slate-500">a/n {method.account_name}</p>}
                        {method.instructions && (
                          <p className="mt-3 break-words rounded-2xl bg-slate-900/60 p-3 text-sm leading-6 text-slate-300">
                            {method.instructions}
                          </p>
                        )}
                      </div>
                      <div data-tour="payment-card-preview">
                        <PaymentMethodCard method={method} compact preview />
                      </div>
                      <div data-tour="payment-card-actions" className="flex shrink-0 flex-col gap-3 lg:w-32">
                        <button onClick={() => editMethod(method)} className="rounded-xl bg-slate-700 px-3 py-2 text-sm font-black text-white hover:bg-slate-600">
                          Edit
                        </button>
                        {method.status === 'active' && (
                          <button onClick={() => disableMethod(method)} className="rounded-xl bg-red-500/80 px-3 py-2 text-sm font-black text-white hover:bg-red-500">
                            Nonaktif
                          </button>
                        )}
                        <button onClick={() => removeMethod(method)} className="rounded-xl border border-red-500/35 bg-red-500/10 px-3 py-2 text-sm font-black text-red-200 hover:bg-red-500/20">
                          Hapus
                        </button>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </section>

              {/* Form Manual */}
              <aside className="xl:sticky xl:top-6 xl:h-fit">
                <div data-tour="payment-form" className="rounded-3xl border border-slate-700 bg-slate-800 p-5">
                  <h2 className="text-xl font-black text-white">{editing ? 'Edit Payment' : 'Tambah Payment'}</h2>
                  <div data-tour="payment-preview-card" className="mt-4">
                    <PaymentMethodCard method={previewMethod} preview />
                  </div>
                  <form onSubmit={save} className="mt-4 space-y-3">
                    <div data-tour="payment-type-status-field" className="grid grid-cols-2 gap-3">
                      <select
                        value={form.type}
                        onChange={(event) => setForm((prev) => ({
                          ...prev,
                          type: event.target.value,
                          qr_image: event.target.value === 'transfer' ? null : prev.qr_image,
                          remove_qr: event.target.value === 'transfer' ? '1' : '0',
                        }))}
                        className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-orange-500"
                      >
                        <option value="qris">QRIS</option>
                        <option value="transfer">Transfer</option>
                      </select>
                      <select
                        value={form.status}
                        onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
                        className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-orange-500"
                      >
                        <option value="active">Aktif</option>
                        <option value="inactive">Nonaktif</option>
                      </select>
                    </div>
                    <input
                      data-tour="payment-name-field"
                      value={form.name}
                      onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                      placeholder="Nama metode, contoh QRIS BCA"
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-orange-500"
                      required
                    />
                    <input
                      data-tour="payment-key-field"
                      value={form.method_key}
                      onChange={(event) => setForm((prev) => ({ ...prev, method_key: event.target.value }))}
                      placeholder="Kode metode, contoh qris-bca"
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-orange-500"
                    />
                    <input
                      data-tour="payment-provider-field"
                      value={form.provider_name}
                      onChange={(event) => setForm((prev) => ({ ...prev, provider_name: event.target.value }))}
                      placeholder="Provider / bank"
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-orange-500"
                    />
                    <div data-tour="payment-account-fields" className="grid grid-cols-2 gap-3">
                      <input
                        value={form.account_name}
                        onChange={(event) => setForm((prev) => ({ ...prev, account_name: event.target.value }))}
                        placeholder="Nama penerima"
                        className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-orange-500"
                      />
                      <input
                        value={form.account_number}
                        onChange={(event) => setForm((prev) => ({ ...prev, account_number: event.target.value }))}
                        placeholder="Nomor rekening"
                        className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-orange-500"
                      />
                    </div>
                    <div data-tour="payment-timeout-sort-fields" className="grid grid-cols-2 gap-3">
                      <input
                        type="number"
                        min="1"
                        max="180"
                        value={form.payment_timeout_minutes}
                        onChange={(event) => setForm((prev) => ({ ...prev, payment_timeout_minutes: event.target.value }))}
                        className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-orange-500"
                      />
                      <input
                        type="number"
                        value={form.sort_order}
                        onChange={(event) => setForm((prev) => ({ ...prev, sort_order: event.target.value }))}
                        className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-orange-500"
                      />
                    </div>
                    <textarea
                      data-tour="payment-instructions-field"
                      value={form.instructions}
                      onChange={(event) => setForm((prev) => ({ ...prev, instructions: event.target.value }))}
                      placeholder="Tata cara pembayaran..."
                      className="min-h-28 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-orange-500"
                    />
                    {form.type === 'qris' ? (
                      <div data-tour="payment-qris-upload" className="rounded-2xl border border-slate-700 bg-slate-900 p-3">
                        <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Gambar QRIS</p>
                        <input
                          type="file"
                          accept={acceptFromExtensions(IMAGE_EXTENSIONS)}
                          onChange={handleQrImageSelect}
                          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-300 outline-none focus:border-orange-500"
                        />
                        {fileError && <p className="mt-2 text-xs font-semibold text-red-300">{fileError}</p>}
                        <p className="mt-2 text-xs leading-5 text-slate-500">Upload hanya untuk QRIS. Preview kartu di atas akan berubah otomatis.</p>
                      </div>
                    ) : (
                      <div data-tour="payment-transfer-note" className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs leading-5 text-emerald-100">
                        Metode transfer tidak memakai upload gambar. Pelanggan akan melihat kartu rekening, tombol copy nomor rekening, dan instruksi transfer.
                      </div>
                    )}
                    {form.type === 'qris' && editing?.qr_image_url && (
                      <label className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-300">
                        <input
                          type="checkbox"
                          checked={form.remove_qr === '1'}
                          onChange={(event) => setForm((prev) => ({ ...prev, remove_qr: event.target.checked ? '1' : '0' }))}
                        />
                        Hapus gambar QR saat update
                      </label>
                    )}
                    <div data-tour="payment-form-actions" className="flex gap-2">
                      <button data-tour="payment-save-button" disabled={saving} className="flex-1 rounded-xl bg-orange-500 px-4 py-3 text-sm font-black text-white hover:bg-orange-400 disabled:opacity-50">
                        {saving ? 'Menyimpan...' : editing ? 'Update Payment' : 'Simpan Payment'}
                      </button>
                      {editing && (
                        <button type="button" onClick={resetForm} className="rounded-xl bg-slate-700 px-4 py-3 text-sm font-black text-white">
                          Batal
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              </aside>
            </div>
          )}

          {/* TAB 2: MIDTRANS PAYMENT GATEWAY */}
          {activeTab === 'midtrans' && (
            <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
              {/* Form Settings */}
              <div className="space-y-6">
                <div className="rounded-3xl border border-slate-700 bg-slate-800 p-6">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-700/60 pb-5">
                    <div>
                      <h2 className="text-xl font-black text-white flex items-center gap-2">
                        <span>⚡</span>
                        <span>Konfigurasi Midtrans Snap API</span>
                      </h2>
                      <p className="mt-1 text-sm text-slate-400">
                        Aktifkan pembayaran otomatis via QRIS Dinamis, GoPay, ShopeePay, VA BCA/Mandiri/BRI/BNI, dan Kartu Kredit.
                      </p>
                    </div>

                    {/* Environment Switcher */}
                    <div className="flex items-center rounded-2xl bg-slate-900 p-1 border border-slate-700">
                      <button
                        type="button"
                        onClick={() => setMidtransForm((p) => ({ ...p, environment: 'sandbox' }))}
                        className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider transition ${
                          midtransForm.environment === 'sandbox'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Sandbox (Testing)
                      </button>
                      <button
                        type="button"
                        onClick={() => setMidtransForm((p) => ({ ...p, environment: 'production' }))}
                        className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider transition ${
                          midtransForm.environment === 'production'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Production (Live)
                      </button>
                    </div>
                  </div>

                  {midtransFeedback && (
                    <div className={`mt-5 rounded-2xl p-4 text-sm font-bold ${
                      midtransFeedback.type === 'success'
                        ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                        : 'border border-red-500/30 bg-red-500/10 text-red-200'
                    }`}>
                      {midtransFeedback.text}
                    </div>
                  )}

                  <form onSubmit={handleSaveMidtrans} className="mt-6 space-y-5">
                    {/* Active Switch */}
                    <div className="flex items-center justify-between rounded-2xl border border-slate-700/80 bg-slate-900/60 p-4">
                      <div>
                        <strong className="block text-sm font-bold text-white">Status Integrasi Midtrans</strong>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Jika aktif, opsi bayar instan akan muncul di halaman pemesanan pelanggan.
                        </p>
                      </div>
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          checked={midtransForm.is_active}
                          onChange={(e) => setMidtransForm((p) => ({ ...p, is_active: e.target.checked }))}
                          className="peer sr-only"
                        />
                        <div className="peer h-7 w-13 rounded-full bg-slate-700 after:absolute after:left-[4px] after:top-[4px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-orange-500 peer-checked:after:translate-x-6 peer-focus:outline-none" />
                      </label>
                    </div>

                    {/* Merchant ID */}
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                        Merchant ID
                      </label>
                      <input
                        type="text"
                        value={midtransForm.merchant_id}
                        onChange={(e) => setMidtransForm((p) => ({ ...p, merchant_id: e.target.value }))}
                        placeholder="Contoh: G123456789"
                        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-orange-500 font-mono text-sm"
                      />
                      <p className="mt-1 text-xs text-slate-500">
                        Bisa dilihat di Midtrans Dashboard &gt; Settings &gt; Access Keys.
                      </p>
                    </div>

                    {/* Client Key */}
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                        Client Key (Publik)
                      </label>
                      <input
                        type="text"
                        value={midtransForm.client_key}
                        onChange={(e) => setMidtransForm((p) => ({ ...p, client_key: e.target.value }))}
                        placeholder={midtransForm.environment === 'production' ? 'Mid-client-xxxxxxxx' : 'SB-Mid-client-xxxxxxxx'}
                        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-orange-500 font-mono text-sm"
                      />
                      <p className="mt-1 text-xs text-slate-500">
                        Digunakan oleh antarmuka browser untuk memanggil jendela Snap Checkout.
                      </p>
                    </div>

                    {/* Server Key with Masking */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-black uppercase tracking-wider text-slate-400">
                          Server Key (Rahasia Finansial)
                        </label>
                        {midtransForm.masked_server_key && !unlockServerKey && (
                          <button
                            type="button"
                            onClick={() => setUnlockServerKey(true)}
                            className="text-xs font-bold text-orange-400 hover:text-orange-300"
                          >
                            Ubah Server Key Baru
                          </button>
                        )}
                      </div>

                      {midtransForm.masked_server_key && !unlockServerKey ? (
                        <div className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-900/90 px-4 py-3">
                          <span className="font-mono text-sm text-emerald-400 font-bold">
                            {midtransForm.masked_server_key}
                          </span>
                          <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-black text-emerald-300">
                            ✓ Tersimpan Aman
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <input
                            type="password"
                            value={midtransForm.server_key}
                            onChange={(e) => setMidtransForm((p) => ({ ...p, server_key: e.target.value }))}
                            placeholder={midtransForm.environment === 'production' ? 'Mid-server-xxxxxxxx' : 'SB-Mid-server-xxxxxxxx'}
                            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-orange-500 font-mono text-sm"
                          />
                          {midtransForm.masked_server_key && (
                            <button
                              type="button"
                              onClick={() => {
                                setUnlockServerKey(false);
                                setMidtransForm((p) => ({ ...p, server_key: '' }));
                              }}
                              className="text-xs text-slate-400 hover:text-white"
                            >
                              Batal ganti, pertahankan kunci tersimpan
                            </button>
                          )}
                        </div>
                      )}
                      <p className="mt-1 text-xs text-slate-500">
                        Kunci otentikasi rahasia untuk verifikasi SHA-512 dan pembuatan Snap Token. Tidak pernah dipublikasikan mentah ke browser.
                      </p>
                    </div>

                    {/* Test Connection Result */}
                    {testResult && (
                      <div className={`rounded-2xl p-4 text-sm font-bold ${
                        testResult.success
                          ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                          : 'border border-red-500/30 bg-red-500/10 text-red-200'
                      }`}>
                        {testResult.success ? '✓ ' : '✕ '}
                        {testResult.message}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-3 pt-3">
                      <button
                        type="button"
                        onClick={handleTestMidtrans}
                        disabled={testingMidtrans || (!midtransForm.server_key && !midtransForm.masked_server_key)}
                        className="rounded-xl border border-sky-500/40 bg-sky-500/10 px-5 py-3 text-sm font-black text-sky-200 hover:bg-sky-500/20 disabled:opacity-50 transition"
                      >
                        {testingMidtrans ? 'Menguji API...' : '🔍 Uji Koneksi Kredensial'}
                      </button>

                      <button
                        type="submit"
                        disabled={savingMidtrans}
                        className="flex-1 rounded-xl bg-orange-500 px-6 py-3 text-sm font-black text-white hover:bg-orange-400 disabled:opacity-50 transition shadow-lg shadow-orange-500/20"
                      >
                        {savingMidtrans ? 'Menyimpan Pengaturan...' : '💾 Simpan Konfigurasi Midtrans'}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Webhook Guide Box */}
                <div className="rounded-3xl border border-slate-700 bg-slate-800 p-6 space-y-4">
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <span>📡</span>
                    <span>Webhook Payment Notification URL</span>
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Salin URL notifikasi di bawah ini ke dashboard Midtrans agar saat pelanggan menyelesaikan pembayaran QRIS/VA, status pesanan di dapur otomatis ter-update lunas:
                  </p>

                  <div className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 p-2">
                    <input
                      type="text"
                      readOnly
                      value={resolvedWebhookUrl}
                      className="flex-1 bg-transparent px-3 py-2 font-mono text-xs text-sky-300 outline-none"
                    />
                    <button
                      type="button"
                      onClick={copyWebhookUrl}
                      className="rounded-xl bg-orange-500 px-4 py-2 text-xs font-black text-white hover:bg-orange-400 transition shrink-0"
                    >
                      {copyWebhookMsg || 'Salin URL'}
                    </button>
                  </div>

                  <div className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-4 space-y-2 text-xs leading-5 text-slate-300">
                    <strong className="block text-slate-200 font-bold">Cara Memasang di Dashboard Midtrans:</strong>
                    <ol className="list-decimal pl-4 space-y-1">
                      <li>Buka <strong>dashboard.midtrans.com</strong> (atau <strong>sandbox.midtrans.com</strong>).</li>
                      <li>Masuk ke menu <strong>Settings &gt; Configuration</strong>.</li>
                      <li>Tempel URL di atas pada kolom <strong>Payment Notification URL</strong>.</li>
                      <li>Pastikan opsi <strong>Auto-Redirect</strong> dicentang dan simpan.</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Security Shield & Architecture Info */}
              <div className="space-y-6">
                <div className="rounded-3xl border border-orange-500/30 bg-gradient-to-br from-orange-500/10 via-slate-800 to-slate-900 p-6 space-y-4">
                  <div className="flex items-center gap-2 text-orange-400">
                    <span className="text-2xl">🛡️</span>
                    <strong className="text-sm font-black uppercase tracking-wider">
                      Protokol Keamanan Finansial
                    </strong>
                  </div>

                  <ul className="space-y-3.5 text-xs text-slate-300 leading-relaxed">
                    <li className="flex gap-2.5">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <div>
                        <strong className="text-white block">Tanda Tangan SHA-512</strong>
                        Setiap payload webhook divalidasi keasliannya dengan rumus hash SHA-512 anti-spoofing sebelum pesanan disetujui.
                      </div>
                    </li>
                    <li className="flex gap-2.5">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <div>
                        <strong className="text-white block">PostgreSQL Atomic Locking</strong>
                        Menggunakan query <code className="text-amber-300 bg-black/40 px-1 py-0.5 rounded">FOR UPDATE</code> transaksi untuk mengeliminasi race condition settlement ganda.
                      </div>
                    </li>
                    <li className="flex gap-2.5">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <div>
                        <strong className="text-white block">Idempotency Guard</strong>
                        Notifikasi berulang dari server Midtrans dilewati secara aman jika pesanan sudah berstatus lunas.
                      </div>
                    </li>
                    <li className="flex gap-2.5">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <div>
                        <strong className="text-white block">Isolasi Server Key</strong>
                        Kunci rahasia tersimpan di backend database dan tidak pernah dibocorkan mentah ke browser client.
                      </div>
                    </li>
                  </ul>
                </div>

                {/* Snap Payment Methods Preview */}
                <div className="rounded-3xl border border-slate-700 bg-slate-800 p-6 space-y-3">
                  <h4 className="text-sm font-black text-white">Metode yang Didukung via Snap:</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-300">
                    <div className="rounded-xl bg-slate-900 p-2.5 text-center border border-slate-700/50">
                      📱 QRIS Dinamis
                    </div>
                    <div className="rounded-xl bg-slate-900 p-2.5 text-center border border-slate-700/50">
                      🟢 GoPay & QRIS
                    </div>
                    <div className="rounded-xl bg-slate-900 p-2.5 text-center border border-slate-700/50">
                      🟠 ShopeePay
                    </div>
                    <div className="rounded-xl bg-slate-900 p-2.5 text-center border border-slate-700/50">
                      🏦 Virtual Account
                    </div>
                    <div className="rounded-xl bg-slate-900 p-2.5 text-center border border-slate-700/50">
                      💳 Kartu Kredit/Debit
                    </div>
                    <div className="rounded-xl bg-slate-900 p-2.5 text-center border border-slate-700/50">
                      🏪 Indomaret / Alfamart
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AUDIT TRAIL LOG TRANSAKSI KEANGAN */}
          {activeTab === 'audit' && (
            <div className="space-y-6">
              {/* Filter & Action Bar */}
              <div className="flex flex-col gap-3 rounded-3xl border border-slate-700 bg-slate-800 p-5 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400 mr-1">
                    Filter Event:
                  </span>
                  {[
                    { id: 'all', label: 'Semua Event' },
                    { id: 'settled', label: '✓ Lunas' },
                    { id: 'charge', label: '⚡ Charge Dibuat' },
                    { id: 'skipped', label: '↷ Idempotency' },
                    { id: 'failed', label: '✕ Gagal/Invalid' },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setAuditFilter(filter.id)}
                      className={`rounded-xl px-3.5 py-2 text-xs font-black transition ${
                        auditFilter === filter.id
                          ? 'bg-orange-500 text-white'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                    placeholder="Cari order code..."
                    className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-xs text-white outline-none focus:border-orange-500"
                  />
                  <button
                    type="button"
                    onClick={loadAudit}
                    disabled={auditLoading}
                    className="rounded-xl bg-slate-700 px-4 py-2 text-xs font-black text-white hover:bg-slate-600 disabled:opacity-50 transition shrink-0"
                  >
                    {auditLoading ? 'Memuat...' : '🔄 Refresh Log'}
                  </button>
                </div>
              </div>

              {/* Table of Audit Logs */}
              <div className="overflow-x-auto rounded-3xl border border-slate-700 bg-slate-800">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="border-b border-slate-700 bg-slate-900/80 text-xs font-black uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="px-5 py-4">Waktu</th>
                      <th className="px-5 py-4">Order Code</th>
                      <th className="px-5 py-4">Event Transaksi</th>
                      <th className="px-5 py-4">Nominal</th>
                      <th className="px-5 py-4">Metode</th>
                      <th className="px-5 py-4">SHA-512 Valid</th>
                      <th className="px-5 py-4">IP Pengirim</th>
                      <th className="px-5 py-4 text-right">Payload Forensik</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/60">
                    {auditLoading && auditLogs.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-5 py-8 text-center text-slate-400">
                          Memuat data audit transaksi finansial...
                        </td>
                      </tr>
                    )}
                    {!auditLoading && filteredAuditLogs.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-5 py-10 text-center text-slate-400">
                          Belum ada transaksi Midtrans yang tercatat dalam audit log.
                        </td>
                      </tr>
                    )}
                    {filteredAuditLogs.map((log) => {
                      const isSettled = log.event_type === 'order_settled';
                      const isCharge = log.event_type === 'charge_created';
                      const isSkipped = log.event_type === 'idempotency_skipped';
                      const isFailed = log.event_type === 'signature_failed' || log.event_type === 'order_not_found';

                      return (
                        <tr key={log.id} className="hover:bg-slate-700/40 transition">
                          <td className="px-5 py-4 whitespace-nowrap text-xs font-medium text-slate-400">
                            {formatDateTime(log.created_at)}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap font-mono font-bold text-white">
                            {log.order_code}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-black uppercase ${
                              isSettled
                                ? 'bg-emerald-500/15 text-emerald-300'
                                : isCharge
                                ? 'bg-sky-500/15 text-sky-300'
                                : isSkipped
                                ? 'bg-amber-500/15 text-amber-300'
                                : isFailed
                                ? 'bg-red-500/15 text-red-300'
                                : 'bg-slate-700 text-slate-300'
                            }`}>
                              {log.event_type}
                            </span>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap font-bold text-white">
                            {formatRp(log.gross_amount)}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap text-xs uppercase text-slate-400">
                            {log.payment_type || '-'}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            {log.is_signature_valid ? (
                              <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-bold text-emerald-300">
                                ✓ Verified
                              </span>
                            ) : (
                              <span className="rounded-full bg-red-500/15 px-2.5 py-0.5 text-xs font-bold text-red-300">
                                ✕ Invalid
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap font-mono text-xs text-slate-500">
                            {log.ip_address || '-'}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedPayload(log.raw_payload)}
                              className="rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-600 transition"
                            >
                              Lihat JSON
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Modal Payload JSON Forensik */}
          <AnimatePresence>
            {selectedPayload && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full max-w-2xl rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                      <span>📄</span>
                      <span>Raw Payload Forensik Transaksi</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setSelectedPayload(null)}
                      className="rounded-xl bg-slate-800 p-2 text-slate-400 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="mt-4 max-h-[60vh] overflow-y-auto rounded-2xl bg-black/60 p-4 border border-slate-800">
                    <pre className="font-mono text-xs text-emerald-300 whitespace-pre-wrap leading-relaxed">
                      {JSON.stringify(selectedPayload, null, 2)}
                    </pre>
                  </div>

                  <div className="mt-5 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={copyPayloadJson}
                      className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 transition"
                    >
                      {copyPayloadMsg || 'Salin JSON Payload'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedPayload(null)}
                      className="rounded-xl bg-orange-500 px-5 py-2 text-xs font-black text-white hover:bg-orange-400 transition"
                    >
                      Tutup
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </AdminLayout>
    </AuthGuard>
  );
}