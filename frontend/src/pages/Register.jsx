import { useState } from "react";
import API from "../api/axios";
import { useNavigate } from "react-router-dom";
import { User, Mail, Lock, Camera, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [profilePhoto, setProfilePhoto] = useState(null);

  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

const handleRegister = async (e) => {
  e.preventDefault();

  if (loading) return;

  if (!profilePhoto) {
    setMessage("Please upload a profile photo");
    setIsError(true);
    return;
  }

  setLoading(true);
  setMessage("");

  try {
    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("password", password);
    formData.append("profilePhoto", profilePhoto);

    const res = await API.post("/users/register", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      // FIX 1: Increase timeout to 30 seconds (30000ms) to allow larger image binary uploads
      timeout: 30000, 
      // FIX 2: Tell Axios to differentiate between real structural timeouts vs browser aborts
      transitional: {
        clarifyTimeoutError: true,
      },
    });

    setMessage(res.data.message || "Registration successful!");
    setIsError(false);

    setTimeout(() => {
      navigate("/login");
    }, 1200);

    return; 

  } catch (err) {
    // Check for both the old Axios error code and the clarified ETIMEDOUT code
    if (err.code === "ECONNABORTED" || err.code === "ETIMEDOUT") {
      setMessage("Upload took too long. Please compress your photo or try a faster connection.");
    } else {
      setMessage(err.response?.data?.message || "Registration failed");
    }
    
    setIsError(true);
    setLoading(false); 
  }
};

  return (
    // MNC Sky-Mesh Background: Crisp, bright, and vibrant
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-tr from-sky-100/60 via-white to-blue-50 px-4 py-12">
      
      {/* Luminous Ambient Glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 right-[-5%] h-[450px] w-[450px] rounded-full bg-gradient-to-br from-sky-400/20 to-blue-600/10 blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-5%] h-[450px] w-[450px] rounded-full bg-gradient-to-tr from-blue-500/10 to-sky-300/20 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header Section */}
        <div className="mb-8 text-center">
          {/* Sky-blue tinted subtle brand square */}
          {/* <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 border border-sky-100 shadow-sm shadow-sky-200/50">
            <User className="h-5 w-5 text-blue-600" />
          </div> */}
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">
            Create your account
          </h1>
          
        </div>

        {/* Premium Pure White Card with Soft Blue Shadow Depth */}
        <div className="rounded-2xl border border-blue-100/70 bg-white p-8 shadow-[0_12px_40px_rgba(14,165,233,0.08)]">
          
          {/* Message Alert Banners */}
          {message && (
            <div
              className={`mb-6 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium border ${
                isError
                  ? "bg-rose-50 text-rose-600 border-rose-100"
                  : "bg-emerald-50 text-emerald-600 border-emerald-100"
              }`}
            >
              {isError ? (
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
              ) : (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
              )}
              {message}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            
            {/* Custom Interactive Avatar Uploader */}
            <div className="flex flex-col items-center pb-2">
              <label className="group relative cursor-pointer focus-within:ring-2 focus-within:ring-sky-500 focus-within:ring-offset-2 rounded-full outline-none">
                <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-dashed border-sky-200 bg-sky-50/40 transition-all group-hover:border-blue-500 group-hover:bg-sky-50">
                  <img
                    src={
                      profilePhoto
                        ? URL.createObjectURL(profilePhoto)
                        : "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                    }
                    alt="profile"
                    className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-blue-900/30 opacity-0 transition-opacity group-hover:opacity-100">
                    <Camera className="h-6 w-6 text-white" />
                  </div>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProfilePhoto(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
              <span className="mt-2 text-xs font-semibold text-sky-600/90 group-hover:text-blue-600 transition-colors">
                Upload your photo
              </span>
            </div>

            {/* Name Input */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sky-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="h-11 w-full rounded-lg border border-sky-100 bg-sky-50/20 pl-10 pr-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
            </div>

            {/* Email Input */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sky-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="h-11 w-full rounded-lg border border-sky-100 bg-sky-50/20 pl-10 pr-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sky-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-11 w-full rounded-lg border border-sky-100 bg-sky-50/20 pl-10 pr-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
            </div>

            {/* Vibrant Blue Primary Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="relative flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-semibold text-white shadow-md shadow-blue-600/10 transition-all duration-200 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/20 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin stroke-[2.5]" />
                  <span>Creating account...</span>
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Footer Navigation */}
          <div className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <span
              onClick={() => navigate("/login")}
              className="cursor-pointer font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-all"
            >
              Sign in
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}