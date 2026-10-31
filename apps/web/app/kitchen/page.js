'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import AuthGuard from '@/components/ui/AuthGuard';
import { getCustomerOrders, updateCustomerOrderStatus, getPublicDiningTables } from '@/lib/api';
import { playOrderNotificationSound, playCheckoutSuccessSound } from '@/lib/soundNotification';
import { useAuthStore } from '@/store/authStore';
import InteractiveFloorPlanSelector from '@/components/pos/InteractiveFloorPlanSelector';

const DEFAULT_KITCHEN_TICKETS = [
  // Column 1: NEW (Warm Butter Cream `#EADCA6`)
  {
    id: 'k-1069',
    ticket_number: '#1069',
    table_label: 'Table 1',
    guest_name: 'Hendra W.',
    channel: 'Dine-in',
    station: 'Hot Kitchen',
    stage: 'accepted', // maps to 'New'
    elapsed_mins: 4,
    price_rp: 140000,
    price_usd: 70,
    alert_badge: 'Well done',
    items: ['1x Beef carpaccio', '1x Pizza Margherita', '2x Negroni', '1x Tiramisu'],
    payment_status: 'Paid',
    avatar: 'T1',
    isDemo: true,
  },
  {
    id: 'k-1070',
    ticket_number: '#1070',
    table_label: 'Table B1',
    guest_name: 'Nadia P.',
    channel: 'Dine-in',
    station: 'Pasta & Grill',
    stage: 'accepted',
    elapsed_mins: 3,
    price_rp: 120000,
    price_usd: 60,
    alert_badge: null,
    items: ['1x Cacio e pepe', '1x Burrata & heirloom tom.', '2x Aperol spritz'],
    payment_status: 'Paid',
    avatar: 'B1',
    isDemo: true,
  },
  {
    id: 'k-1071',
    ticket_number: '#1071',
    table_label: 'Nina B.',
    guest_name: 'Nina B.',
    channel: 'Takeaway',
    station: 'Pizza Oven',
    stage: 'accepted',
    elapsed_mins: 2,
    price_rp: 64000,
    price_usd: 32,
    alert_badge: null,
    items: ['1x Pizza Diavola', '1x Negroni'],
    payment_status: 'Paid',
    avatar: 'NB',
    isDemo: true,
  },
  {
    id: 'k-1072',
    ticket_number: '#1072',
    table_label: 'Table 11',
    guest_name: 'Budi S.',
    channel: 'Dine-in',
    station: 'Hot Kitchen',
    stage: 'accepted',
    elapsed_mins: 1,
    price_rp: 184000,
    price_usd: 92,
    alert_badge: 'No onions',
    items: ['1x Pizza Margherita', '2x Tagliatelle al ragu', '1x Saffron arancini', '2x Montepulciano, glass'],
    payment_status: 'Unpaid',
    avatar: '11',
    isDemo: true,
  },

  // Column 2: COOKING (Warm Peach `#EFA892`)
  {
    id: 'k-1063',
    ticket_number: '#1063',
    table_label: 'Table T5',
    guest_name: 'Kevin Tan',
    channel: 'Dine-in',
    station: 'Hot Kitchen',
    stage: 'preparing', // maps to 'Cooking'
    elapsed_mins: 18,
    price_rp: 370000,
    price_usd: 185,
    alert_badge: null,
    items: [
      '2x Cacio e pepe',
      '1x Beef carpaccio',
      '1x Pizza Margherita',
      '1x Tomato bruschetta',
      '1x Grilled branzino',
      '+2 more items',
    ],
    payment_status: 'Paid',
    avatar: 'T5',
    isDemo: true,
  },
  {
    id: 'k-1064',
    ticket_number: '#1064',
    table_label: 'Table B4',
    guest_name: 'Rina G.',
    channel: 'Dine-in',
    station: 'Pasta & Grill',
    stage: 'preparing',
    elapsed_mins: 14,
    price_rp: 106000,
    price_usd: 53,
    alert_badge: null,
    items: ['1x Saffron arancini', '2x Tagliatelle al ragu'],
    payment_status: 'Paid',
    avatar: 'B4',
    isDemo: true,
  },
  {
    id: 'k-1065',
    ticket_number: '#1065',
    table_label: 'Table T1',
    guest_name: 'Dian S.',
    channel: 'Dine-in',
    station: 'Pizza Oven',
    stage: 'preparing',
    elapsed_mins: 11,
    price_rp: 118000,
    price_usd: 59,
    alert_badge: null,
    items: ['1x Cacio e pepe', '1x Pizza Margherita', '2x Aperol spritz'],
    payment_status: 'Paid',
    avatar: 'T1',
    isDemo: true,
  },
  {
    id: 'k-1067',
    ticket_number: '#1067',
    table_label: 'Ben C.',
    guest_name: 'Ben C.',
    channel: 'Delivery',
    station: 'Pasta & Grill',
    stage: 'preparing',
    elapsed_mins: 9,
    price_rp: 86000,
    price_usd: 43,
    alert_badge: 'Allergy: nuts',
    items: ['1x Tagliatelle al ragu', '1x Montepulciano, glass', '1x Tiramisu'],
    payment_status: 'Paid',
    avatar: 'BC',
    isDemo: true,
  },

  // Column 3: READY (Soft Mint `#BCE3D4`)
  {
    id: 'k-1062',
    ticket_number: '#1062',
    table_label: 'Table 7',
    guest_name: 'Yuki Tanaka',
    channel: 'Dine-in',
    station: 'Hot Kitchen',
    stage: 'ready', // maps to 'Ready'
    elapsed_mins: 21,
    price_rp: 254000,
    price_usd: 127,
    alert_badge: null,
    items: ['2x Tagliatelle al ragu', '1x Pizza Margherita', '1x Cacio e pepe', '4x Aperol spritz'],
    payment_status: 'Paid',
    avatar: 'T7',
    isDemo: true,
  },
  {
    id: 'k-1061',
    ticket_number: '#1061',
    table_label: 'Table T3',
    guest_name: 'Hugo Lam',
    channel: 'Dine-in',
    station: 'Pizza Oven',
    stage: 'ready',
    elapsed_mins: 23,
    price_rp: 118000,
    price_usd: 59,
    alert_badge: null,
    items: ['1x Pizza Margherita', '2x Negroni'],
    payment_status: 'Paid',
    avatar: 'T3',
    isDemo: true,
  },
  {
    id: 'k-1066',
    ticket_number: '#1066',
    table_label: 'Jo K.',
    guest_name: 'Jo K.',
    channel: 'Takeaway',
    station: 'Bar & Beverage',
    stage: 'ready',
    elapsed_mins: 13,
    price_rp: 110000,
    price_usd: 55,
    alert_badge: 'No onions',
    items: ['1x Saffron arancini', '1x Cacio e pepe', '2x Aperol spritz'],
    payment_status: 'Paid',
    avatar: 'JK',
    isDemo: true,
  },

  // Column 4: SERVED (Dark Slate `#172237`)
  {
    id: 'k-1056',
    ticket_number: '#1056',
    table_label: 'Lucy H.',
    guest_name: 'Lucy H.',
    channel: 'Dine-in',
    station: 'Hot Kitchen',
    stage: 'completed', // maps to 'Served'
    elapsed_mins: 18,
    price_rp: 102000,
    price_usd: 51,
    alert_badge: 'Well done',
    items: ['1x Pizza Margherita', '1x Saffron arancini', '1x Beef carpaccio', '1x Affogato'],
    payment_status: 'Paid',
    avatar: 'LH',
    isDemo: true,
  },
  {
    id: 'k-1058',
    ticket_number: '#1058',
    table_label: 'Ravi N.',
    guest_name: 'Ravi N.',
    channel: 'Dine-in',
    station: 'Pasta & Grill',
    stage: 'completed',
    elapsed_mins: 14,
    price_rp: 160000,
    price_usd: 80,
    alert_badge: null,
    items: ['2x Chicken milanese', '2x Montepulciano, glass'],
    payment_status: 'Paid',
    avatar: 'RN',
    isDemo: true,
  },
  {
    id: 'k-1059',
    ticket_number: '#1059',
    table_label: 'Table 3',
    guest_name: 'Dimas P.',
    channel: 'Dine-in',
    station: 'Hot Kitchen',
    stage: 'completed',
    elapsed_mins: 15,
    price_rp: 244000,
    price_usd: 122,
    alert_badge: 'Allergy: nuts',
    items: [
      '1x Chicken milanese',
      '1x Tomato bruschetta',
      '1x Tagliatelle al ragu',
      '1x Burrata & heirloom tom.',
      '4x Montepulciano, glass',
    ],
    payment_status: 'Unpaid',
    avatar: 'T3',
    isDemo: true,
  },
];

export default function KitchenDisplayPage() {
  const { user, selectedBranchId } = useAuthStore();

  // Top Navigation Tab: 'orders' (Kitchen Board) | 'floor' (Floor Plan)
  const [activeNavTab, setActiveNavTab] = useState('orders');
  const [currencyMode, setCurrencyMode] = useState('IDR'); // 'IDR' (Rp) or 'USD' ($)

  // Tickets & Tables state
  const [dbOrders, setDbOrders] = useState([]);
  const [localTickets, setLocalTickets] = useState(DEFAULT_KITCHEN_TICKETS);
  const [diningTables, setDiningTables] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters on Kitchen Board
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState('All');
  const [stationFilter, setStationFilter] = useState('All stations');
  const [viewMode, setViewMode] = useState('Board');

  // Drag and Drop State
  const [draggedTicket, setDraggedTicket] = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);
  const [elevatedTicketId, setElevatedTicketId] = useState('k-1062');
  const [checkedItems, setCheckedItems] = useState({});

  // Clock, Sound, Fullscreen, Modals, Toast
  const [currentTime, setCurrentTime] = useState(new Date());
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [newTicketForm, setNewTicketForm] = useState({
    table_label: 'Table 8',
    channel: 'Dine-in',
    station: 'Hot Kitchen',
    alert_badge: 'Extra Pedas',
    price_rp: 135000,
    items_text: '2x Nasi Goreng Kambing\n1x Pizza Margherita\n2x Es Kopi Susu Aren',
  });
  const [toastInfo, setToastInfo] = useState({
    visible: true,
    message: '#1062 · Table 7 is ready — tarik (drag & drop) kartu antar kolom atau klik tombol aksi',
    undoAction: null,
  });

  const prevActiveCountRef = useRef(-1);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const triggerToast = (message, undoAction = null) => {
    setToastInfo({ visible: true, message, undoAction });
  };

  const fetchKitchenData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [ordersRes, tablesRes] = await Promise.all([
        getCustomerOrders({ limit: 100 }).catch(() => ({ data: [] })),
        getPublicDiningTables({ branch_id: selectedBranchId || user?.branch_id || undefined }).catch(() => ({ data: [] })),
      ]);

      const rows = ordersRes.data?.data || ordersRes.data || [];
      const orderList = Array.isArray(rows) ? rows : [];
      const activeOrders = orderList.filter((o) => ['accepted', 'preparing'].includes(o.status));

      if (prevActiveCountRef.current >= 0 && activeOrders.length > prevActiveCountRef.current && soundEnabled) {
        playOrderNotificationSound();
      }
      prevActiveCountRef.current = activeOrders.length;

      // Map real DB orders into Tavola ticket format
      const mappedDb = orderList.map((o) => {
        const diffMins = Math.max(1, Math.round((Date.now() - new Date(o.created_at || Date.now()).getTime()) / 60000));
        const itemLines = Array.isArray(o.items)
          ? o.items.map((it) => `${it.qty || 1}x ${it.product_name || it.name}`)
          : ['1x Pesanan Meja POS'];

        return {
          id: `db-${o.id}`,
          dbId: o.id,
          ticket_number: `#${String(o.order_code || o.id).slice(-4)}`,
          table_label: o.table_number ? `Table ${o.table_number}` : o.customer_name || 'Takeaway',
          guest_name: o.customer_name || 'Pelanggan',
          channel: o.table_number ? 'Dine-in' : 'Takeaway',
          station: 'Hot Kitchen',
          stage: o.status === 'pending' ? 'accepted' : o.status,
          elapsed_mins: diffMins,
          price_rp: Number(o.total_amount || o.total_price || 85000),
          price_usd: Math.max(5, Math.round(Number(o.total_amount || o.total_price || 85000) / 16000)),
          alert_badge: o.notes || null,
          items: itemLines,
          payment_status: o.payment_status === 'paid' ? 'Paid' : 'Unpaid',
          avatar: o.table_number ? `M${o.table_number}` : 'QR',
          isDemo: false,
        };
      });

      setDbOrders(mappedDb);
      setDiningTables(tablesRes.data || []);
    } catch (err) {
      console.warn('[Kitchen fetchKitchenData warning]:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKitchenData();
    const interval = setInterval(() => fetchKitchenData(true), 8000);
    return () => clearInterval(interval);
  }, [soundEnabled, selectedBranchId]);

  const allTickets = useMemo(() => {
    return [...dbOrders, ...localTickets];
  }, [dbOrders, localTickets]);

  const filteredTickets = useMemo(() => {
    return allTickets.filter((t) => {
      if (channelFilter !== 'All' && t.channel !== channelFilter) return false;
      if (stationFilter !== 'All stations' && t.station !== stationFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTicket = String(t.ticket_number || '').toLowerCase().includes(q);
        const inTable = String(t.table_label || '').toLowerCase().includes(q);
        const inGuest = String(t.guest_name || '').toLowerCase().includes(q);
        const inItems = (t.items || []).some((it) => String(it).toLowerCase().includes(q));
        if (!inTicket && !inTable && !inGuest && !inItems) return false;
      }
      return true;
    });
  }, [allTickets, channelFilter, stationFilter, searchQuery]);

  const newTickets = filteredTickets.filter((t) => t.stage === 'accepted');
  const cookingTickets = filteredTickets.filter((t) => t.stage === 'preparing');
  const readyTickets = filteredTickets.filter((t) => t.stage === 'ready');
  const servedTickets = filteredTickets.filter((t) => t.stage === 'completed');

  const openTicketsCount = newTickets.length + cookingTickets.length + readyTickets.length;
  const lateTicketsCount = filteredTickets.filter(
    (t) => t.stage !== 'completed' && Number(t.elapsed_mins || 0) >= 15
  ).length;

  const formatMoney = (ticket) => {
    if (currencyMode === 'USD') {
      return `$${ticket.price_usd || Math.round(Number(ticket.price_rp || 0) / 16000)}`;
    }
    return `Rp ${Number(ticket.price_rp || 0).toLocaleString('id-ID')}`;
  };

  const formatColumnSum = (list) => {
    if (currencyMode === 'USD') {
      const sumUsd = list.reduce((s, t) => s + Number(t.price_usd || 0), 0);
      return `$${sumUsd.toLocaleString('en-US')}`;
    }
    const sumRp = list.reduce((s, t) => s + Number(t.price_rp || 0), 0);
    return `Rp ${sumRp.toLocaleString('id-ID')}`;
  };

  // Move ticket stage (works for both Drag-and-Drop and Button click!)
  const moveTicketToStage = async (ticket, nextStage) => {
    if (!ticket || ticket.stage === nextStage) return;
    const prevStage = ticket.stage;

    const stageNames = {
      accepted: 'New (Pesanan Masuk)',
      preparing: 'Cooking (Sedang Dimasak)',
      ready: 'Ready (Siap Saji)',
      completed: 'Served (Selesai Disajikan)',
    };

    if (ticket.isDemo) {
      setLocalTickets((prev) =>
        prev.map((item) => (item.id === ticket.id ? { ...item, stage: nextStage } : item))
      );
    } else if (ticket.dbId) {
      setDbOrders((prev) =>
        prev.map((item) => (item.id === ticket.id ? { ...item, stage: nextStage } : item))
      );
      try {
        await updateCustomerOrderStatus(ticket.dbId, { status: nextStage });
      } catch (err) {
        console.warn('[Kitchen status update warning]:', err.message);
      }
    }

    if (soundEnabled) {
      playCheckoutSuccessSound();
    }

    if (ticket.id === elevatedTicketId) {
      setElevatedTicketId(null);
    }

    triggerToast(
      `${ticket.ticket_number} · ${ticket.table_label} dipindahkan ke ${stageNames[nextStage] || nextStage}`,
      async () => {
        if (ticket.isDemo) {
          setLocalTickets((prev) =>
            prev.map((item) => (item.id === ticket.id ? { ...item, stage: prevStage } : item))
          );
        } else if (ticket.dbId) {
          setDbOrders((prev) =>
            prev.map((item) => (item.id === ticket.id ? { ...item, stage: prevStage } : item))
          );
          await updateCustomerOrderStatus(ticket.dbId, { status: prevStage }).catch(() => {});
        }
      }
    );
  };

  // HTML5 Drag & Drop Handlers for Kanban Columns
  const handleDragStartTicket = (e, ticket) => {
    setDraggedTicket(ticket);
    setElevatedTicketId(ticket.id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', ticket.id);
  };

  const handleDragOverColumn = (e, stageKey) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStage !== stageKey) {
      setDragOverStage(stageKey);
    }
  };

  const handleDropOnColumn = (e, targetStage) => {
    e.preventDefault();
    setDragOverStage(null);
    if (draggedTicket) {
      moveTicketToStage(draggedTicket, targetStage);
      setDraggedTicket(null);
    }
  };

  const toggleItemCheck = (ticketId, idx) => {
    const key = `${ticketId}-${idx}`;
    setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleAddNewTicket = (e) => {
    e.preventDefault();
    const lines = newTicketForm.items_text
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const newTicket = {
      id: `k-${Date.now()}`,
      ticket_number: `#${Math.floor(1073 + Math.random() * 200)}`,
      table_label: newTicketForm.table_label || 'Table 8',
      guest_name: newTicketForm.table_label || 'Walk-in Guest',
      channel: newTicketForm.channel,
      station: newTicketForm.station,
      stage: 'accepted',
      elapsed_mins: 1,
      price_rp: Number(newTicketForm.price_rp || 120000),
      price_usd: Math.max(8, Math.round(Number(newTicketForm.price_rp || 120000) / 16000)),
      alert_badge: newTicketForm.alert_badge || null,
      items: lines.length ? lines : ['1x Menu Spesial Dapur'],
      payment_status: 'Unpaid',
      avatar: 'NW',
      isDemo: true,
    };

    setLocalTickets((prev) => [newTicket, ...prev]);
    setShowNewTicketModal(false);
    if (soundEnabled) playOrderNotificationSound();
    triggerToast(`Tiket dapur baru ${newTicket.ticket_number} (${newTicket.table_label}) ditambahkan!`);
  };

  return (
    <AuthGuard>
      <div
        style={{
          minHeight: '100vh',
          background: 'radial-gradient(circle at 20% 0%, #17233B 0%, #0B111E 55%, #080D18 100%)',
          color: '#F8FAFC',
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          position: 'relative',
          paddingBottom: '90px',
          userSelect: 'none',
        }}
      >
        {/* TOP FLOATING PILL NAVBAR (Tavola Kitchen Display System) */}
        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 50,
            padding: '14px 24px 12px 24px',
            background: 'linear-gradient(180deg, rgba(11,17,30,0.94) 0%, rgba(11,17,30,0.72) 85%, transparent 100%)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px',
            flexWrap: 'wrap',
          }}
        >
          {/* Left: Brand & Back Link */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link
              href={user?.role === 'kitchen' ? '/login' : '/dashboard'}
              title="Kembali"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '11px',
                background: '#151F34',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#CBD5E1',
                display: 'grid',
                placeItems: 'center',
                textDecoration: 'none',
                fontSize: '15px',
              }}
            >
              ←
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  background: '#F3A68F',
                  color: '#111827',
                  display: 'grid',
                  placeItems: 'center',
                  fontWeight: 900,
                  fontSize: '16px',
                  boxShadow: '0 4px 14px rgba(243, 166, 143, 0.35)',
                }}
              >
                🍳
              </div>
              <div>
                <div style={{ fontSize: '17px', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1 }}>
                  tavola <span style={{ color: '#F3A68F', fontWeight: 600 }}>kitchen</span>
                </div>
                <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '2px' }}>
                  {user?.branch_name ? `CABANG ${user.branch_name.toUpperCase()}` : 'KITCHEN DISPLAY SYSTEM'}
                </div>
              </div>
            </div>
          </div>

          {/* Center Floating Pill Tabs: Orders (Kitchen Board) & Floor (Floor Plan) */}
          <nav
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#131C2E',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '999px',
              padding: '5px 6px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
            }}
          >
            {[
              { id: 'orders', label: 'Orders · Kitchen Board', badge: openTicketsCount },
              { id: 'floor', label: 'Floor · Denah Meja & Antrean' },
            ].map((tab) => {
              const active = activeNavTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveNavTab(tab.id)}
                  style={{
                    padding: '7px 18px',
                    borderRadius: '999px',
                    border: 'none',
                    fontSize: '12.5px',
                    fontWeight: active ? 800 : 600,
                    cursor: 'pointer',
                    background: active ? '#F3A68F' : 'transparent',
                    color: active ? '#0F172A' : '#94A3B8',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '7px',
                    transition: 'all 0.18s ease',
                  }}
                >
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span
                      style={{
                        padding: '1px 7px',
                        borderRadius: '999px',
                        fontSize: '10.5px',
                        fontWeight: 800,
                        background: active ? 'rgba(15,23,42,0.18)' : '#1E2C46',
                        color: active ? '#0F172A' : '#EADCA6',
                      }}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Toolbar: Clock, Currency, Bell, Fullscreen */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#131C2E',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '999px',
              padding: '5px 10px',
            }}
          >
            <div
              style={{
                padding: '4px 10px',
                borderRadius: '999px',
                background: '#1A263D',
                color: '#EADCA6',
                fontFamily: 'monospace',
                fontSize: '12.5px',
                fontWeight: 700,
              }}
            >
              {currentTime.toLocaleTimeString('id-ID', { hour12: false })}
            </div>

            <button
              type="button"
              onClick={() => setCurrencyMode((c) => (c === 'IDR' ? 'USD' : 'IDR'))}
              style={{
                padding: '5px 10px',
                borderRadius: '999px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: '#1B273D',
                color: '#CBD5E1',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {currencyMode === 'IDR' ? 'Rp IDR' : '$ USD'}
            </button>

            <button
              type="button"
              onClick={() => {
                setSoundEnabled((v) => !v);
                if (!soundEnabled) playOrderNotificationSound();
              }}
              style={{
                padding: '5px 11px',
                borderRadius: '999px',
                border: 'none',
                background: soundEnabled ? 'rgba(156,226,198,0.18)' : '#1B273D',
                color: soundEnabled ? '#9CE2C6' : '#64748B',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {soundEnabled ? '🔔 Bel ON' : '🔕 Bel OFF'}
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              style={{
                padding: '5px 11px',
                borderRadius: '999px',
                border: 'none',
                background: '#1B273D',
                color: '#CBD5E1',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {isFullscreen ? '⤢ Exit' : '⤢ Fullscreen'}
            </button>
          </div>
        </header>

        {/* LEFT FLOATING QUICK-ACTION DOCK */}
        <aside
          style={{
            position: 'fixed',
            left: '16px',
            top: '52%',
            transform: 'translateY(-50%)',
            zIndex: 40,
            background: '#131C2E',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '999px',
            padding: '12px 7px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 16px 40px rgba(0,0,0,0.45)',
          }}
        >
          {[
            {
              icon: '🔍',
              title: 'Cari Tiket / Meja / Menu',
              action: () => {
                setActiveNavTab('orders');
                document.getElementById('kitchen-board-search')?.focus();
              },
            },
            {
              icon: '＋',
              title: 'Tambah Tiket Pesanan Baru',
              action: () => setShowNewTicketModal(true),
            },
            {
              icon: '🍳',
              title: 'Buka Kitchen Board (Orders)',
              action: () => setActiveNavTab('orders'),
            },
            {
              icon: '🗺️',
              title: 'Buka Denah Meja (Floor Plan)',
              badge: '3',
              action: () => setActiveNavTab('floor'),
            },
            {
              icon: '↻',
              title: 'Sinkronisasi Pesanan Live',
              action: () => fetchKitchenData(),
            },
          ].map((btn, idx) => (
            <button
              key={idx}
              type="button"
              onClick={btn.action}
              title={btn.title}
              style={{
                position: 'relative',
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                border: 'none',
                background: 'transparent',
                color: '#94A3B8',
                cursor: 'pointer',
                display: 'grid',
                placeItems: 'center',
                fontSize: '14px',
              }}
            >
              {btn.icon}
              {btn.badge && (
                <span
                  style={{
                    position: 'absolute',
                    top: '1px',
                    right: '1px',
                    width: '15px',
                    height: '15px',
                    borderRadius: '50%',
                    background: '#F3A68F',
                    color: '#0F172A',
                    fontSize: '9.5px',
                    fontWeight: 800,
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  {btn.badge}
                </span>
              )}
            </button>
          ))}
        </aside>

        {/* MAIN CONTENT AREA */}
        <main style={{ maxWidth: '1440px', margin: '0 auto', padding: '8px 26px 40px 74px' }}>
          {activeNavTab === 'orders' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Header + 3 KPI Pills (Screenshot 1 Kitchen Board) */}
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
                    Kitchen
                    <br />
                    Board
                  </h1>

                  {/* KPI Pill 1: Open tickets */}
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
                        fontSize: '14px',
                      }}
                    >
                      🧾
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '20px', fontWeight: 700, color: '#F8FAFC' }}>
                          {openTicketsCount}
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
                          {readyTickets.length} ready
                        </span>
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '1px' }}>
                        Open tickets
                      </div>
                    </div>
                  </div>

                  {/* KPI Pill 2: Average ticket time */}
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
                        fontSize: '14px',
                      }}
                    >
                      ⏱️
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '20px', fontWeight: 700, color: '#F8FAFC' }}>15 min</span>
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
                          On target
                        </span>
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '1px' }}>
                        Average ticket time today
                      </div>
                    </div>
                  </div>

                  {/* KPI Pill 3: Late over 15 min */}
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
                        fontSize: '14px',
                      }}
                    >
                      ⚠️
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '20px', fontWeight: 700, color: '#F8FAFC' }}>
                          {lateTicketsCount}
                        </span>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 9px',
                            borderRadius: '999px',
                            background: '#F3A68F',
                            color: '#2A120B',
                          }}
                        >
                          Chase
                        </span>
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '1px' }}>
                        Late · over 15 min
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Search & Filter Row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flex: 1 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: '#131C2E',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '999px',
                      padding: '8px 16px',
                      minWidth: '250px',
                    }}
                  >
                    <span style={{ color: '#64748B', fontSize: '13px' }}>🔍</span>
                    <input
                      id="kitchen-board-search"
                      type="text"
                      placeholder="Ticket, table, guest or dish..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: '#F8FAFC',
                        fontSize: '12.5px',
                        width: '100%',
                      }}
                    />
                  </div>

                  {[
                    { id: 'All', label: 'All', icon: '⊞', count: allTickets.length },
                    {
                      id: 'Dine-in',
                      label: 'Dine-in',
                      icon: '🍴',
                      count: allTickets.filter((t) => t.channel === 'Dine-in').length,
                    },
                    {
                      id: 'Takeaway',
                      label: 'Takeaway',
                      icon: '🛍️',
                      count: allTickets.filter((t) => t.channel === 'Takeaway').length,
                    },
                    {
                      id: 'Delivery',
                      label: 'Delivery',
                      icon: '🛵',
                      count: allTickets.filter((t) => t.channel === 'Delivery').length,
                    },
                  ].map((chip) => {
                    const active = channelFilter === chip.id;
                    return (
                      <button
                        key={chip.id}
                        type="button"
                        onClick={() => setChannelFilter(chip.id)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '7px',
                          padding: '7px 14px',
                          borderRadius: '999px',
                          border: active ? '1px solid #F3A68F' : '1px solid rgba(255,255,255,0.08)',
                          background: active ? '#F3A68F' : '#131C2E',
                          color: active ? '#0F172A' : '#CBD5E1',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        <span>{chip.icon}</span>
                        <span>{chip.label}</span>
                        <span
                          style={{
                            padding: '1px 6px',
                            borderRadius: '999px',
                            fontSize: '10.5px',
                            background: active ? 'rgba(15,23,42,0.16)' : '#1E2C46',
                            color: active ? '#0F172A' : '#94A3B8',
                          }}
                        >
                          {chip.count}
                        </span>
                      </button>
                    );
                  })}

                  <select
                    value={stationFilter}
                    onChange={(e) => setStationFilter(e.target.value)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '999px',
                      border: '1px solid rgba(255,255,255,0.08)',
                      background: '#131C2E',
                      color: '#CBD5E1',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <option value="All stations">📍 All stations</option>
                    <option value="Hot Kitchen">🔥 Hot Kitchen</option>
                    <option value="Pasta & Grill">🍝 Pasta & Grill</option>
                    <option value="Pizza Oven">🍕 Pizza Oven</option>
                    <option value="Bar & Beverage">🍹 Bar & Beverage</option>
                  </select>
                </div>

                {/* Board | List Switcher */}
                <div
                  style={{
                    display: 'inline-flex',
                    background: '#131C2E',
                    padding: '3px',
                    borderRadius: '999px',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  {['Board', 'List'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setViewMode(m)}
                      style={{
                        padding: '5px 14px',
                        borderRadius: '999px',
                        border: 'none',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        background: viewMode === m ? '#24324B' : 'transparent',
                        color: viewMode === m ? '#F8FAFC' : '#64748B',
                      }}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* + New order Button + Drag Instruction Hint */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowNewTicketModal(true)}
                  style={{
                    background: '#F3A68F',
                    color: '#0F172A',
                    border: 'none',
                    borderRadius: '999px',
                    padding: '9px 18px',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 6px 20px rgba(243, 166, 143, 0.3)',
                  }}
                >
                  + New order
                </button>

                <span style={{ fontSize: '12px', color: '#94A3B8' }}>
                  ✋ <strong>Drag & Drop Aktif:</strong> Tarik kartu pesanan antar kolom (<em>New → Cooking → Ready → Served</em>) atau klik item makanan untuk mencoret yang sudah matang
                </span>
              </div>

              {/* 4-COLUMN DRAG-AND-DROP KANBAN BOARD */}
              {viewMode === 'Board' ? (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, minmax(275px, 1fr))',
                    gap: '14px',
                    alignItems: 'start',
                    overflowX: 'auto',
                    paddingBottom: '16px',
                  }}
                >
                  {[
                    {
                      stageKey: 'accepted',
                      title: 'New',
                      dotColor: '#EADCA6',
                      cardBg: '#EADCA6',
                      cardText: '#18181B',
                      tickets: newTickets,
                      nextStage: 'preparing',
                      btnLabel: '🔥 Fire',
                      btnBg: '#18181B',
                      btnColor: '#F8FAFC',
                    },
                    {
                      stageKey: 'preparing',
                      title: 'Cooking',
                      dotColor: '#EFA892',
                      cardBg: '#EFA892',
                      cardText: '#18181B',
                      tickets: cookingTickets,
                      nextStage: 'ready',
                      btnLabel: '◎ Mark ready',
                      btnBg: '#FFFFFF',
                      btnColor: '#18181B',
                    },
                    {
                      stageKey: 'ready',
                      title: 'Ready',
                      dotColor: '#BCE3D4',
                      cardBg: '#BCE3D4',
                      cardText: '#18181B',
                      tickets: readyTickets,
                      nextStage: 'completed',
                      btnLabel: '✓ Served',
                      btnBg: '#FFFFFF',
                      btnColor: '#18181B',
                    },
                    {
                      stageKey: 'completed',
                      title: 'Served',
                      dotColor: '#64748B',
                      cardBg: '#172237',
                      cardText: '#F8FAFC',
                      tickets: servedTickets,
                      nextStage: null,
                      btnLabel: '✓ Paid',
                      btnBg: 'rgba(156,226,198,0.14)',
                      btnColor: '#9CE2C6',
                    },
                  ].map((col) => {
                    const isDropActive = dragOverStage === col.stageKey;
                    const isDarkCol = col.stageKey === 'completed';

                    return (
                      <div
                        key={col.stageKey}
                        onDragOver={(e) => handleDragOverColumn(e, col.stageKey)}
                        onDragLeave={() => setDragOverStage(null)}
                        onDrop={(e) => handleDropOnColumn(e, col.stageKey)}
                        style={{
                          background: isDropActive ? 'rgba(243, 166, 143, 0.09)' : '#11192B',
                          border: isDropActive
                            ? '2px dashed #F3A68F'
                            : '1px solid rgba(255,255,255,0.07)',
                          borderRadius: '20px',
                          padding: '14px',
                          minHeight: '520px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {/* Column Header */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '2px 4px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span
                              style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: col.dotColor,
                              }}
                            />
                            <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#F8FAFC' }}>
                              {col.title}
                            </span>
                            <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>
                              {col.tickets.length}
                            </span>
                          </div>
                          <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>
                            {formatColumnSum(col.tickets)}
                          </span>
                        </div>

                        {/* Drop Indicator Banner */}
                        {isDropActive && (
                          <div
                            style={{
                              borderRadius: '12px',
                              padding: '10px',
                              background: 'rgba(243, 166, 143, 0.16)',
                              color: '#F3A68F',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              textAlign: 'center',
                            }}
                          >
                            ⬇ Lepaskan kartu untuk memindahkan ke {col.title}
                          </div>
                        )}

                        {/* Ticket Cards */}
                        {col.tickets.map((ticket) => {
                          const isBeingDragged = draggedTicket?.id === ticket.id;
                          const isElevated = elevatedTicketId === ticket.id && col.stageKey === 'ready';

                          return (
                            <div
                              key={ticket.id}
                              draggable
                              onDragStart={(e) => handleDragStartTicket(e, ticket)}
                              onDragEnd={() => {
                                setDraggedTicket(null);
                                setDragOverStage(null);
                              }}
                              onClick={() =>
                                setElevatedTicketId((prev) => (prev === ticket.id ? null : ticket.id))
                              }
                              style={{
                                background: col.cardBg,
                                color: col.cardText,
                                border: isDarkCol ? '1px solid rgba(255,255,255,0.08)' : 'none',
                                borderRadius: '16px',
                                padding: '14px',
                                boxShadow:
                                  isBeingDragged || isElevated
                                    ? '0 26px 55px rgba(0,0,0,0.65), 0 0 0 2px #FFF'
                                    : '0 10px 24px rgba(0,0,0,0.22)',
                                transform: isBeingDragged
                                  ? 'rotate(-2deg) scale(1.03)'
                                  : isElevated
                                  ? 'translate(-18px, -4px) rotate(-1.2deg) scale(1.02)'
                                  : 'none',
                                opacity: isBeingDragged ? 0.88 : 1,
                                cursor: 'grab',
                                transition: 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.22s ease',
                                zIndex: isBeingDragged || isElevated ? 30 : 2,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '10px',
                              }}
                            >
                              {/* Top Row: Ticket # + Timer + Drag Handle */}
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span
                                    style={{
                                      fontSize: '11.5px',
                                      fontWeight: 700,
                                      color: isDarkCol ? '#94A3B8' : '#3F3F46',
                                    }}
                                  >
                                    {ticket.ticket_number}
                                  </span>
                                  <span
                                    style={{
                                      background: isDarkCol
                                        ? 'rgba(255,255,255,0.08)'
                                        : 'rgba(255,255,255,0.72)',
                                      color: isDarkCol ? '#94A3B8' : '#18181B',
                                      borderRadius: '999px',
                                      padding: '2px 8px',
                                      fontSize: '10.5px',
                                      fontWeight: 700,
                                    }}
                                  >
                                    {isDarkCol ? '✓' : '🕒'} {ticket.elapsed_mins} min
                                  </span>
                                </div>
                                <span
                                  title="Tarik (Drag) kartu ini ke kolom lain"
                                  style={{
                                    fontSize: '12px',
                                    color: isDarkCol ? '#64748B' : '#3F3F46',
                                    fontWeight: 800,
                                  }}
                                >
                                  ⋮⋮
                                </span>
                              </div>

                              {/* Table / Guest Title */}
                              <div
                                style={{
                                  fontSize: '16px',
                                  fontWeight: 800,
                                  color: col.cardText,
                                  letterSpacing: '-0.01em',
                                }}
                              >
                                {ticket.channel === 'Dine-in' ? '🍴' : ticket.channel === 'Takeaway' ? '🛍️' : '🛵'}{' '}
                                {ticket.table_label}
                              </div>

                              {/* Alert Badge + Interactive Checklist Items */}
                              <div
                                style={{
                                  borderTop: isDarkCol
                                    ? '1px solid rgba(255,255,255,0.07)'
                                    : '1px solid rgba(24,24,27,0.1)',
                                  borderBottom: isDarkCol
                                    ? '1px solid rgba(255,255,255,0.07)'
                                    : '1px solid rgba(24,24,27,0.1)',
                                  padding: '8px 0',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '5px',
                                }}
                              >
                                {ticket.alert_badge && (
                                  <div style={{ marginBottom: '2px' }}>
                                    <span
                                      style={{
                                        display: 'inline-block',
                                        background: '#18181B',
                                        color: '#EADCA6',
                                        borderRadius: '6px',
                                        padding: '2px 8px',
                                        fontSize: '10.5px',
                                        fontWeight: 700,
                                      }}
                                    >
                                      ▲ {ticket.alert_badge}
                                    </span>
                                  </div>
                                )}

                                {(ticket.items || []).map((line, idx) => {
                                  const checked = Boolean(checkedItems[`${ticket.id}-${idx}`]);
                                  return (
                                    <div
                                      key={idx}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleItemCheck(ticket.id, idx);
                                      }}
                                      style={{
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        color: isDarkCol ? '#CBD5E1' : '#27272A',
                                        textDecoration: checked ? 'line-through' : 'none',
                                        opacity: checked ? 0.55 : 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        cursor: 'pointer',
                                      }}
                                    >
                                      <span style={{ fontSize: '11px' }}>{checked ? '☑' : '☐'}</span>
                                      <span>{line}</span>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Card Footer: Avatar + Price + Action Button */}
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <div
                                    style={{
                                      width: '26px',
                                      height: '26px',
                                      borderRadius: '50%',
                                      background: isDarkCol ? '#263654' : '#18181B',
                                      color: isDarkCol ? '#F3A68F' : col.cardBg,
                                      display: 'grid',
                                      placeItems: 'center',
                                      fontSize: '10px',
                                      fontWeight: 800,
                                    }}
                                  >
                                    {ticket.avatar || 'K'}
                                  </div>
                                  <span style={{ fontSize: '15px', fontWeight: 800, color: col.cardText }}>
                                    {formatMoney(ticket)}
                                  </span>
                                </div>

                                {col.nextStage ? (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      moveTicketToStage(ticket, col.nextStage);
                                    }}
                                    style={{
                                      background: col.btnBg,
                                      color: col.btnColor,
                                      border: 'none',
                                      borderRadius: '999px',
                                      padding: '6px 14px',
                                      fontSize: '11.5px',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      boxShadow: '0 4px 10px rgba(0,0,0,0.12)',
                                    }}
                                  >
                                    {col.btnLabel}
                                  </button>
                                ) : (
                                  <span
                                    style={{
                                      background: col.btnBg,
                                      color: col.btnColor,
                                      borderRadius: '999px',
                                      padding: '5px 12px',
                                      fontSize: '11px',
                                      fontWeight: 700,
                                    }}
                                  >
                                    ✓ {ticket.payment_status}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* LIST VIEW */
                <div
                  style={{
                    background: '#121B2D',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '20px',
                    overflow: 'hidden',
                  }}
                >
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#94A3B8', fontSize: '12px' }}>
                        <th style={{ padding: '14px 18px' }}>Ticket</th>
                        <th style={{ padding: '14px 18px' }}>Table / Guest</th>
                        <th style={{ padding: '14px 18px' }}>Channel & Station</th>
                        <th style={{ padding: '14px 18px' }}>Items</th>
                        <th style={{ padding: '14px 18px' }}>Stage</th>
                        <th style={{ padding: '14px 18px', textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTickets.map((t) => (
                        <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '13px' }}>
                          <td style={{ padding: '12px 18px', fontWeight: 700, color: '#F3A68F' }}>{t.ticket_number}</td>
                          <td style={{ padding: '12px 18px', fontWeight: 700 }}>{t.table_label}</td>
                          <td style={{ padding: '12px 18px', color: '#94A3B8' }}>
                            {t.channel} · {t.station}
                          </td>
                          <td style={{ padding: '12px 18px', color: '#CBD5E1' }}>{(t.items || []).join(', ')}</td>
                          <td style={{ padding: '12px 18px' }}>{t.stage.toUpperCase()}</td>
                          <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                            {t.stage !== 'completed' && (
                              <button
                                type="button"
                                onClick={() =>
                                  moveTicketToStage(
                                    t,
                                    t.stage === 'accepted'
                                      ? 'preparing'
                                      : t.stage === 'preparing'
                                      ? 'ready'
                                      : 'completed'
                                  )
                                }
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
                                Advance →
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            /* =====================================================================
                TAB 2: FLOOR PLAN & MEJA (Interactive Drag-and-Drop Blueprint)
               ===================================================================== */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <h1
                  style={{
                    margin: 0,
                    fontFamily: 'Georgia, "Times New Roman", serif',
                    fontSize: '34px',
                    fontWeight: 400,
                    lineHeight: 1.02,
                    color: '#F8FAFC',
                  }}
                >
                  Floor
                  <br />
                  Plan
                </h1>
              </div>

              <InteractiveFloorPlanSelector
                tables={diningTables}
                showWaitlistAndServers={true}
                onTriggerToast={triggerToast}
              />
            </div>
          )}
        </main>

        {/* MODAL: + NEW KITCHEN ORDER */}
        {showNewTicketModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 80,
              background: 'rgba(8, 13, 24, 0.78)',
              backdropFilter: 'blur(6px)',
              display: 'grid',
              placeItems: 'center',
              padding: '16px',
            }}
          >
            <form
              onSubmit={handleAddNewTicket}
              style={{
                width: '100%',
                maxWidth: '460px',
                background: '#131C2E',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '22px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '18px', color: '#F8FAFC' }}>+ New Kitchen Order Ticket</h3>
              <input
                type="text"
                required
                placeholder="Nomor Meja / Nama Pemesan (contoh: Table 8)"
                value={newTicketForm.table_label}
                onChange={(e) => setNewTicketForm((p) => ({ ...p, table_label: e.target.value }))}
                style={{
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: '#0C1322',
                  color: '#F8FAFC',
                }}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <select
                  value={newTicketForm.channel}
                  onChange={(e) => setNewTicketForm((p) => ({ ...p, channel: e.target.value }))}
                  style={{
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: '#0C1322',
                    color: '#F8FAFC',
                  }}
                >
                  <option value="Dine-in">Dine-in</option>
                  <option value="Takeaway">Takeaway</option>
                  <option value="Delivery">Delivery</option>
                </select>
                <input
                  type="text"
                  placeholder="Catatan Alergi / Level Pedas"
                  value={newTicketForm.alert_badge}
                  onChange={(e) => setNewTicketForm((p) => ({ ...p, alert_badge: e.target.value }))}
                  style={{
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: '#0C1322',
                    color: '#F8FAFC',
                  }}
                />
              </div>
              <textarea
                rows={4}
                value={newTicketForm.items_text}
                onChange={(e) => setNewTicketForm((p) => ({ ...p, items_text: e.target.value }))}
                placeholder="Daftar makanan (1 per baris)"
                style={{
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: '#0C1322',
                  color: '#F8FAFC',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowNewTicketModal(false)}
                  style={{
                    background: '#1E2C46',
                    color: '#CBD5E1',
                    border: 'none',
                    borderRadius: '999px',
                    padding: '8px 16px',
                    cursor: 'pointer',
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  style={{
                    background: '#F3A68F',
                    color: '#0F172A',
                    border: 'none',
                    borderRadius: '999px',
                    padding: '8px 18px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Kirim ke Dapur
                </button>
              </div>
            </form>
          </div>
        )}

        {/* BOTTOM FLOATING TOAST WITH [Undo] BUTTON */}
        {toastInfo.visible && (
          <div
            style={{
              position: 'fixed',
              bottom: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 60,
              background: '#152036',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '999px',
              padding: '8px 10px 8px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 16px 40px rgba(0,0,0,0.55)',
            }}
          >
            <span
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: 'rgba(156, 226, 198, 0.2)',
                color: '#9CE2C6',
                display: 'grid',
                placeItems: 'center',
                fontSize: '11px',
                fontWeight: 800,
              }}
            >
              ✓
            </span>
            <span style={{ fontSize: '12.5px', color: '#E2E8F0', fontWeight: 500 }}>
              {toastInfo.message}
            </span>
            {toastInfo.undoAction && (
              <button
                type="button"
                onClick={() => {
                  toastInfo.undoAction();
                  setToastInfo((prev) => ({ ...prev, undoAction: null, message: 'Perubahan dibatalkan (Undo)' }));
                }}
                style={{
                  background: 'rgba(234, 220, 166, 0.2)',
                  color: '#EADCA6',
                  border: '1px solid rgba(234, 220, 166, 0.35)',
                  borderRadius: '999px',
                  padding: '4px 12px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Undo
              </button>
            )}
            <button
              type="button"
              onClick={() => setToastInfo((prev) => ({ ...prev, visible: false }))}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748B',
                fontSize: '12px',
                cursor: 'pointer',
                padding: '0 4px',
              }}
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
