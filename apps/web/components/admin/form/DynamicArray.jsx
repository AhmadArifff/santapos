'use client';

export default function DynamicArray({
  items = [],
  onAdd,
  onRemove,
  renderItem,
  label,
  addButtonLabel = '+ Add Item',
  emptyMessage = 'No items yet',
  maxItems,
}) {
  return (
    <div className="dynamic-array space-y-3">
      {label && <label className="form-label">{label}</label>}

      {items.length === 0 ? (
        <p className="text-sm text-gray-400 italic">{emptyMessage}</p>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="array-item p-3 bg-slate-800 rounded border border-slate-700">
              {renderItem(item, index)}
              <button
                onClick={() => onRemove(index)}
                className="mt-2 text-xs px-2 py-1 bg-red-900/30 text-red-400 rounded hover:bg-red-900/50 transition-colors"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {(!maxItems || items.length < maxItems) && (
        <button
          onClick={onAdd}
          className="btn-secondary w-full py-2"
        >
          {addButtonLabel}
        </button>
      )}
    </div>
  );
}
