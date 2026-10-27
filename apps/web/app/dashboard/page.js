'use client';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import {
  getTodayStats, getSalesReport, getYearlyStats,
  getBestSelling, getLowStock, getTransactionYears,
  getSalesByProduct, getActiveUsers,
  getWeeklyAttendance, getStaffPerformance,
  getDiscountSummary,
} from '@/lib/api';
import { DashboardSkeleton } from '@/components/ui/SectionSkeleton';
const MONTHS = ['Jan','Feb','Mar','Apr','Mei','Jun',
                'Jul','Agu','Sep','Okt','Nov','Des'];
const COLORS  = [
  '#f97316','#22c55e','#60a5fa','#a78bfa',
  '#f43f5e','#facc15','#34d399','#fb923c',
];

// ── helpers ───────────────────────────────────────────────────
function fmtY(v) {
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'jt';
  if (v >= 1_000)     return (v / 1_000).toFixed(0) + 'rb';
  return String(v || 0);
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  return `${r},${g},${b}`;
}

function normalizeDate(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getDashboardMonthRange(year, month) {
  return {
    start: new Date(year, month - 1, 1),
    end: new Date(year, month, 0),
  };
}

function formatShortDate(date) {
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function isSameDate(a, b) {
  return a && b && normalizeDate(a).getTime() === normalizeDate(b).getTime();
}

function isWithinDateRange(day, start, end) {
  if (!start || !end) return false;
  const time = normalizeDate(day).getTime();
  return time >= normalizeDate(start).getTime() && time <= normalizeDate(end).getTime();
}

// ── Filter Chips ──────────────────────────────────────────────
function FilterChips({ items, active, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5 mb-3">
      {items.map((item, i) => {
        const on  = active.has(i);
        const rgb = hexToRgb(item.color);
        return (
          <button
            key={i}
            onClick={() => onChange(i)}
            style={{
              borderColor:     on ? item.color : 'rgba(255,255,255,0.12)',
              backgroundColor: on ? `rgba(${rgb},0.12)` : 'transparent',
              transition:      'all 0.2s',
            }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs
              font-semibold border cursor-pointer"
          >
            <div className="w-2 h-2 rounded-full shrink-0 transition-colors"
              style={{ background: on ? item.color : 'rgba(255,255,255,0.2)' }} />
            <span style={{ color: on ? item.color : 'rgba(255,255,255,0.3)',
              transition: 'color 0.2s' }}>
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function DashboardDateRangePicker({ value, years = [], onChange }) {
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(value.start.getMonth());
  const [viewYear, setViewYear] = useState(value.start.getFullYear());
  const [draftStart, setDraftStart] = useState(value.start);
  const [draftEnd, setDraftEnd] = useState(value.end);

  useEffect(() => {
    setViewMonth(value.start.getMonth());
    setViewYear(value.start.getFullYear());
    setDraftStart(value.start);
    setDraftEnd(value.end);
  }, [value.start, value.end]);

  const monthTitle = new Date(viewYear, viewMonth, 1).toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
  });
  const firstDay = new Date(viewYear, viewMonth, 1);
  const offset = (firstDay.getDay() + 6) % 7;
  const totalDays = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = [
    ...Array.from({ length: offset }, (_, i) => ({ key: `empty-${i}`, empty: true })),
    ...Array.from({ length: totalDays }, (_, i) => ({
      key: `day-${i + 1}`,
      date: new Date(viewYear, viewMonth, i + 1),
    })),
  ];
  const yearOptions = Array.from(new Set([...(years.length ? years : [new Date().getFullYear()]), viewYear]))
    .sort((a, b) => b - a);

  const moveMonth = (direction) => {
    const next = new Date(viewYear, viewMonth + direction, 1);
    setViewMonth(next.getMonth());
    setViewYear(next.getFullYear());
  };

  const pickDate = (date) => {
    const selected = normalizeDate(date);
    if (!draftStart || draftEnd) {
      setDraftStart(selected);
      setDraftEnd(null);
      return;
    }

    const start = selected.getTime() < normalizeDate(draftStart).getTime() ? selected : normalizeDate(draftStart);
    const end = selected.getTime() < normalizeDate(draftStart).getTime() ? normalizeDate(draftStart) : selected;
    setDraftStart(start);
    setDraftEnd(end);
    onChange({ start, end });
    setOpen(false);
  };

  return (
    <div className="relative w-full sm:w-auto">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex w-full min-w-[260px] items-center justify-between gap-3 rounded-2xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-left text-white shadow-lg shadow-black/10 transition-all hover:border-sky-400/60 sm:w-auto"
      >
        <span>
          <span className="block text-[10px] font-black uppercase tracking-[0.22em] text-sky-300">
            Range Dashboard
          </span>
          <span className="mt-0.5 block text-sm font-bold">
            {formatShortDate(value.start)} - {formatShortDate(value.end)}
          </span>
        </span>
        <span className="rounded-xl bg-sky-500/15 px-2.5 py-1 text-xs font-black text-sky-200">
          Kalender
        </span>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-3 w-[min(92vw,380px)] rounded-3xl border border-slate-700 bg-slate-900 p-4 shadow-2xl shadow-black/40">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => moveMonth(-1)}
              className="h-10 w-10 rounded-2xl border border-slate-700 text-lg font-black text-slate-200 transition hover:border-sky-400 hover:text-sky-200"
              aria-label="Bulan sebelumnya"
            >
              {'<'}
            </button>
            <div className="min-w-0 text-center">
              <p className="text-sm font-black text-white">{monthTitle}</p>
              <p className="text-[11px] font-medium text-slate-400">
                Klik tanggal awal, lalu klik tanggal akhir
              </p>
            </div>
            <button
              type="button"
              onClick={() => moveMonth(1)}
              className="h-10 w-10 rounded-2xl border border-slate-700 text-lg font-black text-slate-200 transition hover:border-sky-400 hover:text-sky-200"
              aria-label="Bulan berikutnya"
            >
              {'>'}
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 px-3 py-2">
            <span className="text-xs font-semibold text-slate-400">Tahun laporan</span>
            <select
              value={viewYear}
              onChange={(e) => setViewYear(Number(e.target.value))}
              className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm font-bold text-white outline-none"
            >
              {yearOptions.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[11px] font-black uppercase text-slate-500">
            {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map(day => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-7 gap-1">
            {cells.map(cell => {
              if (cell.empty) return <span key={cell.key} className="h-10" />;
              const activeStart = isSameDate(cell.date, draftStart);
              const activeEnd = isSameDate(cell.date, draftEnd);
              const inRange = isWithinDateRange(cell.date, draftStart, draftEnd);
              return (
                <button
                  key={cell.key}
                  type="button"
                  onClick={() => pickDate(cell.date)}
                  className={[
                    'h-10 rounded-2xl text-sm font-bold transition-all',
                    activeStart || activeEnd
                      ? 'bg-sky-400 text-slate-950 shadow-lg shadow-sky-500/20'
                      : inRange
                        ? 'bg-sky-500/15 text-sky-100'
                        : 'text-slate-300 hover:bg-slate-800',
                  ].join(' ')}
                >
                  {cell.date.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-4 rounded-2xl border border-sky-500/20 bg-sky-500/10 p-3 text-xs leading-5 text-sky-100">
            Dashboard tetap memakai logic laporan bulanan yang sudah ada. Tanggal awal range menentukan bulan dan tahun data yang ditampilkan.
          </div>
        </div>
      )}
    </div>
  );
}

// ── Multi-Series Line Chart (axis X/Y + filter + fade/zoom) ───
function MultiLineChart({ xLabels = [], series = [], height = 180 }) {
  const [tooltip, setTooltip] = useState(null);
  const [svgW,    setSvgW]    = useState(600);
  const [hidden,  setHidden]  = useState(new Set());
  const prevKey = useRef('');

  const seriesKey = series.map(s => s.label).join('|');

  // Reset hidden synchronously saat series berubah
  if (prevKey.current !== seriesKey) {
    prevKey.current = seriesKey;
    // Reset hidden langsung (tidak pakai useEffect)
    if (hidden.size > 0) {
      // Gunakan lazy initializer trick
      Promise.resolve().then(() => setHidden(new Set()));
    }
  }

  const isVisible = (i) => !hidden.has(i);
  const active = new Set(series.map((_, i) => i).filter(i => isVisible(i)));

  const toggleSeries = useCallback(i => {
    setHidden(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }, []);

  const n      = xLabels.length;
  const H      = height - 20;
  const padL   = 52, padR = 8, padT = 10, padB = 24;
  const innerW = svgW - padL - padR;
  const innerH = H - padT - padB;

  const activeVals = series
    .filter((_, i) => isVisible(i))
    .flatMap(s => s.data.map(Number))
    .filter(v => v > 0);
  const rawMax  = Math.max(...activeVals, 1);
  const ySteps  = 4;
  const niceMax = Math.ceil(rawMax / ySteps / (rawMax > 5000 ? 1000 : 1)) *
                  (rawMax > 5000 ? 1000 : 1) * ySteps || ySteps;
  const yTicks  = Array.from({ length: ySteps + 1 }, (_, i) =>
    Math.round(niceMax / ySteps * (ySteps - i))
  );

  const ref = useCallback(node => {
    if (!node) return;
    const ro = new ResizeObserver(([e]) => setSvgW(e.contentRect.width || 600));
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  // Tambah padding kiri-kanan supaya label pertama & terakhir tidak menempel sumbu
  const xPad = Math.min(innerW * 0.03, 50); // 3% atau max 50px
  const xOf  = i => padL + xPad + (n <= 1 ? (innerW - xPad*2) / 2 : (i / (n - 1)) * (innerW - xPad*2));
  const yOf = v => padT + innerH - Math.min(v / niceMax, 1) * innerH;

  const maxLabels = Math.floor(svgW / 40);
  const xSkip     = Math.max(1, Math.ceil(n / maxLabels));
  const chips     = series.map(s => ({ label: s.label, color: s.color }));

  return (
    <div>
      <FilterChips items={chips} active={active} onChange={toggleSeries} />
      <div style={{ position: 'relative' }}>
        <svg ref={ref} width="100%" height={H}
          viewBox={`0 0 ${svgW} ${H}`}
          style={{ overflow: 'visible', display: 'block' }}>

          {yTicks.map((tick, i) => (
            <g key={i}>
              <line x1={padL} y1={yOf(tick)} x2={svgW - padR} y2={yOf(tick)}
                stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
              <text x={padL - 5} y={yOf(tick) + 3.5}
                textAnchor="end" fontSize="9" fill="rgba(255,255,255,0.28)">
                {fmtY(tick)}
              </text>
            </g>
          ))}

          {xLabels.map((_, i) => i % xSkip === 0 && (
            <line key={i}
              x1={xOf(i).toFixed(1)} y1={padT}
              x2={xOf(i).toFixed(1)} y2={padT + innerH}
              stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
          ))}

          {series.map((s, si) => {
            const vis = isVisible(si);
            const pts = s.data.map((v, i) => ({
              x: xOf(i), y: yOf(Number(v)), v: Number(v)
            }));
            const linePts = pts.map(p =>
              `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
            const areaPts = `${xOf(0).toFixed(1)},${(padT+innerH).toFixed(1)} ${linePts} ${xOf(n-1).toFixed(1)},${(padT+innerH).toFixed(1)}`;

            return (
              <g key={`${si}-${s.label}`}>
                <polygon points={areaPts} fill={s.color}
                  opacity={vis ? 0.07 : 0}
                  style={{ transition: 'opacity 0.3s' }} />
                <polyline points={linePts} fill="none"
                  stroke={s.color}
                  strokeWidth={vis ? 2.5 : 1}
                  strokeLinecap="round" strokeLinejoin="round"
                  opacity={vis ? 1 : 0.12}
                  style={{ transition: 'stroke-width 0.25s, opacity 0.25s' }} />
                {vis && pts.map((p, pi) => p.v > 0 && (
                  <circle key={pi} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)}
                    r={tooltip?.i === pi ? 4 : 3}
                    fill={s.color}
                    stroke="rgba(15,23,42,0.9)" strokeWidth="1.5"
                    style={{ transition: 'r 0.15s' }} />
                ))}
              </g>
            );
          })}

          <line x1={padL} y1={padT} x2={padL} y2={padT + innerH}
            stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
          <line x1={padL} y1={padT + innerH} x2={svgW - padR} y2={padT + innerH}
            stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />

          {xLabels.map((lbl, i) => (i % xSkip === 0 || i === n - 1) && (
            <text key={i} x={xOf(i).toFixed(1)} y={H - 4}
              textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.28)">
              {lbl}
            </text>
          ))}

          {xLabels.map((_, i) => {
            const zW = n > 1 ? innerW / (n - 1) : innerW;
            return (
              <rect key={i}
                x={(xOf(i) - zW / 2).toFixed(1)} y={padT}
                width={zW.toFixed(1)} height={innerH}
                fill="transparent"
                onMouseEnter={e => {
                  const r = e.currentTarget.closest('svg').getBoundingClientRect();
                  setTooltip({ i, mx: e.clientX - r.left, my: e.clientY - r.top });
                }}
                onMouseLeave={() => setTooltip(null)}
              />
            );
          })}

          {tooltip && (
            <line x1={xOf(tooltip.i).toFixed(1)} y1={padT}
              x2={xOf(tooltip.i).toFixed(1)} y2={padT + innerH}
              stroke="rgba(255,255,255,0.12)" strokeWidth="1"
              strokeDasharray="3,3" />
          )}
        </svg>

        {tooltip && (
          <div style={{
            position:'absolute',
            left:`${Math.min(Math.max(tooltip.mx + 14, padL), svgW - 155)}px`,
            top:`${Math.max(tooltip.my - 70, 0)}px`,
            background:'rgba(10,16,32,0.97)',
            border:'1px solid rgba(255,255,255,0.1)',
            borderRadius:'10px', padding:'8px 12px',
            pointerEvents:'none', zIndex:20, minWidth:'130px',
          }}>
            <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'10px',
              marginBottom:'5px', fontWeight:600 }}>
              {xLabels[tooltip.i]}
            </p>
            {series.map((s, si) => {
              const val = Number(s.data[tooltip.i] || 0);
              if (!isVisible(si) && val === 0) return null;
              return (
                <div key={si} style={{
                  display:'flex', justifyContent:'space-between',
                  alignItems:'center', gap:'14px', marginBottom:'3px',
                  opacity: isVisible(si) ? 1 : 0.35,
                }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'5px' }}>
                    <div style={{ width:'7px', height:'7px', borderRadius:'50%',
                      background:s.color, flexShrink:0 }} />
                    <span style={{ color:'rgba(255,255,255,0.45)', fontSize:'10px' }}>
                      {s.label}
                    </span>
                  </div>
                  <span style={{ color:'#fff', fontSize:'11px', fontWeight:700 }}>
                    {s.isCount ? `${val}×` : `Rp ${val.toLocaleString('id-ID')}`}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}


// ── Chart Card ────────────────────────────────────────────────
function ChartCard({ title, stats, tabs, activeTab, onTabChange, children, tourId }) {
  return (
    <div data-tour={tourId} className="bg-slate-800/80 rounded-2xl p-4 sm:p-5 border border-slate-700/60">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-white font-bold text-sm sm:text-base">{title}</h2>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
            {stats.map((s, i) => (
              <span key={i} className="text-xs text-slate-500">
                {s.label}:
                <span className="font-semibold ml-1" style={{ color: s.color }}>
                  {s.value}
                </span>
              </span>
            ))}
          </div>
        </div>
        {tabs && (
          <div className="flex gap-1 bg-slate-700/50 rounded-xl p-1 self-start shrink-0">
            {tabs.map(tab => (
              <button key={tab.key} onClick={() => onTabChange(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === tab.key
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}>
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

function AttendanceChart({ xLabels = [], series = [], active, height = 180 }) {
  const [tooltip, setTooltip] = useState(null);
  const [svgW, setSvgW]       = useState(600);

  const ref = useCallback(node => {
    if (!node) return;
    const ro = new ResizeObserver(([e]) => setSvgW(e.contentRect.width || 600));
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  const n       = xLabels.length;
  const H       = height - 20;
  const padL    = 36, padR = 8, padT = 10, padB = 24;
  const innerW  = svgW - padL - padR;
  const innerH  = H - padT - padB;

  const activeVals = series
    .filter((_, i) => active.has(i))
    .flatMap(s => s.data.map(Number))
    .filter(v => v > 0);
  const maxV    = Math.max(...activeVals, 7); // max 7 hari/minggu
  const ySteps  = maxV <= 5 ? maxV : 7;
  const yTicks  = Array.from({ length: ySteps + 1 }, (_, i) =>
    Math.round((maxV / ySteps) * (ySteps - i))
  );

  const xPad = Math.min(innerW * 0.05, 50);
  const xOf  = i => padL + xPad + (n <= 1 ? (innerW - xPad*2) / 2 : (i / (n - 1)) * (innerW - xPad*2));
  const yOf = v => padT + innerH - Math.min(v / maxV, 1) * innerH;

  return (
    <div style={{ position: 'relative' }}>
      <svg ref={ref} width="100%" height={H}
        viewBox={`0 0 ${svgW} ${H}`}
        style={{ overflow: 'visible', display: 'block' }}>

        {/* Grid */}
        {yTicks.map((tick, i) => (
          <g key={i}>
            <line x1={padL} y1={yOf(tick)} x2={svgW - padR} y2={yOf(tick)}
              stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
            <text x={padL - 4} y={yOf(tick) + 3.5}
              textAnchor="end" fontSize="9"
              fill="rgba(255,255,255,0.28)">{tick}h</text>
          </g>
        ))}

        {/* Lines */}
        {series.map((s, si) => {
          const isActive = active.has(si);
          const pts = s.data.map((v, i) => ({
            x: xOf(i), y: yOf(Number(v)), v: Number(v)
          }));
          const linePts = pts.map(p =>
            `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
          const areaPts = `${xOf(0).toFixed(1)},${(padT+innerH).toFixed(1)} ${linePts} ${xOf(n-1).toFixed(1)},${(padT+innerH).toFixed(1)}`;

          return (
            <g key={si}>
              <polygon points={areaPts} fill={s.color}
                opacity={isActive ? 0.07 : 0}
                style={{ transition: 'opacity 0.3s' }} />
              <polyline points={linePts} fill="none"
                stroke={s.color}
                strokeWidth={isActive ? 2.5 : 1}
                strokeLinecap="round" strokeLinejoin="round"
                opacity={isActive ? 1 : 0.15}
                style={{ transition: 'stroke-width 0.25s, opacity 0.25s' }} />
              {isActive && pts.map((p, i) => p.v > 0 && (
                <circle key={i} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)}
                  r={tooltip?.i === i ? 5 : 4}
                  fill={s.color}
                  stroke="rgba(15,23,42,0.9)" strokeWidth="1.5"
                  style={{ transition: 'r 0.15s' }} />
              ))}
            </g>
          );
        })}

        {/* Axis */}
        <line x1={padL} y1={padT} x2={padL} y2={padT+innerH}
          stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
        <line x1={padL} y1={padT+innerH} x2={svgW-padR} y2={padT+innerH}
          stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />

        {/* Label X */}
        {xLabels.map((lbl, i) => (
          <text key={i} x={xOf(i).toFixed(1)} y={H - 4}
            textAnchor="middle" fontSize="9"
            fill="rgba(255,255,255,0.3)">{lbl}</text>
        ))}

        {/* Hover zones */}
        {xLabels.map((_, i) => {
          const zW = n > 1 ? innerW / (n - 1) : innerW;
          return (
            <rect key={i}
              x={(xOf(i) - zW / 2).toFixed(1)} y={padT}
              width={zW.toFixed(1)} height={innerH}
              fill="transparent"
              onMouseEnter={e => {
                const r = e.currentTarget.closest('svg').getBoundingClientRect();
                setTooltip({ i, mx: e.clientX - r.left, my: e.clientY - r.top });
              }}
              onMouseLeave={() => setTooltip(null)}
            />
          );
        })}

        {/* Crosshair */}
        {tooltip && (
          <line x1={xOf(tooltip.i).toFixed(1)} y1={padT}
            x2={xOf(tooltip.i).toFixed(1)} y2={padT+innerH}
            stroke="rgba(255,255,255,0.12)" strokeWidth="1"
            strokeDasharray="3,3" />
        )}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div style={{
          position: 'absolute',
          left: `${Math.min(Math.max(tooltip.mx + 14, padL), svgW - 200)}px`,
          top:  `${Math.max(tooltip.my - 90, 0)}px`,
          background: 'rgba(10,16,32,0.97)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '10px',
          padding: '8px 12px',
          pointerEvents: 'none',
          zIndex: 20,
          minWidth: '180px',
          maxWidth: '240px',
        }}>
          <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'10px',
            marginBottom:'5px', fontWeight:600 }}>
            {xLabels[tooltip.i]}
          </p>
          {series.map((s, si) => {
            if (!active.has(si)) return null;
            const count = s.data[tooltip.i] || 0;
            const dates = s.dates?.[tooltip.i] || '-';
            return (
              <div key={si} style={{ marginBottom:'6px' }}>
                <div style={{ display:'flex', alignItems:'center',
                  gap:'5px', marginBottom:'3px' }}>
                  <div style={{ width:'7px', height:'7px',
                    borderRadius:'50%', background:s.color, flexShrink:0 }} />
                  <span style={{ color:'rgba(255,255,255,0.5)', fontSize:'10px' }}>
                    {s.label}
                  </span>
                  <span style={{ color:'#fff', fontSize:'11px',
                    fontWeight:700, marginLeft:'auto' }}>
                    {count} hari hadir
                  </span>
                </div>
                {count > 0 && (
                  <p style={{ color:'rgba(255,255,255,0.3)', fontSize:'9px',
                    paddingLeft:'12px', lineHeight:'1.5' }}>
                    📅 {dates}
                  </p>
                )}
                {count === 0 && (
                  <p style={{ color:'rgba(255,0,0,0.4)', fontSize:'9px',
                    paddingLeft:'12px' }}>
                    Tidak hadir minggu ini
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Avatar({ name, size = 40, active = false }) {
  const initials = name
    ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';
  const colors = [
    '#f97316','#22c55e','#60a5fa','#a78bfa',
    '#f43f5e','#facc15','#34d399','#fb923c',
  ];
  const bg = colors[name.charCodeAt(0) % colors.length];

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <div style={{
        width:          size,
        height:         size,
        borderRadius:   '50%',
        background:     bg,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        fontWeight:     700,
        fontSize:       size * 0.35,
        color:          '#fff',
        border:         active ? '2.5px solid #22c55e' : '2px solid rgba(255,255,255,0.1)',
        flexShrink:     0,
      }}>
        {initials}
      </div>
      {active && (
        <div style={{
          position:     'absolute',
          bottom:       1,
          right:        1,
          width:        10,
          height:       10,
          borderRadius: '50%',
          background:   '#22c55e',
          border:       '2px solid #1e293b',
        }} />
      )}
    </div>
  );
}

// ── Dashboard utama ───────────────────────────────────────────
export default function DashboardPage() {
  // ── State ────────────────────────────────────────────────────
  const [todayStats,  setToday]       = useState({
    total_trx:0, revenue:0, hpp:0, margin:0, margin_pct:0
  });
  const [salesMonth,  setSalesMonth]  = useState([]);
  const [salesYear,   setSalesYear]   = useState([]);
  const [bestSelling, setBest]        = useState([]);
  const [lowStock,    setLowStock]    = useState([]);
  const [byProductM,  setByProductM]  = useState([]);
  const [byProductY,  setByProductY]  = useState([]);
  const [tabMonth,    setTabMonth]    = useState('omzet');
  const [tabYear,     setTabYear]     = useState('omzet');
  const [year,        setYear]        = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth]= useState(new Date().getMonth() + 1); // 1-12
  const [dateRange,   setDateRange]   = useState(() => getDashboardMonthRange(
    new Date().getFullYear(),
    new Date().getMonth() + 1
  ));
  const [availYears,  setAvailYears]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [hasLoaded,   setHasLoaded]   = useState(false);
  const [bestTab,     setBestTab]     = useState('qty');
  const [bestFilter,  setBestFilter]  = useState('month'); // 'all', 'month', 'year'
  const [activeUsers, setActiveUsers] = useState([]);
  const [attendance,  setAttendance]  = useState({ users: [], allWeeks: [] }); // ← tanpa 's' di akhir
  const [staffPerf,   setStaffPerf]   = useState([]);
  const [discountSummary, setDiscountSummary] = useState({
    today: { total_discount: 0, total_orders: 0 },
    month: { total_discount: 0, total_orders: 0 },
    year: { total_discount: 0, total_orders: 0 },
  });
  const [attendFilter,setAttendFilter]= useState(new Set());
  const [perfFilter,  setPerfFilter]  = useState(new Set());
  const [perfTab,     setPerfTab]     = useState('omzet');
  const dashboardLoadedRef = useRef(false);
  const loadSeqRef = useRef(0);

  // ── Load tahun tersedia ───────────────────────────────────────
  useEffect(() => {
    getTransactionYears()
      .then(r => {
        const years = r.data.length ? r.data : [new Date().getFullYear()];
        const selectedYear = years[0];
        setAvailYears(years);
        setYear(selectedYear);
        setDateRange(getDashboardMonthRange(selectedYear, currentMonth));
      })
      .catch(() => setAvailYears([new Date().getFullYear()]));
  }, []);

  // ── Load semua data dashboard ─────────────────────────────────
  useEffect(() => {
    const seq = loadSeqRef.current + 1;
    loadSeqRef.current = seq;
    const silent = dashboardLoadedRef.current;
    if (silent) setRefreshing(true);
    else setLoading(true);
    Promise.all([
      getTodayStats(),
      getSalesReport({ period:'daily', month: currentMonth, year }),
      getYearlyStats({ year }),
      getBestSelling({ limit:8 }),
      getLowStock({ threshold:10 }),
      getSalesByProduct({ period:'daily', month: currentMonth, year }),
      getSalesByProduct({ period:'monthly', year }),
      getActiveUsers(),
      getWeeklyAttendance({ month: currentMonth, year }),
      getStaffPerformance({ month: currentMonth, year }),
      getDiscountSummary({ month: currentMonth, year }),
    ]).then(([today, salesM, salesY, best, low, byPM, byPY, active, attend, perf, discounts]) => {
      if (loadSeqRef.current !== seq) return;
      setToday(today.data);
      setSalesMonth(salesM.data);
      setSalesYear(salesY.data);
      setBest(best.data);
      setLowStock(low.data);
      setByProductM(byPM.data);
      setByProductY(byPY.data);
      setActiveUsers(active.data);

      // attend.data = { users, allWeeks, weekRanges }
      const attendData = attend.data || { users: [], allWeeks: [] };
      setAttendance(attendData);
      setAttendFilter(new Set((attendData.users || []).map((_, i) => i)));

      setStaffPerf(perf.data);
      setPerfFilter(new Set((perf.data || []).map((_, i) => i)));
      setDiscountSummary(discounts.data || {
        today: { total_discount: 0, total_orders: 0 },
        month: { total_discount: 0, total_orders: 0 },
        year: { total_discount: 0, total_orders: 0 },
      });
      dashboardLoadedRef.current = true;
      setHasLoaded(true);
    }).catch(console.error)
      .finally(() => {
        if (loadSeqRef.current !== seq) return;
        setLoading(false);
        setRefreshing(false);
      });
  }, [year, currentMonth]);

  // ── Transform data untuk chart ────────────────────────────────

// Produk unik dari data bulanan
const uniqueProductsM = [...new Map(
  byProductM.map(r => [r.product_id, r.product_name])
).entries()].map(([id, name]) => ({ id: Number(id), name }));

// Produk unik dari data tahunan
const uniqueProductsY = [...new Map(
  byProductY.map(r => [r.product_id, r.product_name])
).entries()].map(([id, name]) => ({ id: Number(id), name }));

// ── X Labels ──────────────────────────────────────────────────
const now              = new Date();
const selectedMonthIdx = currentMonth - 1;    // 0-indexed (currentMonth is 1-12)
const displayYear      = year;                // use selected year
const totalDaysInMonth = new Date(displayYear, selectedMonthIdx + 1, 0).getDate();

// Semua tanggal di bulan terpilih sebagai label X
const daysInMonth = Array.from({ length: totalDaysInMonth }, (_, i) => {
  const d = new Date(displayYear, selectedMonthIdx, i + 1);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
});

const monthLabels = MONTHS; // 12 bulan untuk grafik tahunan

// ── Series Bulan — Omzet & Margin ────────────────────────────
// Data di-map ke SEMUA tanggal (hari tanpa transaksi = 0)
const monthOmzetSeries = [
  {
    label: 'Omzet',
    color: '#f97316',
    data: Array.from({ length: totalDaysInMonth }, (_, i) => {
      const found = salesMonth.find(d => new Date(d.date).getDate() === i + 1);
      return found ? Number(found.revenue) || 0 : 0;
    }),
  },
  {
    label: 'Margin',
    color: '#22c55e',
    data: Array.from({ length: totalDaysInMonth }, (_, i) => {
      const found = salesMonth.find(d => new Date(d.date).getDate() === i + 1);
      return found ? Number(found.margin) || 0 : 0;
    }),
  },
];

// ── Series Bulan — Per Produk ─────────────────────────────────
const monthProductSeries = uniqueProductsM.map((prod, i) => ({
  label:   prod.name,
  color:   COLORS[i % COLORS.length],
  isCount: true,
  data: Array.from({ length: totalDaysInMonth }, (_, di) => {
    const dayNum  = di + 1;
    const dateObj = salesMonth.find(d => new Date(d.date).getDate() === dayNum);
    if (!dateObj) return 0;
    const dateStr = String(dateObj.date).split('T')[0];
    const found   = byProductM.find(r =>
      String(r.period_key).split('T')[0] === dateStr &&
      Number(r.product_id) === prod.id
    );
    return found ? Number(found.total_qty) : 0;
  }),
}));

// ── Series Tahun — Omzet & Margin ────────────────────────────
// salesYear sudah 12 bulan lengkap dari backend (index = bulan - 1)
const yearOmzetSeries = [
  {
    label: 'Omzet',
    color: '#f97316',
    data:  salesYear.map(d => Number(d.revenue) || 0),
  },
  {
    label: 'Margin',
    color: '#22c55e',
    data:  salesYear.map(d => Number(d.margin)  || 0),
  },
];

// ── Series Tahun — Per Produk ─────────────────────────────────
const yearProductSeries = uniqueProductsY.map((prod, i) => ({
  label:   prod.name,
  color:   COLORS[i % COLORS.length],
  isCount: true,
  data: MONTHS.map((_, mi) => {
    const found = byProductY.find(r =>
      Number(r.period_key) === mi + 1 &&
      Number(r.product_id) === prod.id
    );
    return found ? Number(found.total_qty) : 0;
  }),
}));

// ── Totals ────────────────────────────────────────────────────
const totalMonthRevenue = salesMonth.reduce((s, r) => s + Number(r.revenue), 0);
const totalMonthMargin  = salesMonth.reduce((s, r) => s + Number(r.margin || 0), 0);
const totalMonthTrx     = salesMonth.reduce((s, r) => s + Number(r.total_trx), 0);
const totalYearRevenue  = salesYear.reduce((s, r)  => s + Number(r.revenue), 0);
const totalYearMargin   = salesYear.reduce((s, r)  => s + Number(r.margin  || 0), 0); // ← tambah
const totalYearTrx      = salesYear.reduce((s, r)  => s + Number(r.total_trx), 0);

// ── Filter Best Selling berdasarkan periode ────────────────────
const filteredBestSelling = bestSelling.filter(p => {
  if (bestFilter === 'all') return true;
  if (bestFilter === 'month') {
    // Filter produk yang ada di bulan terpilih
    return byProductM.some(r => Number(r.product_id) === p.id);
  }
  if (bestFilter === 'year') {
    // Filter produk yang ada di tahun terpilih
    return byProductY.some(r => Number(r.product_id) === p.id);
  }
  return true;
});

  const dateStr = new Date().toLocaleDateString('id-ID', {
    weekday:'long', day:'numeric', month:'long', year:'numeric'
  });

  const handleDateRangeChange = ({ start, end }) => {
    setDateRange({ start, end });
    setCurrentMonth(start.getMonth() + 1);
    setYear(start.getFullYear());
  };


  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-5 pb-8">

        {/* Header */}
        <div data-tour="dashboard-header" className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-white text-xl sm:text-2xl font-black tracking-tight">
              Dashboard
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5 capitalize">{dateStr}</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {refreshing && (
              <span className="rounded-full border border-sky-500/25 bg-sky-500/10 px-3 py-1.5 text-xs font-bold text-sky-200">
                Sinkronisasi dashboard...
              </span>
            )}
            <DashboardDateRangePicker
              value={dateRange}
              years={availYears}
              onChange={handleDateRangeChange}
            />
          </div>
        </div>

        {/* Loading */}
        {loading && !hasLoaded && <DashboardSkeleton />}

        {hasLoaded && (
          <>
            {/* Stat Cards - Today */}
            <div className="space-y-5">
              <div data-tour="dashboard-today-stats">
                <h3 className="text-slate-400 text-xs font-semibold mb-3 uppercase">Hari Ini</h3>
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                  {[
                    { label:'Omzet Hari Ini',
                      value:`Rp ${todayStats.revenue.toLocaleString('id-ID')}`,
                      sub:`HPP: Rp ${todayStats.hpp.toLocaleString('id-ID')}`,
                      color:'text-orange-400', glow:'bg-orange-500', icon:'💰' },
                    { label:'Margin Keuntungan',
                      value:`Rp ${todayStats.margin.toLocaleString('id-ID')}`,
                      sub:`${todayStats.margin_pct}% dari omzet`,
                      color: todayStats.margin>=0 ? 'text-green-400':'text-red-400',
                      glow: todayStats.margin>=0 ? 'bg-green-500':'bg-red-500', icon:'📈' },
                    { label:'Transaksi Hari Ini',
                      value: todayStats.total_trx,
                      sub: todayStats.total_trx > 0
                        ? `Avg Rp ${Math.round(todayStats.revenue/todayStats.total_trx).toLocaleString('id-ID')}`
                        : 'Belum ada',
                  color:'text-blue-400', glow:'bg-blue-500', icon:'🧾' },
                { label:'Stok Menipis',
                  value: lowStock.length,
                  sub: lowStock.length > 0 ? `${lowStock[0]?.name} kritis` : 'Semua aman',
                  color: lowStock.length > 0 ? 'text-red-400':'text-green-400',
                  glow:  lowStock.length > 0 ? 'bg-red-500':'bg-green-500', icon: lowStock.length>0?'⚠️':'✅' },
                { label:'Distribusi Diskon',
                  value:`Rp ${Number(discountSummary.today?.total_discount || 0).toLocaleString('id-ID')}`,
                  sub:`Rata-rata ${Number(discountSummary.today?.avg_discount_rate || 0)}% | ${discountSummary.today?.total_orders || 0} klaim`,
                  color:'text-emerald-400', glow:'bg-emerald-500', icon:'\u2605' },
              ].map((s,i) => (
                <div key={i} className="relative bg-slate-800/80 rounded-2xl p-4
                  border border-slate-700/60 hover:border-slate-600 transition-all overflow-hidden group">
                  <div className={`absolute top-0 right-0 w-20 h-20 rounded-full
                    blur-2xl opacity-10 group-hover:opacity-20 transition-opacity ${s.glow}`}/>
                  <div className="relative">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-slate-400 text-xs font-medium leading-tight">{s.label}</p>
                      <span className="text-xl">{s.icon}</span>
                    </div>
                    <p className={`text-xl sm:text-2xl font-black truncate ${s.color}`}>{s.value}</p>
                    <p className="text-slate-500 text-xs mt-1 truncate">{s.sub}</p>
                  </div>
                </div>
              ))}
              </div>
              </div>

              {/* Stat Cards - Monthly */}
              <div data-tour="dashboard-month-stats">
                <h3 className="text-slate-400 text-xs font-semibold mb-3 uppercase">Bulan {MONTHS[currentMonth - 1]} {year}</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {[
                    { label:`Omzet ${MONTHS[currentMonth - 1]}`,
                      value:`Rp ${totalMonthRevenue.toLocaleString('id-ID')}`,
                      sub:`${totalMonthTrx} transaksi`,
                      color:'text-orange-400', glow:'bg-orange-500', icon:'💰' },
                    { label:`Margin ${MONTHS[currentMonth - 1]}`,
                      value:`Rp ${totalMonthMargin.toLocaleString('id-ID')}`,
                      sub: totalMonthRevenue > 0 ? `${Math.round((totalMonthMargin / totalMonthRevenue) * 100)}% dari omzet` : '0% dari omzet',
                      color: totalMonthMargin>=0 ? 'text-green-400':'text-red-400',
                      glow: totalMonthMargin>=0 ? 'bg-green-500':'bg-red-500', icon:'📈' },
                    { label:`Transaksi ${MONTHS[currentMonth - 1]}`,
                      value: totalMonthTrx,
                      sub: totalMonthTrx > 0
                        ? `Avg Rp ${Math.round(totalMonthRevenue/totalMonthTrx).toLocaleString('id-ID')}`
                        : 'Belum ada',
                      color:'text-blue-400', glow:'bg-blue-500', icon:'🧾' },
                    { label:`Diskon Review ${MONTHS[currentMonth - 1]}`,
                      value:`Rp ${Number(discountSummary.month?.total_discount || 0).toLocaleString('id-ID')}`,
                      sub:`Rata-rata ${Number(discountSummary.month?.avg_discount_rate || 0)}% | ${discountSummary.month?.total_orders || 0} klaim`,
                      color:'text-emerald-400', glow:'bg-emerald-500', icon:'\u2605' },
                  ].map((s,i) => (
                    <div key={i} className="relative bg-slate-800/80 rounded-2xl p-4
                      border border-slate-700/60 hover:border-slate-600 transition-all overflow-hidden group">
                      <div className={`absolute top-0 right-0 w-20 h-20 rounded-full
                        blur-2xl opacity-10 group-hover:opacity-20 transition-opacity ${s.glow}`}/>
                      <div className="relative">
                        <div className="flex items-start justify-between mb-2">
                          <p className="text-slate-400 text-xs font-medium leading-tight">{s.label}</p>
                          <span className="text-xl">{s.icon}</span>
                        </div>
                        <p className={`text-xl sm:text-2xl font-black truncate ${s.color}`}>{s.value}</p>
                        <p className="text-slate-500 text-xs mt-1 truncate">{s.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stat Cards - Yearly */}
              <div data-tour="dashboard-year-stats">
                <h3 className="text-slate-400 text-xs font-semibold mb-3 uppercase">Tahun {year}</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {[
                    { label:`Omzet Tahun ${year}`,
                      value:`Rp ${totalYearRevenue.toLocaleString('id-ID')}`,
                      sub:`${totalYearTrx} transaksi`,
                      color:'text-orange-400', glow:'bg-orange-500', icon:'💰' },
                    { label:`Margin Tahun ${year}`,
                      value:`Rp ${totalYearMargin.toLocaleString('id-ID')}`,
                      sub: totalYearRevenue > 0 ? `${Math.round((totalYearMargin / totalYearRevenue) * 100)}% dari omzet` : '0% dari omzet',
                      color: totalYearMargin>=0 ? 'text-green-400':'text-red-400',
                      glow: totalYearMargin>=0 ? 'bg-green-500':'bg-red-500', icon:'📈' },
                    { label:`Transaksi Tahun ${year}`,
                      value: totalYearTrx,
                      sub: totalYearTrx > 0
                        ? `Avg Rp ${Math.round(totalYearRevenue/totalYearTrx).toLocaleString('id-ID')}`
                        : 'Belum ada',
                      color:'text-blue-400', glow:'bg-blue-500', icon:'🧾' },
                    { label:`Diskon Review Tahun ${year}`,
                      value:`Rp ${Number(discountSummary.year?.total_discount || 0).toLocaleString('id-ID')}`,
                      sub:`Rata-rata ${Number(discountSummary.year?.avg_discount_rate || 0)}% | ${discountSummary.year?.total_orders || 0} klaim`,
                      color:'text-emerald-400', glow:'bg-emerald-500', icon:'\u2605' },
                  ].map((s,i) => (
                    <div key={i} className="relative bg-slate-800/80 rounded-2xl p-4
                      border border-slate-700/60 hover:border-slate-600 transition-all overflow-hidden group">
                      <div className={`absolute top-0 right-0 w-20 h-20 rounded-full
                        blur-2xl opacity-10 group-hover:opacity-20 transition-opacity ${s.glow}`}/>
                      <div className="relative">
                        <div className="flex items-start justify-between mb-2">
                          <p className="text-slate-400 text-xs font-medium leading-tight">{s.label}</p>
                          <span className="text-xl">{s.icon}</span>
                        </div>
                        <p className={`text-xl sm:text-2xl font-black truncate ${s.color}`}>{s.value}</p>
                        <p className="text-slate-500 text-xs mt-1 truncate">{s.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Grafik Bulan Terpilih */}
            <ChartCard
              tourId="dashboard-month-chart"
              title={`Penjualan ${MONTHS[currentMonth - 1]} ${year}`}
              stats={[
                {
                  label: 'Omzet',
                  value: `Rp ${totalMonthRevenue.toLocaleString('id-ID')}`,
                  color: '#f97316',
                },
                {
                  label: 'Margin',
                  value: `Rp ${totalMonthMargin.toLocaleString('id-ID')}`,  // ← dari totalMonthMargin
                  color: '#22c55e',
                },
                {
                  label: 'Transaksi',
                  value: totalMonthTrx,
                  color: '#60a5fa',
                },
              ]}
              tabs={[
                { key:'omzet',  label:'Omzet & Margin' },
                { key:'produk', label:'Per Produk' },
              ]}
              activeTab={tabMonth}
              onTabChange={setTabMonth}
            >
              {tabMonth === 'omzet' ? (
                <MultiLineChart
                  xLabels={daysInMonth}
                  series={monthOmzetSeries}
                  height={200}
                />
              ) : monthProductSeries.length > 0 ? (
                <MultiLineChart
                  xLabels={daysInMonth}
                  series={monthProductSeries}
                  height={200}
                />
              ) : (
                <div className="flex items-center justify-center h-40 text-slate-600 text-sm">
                  Belum ada data per produk
                </div>
              )}
            </ChartCard>

            {/* Grafik Tahun */}
            <ChartCard
              tourId="dashboard-year-chart"
              title={`Penjualan Tahun ${year}`}
              stats={[
                {
                  label: 'Total Omzet',
                  value: `Rp ${totalYearRevenue.toLocaleString('id-ID')}`,
                  color: '#f97316',
                },
                {
                  label: 'Total Margin',                                    // ← tambah
                  value: `Rp ${totalYearMargin.toLocaleString('id-ID')}`,  // ← tambah
                  color: '#22c55e',                                         // ← tambah
                },
                {
                  label: 'Transaksi',
                  value: totalYearTrx,
                  color: '#60a5fa',
                },
              ]}
              tabs={[
                { key:'omzet',  label:'Omzet & Margin' },
                { key:'produk', label:'Per Produk' },
              ]}
              activeTab={tabYear}
              onTabChange={setTabYear}
            >
              {tabYear === 'omzet' ? (
                <MultiLineChart
                  xLabels={monthLabels}
                  series={yearOmzetSeries}
                  height={200}
                />
              ) : yearProductSeries.length > 0 ? (
                <MultiLineChart
                  xLabels={monthLabels}
                  series={yearProductSeries}
                  height={200}
                />
              ) : (
                <div className="flex items-center justify-center h-40 text-slate-600 text-sm">
                  Belum ada data per produk
                </div>
              )}
            </ChartCard>

            {/* Best Selling + Low Stock */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">

              {/* Produk Terlaris */}
              <div data-tour="dashboard-best-selling" className="bg-slate-800/80 rounded-2xl p-4 sm:p-5 border border-slate-700/60">
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-white font-bold text-sm sm:text-base">🏆 Produk Terlaris</h2>
                    {/* Tab filter qty/margin */}
                    <div className="flex gap-1 bg-slate-700/50 rounded-xl p-1 shrink-0">
                      {[
                        { key: 'qty',    label: 'Terjual' },
                        { key: 'margin', label: 'Margin'  },
                      ].map(t => (
                        <button key={t.key} onClick={() => setBestTab(t.key)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                            bestTab === t.key
                              ? 'bg-orange-500 text-white shadow-md'
                              : 'text-slate-400 hover:text-white'
                          }`}>
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Filter buttons - Semua / Bulan / Tahun */}
                  <div className="flex gap-2">
                    {[
                      { key: 'all',   label: 'Semua' },
                      { key: 'month', label: `Bulan (${MONTHS[currentMonth - 1]})` },
                      { key: 'year',  label: `Tahun ${year}` },
                    ].map(f => (
                      <button key={f.key} onClick={() => setBestFilter(f.key)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          bestFilter === f.key
                            ? 'bg-orange-500 text-white shadow-md'
                            : 'bg-slate-700/50 text-slate-400 border border-slate-600/50 hover:border-slate-500 hover:text-white'
                        }`}>
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  {filteredBestSelling.length === 0 ? (
                    <p className="text-center text-slate-600 text-sm py-8">Belum ada data</p>
                  ) : (
                    // Sort berdasarkan tab aktif
                    [...filteredBestSelling]
                      .sort((a, b) =>
                        bestTab === 'margin'
                          ? Number(b.margin || 0) - Number(a.margin || 0)
                          : Number(b.total_sold) - Number(a.total_sold)
                      )
                      .map((p, i) => (
                        <div key={p.id}>
                          <div className="flex items-start justify-between mb-1.5">
                            <div className="flex items-center gap-2 min-w-0">
                              {/* Rank badge */}
                              <span className={`w-5 h-5 rounded-lg flex items-center justify-center
                                text-xs font-black shrink-0 ${
                                i === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                                i === 1 ? 'bg-slate-400/20 text-slate-400'   :
                                i === 2 ? 'bg-orange-800/20 text-orange-600' :
                                          'bg-slate-700/50 text-slate-500'
                              }`}>{i + 1}</span>
                              <span className="text-white text-sm font-medium truncate">{p.name}</span>
                            </div>
                            <div className="text-right shrink-0 ml-2">
                              <div className="text-orange-400 text-xs font-bold">
                                Rp {Number(p.revenue).toLocaleString('id-ID')}
                              </div>
                              <div className="text-green-400 text-xs">
                                +Rp {Number(p.margin || 0).toLocaleString('id-ID')}
                                <span className="text-slate-600 ml-1">({p.margin_pct}%)</span>
                              </div>
                            </div>
                          </div>

                          {/* Progress bar + label sesuai tab */}
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-slate-700 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full transition-all ${
                                  bestTab === 'margin' ? 'bg-green-500' : 'bg-orange-500'
                                }`}
                                style={{
                                  width: bestTab === 'margin'
                                    ? `${(Number(p.margin || 0) / Math.max(...filteredBestSelling.map(x => Number(x.margin || 0)), 1)) * 100}%`
                                    : `${(Number(p.total_sold) / Math.max(...filteredBestSelling.map(x => Number(x.total_sold)), 1)) * 100}%`,
                                }}
                              />
                            </div>

                            {/* Label kanan: qty atau margin */}
                            {bestTab === 'margin' ? (
                              <span className="text-green-400 text-xs font-bold shrink-0 min-w-[60px] text-right">
                                Rp {Number(p.margin || 0).toLocaleString('id-ID')}
                              </span>
                            ) : (
                              <span className="text-slate-500 text-xs shrink-0">
                                {p.total_sold}×
                              </span>
                            )}
                          </div>

                          {/* Badge aktif sort */}
                          {i === 0 && (
                            <div className="mt-1.5">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                                bestTab === 'margin'
                                  ? 'bg-green-500/15 text-green-400'
                                  : 'bg-orange-500/15 text-orange-400'
                              }`}>
                                {bestTab === 'margin'
                                  ? `Margin tertinggi · ${p.margin_pct}%`
                                  : `Terjual terbanyak · ${p.total_sold}× pcs`
                                }
                              </span>
                            </div>
                          )}
                        </div>
                      ))
                  )}
                </div>
              </div>

              {/* Stok Menipis */}
              <div data-tour="dashboard-low-stock" className="bg-slate-800/80 rounded-2xl p-4 sm:p-5 border border-slate-700/60">
                <h2 className="text-white font-bold text-sm sm:text-base mb-4">
                  ⚠️ Bahan Baku Menipis
                </h2>
                {lowStock.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-2">
                    <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-2xl">✅</div>
                    <p className="text-slate-400 text-sm">Semua stok aman</p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                    {lowStock.map(item => (
                      <div key={item.id}
                        className={`rounded-xl p-3 border ${
                          item.stock===0
                            ? 'bg-red-500/5 border-red-500/20'
                            : 'bg-slate-700/40 border-slate-600/50'
                        }`}>
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-white text-sm font-semibold">{item.name}</p>
                            <p className="text-slate-500 text-xs mt-0.5">
                              Sisa
                              <span className={`font-bold mx-1 ${
                                item.stock===0 ? 'text-red-400':'text-yellow-400'
                              }`}>{item.stock} {item.unit}</span>
                              · min {item.min_stock}
                            </p>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-lg font-semibold shrink-0 ml-2 ${
                            item.stock===0
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-yellow-500/10 text-yellow-400'
                          }`}>
                            {item.stock===0 ? 'Habis':'Menipis'}
                          </span>
                        </div>
                        {item.affected_products?.length > 0 && (
                          <div className="space-y-1.5 pt-2 border-t border-white/5">
                            <p className="text-slate-600 text-xs">Estimasi porsi:</p>
                            {item.affected_products.map((prod,j) => (
                              <div key={j} className="flex items-center gap-2">
                                <span className="text-slate-400 text-xs truncate flex-1">{prod.name}</span>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <div className="w-14 bg-slate-700 rounded-full h-1">
                                    <div className={`h-1 rounded-full ${
                                      prod.estimasi_porsi===0 ? 'bg-red-500':
                                      prod.estimasi_porsi<=5  ? 'bg-yellow-500':'bg-green-500'
                                    }`}
                                      style={{ width:`${Math.min((prod.estimasi_porsi/20)*100,100)}%`, minWidth:prod.estimasi_porsi>0?'3px':'0' }}/>
                                  </div>
                                  <span className={`text-xs font-bold w-12 text-right ${
                                    prod.estimasi_porsi===0 ? 'text-red-400':
                                    prod.estimasi_porsi<=5  ? 'text-yellow-400':'text-green-400'
                                  }`}>{prod.estimasi_porsi} porsi</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Karyawan Aktif + Grafik Kehadiran ── */}
            {(activeUsers.length > 0 || attendance.users?.length > 0) && (
              <div data-tour="dashboard-schedule" className="bg-slate-800/80 rounded-2xl p-4 sm:p-5 border border-slate-700/60">
                <h2 className="text-white font-bold text-sm sm:text-base mb-4">
                  👥 Karyawan Aktif & Kehadiran ({MONTHS[currentMonth - 1]} {year})
                </h2>

                {/* Active users */}
                {activeUsers.length > 0 && (
                  <div data-tour="dashboard-active-users" className="mb-5">
                    <p className="text-slate-500 text-xs font-medium mb-3">
                      Sedang online hari ini — {activeUsers.length} orang
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {activeUsers.map(u => {
                        const hrs = Math.floor(u.active_minutes / 60);
                        const min = u.active_minutes % 60;
                        // Cari tanggal hadir hari ini dari attendance
                        const today = new Date().toISOString().split('T')[0];
                        return (
                          <div key={u.id} className="flex items-center gap-3
                            bg-slate-700/50 rounded-2xl px-4 py-3 border border-slate-600/50">
                            <Avatar name={u.name} size={44} active />
                            <div>
                              <p className="text-white text-sm font-semibold">{u.name}</p>
                              <p className="text-slate-400 text-xs capitalize">{u.role}</p>
                              <p className="text-green-400 text-xs mt-0.5">
                                {hrs > 0 ? `${hrs}j ` : ''}{min}m online
                              </p>
                              <p className="text-slate-500 text-xs">
                                Hadir: {new Date().toLocaleDateString('id-ID', {
                                  day: 'numeric', month: 'long'
                                })}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Grafik Kehadiran */}
                {(() => {
                  const { users = [], allWeeks = [] } = attendance;
                  if (!users.length || !allWeeks.length) return null;

                  const series = users.map((u, i) => ({
                    label: u.name,
                    color: COLORS[i % COLORS.length],
                    data:  allWeeks.map(wk => u.weeks[wk]?.count || 0),
                    // Kumpulkan tanggal hadir per minggu
                    dates: allWeeks.map(wk =>
                      u.weeks[wk]?.days.map(d => {
                        const date = new Date(d.date);
                        return date.toLocaleDateString('id-ID', {
                          weekday: 'short', day: 'numeric', month: 'short'
                        });
                      }).join(', ') || '-'
                    ),
                  }));

                  return (
                    <div data-tour="dashboard-attendance-chart">
                      <p className="text-slate-500 text-xs font-medium mb-3">
                        Rekap kehadiran bulan ini — {allWeeks.length} minggu
                      </p>
                      <FilterChips
                        items={series.map(s => ({ label: s.label, color: s.color }))}
                        active={attendFilter}
                        onChange={i => setAttendFilter(prev => {
                          const next = new Set(prev);
                          next.has(i) ? next.delete(i) : next.add(i);
                          return next;
                        })}
                      />
                      <AttendanceChart
                        xLabels={allWeeks}
                        series={series}
                        active={attendFilter}
                        height={180}
                      />
                    </div>
                  );
                })()}
              </div>
            )}

            {/* ── Performa Penjualan per Karyawan ── */}
            {staffPerf.length > 0 && (() => {
              const totalDays = new Date(displayYear, selectedMonthIdx + 1, 0).getDate();
              const allDates  = Array.from({ length: totalDays }, (_, i) => {
                const d = new Date(displayYear, selectedMonthIdx, i + 1);
                return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
              });

              const allProds = [...new Map(
                staffPerf.flatMap(u =>
                  u.data.flatMap(d => d.products || [])
                    .map(p => [p.product_id, p.product_name])
                )
              ).entries()].map(([id, name]) => ({ id: Number(id), name }));

              const mapDay = (u, key) =>
                Array.from({ length: totalDays }, (_, di) => {
                  const f = u.data.find(d => new Date(d.date).getDate() === di + 1);
                  return f ? Number(f[key] || 0) : 0;
                });

              // Omzet + Margin digabung dalam 1 series array
              const omzetMarginSeries = [
                ...staffPerf.map((u, i) => ({
                  label: `${u.name} - Omzet`,
                  color: COLORS[i * 2 % COLORS.length],
                  data:  mapDay(u, 'total_revenue'),
                })),
                ...staffPerf.map((u, i) => ({
                  label: `${u.name} - Margin`,
                  color: COLORS[(i * 2 + 1) % COLORS.length],
                  data:  mapDay(u, 'total_margin'),
                })),
              ];

              const trxSeries = staffPerf.map((u, i) => ({
                label: u.name, color: COLORS[i % COLORS.length],
                isCount: true, data: mapDay(u, 'total_trx'),
              }));

              const prodSeries = allProds.map((prod, pi) => ({
                label: prod.name,
                color: COLORS[(staffPerf.length + pi) % COLORS.length],
                isCount: true,
                data: Array.from({ length: totalDays }, (_, di) => {
                  return staffPerf.reduce((sum, u) => {
                    const day = u.data.find(d => new Date(d.date).getDate() === di + 1);
                    const p   = day?.products?.find(p => p.product_id === prod.id);
                    return sum + (p ? Number(p.total_qty) : 0);
                  }, 0);
                }),
              }));

              const totalTrx     = staffPerf.reduce((s, u) => s + u.total_trx, 0);
              const totalRevenue = staffPerf.reduce((s, u) => s + u.total_revenue, 0);
              const totalMargin  = staffPerf.reduce((s, u) => s + (u.total_margin || 0), 0);

              // Active sets per tab — semua aktif by default
              const omzetMarginActive = new Set(omzetMarginSeries.map((_, i) => i));
              const trxActive         = new Set(trxSeries.map((_, i) => i));
              const prodActive        = new Set(prodSeries.map((_, i) => i));

              return (
                <ChartCard
                  tourId="dashboard-staff-performance"
                  title={`📊 Performa Penjualan Karyawan (${MONTHS[currentMonth - 1]} ${year})`}
                  stats={[
                    { label:'Total Transaksi', value: totalTrx,                                    color:'#60a5fa' },
                    { label:'Total Omzet',     value:`Rp ${totalRevenue.toLocaleString('id-ID')}`, color:'#f97316' },
                    { label:'Total Margin',    value:`Rp ${totalMargin.toLocaleString('id-ID')}`,  color:'#22c55e' },
                  ]}
                  tabs={[
                    { key:'omzet',  label:'Omzet & Margin' },
                    { key:'trx',    label:'Transaksi'       },
                    { key:'produk', label:'Per Produk'      },
                  ]}
                  activeTab={perfTab}
                  onTabChange={setPerfTab}
                >
                  {/* Summary cards */}
                  <div className="flex flex-wrap gap-3 mb-4">
                    {[...new Map(staffPerf.map(u => [u.user_id, u])).values()]
                      .sort((a, b) => b.total_trx - a.total_trx)
                      .map(u => (
                        <div key={u.user_id}
                          className="flex items-center gap-3 bg-slate-700/50 rounded-xl
                            px-3 py-2.5 border border-slate-600/40">
                          <Avatar name={u.name} size={36} />
                          <div>
                            <p className="text-white text-xs font-semibold">{u.name}</p>
                            <p className="text-blue-400 text-xs">{u.total_trx} transaksi</p>
                            <p className="text-orange-400 text-xs">
                              Omzet: Rp {u.total_revenue.toLocaleString('id-ID')}
                            </p>
                            <p className="text-green-400 text-xs">
                              Margin: Rp {Number(u.total_margin || 0).toLocaleString('id-ID')}
                            </p>
                          </div>
                        </div>
                      ))
                    }
                  </div>

                  {/* Grafik — pakai key supaya re-mount saat tab ganti */}
                  {perfTab === 'omzet' && (
                    <MultiLineChart
                      key={`perf-omzet-${omzetMarginSeries.length}`}
                      xLabels={allDates}
                      series={omzetMarginSeries}
                      height={200}
                    />
                  )}
                  {perfTab === 'trx' && (
                    <MultiLineChart
                      key={`perf-trx-${trxSeries.length}`}
                      xLabels={allDates}
                      series={trxSeries}
                      height={200}
                    />
                  )}
                  {perfTab === 'produk' && (
                    prodSeries.length > 0
                      ? <MultiLineChart
                          key={`perf-produk-${prodSeries.length}`}
                          xLabels={allDates}
                          series={prodSeries}
                          height={200}
                        />
                      : <div className="flex items-center justify-center h-40 text-slate-600 text-sm">
                          Belum ada data per produk
                        </div>
                  )}
                </ChartCard>
              );
            })()}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
