'use client';

export default function LocationsPreview({ settings }) {
  if (!settings) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        No locations settings
      </div>
    );
  }

  const branches = settings.branches || [];
  const activeBranch = branches[0];

  return (
    <div className="bg-slate-950 text-cream p-6">
      <div className="mb-5">
        <p className="text-xs uppercase tracking-wider text-yellow-500">{settings.sectionLabel}</p>
        <h3 className="text-2xl font-bold mt-2">
          Temukan <span className="italic text-yellow-500">{settings.highlight}</span>
        </h3>
        <p className="text-sm text-slate-300 mt-2">{settings.description}</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {branches.map((branch, idx) => (
          <span
            key={branch.id || idx}
            className={`px-3 py-1 rounded-full text-xs border ${
              idx === 0 ? 'bg-yellow-500 text-slate-950 border-yellow-500' : 'border-slate-600 text-slate-300'
            }`}
          >
            {branch.tabLabel}
          </span>
        ))}
      </div>

      {activeBranch ? (
        <div className="grid grid-cols-1 gap-4">
          <div className="grid grid-cols-3 gap-2">
            {(activeBranch.gallery || []).slice(0, 3).map((image, idx) => (
              <div key={idx} className="h-20 rounded border border-slate-700 overflow-hidden bg-slate-900">
                {image ? (
                  <img src={image} alt={`${activeBranch.name} ${idx + 1}`} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full" />
                )}
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
            <p className="text-xs text-yellow-500">{activeBranch.sectionTag}</p>
            <p className="font-semibold text-lg mt-1">{activeBranch.name}</p>
            <p className="text-sm text-slate-300">{activeBranch.area}</p>
            <div className="mt-3 space-y-2">
              {(activeBranch.details || []).map((detail, idx) => (
                <p key={idx} className="text-xs text-slate-300">
                  <span className="mr-2">{detail.icon}</span>
                  {Array.isArray(detail.lines) ? detail.lines.join(' | ') : detail.text}
                </p>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-slate-500">No branches</div>
      )}
    </div>
  );
}
