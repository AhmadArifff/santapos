'use client';

import { useState } from 'react';

const HEATMAP_HOURS = ['11a', '12p', '1p', '2p', '3p', '4p', '5p', '6p', '7p', '8p', '9p', '10p'];

// 0 = Quiet (#172236), 1 = Steady (#364B6E), 2 = Busy (#EADCA6), 3 = Packed (#F3A68F)
const HEATMAP_ROWS = [
  { day: 'Mon', avg: 128, cells: [0, 1, 1, 0, 0, 0, 1, 2, 1, 0, 0, 0] },
  { day: 'Tue', avg: 142, cells: [0, 1, 1, 0, 0, 0, 1, 2, 2, 1, 0, 0] },
  { day: 'Wed', avg: 156, cells: [0, 1, 1, 1, 0, 0, 1, 2, 2, 1, 0, 0] },
  { day: 'Thu', avg: 184, cells: [0, 1, 1, 1, 0, 0, 2, 3, 2, 1, 1, 0] },
  { day: 'Fri', avg: 249, cells: [1, 2, 2, 1, 0, 1, 1, 3, 3, 2, 1, 0] },
  { day: 'Sat', avg: 267, cells: [1, 2, 2, 1, 1, 1, 1, 3, 3, 2, 1, 1] },
  { day: 'Sun', avg: 159, cells: [0, 1, 1, 1, 0, 0, 2, 2, 1, 0, 0, 0] },
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

export default function TavolaSalesReportsView({ currency = 'USD', onTriggerToast }) {
  const [period, setPeriod] = useState('90D');

  const multiplier = period === '7D' ? 0.12 : period === '30D' ? 0.36 : 1;
  const isIdr = currency === 'IDR';

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
    if (level === 3) return '#F3A68F'; // Packed (Peach)
    if (level === 2) return '#EADCA6'; // Busy (Butter Cream)
    if (level === 1) return '#32476B'; // Steady (Slate Blue)
    return '#172236'; // Quiet (Dark Navy)
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Top Header + 3 KPI Pills + Period Toggle (Screenshot 3 Exact Layout) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <h1
            style={{
              margin: 0,
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: '34px',
              fontWeight: 400,
              lineHeight: 1.02,
              letterSpacing: '-0.02em',
              color: '#F8FAFC',
            }}
          >
            Sales
            <br />
            Reports
          </h1>

          {/* KPI Pill 1 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: '#131C2E',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '999px',
              padding: '10px 18px 10px 12px',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: '#1B273D',
                display: 'grid',
                placeItems: 'center',
                color: '#94A3B8',
                fontSize: '14px',
              }}
            >
              💵
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px', fontWeight: 700, color: '#F8FAFC' }}>
                  {formatMoney(590821)}
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 9px',
                    borderRadius: '999px',
                    background: '#9CE2C6',
                    color: '#0B291E',
                  }}
                >
                  +14% first → last month
                </span>
              </div>
              <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '1px' }}>
                Revenue · last {period === '7D' ? '7' : period === '30D' ? '30' : '90'} days
              </div>
            </div>
          </div>

          {/* KPI Pill 2 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: '#131C2E',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '999px',
              padding: '10px 18px 10px 12px',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: '#1B273D',
                display: 'grid',
                placeItems: 'center',
                color: '#94A3B8',
                fontSize: '14px',
              }}
            >
              👥
            </div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#F8FAFC' }}>
                {Math.round(13360 * multiplier).toLocaleString('en-US')}
              </div>
              <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '1px' }}>
                Covers served · POS orders
              </div>
            </div>
          </div>

          {/* KPI Pill 3 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: '#131C2E',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '999px',
              padding: '10px 18px 10px 12px',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: '#1B273D',
                display: 'grid',
                placeItems: 'center',
                color: '#94A3B8',
                fontSize: '14px',
              }}
            >
              🧾
            </div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#F8FAFC' }}>
                {isIdr ? 'Rp 705 Rb' : '$44.10'}
              </div>
              <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '1px' }}>
                Average check per guest
              </div>
            </div>
          </div>
        </div>

        {/* Right Period Selector: 7D | 30D | 90D */}
        <div
          style={{
            display: 'inline-flex',
            background: '#121B2D',
            padding: '4px',
            borderRadius: '999px',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {['7D', '30D', '90D'].map((p) => {
            const active = period === p;
            return (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '999px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: active ? '#24324B' : 'transparent',
                  color: active ? '#F8FAFC' : '#64748B',
                }}
              >
                {p}
              </button>
            );
          })}
        </div>
      </div>

      {/* ROW 1: Revenue Dual-Line Chart (64%) + Channel Mix Donut (36%) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.75fr) minmax(320px, 1fr)',
          gap: '16px',
        }}
      >
        {/* Left: Revenue Card */}
        <div
          style={{
            background: '#121B2D',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '20px',
            padding: '20px 22px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '10px',
              }}
            >
              <span style={{ fontSize: '14.5px', fontWeight: 600, color: '#F8FAFC' }}>Revenue</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '12px', color: '#64748B' }}>
                  {period === '7D' ? '7 days · 612 orders' : period === '30D' ? '30 days · 2,540 orders' : '90 days · 7,612 orders'}
                </span>
                <button
                  onClick={handleExportCsv}
                  style={{
                    background: '#1B2840',
                    color: '#E2E8F0',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '999px',
                    padding: '5px 12px',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  ↓ Export CSV
                </button>
                <span
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    background: '#1B2840',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: '12px',
                    color: '#94A3B8',
                  }}
                >
                  ↗
                </span>
              </div>
            </div>

            {/* Big Revenue Metric */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '14px' }}>
              <span
                style={{
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontSize: '36px',
                  fontWeight: 400,
                  color: '#F8FAFC',
                }}
              >
                {formatMoney(589822)}
              </span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#9CE2C6' }}>
                +14% first → last month
              </span>
            </div>

            {/* 3 Mini Metric Boxes */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}>
              <div
                style={{
                  background: '#172238',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  minWidth: '125px',
                }}
              >
                <div style={{ fontSize: '10.5px', color: '#64748B' }}>Best day</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#F8FAFC', marginTop: '2px' }}>
                  {formatMoney(12766)}
                </div>
                <div style={{ fontSize: '10.5px', color: '#64748B', marginTop: '1px' }}>Sat, Oct 17</div>
              </div>

              <div
                style={{
                  background: '#172238',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  minWidth: '125px',
                }}
              >
                <div style={{ fontSize: '10.5px', color: '#64748B' }}>Daily average</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#F8FAFC', marginTop: '2px' }}>
                  {formatMoney(8140)}
                </div>
                <div style={{ fontSize: '10.5px', color: '#64748B', marginTop: '1px' }}>full days</div>
              </div>

              <div
                style={{
                  background: '#172238',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  minWidth: '125px',
                }}
              >
                <div style={{ fontSize: '10.5px', color: '#64748B' }}>Orders</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#F8FAFC', marginTop: '2px' }}>
                  {Math.round(5843 * multiplier).toLocaleString('en-US')}
                </div>
                <div style={{ fontSize: '10.5px', color: '#64748B', marginTop: '1px' }}>75 a day</div>
              </div>
            </div>

            {/* Chart Legend */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '11.5px', color: '#94A3B8' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F3A68F' }} />
                This period
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: '#64748B', fontWeight: 700 }}>- -</span>
                7-day average
              </span>
            </div>
          </div>

          {/* Smooth Dual-Line SVG Spline Chart */}
          <div style={{ marginTop: '10px' }}>
            <svg viewBox="0 0 680 215" style={{ width: '100%', height: '205px', overflow: 'visible' }}>
              <defs>
                <linearGradient id="tavolaCoralFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F3A68F" stopOpacity="0.26" />
                  <stop offset="100%" stopColor="#F3A68F" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid Lines */}
              <line x1="36" y1="20" x2="665" y2="20" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
              <line x1="36" y1="100" x2="665" y2="100" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
              <line x1="36" y1="180" x2="665" y2="180" stroke="rgba(255,255,255,0.06)" />

              <text x="2" y="24" fill="#64748B" fontSize="10">$20K</text>
              <text x="2" y="104" fill="#64748B" fontSize="10">$10K</text>
              <text x="12" y="184" fill="#64748B" fontSize="10">$0</text>

              {/* Shaded Area under Coral Wave */}
              <path
                d="M 40 120 Q 58 150, 75 135 T 112 72 T 150 135 T 190 78 T 232 138 T 275 72 T 320 136 T 365 70 T 410 135 T 455 72 T 502 140 T 548 70 T 594 142 T 640 72 L 660 110 L 660 180 L 40 180 Z"
                fill="url(#tavolaCoralFill)"
              />

              {/* 7-Day Average Dashed Line */}
              <path
                d="M 40 132 Q 65 110, 90 122 T 140 94 T 190 128 T 242 90 T 295 126 T 348 88 T 400 128 T 452 88 T 505 130 T 558 88 T 610 130 T 660 95"
                fill="none"
                stroke="#64748B"
                strokeWidth="1.6"
                strokeDasharray="4 4"
              />

              {/* Primary Coral Smooth Wave Line */}
              <path
                d="M 40 120 Q 58 150, 75 135 T 112 72 T 150 135 T 190 78 T 232 138 T 275 72 T 320 136 T 365 70 T 410 135 T 455 72 T 502 140 T 548 70 T 594 142 T 640 72 L 660 110"
                fill="none"
                stroke="#F3A68F"
                strokeWidth="2.3"
                strokeLinecap="round"
              />

              {/* X-Axis Labels */}
              {[
                { x: 42, label: 'Jul 22' },
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
                <text key={tick.label} x={tick.x} y="202" fill="#64748B" fontSize="10">
                  {tick.label}
                </text>
              ))}
            </svg>
          </div>
        </div>

        {/* Right: Channel / Package Mix Card */}
        <div
          style={{
            background: '#121B2D',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '20px',
            padding: '20px 22px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: '14.5px', fontWeight: 600, color: '#F8FAFC' }}>Channel mix</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: '#64748B' }}>
                {isIdr ? 'Rp 11,4 M' : '$718.6K'} in {period}
              </span>
              <span
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: '#1B2840',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '12px',
                  color: '#94A3B8',
                }}
              >
                ↗
              </span>
            </div>
          </div>

          {/* Center SVG Donut Chart with Orbital Pills */}
          <div style={{ display: 'grid', placeItems: 'center', margin: '16px 0' }}>
            <div style={{ position: 'relative', width: '176px', height: '176px' }}>
              <svg viewBox="0 0 180 180" style={{ width: '100%', height: '100%' }}>
                {/* Base Ring */}
                <circle
                  cx="90"
                  cy="90"
                  r="64"
                  fill="none"
                  stroke="#1B2842"
                  strokeWidth="18"
                />
                {/* Dine-in / Franchise Segment (72.4%) */}
                <circle
                  cx="90"
                  cy="90"
                  r="64"
                  fill="none"
                  stroke="#263757"
                  strokeWidth="18"
                  strokeDasharray="290 402"
                  transform="rotate(-90 90 90)"
                />
                {/* Orbital Indicator Pills Matching Screenshot 3 */}
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
                <span style={{ fontSize: '21px', fontWeight: 700, color: '#F8FAFC' }}>
                  {isIdr ? 'Rp 11,4M' : '$718.6K'}
                </span>
                <span style={{ fontSize: '11px', color: '#64748B' }}>revenue</span>
              </div>
            </div>
          </div>

          {/* 3 Channel Rows */}
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
                    <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#F8FAFC' }}>{ch.name}</span>
                    <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#F8FAFC' }}>{ch.amount}</span>
                  </div>
                  <div
                    style={{
                      height: '4px',
                      borderRadius: '999px',
                      background: '#1E2C46',
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
                  <div style={{ fontSize: '10.5px', color: '#64748B' }}>{ch.pct}% of sales</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ROW 2: Busiest Hours 7x12 Heatmap (50%) + Prime Cost Multi-Line Chart (50%) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '16px',
        }}
      >
        {/* Left: Busiest Hours Heatmap Card */}
        <div
          style={{
            background: '#121B2D',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '20px',
            padding: '20px 22px',
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
            <span style={{ fontSize: '14.5px', fontWeight: 600, color: '#F8FAFC' }}>Busiest hours</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: '#64748B' }}>Avg covers per hour · last 90 full days</span>
              <span
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: '#1B2840',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '12px',
                  color: '#94A3B8',
                }}
              >
                ↗
              </span>
            </div>
          </div>

          {/* 7x12 Matrix Table */}
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
                    fontSize: '10.5px',
                    color: '#64748B',
                    textAlign: 'center',
                    paddingBottom: '4px',
                  }}
                >
                  {h}
                </div>
              ))}
              <div
                style={{
                  fontSize: '10.5px',
                  color: '#64748B',
                  textAlign: 'right',
                  paddingBottom: '4px',
                }}
              >
                Avg/day
              </div>

              {/* 7 Day Rows */}
              {HEATMAP_ROWS.map((row) => (
                <div
                  key={row.day}
                  style={{
                    display: 'contents',
                  }}
                >
                  <div style={{ fontSize: '11.5px', color: '#94A3B8', fontWeight: 500 }}>{row.day}</div>
                  {row.cells.map((lvl, idx) => (
                    <div
                      key={idx}
                      title={`${row.day} ${HEATMAP_HOURS[idx]}: ${
                        lvl === 3 ? 'Packed (~63 covers)' : lvl === 2 ? 'Busy (~42 covers)' : lvl === 1 ? 'Steady (~22 covers)' : 'Quiet (<10 covers)'
                      }`}
                      style={{
                        height: '26px',
                        borderRadius: '6px',
                        background: getHeatmapColor(lvl),
                        cursor: 'pointer',
                        transition: 'transform 0.15s ease',
                      }}
                    />
                  ))}
                  <div
                    style={{
                      fontSize: '11.5px',
                      fontWeight: 700,
                      color: '#E2E8F0',
                      textAlign: 'right',
                    }}
                  >
                    {row.avg}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              marginTop: '14px',
              fontSize: '11.5px',
              color: '#94A3B8',
            }}
          >
            Peak: <strong style={{ color: '#F8FAFC' }}>Fri 8 PM–9 PM</strong>, about{' '}
            <strong style={{ color: '#F8FAFC' }}>63 covers</strong> · Quietest day:{' '}
            <strong style={{ color: '#F8FAFC' }}>Mon</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '8px', fontSize: '11px', color: '#64748B' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#172236' }} />
              Quiet
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#32476B' }} />
              Steady
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#EADCA6' }} />
              Busy
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#F3A68F' }} />
              Packed
            </span>
          </div>
        </div>

        {/* Right: Prime Cost Card */}
        <div
          style={{
            background: '#121B2D',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '20px',
            padding: '20px 22px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
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
              <span style={{ fontSize: '14.5px', fontWeight: 600, color: '#F8FAFC' }}>Prime cost & cloud margin</span>
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
                    background: '#1B2840',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: '12px',
                    color: '#94A3B8',
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
                color: '#F8FAFC',
                marginBottom: '4px',
              }}
            >
              56.9%
            </div>

            <div style={{ fontSize: '12px', color: '#94A3B8', lineHeight: 1.45 }}>
              Food <strong style={{ color: '#F8FAFC' }}>28.9%</strong> + labour{' '}
              <strong style={{ color: '#F8FAFC' }}>28.0%</strong> of revenue
              <br />8 of 89 full days over 60%
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                flexWrap: 'wrap',
                fontSize: '11px',
                color: '#94A3B8',
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
                <span style={{ width: '10px', height: '6px', borderRadius: '2px', background: 'rgba(156,226,198,0.28)' }} />
                Target 55–60%
              </span>
            </div>
          </div>

          {/* Prime Cost SVG Multi-Line Chart */}
          <div style={{ marginTop: '12px' }}>
            <svg viewBox="0 0 520 185" style={{ width: '100%', height: '175px' }}>
              {/* Target 55-60% Shaded Band */}
              <rect x="34" y="42" width="470" height="22" fill="rgba(156, 226, 198, 0.12)" />
              <line x1="34" y1="42" x2="504" y2="42" stroke="rgba(156, 226, 198, 0.35)" strokeDasharray="3 3" />
              <line x1="34" y1="64" x2="504" y2="64" stroke="rgba(156, 226, 198, 0.35)" strokeDasharray="3 3" />
              <text x="468" y="38" fill="#9CE2C6" fontSize="9.5" fontWeight="600">Target</text>

              {/* Y Axis Labels */}
              <text x="2" y="24" fill="#64748B" fontSize="9.5">70%</text>
              <text x="2" y="54" fill="#64748B" fontSize="9.5">60%</text>
              <text x="2" y="84" fill="#64748B" fontSize="9.5">50%</text>
              <text x="2" y="114" fill="#64748B" fontSize="9.5">40%</text>
              <text x="2" y="144" fill="#64748B" fontSize="9.5">30%</text>
              <text x="2" y="168" fill="#64748B" fontSize="9.5">20%</text>

              {/* Prime Cost Coral Line (~57%) */}
              <path
                d="M 38 56 Q 75 49, 110 58 T 185 52 T 260 56 T 335 48 T 410 57 T 498 53"
                fill="none"
                stroke="#F3A68F"
                strokeWidth="2.2"
              />

              {/* Food Cost Cream Line (~29%) */}
              <path
                d="M 38 134 Q 75 128, 110 136 T 185 130 T 260 135 T 335 129 T 410 136 T 498 132"
                fill="none"
                stroke="#EADCA6"
                strokeWidth="1.6"
              />

              {/* Labour Mint Line (~28%) */}
              <path
                d="M 38 140 Q 75 144, 110 138 T 185 142 T 260 139 T 335 143 T 410 138 T 498 141"
                fill="none"
                stroke="#BCE3D4"
                strokeWidth="1.5"
              />

              {/* X Axis Dates */}
              {[
                { x: 38, label: 'Jul 22' },
                { x: 108, label: 'Aug 6' },
                { x: 182, label: 'Aug 21' },
                { x: 256, label: 'Sep 5' },
                { x: 330, label: 'Sep 20' },
                { x: 404, label: 'Oct 5' },
                { x: 472, label: 'Today' },
              ].map((t) => (
                <text key={t.label} x={t.x} y="180" fill="#64748B" fontSize="9.5">
                  {t.label}
                </text>
              ))}
            </svg>
          </div>
        </div>
      </div>

      {/* ROW 3: Top Dishes/Tenants by Revenue (50%) + Slowest Dishes/Watchlist (50%) */}
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
            background: '#121B2D',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '20px',
            padding: '20px 22px',
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
            <span style={{ fontSize: '14.5px', fontWeight: 600, color: '#F8FAFC' }}>
              Top dishes & tenants by revenue
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  background: '#1B2840',
                  color: '#CBD5E1',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  padding: '4px 12px',
                  borderRadius: '999px',
                }}
              >
                Menu
              </span>
              <span
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: '#1B2840',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '12px',
                  color: '#94A3B8',
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
                onClick={() => onTriggerToast && onTriggerToast(`${item.name} · ${isIdr ? item.revenueIdr : item.revenueUsd}`)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                }}
              >
                <span style={{ width: '14px', fontSize: '12px', color: '#64748B', fontWeight: 600 }}>
                  {item.rank}
                </span>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: '#1C2A44',
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
                        color: '#F8FAFC',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.name}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#F8FAFC', flexShrink: 0 }}>
                      {isIdr ? item.revenueIdr : item.revenueUsd}
                    </span>
                  </div>
                  <div
                    style={{
                      height: '4px',
                      borderRadius: '999px',
                      background: '#1E2C46',
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
                  <div style={{ fontSize: '11px', color: '#64748B' }}>{item.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Slowest Dishes */}
        <div
          style={{
            background: '#121B2D',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '20px',
            padding: '20px 22px',
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
            <span style={{ fontSize: '14.5px', fontWeight: 600, color: '#F8FAFC' }}>
              Slowest dishes & onboarding watch
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  background: '#1B2840',
                  color: '#CBD5E1',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  padding: '4px 12px',
                  borderRadius: '999px',
                }}
              >
                Menu
              </span>
              <span
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: '#1B2840',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '12px',
                  color: '#94A3B8',
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
                onClick={() => onTriggerToast && onTriggerToast(`${item.name} flagged for menu optimization`)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                }}
              >
                <span style={{ width: '14px', fontSize: '12px', color: '#64748B', fontWeight: 600 }}>
                  {item.rank}
                </span>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: '#1C2A44',
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
                        color: '#F8FAFC',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.name}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#F8FAFC', flexShrink: 0 }}>
                      {isIdr ? item.revenueIdr : item.revenueUsd}
                    </span>
                  </div>
                  <div
                    style={{
                      height: '4px',
                      borderRadius: '999px',
                      background: '#1E2C46',
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
                  <div style={{ fontSize: '11px', color: '#64748B' }}>{item.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

