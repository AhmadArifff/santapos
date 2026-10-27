'use client';

export default function MarqueePreview({ settings }) {
  if (!settings) {
    return (
      <div className="flex items-center justify-center h-32 text-slate-500">
        No marquee settings
      </div>
    );
  }

  const items = settings.items || [];
  const dot = settings.dot || '◆';

  return (
    <div className="bg-slate-950 p-6 border-y border-yellow-500/20">
      <div className="flex flex-wrap items-center gap-3 text-yellow-500 font-semibold text-sm">
        {items.length === 0 ? (
          <span className="text-slate-500">No items</span>
        ) : (
          items.map((item, idx) => (
            <div key={`${item}-${idx}`} className="flex items-center gap-3">
              <span>{item}</span>
              {idx < items.length - 1 && <span className="text-yellow-700">{dot}</span>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
