'use client';
import { useCartStore } from '@/store/cartStore';

export default function Cart({ onCheckout }) {
  const { items, removeItem, updateQty } = useCartStore();

  const total = items.reduce((sum, i) => sum + Number(i.price) * i.qty, 0);

  return (
    <div className="w-80 bg-slate-800 flex flex-col border-l border-slate-700" data-tour="pos-cart">
      <div className="px-4 py-3 border-b border-slate-700" data-tour="pos-cart-header">
        <h2 className="text-white font-bold text-lg">Pesanan</h2>
        <p className="text-slate-400 text-sm">{items.length} item</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" data-tour="pos-cart-items">
        {items.length === 0 ? (
          <div className="text-center text-slate-500 mt-16">
            <div className="text-4xl mb-2">🛒</div>
            <p className="text-sm">Belum ada pesanan</p>
          </div>
        ) : (
          items.map(item => {
            const maxQty = Number(item._availableStock || item.stock || 0);
            const atMax = maxQty > 0 && Number(item.qty || 0) >= maxQty;
            return (
            <div key={item.id} className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{item.name}</p>
                <p className="text-orange-400 text-sm">
                  Rp {(Number(item.price) * item.qty).toLocaleString('id-ID')}
                </p>
                {maxQty > 0 && (
                  <p className="text-slate-500 text-[11px]">Maks {maxQty} porsi</p>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => updateQty(item.id, item.qty - 1)}
                  className="w-7 h-7 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-bold transition-colors"
                >−</button>
                <span className="text-white w-6 text-center text-sm">{item.qty}</span>
                <button
                  onClick={() => !atMax && updateQty(item.id, item.qty + 1)}
                  disabled={atMax}
                  className="w-7 h-7 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-bold transition-colors"
                >+</button>
              </div>
            </div>
          );
          })
        )}
      </div>

      <div className="px-4 py-4 border-t border-slate-700 space-y-3" data-tour="pos-cart-footer">
        <div className="flex justify-between items-center" data-tour="pos-cart-total">
          <span className="text-slate-400">Total</span>
          <span className="text-white text-xl font-bold">
            Rp {total.toLocaleString('id-ID')}
          </span>
        </div>
        <button
          onClick={onCheckout}
          disabled={items.length === 0}
          data-tour="pos-cart-checkout"
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl py-3 text-lg transition-colors"
        >
          Bayar
        </button>
      </div>
    </div>
  );
}
