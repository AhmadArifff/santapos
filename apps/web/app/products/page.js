'use client';
import { useCallback, useEffect, useState, useRef } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { getProducts, getCategories, deleteProduct, getStockItems } from '@/lib/api';
import api from '@/lib/axios';
import { resolveAssetUrl } from '@/lib/assetUrl';
import { IMAGE_EXTENSIONS, acceptFromExtensions, getFileValidationError } from '@/lib/fileValidation';
import { showConfirm } from '@/lib/modalDialog';
import { CardSkeleton } from '@/components/ui/SectionSkeleton';
// Di app/pos/page.js atau wherever kasir lihat produk
import { getMyStockProducts } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { getStockByKasir } from '@/lib/api';

const emptyForm = { name: '', price: '', category_id: '', image_url: '', ingredients: [] };

function ProductsTutorialDemo() {
  const demoProducts = [
    {
      name: 'Adana Kebab Platter',
      price: 89000,
      category_name: 'Kebab & Shawarma',
      stock: 12,
      image_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&q=80',
      ingredients: ['Daging Cincang Bumbu x160 gram', 'Nasi Bulgur x180 gram', 'Saus Pedas Sultan x25 ml'],
    },
    {
      name: 'Arabic Qahwa Coffee',
      price: 35000,
      category_name: 'Minuman',
      stock: 7,
      image_url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&q=80',
      ingredients: ['Cup Minuman x1 pcs', 'Kopi Arabica x22 gram', 'Rempah Timur Tengah x2 gram'],
    },
  ];
  return (
    <div className="products-tutorial-demo space-y-4">
      <div className="rounded-3xl border border-orange-400/35 bg-orange-500/5 p-4">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-300">Mode Demo Tutorial</p>
        <p className="mt-1 text-sm leading-6 text-slate-300">Produk ini contoh dummy untuk tutorial. Tidak masuk database kecuali user klik Simpan pada form produk asli.</p>
      </div>
      <div data-tour="product-grid" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {demoProducts.map((product, index) => (
          <div key={product.name} data-tour={index === 0 ? 'product-card' : undefined} className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-800">
            <div data-tour={index === 0 ? 'product-card-image' : undefined} className="h-32 bg-slate-700">
              <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
            </div>
            <div data-tour={index === 0 ? 'product-card-info' : undefined} className="p-3">
              <p className="truncate text-sm font-semibold text-white">{product.name}</p>
              <p className="mt-0.5 text-sm font-bold text-orange-400">Rp {product.price.toLocaleString('id-ID')}</p>
              <p className="mt-1 text-xs text-slate-400">{product.category_name}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {product.ingredients.map((ingredient) => (
                  <span key={ingredient} className="rounded-lg bg-slate-700 px-2 py-0.5 text-xs text-slate-300">{ingredient}</span>
                ))}
              </div>
              <div data-tour={index === 0 ? 'product-card-stock' : undefined} className="mt-2 text-xs font-bold text-green-400">Bisa buat: {product.stock}</div>
              <div data-tour={index === 0 ? 'product-card-actions' : undefined} className="mt-3 flex gap-2">
                <button type="button" className="flex-1 rounded-lg bg-slate-700 py-1.5 text-xs font-medium text-blue-400">Edit</button>
                <button type="button" className="flex-1 rounded-lg bg-slate-700 py-1.5 text-xs font-medium text-red-400">Hapus</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const [products, setProducts]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [stockItems, setStockItems] = useState([]);
  const [modal, setModal]           = useState(false);
  const [form, setForm]             = useState(emptyForm);
  const [editing, setEditing]       = useState(null);
  const [imageFile, setImageFile]   = useState(null);
  const [imagePreview, setPreview]  = useState(null);
  const [imageError, setImageError] = useState(null);
  const [search, setSearch]         = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [loading, setLoading]       = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fileRef = useRef();
  const productsRef = useRef([]);
  const { user } = useAuthStore();

  // Tambah state baru
  const [stockByKasir, setStockByKasir]   = useState({});
  const [expandedCards, setExpandedCards] = useState({});
  const toggleKasir = (id) =>
  setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));

  const load = useCallback(async ({ silent = false } = {}) => {
    const fetchFn = user?.role === 'kasir' ? getMyStockProducts : getProducts;
    const shouldRefreshSilently = silent || productsRef.current.length > 0;
    if (shouldRefreshSilently) setRefreshing(true);
    else setPageLoading(true);

    try {
      const [productRes, kasirStockRes] = await Promise.all([
        fetchFn(),
        user?.role !== 'kasir'
          ? getStockByKasir().catch(() => ({ data: {} }))
          : Promise.resolve({ data: {} }),
      ]);
      const nextProducts = Array.isArray(productRes.data) ? productRes.data : [];
      productsRef.current = nextProducts;
      setProducts(nextProducts);
      setStockByKasir(kasirStockRes.data || {});
    } finally {
      setPageLoading(false);
      setRefreshing(false);
    }
  }, [user?.role]);

  useEffect(() => {
    getCategories().then(r => setCategories(r.data));
    getStockItems().then(r => setStockItems(r.data));
    // Tambahkan ini — hanya untuk admin
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openAdd = () => {
    setForm({ ...emptyForm, ingredients: [] }); setEditing(null);
    setImageFile(null); setPreview(null);
    setImageError(null);
    if (fileRef.current) fileRef.current.value = '';
    setModal(true);
  };

  const openEdit = (p) => {
    setForm({
      name: p.name, price: p.price,
      category_id: p.category_id || '',
      image_url: p.image_url || '',
      ingredients: p.ingredients || [],
    });
    setEditing(p.id);
    setPreview(p.image_url ? resolveAssetUrl(p.image_url) : null);
    setImageFile(null);
    setImageError(null);
    if (fileRef.current) fileRef.current.value = '';
    setModal(true);
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const validationError = getFileValidationError(file, {
      allowedExtensions: IMAGE_EXTENSIONS,
      label: 'gambar produk',
      maxSizeMB: 10,
    });
    if (validationError) {
      setImageError(validationError);
      e.target.value = '';
      return;
    }
    setImageError(null);
    setImageFile(file);
    setForm(f => ({ ...f, image_url: '' }));
    setPreview(URL.createObjectURL(file));
  };

  const handleImageUrl = (value) => {
    setForm(f => ({ ...f, image_url: value }));
    setImageFile(null);
    setImageError(null);
    if (fileRef.current) fileRef.current.value = '';
    setPreview(value.trim() ? resolveAssetUrl(value.trim()) : null);
  };

  const clearImage = () => {
    setImageFile(null);
    setPreview(null);
    setImageError(null);
    setForm(f => ({ ...f, image_url: '' }));
    if (fileRef.current) fileRef.current.value = '';
  };

  const addIngredient = () => {
    setForm(f => ({ ...f, ingredients: [...f.ingredients, { stock_item_id: '', qty: 1 }] }));
  };

  const updateIngredient = (idx, key, val) => {
    setForm(f => ({
      ...f,
      ingredients: f.ingredients.map((ing, i) => i === idx ? { ...ing, [key]: val } : ing)
    }));
  };

  const removeIngredient = (idx) => {
    setForm(f => ({ ...f, ingredients: f.ingredients.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('price', form.price);
      fd.append('category_id', form.category_id);
      fd.append('image_url', imageFile ? '' : (form.image_url || '').trim());
      fd.append('ingredients', JSON.stringify(form.ingredients.filter(i => i.stock_item_id)));
      if (imageFile) fd.append('image', imageFile);

      if (editing) await api.put(`/products/${editing}`, fd);
      else         await api.post('/products', fd);

      await load({ silent: true });
      setModal(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menyimpan');
    } finally { setLoading(false); }
  };

  const handleDelete = async (id, name) => {
    const confirmed = await showConfirm(`Hapus produk "${name}"?`, {
      title: 'Hapus Produk',
      confirmText: 'Hapus',
      tone: 'danger',
    });
    if (!confirmed) return;
    try { await deleteProduct(id); await load({ silent: true }); }
    catch (err) { alert(err.response?.data?.message || 'Gagal menghapus'); }
  };

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === 'all' || String(p.category_id || '') === String(categoryFilter);
    return matchSearch && matchCategory;
  });
  const getAdminCanMake = (product) => {
    const perKasir = stockByKasir?.[product.id];
    if (!Array.isArray(perKasir) || perKasir.length === 0) {
      return Number(product.stock || 0);
    }
    return perKasir.reduce((sum, row) => sum + Number(row.can_make || 0), 0);
  };

  // Hitung HPP (Harga Pokok Produksi) dari ingredients yang dipilih
  // const hitungHPP = (ingredients, stockItems) => {
  //   return ingredients.reduce((total, ing) => {
  //     const item = stockItems.find(s => s.id == ing.stock_item_id);
  //     if (!item) return total;
  //     const ppu = item.stock > 0
  //       ? Number(item.total_price) / item.stock : 0;
  //     return total + (ppu * Number(ing.qty));
  //   }, 0);
  // };

  // GANTI fungsi hitungHPP ini:
  const hitungHPP = (ingredients, stockItems) => {
    return ingredients.reduce((total, ing) => {
      const item = stockItems.find(s => s.id == ing.stock_item_id);
      if (!item || !ing.stock_item_id) return total;

      // ✅ Pakai price_per_unit (moving average dari recalcStockItem)
      // bukan total_price/stock yang tidak akurat
      const ppu = Number(item.price_per_unit || 0);
      const qty = parseFloat(ing.qty) || 0;
      return total + (ppu * qty);
    }, 0);
  };

  const hpp = hitungHPP(form.ingredients, stockItems);
  const hargaValid = !form.price || Number(form.price) >= hpp;

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div data-tour="product-header" className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-white text-2xl font-bold">Produk</h1>
            <p className="text-slate-400 text-sm mt-1">{products.length} produk terdaftar</p>
          </div>
          <div data-tour="product-actions" className="flex flex-wrap items-center gap-2">
            {refreshing && (
              <span className="rounded-full border border-sky-500/25 bg-sky-500/10 px-3 py-1.5 text-xs font-bold text-sky-200">
                Sinkronisasi produk...
              </span>
            )}
            <button onClick={openAdd} data-tour="product-add-action" data-tour-action="product-open-form"
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-5 py-2.5 rounded-xl transition-colors">
              + Tambah Produk
            </button>
          </div>
        </div>

        <div data-tour="product-filters" className="grid gap-3 md:grid-cols-[1fr_240px]">
          <input data-tour="product-search" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Cari produk..."
            className="w-full bg-slate-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500 border border-slate-700"/>
          <select
            data-tour="product-category-filter"
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="w-full bg-slate-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500 border border-slate-700"
          >
            <option value="all">Semua kategori</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Grid Produk */}
        {pageLoading && products.length === 0 ? (
          <CardSkeleton count={8} />
        ) : (
          <div data-tour="product-grid" className="product-real-grid grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(p => (
            <div key={p.id} data-tour="product-card" className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
              {/* Gambar */}
              <div data-tour="product-card-image" className="w-full h-32 bg-slate-700 flex items-center justify-center overflow-hidden">
                {p.image_url
                  ? <img src={resolveAssetUrl(p.image_url)} alt={p.name}
                      className="w-full h-full object-cover"/>
                  : <span className="text-4xl">🌯</span>
                }
              </div>
              <div data-tour="product-card-info" className="p-3">
                <p className="text-white font-semibold text-sm truncate">{p.name}</p>
                <p className="text-orange-400 font-bold text-sm mt-0.5">
                  Rp {Number(p.price).toLocaleString('id-ID')}
                </p>
                <p className="text-slate-400 text-xs mt-1">{p.category_name || '-'}</p>

                {/* Ingredients badge */}
                {p.ingredients?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {p.ingredients.slice(0, 3).map((ing, i) => (
                      <span key={i} className="bg-slate-700 text-slate-300 text-xs px-2 py-0.5 rounded-lg">
                        {ing.ingredient_name} ×{ing.qty}
                      </span>
                    ))}
                    {p.ingredients.length > 3 && (
                      <span className="text-slate-500 text-xs">+{p.ingredients.length - 3}</span>
                    )}
                  </div>
                )}

                {/* Stok estimasi */}
                {/* <div className="mt-2 flex items-center justify-between">
                  <span className={`text-xs font-bold ${
                    p.stock === 0 ? 'text-red-400' : p.stock <= 5 ? 'text-yellow-400' : 'text-green-400'
                  }`}>
                    {p.stock === 0 ? '⚠ Habis' : `Bisa buat: ${p.stock}`}
                  </span>
                </div> */}
                {/* Di card produk, ganti bagian stok */}
                <div data-tour="product-card-stock" className="mt-2">
                  {user?.role === 'kasir' ? (
                    <div className="flex flex-col gap-0.5">
                      <span className={`text-xs font-bold ${
                        p.stock === 0 ? 'text-red-400' :
                        p.stock <= 3  ? 'text-yellow-400' : 'text-green-400'
                      }`}>
                        {p.stock === 0 ? '⚠ Stok habis' : `Stok kamu: ${p.stock}`}
                      </span>
                      {p.stock === 0 && (
                        <span className="text-slate-600 text-xs">Ajukan stok ke admin</span>
                      )}
                    </div>
                  ) : (
                    <div>
                      {/* Total bisa buat dari akumulasi per kasir + tombol expand */}
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold ${
                          getAdminCanMake(p) === 0 ? 'text-red-400' :
                          getAdminCanMake(p) <= 5  ? 'text-yellow-400' : 'text-green-400'
                        }`}>
                          {getAdminCanMake(p) === 0 ? '⚠ Habis' : `Bisa buat: ${getAdminCanMake(p)}`}
                        </span>

                        {stockByKasir[p.id]?.length > 0 && (
                          <button
                            onClick={() => toggleKasir(p.id)}
                            className="text-slate-500 hover:text-orange-400 text-[10px] border border-slate-700 hover:border-orange-500 rounded-md px-1.5 py-0.5 transition-colors flex items-center gap-1"
                          >
                            <span className={`inline-block transition-transform duration-150 ${
                              expandedCards[p.id] ? 'rotate-90' : ''
                            }`}>▶</span>
                            per kasir
                          </button>
                        )}
                      </div>

                      {/* Breakdown stok per kasir */}
                      {expandedCards[p.id] && (
                        <div className="mt-1.5 rounded-lg border border-slate-700 overflow-hidden">
                          {stockByKasir[p.id].map(k => (
                            <div key={k.kasir_id}
                              className="flex justify-between items-center px-2 py-1
                                        border-b border-slate-800 last:border-b-0
                                        bg-slate-900 text-xs">
                              <span className="text-slate-400 truncate">{k.kasir_name}</span>
                              <span className={`font-bold ml-2 shrink-0 ${
                                k.can_make === 0 ? 'text-red-400' :
                                k.can_make <= 3  ? 'text-yellow-400' : 'text-green-400'
                              }`}>
                                {k.can_make === 0 ? '—' : k.can_make}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div data-tour="product-card-actions" className="flex gap-2 mt-3">
                  <button onClick={() => openEdit(p)}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-blue-400 text-xs font-medium py-1.5 rounded-lg transition-colors">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(p.id, p.name)}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-red-400 text-xs font-medium py-1.5 rounded-lg transition-colors">
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          ))}
          </div>
        )}
      </div>

      {/* Modal Tambah/Edit Produk */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-hidden bg-black/60 p-4">
          <div data-tour="product-modal" className="my-auto max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-700 bg-slate-800 p-6 shadow-2xl shadow-black/40">
            <h2 className="mb-5 text-xl font-bold text-white">
              {editing ? 'Edit Produk' : 'Tambah Produk'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Upload Gambar */}
              <div data-tour="product-image-field" className="rounded-2xl border border-slate-700 bg-slate-900/45 p-3">
                <label className="text-slate-300 text-sm font-semibold">Gambar Produk</label>
                <div className="mt-3 grid gap-3 sm:grid-cols-[160px_1fr]">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="h-36 w-full overflow-hidden rounded-xl border-2 border-dashed border-slate-600 bg-slate-800 transition-colors hover:border-orange-500 sm:h-32"
                  >
                  {imagePreview
                    ? <img src={imagePreview} alt="preview produk" className="h-full w-full object-cover"/>
                    : <div className="text-center">
                        <div className="text-3xl mb-1">📷</div>
                        <p className="text-slate-400 text-sm">Preview gambar</p>
                        <p className="text-slate-500 text-xs">Upload atau URL online</p>
                      </div>
                  }
                  </button>
                  <div className="space-y-2">
                    <div data-tour="product-image-url-field">
                      <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                        URL asset online / embed
                      </label>
                      <input
                        value={form.image_url || ''}
                        onChange={e => handleImageUrl(e.target.value)}
                        placeholder="https://images.unsplash.com/... atau /images/products/..."
                        className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <p className="text-xs leading-5 text-slate-500">
                      Tempel link gambar online agar hasilnya sama seperti preview landing page.
                      Jika upload file, URL online akan dikosongkan.
                    </p>
                    {imageError && (
                      <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200">
                        {imageError}
                      </p>
                    )}
                    {imageFile && (
                      <p className="rounded-lg bg-orange-500/10 px-3 py-2 text-xs font-semibold text-orange-200">
                        File dipilih: {imageFile.name}
                      </p>
                    )}
                    <div data-tour="product-image-actions" className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="rounded-lg border border-orange-500/35 px-3 py-2 text-xs font-bold text-orange-300 transition-colors hover:bg-orange-500/10"
                      >
                        Upload File
                      </button>
                      {(imagePreview || imageFile || form.image_url) && (
                        <button
                          type="button"
                          onClick={clearImage}
                          className="rounded-lg border border-red-500/30 px-3 py-2 text-xs font-bold text-red-300 transition-colors hover:bg-red-500/10"
                        >
                          Hapus Gambar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <input ref={fileRef} type="file" accept={acceptFromExtensions(IMAGE_EXTENSIONS)}
                  onChange={handleImage} className="hidden"/>
              </div>

              {/* Nama & Harga */}
              <div data-tour="product-basic-fields" className="grid grid-cols-2 gap-3">
                <div data-tour="product-name-field">
                  <label className="text-slate-400 text-sm">Nama Produk</label>
                  <input value={form.name}
                    onChange={e => setForm({...form, name: e.target.value})}
                    required placeholder="Kebab Original"
                    className="w-full mt-1 bg-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div data-tour="product-price-field">
                  <label className="text-slate-400 text-sm">Harga (Rp)</label>
                  <input type="number" value={form.price}
                    onChange={e => setForm({...form, price: e.target.value})}
                    required placeholder="15000"
                    className="w-full mt-1 bg-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
              </div>

              {/* Kategori */}
              <div data-tour="product-category-field">
                <label className="text-slate-400 text-sm">Kategori</label>
                <select value={form.category_id}
                  onChange={e => setForm({...form, category_id: e.target.value})}
                  className="w-full mt-1 bg-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500">
                  <option value="">-- Pilih Kategori --</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Ingredients / Resep */}
              <div data-tour="product-recipe-section" className="rounded-2xl border border-slate-700/70 bg-slate-900/35 p-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-slate-400 text-sm">Bahan Baku (Resep)</label>
                  <button type="button" onClick={addIngredient} data-tour="product-add-ingredient" data-tour-action="product-add-ingredient"
                    className="text-orange-400 hover:text-orange-300 text-sm transition-colors">
                    + Tambah Bahan
                  </button>
                </div>
                <div className="max-h-48 space-y-2 overflow-y-auto pr-1 sm:max-h-56">
                  {form.ingredients.map((ing, idx) => {
                    // Cari item yang dipilih untuk ambil satuannya
                    const selectedStock = stockItems.find(s => s.id == ing.stock_item_id);

                    return (
                      <div key={idx} data-tour="product-ingredient-row" className="flex gap-2 items-center">

                        {/* Pilih bahan */}
                        <select
                          data-tour="product-ingredient-select"
                          value={ing.stock_item_id}
                          onChange={e => updateIngredient(idx, 'stock_item_id', e.target.value)}
                          className="flex-1 bg-slate-700 text-white rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          <option value="">-- Pilih Bahan --</option>
                          {stockItems.map(s => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.unit})
                            </option>
                          ))}
                        </select>

                        {/* Input qty — pakai desimal step 0.01 */}
                        <input
                          data-tour="product-ingredient-qty"
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={ing.qty}
                          onChange={e => updateIngredient(idx, 'qty', e.target.value)}
                          className="w-20 bg-slate-700 text-white rounded-xl px-3 py-2 text-sm text-center outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="1"
                        />

                        {/* Satuan dari stock item — bukan hardcode pcs */}
                        <span className="text-slate-400 text-xs w-10 shrink-0 text-left">
                          {selectedStock ? selectedStock.unit : '—'}
                        </span>

                        {/* Tombol hapus */}
                        <button
                          type="button"
                          onClick={() => removeIngredient(idx)}
                          className="text-red-400 hover:text-red-300 text-lg leading-none transition-colors shrink-0"
                        >×</button>
                      </div>
                    );
                  })}
                  {/* {form.ingredients.length === 0 && (
                    <p className="text-slate-500 text-xs text-center py-3 bg-slate-700/50 rounded-xl">
                      Belum ada bahan — klik "+ Tambah Bahan" untuk menambahkan resep
                    </p>
                  )} */}
                </div>
                  {/* Preview HPP & Validasi Harga */}
                  {form.ingredients.length > 0 && (
                    <div data-tour="product-hpp-preview" className={`mt-3 rounded-xl p-4 border ${
                      hargaValid
                        ? 'bg-blue-500/10 border-blue-500/30'
                        : 'bg-red-500/10 border-red-500/30'
                    }`}>
                      <p className="text-slate-300 text-sm font-semibold mb-2">
                        Estimasi Biaya Produksi (HPP)
                      </p>

                      {/* Rincian per bahan */}
                      <div className="mb-3 max-h-32 space-y-1 overflow-y-auto pr-1">
                        {form.ingredients.map((ing, idx) => {
                          const item = stockItems.find(s => s.id == ing.stock_item_id);
                          if (!item || !ing.stock_item_id) return null;
                          // const ppu      = item.stock > 0 ? Number(item.total_price) / item.stock : 0;
                          const ppu = Number(item.price_per_unit || 0);
                          const subtotal = ppu * Number(ing.qty);
                          return (
                            <div key={idx} className="flex justify-between gap-3 text-xs text-slate-400">
                              <span className="min-w-0 truncate">{item.name} × {ing.qty} {item.unit}</span>
                              <span className="shrink-0">Rp {Math.round(subtotal).toLocaleString('id-ID')}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Total HPP */}
                      <div className="flex justify-between items-center border-t border-slate-600 pt-2">
                        <span className="text-sm text-slate-300 font-semibold">Total HPP</span>
                        <span className="text-blue-400 font-bold">
                          Rp {Math.round(hpp).toLocaleString('id-ID')}
                        </span>
                      </div>

                      {/* Margin kalau harga sudah diisi */}
                      {form.price && Number(form.price) > 0 && (
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-xs text-slate-400">Margin keuntungan</span>
                          <span className={`text-xs font-bold ${
                            Number(form.price) >= hpp ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {Number(form.price) >= hpp
                              ? `+Rp ${Math.round(Number(form.price) - hpp).toLocaleString('id-ID')} (${Math.round(((Number(form.price) - hpp) / hpp) * 100)}%)`
                              : `⚠ Rugi Rp ${Math.round(hpp - Number(form.price)).toLocaleString('id-ID')}`
                            }
                          </span>
                        </div>
                      )}

                      {/* Warning kalau harga kurang dari HPP */}
                      {!hargaValid && form.price && (
                        <div className="mt-2 text-red-400 text-xs font-semibold">
                          ⚠ Harga jual tidak boleh kurang dari HPP (Rp {Math.round(hpp).toLocaleString('id-ID')})
                        </div>
                      )}
                    </div>
                  )}
              </div>

              <div data-tour="product-form-actions" className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(false)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white rounded-xl py-3 transition-colors">
                  Batal
                </button>
                {/* <button type="submit" disabled={loading}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold rounded-xl py-3 transition-colors">
                  {loading ? 'Menyimpan...' : 'Simpan'}
                </button> */}
                <button
                  data-tour="product-save-button"
                  type="submit"
                  disabled={loading || !hargaValid}
                  title={!hargaValid ? `Harga minimal Rp ${Math.round(hpp).toLocaleString('id-ID')}` : ''}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl py-3 transition-colors"
                >
                  {loading ? 'Menyimpan...' : !hargaValid ? `Min. Rp ${Math.round(hpp).toLocaleString('id-ID')}` : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
