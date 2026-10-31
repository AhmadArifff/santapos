'use client';

import { useState, useEffect } from 'react';

const WEEK_DAYS = [
  { key: 'mon-26', dow: 'MON', date: 26, postsLabel: '3 posts' },
  { key: 'tue-27', dow: 'TUE', date: 27, postsLabel: 'Free' },
  { key: 'wed-28', dow: 'WED', date: 28, postsLabel: '4 posts' },
  { key: 'thu-29', dow: 'THU', date: 29, postsLabel: 'Free' },
  { key: 'fri-30', dow: 'FRI', date: 30, postsLabel: '● 1 post', isToday: true },
  { key: 'sat-31', dow: 'SAT', date: 31, postsLabel: '6 posts' },
  { key: 'sun-1', dow: 'SUN', date: 1, postsLabel: '5 posts' },
];

const CAMPAIGN_BARS = [
  {
    id: 'bar-spring',
    icon: '🌿',
    title: 'Spring Ritual launch · Enterprise POS Wave',
    untilLabel: 'until Nov 8',
    bg: '#0E7C5B',
    textColor: '#FFFFFF',
    spanCols: 7, // spans Mon 26 -> Sun 1
    periodText: 'Oct 12 – Nov 8',
  },
  {
    id: 'bar-autumn',
    icon: '🍁',
    title: 'Autumn harvest · Menu & QRIS Sync',
    untilLabel: 'until Oct 31',
    bg: '#C84B31',
    textColor: '#FFFFFF',
    spanCols: 6.4, // spans Mon 26 -> Sat 31
    periodText: 'Oct 20 – Nov 19',
  },
  {
    id: 'bar-november',
    icon: '📓',
    title: 'November bookings · Interactive Floor Plan',
    untilLabel: 'until Oct 31',
    bg: '#181C23',
    textColor: '#FFFFFF',
    spanCols: 5.8, // spans Mon 26 -> Sat 31
    periodText: 'Oct 24 – Nov 15',
  },
  {
    id: 'bar-secondetto',
    icon: '✨',
    title: 'Secondetto · Kitchen Display v2 Cutover',
    untilLabel: 'until Oct 30',
    bg: '#E6AA3E',
    textColor: '#181C23',
    spanCols: 5.0, // spans Mon 26 -> Fri 30
    periodText: 'Oct 26 – Nov 23',
  },
];

const INITIAL_WEEK_SLOTS = [
  {
    id: 'slot-1',
    dayKey: 'mon-26',
    hourRow: '12 PM',
    timeLabel: '12:15 PM',
    title: 'Light that...',
    brand: 'Ember & Oak POS',
    bg: '#0E7C5B',
    textColor: '#FFFFFF',
    channels: ['IG', 'FB'],
    status: 'Scheduled',
    thumbEmoji: '☕',
  },
  {
    id: 'slot-2',
    dayKey: 'sat-31',
    hourRow: '8 AM',
    timeLabel: '07:50 AM',
    title: 'Morning prep...',
    brand: 'Wildroot Botanics',
    bg: '#1B6CA8',
    textColor: '#FFFFFF',
    channels: ['IG'],
    status: 'Scheduled',
    thumbEmoji: '🌿',
  },
  {
    id: 'slot-3',
    dayKey: 'sun-1',
    hourRow: '8 AM',
    timeLabel: '08:30 AM',
    title: 'New roast &...',
    brand: 'Ramen Ya! GI',
    bg: '#F2B249',
    textColor: '#181C23',
    channels: ['IG', 'FB'],
    status: 'Awaiting approval',
    thumbEmoji: '🍜',
  },
  {
    id: 'slot-4',
    dayKey: 'sat-31',
    hourRow: '12 PM',
    timeLabel: '12:00 PM',
    title: 'Rose petals...',
    brand: 'Osteria Gia KDS',
    bg: '#1B6CA8',
    textColor: '#FFFFFF',
    channels: ['IG', 'TK'],
    status: 'Scheduled',
    thumbEmoji: '🌹',
  },
  {
    id: 'slot-5',
    dayKey: 'sun-1',
    hourRow: '12 PM',
    timeLabel: '12:00 PM',
    title: 'We grind, t...',
    brand: 'Hollow Home Cafe',
    bg: '#1B6CA8',
    textColor: '#FFFFFF',
    channels: ['IG', 'FB'],
    status: 'Published',
    thumbEmoji: '🪑',
  },
];

const INITIAL_MONTH_CELLS = [
  { dateLabel: '28', month: 'sep', key: 'm-28', chips: [] },
  { dateLabel: '29', month: 'sep', key: 'm-29', chips: [] },
  {
    dateLabel: '30',
    month: 'sep',
    key: 'm-30',
    countBadge: 4,
    chips: [
      { id: 'mc-1', text: '12:45p · Our wint...', bg: '#0E7C5B' },
      { id: 'mc-2', text: '7:30p · Behind th...', bg: '#0E7C5B' },
      { id: 'mc-3', text: '8:15p · Delivery d...', bg: '#0E7C5B' },
    ],
    moreCount: 1,
  },
  { dateLabel: '1', month: 'oct', key: 'm-1', chips: [] },
  {
    dateLabel: '2',
    month: 'oct',
    key: 'm-2',
    countBadge: 1,
    chips: [{ id: 'mc-4', text: '7:30p · Approval f...', bg: '#0E7C5B' }],
  },
  { dateLabel: '3', month: 'oct', key: 'm-3', chips: [] },
  {
    dateLabel: '4',
    month: 'oct',
    key: 'm-4',
    countBadge: 4,
    chips: [
      { id: 'mc-5', text: '9:45a · Three way...', bg: '#0E7C5B' },
      { id: 'mc-6', text: '6:15p · Wheels off...', bg: '#0E7C5B' },
      { id: 'mc-7', text: '8p · Slow interior...', bg: '#0E7C5B' },
    ],
    moreCount: 1,
  },
  { dateLabel: '5', month: 'oct', key: 'm-5', chips: [] },
  {
    dateLabel: '6',
    month: 'oct',
    key: 'm-6',
    countBadge: 5,
    chips: [
      { id: 'mc-8', text: '9:45a · Hiring, a s...', bg: '#0E7C5B' },
      { id: 'mc-9', text: '1p · New harvest f...', bg: '#0E7C5B' },
      { id: 'mc-10', text: '7:15p · Night rout...', bg: '#0E7C5B' },
    ],
    moreCount: 2,
  },
  { dateLabel: '7', month: 'oct', key: 'm-7', chips: [] },
  { dateLabel: '8', month: 'oct', key: 'm-8', chips: [] },
  { dateLabel: '9', month: 'oct', key: 'm-9', chips: [] },
  {
    dateLabel: '10',
    month: 'oct',
    key: 'm-10',
    countBadge: 4,
    hasTopSpanBar: true,
    chips: [
      { id: 'mc-11', text: '9a · Two-stage co...', bg: '#0E7C5B' },
      { id: 'mc-12', text: '12:45p · Ten years...', bg: '#0E7C5B' },
      { id: 'mc-13', text: '5:45p · The Lig s...', bg: '#0E7C5B' },
    ],
    moreCount: 1,
  },
  {
    dateLabel: '11',
    month: 'oct',
    key: 'm-11',
    countBadge: 4,
    hasTopSpanBar: true,
    chips: [
      { id: 'mc-14', text: '9:45a · Giveaway...', bg: '#0E7C5B' },
      { id: 'mc-15', text: '12p · A home tour...', bg: '#0E7C5B' },
      { id: 'mc-16', text: '5:15p · Saturday c...', bg: '#0E7C5B' },
    ],
    moreCount: 1,
  },
];

const INITIAL_UNSCHEDULED_DRAFTS = [
  {
    id: 'draft-1',
    badgeCode: 'RO',
    badgeColor: '#D94E34',
    title: 'Draft: winter subscription & POS setup',
    meta: 'No time · edited Thu, Nov 5 · 15 tables',
    brand: 'Ember & Oak',
    bg: '#0E7C5B',
    textColor: '#FFFFFF',
    thumbEmoji: '☕',
  },
  {
    id: 'draft-2',
    badgeCode: 'RY',
    badgeColor: '#C84B31',
    title: 'Draft: 12-outlet QR Table self-order sync',
    meta: 'No time · edited Fri, Oct 30 · Jabodetabek',
    brand: 'Ramen Ya! GI',
    bg: '#1B6CA8',
    textColor: '#FFFFFF',
    thumbEmoji: '🍜',
  },
  {
    id: 'draft-3',
    badgeCode: 'WB',
    badgeColor: '#0E7C5B',
    title: 'Draft: Kitchen KDS v2 & Printer Routing',
    meta: 'No time · edited Sat, Oct 31 · 4 stations',
    brand: 'Wildroot Botanics',
    bg: '#F2B249',
    textColor: '#181C23',
    thumbEmoji: '🌿',
  },
  {
    id: 'draft-4',
    badgeCode: 'ST',
    badgeColor: '#181C23',
    title: 'Draft: Midtrans QRIS Dynamic Split-Bill',
    meta: 'No time · edited Sun, Nov 1 · Enterprise',
    brand: 'Sushi Tei Plaza',
    bg: '#0E7C5B',
    textColor: '#FFFFFF',
    thumbEmoji: '🍣',
  },
];

export default function MurmuraCalendarView({
  theme = 'murmura',
  selectedTenantFilter = 'All tenants',
  fontFamily,
  onOpenNewDeal,
  onTriggerToast,
}) {
  const isLight = theme === 'murmura';
  const fontDisplay = fontFamily?.display || 'var(--font-plus-jakarta), -apple-system, sans-serif';
  const fontBody = fontFamily?.body || 'var(--font-plus-jakarta), -apple-system, sans-serif';

  // 'Week' (Gambar 2 & 3) | 'Month' (Gambar 4) | 'List'
  const [calendarMode, setCalendarMode] = useState('Week');
  const [statusFilter, setStatusFilter] = useState('All');
  const [networkFilter, setNetworkFilter] = useState('All networks');

  // Choreographed Entrance State:
  // stage 0 = 'before' (Gambar 2: "sebelum tampil" — skeleton columns, KPIs at 3 / 2 / 3 / 0)
  // stage 1 = 'bars'   (Multi-day campaign bars expand left-to-right)
  // stage 2 = 'after'  (Gambar 3: "sesudah tampil" — time cards pop in, KPIs reach 5 / 5 / 9 / 3)
  const [animStage, setAnimStage] = useState(0);
  const [replaySeed, setReplaySeed] = useState(0);

  const [weekSlots, setWeekSlots] = useState(INITIAL_WEEK_SLOTS);
  const [monthCells, setMonthCells] = useState(INITIAL_MONTH_CELLS);
  const [drafts, setDrafts] = useState(INITIAL_UNSCHEDULED_DRAFTS);

  // Drag-and-drop state
  const [dragPayload, setDragPayload] = useState(null); // { source: 'draft' | 'slot', item }
  const [dragOverTarget, setDragOverTarget] = useState(null);

  useEffect(() => {
    setAnimStage(0);
    const t1 = setTimeout(() => setAnimStage(1), 320);
    const t2 = setTimeout(() => setAnimStage(2), 620);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [replaySeed]);

  const handleReplayTransition = () => {
    setReplaySeed((s) => s + 1);
  };

  // KPI numbers matching Gambar 2 ("sebelum tampil": 3, 2, 3, 0) -> Gambar 3 ("sesudah tampil": 5, 5, 9, 3)
  const kpiScheduled = animStage === 0 ? 3 : weekSlots.length;
  const kpiAwaiting = animStage === 0 ? 2 : 5;
  const kpiPublished = animStage === 0 ? 3 : 9;
  const kpiEmptyDays = animStage === 0 ? 0 : 3;

  // Handle Dropping a Draft or Existing Slot onto a Week Day/Hour cell
  const handleDropOnWeekCell = (dayKey, hourRow) => {
    setDragOverTarget(null);
    if (!dragPayload) return;

    if (dragPayload.source === 'draft') {
      const d = dragPayload.item;
      const newSlot = {
        id: `slot-${Date.now()}`,
        dayKey,
        hourRow,
        timeLabel: hourRow === '8 AM' ? '08:30 AM' : hourRow === '12 PM' ? '12:15 PM' : '01:00 PM',
        title: d.title.replace('Draft: ', ''),
        brand: d.brand,
        bg: d.bg || '#0E7C5B',
        textColor: d.textColor || '#FFFFFF',
        channels: ['IG', 'FB'],
        status: 'Scheduled',
        thumbEmoji: d.thumbEmoji || '✨',
      };
      setWeekSlots((prev) => [...prev, newSlot]);
      setDrafts((prev) => prev.filter((x) => x.id !== d.id));
      if (onTriggerToast) {
        onTriggerToast(
          `Scheduled "${d.title}" on ${dayKey.toUpperCase()} at ${hourRow}`,
          () => {
            setWeekSlots((prev) => prev.filter((x) => x.id !== newSlot.id));
            setDrafts((prev) => [d, ...prev]);
          }
        );
      }
    } else if (dragPayload.source === 'slot') {
      const s = dragPayload.item;
      const prevDay = s.dayKey;
      const prevHour = s.hourRow;
      if (prevDay === dayKey && prevHour === hourRow) return;

      setWeekSlots((prev) =>
        prev.map((x) =>
          x.id === s.id
            ? {
                ...x,
                dayKey,
                hourRow,
                timeLabel: hourRow === '8 AM' ? '08:15 AM' : hourRow === '12 PM' ? '12:00 PM' : '01:15 PM',
              }
            : x
        )
      );
      if (onTriggerToast) {
        onTriggerToast(`Moved "${s.title}" to ${dayKey.toUpperCase()} · ${hourRow}`, () => {
          setWeekSlots((prev) =>
            prev.map((x) => (x.id === s.id ? { ...x, dayKey: prevDay, hourRow: prevHour } : x))
          );
        });
      }
    }
    setDragPayload(null);
  };

  // Handle Dropping a Draft onto a Month Date Cell (Gambar 4)
  const handleDropOnMonthCell = (cellKey, dateLabel) => {
    setDragOverTarget(null);
    if (!dragPayload || dragPayload.source !== 'draft') return;

    const d = dragPayload.item;
    const newChip = {
      id: `mc-${Date.now()}`,
      text: `12:30p · ${d.title.replace('Draft: ', '').slice(0, 14)}...`,
      bg: '#0E7C5B',
    };

    setMonthCells((prev) =>
      prev.map((cell) =>
        cell.key === cellKey
          ? {
              ...cell,
              countBadge: (cell.countBadge || cell.chips.length) + 1,
              chips: [newChip, ...cell.chips].slice(0, 3),
            }
          : cell
      )
    );
    setDrafts((prev) => prev.filter((x) => x.id !== d.id));
    if (onTriggerToast) {
      onTriggerToast(`Scheduled "${d.title}" onto Oct ${dateLabel}`, () => {
        setDrafts((prev) => [d, ...prev]);
      });
    }
    setDragPayload(null);
  };

  const surfaceBg = isLight ? '#FFFFFF' : '#131C2E';
  const surfaceBorder = isLight ? 'rgba(20, 23, 29, 0.08)' : 'rgba(255, 255, 255, 0.08)';
  const textPrimary = isLight ? '#14171D' : '#F8FAFC';
  const textSecondary = isLight ? '#5A6065' : '#94A3B8';
  const textMuted = isLight ? '#8C9196' : '#64748B';
  const skeletonColBg = isLight ? '#ECEBE3' : '#1A263B';
  const activeColBg = isLight ? '#F8F7F2' : '#162033';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', fontFamily: fontBody }}>
      {/* =====================================================================
          ROW 1: "Publishing calendar" + 4 KPI METRICS (Exact Match to Screenshots 2–4)
         ===================================================================== */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(175px, 210px) repeat(4, minmax(140px, 1fr))',
          alignItems: 'center',
          gap: '20px',
        }}
      >
        {/* Editorial Title with Clip-Mask Entrance (Exact Match to Gambar 2 -> 3) */}
        <div style={{ overflow: 'hidden', paddingBottom: '2px' }}>
          <h1
            key={replaySeed}
            style={{
              margin: 0,
              fontFamily: fontDisplay,
              fontSize: 'clamp(30px, 2.6vw, 37px)',
              fontWeight: 400,
              lineHeight: 1.02,
              letterSpacing: '-0.025em',
              color: textPrimary,
              transform: animStage === 0 ? 'translateY(28%)' : 'translateY(0%)',
              opacity: animStage === 0 ? 0.78 : 1,
              transition: 'transform 0.42s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s ease',
            }}
          >
            Publishing
            <br />
            calendar
          </h1>
        </div>

        {/* 4 Inline KPI Counters with Monochrome Stroke SVGs (Exact Match to Screenshots 2, 3, 4) */}
        {[
          {
            val: kpiScheduled,
            label: 'Scheduled this week',
            svg: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            ),
          },
          {
            val: kpiAwaiting,
            label: 'Awaiting approval',
            svg: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <polyline points="9 12 11 14 15 10" />
              </svg>
            ),
          },
          {
            val: kpiPublished,
            label: 'Published this week',
            svg: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            ),
          },
          {
            val: kpiEmptyDays,
            label: 'Empty days in the next 7',
            svg: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            ),
          },
        ].map((kpi, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              opacity: idx === 3 && animStage === 0 ? 0.35 : 1,
              transition: 'opacity 0.35s ease',
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: isLight ? 'rgba(255, 255, 255, 0.78)' : 'rgba(255,255,255,0.06)',
                border: `1px solid ${surfaceBorder}`,
                display: 'grid',
                placeItems: 'center',
                color: textSecondary,
                flexShrink: 0,
              }}
            >
              {kpi.svg}
            </div>
            <div>
              <div
                style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  color: textPrimary,
                  fontVariantNumeric: 'tabular-nums',
                  lineHeight: 1.15,
                  transition: 'all 0.3s ease',
                }}
              >
                {kpi.val}
              </div>
              <div style={{ fontSize: '11.5px', color: textSecondary, marginTop: '2px' }}>
                {kpi.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* =====================================================================
          ROW 1B: RIGHT-ALIGNED VIEW CONTROLS ([Week | Month | List] [< Today >] [+ New post])
          (Exact Position from Reference Screenshots 3 & 4)
         ===================================================================== */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '8px',
          marginTop: '-6px',
        }}
      >
        {/* Subtle Replay Choreographed Animation Button (Gambar 2 -> Gambar 3) */}
        <button
          onClick={handleReplayTransition}
          title="Replay Gambar 2 (Sebelum Tampil) -> Gambar 3 (Sesudah Tampil) Animation"
          style={{
            padding: '6px 12px',
            borderRadius: '999px',
            border: `1px solid ${surfaceBorder}`,
            background: surfaceBg,
            color: textSecondary,
            fontSize: '11.5px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          <span>↻</span>
          <span>Replay</span>
        </button>

        {/* Week | Month | List Segmented Switcher */}
        <div
          style={{
            display: 'inline-flex',
            background: isLight ? 'rgba(20, 23, 29, 0.05)' : '#182338',
            borderRadius: '999px',
            padding: '3px',
            border: `1px solid ${surfaceBorder}`,
          }}
        >
          {['Week', 'Month', 'List'].map((mode) => {
            const active = calendarMode === mode;
            return (
              <button
                key={mode}
                onClick={() => setCalendarMode(mode)}
                style={{
                  padding: '5px 14px',
                  borderRadius: '999px',
                  border: 'none',
                  background: active ? surfaceBg : 'transparent',
                  color: active ? textPrimary : textSecondary,
                  fontSize: '12px',
                  fontWeight: active ? 700 : 500,
                  cursor: 'pointer',
                  boxShadow: active ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                {mode}
              </button>
            );
          })}
        </div>

        {/* < Today > Navigation */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={handleReplayTransition}
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              border: `1px solid ${surfaceBorder}`,
              background: surfaceBg,
              color: textPrimary,
              cursor: 'pointer',
            }}
          >
            ‹
          </button>
          <button
            onClick={handleReplayTransition}
            style={{
              padding: '6px 14px',
              borderRadius: '999px',
              border: `1px solid ${surfaceBorder}`,
              background: surfaceBg,
              color: textPrimary,
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Today
          </button>
          <button
            onClick={handleReplayTransition}
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              border: `1px solid ${surfaceBorder}`,
              background: surfaceBg,
              color: textPrimary,
              cursor: 'pointer',
            }}
          >
            ›
          </button>
        </div>

        {/* + New post / deal */}
        <button
          onClick={onOpenNewDeal}
          style={{
            padding: '7px 16px',
            borderRadius: '999px',
            border: 'none',
            background: isLight ? '#161920' : '#F2B249',
            color: isLight ? '#FFFFFF' : '#14171D',
            fontSize: '12.5px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          + New post
        </button>
      </div>

      {/* =====================================================================
          ROW 2: FILTER PILLS BAR ("All networks", Social Icons, Status Filters)
         ===================================================================== */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setNetworkFilter('All networks')}
            style={{
              padding: '6px 14px',
              borderRadius: '999px',
              border: 'none',
              background: '#161920',
              color: '#FFFFFF',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            All networks
          </button>

          {/* Network/Channel Circular Icons */}
          {[
            { id: 'IG', label: '◎', color: '#E1306C' },
            { id: 'FB', label: 'f', color: '#1877F2' },
            { id: 'TK', label: '♪', color: '#14171D' },
            { id: 'PIN', label: 'P', color: '#E60023' },
            { id: 'YT', label: '▶', color: '#FF0000' },
            { id: 'X', label: '𝕏', color: '#14171D' },
            { id: 'IN', label: 'in', color: '#0A66C2' },
          ].map((net) => (
            <button
              key={net.id}
              onClick={() => setNetworkFilter(net.id === networkFilter ? 'All networks' : net.id)}
              title={`Filter channel: ${net.id}`}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                border: `1px solid ${surfaceBorder}`,
                background: networkFilter === net.id ? '#E3F5EE' : surfaceBg,
                color: net.color,
                fontSize: '11px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              {net.label}
            </button>
          ))}

          <span style={{ color: surfaceBorder, margin: '0 4px' }}>|</span>

          {/* Status Filter Pills */}
          {[
            { id: 'Scheduled', dot: '#2563EB' },
            { id: 'Awaiting approval', dot: '#F2B249' },
            { id: 'Published', dot: '#0E7C5B' },
            { id: 'Drafts', dot: '#94A3B8' },
            { id: 'Failed', dot: '#C84B31' },
          ].map((st) => {
            const active = statusFilter === st.id;
            return (
              <button
                key={st.id}
                onClick={() => setStatusFilter(active ? 'All' : st.id)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '999px',
                  border: `1px solid ${active ? st.dot : surfaceBorder}`,
                  background: active ? surfaceBg : 'rgba(255,255,255,0.65)',
                  color: textPrimary,
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: st.dot,
                  }}
                />
                <span>{st.id}</span>
              </button>
            );
          })}
        </div>

        {/* All campaigns dropdown pill */}
        <div
          style={{
            padding: '5px 14px',
            borderRadius: '999px',
            border: `1px solid ${surfaceBorder}`,
            background: surfaceBg,
            color: textSecondary,
            fontSize: '11.5px',
            fontWeight: 600,
          }}
        >
          🏳️ All campaigns ▾
        </div>
      </div>

      {/* =====================================================================
          ROW 3: MAIN CALENDAR CANVAS (LEFT) + MINI CALENDAR & DRAFTS (RIGHT)
         ===================================================================== */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 275px',
          gap: '18px',
          alignItems: 'start',
        }}
      >
        {/* LEFT MAIN CALENDAR CARD */}
        <div
          style={{
            background: surfaceBg,
            border: `1px solid ${surfaceBorder}`,
            borderRadius: '22px',
            padding: '20px',
            boxShadow: isLight
              ? '0 10px 30px -4px rgba(20, 23, 29, 0.05)'
              : '0 14px 36px rgba(0, 0, 0, 0.35)',
          }}
        >
          {/* Top Calendar Header: "Oct 26 – Nov 1, 2026" (Week) or "October 2026" (Month) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              marginBottom: '16px',
            }}
          >
            <div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: textPrimary }}>
                {calendarMode === 'Week' ? 'Oct 26 – Nov 1, 2026' : 'October 2026'}
              </div>
              <div style={{ fontSize: '11.5px', color: textMuted, marginTop: '2px' }}>
                {calendarMode === 'Week' ? '19 posts · 5 brands' : '78 posts · 5 brands'}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              {[
                { label: 'Scheduled', color: '#2563EB' },
                { label: 'Awaiting', color: '#F2B249' },
                { label: 'Published', color: '#0E7C5B' },
                { label: 'Needs attention', color: '#C84B31' },
              ].map((leg) => (
                <span
                  key={leg.label}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '11px',
                    color: textSecondary,
                    fontWeight: 500,
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: leg.color,
                    }}
                  />
                  {leg.label}
                </span>
              ))}

              <span
                style={{
                  padding: '4px 10px',
                  borderRadius: '999px',
                  border: `1px solid ${surfaceBorder}`,
                  background: isLight ? '#FAF9F5' : '#1E293B',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: textPrimary,
                }}
              >
                ✨ Best times
              </span>
            </div>
          </div>

          {/* ===============================================================
              MODE A: WEEK VIEW (Exact Match to Gambar 2 "Sebelum" & Gambar 3 "Sesudah")
             =============================================================== */}
          {calendarMode === 'Week' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* 7-Column Day Header Row (MON 26 .. SUN 1) */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '48px repeat(7, 1fr)',
                  gap: '8px',
                  alignItems: 'center',
                }}
              >
                <div />
                {WEEK_DAYS.map((d, idx) => (
                  <div
                    key={d.key}
                    style={{
                      textAlign: 'center',
                      padding: '6px 4px',
                      opacity: animStage === 0 && idx > 2 ? 0.35 : 1,
                      transition: `opacity 0.35s ease ${idx * 35}ms`,
                    }}
                  >
                    <div
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                        color: textMuted,
                      }}
                    >
                      {d.dow}
                    </div>
                    <div
                      style={{
                        width: '30px',
                        height: '30px',
                        margin: '4px auto',
                        borderRadius: '50%',
                        background: d.isToday ? '#161920' : 'transparent',
                        color: d.isToday ? '#FFFFFF' : textPrimary,
                        fontSize: '14px',
                        fontWeight: 700,
                        display: 'grid',
                        placeItems: 'center',
                      }}
                    >
                      {d.date}
                    </div>
                    <div
                      style={{
                        fontSize: '10.5px',
                        color: d.isToday ? '#0E7C5B' : textMuted,
                        fontWeight: d.isToday ? 700 : 500,
                      }}
                    >
                      {d.postsLabel}
                    </div>
                  </div>
                ))}
              </div>

              {/* MULTI-DAY CAMPAIGN ROLLOUT BARS (Stage 1->2 Choreographed ScaleX Expansion) */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '48px 1fr',
                  gap: '8px',
                  alignItems: 'center',
                  minHeight: '112px',
                }}
              >
                <div
                  style={{
                    fontSize: '11px',
                    color: textMuted,
                    textAlign: 'right',
                    paddingRight: '6px',
                  }}
                >
                  🏳️
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {CAMPAIGN_BARS.map((bar, idx) => {
                    const widthPct = Math.min(100, (bar.spanCols / 7) * 100);
                    const isExpanded = animStage >= 1;
                    return (
                      <div
                        key={bar.id}
                        style={{
                          width: `${widthPct}%`,
                          padding: '5px 12px',
                          borderRadius: '7px',
                          background: bar.bg,
                          color: bar.textColor,
                          fontSize: '11px',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transformOrigin: 'left center',
                          transform: isExpanded ? 'scaleX(1)' : 'scaleX(0.02)',
                          opacity: isExpanded ? 1 : 0,
                          transition: `transform 0.48s cubic-bezier(0.22, 1, 0.36, 1) ${idx * 65}ms, opacity 0.25s ease ${idx * 65}ms`,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                        }}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <span>{bar.icon}</span>
                          <span>{bar.title}</span>
                        </span>
                        <span style={{ fontSize: '10px', opacity: 0.85 }}>{bar.untilLabel}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* HOURLY COLUMNS MATRIX (8 AM, 12 PM, 1 PM) — Skeleton in Stage 0, Populated in Stage 2 */}
              {['8 AM', '12 PM', '1 PM'].map((hourLabel) => (
                <div
                  key={hourLabel}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '48px repeat(7, 1fr)',
                    gap: '8px',
                    minHeight: '88px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '10.5px',
                      color: textMuted,
                      textAlign: 'right',
                      paddingRight: '6px',
                      paddingTop: '8px',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {hourLabel}
                  </div>

                  {WEEK_DAYS.map((day, dIdx) => {
                    const cellTargetKey = `${day.key}-${hourLabel}`;
                    const isDropTarget = dragOverTarget === cellTargetKey;
                    const cellSlots = weekSlots.filter(
                      (s) =>
                        s.dayKey === day.key &&
                        s.hourRow === hourLabel &&
                        (statusFilter === 'All' || s.status === statusFilter)
                    );

                    return (
                      <div
                        key={cellTargetKey}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragOverTarget(cellTargetKey);
                        }}
                        onDragLeave={() => setDragOverTarget(null)}
                        onDrop={(e) => {
                          e.preventDefault();
                          handleDropOnWeekCell(day.key, hourLabel);
                        }}
                        style={{
                          borderRadius: '12px',
                          padding: '6px',
                          background: isDropTarget
                            ? 'rgba(14, 124, 91, 0.16)'
                            : animStage === 0
                            ? skeletonColBg
                            : day.isToday
                            ? isLight
                              ? '#EEF5F9'
                              : '#1B2A42'
                            : activeColBg,
                          border: isDropTarget
                            ? '1.5px dashed #0E7C5B'
                            : `1px solid ${surfaceBorder}`,
                          transition: 'background 0.35s ease, border 0.2s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                        }}
                      >
                        {animStage >= 2 &&
                          cellSlots.map((slot, sIdx) => (
                            <div
                              key={slot.id}
                              draggable
                              onDragStart={() =>
                                setDragPayload({ source: 'slot', item: slot })
                              }
                              onDragEnd={() => {
                                setDragPayload(null);
                                setDragOverTarget(null);
                              }}
                              style={{
                                padding: '8px',
                                borderRadius: '10px',
                                background: slot.bg,
                                color: slot.textColor,
                                cursor: 'grab',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                                animation: `murmuraCardSpringPop 0.38s cubic-bezier(0.34, 1.56, 0.64, 1) ${
                                  (dIdx + sIdx) * 40
                                }ms both`,
                              }}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  opacity: 0.9,
                                }}
                              >
                                <span>{slot.timeLabel}</span>
                                <span>{slot.thumbEmoji}</span>
                              </div>
                              <div
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  marginTop: '3px',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {slot.title}
                              </div>
                              <div
                                style={{
                                  display: 'flex',
                                  gap: '4px',
                                  marginTop: '6px',
                                }}
                              >
                                {slot.channels.map((ch) => (
                                  <span
                                    key={ch}
                                    style={{
                                      fontSize: '8.5px',
                                      fontWeight: 800,
                                      padding: '1px 5px',
                                      borderRadius: '999px',
                                      background: 'rgba(255,255,255,0.88)',
                                      color: '#14171D',
                                    }}
                                  >
                                    {ch}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {/* ===============================================================
              MODE B: MONTH VIEW MATRIX (Exact Match to Gambar 4)
             =============================================================== */}
          {calendarMode === 'Month' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Active Campaign Legend Pills Row (Gambar 4 Top Row) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                {CAMPAIGN_BARS.map((bar) => (
                  <div
                    key={bar.id}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '999px',
                      background: isLight ? '#FAF9F5' : '#182338',
                      border: `1px solid ${surfaceBorder}`,
                      fontSize: '11px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <span
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: bar.bg,
                      }}
                    />
                    <strong style={{ color: textPrimary }}>{bar.title.split('·')[0].trim()}</strong>
                    <span style={{ color: textMuted }}>{bar.periodText}</span>
                  </div>
                ))}
              </div>

              {/* 7-Column DOW Header */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: '8px',
                  paddingTop: '4px',
                }}
              >
                {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((dow) => (
                  <div
                    key={dow}
                    style={{
                      fontSize: '10.5px',
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      color: textMuted,
                      paddingLeft: '6px',
                    }}
                  >
                    {dow}
                  </div>
                ))}
              </div>

              {/* 7-Column Month Matrix Cells (Gambar 4) */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: '8px',
                }}
              >
                {monthCells.map((cell) => {
                  const isDropTarget = dragOverTarget === cell.key;
                  return (
                    <div
                      key={cell.key}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOverTarget(cell.key);
                      }}
                      onDragLeave={() => setDragOverTarget(null)}
                      onDrop={(e) => {
                        e.preventDefault();
                        handleDropOnMonthCell(cell.key, cell.dateLabel);
                      }}
                      style={{
                        minHeight: '126px',
                        borderRadius: '12px',
                        padding: '8px',
                        background: isDropTarget
                          ? 'rgba(14, 124, 91, 0.14)'
                          : cell.chips.length > 0
                          ? isLight
                            ? '#FCFBF8'
                            : '#172236'
                          : activeColBg,
                        border: isDropTarget
                          ? '1.5px dashed #0E7C5B'
                          : `1px solid ${surfaceBorder}`,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        position: 'relative',
                      }}
                    >
                      {cell.hasTopSpanBar && (
                        <div
                          style={{
                            height: '4px',
                            borderRadius: '999px',
                            background: '#0E7C5B',
                            marginBottom: '2px',
                          }}
                        />
                      )}

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '4px',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '12px',
                            fontWeight: 700,
                            color: cell.month === 'sep' ? textMuted : textPrimary,
                          }}
                        >
                          {cell.dateLabel}
                        </span>
                        {cell.countBadge && (
                          <span style={{ fontSize: '10px', color: textMuted }}>
                            {cell.countBadge}
                          </span>
                        )}
                      </div>

                      {cell.chips.map((chip) => (
                        <div
                          key={chip.id}
                          style={{
                            padding: '3px 7px',
                            borderRadius: '6px',
                            background: chip.bg,
                            color: '#FFFFFF',
                            fontSize: '10px',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {chip.text}
                        </div>
                      ))}

                      {cell.moreCount && (
                        <div
                          style={{
                            fontSize: '10px',
                            fontWeight: 600,
                            color: textSecondary,
                            paddingLeft: '4px',
                            marginTop: '2px',
                          }}
                        >
                          +{cell.moreCount} more
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ===============================================================
              MODE C: LIST VIEW
             =============================================================== */}
          {calendarMode === 'List' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {weekSlots.map((slot) => (
                <div
                  key={slot.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: activeColBg,
                    border: `1px solid ${surfaceBorder}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '18px' }}>{slot.thumbEmoji}</span>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: textPrimary }}>
                        {slot.title} · {slot.brand}
                      </div>
                      <div style={{ fontSize: '11.5px', color: textSecondary }}>
                        {slot.dayKey.toUpperCase()} · {slot.timeLabel}
                      </div>
                    </div>
                  </div>
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: '999px',
                      background: slot.bg,
                      color: slot.textColor,
                      fontSize: '11px',
                      fontWeight: 700,
                    }}
                  >
                    {slot.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR: MINI MONTH CALENDAR + DRAGGABLE UNSCHEDULED DRAFTS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Mini Month Calendar Card ("October 2026") */}
          <div
            style={{
              background: surfaceBg,
              border: `1px solid ${surfaceBorder}`,
              borderRadius: '20px',
              padding: '18px',
              boxShadow: isLight
                ? '0 8px 24px -4px rgba(20, 23, 29, 0.04)'
                : '0 12px 28px rgba(0, 0, 0, 0.3)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px',
              }}
            >
              <span style={{ fontSize: '14px', fontWeight: 700, color: textPrimary }}>
                October 2026
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => setCalendarMode(calendarMode === 'Week' ? 'Month' : 'Week')}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: textSecondary,
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  ‹
                </button>
                <button
                  onClick={() => setCalendarMode(calendarMode === 'Week' ? 'Month' : 'Week')}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: textSecondary,
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  ›
                </button>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '4px',
                textAlign: 'center',
                fontSize: '10px',
                fontWeight: 700,
                color: textMuted,
                marginBottom: '6px',
              }}
            >
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                <div key={i}>{d}</div>
              ))}
            </div>

            {[
              [28, 29, 30, 1, 2, 3, 4],
              [5, 6, 7, 8, 9, 10, 11],
              [12, 13, 14, 15, 16, 17, 18],
              [19, 20, 21, 22, 23, 24, 25],
              [26, 27, 28, 29, 30, 31, 1],
              [2, 3, 4, 5, 6, 7, 8],
            ].map((weekRow, rIdx) => {
              const isActiveWeek = rIdx === 4;
              return (
                <div
                  key={rIdx}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    gap: '2px',
                    padding: '3px 2px',
                    borderRadius: '999px',
                    background: isActiveWeek
                      ? isLight
                        ? '#EBEAE2'
                        : 'rgba(255,255,255,0.08)'
                      : 'transparent',
                    textAlign: 'center',
                  }}
                >
                  {weekRow.map((num, cIdx) => {
                    const isSelectedDay = isActiveWeek && num === 30;
                    return (
                      <div
                        key={cIdx}
                        style={{
                          width: '26px',
                          height: '26px',
                          margin: '0 auto',
                          borderRadius: '50%',
                          background: isSelectedDay ? '#161920' : 'transparent',
                          color: isSelectedDay ? '#FFFFFF' : textPrimary,
                          fontSize: '11px',
                          fontWeight: isSelectedDay ? 700 : 500,
                          display: 'grid',
                          placeItems: 'center',
                        }}
                      >
                        {num}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Unscheduled Drafts Panel ("Drag one onto the calendar to give it a time") */}
          <div
            style={{
              background: surfaceBg,
              border: `1px solid ${surfaceBorder}`,
              borderRadius: '20px',
              padding: '18px',
              boxShadow: isLight
                ? '0 8px 24px -4px rgba(20, 23, 29, 0.04)'
                : '0 12px 28px rgba(0, 0, 0, 0.3)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '4px',
              }}
            >
              <span style={{ fontSize: '14px', fontWeight: 700, color: textPrimary }}>
                Unscheduled drafts
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: textSecondary,
                }}
              >
                {drafts.length} ⌃
              </span>
            </div>

            <div
              style={{
                fontSize: '11.5px',
                color: textSecondary,
                lineHeight: 1.35,
                marginBottom: '12px',
              }}
            >
              Drag one onto the calendar to give it a time
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {drafts.map((draft) => (
                <div
                  key={draft.id}
                  draggable
                  onDragStart={() =>
                    setDragPayload({ source: 'draft', item: draft })
                  }
                  onDragEnd={() => {
                    setDragPayload(null);
                    setDragOverTarget(null);
                  }}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '12px',
                    background: isLight ? '#FAF9F5' : '#182338',
                    border: `1px solid ${surfaceBorder}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    cursor: 'grab',
                  }}
                >
                  <span
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '7px',
                      background: draft.badgeColor,
                      color: '#FFFFFF',
                      fontSize: '10.5px',
                      fontWeight: 800,
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {draft.badgeCode}
                  </span>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: textPrimary,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {draft.title}
                    </div>
                    <div
                      style={{
                        fontSize: '10.5px',
                        color: textMuted,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {draft.meta}
                    </div>
                  </div>

                  <span style={{ color: textMuted, fontSize: '12px', cursor: 'grab' }}>⋮⋮</span>
                </div>
              ))}

              {drafts.length === 0 && (
                <div
                  style={{
                    padding: '16px',
                    textAlign: 'center',
                    fontSize: '12px',
                    color: textMuted,
                    borderRadius: '12px',
                    border: `1px dashed ${surfaceBorder}`,
                  }}
                >
                  All drafts scheduled onto calendar! 🎉
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

