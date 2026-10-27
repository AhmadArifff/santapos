'use client';

export default function BestsellersPreview({ settings }) {
  if (!settings) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        No bestsellers settings
      </div>
    );
  }

  const products = settings.products || [];

  return (
    <div className="bg-slate-950 text-cream p-6">
      <div className="mb-6 text-center">
        <p className="text-xs uppercase tracking-wider text-yellow-500 mb-2">{settings.sectionLabel}</p>
        <h3 className="text-2xl font-bold">
          Menu <span className="italic text-yellow-500">{settings.highlight}</span>
        </h3>
        <p className="text-sm text-slate-300 mt-2">{settings.description}</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {products.map((product, idx) => (
          <div key={product.id || idx} className="rounded-lg border border-slate-700 bg-slate-900 overflow-hidden">
            {product.image ? (
              <img src={product.image} alt={product.name} className="w-full h-36 object-cover" />
            ) : (
              <div className="w-full h-36 bg-slate-800 flex items-center justify-center text-slate-500">No image</div>
            )}
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-yellow-500">{product.badge}</span>
                <span className="text-xs text-slate-400">{product.number}</span>
              </div>
              <p className="font-semibold">{product.name}</p>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">{product.description}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="font-bold text-yellow-500">{product.price}</span>
                <span className="text-xs text-slate-300">{product.ratingText}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
