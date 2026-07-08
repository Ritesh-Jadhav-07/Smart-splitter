import React from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

export default function ConfirmationModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "danger", // 'danger' | 'warning' | 'info'
  loading = false,
}) {
  if (!isOpen) return null;

  const typeConfig = {
    danger: {
      btnClass: "bg-red-600 hover:bg-red-700 text-white shadow-red-600/10",
      icon: <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />,
    },
    warning: {
      btnClass: "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/10",
      icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
    },
    info: {
      btnClass: "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/10",
      icon: null,
    },
  };

  const current = typeConfig[type] || typeConfig.danger;

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex justify-center items-center px-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white shadow-2xl p-6 animate-in zoom-in-95 duration-200">
        <div className="flex items-start gap-4">
          {current.icon && (
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex-shrink-0">
              {current.icon}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-slate-800">{title}</h3>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-all"
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 ${current.btnClass}`}
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
