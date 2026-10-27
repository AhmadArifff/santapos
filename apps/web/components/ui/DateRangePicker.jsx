'use client';

import { useEffect, useState } from 'react';

const toDateKey = (date) => {
  if (!date) return '';
  const value = date instanceof Date ? date : new Date(`${date}T00:00:00`);
  if (Number.isNaN(value.getTime())) return '';
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const fromDateKey = (value) => {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const normalizeDate = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const formatShortDate = (value) => {
  const date = value instanceof Date ? value : fromDateKey(value);
  if (!date) return '';
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

const isSameDate = (a, b) => (
  a && b && normalizeDate(a).getTime() === normalizeDate(b).getTime()
);

const isWithinRange = (date, start, end) => {
  if (!date || !start || !end) return false;
  const time = normalizeDate(date).getTime();
  return time >= normalizeDate(start).getTime() && time <= normalizeDate(end).getTime();
};

export default function DateRangePicker({
  label = 'Range tanggal',
  value = { start: '', end: '' },
  onChange,
  onClear,
  placeholder = 'Pilih range tanggal',
  helperText = 'Klik tanggal awal, lalu klik tanggal akhir',
  className = '',
}) {
  const currentStart = fromDateKey(value.start);
  const currentEnd = fromDateKey(value.end);
  const anchorDate = currentStart || new Date();
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(anchorDate.getMonth());
  const [viewYear, setViewYear] = useState(anchorDate.getFullYear());
  const [draftStart, setDraftStart] = useState(currentStart);
  const [draftEnd, setDraftEnd] = useState(currentEnd);

  useEffect(() => {
    const nextStart = fromDateKey(value.start);
    const nextEnd = fromDateKey(value.end);
    const nextAnchor = nextStart || new Date();
    setViewMonth(nextAnchor.getMonth());
    setViewYear(nextAnchor.getFullYear());
    setDraftStart(nextStart);
    setDraftEnd(nextEnd);
  }, [value.start, value.end]);

  const monthTitle = new Date(viewYear, viewMonth, 1).toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
  });
  const firstDay = new Date(viewYear, viewMonth, 1);
  const offset = (firstDay.getDay() + 6) % 7;
  const totalDays = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = [
    ...Array.from({ length: offset }, (_, index) => ({ key: `empty-${index}`, empty: true })),
    ...Array.from({ length: totalDays }, (_, index) => ({
      key: `day-${index + 1}`,
      date: new Date(viewYear, viewMonth, index + 1),
    })),
  ];

  const moveMonth = (direction) => {
    const next = new Date(viewYear, viewMonth + direction, 1);
    setViewMonth(next.getMonth());
    setViewYear(next.getFullYear());
  };

  const pickDate = (date) => {
    const selected = normalizeDate(date);
    if (!draftStart || draftEnd) {
      setDraftStart(selected);
      setDraftEnd(null);
      return;
    }

    const current = normalizeDate(draftStart);
    const start = selected.getTime() < current.getTime() ? selected : current;
    const end = selected.getTime() < current.getTime() ? current : selected;
    setDraftStart(start);
    setDraftEnd(end);
    onChange?.({ start: toDateKey(start), end: toDateKey(end) });
    setOpen(false);
  };

  const hasRange = Boolean(value.start && value.end);

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((state) => !state)}
        className="flex min-h-[58px] w-full items-center justify-between gap-3 rounded-xl border border-slate-600 bg-slate-700 px-3 py-2 text-left text-white transition hover:border-orange-500/70 focus:outline-none focus:ring-1 focus:ring-orange-500"
      >
        <span className="min-w-0">
          <span className="block text-xs font-semibold text-slate-300">{label}</span>
          <span className="mt-0.5 block truncate text-sm font-black">
            {hasRange ? `${formatShortDate(value.start)} - ${formatShortDate(value.end)}` : placeholder}
          </span>
        </span>
        <span className="shrink-0 rounded-lg bg-orange-500/15 px-2.5 py-1 text-xs font-black text-orange-300">
          Kalender
        </span>
      </button>

      {open && (
        <div className="absolute left-0 z-50 mt-3 w-[min(92vw,380px)] rounded-3xl border border-slate-700 bg-slate-900 p-4 shadow-2xl shadow-black/40 md:left-auto md:right-0">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => moveMonth(-1)}
              className="h-10 w-10 rounded-2xl border border-slate-700 text-lg font-black text-slate-200 transition hover:border-orange-400 hover:text-orange-200"
              aria-label="Bulan sebelumnya"
            >
              {'<'}
            </button>
            <div className="min-w-0 text-center">
              <p className="text-sm font-black text-white">{monthTitle}</p>
              <p className="text-[11px] font-medium text-slate-400">{helperText}</p>
            </div>
            <button
              type="button"
              onClick={() => moveMonth(1)}
              className="h-10 w-10 rounded-2xl border border-slate-700 text-lg font-black text-slate-200 transition hover:border-orange-400 hover:text-orange-200"
              aria-label="Bulan berikutnya"
            >
              {'>'}
            </button>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[11px] font-black uppercase text-slate-500">
            {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-7 gap-1">
            {cells.map((cell) => {
              if (cell.empty) return <span key={cell.key} className="h-10" />;
              const activeStart = isSameDate(cell.date, draftStart);
              const activeEnd = isSameDate(cell.date, draftEnd);
              const inRange = isWithinRange(cell.date, draftStart, draftEnd);
              return (
                <button
                  key={cell.key}
                  type="button"
                  onClick={() => pickDate(cell.date)}
                  className={[
                    'h-10 rounded-2xl text-sm font-bold transition-all',
                    activeStart || activeEnd
                      ? 'bg-orange-400 text-slate-950 shadow-lg shadow-orange-500/20'
                      : inRange
                        ? 'bg-orange-500/15 text-orange-100'
                        : 'text-slate-300 hover:bg-slate-800',
                  ].join(' ')}
                >
                  {cell.date.getDate()}
                </button>
              );
            })}
          </div>

          {onClear && (
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  onClear();
                  setOpen(false);
                }}
                className="rounded-xl border border-slate-700 px-3 py-2 text-xs font-bold text-slate-300 transition hover:border-orange-500/60 hover:text-orange-300"
              >
                Hapus range
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
