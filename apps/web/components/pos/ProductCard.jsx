'use client';
import { useState } from 'react';
import {
  calculateIngredientsForPortions,
  calculateMaxPortions,
  getAvailabilityBreakdown,
} from '@/lib/ingredientCalculator';
import { resolveAssetUrl } from '@/lib/assetUrl';

export default function ProductCard({
  product,
  inCart,
  stock,
  soldOut,
  lowStock,
  isAdmin,
  selectedSourceUser,
  selectedUserStock,
  onAddItem,
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate ingredients for the available portions
  const maxPortions = calculateMaxPortions(
    product.ingredients,
    (selectedUserStock?.ingredients || []).reduce((acc, ing) => {
      acc[ing.stock_item_id] = ing;
      return acc;
    }, {})
  );

  const ingredientsForPortions = calculateIngredientsForPortions(
    product.ingredients,
    maxPortions
  );

  // Get detailed availability breakdown
  const availability = getAvailabilityBreakdown(product, selectedUserStock);

  // Map for quick lookup
  const ingredientStockMap = (selectedUserStock?.ingredients || []).reduce((acc, ing) => {
    acc[ing.stock_item_id] = ing;
    return acc;
  }, {});

  const buttonClasses = `relative flex h-full min-h-[232px] w-full flex-col bg-slate-800/80 rounded-2xl text-left
    border overflow-hidden transition-all duration-200 group
    ${
      soldOut
        ? 'border-slate-700/50 cursor-pointer'
        : inCart
          ? 'border-orange-500/60 shadow-lg shadow-orange-500/10'
          : 'border-slate-700/60 hover:border-orange-500/40 active:scale-95'
    }`;

  return (
    <button onClick={() => onAddItem(product)} className={buttonClasses}>
      {/* In-cart badge */}
      {inCart && (
        <div className="absolute top-2 right-2 z-10 w-6 h-6 bg-orange-500
          rounded-lg flex items-center justify-center text-white text-xs font-black shadow-lg">
          {inCart.qty}
        </div>
      )}

      {/* Sold out overlay */}
      {soldOut && (
        <div className="absolute inset-0 z-10 flex flex-col items-center
          justify-center bg-slate-900/75 backdrop-blur-sm gap-1.5">
          <span className="bg-red-500/90 text-white text-xs font-bold px-3 py-1 rounded-full">
            Stok Habis
          </span>
          {isAdmin && (
            <span className="text-orange-400 text-[10px] font-semibold
              bg-orange-500/20 px-2 py-0.5 rounded-full border border-orange-500/30
              flex items-center gap-1">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Ajukan Stok
            </span>
          )}
          {!isAdmin && (
            <span className="text-orange-400 text-[10px] font-semibold
              bg-orange-500/20 px-2 py-0.5 rounded-full border border-orange-500/30
              flex items-center gap-1">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Ajukan Stok
            </span>
          )}
        </div>
      )}

      {/* Image */}
      <div className="relative w-full h-28 bg-slate-700/60 overflow-hidden">
        {product.image_url ? (
          <img
            src={resolveAssetUrl(product.image_url)}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <img
              src="/images/assets/logo.png"
              alt="Logo"
              className="w-12 h-12 object-contain opacity-30"
            />
          </div>
        )}
        {product.category_name && (
          <span className="absolute bottom-1.5 left-1.5 bg-slate-900/80
            text-slate-300 text-xs px-2 py-0.5 rounded-lg">
            {product.category_name}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col p-3">
        <p className="text-white font-semibold text-sm leading-tight line-clamp-2 mb-1">
          {product.name}
        </p>
        <p className="text-orange-400 font-bold text-sm">
          Rp {Number(product.price).toLocaleString('id-ID')}
        </p>

        {/* Stock indicator */}
        <div className="flex items-center gap-1.5 mt-1.5">
          <div
            className={`w-1.5 h-1.5 rounded-full ${
              soldOut ? 'bg-red-500' : lowStock ? 'bg-yellow-500' : 'bg-green-500'
            }`}
          />
          <span
            className={`text-xs ${
              soldOut ? 'text-red-400' : lowStock ? 'text-yellow-400' : 'text-slate-500'
            }`}
          >
            {soldOut
              ? isAdmin
                ? 'Tap untuk ajukan'
                : 'Tap untuk minta stok'
              : `${stock} porsi`}
          </span>
        </div>

        {/* Admin: Expandable details */}
        {isAdmin && selectedSourceUser && !soldOut && (
          <div className="mt-auto space-y-1 pt-2">
            {/* Expand Header */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }
              }}
              role="button"
              tabIndex={0}
              className="w-full text-left px-1.5 py-1 rounded-lg bg-slate-700/50
                border border-slate-600/40 text-slate-300 text-[10px]
                hover:bg-slate-700/70 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500/30"
            >
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1 flex-1 min-w-0">
                  <span className="text-blue-400 font-semibold shrink-0">👤</span>
                  <span className="truncate">{selectedSourceUser.user_name}</span>
                  <span className="text-amber-400 font-bold shrink-0">{stock} porsi</span>
                </div>
                <svg
                  className={`w-3 h-3 transition-transform shrink-0 pointer-events-none ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="px-1.5 py-1.5 rounded-lg bg-slate-800/60
                  border border-slate-600/30 text-[9px] text-slate-300 space-y-1.5 animate-in fade-in duration-200"
              >
                {/* 📦 Bahan yang Dibutuhkan (Ingredients Needed) */}
                {product.ingredients && product.ingredients.length > 0 && (
                  <div>
                    <div className="text-amber-400 font-semibold mb-0.5 flex items-center gap-1">
                      <span>📦</span>
                      <span>Bahan yang Dibutuhkan</span>
                    </div>
                    <div className="space-y-0.5 pl-4">
                      {ingredientsForPortions.map((ing, idx) => {
                        const available = Number(
                          ingredientStockMap[ing.stock_item_id]?.available_qty || 0
                        );
                        const statusColor = available === 0
                          ? 'text-red-400'
                          : available <= Number(ing.qty)
                            ? 'text-yellow-400'
                            : 'text-green-400';

                        return (
                          <div key={idx} className="flex justify-between items-start gap-2">
                            <span className="text-slate-300">{ing.ingredient_name}</span>
                            <span className={`font-semibold whitespace-nowrap ${statusColor}`}>
                              {ing.required_qty_formatted} {ing.unit}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 📊 Ketersediaan (Availability) */}
                <div className="pt-0.5 border-t border-slate-600/40">
                  <div className="text-blue-400 font-semibold mb-0.5 flex items-center gap-1">
                    <span>📊</span>
                    <span>Ketersediaan</span>
                  </div>
                  <div className="space-y-1 pl-4">
                    {/* Dari Pengajuan */}
                    <div>
                      <div className="text-slate-400 font-semibold text-[8px] mb-0.5">
                        Dari Pengajuan:
                      </div>
                      <div className="space-y-0.5">
                        {availability.ingredient_breakdown.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-start gap-2">
                            <span className="text-slate-300">{item.name}</span>
                            <span className="text-green-400 font-semibold whitespace-nowrap">
                              {item.available} {item.unit}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Sisa Dari Pengajuan X Porsi */}
                    {maxPortions > 0 && (
                      <div className="pt-0.5 border-t border-slate-600/40">
                        <div className="text-slate-400 font-semibold text-[8px] mb-0.5">
                          Sisa Dari Pengajuan {maxPortions} Porsi:
                        </div>
                        <div className="space-y-0.5">
                          {availability.ingredient_breakdown.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-start gap-2">
                              <span className="text-slate-300">{item.name}</span>
                              <span
                                className={`font-semibold whitespace-nowrap ${
                                  item.remaining_after === 0
                                    ? 'text-red-400'
                                    : item.remaining_after < item.required_per_portion
                                      ? 'text-yellow-400'
                                      : 'text-green-400'
                                }`}
                              >
                                {item.remaining_after} {item.unit}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Komponen Resep & Bisa Buat */}
                    <div className="pt-0.5 border-t border-slate-600/30 space-y-0.5 mt-0.5">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Komponen Resep:</span>
                        <span className="text-orange-400 font-semibold">
                          {availability.ingredients_total} bahan{availability.ingredients_total > 1 ? '' : ''}
                        </span>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span className="text-slate-300">Bisa Buat:</span>
                        <span className="text-amber-400">
                          {maxPortions} porsi
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Footer */}
                <div className="pt-0.5 text-[8px] italic text-slate-500 flex items-center gap-1">
                  <span className="text-green-400 text-xs">OK</span>
                  <span>Stok dihitung dari pengajuan yang disetujui</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </button>
  );
}
