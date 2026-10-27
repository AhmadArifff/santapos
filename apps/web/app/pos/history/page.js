'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/ui/AuthGuard';
import { deleteTransaction, getTransactions } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import AdminLayout from '@/components/layout/AdminLayout';
import { TableSkeleton } from '@/components/ui/SectionSkeleton';
import DateRangePicker from '@/components/ui/DateRangePicker';

export default function TransactionHistoryPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [transactions, setTransactions] = useState([]);
  const transactionsRef = useRef([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({});
  const [deleteModal, setDeleteModal] = useState({ open: false, tx: null, reason: '', submitting: false });

  useEffect(() => {
    transactionsRef.current = transactions;
  }, [transactions]);

  // Set default date range to today
  useEffect(() => {
    const today = new Date();
    // Format: YYYY-MM-DD (local date, not UTC)
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    setDateFrom(dateStr);
    setDateTo(dateStr);
  }, []);

  // Load transactions
  const loadTransactions = useCallback(async (filters = {}, { silent = false } = {}) => {
    try {
      if (silent || transactionsRef.current.length > 0) setRefreshing(true);
      else setLoading(true);
      const params = {
        limit: 1000,
        ...filters,
      };
      const res = await getTransactions(params);
      setTransactions(res.data || []);
      setAppliedFilters(filters);
    } catch (err) {
      console.error('Error loading transactions:', err);
      alert('Gagal memuat data transaksi: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Handle filter
  const handleApplyFilter = () => {
    const filters = {};
    if (dateFrom) filters.dateFrom = dateFrom;
    if (dateTo) filters.dateTo = dateTo;
    if (search) filters.search = search;
    loadTransactions(filters, { silent: transactionsRef.current.length > 0 });
  };

  // Handle reset filter
  const handleResetFilter = () => {
    setSearch('');
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    setDateFrom(dateStr);
    setDateTo(dateStr);
    loadTransactions({
      dateFrom: dateStr,
      dateTo: dateStr,
    }, { silent: transactionsRef.current.length > 0 });
  };

  const handleDeleteTransaction = async (tx) => {
    setDeleteModal({ open: true, tx, reason: '', submitting: false });
  };

  const closeDeleteModal = () => {
    if (deleteModal.submitting) return;
    setDeleteModal({ open: false, tx: null, reason: '', submitting: false });
  };

  const confirmDeleteTransaction = async () => {
    const tx = deleteModal.tx;
    const reason = deleteModal.reason.trim();
    if (!tx || !reason) return;

    try {
      setDeleteModal((prev) => ({ ...prev, submitting: true }));
      await deleteTransaction(tx.id, { reason });
      await loadTransactions(appliedFilters, { silent: true });
      setDeleteModal({ open: false, tx: null, reason: '', submitting: false });
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus transaksi');
      setDeleteModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  // Initial load - fixed dependency array
  useEffect(() => {
    if (dateFrom && dateTo) {
      loadTransactions({ dateFrom, dateTo }, { silent: transactionsRef.current.length > 0 });
    }
  }, [dateFrom, dateTo, loadTransactions]);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Format date time
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // Get transaction creator info
  const getCreatorInfo = (tx) => {
    const isAdmin = tx.creator_role === 'admin';
    if (isAdmin) {
      if (tx.source_user_id) {
        return {
          label: `Admin (${tx.creator_name}) → ${tx.source_user_name}`,
          type: 'admin-on-behalf',
          color: 'bg-orange-100 text-orange-800',
          icon: '👤📊',
        };
      } else {
        return {
          label: `Admin (${tx.creator_name})`,
          type: 'admin-direct',
          color: 'bg-blue-100 text-blue-800',
          icon: '👨‍💼',
        };
      }
    } else {
      return {
        label: `${tx.creator_name}`,
        type: 'kasir-self',
        color: 'bg-green-100 text-green-800',
        icon: '👤',
      };
    }
  };

  // Calculate statistics based on date range
  const calculateStats = () => {
    // Group transactions by month-year
    const months = new Map(); // key: "2026-05", value: {omzet, count, margin, year, month}
    
    transactions.forEach(tx => {
      const txDate = new Date(tx.created_at);
      const yearMonth = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`;
      
      if (!months.has(yearMonth)) {
        months.set(yearMonth, { 
          omzet: 0, 
          count: 0, 
          margin: 0,
          year: txDate.getFullYear(),
          month: txDate.getMonth() + 1,
        });
      }
      
      const monthData = months.get(yearMonth);
      monthData.omzet += Number(tx.total_price);
      monthData.count += 1;
      monthData.margin = Math.round(monthData.omzet * 0.35);
    });
    
    return Array.from(months.values()).sort((a, b) => {
      const dateA = new Date(a.year, a.month - 1);
      const dateB = new Date(b.year, b.month - 1);
      return dateA - dateB;
    });
  };

  const monthlyStats = calculateStats();
  const totalOmzet = transactions.reduce((sum, t) => sum + Number(t.total_price), 0);
  const totalMargin = Math.round(totalOmzet * 0.35);
  const totalDiscount = transactions.reduce((sum, t) => sum + Number(t.customer_discount_amount || 0), 0);
  const discountCount = transactions.filter((t) => Number(t.customer_discount_amount || 0) > 0).length;
  const avgDiscountRate = discountCount > 0
    ? Math.round(
        transactions.reduce((sum, t) => sum + Number(t.customer_discount_rate || 0), 0) / discountCount * 10
      ) / 10
    : 0;

  return (
    <AuthGuard requiredRole="admin">
      <AdminLayout>
        <div className="w-full max-w-6xl mx-auto px-4 py-8">
          {/* Header */}
          <div data-tour="pos-history-header" className="mb-8">
            <h1 className="text-3xl font-black text-white mb-2">📊 Riwayat Transaksi POS</h1>
            <p className="text-slate-400">Pantau semua transaksi dengan detail kasir/admin yang melakukan</p>
          </div>

          {/* Filters */}
          <div data-tour="pos-history-filters" className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-8">
            <h2 className="text-lg font-bold text-white mb-4">🔍 Filter & Cari</h2>
            <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)_minmax(0,1fr)]">
              <div data-tour="pos-history-date-filter">
                <DateRangePicker
                  label="Range transaksi"
                  value={{ start: dateFrom, end: dateTo }}
                  onChange={({ start, end }) => {
                    setDateFrom(start);
                    setDateTo(end);
                  }}
                  helperText="Klik tanggal awal transaksi, lalu tanggal akhir"
                />
              </div>

              {/* Search */}
              <label data-tour="pos-history-search" className="flex min-h-[58px] flex-col justify-center rounded-xl border border-slate-600 bg-slate-700 px-3 py-2 transition hover:border-orange-500/70 focus-within:border-orange-500 focus-within:ring-1 focus-within:ring-orange-500">
                <span className="block text-xs font-semibold text-slate-300">
                  Cari (Invoice, Kasir, Admin)
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Ketik untuk mencari..."
                  className="mt-0.5 w-full bg-transparent text-sm font-semibold text-white placeholder-slate-500 outline-none"
                />
              </label>

              {/* Buttons */}
              <div data-tour="pos-history-filter-actions" className="flex min-h-[58px] gap-2">
                <button
                  onClick={handleApplyFilter}
                  disabled={loading || refreshing}
                  className="flex-1 rounded-xl bg-orange-500 px-4 py-2 font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  🔎 Cari
                </button>
                <button
                  onClick={handleResetFilter}
                  disabled={loading || refreshing}
                  className="flex-1 rounded-xl bg-slate-600 px-4 py-2 font-semibold text-white transition hover:bg-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  ↻ Reset
                </button>
              </div>
            </div>
          </div>

          {/* Monthly Statistics Cards */}
          {monthlyStats.length > 0 && (
            <div data-tour="pos-history-monthly-stats" className="mb-8">
              <h2 className="text-lg font-bold text-white mb-4">📈 Statistik per Bulan</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {monthlyStats.map((stat, idx) => {
                  const monthName = new Intl.DateTimeFormat('id-ID', { 
                    month: 'long', 
                    year: 'numeric' 
                  }).format(new Date(stat.year, stat.month - 1));
                  
                  return (
                    <div key={idx} className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-5 hover:border-orange-500/50 transition shadow-lg">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-bold text-white capitalize">{monthName}</h3>
                        <span className="text-2xl">📊</span>
                      </div>
                      
                      {/* Omzet */}
                      <div className="mb-4 pb-4 border-b border-slate-700">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">💰</span>
                          <span className="text-slate-400 text-sm">Omzet</span>
                        </div>
                        <p className="text-2xl font-black text-orange-400">{formatCurrency(stat.omzet)}</p>
                        <p className="text-xs text-slate-500 mt-1">{stat.count} transaksi</p>
                      </div>
                      
                      {/* Margin */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">📈</span>
                            <span className="text-slate-400 text-sm">Margin</span>
                          </div>
                          <span className="text-xs bg-green-900/30 text-green-300 px-2 py-1 rounded font-semibold">35%</span>
                        </div>
                        <p className="text-2xl font-black text-green-400">{formatCurrency(stat.margin)}</p>
                        <p className="text-xs text-slate-500 mt-1">dari omzet</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Summary Overall */}
          {refreshing && !loading && (
            <div className="mb-4 rounded-xl border border-slate-700 bg-slate-800/70 px-4 py-2 text-xs font-semibold text-slate-400">
              Menyinkronkan riwayat transaksi...
            </div>
          )}

          {/* Summary Overall */}
          <div data-tour="pos-history-summary" className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <p className="text-slate-400 text-sm">Total Transaksi</p>
              <p className="text-2xl font-black text-white">{transactions.length}</p>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <p className="text-slate-400 text-sm">Total Penjualan (Omzet)</p>
              <p className="text-2xl font-black text-orange-400">
                {formatCurrency(totalOmzet)}
              </p>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <p className="text-slate-400 text-sm">Total Margin (35%)</p>
              <p className="text-2xl font-black text-green-400">
                {formatCurrency(totalMargin)}
              </p>
            </div>
            <div data-tour="pos-history-discount-summary" className="bg-slate-800 border border-emerald-500/25 rounded-xl p-4">
              <p className="text-slate-400 text-sm">Total Distribusi Diskon</p>
              <p className="text-2xl font-black text-emerald-400">
                {formatCurrency(totalDiscount)}
              </p>
              <p className="mt-1 text-xs text-slate-500">Rata-rata {avgDiscountRate}% | {discountCount} transaksi</p>
            </div>
          </div>

          {/* Table */}
          <div data-tour="pos-history-table" className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
            {loading && transactions.length === 0 ? (
              <TableSkeleton rows={7} cols={8} />
            ) : transactions.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <p>📭 Tidak ada transaksi</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-900 border-b border-slate-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">
                        Invoice
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">
                        Waktu
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">
                        Pembuat / Kasir
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">
                        Tipe
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">
                        Pembayaran
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-slate-300">
                        Total
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-slate-300">
                        Diskon
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-slate-300">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {transactions.map((tx, idx) => {
                      const creatorInfo = getCreatorInfo(tx);
                      return (
                        <tr
                          key={tx.id}
                          data-tour="pos-history-row"
                          className="hover:bg-slate-700/50 transition border-b border-slate-700"
                        >
                          <td className="px-4 py-3 font-mono text-sm text-slate-300">
                            {tx.invoice_number}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-400">
                            {formatDateTime(tx.created_at)}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${creatorInfo.color}`}>
                              {creatorInfo.icon} {creatorInfo.label}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {creatorInfo.type === 'admin-on-behalf' && (
                              <span className="inline-block px-2 py-1 bg-orange-900/30 text-orange-300 text-xs rounded font-semibold">
                                Admin (Atas nama Kasir)
                              </span>
                            )}
                            {creatorInfo.type === 'admin-direct' && (
                              <span className="inline-block px-2 py-1 bg-blue-900/30 text-blue-300 text-xs rounded font-semibold">
                                Admin (Langsung)
                              </span>
                            )}
                            {creatorInfo.type === 'kasir-self' && (
                              <span className="inline-block px-2 py-1 bg-green-900/30 text-green-300 text-xs rounded font-semibold">
                                Kasir (Sendiri)
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-300 capitalize">
                            {tx.payment_method === 'cash' && '💵 Tunai'}
                            {tx.payment_method === 'qris' && '📱 QRIS'}
                            {tx.payment_method === 'transfer' && '🏦 Transfer'}
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-orange-400 text-right">
                            {formatCurrency(tx.total_price)}
                          </td>
                          <td data-tour="pos-history-row-discount" className="px-4 py-3 text-sm font-semibold text-emerald-400 text-right">
                            {Number(tx.customer_discount_amount || 0) > 0
                              ? formatCurrency(tx.customer_discount_amount)
                              : '-'}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              data-tour="pos-history-delete-action"
                              data-tour-action="pos-history-open-delete-modal"
                              onClick={() => handleDeleteTransaction(tx)}
                              className="rounded-lg border border-red-400/25 bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-200 transition hover:bg-red-500/20"
                            >
                              Hapus & Kembalikan Stok
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Enhanced Dashboard Section */}
          <div className="mt-12 space-y-8">
            {/* Payment Method Analysis */}
            <div data-tour="pos-history-payment-analysis" className="bg-gradient-to-br from-slate-800 via-slate-850 to-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl hover:shadow-orange-500/10 transition-all duration-300">
              <div className="bg-gradient-to-r from-orange-500 to-pink-600 h-1 rounded-full mb-4" />
              <h2 className="text-xl font-bold bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent mb-2">
                💳 Analisis Metode Pembayaran
              </h2>
              <p className="text-sm text-slate-400 mb-6">Breakdown pembayaran berdasarkan metode untuk periode {dateFrom && dateTo ? `${dateFrom} - ${dateTo}` : 'Hari ini'}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(() => {
                  const paymentStats = transactions.reduce((acc, tx) => {
                    const method = tx.payment_method || 'cash';
                    if (!acc[method]) acc[method] = { count: 0, total: 0 };
                    acc[method].count += 1;
                    acc[method].total += Number(tx.total_price);
                    return acc;
                  }, {});
                  
                  const methods = [
                    { key: 'cash', label: '💵 Tunai', color: 'from-green-500 to-emerald-600' },
                    { key: 'qris', label: '📱 QRIS', color: 'from-blue-500 to-cyan-600' },
                    { key: 'transfer', label: '🏦 Transfer', color: 'from-purple-500 to-indigo-600' }
                  ];
                  
                  return methods.map(method => {
                    const stat = paymentStats[method.key];
                    const percentage = stat ? Math.round((stat.total / totalOmzet) * 100) : 0;
                    return (
                      <div key={method.key} className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl p-5 border border-slate-600 hover:border-orange-500/30 transition transform hover:scale-105">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-2xl">{method.label.split(' ')[0]}</span>
                          <span className="text-xs bg-slate-900 px-2 py-1 rounded-full text-orange-400 font-semibold">{stat?.count || 0}x</span>
                        </div>
                        <div className="h-2 bg-slate-600 rounded-full overflow-hidden mb-3">
                          <div className={`h-full bg-gradient-to-r ${method.color} rounded-full transition-all duration-500`} style={{width: `${percentage}%`}} />
                        </div>
                        <p className="text-lg font-bold text-white mb-1">{formatCurrency(stat?.total || 0)}</p>
                        <p className="text-xs text-slate-400">{percentage}% dari total</p>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Hourly Transaction Wave Chart */}
            <div data-tour="pos-history-hourly-chart" className="bg-gradient-to-br from-slate-800 via-slate-850 to-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl hover:shadow-blue-500/10 transition-all duration-300">
              <div className="bg-gradient-to-r from-blue-500 to-cyan-600 h-1 rounded-full mb-4" />
              <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                📊 Tren Transaksi Harian
              </h2>
              <p className="text-sm text-slate-400 mb-6">Visualisasi pergerakan transaksi per jam {dateFrom && dateTo ? `untuk ${dateFrom}` : 'dengan animasi gelombang'}</p>
              
              {(() => {
                const hourlyData = Array(24).fill(0).map((_, hour) => {
                  const count = transactions.filter(tx => {
                    const txDate = new Date(tx.created_at);
                    return txDate.getHours() === hour;
                  }).length;
                  return { hour, count };
                });
                
                const maxCount = Math.max(...hourlyData.map(d => d.count), 1);
                const avgCount = hourlyData.reduce((sum, d) => sum + d.count, 0) / 24;
                
                return (
                  <div className="space-y-4">
                    <div className="h-48 bg-gradient-to-b from-slate-700/50 to-slate-800/50 rounded-xl p-4 border border-slate-600 overflow-hidden flex items-end justify-center gap-1 relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-cyan-500/5 to-blue-500/5 rounded-xl" />
                      {hourlyData.map((data, idx) => {
                        const height = (data.count / maxCount) * 100;
                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center gap-2 relative group">
                            <div 
                              className="w-full bg-gradient-to-t from-cyan-500 to-blue-400 rounded-t-lg transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/50 relative overflow-hidden"
                              style={{
                                height: `${Math.max(height, 5)}%`,
                                animation: `wave ${2 + (idx * 0.05)}s ease-in-out infinite`
                              }}
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                            </div>
                            <span className="text-xs text-slate-500 group-hover:text-slate-300 transition text-center leading-tight">{data.hour}h</span>
                            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-900 px-2 py-1 rounded text-xs text-cyan-300 font-semibold opacity-0 group-hover:opacity-100 transition pointer-events-none">
                              {data.count}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
                        <p className="text-slate-400 mb-1">⏰ Jam Puncak</p>
                        <p className="text-lg font-bold text-cyan-400">
                          {(() => {
                            const maxHour = hourlyData.reduce((max, curr) => curr.count > max.count ? curr : max);
                            return `${maxHour.hour}:00 (${maxHour.count}x)`;
                          })()}
                        </p>
                      </div>
                      <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
                        <p className="text-slate-400 mb-1">📈 Rata-rata</p>
                        <p className="text-lg font-bold text-blue-400">{Math.round(avgCount)}/jam</p>
                      </div>
                      <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
                        <p className="text-slate-400 mb-1">⏳ Range</p>
                        <p className="text-lg font-bold text-indigo-400">0 - {maxCount}x/jam</p>
                      </div>
                    </div>
                  </div>
                );
              })()}
              <style jsx>{`
                @keyframes wave {
                  0%, 100% { transform: scaleY(1); }
                  25% { transform: scaleY(1.1); }
                  50% { transform: scaleY(0.9); }
                  75% { transform: scaleY(1.05); }
                }
              `}</style>
            </div>

            {/* Daily Revenue Trend */}
            <div data-tour="pos-history-daily-chart" className="bg-gradient-to-br from-slate-800 via-slate-850 to-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl hover:shadow-green-500/10 transition-all duration-300">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 h-1 rounded-full mb-4" />
              <h2 className="text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-2">
                💹 Tren Omzet Harian
              </h2>
              <p className="text-sm text-slate-400 mb-6">Pergerakan revenue per hari dengan indikator performa</p>
              
              {(() => {
                const dailyData = {};
                transactions.forEach(tx => {
                  const date = tx.created_at.split('T')[0];
                  if (!dailyData[date]) dailyData[date] = { total: 0, count: 0 };
                  dailyData[date].total += Number(tx.total_price);
                  dailyData[date].count += 1;
                });
                
                const sortedDays = Object.entries(dailyData).sort((a, b) => new Date(a[0]) - new Date(b[0]));
                
                // Handle empty data
                if (sortedDays.length === 0) {
                  return (
                    <div className="h-48 bg-gradient-to-b from-slate-700/50 to-slate-800/50 rounded-xl p-8 border border-slate-600 flex items-center justify-center">
                      <p className="text-slate-400 text-center">Tidak ada data transaksi untuk periode ini</p>
                    </div>
                  );
                }
                
                const maxDayTotal = Math.max(...sortedDays.map(([_, d]) => d.total), 1);
                const avgDayTotal = sortedDays.reduce((sum, [_, d]) => sum + d.total, 0) / sortedDays.length;
                
                return (
                  <div className="space-y-4">
                    <div className="h-40 bg-gradient-to-b from-slate-700/50 to-slate-800/50 rounded-xl p-4 border border-slate-600 overflow-hidden flex items-end justify-center gap-1 relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-emerald-500/5 to-green-500/5 rounded-xl" />
                      {sortedDays.slice(-14).map(([date, data], idx) => {
                        const height = (data.total / maxDayTotal) * 100;
                        const performance = data.total >= avgDayTotal ? 'above' : 'below';
                        const dayStr = new Date(date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' });
                        return (
                          <div key={date} className="flex-1 flex flex-col items-center gap-2 relative group">
                            <div 
                              className={`w-full rounded-t-lg transition-all duration-300 hover:shadow-lg relative overflow-hidden ${
                                performance === 'above' 
                                  ? 'bg-gradient-to-t from-emerald-500 to-green-400 hover:shadow-green-500/50' 
                                  : 'bg-gradient-to-t from-amber-500 to-orange-400 hover:shadow-amber-500/50'
                              }`}
                              style={{
                                height: `${Math.max(height, 8)}%`,
                                animation: `pulse-bar ${1.5 + (idx * 0.03)}s ease-in-out infinite`
                              }}
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                            </div>
                            <span className="text-xs text-slate-500 group-hover:text-slate-300 transition text-center leading-tight">{dayStr}</span>
                            <div className="absolute -top-9 left-1/2 transform -translate-x-1/2 bg-slate-900 px-2 py-1 rounded text-xs text-green-300 font-semibold opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap">
                              {formatCurrency(data.total)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
                        <p className="text-slate-400 mb-1">🔝 Hari Terbaik</p>
                        <p className="text-sm font-bold text-green-400">
                          {(() => {
                            const best = sortedDays.reduce((max, curr) => curr[1].total > max[1].total ? curr : max, sortedDays[0]);
                            return `${new Date(best[0]).toLocaleDateString('id-ID')} (${formatCurrency(best[1].total)})`;
                          })()}
                        </p>
                      </div>
                      <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
                        <p className="text-slate-400 mb-1">📊 Rata-rata Harian</p>
                        <p className="text-sm font-bold text-emerald-400">{formatCurrency(Math.round(avgDayTotal))}</p>
                      </div>
                      <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
                        <p className="text-slate-400 mb-1">📈 Total Hari</p>
                        <p className="text-sm font-bold text-amber-400">{sortedDays.length} hari</p>
                      </div>
                    </div>
                  </div>
                );
              })()}
              <style jsx>{`
                @keyframes pulse-bar {
                  0%, 100% { opacity: 1; }
                  50% { opacity: 0.8; }
                }
              `}</style>
            </div>
          </div>

          {/* Footer info */}
          <div data-tour="pos-history-footer-info" className="mt-8 p-4 bg-slate-900 border border-slate-700 rounded-lg text-slate-400 text-sm">
            <p>
              <strong>ℹ️ Informasi:</strong> Tabel ini menampilkan semua transaksi POS dengan detail siapa yang melakukan transaksi. 
              Data tidak dapat diubah (read-only). Gunakan filter tanggal dan pencarian untuk menemukan transaksi tertentu.
            </p>
          </div>

          {deleteModal.open && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
              <div data-tour="pos-history-delete-modal" className="w-full max-w-lg rounded-2xl border border-red-400/25 bg-slate-900 shadow-2xl">
                <div className="border-b border-slate-700 px-5 py-4">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-red-300">Konfirmasi void transaksi</p>
                  <h2 className="mt-2 text-xl font-black text-white">Hapus & Kembalikan Stok</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Transaksi {deleteModal.tx?.invoice_number} akan dihapus dari riwayat aktif dan stok bahan akan dikembalikan sesuai item transaksi.
                  </p>
                </div>
                <div className="space-y-4 px-5 py-4">
                  <div className="rounded-xl border border-yellow-400/20 bg-yellow-500/10 p-3 text-sm leading-6 text-yellow-100">
                    Aksi ini dicatat sebagai void. Isi alasan yang jelas agar audit operasional mudah dilacak.
                  </div>
                  <label data-tour="pos-history-delete-reason" className="block text-sm font-semibold text-slate-300">
                    Alasan
                    <textarea
                      value={deleteModal.reason}
                      onChange={(e) => setDeleteModal((prev) => ({ ...prev, reason: e.target.value }))}
                      disabled={deleteModal.submitting}
                      rows={4}
                      placeholder="Contoh: salah input pembayaran, pesanan batal, atau transaksi duplikat."
                      className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white outline-none focus:border-red-400 disabled:opacity-60"
                    />
                  </label>
                </div>
                <div data-tour="pos-history-delete-modal-actions" className="flex flex-col-reverse gap-3 border-t border-slate-700 px-5 py-4 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeDeleteModal}
                    disabled={deleteModal.submitting}
                    className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-bold text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={confirmDeleteTransaction}
                    disabled={deleteModal.submitting || !deleteModal.reason.trim()}
                    className="rounded-xl bg-red-500 px-4 py-2 text-sm font-black text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deleteModal.submitting ? 'Memproses...' : 'Ya, Hapus & Kembalikan Stok'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </AdminLayout>
    </AuthGuard>
  );
}

