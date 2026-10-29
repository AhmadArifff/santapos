'use client';

import { Banknote, Copy, CreditCard, Landmark, QrCode, Radio, Zap } from 'lucide-react';
import { resolveAssetUrl } from '@/lib/assetUrl';

const maskAccount = (value) => {
  const text = String(value || '').replace(/\s+/g, '');
  if (!text) return 'Nomor belum diisi';
  if (text.length <= 8) return text;
  return `${text.slice(0, 4)} ${text.slice(4, 8)} ${text.slice(8, 12)} ${text.slice(12)}`.trim();
};

export default function PaymentMethodCard({
  method = {},
  active = false,
  onClick,
  compact = false,
  preview = false,
  className = '',
}) {
  const isMidtrans = method.type === 'midtrans';
  const isTransfer = method.type === 'transfer';
  const rawQrUrl = method.qr_image_url || method.qr_image || method.qr_url || method.image_url || '';
  const qrUrl = rawQrUrl ? resolveAssetUrl(rawQrUrl) : '';
  const label = method.name || (isMidtrans ? 'Bayar Otomatis (Midtrans)' : isTransfer ? 'Transfer Bank' : 'QRIS');
  const provider = method.provider_name || (isMidtrans ? 'Midtrans' : isTransfer ? 'Bank' : 'QRIS');
  const accountName = method.account_name || 'Santapos Resto';
  const accountNumber = isMidtrans ? 'QRIS / VA / E-Wallet' : maskAccount(method.account_number);
  const timeout = Number(method.payment_timeout_minutes || 0);
  const Wrapper = onClick ? 'button' : 'div';

  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`group relative w-full overflow-hidden rounded-3xl border text-left shadow-xl shadow-black/20 transition ${
        active
          ? 'border-orange-500/80 ring-2 ring-orange-500/30'
          : 'border-white/10 hover:border-orange-500/40'
      } ${className}`}
    >
      <div className={`relative min-h-[190px] p-4 text-white ${
        isMidtrans ? 'bg-gradient-to-br from-[#3D1A08] to-[#1F0C04]' : isTransfer ? 'bg-[#13251E]' : 'bg-[#14303A]'
      } ${compact ? 'sm:min-h-[168px]' : ''}`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.24),transparent_36%),linear-gradient(135deg,rgba(255,255,255,0.16),transparent_42%)]" />
        <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]" />
        <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-white/15 ring-inset" />

        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/65">
              {isMidtrans ? 'Instant Payment Gateway' : isTransfer ? 'Transfer Account' : 'Scan Payment'}
            </p>
            <h3 className="mt-1 line-clamp-2 text-lg font-black leading-tight text-white">{label}</h3>
          </div>
          <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${
            isMidtrans ? 'bg-orange-500/25 text-orange-400' : 'bg-white/12 text-white'
          }`}>
            {isMidtrans ? <Zap size={21} /> : isTransfer ? <Landmark size={21} /> : <Radio size={21} />}
          </div>
        </div>

        <div className="relative mt-5 grid grid-cols-[1fr_auto] items-end gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/60">{provider}</p>
            <p className="mt-1 break-words text-sm font-semibold text-white/85">
              {isMidtrans ? 'Otomatis Terverifikasi' : `a/n ${accountName}`}
            </p>
            <p className="mt-3 break-words font-mono text-lg font-black tracking-[0.08em] text-white">
              {accountNumber}
            </p>
          </div>

          <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl border border-white/15 bg-white/12">
            {isMidtrans ? (
              <div className="grid h-full w-full place-items-center text-orange-400">
                <Zap size={32} />
              </div>
            ) : !isTransfer && qrUrl ? (
              <img src={qrUrl} alt={label} className="h-full w-full bg-white object-contain p-1.5" />
            ) : (
              <div className="grid h-full w-full place-items-center">
                {isTransfer ? <Banknote size={28} /> : <QrCode size={28} />}
              </div>
            )}
          </div>
        </div>

        <div className="relative mt-5 flex items-center justify-between gap-3">
          <span className="rounded-full bg-black/20 px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-white/75">
            {isMidtrans ? '⚡ Bebas Upload Struk' : isTransfer ? 'Tanpa upload QR' : 'QR tersedia'}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/12 px-3 py-1 text-[11px] font-black text-white">
            <CreditCard size={13} />
            {isMidtrans ? 'Snap Otomatis' : timeout ? `${timeout} menit` : 'Manual'}
          </span>
        </div>
      </div>

      {preview && (
        <div className="border-t border-white/10 bg-[#0D0A06] px-4 py-3">
          <p className="line-clamp-2 text-xs leading-5 text-[#EDE0C4]/65">
            {method.instructions || (isMidtrans
              ? 'Bayar via QRIS Dinamis atau e-wallet, pesanan langsung masuk antrean dapur tanpa upload struk.'
              : isTransfer
              ? 'Transfer sesuai total bayar, lalu unggah bukti pembayaran.'
              : 'Scan QRIS, pastikan nominal sesuai total bayar, lalu unggah bukti pembayaran.')}
          </p>
        </div>
      )}
    </Wrapper>
  );
}

export function PaymentCopyButton({ onClick, copied, copiedLabel, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-black transition ${
        copied
          ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-200'
          : 'border-white/15 bg-white/5 text-white/80 hover:border-white/30 hover:bg-white/10'
      }`}
    >
      <Copy size={13} />
      <span>{copied ? copiedLabel || 'Disalin' : label}</span>
    </button>
  );
}
