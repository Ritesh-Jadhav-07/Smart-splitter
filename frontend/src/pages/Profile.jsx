import React, { useEffect, useMemo, useState } from "react";
import API from "../api/axios";
import Navbar from "../components/Navbar";
import { User, Mail, Camera, FileText, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export default function Profile() {
  const [user, setUser] = useState(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const [photoFile, setPhotoFile] = useState(null);
  const [uploading, setUploading] = useState(false);

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

  useEffect(() => {
    if (!user) return;
    setName(user.name || "");
    setEmail(user.email || "");
  }, [user]);

  const initials = useMemo(() => {
    if (!user?.name) return "U";
    return user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }, [user?.name]);

  const handleSaveDetails = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setIsError(false);
    try {
      await API.patch("/users/update-details", { name, email });
      setMessage("Profile details updated successfully.");
      await fetchUser();
    } catch (err) {
      setIsError(true);
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
    setIsError(false);

    try {
      const formData = new FormData();
      formData.append("profilePhoto", photoFile);

      await API.patch("/users/update-profile-photo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMessage("Profile photo updated successfully.");
      setPhotoFile(null);
      await fetchUser();
    } catch (err) {
      setIsError(true);
      setMessage(err.response?.data?.message || "Failed to upload photo.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif" }}
      className="min-h-screen bg-[#f8fafc] text-slate-800 selection:bg-emerald-500/20 selection:text-emerald-700 overflow-x-hidden relative"
    >
      {/* LIGHT METROPOLITAN AMBIENT GLOW EFFECTS */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none opacity-40 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-200 via-sky-100 to-transparent blur-[100px] z-0" />

      {/* NAVBAR */}
      <Navbar />

      <main className="relative mx-auto max-w-6xl px-6 py-10 z-10">
        {/* PAGE HEADER */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm mb-3">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Account settings
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">Profile</h1>
          <p className="text-slate-500 mt-2 max-w-xl leading-relaxed">
            Update your account details and manage your EquiPay avatar profile photo.
          </p>
        </div>

        {message && (
          <div
            className={`mb-6 flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-semibold border ${
              isError
                ? "bg-rose-50 text-rose-600 border-rose-100"
                : "bg-emerald-50 text-emerald-600 border-emerald-100"
            } animate-in fade-in slide-in-from-top-2 duration-200`}
          >
            {isError ? (
              <AlertCircle className="h-4.5 w-4.5 shrink-0 text-rose-500" />
            ) : (
              <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-emerald-500" />
            )}
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Details */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-200/30 relative overflow-hidden">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <User className="w-4.5 h-4.5 text-slate-400" />
              Personal Details
            </h2>

            <form onSubmit={handleSaveDetails} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                    required
                  />
                </div>
              </div>

              <button
                disabled={saving}
                type="submit"
                className="w-full px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-95 text-white transition-all font-bold text-sm shadow-md shadow-emerald-500/10 flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? "Saving..." : "Save changes"}
              </button>
            </form>
          </section>

          {/* Profile Photo */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-200/30 relative overflow-hidden flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                <Camera className="w-4.5 h-4.5 text-slate-400" />
                Profile Photo
              </h2>
              <p className="text-slate-500 text-sm mb-6">
                Upload an image to personalize your EquiPay profile badge avatar.
              </p>

              <div className="flex items-center gap-5 flex-wrap">
                {user?.profilePhoto ? (
                  <img
                    src={user.profilePhoto}
                    alt="profile"
                    className="w-20 h-20 rounded-2xl object-cover border border-slate-200 shadow-sm bg-slate-50"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center font-extrabold text-xl text-white border border-emerald-400/20 shadow-inner">
                    {initials}
                  </div>
                )}

                <div className="flex-1 min-w-[220px]">
                  <form onSubmit={handleUploadPhoto} className="flex flex-col gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Choose image file</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                        className="mt-1.5 w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={uploading || !photoFile}
                      className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {uploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      {uploading ? "Uploading..." : "Upload New Photo"}
                    </button>
                  </form>
                </div>
              </div>
            </div>

            <div className="mt-8 border-t border-slate-100 pt-4 text-[10px] text-slate-400 font-semibold flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Standard secure environment token protections active.
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
