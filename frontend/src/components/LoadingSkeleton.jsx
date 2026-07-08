import React from "react";

export default function LoadingSkeleton({ variant = "card", count = 3 }) {
  const skeletons = Array.from({ length: count });

  if (variant === "list") {
    return (
      <div className="space-y-3">
        {skeletons.map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4 animate-pulse"
          >
            <div className="w-10 h-10 rounded-full bg-slate-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 rounded w-1/3" />
              <div className="h-3 bg-slate-200 rounded w-1/2" />
            </div>
            <div className="flex gap-2">
              <div className="w-8 h-8 bg-slate-200 rounded-lg" />
              <div className="w-8 h-8 bg-slate-200 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Grid / Card Layout Skeleton
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {skeletons.map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-slate-200/80 bg-white p-5 flex flex-col justify-between animate-pulse shadow-sm"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-200" />
            <div className="flex-1 space-y-2.5">
              <div className="h-4 bg-slate-200 rounded w-2/3" />
              <div className="h-3 bg-slate-200 rounded w-1/2" />
              <div className="h-5 bg-slate-100 rounded-full w-1/4 mt-1" />
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            <div className="h-9 bg-slate-200 rounded-xl w-[45%]" />
            <div className="h-9 bg-slate-200 rounded-xl w-[45%]" />
          </div>
        </div>
      ))}
    </div>
  );
}
