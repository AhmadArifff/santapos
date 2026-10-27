'use client';

import { useEffect, useMemo, useState } from 'react';
import { submitCustomerPaymentProof } from '@/lib/api';
import { PAYMENT_PROOF_EXTENSIONS, acceptFromExtensions, getFileValidationError } from '@/lib/fileValidation';
import { resolveAssetUrl } from '@/lib/assetUrl';
import PaymentMethodCard, { PaymentCopyButton } from '@/components/payment/PaymentMethodCard';

const formatRp = (value) => `Rp ${Number(value || 0).toLocaleString('id-ID')}`;

const formatDateTime = (value) => {
  if (!value) return '-';
  return new Date(value).toLocaleString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatRemaining = (seconds) => {
  const safe = Math.max(0, Number(seconds || 0));
  const minutes = Math.floor(safe / 60);
  const rest = safe % 60;
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
};

export default function CustomerPaymentPanel({ order, onOrderUpdate, compact = false }) {
  const [now, setNow] = useState(Date.now());
  const [proof, setProof] = useState(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copyMessage, setCopyMessage] = useState('');
  const [accountCopyMessage, setAccountCopyMessage] = useState('');
  const [proofModalOpen, setProofModalOpen] = useState(false);
  const [messageModal, setMessageModal] = useState(null);

  const method = order?.payment_method || null;
  const payableTotal = Number(order?.final_total || order?.subtotal || 0);
  const dueAt = order?.payment_due_at ? new Date(order.payment_due_at).getTime() : null;
  const remainingSeconds = dueAt ? Math.max(0, Math.floor((dueAt - now) / 1000)) : null;
  const isExpired = dueAt ? remainingSeconds <= 0 : false;
  const hasProof = Boolean(order?.payment_proof_url || order?.payment_submitted_at);
  const isPaid = order?.payment_status === 'paid';
  const isCancelled = order?.status === 'cancelled';

  const instructionLines = useMemo(() => {
    const raw = String(method?.instructions || '').trim();
    if (!raw) {
      if (method?.type === 'transfer') {
        return [
          'Salin nomor rekening dan nominal agar tidak salah transfer.',
          'Transfer sesuai total bayar.',
          'Upload bukti transfer, lalu kirim konfirmasi agar admin bisa memverifikasi pembayaran.',
        ];
      }
      return [
        'Scan QRIS statis toko dari aplikasi pembayaran Anda.',
        'Bayar sesuai nominal yang tampil, lalu simpan bukti pembayaran.',
        'Klik tombol Saya Sudah Bayar, upload bukti, dan tunggu verifikasi admin/kasir.',
      ];
    }
    return raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  }, [method?.instructions]);

  useEffect(() => {
    if (!dueAt || hasProof || isPaid || isCancelled) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [dueAt, hasProof, isPaid, isCancelled]);

  if (!method) return null;

  const copyAmount = async () => {
    try {
      await navigator.clipboard.writeText(String(Math.round(payableTotal)));
      setCopyMessage('Nominal disalin');
      window.setTimeout(() => setCopyMessage(''), 1800);
    } catch {
      setCopyMessage('Gagal menyalin nominal');
      window.setTimeout(() => setCopyMessage(''), 1800);
    }
  };

  const copyAccount = async () => {
    if (!method.account_number) return;
    try {
      await navigator.clipboard.writeText(String(method.account_number));
      setAccountCopyMessage('Rekening disalin');
      window.setTimeout(() => setAccountCopyMessage(''), 1800);
    } catch {
      setAccountCopyMessage('Gagal menyalin');
      window.setTimeout(() => setAccountCopyMessage(''), 1800);
    }
  };

  const rawQrUrl = method.qr_image_url || method.qr_image || method.qr_url || method.image_url || '';
  const qrUrl = rawQrUrl ? resolveAssetUrl(rawQrUrl) : '';
  const proofUrl = order?.payment_proof_url ? resolveAssetUrl(order.payment_proof_url) : '';
  const isTransfer = method.type === 'transfer';

  const downloadQrImage = async () => {
    if (!qrUrl) {
      setMessageModal({
        title: 'QR belum tersedia',
        message: 'Gambar QRIS belum tersedia pada metode pembayaran ini. Silakan hubungi kasir.',
        tone: 'warning',
      });
      return;
    }

    const fileName = `qris-${order?.order_code || method.method_key || 'sultan-kebab'}.png`;
    try {
      const response = await fetch(qrUrl, { mode: 'cors' });
      if (!response.ok) throw new Error('download-failed');
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (_) {
      const link = document.createElement('a');
      link.href = qrUrl;
      link.download = fileName;
      link.rel = 'noreferrer';
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  };

  const submitProof = async () => {
    if (!proof) {
      setMessageModal({
        title: 'Bukti belum dipilih',
        message: 'Upload foto atau PDF bukti pembayaran terlebih dahulu.',
        tone: 'warning',
      });
      return;
    }
    setSubmitting(true);
    try {
      const data = new FormData();
      data.append('proof', proof);
      data.append('note', [
        note ? `Catatan: ${note}` : '',
      ].filter(Boolean).join('\n'));
      const res = await submitCustomerPaymentProof(order.order_code, data);
      onOrderUpdate?.(res.data?.data || res.data);
      setProof(null);
      setNote('');
      setMessageModal({
        title: 'Menunggu Verifikasi Admin',
        message: 'Bukti pembayaran berhasil dikirim. Kasir/admin akan memeriksa pembayaran sebelum pesanan diproses.',
        tone: 'success',
      });
    } catch (err) {
      setMessageModal({
        title: 'Bukti gagal dikirim',
        message: err.response?.data?.message || 'Gagal mengirim bukti pembayaran. Silakan coba lagi.',
        tone: 'danger',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleProofSelect = (event) => {
    const file = event.target.files?.[0] || null;
    if (!file) {
      setProof(null);
      return;
    }

    const validationError = getFileValidationError(file, {
      allowedExtensions: PAYMENT_PROOF_EXTENSIONS,
      label: 'bukti pembayaran',
      maxSizeMB: 5,
    });
    if (validationError) {
      setProof(null);
      event.target.value = '';
      setMessageModal({
        title: 'Format file tidak didukung',
        message: validationError,
        tone: 'warning',
      });
      return;
    }

    setProof(file);
  };

  return (
    <div className={`mt-5 overflow-hidden rounded-3xl border border-[#C9A84C]/20 bg-[#241C0E] ${compact ? 'p-4' : 'p-5'} text-[#F5EDD8]`}>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_220px]">
        <PaymentMethodCard method={method} compact />
        <div className="rounded-2xl border border-[#C9A84C]/18 bg-[#0D0A06]/55 px-4 py-3">
          <p className="text-xs text-[#EDE0C4]/65">Batas pembayaran</p>
          <strong className={`mt-1 block text-2xl ${isExpired && !hasProof && !isPaid ? 'text-red-200' : 'text-[#F5EDD8]'}`}>
            {isCancelled ? 'Dibatalkan' : hasProof || isPaid ? 'Terkirim' : dueAt ? formatRemaining(remainingSeconds) : '-'}
          </strong>
          {dueAt && <p className="mt-1 text-[11px] text-[#EDE0C4]/55">Sampai {formatDateTime(order.payment_due_at)}</p>}
        </div>
      </div>

      {method.type === 'qris' && (
        <button
          type="button"
          onClick={downloadQrImage}
          className="mt-4 inline-flex w-full items-center justify-center rounded-2xl border border-[#C9A84C]/35 bg-[#C9A84C]/10 px-4 py-3 text-sm font-black text-[#F5EDD8] transition hover:border-[#C9A84C]/70 hover:bg-[#C9A84C]/15"
        >
          Download QRIS untuk Scan
        </button>
      )}

      <div className="mt-4 grid gap-2 rounded-2xl border border-[#C9A84C]/15 bg-[#0D0A06]/45 p-3 sm:grid-cols-3">
        {[
          method.type === 'qris' ? '1. Scan QRIS toko' : '1. Salin rekening',
          method.type === 'qris' ? '2. Bayar sesuai nominal' : '2. Transfer sesuai nominal',
          '3. Upload bukti & tunggu verifikasi',
        ].map((step) => (
          <div key={step} className="rounded-xl bg-[#241C0E] px-3 py-2 text-xs font-bold text-[#F5EDD8]/80">
            {step}
          </div>
        ))}
      </div>

      <div className={`mt-4 grid min-w-0 gap-4 ${method.type === 'qris' && qrUrl ? 'xl:grid-cols-[minmax(180px,240px)_1fr]' : ''}`}>
        {method.type === 'qris' && qrUrl && (
          <div className="min-w-0">
            <img
              src={qrUrl}
              alt={method.name}
              className="aspect-square w-full max-w-60 rounded-2xl border border-[#C9A84C]/20 bg-white object-contain p-2"
            />
            <button
              type="button"
              onClick={downloadQrImage}
              className="mt-2 inline-flex w-full max-w-60 justify-center rounded-xl border border-[#C9A84C]/25 px-3 py-2 text-xs font-black text-[#F5EDD8]"
            >
              Download QR
            </button>
          </div>
        )}
        <div className="min-w-0 space-y-3">
          {method.account_number && (
            <div className="flex flex-col gap-2 rounded-2xl bg-[#0D0A06]/55 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs text-[#EDE0C4]/65">Nomor rekening / akun tujuan</p>
                <strong className="break-all text-lg text-[#F5EDD8]">{method.account_number}</strong>
              </div>
              <PaymentCopyButton onClick={copyAccount} copied={Boolean(accountCopyMessage)} copiedLabel={accountCopyMessage} label="Copy Rekening" />
            </div>
          )}
          <div className="rounded-2xl bg-[#0D0A06]/55 p-3">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#C9A84C]">Tata cara bayar</p>
            <ol className="mt-2 list-decimal space-y-1 pl-4 text-sm leading-6 text-[#F5EDD8]/85">
              {instructionLines.map((line, index) => <li key={`${line}-${index}`}>{line}</li>)}
            </ol>
          </div>
          <div className="flex flex-col gap-2 rounded-2xl bg-[#0D0A06]/55 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs text-[#EDE0C4]/65">Total yang harus dibayar</p>
              <strong className="text-2xl text-emerald-300">{formatRp(payableTotal)}</strong>
            </div>
            <PaymentCopyButton onClick={copyAmount} copied={Boolean(copyMessage)} copiedLabel={copyMessage} label="Copy Nominal" />
          </div>
        </div>
      </div>

      {isCancelled ? (
        <div className="mt-4 rounded-2xl border border-red-300/25 bg-red-500/15 p-3 text-sm text-red-100">
          Pesanan otomatis dibatalkan karena batas waktu pembayaran sudah habis.
          {order.cancel_reason && <p className="mt-1 text-red-100/75">{order.cancel_reason}</p>}
        </div>
      ) : isPaid ? (
        <div className="mt-4 rounded-2xl border border-emerald-300/25 bg-emerald-500/15 p-3 text-sm text-emerald-100">
          Pembayaran sudah dikonfirmasi kasir.
        </div>
      ) : hasProof ? (
        <div className="mt-4 rounded-2xl border border-emerald-300/25 bg-emerald-500/15 p-3 text-sm text-emerald-100">
          Bukti pembayaran sudah dikirim pada {formatDateTime(order.payment_submitted_at)}. Menunggu konfirmasi kasir.
          {order.payment_proof_url && (
            <button type="button" onClick={() => setProofModalOpen(true)} className="mt-2 block font-black underline">
              Lihat bukti pembayaran
            </button>
          )}
        </div>
      ) : isExpired ? (
        <div className="mt-4 rounded-2xl border border-red-300/25 bg-red-500/15 p-3 text-sm text-red-100">
          Waktu pembayaran sudah habis. Silakan hubungi kasir untuk membuat pembayaran ulang.
        </div>
      ) : (
        <div className="mt-4 space-y-3 rounded-2xl bg-[#0D0A06]/45 p-3">
          <div className="rounded-2xl border border-sky-200/15 bg-sky-300/10 p-3 text-sm leading-6 text-sky-50/85">
            {isTransfer
              ? 'Transfer cukup salin rekening dan nominal, lalu upload struk pembayaran agar admin bisa memverifikasi.'
              : 'Jika pembayaran QRIS sudah berhasil, klik tombol konfirmasi dengan melampirkan bukti pembayaran.'}
          </div>
          <input
            type="file"
            accept={acceptFromExtensions(PAYMENT_PROOF_EXTENSIONS)}
            onChange={handleProofSelect}
            className="w-full rounded-xl border border-sky-100/20 bg-[#0D0A06] px-4 py-3 text-sm text-sky-50 outline-none"
          />
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Catatan pembayaran (opsional)"
            className="max-h-28 w-full rounded-xl border border-sky-100/20 bg-[#0D0A06] px-4 py-3 text-sm text-sky-50 outline-none"
          />
          <button
            type="button"
            onClick={submitProof}
            disabled={submitting}
            className="w-full rounded-xl bg-sky-300 px-4 py-3 text-sm font-black text-[#0D0A06] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Mengirim bukti...' : method.type === 'qris' ? 'Saya Sudah Bayar & Kirim Bukti' : 'Konfirmasi & Kirim Bukti Transfer'}
          </button>
        </div>
      )}
      {messageModal && (
        <div className="fixed inset-0 z-[95] grid place-items-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className={`w-full max-w-sm rounded-3xl border p-5 shadow-2xl shadow-black/50 ${
            messageModal.tone === 'success'
              ? 'border-emerald-300/25 bg-[#10251E] text-emerald-50'
              : messageModal.tone === 'danger'
                ? 'border-red-300/25 bg-[#251010] text-red-50'
                : 'border-[#C9A84C]/25 bg-[#1A1409] text-[#F5EDD8]'
          }`}>
            <h3 className="text-xl font-black">{messageModal.title}</h3>
            <p className="mt-2 text-sm leading-6 opacity-80">{messageModal.message}</p>
            <button
              type="button"
              onClick={() => setMessageModal(null)}
              className="mt-5 w-full rounded-2xl bg-[#C9A84C] px-4 py-3 text-sm font-black text-[#0D0A06]"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
      {proofModalOpen && (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-black/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-sky-200/20 bg-[#101820] p-4 shadow-2xl shadow-black/50">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-200">Bukti Pembayaran</p>
                <h3 className="mt-1 text-lg font-black text-white">{order.order_code}</h3>
              </div>
              <button type="button" onClick={() => setProofModalOpen(false)} className="grid h-10 w-10 place-items-center rounded-full border border-white/15 text-lg font-black text-white">
                x
              </button>
            </div>
            {proofUrl.toLowerCase().includes('.pdf') ? (
              <div className="mt-4 rounded-2xl bg-black/25 p-5 text-sm text-sky-50">
                File bukti berupa PDF.
                <a href={proofUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex rounded-xl bg-sky-300 px-4 py-2 font-black text-[#0D0A06]">
                  Buka PDF
                </a>
              </div>
            ) : (
              <img src={proofUrl} alt="Bukti pembayaran" className="mt-4 max-h-[70vh] w-full rounded-2xl bg-white object-contain" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
