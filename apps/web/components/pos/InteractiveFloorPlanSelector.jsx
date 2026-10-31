'use client';

import { useState, useMemo } from 'react';

const DEFAULT_BLUEPRINT_NODES = {
  'Dining room': [
    { id: 't-1', number: '1', shape: 'circle', x: 11, y: 22, w: 74, h: 74, seats: 2, occupied: 2, timeLabel: '2/2 30m', status: 'eating', server: 'Ada', guestName: 'Ethan Brooks', orderSummary: '2x Beef Carpaccio', chairs: ['top', 'bottom'] },
    { id: 't-2', number: '2', shape: 'circle', x: 27, y: 22, w: 74, h: 74, seats: 2, occupied: 0, timeLabel: 'Free · 2p', status: 'free', server: 'Omar', guestName: null, orderSummary: 'Tersedia (2 Kursi)', chairs: ['top', 'bottom'] },
    { id: 't-3', number: '3', shape: 'square', x: 43, y: 20, w: 90, h: 90, seats: 4, occupied: 4, timeLabel: '4/4 52m', status: 'eating', server: 'Lucia', guestName: 'Hendra W.', orderSummary: '4x Paket Ayam Bakar', chairs: ['top', 'bottom', 'left', 'right'] },
    { id: 't-4', number: '4', shape: 'square', x: 61, y: 20, w: 90, h: 90, seats: 4, occupied: 0, timeLabel: 'Free · 4p', status: 'free', server: 'Omar', guestName: null, orderSummary: 'Tersedia (4 Kursi)', chairs: ['top', 'bottom', 'left', 'right'] },
    { id: 't-5', number: '5', shape: 'rect', x: 80, y: 22, w: 148, h: 76, seats: 6, occupied: 6, timeLabel: '6/6 1h15m', status: 'bill', server: 'Ada', guestName: 'Kevin Tan', orderSummary: '6x Ramen Spesial', chairs: ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'left', 'right'] },

    { id: 't-6', number: '6', shape: 'square', x: 12, y: 54, w: 90, h: 90, seats: 4, occupied: 4, timeLabel: '4/4 42m', status: 'bill', server: 'Ada', guestName: 'Nadia Putri', orderSummary: '4x Kopi Susu Aren', chairs: ['top', 'bottom', 'left', 'right'] },
    { id: 't-7', number: '7', shape: 'square', x: 29, y: 54, w: 90, h: 90, seats: 4, occupied: 4, timeLabel: '4/4 21m', status: 'eating', server: 'Elin', guestName: 'Yuki Tanaka', orderSummary: '2x Tagliatelle, 1x Pizza', chairs: ['top', 'bottom', 'left', 'right'] },
    { id: 't-8', number: '8', shape: 'circle', x: 47, y: 54, w: 74, h: 74, seats: 2, occupied: 2, timeLabel: '2/2 22m', status: 'eating', server: 'Elin', guestName: 'Nina B.', orderSummary: '1x Pizza Diavola', chairs: ['top', 'bottom'] },
    { id: 't-9', number: '9', shape: 'circle', x: 63, y: 54, w: 74, h: 74, seats: 2, occupied: 0, timeLabel: 'Free · 2p', status: 'free', server: 'Lucia', guestName: null, orderSummary: 'Tersedia (2 Kursi)', chairs: ['top', 'bottom'] },
    { id: 't-10', number: '10', shape: 'rect', x: 81, y: 54, w: 152, h: 78, seats: 6, occupied: 0, timeLabel: 'Free · 6p', status: 'free', server: 'Omar', guestName: null, orderSummary: 'Tersedia (6 Kursi)', chairs: ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'left', 'right'] },

    { id: 't-11', number: '11', shape: 'square', x: 22, y: 82, w: 90, h: 90, seats: 4, occupied: 4, timeLabel: '4/4 20m', status: 'seated', server: 'Elin', guestName: 'Budi Santoso', orderSummary: '4x Sate Ayam Senayan', chairs: ['top', 'bottom', 'left', 'right'] },
    { id: 't-12', number: '12', shape: 'square', x: 48, y: 82, w: 96, h: 96, seats: 4, occupied: 0, timeLabel: 'Free · 4p', status: 'free', server: 'Lucia', guestName: 'Hugo Lam', orderSummary: 'Siap Ditempati (4 Kursi)', chairs: ['top', 'bottom', 'left', 'right'] },
  ],
  Terrace: [
    { id: 't-21', number: 'T1', shape: 'square', x: 20, y: 30, w: 90, h: 90, seats: 4, occupied: 4, timeLabel: '4/4 11m', status: 'eating', server: 'Ada', guestName: 'Dian S.', orderSummary: '3x Nasi Goreng Spesial', chairs: ['top', 'bottom', 'left', 'right'] },
    { id: 't-22', number: 'T2', shape: 'circle', x: 45, y: 30, w: 76, h: 76, seats: 2, occupied: 0, timeLabel: 'Free · 2p', status: 'free', server: 'Elin', guestName: null, orderSummary: 'Tersedia (2 Kursi)', chairs: ['top', 'bottom'] },
    { id: 't-23', number: 'T3', shape: 'square', x: 72, y: 30, w: 90, h: 90, seats: 4, occupied: 4, timeLabel: '4/4 23m', status: 'bill', server: 'Lucia', guestName: 'Ramen Lovers', orderSummary: '4x Chicken Ramen', chairs: ['top', 'bottom', 'left', 'right'] },
    { id: 't-24', number: 'T4', shape: 'rect', x: 32, y: 72, w: 152, h: 78, seats: 6, occupied: 0, timeLabel: 'Free · 6p', status: 'free', server: 'Omar', guestName: null, orderSummary: 'Tersedia (6 Kursi)', chairs: ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'left', 'right'] },
    { id: 't-25', number: 'T5', shape: 'square', x: 70, y: 72, w: 92, h: 92, seats: 4, occupied: 0, timeLabel: 'Free · 4p', status: 'free', server: 'Ada', guestName: null, orderSummary: 'Tersedia (4 Kursi)', chairs: ['top', 'bottom', 'left', 'right'] },
  ],
  Bar: [
    { id: 't-31', number: 'B1', shape: 'circle', x: 22, y: 40, w: 76, h: 76, seats: 2, occupied: 0, timeLabel: 'Free · 2p', status: 'free', server: 'Ada', guestName: null, orderSummary: 'Tersedia (2 Kursi)', chairs: ['top', 'bottom'] },
    { id: 't-32', number: 'B2', shape: 'circle', x: 48, y: 40, w: 76, h: 76, seats: 2, occupied: 2, timeLabel: '2/2 19m', status: 'seated', server: 'Elin', guestName: 'Lucy H.', orderSummary: '2x Espresso Martini', chairs: ['top', 'bottom'] },
    { id: 't-33', number: 'B3', shape: 'square', x: 75, y: 40, w: 90, h: 90, seats: 4, occupied: 0, timeLabel: 'Free · 4p', status: 'free', server: 'Lucia', guestName: null, orderSummary: 'Tersedia (4 Kursi)', chairs: ['top', 'bottom', 'left', 'right'] },
    { id: 't-34', number: 'B4', shape: 'square', x: 48, y: 76, w: 92, h: 92, seats: 4, occupied: 4, timeLabel: '4/4 14m', status: 'eating', server: 'Omar', guestName: 'Rina G.', orderSummary: '2x Saffron Arancini', chairs: ['top', 'bottom', 'left', 'right'] },
  ],
};

const INITIAL_WAITLIST_PARTIES = [
  { id: 'wl-1', guests: 2, name: 'Ethan Brooks', note: '13 min of 15 quoted · Dine-in', progress: 84, preferredTable: '2' },
  { id: 'wl-2', guests: 4, name: 'Hugo Lam', note: '6 min of 20 quoted · Table 12', progress: 45, preferredTable: '12' },
  { id: 'wl-3', guests: 6, name: 'Keluarga Priya Shah', note: '3 min of 15 quoted · Meja Besar', progress: 25, preferredTable: '10' },
];

const INITIAL_ARRIVALS = [
  { id: 'ar-1', time: '19:00', name: 'Priya Shah', guests: 6, tableNumber: '10', note: 'Meja Keluarga · Ulang Tahun', badge: 'Nuts allergy', tone: 'coral' },
  { id: 'ar-2', time: '19:15', name: 'Tom Okafor', guests: 2, tableNumber: '2', note: 'Couple Dinner', badge: null, tone: null },
  { id: 'ar-3', time: '19:30', name: 'Yara Haddad', guests: 4, tableNumber: '4', note: 'VIP Window Seat', badge: 'Less Sugar', tone: 'blue' },
  { id: 'ar-4', time: '19:45', name: 'Sofia Petrov', guests: 2, tableNumber: '9', note: 'Menu Vegetarian', badge: 'Vegetarian', tone: 'mint' },
];

export default function InteractiveFloorPlanSelector({
  tables = [],
  selectedTableId = '',
  onSelectTable,
  guestCount = 4,
  onGuestCountChange,
  compact = false,
  customerName = '',
  onCustomerNameChange,
  onConfirmAndProceed,
  showWaitlistAndServers = true,
  onTriggerToast,
}) {
  const [activeZone, setActiveZone] = useState('Dining room');
  const [nodesByZone, setNodesByZone] = useState(DEFAULT_BLUEPRINT_NODES);
  const [waitlist, setWaitlist] = useState(INITIAL_WAITLIST_PARTIES);
  const [arrivals, setArrivals] = useState(INITIAL_ARRIVALS);
  const [draggedParty, setDraggedParty] = useState(null);
  const [dragOverNodeId, setDragOverNodeId] = useState(null);
  const [localSelectedNumber, setLocalSelectedNumber] = useState('12');
  const [walkInName, setWalkInName] = useState('');
  const [walkInGuests, setWalkInGuests] = useState(4);
  const [showAddWalkIn, setShowAddWalkIn] = useState(false);

  // Merge live DB dining_tables with our architectural blueprint nodes so clicking a blueprint node selects the real DB table_id if present!
  const zoneNodes = useMemo(() => {
    const base = nodesByZone[activeZone] || [];
    return base.map((node, index) => {
      const matchedDbTable =
        tables.find(
          (t) =>
            String(t.table_number).toLowerCase() === String(node.number).toLowerCase() ||
            String(t.id) === String(node.number)
        ) || tables[index];

      const dbBusy =
        matchedDbTable &&
        (Number(matchedDbTable.active_orders || 0) > 0 ||
          Number(matchedDbTable.active_order_count || 0) > 0 ||
          Number(matchedDbTable.active_session_count || 0) > 0);

      const effectiveStatus = dbBusy && node.status === 'free' ? 'eating' : node.status;
      const isSelected =
        (selectedTableId && matchedDbTable && String(matchedDbTable.id) === String(selectedTableId)) ||
        (!selectedTableId && String(localSelectedNumber) === String(node.number));

      // Check if table capacity fits the requested guestCount
      const fitsCapacity = Number(node.seats) >= Number(guestCount || 1);
      const isRecommended =
        effectiveStatus === 'free' &&
        fitsCapacity &&
        Number(node.seats) - Number(guestCount || 1) <= 2;

      return {
        ...node,
        dbTableId: matchedDbTable ? matchedDbTable.id : node.number,
        dbTableName: matchedDbTable?.table_name || `Meja ${node.number}`,
        status: effectiveStatus,
        isSelected,
        fitsCapacity,
        isRecommended,
      };
    });
  }, [activeZone, nodesByZone, tables, selectedTableId, localSelectedNumber, guestCount]);

  const activeNode =
    zoneNodes.find((n) => n.isSelected) ||
    zoneNodes.find((n) => String(n.number) === String(localSelectedNumber)) ||
    zoneNodes[zoneNodes.length - 1];

  const totalSeats = zoneNodes.reduce((s, n) => s + n.seats, 0);
  const occupiedSeats = zoneNodes.reduce((s, n) => s + (n.status === 'free' ? 0 : n.occupied || n.seats), 0);
  const freeTablesCount = zoneNodes.filter((n) => n.status === 'free').length;
  const capacityPct = totalSeats > 0 ? Math.round((occupiedSeats / totalSeats) * 100) : 54;

  const handleSelectNode = (node) => {
    setLocalSelectedNumber(node.number);
    if (onSelectTable) {
      onSelectTable(node.dbTableId, node);
    }
    if (onTriggerToast) {
      onTriggerToast(
        `Meja ${node.number} (${node.seats} Kursi · ${activeZone}) dipilih untuk ${
          customerName || node.guestName || `${guestCount} Tamu`
        }`
      );
    }
  };

  // Drag & Drop handlers for seating a party or current order onto a table node
  const handleDragStartParty = (e, party) => {
    setDraggedParty(party);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify(party));
  };

  const handleDragOverNode = (e, node) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverNodeId !== node.id) {
      setDragOverNodeId(node.id);
    }
  };

  const handleDropOnNode = (e, node) => {
    e.preventDefault();
    setDragOverNodeId(null);

    const party = draggedParty;
    if (!party) return;

    setNodesByZone((prev) => ({
      ...prev,
      [activeZone]: prev[activeZone].map((n) =>
        n.id === node.id
          ? {
              ...n,
              status: 'seated',
              occupied: Math.min(party.guests, n.seats),
              guestName: party.name,
              timeLabel: `${Math.min(party.guests, n.seats)}/${n.seats} Baru`,
              orderSummary: `${party.guests} Tamu · Aktif`,
            }
          : n
      ),
    }));

    setLocalSelectedNumber(node.number);
    if (onSelectTable) onSelectTable(node.dbTableId, node);
    if (onCustomerNameChange && party.name) onCustomerNameChange(party.name);
    if (onGuestCountChange && party.guests) onGuestCountChange(party.guests);

    if (party.id?.startsWith('wl-')) {
      setWaitlist((prev) => prev.filter((w) => w.id !== party.id));
    } else if (party.id?.startsWith('ar-')) {
      setArrivals((prev) => prev.filter((a) => a.id !== party.id));
    }

    setDraggedParty(null);
    if (onTriggerToast) {
      onTriggerToast(`✓ ${party.name} (${party.guests} orang) ditempatkan di Meja ${node.number}`);
    }
  };

  const seatPartyDirectly = (party, targetTableNumber) => {
    const targetNode =
      zoneNodes.find((n) => String(n.number) === String(targetTableNumber)) ||
      zoneNodes.find((n) => n.status === 'free' && n.seats >= party.guests) ||
      zoneNodes.find((n) => n.status === 'free') ||
      activeNode;

    if (!targetNode) return;

    setNodesByZone((prev) => ({
      ...prev,
      [activeZone]: prev[activeZone].map((n) =>
        n.id === targetNode.id
          ? {
              ...n,
              status: 'seated',
              occupied: Math.min(party.guests, n.seats),
              guestName: party.name,
              timeLabel: `${Math.min(party.guests, n.seats)}/${n.seats} 1m`,
            }
          : n
      ),
    }));

    setLocalSelectedNumber(targetNode.number);
    if (onSelectTable) onSelectTable(targetNode.dbTableId, targetNode);
    if (onCustomerNameChange && party.name) onCustomerNameChange(party.name);
    if (onGuestCountChange && party.guests) onGuestCountChange(party.guests);

    setWaitlist((prev) => prev.filter((w) => w.id !== party.id));
    setArrivals((prev) => prev.filter((a) => a.id !== party.id));

    if (onTriggerToast) {
      onTriggerToast(`✓ ${party.name} (${party.guests} tamu) duduk di Meja ${targetNode.number}`);
    }
  };

  const handleAddWalkInSubmit = (e) => {
    e.preventDefault();
    if (!walkInName.trim()) return;
    const newWl = {
      id: `wl-${Date.now()}`,
      guests: Number(walkInGuests || 2),
      name: walkInName.trim(),
      note: 'Baru masuk · Menunggu meja',
      progress: 18,
      preferredTable: '12',
    };
    setWaitlist((prev) => [newWl, ...prev]);
    setWalkInName('');
    setShowAddWalkIn(false);
    if (onTriggerToast) {
      onTriggerToast(`Ditambahkan ke antrean meja: ${newWl.name} (${newWl.guests} orang)`);
    }
  };

  const getNodeStyle = (node) => {
    const isDropTarget = dragOverNodeId === node.id;
    if (node.isSelected || isDropTarget) {
      return {
        bg: '#EFE2A8',
        border: '2px solid #FFFBEB',
        text: '#18181B',
        subtext: '#3F3F46',
        shadow: '0 0 36px rgba(239, 226, 168, 0.6), 0 12px 26px rgba(0,0,0,0.45)',
        dotColor: '#EFE2A8',
      };
    }
    if (node.isRecommended) {
      return {
        bg: 'rgba(188, 227, 212, 0.22)',
        border: '2px solid #9CE2C6',
        text: '#F8FAFC',
        subtext: '#9CE2C6',
        shadow: '0 0 22px rgba(156, 226, 198, 0.25)',
        dotColor: '#9CE2C6',
      };
    }
    switch (node.status) {
      case 'eating':
        return {
          bg: 'rgba(109, 89, 106, 0.75)',
          border: '1.5px solid rgba(239, 168, 146, 0.38)',
          text: '#F8FAFC',
          subtext: '#CBD5E1',
          shadow: '0 8px 20px rgba(0,0,0,0.28)',
          dotColor: '#8B6F85',
        };
      case 'bill':
        return {
          bg: 'rgba(77, 109, 114, 0.78)',
          border: '1.5px solid rgba(188, 227, 212, 0.4)',
          text: '#F8FAFC',
          subtext: '#CFE9DF',
          shadow: '0 8px 20px rgba(0,0,0,0.28)',
          dotColor: '#69949A',
        };
      case 'seated':
        return {
          bg: 'rgba(110, 106, 99, 0.82)',
          border: '1.5px solid rgba(234, 220, 166, 0.4)',
          text: '#F8FAFC',
          subtext: '#E2E8F0',
          shadow: '0 8px 20px rgba(0,0,0,0.28)',
          dotColor: '#8C857B',
        };
      default:
        return {
          bg: 'rgba(20, 30, 50, 0.72)',
          border: node.fitsCapacity
            ? '1.5px dashed rgba(234, 220, 166, 0.45)'
            : '1.5px dashed rgba(148, 163, 184, 0.22)',
          text: node.fitsCapacity ? '#F8FAFC' : '#64748B',
          subtext: node.fitsCapacity ? '#EADCA6' : '#475569',
          shadow: 'none',
          dotColor: node.fitsCapacity ? '#475569' : '#1E293B',
        };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? '12px' : '16px' }}>
      {/* Top Capacity & Guest Filter Strip */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          background: '#131C2E',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '18px',
          padding: compact ? '10px 14px' : '12px 18px',
        }}
      >
        {/* Left: Capacity Selector Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#94A3B8', marginRight: '4px' }}>
            👥 Kapasitas Tamu:
          </span>
          {[
            { count: 0, label: '🛍️ Takeaway / Tanpa Meja' },
            { count: 2, label: '2 Orang (Meja Kecil)' },
            { count: 4, label: '4 Orang (Meja Reguler)' },
            { count: 6, label: '6+ Orang (Meja Keluarga)' },
          ].map((opt) => {
            const active =
              opt.count === 0
                ? !selectedTableId && localSelectedNumber === ''
                : Number(guestCount) === opt.count;
            return (
              <button
                key={opt.label}
                type="button"
                onClick={() => {
                  if (opt.count === 0) {
                    setLocalSelectedNumber('');
                    onSelectTable?.('');
                    onGuestCountChange?.(0);
                  } else {
                    onGuestCountChange?.(opt.count);
                    const matchingFree = zoneNodes.find(
                      (n) => n.status === 'free' && n.seats >= opt.count
                    );
                    if (matchingFree) {
                      handleSelectNode(matchingFree);
                    }
                  }
                }}
                style={{
                  padding: '6px 13px',
                  borderRadius: '999px',
                  border: active ? '1px solid #F3A68F' : '1px solid rgba(255,255,255,0.08)',
                  background: active ? '#F3A68F' : '#1A263D',
                  color: active ? '#0F172A' : '#CBD5E1',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Right: Quick Guest Name Input & Status Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {onCustomerNameChange && (
            <input
              type="text"
              placeholder="Nama Pemesan / Tamu (opsional)..."
              value={customerName}
              onChange={(e) => onCustomerNameChange(e.target.value)}
              style={{
                background: '#0D1424',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '999px',
                padding: '6px 14px',
                color: '#F8FAFC',
                fontSize: '12px',
                minWidth: '190px',
                outline: 'none',
              }}
            />
          )}

          <div
            style={{
              background: '#1B2840',
              border: '1px solid rgba(239, 226, 168, 0.35)',
              color: '#EFE2A8',
              borderRadius: '999px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 700,
            }}
          >
            {localSelectedNumber
              ? `🪑 Meja ${localSelectedNumber} Dipilih (${activeNode?.seats || 4} Kursi)`
              : '🛍️ Mode Takeaway / Tanpa Meja'}
          </div>
        </div>
      </div>

      {/* Main Architectural Blueprint Floor Plan Card */}
      <div
        style={{
          background: '#121B2D',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '22px',
          padding: compact ? '14px 16px' : '18px 22px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.35)',
        }}
      >
        {/* Blueprint Header Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            marginBottom: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#F8FAFC' }}>{activeZone}</span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 9px',
                borderRadius: '999px',
                background: '#24324B',
                color: '#9CE2C6',
              }}
            >
              {capacityPct}% Terisi · {freeTablesCount} Meja Kosong
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', color: '#64748B' }}>
              {zoneNodes.length} meja · {occupiedSeats} dari {totalSeats} kursi terisi
            </span>

            {/* Area Switcher: Dining room | Terrace | Bar */}
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
                    type="button"
                    onClick={() => setActiveZone(zone)}
                    style={{
                      padding: '5px 13px',
                      borderRadius: '999px',
                      border: 'none',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: active ? '#F3A68F' : 'transparent',
                      color: active ? '#0F172A' : '#94A3B8',
                    }}
                  >
                    {zone}
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
            height: compact ? '350px' : '430px',
            borderRadius: '16px',
            backgroundColor: '#131D31',
            backgroundImage: 'radial-gradient(rgba(148, 163, 184, 0.22) 1.25px, transparent 1.25px)',
            backgroundSize: '24px 24px',
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {/* Perimeter Architectural Walls */}
          <div
            style={{
              position: 'absolute',
              inset: '20px 22px',
              border: '3px double rgba(148, 163, 184, 0.28)',
              borderRadius: '6px',
              pointerEvents: 'none',
            }}
          />

          {/* Entrance Label */}
          <div
            style={{
              position: 'absolute',
              left: '14px',
              top: '36%',
              height: '56px',
              width: '28px',
              background: '#131D31',
              display: 'flex',
              alignItems: 'center',
              paddingLeft: '10px',
              fontSize: '10.5px',
              color: '#64748B',
            }}
          >
            Entrance
          </div>

          {/* PASS KITCHEN Bar on Bottom Right */}
          <div
            style={{
              position: 'absolute',
              right: '42px',
              bottom: '32px',
              width: compact ? '190px' : '230px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(36, 50, 75, 0.88)',
              border: '1px solid rgba(148, 163, 184, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              fontSize: '10.5px',
              fontWeight: 700,
              letterSpacing: '0.15em',
              color: '#CBD5E1',
            }}
          >
            <span>PASS</span>
            <span style={{ color: '#94A3B8' }}>KITCHEN</span>
          </div>

          {/* Render Interactive Table Nodes */}
          {zoneNodes.map((node) => {
            const style = getNodeStyle(node);
            const isCircle = node.shape === 'circle';
            const scaleFactor = compact ? 0.86 : 1;

            return (
              <div
                key={node.id}
                onClick={() => handleSelectNode(node)}
                onDragOver={(e) => handleDragOverNode(e, node)}
                onDragLeave={() => setDragOverNodeId(null)}
                onDrop={(e) => handleDropOnNode(e, node)}
                style={{
                  position: 'absolute',
                  left: `${node.x}%`,
                  top: `${node.y}%`,
                  transform: 'translate(-50%, -50%)',
                  width: `${Math.round(node.w * scaleFactor)}px`,
                  height: `${Math.round(node.h * scaleFactor)}px`,
                  borderRadius: isCircle ? '50%' : '18px',
                  background: style.bg,
                  border: style.border,
                  boxShadow: style.shadow,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  zIndex: node.isSelected ? 25 : 5,
                }}
              >
                {/* Satellite Chair Dots */}
                {node.chairs.includes('top') && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-11px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '9px',
                      height: '9px',
                      borderRadius: '50%',
                      background: style.dotColor,
                    }}
                  />
                )}
                {node.chairs.includes('bottom') && (
                  <span
                    style={{
                      position: 'absolute',
                      bottom: '-11px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '9px',
                      height: '9px',
                      borderRadius: '50%',
                      background: style.dotColor,
                    }}
                  />
                )}
                {node.chairs.includes('left') && (
                  <span
                    style={{
                      position: 'absolute',
                      left: '-11px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '9px',
                      height: '9px',
                      borderRadius: '50%',
                      background: style.dotColor,
                    }}
                  />
                )}
                {node.chairs.includes('right') && (
                  <span
                    style={{
                      position: 'absolute',
                      right: '-11px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '9px',
                      height: '9px',
                      borderRadius: '50%',
                      background: style.dotColor,
                    }}
                  />
                )}
                {node.chairs.includes('top-left') && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-11px',
                      left: '30%',
                      width: '9px',
                      height: '9px',
                      borderRadius: '50%',
                      background: style.dotColor,
                    }}
                  />
                )}
                {node.chairs.includes('top-right') && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-11px',
                      left: '66%',
                      width: '9px',
                      height: '9px',
                      borderRadius: '50%',
                      background: style.dotColor,
                    }}
                  />
                )}
                {node.chairs.includes('bottom-left') && (
                  <span
                    style={{
                      position: 'absolute',
                      bottom: '-11px',
                      left: '30%',
                      width: '9px',
                      height: '9px',
                      borderRadius: '50%',
                      background: style.dotColor,
                    }}
                  />
                )}
                {node.chairs.includes('bottom-right') && (
                  <span
                    style={{
                      position: 'absolute',
                      bottom: '-11px',
                      left: '66%',
                      width: '9px',
                      height: '9px',
                      borderRadius: '50%',
                      background: style.dotColor,
                    }}
                  />
                )}

                <span style={{ fontSize: '13px', fontWeight: 800, color: style.text }}>
                  {node.number}
                </span>
                <span style={{ fontSize: '10px', fontWeight: 600, color: style.subtext, marginTop: '1px' }}>
                  {node.timeLabel}
                </span>

                {/* Floating Butter-Cream Popover on Selected Table (Exact Match to Screenshot 2) */}
                {node.isSelected && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onConfirmAndProceed) onConfirmAndProceed(node);
                    }}
                    style={{
                      position: 'absolute',
                      right: node.x > 40 ? '58%' : 'auto',
                      left: node.x <= 40 ? '58%' : 'auto',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      minWidth: '205px',
                      background: '#EFE2A8',
                      color: '#18181B',
                      borderRadius: '14px',
                      padding: '9px 13px',
                      boxShadow: '0 16px 34px rgba(0,0,0,0.52)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      border: '1.5px solid #FFFBEB',
                      zIndex: 35,
                    }}
                  >
                    <div
                      style={{
                        paddingRight: '9px',
                        borderRight: '1px solid rgba(24,24,27,0.16)',
                        textAlign: 'center',
                        lineHeight: 1.1,
                      }}
                    >
                      <div style={{ fontSize: '15px', fontWeight: 900 }}>{guestCount || node.seats}</div>
                      <div style={{ fontSize: '9px', color: '#3F3F46', fontWeight: 700 }}>guests</div>
                    </div>
                    <div style={{ textAlign: 'left', flex: 1 }}>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: '#18181B', whiteSpace: 'nowrap' }}>
                        {customerName || node.guestName || 'Tamu Kasir POS'}
                      </div>
                      <div style={{ fontSize: '10px', color: '#3F3F46', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        Seat at table {node.number} ({node.seats} kursi)
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
            gap: '10px',
            marginTop: '12px',
            fontSize: '11px',
            color: '#64748B',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '9px', height: '9px', borderRadius: '50%', border: '1.5px dashed #EADCA6' }} />
              Free (Sesuai Kapasitas)
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#9CE2C6' }} />
              Rekomendasi Pas
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#EFE2A8' }} />
              Meja Dipilih
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#EFA892' }} />
              Sedang Makan / Dimasak
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#BCE3D4' }} />
              Siap Bayar / Bill
            </span>
          </div>

          <span style={{ color: '#94A3B8', fontWeight: 500 }}>
            💡 Klik meja pada denah atau tarik (drag & drop) tamu dari daftar tunggu ke meja
          </span>
        </div>
      </div>

      {/* Optional Bottom Waitlist & Arriving Soon Panels with Drag-and-Drop */}
      {showWaitlistAndServers && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '16px',
          }}
        >
          {/* Left: Draggable Waitlist */}
          <div
            style={{
              background: '#121B2D',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '20px',
              padding: '16px 18px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '14.5px', fontWeight: 700, color: '#F8FAFC' }}>Waitlist · Antrean Meja</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '11.5px', color: '#64748B' }}>
                  {waitlist.length} parties · {waitlist.reduce((a, b) => a + b.guests, 0)} guests
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddWalkIn((v) => !v)}
                  style={{
                    background: '#F3A68F',
                    color: '#0F172A',
                    border: 'none',
                    borderRadius: '999px',
                    padding: '5px 12px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  + Add walk-in
                </button>
              </div>
            </div>

            <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '12px' }}>
              ✋ Tarik (drag) kartu tamu di bawah langsung ke meja kosong di atas, atau klik &quot;Seat at...&quot;
            </div>

            {showAddWalkIn && (
              <form
                onSubmit={handleAddWalkInSubmit}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 80px auto',
                  gap: '8px',
                  marginBottom: '12px',
                  background: '#18243A',
                  padding: '10px',
                  borderRadius: '12px',
                }}
              >
                <input
                  type="text"
                  placeholder="Nama tamu walk-in..."
                  value={walkInName}
                  onChange={(e) => setWalkInName(e.target.value)}
                  style={{
                    background: '#0D1424',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    color: '#F8FAFC',
                    fontSize: '12px',
                  }}
                />
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={walkInGuests}
                  onChange={(e) => setWalkInGuests(e.target.value)}
                  style={{
                    background: '#0D1424',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '8px',
                    padding: '6px 8px',
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
                  Tambah
                </button>
              </form>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {waitlist.map((party) => (
                <div
                  key={party.id}
                  draggable
                  onDragStart={(e) => handleDragStartParty(e, party)}
                  onDragEnd={() => {
                    setDraggedParty(null);
                    setDragOverNodeId(null);
                  }}
                  style={{
                    background: '#162136',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '14px',
                    padding: '11px 13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'grab',
                  }}
                >
                  <div
                    style={{
                      width: '42px',
                      height: '46px',
                      borderRadius: '10px',
                      background: '#1E2C46',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ fontSize: '15px', fontWeight: 800, color: '#F8FAFC' }}>{party.guests}</span>
                    <span style={{ fontSize: '9px', color: '#94A3B8' }}>guests</span>
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#F8FAFC' }}>{party.name}</span>
                      <span style={{ fontSize: '11px', color: '#64748B' }}>⋮⋮ Drag</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '6px' }}>{party.note}</div>
                    <div
                      style={{
                        height: '4px',
                        borderRadius: '999px',
                        background: '#23324D',
                        overflow: 'hidden',
                        marginBottom: '8px',
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
                    <button
                      type="button"
                      onClick={() => seatPartyDirectly(party, party.preferredTable)}
                      style={{
                        background: '#22304A',
                        color: '#EADCA6',
                        border: '1px solid rgba(234,220,166,0.25)',
                        borderRadius: '999px',
                        padding: '4px 12px',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      🪑 Seat at Table {party.preferredTable}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Arriving Soon Reservations */}
          <div
            style={{
              background: '#121B2D',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '20px',
              padding: '16px 18px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '14.5px', fontWeight: 700, color: '#F8FAFC' }}>Arriving soon · Reservasi</span>
              <span
                style={{
                  background: '#1C2942',
                  color: '#CBD5E1',
                  borderRadius: '999px',
                  padding: '4px 12px',
                  fontSize: '11px',
                  fontWeight: 600,
                }}
              >
                {arrivals.reduce((a, b) => a + b.guests, 0)} guests
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {arrivals.map((item, idx) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStartParty(e, item)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    padding: '10px 0',
                    borderBottom: idx < arrivals.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                    cursor: 'grab',
                  }}
                >
                  <div style={{ width: '52px', fontSize: '12px', fontWeight: 700, color: '#EADCA6' }}>
                    {item.time}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#F8FAFC' }}>{item.name}</div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>
                      {item.guests} guests · Table {item.tableNumber} · {item.note}
                    </div>
                    {item.badge && (
                      <span
                        style={{
                          display: 'inline-block',
                          marginTop: '4px',
                          padding: '1px 7px',
                          borderRadius: '6px',
                          fontSize: '10px',
                          fontWeight: 700,
                          background: 'rgba(243,166,143,0.16)',
                          color: '#F3A68F',
                        }}
                      >
                        ▲ {item.badge}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => seatPartyDirectly(item, item.tableNumber)}
                    style={{
                      background: '#1E2C46',
                      color: '#F8FAFC',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '999px',
                      padding: '5px 13px',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Seat
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

