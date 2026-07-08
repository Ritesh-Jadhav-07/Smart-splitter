import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { UserPlus, Menu, X, LayoutDashboard, User, Settings, LogOut, Home } from "lucide-react";
import API from "../api/axios";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  const fetchUser = async () => {
    try {
      const res = await API.get("/users/current-user");
      setUser(res.data.data);
    } catch (err) {
      // User is not authenticated or token is missing/expired.
      setUser(null);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [location.pathname]); // refetch user details when route changes

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    API.post("/users/logout").catch(() => {});
    setUser(null);
    navigate("/login");
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

  const handleScrollToOrNavigate = (anchor) => {
    setMobileMenuOpen(false);
    if (location.pathname === "/") {
      const el = document.getElementById(anchor);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      navigate(`/#${anchor}`);
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-[#f8fafc]/80 backdrop-blur-md shadow-sm shadow-slate-100/50">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
        {/* Left: Brand Logo */}
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

        {/* Center: Navigation Links */}
        <nav className="hidden md:flex items-center gap-2 text-sm font-medium text-slate-500">
          {user ? (
            <>
              <button
                onClick={() => navigate("/")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive("/")
                    ? "text-emerald-700 bg-emerald-50 border border-emerald-500/20 shadow-sm"
                    : "hover:text-slate-900 hover:bg-slate-100/60 border border-transparent"
                }`}
              >
                Home
              </button>
              <button
                onClick={() => navigate("/dashboard")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive("/dashboard")
                    ? "text-emerald-700 bg-emerald-50 border border-emerald-500/20 shadow-sm"
                    : "hover:text-slate-900 hover:bg-slate-100/60 border border-transparent"
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => navigate("/groups")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive("/groups") || location.pathname.startsWith("/groups")
                    ? "text-emerald-700 bg-emerald-50 border border-emerald-500/20 shadow-sm"
                    : "hover:text-slate-900 hover:bg-slate-100/60 border border-transparent"
                }`}
              >
                Groups
              </button>
              <button
                onClick={() => navigate("/friends")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive("/friends")
                    ? "text-emerald-700 bg-emerald-50 border border-emerald-500/20 shadow-sm"
                    : "hover:text-slate-900 hover:bg-slate-100/60 border border-transparent"
                }`}
              >
                Friends
              </button>
              <button
                onClick={() => navigate("/profile")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive("/profile")
                    ? "text-emerald-700 bg-emerald-50 border border-emerald-500/20 shadow-sm"
                    : "hover:text-slate-900 hover:bg-slate-100/60 border border-transparent"
                }`}
              >
                Profile
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => handleScrollToOrNavigate("features")}
                className="hover:text-slate-900 px-3 py-1.5 transition-colors"
              >
                Features
              </button>
              <button
                onClick={() => handleScrollToOrNavigate("how-it-works")}
                className="hover:text-slate-900 px-3 py-1.5 transition-colors"
              >
                How It Works
              </button>
              <button
                onClick={() => navigate("/dashboard")}
                className="hover:text-slate-900 px-3 py-1.5 transition-colors"
              >
                Dashboard
              </button>
            </>
          )}
        </nav>

        {/* Right Actions */}
        <div className="hidden md:flex items-center gap-3.5">
          {user ? (
            <div className="flex items-center gap-3">
              {/* Add Friend Button */}
              {/* <button
                onClick={() => navigate("/friends")}
                className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-1.8 text-xs font-semibold shadow-sm transition-all duration-200 ${
                  isActive("/friends")
                    ? "border-emerald-500/30 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/5"
                    : "border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700"
                }`}
              >
                <UserPlus className="w-3.5 h-3.5 text-emerald-600" />
                <span>Add Friend</span>
              </button> */}

              {/* Profile Dropdown Container */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className={`flex items-center gap-2 rounded-xl border p-1 pr-3 transition-all duration-200 shadow-sm ${
                    menuOpen
                      ? "border-emerald-500/30 bg-emerald-50/50 ring-4 ring-emerald-500/5"
                      : "border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  {user?.profilePhoto ? (
                    <img
                      src={user.profilePhoto}
                      alt="profile"
                      className="w-7 h-7 rounded-lg object-cover ring-1 ring-black/5"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-[10px] font-bold text-white shadow-inner">
                      {initials}
                    </div>
                  )}
                  <span className="text-xs font-semibold text-slate-700 max-w-[90px] truncate">
                    {user?.name || "Account"}
                  </span>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className={`w-3 h-3 text-slate-400 transition-transform duration-300 ${
                      menuOpen ? "rotate-180 text-emerald-600" : ""
                    }`}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2.5 w-56 rounded-2xl border border-slate-200/80 bg-white/95 backdrop-blur-lg shadow-xl shadow-slate-200/80 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-2.5 mb-1.5 bg-gradient-to-r from-slate-50 to-emerald-50/20 border-b border-slate-100">
                      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                        Signed in as
                      </p>
                      <p className="text-xs font-bold text-slate-800 truncate mt-0.5">
                        {user.name}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                    </div>

                    <button
                      onClick={() => {
                        navigate("/dashboard");
                        setMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all flex items-center gap-2.5 group"
                    >
                      <div className="p-1 rounded-md bg-slate-100 text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                        <LayoutDashboard className="w-3.5 h-3.5" />
                      </div>
                      Dashboard Workspace
                    </button>

                    <button
                      onClick={() => {
                        navigate("/profile");
                        setMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all flex items-center gap-2.5 group"
                    >
                      <div className="p-1 rounded-md bg-slate-100 text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      Profile Settings
                    </button>

                    <div className="my-1.5 border-t border-slate-100" />

                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50/60 transition-all flex items-center gap-2.5"
                    >
                      <div className="p-1 rounded-md bg-rose-50 text-rose-500">
                        <LogOut className="w-3.5 h-3.5" />
                      </div>
                      Sign Out Account
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              <button
                onClick={() => navigate("/login")}
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
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

        {/* Mobile menu button toggle */}
        <div className="md:hidden flex items-center gap-2">
          {user && (
            <button
              onClick={() => navigate("/friends")}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-700"
            >
              <UserPlus className="w-4 h-4 text-emerald-600" />
            </button>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white py-4 px-6 space-y-3.5 shadow-inner animate-in fade-in duration-200">
          {user ? (
            <>
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                {user?.profilePhoto ? (
                  <img src={user.profilePhoto} alt="profile" className="w-8 h-8 rounded-lg object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-xs font-bold text-white">
                    {initials}
                  </div>
                )}
                <div>
                  <p className="text-xs font-bold text-slate-800">{user.name}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{user.email}</p>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => {
                    navigate("/");
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                    isActive("/") ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Home
                </button>
                <button
                  onClick={() => {
                    navigate("/dashboard");
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                    isActive("/dashboard") ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Dashboard Workspace
                </button>
                <button
                  onClick={() => {
                    navigate("/groups");
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                    isActive("/groups") || location.pathname.startsWith("/groups") ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Groups Workspace
                </button>
                <button
                  onClick={() => {
                    navigate("/friends");
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                    isActive("/friends") ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Friends List
                </button>
                <button
                  onClick={() => {
                    navigate("/profile");
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                    isActive("/profile") ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Profile Settings
                </button>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-rose-600 hover:bg-rose-50"
                >
                  Sign Out
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleScrollToOrNavigate("features")}
                className="w-full text-left py-1.5 text-sm font-semibold text-slate-600"
              >
                Features
              </button>
              <button
                onClick={() => handleScrollToOrNavigate("how-it-works")}
                className="w-full text-left py-1.5 text-sm font-semibold text-slate-600"
              >
                How It Works
              </button>
              <button
                onClick={() => {
                  navigate("/dashboard");
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left py-1.5 text-sm font-semibold text-slate-600"
              >
                Dashboard
              </button>
              <div className="border-t border-slate-100 pt-3 flex gap-3">
                <button
                  onClick={() => {
                    navigate("/login");
                    setMobileMenuOpen(false);
                  }}
                  className="flex-1 text-center py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 bg-white"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    navigate("/login?register=1");
                    setMobileMenuOpen(false);
                  }}
                  className="flex-1 text-center py-2 rounded-xl text-sm font-semibold bg-slate-900 text-white"
                >
                  Get Started
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
