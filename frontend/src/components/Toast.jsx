import React, { useEffect } from "react";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";

export default function Toast({ message, type = "success", duration = 4000, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const config = {
    success: {
      bgColor: "bg-emerald-50/95",
      borderColor: "border-emerald-200",
      textColor: "text-emerald-800",
      icon: <CheckCircle className="w-5 h-5 text-emerald-600" />,
    },
    error: {
      bgColor: "bg-rose-50/95",
      borderColor: "border-rose-200",
      textColor: "text-rose-800",
      icon: <AlertCircle className="w-5 h-5 text-rose-600" />,
    },
    info: {
      bgColor: "bg-sky-50/95",
      borderColor: "border-sky-200",
      textColor: "text-sky-800",
      icon: <Info className="w-5 h-5 text-sky-600" />,
    },
  };

  const current = config[type] || config.success;

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${current.bgColor} ${current.borderColor} shadow-lg shadow-slate-200/50 backdrop-blur-md animate-in fade-in slide-in-from-bottom-5 duration-300 max-w-sm w-full`}>
      <div className="flex-shrink-0">{current.icon}</div>
      <div className={`flex-1 text-xs font-semibold ${current.textColor} leading-snug`}>
        {message}
      </div>
      <button
        onClick={onClose}
        className="flex-shrink-0 p-1 rounded-lg hover:bg-black/5 text-slate-400 hover:text-slate-700 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
