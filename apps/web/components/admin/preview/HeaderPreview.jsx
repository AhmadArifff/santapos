'use client';

export default function HeaderPreview({ settings }) {
  if (!settings) {
    return (
      <div className="flex items-center justify-center h-32 text-slate-500">
        No header settings
      </div>
    );
  }

  const logo = settings.logo || {};
  const navLinks = settings.navLinks || [];
  const buttons = settings.buttons || {};

  return (
    <div className="bg-slate-900 text-cream p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="text-2xl font-bold flex-shrink-0">
          <span className="text-yellow-500">{logo.part1 || 'Logo'}</span>
          <span> {logo.part2 || 'Part2'}</span>
        </div>

        <div className="flex gap-6 flex-1 justify-center">
          {navLinks.map((link, idx) => (
            <a key={idx} href={link.href || '#'} className="text-sm text-slate-300 hover:text-yellow-500 transition">
              {link.label || 'Link'}
            </a>
          ))}
        </div>

        <div className="flex gap-3 flex-shrink-0">
          {buttons.cta && (
            <button className="px-4 py-2 bg-yellow-500 text-slate-950 text-sm font-semibold rounded hover:bg-yellow-600">
              {buttons.cta.label}
            </button>
          )}
          {buttons.admin && (
            <button className="px-4 py-2 border border-slate-600 text-sm text-cream rounded hover:bg-slate-700">
              {buttons.admin.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
