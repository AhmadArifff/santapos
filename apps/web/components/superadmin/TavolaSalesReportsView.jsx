'use client';

import { useState, useMemo } from 'react';

const HEATMAP_HOURS = ['11a', '12p', '1p', '2p', '3p', '4p', '5p', '6p', '7p', '8p', '9p', '10p'];

// Heatmap Levels: 0 = Quiet, 1 = Steady, 2 = Busy, 3 = Packed
const HEATMAP_ROWS = [
  { day: 'Mon', avg: 128, cells: [0, 1, 1, 0, 0, 0, 1, 2, 1, 0, 0, 0] },
  { day: 'Tue', avg: 142, cells: [0, 1, 1, 0, 0, 0, 1, 2, 2, 1, 0, 0] },
  { day: 'Wed', avg: 156, cells: [0, 1, 1, 1, 0, 0, 1, 2, 2, 1, 0, 0] },
  { day: 'Thu', avg: 184, cells: [0, 1, 1, 1, 0, 0, 2, 3, 2, 1, 1, 0] },
  { day: 'Fri', avg: 249, cells: [1, 2, 2, 1, 0, 1, 1, 3, 3, 2, 1, 0] },
  { day: 'Sat', avg: 267, cells: [1, 2, 2, 1, 1, 1, 1, 3, 3, 2, 1, 1] },
  { day: 'Sun', avg: 159, cells: [0, 1, 1, 1, 0, 0, 2, 2, 1, 0, 0, 0] },
];

const REVENUE_TIMELINE_90D = [
  { x: 38, y: 150, date: 'Jul 22', dayName: 'Wed', rev: 4420, orders: 48, avgRev: 7600 },
  { x: 64, y: 88,  date: 'Jul 25', dayName: 'Sat', rev: 12100, orders: 92, avgRev: 7750 },
  { x: 90, y: 154, date: 'Jul 28', dayName: 'Tue', rev: 3950, orders: 42, avgRev: 7900 },
  { x: 116, y: 84, date: 'Jul 31', dayName: 'Fri', rev: 12640, orders: 96, avgRev: 8050 },
  { x: 142, y: 148, date: 'Aug 3',  dayName: 'Mon', rev: 4680, orders: 49, avgRev: 8200 },
  { x: 168, y: 82,  date: 'Aug 7',  dayName: 'Fri', rev: 12890, orders: 98, avgRev: 8350 },
  { x: 194, y: 146, date: 'Aug 11', dayName: 'Tue', rev: 4850, orders: 51, avgRev: 8500 },
  { x: 220, y: 85,  date: 'Aug 15', dayName: 'Sat', rev: 12480, orders: 94, avgRev: 8650 },
  { x: 246, y: 142, date: 'Aug 19', dayName: 'Wed', rev: 5320, orders: 56, avgRev: 8800 },
  { x: 272, y: 80,  date: 'Aug 23', dayName: 'Sun', rev: 13120, orders: 101, avgRev: 8950 },
  { x: 298, y: 140, date: 'Aug 27', dayName: 'Thu', rev: 5540, orders: 58, avgRev: 9100 },
  { x: 324, y: 76,  date: 'Aug 31', dayName: 'Mon', rev: 13580, orders: 104, avgRev: 9250 },
  { x: 350, y: 138, date: 'Sep 4',  dayName: 'Fri', rev: 5760, orders: 60, avgRev: 9400 },
  { x: 376, y: 72,  date: 'Sep 8',  dayName: 'Tue', rev: 14080, orders: 108, avgRev: 9550 },
  { x: 402, y: 136, date: 'Sep 12', dayName: 'Sat', rev: 6020, orders: 63, avgRev: 9700 },
  { x: 428, y: 70,  date: 'Sep 16', dayName: 'Wed', rev: 14340, orders: 110, avgRev: 9850 },
  { x: 454, y: 134, date: 'Sep 20', dayName: 'Sun', rev: 6240, orders: 65, avgRev: 10000 },
  { x: 480, y: 68,  date: 'Sep 24', dayName: 'Thu', rev: 14590, orders: 112, avgRev: 10150 },
  { x: 506, y: 132, date: 'Sep 28', dayName: 'Mon', rev: 6480, orders: 67, avgRev: 10300 },
  { x: 532, y: 65,  date: 'Oct 2',  dayName: 'Fri', rev: 14950, orders: 115, avgRev: 10450 },
  { x: 558, y: 130, date: 'Oct 6',  dayName: 'Tue', rev: 6720, orders: 70, avgRev: 10600 },
  { x: 584, y: 63,  date: 'Oct 10', dayName: 'Sat', rev: 15200, orders: 118, avgRev: 10750 },
  { x: 610, y: 60,  date: 'Oct 17', dayName: 'Sat', rev: 15640, orders: 122, avgRev: 10900 },
  { x: 635, y: 124, date: 'Oct 24', dayName: 'Sat', rev: 7420, orders: 76, avgRev: 11050 },
  { x: 652, y: 92,  date: 'Today',  dayName: 'Fri', rev: 11620, orders: 88, avgRev: 11150 },
];

const TOP_DISHES = [
  {
    rank: 1,
    icon: '🍝',
    name: 'Tagliatelle al ragu · Bebek Bengil HQ',
    revenueUsd: '$24,782',
    revenueIdr: 'Rp 396,5 Jt',
    sub: '1,126 sold · Franchise Suite · 74% margin',
    pct: 94,
    barColor: '#F3A68F',
  },
  {
    rank: 2,
    icon: '🧀',
    name: 'Cacio e pepe · Ramen Ya! GI',
    revenueUsd: '$20,676',
    revenueIdr: 'Rp 330,8 Jt',
    sub: '1,148 sold · Multi-Outlet POS · 82% margin',
    pct: 79,
    barColor: '#F3A68F',
  },
  {
    rank: 3,
    icon: '🍕',
    name: 'Pizza Margherita · Sushi Tei Plaza',
    revenueUsd: '$18,910',
    revenueIdr: 'Rp 302,5 Jt',
    sub: '1,050 sold · Cloud KDS · 79% margin',
    pct: 72,
    barColor: '#F3A68F',
  },
  {
    rank: 4,
    icon: '🌶️',
    name: 'Pizza Diavola · Kopi Kenangan',
    revenueUsd: '$16,044',
    revenueIdr: 'Rp 256,7 Jt',
    sub: '802 sold · QR Table Order · 76% margin',
    pct: 61,
    barColor: '#F3A68F',
  },
  {
    rank: 5,
    icon: '🥗',
    name: 'Burrata & heirloom tomato · Holycow',
    revenueUsd: '$14,398',
    revenueIdr: 'Rp 230,3 Jt',
    sub: '799 sold · Starter Cloud · 68% margin · 86d',
    pct: 55,
    barColor: '#F3A68F',
  },
];

const SLOWEST_DISHES = [
  {
    rank: 1,
    icon: '🍨',
    name: 'Affogato · Gelato Secrets Canggu',
    revenueUsd: '$2,288',
    revenueIdr: 'Rp 36,6 Jt',
    sub: '286 sold · Dessert Add-on · 81% margin',
    pct: 22,
    barColor: '#EADCA6',
  },
  {
    rank: 2,
    icon: '🍮',
    name: 'Vanilla panna cotta · Kopi Soe',
    revenueUsd: '$3,118',
    revenueIdr: 'Rp 49,8 Jt',
    sub: '311 sold · Dessert · 78% margin',
    pct: 31,
    barColor: '#EADCA6',
  },
  {
    rank: 3,
    icon: '🥖',
    name: 'Tomato bruschetta · Bakmi GM',
    revenueUsd: '$5,641',
    revenueIdr: 'Rp 90,2 Jt',
    sub: '470 sold · Starter · 84% margin',
    pct: 48,
    barColor: '#EADCA6',
  },
  {
    rank: 4,
    icon: '🥩',
    name: 'Beef carpaccio · Sate Senayan',
    revenueUsd: '$7,326',
    revenueIdr: 'Rp 117,2 Jt',
    sub: '407 sold · Starter · 62% margin',
    pct: 63,
    barColor: '#EADCA6',
  },
  {
    rank: 5,
    icon: '🥟',
    name: 'Pumpkin ravioli · Bumbu Desa',
    revenueUsd: '$7,536',
    revenueIdr: 'Rp 120,5 Jt',
    sub: '376 sold · Pasta · 71% margin',
    pct: 66,
    barColor: '#EADCA6',
  },
];

// Helper: Calculate smooth Cardinal / Catmull-Rom cubic Bézier path (C)
function buildSmoothSpline(points, tension = 0.28) {
  if (!points || points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let path = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i > 0 ? points[i - 1] : points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i < points.length - 2 ? points[i + 2] : p2;

    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;

    path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return path;
}

export default function TavolaSalesReportsView({
  theme = 'murmura',
  currency = 'USD',
  selectedTenantFilter = 'All tenants',
  onTriggerToast,
}) {
  const isLight = theme === 'murmura';
  const [period, setPeriod] = useState('90D');
  const [hoveredRevenuePoint, setHoveredRevenuePoint] = useState(null);
  const [hoveredHeatmapCell, setHoveredHeatmapCell] = useState(null);

  const multiplier = period === '7D' ? 0.12 : period === '30D' ? 0.38 : 1;
  const isIdr = currency === 'IDR';

  // Dynamic Theme Palette
  const cardBg = isLight ? '#FFFFFF' : '#121B2D';
  const cardBorder = isLight ? 'rgba(20, 23, 29, 0.08)' : 'rgba(255, 255, 255, 0.08)';
  const textPrimary = isLight ? '#14171D' : '#F8FAFC';
  const textSecondary = isLight ? '#5A6065' : '#94A3B8';
  const textMuted = isLight ? '#8C9196' : '#64748B';
  const subtleBoxBg = isLight ? '#FAF9F5' : '#172238';
  const buttonPillBg = isLight ? 'rgba(20, 23, 29, 0.05)' : '#1B2840';
  const coralLineColor = isLight ? '#D94E34' : '#F3A68F';
  const coralAreaGrad = isLight ? '#D94E34' : '#F3A68F';

  const formatMoney = (usdVal) => {
    const scaled = Math.round(usdVal * multiplier);
    if (isIdr) {
      const idrMillions = (scaled * 0.016).toFixed(1);
      return `Rp ${idrMillions} Jt`;
    }
    return `$${scaled.toLocaleString('en-US')}`;
  };

  const handleExportCsv = () => {
    const rows = [
      ['Rank', 'Item / Tenant', 'Category', 'Revenue USD', 'Revenue IDR'],
      ...TOP_DISHES.map((d) => [d.rank, d.name, d.sub, d.revenueUsd, d.revenueIdr]),
      ...SLOWEST_DISHES.map((d) => [d.rank + 5, d.name, d.sub, d.revenueUsd, d.revenueIdr]),
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((r) => r.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `santapos-sales-report-${period.toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (onTriggerToast) {
      onTriggerToast(`Exported ${period} Sales & SaaS Revenue CSV report`);
    }
  };

  const getHeatmapColor = (level) => {
    if (isLight) {
      if (level === 3) return '#F3A68F'; // Packed (Peach Coral)
      if (level === 2) return '#FDE68A'; // Busy (Butter Cream)
      if (level === 1) return '#CBD5E1'; // Steady (Soft Slate)
      return '#F1F5F9'; // Quiet (Off-white)
    }
    if (level === 3) return '#F3A68F'; // Packed
    if (level === 2) return '#EADCA6'; // Busy
    if (level === 1) return '#32476B'; // Steady
    return '#172236'; // Quiet
  };

  // Spline Path Generation
  const revenueSpline = useMemo(() => {
    return buildSmoothSpline(REVENUE_TIMELINE_90D, 0.26);
  }, []);

  const revenueAreaPath = useMemo(() => {
    const first = REVENUE_TIMELINE_90D[0];
    const last = REVENUE_TIMELINE_90D[REVENUE_TIMELINE_90D.length - 1];
    return `${revenueSpline} L ${last.x} 185 L ${first.x} 185 Z`;
  }, [revenueSpline]);

  const avgSpline = useMemo(() => {
    const avgPts = REVENUE_TIMELINE_90D.map((pt) => {
      // Map average revenue into chart Y coordinates (185 = $0, 25 = $20K -> -8px per $1K)
      const avgY = 185 - (pt.avgRev / 1000) * 8;
      return { x: pt.x, y: avgY };
    });
    return buildSmoothSpline(avgPts, 0.28);
  }, []);

  // Handle Mouse Hover along Revenue SVG Chart
  const handleRevenueMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 680;
    let closest = REVENUE_TIMELINE_90D[0];
    let minDist = 9999;
    for (const pt of REVENUE_TIMELINE_90D) {
      const dist = Math.abs(pt.x - mouseX);
      if (dist < minDist) {
        minDist = dist;
        closest = pt;
      }
    }
    setHoveredRevenuePoint(closest);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        animation: 'murmuraFadeSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* =====================================================================
          ROW 1: HEADER + 3 KPI METRIC PILLS + PERIOD SWITCHER (7D | 30D | 90D)
         ===================================================================== */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '22px', flexWrap: 'wrap' }}>
          <h1
            style={{
              margin: 0,
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: '34px',
              fontWeight: 400,
              lineHeight: 1.02,
              letterSpacing: '-0.025em',
              color: textPrimary,
            }}
          >
            Sales
            <br />
            Reports
          </h1>

          {/* KPI Pill 1: Revenue */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: cardBg,
              border: `1px solid ${cardBorder}`,
              borderRadius: '999px',
              padding: '9px 18px 9px 12px',
              boxShadow: isLight ? '0 2px 10px rgba(0,0,0,0.03)' : '0 4px 14px rgba(0,0,0,0.2)',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: isLight ? '#EAF6F0' : '#1B273D',
                display: 'grid',
                placeItems: 'center',
                color: isLight ? '#0E7C5B' : '#94A3B8',
                flexShrink: 0,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '19px', fontWeight: 800, color: textPrimary, letterSpacing: '-0.02em' }}>
                  {formatMoney(590821)}
                </span>
                <span
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: '#9CE2C6',
                    color: '#0B291E',
                  }}
                >
                  +14% first → last month
                </span>
              </div>
              <div style={{ fontSize: '11px', color: textMuted, marginTop: '1px' }}>
                Revenue · last {period === '7D' ? '7' : period === '30D' ? '30' : '90'} days
              </div>
            </div>
          </div>

          {/* KPI Pill 2: Covers Served */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: cardBg,
              border: `1px solid ${cardBorder}`,
              borderRadius: '999px',
              padding: '9px 18px 9px 12px',
              boxShadow: isLight ? '0 2px 10px rgba(0,0,0,0.03)' : '0 4px 14px rgba(0,0,0,0.2)',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: isLight ? '#FAF9F5' : '#1B273D',
                display: 'grid',
                placeItems: 'center',
                color: textSecondary,
                flexShrink: 0,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '19px', fontWeight: 800, color: textPrimary, letterSpacing: '-0.02em' }}>
                {Math.round(13360 * multiplier).toLocaleString('en-US')}
              </div>
              <div style={{ fontSize: '11px', color: textMuted, marginTop: '1px' }}>
                Covers served · POS orders
              </div>
            </div>
          </div>

          {/* KPI Pill 3: Average Check */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: cardBg,
              border: `1px solid ${cardBorder}`,
              borderRadius: '999px',
              padding: '9px 18px 9px 12px',
              boxShadow: isLight ? '0 2px 10px rgba(0,0,0,0.03)' : '0 4px 14px rgba(0,0,0,0.2)',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: isLight ? '#FAF9F5' : '#1B273D',
                display: 'grid',
                placeItems: 'center',
                color: textSecondary,
                flexShrink: 0,
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '19px', fontWeight: 800, color: textPrimary, letterSpacing: '-0.02em' }}>
                {isIdr ? 'Rp 705 Rb' : '$44.10'}
              </div>
              <div style={{ fontSize: '11px', color: textMuted, marginTop: '1px' }}>
                Average check per guest
              </div>
            </div>
          </div>
        </div>

        {/* Right Period Segmented Switcher (7D | 30D | 90D) */}
        <div
          style={{
            display: 'inline-flex',
            background: isLight ? 'rgba(20, 23, 29, 0.05)' : '#121B2D',
            padding: '3px',
            borderRadius: '999px',
            border: `1px solid ${cardBorder}`,
          }}
        >
          {['7D', '30D', '90D'].map((p) => {
            const active = period === p;
            return (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                style={{
                  padding: '5px 14px',
                  borderRadius: '999px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: active ? (isLight ? '#FFFFFF' : '#24324B') : 'transparent',
                  color: active ? textPrimary : textSecondary,
                  boxShadow: active ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.16s ease',
                }}
              >
                {p}
              </button>
            );
          })}
        </div>
      </div>

      {/* =====================================================================
          ROW 2: REVENUE DUAL-LINE SPLINE CHART (63%) + CHANNEL MIX DONUT (37%)
         ===================================================================== */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.72fr) minmax(320px, 1fr)',
          gap: '16px',
        }}
      >
        {/* Left Card: Revenue Spline Chart */}
        <div
          style={{
            background: cardBg,
            border: `1px solid ${cardBorder}`,
            borderRadius: '22px',
            padding: '22px 24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: isLight ? '0 4px 18px rgba(0,0,0,0.03)' : '0 8px 24px rgba(0,0,0,0.22)',
            position: 'relative',
          }}
        >
          <div>
            {/* Header: Title + Orders + Export CSV */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '10px',
              }}
            >
              <span style={{ fontSize: '15px', fontWeight: 700, color: textPrimary }}>Revenue</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '12px', color: textMuted }}>
                  {period === '7D'
                    ? '7 days · 612 orders'
                    : period === '30D'
                    ? '30 days · 2,540 orders'
                    : '90 days · 7,612 orders'}
                </span>
                <button
                  onClick={handleExportCsv}
                  style={{
                    background: buttonPillBg,
                    color: textPrimary,
                    border: `1px solid ${cardBorder}`,
                    borderRadius: '999px',
                    padding: '5px 12px',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span>↓</span>
                  <span>Export CSV</span>
                </button>
                <span
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    background: buttonPillBg,
                    border: `1px solid ${cardBorder}`,
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: '12px',
                    color: textSecondary,
                  }}
                >
                  ↗
                </span>
              </div>
            </div>

            {/* Big Revenue Stat */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '14px' }}>
              <span
                style={{
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontSize: '36px',
                  fontWeight: 400,
                  letterSpacing: '-0.025em',
                  color: textPrimary,
                }}
              >
                {formatMoney(589822)}
              </span>
              <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#10B981' }}>
                +14% first → last month
              </span>
            </div>

            {/* 3 Metric Summary Boxes */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <div
                style={{
                  background: subtleBoxBg,
                  border: `1px solid ${cardBorder}`,
                  borderRadius: '12px',
                  padding: '9px 14px',
                  minWidth: '125px',
                }}
              >
                <div style={{ fontSize: '10.5px', color: textMuted, fontWeight: 500 }}>Best day</div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: textPrimary, marginTop: '2px' }}>
                  {formatMoney(12766)}
                </div>
                <div style={{ fontSize: '10px', color: textMuted, marginTop: '1px' }}>Sat, Oct 17</div>
              </div>

              <div
                style={{
                  background: subtleBoxBg,
                  border: `1px solid ${cardBorder}`,
                  borderRadius: '12px',
                  padding: '9px 14px',
                  minWidth: '125px',
                }}
              >
                <div style={{ fontSize: '10.5px', color: textMuted, fontWeight: 500 }}>Daily average</div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: textPrimary, marginTop: '2px' }}>
                  {formatMoney(8140)}
                </div>
                <div style={{ fontSize: '10px', color: textMuted, marginTop: '1px' }}>full days</div>
              </div>

              <div
                style={{
                  background: subtleBoxBg,
                  border: `1px solid ${cardBorder}`,
                  borderRadius: '12px',
                  padding: '9px 14px',
                  minWidth: '125px',
                }}
              >
                <div style={{ fontSize: '10.5px', color: textMuted, fontWeight: 500 }}>Orders</div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: textPrimary, marginTop: '2px' }}>
                  {Math.round(5843 * multiplier).toLocaleString('en-US')}
                </div>
                <div style={{ fontSize: '10px', color: textMuted, marginTop: '1px' }}>75 a day</div>
              </div>
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px', fontSize: '11.5px', color: textSecondary }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: coralLineColor }} />
                This period
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: textMuted, fontWeight: 700 }}>- -</span>
                7-day average
              </span>
            </div>
          </div>

          {/* Smooth Dual-Line SVG Spline Chart with Zero Overshoot & Interactive Tooltip */}
          <div
            style={{ position: 'relative', marginTop: '12px', cursor: 'crosshair' }}
            onMouseMove={handleRevenueMouseMove}
            onMouseLeave={() => setHoveredRevenuePoint(null)}
          >
            <svg viewBox="0 0 680 215" style={{ width: '100%', height: '205px', overflow: 'hidden' }}>
              <defs>
                <linearGradient id="revenueSplineAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={coralAreaGrad} stopOpacity={isLight ? 0.22 : 0.28} />
                  <stop offset="100%" stopColor={coralAreaGrad} stopOpacity={0.0} />
                </linearGradient>
              </defs>

              {/* Horizontal Reference Gridlines */}
              <line x1="36" y1="25" x2="665" y2="25" stroke={isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'} strokeDasharray="3 3" />
              <line x1="36" y1="105" x2="665" y2="105" stroke={isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'} strokeDasharray="3 3" />
              <line x1="36" y1="185" x2="665" y2="185" stroke={isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'} />

              {/* Y-Axis Value Labels */}
              <text x="2" y="29" fill={textMuted} fontSize="10">$20K</text>
              <text x="2" y="109" fill={textMuted} fontSize="10">$10K</text>
              <text x="12" y="189" fill={textMuted} fontSize="10">$0</text>

              {/* Shaded Area under Curve */}
              <path d={revenueAreaPath} fill="url(#revenueSplineAreaGrad)" />

              {/* 7-Day Average Dashed Line */}
              <path
                d={avgSpline}
                fill="none"
                stroke={isLight ? '#94A3B8' : '#64748B'}
                strokeWidth="1.6"
                strokeDasharray="4 4"
              />

              {/* Primary Coral/Terracotta Smooth Spline Wave */}
              <path
                d={revenueSpline}
                fill="none"
                stroke={coralLineColor}
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Hover Cursor Vertical Guide & Glow Dot */}
              {hoveredRevenuePoint && (
                <>
                  <line
                    x1={hoveredRevenuePoint.x}
                    y1="25"
                    x2={hoveredRevenuePoint.x}
                    y2="185"
                    stroke={coralLineColor}
                    strokeWidth="1.2"
                    strokeDasharray="2 2"
                    opacity="0.75"
                  />
                  <circle
                    cx={hoveredRevenuePoint.x}
                    cy={hoveredRevenuePoint.y}
                    r="5"
                    fill={coralLineColor}
                    stroke={cardBg}
                    strokeWidth="2"
                  />
                </>
              )}

              {/* X-Axis Date Labels */}
              {[
                { x: 38, label: 'Jul 22' },
                { x: 105, label: 'Jul 31' },
                { x: 168, label: 'Aug 9' },
                { x: 232, label: 'Aug 18' },
                { x: 296, label: 'Aug 27' },
                { x: 360, label: 'Sep 5' },
                { x: 424, label: 'Sep 14' },
                { x: 488, label: 'Sep 23' },
                { x: 552, label: 'Oct 2' },
                { x: 635, label: 'Today' },
              ].map((tick) => (
                <text key={tick.label} x={tick.x} y="204" fill={textMuted} fontSize="9.5">
                  {tick.label}
                </text>
              ))}
            </svg>

            {/* Interactive Floating Tooltip */}
            {hoveredRevenuePoint && (
              <div
                style={{
                  position: 'absolute',
                  top: `${Math.max(10, hoveredRevenuePoint.y - 70)}px`,
                  left: `${Math.min(520, Math.max(40, hoveredRevenuePoint.x - 65))}px`,
                  background: isLight ? '#14171D' : '#0B111E',
                  color: '#FFFFFF',
                  borderRadius: '10px',
                  padding: '7px 11px',
                  fontSize: '11px',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
                  pointerEvents: 'none',
                  zIndex: 20,
                  whiteSpace: 'nowrap',
                }}
              >
                <div style={{ fontWeight: 800, color: '#F3A68F' }}>
                  {formatMoney(hoveredRevenuePoint.rev)}
                </div>
                <div style={{ color: '#94A3B8', fontSize: '10px', marginTop: '1px' }}>
                  {hoveredRevenuePoint.dayName}, {hoveredRevenuePoint.date} · {hoveredRevenuePoint.orders} orders
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Card: Channel Mix Donut Chart */}
        <div
          style={{
            background: cardBg,
            border: `1px solid ${cardBorder}`,
            borderRadius: '22px',
            padding: '22px 24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: isLight ? '0 4px 18px rgba(0,0,0,0.03)' : '0 8px 24px rgba(0,0,0,0.22)',
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '6px',
              }}
            >
              <span style={{ fontSize: '15px', fontWeight: 700, color: textPrimary }}>Channel mix</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: textMuted }}>
                  {isIdr ? 'Rp 11,4 M' : '$718.6K'} in {period}
                </span>
                <span
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    background: buttonPillBg,
                    border: `1px solid ${cardBorder}`,
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: '12px',
                    color: textSecondary,
                  }}
                >
                  ↗
                </span>
              </div>
            </div>

            {/* Center Donut Chart with Orbital Satellite Indicators */}
            <div style={{ display: 'grid', placeItems: 'center', margin: '14px 0' }}>
              <div style={{ position: 'relative', width: '172px', height: '172px' }}>
                <svg viewBox="0 0 180 180" style={{ width: '100%', height: '100%' }}>
                  {/* Background Track Ring */}
                  <circle
                    cx="90"
                    cy="90"
                    r="64"
                    fill="none"
                    stroke={isLight ? '#F1F5F9' : '#1B2842'}
                    strokeWidth="18"
                  />
                  {/* Dine-in / Franchise Arc (72.4%) */}
                  <circle
                    cx="90"
                    cy="90"
                    r="64"
                    fill="none"
                    stroke={isLight ? '#0E7C5B' : '#263757'}
                    strokeWidth="18"
                    strokeDasharray="290 402"
                    transform="rotate(-90 90 90)"
                  />
                  {/* Orbital Satellite Indicators from Screenshot */}
                  <rect
                    x="96"
                    y="14"
                    width="24"
                    height="14"
                    rx="7"
                    fill="#F3A68F"
                    transform="rotate(14 108 21)"
                  />
                  <circle cx="44" cy="40" r="8" fill="#BCE3D4" />
                  <circle cx="26" cy="96" r="8" fill="#EADCA6" />
                </svg>

                {/* Center Value */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span style={{ fontSize: '21px', fontWeight: 800, color: textPrimary, letterSpacing: '-0.02em' }}>
                    {isIdr ? 'Rp 11,4M' : '$718.6K'}
                  </span>
                  <span style={{ fontSize: '11px', color: textMuted, fontWeight: 500 }}>revenue</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3 Channel Progress Rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              {
                icon: '🍴',
                bg: '#F3A68F',
                name: 'Dine-in · Franchise Plan',
                amount: formatMoney(428065),
                pct: 72.4,
              },
              {
                icon: '🛍️',
                bg: '#EADCA6',
                name: 'Takeaway · Pro Plan',
                amount: formatMoney(88482),
                pct: 15.0,
              },
              {
                icon: '🛵',
                bg: '#BCE3D4',
                name: 'Delivery · Starter Plan',
                amount: formatMoney(74539),
                pct: 12.6,
              },
            ].map((ch) => (
              <div key={ch.name} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: ch.bg,
                    color: '#18181B',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: '15px',
                    flexShrink: 0,
                  }}
                >
                  {ch.icon}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ fontSize: '12.5px', fontWeight: 700, color: textPrimary }}>{ch.name}</span>
                    <span style={{ fontSize: '12.5px', fontWeight: 700, color: textPrimary }}>{ch.amount}</span>
                  </div>
                  <div
                    style={{
                      height: '4px',
                      borderRadius: '999px',
                      background: isLight ? '#F1F5F9' : '#1E2C46',
                      overflow: 'hidden',
                      marginBottom: '4px',
                    }}
                  >
                    <div
                      style={{
                        width: `${ch.pct}%`,
                        height: '100%',
                        background: ch.bg,
                        borderRadius: '999px',
                      }}
                    />
                  </div>
                  <div style={{ fontSize: '10.5px', color: textMuted }}>{ch.pct}% of sales</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* =====================================================================
          ROW 3: BUSIEST HOURS HEATMAP (50%) + PRIME COST MARGIN CHART (50%)
         ===================================================================== */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '16px',
        }}
      >
        {/* Left: Busiest Hours Heatmap */}
        <div
          style={{
            background: cardBg,
            border: `1px solid ${cardBorder}`,
            borderRadius: '22px',
            padding: '22px 24px',
            boxShadow: isLight ? '0 4px 18px rgba(0,0,0,0.03)' : '0 8px 24px rgba(0,0,0,0.22)',
            position: 'relative',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '14px',
            }}
          >
            <span style={{ fontSize: '15px', fontWeight: 700, color: textPrimary }}>Busiest hours</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: textMuted }}>Avg covers per hour · last 90 full days</span>
              <span
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: buttonPillBg,
                  border: `1px solid ${cardBorder}`,
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '12px',
                  color: textSecondary,
                }}
              >
                ↗
              </span>
            </div>
          </div>

          {/* 7x12 Matrix Grid */}
          <div style={{ overflowX: 'auto' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '42px repeat(12, 1fr) 54px',
                gap: '5px',
                alignItems: 'center',
                minWidth: '460px',
              }}
            >
              {/* Header Row */}
              <div />
              {HEATMAP_HOURS.map((h) => (
                <div
                  key={h}
                  style={{
                    fontSize: '10px',
                    color: textMuted,
                    textAlign: 'center',
                    paddingBottom: '4px',
                  }}
                >
                  {h}
                </div>
              ))}
              <div
                style={{
                  fontSize: '10px',
                  color: textMuted,
                  textAlign: 'right',
                  paddingBottom: '4px',
                }}
              >
                Avg/day
              </div>

              {/* 7 Day Rows */}
              {HEATMAP_ROWS.map((row) => (
                <div key={row.day} style={{ display: 'contents' }}>
                  <div style={{ fontSize: '11.5px', color: textSecondary, fontWeight: 600 }}>{row.day}</div>
                  {row.cells.map((lvl, idx) => (
                    <div
                      key={idx}
                      onMouseEnter={() =>
                        setHoveredHeatmapCell({
                          day: row.day,
                          hour: HEATMAP_HOURS[idx],
                          level: lvl,
                          covers: lvl === 3 ? 63 : lvl === 2 ? 42 : lvl === 1 ? 22 : 8,
                        })
                      }
                      onMouseLeave={() => setHoveredHeatmapCell(null)}
                      style={{
                        height: '26px',
                        borderRadius: '6px',
                        background: getHeatmapColor(lvl),
                        cursor: 'pointer',
                        transition: 'transform 0.12s ease',
                      }}
                    />
                  ))}
                  <div
                    style={{
                      fontSize: '11.5px',
                      fontWeight: 800,
                      color: textPrimary,
                      textAlign: 'right',
                    }}
                  >
                    {row.avg}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hover Status or Default Peak Summary */}
          <div style={{ marginTop: '14px', fontSize: '11.5px', color: textSecondary }}>
            {hoveredHeatmapCell ? (
              <span>
                Selected:{' '}
                <strong style={{ color: textPrimary }}>
                  {hoveredHeatmapCell.day} at {hoveredHeatmapCell.hour}
                </strong>{' '}
                — ~<strong>{hoveredHeatmapCell.covers} covers</strong> (
                {hoveredHeatmapCell.level === 3
                  ? 'Packed'
                  : hoveredHeatmapCell.level === 2
                  ? 'Busy'
                  : hoveredHeatmapCell.level === 1
                  ? 'Steady'
                  : 'Quiet'}
                )
              </span>
            ) : (
              <span>
                Peak: <strong style={{ color: textPrimary }}>Fri 8 PM–9 PM</strong>, about{' '}
                <strong style={{ color: textPrimary }}>63 covers</strong> · Quietest day:{' '}
                <strong style={{ color: textPrimary }}>Mon</strong>
              </span>
            )}
          </div>

          {/* Heatmap Legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '8px', fontSize: '11px', color: textMuted }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: getHeatmapColor(0) }} />
              Quiet
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: getHeatmapColor(1) }} />
              Steady
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: getHeatmapColor(2) }} />
              Busy
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: getHeatmapColor(3) }} />
              Packed
            </span>
          </div>
        </div>

        {/* Right: Prime Cost & Cloud Margin Card */}
        <div
          style={{
            background: cardBg,
            border: `1px solid ${cardBorder}`,
            borderRadius: '22px',
            padding: '22px 24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: isLight ? '0 4px 18px rgba(0,0,0,0.03)' : '0 8px 24px rgba(0,0,0,0.22)',
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px',
              }}
            >
              <span style={{ fontSize: '15px', fontWeight: 700, color: textPrimary }}>Prime cost & cloud margin</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: '999px',
                    background: '#9CE2C6',
                    color: '#0B291E',
                  }}
                >
                  On target
                </span>
                <span
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    background: buttonPillBg,
                    border: `1px solid ${cardBorder}`,
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: '12px',
                    color: textSecondary,
                  }}
                >
                  ↗
                </span>
              </div>
            </div>

            <div
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: '34px',
                fontWeight: 400,
                color: textPrimary,
                marginBottom: '4px',
              }}
            >
              56.9%
            </div>

            <div style={{ fontSize: '12px', color: textSecondary, lineHeight: 1.45 }}>
              Food <strong style={{ color: textPrimary }}>28.9%</strong> + labour{' '}
              <strong style={{ color: textPrimary }}>28.0%</strong> of revenue
              <br />8 of 89 full days over 60%
            </div>

            {/* Legend */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                flexWrap: 'wrap',
                fontSize: '11px',
                color: textMuted,
                marginTop: '10px',
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#F3A68F' }} />
                Prime cost
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#EADCA6' }} />
                Food cost
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#BCE3D4' }} />
                Labour
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '10px', height: '6px', borderRadius: '2px', background: 'rgba(156,226,198,0.35)' }} />
                Target 55–60%
              </span>
            </div>
          </div>

          {/* Prime Cost Spline Chart */}
          <div style={{ marginTop: '12px' }}>
            <svg viewBox="0 0 520 185" style={{ width: '100%', height: '175px' }}>
              {/* Target 55-60% Shaded Band */}
              <rect x="34" y="42" width="470" height="22" fill="rgba(156, 226, 198, 0.14)" />
              <line x1="34" y1="42" x2="504" y2="42" stroke="rgba(156, 226, 198, 0.35)" strokeDasharray="3 3" />
              <line x1="34" y1="64" x2="504" y2="64" stroke="rgba(156, 226, 198, 0.35)" strokeDasharray="3 3" />
              <text x="468" y="38" fill="#10B981" fontSize="9.5" fontWeight="700">Target</text>

              {/* Y-Axis Value Labels */}
              <text x="2" y="24" fill={textMuted} fontSize="9.5">70%</text>
              <text x="2" y="54" fill={textMuted} fontSize="9.5">60%</text>
              <text x="2" y="84" fill={textMuted} fontSize="9.5">50%</text>
              <text x="2" y="114" fill={textMuted} fontSize="9.5">40%</text>
              <text x="2" y="144" fill={textMuted} fontSize="9.5">30%</text>
              <text x="2" y="168" fill={textMuted} fontSize="9.5">20%</text>

              {/* Prime Cost Spline (~57%) */}
              <path
                d="M 38 56 Q 75 49, 110 58 T 185 52 T 260 56 T 335 48 T 410 57 T 498 53"
                fill="none"
                stroke="#F3A68F"
                strokeWidth="2.2"
              />

              {/* Food Cost Spline (~29%) */}
              <path
                d="M 38 134 Q 75 128, 110 136 T 185 130 T 260 135 T 335 129 T 410 136 T 498 132"
                fill="none"
                stroke="#EADCA6"
                strokeWidth="1.6"
              />

              {/* Labour Spline (~28%) */}
              <path
                d="M 38 140 Q 75 144, 110 138 T 185 142 T 260 139 T 335 143 T 410 138 T 498 141"
                fill="none"
                stroke="#BCE3D4"
                strokeWidth="1.5"
              />

              {/* X-Axis Dates */}
              {[
                { x: 38, label: 'Jul 22' },
                { x: 108, label: 'Aug 6' },
                { x: 182, label: 'Aug 21' },
                { x: 256, label: 'Sep 5' },
                { x: 330, label: 'Sep 20' },
                { x: 404, label: 'Oct 5' },
                { x: 472, label: 'Today' },
              ].map((t) => (
                <text key={t.label} x={t.x} y="180" fill={textMuted} fontSize="9.5">
                  {t.label}
                </text>
              ))}
            </svg>
          </div>
        </div>
      </div>

      {/* =====================================================================
          ROW 4: TOP DISHES BY REVENUE (50%) + SLOWEST DISHES / WATCHLIST (50%)
         ===================================================================== */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '16px',
        }}
      >
        {/* Left: Top Dishes by Revenue */}
        <div
          style={{
            background: cardBg,
            border: `1px solid ${cardBorder}`,
            borderRadius: '22px',
            padding: '22px 24px',
            boxShadow: isLight ? '0 4px 18px rgba(0,0,0,0.03)' : '0 8px 24px rgba(0,0,0,0.22)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '14px',
            }}
          >
            <span style={{ fontSize: '15px', fontWeight: 700, color: textPrimary }}>
              Top dishes & tenants by revenue
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  background: buttonPillBg,
                  color: textSecondary,
                  fontSize: '11.5px',
                  fontWeight: 600,
                  padding: '4px 12px',
                  borderRadius: '999px',
                  border: `1px solid ${cardBorder}`,
                }}
              >
                Menu
              </span>
              <span
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: buttonPillBg,
                  border: `1px solid ${cardBorder}`,
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '12px',
                  color: textSecondary,
                }}
              >
                ↗
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {TOP_DISHES.map((item) => (
              <div
                key={item.rank}
                onClick={() =>
                  onTriggerToast &&
                  onTriggerToast(`${item.name} · ${isIdr ? item.revenueIdr : item.revenueUsd}`)
                }
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                }}
              >
                <span style={{ width: '14px', fontSize: '12px', color: textMuted, fontWeight: 700 }}>
                  {item.rank}
                </span>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: subtleBoxBg,
                    border: `1px solid ${cardBorder}`,
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: '18px',
                    flexShrink: 0,
                  }}
                >
                  {item.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: 700,
                        color: textPrimary,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.name}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: textPrimary, flexShrink: 0 }}>
                      {isIdr ? item.revenueIdr : item.revenueUsd}
                    </span>
                  </div>
                  <div
                    style={{
                      height: '4px',
                      borderRadius: '999px',
                      background: isLight ? '#F1F5F9' : '#1E2C46',
                      overflow: 'hidden',
                      marginBottom: '4px',
                    }}
                  >
                    <div
                      style={{
                        width: `${item.pct}%`,
                        height: '100%',
                        background: item.barColor,
                        borderRadius: '999px',
                      }}
                    />
                  </div>
                  <div style={{ fontSize: '11px', color: textMuted }}>{item.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Slowest Dishes / Watchlist */}
        <div
          style={{
            background: cardBg,
            border: `1px solid ${cardBorder}`,
            borderRadius: '22px',
            padding: '22px 24px',
            boxShadow: isLight ? '0 4px 18px rgba(0,0,0,0.03)' : '0 8px 24px rgba(0,0,0,0.22)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '14px',
            }}
          >
            <span style={{ fontSize: '15px', fontWeight: 700, color: textPrimary }}>
              Slowest dishes & onboarding watch
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  background: buttonPillBg,
                  color: textSecondary,
                  fontSize: '11.5px',
                  fontWeight: 600,
                  padding: '4px 12px',
                  borderRadius: '999px',
                  border: `1px solid ${cardBorder}`,
                }}
              >
                Menu
              </span>
              <span
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: buttonPillBg,
                  border: `1px solid ${cardBorder}`,
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '12px',
                  color: textSecondary,
                }}
              >
                ↗
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {SLOWEST_DISHES.map((item) => (
              <div
                key={item.rank}
                onClick={() =>
                  onTriggerToast && onTriggerToast(`${item.name} flagged for menu optimization`)
                }
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                }}
              >
                <span style={{ width: '14px', fontSize: '12px', color: textMuted, fontWeight: 700 }}>
                  {item.rank}
                </span>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: subtleBoxBg,
                    border: `1px solid ${cardBorder}`,
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: '18px',
                    flexShrink: 0,
                  }}
                >
                  {item.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: 700,
                        color: textPrimary,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.name}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: textPrimary, flexShrink: 0 }}>
                      {isIdr ? item.revenueIdr : item.revenueUsd}
                    </span>
                  </div>
                  <div
                    style={{
                      height: '4px',
                      borderRadius: '999px',
                      background: isLight ? '#F1F5F9' : '#1E2C46',
                      overflow: 'hidden',
                      marginBottom: '4px',
                    }}
                  >
                    <div
                      style={{
                        width: `${item.pct}%`,
                        height: '100%',
                        background: item.barColor,
                        borderRadius: '999px',
                      }}
                    />
                  </div>
                  <div style={{ fontSize: '11px', color: textMuted }}>{item.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
