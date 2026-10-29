// ESC/POS Thermal Receipt Encoder & Web Bluetooth Printer for Santapos POS
// Mendukung printer thermal 58mm (32 kolom) dan 80mm (48 kolom)

// Helper: Format Rupiah ringkas
const formatRp = (num) => `Rp ${Number(num || 0).toLocaleString('id-ID')}`;

/**
 * Membuat baris teks dua kolom rata kiri dan kanan (misal: "Kebab Daging    Rp 25.000")
 */
const makeRow = (left, right, maxCols = 32) => {
  const leftStr = String(left || '');
  const rightStr = String(right || '');
  const spaceNeeded = maxCols - leftStr.length - rightStr.length;

  if (spaceNeeded <= 0) {
    // Jika terlalu panjang, potong kiri sedikit
    return leftStr.slice(0, maxCols - rightStr.length - 1) + ' ' + rightStr + '\n';
  }
  return leftStr + ' '.repeat(spaceNeeded) + rightStr + '\n';
};

/**
 * Mengubah data transaksi menjadi rangkaian byte perintah ESC/POS untuk printer thermal
 */
export const generateReceiptEscPosBytes = ({
  storeName = 'Santapos Resto',
  storeAddress = '',
  storePhone = '',
  storeTagline = 'Terima Kasih Atas Kunjungan Anda',
  transaction = {},
  paperWidth = 58, // 58 atau 80
}) => {
  const maxCols = paperWidth === 80 ? 48 : 32;
  const dashLine = '-'.repeat(maxCols) + '\n';
  const doubleLine = '='.repeat(maxCols) + '\n';

  const encoder = new TextEncoder();
  const buffer = [];

  const pushBytes = (...bytes) => buffer.push(...bytes);
  const pushText = (text) => {
    const encoded = encoder.encode(text);
    for (let i = 0; i < encoded.length; i++) {
      buffer.push(encoded[i]);
    }
  };

  // 1. Inisialisasi Printer (ESC @)
  pushBytes(0x1B, 0x40);

  // 2. Header Toko (Center Align, Bold, Double Height)
  pushBytes(0x1B, 0x61, 0x01); // Center
  pushBytes(0x1B, 0x45, 0x01); // Bold ON
  pushBytes(0x1D, 0x21, 0x11); // Double width & height
  pushText(`${storeName.toUpperCase()}\n`);
  pushBytes(0x1D, 0x21, 0x00); // Normal size
  pushBytes(0x1B, 0x45, 0x00); // Bold OFF

  if (storeAddress) pushText(`${storeAddress}\n`);
  if (storePhone) pushText(`Telp: ${storePhone}\n`);
  pushText(doubleLine);

  // 3. Info Transaksi (Left Align)
  pushBytes(0x1B, 0x61, 0x00); // Left
  const now = new Date();
  const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  pushText(makeRow('No. Struk', transaction.invoice_number || '-', maxCols));
  pushText(makeRow('Tanggal', `${dateStr} ${timeStr}`, maxCols));
  if (transaction.table_number) {
    pushText(makeRow('Meja', `No. ${transaction.table_number}`, maxCols));
  }
  pushText(makeRow('Kasir', transaction.kasir_name || 'Admin', maxCols));
  pushText(makeRow('Metode', (transaction.payment_method || 'cash').toUpperCase(), maxCols));
  pushText(dashLine);

  // 4. Daftar Item Pesanan
  const items = transaction.items || [];
  items.forEach((item) => {
    const name = item.name || item.product_name || 'Menu';
    const qty = Number(item.qty || 1);
    const price = Number(item.price || 0);
    const subtotal = qty * price;

    pushBytes(0x1B, 0x45, 0x01); // Bold untuk nama item
    pushText(`${name}\n`);
    pushBytes(0x1B, 0x45, 0x00); // Normal
    pushText(makeRow(`  ${qty} x ${formatRp(price)}`, formatRp(subtotal), maxCols));
  });

  pushText(dashLine);

  // 5. Rincian Total & Pembayaran
  const total = Number(transaction.total ?? transaction.total_price ?? 0);
  const subtotal = Number(transaction.subtotal ?? total);
  const discount = Number(transaction.discount_amount ?? 0);
  const tunai = Number(transaction.tunai ?? 0);
  const kembalian = Number(transaction.kembalian ?? 0);

  if (discount > 0) {
    pushText(makeRow('Subtotal', formatRp(subtotal), maxCols));
    pushText(makeRow('Diskon', `-${formatRp(discount)}`, maxCols));
  }

  pushBytes(0x1B, 0x45, 0x01); // Bold
  pushText(makeRow('TOTAL', formatRp(total), maxCols));
  pushBytes(0x1B, 0x45, 0x00); // Normal

  if (transaction.payment_method === 'cash') {
    pushText(makeRow('Tunai', formatRp(tunai), maxCols));
    pushText(makeRow('Kembalian', formatRp(kembalian), maxCols));
  }

  pushText(doubleLine);

  // 6. Footer (Center)
  pushBytes(0x1B, 0x61, 0x01); // Center
  pushText(`${storeTagline}\n`);
  pushText('Powered by Santapos Cloud POS\n');

  // 7. Feed 3 baris & Potong Kertas
  pushBytes(0x0A, 0x0A, 0x0A);
  pushBytes(0x1D, 0x56, 0x41, 0x03); // Full cut with feed

  return new Uint8Array(buffer);
};

/**
 * Mencetak byte ESC/POS langsung ke printer Bluetooth menggunakan Web Bluetooth API
 */
export const printViaWebBluetooth = async (receiptBytes) => {
  if (typeof navigator === 'undefined' || !navigator.bluetooth) {
    throw new Error('Web Bluetooth tidak didukung di browser ini. Gunakan Google Chrome atau Edge versi terbaru.');
  }

  // Cari perangkat printer Bluetooth
  const device = await navigator.bluetooth.requestDevice({
    acceptAllDevices: true,
    optionalServices: [
      '000018f0-0000-1000-8000-00805f9b34fb', // Standard POS Bluetooth service
      'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Alternatif thermal POS service
      '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC transparent service
    ],
  });

  const server = await device.gatt.connect();

  // Cari characteristic yang mendukung write
  let writeChar = null;
  const services = await server.getPrimaryServices();

  for (const s of services) {
    try {
      const chars = await s.getCharacteristics();
      for (const c of chars) {
        if (c.properties.write || c.properties.writeWithoutResponse) {
          writeChar = c;
          break;
        }
      }
      if (writeChar) break;
    } catch (_) {}
  }

  if (!writeChar) {
    device.gatt.disconnect();
    throw new Error('Tidak dapat menemukan jalur kirim data (Write Characteristic) pada printer ini.');
  }

  // Kirim data per chunk (maks 512 byte per paket bluetooth)
  const chunkSize = 256;
  for (let i = 0; i < receiptBytes.length; i += chunkSize) {
    const chunk = receiptBytes.slice(i, i + chunkSize);
    if (writeChar.properties.writeWithoutResponse) {
      await writeChar.writeValueWithoutResponse(chunk);
    } else {
      await writeChar.writeValue(chunk);
    }
  }

  // Beri waktu 500ms lalu putuskan koneksi rapi
  setTimeout(() => {
    try {
      if (device.gatt?.connected) device.gatt.disconnect();
    } catch (_) {}
  }, 500);

  return { success: true, device_name: device.name || 'Printer Bluetooth' };
};

/**
 * Membuat tautan WhatsApp untuk mengirim struk belanja digital ke pelanggan
 */
export const generateWhatsAppReceiptUrl = ({
  phone = '',
  storeName = 'Santapos Resto',
  transaction = {},
}) => {
  let cleanPhone = String(phone || '').replace(/[^0-9]/g, '');
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '62' + cleanPhone.slice(1);
  } else if (!cleanPhone.startsWith('62')) {
    cleanPhone = '62' + cleanPhone;
  }

  const items = transaction.items || [];
  const total = Number(transaction.total ?? transaction.total_price ?? 0);
  const invoice = transaction.invoice_number || 'INV-001';

  let itemsList = items.map((i) => `• ${i.name || i.product_name} x${i.qty} = ${formatRp(Number(i.price || 0) * Number(i.qty || 1))}`).join('\n');

  const text = `*STRUK DIGITAL ${storeName.toUpperCase()}*\n`
    + `-----------------------------------\n`
    + `No. Struk: ${invoice}\n`
    + `Tanggal: ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}\n`
    + (transaction.table_number ? `Meja: No. ${transaction.table_number}\n` : '')
    + `-----------------------------------\n`
    + `*Rincian Pesanan:*\n`
    + `${itemsList}\n`
    + `-----------------------------------\n`
    + `*TOTAL: ${formatRp(total)}*\n`
    + `Metode: ${(transaction.payment_method || 'cash').toUpperCase()}\n\n`
    + `Terima kasih atas kunjungan Anda!\n`
    + (transaction.receipt_status_url ? `Cek status live: ${transaction.receipt_status_url}\n` : '')
    + `_Powered by Santapos Cloud POS_`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
};

