'use client';

import { useState } from 'react';

export default function AccordionSection({
  title,
  children,
  defaultOpen = false,
  icon = null,
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="accordion-item border border-slate-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between bg-slate-800 hover:bg-slate-700 transition-colors text-left"
      >
        <span className="flex items-center gap-2 font-medium text-cream">
          {icon && <span className="text-lg">{icon}</span>}
          {title}
        </span>
        <span className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="accordion-content p-6 bg-slate-900 border-t border-slate-700 space-y-4">
          {children}
        </div>
      )}
    </div>
  );
}
