'use client';
import { useCartStore } from '@/store/cartStore';

export default function Cart({ onCheckout, selectedTableLabel = '' }) {
  const { items, updateQty, clearCart } = useCartStore();

  const total = items.reduce((sum, i) => sum + Number(i.price) * i.qty, 0);
  const totalQty = items.reduce((sum, i) => sum + Number(i.qty || 0), 0);

  return (
    <div
      className="w-80 lg:w-[340px] flex flex-col"
      style={{
        background: '#11192B',
        borderLeft: '1px solid rgba(255,255,255,0.08)',
      }}
      data-tour="pos-cart"
    >
      {/* Header */}
      <div
        className="px-4 py-3.5"
        style={{
          background: '#131C2E',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}
        data-tour="pos-cart-header"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-white font-extrabold text-base tracking-tight">Tiket Pesanan</h2>
            <p className="text-slate-400 text-xs mt-0.5">
              {totalQty} porsi ({items.length} menu)
            </p>
          </div>

          {items.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              style={{
                background: 'rgba(243, 166, 143, 0.14)',
                color: '#F3A68F',
                border: '1px solid rgba(243, 166, 143, 0.25)',
                borderRadius: '999px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Reset
            </button>
          )}
        </div>

        {/* 3-Step Guided Flow Strip */}
        <div
          className="mt-3 grid grid-cols-3 gap-1.5 text-center"
          style={{
            background: '#0B111E',
            padding: '5px',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div
            style={{
              padding: '4px 6px',
              borderRadius: '8px',
              background: items.length > 0 ? '#EADCA6' : '#18243A',
              color: items.length > 0 ? '#18181B' : '#94A3B8',
              fontSize: '10px',
              fontWeight: 800,
            }}
          >
            1. Menu {items.length > 0 ? '✓' : ''}
          </div>
          <div
            style={{
              padding: '4px 6px',
              borderRadius: '8px',
              background: selectedTableLabel ? '#F3A68F' : '#18243A',
              color: selectedTableLabel ? '#0F172A' : '#94A3B8',
              fontSize: '10px',
              fontWeight: 800,
            }}
          >
            2. {selectedTableLabel || 'Pilih Meja'}
          </div>
          <div
            style={{
              padding: '4px 6px',
              borderRadius: '8px',
              background: '#18243A',
              color: '#94A3B8',
              fontSize: '10px',
              fontWeight: 700,
            }}
          >
            3. Bayar
          </div>
        </div>
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5" data-tour="pos-cart-items">
        {items.length === 0 ? (
          <div className="text-center text-slate-500 mt-16 px-4">
            <div
              className="mx-auto mb-3 grid place-items-center"
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '18px',
                background: '#162136',
                border: '1px solid rgba(255,255,255,0.06)',
                fontSize: '24px',
              }}
            >
              🍴
            </div>
            <p className="text-sm font-bold text-slate-300">Belum Ada Menu Dipilih</p>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Klik menu makanan/minuman di sebelah kiri, lalu pilih meja sesuai kapasitas tamu dan bayar.
            </p>
          </div>
        ) : (
          items.map((item) => {
            const maxQty = Number(item._availableStock || item.stock || 0);
            const atMax = maxQty > 0 && Number(item.qty || 0) >= maxQty;
            return (
              <div
                key={item.id}
                className="flex items-center gap-3 p-2.5 rounded-2xl"
                style={{
                  background: '#162136',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs sm:text-sm font-bold truncate">{item.name}</p>
                  <p className="text-xs font-extrabold mt-0.5" style={{ color: '#F3A68F' }}>
                    Rp {(Number(item.price) * item.qty).toLocaleString('id-ID')}
                  </p>
                  {maxQty > 0 && (
                    <p className="text-slate-500 text-[10px]">Stok maks {maxQty} porsi</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => updateQty(item.id, item.qty - 1)}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      background: '#22314E',
                      color: '#F8FAFC',
                      border: 'none',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    −
                  </button>
                  <span className="text-white w-6 text-center text-xs font-extrabold">{item.qty}</span>
                  <button
                    type="button"
                    onClick={() => !atMax && updateQty(item.id, item.qty + 1)}
                    disabled={atMax}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      background: atMax ? '#1A2438' : '#F3A68F',
                      color: atMax ? '#475569' : '#0F172A',
                      border: 'none',
                      fontWeight: 900,
                      cursor: atMax ? 'not-allowed' : 'pointer',
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Checkout */}
      <div
        className="px-4 py-4 space-y-3"
        style={{
          background: '#131C2E',
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }}
        data-tour="pos-cart-footer"
      >
        <div className="flex justify-between items-center" data-tour="pos-cart-total">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Tagihan</span>
          <span className="text-white text-xl font-black">
            Rp {total.toLocaleString('id-ID')}
          </span>
        </div>

        <button
          type="button"
          onClick={onCheckout}
          disabled={items.length === 0}
          data-tour="pos-cart-checkout"
          style={{
            width: '100%',
            padding: '13px 16px',
            borderRadius: '999px',
            border: 'none',
            background: items.length === 0 ? '#1E293B' : '#F3A68F',
            color: items.length === 0 ? '#64748B' : '#0F172A',
            fontSize: '14px',
            fontWeight: 900,
            cursor: items.length === 0 ? 'not-allowed' : 'pointer',
            boxShadow: items.length === 0 ? 'none' : '0 8px 24px rgba(243, 166, 143, 0.35)',
            transition: 'all 0.18s ease',
          }}
        >
          🪑 Pilih Meja & Bayar →
        </button>
      </div>
    </div>
  );
}
