import React, { useState } from "react";
import { Check, X, Loader2 } from "lucide-react";

export default function PendingRequestCard({ request, onAccept, onReject }) {
  const { _id, sender } = request;
  const { name, email, profilePhoto } = sender || {};

  const [actionLoading, setActionLoading] = useState(null); // 'accept' or 'reject'

  const handleAccept = async () => {
    setActionLoading("accept");
    try {
      await onAccept(_id, sender);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    setActionLoading("reject");
    try {
      await onReject(_id, name);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "R";

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50/40 hover:bg-slate-50/80 p-4 transition-all group shadow-sm">
      <div className="flex items-center gap-3.5 min-w-0">
        {profilePhoto ? (
          <img
            src={profilePhoto}
            alt={name}
            className="w-10 h-10 rounded-full border border-slate-200 object-cover bg-slate-50"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center font-bold text-xs text-white border border-indigo-200 shadow-inner">
            {initials}
          </div>
        )}

        <div className="min-w-0">
          <h4 className="font-bold text-sm text-slate-800 truncate group-hover:text-slate-900 transition-colors">
            {name}
          </h4>
          <p className="text-[11px] text-slate-500 truncate mt-0.5">{email}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          disabled={actionLoading !== null}
          onClick={handleAccept}
          className="p-1.8 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 hover:text-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed border border-emerald-200 shadow-sm transition-all flex items-center justify-center"
          title="Accept Friend Request"
        >
          {actionLoading === "accept" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
        </button>

        <button
          disabled={actionLoading !== null}
          onClick={handleReject}
          className="p-1.8 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 disabled:opacity-50 disabled:cursor-not-allowed border border-rose-200 shadow-sm transition-all flex items-center justify-center"
          title="Reject Friend Request"
        >
          {actionLoading === "reject" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <X className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}
