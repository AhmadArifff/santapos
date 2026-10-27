'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import AdminLayout from '@/components/layout/AdminLayout';
import AuthGuard from '@/components/ui/AuthGuard';
import QRCodeCard from '@/components/customer/QRCodeCard';
import SectionSkeleton from '@/components/ui/SectionSkeleton';
import {
  createDiningTable,
  deleteDiningTable,
  getCustomerOrders,
  getManagedDiningTables,
  updateCustomerOrderStatus,
  updateDiningTable,
} from '@/lib/api';
import { showConfirm, showPrompt } from '@/lib/modalDialog';
import { useAuthStore } from '@/store/authStore';
import { resolveAssetUrl } from '@/lib/assetUrl';

const emptyTable = {
  table_number: '',
  table_name: '',
  capacity: 2,
  status: 'active',
  note: '',
  branch_id: '',
};

const statusLabels = {
  pending: 'Menunggu',
  accepted: 'Diterima',
  preparing: 'Disiapkan',
  ready: 'Siap Diantarkan Ke Meja',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
};

const nextActionByStatus = {
  pending: { status: 'accepted', label: '1. Terima', color: 'bg-blue-500 hover:bg-blue-400' },
  accepted: { status: 'preparing', label: '2. Siapkan', color: 'bg-yellow-500 hover:bg-yellow-400' },
  preparing: { status: 'ready', label: '3. Siap Diantar', color: 'bg-emerald-500 hover:bg-emerald-400' },
  ready: { status: 'completed', label: '4. Selesai', color: 'bg-orange-500 hover:bg-orange-400' },
};

const statusFilters = [
  { value: 'all', label: 'Semua' },
  { value: 'pending', label: 'Menunggu' },
  { value: 'accepted', label: 'Diterima' },
  { value: 'preparing', label: 'Disiapkan' },
  { value: 'ready', label: 'Siap Diantar' },
  { value: 'completed', label: 'Selesai' },
  { value: 'cancelled', label: 'Dibatalkan' },
];

const batchStatusActions = [
  { status: 'accepted', label: 'Diterima', color: 'bg-blue-500 hover:bg-blue-400' },
  { status: 'preparing', label: 'Disiapkan', color: 'bg-yellow-500 hover:bg-yellow-400' },
  { status: 'ready', label: 'Siap Diantar', color: 'bg-emerald-500 hover:bg-emerald-400' },
  { status: 'completed', label: 'Selesai', color: 'bg-orange-500 hover:bg-orange-400' },
  { status: 'cancelled', label: 'Batalkan', color: 'bg-red-500 hover:bg-red-400' },
];

const formatRp = (value) => `Rp ${Number(value || 0).toLocaleString('id-ID')}`;
const formatDateTime = (value) => value
  ? new Date(value).toLocaleString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  : '-';
const toDateKey = (date = new Date()) => {
  const safeDate = date instanceof Date ? date : new Date(date);
  const year = safeDate.getFullYear();
  const month = String(safeDate.getMonth() + 1).padStart(2, '0');
  const day = String(safeDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const todayKey = () => toDateKey(new Date());
const parseDateKey = (value) => {
  const [year, month, day] = String(value || todayKey()).split('-').map(Number);
  return new Date(year, month - 1, day);
};
const formatDateLabel = (value) => parseDateKey(value).toLocaleDateString('id-ID', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});
const isDateInRange = (dateKey, start, end) => dateKey >= start && dateKey <= (end || start);
const sameDateKey = (a, b) => String(a || '') === String(b || '');

function DateRangePicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [monthDate, setMonthDate] = useState(() => parseDateKey(value.start));
  const start = value.start || todayKey();
  const end = value.end || value.start || todayKey();
  const monthLabel = monthDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const lastDay = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
  const leadingBlanks = (firstDay.getDay() + 6) % 7;
  const days = [
    ...Array.from({ length: leadingBlanks }, (_, index) => ({ key: `blank-${index}`, blank: true })),
    ...Array.from({ length: lastDay.getDate() }, (_, index) => {
      const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), index + 1);
      return { key: toDateKey(date), date };
    }),
  ];

  const pickDate = (dateKey) => {
    if (!value.start || (value.start && value.end)) {
      onChange({ start: dateKey, end: '' });
      return;
    }
    if (dateKey < value.start) onChange({ start: dateKey, end: value.start });
    else onChange({ start: value.start, end: dateKey });
    setOpen(false);
  };

  const moveMonth = (offset) => {
    setMonthDate((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-left text-sm font-bold text-white outline-none transition hover:border-orange-500/70"
      >
        <span className="block text-[10px] uppercase tracking-[0.18em] text-slate-500">Tanggal Pesanan</span>
        {formatDateLabel(start)} {end && !sameDateKey(start, end) ? `- ${formatDateLabel(end)}` : ''}
      </button>
      {open && (
        <div className="absolute left-0 top-full z-40 mt-2 w-[min(340px,calc(100vw-2rem))] rounded-3xl border border-slate-700 bg-slate-900 p-4 shadow-2xl shadow-black/40">
          <div className="flex items-center justify-between gap-3">
            <button type="button" onClick={() => moveMonth(-1)} className="grid h-9 w-9 place-items-center rounded-full bg-slate-800 text-white">‹</button>
            <strong className="text-sm text-white">{monthLabel}</strong>
            <button type="button" onClick={() => moveMonth(1)} className="grid h-9 w-9 place-items-center rounded-full bg-slate-800 text-white">›</button>
          </div>
          <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[11px] font-bold uppercase text-slate-500">
            {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((day) => <span key={day}>{day}</span>)}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-1">
            {days.map((item) => item.blank ? (
              <span key={item.key} />
            ) : (
              <button
                key={item.key}
                type="button"
                onClick={() => pickDate(item.key)}
                className={`h-10 rounded-xl text-sm font-black transition ${
                  sameDateKey(item.key, start) || sameDateKey(item.key, end)
                    ? 'bg-orange-500 text-white'
                    : isDateInRange(item.key, start, end)
                      ? 'bg-orange-500/15 text-orange-200'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {item.date.getDate()}
              </button>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => { const today = todayKey(); onChange({ start: today, end: today }); setMonthDate(parseDateKey(today)); setOpen(false); }}
              className="flex-1 rounded-xl bg-slate-800 px-3 py-2 text-xs font-black text-slate-200"
            >
              Hari Ini
            </button>
            <button type="button" onClick={() => setOpen(false)} className="flex-1 rounded-xl bg-orange-500 px-3 py-2 text-xs font-black text-white">
              Terapkan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const discountTypeMeta = {
  bundle: {
    label: 'Paket Bundle',
    badge: 'bg-emerald-500/15 text-emerald-300',
    panel: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100',
  },
  voucher: {
    label: 'Kode Voucher',
    badge: 'bg-sky-500/15 text-sky-300',
    panel: 'border-sky-500/20 bg-sky-500/10 text-sky-100',
  },
  review_reward: {
    label: 'Reward Review',
    badge: 'bg-amber-500/15 text-amber-300',
    panel: 'border-amber-500/20 bg-amber-500/10 text-amber-100',
  },
};

const getDiscountComponents = (order) => {
  if (Array.isArray(order?.discount_breakdown) && order.discount_breakdown.length) {
    return order.discount_breakdown.filter((item) => Number(item.discount_amount || 0) > 0);
  }
  if (Number(order?.discount_amount || 0) <= 0) return [];
  return [{
    type: order.discount_program_type || 'discount',
    label: order.discount_label || 'Diskon',
    discount_amount: order.discount_amount,
  }];
};

const getDiscountTypeLabel = (type) => discountTypeMeta[type]?.label || 'Diskon';

const getDiscountValueText = (component) => {
  const value = Number(component?.discount_value || 0);
  if (!value) return '';
  return component.discount_type === 'fixed' ? formatRp(value) : `${value}%`;
};

const getDiscountBadgeText = (component) => [
  getDiscountTypeLabel(component.type),
  getDiscountValueText(component),
].filter(Boolean).join(' ');

function Stars({ value = 0, size = 'text-sm' }) {
  const rating = Math.max(0, Math.min(5, Number(value || 0)));
  return (
    <span className={`inline-flex items-center gap-0.5 ${size}`} aria-label={`${rating} dari 5 bintang`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={star <= rating ? 'text-yellow-300' : 'text-slate-600'}>
          {star <= rating ? '★' : '☆'}
        </span>
      ))}
    </span>
  );
}

function CustomerOrdersTutorialDemo({ isAdmin }) {
  return (
    <div className="customer-orders-tutorial-demo grid gap-4 rounded-3xl border border-orange-400/35 bg-orange-500/5 p-4">
      <div className="rounded-2xl border border-orange-400/25 bg-slate-950/70 px-4 py-3">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-300">Mode Demo Tutorial</p>
        <p className="mt-1 text-sm leading-6 text-slate-300">
          Data di bawah adalah contoh dummy untuk latihan membaca alur. Tidak tersimpan ke database kecuali user memilih aksi simpan pada form asli.
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-start">
        <article
          className="rounded-3xl border border-slate-700 bg-slate-800 p-5 shadow-xl shadow-black/10"
          data-tour="customer-orders-demo-card"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2" data-tour="customer-orders-demo-status-badges">
                <span className="rounded-full bg-orange-500/15 px-3 py-1 text-xs font-black uppercase text-orange-300">
                  Meja 03
                </span>
                <span className="rounded-full bg-blue-500/15 px-3 py-1 text-xs font-black uppercase text-blue-300">
                  Diterima
                </span>
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-black text-emerald-300">
                  Paket Bundle 50%
                </span>
                <span className="rounded-full bg-sky-500/15 px-3 py-1 text-xs font-black text-sky-300">
                  Kode Voucher 5%
                </span>
              </div>
              <h2 className="mt-3 text-xl font-black text-white">ORD-DEMO-20260608-0001</h2>
              <p className="mt-1 text-sm text-slate-400">Pelanggan Tutorial - 6281234567890</p>
            </div>
            <div className="text-left lg:text-right" data-tour="customer-orders-demo-total">
              <p className="text-xs text-slate-500">Total pesanan</p>
              <strong className="text-2xl text-orange-400">{formatRp(144400)}</strong>
              <div className="mt-2 space-y-1 text-xs">
                <p className="text-emerald-300">Paket Bundle: Test Bundle -{formatRp(62000)}</p>
                <p className="text-sky-300">Kode Voucher: KEBABDEMO13 -{formatRp(7600)}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto]">
            <div className="rounded-2xl bg-slate-900/60 p-3" data-tour="customer-orders-demo-items">
              {[
                ['Adana Kebab Platter', 1, 89000],
                ['Arabic Qahwa Coffee', 1, 35000],
                ['Ayran Sultan', 1, 28000],
              ].map(([name, qty, subtotal]) => (
                <div key={name} className="flex justify-between gap-3 border-b border-slate-700/60 py-2 text-sm last:border-0">
                  <span className="text-slate-300">{name} x{qty}</span>
                  <span className="font-bold text-white">{formatRp(subtotal)}</span>
                </div>
              ))}
              <div className="mt-3 space-y-2 border-t border-slate-700/60 pt-3" data-tour="customer-orders-demo-discounts">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Diskon terpakai</p>
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-100">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-black">Paket Bundle 50%</span>
                    <strong className="text-red-300">-{formatRp(62000)}</strong>
                  </div>
                  <p className="mt-1 font-semibold">Test Bundle</p>
                  <p className="mt-1 opacity-80">Dasar potongan: {formatRp(124000)}</p>
                </div>
                <div className="rounded-xl border border-sky-500/20 bg-sky-500/10 p-3 text-xs text-sky-100">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-black">Kode Voucher 5%</span>
                    <strong className="text-red-300">-{formatRp(7600)}</strong>
                  </div>
                  <p className="mt-1 font-semibold">Voucher Tutorial</p>
                  <p className="mt-1 opacity-80">Kode: KEBABDEMO13</p>
                </div>
              </div>
              <div className="mt-3 rounded-xl bg-slate-950/45 p-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-slate-200">Rating menu demo</span>
                  <Stars value={5} />
                </div>
                <p className="mt-1 text-xs text-slate-400">Menu enak dan pelayanan cepat.</p>
              </div>
              <p className="mt-3 text-xs italic text-slate-500">Catatan: Jangan terlalu pedas.</p>
              <div className="mt-3 rounded-xl border border-sky-500/20 bg-sky-500/10 p-3 text-xs text-sky-100" data-tour="customer-orders-demo-payment">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold">Pembayaran: QRIS Tutorial</span>
                  <span className="rounded-full bg-yellow-500/20 px-2 py-1 font-black uppercase text-yellow-100">
                    Bukti dikirim
                  </span>
                </div>
                <p className="mt-1 text-sky-100/70">Deadline: 08/06/2026, 19.45</p>
                <button type="button" className="mt-2 inline-flex font-black text-sky-200 underline">
                  Lihat bukti pembayaran
                </button>
                <p className="mt-1 text-sky-100/70">Catatan bayar: Nominal sudah sesuai.</p>
              </div>
              <div className="mt-3 rounded-xl border border-sky-500/20 bg-sky-500/10 p-3 text-xs text-sky-100" data-tour="customer-orders-demo-proof-modal">
                <p className="font-black uppercase tracking-[0.16em] text-sky-300">Preview modal bukti</p>
                <div className="mt-3 grid min-h-36 place-items-center rounded-2xl bg-white text-center text-slate-950">
                  <div>
                    <p className="text-sm font-black">Bukti Pembayaran Demo</p>
                    <p className="mt-1 text-xs">QRIS - Rp 144.400</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 lg:w-44 lg:flex-col" data-tour="customer-orders-demo-status-actions">
              {[
                ['2. Siapkan', 'bg-yellow-500'],
                ['3. Siap Diantar', 'bg-emerald-500'],
                ['4. Selesai', 'bg-orange-500'],
                ['Batalkan', 'bg-red-500'],
              ].map(([label, color]) => (
                <button key={label} type="button" className={`${color} rounded-xl px-3 py-2 text-xs font-black text-white`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </article>
        <label
          data-tour="customer-orders-demo-select"
          className="flex items-center justify-center gap-2 rounded-2xl border border-orange-500 bg-orange-500/15 px-4 py-3 text-xs font-black text-orange-200 transition lg:min-h-[112px] lg:w-20 lg:flex-col"
        >
          <input type="checkbox" checked readOnly className="h-5 w-5 accent-orange-500" />
          Pilih
        </label>
      </div>
    </div>
  );
}

const getOrderUrl = (token) => {
  if (typeof window === 'undefined') return `/order/${token}`;
  return `${window.location.origin}/order/${token}`;
};

const showFeedbackModal = (type, title, message) => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('app:feedback', {
    detail: { type, title, message },
  }));
};

export default function CustomerOrdersPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState(() => {
    const today = todayKey();
    return { start: today, end: today };
  });
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [tableForm, setTableForm] = useState(emptyTable);
  const [editingTable, setEditingTable] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [proofModal, setProofModal] = useState(null);

  const load = async ({ silent = false } = {}) => {
    if (silent || orders.length > 0) setRefreshing(true);
    else setLoading(true);
    try {
      const [ordersRes, tablesRes] = await Promise.all([
        getCustomerOrders({
          date_from: dateRange.start || todayKey(),
          date_to: dateRange.end || dateRange.start || todayKey(),
          search: search.trim() || undefined,
          limit: 200,
        }),
        isAdmin ? getManagedDiningTables() : Promise.resolve({ data: [] }),
      ]);
      setOrders(ordersRes.data || []);
      setTables(tablesRes.data || []);
      setSelectedTable((prev) => {
        const rows = tablesRes.data || [];
        if (prev && rows.some((table) => Number(table.id) === Number(prev.id))) return prev;
        return rows[0] || null;
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
    const timer = window.setInterval(() => load({ silent: true }), 10000);
    return () => window.clearInterval(timer);
  }, [isAdmin, dateRange.start, dateRange.end, search]);

  const visibleOrders = useMemo(
    () => (status === 'all' ? orders : orders.filter((order) => order.status === status)),
    [orders, status]
  );

  useEffect(() => {
    const visibleIds = new Set(visibleOrders.map((order) => Number(order.id)));
    setSelectedOrderIds((prev) => prev.filter((id) => visibleIds.has(Number(id))));
  }, [visibleOrders]);

  const statusCounts = useMemo(() => {
    const counts = { all: orders.length };
    statusFilters.forEach((item) => {
      if (item.value !== 'all') {
        counts[item.value] = orders.filter((order) => order.status === item.value).length;
      }
    });
    return counts;
  }, [orders]);

  const stats = useMemo(() => {
    const active = orders.filter((order) => !['completed', 'cancelled'].includes(order.status)).length;
    const revenue = orders.reduce((sum, order) => sum + Number(order.final_total || order.subtotal || 0), 0);
    return {
      total: orders.length,
      active,
      completed: orders.filter((order) => order.status === 'completed').length,
      revenue,
    };
  }, [orders]);

  const selectedOrders = useMemo(
    () => visibleOrders.filter((order) => selectedOrderIds.includes(Number(order.id))),
    [selectedOrderIds, visibleOrders]
  );
  const selectableOrders = useMemo(
    () => visibleOrders.filter((order) => !['completed', 'cancelled'].includes(order.status)),
    [visibleOrders]
  );
  const allVisibleSelected = selectableOrders.length > 0 && selectedOrderIds.length === selectableOrders.length;

  const toggleOrderSelection = (orderId) => {
    const id = Number(orderId);
    const order = visibleOrders.find((item) => Number(item.id) === id);
    if (!order || ['completed', 'cancelled'].includes(order.status)) return;
    setSelectedOrderIds((prev) => (
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    ));
  };

  const toggleSelectAllVisible = () => {
    setSelectedOrderIds(allVisibleSelected ? [] : selectableOrders.map((order) => Number(order.id)));
  };

  const canApplyStatus = (order, nextStatus) => {
    if (nextStatus === 'cancelled') return !['completed', 'cancelled'].includes(order.status);
    return nextActionByStatus[order.status]?.status === nextStatus;
  };

  const saveTable = async (e) => {
    e.preventDefault();
    try {
      if (editingTable) {
        await updateDiningTable(editingTable.id, tableForm);
      } else {
        await createDiningTable(tableForm);
      }
      setTableForm(emptyTable);
      setEditingTable(null);
      await load({ silent: true });
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menyimpan meja');
    }
  };

  const editTable = (table) => {
    setEditingTable(table);
    setTableForm({
      table_number: table.table_number || '',
      table_name: table.table_name || '',
      capacity: table.capacity || 2,
      status: table.status || 'active',
      note: table.note || '',
      branch_id: table.branch_id || '',
    });
    setSelectedTable(table);
  };

  const removeTable = async (table) => {
    const confirmed = await showConfirm(`Nonaktifkan meja ${table.table_number}?`, {
      title: 'Nonaktifkan Meja',
      confirmText: 'Nonaktifkan',
      tone: 'warning',
    });
    if (!confirmed) return;
    await deleteDiningTable(table.id);
    await load({ silent: true });
  };

  const changeStatus = async (order, nextStatus) => {
    try {
      const payload = { status: nextStatus };
      if (nextStatus === 'cancelled') {
        const reason = await showPrompt(`Alasan pembatalan pesanan ${order.order_code}:`, {
          title: 'Batalkan Pesanan',
          placeholder: 'Tulis alasan pembatalan...',
          confirmText: 'Batalkan Pesanan',
        });
        if (!reason?.trim()) return;
        payload.cancel_reason = reason.trim();
      }
      await updateCustomerOrderStatus(order.id, payload);
      await load({ silent: true });
    } catch (err) {
      const validation = err.response?.data?.validation_errors;
      const detail = validation?.length
        ? `\n\n${validation
            .filter((item) => item?.item_name)
            .map((item) => `${item.item_name}: tersedia ${Number(item.available ?? item.current_balance ?? 0)} ${item.unit || ''}, butuh ${Number(item.needed ?? 0)} ${item.unit || ''}`)
            .join('\n')}`
        : '';
      alert(`${err.response?.data?.message || 'Gagal update status'}${detail}`);
    }
  };

  const runBatchStatus = async (nextStatus) => {
    const sourceOrders = selectedOrders.length ? selectedOrders : visibleOrders;
    const targets = sourceOrders.filter((order) => canApplyStatus(order, nextStatus));
    if (!targets.length) {
      alert(selectedOrders.length
        ? 'Tidak ada pesanan terpilih yang bisa diproses ke status ini.'
        : 'Tidak ada pesanan pada filter ini yang bisa diproses ke status ini.');
      return;
    }

    const actionLabel = statusLabels[nextStatus] || nextStatus;
    const confirmed = await showConfirm(
      `${selectedOrders.length ? 'Proses pesanan terpilih' : 'Proses semua pesanan yang cocok'} ke status "${actionLabel}"? (${targets.length} pesanan)`,
      {
        title: 'Update Status Pesanan',
        confirmText: 'Proses',
        tone: nextStatus === 'cancelled' ? 'danger' : 'info',
      }
    );
    if (!confirmed) return;

    let cancelReason = '';
    if (nextStatus === 'cancelled') {
      const reason = await showPrompt(`Alasan pembatalan untuk ${targets.length} pesanan:`, {
        title: 'Batalkan Pesanan',
        placeholder: 'Tulis alasan pembatalan...',
        confirmText: 'Batalkan Pesanan',
      });
      if (!reason?.trim()) return;
      cancelReason = reason.trim();
    }

    const results = await Promise.allSettled(
      targets.map((order) => updateCustomerOrderStatus(
        order.id,
        {
          status: nextStatus,
          ...(nextStatus === 'cancelled' ? { cancel_reason: cancelReason } : {}),
        },
        { feedback: false }
      ))
    );

    const failures = results
      .map((result, index) => (result.status === 'rejected'
        ? `${targets[index].order_code}: ${result.reason?.response?.data?.message || 'gagal diproses'}`
        : null))
      .filter(Boolean);
    const successCount = results.length - failures.length;

    setSelectedOrderIds([]);
    await load({ silent: true });
    if (failures.length) {
      showFeedbackModal(
        successCount > 0 ? 'warning' : 'error',
        successCount > 0 ? 'Sebagian Pesanan Diproses' : 'Batch Status Gagal',
        `${successCount} pesanan berhasil, ${failures.length} pesanan gagal.\n\n${failures.slice(0, 6).join('\n')}${failures.length > 6 ? `\n+${failures.length - 6} lainnya` : ''}`
      );
      return;
    }
    showFeedbackModal('success', 'Status Pesanan Berhasil Diproses', `${successCount} pesanan berhasil diubah ke status "${actionLabel}".`);
  };

  const getStatusActions = (order) => {
    if (['completed', 'cancelled'].includes(order.status)) return [];
    const nextAction = nextActionByStatus[order.status];
    const waitingPaymentProof = order.status === 'pending'
      && order.payment_method
      && order.payment_status !== 'paid'
      && !order.payment_proof_url;
    return [
      nextAction && waitingPaymentProof
        ? {
            ...nextAction,
            label: 'Tunggu Bukti Bayar',
            color: 'bg-slate-600',
            disabled: true,
          }
        : nextAction,
      { status: 'cancelled', label: 'Batalkan', color: 'bg-red-500 hover:bg-red-400' },
    ].filter(Boolean);
  };

  return (
    <AuthGuard>
      <AdminLayout>
        <div className="mx-auto max-w-7xl space-y-6" data-tour="customer-orders-page">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between" data-tour="customer-orders-header">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-orange-400">Customer Table Order</p>
              <h1 className="mt-2 text-3xl font-black text-white">Pesanan Meja dan QR Pelanggan</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                Pantau order pelanggan dari QR meja, approve proses dapur, dan kelola meja yang tampil di landing page.
              </p>
            </div>
            <div className="flex flex-wrap gap-2" data-tour="customer-orders-status-filters">
              {statusFilters.map((item) => (
                <button
                  key={item.value}
                  onClick={() => setStatus(item.value)}
                  className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition ${
                    status === item.value ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {item.label}
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                    status === item.value ? 'bg-white/20 text-white' : 'bg-slate-700 text-slate-300'
                  }`}>
                    {statusCounts[item.value] || 0}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(260px,360px)_1fr]" data-tour="customer-orders-date-search">
            <div data-tour="customer-orders-date-filter">
              <DateRangePicker value={dateRange} onChange={setDateRange} />
            </div>
            <div className="rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3" data-tour="customer-orders-search">
              <label className="block text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                Cari Pesanan
              </label>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari order, nama, nomor HP, atau meja..."
                className="mt-1 w-full bg-transparent text-sm font-semibold text-white outline-none placeholder:text-slate-500"
              />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-700 bg-slate-800 p-4" data-tour="customer-orders-batch-panel">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-3" data-tour="customer-orders-select-all">
                <button
                  type="button"
                  onClick={toggleSelectAllVisible}
                  className={`rounded-xl px-3 py-2 text-xs font-black transition ${
                    allVisibleSelected ? 'bg-orange-500 text-white' : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                  }`}
                >
                  {allVisibleSelected ? 'Batalkan Pilihan' : 'Pilih Semua Tampilan'}
                </button>
                <p className="text-xs font-semibold text-slate-400">
                  {selectedOrderIds.length
                    ? `${selectedOrderIds.length} pesanan terpilih`
                    : 'Tanpa pilihan: tombol akan memproses semua pesanan yang cocok pada tampilan ini.'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2" data-tour="customer-orders-batch-actions">
                {batchStatusActions.map((action) => {
                  const sourceOrders = selectedOrders.length ? selectedOrders : visibleOrders;
                  const eligibleCount = sourceOrders.filter((order) => canApplyStatus(order, action.status)).length;
                  return (
                    <button
                      key={action.status}
                      type="button"
                      onClick={() => runBatchStatus(action.status)}
                      disabled={eligibleCount === 0}
                      className={`${action.color} rounded-xl px-3 py-2 text-xs font-black text-white transition disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-500`}
                    >
                      {action.label}
                      <span className="ml-2 rounded-full bg-white/20 px-1.5 py-0.5 text-[10px]">{eligibleCount}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" data-tour="customer-orders-stats">
            {[
              ['Total Order', stats.total],
              ['Order Aktif', stats.active],
              ['Selesai', stats.completed],
              ['Nilai Order', formatRp(stats.revenue)],
            ].map(([label, value], index) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="rounded-2xl border border-slate-700 bg-slate-800 p-4"
              >
                <p className="text-xs text-slate-500">{label}</p>
                <strong className="mt-2 block text-2xl text-white">{value}</strong>
              </motion.div>
            ))}
          </div>
          {refreshing && !loading && (
            <div className="rounded-2xl border border-slate-700 bg-slate-800/60 px-4 py-2 text-xs font-semibold text-slate-400">
              Menyinkronkan pesanan meja...
            </div>
          )}

          <div className="grid gap-6 xl:grid-cols-[1fr_390px]">
            <section className="space-y-4" data-tour="customer-orders-list">
              {loading && orders.length === 0 && <SectionSkeleton type="orders" />}
              {!loading && visibleOrders.length === 0 && (
                <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-800/50 p-10 text-center text-slate-400">
                  Belum ada pesanan meja untuk filter ini.
                </div>
              )}
              <CustomerOrdersTutorialDemo isAdmin={isAdmin} />
              {visibleOrders.map((order) => {
                const discountComponents = getDiscountComponents(order);
                const canSelectOrder = !['completed', 'cancelled'].includes(order.status);
                return (
                <div key={order.id} className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-start" data-tour="customer-order-row">
                <motion.article
                  layout
                  className="rounded-3xl border border-slate-700 bg-slate-800 p-5 shadow-xl shadow-black/10"
                  data-tour="customer-order-card"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2" data-tour="customer-order-status-badges">
                        <span className="rounded-full bg-orange-500/15 px-3 py-1 text-xs font-black uppercase text-orange-300">
                          Meja {order.table_number}
                        </span>
                        <span className="rounded-full bg-slate-700 px-3 py-1 text-xs font-black uppercase text-slate-300">
                          {statusLabels[order.status] || order.status}
                        </span>
                        {discountComponents.map((component) => (
                          <span
                            key={`${component.type}-${component.program_id || component.label}`}
                            className={`rounded-full px-3 py-1 text-xs font-black ${discountTypeMeta[component.type]?.badge || 'bg-violet-500/15 text-violet-300'}`}
                          >
                            {getDiscountBadgeText(component)}
                          </span>
                        ))}
                        {order.reviewed_at && !discountComponents.some((component) => component.type === 'review_reward') && (
                          <span className="rounded-full bg-slate-700 px-3 py-1 text-xs font-black text-slate-300">
                            Review selesai
                          </span>
                        )}
                      </div>
                      <h2 className="mt-3 text-xl font-black text-white">{order.order_code}</h2>
                      <p className="mt-1 text-sm text-slate-400">
                        {order.customer_name || 'Pelanggan meja'} {order.customer_phone ? `- ${order.customer_phone}` : ''}
                      </p>
                    </div>
                    <div className="text-left lg:text-right" data-tour="customer-order-total">
                      <p className="text-xs text-slate-500">Total pesanan</p>
                      <strong className="text-2xl text-orange-400">{formatRp(order.final_total || order.subtotal)}</strong>
                      {discountComponents.length > 0 && (
                        <div className="mt-2 space-y-1 text-xs">
                          {discountComponents.map((component) => (
                            <p key={`${component.type}-${component.program_id || component.label}-total`} className={discountTypeMeta[component.type]?.badge?.split(' ').at(-1) || 'text-violet-300'}>
                              {getDiscountBadgeText(component)}: {component.label || 'Diskon'} -{formatRp(component.discount_amount)}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto]">
                    <div className="rounded-2xl bg-slate-900/60 p-3" data-tour="customer-order-items">
                      {order.items?.map((item) => (
                        <div key={item.id} className="flex justify-between gap-3 border-b border-slate-700/60 py-2 text-sm last:border-0">
                          <span className="text-slate-300">{item.product_name} x{item.qty}</span>
                          <span className="font-bold text-white">{formatRp(item.subtotal)}</span>
                        </div>
                      ))}
                      {discountComponents.length > 0 && (
                        <div className="mt-3 space-y-2 border-t border-slate-700/60 pt-3" data-tour="customer-order-discounts">
                          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Diskon terpakai</p>
                          {discountComponents.map((component) => (
                            <div
                              key={`${component.type}-${component.program_id || component.label}-detail`}
                              className={`rounded-xl border p-3 text-xs ${discountTypeMeta[component.type]?.panel || 'border-violet-500/20 bg-violet-500/10 text-violet-100'}`}
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="font-black">{getDiscountBadgeText(component)}</span>
                                <strong className="text-red-300">-{formatRp(component.discount_amount)}</strong>
                              </div>
                              <p className="mt-1 font-semibold">{component.label || 'Diskon'}</p>
                              {component.voucher_code && <p className="mt-1 opacity-80">Kode: {component.voucher_code}</p>}
                              {Number(component.discount_base || 0) > 0 && (
                                <p className="mt-1 opacity-80">Dasar potongan: {formatRp(component.discount_base)}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      {order.items?.some((item) => item.review) && (
                        <div className="mt-3 space-y-2 border-t border-slate-700/60 pt-3">
                          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Rating menu</p>
                          {order.items
                            ?.filter((item) => item.review)
                            .map((item) => (
                              <div key={`review-${item.id}`} className="rounded-xl bg-slate-950/45 p-2">
                                <div className="flex items-center justify-between gap-3">
                                  <span className="text-xs font-semibold text-slate-200">{item.product_name}</span>
                                  <Stars value={item.review.rating} />
                                </div>
                                {item.review.comment && (
                                  <p className="mt-1 text-xs text-slate-400">{item.review.comment}</p>
                                )}
                              </div>
                            ))}
                        </div>
                      )}
                      <p className="mt-3 text-xs italic text-slate-500">Catatan: {order.note || 'Tidak ada'}</p>
                      {order.payment_method && (
                        <div className="mt-3 rounded-xl border border-sky-500/20 bg-sky-500/10 p-3 text-xs text-sky-100" data-tour="customer-order-payment">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-bold">Pembayaran: {order.payment_method.name || order.payment_method_key || 'Payment'}</span>
                            <span className={`rounded-full px-2 py-1 font-black uppercase ${
                              order.payment_status === 'paid'
                                ? 'bg-emerald-500/20 text-emerald-200'
                                : order.payment_proof_url
                                  ? 'bg-yellow-500/20 text-yellow-100'
                                  : 'bg-slate-700 text-slate-300'
                            }`}>
                              {order.payment_status === 'paid' ? 'Terkonfirmasi' : order.payment_proof_url ? 'Bukti dikirim' : 'Menunggu bukti'}
                            </span>
                          </div>
                          <p className="mt-1 text-sky-100/70">
                            Deadline: {formatDateTime(order.payment_due_at)}
                          </p>
                          {order.payment_proof_url && (
                            <button
                              type="button"
                              onClick={() => setProofModal({
                                order_code: order.order_code,
                                url: resolveAssetUrl(order.payment_proof_url),
                              })}
                              data-tour="customer-order-proof-action"
                              className="mt-2 inline-flex font-black text-sky-200 underline"
                            >
                              Lihat bukti pembayaran
                            </button>
                          )}
                          {order.payment_proof_note && <p className="mt-1 text-sky-100/70">Catatan bayar: {order.payment_proof_note}</p>}
                        </div>
                      )}
                      {order.service_review && (
                        <div className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-100">
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-bold">Rating layanan</span>
                            <Stars value={order.service_review.service_rating} />
                          </div>
                          {order.service_review.service_comment && (
                            <p className="mt-1 text-emerald-100/80">{order.service_review.service_comment}</p>
                          )}
                        </div>
                      )}
                      {order.cancel_reason && (
                        <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-100">
                          Alasan batal: {order.cancel_reason}
                          {order.cancelled_by_name ? ` - oleh ${order.cancelled_by_name}` : ''}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 lg:w-44 lg:flex-col" data-tour="customer-order-status-actions">
                      {getStatusActions(order).map((action) => (
                        <button
                          key={action.status}
                          onClick={() => changeStatus(order, action.status)}
                          disabled={action.disabled}
                          className={`${action.color} rounded-xl px-3 py-2 text-xs font-black text-white transition disabled:cursor-not-allowed disabled:opacity-35`}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.article>
                  <label data-tour="customer-order-select" className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-xs font-black transition lg:min-h-[112px] lg:w-20 lg:flex-col ${
                    !canSelectOrder
                      ? 'cursor-not-allowed border-slate-800 bg-slate-900/70 text-slate-600'
                      : selectedOrderIds.includes(Number(order.id))
                      ? 'border-orange-500 bg-orange-500/15 text-orange-200'
                      : 'cursor-pointer border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-500 hover:text-white'
                  }`}>
                    <input
                      type="checkbox"
                      checked={selectedOrderIds.includes(Number(order.id))}
                      disabled={!canSelectOrder}
                      onChange={() => toggleOrderSelection(order.id)}
                      className="h-5 w-5 accent-orange-500 disabled:cursor-not-allowed disabled:opacity-40"
                    />
                    {canSelectOrder ? 'Pilih' : 'Final'}
                  </label>
                </div>
              );
              })}
            </section>

            {isAdmin && (
              <aside className="space-y-5" data-tour="customer-orders-admin-sidebar">
                <div className="rounded-3xl border border-slate-700 bg-slate-800 p-5" data-tour="customer-orders-table-form">
                  <h2 className="text-xl font-black text-white">{editingTable ? 'Edit Meja' : 'Tambah Meja QR'}</h2>
                  <form onSubmit={saveTable} className="mt-4 space-y-3">
                    <input
                      value={tableForm.table_number}
                      onChange={(e) => setTableForm({ ...tableForm, table_number: e.target.value })}
                      placeholder="Nomor meja, contoh: 01"
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-orange-500"
                      required
                    />
                    <input
                      value={tableForm.table_name}
                      onChange={(e) => setTableForm({ ...tableForm, table_name: e.target.value })}
                      placeholder="Nama area, contoh: Teras"
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-orange-500"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="number"
                        min="1"
                        value={tableForm.capacity}
                        onChange={(e) => setTableForm({ ...tableForm, capacity: e.target.value })}
                        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-orange-500"
                      />
                      <select
                        value={tableForm.status}
                        onChange={(e) => setTableForm({ ...tableForm, status: e.target.value })}
                        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-orange-500"
                      >
                        <option value="active">Aktif</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="inactive">Nonaktif</option>
                      </select>
                    </div>
                    <textarea
                      value={tableForm.note}
                      onChange={(e) => setTableForm({ ...tableForm, note: e.target.value })}
                      placeholder="Catatan meja..."
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-orange-500"
                    />
                    <div className="flex gap-2">
                      <button className="flex-1 rounded-xl bg-orange-500 px-4 py-3 text-sm font-black text-white hover:bg-orange-400">
                        {editingTable ? 'Update Meja' : 'Buat Meja'}
                      </button>
                      {editingTable && (
                        <button
                          type="button"
                          onClick={() => { setEditingTable(null); setTableForm(emptyTable); }}
                          className="rounded-xl bg-slate-700 px-4 py-3 text-sm font-black text-white"
                        >
                          Batal
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                <div className="rounded-3xl border border-slate-700 bg-slate-800 p-5" data-tour="customer-orders-table-list">
                  <h2 className="text-xl font-black text-white">QR Meja</h2>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {tables.map((table) => (
                      <button
                        key={table.id}
                        onClick={() => setSelectedTable(table)}
                        className={`rounded-2xl border p-3 text-left transition ${
                          selectedTable?.id === table.id ? 'border-orange-500 bg-orange-500/15' : 'border-slate-700 bg-slate-900'
                        }`}
                      >
                        <p className="text-xs text-slate-500">Meja</p>
                        <strong className="text-lg text-white">{table.table_number}</strong>
                        <p className="text-xs capitalize text-slate-400">{table.status}</p>
                        {table.branch_name && <p className="mt-1 text-[10px] text-orange-300/80">{table.branch_name}</p>}
                      </button>
                    ))}
                  </div>

                  {selectedTable && (
                    <div className="mt-5" data-tour="customer-orders-qr-preview">
                      <QRCodeCard value={getOrderUrl(selectedTable.qr_token)} title={`Meja ${selectedTable.table_number}`} size={190} />
                      <div className="mt-3 flex gap-2">
                        <button onClick={() => editTable(selectedTable)} className="flex-1 rounded-xl bg-slate-700 px-3 py-2 text-sm font-bold text-white">Edit</button>
                        <button onClick={() => removeTable(selectedTable)} className="flex-1 rounded-xl bg-red-500/80 px-3 py-2 text-sm font-bold text-white">Nonaktif</button>
                      </div>
                    </div>
                  )}
                </div>
              </aside>
            )}
          </div>
          {proofModal && (
            <div className="fixed inset-0 z-[90] grid place-items-center bg-black/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" data-tour="customer-orders-proof-modal">
              <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-700 bg-slate-900 p-4 shadow-2xl shadow-black/50">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-300">Bukti Pembayaran</p>
                    <h3 className="mt-1 text-lg font-black text-white">{proofModal.order_code}</h3>
                  </div>
                  <button type="button" onClick={() => setProofModal(null)} className="grid h-10 w-10 place-items-center rounded-full border border-white/15 text-lg font-black text-white">
                    x
                  </button>
                </div>
                {String(proofModal.url).toLowerCase().includes('.pdf') ? (
                  <div className="mt-4 rounded-2xl bg-black/25 p-5 text-sm text-slate-200">
                    File bukti berupa PDF.
                    <a href={proofModal.url} target="_blank" rel="noreferrer" className="mt-3 inline-flex rounded-xl bg-sky-300 px-4 py-2 font-black text-slate-950">
                      Buka PDF
                    </a>
                  </div>
                ) : (
                  <img src={proofModal.url} alt="Bukti pembayaran" className="mt-4 max-h-[70vh] w-full rounded-2xl bg-white object-contain" />
                )}
              </div>
            </div>
          )}
          <style jsx global>{`
            .customer-orders-tutorial-demo {
              display: none;
            }
            html[data-tutorial-id="customer-orders"] .customer-orders-tutorial-demo {
              display: grid;
            }
          `}</style>
        </div>
      </AdminLayout>
    </AuthGuard>
  );
}
