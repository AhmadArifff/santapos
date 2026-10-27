'use client';
import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthGuard from '@/components/ui/AuthGuard';
import {
  getCategories, createTransaction,
  getMyStockProducts, getStockAllUsers, getTodayStats,
  getPublicDiningTables, getActiveDiscountPrograms,
} from '@/lib/api';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import Cart         from '@/components/pos/Cart';
import PaymentModal from '@/components/pos/PaymentModal';
import Receipt      from '@/components/pos/Receipt';
import ProductCard  from '@/components/pos/ProductCard';
import { useReactToPrint } from 'react-to-print';
import AdminLayout  from '@/components/layout/AdminLayout';
import SuccessModal from '@/components/stock/SuccessModal';

// ── Skeleton ──────────────────────────────────────────────────
function ProductSkeleton() {
  return (
    <div className="bg-slate-800/60 rounded-2xl overflow-hidden border border-slate-700/50 animate-pulse">
      <div className="h-28 bg-slate-700/60" />
      <div className="p-3 space-y-2">
        <div className="h-3.5 bg-slate-700 rounded-full w-3/4" />
        <div className="h-3 bg-slate-700/60 rounded-full w-1/2" />
        <div className="h-3 bg-slate-700/40 rounded-full w-1/3" />
      </div>
    </div>
  );
}

function CartBadge({ count }) {
  if (!count) return null;
  return (
    <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1
      bg-orange-500 text-white text-xs font-black rounded-full
      flex items-center justify-center shadow-lg shadow-orange-500/40">
      {count > 99 ? '99+' : count}
    </span>
  );
}

function SearchIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
    </svg>
  );
}

function CartIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
    </svg>
  );
}

function PosTutorialDemo() {
  return (
    <div className="pos-tutorial-demo space-y-4 px-4 sm:px-5 py-4">
      <div className="rounded-3xl border border-orange-400/35 bg-orange-500/5 p-4">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-300">Mode Demo Tutorial</p>
        <p className="mt-1 text-sm leading-6 text-slate-300">
          Data kasir di bawah adalah dummy untuk latihan alur. Item demo tidak tersimpan ke database kecuali user memproses transaksi asli.
        </p>
      </div>
      <div data-tour="pos-product-count" className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
        4 menu demo tersedia · pengajuan dari Kasir Tutorial
      </div>
      <div data-tour="pos-bundle-hints" className="grid gap-3 md:grid-cols-2">
        <button type="button" data-tour="pos-bundle-card" className="rounded-2xl border border-emerald-400/35 bg-emerald-500/10 p-4 text-left text-emerald-100">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-300">Paket Bundle</p>
          <div className="mt-1 flex items-start justify-between gap-3">
            <h3 className="text-sm font-black text-white">Bundle Demo Kebab</h3>
            <span className="rounded-full bg-slate-950/60 px-2.5 py-1 text-xs font-black">50%</span>
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-300">Syarat paket sudah lengkap, diskon otomatis dicek saat pembayaran.</p>
        </button>
      </div>
      <div data-tour="pos-product-grid" className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
        {[
          ['Adana Kebab Platter', 89000, '12 porsi', 'bg-emerald-500'],
          ['Arabic Qahwa Coffee', 35000, '7 porsi', 'bg-emerald-500'],
          ['Ayran Sultan', 28000, '3 porsi', 'bg-yellow-500'],
          ['Lahmacun Sultan', 52000, 'Stok habis', 'bg-red-500'],
        ].map(([name, price, stock, dot], index) => (
          <div key={name} data-tour={index === 0 ? 'pos-product-card' : undefined} data-soldout={index === 3 ? 'true' : 'false'} className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-800">
            <div className="h-28 bg-slate-700">
              <img alt={name} src={`https://images.unsplash.com/photo-${index === 0 ? '1601050690597-df0568f70950' : index === 1 ? '1509042239860-f550ce710b93' : index === 2 ? '1570197788417-0e82375c9371' : '1574484284002-952d92456975'}?w=400&q=80`} className="h-full w-full object-cover" />
            </div>
            <div className="p-3">
              <p className="line-clamp-2 text-sm font-semibold text-white">{name}</p>
              <p className="mt-1 text-sm font-bold text-orange-400">Rp {price.toLocaleString('id-ID')}</p>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
                {stock}
              </div>
              {index !== 3 && (
                <button type="button" className="mt-3 w-full rounded-lg bg-orange-500/90 py-2 text-xs font-black text-white">
                  Tambah demo
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div data-tour="pos-payment-modal" className="rounded-3xl border border-slate-700 bg-slate-900 p-5">
          <div data-tour="pos-payment-discount" className="rounded-xl border border-slate-700 bg-slate-800/60 p-3 text-sm">
            <p className="font-black uppercase tracking-[0.16em] text-slate-500">Voucher & Diskon</p>
            <div className="mt-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-emerald-100">
              Bundle Demo Kebab + Kode Voucher <strong className="float-right text-red-300">-Rp 69.600</strong>
            </div>
          </div>
          <div data-tour="pos-payment-methods" className="mt-4 grid grid-cols-3 gap-2">
            {['Tunai', 'QRIS', 'Transfer'].map((method) => (
              <button key={method} type="button" className="rounded-xl border border-orange-500 bg-orange-500/10 py-3 text-sm font-bold text-orange-300">{method}</button>
            ))}
          </div>
          <div data-tour="pos-payment-actions" className="mt-4 flex gap-3">
            <button type="button" className="flex-1 rounded-xl bg-slate-800 py-3 font-bold text-slate-300">Batal</button>
            <button type="button" className="flex-[2] rounded-xl bg-orange-500 py-3 font-black text-white">Proses & Cetak Struk</button>
          </div>
        </div>
        <div data-tour="pos-cart" className="rounded-3xl border border-slate-700 bg-slate-800 p-5">
          <div data-tour="pos-cart-items" className="space-y-3">
            {['Adana Kebab Platter', 'Arabic Qahwa Coffee'].map((name) => (
              <div key={name} className="flex justify-between gap-3 text-sm">
                <span className="text-white">{name} x1</span>
                <span className="text-orange-300">Demo</span>
              </div>
            ))}
          </div>
          <div data-tour="pos-cart-total" className="mt-4 flex justify-between border-t border-slate-700 pt-4">
            <span className="text-slate-400">Total</span>
            <strong className="text-white">Rp 124.000</strong>
          </div>
          <button data-tour="pos-cart-checkout" type="button" className="mt-4 w-full rounded-xl bg-orange-500 py-3 font-black text-white">Bayar</button>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function PosPage() {
  const [products,        setProducts]        = useState([]);
  const [categories,      setCategories]      = useState([]);
  const [activeCategory,  setActiveCategory]  = useState('all');
  const [search,          setSearch]          = useState('');
  const [showPayment,     setShowPayment]      = useState(false);
  const [lastTransaction, setLastTransaction] = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [refreshing,      setRefreshing]      = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [showMobileCart,  setShowMobileCart]  = useState(false);
  const [todayStats,      setTodayStats]      = useState({
    total_trx: 0,
    revenue: 0,
    margin: 0,
    margin_pct: 0,
  });
  const [diningTables, setDiningTables] = useState([]);
  const [bundlePrograms, setBundlePrograms] = useState([]);
  const [selectedTableId, setSelectedTableId] = useState('');
  const [feedbackModal,   setFeedbackModal]   = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
  });

  // Admin: sumber stok yang dipilih
  const [selectedSourceUser, setSelectedSourceUser] = useState(null);

  const { items, addItem, clearCart } = useCartStore();
  const { user, selectedBranchId }     = useAuthStore();
  const router                        = useRouter();
  const receiptRef                    = useRef();
  const productsRef                   = useRef([]);
  const selectedSourceUserRef         = useRef(null);

  useEffect(() => {
    productsRef.current = products;
  }, [products]);
  useEffect(() => {
    selectedSourceUserRef.current = selectedSourceUser;
  }, [selectedSourceUser]);

  const total     = items.reduce((s, i) => s + Number(i.price) * i.qty, 0);
  const itemCount = items.reduce((s, i) => s + i.qty, 0);
  const isAdmin   = user?.role === 'admin';

  const showFeedback = useCallback((type, title, message) => {
    setFeedbackModal({ isOpen: true, type, title, message });
  }, []);

  const isTableBusy = useCallback((table) => (
    Number(table?.active_orders || 0) > 0
    || Number(table?.active_order_count || 0) > 0
    || Number(table?.active_session_count || 0) > 0
  ), []);

  const syncDiningTables = useCallback((tableRows = []) => {
    setDiningTables(tableRows);
    setSelectedTableId((prev) => {
      if (prev && tableRows.some((table) => String(table.id) === String(prev) && !isTableBusy(table))) {
        return prev;
      }
      return tableRows.find((table) => !isTableBusy(table))?.id || '';
    });
  }, [isTableBusy]);

  const refreshDiningTables = useCallback(async () => {
    const res = await getPublicDiningTables({ branch_id: selectedBranchId || user?.branch_id || undefined });
    const tableRows = res.data || [];
    syncDiningTables(tableRows);
    return tableRows;
  }, [selectedBranchId, syncDiningTables, user?.branch_id]);

  const openPaymentModal = useCallback(async () => {
    if (!items.length) return;
    try {
      await refreshDiningTables();
    } catch (err) {
      showFeedback('warning', 'Meja Belum Tersinkron', 'Data meja belum bisa disegarkan. Anda tetap bisa checkout tanpa memilih meja.');
    }
    setShowPayment(true);
  }, [items.length, refreshDiningTables, showFeedback]);

  // ── Load data ──────────────────────────────────────────────
  const loadData = useCallback(({ silent = false } = {}) => {
    if (silent || productsRef.current.length > 0) setRefreshing(true);
    else setLoading(true);
    // 🔄 Using getStockAllUsers for admin - awaiting /stock-requests/approved-for-pos backend implementation
    const fetchProducts = isAdmin ? getStockAllUsers : getMyStockProducts;

    Promise.all([
      fetchProducts(),
      getCategories(),
      getTodayStats().catch(() => ({ data: null })),
      getPublicDiningTables({ branch_id: selectedBranchId || user?.branch_id || undefined }).catch(() => ({ data: [] })),
      getActiveDiscountPrograms({ type: 'bundle' }).catch(() => ({ data: [] })),
    ])
      .then(([p, c, stats, tableRes, bundleRes]) => {
        const prods = p.data || [];
        const tableRows = tableRes.data || [];
        setProducts(prods);
        setCategories(c.data || []);
        syncDiningTables(tableRows);
        setBundlePrograms(bundleRes.data || []);
        if (stats?.data) {
          setTodayStats({
            total_trx: Number(stats.data.total_trx || 0),
            revenue: Number(stats.data.revenue || 0),
            margin: Number(stats.data.margin || 0),
            margin_pct: Number(stats.data.margin_pct || 0),
          });
        }

        // Admin: pilih user pertama yang punya stok sebagai default
        if (isAdmin && !selectedSourceUserRef.current && prods.length > 0) {
          const firstUser = prods
            .flatMap(product => product.stock_by_user || [])
            .find(stockUser => Number(stockUser.can_make || 0) > 0);
          if (firstUser) {
            setSelectedSourceUser({
              user_id: firstUser.user_id,
              user_name: firstUser.user_name,
              role: firstUser.role,
              can_make: firstUser.can_make,
            });
          }
        }
      })
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }, [isAdmin, selectedBranchId, syncDiningTables, user?.branch_id]);

  useEffect(() => { loadData(); }, [loadData]);

  // Tambahkan setelah fungsi handleNoStock
  const handleKasirNoStock = (product) => {
    const ings = product.ingredients?.map(ing => ({
      stock_item_id: ing.stock_item_id,
      qty:           Number(ing.qty || ing.qty_per_portion || 1),
      name:          ing.ingredient_name,
      unit:          ing.unit,
    })) || [];

    const params = new URLSearchParams({
      from:         'pos',
      product_name: product.name,
      user_id:      String(user?.id || ''),
      ingredients:  JSON.stringify(ings),
    });

    router.push(`/stock?${params.toString()}`);
  };

  const handlePrint = useReactToPrint({ contentRef: receiptRef });

  // ── Stok produk sesuai konteks ─────────────────────────────
  const getProductStock = useCallback((product) => {
    if (!isAdmin) return product.stock ?? 0;
    if (!selectedSourceUser) return 0;
    const userStock = product.stock_by_user?.find(
      u => u.user_id === selectedSourceUser.user_id
    );
    return userStock ? (Number(userStock.can_make || 0)) : 0;
  }, [isAdmin, selectedSourceUser]);

  // ── Semua user dengan stok (FILTERED: hanya yang can_make > 0) ────────────────────────────────
  const stockUsersList = isAdmin
    ? Object.values(
        products.reduce((acc, p) => {
          (p.stock_by_user || []).forEach((u) => {
            const canMake = Number(u.can_make || 0);
            if (canMake <= 0) return;
            const prev = acc[u.user_id];
            if (!prev || canMake > prev.can_make) {
              acc[u.user_id] = { ...u, can_make: canMake };
            }
          });
          return acc;
        }, {})
      )
    : [];

  // ── Add to cart ────────────────────────────────────────────
  const handleAddItem = (product) => {
    const stock  = getProductStock(product);
    const inCart = items.find(i => i.id === product.id);

    if (stock === 0) {
      if (isAdmin) handleNoStock(product);
      else         handleKasirNoStock(product); // ← tambah ini
      return;
    }

    if (inCart && inCart.qty >= stock) {
      showFeedback(
        'warning',
        'Stok Tidak Cukup',
        `Maksimal pesanan untuk menu ini adalah ${stock} porsi dari stok cabang aktif.`
      );
      return;
    }

    addItem({
      ...product,
      _sourceUserId: isAdmin ? selectedSourceUser?.user_id : user?.id,
      _availableStock: stock,
    });
  };

  // ── Redirect ke form pengajuan stok ───────────────────────
  const handleNoStock = (product) => {
    const ings = product.ingredients?.map(ing => ({
      stock_item_id: ing.stock_item_id,
      qty:           Number(ing.qty || ing.qty_per_portion || 1),
      name:          ing.ingredient_name,
      unit:          ing.unit,
    })) || [];

    const params = new URLSearchParams({
      from:         'pos',
      product_name: product.name,
      user_id:      String(selectedSourceUser?.user_id || user?.id || ''),
      ingredients:  JSON.stringify(ings),
    });

    router.push(`/stock?${params.toString()}`);
  };

  // ── Transaksi ──────────────────────────────────────────────
  // ✅ CHANGED: Track admin execution dan request_id yang digunakan
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const findAvailableProduct = () => products.find((product) => Number(getProductStock(product) || 0) > 0);

    window.__POS_TUTORIAL__ = {
      ensureDemoOrder: () => {
        setSearch('');
        setActiveCategory('all');
        if (items.length > 0) return true;
        const product = findAvailableProduct();
        if (!product) {
          showFeedback(
            'warning',
            'Stok Demo Tidak Tersedia',
            'Tutorial membutuhkan minimal satu menu dengan stok tersedia untuk membuka modal pembayaran.'
          );
          return false;
        }
        handleAddItem(product);
        return true;
      },
      openPayment: async () => {
        setSearch('');
        setActiveCategory('all');
        const hasOrder = items.length > 0 || window.__POS_TUTORIAL__?.ensureDemoOrder();
        if (!hasOrder) return false;
        try {
          await refreshDiningTables();
        } catch (err) {
          showFeedback('warning', 'Meja Belum Tersinkron', 'Data meja belum bisa disegarkan. Anda tetap bisa checkout tanpa memilih meja.');
        }
        setShowPayment(true);
        return true;
      },
    };

    return () => {
      if (window.__POS_TUTORIAL__) delete window.__POS_TUTORIAL__;
    };
  }, [getProductStock, items.length, products, refreshDiningTables, showFeedback]);

  const handlePayment = async (paymentMethod, tunai = 0, _kembalian = 0, discountMeta = {}) => {
    if (paymentProcessing) return;
    for (const cartItem of items) {
      const stock = getProductStock(cartItem);
      if (Number(cartItem.qty || 0) > Number(stock || 0)) {
        showFeedback(
          'error',
          'Stok Berubah',
          `Stok ${cartItem.name} tersisa ${stock} porsi. Kurangi jumlah pesanan lalu coba lagi.`
        );
        return;
      }
    }

    setPaymentProcessing(true);
    try {
      const sourceUserId = isAdmin
        ? (selectedSourceUser?.user_id || null)
        : null;

      const res = await createTransaction({
        payment_method: paymentMethod,
        sourceUserId: sourceUserId,
        table_id: selectedTableId || null,
        customer_phone: discountMeta.customer_phone || '',
        voucher_code: discountMeta.voucher_code || '',
        items: items.map(i => ({ product_id: i.id, price: i.price, qty: i.qty })),
      });
      const transactionData = res.data?.data || {};
      const finalTotal = Number(transactionData.total ?? transactionData.total_price ?? discountMeta.final_total ?? total);
      const discountAmount = Number(transactionData.discount_amount ?? discountMeta.discount_amount ?? 0);

      setLastTransaction({
        ...res.data,
        items,
        subtotal: Number(transactionData.subtotal ?? total),
        total: finalTotal,
        discount_amount: discountAmount,
        discount_label: transactionData.discount_label,
        voucher_code: transactionData.voucher_code,
        payment_method: paymentMethod,
        tunai,
        kembalian:  paymentMethod === 'cash' ? tunai - finalTotal : 0,
        kasir_name: isAdmin
          ? `Admin (${user?.name}) → ${selectedSourceUser?.user_name || 'Gudang'}`
          : user?.name,
        created_by_type: isAdmin ? 'admin' : 'kasir',
        customer_order_code: transactionData.customer_order_code,
        table_number: transactionData.table_number,
        receipt_status_url: transactionData.customer_order_code
          ? `${window.location.origin}/order/status/${transactionData.customer_order_code}`
          : null,
      });

      clearCart();
      setShowPayment(false);
      setShowMobileCart(false);
      showFeedback(
        'success',
        'Transaksi Berhasil',
        `Pendapatan cabang hari ini bertambah Rp ${Number(finalTotal || 0).toLocaleString('id-ID')}. Struk sedang disiapkan.`
      );
      setTimeout(() => handlePrint(), 400);
      loadData({ silent: true });
    } catch (err) {
      const validation = err.response?.data?.validation_errors;
      const detail = Array.isArray(validation) && validation.length
        ? validation.map((item) => `${item.item_name}: tersedia ${item.available}, butuh ${item.needed}`).join('\n')
        : null;
      showFeedback(
        'error',
        'Transaksi Gagal',
        detail || err.response?.data?.message || 'Transaksi belum bisa diproses. Silakan cek stok dan koneksi lalu coba lagi.'
      );
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handleCancelPayment = () => {
    if (paymentProcessing) return;
    setShowPayment(false);
    showFeedback(
      'warning',
      'Pembayaran Dibatalkan',
      'Keranjang masih tersimpan. Anda bisa melanjutkan pembayaran kapan saja.'
    );
  };

  // ── Filter produk ──────────────────────────────────────────
  const filtered = useMemo(() => products
    .filter(p => {
      const matchCat    = activeCategory === 'all' || p.category_id == activeCategory;
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    })
    .sort((a, b) => {
      const stockA = Number(getProductStock(a) || 0);
      const stockB = Number(getProductStock(b) || 0);
      const availableA = stockA > 0 ? 1 : 0;
      const availableB = stockB > 0 ? 1 : 0;
      if (availableA !== availableB) return availableB - availableA;
      if (stockA !== stockB) return stockB - stockA;
      return String(a.name || '').localeCompare(String(b.name || ''), 'id');
    }), [products, activeCategory, search, getProductStock]);

  const bundleHints = useMemo(() => {
    const productById = new Map(products.map((product) => [Number(product.id), product]));
    const cartQtyById = new Map();
    items.forEach((item) => {
      const productId = Number(item.id || item.product_id);
      if (!productId) return;
      cartQtyById.set(productId, Number(cartQtyById.get(productId) || 0) + Number(item.qty || 0));
    });

    return (bundlePrograms || [])
      .map((program) => {
        const bundleItems = Array.isArray(program.bundle_items) && program.bundle_items.length
          ? program.bundle_items
          : (program.bundle_product_ids || []).map((id) => ({ product_id: id, qty: 1 }));
        const uniqueBundleItems = [...new Map(bundleItems
          .map((item) => [Number(item.product_id || item.id || item), {
            product_id: Number(item.product_id || item.id || item),
            qty: Math.max(1, Number(item.qty || 1)),
          }])
          .filter(([id]) => id)).values()];
        const bundleProducts = uniqueBundleItems.map((item) => ({
          ...productById.get(Number(item.product_id)),
          required_qty: Number(item.qty || 1),
          current_qty: Number(cartQtyById.get(Number(item.product_id)) || 0),
        })).filter((product) => product.id);
        if (bundleProducts.length === 0) return null;

        const missingProducts = bundleProducts.filter((product) => Number(product.current_qty || 0) < Number(product.required_qty || 1));
        const selectedCount = bundleProducts.length - missingProducts.length;
        const unavailable = missingProducts.filter((product) => Number(getProductStock(product) || 0) < Number(product.required_qty || 1));
        const discountText = program.discount_type === 'percent'
          ? `${Number(program.discount_value || 0)}%`
          : `Rp ${Number(program.discount_value || 0).toLocaleString('id-ID')}`;

        return {
          ...program,
          bundleProducts,
          missingProducts,
          selectedCount,
          unavailable,
          discountText,
          complete: missingProducts.length === 0,
        };
      })
      .filter(Boolean)
      .sort((a, b) => Number(b.selectedCount) - Number(a.selectedCount));
  }, [bundlePrograms, getProductStock, items, products]);

  const handleAddBundle = (program) => {
    const targets = (program.missingProducts?.length ? program.missingProducts : program.bundleProducts)
      .filter((product) => Number(getProductStock(product) || 0) > 0);
    targets.forEach((product) => {
      const needed = Math.max(1, Number(product.required_qty || 1) - Number(product.current_qty || 0));
      for (let index = 0; index < needed; index += 1) handleAddItem(product);
    });
    if (targets.length > 0) {
      showFeedback(
        'success',
        'Paket Bundle Ditambahkan',
        `${targets.length} menu syarat paket sudah masuk ke keranjang.`
      );
    }
  };

  const now     = new Date();
  const timeStr = now.toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' });
  const dateStr = now.toLocaleDateString('id-ID', {
    weekday:'short', day:'numeric', month:'short', year:'numeric'
  });

  return (
    <AuthGuard>
      <AdminLayout noPadding>
        <div className="flex h-screen bg-slate-950 overflow-hidden" data-tour="pos-layout">

          {/* ── MAIN PANEL ── */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">

            {/* ── TOPBAR ── */}
            <header
              className="bg-slate-900/95 backdrop-blur-sm border-b border-slate-800
              px-4 sm:px-5 py-3 flex items-center gap-3 shrink-0 z-10 flex-wrap"
              data-tour="pos-topbar"
            >

              {/* Clock */}
              <div className="flex flex-col items-center" data-tour="pos-clock">
                <span className="text-white font-mono font-bold text-base leading-none">{timeStr}</span>
                <span className="text-slate-500 text-xs capitalize mt-0.5">{dateStr}</span>
              </div>

              <div className="flex-1" />

              {/* ── ADMIN: Pilih sumber stok ── */}
              {isAdmin && stockUsersList.length > 0 && (
                <div className="hidden sm:flex items-center gap-2 flex-wrap" data-tour="pos-source-selector">
                  <span className="text-slate-500 text-xs shrink-0">Stok dari:</span>
                  {stockUsersList.map(u => {
                    const isSelected = selectedSourceUser?.user_id === u.user_id;
                    const hasStock   = Number(u.can_make || 0) > 0;
                    return (
                      <button key={u.user_id}
                        onClick={() => {
                          if (selectedSourceUser?.user_id === u.user_id) return;
                          setSelectedSourceUser({
                            user_id: u.user_id,
                            user_name: u.user_name,
                            role: u.role,
                            can_make: u.can_make,
                          });
                          clearCart();
                        }}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl
                          text-xs font-semibold transition-all ${
                          isSelected
                            ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25'
                            : hasStock
                              ? 'bg-slate-700 text-slate-300 hover:bg-slate-600 border border-slate-600'
                              : 'bg-slate-800/60 text-slate-600 border border-slate-700/40'
                        }`}>
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          hasStock ? 'bg-green-400' : 'bg-red-400'
                        }`} />
                        <div className="flex flex-col gap-0.5">
                          <span>{u.user_name}</span>
                          <span className="text-[10px] opacity-70">{u.can_make} porsi</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Search */}
              <div className="relative hidden sm:flex items-center" data-tour="pos-search">
                <span className="absolute left-3 text-slate-500 pointer-events-none">
                  <SearchIcon />
                </span>
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Cari menu..."
                  className="bg-slate-800 border border-slate-700 text-white text-sm
                    rounded-xl pl-9 pr-4 py-2 w-48 lg:w-56 outline-none
                    focus:ring-2 focus:ring-orange-500/50 placeholder:text-slate-500" />
              </div>

              {/* Kasir info */}
              <div className="hidden sm:flex items-center gap-2 shrink-0" data-tour="pos-user-info">
                <div className="w-8 h-8 rounded-full bg-orange-500/20 border border-orange-500/30
                  flex items-center justify-center text-orange-400 text-xs font-bold">
                  {user?.name?.charAt(0)?.toUpperCase() || 'K'}
                </div>
                <div className="hidden lg:block">
                  <p className="text-white text-xs font-medium leading-tight">{user?.name}</p>
                  <p className="text-slate-500 text-xs capitalize">{user?.role}</p>
                </div>
              </div>

              {/* Pendapatan cabang aktif */}
              <div
                className="shrink-0 rounded-2xl border border-emerald-400/20
                bg-emerald-400/10 px-3 py-2 shadow-lg shadow-emerald-950/20"
                data-tour="pos-today-revenue"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,0.8)]" />
                  <span className="text-[10px] uppercase tracking-[0.18em] text-emerald-200/70">
                    Pendapatan
                  </span>
                </div>
                <div className="mt-0.5 flex items-end gap-2">
                  <span className="text-sm sm:text-base font-black text-white leading-none">
                    Rp {Number(todayStats.revenue || 0).toLocaleString('id-ID')}
                  </span>
                  <span className="hidden md:inline text-[10px] text-emerald-200/60 leading-none">
                    {todayStats.total_trx} transaksi
                  </span>
                </div>
              </div>

              {/* Mobile cart */}
              <button onClick={() => setShowMobileCart(true)}
                data-tour="pos-mobile-cart-button"
                className="relative lg:hidden p-2 text-slate-400 hover:text-white
                  bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-all shrink-0">
                <CartIcon />
                <CartBadge count={itemCount} />
              </button>
            </header>

            {/* ── ADMIN MOBILE: source selector ── */}
            {isAdmin && stockUsersList.length > 0 && (
              <div
                className="sm:hidden px-4 py-2 bg-slate-900 border-b border-slate-800
                flex gap-2 overflow-x-auto scrollbar-hide items-center"
                data-tour="pos-mobile-source-selector"
              >
                <span className="text-slate-500 text-xs shrink-0">Stok:</span>
                {stockUsersList.map(u => {
                  const isSelected = selectedSourceUser?.user_id === u.user_id;
                  const hasStock   = Number(u.can_make || 0) > 0;
                  return (
                    <button key={u.user_id}
                      onClick={() => {
                        if (selectedSourceUser?.user_id === u.user_id) return;
                        setSelectedSourceUser({
                          user_id: u.user_id,
                          user_name: u.user_name,
                          role: u.role,
                          can_make: u.can_make,
                        });
                        clearCart();
                      }}
                      className={`shrink-0 flex flex-col gap-0.5 px-2.5 py-1.5
                        rounded-xl text-xs font-semibold transition-all ${
                        isSelected
                          ? 'bg-orange-500 text-white'
                          : hasStock
                            ? 'bg-slate-700 text-slate-300 border border-slate-600'
                            : 'bg-slate-800/60 text-slate-600 border border-slate-700/40'
                      }`}>
                      <span className="text-xs">{u.user_name}</span>
                      <span className="text-[10px] opacity-70">{u.can_make} porsi</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* ── MOBILE SEARCH ── */}
            <div className="sm:hidden px-4 py-2.5 bg-slate-900 border-b border-slate-800" data-tour="pos-mobile-search">
              <div className="relative flex items-center">
                <span className="absolute left-3 text-slate-500 pointer-events-none">
                  <SearchIcon />
                </span>
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Cari menu..."
                  className="w-full bg-slate-800 border border-slate-700 text-white text-sm
                    rounded-xl pl-9 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-orange-500/50
                    placeholder:text-slate-500" />
              </div>
            </div>

            {/* ── CATEGORY FILTER ── */}
            <div
              className="flex gap-2 px-4 sm:px-5 py-3 overflow-x-auto scrollbar-hide
              bg-slate-900/50 border-b border-slate-800/50 shrink-0"
              data-tour="pos-category-filter"
            >
              <button onClick={() => setActiveCategory('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap
                  shrink-0 transition-all ${
                  activeCategory === 'all'
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                    : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
                }`}>
                Semua
              </button>
              {categories.map(cat => (
                <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap
                    shrink-0 transition-all ${
                    activeCategory === cat.id
                      ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                      : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
                  }`}>
                  {cat.name}
                </button>
              ))}
            </div>



            {/* ── PRODUCT GRID ── */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4" data-tour="pos-product-section">
              {!loading && (
                <div className="mb-3 flex flex-wrap items-center gap-2 text-xs" data-tour="pos-product-count">
                <p className="text-slate-600">
                  {filtered.length} menu tersedia
                  {search && ` · "${search}"`}
                  {/* ✅ CHANGED: Tampilkan pengajuan dari kasir bukan stok */}
                  {isAdmin && selectedSourceUser && (
                    <span className="text-orange-400/70">
                      {' '}· pengajuan dari {selectedSourceUser.user_name}
                    </span>
                  )}
                </p>
                {refreshing && (
                  <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-slate-400">
                    Sinkronisasi...
                  </span>
                )}
                </div>
              )}

              {!loading && bundleHints.length > 0 && (
                <div className="mb-4 grid gap-3 md:grid-cols-2" data-tour="pos-bundle-hints">
                  {bundleHints.map((program) => {
                    const disabled = !program.complete && program.unavailable.length > 0;
                    return (
                      <button
                        key={program.id}
                        type="button"
                        data-tour="pos-bundle-card"
                        onClick={() => !disabled && !program.complete && handleAddBundle(program)}
                        disabled={disabled}
                        className={`rounded-2xl border p-4 text-left transition ${
                          program.complete
                            ? 'cursor-default border-emerald-400/35 bg-emerald-500/10 text-emerald-100'
                            : disabled
                              ? 'cursor-not-allowed border-slate-700 bg-slate-800/50 text-slate-500'
                              : 'border-orange-400/35 bg-orange-500/10 text-orange-100 hover:border-orange-400/70'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-300">Paket Bundle</p>
                            <h3 className="mt-1 line-clamp-2 text-sm font-black text-white">{program.name}</h3>
                          </div>
                          <span className="shrink-0 rounded-full bg-slate-950/60 px-2.5 py-1 text-xs font-black">
                            {program.discountText}
                          </span>
                        </div>
                        <p className="mt-2 text-xs leading-5 text-slate-300">
                          {program.complete
                            ? 'Syarat paket sudah lengkap, diskon akan otomatis dicek saat pembayaran.'
                            : disabled
                              ? `Belum bisa diklaim karena ${program.unavailable.map((item) => item.name).join(', ')} sedang habis.`
                              : `Tambah ${program.missingProducts.map((item) => `${item.name} x${Math.max(1, Number(item.required_qty || 1) - Number(item.current_qty || 0))}`).join(', ')} untuk klaim diskon paket.`}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="grid auto-rows-fr grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4" data-tour="pos-product-grid">
                {loading
                  ? [...Array(8)].map((_, i) => <ProductSkeleton key={i} />)
                  : filtered.length === 0
                    ? (
                      <div className="col-span-full flex flex-col items-center justify-center py-16">
                        <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center text-3xl mb-4">🔍</div>
                        <p className="text-slate-400 font-medium">Menu tidak ditemukan</p>
                      </div>
                    )
                    : filtered.map(product => {
                      const stock    = getProductStock(product);
                      const inCart   = items.find(i => i.id === product.id);
                      const soldOut  = stock === 0;
                      const lowStock = stock > 0 && stock <= 3;
                      const selectedUserStock = isAdmin && selectedSourceUser
                        ? product.stock_by_user?.find(
                            (u) => u.user_id === selectedSourceUser.user_id
                          )
                        : null;

                      return (
                        <div key={product.id} data-tour="pos-product-card" data-soldout={soldOut ? 'true' : 'false'} className="h-full">
                          <ProductCard
                            product={product}
                            inCart={inCart}
                            stock={stock}
                            soldOut={soldOut}
                            lowStock={lowStock}
                            isAdmin={isAdmin}
                            selectedSourceUser={selectedSourceUser}
                            selectedUserStock={selectedUserStock}
                            onAddItem={handleAddItem}
                          />
                        </div>
                      );
                    })
                }
              </div>
              <div className="h-4 lg:hidden" />
            </div>

            {/* ── MOBILE BOTTOM BAR ── */}
            {itemCount > 0 && (
              <div className="lg:hidden shrink-0 bg-slate-900 border-t border-slate-800 px-4 py-3" data-tour="pos-mobile-bottom-cart">
                <button onClick={() => setShowMobileCart(true)}
                  className="w-full bg-orange-500 hover:bg-orange-400 text-white font-bold
                    rounded-2xl px-4 py-3.5 flex items-center justify-between
                    shadow-xl shadow-orange-500/30 transition-all">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-white/20 rounded-xl flex items-center justify-center text-sm font-black">
                      {itemCount}
                    </div>
                    <span className="text-sm">Lihat Pesanan</span>
                  </div>
                  <span className="font-black">Rp {total.toLocaleString('id-ID')}</span>
                </button>
              </div>
            )}
          </div>

          {/* ── DESKTOP CART ── */}
          <div className="hidden lg:flex" data-tour="pos-desktop-cart">
            <Cart onCheckout={openPaymentModal} />
          </div>

          {/* ── MOBILE CART DRAWER ── */}
          {showMobileCart && (
            <>
              <div className="fixed inset-0 bg-black/70 z-40 lg:hidden backdrop-blur-sm"
                onClick={() => setShowMobileCart(false)} />
              <div
                className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-slate-900
                rounded-t-3xl border-t border-slate-700 max-h-[85vh] flex flex-col animate-slide-up"
                data-tour="pos-mobile-cart-drawer"
              >
                <div className="flex justify-center pt-3 pb-1 shrink-0">
                  <div className="w-10 h-1 bg-slate-700 rounded-full" />
                </div>
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 shrink-0">
                  <h3 className="text-white font-bold text-base">Pesanan</h3>
                  <button onClick={() => setShowMobileCart(false)}
                    className="p-2 text-slate-500 hover:text-white rounded-xl hover:bg-slate-800 transition-colors">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
                <div className="flex-1 overflow-hidden">
                  <Cart onCheckout={() => { setShowMobileCart(false); openPaymentModal(); }} mobile />
                </div>
              </div>
            </>
          )}

              {showPayment && (
              <PaymentModal
                total={total}
                itemCount={itemCount}
                onPay={handlePayment}
                onClose={handleCancelPayment}
                processing={paymentProcessing}
                tables={diningTables}
                selectedTableId={selectedTableId}
                onSelectTable={setSelectedTableId}
                items={items}
                bundleHints={bundleHints}
              />
          )}

          <SuccessModal
            isOpen={feedbackModal.isOpen}
            requestType={feedbackModal.type}
            title={feedbackModal.title}
            message={feedbackModal.message}
            onClose={() => setFeedbackModal(prev => ({ ...prev, isOpen: false }))}
          />

          <div className="hidden">
            <Receipt ref={receiptRef} transaction={lastTransaction} />
          </div>
        </div>

        <style>{`
          .scrollbar-hide::-webkit-scrollbar { display: none; }
          .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
          .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          @keyframes slide-up {
            from { transform: translateY(100%); }
            to   { transform: translateY(0); }
          }
          .animate-slide-up { animation: slide-up 0.3s cubic-bezier(0.32,0.72,0,1); }
        `}</style>
      </AdminLayout>
    </AuthGuard>
  );
}
