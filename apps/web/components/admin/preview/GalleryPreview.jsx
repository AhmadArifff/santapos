'use client';

export default function GalleryPreview({ settings }) {
  if (!settings) {
    return (
      <div className="flex items-center justify-center h-40 text-slate-500">
        No gallery settings
      </div>
    );
  }

  const images = settings.images || [];

  return (
    <div className="bg-slate-950 p-4">
      <div className="flex gap-3 overflow-x-auto">
        {images.map((imageItem, idx) => (
          <div key={imageItem.id || idx} className="min-w-[140px] h-24 rounded border border-slate-700 overflow-hidden bg-slate-900">
            {imageItem.image ? (
              <img src={imageItem.image} alt={imageItem.alt || `Gallery ${idx + 1}`} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
                No image
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
