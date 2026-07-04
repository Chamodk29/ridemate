export default function PostCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-pulse">
      <div className="h-0.5 bg-slate-100" />
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-200 flex-shrink-0" />
            <div className="space-y-1.5">
              <div className="h-3.5 w-28 bg-slate-200 rounded-full" />
              <div className="h-3 w-16 bg-slate-100 rounded-full" />
            </div>
          </div>
          <div className="h-6 w-20 bg-slate-100 rounded-full" />
        </div>

        {/* Route */}
        <div className="bg-slate-50 rounded-xl p-3 mb-3 flex items-center gap-2">
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-3/4 bg-slate-200 rounded-full" />
            <div className="h-3 w-2/4 bg-slate-200 rounded-full" />
          </div>
          <div className="w-6 h-6 bg-slate-200 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-3/4 bg-slate-200 rounded-full" />
            <div className="h-3 w-2/4 bg-slate-200 rounded-full" />
          </div>
        </div>

        {/* Badges */}
        <div className="flex gap-2 mb-3">
          <div className="h-6 w-20 bg-slate-100 rounded-full" />
          <div className="h-6 w-16 bg-slate-100 rounded-full" />
          <div className="h-6 w-24 bg-slate-100 rounded-full" />
        </div>

        {/* Description */}
        <div className="space-y-2 mb-4">
          <div className="h-3 w-full bg-slate-100 rounded-full" />
          <div className="h-3 w-5/6 bg-slate-100 rounded-full" />
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-3 border-t border-slate-50">
          <div className="h-8 w-24 bg-slate-100 rounded-xl" />
          <div className="h-8 w-24 bg-slate-100 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
