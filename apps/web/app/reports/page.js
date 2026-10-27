'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import AdminLayout from '@/components/layout/AdminLayout';
import { downloadBusinessAnalysisPdf, getBusinessAnalysis, getTransactionYears } from '@/lib/api';
import SectionSkeleton from '@/components/ui/SectionSkeleton';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

const formatCurrency = (value) => `Rp ${Number(value || 0).toLocaleString('id-ID')}`;
const formatNumber = (value) => Number(value || 0).toLocaleString('id-ID');

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );
}

function InsightTone({ severity }) {
  const tone = {
    good: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    risk: 'bg-red-500/10 text-red-300 border-red-500/30',
    warning: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30',
    info: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
  }[severity] || 'bg-slate-700 text-slate-300 border-slate-600';

  const label = {
    good: 'Sehat',
    risk: 'Risiko',
    warning: 'Evaluasi',
    info: 'Info',
  }[severity] || 'Info';

  return <span className={`text-[10px] font-bold uppercase tracking-[0.16em] px-2 py-1 rounded border ${tone}`}>{label}</span>;
}

function MetricCard({ label, value, helper, tone = 'gold' }) {
  const tones = {
    gold: 'text-yellow-400',
    green: 'text-emerald-400',
    blue: 'text-sky-400',
    red: 'text-red-400',
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4">
      <p className="text-slate-400 text-xs uppercase tracking-[0.16em]">{label}</p>
      <p className={`${tones[tone]} text-2xl font-bold mt-2`}>{value}</p>
      {helper && <p className="text-slate-500 text-xs mt-2">{helper}</p>}
    </div>
  );
}

const createSmoothPath = (points) => {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  return points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;

    const prev = points[index - 1];
    const next = points[index + 1] || point;
    const prevPrev = points[index - 2] || prev;
    const cp1x = prev.x + (point.x - prevPrev.x) / 6;
    const cp1y = prev.y + (point.y - prevPrev.y) / 6;
    const cp2x = point.x - (next.x - prev.x) / 6;
    const cp2y = point.y - (next.y - prev.y) / 6;

    return `${path} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${point.x} ${point.y}`;
  }, '');
};

function AnimatedLineChart({ rows = [] }) {
  const [activePoint, setActivePoint] = useState(null);
  const width = 860;
  const height = 300;
  const padding = { top: 24, right: 26, bottom: 48, left: 58 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const maxValue = Math.max(...rows.map((row) => Math.max(Number(row.revenue || 0), Number(row.margin || 0))), 1);

  const pointsFor = (key) =>
    rows.map((row, index) => {
      const x = padding.left + (rows.length > 1 ? (index / (rows.length - 1)) * chartWidth : chartWidth / 2);
      const y = padding.top + chartHeight - (Math.max(0, Number(row[key] || 0)) / maxValue) * chartHeight;
      return { x, y, row, index };
    });

  const revenuePoints = pointsFor('revenue');
  const marginPoints = pointsFor('margin');
  const revenuePath = createSmoothPath(revenuePoints);
  const marginPath = createSmoothPath(marginPoints);
  const areaPath = revenuePoints.length
    ? `${revenuePath} L ${revenuePoints[revenuePoints.length - 1].x} ${padding.top + chartHeight} L ${revenuePoints[0].x} ${padding.top + chartHeight} Z`
    : '';

  const yTicks = [1, 0.75, 0.5, 0.25, 0];

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[320px] overflow-visible">
        <defs>
          <linearGradient id="revenueArea" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#facc15" stopOpacity="0.24" />
            <stop offset="100%" stopColor="#facc15" stopOpacity="0" />
          </linearGradient>
        </defs>

        {yTicks.map((tick) => {
          const y = padding.top + chartHeight * (1 - tick);
          return (
            <g key={tick}>
              <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="rgba(148,163,184,0.16)" />
              <text x={padding.left - 12} y={y + 4} textAnchor="end" className="fill-slate-500 text-[10px]">
                {formatCurrency(maxValue * tick).replace('Rp ', '')}
              </text>
            </g>
          );
        })}

        {areaPath && (
          <motion.path
            d={areaPath}
            fill="url(#revenueArea)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        )}

        <motion.path
          d={revenuePath}
          fill="none"
          stroke="#facc15"
          strokeWidth="4"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.1, ease: 'easeInOut' }}
        />
        <motion.path
          d={marginPath}
          fill="none"
          stroke="#34d399"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="7 7"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.1, delay: 0.15, ease: 'easeInOut' }}
        />

        {revenuePoints.map((point, index) => (
          <motion.g
            key={`${point.row.label}-${index}`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.45 + index * 0.035, type: 'spring', stiffness: 260, damping: 18 }}
            onMouseEnter={() => setActivePoint(point.row)}
            onMouseLeave={() => setActivePoint(null)}
          >
            <circle cx={point.x} cy={point.y} r="12" fill="transparent" />
            <circle cx={point.x} cy={point.y} r="4.5" fill="#0f172a" stroke="#facc15" strokeWidth="3" />
          </motion.g>
        ))}

        {rows.map((row, index) => {
          if (rows.length > 10 && index % Math.ceil(rows.length / 8) !== 0 && index !== rows.length - 1) return null;
          const x = padding.left + (rows.length > 1 ? (index / (rows.length - 1)) * chartWidth : chartWidth / 2);
          return (
            <text key={`${row.label}-label`} x={x} y={height - 18} textAnchor="middle" className="fill-slate-500 text-[11px]">
              {row.label}
            </text>
          );
        })}
      </svg>

      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
        <span className="inline-flex items-center gap-2"><span className="h-2 w-6 rounded-full bg-yellow-400" /> Omzet</span>
        <span className="inline-flex items-center gap-2"><span className="h-2 w-6 rounded-full bg-emerald-400" /> Margin keuntungan</span>
      </div>

      {activePoint && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute right-4 top-4 min-w-56 rounded-lg border border-slate-700 bg-slate-950/95 p-3 text-sm shadow-2xl"
        >
          <p className="text-white font-semibold">{activePoint.label}</p>
          <p className="text-yellow-400 mt-2">Omzet: {formatCurrency(activePoint.revenue)}</p>
          <p className="text-emerald-400">Margin: {formatCurrency(activePoint.margin)} ({activePoint.margin_pct}%)</p>
          <p className="text-slate-400">{activePoint.total_trx} transaksi</p>
        </motion.div>
      )}
    </div>
  );
}

export default function ReportsPage() {
  const [analysis, setAnalysis] = useState(null);
  const [period, setPeriod] = useState('daily');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [years, setYears] = useState([new Date().getFullYear()]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState('');
  const analysisRef = useRef(null);
  const loadSeqRef = useRef(0);

  const params = useMemo(() => ({ period, month, year }), [period, month, year]);

  useEffect(() => {
    getTransactionYears()
      .then((res) => setYears(res.data?.length ? res.data : [new Date().getFullYear()]))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const seq = loadSeqRef.current + 1;
    loadSeqRef.current = seq;
    const silent = Boolean(analysisRef.current);
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError('');
    getBusinessAnalysis(params)
      .then((res) => {
        if (loadSeqRef.current !== seq) return;
        analysisRef.current = res.data;
        setAnalysis(res.data);
      })
      .catch((err) => {
        if (loadSeqRef.current !== seq) return;
        setError(err?.response?.data?.message || 'Gagal memuat analisis laporan');
        if (!analysisRef.current) setAnalysis(null);
      })
      .finally(() => {
        if (loadSeqRef.current !== seq) return;
        setLoading(false);
        setRefreshing(false);
      });
  }, [params]);

  const maxProductSold = Math.max(...(analysis?.best_products || []).map((row) => Number(row.total_sold)), 1);
  const maxPaymentRevenue = Math.max(...(analysis?.payment_mix || []).map((row) => Number(row.revenue)), 1);

  const handleDownloadPdf = async () => {
    try {
      setPdfLoading(true);
      const res = await downloadBusinessAnalysisPdf(params);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `laporan-bisnis-${period}-${month}-${year}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div data-tour="reports-header" className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-yellow-400 text-xs uppercase tracking-[0.22em] font-bold">Business Intelligence</p>
            <h1 className="text-white text-2xl font-bold mt-2">Laporan & Evaluasi Bisnis</h1>
            <p className="text-slate-400 text-sm mt-1">
              Ringkasan omzet, profit, stok, karyawan, dan rekomendasi untuk admin, owner, dan investor.
            </p>
          </div>

          <div data-tour="reports-controls" className="flex flex-wrap gap-2">
            {refreshing && (
              <span className="rounded-full border border-sky-500/25 bg-sky-500/10 px-3 py-2 text-xs font-bold text-sky-200">
                Sinkronisasi laporan...
              </span>
            )}
            <div data-tour="reports-period-toggle" className="flex rounded-lg overflow-hidden border border-slate-700 bg-slate-900">
              {['daily', 'monthly'].map((item) => (
                <button
                  key={item}
                  onClick={() => setPeriod(item)}
                  className={`px-4 py-2 text-sm font-semibold transition ${
                    period === item ? 'bg-yellow-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {item === 'daily' ? 'Harian' : 'Bulanan'}
                </button>
              ))}
            </div>

            {period === 'daily' && (
              <select data-tour="reports-month-select" value={month} onChange={(e) => setMonth(Number(e.target.value))} className="bg-slate-900 text-white border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none">
                {MONTHS.map((item, index) => <option key={item} value={index + 1}>{item}</option>)}
              </select>
            )}

            <select data-tour="reports-year-select" value={year} onChange={(e) => setYear(Number(e.target.value))} className="bg-slate-900 text-white border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none">
              {years.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>

            <button
              data-tour="reports-export-pdf"
              onClick={handleDownloadPdf}
              disabled={!analysis || pdfLoading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition"
            >
              <DownloadIcon />
              {pdfLoading ? 'Membuat PDF...' : 'Export PDF'}
            </button>
          </div>
        </div>

        {error && <div className="p-4 bg-red-500/15 border border-red-500/30 text-red-200 rounded-lg text-sm">{error}</div>}

        {loading && !analysis ? (
          <SectionSkeleton />
        ) : analysis ? (
          <>
            <div data-tour="reports-summary-cards" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4">
              <MetricCard label="Total Omzet" value={formatCurrency(analysis.summary.revenue)} helper={analysis.range.label} />
              <MetricCard label="Gross Profit" value={formatCurrency(analysis.summary.gross_profit)} helper={`HPP ${formatCurrency(analysis.summary.hpp)}`} tone="green" />
              <MetricCard label="Margin" value={formatCurrency(analysis.summary.gross_profit)} helper={`${analysis.summary.margin_pct}% gross margin`} tone={analysis.summary.margin_pct >= 45 ? 'green' : 'red'} />
              <MetricCard label="Transaksi" value={`${formatNumber(analysis.summary.total_trx)} trx`} helper={`AOV ${formatCurrency(analysis.summary.avg_order_value)}`} tone="blue" />
              <MetricCard label="Growth" value={`${analysis.summary.growth_pct >= 0 ? '+' : ''}${analysis.summary.growth_pct}%`} helper="Vs periode sebelumnya" tone={analysis.summary.growth_pct >= 0 ? 'green' : 'red'} />
              <MetricCard label="Distribusi Diskon" value={formatCurrency(analysis.discounts?.total_discount || 0)} helper={`Rata-rata ${analysis.discounts?.avg_discount_rate || 0}% | ${formatNumber(analysis.discounts?.total_orders || 0)} klaim`} tone="green" />
            </div>

            {analysis.discounts?.by_type?.length > 0 && (
              <div data-tour="reports-discount-cards" className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {analysis.discounts.by_type.map((item) => (
                  <div key={item.type} className="rounded-lg border border-slate-800 bg-slate-900 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{item.type === 'review_reward' ? 'Reward Review' : item.type === 'voucher' ? 'Voucher' : 'Bundle'}</p>
                    <p className="mt-2 text-xl font-black text-emerald-400">{formatCurrency(item.total_discount)}</p>
                    <p className="mt-1 text-xs text-slate-500">{formatNumber(item.total_orders)} klaim</p>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.75fr)] gap-6">
              <div data-tour="reports-trend-chart" className="bg-slate-900 border border-slate-800 rounded-lg p-5">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-white font-bold">Tren Omzet dan Margin</h2>
                  <span className="text-slate-500 text-xs">{analysis.series.length} titik data</span>
                </div>
                {analysis.series.length === 0 ? (
                  <div className="h-72 grid place-items-center text-slate-500 text-sm">Belum ada data transaksi</div>
                ) : <AnimatedLineChart rows={analysis.series} />}
              </div>

              <div data-tour="reports-insights" className="bg-slate-900 border border-slate-800 rounded-lg p-5">
                <h2 className="text-white font-bold mb-4">Insight Evaluasi</h2>
                <div className="space-y-3">
                  {analysis.insights.map((insight, index) => (
                    <div key={`${insight.title}-${index}`} className="border border-slate-800 rounded-lg p-3 bg-slate-950/40">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-white text-sm font-semibold">{insight.title}</h3>
                        <InsightTone severity={insight.severity} />
                      </div>
                      <p className="text-slate-400 text-sm mt-2 leading-6">{insight.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div data-tour="reports-best-products" className="bg-slate-900 border border-slate-800 rounded-lg p-5">
                <h2 className="text-white font-bold mb-4">Produk Penggerak Omzet</h2>
                <div className="space-y-4">
                  {analysis.best_products.map((product, index) => (
                    <div key={product.id || index}>
                      <div className="flex justify-between gap-3 text-sm">
                        <span className="text-white truncate">{index + 1}. {product.name}</span>
                        <span className="text-slate-400 shrink-0">{product.total_sold} terjual</span>
                      </div>
                      <div className="mt-2 h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-yellow-500" style={{ width: `${(product.total_sold / maxProductSold) * 100}%` }} />
                      </div>
                      <div className="flex justify-between text-xs text-slate-500 mt-1">
                        <span>{formatCurrency(product.revenue)}</span>
                        <span>Margin {formatCurrency(product.margin)} ({product.margin_pct}%)</span>
                      </div>
                    </div>
                  ))}
                  {analysis.best_products.length === 0 && <p className="text-slate-500 text-sm">Belum ada data produk.</p>}
                </div>
              </div>

              <div data-tour="reports-cashier-performance" className="bg-slate-900 border border-slate-800 rounded-lg p-5">
                <h2 className="text-white font-bold mb-4">Performa Kasir</h2>
                <div className="space-y-3">
                  {analysis.cashier_performance.map((cashier, index) => (
                    <div key={cashier.id || index} className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3 last:border-0">
                      <div>
                        <p className="text-white text-sm font-semibold">{cashier.name}</p>
                        <p className="text-slate-500 text-xs">{cashier.total_trx} transaksi - AOV {formatCurrency(cashier.avg_order_value)}</p>
                      </div>
                      <p className="text-emerald-400 text-sm font-bold">{formatCurrency(cashier.revenue)}</p>
                    </div>
                  ))}
                  {analysis.cashier_performance.length === 0 && <p className="text-slate-500 text-sm">Belum ada data kasir.</p>}
                </div>
              </div>

              <div data-tour="reports-payment-mix" className="bg-slate-900 border border-slate-800 rounded-lg p-5">
                <h2 className="text-white font-bold mb-4">Metode Pembayaran</h2>
                <div className="space-y-4">
                  {analysis.payment_mix.map((payment) => (
                    <div key={payment.payment_method}>
                      <div className="flex justify-between text-sm">
                        <span className="text-white capitalize">{payment.payment_method}</span>
                        <span className="text-slate-400">{payment.total_trx} trx</span>
                      </div>
                      <div className="mt-2 h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-sky-500" style={{ width: `${(payment.revenue / maxPaymentRevenue) * 100}%` }} />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{formatCurrency(payment.revenue)}</p>
                    </div>
                  ))}
                  {analysis.payment_mix.length === 0 && <p className="text-slate-500 text-sm">Belum ada data pembayaran.</p>}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div data-tour="reports-low-stock" className="bg-slate-900 border border-slate-800 rounded-lg p-5">
                <h2 className="text-white font-bold mb-4">Risiko Stok Kritis</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-slate-500 border-b border-slate-800">
                        <th className="text-left py-2 font-medium">Bahan</th>
                        <th className="text-right py-2 font-medium">Stok</th>
                        <th className="text-right py-2 font-medium">Minimum</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysis.low_stock_items.map((item) => (
                        <tr key={item.id} className="border-b border-slate-800/70 last:border-0">
                          <td className="py-2 text-white">{item.name}</td>
                          <td className="py-2 text-right text-red-300">{item.stock} {item.unit}</td>
                          <td className="py-2 text-right text-slate-400">{item.min_stock} {item.unit}</td>
                        </tr>
                      ))}
                      {analysis.low_stock_items.length === 0 && (
                        <tr><td colSpan={3} className="py-8 text-center text-emerald-400">Semua stok aman.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div data-tour="reports-attendance" className="bg-slate-900 border border-slate-800 rounded-lg p-5">
                <h2 className="text-white font-bold mb-4">Aktivitas Karyawan</h2>
                <div className="space-y-3">
                  {analysis.attendance_summary.map((staff) => (
                    <div key={staff.id} className="flex justify-between gap-3 border-b border-slate-800 pb-3 last:border-0">
                      <div>
                        <p className="text-white text-sm font-semibold">{staff.name}</p>
                        <p className="text-slate-500 text-xs">{staff.active_days} hari aktif</p>
                      </div>
                      <p className="text-yellow-400 text-sm font-bold">{staff.active_hours} jam</p>
                    </div>
                  ))}
                  {analysis.attendance_summary.length === 0 && <p className="text-slate-500 text-sm">Belum ada data absensi pada periode ini.</p>}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </AdminLayout>
  );
}
