'use client';

export default function FloatButtonPreview({ settings }) {
  if (!settings) {
    return (
      <div className="flex items-center justify-center h-32 text-slate-500">
        No float button settings
      </div>
    );
  }

  return (
    <div className="bg-slate-950 p-8 relative h-48">
      <div className="absolute bottom-6 right-6">
        <div className="w-14 h-14 rounded-full bg-green-600 text-white flex items-center justify-center shadow-lg text-sm font-semibold">
          {settings.icon || 'Chat'}
        </div>
      </div>
      <div className="text-slate-400 text-xs">
        <p>URL: {settings.href || '-'}</p>
        <p className="mt-1">Aria Label: {settings.ariaLabel || '-'}</p>
      </div>
    </div>
  );
}
