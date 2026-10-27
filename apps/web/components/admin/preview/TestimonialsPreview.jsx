'use client';

export default function TestimonialsPreview({ settings }) {
  if (!settings) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        No testimonials settings
      </div>
    );
  }

  const items = settings.items || [];

  return (
    <div className="bg-slate-950 text-cream p-6">
      <div className="text-center mb-5">
        <p className="text-xs uppercase tracking-wider text-yellow-500">{settings.sectionLabel}</p>
        <h3 className="text-2xl font-bold mt-2">{settings.title}</h3>
        <p className="text-sm text-slate-300 mt-2">{settings.description}</p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {items.slice(0, 4).map((item, idx) => (
          <div key={item.id || idx} className="rounded-lg border border-slate-700 bg-slate-900 p-3">
            <div className="flex items-center gap-3">
              {item.authorAvatar ? (
                <img src={item.authorAvatar} alt={item.authorAvatarAlt || item.author} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-slate-800" />
              )}
              <div className="min-w-0">
                <p className="font-semibold truncate">{item.author}</p>
                <p className="text-xs text-slate-400 truncate">{item.role}</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 mt-2 line-clamp-3">{item.review}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
