'use client';

export default function HeroPreview({ settings }) {
  if (!settings) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        No hero settings
      </div>
    );
  }

  const title = settings.title || {};
  const buttons = settings.buttons || {};
  const stats = settings.stats || [];

  return (
    <div
      className="relative h-96 bg-cover bg-center flex flex-col items-center justify-center text-center text-cream p-6"
      style={{
        backgroundImage: settings.backgroundImage
          ? `url(${settings.backgroundImage})`
          : 'linear-gradient(135deg, rgb(13, 10, 6) 0%, rgb(26, 26, 26) 100%)',
      }}
    >
      <div className="absolute inset-0 bg-black bg-opacity-50" />

      <div className="relative z-10 max-w-2xl">
        {settings.badge && (
          <div className="inline-block px-4 py-2 bg-yellow-500 text-slate-950 text-xs font-semibold rounded-full mb-4">
            {settings.badge}
          </div>
        )}

        <h1 className="text-4xl font-bold mb-4">
          {title.part1 && <span>{title.part1}</span>}
          {title.part2 && (
            <div>
              <span className="text-yellow-500">{title.part2}</span>
            </div>
          )}
          {title.part3 && (
            <div>
              <span>{title.part3}</span>
            </div>
          )}
        </h1>

        {settings.subtitle && <p className="text-lg text-slate-300 mb-6">{settings.subtitle}</p>}

        <div className="flex gap-4 justify-center">
          {buttons.primary && (
            <button className="px-6 py-3 bg-yellow-500 text-slate-950 font-semibold rounded hover:bg-yellow-600 transition">
              {buttons.primary.label}
            </button>
          )}
          {buttons.secondary && (
            <button className="px-6 py-3 border-2 border-cream text-cream font-semibold rounded hover:bg-cream hover:text-slate-950 transition">
              {buttons.secondary.label}
            </button>
          )}
        </div>

        {stats.length > 0 && (
          <div className="flex justify-center gap-8 mt-12">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="text-3xl font-bold text-yellow-500">
                  {stat.value}
                  {stat.suffix}
                </div>
                <div className="text-sm text-slate-300 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
