import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2, Lock, Mail, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import AuthHero from "@/components/ui/auth-hero";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError("Please fill in all fields.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid email or password.");
        setLoading(false);
        return;
      }
      // Session cookie is set by the server.
      if (data.show_onboarding) {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("inkbase_show_onboarding", "true");
        }
        window.location.href = "/dashboard?onboarding=true";
      } else {
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("inkbase_show_onboarding");
        }
        window.location.href = "/dashboard";
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleDevPrefill() {
    setEmail("devwork@mesh.com");
    setPassword("password123");
    setError(null);
  }

  return (
    <div className="flex h-screen max-h-screen w-full overflow-hidden bg-white text-gray-900">
      <div className="hidden h-full w-1/2 lg:block">
        <AuthHero />
      </div>

      <div className="flex h-full w-full flex-col items-center justify-center bg-white px-6 lg:w-1/2">
        <motion.form
          onSubmit={handleSubmit}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex w-80 flex-col items-center justify-center md:w-96"
        >
          <motion.h2
            variants={itemVariants}
            className="text-gray-900 leading-tight"
            style={{ fontFamily: "var(--font-lobster), cursive", fontSize: "clamp(2rem, 3.5vw, 3.5rem)" }}
          >
            Sign in to Inkbase
          </motion.h2>

          <motion.p variants={itemVariants} className="mt-3 text-sm text-gray-500">
            Welcome back! Enter your details to access your workspace
          </motion.p>

          {/* Dev Quick-Fill Shortcut */}
          <motion.button
            variants={itemVariants}
            type="button"
            onClick={handleDevPrefill}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full border border-purple-200 bg-purple-50/70 px-4 py-2 text-xs font-semibold text-purple-700 transition hover:bg-purple-100"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Use Dev Account (devwork@mesh.com)</span>
          </motion.button>

          <motion.button
            variants={itemVariants}
            type="button"
            className="mt-3 flex h-11 w-full items-center justify-center gap-3 rounded-full border border-gray-300 bg-gray-50 transition-colors hover:bg-gray-100"
          >
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path
                fill="#FFC107"
                d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"
              />
              <path
                fill="#FF3D00"
                d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
              />
              <path
                fill="#4CAF50"
                d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
              />
              <path
                fill="#1976D2"
                d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.7l6.2 5.2C37 39.8 44 34.8 44 24c0-1.3-.1-2.6-.4-3.9z"
              />
            </svg>
            <span className="text-sm font-medium text-gray-700">
              Sign in with Google
            </span>
          </motion.button>

          <motion.div variants={itemVariants} className="my-4 flex w-full items-center gap-4">
            <div className="h-px w-full bg-gray-200" />
            <p className="w-full text-nowrap text-xs text-gray-400">
              or sign in with email
            </p>
            <div className="h-px w-full bg-gray-200" />
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="flex h-11 w-full items-center gap-2 overflow-hidden rounded-full border border-gray-400 bg-white pl-5 shadow-sm transition-colors focus-within:border-indigo-600 focus-within:ring-1 focus-within:ring-indigo-600"
          >
            <Mail className="h-4 w-4 shrink-0 text-gray-500" />
            <input
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@gmail.com"
              required
              className="h-full w-full bg-white text-sm text-gray-900 outline-none placeholder:text-gray-400"
            />
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="mt-4 flex h-11 w-full items-center gap-2 overflow-hidden rounded-full border border-gray-400 bg-white pl-5 shadow-sm transition-colors focus-within:border-indigo-600 focus-within:ring-1 focus-within:ring-indigo-600"
          >
            <Lock className="h-4 w-4 shrink-0 text-gray-500" />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="h-full w-full bg-white text-sm text-gray-900 outline-none placeholder:text-gray-400"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="flex h-11 w-11 shrink-0 items-center justify-center text-gray-400 transition-colors hover:text-gray-600"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="mt-5 flex w-full items-center justify-between text-gray-600"
          >
            <div className="flex items-center gap-2">
              <input
                className="h-4 w-4 rounded border-gray-300 accent-indigo-600"
                type="checkbox"
                id="checkbox"
              />
              <label className="text-xs cursor-pointer select-none text-gray-600" htmlFor="checkbox">
                Remember me
              </label>
            </div>
            <a className="text-xs font-medium text-indigo-600 hover:underline" href="#">
              Forgot password?
            </a>
          </motion.div>

          {error && (
            <motion.div variants={itemVariants} className="mt-4 rounded-lg bg-red-50 p-2.5 text-center text-xs text-red-600 font-medium w-full border border-red-100">
              {error}
            </motion.div>
          )}

          <motion.button
            variants={itemVariants}
            type="submit"
            disabled={loading}
            className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-indigo-600 font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-60 shadow-md shadow-indigo-200"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Logging in…" : "Login"}
          </motion.button>

          <motion.p variants={itemVariants} className="mt-4 text-xs text-gray-500">
            Don&apos;t have an account?{" "}
            <Link className="font-semibold text-indigo-600 hover:underline" href="/auth/signup">
              Sign up
            </Link>
          </motion.p>
        </motion.form>
      </div>
    </div>
  );
}
