import React from "react";
import { Search, Loader2, X } from "lucide-react";

export default function SearchBar({
  value,
  onChange,
  onSearch,
  onClear,
  loading,
  placeholder = "Search friends by email...",
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (value.trim()) {
      onSearch(value.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full relative group">
      <div className="relative flex items-center">
        <div className="absolute left-4 text-slate-400 pointer-events-none group-focus-within:text-emerald-600 transition-colors">
          <Search className="w-5 h-5" />
        </div>

        <input
          type="email"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-28 py-3.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-sm"
        />

        <div className="absolute right-2 flex items-center gap-2">
          {value && (
            <button
              type="button"
              onClick={onClear}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            type="submit"
            disabled={loading || !value.trim()}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold text-xs transition-all flex items-center gap-1.5 h-9"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              "Search"
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
