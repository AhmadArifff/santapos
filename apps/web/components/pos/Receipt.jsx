import { forwardRef } from 'react';

const Receipt = forwardRef(function Receipt({ transaction }, ref) {
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
  const dash        = '=======================================';
  const dash2       = '--------------------------------------';
  const year        = now.getFullYear();

  // SVG atom — dipakai di 2 tempat (header & copyright)
  const AtomIcon = ({ size = 32, color = '#fff', opacity = 1 }) => (
    <svg width={size} height={size} viewBox="0 0 32 32" style={{ opacity }}>
      <circle cx="16" cy="16" r="3" fill={color} />
      <ellipse cx="16" cy="16" rx="13" ry="5"
        fill="none" stroke={color} strokeWidth="1"
        transform="rotate(0 16 16)" />
      <ellipse cx="16" cy="16" rx="13" ry="5"
        fill="none" stroke={color} strokeWidth="1"
        transform="rotate(60 16 16)" />
      <ellipse cx="16" cy="16" rx="13" ry="5"
        fill="none" stroke={color} strokeWidth="1"
        transform="rotate(120 16 16)" />
    </svg>
  );

  return (
    <>
      <style>{`
        @media print {
          body {
            margin: 0 !important;
            padding: 0 !important;
            width: 58mm !important;
            background: white !important;
          }
          .receipt-paper {
            width: 58mm !important;
            max-width: 58mm !important;
            margin: 0 !important;
            padding: 0 !important;
            box-sizing: border-box !important;
            page-break-inside: avoid !important;
          }
          @page {
            size: 58mm auto;
            margin: 0;
            padding: 0;
          }
        }
      `}</style>
      
      <div ref={ref} className="receipt-paper" style={{
        position: 'relative',
        overflow: 'hidden',
        width: '58mm',
        maxWidth: '58mm',
        margin: '0 auto',
        padding: 0,
        boxSizing: 'border-box',
        backgroundColor: '#fff',
        color: '#000',
        fontFamily: 'monospace',
        fontSize: '11px',
      }}>

      {/* ── WATERMARK BACKGROUND ── */}
      {/* Layer 1: Logo gambar sebagai watermark */}
      <div style={{
        position:           'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage:    'url(/images/assets/logo.png)',
        backgroundRepeat:   'no-repeat',
        backgroundPosition: 'center 45%',
        backgroundSize:     '160px auto',
        opacity:            0.05,
        filter:             'grayscale(100%) contrast(200%)',
        pointerEvents:      'none',
        zIndex:             0,
        transform:          'rotate(-8deg)',
      }} />

      {/* Layer 2: Teks watermark "ORIGINAL" diagonal */}
      <div style={{
        position:    'absolute',
        top:         '38%',
        left:        '-20px',
        right:       '-20px',
        textAlign:   'center',
        fontSize:    '28px',
        fontWeight:  900,
        color:       '#000',
        opacity:     0.035,
        transform:   'rotate(-25deg)',
        letterSpacing: '6px',
        pointerEvents: 'none',
        zIndex:      0,
        fontFamily:  'monospace',
        lineHeight:  1.8,
      }}>
        ORIGINAL<br />RECEIPT
      </div>

      {/* ── KONTEN STRUK (di atas watermark) ── */}
      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* Header hitam + atom */}
        <div style={{
          background: '#fff',
          color:      '#000',
          textAlign:  'center',
          padding:    '12px 8px 10px',
        }}>
          {/* Atom ikon di atas nama brand */}
          <div style={{ display:'flex', justifyContent:'center', marginBottom:'6px' }}>
            {/* <AtomIcon size={32} color="#fff" /> */}
            {/* Logo di atas header — background putih */}
            {/* <div style={{
              background: '#fff',
              textAlign: 'center',
              padding: '10px 8px 6px',
              display: 'flex',
              justifyContent: 'center',
            }}>
              <img
                src="/images/assets/logorv.png"
                alt="Logo"
                style={{
                  width: '50px',
                  height: '50px',
                  objectFit: 'cover',
                  // borderRadius: '50%',
                  display: 'block',
                  margin: '0 auto',
                  filter: 'grayscale(100%) contrast(150%)',
                  background: '#fff',
                }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div> */}
          </div>
          <div style={{ fontSize:'15px', fontWeight:900, letterSpacing:'4px' }}>
            LUMPIA BEEF
          </div>
          <div style={{ fontSize:'13px', fontWeight:900, letterSpacing:'2px', marginTop:'1px' }}>
            BANG.HAN
          </div>
          <div style={{ fontSize:'8px', letterSpacing:'1px', marginTop:'5px', opacity:0.8 }}>
            ★ Crispy • Juicy • Viral ★
          </div>
        </div>

        {/* Info toko */}
        <div style={{ textAlign:'center', fontSize:'8px', color:'#000', padding:'4px 4px 0' }}>
          Depan Seafood B&B, Padalarang
        </div>
        <div style={{ textAlign:'center', fontSize:'8px', color:'#000', padding:'1px 4px' }}>
          Bandung Barat, Jawa Barat
        </div>
        <div style={{ textAlign:'center', fontSize:'8px', color:'#000', padding:'1px 4px 4px' }}>
          IG: @lumpiabeef_banghan
        </div>

        <div className="receipt-dash">{dash}</div>

        {/* Info transaksi */}
        {[
          ['No. Struk', transaction.invoice_number],
          ['Tanggal',   `${date} ${time}`],
          ['Kasir',     transaction.kasir_name || 'Admin'],
          ['Dibuat Oleh', transaction.created_by_type === 'admin' 
            ? `Admin (${transaction.kasir_name})` 
            : transaction.kasir_name || 'Admin'],
          ['Bayar',     methodLabel],
        ].map(([label, val]) => (
          <div key={label} className="receipt-row receipt-small">
            <span>{label}</span>
            <span style={{ fontFamily:'monospace', fontSize:'9px' }}>{val}</span>
          </div>
        ))}

        <div className="receipt-dash">{dash}</div>

        {/* Header kolom */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 18px 55px',
          padding: '2px 4px',
          fontSize: '8px',
          fontWeight: 700,
          background: '#f0f0f0',
        }}>
          <span>ITEM &amp; HARGA</span>
          <span style={{ textAlign:'center' }}>QTY</span>
          <span style={{ textAlign:'right' }}>SUBTOTAL</span>
        </div>

        <div className="receipt-dash">{dash2}</div>

        {/* Items */}
        {transaction.items?.map((item, i) => {
          const subtotal = item.qty * Number(item.price);
          const name     = (item.name || item.product_name || '').substring(0, 20);
          return (
            <div key={i} style={{ padding:'2px 4px' }}>
              <div style={{ fontWeight:700, fontSize:'9px' }}>{name}</div>
              <div style={{
                display:'flex', justifyContent:'space-between',
                fontSize:'8px', color:'#444', marginTop:'1px',
              }}>
                <span>@Rp {Number(item.price).toLocaleString('id-ID')}</span>
                <span style={{ textAlign:'center', minWidth:'18px' }}>{item.qty}x</span>
                <span style={{ textAlign:'right', minWidth:'55px' }}>
                  Rp {subtotal.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          );
        })}

        <div className="receipt-dash">{dash}</div>

        {/* Subtotal baris */}
        <div className="receipt-row receipt-small" style={{ padding:'2px 4px', fontSize:'9px' }}>
          <span>Subtotal ({transaction.items?.length} item)</span>
          <span>Rp {subtotal.toLocaleString('id-ID')}</span>
        </div>
        <div className="receipt-row" style={{ padding:'2px 4px', fontSize:'8px', color:'#888' }}>
          <span>Diskon{transaction.discount_label ? ` (${String(transaction.discount_label).substring(0, 18)})` : ''}</span>
          <span>-Rp {discount.toLocaleString('id-ID')}</span>
        </div>
        <div className="receipt-row" style={{ padding:'2px 4px', fontSize:'8px', color:'#888' }}>
          <span>Pajak (0%)</span><span>Rp 0</span>
        </div>

        <div className="receipt-dash">{dash}</div>

        {/* Total besar */}
        <div style={{
          display:'flex', justifyContent:'space-between',
          padding:'5px 6px', fontSize:'14px', fontWeight:900,
          borderTop:'2.5px solid #000', borderBottom:'2.5px solid #000',
          margin:'2px 0',
        }}>
          <span>TOTAL</span>
          <span>Rp {total.toLocaleString('id-ID')}</span>
        </div>

        <div style={{ height:'3px' }} />

        {/* Pembayaran */}
        {method === 'cash' && (
          <>
            <div className="receipt-row receipt-small">
              <span>Tunai</span>
              <span>Rp {tunai.toLocaleString('id-ID')}</span>
            </div>
            <div className="receipt-row" style={{
              fontSize:'10px', fontWeight:700, color:'#166534', padding:'1px 4px',
            }}>
              <span>Kembali</span>
              <span>Rp {kembalian.toLocaleString('id-ID')}</span>
            </div>
          </>
        )}
        {method !== 'cash' && (
          <div className="receipt-row receipt-small" style={{ fontWeight:700, padding:'2px 4px', fontSize:'9px' }}>
            <span>{methodLabel}</span>
            <span>Rp {total.toLocaleString('id-ID')}</span>
          </div>
        )}

        <div className="receipt-dash">{dash2}</div>

        {/* Barcode */}
        <div style={{ textAlign:'center', padding:'4px 4px 2px' }}>
          <div style={{
            display:'flex', alignItems:'flex-end',
            justifyContent:'center', gap:'1px',
            height:'28px', marginBottom:'2px',
          }}>
            {Array.from({ length: 52 }, (_, i) => (
              <div key={i} style={{
                width:      (i % 3 === 0 ? 3 : i % 5 === 0 ? 2 : 1) + 'px',
                height:     (i % 7 === 0 ? 28 : i % 4 === 0 ? 20 : 16) + 'px',
                background: i % 2 === 0 ? '#111' : 'transparent',
                display:    'inline-block',
              }} />
            ))}
          </div>
          <div style={{ fontFamily:'monospace', fontSize:'8px', color:'#888' }}>
            *{transaction.invoice_number}*
          </div>
        </div>

        <div className="receipt-dash">{dash2}</div>

        {statusUrl && (
          <>
            <div style={{ textAlign:'center', padding:'6px 4px 3px' }}>
              <div style={{ fontSize:'9px', fontWeight:900, marginBottom:'4px' }}>
                SCAN STATUS PESANAN
              </div>
              <img
                src={qrUrl}
                alt="QR Status Pesanan"
                style={{ width:'82px', height:'82px', display:'block', margin:'0 auto' }}
              />
              <div style={{ fontSize:'7px', color:'#555', lineHeight:1.3, marginTop:'3px', wordBreak:'break-all' }}>
                {statusUrl}
              </div>
              {transaction.table_number && (
                <div style={{ fontSize:'8px', fontWeight:700, marginTop:'2px' }}>
                  Meja {transaction.table_number}
                </div>
              )}
            </div>
            <div className="receipt-dash">{dash2}</div>
          </>
        )}

        {/* Footer pesan */}
        <div style={{ textAlign:'center', fontSize:'10px', fontWeight:700, margin:'5px 0 2px' }}>
          Terima kasih sudah berkunjung!
        </div>
        <div style={{ textAlign:'center', fontSize:'9px', color:'#666', marginBottom:'2px' }}>
          @lumpiabeef_banghan • Padalarang
        </div>

        {/* ── COPYRIGHT dengan atom ── */}
        <div style={{
          display:        'flex',
          alignItems:     'center',
          gap:            '6px',
          padding:        '6px 8px',
          borderTop:      '1px dashed #ccc',
          borderBottom:   '1px dashed #ccc',
          margin:         '4px 0',
          background:     '#fafafa',
        }}>
          {/* Atom kecil */}
          <div style={{ flexShrink: 0 }}>
            <div style={{
              background: '#fafafa',
              textAlign: 'center',
              padding: '10px 8px 6px',
              display: 'flex',
              justifyContent: 'center',
            }}>
              <img
                src="/images/assets/logorv.png"
                alt="Logo"
                style={{
                  width: '50px',
                  height: '50px',
                  objectFit: 'cover',
                  // borderRadius: '50%',
                  display: 'block',
                  margin: '0 auto',
                  filter: 'grayscale(100%) contrast(150%)',
                  // background: '#fafafa',
                }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
          </div>
          {/* Teks copyright */}
          <div style={{ fontSize:'8px', color:'#888', lineHeight:1.4 }}>
            © {year} Lumpia Beef Bang.Han{'\n'}
            <span style={{ display:'block' }}>
              Hak cipta dilindungi undang-undang.
            </span>
            <span style={{ display:'block' }}>
              Dilarang memperbanyak tanpa izin.
            </span>
          </div>
        </div>

        {/* Footer bar hitam */}
        <div style={{
          background:    '#fff',
          color:         '#000',
          textAlign:     'center',
          padding:       '6px 8px',
          fontSize:      '8px',
          letterSpacing: '2px',
          fontWeight:    700,
        }}>
          *** SIMPAN STRUK INI ***
        </div>

        <div style={{ height:'20px' }} />

      </div>{/* end z-index wrapper */}
    </div>
    </>
  );
});

Receipt.displayName = 'Receipt';
export default Receipt;
