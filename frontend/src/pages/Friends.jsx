import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import { loadSmartSplitterStore, newId, saveSmartSplitterStore } from "../utils/smartSplitterStore";

export default function Friends() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const [store, setStore] = useState(() => loadSmartSplitterStore());
  const [friendName, setFriendName] = useState("");

  useEffect(() => {
    // Keep in sync when other tabs update localStorage.
    const onStorage = () => setStore(loadSmartSplitterStore());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const fetchUser = async () => {
    try {
      const res = await API.get("/users/current-user");
      setUser(res.data.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  const handleLogout = () => {
    localStorage.removeItem("token");
    API.post("/users/logout").catch(() => {});
    navigate("/login");
  };

  const derivedFriendsFromGroups = useMemo(() => {
    if (!store.groups.length) return [];
    const selfKey = user?.email || user?.name || "";
    const names = new Set();

    store.groups.forEach((g) => {
      (g.members || []).forEach((m) => {
        const key = m.id || m.name;
        if (!key) return;
        // Hide the current user from the derived list.
        if (selfKey && (m.id === selfKey || m.name === selfKey)) return;
        // Heuristic: if current user key matches member id/name, skip.
        if (!selfKey && user?.name && m.name === user.name) return;
        names.add(`${m.name}`);
      });
    });

    return Array.from(names)
      .filter(Boolean)
      .map((name) => ({ id: name.toLowerCase(), name }));
  }, [store.groups, user?.email, user?.name]);

  const handleAddFriend = (e) => {
    e.preventDefault();
    const trimmed = friendName.trim();
    if (!trimmed) return;

    const next = loadSmartSplitterStore();
    const exists = next.friends.some((f) => (f.name || "").toLowerCase() === trimmed.toLowerCase());
    if (exists) return;

    const friend = {
      id: newId(),
      name: trimmed,
      createdAt: new Date().toISOString(),
    };

    const updated = { ...next, friends: [friend, ...next.friends] };
    saveSmartSplitterStore(updated);
    setStore(updated);
    setFriendName("");
  };

  return (
    <div className="min-h-screen bg-[#0b0f1a] text-white">
      {/* NAVBAR */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0d1120]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <button onClick={() => navigate("/")} className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-4H9l3-6 3 6h-2v4z" />
              </svg>
            </div>
            <span className="text-base font-semibold tracking-tight">
              Smart<span className="text-emerald-400">Splitter</span>
            </span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/dashboard")}
              className="px-4 py-1.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/[0.07] transition-all"
            >
              Dashboard
            </button>
            <button
              onClick={() => navigate("/friends")}
              className="px-4 py-1.5 rounded-lg text-sm bg-white/[0.07] text-white transition-all"
            >
              Friends
            </button>

            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.05] pl-1 pr-3 py-1 hover:bg-white/[0.09] transition-all"
              >
                {user?.profilePhoto ? (
                  <img src={user.profilePhoto} alt="profile" className="w-7 h-7 rounded-lg object-cover" />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-xs font-bold">
                    {initials}
                  </div>
                )}
                <span className="text-sm text-slate-300 max-w-[90px] truncate hidden sm:block">
                  {user?.name || "Account"}
                </span>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform ${menuOpen ? "rotate-180" : ""}`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-44 rounded-xl border border-white/[0.08] bg-[#141928] shadow-2xl shadow-black/60 py-1.5 z-50">
                  <button
                    onClick={() => {
                      navigate("/profile");
                      setMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/[0.07] transition-all flex items-center gap-2.5"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
                      <circle cx="12" cy="8" r="4" />
                      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                    </svg>
                    Profile
                  </button>
                  <div className="my-1.5 border-t border-white/[0.06]" />
                  <button
                    onClick={() => {
                      handleLogout();
                      setMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/[0.08] transition-all flex items-center gap-2.5"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex items-start justify-between gap-6 flex-wrap mb-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-1 text-xs font-medium text-emerald-400 mb-3">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Friends & contacts
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Your people</h1>
            <p className="text-slate-400 mt-2 max-w-xl leading-relaxed">
              Add friends and quickly create a shared group to split expenses.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="rounded-2xl border border-white/[0.08] bg-[#0d1120]/60 p-6 shadow-xl shadow-black/30">
            <h2 className="text-lg font-semibold">Add a friend</h2>
            <form onSubmit={handleAddFriend} className="mt-4 flex items-end gap-3 flex-wrap">
              <div className="flex-1 min-w-[220px]">
                <label className="text-sm text-slate-300">Name</label>
                <input
                  value={friendName}
                  onChange={(e) => setFriendName(e.target.value)}
                  placeholder="e.g. Rahul"
                  className="mt-2 w-full rounded-xl border border-white/[0.10] bg-white/[0.05] px-4 py-2.5 text-sm outline-none focus:border-emerald-400/60"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 transition-colors font-semibold text-sm"
              >
                Add
              </button>
            </form>

            <div className="mt-6">
              <h3 className="text-sm font-semibold text-slate-300">Saved friends</h3>
              {store.friends.length === 0 ? (
                <p className="text-slate-400 mt-3">No friends added yet.</p>
              ) : (
                <div className="mt-3 space-y-3">
                  {store.friends.map((f) => (
                    <div key={f.id} className="flex items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
                      <div>
                        <div className="font-medium">{f.name}</div>
                        <div className="text-xs text-slate-400">
                          Added {new Date(f.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/dashboard?createGroup=1&invite=${encodeURIComponent(f.name)}`)}
                        className="px-4 py-2 rounded-xl border border-white/[0.10] bg-white/[0.04] hover:bg-white/[0.07] transition-colors text-sm font-semibold"
                      >
                        Create group
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-white/[0.08] bg-[#0d1120]/60 p-6 shadow-xl shadow-black/30">
            <h2 className="text-lg font-semibold">From your groups</h2>
            <p className="text-slate-400 mt-2">
              Members you already split with will show up here for convenience.
            </p>

            {derivedFriendsFromGroups.length === 0 ? (
              <p className="text-slate-400 mt-4">No group members yet. Create a group to populate this.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {derivedFriendsFromGroups.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center justify-between gap-3 border-b border-white/[0.06] pb-3"
                  >
                    <div className="font-medium">{f.name}</div>
                    <button
                      onClick={() => navigate(`/dashboard?createGroup=1&invite=${encodeURIComponent(f.name)}`)}
                      className="px-4 py-2 rounded-xl border border-white/[0.10] bg-white/[0.04] hover:bg-white/[0.07] transition-colors text-sm font-semibold"
                    >
                      Invite
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

