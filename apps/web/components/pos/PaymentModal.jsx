'use client';
import { useEffect, useMemo, useState } from 'react';
import { previewDiscount } from '@/lib/api';
import { formatIndonesianPhone, normalizeIndonesianPhoneForSubmit } from '@/lib/phoneFormat';

const PECAHAN = [100000, 50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100, 50];

const fmtPecahan = (n) => {
  if (n >= 1000) return `Rp ${(n / 1000).toLocaleString('id-ID')}rb`;
  return `Rp ${n}`;
};

const formatRp = (value) => `Rp ${Number(value || 0).toLocaleString('id-ID')}`;

const getItemProductId = (item) => Number(item?.product_id || item?.id);
const getItemSubtotal = (item) => Number(item?.subtotal || Number(item?.price || 0) * Number(item?.qty || 0));

const getDiscountedBundleItems = ({ sourceItems = [], bundleItems = [] }) => {
  const requirementByProduct = new Map(
    (bundleItems || [])
      .map((item) => [Number(item.product_id || item.id || item), Math.max(1, Number(item.qty || 1))])
      .filter(([id]) => id)
  );
  if (!requirementByProduct.size) return [];

  return (sourceItems || [])
    .filter((item) => requirementByProduct.has(getItemProductId(item)))
    .map((item) => ({
      id: item.id || item.product_id,
      name: item.product_name || item.name,
      qty: Number(item.qty || 0),
      subtotal: getItemSubtotal(item),
    }));
};

const getDiscountedScopeItems = ({ sourceItems = [], discountType, bundleItems = [], excludedProductIds = new Set() }) => {
  if (discountType === 'bundle') {
    return getDiscountedBundleItems({ sourceItems, bundleItems });
  }
  if (['voucher', 'review_reward'].includes(discountType)) {
    return (sourceItems || [])
      .filter((item) => !excludedProductIds.has(getItemProductId(item)))
      .map((item) => ({
        id: item.id || item.product_id,
        name: item.product_name || item.name,
        qty: Number(item.qty || 0),
        subtotal: getItemSubtotal(item),
      }));
  }
  return [];
};

const normalizeDiscountBreakdown = (discount) => {
  if (!discount) return [];
  if (Array.isArray(discount.breakdown) && discount.breakdown.length) return discount.breakdown;
  if (Number(discount.discount_amount || 0) <= 0) return [];
  return [{
    program_id: discount.program_id,
    label: discount.label,
    type: discount.type,
    discount_rate: discount.discount_rate,
    discount_amount: discount.discount_amount,
    discount_base: discount.discount_base || 0,
    voucher_code: discount.voucher_code,
    bundle_items: discount.bundle_items || [],
  }];
};

const getBundleExcludedIds = (breakdown = []) => new Set(
  breakdown
    .filter((item) => item.type === 'bundle')
    .flatMap((item) => item.bundle_items || [])
    .map((item) => Number(item.product_id || item.id || item))
    .filter(Boolean)
);

const getDiscountScopeTitle = (discountType) => {
  if (discountType === 'bundle') return 'Menu paket yang mendapat diskon:';
  if (discountType === 'voucher') return 'Menu yang terkena kode voucher:';
  if (discountType === 'review_reward') return 'Menu yang terkena reward review:';
  return 'Menu yang mendapat diskon:';
};

const getDiscountCardClass = (discountType) => {
  if (discountType === 'bundle') return 'border-emerald-400/20 bg-emerald-500/10 text-emerald-100/90';
  if (discountType === 'voucher') return 'border-sky-300/20 bg-sky-400/10 text-sky-100/90';
  if (discountType === 'review_reward') return 'border-orange-300/20 bg-orange-400/10 text-orange-100/90';
  return 'border-emerald-400/20 bg-emerald-500/10 text-emerald-100/90';
};

const getDiscountTitleClass = (discountType) => {
  if (discountType === 'bundle') return 'text-emerald-200';
  if (discountType === 'voucher') return 'text-sky-100';
  if (discountType === 'review_reward') return 'text-orange-200';
  return 'text-emerald-200';
};

const getDiscountNote = (component) => {
  if (component.type === 'bundle') return 'Note: Potongan paket bundle hanya dihitung dari menu paket di atas.';
  if (component.type === 'voucher') return 'Note: Potongan Kode Vocher dihitung dari menu di luar paket bundle.';
  if (component.type === 'review_reward') return 'Note: Potongan reward review dihitung dari menu di luar paket bundle.';
  return 'Note: Potongan diskon dihitung sesuai scope program.';
};

export default function PaymentModal({
  total,
  itemCount = 0,
  onPay,
  onClose,
  processing = false,
  tables = [],
  selectedTableId = '',
  onSelectTable,
  items = [],
  bundleHints = [],
}) {
  const [method, setMethod]   = useState('cash');
  const [tunai, setTunai]     = useState(0);
  const [tunaiStr, setTunaiStr] = useState('');
  const [pecahanCounts, setPecahanCounts] = useState({});
  const [customerPhone, setCustomerPhone] = useState('+62');
  const [voucherCode, setVoucherCode] = useState('');
  const [discountPreview, setDiscountPreview] = useState(null);
  const [discountLoading, setDiscountLoading] = useState(false);

  const previewItems = useMemo(
    () => items.map((item) => ({ product_id: item.id || item.product_id, qty: item.qty, price: item.price })),
    [items]
  );
  const payableTotal = Math.max(0, Number(discountPreview?.final_total ?? total));
  const discountAmount = Math.max(0, Number(discountPreview?.discount_amount || 0));
  const discountBreakdown = normalizeDiscountBreakdown(discountPreview);
  const bundleExcludedIds = getBundleExcludedIds(discountBreakdown);
  const scopedDiscountBreakdown = discountBreakdown.map((component) => ({
    ...component,
    scopeItems: getDiscountedScopeItems({
      sourceItems: items,
      discountType: component.type,
      bundleItems: component.bundle_items || [],
      excludedProductIds: component.type === 'bundle' ? new Set() : bundleExcludedIds,
    }),
  }));
  const kembalian = method === 'cash' ? tunai - payableTotal : 0;
  const canPay    = !processing && (method !== 'cash' || (tunai >= payableTotal));
  const customerPhoneForApi = normalizeIndonesianPhoneForSubmit(customerPhone);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      if (!total || previewItems.length === 0) {
        setDiscountPreview(null);
        return;
      }

      try {
        setDiscountLoading(true);
        const res = await previewDiscount({
          subtotal: total,
          items: previewItems,
          customer_phone: customerPhoneForApi,
          voucher_code: voucherCode,
        });
        if (!cancelled) setDiscountPreview(res.data?.applicable ? res.data : null);
      } catch (err) {
        if (!cancelled) {
          setDiscountPreview({
            applicable: false,
            message: err.response?.data?.message || 'Voucher belum bisa digunakan.',
            error: true,
          });
        }
      } finally {
        if (!cancelled) setDiscountLoading(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [customerPhoneForApi, previewItems, total, voucherCode]);

  const addPecahan = (p) => {
    const newVal = tunai + p;
    setTunai(newVal);
    setTunaiStr(newVal.toLocaleString('id-ID'));
    setPecahanCounts((prev) => ({
      ...prev,
      [p]: Number(prev[p] || 0) + 1,
    }));
  };

  const handleTunaiInput = (val) => {
    const clean = parseInt(val.replace(/\D/g, '')) || 0;
    setTunai(clean);
    setTunaiStr(clean > 0 ? clean.toLocaleString('id-ID') : '');
    setPecahanCounts({});
  };

  const handleMethod = (m) => {
    setMethod(m);
    setTunai(0);
    setTunaiStr('');
    setPecahanCounts({});
  };

  const methods = [
    { id: 'cash',     label: 'Tunai',    icon: '💵' },
    { id: 'qris',     label: 'QRIS',     icon: '📱' },
    { id: 'transfer', label: 'Transfer', icon: '🏦' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-3 sm:p-4" data-tour="pos-payment-modal">
      <div className="flex max-h-[calc(100vh-1.5rem)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/50 sm:max-h-[calc(100vh-2rem)]">

        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-700 px-4 py-3 sm:px-5 sm:py-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-300">Checkout Kasir</p>
            <h2 className="mt-0.5 text-lg font-bold text-white">Pembayaran</h2>
          </div>
          <button
            onClick={onClose}
            disabled={processing}
            className="text-slate-500 hover:text-slate-300 disabled:cursor-not-allowed disabled:opacity-40 text-xl leading-none transition-colors"
          >×</button>
        </div>

        <div className="grid min-h-0 flex-1 content-start gap-4 overflow-y-auto px-4 py-4 sm:px-5 lg:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)]">

          {/* Total Tagihan */}
          <div className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-800 p-4 lg:col-start-2 lg:row-start-1" data-tour="pos-payment-total">
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wide font-medium">Total Tagihan</p>
              <p className="text-orange-400 text-2xl font-black mt-0.5">
                Rp {total.toLocaleString('id-ID')}
              </p>
              {discountAmount > 0 && (
                <p className="mt-1 text-xs font-semibold text-emerald-300">
                  Setelah diskon: Rp {payableTotal.toLocaleString('id-ID')}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-bold text-slate-400">{itemCount} item</p>
            </div>
          </div>

          {/* Meja untuk status publik */}
          {tables.length > 0 && (
            <div className="lg:col-start-1 lg:row-start-1" data-tour="pos-payment-table">
              <p className="text-slate-500 text-xs uppercase tracking-wide font-medium mb-2">Meja Pelanggan</p>
              <select
                value={selectedTableId || ''}
                onChange={(e) => onSelectTable?.(e.target.value)}
                disabled={processing}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-3 text-sm font-semibold text-white outline-none focus:border-orange-500 disabled:opacity-60"
              >
                <option value="">Tanpa QR status meja</option>
                {tables.map((table) => {
                  const activeOrders = Number(table.active_order_count || 0);
                  const activeSessions = Number(table.active_session_count || 0);
                  const busy = Number(table.active_orders || 0) > 0 || activeOrders > 0 || activeSessions > 0;
                  const busyLabel = activeSessions > 0
                    ? 'sedang ditempati pelanggan'
                    : 'ada pesanan aktif';
                  return (
                    <option key={table.id} value={table.id} disabled={busy}>
                      Meja {table.table_number} {table.table_name ? `- ${table.table_name}` : ''}{busy ? ` (${busyLabel})` : ''}
                    </option>
                  );
                })}
              </select>
              <p className="mt-1 text-[11px] leading-5 text-slate-500">
                Jika dipilih, struk akan berisi QR publik untuk pelanggan memantau status pesanan dan mengunduh struk digital.
              </p>
            </div>
          )}

          {/* Voucher */}
          <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-3 lg:col-start-1 lg:row-start-2" data-tour="pos-payment-discount">
            <p className="text-slate-500 text-xs uppercase tracking-wide font-medium mb-2">Voucher & Diskon</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input
                value={customerPhone}
                onChange={(e) => setCustomerPhone(formatIndonesianPhone(e.target.value))}
                disabled={processing}
                inputMode="numeric"
                placeholder="+62895-3530-25503"
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-orange-500"
              />
              <input
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                disabled={processing}
                placeholder="Kode voucher"
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-bold uppercase text-white outline-none focus:border-orange-500"
              />
            </div>
            <div className="mt-2 max-h-[260px] overflow-y-auto rounded-lg bg-slate-900/70 px-3 py-2 text-xs lg:max-h-[230px]" data-tour="pos-payment-discount-preview">
              {discountLoading ? (
                <span className="text-slate-400">Mengecek diskon...</span>
              ) : discountPreview?.error ? (
                <span className="text-yellow-300">{discountPreview.message}</span>
              ) : discountAmount > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 text-slate-100">
                    <span>{discountPreview.label}</span>
                    <strong className="text-red-300">-{formatRp(discountAmount)}</strong>
                  </div>
                  {scopedDiscountBreakdown.map((component) => (
                    <div
                      key={`${component.type}-${component.program_id || component.label}`}
                      className={`rounded-xl border p-2 leading-5 ${getDiscountCardClass(component.type)}`}
                    >
                      <div className={`flex justify-between gap-2 font-black ${getDiscountTitleClass(component.type)}`}>
                        <span>{component.label}</span>
                        <span className="text-red-300">-{formatRp(component.discount_amount)}</span>
                      </div>
                      <p className={`font-black ${getDiscountTitleClass(component.type)}`}>{getDiscountScopeTitle(component.type)}</p>
                      {component.scopeItems.map((item) => (
                        <p key={item.id}>{item.name} x{item.qty} - dasar {formatRp(item.subtotal)}</p>
                      ))}
                      <p className="mt-1 opacity-75">
                        {getDiscountNote(component)}
                        {component.type !== 'bundle' ? ` Dasar potongan ${formatRp(component.discount_base || 0)}.` : ''}
                      </p>
                    </div>
                  ))}
                  <div className="flex items-center justify-between gap-2 border-t border-slate-700 pt-2 text-emerald-300">
                    <span>Total bayar</span>
                    <strong className="text-emerald-200">{formatRp(payableTotal)}</strong>
                  </div>
                </div>
              ) : bundleHints.some((program) => program.complete) && !customerPhoneForApi ? (
                <span className="text-yellow-300">Nomor HP wajib diisi agar diskon paket bundle bisa diklaim.</span>
              ) : bundleHints.some((program) => !program.complete && program.missingProducts?.length) ? (
                <span className="text-orange-300">
                  Tambah {bundleHints.find((program) => !program.complete && program.missingProducts?.length)?.missingProducts?.map((item) => `${item.name} x${Math.max(1, Number(item.required_qty || 1) - Number(item.current_qty || 0))}`).join(', ')} untuk membuka diskon paket.
                </span>
              ) : (
                <span className="text-slate-500">Bundle aktif otomatis terdeteksi. Voucher memakai batas klaim berdasarkan nomor HP.</span>
              )}
            </div>
          </div>

          {/* Metode Bayar */}
          <div className="lg:col-start-1 lg:row-start-3" data-tour="pos-payment-methods">
            <p className="text-slate-500 text-xs uppercase tracking-wide font-medium mb-2">Metode Bayar</p>
            <div className="grid grid-cols-3 gap-2">
              {methods.map(m => (
                <button
                  key={m.id}
                  onClick={() => handleMethod(m.id)}
                  className={`py-3 rounded-xl text-sm font-semibold transition-all border ${
                    method === m.id
                      ? 'bg-orange-500/10 border-orange-500 text-orange-400'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  <div className="text-xl mb-1">{m.icon}</div>
                  <div>{m.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Section Tunai */}
          {method === 'cash' && (
            <>
              {/* Pecahan Uang */}
              <div className="lg:col-start-2 lg:row-start-2" data-tour="pos-payment-cash-denominations">
                <p className="text-slate-500 text-xs uppercase tracking-wide font-medium mb-2">Pecahan Uang</p>
                <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6 lg:grid-cols-4 xl:grid-cols-3">
                  {PECAHAN.map(p => {
                    const count = Number(pecahanCounts[p] || 0);
                    return (
                      <button
                        key={p}
                        onClick={() => addPecahan(p)}
                        className="relative rounded-lg border border-slate-700 bg-slate-800 py-2 text-xs font-semibold text-slate-300 transition-all hover:border-orange-500 hover:bg-slate-700 hover:text-orange-400 active:scale-95"
                      >
                        {count > 0 && (
                          <span className="absolute -right-1.5 -top-1.5 min-w-6 rounded-full border border-emerald-200/50 bg-emerald-500 px-1.5 py-0.5 text-[10px] font-black leading-none text-white shadow-lg shadow-emerald-950/40">
                            {count}x
                          </span>
                        )}
                        {fmtPecahan(p)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Input Uang Diterima */}
              <div className="lg:col-start-2 lg:row-start-3" data-tour="pos-payment-cash-input">
                <label className="text-slate-500 text-xs uppercase tracking-wide font-medium block mb-2">
                  Uang Diterima
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={tunaiStr}
                    onChange={e => handleTunaiInput(e.target.value)}
                    placeholder="0"
                    className="w-full bg-slate-800 border border-slate-600 focus:border-orange-500 text-white font-bold text-lg rounded-xl pl-10 pr-4 py-3 outline-none transition-colors"
                  />
                  {tunai > 0 && (
                    <button
                      onClick={() => { setTunai(0); setTunaiStr(''); setPecahanCounts({}); }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-lg transition-colors"
                    >×</button>
                  )}
                </div>
              </div>

              {/* Kembalian */}
              <div className="lg:col-start-2 lg:row-start-4" data-tour="pos-payment-change">
                <label className="text-slate-500 text-xs uppercase tracking-wide font-medium block mb-2">
                  Kembalian
                </label>
                <div className={`w-full rounded-xl px-4 py-3 font-black text-lg border transition-colors ${
                  tunai === 0        ? 'bg-slate-800 border-slate-700 text-slate-500' :
                  kembalian >= 0     ? 'bg-green-950 border-green-800 text-green-400' :
                                       'bg-red-950 border-red-800 text-red-400'
                }`}>
                  {tunai === 0 ? 'Rp 0' :
                   kembalian >= 0
                     ? `Rp ${kembalian.toLocaleString('id-ID')}`
                     : `Kurang Rp ${Math.abs(kembalian).toLocaleString('id-ID')}`
                  }
                </div>
              </div>
            </>
          )}

          {/* Non-cash info */}
          {method !== 'cash' && (
            <div className="rounded-xl border border-slate-700 bg-slate-800 p-4 text-center lg:col-start-2" data-tour="pos-payment-noncash-note">
              <p className="text-slate-400 text-sm">
                {method === 'qris' ? '📱 Tunjukkan QR kepada pelanggan' : '🏦 Konfirmasi transfer sebelum proses'}
              </p>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex shrink-0 gap-3 border-t border-slate-700 bg-slate-900/95 px-4 py-4 sm:px-5" data-tour="pos-payment-actions">
          <button
            onClick={onClose}
            disabled={processing}
            className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-semibold rounded-xl py-3 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={() => canPay && onPay(method, tunai, kembalian, {
              customer_phone: customerPhoneForApi,
              voucher_code: voucherCode,
              discount_amount: discountAmount,
              final_total: payableTotal,
            })}
            disabled={!canPay}
            className="flex-[2] bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black rounded-xl py-3 text-base transition-colors"
          >
            {processing ? 'Memproses transaksi...' : 'Proses & Cetak Struk'}
          </button>
        </div>

      </div>
    </div>
  );
}
