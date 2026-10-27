'use client';

export default function MenuTabsPreview({ settings }) {
  if (!settings) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        No menu tabs settings
      </div>
    );
  }

  const categories = settings.categories || [];
  const activeCategory = categories[0];
  const items = activeCategory?.items || [];

  return (
    <div className="bg-slate-950 text-cream p-6">
      <div className="mb-5">
        <p className="text-xs uppercase tracking-wider text-yellow-500">{settings.sectionLabel}</p>
        <h3 className="text-2xl font-bold mt-2">
          Menu <span className="italic text-yellow-500">{settings.highlight}</span>
        </h3>
        <p className="text-sm text-slate-300 mt-2">{settings.description}</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {categories.map((category, idx) => (
          <span
            key={category.id || idx}
            className={`px-3 py-1 rounded-full text-xs border ${
              idx === 0 ? 'bg-yellow-500 text-slate-950 border-yellow-500' : 'border-slate-600 text-slate-300'
            }`}
          >
            {category.label}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3">
        {items.slice(0, 4).map((item, idx) => (
          <div key={item.id || idx} className="rounded-lg border border-slate-700 bg-slate-900 p-3 flex gap-3 items-center">
            {item.image ? (
              <img src={item.image} alt={item.name} className="w-16 h-16 rounded object-cover" />
            ) : (
              <div className="w-16 h-16 rounded bg-slate-800" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{item.name}</p>
              <p className="text-xs text-slate-400 truncate">{item.description}</p>
              <p className="text-sm text-yellow-500 mt-1">{item.price}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
