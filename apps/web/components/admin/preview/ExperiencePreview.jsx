'use client';

import { resolveAssetUrl } from '@/lib/assetUrl';

export default function ExperiencePreview({ settings }) {
  if (!settings) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        No experience settings
      </div>
    );
  }

  const features = settings.features || [];

  return (
    <div className="bg-slate-950 text-cream p-6">
      <div className="text-center mb-6">
        <p className="text-xs uppercase tracking-wider text-yellow-500">{settings.sectionLabel}</p>
        <h3 className="text-2xl font-bold mt-2">
          {settings.title} <span className="italic text-yellow-500">{settings.highlight}</span>
        </h3>
        <p className="text-sm text-slate-300 mt-1">{settings.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {features.map((feature, idx) => (
          <div key={`${feature.title}-${idx}`} className="p-3 rounded-lg border border-slate-700 bg-slate-900">
            <p className="flex items-center gap-3 font-semibold">
              {feature.image ? (
                <img
                  src={resolveAssetUrl(feature.image, '')}
                  alt={feature.title}
                  className="h-12 w-12 rounded-xl object-contain"
                />
              ) : null}
              {feature.title}
            </p>
            <p className="text-xs text-slate-400 mt-1">{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
