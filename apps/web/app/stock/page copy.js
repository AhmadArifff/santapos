'use client';
import { useEffect, useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { showConfirm } from '@/lib/modalDialog';
import {
  getStockItems, createStockItem, updateStockItem,
  deleteStockItem, stockItemIn, getStockHistory, getStockUnits
} from '@/lib/api';

const emptyForm  = { name: '', unit: 'Pcs', stock: 0, min_stock: 5, total_price: 0 };
const emptyInForm = { stock_item_id: '', qty: '', reference: '', total_price_added: 0 };

// Kelompok satuan untuk display
const UNIT_GROUPS = [
  { label: 'Bahan Utama',    units: ['Lembar','Pak','Kilogram','Gram','Butir','Buah','Ikat','Kiloan','Kaleng'] },
  { label: 'Saus & Bumbu',   units: ['Liter','Botol','Pouch','Sachet','Blok'] },
  { label: 'Packaging',      units: ['Pcs','Lusin'] },
];

export default function StockPage() {
  const [items, setItems]     = useState([]);
  const [history, setHistory] = useState([]);
  const [tab, setTab]         = useState('stock');
  const [modal, setModal]     = useState(null);
  const [form, setForm]       = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [inForm, setInForm]   = useState(emptyInForm);
  const [loading, setLoading] = useState(false);

  const load = () => {
    getStockItems().then(r => setItems(r.data));
    getStockHistory().then(r => setHistory(r.data));
  };
  useEffect(() => { load(); }, []);

  // Hitung price_per_unit preview
  const previewPPU = (f = form) => {
    const s = Number(f.stock);
    const t = Number(f.total_price);
    return s > 0 ? Math.round(t / s) : 0;
  };

  const openEdit = (item) => {
    setForm({
      name:        item.name,
      unit:        item.unit,
      stock:       item.stock,
      min_stock:   item.min_stock,
      total_price: item.total_price || 0,  // ← tambahkan ini
    });
    setEditing(item.id);
    setModal('edit');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editing) await updateStockItem(editing, form);
      else         await createStockItem(form);
      load(); setModal(null); setEditing(null); setForm(emptyForm);
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menyimpan');
    } finally { setLoading(false); }
  };

  const handleIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await stockItemIn(inForm);
      load(); setModal(null); setInForm(emptyInForm);
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal');
    } finally { setLoading(false); }
  };

  const handleDelete = async (id, name) => {
    const confirmed = await showConfirm(`Hapus bahan "${name}"?`, {
      title: 'Hapus Bahan Baku',
      confirmText: 'Hapus',
      tone: 'danger',
    });
    if (!confirmed) return;
    try { await deleteStockItem(id); load(); }
    catch (err) { alert(err.response?.data?.message || 'Gagal'); }
  };

  // Kalkulasi stok masuk
  const selectedItem    = items.find(i => i.id == inForm.stock_item_id);
  const newQty          = (selectedItem?.stock || 0) + Number(inForm.qty || 0);
  const newTotal        = Number(selectedItem?.total_price || 0) + Number(inForm.total_price_added || 0);
  const newPPU          = newQty > 0 ? Math.round(newTotal / newQty) : 0;

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white text-2xl font-bold">Bahan Baku</h1>
            <p className="text-slate-400 text-sm mt-1">Kelola stok & harga bahan baku</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setModal('in')}
              className="bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-colors">
              + Stok Masuk
            </button>
            <button onClick={() => { setForm(emptyForm); setEditing(null); setModal('add'); }}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-colors">
              + Bahan Baru
            </button>
          </div>
        </div>

        {/* Tab */}
        <div className="flex gap-2">
          {[['stock','📦 Stok Bahan Baku'],['history','📋 Riwayat']].map(([t,l]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-xl text-sm font-medium transition-colors ${
                tab === t ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
              }`}>{l}</button>
          ))}
        </div>

        {/* Tabel Stok */}
        {tab === 'stock' && (
          <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left text-slate-400 font-medium px-4 py-3">Bahan Baku</th>
                  <th className="text-left text-slate-400 font-medium px-4 py-3">Satuan</th>
                  <th className="text-right text-slate-400 font-medium px-4 py-3">Stok</th>
                  <th className="text-right text-slate-400 font-medium px-4 py-3">Total Harga</th>
                  <th className="text-right text-slate-400 font-medium px-4 py-3">Harga/Satuan</th>
                  <th className="text-right text-slate-400 font-medium px-4 py-3">Status</th>
                  <th className="text-right text-slate-400 font-medium px-4 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => {
                  const ppu = item.stock > 0
                    ? Math.round(Number(item.total_price) / item.stock) : 0;
                  return (
                    <tr key={item.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-3 text-white font-medium">{item.name}</td>
                      <td className="px-4 py-3 text-slate-400">{item.unit}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-base font-bold ${
                          item.stock === 0            ? 'text-red-400' :
                          item.stock <= item.min_stock ? 'text-yellow-400' : 'text-green-400'
                        }`}>{item.stock}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-300 text-xs">
                        Rp {Number(item.total_price).toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3 text-right text-orange-400 font-semibold text-xs">
                        Rp {ppu.toLocaleString('id-ID')}/{item.unit}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                          item.stock === 0             ? 'bg-red-500/20 text-red-400' :
                          item.stock <= item.min_stock  ? 'bg-yellow-500/10 text-yellow-400' :
                                                          'bg-green-500/10 text-green-400'
                        }`}>
                          {item.stock === 0 ? 'Habis' : item.stock <= item.min_stock ? 'Menipis' : 'Aman'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-3">
                        <button onClick={() => openEdit(item)} className="text-blue-400 hover:text-blue-300 text-sm transition-colors">Edit</button>
                        <button onClick={() => handleDelete(item.id, item.name)} className="text-red-400 hover:text-red-300 text-sm transition-colors">Hapus</button>
                      </td>
                    </tr>
                  );
                })}
                {items.length === 0 && (
                  <tr><td colSpan={7} className="text-center text-slate-500 py-10">Belum ada bahan baku</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tabel Riwayat */}
        {tab === 'history' && (
          <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left text-slate-400 font-medium px-4 py-3">Bahan</th>
                  <th className="text-left text-slate-400 font-medium px-4 py-3">Tipe</th>
                  <th className="text-right text-slate-400 font-medium px-4 py-3">Qty</th>
                  <th className="text-right text-slate-400 font-medium px-4 py-3">Harga/Satuan</th>
                  <th className="text-left text-slate-400 font-medium px-4 py-3">Referensi</th>
                  <th className="text-right text-slate-400 font-medium px-4 py-3">Waktu</th>
                </tr>
              </thead>
              <tbody>
                {history.map(h => (
                  <tr key={h.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="px-4 py-3 text-white">{h.item_name}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                        h.type === 'IN' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>{h.type}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-white font-medium">{h.qty} {h.unit}</td>
                    <td className="px-4 py-3 text-right text-orange-400 text-xs">
                      Rp {Number(h.price_per_unit || 0).toLocaleString('id-ID')}/{h.unit}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{h.reference}</td>
                    <td className="px-4 py-3 text-right text-slate-400 text-xs">
                      {new Date(h.created_at).toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
                {history.length === 0 && (
                  <tr><td colSpan={6} className="text-center text-slate-500 py-10">Belum ada riwayat</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Tambah/Edit Bahan */}
      {(modal === 'add' || modal === 'edit') && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-slate-700">
            <h2 className="text-white font-bold text-xl mb-5">
              {modal === 'edit' ? 'Edit Bahan Baku' : 'Tambah Bahan Baku'}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">

              {/* Nama */}
              <div>
                <label className="text-slate-400 text-sm">Nama Bahan</label>
                <input
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                  required placeholder="Beef Patty"
                  className="w-full mt-1 bg-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Satuan */}
              <div>
                <label className="text-slate-400 text-sm">Satuan</label>
                <select
                  value={form.unit}
                  onChange={e => setForm({...form, unit: e.target.value})}
                  className="w-full mt-1 bg-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {UNIT_GROUPS.map(g => (
                    <optgroup key={g.label} label={`── ${g.label} ──`}>
                      {g.units.map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* Stok & Min Stok */}
              <div className="grid grid-cols-2 gap-3">
                {/* Stok awal hanya saat tambah baru */}
                {modal === 'add' && (
                  <div>
                    <label className="text-slate-400 text-sm">Stok Awal</label>
                    <input
                      type="number" min="0"
                      value={form.stock}
                      onChange={e => setForm({...form, stock: e.target.value})}
                      className="w-full mt-1 bg-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                )}
                {/* Saat edit — tampilkan stok sebagai readonly info */}
                {modal === 'edit' && (
                  <div>
                    <label className="text-slate-400 text-sm">Stok Saat Ini</label>
                    <div className="w-full mt-1 bg-slate-700/50 text-slate-300 rounded-xl px-4 py-3 border border-slate-600 text-sm">
                      {form.stock} {form.unit}
                      <span className="text-slate-500 text-xs ml-2">(ubah via Stok Masuk)</span>
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-slate-400 text-sm">Min. Stok</label>
                  <input
                    type="number" min="0"
                    value={form.min_stock}
                    onChange={e => setForm({...form, min_stock: e.target.value})}
                    className="w-full mt-1 bg-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Total Harga — tampil di KEDUA mode (tambah & edit) */}
              <div>
                <label className="text-slate-400 text-sm">
                  Total Harga Beli (Rp)
                </label>
                <input
                  type="number" min="0"
                  value={form.total_price}
                  onChange={e => setForm({...form, total_price: e.target.value})}
                  placeholder="0"
                  className="w-full mt-1 bg-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500"
                />
                <p className="text-slate-500 text-xs mt-1">
                  {modal === 'add'
                    ? 'Contoh: beli 10 Lembar beef = Rp 100.000 → isi 100000'
                    : 'Update total nilai stok yang ada saat ini'
                  }
                </p>
              </div>

              {/* Preview harga per satuan — tampil di KEDUA mode */}
              {Number(form.stock) > 0 && (
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-3">
                  <p className="text-orange-400 text-sm font-semibold">
                    Harga per {form.unit || 'satuan'}:
                    <span className="text-white ml-2">
                      Rp {previewPPU().toLocaleString('id-ID')}
                    </span>
                  </p>
                  <p className="text-slate-400 text-xs mt-0.5">
                    = Rp {Number(form.total_price).toLocaleString('id-ID')} ÷ {form.stock} {form.unit}
                  </p>
                </div>
              )}

              {/* Stok 0 tapi ada total harga — warning */}
              {Number(form.stock) === 0 && Number(form.total_price) > 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3">
                  <p className="text-yellow-400 text-xs">
                    ⚠ Stok 0 — harga per satuan tidak bisa dihitung.
                    Tambah stok terlebih dahulu via tombol &quot;Stok Masuk&quot;.
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setModal(null); setEditing(null); setForm(emptyForm); }}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white rounded-xl py-3 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold rounded-xl py-3 transition-colors"
                >
                  {loading ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Stok Masuk */}
      {modal === 'in' && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-sm border border-slate-700">
            <h2 className="text-white font-bold text-xl mb-5">Stok Masuk</h2>
            <form onSubmit={handleIn} className="space-y-4">

              <div>
                <label className="text-slate-400 text-sm">Bahan Baku</label>
                <select value={inForm.stock_item_id}
                  onChange={e => setInForm({...inForm, stock_item_id: e.target.value})}
                  required
                  className="w-full mt-1 bg-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500">
                  <option value="">-- Pilih Bahan --</option>
                  {items.map(i => (
                    <option key={i.id} value={i.id}>
                      {i.name} (stok: {i.stock} {i.unit})
                    </option>
                  ))}
                </select>
              </div>

              {/* Info harga saat ini */}
              {selectedItem && (
                <div className="bg-slate-700/50 rounded-xl p-3 text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>Harga/satuan saat ini</span>
                    <span className="text-orange-400 font-semibold">
                      Rp {Math.round(Number(selectedItem.total_price) / (selectedItem.stock || 1)).toLocaleString('id-ID')}/{selectedItem.unit}
                    </span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span>Stok saat ini</span>
                    <span className="text-white">{selectedItem.stock} {selectedItem.unit}</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 text-sm">Jumlah Masuk</label>
                  <input type="number" min="1" value={inForm.qty}
                    onChange={e => setInForm({...inForm, qty: e.target.value})}
                    required placeholder="10"
                    className="w-full mt-1 bg-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="text-slate-400 text-sm">Total Harga Beli (Rp)</label>
                  <input type="number" min="0" value={inForm.total_price_added}
                    onChange={e => setInForm({...inForm, total_price_added: e.target.value})}
                    placeholder="0"
                    className="w-full mt-1 bg-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
              </div>

              {/* Preview harga per satuan baru */}
              {inForm.qty > 0 && selectedItem && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3">
                  <p className="text-green-400 text-sm font-semibold">
                    Harga/satuan setelah masuk:
                    <span className="text-white ml-2">
                      Rp {newPPU.toLocaleString('id-ID')}/{selectedItem.unit}
                    </span>
                  </p>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Stok baru: {newQty} {selectedItem.unit} | Total: Rp {newTotal.toLocaleString('id-ID')}
                  </p>
                </div>
              )}

              <div>
                <label className="text-slate-400 text-sm">Keterangan</label>
                <input value={inForm.reference}
                  onChange={e => setInForm({...inForm, reference: e.target.value})}
                  placeholder="Beli dari supplier"
                  className="w-full mt-1 bg-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500"/>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(null)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white rounded-xl py-3 transition-colors">Batal</button>
                <button type="submit" disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold rounded-xl py-3 transition-colors">
                  {loading ? 'Menyimpan...' : 'Tambah Stok'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
