"use client";

import { use, useEffect, useState } from "react";

import { LoadingSpinner } from "@/components/loading-spinner";
import { SitePreview } from "@/components/site-preview";
import { ApiError, getSite, PublishedSite } from "@/lib/api";

const publishedSiteCache = new Map<string, PublishedSite>();

export function PublishedSitePage({
  params,
}: {
  params: Promise<{ slug: string; pageSlug?: string }>;
}) {
  const { slug, pageSlug = "home" } = use(params);
  const [loadedSite, setLoadedSite] = useState<{
    slug: string;
    site: PublishedSite;
  } | null>(() => {
    const cachedSite = publishedSiteCache.get(slug);
    return cachedSite ? { slug, site: cachedSite } : null;
  });
  const [loadError, setLoadError] = useState<{
    slug: string;
    message: string;
  } | null>(null);
  const site =
    (loadedSite?.slug === slug ? loadedSite.site : null) ??
    publishedSiteCache.get(slug) ??
    null;
  const error = loadError?.slug === slug ? loadError.message : "";

  useEffect(() => {
    let active = true;
    if (!publishedSiteCache.has(slug)) {
      void getSite(slug)
        .then((result) => {
          if (!active) return;
          publishedSiteCache.set(slug, result);
          setLoadedSite({ slug, site: result });
        })
        .catch((cause: unknown) => {
          if (!active) return;
          setLoadError({
            slug,
            message: cause instanceof ApiError && cause.status === 404
              ? "This website has not been published."
              : cause instanceof Error
                ? cause.message
                : "Could not load this website.",
          });
        });
    }

    return () => {
      active = false;
    };
  }, [slug]);

  if (site) return <SitePreview pageSlug={pageSlug} site={site} />;

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50">
      {error ? (
        <p className="text-sm text-rose-700" role="alert">{error}</p>
      ) : (
        <LoadingSpinner
          className="text-indigo-600"
          label="Loading website"
          size="lg"
        />
      )}
    </main>
  );
}
