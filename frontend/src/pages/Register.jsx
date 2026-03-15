import { useState } from "react";
import API from "../api/axios";
import { useNavigate } from "react-router-dom";

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
        timeout: 5000,
      });

      setMessage(res.data.message || "Registration successful!");
      setIsError(false);

      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (err) {
      if (err.code === "ECONNABORTED") {
        setMessage("Server took too long. Please try again.");
      } else {
        setMessage(err.response?.data?.message || "Registration failed");
      }

      setIsError(true);
    }

    setLoading(false);
  };

  return (
    <div className="flex min-h-screen flex-col justify-center px-6 py-12 bg-gray-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="text-center text-2xl font-bold text-white">
          Create your account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-sm">

        {/* MESSAGE */}
        {message && (
          <div
            className={`mb-4 p-3 rounded text-center font-medium ${
              isError ? "bg-red-500 text-white" : "bg-green-500 text-white"
            }`}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-6">

          {/* PROFILE PHOTO */}
          <div className="flex flex-col items-center">

            <div className="w-24 h-24 mb-3">
              <img
                src={
                  profilePhoto
                    ? URL.createObjectURL(profilePhoto)
                    : "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                }
                alt="profile"
                className="w-24 h-24 rounded-full object-cover border-2 border-indigo-500"
              />
            </div>

            <label className="cursor-pointer text-sm bg-indigo-500 hover:bg-indigo-400 text-white px-4 py-1 rounded-md transition">
              Upload Photo
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setProfilePhoto(e.target.files[0])}
                className="hidden"
              />
            </label>

            <p className="text-xs text-gray-400 mt-2">
              JPG or PNG (Max 5MB)
            </p>

          </div>

          {/* NAME */}
          <div>
            <label className="block text-sm font-medium text-gray-100">
              Name
            </label>

            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="mt-2 w-full rounded-md bg-white/5 px-3 py-2 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* EMAIL */}
          <div>
            <label className="block text-sm font-medium text-gray-100">
              Email
            </label>

            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="mt-2 w-full rounded-md bg-white/5 px-3 py-2 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* PASSWORD */}
          <div>
            <label className="block text-sm font-medium text-gray-100">
              Password
            </label>

            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="mt-2 w-full rounded-md bg-white/5 px-3 py-2 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full rounded-md py-2 text-white font-semibold transition ${
              loading
                ? "bg-gray-500 cursor-not-allowed"
                : "bg-indigo-500 hover:bg-indigo-400"
            }`}
          >
            {loading ? "Registering..." : "Register"}
          </button>

        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          Already have an account?{" "}
          <span
            onClick={() => navigate("/login")}
            className="text-indigo-400 hover:text-indigo-300 cursor-pointer"
          >
            Sign in
          </span>
        </p>

      </div>
    </div>
  );
}