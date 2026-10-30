"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { LoadingSpinner } from "@/components/loading-spinner";
import {
  ApiError,
  deleteSite,
  getCurrentUser,
  getOwnedSites,
  PublishedSite,
} from "@/lib/api";

export default function DashboardPage() {
  const router = useRouter();
  const [sites, setSites] = useState<PublishedSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [csrfToken, setCsrfToken] = useState("");
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function loadSites() {
      try {
        const session = await getCurrentUser();
        if (active) setCsrfToken(session.csrf_token);
        const ownedSites = await getOwnedSites();
        if (active) setSites(ownedSites);
      } catch (requestError) {
        if (!active) return;
        if (requestError instanceof ApiError && requestError.status === 401) {
          router.replace("/login");
          return;
        }
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Could not load your websites.",
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadSites();
    return () => {
      active = false;
    };
  }, [router]);

  async function handleDelete(site: PublishedSite) {
    const confirmed = window.confirm(
      `Delete "${site.pages.find((page) => page.slug === "home")?.title || site.slug}"? This cannot be undone.`,
    );
    if (!confirmed) return;
    setDeletingSlug(site.slug);
    setError("");
    try {
      await deleteSite(site.slug, csrfToken);
      setSites((current) => current.filter((entry) => entry.slug !== site.slug));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not delete this website.",
      );
    } finally {
      setDeletingSlug(null);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <div>
            <Link className="text-sm font-semibold text-indigo-600" href="/editor">
              WebBuilder
            </Link>
            <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
              Your websites
            </h1>
          </div>
          <Link
            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            href="/editor"
          >
            Create website
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <p className="mb-6 text-sm text-slate-600">
          Saved websites appear here. Open one to edit it or view its published
          version.
        </p>

        {loading && (
          <div className="grid min-h-48 place-items-center">
            <LoadingSpinner label="Loading your websites" />
          </div>
        )}

        {error && (
          <p
            aria-live="polite"
            className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
            role="alert"
          >
            {error}
          </p>
        )}

        {!loading && !error && sites.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <h2 className="text-lg font-semibold text-slate-900">
              No saved websites yet
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Create and save a website, and it will be listed here.
            </p>
            <Link
              className="mt-5 inline-flex rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
              href="/editor"
            >
              Start building
            </Link>
          </div>
        )}

        {!loading && sites.length > 0 && (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sites.map((site) => {
              const homePage = site.pages.find((page) => page.slug === "home");
              const title = homePage?.title || site.slug;
              const blockCount = homePage?.blocks.length ?? site.blocks.length;
              return (
                <li
                  className="flex min-h-48 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  key={site.slug}
                >
                  <div className="flex-1">
                    <h2 className="truncate text-base font-semibold text-slate-900">
                      {title}
                    </h2>
                    <p className="mt-1 truncate text-sm text-slate-500">
                      /{site.slug}
                    </p>
                    <p className="mt-4 text-xs text-slate-500">
                      {site.pages.length || 1}{" "}
                      {site.pages.length === 1 ? "page" : "pages"} · {blockCount}{" "}
                      {blockCount === 1 ? "component" : "components"}
                    </p>
                  </div>
                  <div className="mt-5 flex gap-2">
                    <Link
                      className="flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white hover:bg-indigo-700"
                      href={`/editor?site=${encodeURIComponent(site.slug)}`}
                    >
                      Edit
                    </Link>
                    <Link
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      href={`/sites/${encodeURIComponent(site.slug)}`}
                      rel="noreferrer"
                      target="_blank"
                    >
                      View
                    </Link>
                    <button
                      className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                      disabled={deletingSlug === site.slug}
                      onClick={() => void handleDelete(site)}
                      type="button"
                    >
                      {deletingSlug === site.slug ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
