import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [photoFile, setPhotoFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (!user) return;
    setName(user.name || "");
    setEmail(user.email || "");
  }, [user]);

  const fetchUser = async () => {
    try {
      const res = await API.get("/users/current-user");
      setUser(res.data.data);
    } catch (err) {
      console.log(err);
    }
  };

  const initials = useMemo(() => {
    if (!user?.name) return "U";
    return user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }, [user?.name]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    API.post("/users/logout").catch(() => {});
    navigate("/login");
  };

  const handleSaveDetails = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      await API.patch("/users/update-details", { name, email });
      setMessage("Profile updated successfully.");
      await fetchUser();
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleUploadPhoto = async (e) => {
    e.preventDefault();
    if (!photoFile) return;
    setUploading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("profilePhoto", photoFile);

      await API.patch("/users/update-profile-photo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMessage("Photo updated successfully.");
      setPhotoFile(null);
      await fetchUser();
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to upload photo.");
    } finally {
      setUploading(false);
    }
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
              className="px-4 py-1.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/[0.07] transition-all"
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
              Account settings
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
            <p className="text-slate-400 mt-2 max-w-xl leading-relaxed">
              Update your details and set a profile photo.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="rounded-2xl border border-white/[0.08] bg-[#0d1120]/60 p-6 shadow-xl shadow-black/30">
            <h2 className="text-lg font-semibold">Personal details</h2>

            {message && (
              <div className="mt-4 rounded-xl border border-white/[0.10] bg-white/[0.04] px-4 py-3 text-sm text-slate-200">
                {message}
              </div>
            )}

            <form onSubmit={handleSaveDetails} className="mt-4 space-y-4">
              <div>
                <label className="text-sm text-slate-300">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/[0.10] bg-white/[0.05] px-4 py-2.5 text-sm outline-none focus:border-emerald-400/60"
                />
              </div>

              <div>
                <label className="text-sm text-slate-300">Email</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/[0.10] bg-white/[0.05] px-4 py-2.5 text-sm outline-none focus:border-emerald-400/60"
                />
              </div>

              <button
                disabled={saving}
                type="submit"
                className="w-full px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 transition-colors font-semibold text-sm disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
            </form>
          </section>

          <section className="rounded-2xl border border-white/[0.08] bg-[#0d1120]/60 p-6 shadow-xl shadow-black/30">
            <h2 className="text-lg font-semibold">Profile photo</h2>
            <p className="text-slate-400 mt-2">
              Upload an image to personalize your Smart Splitter profile.
            </p>

            <div className="mt-4 flex items-center gap-4">
              {user?.profilePhoto ? (
                <img src={user.profilePhoto} alt="profile" className="w-16 h-16 rounded-2xl object-cover border border-white/[0.10]" />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center font-bold">
                  {initials}
                </div>
              )}

              <div className="flex-1">
                <form onSubmit={handleUploadPhoto} className="flex items-end gap-3 flex-wrap">
                  <div className="flex-1 min-w-[220px]">
                    <label className="text-sm text-slate-300">Choose file</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                      className="mt-2 w-full rounded-xl border border-white/[0.10] bg-white/[0.05] px-3 py-2.5 text-sm outline-none focus:border-emerald-400/60"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={uploading || !photoFile}
                    className="px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 transition-colors font-semibold text-sm disabled:opacity-60"
                  >
                    {uploading ? "Uploading..." : "Upload"}
                  </button>
                </form>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

