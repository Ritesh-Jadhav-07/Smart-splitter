import { useState } from "react";
import API from "../api/axios";
import { useNavigate } from "react-router-dom";
import { LogIn, Mail, Lock, Loader2, AlertCircle } from "lucide-react";

import logo from "../assets/logo.jpg";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setMessage("");

    try {
      const res = await API.post("/users/login", { email, password });

      const token = res.data.data.user.refreshTokens;
      localStorage.setItem("token", token);
      console.log("Stored Token:", token);

      setMessage(res.data.message);
      navigate("/");
    } catch (err) {
      setMessage(err.response?.data?.message || "Login failed");
    }

    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      {/* Decorative background elements aligned with new blue theme */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-blue-600/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-blue-600/5 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
  {/* The container is wider now (w-auto px-4) to fit normal logos */}
  <div className="mx-auto mb-4 flex h-12 w-fit items-center justify-center rounded-xl bg-blue-50/80 border border-blue-100 px-4 dark:bg-blue-950/30 dark:border-blue-900/50 shadow-sm">
    <img
      alt="Your Company"
      src={logo}
      className="h-6 w-auto object-contain rendering-crisp" 
    />
  </div>
  <h1 className="text-2xl font-bold tracking-tight text-foreground">
    Welcome back
  </h1>
  <p className="mt-2 text-sm text-muted-foreground">
    Sign in to your account to continue
  </p>
</div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card p-8 shadow-2xl shadow-blue-600/[0.02]">
          {/* Message */}
          {message && (
            <div className="mb-6 flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {message}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="Enter your email"
                  className="h-11 w-full rounded-lg border border-border bg-input pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">
                  Password
                </label>
                <a
                  href="#"
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="h-11 w-full rounded-lg border border-border bg-input pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="relative flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-medium text-white shadow-sm shadow-blue-600/20 transition-all duration-200 hover:bg-blue-700 hover:shadow-md hover:shadow-blue-600/30 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin stroke-[2.5]" />
                  <span>Signing in...</span>
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Not a member?{" "}
            <span
              onClick={() => navigate("/register")}
              className="cursor-pointer font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            >
              Register now
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}