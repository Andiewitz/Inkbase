import { useState } from "react";
import type { FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2, Lock, Mail } from "lucide-react";
import { motion } from "framer-motion";

const LEFT_IMAGE =
  "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80";

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    if (!email || !password) {
      setError("Please fill in all fields.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to sign in.");
        setLoading(false);
        return;
      }
      if (data.token) {
        localStorage.setItem("token", data.token);
        window.location.href = "/";
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen w-full bg-white text-gray-900">
      <div className="relative hidden w-1/2 md:block">
        <Image
          src={LEFT_IMAGE}
          alt="Workspace with a laptop"
          fill
          sizes="50vw"
          priority
          className="object-cover"
        />
      </div>

      <div className="flex w-full flex-col items-center justify-center bg-white px-6 md:w-1/2">
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

          <motion.button
            variants={itemVariants}
            type="button"
            className="mt-8 flex h-12 w-full items-center justify-center gap-3 rounded-full border border-gray-300 bg-gray-50 transition-colors hover:bg-gray-100"
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

          <motion.div variants={itemVariants} className="my-5 flex w-full items-center gap-4">
            <div className="h-px w-full bg-gray-200" />
            <p className="w-full text-nowrap text-sm text-gray-400">
              or sign in with email
            </p>
            <div className="h-px w-full bg-gray-200" />
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="flex h-12 w-full items-center gap-2 overflow-hidden rounded-full border border-gray-400 bg-white pl-6 shadow-sm transition-colors focus-within:border-indigo-600 focus-within:ring-1 focus-within:ring-indigo-600"
          >
            <Mail className="h-4 w-4 shrink-0 text-gray-500" />
            <input
              type="email"
              name="email"
              placeholder="example@gmail.com"
              required
              className="h-full w-full bg-white text-sm text-gray-900 outline-none placeholder:text-gray-400"
            />
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="mt-6 flex h-12 w-full items-center gap-2 overflow-hidden rounded-full border border-gray-400 bg-white pl-6 shadow-sm transition-colors focus-within:border-indigo-600 focus-within:ring-1 focus-within:ring-indigo-600"
          >
            <Lock className="h-4 w-4 shrink-0 text-gray-500" />
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              required
              className="h-full w-full bg-white text-sm text-gray-900 outline-none placeholder:text-gray-400"
            />
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="mt-8 flex w-full items-center justify-between text-gray-600"
          >
            <div className="flex items-center gap-2">
              <input
                className="h-4 w-4 rounded border-gray-300 accent-indigo-600"
                type="checkbox"
                id="checkbox"
              />
              <label className="text-sm cursor-pointer select-none text-gray-600" htmlFor="checkbox">
                Remember me
              </label>
            </div>
            <a className="text-sm font-medium text-indigo-600 hover:underline" href="#">
              Forgot password?
            </a>
          </motion.div>

          {error && (
            <motion.p variants={itemVariants} className="mt-4 text-sm text-red-500">
              {error}
            </motion.p>
          )}

          <motion.button
            variants={itemVariants}
            type="submit"
            disabled={loading}
            className="mt-8 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-indigo-600 font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Logging in…" : "Login"}
          </motion.button>

          <motion.p variants={itemVariants} className="mt-4 text-sm text-gray-500">
            Don&apos;t have an account?{" "}
            <Link className="font-medium text-indigo-600 hover:underline" href="/auth/signup">
              Sign up
            </Link>
          </motion.p>
        </motion.form>
      </div>
    </div>
  );
}
