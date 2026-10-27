'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  claimPublicTableQueue,
  getCustomerOrder,
  getDiningTableByToken,
  getPublicBranches,
  getPublicDiningTables,
  getPublicTableQueue,
  joinPublicTableQueue,
} from '@/lib/api';
import QRCodeCard from '@/components/customer/QRCodeCard';

const PENDING_VOUCHER_KEY = 'landing-campaign-voucher-code';

const getOrderUrl = (token) => {
  if (typeof window === 'undefined') return `/order/${token}`;
  return `${window.location.origin}/order/${token}`;
};

const formatQueueEta = (value) => {
  if (!value) return 'Estimasi sedang dihitung';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
};

export default function SelectDiningTablePage() {
  const router = useRouter();
  const [tables, setTables] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savedOrdersByToken, setSavedOrdersByToken] = useState({});
  const [savedDraftsByToken, setSavedDraftsByToken] = useState({});
  const [queueInfo, setQueueInfo] = useState(null);
  const [queueLoading, setQueueLoading] = useState(false);
  const [queueName, setQueueName] = useState('');
  const [pendingVoucherCode, setPendingVoucherCode] = useState('');
  const queueStorageKey = selectedBranch?.id ? `customer-table-queue-${selectedBranch.id}` : '';

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const incomingVoucherCode = new URLSearchParams(window.location.search).get('voucher') || '';
    const savedCode = incomingVoucherCode || window.localStorage.getItem(PENDING_VOUCHER_KEY) || '';
    const normalizedCode = String(savedCode || '').trim().toUpperCase();
    if (!normalizedCode) return;
    window.localStorage.setItem(PENDING_VOUCHER_KEY, normalizedCode);
    setPendingVoucherCode(normalizedCode);
  }, []);

  const readSavedTableState = async (rows) => {
    if (typeof window === 'undefined') return { orders: {}, drafts: {} };
    const acc = { orders: {}, drafts: {} };

    await Promise.all(rows.map(async (table) => {
      const savedOrderCode = window.localStorage.getItem(`customer-order-${table.qr_token}`);
      const sessionKey = `customer-table-session-${table.qr_token}`;
      const savedSessionToken = window.localStorage.getItem(sessionKey) || '';
      let savedDraft = null;
      try {
        savedDraft = JSON.parse(window.localStorage.getItem(`customer-order-draft-${table.qr_token}`) || 'null');
      } catch (_) {
        savedDraft = null;
      }
      const hasDraft = Boolean(savedDraft && Array.isArray(savedDraft.cart) && savedDraft.cart.length);
      const activeOrderCodes = Array.isArray(table.active_order_codes) ? table.active_order_codes.map(String) : [];

      if (savedOrderCode) {
        if (activeOrderCodes.includes(String(savedOrderCode))) {
          acc.orders[table.qr_token] = savedOrderCode;
        } else if (Number(table.active_order_count || 0) > 0) {
          window.localStorage.removeItem(`customer-order-${table.qr_token}`);
        } else {
          await getCustomerOrder(savedOrderCode)
            .then((res) => {
              const order = res.data?.data;
              const belongsToTable = Number(order?.table_id) === Number(table.id);
              const reusableStatuses = new Set(['pending', 'accepted', 'preparing', 'ready']);
              if (belongsToTable && reusableStatuses.has(String(order?.status || ''))) {
                acc.orders[table.qr_token] = savedOrderCode;
                return;
              }
              window.localStorage.removeItem(`customer-order-${table.qr_token}`);
            })
            .catch(() => window.localStorage.removeItem(`customer-order-${table.qr_token}`));
        }
      }

      if (hasDraft) {
        if (Number(table.active_orders || 0) === 0) {
          acc.drafts[table.qr_token] = savedDraft;
        } else if (savedSessionToken) {
          await getDiningTableByToken(table.qr_token, { session_token: savedSessionToken })
            .then((res) => {
              if (Number(res.data?.active_orders || 0) === 0) acc.drafts[table.qr_token] = savedDraft;
              else {
                window.localStorage.removeItem(`customer-order-draft-${table.qr_token}`);
                window.localStorage.removeItem(sessionKey);
              }
            })
            .catch(() => {
              window.localStorage.removeItem(`customer-order-draft-${table.qr_token}`);
              window.localStorage.removeItem(sessionKey);
            });
        } else {
          window.localStorage.removeItem(`customer-order-draft-${table.qr_token}`);
        }
      }
    }));

    return acc;
  };

  useEffect(() => {
    getPublicBranches()
      .then((res) => {
        const rows = res.data || [];
        setBranches(rows);
        setSelectedBranch(rows[0] || null);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedBranch?.id) return;
    const loadTables = () => Promise.all([
      getPublicDiningTables({ branch_id: selectedBranch.id }),
      getPublicTableQueue({
        branch_id: selectedBranch.id,
        queue_token: queueStorageKey ? window.localStorage.getItem(queueStorageKey) || '' : '',
      }).catch(() => ({ data: null })),
    ])
      .then(([res, queueRes]) => {
        const rows = res.data || [];
        return readSavedTableState(rows).then((savedState) => ({ rows, savedState, queueRes }));
      })
      .then(({ rows, savedState, queueRes }) => {
        setTables(rows);
        setSavedOrdersByToken(savedState.orders);
        setSavedDraftsByToken(savedState.drafts);
        setQueueInfo(queueRes.data || null);
        setSelected((prev) => {
          const previous = prev ? rows.find((table) => Number(table.id) === Number(prev.id)) : null;
          const previousCanStay = previous && (
            Number(previous.active_orders || 0) === 0
            || savedState.orders[previous.qr_token]
            || savedState.drafts[previous.qr_token]
          );
          if (previousCanStay) return previous;
          return rows.find((table) => savedState.orders[table.qr_token])
            || rows.find((table) => savedState.drafts[table.qr_token])
            || rows.find((table) => Number(table.active_orders || 0) === 0)
            || rows[0]
            || null;
        });
      })
      .finally(() => setLoading(false));

    setLoading(true);
    loadTables();
    const timer = window.setInterval(loadTables, 15000);
    return () => window.clearInterval(timer);
  }, [selectedBranch?.id, queueStorageKey]);

  const selectedUrl = useMemo(() => selected ? getOrderUrl(selected.qr_token) : '', [selected]);
  const hasWaitingQueue = Number(queueInfo?.waiting_count || 0) > 0;
  const allTablesBusy = tables.length > 0 && tables.every((table) => Number(table.active_orders || 0) > 0);
  const showQueuePanel = hasWaitingQueue || allTablesBusy;

  const refreshQueue = async () => {
    if (!selectedBranch?.id) return;
    const queueToken = queueStorageKey ? window.localStorage.getItem(queueStorageKey) || '' : '';
    const res = await getPublicTableQueue({ branch_id: selectedBranch.id, queue_token: queueToken });
    setQueueInfo(res.data);
  };

  const joinQueue = async (mode) => {
    if (!selectedBranch?.id || queueLoading) return;
    setQueueLoading(true);
    try {
      const res = await joinPublicTableQueue({
        branch_id: selectedBranch.id,
        table_id: mode === 'selected' ? selected?.id || null : null,
        customer_name: queueName,
      });
      if (queueStorageKey) window.localStorage.setItem(queueStorageKey, res.data?.data?.queue_token || '');
      await refreshQueue();
    } finally {
      setQueueLoading(false);
    }
  };

  const claimQueue = async () => {
    const queueToken = queueStorageKey ? window.localStorage.getItem(queueStorageKey) : '';
    if (!queueToken || queueLoading) return;
    setQueueLoading(true);
    try {
      const res = await claimPublicTableQueue(queueToken);
      const table = res.data?.data?.table;
      const session = res.data?.data?.session;
      if (table?.qr_token && session?.session_token) {
        window.localStorage.setItem(`customer-table-session-${table.qr_token}`, session.session_token);
        if (queueStorageKey) window.localStorage.removeItem(queueStorageKey);
        router.push(`/order/${table.qr_token}`);
      }
    } finally {
      setQueueLoading(false);
    }
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#0D0A06] text-[#F5EDD8]">
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_18%_12%,rgba(201,168,76,0.22),transparent_34%),radial-gradient(circle_at_90%_90%,rgba(139,26,26,0.22),transparent_32%)]" />
      <section className="relative z-10 mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 gap-8 px-5 py-8 lg:grid-cols-[1fr_380px] lg:px-8">
        <div className="flex flex-col justify-center">
          <Link href="/" className="mb-8 inline-flex w-fit items-center gap-2 rounded-full border border-[#C9A84C]/30 px-4 py-2 text-sm text-[#C9A84C] hover:bg-[#C9A84C]/10">
            Kembali ke Landing Page
          </Link>

          <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-[#C9A84C]">Self Order Table</p>
            <h1 className="mt-4 max-w-3xl font-serif text-4xl font-black leading-tight md:text-6xl">
              Pilih meja, scan QR, lalu pesan menu dari tempat duduk Anda.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-[#EDE0C4]/75">
              Setiap meja punya QR unik. Pelanggan bisa membuka menu, mengirim pesanan, memantau status, lalu memberi review untuk mendapat potongan 5%.
            </p>
          </motion.div>

          {pendingVoucherCode && (
            <div className="mt-6 rounded-[1.5rem] border border-[#C9A84C]/25 bg-[#C9A84C]/10 p-4 text-sm leading-6 text-[#F5EDD8]">
              <strong className="text-[#C9A84C]">Kode voucher {pendingVoucherCode} sudah disiapkan.</strong>
              <span className="mt-1 block text-[#EDE0C4]/72">
                Pilih cabang dan meja. Saat masuk keranjang, field kode voucher akan otomatis terisi. Jika browser tidak mengizinkan otomatis, tekan tombol Paste di field voucher.
              </span>
            </div>
          )}

          <div className="mt-8">
            <p className="mb-3 text-xs font-black uppercase tracking-[0.28em] text-[#C9A84C]">Pilih Cabang</p>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {branches.map((branch) => {
                const active = Number(selectedBranch?.id) === Number(branch.id);
                return (
                  <button
                    key={branch.id}
                    type="button"
                    onClick={() => setSelectedBranch(branch)}
                    className={`rounded-3xl border p-4 text-left transition ${
                      active
                        ? 'border-[#C9A84C] bg-[#C9A84C]/15 text-[#F5EDD8]'
                        : 'border-[#C9A84C]/18 bg-[#1A1409]/70 text-[#EDE0C4]/75 hover:border-[#C9A84C]/60'
                    }`}
                  >
                    <strong className="block text-lg">{branch.name}</strong>
                    <span className="mt-1 block text-xs opacity-70">{branch.area || branch.address || 'Cabang aktif'}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-9 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {loading
              ? [...Array(8)].map((_, index) => (
                  <div key={index} className="h-32 animate-pulse rounded-3xl border border-[#C9A84C]/10 bg-[#1A1409]" />
                ))
              : tables.map((table, index) => {
                  const active = selected?.id === table.id;
                  const busy = Number(table.active_orders || 0) > 0;
                  const hasSavedOrder = Boolean(savedOrdersByToken[table.qr_token]);
                  const hasSavedDraft = Boolean(savedDraftsByToken[table.qr_token]);
                  const locked = (busy || hasWaitingQueue) && !hasSavedOrder && !hasSavedDraft;
                  return (
                    <motion.button
                      key={table.id}
                      type="button"
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.035 }}
                      onClick={() => !locked && setSelected(table)}
                      disabled={locked}
                      className={`group rounded-3xl border p-5 text-left transition ${
                        locked
                          ? 'cursor-not-allowed border-red-400/20 bg-red-500/10 text-red-100/70 opacity-70'
                          : hasSavedOrder && busy
                            ? 'border-emerald-300/30 bg-emerald-500/12 text-emerald-50 hover:-translate-y-1 hover:border-emerald-200/60'
                            : hasSavedDraft
                              ? 'border-sky-300/30 bg-sky-500/12 text-sky-50 hover:-translate-y-1 hover:border-sky-200/60'
                              :
                        active
                          ? 'border-[#C9A84C] bg-[#C9A84C] text-[#0D0A06] shadow-xl shadow-[#C9A84C]/20'
                          :
                            'border-[#C9A84C]/18 bg-[#1A1409]/88 text-[#F5EDD8] hover:-translate-y-1 hover:border-[#C9A84C]/60'
                      }`}
                    >
                      <span className="text-xs font-bold uppercase tracking-[0.24em] opacity-70">Meja</span>
                      <strong className="mt-2 block text-4xl font-black">{table.table_number}</strong>
                      <span className="mt-3 block text-sm opacity-75">
                        {hasSavedOrder && busy
                          ? 'Riwayat pesanan Anda aktif'
                          : hasSavedDraft
                            ? 'Draft pesanan Anda tersimpan'
                          : hasWaitingQueue
                            ? 'Ada antrian menunggu'
                          : busy
                            ? 'Ada pesanan aktif'
                            : table.table_name || `${table.capacity} kursi tersedia`}
                      </span>
                    </motion.button>
                  );
                })}
          </div>

          {showQueuePanel && (
            <div className="mt-8 rounded-[2rem] border border-sky-300/25 bg-sky-500/10 p-5 text-sky-50">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-sky-200">Antrian Meja</p>
              <h2 className="mt-2 text-2xl font-black">
                {hasWaitingQueue ? `${queueInfo.waiting_count} pelanggan menunggu` : 'Semua meja sedang penuh'}
              </h2>
              <p className="mt-2 text-sm leading-6 text-sky-50/75">
                Saat antrian aktif, pelanggan baru harus mengambil nomor antrian agar tidak menyela pelanggan yang sudah menunggu.
              </p>
              <div className="mt-4 space-y-2">
                {(queueInfo?.queue || []).slice(0, 5).map((entry) => (
                  <div key={entry.queue_token} className="flex items-center justify-between rounded-2xl bg-[#0D0A06]/55 px-4 py-3 text-sm">
                    <span>#{entry.position} {entry.table_number ? `Meja ${entry.table_number}` : 'Meja acak'}</span>
                    <span className="text-sky-100/65">{entry.preference === 'selected' ? 'Pilih meja' : 'Random kosong'}</span>
                  </div>
                ))}
              </div>
              {queueInfo?.current_position > 0 ? (
                <div className="mt-4 rounded-2xl border border-emerald-300/25 bg-emerald-500/12 p-4">
                  <p className="font-black text-emerald-100">Posisi antrian Anda #{queueInfo.current_position}</p>
                  {queueInfo.can_claim ? (
                    <button
                      type="button"
                      onClick={claimQueue}
                      disabled={queueLoading}
                      className="mt-3 w-full rounded-2xl bg-emerald-300 px-4 py-3 text-sm font-black text-[#0D0A06] disabled:opacity-50"
                    >
                      Ambil Slot Meja Sekarang
                    </button>
                  ) : (
                    <p className="mt-2 text-sm text-emerald-50/75">Kami akan membuka tombol ambil slot saat giliran Anda dan meja sudah tersedia.</p>
                  )}
                </div>
              ) : (
                <div className="mt-4 grid gap-3">
                  <input
                    value={queueName}
                    onChange={(event) => setQueueName(event.target.value)}
                    placeholder="Nama pelanggan (opsional)"
                    className="w-full rounded-2xl border border-sky-100/20 bg-[#0D0A06] px-4 py-3 text-sm outline-none"
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => joinQueue('random')}
                      disabled={queueLoading}
                      className="rounded-2xl bg-sky-300 px-4 py-3 text-sm font-black text-[#0D0A06] disabled:opacity-50"
                    >
                      Antri Meja Kosong Random
                    </button>
                    <button
                      type="button"
                      onClick={() => joinQueue('selected')}
                      disabled={queueLoading || !selected}
                      className="rounded-2xl border border-sky-200/25 px-4 py-3 text-sm font-black text-sky-100 disabled:opacity-50"
                    >
                      Antri Meja Dipilih
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {!loading && tables.length === 0 && (
            <div className="mt-8 rounded-3xl border border-red-400/25 bg-red-500/10 p-5 text-red-100">
              Belum ada meja aktif. Admin perlu membuat meja QR dulu di menu Pesanan Meja.
            </div>
          )}
        </div>

        <aside className="flex items-center justify-center lg:justify-end">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm rounded-[2rem] border border-[#C9A84C]/22 bg-[#1A1409]/90 p-5 shadow-2xl shadow-black/40 backdrop-blur"
          >
            {selected ? (
              <>
                {(() => {
                  const selectedBusy = Number(selected.active_orders || 0) > 0;
                  const hasSavedOrder = Boolean(savedOrdersByToken[selected.qr_token]);
                  const hasSavedDraft = Boolean(savedDraftsByToken[selected.qr_token]);
                  const locked = (selectedBusy || hasWaitingQueue) && !hasSavedOrder && !hasSavedDraft;
                  return (
                    <>
                <div className="mb-5 rounded-3xl bg-[#241C0E] p-5">
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-[#C9A84C]">QR Aktif</p>
                  <h2 className="mt-2 text-3xl font-black">Meja {selected.table_number}</h2>
                  <p className="mt-2 text-sm text-[#EDE0C4]/70">{selectedBranch?.name || selected.table_name || 'Siap menerima pesanan pelanggan.'}</p>
                </div>
                {locked ? (
                  <div className="rounded-3xl border border-red-400/25 bg-red-500/10 p-5 text-center text-red-100">
                    {hasWaitingQueue
                      ? 'Masih ada antrian pelanggan. Ambil nomor antrian terlebih dahulu.'
                      : 'Meja ini sedang memiliki pesanan aktif. Pilih meja lain atau tunggu sampai selesai.'}
                    {selected.estimated_release_at && (
                      <p className="mt-2 text-xs text-red-100/70">Estimasi tersedia: {formatQueueEta(selected.estimated_release_at)}</p>
                    )}
                  </div>
                ) : (
                  <>
                    {hasSavedOrder && selectedBusy && (
                      <div className="mb-4 rounded-3xl border border-emerald-300/25 bg-emerald-500/12 p-4 text-sm leading-6 text-emerald-50">
                        Pesanan dari perangkat ini masih aktif. Anda bisa masuk lagi untuk melihat status, pembayaran, atau review.
                      </div>
                    )}
                    {hasSavedDraft && !selectedBusy && (
                      <div className="mb-4 rounded-3xl border border-sky-300/25 bg-sky-500/12 p-4 text-sm leading-6 text-sky-50">
                        Draft pesanan dari perangkat ini tersimpan. Anda bisa lanjut memilih menu sebelum mengirim pesanan.
                      </div>
                    )}
                    <QRCodeCard value={selectedUrl} />
                    <Link
                      href={`/order/${selected.qr_token}`}
                      className="mt-5 flex w-full items-center justify-center rounded-2xl bg-[#C9A84C] px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-[#0D0A06] transition hover:bg-[#E8C96A]"
                    >
                      {hasSavedOrder && selectedBusy
                        ? 'Buka Riwayat Pesanan Saya'
                        : hasSavedDraft
                          ? 'Lanjutkan Pesanan Saya'
                          : 'Lanjut Pesan'}
                    </Link>
                  </>
                )}
                    </>
                  );
                })()}
              </>
            ) : (
              <div className="rounded-3xl border border-dashed border-[#C9A84C]/30 p-8 text-center text-[#EDE0C4]/65">
                Pilih salah satu meja untuk menampilkan QR.
              </div>
            )}
          </motion.div>
        </aside>
      </section>
    </main>
  );
}
