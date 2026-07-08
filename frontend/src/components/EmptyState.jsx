import React from "react";

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}) {
  return (
    <div className="rounded-2xl border border-slate-200/60 bg-slate-50/20 p-8 text-center flex flex-col items-center justify-center">
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-slate-100/80 border border-slate-200 flex items-center justify-center mb-4 text-slate-500 shadow-inner">
          <Icon className="w-6 h-6" />
        </div>
      )}
      <h3 className="text-base font-bold text-slate-800">{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 mt-2 max-w-sm leading-relaxed">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-95 text-white text-xs font-semibold shadow-md shadow-emerald-500/10 transition-all"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
