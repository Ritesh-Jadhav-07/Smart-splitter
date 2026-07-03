import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

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

  const handleLogout = () => {
    localStorage.removeItem("token");
    API.post("/users/logout").catch(() => {});
    navigate("/login");
  };

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <div
      style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif" }}
      className="min-h-screen bg-[#f8fafc] text-slate-800 selection:bg-emerald-500/20 selection:text-emerald-700 overflow-x-hidden relative"
    >
      {/* LIGHT METROPOLITAN AMBIENT GLOW EFFECTS */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none opacity-40 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-200 via-sky-100 to-transparent blur-[100px] z-0" />

      {/* NAVBAR */}
      <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-[#f8fafc]/80 backdrop-blur-md shadow-sm shadow-slate-100/50">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          
          {/* Logo */}
          <button onClick={() => navigate("/")} className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-4H9l3-6 3 6h-2v4z" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              Equi<span className="text-emerald-600">Pay</span>
            </span>
          </button>

          {/* Center Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-500">
            <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-slate-900 transition-colors">How It Works</a>
            <a href="#preview" className="hover:text-slate-900 transition-colors">Dashboard</a>
          </nav>

          {/* Right side Authentication Layout with Premium Profile Component */}
          <div className="flex items-center gap-4">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className={`flex items-center gap-2 rounded-xl border p-1.5 pr-3 transition-all duration-200 shadow-sm ${
                    menuOpen 
                      ? "border-emerald-500/30 bg-emerald-50/50 ring-4 ring-emerald-500/5" 
                      : "border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  {user?.profilePhoto ? (
                    <img src={user.profilePhoto} alt="profile" className="w-7 h-7 rounded-lg object-cover ring-1 ring-black/5" />
                  ) : (
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-[11px] font-bold text-white shadow-inner">
                      {initials}
                    </div>
                  )}
                  <span className="text-xs font-semibold text-slate-700 max-w-[90px] truncate hidden sm:block">
                    {user?.name || "Account"}
                  </span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`w-3 h-3 text-slate-400 transition-transform duration-300 ${menuOpen ? "rotate-180 text-emerald-600" : ""}`}>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {/* ATTRACTIVE PROFILE MENU DROPDOWN */}
                {menuOpen && (
                  <div className="absolute right-0 mt-2.5 w-56 rounded-2xl border border-slate-200/80 bg-white/95 backdrop-blur-lg shadow-xl shadow-slate-200/80 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* User Mini Profile Banner Card */}
                    <div className="px-4 py-2.5 mb-1.5 bg-gradient-to-r from-slate-50 to-emerald-50/20 border-b border-slate-100">
                      <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Signed in as</p>
                      <p className="text-xs font-bold text-slate-800 truncate mt-0.5">{user?.name || "Premium User"}</p>
                      <p className="text-[10px] text-slate-500 truncate">{user?.email || "user@equipay.com"}</p>
                    </div>

                    <button
                      onClick={() => { navigate("/dashboard"); setMenuOpen(false); }}
                      className="w-full text-left px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all flex items-center gap-2.5 group"
                    >
                      <div className="p-1 rounded-md bg-slate-100 text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
                      </div>
                      Dashboard Workspace
                    </button>
                    
                    <button
                      onClick={() => { navigate("/profile"); setMenuOpen(false); }}
                      className="w-full text-left px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all flex items-center gap-2.5 group"
                    >
                      <div className="p-1 rounded-md bg-slate-100 text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>
                      </div>
                      Profile Settings
                    </button>
                    
                    <div className="my-1.5 border-t border-slate-100" />
                    
                    <button
                      onClick={() => { handleLogout(); setMenuOpen(false); }}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50/60 transition-all flex items-center gap-2.5"
                    >
                      <div className="p-1 rounded-md bg-rose-50 text-rose-500">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                      </div>
                      Sign Out Account
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button onClick={() => navigate("/login")} className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                  Sign In
                </button>
                <button
                  onClick={() => navigate("/login?register=1")}
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-slate-900 text-white hover:bg-slate-800 shadow-md transition-all duration-200"
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative mx-auto max-w-6xl px-6 pt-20 pb-24 md:pt-28 md:pb-36 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Text */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {user && (
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Welcome back, {user.name.split(" ")[0]}
              </div>
            )}
            <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
              Split Expenses.<br />
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 bg-clip-text text-transparent">
                Stay Friends.
              </span>
            </h1>
            <p className="text-slate-500 text-lg sm:text-xl max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed">
              The premium, frictionless way to split group bills, track shared expenses, and settle balances without the awkward math conversations.
            </p>
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
              <button
                onClick={() => navigate(user ? "/dashboard?createGroup=1" : "/login")}
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold shadow-xl shadow-emerald-600/20 hover:opacity-95 transition-all flex items-center gap-2"
              >
                {user ? "Create a Group" : "Start Splitting Free"}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="13 6 19 12 13 18" /></svg>
              </button>
              <button
                onClick={() => navigate(user ? "/dashboard" : "/login")}
                className="px-6 py-3.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium hover:bg-slate-50 hover:border-slate-300 shadow-sm transition-all"
              >
                {user ? "Go to Dashboard" : "Live Demo"}
              </button>
            </div>
          </div>

          {/* Right Visual Graphic */}
          <div className="lg:col-span-5 relative flex justify-center">
            <div className="w-full max-w-[380px] p-6 rounded-2xl border border-slate-200/80 bg-white shadow-xl shadow-slate-200/50 relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl" />
              <div className="flex justify-between items-center mb-6">
                <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">Recent Activity</span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">Settled</span>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-sky-500/10 text-sky-600 flex items-center justify-center font-bold text-xs">☕</div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">Starbucks Coffee</p>
                      <p className="text-[11px] text-slate-400">Paid by you</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold font-mono text-slate-600">-$24.50</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-fuchsia-500/10 text-fuchsia-600 flex items-center justify-center font-bold text-xs">🍕</div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">Friday Pizza Night</p>
                      <p className="text-[11px] text-slate-400">Paid by Alex</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold font-mono text-emerald-600">+$18.00</span>
                </div>
              </div>
              <div className="mt-6 pt-5 border-t border-slate-100 flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Total Net Balance</span>
                <span className="font-mono text-emerald-600 font-bold text-sm">+$5.50</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-20 border-t border-slate-200/60">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-600">Engineered for Fairness</h2>
          <p className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">Everything you need to stay square</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-8 rounded-2xl border border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-lg hover:shadow-slate-100 transition-all group">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center mb-6">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5"><path d="M12 5v14M5 12h14"/></svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Add Expenses Instantly</h3>
            <p className="text-sm text-slate-500 leading-relaxed">Log costs on the go, categorize items, and divide percentages evenly or with custom weights.</p>
          </div>
          <div className="p-8 rounded-2xl border border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-lg hover:shadow-slate-100 transition-all group">
            <div className="w-11 h-11 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-600 flex items-center justify-center mb-6">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Manage Friends Seamlessly</h3>
            <p className="text-sm text-slate-500 leading-relaxed">Organize shared circles, see precise individual net IOUs, and resolve accounts with click operations.</p>
          </div>
          <div className="p-8 rounded-2xl border border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-lg hover:shadow-slate-100 transition-all group">
            <div className="w-11 h-11 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-600 flex items-center justify-center mb-6">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Split Fairly & Optimize</h3>
            <p className="text-sm text-slate-500 leading-relaxed">Minimize debt transactions securely using smart algorithmic paths that find simple repayment layouts.</p>
          </div>
        </div>
      </section>

      {/* DASHBOARD PREVIEW */}
      <section id="preview" className="mx-auto max-w-6xl px-6 py-16">
        <div className="p-1.5 rounded-3xl bg-slate-100 border border-slate-200/80 shadow-md">
          <div className="rounded-[22px] bg-white overflow-hidden border border-slate-200/60 p-8 min-h-[300px] flex flex-col justify-between shadow-inner">
            <div className="flex flex-wrap gap-4 items-center justify-between border-b border-slate-100 pb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Quick Actions</h3>
                <p className="text-xs text-slate-400">Launch workflows right out of your control center panel</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => navigate("/dashboard?createGroup=1")} className="px-4 py-2 rounded-xl bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200 text-xs font-semibold hover:bg-fuchsia-100 transition-all shadow-sm">
                  + Create Group
                </button>
                <button onClick={() => navigate("/friends")} className="px-4 py-2 rounded-xl bg-sky-50 text-sky-700 border border-sky-200 text-xs font-semibold hover:bg-sky-100 transition-all shadow-sm">
                  Manage Friends
                </button>
              </div>
            </div>
            <div className="pt-8 text-center text-slate-400 text-xs font-medium">
              🔒 Standard httpOnly secure environment token protections active.
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS TIMELINE */}
      <section id="how-it-works" className="mx-auto max-w-4xl px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Settle up in 3 easy steps</h2>
        </div>
        <div className="space-y-12 relative before:absolute before:inset-0 before:left-4 sm:before:left-1/2 before:w-[1px] before:bg-slate-200 before:h-full">
          <div className="relative flex flex-col sm:flex-row items-start sm:justify-between group">
            <div className="absolute left-4 sm:left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#f8fafc] border-2 border-emerald-500 flex items-center justify-center text-xs font-bold text-emerald-600 z-10 shadow-sm">1</div>
            <div className="sm:w-[45%] pl-12 sm:pl-0 sm:text-right pt-1">
              <h4 className="text-base font-bold text-slate-900">Create your event pool</h4>
              <p className="text-sm text-slate-500 mt-1">Group dynamic activities like trips, rent tracking, dinners or daily household balances together.</p>
            </div>
            <div className="hidden sm:block sm:w-[45%]" />
          </div>
          <div className="relative flex flex-col sm:flex-row items-start sm:justify-between group">
            <div className="absolute left-4 sm:left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#f8fafc] border-2 border-sky-500 flex items-center justify-center text-xs font-bold text-sky-600 z-10 shadow-sm">2</div>
            <div className="hidden sm:block sm:w-[45%]" />
            <div className="sm:w-[45%] pl-12 sm:pl-0 pt-1">
              <h4 className="text-base font-bold text-slate-900">Add itemized receipts</h4>
              <p className="text-sm text-slate-500 mt-1">Input who covered the baseline charge and select exactly which group members share the stake.</p>
            </div>
          </div>
          <div className="relative flex flex-col sm:flex-row items-start sm:justify-between group">
            <div className="absolute left-4 sm:left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#f8fafc] border-2 border-fuchsia-500 flex items-center justify-center text-xs font-bold text-fuchsia-600 z-10 shadow-sm">3</div>
            <div className="sm:w-[45%] pl-12 sm:pl-0 sm:text-right pt-1">
              <h4 className="text-base font-bold text-slate-900">Settle debts clean</h4>
              <p className="text-sm text-slate-500 mt-1">See broken down algorithmic configurations optimized to send paybacks using clear routing vectors.</p>
            </div>
            <div className="hidden sm:block sm:w-[45%]" />
          </div>
        </div>
      </section>

      {/* FINAL CTA SECTION */}
      <section className="mx-auto max-w-5xl px-6 py-16 text-center relative z-10">
        <div className="p-12 rounded-3xl border border-slate-200/60 bg-gradient-to-r from-emerald-500/5 via-white to-sky-500/5 shadow-xl shadow-slate-100 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4 text-slate-900">Ready to fix your group balances?</h2>
          <p className="text-slate-500 max-w-md mx-auto text-sm sm:text-base mb-8">Join thousands keeping transactions simple without generating spreadsheet nightmares.</p>
          <button
            onClick={() => navigate(user ? "/dashboard" : "/login")}
            className="px-6 py-3 rounded-xl bg-slate-950 text-white font-semibold shadow-xl shadow-slate-950/20 hover:bg-slate-800 transition-colors"
          >
            {user ? "Go to Dashboard" : "Get Started Now"}
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mx-auto max-w-6xl px-6 pt-12 pb-8 border-t border-slate-200 text-xs text-slate-400 flex flex-col sm:flex-row justify-between items-center gap-4">
        <p>&copy; {new Date().getFullYear()} EquiPay Inc. All systems functional.</p>
        <div className="flex gap-6 font-medium">
          <a href="#features" className="hover:text-slate-700">Features</a>
          <a href="#how-it-works" className="hover:text-slate-700">Privacy Policy</a>
          <a href="#preview" className="hover:text-slate-700">Terms of Use</a>
        </div>
      </footer>
    </div>
  );
}