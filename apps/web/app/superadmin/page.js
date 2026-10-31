'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
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
import TavolaSalesReportsView from '@/components/superadmin/TavolaSalesReportsView';
import MurmuraOverviewView from '@/components/superadmin/MurmuraOverviewView';
import MurmuraCalendarView from '@/components/superadmin/MurmuraCalendarView';

const MURMURA_NAV_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'orders', label: 'Compose' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'inbox', label: 'Inbox', badge: 14, badgeBg: '#F2B249' },
  { id: 'approvals', label: 'Approvals', badge: 5, badgeBg: '#F2B249' },
  { id: 'reports', label: 'Analytics' },
  { id: 'listening', label: 'Listening' },
];

const INITIAL_INBOX_MESSAGES = [
  {
    id: 'inb-1',
    brand: 'Ember & Oak',
    badgeCode: 'EO',
    badgeColor: '#D94E34',
    sender: 'Rio Pratama (Owner)',
    subject: 'Requesting approval for 14-table Kemang Flagship POS & Barista KDS rollout',
    snippet:
      'Halo tim Superadmin, kami sudah mengunggah denah 14 meja dan menu musim gugur. Mohon approval agar jadwal rilis besok pukul 09:00 AM berjalan otomatis.',
    time: '4m ago',
    channel: 'Enterprise Ticket',
    unread: true,
    plan: 'franchise',
  },
  {
    id: 'inb-2',
    brand: 'Ramen Ya! GI',
    badgeCode: 'RY',
    badgeColor: '#C84B31',
    sender: 'Hendra Wijaya (Ops Director)',
    subject: 'Midtrans QRIS Dynamic Split-Bill untuk 12 cabang Jabodetabek',
    snippet:
      'Kami ingin mengaktifkan fitur pembayaran split-bill langsung dari meja QR Self-Order mulai Jumat ini.',
    time: '18m ago',
    channel: 'WhatsApp Business',
    unread: true,
    plan: 'franchise',
  },
  {
    id: 'inb-3',
    brand: 'Wildroot Botanics',
    badgeCode: 'WB',
    badgeColor: '#0E7C5B',
    sender: 'Nia Kusuma (General Manager)',
    subject: 'Integrasi resep HPP otomatis & pengurangan stok daun teh',
    snippet:
      'Mohon dibantu review skema HPP bahan baku kami sebelum cutover shift malam pukul 20:00.',
    time: '42m ago',
    channel: 'In-App Support',
    unread: true,
    plan: 'pro',
  },
  {
    id: 'inb-4',
    brand: 'Hollow Home Bistro',
    badgeCode: 'HH',
    badgeColor: '#B45309',
    sender: 'Freya Lindqvist',
    subject: 'Penambahan zona Terrace 8 meja pada Interactive Floor Plan Kasir',
    snippet:
      'Apakah kapasitas kursi untuk meja Terrace T1–T8 bisa disetel 6 pax per meja?',
    time: '1h ago',
    channel: 'Email CRM',
    unread: false,
    plan: 'pro',
  },
];

export default function SuperadminPage() {
  // Default to 'overview' (Murmura Executive CRM Overview - Gambar 1)
  const [activeTab, setActiveTab] = useState('overview');
  // Theme: 'murmura' (Warm Alabaster Cream + Mint Sage - Gambar 1..4) | 'tavola' (Midnight Slate Dark)
  const [theme, setTheme] = useState('murmura');
  const [currency, setCurrency] = useState('USD'); // 'USD' or 'IDR'
  const [brandHeaderMode, setBrandHeaderMode] = useState('murmura'); // 'murmura' or 'santapos'
  const [selectedTenantFilter, setSelectedTenantFilter] = useState('All tenants');

  // Backend state
  const [stats, setStats] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingTenantId, setUpdatingTenantId] = useState(null);

  // Inbox state
  const [inboxMessages, setInboxMessages] = useState(INITIAL_INBOX_MESSAGES);
  const [selectedInboxId, setSelectedInboxId] = useState('inb-1');

  // Filters & Drag-and-Drop on Compose / CRM Deals Board
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState('All');
  const [stationFilter, setStationFilter] = useState('All stations');
  const [viewMode, setViewMode] = useState('Board'); // 'Board' | 'List'
  const [elevatedTicket, setElevatedTicket] = useState('#1062');
  const [draggedDeal, setDraggedDeal] = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);
  const [newlyInsertedDealId, setNewlyInsertedDealId] = useState(null);
  const [recentlyUpdatedStage, setRecentlyUpdatedStage] = useState(null);

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
    items_text:
      '1x Paket Franchise Multi-Cabang\n1x POS Kasir + Kitchen Display\n2x QR Table Self-Order\n1x Midtrans QRIS Sync',
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

  // 3-Role Operational Switcher Menu (Admin / Kasir / Kitchen)
  const [showRoleSwitcherMenu, setShowRoleSwitcherMenu] = useState(false);

  // Dynamic Font Style (3 Options Switcher with localStorage persistence)
  const [fontStyle, setFontStyle] = useState('murmura'); // 'murmura' | 'editorial' | 'hightech'
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [notifFilter, setNotifFilter] = useState('all');
  const [notificationList, setNotificationList] = useState([
    {
      id: 'notif-1',
      brand: 'Ember & Oak',
      title: 'Deal #1064 siap cutover',
      message: 'Onboarding 14 meja Kemang Flagship berhasil diverifikasi ke tahap READY.',
      time: '2m lalu',
      unread: true,
      category: 'deals',
      badgeColor: '#0E7C5B',
    },
    {
      id: 'notif-2',
      brand: 'Kitchen KDS Kemang',
      title: 'Tiket #1069 Meja 1 melewati SLA',
      message: 'Pesanan sudah 4 menit berada di stasiun Griddle. Perlu monitoring tim dapur.',
      time: '6m lalu',
      unread: true,
      category: 'kds',
      badgeColor: '#D94E34',
    },
    {
      id: 'notif-3',
      brand: 'Midtrans QRIS Settlement',
      title: 'Batch settlement berhasil',
      message: 'Pencairan dana transaksi QRIS harian Rp 14.850.000 sukses masuk rekening escrow.',
      time: '24m lalu',
      unread: true,
      category: 'finance',
      badgeColor: '#2563EB',
    },
    {
      id: 'notif-4',
      brand: 'Ramen Ya! GI',
      title: 'Permintaan 8 Tablet Meja Self-Order',
      message: 'Tenant mengajukan penambahan lisensi terminal POS cabang Grand Indonesia.',
      time: '1h lalu',
      unread: false,
      category: 'deals',
      badgeColor: '#F59E0B',
    },
  ]);

  const unreadNotifCount = notificationList.filter((n) => n.unread).length;

  const handleToggleReadNotification = (id) => {
    setNotificationList((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: !n.unread } : n))
    );
  };

  const handleBulkToggleAllNotifications = () => {
    const hasUnread = notificationList.some((n) => n.unread);
    setNotificationList((prev) => prev.map((n) => ({ ...n, unread: !hasUnread })));
    triggerToast(
      hasUnread
        ? 'Seluruh notifikasi ditandai sudah dibaca'
        : 'Seluruh notifikasi ditandai belum dibaca',
      null,
      'Pusat Notifikasi'
    );
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedFont = localStorage.getItem('santapos_superadmin_font');
      if (savedFont && ['murmura', 'editorial', 'hightech'].includes(savedFont)) {
        setFontStyle(savedFont);
      }
    }
  }, []);

  const handleSelectFontStyle = (style) => {
    setFontStyle(style);
    if (typeof window !== 'undefined') {
      localStorage.setItem('santapos_superadmin_font', style);
    }
    const nameMap = {
      murmura: 'Murmura Neo-Humanist (Plus Jakarta Sans)',
      editorial: 'Editorial Luxury Bistro (Playfair + DM Sans)',
      hightech: 'Swiss Minimalist (Geist Sans + Mono)',
    };
    triggerToast(`Font berhasil diganti ke: ${nameMap[style]}`, null, 'Gaya Tipografi Diperbarui');
  };

  const activeFontFamily = useMemo(() => {
    if (fontStyle === 'editorial') {
      return {
        display: 'var(--font-playfair), Georgia, "Times New Roman", serif',
        body: 'var(--font-dm-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        mono: 'var(--font-dm-sans), monospace',
        name: 'Editorial Luxury Bistro',
      };
    }
    if (fontStyle === 'hightech') {
      return {
        display: 'var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        body: 'var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        mono: 'var(--font-geist-mono), monospace',
        name: 'Swiss Minimalist Tech',
      };
    }
    // Default 'murmura'
    return {
      display: 'var(--font-plus-jakarta), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      body: 'var(--font-plus-jakarta), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      mono: 'var(--font-geist-mono), monospace',
      name: 'Murmura Neo-Humanist',
    };
  }, [fontStyle]);

  // Theme-Matched Non-Blocking Toast with Auto-Dismiss & Undo
  const [toastInfo, setToastInfo] = useState({
    id: 0,
    visible: false,
    title: 'Perubahan Berhasil Disimpan',
    message: '',
    undoAction: null,
  });

  const triggerToast = (message, undoAction = null, title = 'Perubahan Berhasil Disimpan') => {
    setToastInfo({
      id: Date.now(),
      visible: true,
      title,
      message,
      undoAction,
    });
  };

  useEffect(() => {
    if (!toastInfo.visible) return;
    const timer = setTimeout(() => {
      setToastInfo((prev) => ({ ...prev, visible: false }));
    }, 3800);
    return () => clearTimeout(timer);
  }, [toastInfo.id, toastInfo.visible]);

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

  const isLight = theme === 'murmura';
  const textPrimary = isLight ? '#14171D' : '#F8FAFC';
  const textSecondary = isLight ? '#5A6065' : '#94A3B8';
  const textMuted = isLight ? '#8C9196' : '#64748B';
  const surfaceBg = isLight ? '#FFFFFF' : '#131C2E';
  const surfaceBorder = isLight ? 'rgba(20, 23, 29, 0.08)' : 'rgba(255, 255, 255, 0.08)';

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
      if (selectedTenantFilter !== 'All tenants') {
        const brandMatch =
          String(d.tenant_brand || '').toLowerCase().includes(selectedTenantFilter.toLowerCase()) ||
          String(d.table_label || '').toLowerCase().includes(selectedTenantFilter.toLowerCase());
        if (!brandMatch) return false;
      }
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
  }, [deals, selectedTenantFilter, channelFilter, stationFilter, searchQuery]);

  const newDeals = filteredDeals.filter((d) => d.stage === 'new');
  const cookingDeals = filteredDeals.filter((d) => d.stage === 'cooking');
  const readyDeals = filteredDeals.filter((d) => d.stage === 'ready');
  const servedDeals = filteredDeals.filter((d) => d.stage === 'served');
  const openDealsCount = newDeals.length + cookingDeals.length + readyDeals.length;

  // Advance or Drag-and-Drop Deal Stage on Kanban Card
  const handleAdvanceDeal = async (deal, targetStage, provisionTenant = false) => {
    if (!deal || deal.stage === targetStage) return;
    const previousStage = deal.stage;
    const previousPayment = deal.payment_status;

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

    // Bump destination counter and link activity notification with ringing bell!
    setRecentlyUpdatedStage(targetStage);
    setTimeout(() => setRecentlyUpdatedStage(null), 1200);

    setNotificationList((prev) => [
      {
        id: `notif-move-${Date.now()}`,
        brand: deal.table_label,
        title: `Tahap Diperbarui (${deal.ticket_number})`,
        message: `Deal dipindahkan dari ${previousStage.toUpperCase()} ke ${targetStage.toUpperCase()}.`,
        time: 'Baru saja',
        unread: true,
        category: 'deals',
        badgeColor: targetStage === 'served' ? '#0E7C5B' : targetStage === 'ready' ? '#10B981' : '#F59E0B',
      },
      ...prev,
    ]);

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

  const handleDropDealOnColumn = (targetStage) => {
    setDragOverStage(null);
    if (!draggedDeal || draggedDeal.stage === targetStage) {
      setDraggedDeal(null);
      return;
    }
    handleAdvanceDeal(draggedDeal, targetStage, targetStage === 'served');
    setDraggedDeal(null);
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
        table_label:
          newDealForm.table_label ||
          `Table ${Math.floor(1 + Math.random() * 14)} · ${newDealForm.tenant_brand}`,
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
        const newDeal = res.data.data;
        setDeals((prev) => [newDeal, ...prev]);
        setNewlyInsertedDealId(newDeal.id);
        setTimeout(() => setNewlyInsertedDealId(null), 3000);
        setRecentlyUpdatedStage('new');
        setTimeout(() => setRecentlyUpdatedStage(null), 1200);

        setNotificationList((prev) => [
          {
            id: `notif-new-${Date.now()}`,
            brand: newDeal.tenant_brand || newDeal.table_label,
            title: `Deal Baru Ditambahkan (${newDeal.ticket_number})`,
            message: `${newDeal.table_label} berhasil didaftarkan ke tahap NEW.`,
            time: 'Baru saja',
            unread: true,
            category: 'deals',
            badgeColor: '#0E7C5B',
          },
          ...prev,
        ]);

        triggerToast(
          `Created new tenant deal ${newDeal.ticket_number} (${newDeal.table_label})`
        );
      }
      setShowNewDealModal(false);
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
        background: isLight
          ? '#F5F4EE'
          : 'radial-gradient(circle at 20% 0%, #17233B 0%, #0B111E 55%, #080D18 100%)',
        backgroundImage: isLight
          ? 'radial-gradient(circle at 14% 10%, rgba(208, 238, 225, 0.92) 0%, rgba(235, 245, 239, 0.55) 28%, rgba(245, 244, 238, 0) 56%)'
          : undefined,
        color: textPrimary,
        fontFamily: activeFontFamily.body,
        position: 'relative',
        paddingBottom: '90px',
        transition: 'background 0.28s ease, color 0.2s ease',
      }}
    >
      {/* GLOBAL CHOREOGRAPHY KEYFRAMES (@motion-design-skill & @cast) */}
      <style>{`
        @keyframes murmuraFadeSlideIn {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes murmuraTitleRise {
          0% { opacity: 0; transform: translateY(65%); }
          100% { opacity: 1; transform: translateY(0%); }
        }
        @keyframes murmuraCardSpringPop {
          0% { opacity: 0; transform: translateY(14px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes murmuraToastSlideUp {
          0% { opacity: 0; transform: translate3d(0, 20px, 0) scale(0.96); }
          100% { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
        }
        @keyframes murmuraToastProgress {
          0% { transform: scaleX(1); }
          100% { transform: scaleX(0); }
        }
      `}</style>

      {/* =====================================================================
          TOP FLOATING NAVIGATION BAR (Exact Restoration of Murmura Screenshots 1–4)
         ===================================================================== */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 55,
          padding: '14px 28px 12px 28px',
          background: isLight
            ? 'linear-gradient(180deg, rgba(245, 244, 238, 0.96) 0%, rgba(245, 244, 238, 0.85) 85%, transparent 100%)'
            : 'linear-gradient(180deg, rgba(11,17,30,0.96) 0%, rgba(11,17,30,0.82) 85%, transparent 100%)',
          backdropFilter: 'blur(14px)',
          display: 'grid',
          gridTemplateColumns: 'auto 1fr auto',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        {/* Left Brand Logo (`murmura` / `santapos` with Dark Rounded Square Icon) */}
        <div
          onClick={() =>
            setBrandHeaderMode((m) => (m === 'murmura' ? 'santapos' : 'murmura'))
          }
          title="Click to toggle header label (murmura / santapos)"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '9px',
              background: '#161920',
              color: '#FFFFFF',
              display: 'grid',
              placeItems: 'center',
              boxShadow: '0 4px 12px rgba(22, 25, 32, 0.18)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12c2.5-4 5.5-4 8 0s5.5 4 8 0 3.5-2 4-2" />
            </svg>
          </div>
          <span
            style={{
              fontSize: '18.5px',
              fontWeight: 700,
              letterSpacing: '-0.03em',
              color: textPrimary,
            }}
          >
            {brandHeaderMode === 'murmura' ? 'murmura' : 'santapos'}
          </span>
        </div>

        {/* Center Navigation Tabs (`Overview`, `Compose`, `Calendar`, `Inbox 14`, `Approvals 5`, `Analytics`, `Listening`) */}
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2px',
            flexWrap: 'nowrap',
          }}
        >
          {MURMURA_NAV_TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '999px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: active ? 600 : 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  background: active
                    ? isLight
                      ? '#161920'
                      : '#F2B249'
                    : 'transparent',
                  color: active
                    ? isLight
                      ? '#FFFFFF'
                      : '#14171D'
                    : textSecondary,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.18s ease',
                }}
              >
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    style={{
                      padding: '1px 6.5px',
                      borderRadius: '999px',
                      background: tab.badgeBg || '#F2B249',
                      color: '#14171D',
                      fontSize: '10.5px',
                      fontWeight: 800,
                      lineHeight: 1.35,
                    }}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Controls: `[All brands ▾]` + `[3-Role Hub ▾]` + `[$ USD]` + Bell + Avatar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '8px',
            flexWrap: 'nowrap',
            flexShrink: 0,
            position: 'relative',
          }}
        >
          {/* All brands / tenants pill selector (Constrained width — Exact Match to Screenshots 1–4) */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              padding: '4px 10px 4px 5px',
              borderRadius: '999px',
              background: surfaceBg,
              border: `1px solid ${surfaceBorder}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            }}
          >
            <span
              style={{
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                background: '#161920',
                color: '#FFFFFF',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
              }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
              </svg>
            </span>
            <select
              value={selectedTenantFilter}
              onChange={(e) => setSelectedTenantFilter(e.target.value)}
              style={{
                width: '88px',
                maxWidth: '88px',
                border: 'none',
                outline: 'none',
                background: 'transparent',
                color: textPrimary,
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                textOverflow: 'ellipsis',
              }}
            >
              <option value="All tenants">All brands</option>
              <option value="Ember & Oak">Ember & Oak</option>
              <option value="Ramen Ya">Ramen Ya! GI</option>
              <option value="Wildroot">Wildroot Botanics</option>
              <option value="Hollow Home">Hollow Home Bistro</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* COMPACT SWITCHER TO UNIFIED 3-ROLE DASHBOARD (Admin · Kasir · Kitchen) */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setShowRoleSwitcherMenu((prev) => !prev)}
              title="Switch ke Dashboard Gabungan 3-Role (Admin · Kasir POS · Kitchen KDS)"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '999px',
                border: '1px solid rgba(14, 124, 91, 0.35)',
                background: '#0E7C5B',
                color: '#FFFFFF',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 12px rgba(14, 124, 91, 0.22)',
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="9" rx="1.5" />
                <rect x="14" y="3" width="7" height="5" rx="1.5" />
                <rect x="14" y="12" width="7" height="9" rx="1.5" />
                <rect x="3" y="16" width="7" height="5" rx="1.5" />
              </svg>
              <span>3-Role Hub</span>
              <span style={{ fontSize: '9px', opacity: 0.9 }}>
                {showRoleSwitcherMenu ? '▴' : '▾'}
              </span>
            </button>

            {/* 3-ROLE OPERATIONAL SWITCHER POPOVER MENU */}
            {showRoleSwitcherMenu && (
              <>
                <div
                  onClick={() => setShowRoleSwitcherMenu(false)}
                  style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 90,
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 10px)',
                    right: 0,
                    width: '720px',
                    maxWidth: '92vw',
                    background: isLight ? '#FFFFFF' : '#111827',
                    border: isLight
                      ? '1px solid rgba(20, 23, 29, 0.12)'
                      : '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '22px',
                    padding: '18px',
                    boxShadow: isLight
                      ? '0 28px 64px rgba(20, 23, 29, 0.18)'
                      : '0 28px 64px rgba(0, 0, 0, 0.65)',
                    zIndex: 95,
                    animation: 'murmuraCardSpringPop 0.24s cubic-bezier(0.22, 1, 0.36, 1)',
                  }}
                >
                  {/* Top Action Banner: Open Unified 3-Role Dashboard (/dashboard) */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      padding: '12px 16px',
                      borderRadius: '16px',
                      background: isLight
                        ? 'linear-gradient(135deg, #EAF6F0 0%, #F5F4EE 100%)'
                        : 'linear-gradient(135deg, rgba(14,124,91,0.22) 0%, rgba(30,41,59,0.65) 100%)',
                      border: isLight
                        ? '1px solid rgba(14, 124, 91, 0.2)'
                        : '1px solid rgba(52, 211, 153, 0.25)',
                      marginBottom: '14px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: '13.5px',
                          fontWeight: 800,
                          color: textPrimary,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '7px',
                        }}
                      >
                        <span>Dashboard Operasional Gabungan 3-Role (Admin · Kasir · Kitchen)</span>
                      </div>
                      <div style={{ fontSize: '11.5px', color: textSecondary, marginTop: '2px' }}>
                        Seluruh menu Admin Cabang, Kasir POS + Pilih Meja, dan Kitchen KDS telah disatukan & dirapikan di Dashboard.
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Link
                        href="/dashboard"
                        style={{
                          padding: '8px 15px',
                          borderRadius: '999px',
                          background: '#0E7C5B',
                          color: '#FFFFFF',
                          textDecoration: 'none',
                          fontSize: '12px',
                          fontWeight: 700,
                          whiteSpace: 'nowrap',
                          boxShadow: '0 4px 12px rgba(14, 124, 91, 0.25)',
                        }}
                      >
                        Buka Dashboard 3-Role (/dashboard) ↗
                      </Link>
                      <Link
                        href="/superadmin/inspector"
                        style={{
                          padding: '8px 13px',
                          borderRadius: '999px',
                          background: isLight ? '#161920' : '#1E293B',
                          color: '#FFFFFF',
                          textDecoration: 'none',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Inspector Split-View ↗
                      </Link>
                    </div>
                  </div>

                  {/* 3 Organized Role Columns */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                      gap: '12px',
                    }}
                  >
                    {/* Column 1: Role Admin */}
                    <div
                      style={{
                        padding: '12px',
                        borderRadius: '14px',
                        background: isLight ? '#FAF9F5' : '#0F172A',
                        border: `1px solid ${surfaceBorder}`,
                      }}
                    >
                      <div
                        style={{
                          fontSize: '11px',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          color: '#2563EB',
                          marginBottom: '8px',
                        }}
                      >
                        1. Role Admin Cabang
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        {[
                          { label: 'Dashboard (3-Role Hub)', href: '/dashboard' },
                          { label: 'Produk & Menu', href: '/products' },
                          { label: 'Laporan & Analitik', href: '/reports' },
                          { label: 'Riwayat Transaksi POS', href: '/transactions' },
                          { label: 'Vocher & Diskon', href: '/discounts' },
                          { label: 'Payment & QRIS', href: '/payment-settings' },
                          { label: 'Tim & Jadwal Kasir', href: '/users' },
                          { label: 'Pengaturan Sistem', href: '/settings' },
                        ].map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            style={{
                              padding: '6px 9px',
                              borderRadius: '9px',
                              textDecoration: 'none',
                              fontSize: '12px',
                              fontWeight: 600,
                              color: textPrimary,
                              background: isLight ? '#FFFFFF' : '#1E293B',
                              border: `1px solid ${surfaceBorder}`,
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <span>{item.label}</span>
                            <span style={{ fontSize: '10px', color: textSecondary }}>↗</span>
                          </Link>
                        ))}
                      </div>
                    </div>

                    {/* Column 2: Role Kasir & POS */}
                    <div
                      style={{
                        padding: '12px',
                        borderRadius: '14px',
                        background: isLight ? '#FAF9F5' : '#0F172A',
                        border: `1px solid ${surfaceBorder}`,
                      }}
                    >
                      <div
                        style={{
                          fontSize: '11px',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          color: '#0E7C5B',
                          marginBottom: '8px',
                        }}
                      >
                        2. Role Kasir & POS
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {[
                          {
                            label: 'Kasir POS & Pilih Meja',
                            desc: 'Pilih Menu → Denah Meja (Kapasitas) → Bayar',
                            href: '/pos',
                          },
                          {
                            label: 'Pesanan Meja QR',
                            desc: 'Monitoring pesanan pelanggan dari QR meja',
                            href: '/table-orders',
                          },
                          {
                            label: 'Stok & Request Bahan',
                            desc: 'Pengecekan stok kasir & permintaan gudang',
                            href: '/stock',
                          },
                        ].map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            style={{
                              padding: '9px 10px',
                              borderRadius: '10px',
                              textDecoration: 'none',
                              color: textPrimary,
                              background: isLight ? '#FFFFFF' : '#1E293B',
                              border: `1px solid ${surfaceBorder}`,
                              display: 'block',
                            }}
                          >
                            <div style={{ fontSize: '12px', fontWeight: 700 }}>{item.label}</div>
                            <div style={{ fontSize: '10.5px', color: textSecondary, marginTop: '2px' }}>
                              {item.desc}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>

                    {/* Column 3: Role Kitchen (KDS) */}
                    <div
                      style={{
                        padding: '12px',
                        borderRadius: '14px',
                        background: isLight ? '#FAF9F5' : '#0F172A',
                        border: `1px solid ${surfaceBorder}`,
                      }}
                    >
                      <div
                        style={{
                          fontSize: '11px',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          color: '#D97706',
                          marginBottom: '8px',
                        }}
                      >
                        3. Role Kitchen (KDS)
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <Link
                          href="/kitchen"
                          style={{
                            padding: '10px',
                            borderRadius: '10px',
                            textDecoration: 'none',
                            color: textPrimary,
                            background: isLight ? '#FFFFFF' : '#1E293B',
                            border: `1px solid ${surfaceBorder}`,
                            display: 'block',
                          }}
                        >
                          <div style={{ fontSize: '12px', fontWeight: 700 }}>
                            Layar Dapur (Orders & Floor)
                          </div>
                          <div style={{ fontSize: '10.5px', color: textSecondary, marginTop: '3px' }}>
                            Kanban tiket masakan 4 kolom (New · Cooking · Ready · Served) + Floor Plan Drag & Drop
                          </div>
                        </Link>
                        <Link
                          href="/dashboard"
                          style={{
                            padding: '10px',
                            borderRadius: '10px',
                            textDecoration: 'none',
                            color: textPrimary,
                            background: isLight ? '#FFFFFF' : '#1E293B',
                            border: `1px solid ${surfaceBorder}`,
                            display: 'block',
                          }}
                        >
                          <div style={{ fontSize: '12px', fontWeight: 700 }}>
                            Buka di Dalam Dashboard Hub
                          </div>
                          <div style={{ fontSize: '10.5px', color: textSecondary, marginTop: '3px' }}>
                            Lihat gabungan Admin, Kasir POS, dan Kitchen KDS dalam 1 halaman Dashboard
                          </div>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Currency Toggle ($ USD / Rp IDR) */}
          <button
            onClick={() => setCurrency((c) => (c === 'USD' ? 'IDR' : 'USD'))}
            title="Switch Currency ($ USD / Rp IDR)"
            style={{
              padding: '5px 10px',
              borderRadius: '999px',
              border: `1px solid ${surfaceBorder}`,
              background: surfaceBg,
              color: textPrimary,
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {currency === 'USD' ? '$ USD' : 'Rp IDR'}
          </button>

          {/* Notification Bell with Red Dot — Standalone Popover (Detached from Inbox tab) */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => {
                setShowNotificationMenu((prev) => !prev);
                setShowAvatarMenu(false);
                setShowRoleSwitcherMenu(false);
              }}
              title="Notifikasi Sistem & Alert Operasional"
              style={{
                position: 'relative',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: `1px solid ${surfaceBorder}`,
                background: showNotificationMenu
                  ? isLight
                    ? '#161920'
                    : '#F2B249'
                  : surfaceBg,
                color: showNotificationMenu
                  ? isLight
                    ? '#FFFFFF'
                    : '#14171D'
                  : textPrimary,
                cursor: 'pointer',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
                transition: 'all 0.18s ease',
              }}
            >
              <svg
                className={unreadNotifCount > 0 ? 'bell-ring-active' : ''}
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.1"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {unreadNotifCount > 0 && (
                <span
                  className="notif-badge-pulse"
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    minWidth: '17px',
                    height: '17px',
                    padding: '0 4px',
                    borderRadius: '999px',
                    background: '#C84B31',
                    color: '#FFFFFF',
                    fontSize: '9.5px',
                    fontWeight: 800,
                    display: 'grid',
                    placeItems: 'center',
                    lineHeight: 1,
                    border: `2px solid ${surfaceBg}`,
                  }}
                >
                  {unreadNotifCount}
                </span>
              )}
            </button>

            {/* Standalone Notification Popover Menu */}
            {showNotificationMenu && (
              <>
                <div
                  onClick={() => setShowNotificationMenu(false)}
                  style={{ position: 'fixed', inset: 0, zIndex: 90 }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 10px)',
                    right: 0,
                    width: '390px',
                    maxWidth: '92vw',
                    background: isLight ? '#FFFFFF' : '#111827',
                    border: isLight
                      ? '1px solid rgba(20, 23, 29, 0.12)'
                      : '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '22px',
                    padding: '16px',
                    boxShadow: isLight
                      ? '0 24px 60px rgba(20, 23, 29, 0.18)'
                      : '0 24px 60px rgba(0, 0, 0, 0.7)',
                    zIndex: 95,
                    animation: 'murmuraCardSpringPop 0.22s cubic-bezier(0.22, 1, 0.36, 1)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '12px',
                      paddingBottom: '10px',
                      borderBottom: `1px solid ${surfaceBorder}`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: textPrimary }}>
                        Notifikasi Sistem & Alert
                      </span>
                      <span
                        style={{
                          background: unreadNotifCount > 0 ? '#E7F7EF' : '#F1F5F9',
                          color: unreadNotifCount > 0 ? '#0D7A57' : textMuted,
                          padding: '1px 7px',
                          borderRadius: '999px',
                          fontSize: '10.5px',
                          fontWeight: 700,
                        }}
                      >
                        {unreadNotifCount} Baru
                      </span>
                    </div>
                    <button
                      onClick={handleBulkToggleAllNotifications}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: textSecondary,
                        fontSize: '11px',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      {unreadNotifCount > 0 ? 'Tandai semua dibaca' : 'Tandai semua belum dibaca'}
                    </button>
                  </div>

                  {/* Filter Pills: Semua · Deals · KDS · Finansial */}
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
                    {[
                      { id: 'all', label: 'Semua' },
                      { id: 'deals', label: 'Deals CRM' },
                      { id: 'kds', label: 'Kitchen KDS' },
                      { id: 'finance', label: 'Finansial' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setNotifFilter(f.id)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '999px',
                          border: 'none',
                          fontSize: '11px',
                          fontWeight: notifFilter === f.id ? 700 : 500,
                          cursor: 'pointer',
                          background:
                            notifFilter === f.id
                              ? isLight
                                ? '#161920'
                                : '#F2B249'
                              : isLight
                              ? 'rgba(20,23,29,0.05)'
                              : '#1E293B',
                          color:
                            notifFilter === f.id
                              ? isLight
                                ? '#FFFFFF'
                                : '#14171D'
                              : textSecondary,
                        }}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  {/* List of Notification Items */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      maxHeight: '320px',
                      overflowY: 'auto',
                    }}
                  >
                    {notificationList
                      .filter((n) => notifFilter === 'all' || n.category === notifFilter)
                      .map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleToggleReadNotification(item.id)}
                          className="murmura-card-vibrate"
                          style={{
                            padding: '10px 12px',
                            borderRadius: '14px',
                            background: item.unread
                              ? isLight
                                ? '#FAF9F6'
                                : 'rgba(255,255,255,0.06)'
                              : isLight
                              ? '#FFFFFF'
                              : 'rgba(255,255,255,0.02)',
                            border: `1px solid ${
                              item.unread
                                ? isLight
                                  ? 'rgba(14, 124, 91, 0.35)'
                                  : 'rgba(52, 211, 153, 0.35)'
                                : isLight
                                ? 'rgba(20, 23, 29, 0.06)'
                                : 'rgba(255, 255, 255, 0.06)'
                            }`,
                            opacity: item.unread ? 1 : 0.65,
                            cursor: 'pointer',
                            display: 'flex',
                            gap: '10px',
                            alignItems: 'flex-start',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <span
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              background: item.badgeColor,
                              marginTop: '5px',
                              flexShrink: 0,
                              boxShadow: item.unread ? `0 0 0 3px ${item.badgeColor}33` : 'none',
                            }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '2px',
                              }}
                            >
                              <span style={{ fontSize: '11px', fontWeight: 700, color: item.badgeColor }}>
                                {item.brand}
                              </span>
                              <span style={{ fontSize: '10px', color: textMuted }}>
                                {item.time}
                              </span>
                            </div>
                            <div
                              style={{
                                fontSize: '12px',
                                fontWeight: item.unread ? 700 : 500,
                                color: textPrimary,
                                lineHeight: 1.3,
                              }}
                            >
                              {item.title}
                            </div>
                            <div
                              style={{
                                fontSize: '11px',
                                color: textSecondary,
                                marginTop: '2px',
                                lineHeight: 1.35,
                              }}
                            >
                              {item.message}
                            </div>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleReadNotification(item.id);
                            }}
                            title={item.unread ? 'Tandai sudah dibaca' : 'Tandai belum dibaca'}
                            style={{
                              border: 'none',
                              background: item.unread ? 'rgba(14, 124, 91, 0.12)' : 'rgba(0,0,0,0.04)',
                              color: item.unread ? '#0E7C5B' : textMuted,
                              width: '22px',
                              height: '22px',
                              borderRadius: '50%',
                              display: 'grid',
                              placeItems: 'center',
                              fontSize: '11px',
                              fontWeight: 800,
                              cursor: 'pointer',
                              flexShrink: 0,
                            }}
                          >
                            {item.unread ? '✓' : '•'}
                          </button>
                        </div>
                      ))}
                  </div>

                  {/* Footer Action: Open Full Inbox */}
                  <div
                    style={{
                      marginTop: '12px',
                      paddingTop: '10px',
                      borderTop: `1px solid ${surfaceBorder}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <button
                      onClick={() => {
                        setActiveTab('inbox');
                        setShowNotificationMenu(false);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#0E7C5B',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      Buka Tab Inbox Selengkapnya →
                    </button>
                    <span style={{ fontSize: '10.5px', color: textMuted }}>
                      Real-time Alerts
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Profile Avatar with Popover (Profile, Settings, 3-Option Font Switcher) */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => {
                setShowAvatarMenu((prev) => !prev);
                setShowNotificationMenu(false);
                setShowRoleSwitcherMenu(false);
              }}
              title="Buka Pengaturan Profil & Tipografi"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #1E293B 0%, #0E7C5B 100%)',
                color: '#FFFFFF',
                display: 'grid',
                placeItems: 'center',
                fontSize: '11.5px',
                fontWeight: 800,
                border: showAvatarMenu ? '2px solid #0E7C5B' : `2px solid ${surfaceBg}`,
                boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                flexShrink: 0,
                cursor: 'pointer',
                transition: 'transform 0.18s ease',
              }}
            >
              CA
            </button>

            {/* Avatar Popover Menu */}
            {showAvatarMenu && (
              <>
                <div
                  onClick={() => setShowAvatarMenu(false)}
                  style={{ position: 'fixed', inset: 0, zIndex: 90 }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 10px)',
                    right: 0,
                    width: '350px',
                    maxWidth: '92vw',
                    background: isLight ? '#FFFFFF' : '#111827',
                    border: isLight
                      ? '1px solid rgba(20, 23, 29, 0.12)'
                      : '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '22px',
                    padding: '18px',
                    boxShadow: isLight
                      ? '0 28px 64px rgba(20, 23, 29, 0.18)'
                      : '0 28px 64px rgba(0, 0, 0, 0.7)',
                    zIndex: 95,
                    animation: 'murmuraCardSpringPop 0.22s cubic-bezier(0.22, 1, 0.36, 1)',
                  }}
                >
                  {/* User Profile Header */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      paddingBottom: '14px',
                      borderBottom: `1px solid ${surfaceBorder}`,
                      marginBottom: '14px',
                    }}
                  >
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #1E293B 0%, #0E7C5B 100%)',
                        color: '#FFFFFF',
                        display: 'grid',
                        placeItems: 'center',
                        fontSize: '14px',
                        fontWeight: 800,
                        flexShrink: 0,
                        boxShadow: '0 4px 12px rgba(14, 124, 91, 0.25)',
                      }}
                    >
                      CA
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: textPrimary }}>
                          Camila Santapos
                        </span>
                        <span
                          style={{
                            background: '#0E7C5B',
                            color: '#FFFFFF',
                            fontSize: '9.5px',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: '999px',
                          }}
                        >
                          Superadmin
                        </span>
                      </div>
                      <div style={{ fontSize: '11.5px', color: textSecondary, marginTop: '2px' }}>
                        camila@santapos.com
                      </div>
                    </div>
                  </div>

                  {/* SECTION 1: 3-OPTION FONT TYPE SELECTOR */}
                  <div style={{ marginBottom: '16px' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '8px',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          color: '#0E7C5B',
                        }}
                      >
                        Gaya Tipografi Dashboard
                      </span>
                      <span style={{ fontSize: '10.5px', color: textMuted }}>
                        3 Opsi Estetik
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {[
                        {
                          id: 'murmura',
                          name: 'Murmura Neo-Humanist',
                          fonts: 'Plus Jakarta Sans · Hangat & Modern',
                          tag: 'Default Rekomendasi',
                          preview: 'Aa 123',
                          fontFamilyStr: 'var(--font-plus-jakarta), sans-serif',
                        },
                        {
                          id: 'editorial',
                          name: 'Editorial Luxury Bistro',
                          fonts: 'Playfair Display + DM Sans · Michelin Vibe',
                          tag: 'Luxury Boutique',
                          preview: 'Aa 123',
                          fontFamilyStr: 'var(--font-playfair), Georgia, serif',
                        },
                        {
                          id: 'hightech',
                          name: 'Swiss Minimalist Tech',
                          fonts: 'Geist Sans + Mono · High-Tech Precision',
                          tag: 'Precision Swiss',
                          preview: 'Aa 123',
                          fontFamilyStr: 'var(--font-geist-sans), sans-serif',
                        },
                      ].map((item) => {
                        const isSelected = fontStyle === item.id;
                        return (
                          <div
                            key={item.id}
                            onClick={() => handleSelectFontStyle(item.id)}
                            className="murmura-card-vibrate"
                            style={{
                              padding: '9px 12px',
                              borderRadius: '12px',
                              border: isSelected
                                ? '1.5px solid #0E7C5B'
                                : `1px solid ${surfaceBorder}`,
                              background: isSelected
                                ? isLight
                                  ? '#EBF7F2'
                                  : 'rgba(14, 124, 91, 0.16)'
                                : isLight
                                ? '#FAF9F6'
                                : '#1A2333',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '10px',
                            }}
                          >
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div
                                style={{
                                  fontSize: '12.5px',
                                  fontWeight: 700,
                                  color: textPrimary,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                }}
                              >
                                <span>{item.name}</span>
                                {isSelected && (
                                  <span style={{ color: '#0E7C5B', fontSize: '12px' }}>✓</span>
                                )}
                              </div>
                              <div
                                style={{
                                  fontSize: '10.5px',
                                  color: textSecondary,
                                  marginTop: '2px',
                                }}
                              >
                                {item.fonts}
                              </div>
                            </div>
                            <span
                              style={{
                                fontFamily: item.fontFamilyStr,
                                fontSize: '13px',
                                fontWeight: 700,
                                color: textPrimary,
                                background: isLight ? '#FFFFFF' : '#0F172A',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                border: `1px solid ${surfaceBorder}`,
                                flexShrink: 0,
                              }}
                            >
                              {item.preview}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* SECTION 2: TEMA & PREFERENSI */}
                  <div
                    style={{
                      borderTop: `1px solid ${surfaceBorder}`,
                      paddingTop: '12px',
                      marginBottom: '14px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        color: textMuted,
                        marginBottom: '8px',
                      }}
                    >
                      Pengaturan Tampilan
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <button
                        onClick={() => setTheme((t) => (t === 'murmura' ? 'tavola' : 'murmura'))}
                        style={{
                          padding: '7px 10px',
                          borderRadius: '10px',
                          border: `1px solid ${surfaceBorder}`,
                          background: isLight ? '#FAF9F6' : '#1A2333',
                          color: textPrimary,
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textAlign: 'center',
                        }}
                      >
                        Tema: {isLight ? '☀️ Light' : '🌙 Dark'}
                      </button>
                      <button
                        onClick={() => setCurrency((c) => (c === 'USD' ? 'IDR' : 'USD'))}
                        style={{
                          padding: '7px 10px',
                          borderRadius: '10px',
                          border: `1px solid ${surfaceBorder}`,
                          background: isLight ? '#FAF9F6' : '#1A2333',
                          color: textPrimary,
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textAlign: 'center',
                        }}
                      >
                        Mata Uang: {currency}
                      </button>
                    </div>
                  </div>

                  {/* SECTION 3: AKSI NAVIGASI & SIGN OUT */}
                  <div
                    style={{
                      borderTop: `1px solid ${surfaceBorder}`,
                      paddingTop: '10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <Link
                      href="/dashboard"
                      style={{
                        padding: '8px 10px',
                        borderRadius: '10px',
                        textDecoration: 'none',
                        color: textPrimary,
                        fontSize: '11.5px',
                        fontWeight: 600,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span>Dashboard Operasional (Admin · Kasir · Kitchen)</span>
                      <span>↗</span>
                    </Link>
                    <button
                      onClick={() => {
                        setActiveTab('listening');
                        setShowAvatarMenu(false);
                      }}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '10px',
                        border: 'none',
                        background: 'none',
                        color: textPrimary,
                        fontSize: '11.5px',
                        fontWeight: 600,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        textAlign: 'left',
                        width: '100%',
                      }}
                    >
                      <span>Database & Storage Settings</span>
                      <span>⚙️</span>
                    </button>
                    <Link
                      href="/login"
                      style={{
                        padding: '8px 10px',
                        borderRadius: '10px',
                        textDecoration: 'none',
                        color: '#D94E34',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: '4px',
                      }}
                    >
                      <span>Keluar (Sign Out)</span>
                      <span>⏻</span>
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* =====================================================================
          LEFT VERTICAL CHARCOAL PILL DOCK (Monochrome Stroke SVGs — Exact Match to Screenshots 1–4)
         ===================================================================== */}
      <aside
        style={{
          position: 'fixed',
          left: '16px',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 40,
          background: '#181A1F',
          borderRadius: '999px',
          padding: '8px 6px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '6px',
          boxShadow: '0 16px 36px rgba(20, 23, 29, 0.22)',
        }}
      >
        {/* 1. Search */}
        <button
          onClick={() => {
            setActiveTab('orders');
            setTimeout(() => {
              const el = document.getElementById('tavola-deal-search');
              if (el) el.focus();
            }, 80);
          }}
          title="Search Deals & Tenants"
          style={{
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            border: 'none',
            background: 'transparent',
            color: '#9CA3AF',
            cursor: 'pointer',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </button>

        {/* 2. Prominent Warm Amber "+" Action Button (Exact Match to Screenshots 1–4) */}
        <button
          onClick={() => setShowNewDealModal(true)}
          title="Create New Tenant Deal / Post"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: 'none',
            background: '#F2B249',
            color: '#14171D',
            cursor: 'pointer',
            display: 'grid',
            placeItems: 'center',
            fontSize: '17px',
            fontWeight: 700,
            boxShadow: '0 4px 12px rgba(242, 178, 73, 0.35)',
          }}
        >
          +
        </button>

        {/* 3. Clock / Live Queue (Overview) */}
        <button
          onClick={() => setActiveTab('overview')}
          title="Overview · Up Next Queue"
          style={{
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            border: 'none',
            background: activeTab === 'overview' ? 'rgba(255,255,255,0.14)' : 'transparent',
            color: activeTab === 'overview' ? '#FFFFFF' : '#9CA3AF',
            cursor: 'pointer',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <polyline points="12 7 12 12 15 15" />
          </svg>
        </button>

        {/* 4. Calendar / Onboarding Roadmap */}
        <button
          onClick={() => setActiveTab('calendar')}
          title="Publishing & Onboarding Calendar"
          style={{
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            border: 'none',
            background: activeTab === 'calendar' ? 'rgba(255,255,255,0.14)' : 'transparent',
            color: activeTab === 'calendar' ? '#FFFFFF' : '#9CA3AF',
            cursor: 'pointer',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </button>

        {/* 5. Pen / Compose Deals Board with Red Notification Dot */}
        <button
          onClick={() => setActiveTab('orders')}
          title="Compose · Tenant Deals Kanban Board"
          style={{
            position: 'relative',
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            border: 'none',
            background: activeTab === 'orders' ? 'rgba(255,255,255,0.14)' : 'transparent',
            color: activeTab === 'orders' ? '#FFFFFF' : '#9CA3AF',
            cursor: 'pointer',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
          <span
            style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#C84B31',
            }}
          />
        </button>

        {/* 6. Shield / Approvals */}
        <button
          onClick={() => setActiveTab('approvals')}
          title="Tenant Approvals & SLA"
          style={{
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            border: 'none',
            background: activeTab === 'approvals' ? 'rgba(255,255,255,0.14)' : 'transparent',
            color: activeTab === 'approvals' ? '#FFFFFF' : '#9CA3AF',
            cursor: 'pointer',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </button>

        {/* 7. Settings / Database & Tenants */}
        <button
          onClick={() => setActiveTab('listening')}
          title="Tenants Directory & Database Settings"
          style={{
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            border: 'none',
            background: activeTab === 'listening' ? 'rgba(255,255,255,0.14)' : 'transparent',
            color: activeTab === 'listening' ? '#FFFFFF' : '#9CA3AF',
            cursor: 'pointer',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>

        {/* 8. Theme Switcher (Moon / Sun — exact bottom icon in Screenshots 1–4) */}
        <button
          onClick={() => {
            const nextTheme = theme === 'murmura' ? 'tavola' : 'murmura';
            setTheme(nextTheme);
            triggerToast(
              `Switched visual atmosphere to ${
                nextTheme === 'murmura' ? 'Murmura Editorial Cream & Mint' : 'Tavola Midnight Dark'
              }`
            );
          }}
          title="Toggle Theme (Murmura Cream / Tavola Dark)"
          style={{
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            border: 'none',
            background: 'rgba(255,255,255,0.06)',
            color: '#9CA3AF',
            cursor: 'pointer',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          {isLight ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F2B249" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          )}
        </button>
      </aside>

      {/* =====================================================================
          MAIN CONTENT CONTAINER
         ===================================================================== */}
      <main
        style={{
          maxWidth: '1440px',
          margin: '0 auto',
          padding: '8px 28px 40px 76px',
        }}
      >
        {/* ===================================================================
            TAB 1: OVERVIEW (Exact REA of Gambar 1 — Murmura Executive CRM)
           =================================================================== */}
        {activeTab === 'overview' && (
          <MurmuraOverviewView
            theme={theme}
            currency={currency}
            selectedTenantFilter={selectedTenantFilter}
            deals={deals}
            tenants={tenants}
            fontFamily={activeFontFamily}
            onOpenNewDeal={() => setShowNewDealModal(true)}
            onNavigateTab={(tabId) => setActiveTab(tabId)}
            onTriggerToast={triggerToast}
          />
        )}

        {/* ===================================================================
            TAB 2: CALENDAR (Exact REA of Gambar 2, 3, 4 — Before/After Animation + Drag & Drop)
           =================================================================== */}
        {activeTab === 'calendar' && (
          <MurmuraCalendarView
            theme={theme}
            selectedTenantFilter={selectedTenantFilter}
            fontFamily={activeFontFamily}
            onOpenNewDeal={() => setShowNewDealModal(true)}
            onTriggerToast={triggerToast}
          />
        )}

        {/* ===================================================================
            TAB 3: COMPOSE · DEALS BOARD (Interactive CRM Deal Kanban with Drag & Drop)
           =================================================================== */}
        {activeTab === 'orders' && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              animation: 'murmuraFadeSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* Row 1: 2-Line Title + 3 Inline KPI Pills */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
                <h1
                  style={{
                    margin: 0,
                    fontFamily: activeFontFamily.display,
                    fontSize: '34px',
                    fontWeight: 400,
                    lineHeight: 1.02,
                    letterSpacing: '-0.02em',
                    color: textPrimary,
                  }}
                >
                  Tenant Deals
                  <br />
                  Board
                </h1>

                {/* KPI Pill 1 */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    background: surfaceBg,
                    border: `1px solid ${surfaceBorder}`,
                    borderRadius: '999px',
                    padding: '10px 18px 10px 12px',
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: isLight ? '#F5F4EE' : '#1B273D',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: '14px',
                    }}
                  >
                    🧾
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '20px', fontWeight: 700, color: textPrimary }}>
                        {openDealsCount}
                      </span>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 9px',
                          borderRadius: '999px',
                          background: '#0E7C5B',
                          color: '#FFFFFF',
                        }}
                      >
                        {readyDeals.length} ready
                      </span>
                    </div>
                    <div style={{ fontSize: '11.5px', color: textSecondary, marginTop: '1px' }}>
                      Open tenant deal tickets (Drag & Drop enabled)
                    </div>
                  </div>
                </div>

                {/* KPI Pill 2 */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    background: surfaceBg,
                    border: `1px solid ${surfaceBorder}`,
                    borderRadius: '999px',
                    padding: '10px 18px 10px 12px',
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: isLight ? '#F5F4EE' : '#1B273D',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: '14px',
                    }}
                  >
                    ⏱️
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '20px', fontWeight: 700, color: textPrimary }}>
                        15 min
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
                        On target
                      </span>
                    </div>
                    <div style={{ fontSize: '11.5px', color: textSecondary, marginTop: '1px' }}>
                      Average onboarding SLA response
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowNewDealModal(true)}
                style={{
                  background: isLight ? '#161920' : '#F3A68F',
                  color: isLight ? '#FFFFFF' : '#0F172A',
                  border: 'none',
                  borderRadius: '999px',
                  padding: '10px 18px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                + New tenant deal
              </button>
            </div>

            {/* Row 2: Search Bar + Channel Filter Pills + Board/List Toggle */}
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
                    background: surfaceBg,
                    border: `1px solid ${surfaceBorder}`,
                    borderRadius: '999px',
                    padding: '8px 16px',
                    minWidth: '250px',
                  }}
                >
                  <span style={{ color: textSecondary, fontSize: '13px' }}>🔍</span>
                  <input
                    id="tavola-deal-search"
                    type="text"
                    placeholder="Search ticket, tenant brand, PIC or package..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: textPrimary,
                      fontSize: '12.5px',
                      width: '100%',
                    }}
                  />
                </div>

                {[
                  { id: 'All', label: 'All Deals', icon: '⊞', count: deals.length },
                  {
                    id: 'Dine-in',
                    label: 'Franchise HQ',
                    icon: '🏢',
                    count: deals.filter((d) => d.channel_type === 'Dine-in').length,
                  },
                  {
                    id: 'Takeaway',
                    label: 'Pro Suite',
                    icon: '⚡',
                    count: deals.filter((d) => d.channel_type === 'Takeaway').length,
                  },
                  {
                    id: 'Delivery',
                    label: 'Starter Cloud',
                    icon: '🌱',
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
                        border: `1px solid ${active ? '#161920' : surfaceBorder}`,
                        background: active ? '#161920' : surfaceBg,
                        color: active ? '#FFFFFF' : textPrimary,
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
                          background: active ? 'rgba(255,255,255,0.2)' : 'rgba(20,23,29,0.06)',
                          color: active ? '#FFFFFF' : textSecondary,
                        }}
                      >
                        {chip.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div
                style={{
                  display: 'inline-flex',
                  background: surfaceBg,
                  padding: '3px',
                  borderRadius: '999px',
                  border: `1px solid ${surfaceBorder}`,
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
                      background: viewMode === m ? '#161920' : 'transparent',
                      color: viewMode === m ? '#FFFFFF' : textSecondary,
                    }}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Row 3: 4-Column Drag-and-Drop CRM Kanban Board */}
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
                {[
                  {
                    stage: 'new',
                    title: 'New Lead',
                    dot: '#EADCA6',
                    cardBg: '#EADCA6',
                    cardText: '#18181B',
                    items: newDeals,
                    nextStage: 'cooking',
                    btnLabel: '🔥 Start Demo',
                  },
                  {
                    stage: 'cooking',
                    title: 'Demo & Setup',
                    dot: '#EFA892',
                    cardBg: '#EFA892',
                    cardText: '#18181B',
                    items: cookingDeals,
                    nextStage: 'ready',
                    btnLabel: '◎ Mark Ready',
                  },
                  {
                    stage: 'ready',
                    title: 'Trial Ready',
                    dot: '#BCE3D4',
                    cardBg: '#BCE3D4',
                    cardText: '#18181B',
                    items: readyDeals,
                    nextStage: 'served',
                    btnLabel: '✓ Go Live',
                  },
                  {
                    stage: 'served',
                    title: 'Active Tenant',
                    dot: '#0E7C5B',
                    cardBg: '#172237',
                    cardText: '#F8FAFC',
                    items: servedDeals,
                    nextStage: null,
                    btnLabel: '✓ Paid',
                  },
                ].map((col) => {
                  const isDropOver = dragOverStage === col.stage;
                  return (
                    <div
                      key={col.stage}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOverStage(col.stage);
                      }}
                      onDragLeave={() => setDragOverStage(null)}
                      onDrop={(e) => {
                        e.preventDefault();
                        handleDropDealOnColumn(col.stage);
                      }}
                      className={isDropOver ? 'kanban-col-drop-over' : ''}
                      style={{
                        background: isDropOver
                          ? 'rgba(14, 124, 91, 0.12)'
                          : isLight
                          ? '#EAE9E1'
                          : '#11192B',
                        border: isDropOver
                          ? '2px dashed #0E7C5B'
                          : `1px solid ${surfaceBorder}`,
                        borderRadius: '20px',
                        padding: '14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        minHeight: '420px',
                        transition: 'background 0.2s ease, border 0.2s ease',
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
                              background: col.dot,
                            }}
                          />
                          <span style={{ fontSize: '13.5px', fontWeight: 700, color: textPrimary }}>
                            {col.title}
                          </span>
                          <span
                            className={recentlyUpdatedStage === col.stage ? 'counter-bump' : ''}
                            style={{
                              fontSize: '12px',
                              color: textSecondary,
                              fontWeight: 700,
                              display: 'inline-block',
                            }}
                          >
                            {col.items.length}
                          </span>
                        </div>
                        <span style={{ fontSize: '12px', color: textSecondary, fontWeight: 600 }}>
                          {formatColumnTotal(col.items)}
                        </span>
                      </div>

                      {col.items.length === 0 && (
                        <div
                          style={{
                            padding: '28px 14px',
                            borderRadius: '14px',
                            border: `1.5px dashed ${isDropOver ? '#0E7C5B' : surfaceBorder}`,
                            background: isDropOver ? 'rgba(14, 124, 91, 0.08)' : 'transparent',
                            textAlign: 'center',
                            color: textSecondary,
                            fontSize: '11.5px',
                            fontWeight: 500,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '6px',
                            animation: 'murmuraFadeSlideIn 0.3s ease',
                          }}
                        >
                          <span style={{ fontSize: '16px' }}>📥</span>
                          <span>Tarik & lepas kartu deal ke sini</span>
                        </div>
                      )}

                      <AnimatePresence mode="popLayout">
                        {col.items.map((deal) => {
                          const isNewlyInserted = newlyInsertedDealId === deal.id;
                          return (
                            <motion.div
                              key={deal.id}
                              layout
                              layoutId={String(deal.id)}
                              initial={{ opacity: 0, y: -20, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.16 } }}
                              transition={{
                                layout: { type: 'spring', stiffness: 360, damping: 28 },
                                opacity: { duration: 0.18 },
                              }}
                              draggable
                              onDragStart={() => setDraggedDeal(deal)}
                              onDragEnd={() => {
                                setDraggedDeal(null);
                                setDragOverStage(null);
                              }}
                              className={`murmura-card-vibrate ${
                                draggedDeal?.id === deal.id ? 'kanban-card-dragging' : ''
                              } ${isNewlyInserted ? 'newly-inserted-deal' : ''}`}
                              style={{
                                background: col.cardBg,
                                color: col.cardText,
                                borderRadius: '16px',
                                padding: '14px',
                                boxShadow: draggedDeal?.id === deal.id
                                  ? '0 24px 48px rgba(0,0,0,0.3)'
                                  : '0 8px 20px rgba(0,0,0,0.12)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '10px',
                                cursor: draggedDeal?.id === deal.id ? 'grabbing' : 'grab',
                                userSelect: 'none',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span
                                    style={{
                                      fontSize: '11.5px',
                                      fontWeight: 700,
                                      opacity: 0.85,
                                      fontFamily: activeFontFamily.mono,
                                    }}
                                  >
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
                                  title="Delete deal"
                                  style={{
                                    background: 'rgba(0,0,0,0.08)',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '24px',
                                    height: '24px',
                                    cursor: 'pointer',
                                    color: col.cardText,
                                    fontSize: '11px',
                                  }}
                                >
                                  •••
                                </button>
                              </div>

                              <div
                                style={{
                                  fontSize: '15px',
                                  fontWeight: 700,
                                  fontFamily: activeFontFamily.display,
                                }}
                              >
                                🏪 {deal.table_label}
                              </div>

                              <div
                                style={{
                                  borderTop: '1px solid rgba(0,0,0,0.1)',
                                  borderBottom: '1px solid rgba(0,0,0,0.1)',
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
                                  <div key={i} style={{ fontSize: '12px', opacity: 0.9, fontWeight: 500 }}>
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
                                      color: '#EADCA6',
                                      display: 'grid',
                                      placeItems: 'center',
                                      fontSize: '10px',
                                      fontWeight: 800,
                                    }}
                                  >
                                    {deal.avatar_seed || 'TN'}
                                  </div>
                                  <span style={{ fontSize: '16px', fontWeight: 800 }}>
                                    {formatDealPrice(deal)}
                                  </span>
                                </div>

                                {col.nextStage ? (
                                  <button
                                    onClick={() =>
                                      handleAdvanceDeal(deal, col.nextStage, col.nextStage === 'served')
                                    }
                                    style={{
                                      background: '#18181B',
                                      color: '#FFFFFF',
                                      border: 'none',
                                      borderRadius: '999px',
                                      padding: '6px 14px',
                                      fontSize: '11.5px',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                    }}
                                  >
                                    {col.btnLabel}
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleTogglePaymentStatus(deal)}
                                    style={{
                                      background:
                                        deal.payment_status === 'Paid' ? '#0E7C5B' : '#C84B31',
                                      color: '#FFFFFF',
                                      border: 'none',
                                      borderRadius: '999px',
                                      padding: '5px 12px',
                                      fontSize: '11px',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                    }}
                                  >
                                    {deal.payment_status === 'Paid' ? '✓ Paid' : 'Unpaid'}
                                  </button>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* LIST VIEW */
              <div
                style={{
                  background: surfaceBg,
                  border: `1px solid ${surfaceBorder}`,
                  borderRadius: '20px',
                  overflow: 'hidden',
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${surfaceBorder}`, color: textSecondary, fontSize: '12px' }}>
                      <th style={{ padding: '14px 18px' }}>Ticket</th>
                      <th style={{ padding: '14px 18px' }}>Tenant Brand</th>
                      <th style={{ padding: '14px 18px' }}>PIC</th>
                      <th style={{ padding: '14px 18px' }}>Plan</th>
                      <th style={{ padding: '14px 18px' }}>Stage</th>
                      <th style={{ padding: '14px 18px' }}>Value</th>
                      <th style={{ padding: '14px 18px', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDeals.map((d) => (
                      <tr key={d.id} style={{ borderBottom: `1px solid ${surfaceBorder}`, fontSize: '13px' }}>
                        <td style={{ padding: '12px 18px', fontWeight: 700 }}>{d.ticket_number}</td>
                        <td style={{ padding: '12px 18px', fontWeight: 700 }}>{d.table_label}</td>
                        <td style={{ padding: '12px 18px', color: textSecondary }}>{d.pic_name}</td>
                        <td style={{ padding: '12px 18px' }}>{String(d.plan_code).toUpperCase()}</td>
                        <td style={{ padding: '12px 18px' }}>{d.stage.toUpperCase()}</td>
                        <td style={{ padding: '12px 18px', fontWeight: 700 }}>{formatDealPrice(d)}</td>
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
                                background: '#161920',
                                color: '#FFFFFF',
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

        {/* ===================================================================
            TAB 4: INBOX [14] (Tenant Onboarding & Support CRM Inbox)
           =================================================================== */}
        {activeTab === 'inbox' && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
              animation: 'murmuraFadeSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h1
                  style={{
                    margin: 0,
                    fontFamily: activeFontFamily.display,
                    fontSize: '34px',
                    fontWeight: 400,
                    color: textPrimary,
                  }}
                >
                  Tenant CRM Inbox
                </h1>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: textSecondary }}>
                  Pesan langsung dari pemilik restoran, permintaan kustomisasi modul POS, dan tiket onboarding
                </p>
              </div>
              <button
                onClick={() => setShowNewDealModal(true)}
                style={{
                  padding: '9px 18px',
                  borderRadius: '999px',
                  border: 'none',
                  background: '#161920',
                  color: '#FFFFFF',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                + Convert Message to Deal
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(300px, 380px) 1fr',
                gap: '18px',
                alignItems: 'start',
              }}
            >
              {/* Left Message List */}
              <div
                style={{
                  background: surfaceBg,
                  border: `1px solid ${surfaceBorder}`,
                  borderRadius: '20px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                {inboxMessages.map((msg) => {
                  const active = selectedInboxId === msg.id;
                  return (
                    <div
                      key={msg.id}
                      onClick={() => setSelectedInboxId(msg.id)}
                      style={{
                        padding: '12px',
                        borderRadius: '14px',
                        background: active
                          ? isLight
                            ? '#EBEAE2'
                            : '#1E293B'
                          : 'transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        gap: '10px',
                        alignItems: 'flex-start',
                      }}
                    >
                      <span
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: msg.badgeColor,
                          color: '#FFFFFF',
                          fontSize: '11px',
                          fontWeight: 800,
                          display: 'grid',
                          placeItems: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {msg.badgeCode}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '6px' }}>
                          <strong style={{ fontSize: '12.5px', color: textPrimary }}>{msg.brand}</strong>
                          <span style={{ fontSize: '10.5px', color: textSecondary }}>{msg.time}</span>
                        </div>
                        <div
                          style={{
                            fontSize: '12px',
                            fontWeight: 600,
                            color: textPrimary,
                            marginTop: '2px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {msg.subject}
                        </div>
                        <div
                          style={{
                            fontSize: '11px',
                            color: textSecondary,
                            marginTop: '2px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {msg.snippet}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right Selected Message Detail */}
              {(() => {
                const msg = inboxMessages.find((m) => m.id === selectedInboxId) || inboxMessages[0];
                return (
                  <div
                    style={{
                      background: surfaceBg,
                      border: `1px solid ${surfaceBorder}`,
                      borderRadius: '20px',
                      padding: '24px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            background: msg.badgeColor,
                            color: '#FFFFFF',
                            fontSize: '14px',
                            fontWeight: 800,
                            display: 'grid',
                            placeItems: 'center',
                          }}
                        >
                          {msg.badgeCode}
                        </span>
                        <div>
                          <div style={{ fontSize: '16px', fontWeight: 700, color: textPrimary }}>
                            {msg.brand} · {msg.sender}
                          </div>
                          <div style={{ fontSize: '12px', color: textSecondary }}>
                            Channel: {msg.channel} · Plan: {msg.plan.toUpperCase()}
                          </div>
                        </div>
                      </div>
                      <span
                        style={{
                          padding: '4px 12px',
                          borderRadius: '999px',
                          background: '#E3F5EE',
                          color: '#0E7C5B',
                          fontSize: '11.5px',
                          fontWeight: 700,
                        }}
                      >
                        ● Active SLA
                      </span>
                    </div>

                    <div
                      style={{
                        padding: '18px',
                        borderRadius: '14px',
                        background: isLight ? '#FAF9F5' : '#182338',
                        border: `1px solid ${surfaceBorder}`,
                        fontSize: '13.5px',
                        lineHeight: 1.6,
                        color: textPrimary,
                      }}
                    >
                      <div style={{ fontWeight: 700, marginBottom: '8px' }}>{msg.subject}</div>
                      <div>{msg.snippet}</div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => {
                          triggerToast(`Approved & scheduled ${msg.brand} request onto Calendar!`);
                          setActiveTab('calendar');
                        }}
                        style={{
                          padding: '9px 18px',
                          borderRadius: '999px',
                          border: 'none',
                          background: '#0E7C5B',
                          color: '#FFFFFF',
                          fontSize: '12.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        ✓ Approve & Schedule on Calendar
                      </button>
                      <button
                        onClick={() => {
                          setNewDealForm((p) => ({
                            ...p,
                            table_label: `Table · ${msg.brand}`,
                            tenant_brand: msg.brand,
                            pic_name: msg.sender,
                            plan_code: msg.plan,
                          }));
                          setShowNewDealModal(true);
                        }}
                        style={{
                          padding: '9px 18px',
                          borderRadius: '999px',
                          border: `1px solid ${surfaceBorder}`,
                          background: surfaceBg,
                          color: textPrimary,
                          fontSize: '12.5px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        + Push to Deals Board
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* ===================================================================
            TAB 5: APPROVALS [5] (Tenant Plan Upgrades & Pricing Menu)
           =================================================================== */}
        {activeTab === 'approvals' && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              animation: 'murmuraFadeSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <div>
              <h1
                style={{
                  margin: 0,
                  fontFamily: activeFontFamily.display,
                  fontSize: '34px',
                  fontWeight: 400,
                  color: textPrimary,
                }}
              >
                Approvals & SaaS Packages
              </h1>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: textSecondary }}>
                Persetujuan upgrade paket tenant (Starter, Pro, Franchise) dan katalog harga langganan
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
                    'Interactive Floor Plan & Kitchen Display System',
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

        {/* ===================================================================
            TAB 6: ANALYTICS (Sales & Revenue Reports)
           =================================================================== */}
        {activeTab === 'reports' && (
          <TavolaSalesReportsView
            theme={theme}
            currency={currency}
            selectedTenantFilter={selectedTenantFilter}
            fontFamily={activeFontFamily}
            onTriggerToast={triggerToast}
          />
        )}

        {/* ===================================================================
            TAB 7: LISTENING · TENANTS DIRECTORY & DATABASE ENGINE
           =================================================================== */}
        {activeTab === 'listening' && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              animation: 'murmuraFadeSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h1
                  style={{
                    margin: 0,
                    fontFamily: activeFontFamily.display,
                    fontSize: '34px',
                    fontWeight: 400,
                    color: textPrimary,
                  }}
                >
                  Active Tenants & Database Infrastructure
                </h1>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: textSecondary }}>
                  Kelola seluruh tenant restoran aktif, paket langganan, dan konfigurasi PostgreSQL / Supabase Storage
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <Link
                  href="/superadmin/inspector"
                  style={{
                    background: '#0E7C5B',
                    color: '#FFFFFF',
                    textDecoration: 'none',
                    borderRadius: '999px',
                    padding: '9px 18px',
                    fontSize: '12.5px',
                    fontWeight: 700,
                  }}
                >
                  🖥️ Inspect Role Admin / Kasir / Kitchen ↗
                </Link>
                <button
                  onClick={() => setShowOnboardModal(true)}
                  style={{
                    background: '#161920',
                    color: '#FFFFFF',
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
            </div>

            {/* Tenants Table */}
            <div
              style={{
                background: surfaceBg,
                border: `1px solid ${surfaceBorder}`,
                borderRadius: '20px',
                overflowX: 'auto',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${surfaceBorder}`, color: textSecondary, fontSize: '12px' }}>
                    <th style={{ padding: '14px 18px' }}>Nama Tenant</th>
                    <th style={{ padding: '14px 18px' }}>Owner / Admin</th>
                    <th style={{ padding: '14px 18px' }}>Cabang & User</th>
                    <th style={{ padding: '14px 18px' }}>Paket Langganan</th>
                    <th style={{ padding: '14px 18px' }}>Status</th>
                    <th style={{ padding: '14px 18px', textAlign: 'right' }}>Kontrol Cepat</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map((t) => (
                    <tr key={t.id} style={{ borderBottom: `1px solid ${surfaceBorder}`, fontSize: '13px' }}>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: 700, color: textPrimary }}>{t.name}</div>
                        <div style={{ fontSize: '11.5px', color: textSecondary }}>
                          slug: <code>{t.slug}</code>
                        </div>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: 600, color: textPrimary }}>{t.owner_name || 'Admin Tenant'}</div>
                        <div style={{ fontSize: '11.5px', color: textSecondary }}>{t.owner_email || '-'}</div>
                      </td>
                      <td style={{ padding: '14px 18px', color: textSecondary }}>
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
                            border: `1px solid ${surfaceBorder}`,
                            background:
                              t.plan_code === 'franchise'
                                ? '#BCE3D4'
                                : t.plan_code === 'pro'
                                ? '#EFA892'
                                : '#EADCA6',
                            color: '#14171D',
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
                            background: t.status === 'active' ? '#E3F5EE' : '#FDECE8',
                            color: t.status === 'active' ? '#0E7C5B' : '#C84B31',
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
                              background: '#FDECE8',
                              color: '#C84B31',
                              border: 'none',
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
                              background: '#0E7C5B',
                              color: '#FFFFFF',
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

            {/* Database Settings Panel */}
            <div
              style={{
                background: '#0F172A',
                borderRadius: '22px',
                padding: '22px',
                color: '#F8FAFC',
              }}
            >
              <DatabaseSettingsPanel />
            </div>
          </div>
        )}
      </main>

      {/* =====================================================================
          MODAL: + NEW TENANT DEAL
         ===================================================================== */}
      {showNewDealModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 80,
            background: 'rgba(8, 13, 24, 0.65)',
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
              background: surfaceBg,
              color: textPrimary,
              border: `1px solid ${surfaceBorder}`,
              borderRadius: '22px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px' }}>+ New Tenant Deal / Rollout</h3>
              <button
                type="button"
                onClick={() => setShowNewDealModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: textSecondary,
                  fontSize: '18px',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            <div>
              <label style={{ fontSize: '11.5px', color: textSecondary }}>Nama Brand Restoran / Deal</label>
              <input
                type="text"
                required
                placeholder="Contoh: Ember & Oak · Kemang Flagship"
                value={newDealForm.table_label}
                onChange={(e) =>
                  setNewDealForm((p) => ({
                    ...p,
                    table_label: e.target.value,
                    tenant_brand: e.target.value,
                  }))
                }
                style={{
                  width: '100%',
                  marginTop: '4px',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: `1px solid ${surfaceBorder}`,
                  background: isLight ? '#FAF9F5' : '#0C1322',
                  color: textPrimary,
                  fontSize: '13px',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11.5px', color: textSecondary }}>Nama PIC / Owner</label>
                <input
                  type="text"
                  placeholder="Contoh: Rio Pratama"
                  value={newDealForm.pic_name}
                  onChange={(e) => setNewDealForm((p) => ({ ...p, pic_name: e.target.value }))}
                  style={{
                    width: '100%',
                    marginTop: '4px',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: `1px solid ${surfaceBorder}`,
                    background: isLight ? '#FAF9F5' : '#0C1322',
                    color: textPrimary,
                    fontSize: '13px',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11.5px', color: textSecondary }}>Nilai Kontrak ($ USD)</label>
                <input
                  type="number"
                  value={newDealForm.amount_usd}
                  onChange={(e) => setNewDealForm((p) => ({ ...p, amount_usd: e.target.value }))}
                  style={{
                    width: '100%',
                    marginTop: '4px',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: `1px solid ${surfaceBorder}`,
                    background: isLight ? '#FAF9F5' : '#0C1322',
                    color: textPrimary,
                    fontSize: '13px',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '11.5px', color: textSecondary }}>Modul & Kebutuhan Tenant (1 per baris)</label>
              <textarea
                rows={4}
                value={newDealForm.items_text}
                onChange={(e) => setNewDealForm((p) => ({ ...p, items_text: e.target.value }))}
                style={{
                  width: '100%',
                  marginTop: '4px',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: `1px solid ${surfaceBorder}`,
                  background: isLight ? '#FAF9F5' : '#0C1322',
                  color: textPrimary,
                  fontSize: '12.5px',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => setShowNewDealModal(false)}
                style={{
                  background: 'transparent',
                  color: textSecondary,
                  border: `1px solid ${surfaceBorder}`,
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
                  background: '#0E7C5B',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '999px',
                  padding: '8px 20px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Simpan Deal
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
            background: 'rgba(8, 13, 24, 0.65)',
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
              background: surfaceBg,
              color: textPrimary,
              border: `1px solid ${surfaceBorder}`,
              borderRadius: '22px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <h3 style={{ margin: 0, fontSize: '18px' }}>Deploy Tenant Restoran Baru</h3>
            <input
              type="text"
              required
              placeholder="Nama Brand Restoran"
              value={onboardForm.tenant_name}
              onChange={(e) => setOnboardForm((p) => ({ ...p, tenant_name: e.target.value }))}
              style={{
                padding: '9px 12px',
                borderRadius: '10px',
                border: `1px solid ${surfaceBorder}`,
                background: isLight ? '#FAF9F5' : '#0C1322',
                color: textPrimary,
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
                border: `1px solid ${surfaceBorder}`,
                background: isLight ? '#FAF9F5' : '#0C1322',
                color: textPrimary,
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
                border: `1px solid ${surfaceBorder}`,
                background: isLight ? '#FAF9F5' : '#0C1322',
                color: textPrimary,
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowOnboardModal(false)}
                style={{
                  background: 'transparent',
                  color: textSecondary,
                  border: `1px solid ${surfaceBorder}`,
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
                  background: '#0E7C5B',
                  color: '#FFFFFF',
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
          THEME-MATCHED NON-BLOCKING FLOATING TOAST WITH [Undo] & PROGRESS BAR
         ===================================================================== */}
      {toastInfo.visible && (
        <div
          key={toastInfo.id}
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 90,
            maxWidth: '460px',
            background: isLight
              ? 'rgba(255, 255, 255, 0.98)'
              : 'rgba(19, 28, 46, 0.96)',
            border: isLight
              ? '1px solid rgba(14, 124, 91, 0.28)'
              : '1px solid rgba(52, 211, 153, 0.3)',
            borderRadius: '18px',
            padding: '13px 16px 16px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: isLight
              ? '0 22px 48px rgba(20, 23, 29, 0.14), 0 4px 14px rgba(14, 124, 91, 0.12)'
              : '0 22px 48px rgba(0, 0, 0, 0.55), 0 4px 14px rgba(14, 124, 91, 0.22)',
            backdropFilter: 'blur(14px)',
            overflow: 'hidden',
            animation: 'murmuraToastSlideUp 0.28s cubic-bezier(0.22, 1, 0.36, 1) forwards',
          }}
        >
          {/* Left Emerald Status Icon Badge */}
          <span
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '11px',
              background: isLight ? '#E3F5EE' : 'rgba(14, 124, 91, 0.25)',
              border: '1px solid rgba(14, 124, 91, 0.35)',
              color: isLight ? '#0E7C5B' : '#34D399',
              display: 'grid',
              placeItems: 'center',
              fontSize: '15px',
              fontWeight: 800,
              flexShrink: 0,
            }}
          >
            ✓
          </span>

          {/* Title & Message */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: '12.5px',
                fontWeight: 800,
                color: textPrimary,
                letterSpacing: '-0.01em',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>{toastInfo.title || 'Perubahan Berhasil Disimpan'}</span>
              <span
                style={{
                  fontSize: '9.5px',
                  fontWeight: 800,
                  padding: '1px 7px',
                  borderRadius: '999px',
                  background: isLight ? '#E3F5EE' : 'rgba(14, 124, 91, 0.28)',
                  color: isLight ? '#0E7C5B' : '#6EE7B7',
                  textTransform: 'uppercase',
                }}
              >
                Synced
              </span>
            </div>
            <div
              style={{
                fontSize: '12px',
                color: textSecondary,
                fontWeight: 500,
                marginTop: '2px',
                lineHeight: 1.4,
              }}
            >
              {toastInfo.message}
            </div>
          </div>

          {/* Optional Undo Pill Button */}
          {toastInfo.undoAction && (
            <button
              onClick={() => {
                toastInfo.undoAction();
                setToastInfo((prev) => ({
                  ...prev,
                  id: Date.now(),
                  undoAction: null,
                  title: 'Perubahan Dibatalkan',
                  message: 'Status dikembalikan ke posisi sebelumnya',
                }));
              }}
              style={{
                background: isLight ? '#FEF3C7' : 'rgba(242, 178, 73, 0.2)',
                color: isLight ? '#B45309' : '#F2B249',
                border: '1px solid rgba(242, 178, 73, 0.45)',
                borderRadius: '999px',
                padding: '5px 12px',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              ↩ Undo
            </button>
          )}

          {/* Close Button */}
          <button
            onClick={() => setToastInfo((prev) => ({ ...prev, visible: false }))}
            aria-label="Tutup notifikasi"
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '8px',
              background: isLight ? 'rgba(20,23,29,0.05)' : 'rgba(255,255,255,0.06)',
              border: 'none',
              color: textSecondary,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            ✕
          </button>

          {/* Animated 3.8s Progress Bar along Bottom Edge */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: '3px',
              background: isLight ? 'rgba(14,124,91,0.12)' : 'rgba(255,255,255,0.06)',
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, #0E7C5B, #10B981, #F2B249)',
                transformOrigin: 'left center',
                animation: 'murmuraToastProgress 3.8s linear forwards',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
