import { forwardRef } from 'react';

const Receipt = forwardRef(function Receipt({ transaction, storeSettings = {}, paperWidth = 58 }, ref) {
  if (!transaction) return <div ref={ref} />;

  const now         = new Date();
  const date        = now.toLocaleDateString('id-ID', { day:'2-digit', month:'2-digit', year:'numeric' });
  const time        = now.toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' });
  const total       = Number(transaction.total ?? transaction.total_price ?? 0);
  const subtotal    = Number(transaction.subtotal ?? transaction.items?.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0), 0) ?? total);
  const discount    = Number(transaction.discount_amount || 0);
  const tunai       = Number(transaction.tunai ?? 0);
  const kembalian   = Number(transaction.kembalian ?? 0);
  const method      = transaction.payment_method || 'cash';
  const methodLabel = { cash:'TUNAI', qris:'QRIS', transfer:'TRANSFER' }[method] || 'TUNAI';
  const statusUrl   = transaction.receipt_status_url || transaction.order_status_url || '';
  const qrUrl       = statusUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=116x116&margin=1&data=${encodeURIComponent(statusUrl)}`
    : '';

  const is80mm      = Number(paperWidth) === 80;
  const dash        = is80mm ? '='.repeat(48) : '='.repeat(38);
  const dash2       = is80mm ? '-'.repeat(48) : '-'.repeat(38);
  const year        = now.getFullYear();

  // White-label dynamic metadata
  const storeName   = storeSettings.brand_name || storeSettings.name || transaction.store_name || transaction.tenant_name || 'Santapos Resto';
  const storeTagline= storeSettings.tagline || '★ Kualitas Terbaik • Pilihan Utama ★';
  const storeAddress= storeSettings.address || transaction.branch_address || '';
  const storePhone  = storeSettings.phone || transaction.branch_phone || '';
  const storeSocial = storeSettings.social_media || '';
  const storeLogo   = storeSettings.logo_url || transaction.store_logo || null;

  const widthCss = is80mm ? '80mm' : '58mm';

  return (
    <>
      <style>{`
        @media print {
          body {
            margin: 0 !important;
            padding: 0 !important;
            width: ${widthCss} !important;
            background: white !important;
          }
          .receipt-paper {
            width: ${widthCss} !important;
            max-width: ${widthCss} !important;
            margin: 0 !important;
            padding: 0 !important;
            box-sizing: border-box !important;
            page-break-inside: avoid !important;
          }
          @page {
            size: ${widthCss} auto;
            margin: 0;
            padding: 0;
          }
        }
      `}</style>

      <div ref={ref} className="receipt-paper" style={{
        position: 'relative',
        overflow: 'hidden',
        width: widthCss,
        maxWidth: widthCss,
        margin: '0 auto',
        padding: 0,
        boxSizing: 'border-box',
        backgroundColor: '#fff',
        color: '#000',
        fontFamily: 'monospace',
        fontSize: is80mm ? '12px' : '10.5px',
      }}>
        {/* Konten Struk */}
        <div style={{ position: 'relative', zIndex: 1 }}>

          {/* Header Toko */}
          <div style={{
            background: '#fff',
            color: '#000',
            textAlign: 'center',
            padding: '10px 8px 6px',
          }}>
            {storeLogo && (
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '6px' }}>
                <img
                  src={storeLogo}
                  alt={storeName}
                  style={{
                    maxWidth: is80mm ? '70px' : '50px',
                    maxHeight: is80mm ? '70px' : '50px',
                    objectFit: 'contain',
                    display: 'block',
                    margin: '0 auto',
                  }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>
            )}
            <div style={{ fontSize: is80mm ? '17px' : '14px', fontWeight: 900, letterSpacing: '2px' }}>
              {storeName.toUpperCase()}
            </div>
            {storeTagline && (
              <div style={{ fontSize: is80mm ? '9px' : '8px', letterSpacing: '1px', marginTop: '3px', opacity: 0.85 }}>
                {storeTagline}
              </div>
            )}
          </div>

          {/* Info alamat & kontak */}
          {storeAddress && (
            <div style={{ textAlign: 'center', fontSize: '8px', color: '#111', padding: '2px 4px 0' }}>
              {storeAddress}
            </div>
          )}
          {storePhone && (
            <div style={{ textAlign: 'center', fontSize: '8px', color: '#111', padding: '1px 4px' }}>
              Telp: {storePhone}
            </div>
          )}
          {storeSocial && (
            <div style={{ textAlign: 'center', fontSize: '8px', color: '#111', padding: '1px 4px 4px' }}>
              {storeSocial}
            </div>
          )}

          <div style={{ textAlign: 'center', margin: '2px 0', fontSize: '9px', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {dash}
          </div>

          {/* Info transaksi */}
          {[
            ['No. Struk', transaction.invoice_number || '-'],
            ['Tanggal',   `${date} ${time}`],
            transaction.table_number ? ['Meja', `No. ${transaction.table_number}`] : null,
            ['Kasir',     transaction.kasir_name || 'Admin'],
            ['Bayar',     methodLabel],
          ].filter(Boolean).map(([label, val]) => (
            <div key={label} style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '1px 4px',
              fontSize: is80mm ? '10px' : '8.5px',
            }}>
              <span>{label}</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{val}</span>
            </div>
          ))}

          <div style={{ textAlign: 'center', margin: '2px 0', fontSize: '9px', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {dash}
          </div>

          {/* Header kolom item */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: is80mm ? '1fr 24px 75px' : '1fr 18px 55px',
            padding: '3px 4px',
            fontSize: is80mm ? '10px' : '8.5px',
            fontWeight: 800,
            background: '#f4f4f4',
          }}>
            <span>ITEM & HARGA</span>
            <span style={{ textAlign: 'center' }}>QTY</span>
            <span style={{ textAlign: 'right' }}>TOTAL</span>
          </div>

          <div style={{ textAlign: 'center', margin: '1px 0', fontSize: '9px', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {dash2}
          </div>

          {/* Items Pesanan */}
          {transaction.items?.map((item, i) => {
            const sub = Number(item.qty || 1) * Number(item.price || 0);
            const name = item.name || item.product_name || 'Menu';
            return (
              <div key={i} style={{ padding: '2px 4px' }}>
                <div style={{ fontWeight: 700, fontSize: is80mm ? '11px' : '9.5px' }}>{name}</div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: is80mm ? '9.5px' : '8px',
                  color: '#444',
                  marginTop: '1px',
                }}>
                  <span>@Rp {Number(item.price || 0).toLocaleString('id-ID')}</span>
                  <span style={{ textAlign: 'center', minWidth: '18px' }}>{item.qty}x</span>
                  <span style={{ textAlign: 'right', minWidth: is80mm ? '75px' : '55px', fontWeight: 600, color: '#000' }}>
                    Rp {sub.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            );
          })}

          <div style={{ textAlign: 'center', margin: '2px 0', fontSize: '9px', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {dash}
          </div>

          {/* Subtotal, Diskon, Pajak */}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1.5px 4px', fontSize: is80mm ? '10.5px' : '9px' }}>
            <span>Subtotal ({transaction.items?.length || 0} menu)</span>
            <span>Rp {subtotal.toLocaleString('id-ID')}</span>
          </div>

          {discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1.5px 4px', fontSize: is80mm ? '10px' : '8.5px', color: '#c2410c' }}>
              <span>Diskon {transaction.discount_label ? `(${transaction.discount_label})` : ''}</span>
              <span>-Rp {discount.toLocaleString('id-ID')}</span>
            </div>
          )}

          <div style={{ textAlign: 'center', margin: '2px 0', fontSize: '9px', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {dash}
          </div>

          {/* Total Besar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '5px 6px',
            fontSize: is80mm ? '16px' : '13.5px',
            fontWeight: 900,
            borderTop: '2px solid #000',
            borderBottom: '2px solid #000',
            margin: '2px 0',
          }}>
            <span>TOTAL</span>
            <span>Rp {total.toLocaleString('id-ID')}</span>
          </div>

          {/* Rincian Bayar */}
          {method === 'cash' && (
            <div style={{ padding: '3px 4px', fontSize: is80mm ? '10.5px' : '9px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Tunai</span>
                <span>Rp {tunai.toLocaleString('id-ID')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, color: '#166534', marginTop: '1px' }}>
                <span>Kembalian</span>
                <span>Rp {kembalian.toLocaleString('id-ID')}</span>
              </div>
            </div>
          )}
          {method !== 'cash' && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 4px', fontWeight: 800, fontSize: is80mm ? '10.5px' : '9px' }}>
              <span>Status Bayar</span>
              <span style={{ color: '#166534' }}>LUNAS ({methodLabel})</span>
            </div>
          )}

          <div style={{ textAlign: 'center', margin: '2px 0', fontSize: '9px', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {dash2}
          </div>

          {/* Barcode visual dekoratif */}
          <div style={{ textAlign: 'center', padding: '4px 4px 2px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              gap: '1px',
              height: '24px',
              marginBottom: '2px',
            }}>
              {Array.from({ length: is80mm ? 64 : 48 }, (_, i) => (
                <div key={i} style={{
                  width: (i % 3 === 0 ? 3 : i % 5 === 0 ? 2 : 1) + 'px',
                  height: (i % 7 === 0 ? 24 : i % 4 === 0 ? 18 : 14) + 'px',
                  background: i % 2 === 0 ? '#111' : 'transparent',
                  display: 'inline-block',
                }} />
              ))}
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '8px', color: '#666' }}>
              *{transaction.invoice_number || 'INV-001'}*
            </div>
          </div>

          {/* QR Status Pesanan jika ada */}
          {statusUrl && (
            <>
              <div style={{ textAlign: 'center', margin: '2px 0', fontSize: '9px', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {dash2}
              </div>
              <div style={{ textAlign: 'center', padding: '4px 4px 2px' }}>
                <div style={{ fontSize: '8.5px', fontWeight: 800, marginBottom: '3px' }}>
                  SCAN LIVE STATUS PESANAN
                </div>
                <img
                  src={qrUrl}
                  alt="QR Status"
                  style={{ width: is80mm ? '90px' : '75px', height: is80mm ? '90px' : '75px', display: 'block', margin: '0 auto' }}
                />
              </div>
            </>
          )}

          <div style={{ textAlign: 'center', margin: '2px 0', fontSize: '9px', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {dash2}
          </div>

          {/* Footer Ucapan */}
          <div style={{ textAlign: 'center', fontSize: is80mm ? '10px' : '9px', fontWeight: 700, margin: '4px 0 1px' }}>
            Terima kasih atas kunjungan Anda!
          </div>

          <div style={{ textAlign: 'center', fontSize: '7.5px', color: '#777', padding: '2px 0 6px' }}>
            © {year} {storeName}. Powered by Santapos
          </div>

          <div style={{ height: '15px' }} />
        </div>
      </div>
    </>
  );
});

Receipt.displayName = 'Receipt';
export default Receipt;
