'use client';
import { useEffect, useMemo, useState } from 'react';
import { previewDiscount } from '@/lib/api';
import { formatIndonesianPhone, normalizeIndonesianPhoneForSubmit } from '@/lib/phoneFormat';
import InteractiveFloorPlanSelector from '@/components/pos/InteractiveFloorPlanSelector';

const PECAHAN = [100000, 50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100];

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
  // Step 1: 'floor' (Pilih Meja & Kapasitas Orang) -> Step 2: 'payment' (Metode Pembayaran & Cetak Struk)
  const [checkoutStep, setCheckoutStep] = useState('floor');
  const [guestCount, setGuestCount] = useState(4);
  const [customerName, setCustomerName] = useState('');
  const [selectedTableMeta, setSelectedTableMeta] = useState({ number: '12', seats: 4, zone: 'Dining room' });

  const [method, setMethod] = useState('cash');
  const [tunai, setTunai] = useState(0);
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
  const canPay = !processing && (method !== 'cash' || tunai >= payableTotal);
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
    const clean = parseInt(val.replace(/\D/g, ''), 10) || 0;
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
    { id: 'cash', label: 'Tunai (Cash)', icon: '💵' },
    { id: 'qris', label: 'QRIS Dinamis', icon: '📱' },
    { id: 'transfer', label: 'Transfer Bank', icon: '🏦' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-3 sm:p-4"
      style={{
        background: 'rgba(8, 13, 24, 0.84)',
        backdropFilter: 'blur(8px)',
      }}
      data-tour="pos-payment-modal"
    >
      <div
        className="flex max-h-[calc(100vh-1.5rem)] w-full max-w-6xl flex-col overflow-hidden shadow-2xl"
        style={{
          background: '#0F172A',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '24px',
        }}
      >
        {/* Top Header with Step Pill Navigation */}
        <div
          className="flex shrink-0 flex-wrap items-center justify-between gap-3 px-5 py-3.5"
          style={{
            background: '#131C2E',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: '#F3A68F',
                color: '#0F172A',
                display: 'grid',
                placeItems: 'center',
                fontWeight: 900,
                fontSize: '15px',
              }}
            >
              ✦
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '10px', fontWeight: 800, letterSpacing: '0.16em', color: '#F3A68F', textTransform: 'uppercase' }}>
                Alur Kasir POS · Meja & Pembayaran
              </p>
              <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#F8FAFC' }}>
                {checkoutStep === 'floor'
                  ? 'Langkah 1: Pilih Meja Sesuai Kapasitas Tamu'
                  : 'Langkah 2: Konfirmasi Pembayaran & Cetak Struk'}
              </h2>
            </div>
          </div>

          {/* Center Step Switcher Pill */}
          <div
            style={{
              display: 'inline-flex',
              background: '#0B111E',
              padding: '4px',
              borderRadius: '999px',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <button
              type="button"
              onClick={() => setCheckoutStep('floor')}
              style={{
                padding: '6px 15px',
                borderRadius: '999px',
                border: 'none',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                background: checkoutStep === 'floor' ? '#F3A68F' : 'transparent',
                color: checkoutStep === 'floor' ? '#0F172A' : '#94A3B8',
              }}
            >
              1. 🗺️ Pilih Meja ({guestCount > 0 ? `${guestCount} Orang` : 'Takeaway'})
            </button>
            <button
              type="button"
              onClick={() => setCheckoutStep('payment')}
              style={{
                padding: '6px 15px',
                borderRadius: '999px',
                border: 'none',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                background: checkoutStep === 'payment' ? '#BCE3D4' : 'transparent',
                color: checkoutStep === 'payment' ? '#0F172A' : '#94A3B8',
              }}
            >
              2. 💳 Bayar ({formatRp(payableTotal)})
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={processing}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: '#1E2C46',
              border: 'none',
              color: '#CBD5E1',
              fontSize: '16px',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {/* BODY CONTENT */}
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
          {checkoutStep === 'floor' ? (
            /* ================= STEP 1: INTERACTIVE FLOOR PLAN & CAPACITY SELECTOR ================= */
            <div className="space-y-4">
              <InteractiveFloorPlanSelector
                tables={tables}
                selectedTableId={selectedTableId}
                onSelectTable={(dbId, nodeMeta) => {
                  onSelectTable?.(dbId);
                  if (nodeMeta) {
                    setSelectedTableMeta({
                      number: nodeMeta.number,
                      seats: nodeMeta.seats,
                      zone: 'Dining room',
                    });
                  } else if (!dbId) {
                    setSelectedTableMeta(null);
                  }
                }}
                guestCount={guestCount}
                onGuestCountChange={setGuestCount}
                customerName={customerName}
                onCustomerNameChange={setCustomerName}
                compact={true}
                showWaitlistAndServers={false}
                onConfirmAndProceed={() => setCheckoutStep('payment')}
              />
            </div>
          ) : (
            /* ================= STEP 2: PAYMENT METHOD, VOUCHER, CASH & CHANGE ================= */
            <div className="grid content-start gap-4 lg:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)]">
              {/* Selected Table Banner + Total Bill */}
              <div
                className="flex items-center justify-between rounded-2xl p-4 lg:col-start-2 lg:row-start-1"
                style={{
                  background: '#131C2E',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
                data-tour="pos-payment-total"
              >
                <div>
                  <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#94A3B8' }}>
                    Total Tagihan ({itemCount} Menu)
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: '26px', fontWeight: 900, color: '#F3A68F' }}>
                    {formatRp(total)}
                  </p>
                  {discountAmount > 0 && (
                    <p style={{ margin: '4px 0 0', fontSize: '12px', fontWeight: 700, color: '#9CE2C6' }}>
                      Setelah diskon: {formatRp(payableTotal)}
                    </p>
                  )}
                </div>

                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setCheckoutStep('floor')}
                    style={{
                      background: '#EFE2A8',
                      color: '#18181B',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '7px 12px',
                      fontSize: '11.5px',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    {selectedTableMeta && guestCount > 0
                      ? `🪑 Meja ${selectedTableMeta.number} (${guestCount} Org) ✎`
                      : '🛍️ Takeaway (Ubah Meja) ✎'}
                  </button>
                </div>
              </div>

              {/* Meja Dropdown Fallback & Confirmation */}
              <div
                className="rounded-2xl p-3.5 lg:col-start-1 lg:row-start-1"
                style={{
                  background: '#131C2E',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
                data-tour="pos-payment-table"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-slate-400 text-xs uppercase tracking-wide font-bold">
                    Meja & Kapasitas Pelanggan
                  </p>
                  <button
                    type="button"
                    onClick={() => setCheckoutStep('floor')}
                    className="text-xs font-bold text-orange-300 hover:underline"
                  >
                    🗺️ Buka Denah Floor Plan →
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value={selectedTableId || ''}
                    onChange={(e) => onSelectTable?.(e.target.value)}
                    disabled={processing}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm font-semibold text-white outline-none focus:border-orange-400"
                  >
                    <option value="">
                      {selectedTableMeta?.number
                        ? `Meja ${selectedTableMeta.number} (${guestCount} Tamu - Floor Plan)`
                        : 'Takeaway / Tanpa Meja'}
                    </option>
                    {tables.map((table) => (
                      <option key={table.id} value={table.id}>
                        Meja {table.table_number} {table.table_name ? `- ${table.table_name}` : ''}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    placeholder="Nama Tamu (opsional)"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-orange-400"
                  />
                </div>
              </div>

              {/* Voucher & Diskon */}
              <div
                className="rounded-2xl p-3.5 lg:col-start-1 lg:row-start-2"
                style={{
                  background: '#131C2E',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
                data-tour="pos-payment-discount"
              >
                <p className="text-slate-400 text-xs uppercase tracking-wide font-bold mb-2">
                  Voucher & Diskon Otomatis
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <input
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(formatIndonesianPhone(e.target.value))}
                    disabled={processing}
                    inputMode="numeric"
                    placeholder="+62895-3530-25503"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-orange-400"
                  />
                  <input
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                    disabled={processing}
                    placeholder="KODE VOUCHER"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-bold uppercase text-white outline-none focus:border-orange-400"
                  />
                </div>

                <div
                  className="mt-2 max-h-[180px] overflow-y-auto rounded-xl bg-slate-950/60 px-3 py-2 text-xs"
                  data-tour="pos-payment-discount-preview"
                >
                  {discountLoading ? (
                    <span className="text-slate-400">Mengecek diskon...</span>
                  ) : discountPreview?.error ? (
                    <span className="text-yellow-300">{discountPreview.message}</span>
                  ) : discountAmount > 0 ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2 text-slate-100">
                        <span>{discountPreview.label}</span>
                        <strong className="text-red-300">-{formatRp(discountAmount)}</strong>
                      </div>
                      {scopedDiscountBreakdown.map((component) => (
                        <div key={`${component.type}-${component.label}`} className="text-slate-300">
                          {component.label}: -{formatRp(component.discount_amount)}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-400">
                      Paket bundle aktif otomatis terdeteksi. Masukkan nomor HP pelanggan untuk klaim voucher.
                    </span>
                  )}
                </div>
              </div>

              {/* Metode Bayar */}
              <div className="lg:col-start-1 lg:row-start-3" data-tour="pos-payment-methods">
                <p className="text-slate-400 text-xs uppercase tracking-wide font-bold mb-2">
                  Pilih Metode Pembayaran
                </p>
                <div className="grid grid-cols-3 gap-2.5">
                  {methods.map((m) => {
                    const active = method === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleMethod(m.id)}
                        style={{
                          padding: '12px 10px',
                          borderRadius: '16px',
                          border: active ? '2px solid #F3A68F' : '1px solid rgba(255,255,255,0.08)',
                          background: active ? 'rgba(243, 166, 143, 0.16)' : '#131C2E',
                          color: active ? '#F3A68F' : '#CBD5E1',
                          fontWeight: 700,
                          fontSize: '13px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div className="text-xl mb-1">{m.icon}</div>
                        <div>{m.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section Tunai */}
              {method === 'cash' && (
                <>
                  <div className="lg:col-start-2 lg:row-start-2" data-tour="pos-payment-cash-denominations">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-slate-400 text-xs uppercase tracking-wide font-bold">
                        Pecahan Uang Cepat
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setTunai(payableTotal);
                          setTunaiStr(payableTotal.toLocaleString('id-ID'));
                        }}
                        style={{
                          background: '#EADCA6',
                          color: '#18181B',
                          border: 'none',
                          borderRadius: '999px',
                          padding: '3px 10px',
                          fontSize: '11px',
                          fontWeight: 800,
                          cursor: 'pointer',
                        }}
                      >
                        ⚡ Uang Pas ({formatRp(payableTotal)})
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-5 lg:grid-cols-4">
                      {PECAHAN.map((p) => {
                        const count = Number(pecahanCounts[p] || 0);
                        return (
                          <button
                            key={p}
                            type="button"
                            onClick={() => addPecahan(p)}
                            className="relative rounded-xl border border-slate-700 bg-slate-800/90 py-2 text-xs font-bold text-slate-200 transition hover:border-orange-400 hover:text-orange-300"
                          >
                            {count > 0 && (
                              <span className="absolute -right-1.5 -top-1.5 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[10px] font-black text-black">
                                {count}x
                              </span>
                            )}
                            {fmtPecahan(p)}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="lg:col-start-2 lg:row-start-3" data-tour="pos-payment-cash-input">
                    <label className="text-slate-400 text-xs uppercase tracking-wide font-bold block mb-1.5">
                      Uang Diterima
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                        Rp
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={tunaiStr}
                        onChange={(e) => handleTunaiInput(e.target.value)}
                        placeholder="0"
                        className="w-full bg-slate-900 border border-slate-700 focus:border-orange-400 text-white font-black text-lg rounded-xl pl-10 pr-10 py-3 outline-none"
                      />
                      {tunai > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setTunai(0);
                            setTunaiStr('');
                            setPecahanCounts({});
                          }}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-lg"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="lg:col-start-2 lg:row-start-4" data-tour="pos-payment-change">
                    <label className="text-slate-400 text-xs uppercase tracking-wide font-bold block mb-1.5">
                      Kembalian
                    </label>
                    <div
                      className={`w-full rounded-xl px-4 py-3 font-black text-lg border ${
                        tunai === 0
                          ? 'bg-slate-900 border-slate-800 text-slate-500'
                          : kembalian >= 0
                          ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300'
                          : 'bg-red-950/60 border-red-800 text-red-300'
                      }`}
                    >
                      {tunai === 0
                        ? 'Rp 0'
                        : kembalian >= 0
                        ? `Rp ${kembalian.toLocaleString('id-ID')}`
                        : `Kurang Rp ${Math.abs(kembalian).toLocaleString('id-ID')}`}
                    </div>
                  </div>
                </>
              )}

              {method !== 'cash' && (
                <div
                  className="rounded-2xl border border-slate-700 bg-slate-800/70 p-5 text-center lg:col-start-2"
                  data-tour="pos-payment-noncash-note"
                >
                  <p className="text-slate-200 text-sm font-semibold">
                    {method === 'qris'
                      ? '📱 QRIS Dinamis siap ditampilkan pada layar & struk pelanggan'
                      : '🏦 Silakan verifikasi bukti transfer sebelum menekan tombol Proses'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Action Footer */}
        <div
          className="flex shrink-0 items-center justify-between gap-3 px-5 py-3.5"
          style={{
            background: '#131C2E',
            borderTop: '1px solid rgba(255,255,255,0.08)',
          }}
          data-tour="pos-payment-actions"
        >
          {checkoutStep === 'floor' ? (
            <>
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: '#1E2C46',
                  color: '#CBD5E1',
                  border: 'none',
                  borderRadius: '999px',
                  padding: '10px 22px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                ← Kembali ke Menu Produk
              </button>

              <div className="flex items-center gap-3">
                <span className="hidden sm:inline text-xs text-slate-400">
                  {selectedTableMeta && guestCount > 0
                    ? `Meja ${selectedTableMeta.number} (${guestCount} Kursi) siap digunakan`
                    : 'Pesanan Takeaway (Tanpa Meja)'}
                </span>
                <button
                  type="button"
                  onClick={() => setCheckoutStep('payment')}
                  style={{
                    background: '#F3A68F',
                    color: '#0F172A',
                    border: 'none',
                    borderRadius: '999px',
                    padding: '11px 26px',
                    fontSize: '13.5px',
                    fontWeight: 900,
                    cursor: 'pointer',
                    boxShadow: '0 8px 24px rgba(243, 166, 143, 0.35)',
                  }}
                >
                  Lanjut ke Pembayaran ({formatRp(payableTotal)}) →
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setCheckoutStep('floor')}
                disabled={processing}
                style={{
                  background: '#1E2C46',
                  color: '#CBD5E1',
                  border: 'none',
                  borderRadius: '999px',
                  padding: '10px 20px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                ← Ubah Meja / Floor Plan
              </button>

              <button
                type="button"
                onClick={() =>
                  canPay &&
                  onPay(method, tunai, kembalian, {
                    customer_phone: customerPhoneForApi,
                    voucher_code: voucherCode,
                    discount_amount: discountAmount,
                    final_total: payableTotal,
                    customer_name: customerName,
                    guest_count: guestCount,
                    table_number: selectedTableMeta?.number,
                  })
                }
                disabled={!canPay}
                style={{
                  background: canPay ? '#BCE3D4' : '#1E293B',
                  color: canPay ? '#0F172A' : '#64748B',
                  border: 'none',
                  borderRadius: '999px',
                  padding: '11px 28px',
                  fontSize: '14px',
                  fontWeight: 900,
                  cursor: canPay ? 'pointer' : 'not-allowed',
                  boxShadow: canPay ? '0 8px 24px rgba(188, 227, 212, 0.3)' : 'none',
                }}
              >
                {processing ? 'Memproses Transaksi...' : '✓ Proses & Cetak Struk'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
