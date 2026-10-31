'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  getSuperadminStats,
  getSuperadminTenants,
  updateSuperadminTenantPlan,
  updateSuperadminTenantStatus,
  getSuperadminCrmDeals,
  createSuperadminCrmDeal,
  updateSuperadminCrmDeal,
  deleteSuperadminCrmDeal,
  onboardTenant,
} from '@/lib/api';
import DatabaseSettingsPanel from '@/components/superadmin/DatabaseSettingsPanel';
import TavolaFloorPlanView from '@/components/superadmin/TavolaFloorPlanView';
import TavolaSalesReportsView from '@/components/superadmin/TavolaSalesReportsView';

const NAV_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'orders', label: 'Orders' },
  { id: 'floor', label: 'Floor' },
  { id: 'reservations', label: 'Reservations' },
  { id: 'menu', label: 'Menu' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'staff', label: 'Staff' },
  { id: 'reports', label: 'Reports' },
];

export default function SuperadminPage() {
  // Default to 'orders' (Kitchen / CRM Deal Kanban Board - Screenshot 1)
  const [activeTab, setActiveTab] = useState('orders');
  const [currency, setCurrency] = useState('USD'); // 'USD' ($ matching screenshot) or 'IDR' (Rp)
  const [boardTitleMode, setBoardTitleMode] = useState('crm'); // 'crm' or 'tavola'

  // Backend state
  const [stats, setStats] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingTenantId, setUpdatingTenantId] = useState(null);

  // Filters on Orders / CRM Deal Board
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState('All');
  const [stationFilter, setStationFilter] = useState('All stations');
  const [viewMode, setViewMode] = useState('Board'); // 'Board' | 'List'
  const [elevatedTicket, setElevatedTicket] = useState('#1062');

  // Modals
  const [showNewDealModal, setShowNewDealModal] = useState(false);
  const [newDealForm, setNewDealForm] = useState({
    table_label: '',
    tenant_brand: '',
    pic_name: '',
    channel_type: 'Dine-in',
    plan_code: 'franchise',
    station_region: 'Jabodetabek',
    amount_usd: 95,
    alert_badge: 'Well done · Custom ERP',
    items_text: '1x Paket Franchise Multi-Cabang\n1x POS Kasir + Kitchen Display\n2x QR Table Self-Order\n1x Midtrans QRIS Sync',
  });

  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [onboardForm, setOnboardForm] = useState({
    tenant_name: '',
    branch_name: 'Cabang Pusat',
    owner_name: '',
    email: '',
    password: 'santapos123',
    plan_code: 'pro',
  });

  // Bottom Floating Toast with Undo (Exact match to Screenshots 2 & 3)
  const [toastInfo, setToastInfo] = useState({
    visible: true,
    message: '#1062 · Table 7 (Ramen Ya! GI) is ready for deployment',
    undoAction: null,
  });

  const triggerToast = (message, undoAction = null) => {
    setToastInfo({ visible: true, message, undoAction });
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [statsRes, tenantsRes, dealsRes] = await Promise.all([
        getSuperadminStats().catch(() => ({ data: { data: null } })),
        getSuperadminTenants().catch(() => ({ data: { data: [] } })),
        getSuperadminCrmDeals().catch(() => ({ data: { data: [] } })),
      ]);

      if (statsRes?.data?.data) setStats(statsRes.data.data);
      if (Array.isArray(tenantsRes?.data?.data)) setTenants(tenantsRes.data.data);
      if (Array.isArray(dealsRes?.data?.data)) setDeals(dealsRes.data.data);
    } catch (err) {
      console.error('[Superadmin fetchAllData error]:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const formatDealPrice = (deal) => {
    if (currency === 'IDR') {
      const jt = (Number(deal.amount_idr || deal.amount_usd * 200000) / 1000000).toFixed(1);
      return `Rp ${jt}J`;
    }
    return `$${Math.round(Number(deal.amount_usd || 50))}`;
  };

  const formatColumnTotal = (colDeals) => {
    if (currency === 'IDR') {
      const sumIdr = colDeals.reduce((a, b) => a + Number(b.amount_idr || b.amount_usd * 200000), 0);
      return `Rp ${(sumIdr / 1000000).toFixed(1)} Jt`;
    }
    const sumUsd = colDeals.reduce((a, b) => a + Number(b.amount_usd || 0), 0);
    return `$${Math.round(sumUsd).toLocaleString('en-US')}`;
  };

  // Filtered Deals for Kanban Board
  const filteredDeals = useMemo(() => {
    return deals.filter((d) => {
      if (channelFilter !== 'All' && d.channel_type !== channelFilter) return false;
      if (stationFilter !== 'All stations' && d.station_region !== stationFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTicket = String(d.ticket_number || '').toLowerCase().includes(q);
        const inLabel = String(d.table_label || '').toLowerCase().includes(q);
        const inBrand = String(d.tenant_brand || '').toLowerCase().includes(q);
        const inPic = String(d.pic_name || '').toLowerCase().includes(q);
        const inItems = (d.items || []).some((it) => String(it).toLowerCase().includes(q));
        if (!inTicket && !inLabel && !inBrand && !inPic && !inItems) return false;
      }
      return true;
    });
  }, [deals, channelFilter, stationFilter, searchQuery]);

  const newDeals = filteredDeals.filter((d) => d.stage === 'new');
  const cookingDeals = filteredDeals.filter((d) => d.stage === 'cooking');
  const readyDeals = filteredDeals.filter((d) => d.stage === 'ready');
  const servedDeals = filteredDeals.filter((d) => d.stage === 'served');

  const openDealsCount = newDeals.length + cookingDeals.length + readyDeals.length;

  // Advance Deal Stage on Kanban Card Button Click
  const handleAdvanceDeal = async (deal, targetStage, provisionTenant = false) => {
    const previousStage = deal.stage;
    const previousPayment = deal.payment_status;

    // Optimistic UI update
    setDeals((prev) =>
      prev.map((item) =>
        item.id === deal.id
          ? {
              ...item,
              stage: targetStage,
              payment_status: targetStage === 'served' ? 'Paid' : item.payment_status,
            }
          : item
      )
    );

    if (deal.ticket_number === elevatedTicket) {
      setElevatedTicket(null);
    }

    try {
      await updateSuperadminCrmDeal(deal.id, {
        stage: targetStage,
        payment_status: targetStage === 'served' ? 'Paid' : deal.payment_status,
        provision_tenant: provisionTenant,
      });

      if (provisionTenant) {
        fetchAllData();
      }

      triggerToast(
        `${deal.ticket_number} · ${deal.table_label} moved to ${targetStage.toUpperCase()}`,
        async () => {
          setDeals((prev) =>
            prev.map((item) =>
              item.id === deal.id
                ? { ...item, stage: previousStage, payment_status: previousPayment }
                : item
            )
          );
          await updateSuperadminCrmDeal(deal.id, {
            stage: previousStage,
            payment_status: previousPayment,
          });
        }
      );
    } catch (err) {
      console.error('[handleAdvanceDeal error]:', err);
      fetchAllData();
    }
  };

  const handleTogglePaymentStatus = async (deal) => {
    const nextPay = deal.payment_status === 'Paid' ? 'Unpaid' : 'Paid';
    setDeals((prev) =>
      prev.map((item) => (item.id === deal.id ? { ...item, payment_status: nextPay } : item))
    );
    try {
      await updateSuperadminCrmDeal(deal.id, { payment_status: nextPay });
      triggerToast(`${deal.ticket_number} payment status marked as ${nextPay}`);
    } catch (err) {
      console.error('[handleTogglePaymentStatus error]:', err);
    }
  };

  const handleCreateNewDeal = async (e) => {
    e.preventDefault();
    try {
      const items = newDealForm.items_text
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await createSuperadminCrmDeal({
        table_label: newDealForm.table_label || `Table ${Math.floor(1 + Math.random() * 14)} · ${newDealForm.tenant_brand}`,
        tenant_brand: newDealForm.tenant_brand || newDealForm.table_label,
        pic_name: newDealForm.pic_name || 'Owner Resto',
        channel_type: newDealForm.channel_type,
        plan_code: newDealForm.plan_code,
        station_region: newDealForm.station_region,
        stage: 'new',
        amount_usd: Number(newDealForm.amount_usd || 80),
        amount_idr: Number(newDealForm.amount_usd || 80) * 200000,
        alert_badge: newDealForm.alert_badge || null,
        items,
      });

      if (res?.data?.data) {
        setDeals((prev) => [res.data.data, ...prev]);
        triggerToast(`Created new deal ${res.data.data.ticket_number} (${res.data.data.table_label})`);
      }
      setShowNewDealModal(false);
      setNewDealForm({
        table_label: '',
        tenant_brand: '',
        pic_name: '',
        channel_type: 'Dine-in',
        plan_code: 'franchise',
        station_region: 'Jabodetabek',
        amount_usd: 95,
        alert_badge: 'Well done · Custom ERP',
        items_text: '1x Paket Franchise Multi-Cabang\n1x POS Kasir + Kitchen Display\n2x QR Table Self-Order',
      });
    } catch (err) {
      alert(err?.response?.data?.message || 'Gagal menambahkan deal');
    }
  };

  const handlePlanChange = async (tenantId, planCode) => {
    setUpdatingTenantId(tenantId);
    try {
      await updateSuperadminTenantPlan(tenantId, planCode);
      await fetchAllData();
      triggerToast(`Updated tenant #${tenantId} plan to ${planCode.toUpperCase()}`);
    } catch (err) {
      alert(err?.response?.data?.message || 'Gagal mengubah paket tenant');
    } finally {
      setUpdatingTenantId(null);
    }
  };

  const handleStatusChange = async (tenantId, status) => {
    setUpdatingTenantId(tenantId);
    try {
      await updateSuperadminTenantStatus(tenantId, status);
      await fetchAllData();
      triggerToast(`Tenant #${tenantId} status changed to ${status.toUpperCase()}`);
    } catch (err) {
      alert(err?.response?.data?.message || 'Gagal mengubah status tenant');
    } finally {
      setUpdatingTenantId(null);
    }
  };

  const handleOnboardSubmit = async (e) => {
    e.preventDefault();
    try {
      await onboardTenant(onboardForm);
      setShowOnboardModal(false);
      await fetchAllData();
      triggerToast(`Tenant baru "${onboardForm.tenant_name}" berhasil di-deploy!`);
    } catch (err) {
      alert(err?.response?.data?.message || 'Gagal membuat tenant baru');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(circle at 20% 0%, #17233B 0%, #0B111E 55%, #080D18 100%)',
        color: '#F8FAFC',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        position: 'relative',
        paddingBottom: '90px',
      }}
    >
      {/* TOP FLOATING PILL NAVBAR (Exact Match to All 3 Screenshots) */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          padding: '16px 28px 12px 28px',
          background: 'linear-gradient(180deg, rgba(11,17,30,0.92) 0%, rgba(11,17,30,0.65) 85%, transparent 100%)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        {/* Left Brand Logo (`tavola` / `santapos`) */}
        <div
          onClick={() => setBoardTitleMode((m) => (m === 'crm' ? 'tavola' : 'crm'))}
          title="Click to toggle between Tavola & Santapos CRM labels"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
          }}
        >
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
            ✦
          </div>
          <div>
            <div
              style={{
                fontSize: '18px',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                color: '#F8FAFC',
                lineHeight: 1,
              }}
            >
              {boardTitleMode === 'tavola' ? 'tavola' : 'santapos'}
            </div>
            <div style={{ fontSize: '9.5px', color: '#94A3B8', letterSpacing: '0.06em', marginTop: '2px' }}>
              SUPERADMIN CRM
            </div>
          </div>
        </div>

        {/* Center Floating Pill Navigation Bar */}
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: '#131C2E',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '999px',
            padding: '5px 6px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
            overflowX: 'auto',
          }}
        >
          {NAV_TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '7px 16px',
                  borderRadius: '999px',
                  border: 'none',
                  fontSize: '12.5px',
                  fontWeight: active ? 700 : 500,
                  cursor: 'pointer',
                  background: active ? '#F3A68F' : 'transparent',
                  color: active ? '#0F172A' : '#94A3B8',
                  transition: 'all 0.18s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Right Action Pill Icons */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#131C2E',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '999px',
            padding: '5px 8px',
          }}
        >
          <button
            onClick={() => setCurrency((c) => (c === 'USD' ? 'IDR' : 'USD'))}
            title="Switch Currency Display ($ USD / Rp IDR)"
            style={{
              padding: '5px 10px',
              borderRadius: '999px',
              border: '1px solid rgba(255,255,255,0.1)',
              background: '#1C2942',
              color: '#EADCA6',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {currency === 'USD' ? '$ USD' : 'Rp IDR'}
          </button>

          <button
            onClick={fetchAllData}
            title="Refresh Live Data"
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              border: 'none',
              background: '#1B273D',
              color: '#CBD5E1',
              cursor: 'pointer',
              display: 'grid',
              placeItems: 'center',
              fontSize: '13px',
            }}
          >
            ↻
          </button>

          <Link
            href="/dashboard"
            title="Kembali ke Dashboard POS Resto"
            style={{
              padding: '5px 12px',
              borderRadius: '999px',
              background: '#1B273D',
              color: '#F8FAFC',
              textDecoration: 'none',
              fontSize: '11.5px',
              fontWeight: 600,
            }}
          >
            POS Resto ↗
          </Link>

          <div
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #F3A68F, #EADCA6)',
              color: '#0F172A',
              display: 'grid',
              placeItems: 'center',
              fontSize: '12px',
              fontWeight: 800,
            }}
          >
            SA
          </div>
        </div>
      </header>

      {/* LEFT VERTICAL FLOATING DOCK (Exact Match to Screenshots 1, 2, 3) */}
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
            title: 'Search Deals & Tenants',
            action: () => {
              setActiveTab('orders');
              const el = document.getElementById('tavola-deal-search');
              if (el) el.focus();
            },
          },
          {
            icon: '＋',
            title: 'New Tenant Deal',
            action: () => setShowNewDealModal(true),
          },
          {
            icon: '🗓️',
            title: 'Tenant Reservations & Directory',
            action: () => setActiveTab('reservations'),
          },
          {
            icon: '⏳',
            title: 'Floor Plan & Waitlist',
            badge: '3',
            action: () => setActiveTab('floor'),
          },
          {
            icon: '🚫',
            title: '86d / Watchlist & Reports',
            action: () => setActiveTab('reports'),
          },
          {
            icon: '🔗',
            title: 'Copy Self-Onboarding Link',
            action: () => {
              if (typeof window !== 'undefined') {
                navigator.clipboard?.writeText(`${window.location.origin}/onboarding`);
                triggerToast('Copied tenant onboarding link to clipboard');
              }
            },
          },
          {
            icon: '🗄️',
            title: 'Database & Cloud Storage Settings',
            action: () => setActiveTab('inventory'),
          },
          {
            icon: '☀️',
            title: 'Toggle Title Mode (Tavola / CRM)',
            action: () => setBoardTitleMode((m) => (m === 'crm' ? 'tavola' : 'crm')),
          },
        ].map((item, idx) => (
          <button
            key={idx}
            onClick={item.action}
            title={item.title}
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
              transition: 'background 0.15s ease, color 0.15s ease',
            }}
          >
            {item.icon}
            {item.badge && (
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
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </aside>

      {/* MAIN CONTENT CONTAINER */}
      <main
        style={{
          maxWidth: '1440px',
          margin: '0 auto',
          padding: '8px 28px 40px 76px',
        }}
      >
        {/* =====================================================================
            TAB: ORDERS / CRM DEAL BOARD (Exact REA of Screenshot 1)
           ===================================================================== */}
        {activeTab === 'orders' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Row 1: 2-Line Serif Title + 3 Inline KPI Pills */}
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
                  {boardTitleMode === 'tavola' ? (
                    <>
                      Kitchen
                      <br />
                      Board
                    </>
                  ) : (
                    <>
                      Kitchen & Deal
                      <br />
                      Board
                    </>
                  )}
                </h1>

                {/* KPI Pill 1: 12 [2 ready] Open tickets */}
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '20px', fontWeight: 700, color: '#F8FAFC' }}>
                        {openDealsCount}
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
                        {readyDeals.length} ready
                      </span>
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '1px' }}>
                      Open tickets · Tenant deals
                    </div>
                  </div>
                </div>

                {/* KPI Pill 2: 15 min [On target] Average ticket time */}
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
                      Average ticket / SLA time today
                    </div>
                  </div>
                </div>

                {/* KPI Pill 3: 2 [Chase] Late · over 15 min */}
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
                      color: '#F3A68F',
                      fontSize: '14px',
                    }}
                  >
                    ⚠️
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '20px', fontWeight: 700, color: '#F8FAFC' }}>2</span>
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
                      Late · over 15 min follow-up
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 2: Search Bar + Channel Filter Pills + Station Select + Board/List Toggle */}
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
                {/* Search Input Pill */}
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
                    id="tavola-deal-search"
                    type="text"
                    placeholder="Ticket, table, tenant, guest or dish..."
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

                {/* Filter Chips Matching Screenshot 1 */}
                {[
                  { id: 'All', label: 'All', icon: '⊞', count: deals.length },
                  {
                    id: 'Dine-in',
                    label: 'Dine-in · Franchise',
                    icon: '🍴',
                    count: deals.filter((d) => d.channel_type === 'Dine-in').length,
                  },
                  {
                    id: 'Takeaway',
                    label: 'Takeaway · Pro',
                    icon: '🛍️',
                    count: deals.filter((d) => d.channel_type === 'Takeaway').length,
                  },
                  {
                    id: 'Delivery',
                    label: 'Delivery · Starter',
                    icon: '🛵',
                    count: deals.filter((d) => d.channel_type === 'Delivery').length,
                  },
                ].map((chip) => {
                  const active = channelFilter === chip.id;
                  return (
                    <button
                      key={chip.id}
                      onClick={() => setChannelFilter(chip.id)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '7px',
                        padding: '7px 14px',
                        borderRadius: '999px',
                        border: active
                          ? '1px solid #F3A68F'
                          : '1px solid rgba(255,255,255,0.08)',
                        background: active ? '#F3A68F' : '#131C2E',
                        color: active ? '#0F172A' : '#CBD5E1',
                        fontSize: '12px',
                        fontWeight: 600,
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
                          background: active ? 'rgba(15,23,42,0.15)' : '#1E2C46',
                          color: active ? '#0F172A' : '#94A3B8',
                        }}
                      >
                        {chip.count}
                      </span>
                    </button>
                  );
                })}

                {/* Station / Region Dropdown */}
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
                  <option value="All stations">📍 All stations / regions</option>
                  <option value="Jabodetabek">📍 Jabodetabek</option>
                  <option value="Jawa & Bali">📍 Jawa & Bali</option>
                  <option value="Luar Jawa">📍 Luar Jawa</option>
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

            {/* Row 3: + New order / + New deal Warm Peach Pill Button */}
            <div>
              <button
                onClick={() => setShowNewDealModal(true)}
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
                + New order / deal
              </button>
            </div>

            {/* Row 4: 4-COLUMN KANBAN BOARD (Exact REA of Screenshot 1) */}
            {viewMode === 'Board' ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, minmax(275px, 1fr))',
                  gap: '14px',
                  alignItems: 'start',
                  overflowX: 'auto',
                  paddingBottom: '12px',
                }}
              >
                {/* ================= COLUMN 1: NEW (Butter Cream `#EADCA6`) ================= */}
                <div
                  style={{
                    background: '#11192B',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: '20px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
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
                          background: '#EADCA6',
                        }}
                      />
                      <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#F8FAFC' }}>New</span>
                      <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>
                        {newDeals.length}
                      </span>
                    </div>
                    <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>
                      {formatColumnTotal(newDeals)}
                    </span>
                  </div>

                  {newDeals.map((deal) => (
                    <div
                      key={deal.id}
                      style={{
                        background: '#EADCA6',
                        color: '#18181B',
                        borderRadius: '16px',
                        padding: '14px',
                        boxShadow: '0 10px 24px rgba(0,0,0,0.22)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                      }}
                    >
                      {/* Top Ticket & Timer Row */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#3F3F46' }}>
                            {deal.ticket_number}
                          </span>
                          <span
                            style={{
                              background: 'rgba(255,255,255,0.65)',
                              color: '#18181B',
                              borderRadius: '999px',
                              padding: '2px 8px',
                              fontSize: '10.5px',
                              fontWeight: 700,
                            }}
                          >
                            🕒 {deal.elapsed_minutes} min
                          </span>
                        </div>
                        <button
                          onClick={() => deleteSuperadminCrmDeal(deal.id).then(fetchAllData)}
                          title="Delete ticket"
                          style={{
                            background: 'rgba(24,24,27,0.08)',
                            border: 'none',
                            borderRadius: '50%',
                            width: '24px',
                            height: '24px',
                            cursor: 'pointer',
                            color: '#3F3F46',
                            fontSize: '11px',
                          }}
                        >
                          •••
                        </button>
                      </div>

                      {/* Table / Tenant Title */}
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#18181B', letterSpacing: '-0.01em' }}>
                        🍴 {deal.table_label}
                      </div>

                      {/* Alert Badge + Items List */}
                      <div
                        style={{
                          borderTop: '1px solid rgba(24,24,27,0.1)',
                          borderBottom: '1px solid rgba(24,24,27,0.1)',
                          padding: '8px 0',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                        }}
                      >
                        {deal.alert_badge && (
                          <div style={{ marginBottom: '3px' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                background: '#18181B',
                                color: '#F8FAFC',
                                borderRadius: '6px',
                                padding: '2px 8px',
                                fontSize: '10.5px',
                                fontWeight: 700,
                              }}
                            >
                              ▲ {deal.alert_badge}
                            </span>
                          </div>
                        )}
                        {(deal.items || []).map((line, i) => (
                          <div key={i} style={{ fontSize: '12px', color: '#27272A', fontWeight: 500 }}>
                            {line}
                          </div>
                        ))}
                      </div>

                      {/* Footer: Avatar + Price + Dark `Fire` Button */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div
                            style={{
                              width: '26px',
                              height: '26px',
                              borderRadius: '50%',
                              background: '#18181B',
                              color: '#EADCA6',
                              display: 'grid',
                              placeItems: 'center',
                              fontSize: '10px',
                              fontWeight: 800,
                            }}
                          >
                            {deal.avatar_seed || 'TN'}
                          </div>
                          <span style={{ fontSize: '16px', fontWeight: 800, color: '#18181B' }}>
                            {formatDealPrice(deal)}
                          </span>
                        </div>

                        <button
                          onClick={() => handleAdvanceDeal(deal, 'cooking')}
                          style={{
                            background: '#18181B',
                            color: '#F8FAFC',
                            border: 'none',
                            borderRadius: '999px',
                            padding: '6px 14px',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                          }}
                        >
                          🔥 Fire
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* ================= COLUMN 2: COOKING (Warm Peach `#EFA892`) ================= */}
                <div
                  style={{
                    background: '#11192B',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: '20px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
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
                          background: '#EFA892',
                        }}
                      />
                      <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#F8FAFC' }}>Cooking</span>
                      <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>
                        {cookingDeals.length}
                      </span>
                    </div>
                    <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>
                      {formatColumnTotal(cookingDeals)}
                    </span>
                  </div>

                  {cookingDeals.map((deal) => (
                    <div
                      key={deal.id}
                      style={{
                        background: '#EFA892',
                        color: '#18181B',
                        borderRadius: '16px',
                        padding: '14px',
                        boxShadow: '0 10px 24px rgba(0,0,0,0.22)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#3F3F46' }}>
                            {deal.ticket_number}
                          </span>
                          <span
                            style={{
                              background: 'rgba(255,255,255,0.72)',
                              color: '#9A3412',
                              borderRadius: '999px',
                              padding: '2px 8px',
                              fontSize: '10.5px',
                              fontWeight: 700,
                            }}
                          >
                            🕒 {deal.elapsed_minutes} min
                          </span>
                        </div>
                        <button
                          onClick={() => setElevatedTicket(deal.ticket_number)}
                          style={{
                            background: 'rgba(24,24,27,0.08)',
                            border: 'none',
                            borderRadius: '50%',
                            width: '24px',
                            height: '24px',
                            cursor: 'pointer',
                            color: '#3F3F46',
                            fontSize: '11px',
                          }}
                        >
                          •••
                        </button>
                      </div>

                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#18181B' }}>
                        🍴 {deal.table_label}
                      </div>

                      <div
                        style={{
                          borderTop: '1px solid rgba(24,24,27,0.1)',
                          borderBottom: '1px solid rgba(24,24,27,0.1)',
                          padding: '8px 0',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                        }}
                      >
                        {deal.alert_badge && (
                          <div style={{ marginBottom: '3px' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                background: '#FEF3C7',
                                color: '#92400E',
                                borderRadius: '6px',
                                padding: '2px 8px',
                                fontSize: '10.5px',
                                fontWeight: 700,
                              }}
                            >
                              ▲ {deal.alert_badge}
                            </span>
                          </div>
                        )}
                        {(deal.items || []).map((line, i) => (
                          <div key={i} style={{ fontSize: '12px', color: '#27272A', fontWeight: 500 }}>
                            {line}
                          </div>
                        ))}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div
                            style={{
                              width: '26px',
                              height: '26px',
                              borderRadius: '50%',
                              background: '#18181B',
                              color: '#EFA892',
                              display: 'grid',
                              placeItems: 'center',
                              fontSize: '10px',
                              fontWeight: 800,
                            }}
                          >
                            {deal.avatar_seed || 'KT'}
                          </div>
                          <span style={{ fontSize: '16px', fontWeight: 800, color: '#18181B' }}>
                            {formatDealPrice(deal)}
                          </span>
                        </div>

                        <button
                          onClick={() => handleAdvanceDeal(deal, 'ready')}
                          style={{
                            background: '#FFFFFF',
                            color: '#18181B',
                            border: 'none',
                            borderRadius: '999px',
                            padding: '6px 13px',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.12)',
                          }}
                        >
                          ◎ Mark ready
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* ================= COLUMN 3: READY (Soft Mint `#BCE3D4`) ================= */}
                <div
                  style={{
                    background: '#11192B',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: '20px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    position: 'relative',
                  }}
                >
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
                          background: '#BCE3D4',
                        }}
                      />
                      <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#F8FAFC' }}>Ready</span>
                      <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>
                        {readyDeals.length}
                      </span>
                    </div>
                    <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>
                      {formatColumnTotal(readyDeals)}
                    </span>
                  </div>

                  {readyDeals.map((deal) => {
                    const isElevated = deal.ticket_number === elevatedTicket;
                    return (
                      <div
                        key={deal.id}
                        onClick={() => setElevatedTicket(isElevated ? null : deal.ticket_number)}
                        style={{
                          background: '#BCE3D4',
                          color: '#18181B',
                          borderRadius: '16px',
                          padding: '14px',
                          boxShadow: isElevated
                            ? '0 26px 55px rgba(0,0,0,0.65), 0 0 0 2px #FFF'
                            : '0 10px 24px rgba(0,0,0,0.22)',
                          transform: isElevated ? 'translate(-24px, -6px) rotate(-1.5deg) scale(1.03)' : 'none',
                          transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                          zIndex: isElevated ? 30 : 1,
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#3F3F46' }}>
                              {deal.ticket_number}
                            </span>
                            <span
                              style={{
                                background: 'rgba(255,255,255,0.75)',
                                color: '#065F46',
                                borderRadius: '999px',
                                padding: '2px 8px',
                                fontSize: '10.5px',
                                fontWeight: 700,
                              }}
                            >
                              🕒 {deal.elapsed_minutes} min
                            </span>
                          </div>
                          <span style={{ fontSize: '11px', color: '#3F3F46' }}>•••</span>
                        </div>

                        <div style={{ fontSize: '16px', fontWeight: 800, color: '#18181B' }}>
                          🍴 {deal.table_label}
                        </div>

                        <div
                          style={{
                            borderTop: '1px solid rgba(24,24,27,0.1)',
                            borderBottom: '1px solid rgba(24,24,27,0.1)',
                            padding: '8px 0',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                          }}
                        >
                          {deal.alert_badge && (
                            <div style={{ marginBottom: '3px' }}>
                              <span
                                style={{
                                  display: 'inline-block',
                                  background: '#18181B',
                                  color: '#F8FAFC',
                                  borderRadius: '6px',
                                  padding: '2px 8px',
                                  fontSize: '10.5px',
                                  fontWeight: 700,
                                }}
                              >
                                ▲ {deal.alert_badge}
                              </span>
                            </div>
                          )}
                          {(deal.items || []).map((line, i) => (
                            <div key={i} style={{ fontSize: '12px', color: '#18181B', fontWeight: 500 }}>
                              {line}
                            </div>
                          ))}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div
                              style={{
                                width: '26px',
                                height: '26px',
                                borderRadius: '50%',
                                background: '#065F46',
                                color: '#BCE3D4',
                                display: 'grid',
                                placeItems: 'center',
                                fontSize: '10px',
                                fontWeight: 800,
                              }}
                            >
                              {deal.avatar_seed || 'YT'}
                            </div>
                            <span style={{ fontSize: '16px', fontWeight: 800, color: '#18181B' }}>
                              {formatDealPrice(deal)}
                            </span>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAdvanceDeal(deal, 'served', true);
                            }}
                            style={{
                              background: '#FFFFFF',
                              color: '#18181B',
                              border: 'none',
                              borderRadius: '999px',
                              padding: '6px 14px',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              boxShadow: '0 4px 10px rgba(0,0,0,0.12)',
                            }}
                          >
                            ✓ Served
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ================= COLUMN 4: SERVED / CLOSED WON (Dark Slate `#1B263B`) ================= */}
                <div
                  style={{
                    background: '#11192B',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: '20px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
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
                          background: '#64748B',
                        }}
                      />
                      <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#F8FAFC' }}>Served</span>
                      <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>
                        {servedDeals.length}
                      </span>
                    </div>
                    <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>
                      {formatColumnTotal(servedDeals)}
                    </span>
                  </div>

                  {servedDeals.map((deal) => (
                    <div
                      key={deal.id}
                      style={{
                        background: '#172237',
                        color: '#F8FAFC',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '16px',
                        padding: '14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#94A3B8' }}>
                            {deal.ticket_number}
                          </span>
                          <span style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 600 }}>
                            ✓ {deal.elapsed_minutes} min
                          </span>
                        </div>
                        <span style={{ fontSize: '11px', color: '#64748B' }}>•••</span>
                      </div>

                      <div style={{ fontSize: '15.5px', fontWeight: 700, color: '#F8FAFC' }}>
                        👤 {deal.table_label}
                      </div>

                      <div
                        style={{
                          borderTop: '1px solid rgba(255,255,255,0.07)',
                          borderBottom: '1px solid rgba(255,255,255,0.07)',
                          padding: '8px 0',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                        }}
                      >
                        {deal.alert_badge && (
                          <div style={{ marginBottom: '3px' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                background: '#EADCA6',
                                color: '#18181B',
                                borderRadius: '6px',
                                padding: '2px 8px',
                                fontSize: '10.5px',
                                fontWeight: 700,
                              }}
                            >
                              ▲ {deal.alert_badge}
                            </span>
                          </div>
                        )}
                        {(deal.items || []).map((line, i) => (
                          <div key={i} style={{ fontSize: '12px', color: '#CBD5E1' }}>
                            {line}
                          </div>
                        ))}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div
                            style={{
                              width: '26px',
                              height: '26px',
                              borderRadius: '50%',
                              background: '#263654',
                              color: '#F3A68F',
                              display: 'grid',
                              placeItems: 'center',
                              fontSize: '10px',
                              fontWeight: 800,
                            }}
                          >
                            {deal.avatar_seed || 'LH'}
                          </div>
                          <span style={{ fontSize: '15.5px', fontWeight: 800, color: '#F8FAFC' }}>
                            {formatDealPrice(deal)}
                          </span>
                        </div>

                        <button
                          onClick={() => handleTogglePaymentStatus(deal)}
                          style={{
                            background:
                              deal.payment_status === 'Paid'
                                ? 'rgba(156, 226, 198, 0.14)'
                                : 'rgba(243, 166, 143, 0.16)',
                            color: deal.payment_status === 'Paid' ? '#9CE2C6' : '#F3A68F',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '999px',
                            padding: '5px 12px',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {deal.payment_status === 'Paid' ? '✓ Paid' : 'Unpaid'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* LIST VIEW MODE */
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
                      <th style={{ padding: '14px 18px' }}>Table / Tenant Brand</th>
                      <th style={{ padding: '14px 18px' }}>PIC</th>
                      <th style={{ padding: '14px 18px' }}>Channel / Plan</th>
                      <th style={{ padding: '14px 18px' }}>Stage</th>
                      <th style={{ padding: '14px 18px' }}>Value</th>
                      <th style={{ padding: '14px 18px' }}>Payment</th>
                      <th style={{ padding: '14px 18px', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDeals.map((d) => (
                      <tr key={d.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '13px' }}>
                        <td style={{ padding: '12px 18px', fontWeight: 700, color: '#F3A68F' }}>{d.ticket_number}</td>
                        <td style={{ padding: '12px 18px', fontWeight: 700 }}>{d.table_label}</td>
                        <td style={{ padding: '12px 18px', color: '#CBD5E1' }}>{d.pic_name}</td>
                        <td style={{ padding: '12px 18px', color: '#94A3B8' }}>
                          {d.channel_type} · {String(d.plan_code).toUpperCase()}
                        </td>
                        <td style={{ padding: '12px 18px' }}>
                          <span
                            style={{
                              padding: '3px 10px',
                              borderRadius: '999px',
                              fontSize: '11px',
                              fontWeight: 700,
                              background:
                                d.stage === 'new'
                                  ? '#EADCA6'
                                  : d.stage === 'cooking'
                                  ? '#EFA892'
                                  : d.stage === 'ready'
                                  ? '#BCE3D4'
                                  : '#263654',
                              color: d.stage === 'served' ? '#F8FAFC' : '#18181B',
                            }}
                          >
                            {d.stage.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '12px 18px', fontWeight: 700 }}>{formatDealPrice(d)}</td>
                        <td style={{ padding: '12px 18px' }}>{d.payment_status}</td>
                        <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                          {d.stage !== 'served' && (
                            <button
                              onClick={() =>
                                handleAdvanceDeal(
                                  d,
                                  d.stage === 'new' ? 'cooking' : d.stage === 'cooking' ? 'ready' : 'served',
                                  d.stage === 'ready'
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
        )}

        {/* =====================================================================
            TAB: FLOOR PLAN (Exact REA of Screenshot 2)
           ===================================================================== */}
        {activeTab === 'floor' && <TavolaFloorPlanView onTriggerToast={triggerToast} />}

        {/* =====================================================================
            TAB: REPORTS (Exact REA of Screenshot 3)
           ===================================================================== */}
        {activeTab === 'reports' && (
          <TavolaSalesReportsView currency={currency} onTriggerToast={triggerToast} />
        )}

        {/* =====================================================================
            TAB: OVERVIEW (Executive Platform & SaaS Summary)
           ===================================================================== */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
              <div>
                <h1
                  style={{
                    margin: 0,
                    fontFamily: 'Georgia, "Times New Roman", serif',
                    fontSize: '34px',
                    fontWeight: 400,
                    color: '#F8FAFC',
                  }}
                >
                  Executive Overview
                </h1>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#94A3B8' }}>
                  Real-time Multi-Tenant SaaS telemetry, CRM deal velocity, and PostgreSQL cluster status
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setActiveTab('orders')}
                  style={{
                    background: '#F3A68F',
                    color: '#0F172A',
                    border: 'none',
                    borderRadius: '999px',
                    padding: '9px 18px',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Open Kitchen / Deal Board →
                </button>
                <button
                  onClick={() => setActiveTab('floor')}
                  style={{
                    background: '#18243A',
                    color: '#F8FAFC',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '999px',
                    padding: '9px 18px',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Open Floor Plan →
                </button>
              </div>
            </div>

            {/* 4 Pastel Metric Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '14px',
              }}
            >
              <div style={{ background: '#EADCA6', color: '#18181B', borderRadius: '18px', padding: '18px 20px' }}>
                <div style={{ fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase' }}>Total Tenants Terdaftar</div>
                <div style={{ fontSize: '34px', fontWeight: 800, margin: '6px 0' }}>
                  {stats?.tenants?.total ?? tenants.length}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600 }}>
                  {stats?.tenants?.active ?? tenants.length} Active · {stats?.tenants?.suspended ?? 0} Suspended
                </div>
              </div>

              <div style={{ background: '#EFA892', color: '#18181B', borderRadius: '18px', padding: '18px 20px' }}>
                <div style={{ fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase' }}>Open CRM Pipeline Deals</div>
                <div style={{ fontSize: '34px', fontWeight: 800, margin: '6px 0' }}>{openDealsCount}</div>
                <div style={{ fontSize: '12px', fontWeight: 600 }}>
                  {newDeals.length} New · {cookingDeals.length} Demo · {readyDeals.length} Ready
                </div>
              </div>

              <div style={{ background: '#BCE3D4', color: '#18181B', borderRadius: '18px', padding: '18px 20px' }}>
                <div style={{ fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase' }}>Total Cabang & Staff POS</div>
                <div style={{ fontSize: '34px', fontWeight: 800, margin: '6px 0' }}>
                  {stats?.branches?.total ?? 1} Cabang
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600 }}>
                  {stats?.users?.total ?? 4} Akun Staff ({stats?.users?.cashiers ?? 1} Kasir)
                </div>
              </div>

              <div
                style={{
                  background: '#172237',
                  color: '#F8FAFC',
                  border: '1px solid rgba(255,255,255,0.09)',
                  borderRadius: '18px',
                  padding: '18px 20px',
                }}
              >
                <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>
                  Total Transaksi POS Live
                </div>
                <div style={{ fontSize: '34px', fontWeight: 800, margin: '6px 0', color: '#F3A68F' }}>
                  {stats?.platform?.total_transactions ?? 0} Trx
                </div>
                <div style={{ fontSize: '12px', color: '#CBD5E1' }}>
                  GMV: Rp {Number(stats?.platform?.total_gmv || 0).toLocaleString('id-ID')}
                </div>
              </div>
            </div>

            {/* Quick Navigation Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '14px' }}>
              {[
                {
                  title: 'Kitchen & CRM Deal Board',
                  desc: 'Kanban 4 kolom (New, Cooking, Ready, Served) untuk memantau pipeline deal tenant dan tiket pesanan.',
                  tab: 'orders',
                  badge: `${deals.length} Tiket Aktif`,
                  color: '#F3A68F',
                },
                {
                  title: 'Interactive Blueprint Floor Plan',
                  desc: 'Denah meja & klaster outlet interaktif dengan status kapasitas, antrean waitlist, dan penugasan server.',
                  tab: 'floor',
                  badge: '12 Node Klaster',
                  color: '#EADCA6',
                },
                {
                  title: 'SaaS & POS Sales Reports',
                  desc: 'Analitik pendapatan 90 hari, donut channel mix, heatmap jam tersibuk 7x12, dan prime cost margin.',
                  tab: 'reports',
                  badge: 'Export CSV Ready',
                  color: '#BCE3D4',
                },
              ].map((card) => (
                <div
                  key={card.tab}
                  onClick={() => setActiveTab(card.tab)}
                  style={{
                    background: '#121B2D',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '18px',
                    padding: '20px',
                    cursor: 'pointer',
                  }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '3px 10px',
                      borderRadius: '999px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: card.color,
                      color: '#0F172A',
                      marginBottom: '10px',
                    }}
                  >
                    {card.badge}
                  </span>
                  <h3 style={{ margin: '0 0 6px', fontSize: '17px', color: '#F8FAFC' }}>{card.title}</h3>
                  <p style={{ margin: 0, fontSize: '12.5px', color: '#94A3B8', lineHeight: 1.5 }}>{card.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB: RESERVATIONS / TENANTS DIRECTORY (Live PostgreSQL `tenants` CRUD)
           ===================================================================== */}
        {activeTab === 'reservations' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h1
                  style={{
                    margin: 0,
                    fontFamily: 'Georgia, "Times New Roman", serif',
                    fontSize: '34px',
                    fontWeight: 400,
                    color: '#F8FAFC',
                  }}
                >
                  Tenants & Subscriptions
                </h1>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#94A3B8' }}>
                  Kelola seluruh tenant restoran aktif, paket langganan (Starter / Pro / Franchise), dan status akses
                </p>
              </div>

              <button
                onClick={() => setShowOnboardModal(true)}
                style={{
                  background: '#F3A68F',
                  color: '#0F172A',
                  border: 'none',
                  borderRadius: '999px',
                  padding: '9px 18px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                + Deploy Tenant Baru
              </button>
            </div>

            <div
              style={{
                background: '#121B2D',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '20px',
                overflowX: 'auto',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#94A3B8', fontSize: '12px' }}>
                    <th style={{ padding: '14px 18px' }}>ID & Nama Tenant</th>
                    <th style={{ padding: '14px 18px' }}>Owner / Admin</th>
                    <th style={{ padding: '14px 18px' }}>Cabang & User</th>
                    <th style={{ padding: '14px 18px' }}>Paket Langganan</th>
                    <th style={{ padding: '14px 18px' }}>Status</th>
                    <th style={{ padding: '14px 18px', textAlign: 'right' }}>Kontrol Cepat</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map((t) => (
                    <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '13px' }}>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: 700, color: '#F8FAFC' }}>{t.name}</div>
                        <div style={{ fontSize: '11.5px', color: '#64748B' }}>
                          slug: <code>{t.slug}</code> {t.domain ? `· ${t.domain}` : ''}
                        </div>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: 600, color: '#E2E8F0' }}>{t.owner_name || 'Admin Tenant'}</div>
                        <div style={{ fontSize: '11.5px', color: '#64748B' }}>{t.owner_email || '-'}</div>
                      </td>
                      <td style={{ padding: '14px 18px', color: '#CBD5E1' }}>
                        {t.branch_count} Cabang · {t.user_count} User
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <select
                          disabled={updatingTenantId === t.id}
                          value={t.plan_code || 'starter'}
                          onChange={(e) => handlePlanChange(t.id, e.target.value)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '999px',
                            border: '1px solid rgba(255,255,255,0.12)',
                            background:
                              t.plan_code === 'franchise'
                                ? '#F3A68F'
                                : t.plan_code === 'pro'
                                ? '#EADCA6'
                                : '#1E2C46',
                            color: t.plan_code === 'starter' ? '#F8FAFC' : '#0F172A',
                            fontWeight: 700,
                            fontSize: '12px',
                            cursor: 'pointer',
                          }}
                        >
                          <option value="starter">STARTER</option>
                          <option value="pro">PRO</option>
                          <option value="franchise">FRANCHISE</option>
                        </select>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: '999px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: t.status === 'active' ? 'rgba(156,226,198,0.16)' : 'rgba(243,166,143,0.18)',
                            color: t.status === 'active' ? '#9CE2C6' : '#F3A68F',
                          }}
                        >
                          {String(t.status || 'active').toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        {t.status === 'active' ? (
                          <button
                            disabled={updatingTenantId === t.id}
                            onClick={() => handleStatusChange(t.id, 'suspended')}
                            style={{
                              background: 'rgba(243,166,143,0.15)',
                              color: '#F3A68F',
                              border: '1px solid rgba(243,166,143,0.3)',
                              borderRadius: '999px',
                              padding: '5px 12px',
                              fontSize: '11.5px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Suspend
                          </button>
                        ) : (
                          <button
                            disabled={updatingTenantId === t.id}
                            onClick={() => handleStatusChange(t.id, 'active')}
                            style={{
                              background: '#BCE3D4',
                              color: '#0F172A',
                              border: 'none',
                              borderRadius: '999px',
                              padding: '5px 12px',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            Aktifkan
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB: MENU (SaaS Packages & Pricing Tiers)
           ===================================================================== */}
        {activeTab === 'menu' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <h1
                style={{
                  margin: 0,
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontSize: '34px',
                  fontWeight: 400,
                  color: '#F8FAFC',
                }}
              >
                SaaS Packages & Pricing Menu
              </h1>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#94A3B8' }}>
                Katalog paket berlangganan Santapos untuk penawaran CRM Deal Board
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
              {[
                {
                  code: 'starter',
                  name: 'Starter Cloud POS',
                  price: 'Rp 299.000 / bln',
                  usd: '$19 / mo',
                  bg: '#EADCA6',
                  features: [
                    '1 Cabang & 3 Akun Staff Kasir',
                    'POS Kasir Realtime & Cetak Struk Bluetooth',
                    'QR Table Self-Order Dasar',
                    'Laporan Penjualan Harian',
                  ],
                },
                {
                  code: 'pro',
                  name: 'Pro Multi-Outlet Suite',
                  price: 'Rp 799.000 / bln',
                  usd: '$49 / mo',
                  bg: '#EFA892',
                  features: [
                    'Hingga 5 Cabang & 25 Akun Staff',
                    'Manajemen Stok Bahan Baku & HPP Resep',
                    'Integrasi Midtrans QRIS & Webhook Otomatis',
                    'AI Smart Assistant & Kitchen Display System',
                  ],
                },
                {
                  code: 'franchise',
                  name: 'Franchise Enterprise HQ',
                  price: 'Rp 2.490.000 / bln',
                  usd: '$149 / mo',
                  bg: '#BCE3D4',
                  features: [
                    'Unlimited Cabang & Unlimited Staff',
                    'Franchise HQ Consolidated Financial Ledger',
                    'Dedicated Supabase / Neon Database Pool',
                    'Custom Domain & White-Label Receipt Branding',
                  ],
                },
              ].map((pkg) => (
                <div
                  key={pkg.code}
                  style={{
                    background: pkg.bg,
                    color: '#18181B',
                    borderRadius: '20px',
                    padding: '22px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '14px',
                  }}
                >
                  <div>
                    <span
                      style={{
                        background: '#18181B',
                        color: '#F8FAFC',
                        padding: '3px 10px',
                        borderRadius: '999px',
                        fontSize: '10.5px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                      }}
                    >
                      {pkg.code}
                    </span>
                    <h3 style={{ margin: '10px 0 4px', fontSize: '22px', fontWeight: 800 }}>{pkg.name}</h3>
                    <div style={{ fontSize: '18px', fontWeight: 800 }}>
                      {currency === 'IDR' ? pkg.price : pkg.usd}
                    </div>
                    <ul style={{ margin: '14px 0 0', paddingLeft: '18px', fontSize: '12.5px', lineHeight: 1.7 }}>
                      {pkg.features.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => {
                      setNewDealForm((p) => ({ ...p, plan_code: pkg.code }));
                      setShowNewDealModal(true);
                    }}
                    style={{
                      background: '#18181B',
                      color: '#F8FAFC',
                      border: 'none',
                      borderRadius: '999px',
                      padding: '10px 16px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    + Buat Deal Paket {pkg.code.toUpperCase()}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB: INVENTORY (Database & Cloud Storage + Midtrans Gateway Shortcut)
           ===================================================================== */}
        {activeTab === 'inventory' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h1
                  style={{
                    margin: 0,
                    fontFamily: 'Georgia, "Times New Roman", serif',
                    fontSize: '34px',
                    fontWeight: 400,
                    color: '#F8FAFC',
                  }}
                >
                  Database, Cloud Storage & Payment Gateway
                </h1>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#94A3B8' }}>
                  Konfigurasi koneksi PostgreSQL (Supabase / Neon), 1-Click Schema Migration, S3 Bucket, dan Rekonsiliasi Midtrans
                </p>
              </div>

              <Link
                href="/dashboard/payment-gateway"
                style={{
                  background: '#F3A68F',
                  color: '#0F172A',
                  textDecoration: 'none',
                  borderRadius: '999px',
                  padding: '9px 18px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                }}
              >
                💳 Buka Audit & Sync Midtrans →
              </Link>
            </div>

            <DatabaseSettingsPanel />
          </div>
        )}

        {/* =====================================================================
            TAB: STAFF (Account Managers & Live Staff Overview)
           ===================================================================== */}
        {activeTab === 'staff' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <h1
                style={{
                  margin: 0,
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontSize: '34px',
                  fontWeight: 400,
                  color: '#F8FAFC',
                }}
              >
                Staff & Account Managers
              </h1>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#94A3B8' }}>
                Tim onboarding SaaS Superadmin dan ringkasan pengguna aktif lintas tenant
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '14px' }}>
              {[
                { name: 'Super Admin Santapos', email: 'superadmin@santapos.id', role: 'SUPERADMIN', badge: '#F3A68F' },
                { name: 'Admin Demo Resto', email: 'admin@santapos.id', role: 'ADMIN TOKO', badge: '#EADCA6' },
                { name: 'Kasir Cabang Utama', email: 'kasir@santapos.id', role: 'KASIR POS', badge: '#BCE3D4' },
                { name: 'Tim Dapur (KDS)', email: 'kitchen@santapos.id', role: 'KITCHEN', badge: '#93C5FD' },
              ].map((u) => (
                <div
                  key={u.email}
                  style={{
                    background: '#121B2D',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '18px',
                    padding: '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <span
                    style={{
                      alignSelf: 'flex-start',
                      padding: '3px 10px',
                      borderRadius: '999px',
                      fontSize: '10.5px',
                      fontWeight: 800,
                      background: u.badge,
                      color: '#0F172A',
                    }}
                  >
                    {u.role}
                  </span>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#F8FAFC' }}>{u.name}</div>
                  <div style={{ fontSize: '12px', color: '#94A3B8' }}>{u.email}</div>
                  <div style={{ fontSize: '11px', color: '#9CE2C6', marginTop: '4px' }}>● Ready · Password: santapos123</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* =====================================================================
          MODAL: + NEW ORDER / CRM DEAL
         ===================================================================== */}
      {showNewDealModal && (
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
            onSubmit={handleCreateNewDeal}
            style={{
              width: '100%',
              maxWidth: '480px',
              background: '#131C2E',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '22px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#F8FAFC' }}>+ New Kitchen Ticket / Tenant Deal</h3>
              <button
                type="button"
                onClick={() => setShowNewDealModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#94A3B8', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div>
              <label style={{ fontSize: '11.5px', color: '#94A3B8' }}>Table / Label Kartu</label>
              <input
                type="text"
                required
                placeholder="Contoh: Table 8 · Hoka Hoka Bento"
                value={newDealForm.table_label}
                onChange={(e) => setNewDealForm((p) => ({ ...p, table_label: e.target.value, tenant_brand: e.target.value }))}
                style={{
                  width: '100%',
                  marginTop: '4px',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: '#0C1322',
                  color: '#F8FAFC',
                  fontSize: '13px',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11.5px', color: '#94A3B8' }}>Nama PIC / Guest</label>
                <input
                  type="text"
                  placeholder="Contoh: Hendra Wijaya"
                  value={newDealForm.pic_name}
                  onChange={(e) => setNewDealForm((p) => ({ ...p, pic_name: e.target.value }))}
                  style={{
                    width: '100%',
                    marginTop: '4px',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: '#0C1322',
                    color: '#F8FAFC',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11.5px', color: '#94A3B8' }}>Nilai ($ USD)</label>
                <input
                  type="number"
                  value={newDealForm.amount_usd}
                  onChange={(e) => setNewDealForm((p) => ({ ...p, amount_usd: e.target.value }))}
                  style={{
                    width: '100%',
                    marginTop: '4px',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: '#0C1322',
                    color: '#F8FAFC',
                    fontSize: '13px',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11.5px', color: '#94A3B8' }}>Channel</label>
                <select
                  value={newDealForm.channel_type}
                  onChange={(e) => setNewDealForm((p) => ({ ...p, channel_type: e.target.value }))}
                  style={{
                    width: '100%',
                    marginTop: '4px',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: '#0C1322',
                    color: '#F8FAFC',
                    fontSize: '13px',
                  }}
                >
                  <option value="Dine-in">Dine-in · Franchise</option>
                  <option value="Takeaway">Takeaway · Pro</option>
                  <option value="Delivery">Delivery · Starter</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11.5px', color: '#94A3B8' }}>Paket SaaS</label>
                <select
                  value={newDealForm.plan_code}
                  onChange={(e) => setNewDealForm((p) => ({ ...p, plan_code: e.target.value }))}
                  style={{
                    width: '100%',
                    marginTop: '4px',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: '#0C1322',
                    color: '#F8FAFC',
                    fontSize: '13px',
                  }}
                >
                  <option value="franchise">Franchise</option>
                  <option value="pro">Pro</option>
                  <option value="starter">Starter</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '11.5px', color: '#94A3B8' }}>Item Pesanan / Modul (1 per baris)</label>
              <textarea
                rows={4}
                value={newDealForm.items_text}
                onChange={(e) => setNewDealForm((p) => ({ ...p, items_text: e.target.value }))}
                style={{
                  width: '100%',
                  marginTop: '4px',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: '#0C1322',
                  color: '#F8FAFC',
                  fontSize: '12.5px',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => setShowNewDealModal(false)}
                style={{
                  background: '#1E2C46',
                  color: '#CBD5E1',
                  border: 'none',
                  borderRadius: '999px',
                  padding: '8px 16px',
                  fontSize: '12.5px',
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
                  padding: '8px 20px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Simpan ke Board
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =====================================================================
          MODAL: + DEPLOY NEW TENANT
         ===================================================================== */}
      {showOnboardModal && (
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
            onSubmit={handleOnboardSubmit}
            style={{
              width: '100%',
              maxWidth: '440px',
              background: '#131C2E',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '22px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <h3 style={{ margin: 0, fontSize: '18px', color: '#F8FAFC' }}>Deploy Tenant Restoran Baru</h3>
            <input
              type="text"
              required
              placeholder="Nama Brand Restoran"
              value={onboardForm.tenant_name}
              onChange={(e) => setOnboardForm((p) => ({ ...p, tenant_name: e.target.value }))}
              style={{
                padding: '9px 12px',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.12)',
                background: '#0C1322',
                color: '#F8FAFC',
              }}
            />
            <input
              type="text"
              required
              placeholder="Nama Pemilik / PIC"
              value={onboardForm.owner_name}
              onChange={(e) => setOnboardForm((p) => ({ ...p, owner_name: e.target.value }))}
              style={{
                padding: '9px 12px',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.12)',
                background: '#0C1322',
                color: '#F8FAFC',
              }}
            />
            <input
              type="email"
              required
              placeholder="Email Login Admin Tenant"
              value={onboardForm.email}
              onChange={(e) => setOnboardForm((p) => ({ ...p, email: e.target.value }))}
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
                onClick={() => setShowOnboardModal(false)}
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
                  background: '#BCE3D4',
                  color: '#0F172A',
                  border: 'none',
                  borderRadius: '999px',
                  padding: '8px 18px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Deploy Sekarang
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =====================================================================
          BOTTOM FLOATING TOAST WITH [Undo] BUTTON (Exact Match to Screenshots 2 & 3)
         ===================================================================== */}
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
              onClick={() => {
                toastInfo.undoAction();
                setToastInfo((prev) => ({ ...prev, undoAction: null, message: 'Action undone' }));
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
  );
}
