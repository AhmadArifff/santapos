'use client';

export default function VisibilityToggle({
  enabled = true,
  onChange,
  title = 'Tampilkan section',
  description = 'Jika nonaktif, section ini tidak ditampilkan di halaman publik.',
}) {
  const isEnabled = enabled !== false;

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/70 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-cream">{title}</p>
          <p className="mt-1 text-xs leading-5 text-slate-400">{description}</p>
        </div>
        <button
          type="button"
          onClick={() => onChange(!isEnabled)}
          className={`relative h-8 w-16 shrink-0 rounded-full border transition ${
            isEnabled
              ? 'border-emerald-400/50 bg-emerald-500/25'
              : 'border-slate-600 bg-slate-700'
          }`}
          aria-pressed={isEnabled}
        >
          <span
            className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition ${
              isEnabled ? 'left-8' : 'left-1'
            }`}
          />
          <span className="sr-only">{isEnabled ? 'Aktif' : 'Nonaktif'}</span>
        </button>
      </div>
      <div
        className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
          isEnabled
            ? 'bg-emerald-500/15 text-emerald-200'
            : 'bg-rose-500/15 text-rose-200'
        }`}
      >
        {isEnabled ? 'Aktif tampil' : 'Nonaktif disembunyikan'}
      </div>
    </div>
  );
}
