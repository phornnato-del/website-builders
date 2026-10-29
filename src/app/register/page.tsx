"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { LoadingSpinner } from "@/components/loading-spinner";
import { apiRequest, ApiError, AuthResult } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await apiRequest<AuthResult>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      router.replace("/editor");
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-[1fr_0.9fr]">
      <section className="flex items-center justify-center px-6 py-12 sm:px-12">
        <div className="w-full max-w-md">
          <Link className="mb-14 inline-flex items-center gap-3" href="/">
            <span className="grid size-10 place-items-center rounded-xl bg-indigo-600 text-lg font-semibold text-white">
              W
            </span>
            <span className="text-lg font-semibold tracking-tight text-slate-950">
              WebBuilder
            </span>
          </Link>

          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-600">
            Get started
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            Create your account
          </h1>
          <p className="mt-3 text-slate-600">
            Sign up and start shaping your first website.
          </p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Email address
              </span>
              <input
                autoComplete="email"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
                type="email"
                value={email}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Password
              </span>
              <input
                autoComplete="new-password"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                minLength={12}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 12 characters"
                required
                type="password"
                value={password}
              />
              <span className="mt-2 block text-xs text-slate-500">
                Use at least 12 characters.
              </span>
            </label>

            {error && (
              <p
                aria-live="polite"
                className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
                role="alert"
              >
                {error}
              </p>
            )}

            <button
              aria-label={submitting ? "Creating account" : undefined}
              className="w-full rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={submitting}
              type="submit"
            >
              {submitting ? (
                <LoadingSpinner label="Creating account" size="sm" />
              ) : (
                "Create account"
              )}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link
              className="font-semibold text-indigo-600 hover:text-indigo-700"
              href="/login"
            >
              Sign in
            </Link>
          </p>
        </div>
      </section>

      <aside className="relative hidden overflow-hidden bg-indigo-700 p-12 text-white lg:flex lg:items-end">
        <div className="absolute -right-32 -top-32 size-[32rem] rounded-full border border-white/10" />
        <div className="absolute -right-16 -top-16 size-[24rem] rounded-full border border-white/10" />
        <div className="absolute right-20 top-24 size-56 rounded-[2.5rem] bg-white/10 blur-2xl" />
        <div className="relative max-w-xl pb-8">
          <span className="mb-6 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-indigo-100">
            Your ideas, your website
          </span>
          <h2 className="text-4xl font-semibold leading-tight tracking-tight">
            Start with a block. Finish with a website that is yours.
          </h2>
          <p className="mt-5 max-w-lg text-lg leading-8 text-indigo-100">
            Build visually, make changes as you go, and bring your ideas to
            life.
          </p>
        </div>
      </aside>
    </main>
  );
}
