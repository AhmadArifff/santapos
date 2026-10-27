'use client';

function Shimmer({ className = '', style }) {
  return (
    <>
      <div className={`relative overflow-hidden rounded-xl bg-slate-800/80 ${className}`} style={style}>
        <div className="absolute inset-0 -translate-x-full animate-[skeletonShimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>
      <style jsx global>{`
        @keyframes skeletonShimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </>
  );
}

export function CardSkeleton({ count = 4 }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-4">
          <Shimmer className="h-3 w-24" />
          <Shimmer className="mt-4 h-7 w-28" />
          <Shimmer className="mt-3 h-3 w-36" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 6, cols = 5 }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/80">
      <div className="border-b border-slate-700/50 p-4">
        <Shimmer className="h-4 w-48" />
      </div>
      <div className="divide-y divide-slate-800/70">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="grid gap-4 p-4" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
            {Array.from({ length: cols }).map((__, colIndex) => (
              <Shimmer key={colIndex} className={`h-4 ${colIndex === 0 ? 'w-full' : 'w-4/5'}`} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <div>
        <Shimmer className="h-4 w-28" />
        <div className="mt-3 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-2xl border border-slate-700/60 bg-slate-800/80 p-4">
              <div className="flex items-start justify-between">
                <Shimmer className="h-3 w-24" />
                <Shimmer className="h-7 w-7 rounded-full" />
              </div>
              <Shimmer className="mt-4 h-7 w-32" />
              <Shimmer className="mt-3 h-3 w-28" />
            </div>
          ))}
        </div>
      </div>

      <div>
        <Shimmer className="h-4 w-40" />
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-2xl border border-slate-700/60 bg-slate-800/80 p-4">
              <Shimmer className="h-3 w-28" />
              <Shimmer className="mt-4 h-7 w-36" />
              <Shimmer className="mt-3 h-3 w-24" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-5">
            <div className="flex items-center justify-between">
              <Shimmer className="h-5 w-40" />
              <Shimmer className="h-8 w-28 rounded-full" />
            </div>
            <div className="mt-6 flex h-64 items-end gap-2">
              {Array.from({ length: 14 }).map((__, barIndex) => (
                <Shimmer
                  key={barIndex}
                  className="flex-1 rounded-t-xl"
                  style={{ height: `${28 + ((barIndex * 17) % 62)}%` }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <TableSkeleton rows={5} cols={5} />
        <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-5">
          <Shimmer className="h-5 w-36" />
          <div className="mt-5 space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3">
                <Shimmer className="h-10 w-10 rounded-xl" />
                <div className="flex-1">
                  <Shimmer className="h-3 w-32" />
                  <Shimmer className="mt-2 h-3 w-20" />
                </div>
                <Shimmer className="h-6 w-14 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function StockMasterSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Shimmer className="h-4 w-28" />
          <Shimmer className="mt-2 h-3 w-72 max-w-full" />
        </div>
        <div className="flex gap-2">
          <Shimmer className="h-9 w-20 rounded-xl" />
          <Shimmer className="h-9 w-32 rounded-xl" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-slate-700/60 bg-slate-800/80 p-4">
            <div className="flex justify-between gap-3">
              <div>
                <Shimmer className="h-4 w-24" />
                <Shimmer className="mt-2 h-3 w-14" />
              </div>
              <Shimmer className="h-6 w-20 rounded-full" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Shimmer className="h-20 rounded-xl" />
              <Shimmer className="h-20 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
      <TableSkeleton rows={8} cols={7} />
    </div>
  );
}

export function StockWarehouseSkeleton({ mode = 'summary' }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Shimmer className="h-8 w-24 rounded-xl" />
        <Shimmer className="h-8 w-24 rounded-xl" />
        <Shimmer className="h-8 w-28 rounded-xl" />
        {mode === 'in' && <Shimmer className="ml-auto h-9 w-36 rounded-xl" />}
      </div>
      {mode === 'summary' && <CardSkeleton count={3} />}
      {mode !== 'summary' && (
        <div className="flex flex-wrap gap-2">
          <Shimmer className="h-9 w-24 rounded-xl" />
          <Shimmer className="h-9 w-24 rounded-xl" />
          <Shimmer className="h-9 w-24 rounded-xl" />
          <Shimmer className="h-9 w-32 rounded-xl" />
          <Shimmer className="h-9 w-28 rounded-xl" />
        </div>
      )}
      <Shimmer className="h-14 w-full rounded-xl" />
      <TableSkeleton rows={7} cols={mode === 'summary' ? 6 : mode === 'in' ? 9 : 10} />
    </div>
  );
}

export function StockRequestSkeleton({ count = 3 }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Shimmer className="h-9 w-32 rounded-xl" />
        <Shimmer className="h-9 w-32 rounded-xl" />
        <Shimmer className="h-8 w-20 rounded-xl" />
        <Shimmer className="h-8 w-24 rounded-xl" />
        <Shimmer className="h-8 w-20 rounded-xl" />
      </div>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-800/80">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-700/40 p-4">
            <div className="flex items-center gap-3">
              <Shimmer className="h-9 w-9 rounded-full" />
              <div>
                <Shimmer className="h-4 w-32" />
                <Shimmer className="mt-2 h-3 w-44" />
              </div>
            </div>
            <Shimmer className="h-9 w-24 rounded-xl" />
          </div>
          <div className="p-4">
            <TableSkeleton rows={3} cols={6} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SettingsPageSkeleton({ sections = 8 }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <Shimmer className="h-10 w-32 rounded" />
        <Shimmer className="h-10 w-24 rounded" />
        <Shimmer className="h-10 w-40 rounded" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[560px_minmax(0,1fr)]">
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
          <div className="flex items-center justify-between border-b border-slate-700 pb-4">
            <Shimmer className="h-6 w-32" />
            <Shimmer className="h-10 w-44 rounded" />
          </div>
          <div className="mt-6 space-y-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index}>
                <Shimmer className="h-3 w-28" />
                <Shimmer className={`${index % 3 === 2 ? 'h-24' : 'h-11'} mt-2 w-full rounded`} />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
          <div className="mb-4 flex items-center justify-between px-2">
            <Shimmer className="h-6 w-44" />
            <Shimmer className="h-4 w-28" />
          </div>
          <div className="overflow-hidden rounded border border-slate-700 bg-slate-950">
            <div className="relative h-[78vh] p-6">
              <Shimmer className="h-12 w-44" />
              <Shimmer className="mt-8 h-16 w-3/5" />
              <Shimmer className="mt-4 h-4 w-2/5" />
              <div className="mt-10 grid grid-cols-3 gap-4">
                <Shimmer className="h-28 rounded-2xl" />
                <Shimmer className="h-28 rounded-2xl" />
                <Shimmer className="h-28 rounded-2xl" />
              </div>
              <Shimmer className="absolute bottom-6 left-6 h-28 w-[calc(100%-3rem)] rounded-3xl" />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
        <Shimmer className="h-6 w-32" />
        <div className="mt-6 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: sections }).map((_, index) => (
            <Shimmer key={index} className="h-12 rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function OrderCardSkeleton({ count = 3 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="rounded-3xl border border-slate-700/60 bg-slate-900/80 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex-1">
              <div className="flex gap-2">
                <Shimmer className="h-6 w-24 rounded-full" />
                <Shimmer className="h-6 w-28 rounded-full" />
              </div>
              <Shimmer className="mt-4 h-7 w-48" />
              <Shimmer className="mt-3 h-4 w-72 max-w-full" />
            </div>
            <div className="w-44">
              <Shimmer className="h-3 w-24" />
              <Shimmer className="mt-3 h-8 w-36" />
            </div>
          </div>
          <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_176px]">
            <div className="rounded-2xl bg-slate-950/50 p-3">
              <Shimmer className="h-4 w-full" />
              <Shimmer className="mt-3 h-4 w-5/6" />
              <Shimmer className="mt-3 h-4 w-3/4" />
            </div>
            <div className="grid gap-2">
              <Shimmer className="h-9 w-full" />
              <Shimmer className="h-9 w-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SectionSkeleton({ type = 'table' }) {
  return (
    <div className="space-y-4">
      <CardSkeleton />
      {type === 'orders' ? <OrderCardSkeleton /> : <TableSkeleton />}
    </div>
  );
}
