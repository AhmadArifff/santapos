'use client';

export default function FooterPreview({ settings }) {
  if (!settings) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        No footer settings
      </div>
    );
  }

  const socialLinks = settings.socialLinks || [];
  const columns = settings.columns || [];

  return (
    <div className="bg-slate-950 text-cream p-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <h4 className="font-bold text-yellow-500">{settings.brand}</h4>
          <p className="text-xs text-slate-300 mt-2">{settings.brandDescription}</p>
          <div className="flex gap-2 mt-3">
            {socialLinks.map((social, idx) => (
              <span key={idx} className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs">
                {social.icon}
              </span>
            ))}
          </div>
        </div>

        {columns.map((column, idx) => (
          <div key={idx}>
            <h5 className="font-semibold text-sm mb-2">{column.title}</h5>
            <div className="space-y-1">
              {(column.links || []).slice(0, 5).map((link, lIdx) => (
                <p key={lIdx} className="text-xs text-slate-400">{link.label}</p>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-700 mt-5 pt-4">
        <p className="text-xs text-slate-300">{settings.copyright}</p>
        <p className="text-xs text-slate-500 mt-1">{settings.note}</p>
      </div>
    </div>
  );
}
