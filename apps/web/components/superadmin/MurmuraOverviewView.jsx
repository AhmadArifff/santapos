'use client';

import { useState, useEffect } from 'react';

function useCountUp(target, duration = 520, triggerKey = 0) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let startTime = null;
    let rafId = null;
    const startVal = Math.max(0, Number(target) * 0.35);
    const endVal = Number(target) || 0;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(startVal + (endVal - startVal) * eased);
      if (progress < 1) {
        rafId = requestAnimationFrame(step);
      }
    };

    rafId = requestAnimationFrame(step);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [target, duration, triggerKey]);

  return value;
}

const INITIAL_COMING_UP = [
  {
    id: 'cu-1',
    title: 'Latte-art Friday. Tag us in...',
    subtitle: 'Ember & Oak · Kemang POS & Barista KDS',
    schedule: 'Tomorrow · 9:30 AM',
    status: 'Scheduled',
    channels: ['IG', 'FB'],
    thumbGradient: 'linear-gradient(135deg, #3B2314 0%, #7C4D2B 50%, #D4A373 100%)',
    thumbEmoji: '☕',
    badgeCode: 'EO',
    badgeColor: '#D94E34',
    description: 'Barista station KDS tablet calibration + Friday morning promo rules sync across 3 outlets.',
  },
  {
    id: 'cu-2',
    title: 'Rose petals, sun-dried on t...',
    subtitle: 'Wildroot Botanics · Tea Lounge POS',
    schedule: 'Tomorrow · 12:00 PM',
    status: 'Scheduled',
    channels: ['IG', 'TK', 'WEB'],
    thumbGradient: 'linear-gradient(135deg, #4A1525 0%, #9E3B5A 55%, #F2B5C8 100%)',
    thumbEmoji: '🌹',
    badgeCode: 'WB',
    badgeColor: '#0E7C5B',
    description: 'Seasonal botanical menu deployment & QR table self-ordering theme update.',
  },
  {
    id: 'cu-3',
    title: 'Autumn collection drops T...',
    subtitle: 'Ramen Ya! GI · 14-Outlet Menu Sync',
    schedule: 'Tomorrow · 6:00 PM',
    status: 'Scheduled',
    channels: ['IG', 'FB', 'WEB'],
    thumbGradient: 'linear-gradient(135deg, #7F2B16 0%, #C85A32 55%, #F4C078 100%)',
    thumbEmoji: '🍜',
    badgeCode: 'RY',
    badgeColor: '#C84B31',
    description: 'Centralized menu price matrix & Midtrans QRIS dynamic split-bill rollout for Grand Indonesia.',
  },
  {
    id: 'cu-4',
    title: 'Engine bay detail, steam, ...',
    subtitle: 'Vantage Garage Bistro · Drive-Thru POS',
    schedule: 'Tomorrow · 7:00 PM',
    status: 'Scheduled',
    channels: ['FB', 'TK'],
    thumbGradient: 'linear-gradient(135deg, #1E293B 0%, #475569 55%, #94A3B8 100%)',
    thumbEmoji: '⚙️',
    badgeCode: 'VG',
    badgeColor: '#1E293B',
    description: 'Drive-thru speed-of-service timer integration & kitchen pass audio alert setup.',
  },
  {
    id: 'cu-5',
    title: 'A three-step night routine...',
    subtitle: 'Botanica Dining · Evening Shift Cutover',
    schedule: 'Sat, Oct 31 · 8:00 PM',
    status: 'Scheduled',
    channels: ['IG', 'WEB'],
    thumbGradient: 'linear-gradient(135deg, #14362B 0%, #246A52 55%, #88C9B3 100%)',
    thumbEmoji: '🌿',
    badgeCode: 'BD',
    badgeColor: '#0E7C5B',
    description: 'Automated night-audit closing report & multi-warehouse stock reconciliation.',
  },
  {
    id: 'cu-6',
    title: 'New in: the Rio side table...',
    subtitle: 'Hollow Home Cafe · Interactive Floor Plan',
    schedule: 'Sun, Nov 1 · 10:00 AM',
    status: 'Scheduled',
    channels: ['IG', 'PIN'],
    thumbGradient: 'linear-gradient(135deg, #422818 0%, #8A5A36 55%, #E6CCB2 100%)',
    thumbEmoji: '🪑',
    badgeCode: 'HH',
    badgeColor: '#B45309',
    description: 'New 24-table dining room + terrace capacity map activated on Cashier & Kitchen views.',
  },
];

const INITIAL_NEEDS_YOU = [
  {
    id: 'ny-1',
    type: 'approval',
    title: 'Pumpkin spice? Never heard of her. Our autumn menu...',
    meta: 'Rio wants approval · Ember & Oak · Tomorrow 9:00 AM',
    tenantBrand: 'Ember & Oak',
    planDetail: 'Enterprise Multi-Branch POS + 14 Kitchen Displays + Custom ERP Sync',
    thumbGradient: 'linear-gradient(135deg, #2A1810 0%, #8C4A27 60%, #E6A15C 100%)',
    thumbEmoji: '☕',
    status: 'pending',
  },
  {
    id: 'ny-2',
    type: 'approval',
    title: 'A three-step night routine for tired skin: cleanse...',
    meta: 'Nia wants approval · Wildroot Botanics · Tomorrow 8:00 PM',
    tenantBrand: 'Wildroot Botanics',
    planDetail: 'Pro Cloud POS + Automated Inventory Deduction & Recipe Costing',
    thumbGradient: 'linear-gradient(135deg, #1A2F26 0%, #3A6B56 60%, #A3D9C2 100%)',
    thumbEmoji: '🌿',
    status: 'pending',
  },
  {
    id: 'ny-3',
    type: 'approval',
    title: 'New in: the Rio side table in smoked oak. Same join...',
    meta: 'Freya wants approval · Hollow Home · Sun, Nov 1 · 10:00 AM',
    tenantBrand: 'Hollow Home Bistro',
    planDetail: 'Interactive Floor Plan Capacity Guard + QR Table Self-Order',
    thumbGradient: 'linear-gradient(135deg, #432818 0%, #99582A 60%, #FFE6A7 100%)',
    thumbEmoji: '🪵',
    status: 'pending',
  },
  {
    id: 'ny-4',
    type: 'alert',
    title: 'A Vantage Garage post / webhook failed',
    meta: 'Midtrans QRIS webhook disconnected — reconnect Vantage Garage to retry',
    tenantBrand: 'Vantage Garage Bistro',
    planDetail: 'Endpoint: POST /api/payments/midtrans-notification · HTTP 504 Timeout',
    status: 'failed',
  },
  {
    id: 'ny-5',
    type: 'approval',
    title: 'Weekend Izakaya Bundle & Split-Bill Ruleset...',
    meta: 'Kenji wants approval · Sushi Tei Senayan · Mon, Nov 2 · 11:00 AM',
    tenantBrand: 'Sushi Tei Senayan',
    planDetail: 'Franchise Tier Upgrade · 32 Tables + 4 Kitchen Stations',
    thumbGradient: 'linear-gradient(135deg, #1E293B 0%, #C84B31 100%)',
    thumbEmoji: '🍣',
    status: 'pending',
  },
  {
    id: 'ny-6',
    type: 'approval',
    title: 'Supabase Storage Bucket Policy & Menu Asset CDN...',
    meta: 'Budi wants approval · Bebek Bengil Ubud · Tue, Nov 3 · 9:00 AM',
    tenantBrand: 'Bebek Bengil Ubud',
    planDetail: 'Dedicated Storage Bucket + Offline-First Cashier Cache',
    thumbGradient: 'linear-gradient(135deg, #0F7B5C 0%, #F2B249 100%)',
    thumbEmoji: '🦆',
    status: 'pending',
  },
];

export default function MurmuraOverviewView({
  theme = 'murmura',
  currency = 'USD',
  selectedTenantFilter = 'All tenants',
  deals = [],
  tenants = [],
  onOpenNewDeal,
  onNavigateTab,
  onTriggerToast,
}) {
  const isLight = theme === 'murmura';

  // Live countdown timer state (starts at 19h 34m 42s matching Screenshot 1)
  const [secondsLeft, setSecondsLeft] = useState(19 * 3600 + 34 * 60 + 42);
  const [heroItem, setHeroItem] = useState({
    badgeCode: 'RO',
    badgeColor: '#D94E34',
    brand: 'Ember & Oak',
    status: 'Awaiting approval',
    schedule: 'Tomorrow · 9:00 AM',
    description:
      'Pumpkin spice? Never heard of her. Our autumn menu is maple, cardamom and a very good cortado. Full POS + 14 Kitchen Displays rollout starts Monday.',
    channels: ['IG', 'FB'],
  });

  const [comingUpItems, setComingUpItems] = useState(INITIAL_COMING_UP);
  const [needsYouItems, setNeedsYouItems] = useState(INITIAL_NEEDS_YOU);
  const [showAllNeedsYou, setShowAllNeedsYou] = useState(false);
  const [retryingId, setRetryingId] = useState(null);
  const [reviewModalItem, setReviewModalItem] = useState(null);

  // Count-up metrics
  const animAudience = useCountUp(976.3, 620, selectedTenantFilter);
  const animEngagement = useCountUp(10.3, 620, selectedTenantFilter);
  const animPostsWeek = useCountUp(19 + deals.length, 620, deals.length);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 19 * 3600 + 34 * 60));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = Math.floor(secondsLeft / 3600);
  const mins = Math.floor((secondsLeft % 3600) / 60);
  const secs = secondsLeft % 60;

  // Filter items if a specific tenant is chosen
  const filteredComingUp = comingUpItems.filter((item) => {
    if (!selectedTenantFilter || selectedTenantFilter === 'All tenants') return true;
    return (
      item.subtitle.toLowerCase().includes(selectedTenantFilter.toLowerCase()) ||
      item.title.toLowerCase().includes(selectedTenantFilter.toLowerCase())
    );
  });

  const pendingNeedsYou = needsYouItems.filter((item) => item.status !== 'resolved');
  const visibleNeedsYou = showAllNeedsYou ? pendingNeedsYou : pendingNeedsYou.slice(0, 4);
  const hiddenCount = Math.max(0, pendingNeedsYou.length - 4);

  const handleApproveItem = (item) => {
    setNeedsYouItems((prev) =>
      prev.map((x) => (x.id === item.id ? { ...x, status: 'resolved' } : x))
    );
    if (item.id === 'ny-1') {
      setHeroItem((prev) => ({ ...prev, status: 'Approved · Ready' }));
    }
    if (onTriggerToast) {
      onTriggerToast(`Approved "${item.tenantBrand}" deployment & synced to production queue`, () => {
        setNeedsYouItems((prev) =>
          prev.map((x) => (x.id === item.id ? { ...x, status: 'pending' } : x))
        );
        if (item.id === 'ny-1') {
          setHeroItem((prev) => ({ ...prev, status: 'Awaiting approval' }));
        }
      });
    }
  };

  const handleRetryWebhook = (item) => {
    setRetryingId(item.id);
    setTimeout(() => {
      setRetryingId(null);
      setNeedsYouItems((prev) =>
        prev.map((x) => (x.id === item.id ? { ...x, status: 'resolved' } : x))
      );
      if (onTriggerToast) {
        onTriggerToast(`Reconnected ${item.tenantBrand} Midtrans webhook & re-dispatched queue`, () => {
          setNeedsYouItems((prev) =>
            prev.map((x) => (x.id === item.id ? { ...x, status: 'failed' } : x))
          );
        });
      }
    }, 650);
  };

  const handlePromoteComingUpToHero = (item) => {
    setHeroItem({
      badgeCode: item.badgeCode || 'RO',
      badgeColor: item.badgeColor || '#D94E34',
      brand: item.subtitle.split('·')[0].trim(),
      status: item.status === 'Scheduled' ? 'Scheduled · Next' : 'Awaiting approval',
      schedule: item.schedule,
      description: `${item.title} — ${item.description}`,
      channels: item.channels,
    });
    if (onTriggerToast) {
      onTriggerToast(`Pinned "${item.title}" to Up Next live deployment queue`);
    }
  };

  const surfaceBg = isLight ? '#FFFFFF' : '#131C2E';
  const surfaceBorder = isLight ? 'rgba(20, 23, 29, 0.07)' : 'rgba(255, 255, 255, 0.08)';
  const textPrimary = isLight ? '#14171D' : '#F8FAFC';
  const textSecondary = isLight ? '#5A6065' : '#94A3B8';
  const textMuted = isLight ? '#8C9196' : '#64748B';
  const subtleCardBg = isLight ? '#FAF9F5' : '#182338';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '22px',
        animation: 'murmuraFadeSlideIn 0.38s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* =====================================================================
          ROW 1: EDITORIAL GREETING + 3 INLINE KPI METRICS + "+ NEW POST/DEAL"
         ===================================================================== */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px',
          paddingTop: '4px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '34px',
            flexWrap: 'wrap',
          }}
        >
          {/* Editorial Serif Greeting with Clip-Mask Entrance */}
          <div style={{ overflow: 'hidden', paddingBottom: '2px' }}>
            <h1
              style={{
                margin: 0,
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: 'clamp(30px, 2.7vw, 38px)',
                fontWeight: 400,
                lineHeight: 1.04,
                letterSpacing: '-0.025em',
                color: textPrimary,
                animation: 'murmuraTitleRise 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              Afternoon,
              <br />
              Camila
            </h1>
          </div>

          {/* Inline KPI 1: 976.3K +12.1% in 30 days */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: isLight ? 'rgba(20, 23, 29, 0.04)' : 'rgba(255,255,255,0.06)',
                border: `1px solid ${surfaceBorder}`,
                display: 'grid',
                placeItems: 'center',
                color: textSecondary,
                fontSize: '15px',
              }}
            >
              👥
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '21px',
                    fontWeight: 700,
                    color: textPrimary,
                    fontVariantNumeric: 'tabular-nums',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {currency === 'IDR' ? `Rp ${animAudience.toFixed(1)}M` : `${animAudience.toFixed(1)}K`}
                </span>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: '#0E7C5B',
                    color: '#FFFFFF',
                    fontSize: '10.5px',
                    fontWeight: 700,
                    letterSpacing: '-0.01em',
                  }}
                >
                  +12.1% in 30 days
                </span>
              </div>
              <div style={{ fontSize: '11.5px', color: textSecondary, marginTop: '2px', lineHeight: 1.25 }}>
                Audience & GMV across your
                <br />
                tenant channels
              </div>
            </div>
          </div>

          {/* Inline KPI 2: 10.3% Engagement / Conversion rate */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: isLight ? 'rgba(20, 23, 29, 0.04)' : 'rgba(255,255,255,0.06)',
                border: `1px solid ${surfaceBorder}`,
                display: 'grid',
                placeItems: 'center',
                color: textSecondary,
                fontSize: '15px',
              }}
            >
              ♡
            </div>
            <div>
              <div
                style={{
                  fontSize: '21px',
                  fontWeight: 700,
                  color: textPrimary,
                  fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '-0.02em',
                }}
              >
                {animEngagement.toFixed(1)}%
              </div>
              <div style={{ fontSize: '11.5px', color: textSecondary, marginTop: '2px', lineHeight: 1.25 }}>
                Engagement & trial conversion
                <br />
                rate, last 30 days
              </div>
            </div>
          </div>

          {/* Inline KPI 3: 19 Posts / Deployments going out this week */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: isLight ? 'rgba(20, 23, 29, 0.04)' : 'rgba(255,255,255,0.06)',
                border: `1px solid ${surfaceBorder}`,
                display: 'grid',
                placeItems: 'center',
                color: textSecondary,
                fontSize: '15px',
              }}
            >
              🗓️
            </div>
            <div>
              <div
                style={{
                  fontSize: '21px',
                  fontWeight: 700,
                  color: textPrimary,
                  fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '-0.02em',
                }}
              >
                {Math.round(animPostsWeek)}
              </div>
              <div style={{ fontSize: '11.5px', color: textSecondary, marginTop: '2px', lineHeight: 1.25 }}>
                Tenant rollouts & posts going
                <br />
                out this week
              </div>
            </div>
          </div>
        </div>

        {/* Right Primary Dark Pill CTA: "✎ New post / deal" */}
        <button
          onClick={onOpenNewDeal}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '999px',
            border: 'none',
            background: isLight ? '#161920' : '#F2B249',
            color: isLight ? '#FFFFFF' : '#14171D',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: isLight
              ? '0 8px 20px rgba(22, 25, 32, 0.16)'
              : '0 8px 20px rgba(242, 178, 73, 0.25)',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          }}
        >
          <span>✎</span>
          <span>New deal</span>
        </button>
      </div>

      {/* =====================================================================
          ROW 2: 2-COLUMN ASYMMETRIC EXECUTIVE GRID ("Up next" + "Needs you")
         ===================================================================== */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '20px',
          alignItems: 'start',
        }}
      >
        {/* LEFT COLUMN (Wider 1.45fr via style override on desktop): UP NEXT + COMING UP */}
        <div
          style={{
            gridColumn: 'span 1',
            background: surfaceBg,
            border: `1px solid ${surfaceBorder}`,
            borderRadius: '22px',
            padding: '22px',
            boxShadow: isLight
              ? '0 10px 32px -4px rgba(20, 23, 29, 0.05)'
              : '0 14px 36px rgba(0, 0, 0, 0.35)',
          }}
        >
          {/* Card Header: "Up next" + "● Live queue ↗" */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '14px',
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: '16px',
                fontWeight: 700,
                color: textPrimary,
                letterSpacing: '-0.01em',
              }}
            >
              Up next
            </h2>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: textSecondary,
                }}
              >
                <span
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    background: '#0E7C5B',
                    boxShadow: '0 0 0 3px rgba(14, 124, 91, 0.18)',
                  }}
                />
                Live queue
              </span>

              <button
                onClick={() => onNavigateTab && onNavigateTab('calendar')}
                title="Open Publishing & Rollout Calendar"
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  border: `1px solid ${surfaceBorder}`,
                  background: subtleCardBg,
                  color: textPrimary,
                  cursor: 'pointer',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '12px',
                }}
              >
                ↗
              </button>
            </div>
          </div>

          {/* HERO DARK CHARCOAL DEPLOYMENT CARD (Exact Match to Screenshot 1) */}
          <div
            style={{
              background: '#181C23',
              borderRadius: '18px',
              padding: '16px',
              color: '#F8FAFC',
              display: 'grid',
              gridTemplateColumns: 'minmax(175px, 215px) 1fr',
              gap: '20px',
              alignItems: 'stretch',
              boxShadow: '0 14px 30px rgba(15, 23, 42, 0.22)',
            }}
          >
            {/* Left Espresso Extraction Photographic Visual Card */}
            <div
              style={{
                borderRadius: '12px',
                overflow: 'hidden',
                position: 'relative',
                minHeight: '210px',
                background:
                  'radial-gradient(circle at 50% 68%, #D9822B 0%, #6E3212 42%, #1E110A 78%, #0B0705 100%)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '12px',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {/* Simulated metallic portafilter & double espresso stream SVG */}
              <svg
                viewBox="0 0 200 200"
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  pointerEvents: 'none',
                }}
              >
                <defs>
                  <linearGradient id="chromeGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#262626" />
                    <stop offset="45%" stopColor="#A3A3A3" />
                    <stop offset="70%" stopColor="#404040" />
                    <stop offset="100%" stopColor="#171717" />
                  </linearGradient>
                  <linearGradient id="cremaStream" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F59E0B" />
                    <stop offset="50%" stopColor="#D97706" />
                    <stop offset="100%" stopColor="#FEF3C7" />
                  </linearGradient>
                  <linearGradient id="espressoCup" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FDE68A" stopOpacity="0.92" />
                    <stop offset="30%" stopColor="#B45309" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#291206" stopOpacity="0.98" />
                  </linearGradient>
                </defs>
                {/* Portafilter head */}
                <rect x="42" y="8" width="116" height="32" rx="6" fill="url(#chromeGrad)" />
                <rect x="58" y="40" width="84" height="16" rx="4" fill="#525252" />
                <path d="M75 56 Q80 68 84 68 L116 68 Q120 68 125 56 Z" fill="url(#chromeGrad)" />
                {/* Twin golden espresso streams */}
                <path d="M87 68 Q89 102 90 132" stroke="url(#cremaStream)" strokeWidth="4.5" strokeLinecap="round" />
                <path d="M113 68 Q111 102 110 132" stroke="url(#cremaStream)" strokeWidth="4.5" strokeLinecap="round" />
                {/* Glass Cortado Cup */}
                <path
                  d="M52 122 L148 122 L138 190 Q100 198 62 190 Z"
                  fill="url(#espressoCup)"
                  stroke="rgba(255,255,255,0.38)"
                  strokeWidth="2.5"
                />
                {/* Crema foam top */}
                <ellipse cx="100" cy="126" rx="46" ry="7" fill="#FDE68A" opacity="0.88" />
              </svg>

              <div
                style={{
                  position: 'relative',
                  zIndex: 2,
                  alignSelf: 'flex-start',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: 'rgba(0,0,0,0.55)',
                  backdropFilter: 'blur(6px)',
                  fontSize: '10px',
                  fontWeight: 700,
                  color: '#FDE68A',
                }}
              >
                LIVE PREVIEW · POS + MENU
              </div>

              <div
                style={{
                  position: 'relative',
                  zIndex: 2,
                  fontSize: '10.5px',
                  color: 'rgba(255,255,255,0.85)',
                  background: 'rgba(0,0,0,0.5)',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  backdropFilter: 'blur(4px)',
                }}
              >
                Cortado & Autumn Menu Sync
              </div>
            </div>

            {/* Right Metadata & Countdown */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '4px 4px 4px 0',
              }}
            >
              <div>
                {/* Top row: Brand Badge ("RO Ember & Oak") + "Awaiting approval" amber pill */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        background: heroItem.badgeColor,
                        color: '#FFFFFF',
                        fontSize: '10.5px',
                        fontWeight: 800,
                        display: 'grid',
                        placeItems: 'center',
                      }}
                    >
                      {heroItem.badgeCode}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#F1F5F9' }}>
                      {heroItem.brand}
                    </span>
                  </div>

                  <span
                    style={{
                      padding: '4px 11px',
                      borderRadius: '999px',
                      background:
                        heroItem.status.includes('Approved') || heroItem.status.includes('Scheduled')
                          ? '#0E7C5B'
                          : '#F2B249',
                      color:
                        heroItem.status.includes('Approved') || heroItem.status.includes('Scheduled')
                          ? '#FFFFFF'
                          : '#181C23',
                      fontSize: '11px',
                      fontWeight: 700,
                    }}
                  >
                    {heroItem.status}
                  </span>
                </div>

                {/* "goes out in" + Countdown */}
                <div style={{ marginTop: '14px' }}>
                  <div style={{ fontSize: '11.5px', color: '#94A3B8', marginBottom: '2px' }}>
                    goes out in
                  </div>
                  <div
                    style={{
                      fontSize: '34px',
                      fontWeight: 700,
                      letterSpacing: '-0.03em',
                      color: '#FFFFFF',
                      fontVariantNumeric: 'tabular-nums',
                      lineHeight: 1.1,
                    }}
                  >
                    {hours} h {String(mins).padStart(2, '0')} min{' '}
                    <span style={{ fontSize: '15px', color: '#94A3B8', fontWeight: 500 }}>
                      {String(secs).padStart(2, '0')}s
                    </span>
                  </div>
                </div>

                {/* Tomorrow · 9:00 AM */}
                <div
                  style={{
                    marginTop: '8px',
                    fontSize: '12px',
                    color: '#94A3B8',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>🕒</span>
                  <span>{heroItem.schedule}</span>
                </div>

                {/* Description */}
                <p
                  style={{
                    margin: '10px 0 0 0',
                    fontSize: '12.5px',
                    lineHeight: 1.5,
                    color: '#CBD5E1',
                  }}
                >
                  {heroItem.description}
                </p>
              </div>

              {/* Bottom Channel Pills + Action Arrow Button */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: '#FCE7F3',
                      color: '#BE185D',
                      fontSize: '10px',
                      fontWeight: 800,
                      display: 'grid',
                      placeItems: 'center',
                      border: '2px solid #181C23',
                    }}
                  >
                    ◎
                  </span>
                  <span
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: '#DBEAFE',
                      color: '#1D4ED8',
                      fontSize: '10px',
                      fontWeight: 800,
                      display: 'grid',
                      placeItems: 'center',
                      marginLeft: '-6px',
                      border: '2px solid #181C23',
                    }}
                  >
                    f
                  </span>
                  <span
                    style={{
                      marginLeft: '8px',
                      fontSize: '11px',
                      color: '#94A3B8',
                    }}
                  >
                    POS · KDS · QR Table
                  </span>
                </div>

                <button
                  onClick={() => {
                    setHeroItem((prev) => ({ ...prev, status: 'Approved · Ready' }));
                    if (onTriggerToast) {
                      onTriggerToast(`Fast-tracked ${heroItem.brand} rollout in live queue!`);
                    }
                  }}
                  title="Approve & Fast-Track Deployment"
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    border: '1px solid rgba(255,255,255,0.16)',
                    background: 'rgba(255,255,255,0.06)',
                    color: '#FFFFFF',
                    cursor: 'pointer',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: '14px',
                  }}
                >
                  →
                </button>
              </div>
            </div>
          </div>

          {/* COMING UP SECTION (2x3 Grid matching Screenshot 1) */}
          <div style={{ marginTop: '20px' }}>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: textMuted,
                textTransform: 'uppercase',
                marginBottom: '12px',
              }}
            >
              COMING UP
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(245px, 1fr))',
                gap: '12px',
              }}
            >
              {filteredComingUp.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handlePromoteComingUpToHero(item)}
                  title="Click to inspect in Up Next hero viewer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 12px',
                    borderRadius: '14px',
                    background: subtleCardBg,
                    border: `1px solid ${surfaceBorder}`,
                    cursor: 'pointer',
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                  }}
                >
                  {/* Thumbnail */}
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '10px',
                      background: item.thumbGradient,
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: '20px',
                      flexShrink: 0,
                      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.15)',
                    }}
                  >
                    {item.thumbEmoji}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '6px',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '12.5px',
                          fontWeight: 600,
                          color: textPrimary,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {item.title}
                      </div>

                      <div style={{ display: 'flex', gap: '3px', flexShrink: 0 }}>
                        {item.channels.map((ch, idx) => (
                          <span
                            key={idx}
                            style={{
                              fontSize: '9px',
                              fontWeight: 700,
                              padding: '1px 4px',
                              borderRadius: '4px',
                              background: idx === 0 ? '#FCE7F3' : '#DBEAFE',
                              color: idx === 0 ? '#BE185D' : '#1D4ED8',
                            }}
                          >
                            {ch}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: '6px',
                        gap: '6px',
                      }}
                    >
                      <span style={{ fontSize: '11px', color: textMuted }}>{item.schedule}</span>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '2px 7px',
                          borderRadius: '999px',
                          background: isLight ? '#E8F0FE' : 'rgba(59,130,246,0.18)',
                          color: '#1D4ED8',
                          fontSize: '10px',
                          fontWeight: 700,
                        }}
                      >
                        <span
                          style={{
                            width: '5px',
                            height: '5px',
                            borderRadius: '50%',
                            background: '#2563EB',
                          }}
                        />
                        {item.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: "Needs you (4)" ACTION & APPROVAL CENTER */}
        <div
          style={{
            background: surfaceBg,
            border: `1px solid ${surfaceBorder}`,
            borderRadius: '22px',
            padding: '22px',
            boxShadow: isLight
              ? '0 10px 32px -4px rgba(20, 23, 29, 0.05)'
              : '0 14px 36px rgba(0, 0, 0, 0.35)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {/* Header: "Needs you" + Red Badge "4" */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '4px',
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: '16px',
                fontWeight: 700,
                color: textPrimary,
                letterSpacing: '-0.01em',
              }}
            >
              Needs you
            </h2>
            <span
              style={{
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                background: '#C84B31',
                color: '#FFFFFF',
                fontSize: '11px',
                fontWeight: 800,
                display: 'grid',
                placeItems: 'center',
              }}
            >
              {pendingNeedsYou.length}
            </span>
          </div>

          {/* Stack of Approval & Error Retry Cards */}
          {visibleNeedsYou.map((item) => {
            if (item.type === 'alert') {
              return (
                <div
                  key={item.id}
                  style={{
                    padding: '14px',
                    borderRadius: '16px',
                    background: isLight ? '#FDF2F0' : 'rgba(200, 75, 49, 0.14)',
                    border: `1px solid ${isLight ? '#F5D0C8' : 'rgba(200, 75, 49, 0.35)'}`,
                    display: 'flex',
                     gap: '12px',
                    alignItems: 'flex-start',
                  }}
                >
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      background: '#C84B31',
                      color: '#FFFFFF',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: '16px',
                      fontWeight: 800,
                      flexShrink: 0,
                    }}
                  >
                    ▲
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: 700,
                        color: isLight ? '#7F1D1D' : '#FCA5A5',
                      }}
                    >
                      {item.title}
                    </div>
                    <div
                      style={{
                        fontSize: '11.5px',
                        color: isLight ? '#991B1B' : '#FECACA',
                        marginTop: '3px',
                        lineHeight: 1.35,
                      }}
                    >
                      {item.meta}
                    </div>

                    <div style={{ marginTop: '10px' }}>
                      <button
                        onClick={() => handleRetryWebhook(item)}
                        disabled={retryingId === item.id}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '999px',
                          border: 'none',
                          background: '#181C23',
                          color: '#FFFFFF',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <span>↻</span>
                        <span>{retryingId === item.id ? 'Reconnecting...' : 'Retry'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={item.id}
                style={{
                  padding: '14px',
                  borderRadius: '16px',
                  background: subtleCardBg,
                  border: `1px solid ${surfaceBorder}`,
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'flex-start',
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: item.thumbGradient,
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: '18px',
                    flexShrink: 0,
                  }}
                >
                  {item.thumbEmoji}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: textPrimary,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {item.title}
                  </div>
                  <div
                    style={{
                      fontSize: '11.5px',
                      color: textSecondary,
                      marginTop: '2px',
                    }}
                  >
                    {item.meta}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                    <button
                      onClick={() => handleApproveItem(item)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '999px',
                        border: 'none',
                        background: '#0E7C5B',
                        color: '#FFFFFF',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                      }}
                    >
                      <span>✓</span>
                      <span>Approve</span>
                    </button>

                    <button
                      onClick={() => setReviewModalItem(item)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '999px',
                        border: `1px solid ${surfaceBorder}`,
                        background: isLight ? '#FFFFFF' : '#1E293B',
                        color: textPrimary,
                        fontSize: '11.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Review
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Show 2 more button (Exact Match to Screenshot 1) */}
          {(hiddenCount > 0 || showAllNeedsYou) && (
            <button
              onClick={() => setShowAllNeedsYou((prev) => !prev)}
              style={{
                alignSelf: 'center',
                marginTop: '4px',
                padding: '6px 14px',
                borderRadius: '999px',
                border: `1px solid ${surfaceBorder}`,
                background: subtleCardBg,
                color: textSecondary,
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>{showAllNeedsYou ? '⌃' : '⌄'}</span>
              <span>
                {showAllNeedsYou ? 'Show less' : `Show ${hiddenCount} more`}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* REVIEW MODAL WHEN CLICKING "Review" ON ANY NEEDS YOU CARD */}
      {reviewModalItem && (
        <div
          onClick={() => setReviewModalItem(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 90,
            background: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(6px)',
            display: 'grid',
            placeItems: 'center',
            padding: '20px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '480px',
              background: surfaceBg,
              color: textPrimary,
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${surfaceBorder}`,
              boxShadow: '0 24px 48px rgba(0,0,0,0.3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: reviewModalItem.thumbGradient || '#0E7C5B',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '20px',
                }}
              >
                {reviewModalItem.thumbEmoji || '🛡️'}
              </div>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 700 }}>{reviewModalItem.tenantBrand}</div>
                <div style={{ fontSize: '12px', color: textSecondary }}>{reviewModalItem.meta}</div>
              </div>
            </div>

            <div
              style={{
                padding: '14px',
                borderRadius: '12px',
                background: subtleCardBg,
                border: `1px solid ${surfaceBorder}`,
                fontSize: '13px',
                lineHeight: 1.5,
                marginBottom: '16px',
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: '4px' }}>{reviewModalItem.title}</div>
              <div style={{ color: textSecondary }}>{reviewModalItem.planDetail}</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setReviewModalItem(null)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '999px',
                  border: `1px solid ${surfaceBorder}`,
                  background: 'transparent',
                  color: textSecondary,
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleApproveItem(reviewModalItem);
                  setReviewModalItem(null);
                }}
                style={{
                  padding: '8px 18px',
                  borderRadius: '999px',
                  border: 'none',
                  background: '#0E7C5B',
                  color: '#FFFFFF',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                ✓ Approve & Deploy Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

