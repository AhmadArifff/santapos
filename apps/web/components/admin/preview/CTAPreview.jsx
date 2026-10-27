'use client';

export default function CTAPreview({ settings }) {
  if (!settings) {
    return (
      <div className="flex items-center justify-center h-56 text-slate-500">
        No CTA settings
      </div>
    );
  }

  return (
    <div
      className="relative h-72 bg-cover bg-center text-cream p-6 flex items-center justify-center"
      style={{
        backgroundImage: settings.backgroundImage
          ? `url(${settings.backgroundImage})`
          : 'linear-gradient(135deg, rgb(13, 10, 6) 0%, rgb(26, 26, 26) 100%)',
      }}
    >
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative z-10 max-w-xl text-center">
        <p className="text-xs uppercase tracking-wider text-yellow-500">{settings.sectionLabel}</p>
        <h3 className="text-2xl font-bold mt-2">{settings.title}</h3>
        <p className="text-sm text-slate-200 mt-2">{settings.description}</p>
        <div className="mt-4 flex justify-center gap-3">
          <button className="px-4 py-2 rounded bg-green-600 text-white text-sm">WhatsApp</button>
          <button className="px-4 py-2 rounded border border-slate-200 text-sm">
            {settings.secondaryButton?.label}
          </button>
        </div>
      </div>
    </div>
  );
}
