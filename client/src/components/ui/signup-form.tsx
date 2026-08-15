import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
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

export default function SignupForm() {
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

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create account.");
        setLoading(false);
        return;
      }
      // New signups always show onboarding.
      if (typeof window !== "undefined") {
        sessionStorage.setItem("inkbase_show_onboarding", "true");
      }
      window.location.href = "/dashboard?onboarding=true";
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen max-h-screen w-full overflow-hidden bg-[#E3EDF6] text-slate-900">
      <div className="hidden h-full w-1/2 lg:block">
        <AuthHero />
      </div>

      <div className="flex h-full w-full flex-col items-center justify-center bg-[#F5FAFC] px-6 lg:w-1/2">
        <motion.form
          onSubmit={handleSubmit}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex w-80 flex-col items-center justify-center md:w-96"
        >
          <motion.h2
            variants={itemVariants}
            className="text-slate-850 leading-tight"
            style={{ fontFamily: "var(--font-lobster), cursive", fontSize: "clamp(2.2rem, 3.5vw, 3.5rem)" }}
          >
            Join Inkbase
          </motion.h2>

          <motion.p variants={itemVariants} className="mt-2 text-xs sm:text-sm text-slate-500 text-center">
            Create your account to start writing and collaborating
          </motion.p>

          <motion.button
            variants={itemVariants}
            type="button"
            className="mt-6 flex h-11 w-full items-center justify-center gap-3 rounded-full border border-slate-200/90 bg-white transition-all hover:bg-slate-50 cursor-pointer shadow-2xs"
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
            <span className="text-xs font-semibold text-slate-700">
              Sign up with Google
            </span>
          </motion.button>

          <motion.div variants={itemVariants} className="my-4 flex w-full items-center gap-4">
            <div className="h-px w-full bg-slate-200" />
            <p className="w-full text-nowrap text-[11px] font-medium text-slate-400">
              or sign up with email
            </p>
            <div className="h-px w-full bg-slate-200" />
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="flex h-11 w-full items-center gap-2 overflow-hidden rounded-full border border-slate-200/90 bg-white pl-5 shadow-2xs transition-colors focus-within:border-[#2C7E86] focus-within:ring-1 focus-within:ring-[#2C7E86]"
          >
            <Mail className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@gmail.com"
              required
              className="h-full w-full bg-white text-xs font-medium text-slate-900 outline-none placeholder:text-slate-400"
            />
          </motion.div>

          <motion.div variants={itemVariants} className="mt-3.5 flex w-full flex-col gap-1.5">
            <div className="flex h-11 w-full items-center gap-2 overflow-hidden rounded-full border border-slate-200/90 bg-white pl-5 shadow-2xs transition-colors focus-within:border-[#2C7E86] focus-within:ring-1 focus-within:ring-[#2C7E86]">
              <Lock className="h-4 w-4 shrink-0 text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={8}
                required
                className="h-full w-full bg-white text-xs font-medium text-slate-900 outline-none placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="flex h-11 w-11 shrink-0 items-center justify-center text-slate-400 transition-colors hover:text-slate-600 cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="pl-4 text-[11px] text-slate-400">
              Must be at least 8 characters
            </p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="mt-4 flex w-full items-center gap-2 text-slate-600"
          >
            <input
              className="h-4 w-4 rounded border-slate-300 accent-[#2C7E86]"
              type="checkbox"
              id="terms"
              required
            />
            <label className="text-xs cursor-pointer select-none text-slate-600 font-medium" htmlFor="terms">
              I agree to the{" "}
              <a className="text-[#2C7E86] hover:underline" href="#">
                Terms &amp; Conditions
              </a>
            </label>
          </motion.div>

          {error && (
            <motion.div variants={itemVariants} className="mt-4 rounded-xl bg-red-50 p-2.5 text-center text-xs text-red-600 font-medium w-full border border-red-100">
              {error}
            </motion.div>
          )}

          <motion.button
            variants={itemVariants}
            type="submit"
            disabled={loading}
            className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#2C7E86] font-semibold text-xs text-white transition-all hover:bg-[#22676E] disabled:opacity-60 shadow-xs hover:shadow-md cursor-pointer"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Creating account…" : "Create Account"}
          </motion.button>

          <motion.p variants={itemVariants} className="mt-4 text-xs text-slate-500">
            Already have an account?{" "}
            <Link className="font-semibold text-[#2C7E86] hover:underline" href="/auth/login">
              Sign in
            </Link>
          </motion.p>
        </motion.form>
      </div>
    </div>
  );
}
