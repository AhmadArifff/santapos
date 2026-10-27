'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import AdminLayout from '@/components/layout/AdminLayout';
import AuthGuard from '@/components/ui/AuthGuard';
import {
  createPaymentMethod,
  deletePaymentMethod,
  getPaymentMethods,
  hardDeletePaymentMethod,
  updatePaymentMethod,
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

function PaymentTutorialDemo() {
  const demoMethods = [
    {
      id: 'demo-qris',
      type: 'qris',
      status: 'active',
      name: 'QRIS Tutorial',
      provider_name: 'QRIS',
      account_number: '0895353025503',
      account_name: 'Sultan Kebab',
      instructions: 'Scan QRIS, pastikan nominal sesuai total bayar, lalu upload bukti pembayaran.',
      payment_timeout_minutes: 15,
    },
    {
      id: 'demo-transfer',
      type: 'transfer',
      status: 'active',
      name: 'Transfer Tutorial',
      provider_name: 'Bank',
      account_number: '123123112327',
      account_name: 'Sultan Kebab',
      instructions: 'Transfer sesuai total bayar, lalu upload bukti pembayaran.',
      payment_timeout_minutes: 15,
    },
  ];

  return (
    <div className="payment-tutorial-demo space-y-4">
      <div className="rounded-3xl border border-orange-400/35 bg-orange-500/5 p-4">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-300">Mode Demo Tutorial</p>
        <p className="mt-1 text-sm leading-6 text-slate-300">Kartu payment ini data dummy. Tidak masuk database kecuali user mengisi form asli dan klik Simpan Payment.</p>
      </div>
      {demoMethods.map((method, index) => (
        <motion.article
          key={method.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.04 }}
          data-tour={index === 0 ? 'payment-card' : undefined}
          className="rounded-3xl border border-slate-700 bg-slate-800 p-5"
        >
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px_auto] lg:items-start">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-orange-500/15 px-3 py-1 text-xs font-black uppercase text-orange-300">{method.type}</span>
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-black uppercase text-emerald-300">Aktif</span>
                <span className="rounded-full bg-slate-700 px-3 py-1 text-xs font-bold text-slate-300">{formatTimeout(method.payment_timeout_minutes)}</span>
              </div>
              <h2 className="mt-3 text-xl font-black text-white">{method.name}</h2>
              <p className="mt-1 text-sm text-slate-400">{method.provider_name} - {method.account_number}</p>
              <p className="mt-1 text-xs text-slate-500">a/n {method.account_name}</p>
              <p className="mt-3 rounded-2xl bg-slate-900/60 p-3 text-sm leading-6 text-slate-300">{method.instructions}</p>
            </div>
            <div data-tour={index === 0 ? 'payment-card-preview' : undefined}>
              <PaymentMethodCard method={method} compact preview />
            </div>
            <div data-tour={index === 0 ? 'payment-card-actions' : undefined} className="flex shrink-0 flex-col gap-3 lg:w-32">
              <button type="button" className="rounded-xl bg-slate-700 px-3 py-2 text-sm font-black text-white">Edit</button>
              <button type="button" className="rounded-xl bg-red-500/80 px-3 py-2 text-sm font-black text-white">Nonaktif</button>
              <button type="button" className="rounded-xl border border-red-500/35 bg-red-500/10 px-3 py-2 text-sm font-black text-red-200">Hapus</button>
            </div>
          </div>
        </motion.article>
      ))}
    </div>
  );
}

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

  const activeCount = useMemo(() => methods.filter((item) => item.status === 'active').length, [methods]);
  const previewMethod = useMemo(() => ({
    ...form,
    id: editing?.id || 'preview',
    name: form.name || (form.type === 'transfer' ? 'Transfer Bank' : 'QRIS Sultan Kebab'),
    provider_name: form.provider_name || (form.type === 'transfer' ? 'Bank' : 'QRIS'),
    account_name: form.account_name || 'Sultan Kebab',
    account_number: form.account_number || (form.type === 'transfer' ? '0000000000' : '0895353025503'),
    qr_image_url: form.type === 'qris'
      ? (qrPreviewUrl || (form.remove_qr === '1' ? '' : editing?.qr_image_url || ''))
      : '',
  }), [editing, form, qrPreviewUrl]);

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

  useEffect(() => {
    load();
  }, []);

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

  return (
    <AuthGuard>
      <AdminLayout>
        <div className="mx-auto max-w-7xl space-y-6">
          <div data-tour="payment-header" className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-orange-400">Payment</p>
              <h1 className="mt-2 text-3xl font-black text-white">Metode Pembayaran Pelanggan</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                Atur QRIS, transfer, instruksi bayar, dan batas waktu pembayaran untuk pesanan meja pelanggan.
              </p>
            </div>
            <div data-tour="payment-stats" className="grid grid-cols-2 gap-3 sm:w-72">
              {refreshing && (
                <div className="col-span-2 rounded-full border border-sky-500/25 bg-sky-500/10 px-3 py-1.5 text-center text-xs font-bold text-sky-200">
                  Sinkronisasi payment...
                </div>
              )}
              <div className="rounded-2xl border border-slate-700 bg-slate-800 p-4">
                <p className="text-xs text-slate-500">Aktif</p>
                <strong className="mt-1 block text-2xl text-emerald-300">{activeCount}</strong>
              </div>
              <div className="rounded-2xl border border-slate-700 bg-slate-800 p-4">
                <p className="text-xs text-slate-500">Total</p>
                <strong className="mt-1 block text-2xl text-white">{methods.length}</strong>
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
            <section data-tour="payment-list" className="space-y-4">
              <div data-tour="payment-flow" className="rounded-3xl border border-sky-500/20 bg-sky-500/10 p-5">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-sky-300">Alur tampilan pelanggan</p>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-sky-200/15 bg-slate-900/60 p-4">
                    <h3 className="font-black text-white">QRIS Manual</h3>
                    <ol className="mt-3 list-decimal space-y-2 pl-4 text-sm leading-6 text-slate-300">
                      <li>Pelanggan memilih QRIS dan melihat QR statis toko, nominal, serta countdown.</li>
                      <li>Pelanggan scan, bayar sesuai nominal, lalu klik Saya Sudah Bayar.</li>
                      <li>Pelanggan upload bukti, lalu masuk status Menunggu Verifikasi Admin.</li>
                    </ol>
                  </div>
                  <div className="rounded-2xl border border-emerald-200/15 bg-slate-900/60 p-4">
                    <h3 className="font-black text-white">Transfer Bank Manual</h3>
                    <ol className="mt-3 list-decimal space-y-2 pl-4 text-sm leading-6 text-slate-300">
                      <li>Pelanggan melihat kartu rekening: bank, nomor rekening, dan a/n pemilik.</li>
                      <li>Tombol copy rekening dan copy nominal membantu mengurangi salah input.</li>
                      <li>Pelanggan upload struk pembayaran transfer, lalu menunggu verifikasi.</li>
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
                  Belum ada metode pembayaran.
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
                      <button onClick={() => editMethod(method)} className="rounded-xl bg-slate-700 px-3 py-2 text-sm font-black text-white">
                        Edit
                      </button>
                      {method.status === 'active' && (
                        <button onClick={() => disableMethod(method)} className="rounded-xl bg-red-500/80 px-3 py-2 text-sm font-black text-white">
                          Nonaktif
                        </button>
                      )}
                      <button onClick={() => removeMethod(method)} className="rounded-xl border border-red-500/35 bg-red-500/10 px-3 py-2 text-sm font-black text-red-200">
                        Hapus
                      </button>
                    </div>
                  </div>
                </motion.article>
              ))}
            </section>

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
        </div>
      </AdminLayout>
    </AuthGuard>
  );
}
