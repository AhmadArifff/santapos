'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import AuthGuard from '@/components/ui/AuthGuard';
import { getCustomerOrders, updateCustomerOrderStatus } from '@/lib/api';
import { playOrderNotificationSound, playCheckoutSuccessSound } from '@/lib/soundNotification';
import { useAuthStore } from '@/store/authStore';

// Helper: Format MM:SS elapsed time
const formatElapsed = (createdAt) => {
  if (!createdAt) return '00:00';
  const start = new Date(createdAt).getTime();
  const now = Date.now();
  const diffSec = Math.max(0, Math.floor((now - start) / 1000));
  const mins = Math.floor(diffSec / 60);
  const secs = diffSec % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

// Helper: Get color status based on elapsed minutes
const getElapsedUrgency = (createdAt) => {
  if (!createdAt) return { color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', label: 'Tepat Waktu' };
  const diffMinutes = (Date.now() - new Date(createdAt).getTime()) / 60000;
  if (diffMinutes >= 20) {
    return { color: 'text-red-400 bg-red-500/20 border-red-500/40 animate-pulse', label: 'Mendesak (>20m)' };
  }
  if (diffMinutes >= 10) {
    return { color: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30', label: 'Perlu Perhatian' };
  }
  return { color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', label: 'Normal' };
};

export default function KitchenDisplayPage() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState('active'); // 'active', 'accepted', 'preparing', 'ready', 'completed'
  const [currentTime, setCurrentTime] = useState(new Date());
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [checkedItems, setCheckedItems] = useState({}); // { [orderId-itemIndex]: true }
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const prevActiveCountRef = useRef(-1);

  // Live Clock & Stopwatch ticker
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch kitchen orders
  const fetchOrders = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await getCustomerOrders({ limit: 100 });
      const rows = res.data?.data || res.data || [];
      const orderList = Array.isArray(rows) ? rows : [];

      const activeOrders = orderList.filter((o) => ['accepted', 'preparing'].includes(o.status));
      if (prevActiveCountRef.current >= 0 && activeOrders.length > prevActiveCountRef.current && soundEnabled) {
        playOrderNotificationSound();
      }
      prevActiveCountRef.current = activeOrders.length;
      setOrders(orderList);
    } catch (err) {
      console.warn('[KDS Fetch Orders Error]:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => fetchOrders(true), 8000);
    return () => clearInterval(interval);
  }, [soundEnabled]);

  // Handle status transitions
  const handleUpdateStatus = async (order, nextStatus) => {
    if (updatingId) return;
    setUpdatingId(order.id);
    try {
      await updateCustomerOrderStatus(order.id, { status: nextStatus });
      playCheckoutSuccessSound();
      fetchOrders(true);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Gagal mengubah status pesanan.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Toggle strikethrough for individual item in ticket
  const toggleItemCheck = (orderId, itemIndex) => {
    const key = `${orderId}-${itemIndex}`;
    setCheckedItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Toggle browser fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Filter orders based on active tab
  const displayedOrders = useMemo(() => {
    return orders.filter((o) => {
      if (filterTab === 'active') return ['accepted', 'preparing'].includes(o.status);
      if (filterTab === 'accepted') return o.status === 'accepted';
      if (filterTab === 'preparing') return o.status === 'preparing';
      if (filterTab === 'ready') return o.status === 'ready';
      if (filterTab === 'completed') return o.status === 'completed';
      return true;
    });
  }, [orders, filterTab]);

  // Counts
  const counts = useMemo(() => {
    return {
      active: orders.filter((o) => ['accepted', 'preparing'].includes(o.status)).length,
      accepted: orders.filter((o) => o.status === 'accepted').length,
      preparing: orders.filter((o) => o.status === 'preparing').length,
      ready: orders.filter((o) => o.status === 'ready').length,
      completed: orders.filter((o) => o.status === 'completed').length,
    };
  }, [orders]);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none">
        {/* KDS Top Header */}
        <header className="bg-slate-900/90 border-b border-slate-800 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30 shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="w-10 h-10 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition"
              title="Kembali ke Dashboard"
            >
              ←
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">🍳</span>
                <h1 className="font-black text-white text-base tracking-wide uppercase">
                  Layar Dapur (KDS)
                </h1>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  {user?.branch_name ? `Cabang ${user.branch_name}` : 'Kitchen Station'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Tiket memasak interaktif real-time dengan timer durasi otomatis.
              </p>
            </div>
          </div>

          {/* Right Toolbar: Live Clock, Sound Toggle, Fullscreen */}
          <div className="flex items-center gap-3">
            {/* Live Clock */}
            <div className="px-3.5 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 font-mono text-sm font-bold text-amber-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>{currentTime.toLocaleTimeString('id-ID', { hour12: false })}</span>
            </div>

            {/* Sound Toggle */}
            <button
              type="button"
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                if (!soundEnabled) playOrderNotificationSound();
              }}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 ${
                soundEnabled
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300'
              }`}
              title="Aktifkan/Matikan Suara Bel Notifikasi"
            >
              <span>{soundEnabled ? '🔔 Bel ON' : '🔕 Bel OFF'}</span>
            </button>

            {/* Fullscreen Button */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-300 hover:text-white transition flex items-center gap-1"
            >
              <span>{isFullscreen ? '⤢ Keluar Fullscreen' : '⤢ Fullscreen'}</span>
            </button>
          </div>
        </header>

        {/* Tab Filters Bar */}
        <div className="bg-slate-900/60 border-b border-slate-800/80 px-4 sm:px-6 py-2.5 flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {[
            { id: 'active', label: '🔥 Aktif di Dapur', count: counts.active, color: 'text-amber-400' },
            { id: 'accepted', label: '⏱️ Menunggu Dimasak', count: counts.accepted, color: 'text-blue-400' },
            { id: 'preparing', label: '🍳 Sedang Dimasak', count: counts.preparing, color: 'text-yellow-400' },
            { id: 'ready', label: '✅ Siap Saji / Diantar', count: counts.ready, color: 'text-emerald-400' },
            { id: 'completed', label: '📦 Selesai', count: counts.completed, color: 'text-slate-400' },
          ].map((tab) => {
            const isSelected = filterTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterTab(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all flex items-center gap-2 ${
                  isSelected
                    ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20 ring-1 ring-amber-300'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  isSelected ? 'bg-black/20 text-black' : 'bg-slate-700 text-slate-300'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* KDS Main Grid */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-3">
              <span className="text-3xl animate-spin">🍳</span>
              <p className="text-sm">Menyiapkan antrean tiket dapur...</p>
            </div>
          ) : displayedOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-20 h-20 rounded-3xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center text-4xl mb-4 text-slate-500">
                👨‍🍳
              </div>
              <h3 className="text-lg font-black text-white">Tidak Ada Tiket Pesanan</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Semua pesanan pada filter ini sudah selesai disajikan atau belum ada pesanan baru dari QR meja.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
              {displayedOrders.map((order) => {
                const urgency = getElapsedUrgency(order.created_at);
                const elapsedStr = formatElapsed(order.created_at);
                const isAccepted = order.status === 'accepted';
                const isPreparing = order.status === 'preparing';
                const isReady = order.status === 'ready';
                const isCompleted = order.status === 'completed';

                return (
                  <div
                    key={order.id}
                    className={`rounded-3xl border flex flex-col justify-between overflow-hidden shadow-xl transition-all ${
                      isAccepted
                        ? 'bg-slate-900 border-amber-500/40 ring-1 ring-amber-500/20'
                        : isPreparing
                        ? 'bg-slate-900 border-blue-500/40 ring-1 ring-blue-500/20'
                        : isReady
                        ? 'bg-slate-900 border-emerald-500/40 ring-1 ring-emerald-500/20'
                        : 'bg-slate-900/60 border-slate-800 opacity-70'
                    }`}
                  >
                    {/* Ticket Header */}
                    <div className="p-4 border-b border-slate-800/80 bg-slate-950/40">
                      <div className="flex items-center justify-between gap-2">
                        {/* Table Badge */}
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 rounded-xl bg-orange-500 text-black font-black text-sm tracking-wide shadow-md">
                            {order.table_number ? `MEJA ${order.table_number}` : 'TAKEAWAY'}
                          </span>
                          <span className="font-mono text-xs font-bold text-slate-400">
                            #{order.order_code}
                          </span>
                        </div>

                        {/* Stopwatch Timer */}
                        <div className={`px-2.5 py-1 rounded-xl border font-mono text-xs font-black flex items-center gap-1.5 ${urgency.color}`}>
                          <span>⏱️</span>
                          <span>{elapsedStr}</span>
                        </div>
                      </div>

                      {order.customer_name && (
                        <p className="text-xs text-slate-400 mt-2">
                          Pemesan: <strong className="text-white">{order.customer_name}</strong>
                        </p>
                      )}
                    </div>

                    {/* Ticket Items List */}
                    <div className="p-4 flex-1 space-y-2.5 overflow-y-auto max-h-72">
                      {(order.items || []).map((item, idx) => {
                        const isChecked = !!checkedItems[`${order.id}-${idx}`];
                        return (
                          <div
                            key={idx}
                            onClick={() => toggleItemCheck(order.id, idx)}
                            className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                              isChecked
                                ? 'bg-slate-950/80 border-slate-800 opacity-40 line-through'
                                : 'bg-slate-800/50 hover:bg-slate-800 border-slate-700/60'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}} // handled by parent onClick
                              className="mt-1 w-4 h-4 rounded text-orange-500 border-slate-700 bg-slate-900 focus:ring-0 cursor-pointer pointer-events-none"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className={`text-sm font-black ${isChecked ? 'text-slate-500' : 'text-white'}`}>
                                  {item.product_name || item.name}
                                </span>
                                <span className="px-2 py-0.5 rounded-lg bg-amber-400/20 text-amber-300 font-black text-xs">
                                  {item.qty}x
                                </span>
                              </div>
                              {item.notes && (
                                <p className="text-[11px] font-semibold text-yellow-300 bg-yellow-500/10 px-2 py-0.5 rounded mt-1">
                                  Catatan: {item.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Action Bar */}
                    <div className="p-4 border-t border-slate-800 bg-slate-950/60">
                      {isAccepted && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(order, 'preparing')}
                          disabled={updatingId === order.id}
                          className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-500/20 transition flex items-center justify-center gap-2"
                        >
                          {updatingId === order.id ? '⏳ Menyimpan...' : '🔥 Mulai Masak'}
                        </button>
                      )}

                      {isPreparing && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(order, 'ready')}
                          disabled={updatingId === order.id}
                          className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2"
                        >
                          {updatingId === order.id ? '⏳ Menyimpan...' : '✅ Selesai Masak / Siap Saji'}
                        </button>
                      )}

                      {isReady && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(order, 'completed')}
                          disabled={updatingId === order.id}
                          className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-blue-500/20 transition flex items-center justify-center gap-2"
                        >
                          {updatingId === order.id ? '⏳ Menyimpan...' : '🍽️ Sudah Diantarkan'}
                        </button>
                      )}

                      {isCompleted && (
                        <div className="py-2.5 text-center text-xs font-bold text-slate-500 bg-slate-900 rounded-xl border border-slate-800">
                          ✓ Pesanan Selesai Disajikan
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}

