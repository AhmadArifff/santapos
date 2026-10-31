'use client';

import { useState } from 'react';

const INITIAL_TABLES_BY_ZONE = {
  'Dining room': [
    { id: 1, number: '1', shape: 'circle', x: 11, y: 20, w: 78, h: 78, seats: 2, occupied: 2, timeLabel: '2/2 30m', status: 'eating', server: 'Ada', guestName: 'Ethan Brooks', tenantBrand: 'Bakmi GM Express', chairs: ['top', 'bottom'] },
    { id: 2, number: '2', shape: 'circle-dashed', x: 27, y: 20, w: 76, h: 76, seats: 2, occupied: 0, timeLabel: '8:00', status: 'reserved', server: 'Omar', guestName: 'Tom Okafor', tenantBrand: 'Kopi Soe Flagship', chairs: ['top', 'bottom'] },
    { id: 3, number: '3', shape: 'square', x: 43, y: 18, w: 94, h: 94, seats: 4, occupied: 4, timeLabel: '4/4 52m', status: 'eating', server: 'Lucia', guestName: 'Hendra Wijaya', tenantBrand: 'Bebek Bengil HQ', chairs: ['top', 'bottom', 'left', 'right'] },
    { id: 4, number: '4', shape: 'square', x: 61, y: 18, w: 92, h: 92, seats: 4, occupied: 0, timeLabel: '8:15', status: 'reserved', server: 'Omar', guestName: 'Yara Haddad', tenantBrand: 'Geprek Bensu', chairs: ['top', 'bottom', 'left', 'right'] },
    { id: 5, number: '5', shape: 'rect', x: 79, y: 20, w: 158, h: 78, seats: 6, occupied: 6, timeLabel: '6/6 1h15m', status: 'bill', server: 'Ada', guestName: 'Kevin Tan', tenantBrand: 'Sushi Tei Plaza', chairs: ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'left', 'right'] },

    { id: 6, number: '6', shape: 'square', x: 12, y: 52, w: 94, h: 94, seats: 4, occupied: 4, timeLabel: '4/4 42m', status: 'bill', server: 'Ada', guestName: 'Nadia Putri', tenantBrand: 'Kopi Kenangan', chairs: ['top', 'bottom', 'left', 'right'] },
    { id: 7, number: '7', shape: 'square', x: 29, y: 52, w: 94, h: 94, seats: 4, occupied: 4, timeLabel: '4/4 65m', status: 'eating', server: 'Elin', guestName: 'Yuki Tanaka', tenantBrand: 'Ramen Ya! GI', chairs: ['top', 'bottom', 'left', 'right'] },
    { id: 8, number: '8', shape: 'circle', x: 47, y: 54, w: 78, h: 78, seats: 2, occupied: 2, timeLabel: '2/2 22m', status: 'eating', server: 'Elin', guestName: 'Nina B.', tenantBrand: 'Gelato Secrets', chairs: ['top', 'bottom'] },
    { id: 9, number: '9', shape: 'circle-free', x: 63, y: 54, w: 76, h: 76, seats: 2, occupied: 0, timeLabel: 'Free', status: 'free', server: 'Lucia', guestName: null, tenantBrand: 'Slot Tersedia', chairs: ['top', 'bottom'] },
    { id: 10, number: '10', shape: 'rect', x: 80, y: 54, w: 162, h: 80, seats: 6, occupied: 0, timeLabel: '8:00', status: 'reserved', server: 'Omar', guestName: 'Priya Shah', tenantBrand: 'Bumbu Desa HQ', chairs: ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'left', 'right'] },

    { id: 11, number: '11', shape: 'square', x: 20, y: 81, w: 94, h: 94, seats: 4, occupied: 4, timeLabel: '4/4 20m', status: 'seated', server: 'Elin', guestName: 'Budi Santoso', tenantBrand: 'Sate Khas Senayan', chairs: ['top', 'bottom', 'left', 'right'] },
    { id: 12, number: '12', shape: 'square', x: 47, y: 80, w: 100, h: 100, seats: 4, occupied: 4, timeLabel: '4/4 12m', status: 'selected', server: 'Lucia', guestName: 'Hugo Lam', tenantBrand: 'Sultan Kebab Nusantara', chairs: ['top', 'bottom', 'left', 'right'] },
  ],
  Terrace: [
    { id: 21, number: 'T1', shape: 'square', x: 18, y: 26, w: 94, h: 94, seats: 4, occupied: 4, timeLabel: '4/4 35m', status: 'eating', server: 'Ada', guestName: 'Dian Sastro', tenantBrand: 'Solaria Resto', chairs: ['top', 'bottom', 'left', 'right'] },
    { id: 22, number: 'T2', shape: 'circle-free', x: 42, y: 26, w: 78, h: 78, seats: 2, occupied: 0, timeLabel: 'Free', status: 'free', server: 'Elin', guestName: null, tenantBrand: 'Slot Tersedia', chairs: ['top', 'bottom'] },
    { id: 23, number: 'T3', shape: 'square', x: 66, y: 26, w: 94, h: 94, seats: 4, occupied: 4, timeLabel: '4/4 23m', status: 'bill', server: 'Lucia', guestName: 'Hugo Lam', tenantBrand: 'Sultan Kebab Bali', chairs: ['top', 'bottom', 'left', 'right'] },
    { id: 24, number: 'T4', shape: 'rect', x: 30, y: 68, w: 158, h: 80, seats: 6, occupied: 6, timeLabel: '6/6 48m', status: 'selected', server: 'Omar', guestName: 'Ravi N.', tenantBrand: 'Mie Gacoan Surabaya', chairs: ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'left', 'right'] },
    { id: 25, number: 'T5', shape: 'square', x: 68, y: 68, w: 94, h: 94, seats: 4, occupied: 0, timeLabel: 'Free', status: 'free', server: 'Ada', guestName: null, tenantBrand: 'Slot Tersedia', chairs: ['top', 'bottom', 'left', 'right'] },
  ],
  Bar: [
    { id: 31, number: 'B1', shape: 'circle', x: 20, y: 38, w: 78, h: 78, seats: 2, occupied: 2, timeLabel: '2/2 19m', status: 'seated', server: 'Ada', guestName: 'Lucy H.', tenantBrand: 'Fore Coffee SCBD', chairs: ['top', 'bottom'] },
    { id: 32, number: 'B2', shape: 'circle-free', x: 42, y: 38, w: 78, h: 78, seats: 2, occupied: 0, timeLabel: 'Free', status: 'free', server: 'Elin', guestName: null, tenantBrand: 'Slot Tersedia', chairs: ['top', 'bottom'] },
    { id: 33, number: 'B3', shape: 'square', x: 66, y: 38, w: 94, h: 94, seats: 4, occupied: 4, timeLabel: '4/4 40m', status: 'eating', server: 'Lucia', guestName: 'Dimas Pratama', tenantBrand: 'Burger King Kemang', chairs: ['top', 'bottom', 'left', 'right'] },
    { id: 34, number: 'B4', shape: 'square', x: 45, y: 74, w: 96, h: 96, seats: 4, occupied: 4, timeLabel: '4/4 14m', status: 'selected', server: 'Omar', guestName: 'Rina Gunawan', tenantBrand: 'Bakmi GM Express', chairs: ['top', 'bottom', 'left', 'right'] },
  ],
};

const INITIAL_WAITLIST = [
  {
    id: 'w1',
    guests: 2,
    name: 'Ethan Brooks · Bakmi GM Express',
    subtitle: '13 min of 15 quoted',
    progress: 86,
    targetTable: '9',
    planTag: 'Pro Plan',
  },
  {
    id: 'w2',
    guests: 4,
    name: 'Hugo Lam · Sultan Kebab HQ',
    subtitle: '6 min of 20 quoted · Table 12 ready',
    progress: 42,
    targetTable: '12',
    planTag: 'Franchise',
  },
  {
    id: 'w3',
    guests: 3,
    name: 'Rosa Diaz · Matcha Cafe Bali',
    subtitle: '3 min of 15 quoted',
    progress: 22,
    targetTable: '2',
    planTag: 'Starter',
  },
];

const INITIAL_ARRIVING = [
  {
    id: 'a1',
    time: '8:00 PM',
    name: 'Priya Shah · Bumbu Desa HQ',
    details: '8 guests · Table 10 · Birthday / Enterprise Onboarding',
    badge: 'Nuts · Custom ERP',
    badgeTone: 'coral',
    tableNumber: '10',
    guests: 6,
  },
  {
    id: 'a2',
    time: '8:00 PM',
    name: 'Tom Okafor · Kopi Soe Flagship',
    details: '2 guests · Table 2 · Demo Cloud POS',
    badge: null,
    badgeTone: null,
    tableNumber: '2',
    guests: 2,
  },
  {
    id: 'a3',
    time: '8:15 PM',
    name: 'Yara Haddad · Geprek Bensu',
    details: '4 guests · Table 4 · Multi-Outlet Migration',
    badge: 'Dairy · 5 Cabang',
    badgeTone: 'blue',
    tableNumber: '4',
    guests: 4,
  },
  {
    id: 'a4',
    time: '8:30 PM',
    name: 'Sofia Petrov · Gelato Secrets',
    details: '2 guests · Table 9 · QR Self-Order Setup',
    badge: 'Vegetarian · Starter',
    badgeTone: 'mint',
    tableNumber: '9',
    guests: 2,
  },
];

const SERVERS_FLOOR = [
  {
    name: 'Ada',
    role: 'Enterprise AM',
    tables: 3,
    guests: 14,
    loadPct: 78,
    loadColor: '#F3A68F',
    badges: [
      { label: '1', bg: '#5E6B73', text: '#F8FAFC' },
      { label: '5', bg: '#4D6D72', text: '#F8FAFC' },
      { label: '6', bg: '#4D6D72', text: '#F8FAFC' },
    ],
  },
  {
    name: 'Elin',
    role: 'Next to seat',
    isNext: true,
    tables: 2,
    guests: 6,
    loadPct: 45,
    loadColor: '#EADCA6',
    badges: [
      { label: '7', bg: '#6D596A', text: '#F8FAFC' },
      { label: '8', bg: '#6D596A', text: '#F8FAFC' },
      { label: '11', bg: '#6E6A63', text: '#F8FAFC' },
    ],
  },
  {
    name: 'Lucia',
    role: 'Onboarding Lead',
    tables: 3,
    guests: 10,
    loadPct: 62,
    loadColor: '#F3A68F',
    badges: [
      { label: '3', bg: '#6D596A', text: '#F8FAFC' },
      { label: '12', bg: '#EFE2A8', text: '#18181B' },
    ],
  },
  {
    name: 'Omar',
    role: 'Cloud Architect',
    tables: 2,
    guests: 8,
    loadPct: 52,
    loadColor: '#EADCA6',
    badges: [
      { label: '2', bg: '#27354D', text: '#94A3B8' },
      { label: '4', bg: '#27354D', text: '#94A3B8' },
      { label: '10', bg: '#27354D', text: '#94A3B8' },
    ],
  },
];

export default function TavolaFloorPlanView({ onTriggerToast }) {
  const [activeZone, setActiveZone] = useState('Dining room');
  const [tablesByZone, setTablesByZone] = useState(INITIAL_TABLES_BY_ZONE);
  const [selectedTableId, setSelectedTableId] = useState(12);
  const [waitlist, setWaitlist] = useState(INITIAL_WAITLIST);
  const [arriving, setArriving] = useState(INITIAL_ARRIVING);
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [walkInForm, setWalkInForm] = useState({ name: '', guests: 4, targetTable: '9' });

  const currentTables = tablesByZone[activeZone] || [];
  const selectedTable = currentTables.find((t) => t.id === selectedTableId) || currentTables[currentTables.length - 1];

  const totalSeats = currentTables.reduce((acc, t) => acc + t.seats, 0);
  const takenSeats = currentTables.reduce((acc, t) => acc + t.occupied, 0);
  const freeTablesCount = currentTables.filter((t) => t.status === 'free' || t.status === 'reserved').length;
  const fillPct = totalSeats > 0 ? Math.round((takenSeats / totalSeats) * 100) : 54;

  const getTableVisualStyle = (table, isSelected) => {
    if (isSelected || table.status === 'selected') {
      return {
        bg: '#EFE2A8',
        border: '2px solid #FFF7D6',
        text: '#18181B',
        subtext: '#3F3F46',
        shadow: '0 0 36px rgba(239, 226, 168, 0.55), 0 12px 28px rgba(0, 0, 0, 0.45)',
        dotColor: '#EFE2A8',
      };
    }
    switch (table.status) {
      case 'eating':
        return {
          bg: 'rgba(109, 89, 106, 0.72)',
          border: '1.5px solid rgba(239, 168, 146, 0.35)',
          text: '#F8FAFC',
          subtext: '#CBD5E1',
          shadow: '0 8px 20px rgba(0,0,0,0.28)',
          dotColor: '#8B6F85',
        };
      case 'bill':
        return {
          bg: 'rgba(77, 109, 114, 0.75)',
          border: '1.5px solid rgba(188, 227, 212, 0.38)',
          text: '#F8FAFC',
          subtext: '#CFE9DF',
          shadow: '0 8px 20px rgba(0,0,0,0.28)',
          dotColor: '#69949A',
        };
      case 'seated':
        return {
          bg: 'rgba(110, 106, 99, 0.78)',
          border: '1.5px solid rgba(234, 220, 166, 0.35)',
          text: '#F8FAFC',
          subtext: '#E2E8F0',
          shadow: '0 8px 20px rgba(0,0,0,0.28)',
          dotColor: '#8C857B',
        };
      case 'reserved':
        return {
          bg: 'rgba(26, 37, 58, 0.85)',
          border: '1.5px dashed rgba(148, 163, 184, 0.4)',
          text: '#CBD5E1',
          subtext: '#64748B',
          shadow: 'none',
          dotColor: '#334155',
        };
      default:
        return {
          bg: 'rgba(17, 25, 43, 0.55)',
          border: '1.5px dashed rgba(148, 163, 184, 0.3)',
          text: '#94A3B8',
          subtext: '#64748B',
          shadow: 'none',
          dotColor: '#27354D',
        };
    }
  };

  const handleSeatWaitlistParty = (party) => {
    const target = currentTables.find((t) => t.number === party.targetTable) ||
      currentTables.find((t) => t.status === 'free' || t.status === 'reserved') ||
      selectedTable;

    if (!target) return;

    setTablesByZone((prev) => ({
      ...prev,
      [activeZone]: prev[activeZone].map((t) =>
        t.id === target.id
          ? {
              ...t,
              status: 'selected',
              occupied: party.guests,
              guestName: party.name.split('·')[0].trim(),
              tenantBrand: party.name.split('·')[1]?.trim() || party.name,
              timeLabel: `${party.guests}/${t.seats} 1m`,
            }
          : t.status === 'selected'
          ? { ...t, status: 'seated' }
          : t
      ),
    }));

    setSelectedTableId(target.id);
    setWaitlist((prev) => prev.filter((w) => w.id !== party.id));

    if (onTriggerToast) {
      onTriggerToast(`Seated ${party.name} at Table ${target.number}`);
    }
  };

  const handleSeatArrival = (booking) => {
    const target =
      currentTables.find((t) => t.number === booking.tableNumber) ||
      currentTables.find((t) => t.status === 'reserved' || t.status === 'free') ||
      selectedTable;

    if (target) {
      setTablesByZone((prev) => ({
        ...prev,
        [activeZone]: prev[activeZone].map((t) =>
          t.id === target.id
            ? {
                ...t,
                status: 'selected',
                occupied: Math.min(booking.guests, t.seats),
                guestName: booking.name.split('·')[0].trim(),
                tenantBrand: booking.name.split('·')[1]?.trim() || booking.name,
                timeLabel: `${Math.min(booking.guests, t.seats)}/${t.seats} 1m`,
              }
            : t.status === 'selected'
            ? { ...t, status: 'seated' }
            : t
        ),
      }));
      setSelectedTableId(target.id);
    }

    setArriving((prev) => prev.filter((a) => a.id !== booking.id));
    if (onTriggerToast) {
      onTriggerToast(`Checked in ${booking.name} at Table ${booking.tableNumber}`);
    }
  };

  const handleAddWalkIn = (e) => {
    e.preventDefault();
    if (!walkInForm.name.trim()) return;
    const newParty = {
      id: 'w-' + Date.now(),
      guests: Number(walkInForm.guests || 2),
      name: walkInForm.name.trim(),
      subtitle: '1 min of 15 quoted · Walk-in Tenant',
      progress: 15,
      targetTable: walkInForm.targetTable || '9',
      planTag: 'Pro Plan',
    };
    setWaitlist((prev) => [newParty, ...prev]);
    setWalkInForm({ name: '', guests: 4, targetTable: '9' });
    setShowWalkInModal(false);
    if (onTriggerToast) {
      onTriggerToast(`Added ${newParty.name} to onboarding waitlist`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Top Header & 3 KPI Pills (Screenshot 2 Exact Layout) */}
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
              letterSpacing: '-0.02em',
              color: '#F8FAFC',
            }}
          >
            Floor
            <br />
            Plan
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
                fontSize: '15px',
              }}
            >
              👥
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px', fontWeight: 700, color: '#F8FAFC' }}>{fillPct}%</span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '2px 9px',
                    borderRadius: '999px',
                    background: '#25334A',
                    color: '#CBD5E1',
                  }}
                >
                  43 guests in
                </span>
              </div>
              <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '1px' }}>
                Seats & tenant slots filled
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
                fontSize: '15px',
              }}
            >
              🪑
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px', fontWeight: 700, color: '#F8FAFC' }}>{freeTablesCount}</span>
              </div>
              <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '1px' }}>
                Free tables · 16 seats
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
                fontSize: '15px',
              }}
            >
              ⏳
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px', fontWeight: 700, color: '#F8FAFC' }}>{waitlist.length}</span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 9px',
                    borderRadius: '999px',
                    background: '#EADCA6',
                    color: '#18181B',
                  }}
                >
                  longest 13 min
                </span>
              </div>
              <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '1px' }}>
                Parties waiting
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Architectural Blueprint Floor Plan Card */}
      <div
        style={{
          background: '#121B2D',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '22px',
          padding: '18px 22px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.35)',
        }}
      >
        {/* Card Header Bar */}
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
          <div style={{ fontSize: '15px', fontWeight: 600, color: '#F8FAFC' }}>
            {activeZone}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12.5px', color: '#64748B' }}>
              {currentTables.length} tables · {takenSeats} of {totalSeats} seats taken · {freeTablesCount} free
            </span>

            <div
              style={{
                display: 'inline-flex',
                background: '#0D1424',
                padding: '3px',
                borderRadius: '999px',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              {['Dining room', 'Terrace', 'Bar'].map((zone) => {
                const active = activeZone === zone;
                return (
                  <button
                    key={zone}
                    onClick={() => {
                      setActiveZone(zone);
                      const first = INITIAL_TABLES_BY_ZONE[zone]?.[0];
                      if (first) setSelectedTableId(first.id);
                    }}
                    style={{
                      padding: '5px 14px',
                      borderRadius: '999px',
                      border: 'none',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: active ? '#24324B' : 'transparent',
                      color: active ? '#F8FAFC' : '#64748B',
                      position: 'relative',
                    }}
                  >
                    {zone}
                    {zone === 'Terrace' && (
                      <span
                        style={{
                          display: 'inline-block',
                          width: '5px',
                          height: '5px',
                          borderRadius: '50%',
                          background: '#EADCA6',
                          marginLeft: '5px',
                          verticalAlign: 'middle',
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Blueprint Dotted Grid Canvas */}
        <div
          style={{
            position: 'relative',
            height: '450px',
            borderRadius: '16px',
            backgroundColor: '#131D31',
            backgroundImage: 'radial-gradient(rgba(148, 163, 184, 0.22) 1.25px, transparent 1.25px)',
            backgroundSize: '26px 26px',
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          {/* Architectural Perimeter Double-Line Walls */}
          <div
            style={{
              position: 'absolute',
              inset: '26px 28px 26px 28px',
              border: '3px double rgba(148, 163, 184, 0.28)',
              borderRadius: '6px',
              pointerEvents: 'none',
            }}
          />

          {/* Top Window Markers */}
          {[18, 38, 62, 82].map((leftPct) => (
            <div
              key={leftPct}
              style={{
                position: 'absolute',
                top: '24px',
                left: `${leftPct}%`,
                width: '68px',
                height: '6px',
                background: '#1E2D47',
                border: '1px solid rgba(148,163,184,0.35)',
                borderRadius: '3px',
              }}
            />
          ))}

          {/* Entrance Opening on Left Wall */}
          <div
            style={{
              position: 'absolute',
              left: '18px',
              top: '36%',
              height: '64px',
              width: '28px',
              background: '#131D31',
              display: 'flex',
              alignItems: 'center',
              paddingLeft: '14px',
              fontSize: '11px',
              color: '#64748B',
              letterSpacing: '0.02em',
            }}
          >
            Entrance
          </div>

          {/* Architectural Plant / Pillar Symbols */}
          {[
            { right: '38px', top: '42%' },
            { left: '62%', bottom: '36px' },
          ].map((pos, idx) => (
            <div
              key={idx}
              style={{
                position: 'absolute',
                ...pos,
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: '1.5px solid rgba(148,163,184,0.28)',
                background: 'rgba(15, 23, 42, 0.6)',
                display: 'grid',
                placeItems: 'center',
                color: 'rgba(148,163,184,0.45)',
                fontSize: '14px',
                pointerEvents: 'none',
              }}
            >
              ✳
            </div>
          ))}

          {/* PASS KITCHEN Bar on Bottom Right */}
          <div
            style={{
              position: 'absolute',
              right: '54px',
              bottom: '42px',
              width: '240px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(36, 50, 75, 0.85)',
              border: '1px solid rgba(148, 163, 184, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.16em',
              color: '#CBD5E1',
            }}
          >
            <span>PASS</span>
            <span style={{ color: '#94A3B8' }}>KITCHEN</span>
          </div>

          {/* Interactive Tables / Cluster Nodes */}
          {currentTables.map((table) => {
            const isSelected = selectedTable?.id === table.id;
            const visual = getTableVisualStyle(table, isSelected);
            const isCircle = table.shape.startsWith('circle');

            return (
              <div
                key={table.id}
                onClick={() => setSelectedTableId(table.id)}
                style={{
                  position: 'absolute',
                  left: `${table.x}%`,
                  top: `${table.y}%`,
                  transform: 'translate(-50%, -50%)',
                  width: `${table.w}px`,
                  height: `${table.h}px`,
                  borderRadius: isCircle ? '50%' : '18px',
                  background: visual.bg,
                  border: visual.border,
                  boxShadow: visual.shadow,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  zIndex: isSelected ? 20 : 5,
                }}
              >
                {/* Satellite Chair Dots around Table */}
                {table.chairs.includes('top') && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-13px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: visual.dotColor,
                      border: isSelected ? '1.5px solid #FFF7D6' : 'none',
                    }}
                  />
                )}
                {table.chairs.includes('bottom') && (
                  <span
                    style={{
                      position: 'absolute',
                      bottom: '-13px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: visual.dotColor,
                      border: isSelected ? '1.5px solid #FFF7D6' : 'none',
                    }}
                  />
                )}
                {table.chairs.includes('left') && (
                  <span
                    style={{
                      position: 'absolute',
                      left: '-13px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: visual.dotColor,
                      border: isSelected ? '1.5px solid #FFF7D6' : 'none',
                    }}
                  />
                )}
                {table.chairs.includes('right') && (
                  <span
                    style={{
                      position: 'absolute',
                      right: '-13px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: visual.dotColor,
                      border: isSelected ? '1.5px solid #FFF7D6' : 'none',
                    }}
                  />
                )}
                {table.chairs.includes('top-left') && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-13px',
                      left: '30%',
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: visual.dotColor,
                    }}
                  />
                )}
                {table.chairs.includes('top-right') && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-13px',
                      left: '66%',
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: visual.dotColor,
                    }}
                  />
                )}
                {table.chairs.includes('bottom-left') && (
                  <span
                    style={{
                      position: 'absolute',
                      bottom: '-13px',
                      left: '30%',
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: visual.dotColor,
                    }}
                  />
                )}
                {table.chairs.includes('bottom-right') && (
                  <span
                    style={{
                      position: 'absolute',
                      bottom: '-13px',
                      left: '66%',
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: visual.dotColor,
                    }}
                  />
                )}

                <span style={{ fontSize: '13px', fontWeight: 700, color: visual.text }}>
                  {table.number}
                </span>
                <span style={{ fontSize: '10.5px', fontWeight: 500, color: visual.subtext, marginTop: '2px' }}>
                  {table.timeLabel}
                </span>

                {/* Floating Butter-Cream Popover Badge on Selected Node (Exact Match to Screenshot 2 Table 12: "4 guests | Hugo Lam | Seat at table 12") */}
                {isSelected && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onTriggerToast) {
                        onTriggerToast(
                          `Table ${table.number} (${table.guestName || 'Hugo Lam'} · ${table.tenantBrand}) confirmed`
                        );
                      }
                    }}
                    style={{
                      position: 'absolute',
                      right: '58%',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      minWidth: '215px',
                      background: '#EFE2A8',
                      color: '#18181B',
                      borderRadius: '14px',
                      padding: '10px 14px',
                      boxShadow: '0 16px 34px rgba(0,0,0,0.48)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      border: '1px solid #FFFBEB',
                      zIndex: 30,
                    }}
                  >
                    <div
                      style={{
                        paddingRight: '10px',
                        borderRight: '1px solid rgba(24,24,27,0.15)',
                        textAlign: 'center',
                        lineHeight: 1.1,
                      }}
                    >
                      <div style={{ fontSize: '15px', fontWeight: 800 }}>{table.seats}</div>
                      <div style={{ fontSize: '9.5px', color: '#3F3F46', fontWeight: 600 }}>guests</div>
                    </div>
                    <div style={{ textAlign: 'left', flex: 1 }}>
                      <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#18181B', whiteSpace: 'nowrap' }}>
                        {table.guestName || 'Hugo Lam'}
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#3F3F46', whiteSpace: 'nowrap' }}>
                        Seat at table {table.number} · {table.tenantBrand}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend Strip Under Blueprint Canvas */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            marginTop: '14px',
            fontSize: '11.5px',
            color: '#64748B',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '9px', height: '9px', borderRadius: '50%', border: '1.5px solid #64748B' }} />
              Free
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#EADCA6' }} />
              Seated
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#EFA892' }} />
              Eating / Demo
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#BCE3D4' }} />
              Bill / Trial
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '9px', height: '9px', borderRadius: '50%', border: '1.5px dashed #64748B' }} />
              Reserved
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span>✓</span> Cleaning
            </span>
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span>🕒</span> Past the 90 min turn
          </div>
        </div>
      </div>

      {/* Bottom 2-Column Split: Waitlist (Left) & Arriving Soon (Right) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
          gap: '16px',
        }}
      >
        {/* Waitlist Card */}
        <div
          style={{
            background: '#121B2D',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '20px',
            padding: '18px 20px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '6px',
            }}
          >
            <span style={{ fontSize: '15px', fontWeight: 600, color: '#F8FAFC' }}>Waitlist</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '12px', color: '#64748B' }}>
                {waitlist.length} parties · {waitlist.reduce((a, b) => a + b.guests, 0)} guests
              </span>
              <button
                onClick={() => setShowWalkInModal((v) => !v)}
                style={{
                  background: '#F3A68F',
                  color: '#111827',
                  border: 'none',
                  borderRadius: '999px',
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                + Add walk-in
              </button>
            </div>
          </div>

          <div style={{ fontSize: '11.5px', color: '#64748B', marginBottom: '12px' }}>
            ← Click &quot;Seat at...&quot; or select a table node on the floor plan above
          </div>

          {showWalkInModal && (
            <form
              onSubmit={handleAddWalkIn}
              style={{
                background: '#182338',
                border: '1px solid rgba(243,166,143,0.35)',
                borderRadius: '14px',
                padding: '12px',
                marginBottom: '12px',
                display: 'grid',
                gridTemplateColumns: '1fr 80px 80px auto',
                gap: '8px',
              }}
            >
              <input
                type="text"
                placeholder="Guest / Tenant name..."
                value={walkInForm.name}
                onChange={(e) => setWalkInForm((p) => ({ ...p, name: e.target.value }))}
                style={{
                  background: '#0E1525',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  padding: '7px 10px',
                  color: '#F8FAFC',
                  fontSize: '12px',
                }}
              />
              <input
                type="number"
                min={1}
                max={12}
                value={walkInForm.guests}
                onChange={(e) => setWalkInForm((p) => ({ ...p, guests: e.target.value }))}
                style={{
                  background: '#0E1525',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  padding: '7px 8px',
                  color: '#F8FAFC',
                  fontSize: '12px',
                }}
              />
              <input
                type="text"
                placeholder="Table #"
                value={walkInForm.targetTable}
                onChange={(e) => setWalkInForm((p) => ({ ...p, targetTable: e.target.value }))}
                style={{
                  background: '#0E1525',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  padding: '7px 8px',
                  color: '#F8FAFC',
                  fontSize: '12px',
                }}
              />
              <button
                type="submit"
                style={{
                  background: '#BCE3D4',
                  color: '#0F172A',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0 12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Add
              </button>
            </form>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {waitlist.map((party) => (
              <div
                key={party.id}
                style={{
                  background: '#162136',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '14px',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                }}
              >
                <div
                  style={{
                    width: '44px',
                    height: '48px',
                    borderRadius: '10px',
                    background: '#1E2C46',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <span style={{ fontSize: '16px', fontWeight: 700, color: '#F8FAFC' }}>{party.guests}</span>
                  <span style={{ fontSize: '9.5px', color: '#94A3B8' }}>guests</span>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#F8FAFC' }}>{party.name}</div>
                  <div style={{ fontSize: '11.5px', color: '#64748B', marginBottom: '7px' }}>{party.subtitle}</div>

                  {/* Progress bar */}
                  <div
                    style={{
                      height: '4px',
                      borderRadius: '999px',
                      background: '#253451',
                      overflow: 'hidden',
                      marginBottom: '9px',
                    }}
                  >
                    <div
                      style={{
                        width: `${party.progress}%`,
                        height: '100%',
                        background: '#EADCA6',
                        borderRadius: '999px',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <button
                      onClick={() => handleSeatWaitlistParty(party)}
                      style={{
                        background: '#22304A',
                        color: '#E2E8F0',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '999px',
                        padding: '4px 12px',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      🪑 Seat at Table {party.targetTable}...
                    </button>

                    <button
                      onClick={() => setWaitlist((prev) => prev.filter((w) => w.id !== party.id))}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: '#1F2C44',
                        color: '#94A3B8',
                        border: 'none',
                        fontSize: '11px',
                        cursor: 'pointer',
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Arriving Soon Card */}
        <div
          style={{
            background: '#121B2D',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '20px',
            padding: '18px 20px',
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
            <span style={{ fontSize: '15px', fontWeight: 600, color: '#F8FAFC' }}>Arriving soon</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '12px', color: '#64748B' }}>20 guests</span>
              <span
                style={{
                  background: '#1C2942',
                  color: '#E2E8F0',
                  borderRadius: '999px',
                  padding: '5px 12px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                }}
              >
                Bookings
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {arriving.map((item, idx) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  padding: '12px 0',
                  borderBottom: idx < arriving.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                }}
              >
                <div style={{ width: '64px', fontSize: '12px', fontWeight: 700, color: '#CBD5E1', flexShrink: 0 }}>
                  {item.time}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#F8FAFC' }}>{item.name}</div>
                  <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>{item.details}</div>
                  {item.badge && (
                    <span
                      style={{
                        display: 'inline-block',
                        marginTop: '5px',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '10.5px',
                        fontWeight: 700,
                        background:
                          item.badgeTone === 'coral'
                            ? 'rgba(243, 166, 143, 0.18)'
                            : item.badgeTone === 'blue'
                            ? 'rgba(96, 165, 250, 0.18)'
                            : 'rgba(188, 227, 212, 0.18)',
                        color:
                          item.badgeTone === 'coral'
                            ? '#F3A68F'
                            : item.badgeTone === 'blue'
                            ? '#93C5FD'
                            : '#BCE3D4',
                      }}
                    >
                      ▲ {item.badge}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleSeatArrival(item)}
                  style={{
                    background: '#1E2C46',
                    color: '#F8FAFC',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '999px',
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  Seat
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom 4-Column Strip: Servers on the floor / Account Managers */}
      <div
        style={{
          background: '#121B2D',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '20px',
          padding: '16px 20px',
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
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#F8FAFC' }}>
            Servers on the floor · Account Managers
          </span>
          <span style={{ fontSize: '11.5px', color: '#64748B' }}>Click a server to highlight their section</span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '12px',
          }}
        >
          {SERVERS_FLOOR.map((srv) => (
            <div
              key={srv.name}
              style={{
                background: '#162136',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '14px',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: '#263654',
                      color: '#F3A68F',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: '12px',
                      fontWeight: 700,
                    }}
                  >
                    {srv.name[0]}
                  </div>
                  <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#F8FAFC' }}>{srv.name}</span>
                </div>

                {srv.isNext && (
                  <span
                    style={{
                      background: '#BCE3D4',
                      color: '#0F172A',
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '999px',
                    }}
                  >
                    Next to seat
                  </span>
                )}
              </div>

              <div style={{ fontSize: '11.5px', color: '#94A3B8' }}>
                {srv.tables} tables · {srv.guests} guests
              </div>

              <div
                style={{
                  height: '4px',
                  borderRadius: '999px',
                  background: '#23324D',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${srv.loadPct}%`,
                    height: '100%',
                    background: srv.loadColor,
                    borderRadius: '999px',
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                {srv.badges.map((b) => (
                  <span
                    key={b.label}
                    style={{
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontSize: '10.5px',
                      fontWeight: 700,
                      background: b.bg,
                      color: b.text,
                    }}
                  >
                    {b.label}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

