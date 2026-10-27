'use client';

export default function AboutPreview({ settings }) {
  if (!settings) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        No about settings
      </div>
    );
  }

  const features = settings.features || [];

  return (
    <div className="bg-slate-950 text-cream p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div className="space-y-3">
          <div className="relative">
            {settings.mainImage ? (
              <img src={settings.mainImage} alt="Main" className="w-full h-44 object-cover rounded-lg border border-slate-700" />
            ) : (
              <div className="w-full h-44 rounded-lg border border-slate-700 bg-slate-800 flex items-center justify-center text-slate-500">
                Main image
              </div>
            )}
            {settings.accentImage && (
              <img
                src={settings.accentImage}
                alt="Accent"
                className="absolute -bottom-4 -right-4 w-24 h-24 object-cover rounded-lg border-2 border-slate-900"
              />
            )}
          </div>
          <div className="inline-flex flex-col bg-yellow-500 text-slate-950 px-3 py-2 rounded">
            <span className="text-lg font-bold">{settings.badgeTop || '-'}</span>
            <span className="text-xs">{settings.badgeBottom || '-'}</span>
          </div>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wider text-yellow-500 mb-2">{settings.sectionLabel}</p>
          <h3 className="text-2xl font-bold leading-tight">
            Warisan Rasa <span className="text-yellow-500 italic">{settings.highlight}</span> Timur Tengah
          </h3>
          <p className="text-sm text-slate-300 mt-3">{settings.description}</p>

          <div className="mt-4 space-y-3">
            {features.map((feature, idx) => (
              <div key={`${feature.title}-${idx}`} className="p-3 rounded border border-slate-700 bg-slate-900">
                <p className="text-sm font-semibold text-cream">
                  <span className="mr-2">{feature.icon}</span>
                  {feature.title}
                </p>
                <p className="text-xs text-slate-400 mt-1">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
