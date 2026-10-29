'use client';

import { useState, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import Receipt from './Receipt';
import { generateReceiptEscPosBytes, printViaWebBluetooth, generateWhatsAppReceiptUrl } from '@/lib/escpos';
import { playCheckoutSuccessSound } from '@/lib/soundNotification';

export default function PrintReceiptModal({
  isOpen,
  onClose,
  transaction,
  storeSettings = {},
}) {
  const [paperWidth, setPaperWidth] = useState(58); // 58 or 80
  const [customerPhone, setCustomerPhone] = useState(transaction?.customer_phone || '');
  const [bluetoothLoading, setBluetoothLoading] = useState(false);
  const [bluetoothError, setBluetoothError] = useState(null);
  const [bluetoothSuccess, setBluetoothSuccess] = useState(null);

  const receiptRef = useRef(null);

  const handleBrowserPrint = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: `Struk_${transaction?.invoice_number || 'POS'}`,
  });

  if (!isOpen || !transaction) return null;

  const storeName = storeSettings?.brand_name || storeSettings?.name || transaction?.store_name || 'Santapos Resto';

  const handleBluetoothPrint = async () => {
    setBluetoothLoading(true);
    setBluetoothError(null);
    setBluetoothSuccess(null);

    try {
      const bytes = generateReceiptEscPosBytes({
        storeName,
        storeAddress: storeSettings?.address || transaction?.branch_address || '',
        storePhone: storeSettings?.phone || transaction?.branch_phone || '',
        storeTagline: storeSettings?.tagline || 'Terima Kasih Atas Kunjungan Anda',
        transaction,
        paperWidth,
      });

      const res = await printViaWebBluetooth(bytes);
      setBluetoothSuccess(`Struk berhasil dicetak ke ${res.device_name}!`);
      playCheckoutSuccessSound();
    } catch (err) {
      console.error('[Bluetooth Print Error]:', err);
      setBluetoothError(err.message || 'Gagal mencetak via Bluetooth. Pastikan Bluetooth aktif dan printer dinyalakan.');
    } finally {
      setBluetoothLoading(false);
    }
  };

  const handleSendWhatsApp = () => {
    if (!customerPhone.trim()) {
      alert('Masukkan nomor WhatsApp pelanggan terlebih dahulu.');
      return;
    }
    const url = generateWhatsAppReceiptUrl({
      phone: customerPhone,
      storeName,
      transaction,
    });
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🖨️</span>
              <h3 className="font-extrabold text-white text-base">Cetak & Bagikan Struk Belanja</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Invoice: <strong className="text-amber-300 font-mono">{transaction.invoice_number}</strong>
            </p>
          </div>

          {/* Paper Size Selector */}
          <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button
              type="button"
              onClick={() => setPaperWidth(58)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                paperWidth === 58
                  ? 'bg-amber-400 text-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              58 mm
            </button>
            <button
              type="button"
              onClick={() => setPaperWidth(80)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                paperWidth === 80
                  ? 'bg-amber-400 text-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              80 mm
            </button>
          </div>
        </div>

        {/* Modal Body: Grid of Receipt Preview & Actions */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          {/* Bluetooth Alert Feedback */}
          {bluetoothSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2">
              <span>✅</span>
              <span>{bluetoothSuccess}</span>
            </div>
          )}
          {bluetoothError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl text-xs font-semibold flex items-center gap-2">
              <span>⚠️</span>
              <span>{bluetoothError}</span>
            </div>
          )}

          {/* Live Receipt Paper Preview in Container */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex justify-center max-h-72 overflow-y-auto shadow-inner">
            <div className="bg-white p-3 rounded-lg shadow-md text-black transition-all">
              <Receipt
                ref={receiptRef}
                transaction={transaction}
                storeSettings={storeSettings}
                paperWidth={paperWidth}
              />
            </div>
          </div>

          {/* Action Options */}
          <div className="grid sm:grid-cols-2 gap-3">
            {/* Action 1: Browser Print */}
            <button
              type="button"
              onClick={handleBrowserPrint}
              className="p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs flex items-center gap-3 transition"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-400/10 text-amber-300 flex items-center justify-center text-lg">
                🖨️
              </div>
              <div className="text-left">
                <div className="font-extrabold">Cetak Standar / USB</div>
                <div className="text-[10px] text-slate-400 font-normal">Dialog cetak browser sistem</div>
              </div>
            </button>

            {/* Action 2: Direct Bluetooth Print */}
            <button
              type="button"
              onClick={handleBluetoothPrint}
              disabled={bluetoothLoading}
              className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-3 transition shadow-lg shadow-blue-600/20"
            >
              <div className="w-9 h-9 rounded-xl bg-white/20 text-white flex items-center justify-center text-lg">
                {bluetoothLoading ? '⏳' : '📶'}
              </div>
              <div className="text-left">
                <div className="font-extrabold">
                  {bluetoothLoading ? 'Mencetak...' : 'Cetak Bluetooth Instan'}
                </div>
                <div className="text-[10px] text-blue-200 font-normal">Raw ESC/POS langsung ke printer</div>
              </div>
            </button>
          </div>

          {/* Action 3: WhatsApp Digital Receipt */}
          <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/70 space-y-2.5">
            <label className="block text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <span>💬</span>
              <span>Kirim Struk Digital via WhatsApp Pelanggan</span>
            </label>
            <div className="flex gap-2">
              <input
                type="tel"
                placeholder="081234567890"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-emerald-400 text-white text-xs outline-none transition font-mono"
              />
              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs transition flex items-center gap-1.5 whitespace-nowrap shadow-md shadow-emerald-500/20"
              >
                <span>Buka WhatsApp</span>
                <span>↗</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Format struk teks lengkap + link status order interaktif dikirim langsung ke chat pelanggan.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
          >
            Tutup & Transaksi Baru
          </button>
        </div>
      </div>
    </div>
  );
}

