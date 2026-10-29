"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { ImageCarousel } from "@/components/image-carousel";
import type {
  PublishedSite,
  SiteBlock,
  SiteNavItem,
  SitePage,
} from "@/lib/api";
import { isSafeLink, safeImageUrl } from "@/lib/editor-utils";

function navigationItems(block: SiteBlock, pages: SitePage[]): SiteNavItem[] {
  return block.navItems !== undefined && block.navItems !== null
    ? block.navItems
    : pages.length > 0
      ? pages.map((page) => ({ label: page.title, pageSlug: page.slug }))
      : [{ label: "Home", pageSlug: "home" }];
}

function renderBlock(block: SiteBlock, site: PublishedSite) {
  const fill = {
    color: block.color,
    backgroundColor: block.backgroundColor,
  };

  switch (block.type) {
    case "container":
      return (
        <div
          className="h-full w-full overflow-hidden rounded-3xl border border-slate-200/80 bg-white/80 p-5 shadow-lg shadow-slate-900/5"
          style={fill}
        >
          <span className="text-sm font-medium">{block.text || "Container"}</span>
        </div>
      );
    case "section":
      return (
        <section
          id="features"
          className="grid h-full w-full place-items-center overflow-hidden rounded-3xl border border-white/80 p-6 text-center shadow-lg shadow-slate-900/5"
          style={fill}
        >
          <span className="text-xl font-semibold tracking-tight sm:text-2xl">
            {block.text || "Section"}
          </span>
        </section>
      );
    case "heading":
      return (
        <h2
          className="flex h-full w-full items-center overflow-hidden break-words text-4xl font-bold tracking-tight sm:text-6xl"
          style={{ color: block.color }}
        >
          {block.text}
        </h2>
      );
    case "text":
      return (
        <p
          className="flex h-full w-full items-center overflow-hidden break-words text-base leading-7 sm:text-lg sm:leading-8"
          style={{ color: block.color }}
        >
          {block.text}
        </p>
      );
    case "image": {
      const imageUrl = safeImageUrl(block.url);
      return (
        <div
          aria-label={block.text || "Image"}
          className="grid h-full w-full place-items-center overflow-hidden rounded-3xl border border-white/70 bg-cover bg-center p-4 text-center text-sm shadow-xl shadow-slate-900/10 ring-1 ring-slate-900/5"
          role="img"
          style={{
            ...fill,
            backgroundImage: imageUrl ? `url("${imageUrl}")` : undefined,
          }}
        >
          {!imageUrl && (
            <span className="rounded-lg bg-white/80 px-3 py-2">
              ▧ {block.text || "Add an image URL"}
            </span>
          )}
        </div>
      );
    }
    case "button":
      return isSafeLink(block.url) ? (
        <a
          className="inline-flex h-full w-full items-center justify-center overflow-hidden break-words rounded-2xl border border-white/20 px-5 py-3 text-center font-semibold shadow-lg shadow-indigo-950/10 transition hover:-translate-y-0.5 hover:brightness-105"
          href={block.url.trim()}
          rel={block.url.startsWith("http") ? "noopener noreferrer" : undefined}
          style={fill}
        >
          {block.text}
        </a>
      ) : (
        <span
          className="inline-flex h-full w-full items-center justify-center overflow-hidden break-words rounded-2xl border border-slate-200 px-5 py-3 text-center font-semibold shadow-sm"
          style={fill}
        >
          {block.text}
        </span>
      );
    case "navbar":
      const navItems = navigationItems(block, site.pages);
      return (
        <nav
          aria-label="Website navigation"
          className="flex h-full w-full items-center justify-between gap-3 overflow-hidden rounded-2xl border border-white/80 px-5 shadow-lg shadow-slate-900/5 backdrop-blur"
          style={fill}
        >
          <span className="shrink-0 truncate font-semibold">{block.text}</span>
          <div className="flex min-w-0 items-center gap-3 text-xs">
            {navItems.map((item) => (
              <Link
                className="truncate hover:text-indigo-600"
                href={
                  item.pageSlug === "home"
                    ? `/sites/${encodeURIComponent(site.slug)}`
                    : `/sites/${encodeURIComponent(site.slug)}/${encodeURIComponent(item.pageSlug)}`
                }
                key={`${item.pageSlug}-${item.label}`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      );
    case "card": {
      const [title, ...description] = block.text.split("\n");
      return (
        <article
          className="flex h-full w-full flex-col justify-center overflow-hidden rounded-3xl border border-slate-200/80 p-6 text-left shadow-xl shadow-slate-900/5"
          style={fill}
        >
          <h3 className="text-lg font-semibold">{title || "Card title"}</h3>
          <p className="mt-2 overflow-hidden text-sm leading-6 opacity-80">
            {description.join("\n") || "Add a short card description."}
          </p>
          {isSafeLink(block.url) && (
            <a
              className="mt-3 text-sm font-medium text-indigo-600 hover:underline"
              href={block.url}
              rel={block.url.startsWith("http") ? "noopener noreferrer" : undefined}
            >
              Learn more
            </a>
          )}
        </article>
      );
    }
    case "columns": {
      const columns = block.text.split("\n");
      return (
        <div
          className="grid h-full w-full grid-cols-3 gap-3 overflow-hidden rounded-3xl border border-slate-200/70 p-3 shadow-lg shadow-slate-900/5"
          style={fill}
        >
          {[0, 1, 2].map((index) => (
            <div
              className="flex min-w-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-white/85 p-2 text-center text-xs font-medium shadow-sm sm:p-4 sm:text-sm"
              key={index}
            >
              {columns[index] || `Column ${index + 1}`}
            </div>
          ))}
        </div>
      );
    }
    case "spacer":
      return null;
    case "divider":
      return (
        <div className="flex h-full w-full items-center">
          <hr
            className="w-full border-0 border-t"
            style={{ borderColor: block.color }}
          />
        </div>
      );
    case "circle":
      return (
        <div
          aria-label={block.text || "Circle"}
          className="h-full w-full rounded-full shadow-2xl shadow-slate-900/15 ring-1 ring-slate-900/5"
          role={block.text ? "img" : undefined}
          style={fill}
        />
      );
    case "footer":
      return (
        <footer
          className="flex h-full w-full items-center justify-center overflow-hidden rounded-2xl border border-slate-200/70 px-5 text-center text-sm shadow-sm"
          style={fill}
        >
          {block.text}
        </footer>
      );
    case "carousel":
      return (
        <ImageCarousel
          backgroundColor={block.backgroundColor}
          images={block.images ?? []}
          label={block.text}
        />
      );
  }
}

export function SitePreview({
  site,
  pageSlug = "home",
}: {
  site: PublishedSite;
  pageSlug?: string;
}) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      setScale(
        window.innerWidth >= 768 ? window.innerWidth / site.page_width : 1,
      );
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [site.page_width]);

  const page = site.pages.find((entry) => entry.slug === pageSlug);
  if (site.pages.length > 0 && !page) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 px-6">
        <div className="text-center">
          <p className="text-sm text-slate-600">This page does not exist.</p>
          <Link
            className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:underline"
            href={`/sites/${encodeURIComponent(site.slug)}`}
          >
            Go to Home
          </Link>
        </div>
      </main>
    );
  }
  const blocks = [...site.blocks].sort(
    (first, second) => first.y - second.y || first.x - second.x,
  );
  const pageBlocks = [...(page?.blocks ?? blocks)].sort(
    (first, second) => first.y - second.y || first.x - second.x,
  );

  return (
    <main
      className="min-h-screen w-full overflow-auto"
      style={{ backgroundColor: site.canvas_color }}
    >
      <div
        aria-label="Published website"
        className="published-site relative w-full overflow-hidden"
        style={{
          backgroundColor: site.canvas_color,
          boxSizing: "border-box",
          maxWidth: "100%",
          minHeight: `max(100vh, ${site.page_height * scale}px)`,
        }}
      >
        {pageBlocks.map((block, index) => (
          <div
            className={`published-site-block absolute -translate-x-1/2 -translate-y-1/2 ${
              site.animation !== "none"
                ? `site-animation-block site-animation-${site.animation}`
                : ""
            }`}
            key={block.id}
            style={
              {
                left: `${block.x}%`,
                top: `${block.y}%`,
                transform: `rotate(${block.rotation ?? 0}deg)`,
                width: `${block.width * scale}px`,
                height: `${block.height * scale}px`,
                maxWidth: "94%",
                "--published-block-width": `${block.width * scale}px`,
                "--published-block-height": `${block.height * scale}px`,
                animationDelay: `${Math.min(index * 80, 800)}ms`,
              } as CSSProperties & {
                "--published-block-width": string;
                "--published-block-height": string;
              }
            }
          >
            {renderBlock(block, site)}
          </div>
        ))}
      </div>
    </main>
  );
}
