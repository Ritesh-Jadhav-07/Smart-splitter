import React from "react";
import { UserMinus } from "lucide-react";

export default function FriendCard({ friend, onUnfriend }) {
  return (
    <div className="p-4 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-4 shadow-sm hover:border-slate-300 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        {friend.profilePhoto ? (
          <img
            src={friend.profilePhoto}
            alt={friend.name}
            className="w-11 h-11 rounded-full border border-slate-200 object-cover bg-white flex-shrink-0"
          />
        ) : (
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center font-bold text-xs text-white border border-emerald-200 shadow-inner flex-shrink-0">
            {friend.name
              ? friend.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
              : "F"}
          </div>
        )}
        <div className="min-w-0">
          <h4 className="font-bold text-sm text-slate-800 truncate">
            {friend.name}
          </h4>
          <p className="text-xs text-slate-500 truncate mt-0.5">
            {friend.email}
          </p>
        </div>
      </div>

      {/* REPLACED VIEW PROFILE/MESSAGE BUTTON WITH UNFRIEND ACTION */}
      <button
        onClick={() => onUnfriend(friend)}
        className="flex-shrink-0 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50/50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 font-semibold text-xs transition-all flex items-center gap-1"
      >
        <UserMinus className="w-3.5 h-3.5" />
        Unfriend
      </button>
    </div>
  );
}