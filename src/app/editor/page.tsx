"use client";

import {
  FormEvent,
  PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import {
  ApiError,
  getCurrentUser,
  logout,
  saveSite,
  SiteDesign,
  SiteAnimation,
  SiteBlock,
  SiteNavItem,
  SitePage,
  uploadSiteImage,
  User,
} from "@/lib/api";
import { ImageCarousel } from "@/components/image-carousel";
import { LoadingSpinner } from "@/components/loading-spinner";
import {
  canvasPositionFromPointer,
  clampCanvasPercent,
  clampPageDimension,
  createRandomSiteSlug,
  fitCanvasZoom,
  isSafeLink,
  newBlockPosition,
  normalizeSiteSlug,
  safeMapUrl,
  safeImageUrl,
} from "@/lib/editor-utils";

type BlockType = SiteBlock["type"];
type Viewport = "desktop" | "mobile" | "custom";
type DragState = {
  mode: "move" | "resize" | "rotate";
  id: string;
  ids: string[];
  pointerId: number;
  startX: number;
  startY: number;
  startAngle: number;
  originX: number;
  originY: number;
  originWidth: number;
  originHeight: number;
  originRotation: number;
  originPositions: { id: string; x: number; y: number }[];
};

const blockLibrary: { type: BlockType; label: string; icon: string }[] = [
  { type: "container", label: "Container", icon: "▣" },
  { type: "section", label: "Section", icon: "▱" },
  { type: "heading", label: "Heading", icon: "T" },
  { type: "text", label: "Text", icon: "≡" },
  { type: "image", label: "Image", icon: "▧" },
  { type: "map", label: "Map", icon: "⌖" },
  { type: "carousel", label: "Slideshow", icon: "▤" },
  { type: "button", label: "Button", icon: "▰" },
  { type: "navbar", label: "Navbar", icon: "☰" },
  { type: "card", label: "Card", icon: "▤" },
  { type: "columns", label: "Columns", icon: "▥" },
  { type: "spacer", label: "Spacer", icon: "↕" },
  { type: "divider", label: "Divider", icon: "━" },
  { type: "footer", label: "Footer", icon: "▂" },
  { type: "circle", label: "Circle", icon: "◯" },
];

const initialPages: SitePage[] = [
  { id: "home", slug: "home", title: "Home", blocks: [] },
];

const initialBlocks: SiteBlock[] = [
  {
    id: "welcome-navbar",
    type: "navbar",
    text: "Horizon",
    x: 50,
    y: 8,
    width: 1200,
    height: 72,
    color: "#172554",
    backgroundColor: "#ffffff",
    url: "",
  },
  {
    id: "welcome-heading",
    type: "heading",
    text: "A site of your own.",
    x: 50,
    y: 28,
    width: 700,
    height: 84,
    color: "#172554",
    backgroundColor: "transparent",
    url: "",
  },
  {
    id: "welcome-copy",
    type: "text",
    text: "Bring your ideas to life with a website designed your way.",
    x: 50,
    y: 39,
    width: 700,
    height: 64,
    color: "#64748b",
    backgroundColor: "transparent",
    url: "",
  },
  {
    id: "welcome-button",
    type: "button",
    text: "Start building",
    x: 29,
    y: 50,
    width: 200,
    height: 58,
    color: "#ffffff",
    backgroundColor: "#4f46e5",
    url: "#features",
  },
  {
    id: "welcome-section",
    type: "section",
    text: "Thoughtfully built for your next big idea.",
    x: 50,
    y: 73,
    width: 720,
    height: 140,
    color: "#1e293b",
    backgroundColor: "#f1f5f9",
    url: "",
  },
  {
    id: "welcome-footer",
    type: "footer",
    text: "Made with WebBuilder",
    x: 50,
    y: 96,
    width: 1080,
    height: 48,
    color: "#64748b",
    backgroundColor: "transparent",
    url: "",
  },
];

const blockDefaults: Record<
  BlockType,
  Omit<SiteBlock, "id" | "x" | "y">
> = {
  container: {
    type: "container",
    text: "Container",
    width: 420,
    height: 240,
    color: "#334155",
    backgroundColor: "#f8fafc",
    url: "",
  },
  section: {
    type: "section",
    text: "New section",
    width: 520,
    height: 180,
    color: "#334155",
    backgroundColor: "#f1f5f9",
    url: "",
  },
  heading: {
    type: "heading",
    text: "Your new heading",
    width: 420,
    height: 90,
    color: "#172554",
    backgroundColor: "transparent",
    url: "",
  },
  text: {
    type: "text",
    text: "Add a little more about your idea.",
    width: 380,
    height: 80,
    color: "#64748b",
    backgroundColor: "transparent",
    url: "",
  },
  button: {
    type: "button",
    text: "Click here",
    width: 180,
    height: 58,
    color: "#ffffff",
    backgroundColor: "#4f46e5",
    url: "https://example.com",
  },
  image: {
    type: "image",
    text: "Image placeholder",
    width: 320,
    height: 180,
    color: "#3730a3",
    backgroundColor: "#e0e7ff",
    url: "",
  },
  map: {
    type: "map",
    text: "Map",
    width: 520,
    height: 320,
    color: "#334155",
    backgroundColor: "#e2e8f0",
    url: "",
  },
  navbar: {
    type: "navbar",
    text: "Your brand",
    width: 620,
    height: 72,
    color: "#0f172a",
    backgroundColor: "#ffffff",
    url: "",
  },
  card: {
    type: "card",
    text: "Card title\nAdd a short description for this card.",
    width: 280,
    height: 190,
    color: "#1e293b",
    backgroundColor: "#ffffff",
    url: "",
  },
  columns: {
    type: "columns",
    text: "First column\nSecond column\nThird column",
    width: 620,
    height: 180,
    color: "#334155",
    backgroundColor: "#ffffff",
    url: "",
  },
  spacer: {
    type: "spacer",
    text: "",
    width: 120,
    height: 100,
    color: "#64748b",
    backgroundColor: "transparent",
    url: "",
  },
  divider: {
    type: "divider",
    text: "",
    width: 500,
    height: 12,
    color: "#cbd5e1",
    backgroundColor: "transparent",
    url: "",
  },
  footer: {
    type: "footer",
    text: "© 2026 Your brand. All rights reserved.",
    width: 620,
    height: 90,
    color: "#64748b",
    backgroundColor: "#f8fafc",
    url: "",
  },
  circle: {
    type: "circle",
    text: "",
    width: 180,
    height: 180,
    color: "#ffffff",
    backgroundColor: "#4f46e5",
    url: "",
  },
  carousel: {
    type: "carousel",
    text: "Featured images",
    width: 520,
    height: 320,
    color: "#1e293b",
    backgroundColor: "#e0e7ff",
    url: "",
    images: [],
  },
};

function withSharedPageChrome(
  page: SitePage,
  homeBlocks: SiteBlock[],
): SitePage {
  const blocks = [...page.blocks];
  const homeNavigation = homeBlocks.find((block) => block.type === "navbar");
  const homeFooter = homeBlocks.find((block) => block.type === "footer");

  if (homeNavigation && !blocks.some((block) => block.type === "navbar")) {
    const navItems =
      homeNavigation.navItems === undefined || homeNavigation.navItems === null
        ? homeNavigation.navItems
        : [
            ...homeNavigation.navItems.filter(
              (item) => item.pageSlug !== page.slug,
            ),
            { label: page.title, pageSlug: page.slug },
          ].slice(-10);
    blocks.unshift({
      ...homeNavigation,
      id: crypto.randomUUID(),
      navItems,
    });
  }

  if (homeFooter && !blocks.some((block) => block.type === "footer")) {
    blocks.push({ ...homeFooter, id: crypto.randomUUID() });
  }

  return { ...page, blocks };
}

function defaultNavigationItems(pages: SitePage[]): SiteNavItem[] {
  return pages.map((page) => ({ label: page.title, pageSlug: page.slug }));
}

function renderBlockContent(
  block: SiteBlock,
  previewMode: boolean,
  pages: SitePage[],
  onNavigate: (pageSlug: string) => void,
) {
  const textColor = { color: block.color };
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
          style={textColor}
        >
          {block.text}
        </h2>
      );
    case "text":
      return (
        <p
          className="flex h-full w-full items-center overflow-hidden break-words text-base leading-7 sm:text-lg sm:leading-8"
          style={textColor}
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
          {!imageUrl ? (
            <span className="rounded-lg bg-white/80 px-3 py-2">
              ▧ {block.text || "Add an image URL"}
            </span>
          ) : null}
        </div>
      );
    }
    case "map": {
      const mapUrl = safeMapUrl(block.url);
      return mapUrl ? (
        <iframe
          allowFullScreen
          className={`h-full w-full border-0 ${
            previewMode ? "" : "pointer-events-none"
          }`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          src={mapUrl}
          title={block.text || "Map"}
        />
      ) : (
        <div
          className="grid h-full w-full place-items-center rounded-2xl border border-dashed border-slate-300 bg-slate-100 p-4 text-center text-sm text-slate-600"
          style={{ backgroundColor: block.backgroundColor }}
        >
          {mapUrl
            ? "Open Preview to interact with this map."
            : "Add an HTTPS map embed URL in component settings."}
        </div>
      );
    }
    case "button":
      return previewMode && isSafeLink(block.url) ? (
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
          title={
            previewMode ? "Add a safe URL in the button settings." : undefined
          }
        >
          {block.text}
        </span>
      );
    case "navbar":
      const navItems = block.navItems === undefined
        ? defaultNavigationItems(pages)
        : block.navItems ?? [];
      return (
        <nav
          aria-label="Website navigation"
          className="flex h-full w-full items-center justify-between gap-3 overflow-hidden rounded-2xl border border-white/80 px-5 shadow-lg shadow-slate-900/5 backdrop-blur"
          style={fill}
        >
          <span className="shrink-0 truncate font-semibold">{block.text}</span>
          <div className="flex min-w-0 items-center gap-3 text-xs">
            {navItems.map((item) => (
              <a
                className="truncate hover:text-indigo-600"
                href={previewMode ? `#${item.pageSlug}` : "#"}
                key={`${item.pageSlug}-${item.label}`}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  if (previewMode) onNavigate(item.pageSlug);
                }}
              >
                {item.label}
              </a>
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
          {isSafeLink(block.url) && previewMode && (
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
      return previewMode ? null : (
        <div className="grid h-full w-full place-items-center border border-dashed border-indigo-300 bg-indigo-50/40 text-[10px] text-indigo-500">
          Spacer
        </div>
      );
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

function AuthLoading() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50">
      <LoadingSpinner
        className="text-indigo-600"
        label="Checking your session"
        size="lg"
      />
    </main>
  );
}

function AnimationControl({
  value,
  onChange,
}: {
  value: SiteAnimation;
  onChange: (value: SiteAnimation) => void;
}) {
  return (
    <label className="flex items-center gap-2">
      <span className="shrink-0 text-xs font-medium text-slate-600">
        Entrance animation
      </span>
      <select
        className="min-w-0 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
        onChange={(event) => onChange(event.target.value as SiteAnimation)}
        value={value}
      >
        <option value="none">None</option>
        <option value="fade">Soft fade</option>
        <option value="rise">Rise up</option>
        <option value="zoom">Gentle zoom</option>
      </select>
    </label>
  );
}

function ColorControl({
  label,
  value,
  onChange,
  allowTransparent = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  allowTransparent?: boolean;
}) {
  const transparent = value === "transparent";
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-medium text-slate-600">
        {label}
      </span>
      <span className="flex items-center gap-3 rounded-xl border border-slate-200 p-2">
        <input
          aria-label={label}
          className="size-9 cursor-pointer rounded-lg border-0 bg-transparent"
          onChange={(event) => onChange(event.target.value)}
          type="color"
          value={transparent ? "#ffffff" : value}
        />
        <span className="flex-1 text-xs uppercase text-slate-500">
          {transparent ? "No fill" : value}
        </span>
        {allowTransparent && (
          <input
            aria-label="Transparent background"
            checked={transparent}
            className="size-4 accent-indigo-600"
            onChange={(event) =>
              onChange(event.target.checked ? "transparent" : "#ffffff")
            }
            title="Transparent background"
            type="checkbox"
          />
        )}
      </span>
    </label>
  );
}

function SizeControls({
  width,
  height,
  onChange,
}: {
  width: number;
  height: number;
  onChange: (field: "width" | "height", value: number) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {(
        [
          ["Width", "width", width],
          ["Height", "height", height],
        ] as const
      ).map(([label, field, value]) => (
        <label className="block" key={field}>
          <span className="mb-2 block text-xs font-medium text-slate-600">
            {label} (px)
          </span>
          <input
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
            max={field === "width" ? 1200 : 900}
            min={field === "width" ? 32 : 2}
            onChange={(event) => onChange(field, Number(event.target.value))}
            type="number"
            value={Math.round(value)}
          />
        </label>
      ))}
    </div>
  );
}

function RotationControl({
  value,
  onChange,
}: {
  value: number | undefined;
  onChange: (value: number) => void;
}) {
  const rotation = value ?? 0;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-600">
          Rotation
        </span>
        <span className="text-xs font-semibold tabular-nums text-slate-700">
          {rotation}°
        </span>
      </div>
      <div className="flex items-center gap-3">
        <input
          aria-label="Component rotation"
          className="h-2 min-w-0 flex-1 cursor-pointer accent-indigo-600"
          max={180}
          min={-180}
          onChange={(event) => onChange(Number(event.target.value))}
          step={1}
          type="range"
          value={rotation}
        />
        <button
          className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50"
          onClick={() => onChange(0)}
          type="button"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

function LinkControl({
  block,
  onChange,
}: {
  block: SiteBlock;
  onChange: (value: string) => void;
}) {
  const label = block.type === "image"
    ? "Image URL"
    : block.type === "map"
      ? "Map iframe URL"
      : "Link URL";
  const valid = block.type === "image"
    ? safeImageUrl(block.url) !== null
    : block.type === "map"
      ? safeMapUrl(block.url) !== null
      : isSafeLink(block.url);
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-medium text-slate-600">
        {label}
      </span>
      <input
        autoComplete="url"
        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
        onChange={(event) => {
          const value = event.target.value;
          onChange(
            block.type === "map" ? safeMapUrl(value) ?? value : value,
          );
        }}
        placeholder={
          block.type === "image"
            ? "https://example.com/image.jpg"
            : block.type === "map"
              ? "Paste a Google Maps iframe or its HTTPS src URL"
              : "https://example.com or /contact"
        }
        type="text"
        value={block.url}
      />
      <span
        className={`mt-2 block text-[11px] ${
          valid ? "text-emerald-700" : "text-amber-700"
        }`}
      >
        {valid
          ? block.type === "image"
            ? "Image URL is ready to preview."
            : block.type === "map"
              ? "Map embed URL is ready to preview."
              : "Link is ready to use in Preview."
          : block.type === "image"
            ? "Enter an absolute http(s) image URL."
            : block.type === "map"
              ? "Paste iframe code or its HTTPS src URL."
              : "Use an http(s), mailto, tel, or relative URL."}
      </span>
    </label>
  );
}

function ImageUploadControl({
  pending,
  error,
  onUpload,
}: {
  pending: boolean;
  error: string;
  onUpload: (file: File) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="block">
        <span className="mb-2 block text-xs font-medium text-slate-600">
          Upload image
        </span>
        <input
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          className="block w-full cursor-pointer rounded-xl border border-slate-200 text-xs text-slate-600 file:mr-3 file:cursor-pointer file:border-0 file:bg-indigo-50 file:px-3 file:py-2.5 file:text-xs file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100"
          disabled={pending}
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            event.currentTarget.value = "";
            if (file) onUpload(file);
          }}
          type="file"
        />
      </label>
      {pending ? (
        <LoadingSpinner
          className="text-indigo-600"
          label="Uploading image"
          size="sm"
        />
      ) : (
        <p className="text-[11px] text-slate-500">
          Choose JPEG, PNG, WebP, GIF, or AVIF (up to 5 MB).
        </p>
      )}
      {error && (
        <p className="text-xs text-rose-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function CarouselUploadControl({
  images,
  pending,
  error,
  onUpload,
  onRemove,
}: {
  images: string[];
  pending: boolean;
  error: string;
  onUpload: (file: File, index: number) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-semibold text-slate-700">Slideshow images</p>
        <p className="mt-1 text-[11px] text-slate-500">
          Add up to three images. Visitors can browse with arrows and dots.
        </p>
      </div>
      <div className="space-y-2">
        {[0, 1, 2].map((index) => {
          const image = images[index];
          const canUpload = index <= images.length;
          return (
            <div
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-2"
              key={index}
            >
              <div
                aria-label={image ? `Slide ${index + 1} image` : undefined}
                className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-lg bg-gradient-to-br from-slate-50 to-indigo-100 text-lg text-indigo-500"
                role={image ? "img" : undefined}
                style={
                  image
                    ? {
                        backgroundImage: `url("${image}")`,
                        backgroundPosition: "center",
                        backgroundSize: "cover",
                      }
                    : undefined
                }
              >
                {!image && "+"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-700">
                  {image ? `Slide ${index + 1}` : `Add slide ${index + 1}`}
                </p>
                <label
                  className={`mt-1 inline-block text-[11px] font-medium ${
                    canUpload && !pending
                      ? "cursor-pointer text-indigo-600 hover:text-indigo-700"
                      : "cursor-not-allowed text-slate-400"
                  }`}
                >
                  {pending
                    ? (
                      <LoadingSpinner
                        className="text-indigo-600"
                        label="Uploading slide"
                        size="sm"
                      />
                    )
                    : image
                      ? "Replace image"
                      : canUpload
                        ? "Choose image"
                        : "Add the previous image first"}
                  <input
                    accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                    className="sr-only"
                    disabled={!canUpload || pending}
                    onChange={(event) => {
                      const file = event.currentTarget.files?.[0];
                      event.currentTarget.value = "";
                      if (file) onUpload(file, index);
                    }}
                    type="file"
                  />
                </label>
              </div>
              {image && (
                <button
                  aria-label={`Remove slide ${index + 1}`}
                  className="grid size-8 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                  disabled={pending}
                  onClick={() => onRemove(index)}
                  type="button"
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
      </div>
      {error && (
        <p className="text-xs text-rose-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function NavigationItemsControl({
  block,
  pages,
  onChange,
}: {
  block: SiteBlock;
  pages: SitePage[];
  onChange: (items: SiteNavItem[]) => void;
}) {
  const items = block.navItems === undefined
    ? defaultNavigationItems(pages)
    : block.navItems ?? [];

  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-semibold text-slate-700">Navigation links</p>
        <p className="mt-1 text-[11px] text-slate-500">
          Choose which pages appear in this navbar and customize their labels.
        </p>
      </div>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            className="space-y-2 rounded-xl border border-slate-200 bg-white p-3"
            key={`${index}-${item.pageSlug}`}
          >
            <label className="block">
              <span className="mb-1 block text-[11px] font-medium text-slate-500">
                Link label
              </span>
              <input
                className="w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs outline-none focus:border-indigo-400"
                maxLength={40}
                onChange={(event) =>
                  onChange(
                    items.map((entry, entryIndex) =>
                      entryIndex === index
                        ? { ...entry, label: event.target.value }
                        : entry,
                    ),
                  )
                }
                value={item.label}
              />
            </label>
            <div className="flex items-end gap-2">
              <label className="min-w-0 flex-1">
                <span className="mb-1 block text-[11px] font-medium text-slate-500">
                  Goes to page
                </span>
                <select
                  className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs outline-none focus:border-indigo-400"
                  onChange={(event) =>
                    onChange(
                      items.map((entry, entryIndex) =>
                        entryIndex === index
                          ? { ...entry, pageSlug: event.target.value }
                          : entry,
                      ),
                    )
                  }
                  value={item.pageSlug}
                >
                  {pages.map((page) => (
                    <option key={page.id} value={page.slug}>
                      {page.title}
                    </option>
                  ))}
                </select>
              </label>
              <button
                aria-label={`Remove ${item.label || "navigation"} link`}
                className="grid size-9 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                onClick={() =>
                  onChange(items.filter((_, entryIndex) => entryIndex !== index))
                }
                type="button"
              >
                ×
              </button>
            </div>
            <div className="flex justify-end gap-1">
              <button
                aria-label={`Move ${item.label || "navigation"} link up`}
                className="grid size-7 place-items-center rounded-md text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                disabled={index === 0}
                onClick={() => {
                  const reordered = [...items];
                  [reordered[index - 1], reordered[index]] = [
                    reordered[index],
                    reordered[index - 1],
                  ];
                  onChange(reordered);
                }}
                type="button"
              >
                ↑
              </button>
              <button
                aria-label={`Move ${item.label || "navigation"} link down`}
                className="grid size-7 place-items-center rounded-md text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                disabled={index === items.length - 1}
                onClick={() => {
                  const reordered = [...items];
                  [reordered[index], reordered[index + 1]] = [
                    reordered[index + 1],
                    reordered[index],
                  ];
                  onChange(reordered);
                }}
                type="button"
              >
                ↓
              </button>
            </div>
          </div>
        ))}
      </div>
      <button
        className="w-full rounded-lg border border-dashed border-indigo-300 px-3 py-2 text-xs font-medium text-indigo-700 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={items.length >= 10 || pages.length === 0}
        onClick={() => {
          const unusedPage = pages.find(
            (page) => !items.some((item) => item.pageSlug === page.slug),
          );
          const target = unusedPage ?? pages[0];
          if (target) {
            onChange([...items, { label: target.title, pageSlug: target.slug }]);
          }
        }}
        type="button"
      >
        + Add navigation link
      </button>
    </div>
  );
}

function PageSizeControls({
  width,
  height,
  onChange,
}: {
  width: number;
  height: number;
  onChange: (dimension: "width" | "height", value: number) => void;
}) {
  const [draftWidth, setDraftWidth] = useState(String(width));
  const [draftHeight, setDraftHeight] = useState(String(height));

  function commit(dimension: "width" | "height", draft: string) {
    const value = Number(draft);
    if (!draft.trim() || !Number.isFinite(value)) {
      if (dimension === "width") setDraftWidth(String(width));
      else setDraftHeight(String(height));
      return;
    }
    onChange(dimension, value);
  }

  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-xs font-medium text-slate-500 sm:inline">
        Page size
      </span>
      {(
        [
          ["width", "W"],
          ["height", "H"],
        ] as const
      ).map(([dimension, label]) => {
        const value = dimension === "width" ? draftWidth : draftHeight;
        const setValue = dimension === "width" ? setDraftWidth : setDraftHeight;
        return (
          <label className="flex items-center gap-1" key={dimension}>
            <span className="text-[11px] text-slate-400">{label}</span>
            <input
              aria-label={`Page ${dimension} in pixels`}
              className="w-16 rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-700 outline-none focus:border-indigo-400"
              max={dimension === "width" ? 4000 : 10000}
              min={dimension === "width" ? 320 : 400}
              onBlur={() => commit(dimension, value)}
              onChange={(event) => setValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") event.currentTarget.blur();
              }}
              type="number"
              value={value}
            />
          </label>
        );
      })}
      <span className="text-[11px] text-slate-400">px</span>
    </div>
  );
}

export default function EditorPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLDivElement>(null);
  const canvasFrameRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<HTMLElement>(null);
  const dragState = useRef<DragState | null>(null);
  const componentClipboard = useRef<SiteBlock[]>([]);
  const pasteCount = useRef(0);
  const [user, setUser] = useState<User | null>(null);
  const [csrfToken, setCsrfToken] = useState("");
  const [authError, setAuthError] = useState("");
  const [blocks, setBlocks] = useState(initialBlocks);
  const [sitePages, setSitePages] = useState<SitePage[]>([
    { ...initialPages[0], blocks: initialBlocks },
  ]);
  const [activePageSlug, setActivePageSlug] = useState("home");
  const [selectedId, setPrimarySelectedId] = useState<string | null>("welcome-heading");
  const [selectedIds, setSelectedIds] = useState<string[]>(["welcome-heading"]);
  const [canvasColor, setCanvasColor] = useState("#ffffff");
  const [siteAnimation, setSiteAnimation] = useState<SiteAnimation>("none");
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [pageWidth, setPageWidth] = useState(1200);
  const [pageHeight, setPageHeight] = useState(900);
  const [canvasZoom, setCanvasZoom] = useState(1);
  const [fitCanvasToWidth, setFitCanvasToWidth] = useState(true);
  const [activeDrag, setActiveDrag] = useState<BlockType | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [logoutPending, setLogoutPending] = useState(false);
  const [siteSlug, setSiteSlug] = useState("my-site");
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState("");
  const [imageUploading, setImageUploading] = useState(false);
  const [imageUploadError, setImageUploadError] = useState("");

  function setSelectedId(id: string | null) {
    setPrimarySelectedId(id);
    setSelectedIds(id ? [id] : []);
  }

  function selectBlock(id: string, additive: boolean, toggle = false) {
    if (!additive) {
      setPrimarySelectedId(id);
      setSelectedIds([id]);
      return;
    }

    if (selectedIds.includes(id)) {
      if (toggle) {
        const next = selectedIds.filter((selected) => selected !== id);
        setPrimarySelectedId(next.at(-1) ?? null);
        setSelectedIds(next);
        return;
      }
      setPrimarySelectedId(id);
      return;
    }

    setPrimarySelectedId(id);
    setSelectedIds([...selectedIds, id]);
  }

  const fitCanvas = useCallback(() => {
    const workspace = workspaceRef.current;
    const canvasFrame = canvasFrameRef.current;
    if (!workspace || !canvasFrame) return;
    const workspaceBounds = workspace.getBoundingClientRect();
    const frameBounds = canvasFrame.getBoundingClientRect();
    const frameTop = frameBounds.top - workspaceBounds.top;
    const availableWidth = Math.max(1, workspace.clientWidth - 48);
    const availableHeight = Math.max(
      1,
      workspace.clientHeight - frameTop - 72,
    );
    setCanvasZoom(
      fitCanvasZoom(pageWidth, pageHeight, availableWidth, availableHeight),
    );
  }, [pageHeight, pageWidth]);

  useEffect(() => {
    if (!fitCanvasToWidth) return;
    fitCanvas();
    const workspace = workspaceRef.current;
    const canvasFrame = canvasFrameRef.current;
    if (!workspace || !canvasFrame) return;
    const observer = new ResizeObserver(fitCanvas);
    observer.observe(workspace);
    observer.observe(canvasFrame);
    return () => observer.disconnect();
  }, [activePageSlug, fitCanvas, fitCanvasToWidth, previewMode, viewport]);

  useEffect(() => {
    function handleEditorShortcuts(event: KeyboardEvent) {
      if (previewMode) return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        target.closest("input, textarea, select, [contenteditable='true']")
      ) {
        return;
      }

      const focused = document.activeElement;
      if (
        focused instanceof HTMLElement &&
        focused !== document.body &&
        !canvasRef.current?.contains(focused) &&
        !workspaceRef.current?.contains(focused)
      ) {
        return;
      }

      const hasModifier = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();
      if (hasModifier && key === "c") {
        const selected = blocks.filter((block) => selectedIds.includes(block.id));
        if (selected.length === 0) return;
        event.preventDefault();
        componentClipboard.current = selected.map((block) => ({ ...block }));
        pasteCount.current = 0;
        return;
      }

      if (hasModifier && key === "v") {
        const source = componentClipboard.current;
        if (source.length === 0) return;
        event.preventDefault();
        pasteCount.current += 1;
        const offset = pasteCount.current * 5;
        const pasted = source.map((block) => ({
          ...block,
          id: crypto.randomUUID(),
          x: clampCanvasPercent(block.x + offset),
          y: clampCanvasPercent(block.y + offset),
        }));
        setBlocks((current) => [...current, ...pasted]);
        const pastedIds = pasted.map((block) => block.id);
        setPrimarySelectedId(pastedIds.at(-1) ?? null);
        setSelectedIds(pastedIds);
        return;
      }

      if (!hasModifier && (key === "backspace" || key === "delete")) {
        if (selectedIds.length === 0) return;
        event.preventDefault();
        setBlocks((current) =>
          current.filter((block) => !selectedIds.includes(block.id)),
        );
        setSelectedId(null);
      }
    }

    window.addEventListener("keydown", handleEditorShortcuts);
    return () => window.removeEventListener("keydown", handleEditorShortcuts);
  }, [blocks, previewMode, selectedId, selectedIds]);

  function changeCanvasZoom(amount: number) {
    setFitCanvasToWidth(false);
    setCanvasZoom((current) =>
      Math.min(2, Math.max(0.05, Math.round((current + amount) * 100) / 100)),
    );
  }

  function updateSiteSlug(value: string) {
    setSiteSlug(normalizeSiteSlug(value));
  }

  function navigateEditorPage(pageSlug: string) {
    const nextPage = sitePages.find((page) => page.slug === pageSlug);
    if (!nextPage || nextPage.slug === activePageSlug) return;
    const homePage = sitePages.find((page) => page.slug === "home");
    const homeBlocks =
      activePageSlug === "home" ? blocks : homePage?.blocks ?? [];
    const pageWithChrome =
      pageSlug === "home"
        ? nextPage
        : withSharedPageChrome(nextPage, homeBlocks);
    setSitePages((current) =>
      current.map((page) =>
        page.slug === activePageSlug
          ? { ...page, blocks }
          : page.slug === pageWithChrome.slug
            ? pageWithChrome
            : page,
      ),
    );
    setBlocks(pageWithChrome.blocks);
    setActivePageSlug(pageWithChrome.slug);
    setSelectedId(null);
  }

  function addSitePage() {
    if (sitePages.length >= 20) return;
    let number = sitePages.length + 1;
    let title = `Page ${number}`;
    let slug = normalizeSiteSlug(title);
    while (sitePages.some((page) => page.slug === slug)) {
      number += 1;
      title = `Page ${number}`;
      slug = normalizeSiteSlug(title);
    }

    const homePage = sitePages.find((page) => page.slug === "home");
    const homeBlocks =
      activePageSlug === "home" ? blocks : homePage?.blocks ?? [];
    const newPage = withSharedPageChrome({
      id: crypto.randomUUID(),
      title,
      slug,
      blocks: [],
    }, homeBlocks);
    setSitePages((current) =>
      current.map((page) =>
        page.slug === activePageSlug ? { ...page, blocks } : page,
      ).concat(newPage),
    );
    setActivePageSlug(slug);
    setBlocks(newPage.blocks);
    setSelectedId(null);
    setPreviewMode(false);
  }

  function removeCurrentPage() {
    if (activePageSlug === "home" || sitePages.length <= 1) return;
    const nextPage = sitePages.find((page) => page.slug === "home");
    if (!nextPage) return;

    const remaining = sitePages
      .filter((page) => page.slug !== activePageSlug)
      .map((page) => ({
        ...page,
        blocks: page.blocks.map((block) =>
          block.type === "navbar"
            ? {
                ...block,
                navItems: block.navItems?.filter(
                  (item) => item.pageSlug !== activePageSlug,
                ),
              }
            : block,
        ),
      }));
    setSitePages(remaining);
    setBlocks(nextPage.blocks);
    setActivePageSlug(nextPage.slug);
    setSelectedId(null);
  }

  function updateCurrentPageTitle(title: string) {
    const nextTitle = title.trim().slice(0, 40) || "Untitled page";
    let slug = activePageSlug === "home" ? "home" : normalizeSiteSlug(nextTitle);
    if (!slug) slug = "page";
    if (slug !== activePageSlug) {
      const base = slug.slice(0, 32);
      let suffix = 2;
      while (
        sitePages.some(
          (page) => page.slug === `${base}-${suffix}` && page.slug !== activePageSlug,
        )
      ) {
        suffix += 1;
      }
      if (sitePages.some((page) => page.slug === slug && page.slug !== activePageSlug)) {
        slug = `${base}-${suffix}`;
      }
    }
    const previousSlug = activePageSlug;
    setSitePages((current) =>
      current.map((page) => {
        if (page.slug === previousSlug) {
          return { ...page, title: nextTitle, slug };
        }
        return {
          ...page,
          blocks: page.blocks.map((block) =>
            block.type === "navbar"
              ? {
                  ...block,
                  navItems: block.navItems?.map((item) =>
                    item.pageSlug === previousSlug
                      ? { ...item, pageSlug: slug }
                      : item,
                  ),
                }
              : block,
          ),
        };
      }),
    );
    setBlocks((current) =>
      current.map((block) =>
        block.type === "navbar"
          ? {
              ...block,
              navItems: block.navItems?.map((item) =>
                item.pageSlug === previousSlug
                  ? { ...item, pageSlug: slug }
                  : item,
              ),
            }
          : block,
      ),
    );
    setActivePageSlug(slug);
  }

  async function publishSite(slug: string, retryRandomSlug = false) {
    if (!slug) {
      setPublishError("Enter a website slug before saving.");
      return;
    }
    const previewTab = window.open("about:blank", "_blank");
    if (!previewTab) {
      setPublishError("Allow pop-ups to open your website in a new tab.");
      return;
    }
    previewTab.opener = null;
    setPublishing(true);
    setPublishError("");
    const allPages = sitePages.map((page) => ({
      ...page,
      blocks: (page.slug === activePageSlug ? blocks : page.blocks).map((block) => ({
        ...block,
        width: Math.round(block.width),
        height: Math.round(block.height),
      })),
    }));
    const homePage = allPages.find((page) => page.slug === "home");
    if (!homePage) {
      setPublishError("Your website must include a Home page.");
      return;
    }
    const design: SiteDesign = {
      blocks: homePage.blocks,
      pages: allPages,
      page_width: pageWidth,
      page_height: pageHeight,
      canvas_color: canvasColor,
      animation: siteAnimation,
    };
    let slugToSave = slug;
    try {
      for (let attempt = 0; ; attempt += 1) {
        try {
          const saved = await saveSite(slugToSave, design, csrfToken);
          setSiteSlug(saved.slug);
          previewTab.location.href = new URL(
            `/sites/${encodeURIComponent(saved.slug)}`,
            window.location.origin,
          ).toString();
          return;
        } catch (error) {
          if (
            retryRandomSlug &&
            error instanceof ApiError &&
            error.status === 409 &&
            attempt < 2
          ) {
            slugToSave = createRandomSiteSlug();
            setSiteSlug(slugToSave);
            continue;
          }
          throw error;
        }
      }
    } catch (error) {
      previewTab.close();
      setPublishError(
        error instanceof Error ? error.message : "Could not save your website.",
      );
    } finally {
      setPublishing(false);
    }
  }

  function generateSiteSlug() {
    const slug = createRandomSiteSlug();
    updateSiteSlug(slug);
    void publishSite(slug, true);
  }

  const checkSession = useCallback(async () => {
    setAuthError("");
    try {
      const session = await getCurrentUser();
      setUser(session.user);
      setCsrfToken(session.csrf_token);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        router.replace("/login");
        return;
      }
      setAuthError(
        error instanceof Error ? error.message : "Could not verify your session.",
      );
    }
  }, [router]);

  useEffect(() => {
    let active = true;
    void getCurrentUser()
      .then((session) => {
        if (active) {
          setUser(session.user);
          setCsrfToken(session.csrf_token);
        }
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (error instanceof ApiError && error.status === 401) {
          router.replace("/login");
          return;
        }
        setAuthError(
          error instanceof Error
            ? error.message
            : "Could not verify your session.",
        );
      });
    return () => {
      active = false;
    };
  }, [router]);

  async function handleLogout() {
    setLogoutPending(true);
    try {
      await logout(csrfToken);
      router.replace("/login");
    } catch (error) {
      setAuthError(
        error instanceof Error ? error.message : "Could not sign out.",
      );
      setLogoutPending(false);
    }
  }

  function addBlock(type: BlockType, x?: number, y?: number) {
    const position =
      x !== undefined && y !== undefined
        ? { x, y }
        : newBlockPosition(
            blocks.length,
            activePageSlug === "home" ? initialBlocks.length : 0,
          );
    const block: SiteBlock = {
      id: crypto.randomUUID(),
      ...blockDefaults[type],
      x: clampCanvasPercent(position.x),
      y: clampCanvasPercent(position.y),
    };
    setBlocks((current) => [...current, block]);
    setSelectedId(block.id);
  }

  function canvasPosition(clientX: number, clientY: number) {
    const bounds = canvasRef.current?.getBoundingClientRect();
    return bounds
      ? canvasPositionFromPointer(clientX, clientY, bounds)
      : { x: 50, y: 50 };
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const draggedType = event.dataTransfer.getData("text/plain");
    const type =
      activeDrag ??
      blockLibrary.find((block) => block.type === draggedType)?.type;
    if (type) {
      const position = canvasPosition(event.clientX, event.clientY);
      addBlock(type, position.x, position.y);
    }
    setActiveDrag(null);
  }

  function updateSelected(
    field: "text" | "color" | "backgroundColor" | "url",
    value: string,
  ) {
    setBlocks((current) =>
      current.map((block) =>
        block.id === selectedId ? { ...block, [field]: value } : block,
      ),
    );
  }

  function updateSelectedNavigation(items: SiteNavItem[]) {
    const targetBlock = blocks.find((block) => block.id === selectedId);
    if (!targetBlock || targetBlock.type !== "navbar") return;
    const nextItems = items.map((item) => ({
      ...item,
      pageSlug:
        item.pageSlug === activePageSlug
          ? activePageSlug
          : sitePages.some((page) => page.slug === item.pageSlug)
            ? item.pageSlug
            : "home",
    }));
    setBlocks((current) =>
      current.map((block) =>
        block.id === selectedId && block.type === "navbar"
          ? { ...block, navItems: nextItems }
          : block,
      ),
    );
  }

  async function handleImageUpload(file: File) {
    const blockId = selectedId;
    if (!blockId) return;
    setImageUploadError("");
    setImageUploading(true);
    try {
      const { url } = await uploadSiteImage(file, csrfToken);
      setBlocks((current) =>
        current.map((block) =>
          block.id === blockId ? { ...block, url } : block,
        ),
      );
    } catch (error) {
      setImageUploadError(
        error instanceof Error ? error.message : "Could not upload this image.",
      );
    } finally {
      setImageUploading(false);
    }
  }

  async function handleCarouselImageUpload(file: File, index: number) {
    const blockId = selectedId;
    if (!blockId) return;
    setImageUploadError("");
    setImageUploading(true);
    try {
      const { url } = await uploadSiteImage(file, csrfToken);
      setBlocks((current) =>
        current.map((block) => {
          if (block.id !== blockId || block.type !== "carousel") return block;
          const images = [...(block.images ?? [])];
          if (index <= images.length && index < 3) {
            images[index] = url;
          }
          return { ...block, images: images.slice(0, 3) };
        }),
      );
    } catch (error) {
      setImageUploadError(
        error instanceof Error ? error.message : "Could not upload this image.",
      );
    } finally {
      setImageUploading(false);
    }
  }

  function removeCarouselImage(index: number) {
    setImageUploadError("");
    setBlocks((current) =>
      current.map((block) =>
        block.id === selectedId && block.type === "carousel"
          ? {
              ...block,
              images: (block.images ?? []).filter((_, imageIndex) => imageIndex !== index),
            }
          : block,
      ),
    );
  }

  function updateSelectedSize(field: "width" | "height", value: number) {
    if (!Number.isFinite(value)) return;
    const min = field === "width" ? 32 : 2;
    const max = field === "width" ? 1200 : 900;
    setBlocks((current) =>
      current.map((block) =>
        block.id === selectedId
          ? { ...block, [field]: Math.min(max, Math.max(min, value)) }
          : block,
      ),
    );
  }

  function updateSelectedRotation(value: number) {
    if (!Number.isFinite(value)) return;
    const rotation = Math.min(180, Math.max(-180, Math.round(value)));
    setBlocks((current) =>
      current.map((block) =>
        block.id === selectedId ? { ...block, rotation } : block,
      ),
    );
  }

  function updatePageDimension(
    dimension: "width" | "height",
    value: number,
  ) {
    const size = clampPageDimension(dimension, value);
    if (dimension === "width") {
      setPageWidth(size);
      setBlocks((current) =>
        current.map((block) =>
          block.id === "welcome-navbar"
            ? { ...block, width: size }
            : block,
        ),
      );
    } else {
      setPageHeight(size);
    }
    setViewport("custom");
  }

  function selectViewport(size: Exclude<Viewport, "custom">) {
    setViewport(size);
    const width = size === "desktop" ? 1200 : 390;
    setPageWidth(width);
    setPageHeight(size === "desktop" ? 900 : 844);
    setBlocks((current) =>
      current.map((block) =>
        block.id === "welcome-navbar" ? { ...block, width } : block,
      ),
    );
  }

  function removeSelected() {
    if (selectedIds.length === 0) return;
    setBlocks((current) =>
      current.filter((block) => !selectedIds.includes(block.id)),
    );
    setSelectedId(null);
  }

  function duplicateSelected() {
    const sources = blocks.filter((block) => selectedIds.includes(block.id));
    if (sources.length === 0) return;
    const duplicates = sources.map((source) => ({
      ...source,
      id: crypto.randomUUID(),
      x: clampCanvasPercent(source.x + 5),
      y: clampCanvasPercent(source.y + 5),
    }));
    setBlocks((current) => [...current, ...duplicates]);
    const duplicateIds = duplicates.map((block) => block.id);
    setPrimarySelectedId(duplicateIds.at(-1) ?? null);
    setSelectedIds(duplicateIds);
  }

  function startMoving(
    event: ReactPointerEvent<HTMLDivElement>,
    block: SiteBlock,
  ) {
    if (previewMode || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const additiveSelection = event.shiftKey || event.ctrlKey || event.metaKey;
    if ((event.ctrlKey || event.metaKey) && selectedIds.includes(block.id)) {
      selectBlock(block.id, true, true);
      return;
    }
    if (!additiveSelection) {
      selectBlock(block.id, false);
    } else {
      selectBlock(block.id, true);
    }
    const movingIds =
      additiveSelection && selectedIds.includes(block.id)
        ? selectedIds
        : additiveSelection
          ? [...selectedIds, block.id]
          : [block.id];
    event.currentTarget.setPointerCapture(event.pointerId);
    dragState.current = {
      mode: "move",
      id: block.id,
      ids: movingIds,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startAngle: 0,
      originX: block.x,
      originY: block.y,
      originWidth: block.width,
      originHeight: block.height,
      originRotation: block.rotation ?? 0,
      originPositions: blocks
        .filter((entry) => movingIds.includes(entry.id))
        .map((entry) => ({ id: entry.id, x: entry.x, y: entry.y })),
    };
  }

  function startResizing(
    event: ReactPointerEvent<HTMLButtonElement>,
    block: SiteBlock,
  ) {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    setSelectedId(block.id);
    dragState.current = {
      mode: "resize",
      id: block.id,
      ids: [block.id],
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startAngle: 0,
      originX: block.x,
      originY: block.y,
      originWidth: block.width,
      originHeight: block.height,
      originRotation: block.rotation ?? 0,
      originPositions: [{ id: block.id, x: block.x, y: block.y }],
    };
  }

  function startRotating(
    event: ReactPointerEvent<HTMLButtonElement>,
    block: SiteBlock,
  ) {
    event.preventDefault();
    event.stopPropagation();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const bounds = canvas.getBoundingClientRect();
    const centerX = bounds.left + (bounds.width * block.x) / 100;
    const centerY = bounds.top + (bounds.height * block.y) / 100;
    const startAngle =
      (Math.atan2(event.clientY - centerY, event.clientX - centerX) * 180) /
      Math.PI;
    event.currentTarget.setPointerCapture(event.pointerId);
    setSelectedId(block.id);
    dragState.current = {
      mode: "rotate",
      id: block.id,
      ids: [block.id],
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startAngle,
      originX: block.x,
      originY: block.y,
      originWidth: block.width,
      originHeight: block.height,
      originRotation: block.rotation ?? 0,
      originPositions: [{ id: block.id, x: block.x, y: block.y }],
    };
  }

  function moveSelected(event: ReactPointerEvent<HTMLElement>) {
    const drag = dragState.current;
    const canvas = canvasRef.current;
    if (!drag || drag.pointerId !== event.pointerId || !canvas) return;
    const bounds = canvas.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    if (drag.mode === "rotate") {
      const centerX = bounds.left + (bounds.width * drag.originX) / 100;
      const centerY = bounds.top + (bounds.height * drag.originY) / 100;
      const currentAngle =
        (Math.atan2(event.clientY - centerY, event.clientX - centerX) * 180) /
        Math.PI;
      const angleDelta =
        ((currentAngle - drag.startAngle + 540) % 360) - 180;
      const rotation = Math.min(
        180,
        Math.max(-180, Math.round(drag.originRotation + angleDelta)),
      );
      setBlocks((current) =>
        current.map((block) =>
          block.id === drag.id ? { ...block, rotation } : block,
        ),
      );
      return;
    }
    if (drag.mode === "resize") {
      const width =
        drag.originWidth + (event.clientX - drag.startX) / canvasZoom;
      const height =
        drag.originHeight + (event.clientY - drag.startY) / canvasZoom;
      setBlocks((current) =>
        current.map((block) =>
          block.id === drag.id
            ? {
                ...block,
                width: Math.min(1200, Math.max(32, width)),
                height: Math.min(900, Math.max(2, height)),
              }
            : block,
        ),
      );
      return;
    }

    const deltaX = ((event.clientX - drag.startX) / bounds.width) * 100;
    const deltaY = ((event.clientY - drag.startY) / bounds.height) * 100;
    setBlocks((current) =>
      current.map((block) =>
        drag.ids.includes(block.id)
          ? {
              ...block,
              x: clampCanvasPercent(
                (drag.originPositions.find((origin) => origin.id === block.id)
                  ?.x ?? block.x) + deltaX,
              ),
              y: clampCanvasPercent(
                (drag.originPositions.find((origin) => origin.id === block.id)
                  ?.y ?? block.y) + deltaY,
              ),
            }
          : block,
      ),
    );
  }

  function stopMoving(event: ReactPointerEvent<HTMLElement>) {
    if (dragState.current?.pointerId === event.pointerId) {
      dragState.current = null;
    }
  }

  function moveWithKeyboard(
    event: React.KeyboardEvent<HTMLDivElement>,
    block: SiteBlock,
  ) {
    const step = event.shiftKey ? 5 : 1;
    const positions: Record<string, { x: number; y: number }> = {
      ArrowLeft: { x: block.x - step, y: block.y },
      ArrowRight: { x: block.x + step, y: block.y },
      ArrowUp: { x: block.x, y: block.y - step },
      ArrowDown: { x: block.x, y: block.y + step },
    };
    const next = positions[event.key];
    if (!next) return;
    event.preventDefault();
    if (!selectedIds.includes(block.id)) setSelectedId(block.id);
    setBlocks((current) =>
      current.map((item) =>
        selectedIds.includes(item.id) || item.id === block.id
          ? {
              ...item,
              x: clampCanvasPercent(item.x + next.x - block.x),
              y: clampCanvasPercent(item.y + next.y - block.y),
            }
          : item,
      ),
    );
  }

  if (!user) {
    if (authError) {
      return (
        <main className="grid min-h-screen place-items-center bg-slate-50 px-6">
          <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm">
            <h1 className="text-lg font-semibold text-slate-900">
              Could not connect to your account
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">{authError}</p>
            <button
              className="mt-5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
              onClick={() => void checkSession()}
              type="button"
            >
              Try again
            </button>
          </div>
        </main>
      );
    }
    return <AuthLoading />;
  }

  const selectedBlock = blocks.find((block) => block.id === selectedId) ?? null;
  const selectedPage =
    sitePages.find((page) => page.slug === activePageSlug) ?? sitePages[0];
  const editorHeaderWidth = `${Math.max(320, pageWidth * canvasZoom - 44)}px`;

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-[#f5f6fa] text-slate-900">
      <header className="z-10 flex min-h-[72px] items-center justify-between gap-3 border-b border-slate-800 bg-[#111827] px-3 text-white shadow-lg shadow-slate-950/10 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-bold text-white shadow-md shadow-indigo-950/40">
            W
          </span>
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-indigo-300">WEBBUILDER STUDIO</p>
            <h1 className="mt-0.5 truncate text-sm font-semibold tracking-tight text-white">My first website</h1>
          </div>
          <span className="hidden items-center gap-1.5 rounded-full border border-amber-300/20 bg-amber-300/10 px-2.5 py-1 text-[10px] font-medium text-amber-200 sm:flex">
            <span className="size-1.5 rounded-full bg-amber-300" />
            Unsaved draft
          </span>
        </div>

        <div className="hidden items-center rounded-xl border border-white/10 bg-white/[0.06] p-1 sm:flex">
          {(["desktop", "mobile"] as const).map((size) => (
            <button
              aria-pressed={viewport === size}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition ${
                viewport === size
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
              key={size}
              onClick={() => selectViewport(size)}
              type="button"
            >
              {size}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            aria-pressed={previewMode}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              previewMode
                ? "bg-indigo-500/15 text-indigo-200"
                : "border border-white/15 text-slate-200 hover:bg-white/10"
            }`}
            onClick={() => setPreviewMode((current) => !current)}
            type="button"
          >
            {previewMode ? "Exit preview" : "Preview"}
          </button>
          <span className="hidden max-w-36 truncate text-sm text-slate-300 lg:block">
            {user.email}
          </span>
          <button
            aria-label={logoutPending ? "Signing out" : undefined}
            className="rounded-lg border border-white/15 px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10 disabled:opacity-50"
            disabled={logoutPending}
            onClick={handleLogout}
            type="button"
          >
            {logoutPending ? (
              <LoadingSpinner label="Signing out" size="sm" />
            ) : (
              "Sign out"
            )}
          </button>
        </div>
      </header>

      <section
        aria-label="Website draft address"
        className="flex flex-wrap items-center gap-3 border-b border-slate-200/80 bg-white px-3 py-3 sm:px-6"
      >
        <label className="flex min-w-0 flex-1 items-center gap-2">
          <span className="shrink-0 text-xs font-semibold text-slate-600">
            Website address
          </span>
          <span className="flex min-w-0 items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 text-sm transition focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-50">
            <span className="shrink-0 pl-3 text-xs text-slate-500">
              http://localhost:3000/
            </span>
            <input
              aria-label="Website URL slug"
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent px-1 py-2.5 text-sm font-medium text-slate-800 outline-none"
              maxLength={40}
              onChange={(event) => updateSiteSlug(event.target.value)}
              placeholder="your-site"
              spellCheck={false}
              value={siteSlug}
            />
          </span>
        </label>
        <button
          aria-label={publishing ? "Saving website" : undefined}
          className="shrink-0 rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-50"
          disabled={publishing}
          onClick={generateSiteSlug}
          type="button"
        >
          {publishing ? (
            <LoadingSpinner label="Saving website" size="sm" />
          ) : (
            "Random & open"
          )}
        </button>
        <button
          aria-label={publishing ? "Saving website" : undefined}
          className="shrink-0 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 disabled:opacity-50"
          disabled={publishing}
          onClick={() => void publishSite(siteSlug)}
          type="button"
        >
          {publishing ? (
            <LoadingSpinner label="Saving website" size="sm" />
          ) : (
            "Save & open"
          )}
        </button>
        <span className="w-full text-[11px] text-slate-400 sm:w-auto">
          Opens your published site in a new tab.
        </span>
      </section>

      {publishError && (
        <p
          aria-live="polite"
          className="border-b border-rose-200 bg-rose-50 px-4 py-2 text-center text-sm text-rose-700"
          role="alert"
        >
          {publishError}
        </p>
      )}

      {authError && (
        <p className="border-b border-rose-200 bg-rose-50 px-4 py-2 text-center text-sm text-rose-700">
          {authError}
        </p>
      )}

      <div className="grid min-h-0 min-w-0 flex-1 grid-cols-1 xl:grid-cols-[300px_minmax(0,1fr)_300px]">
        {!previewMode && (
          <aside className="hidden min-h-0 overflow-y-auto border-r border-slate-800 bg-[#151d2d] p-5 text-white xl:block">
            <section className="mb-6">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-300">
                Page settings
              </p>
              <div className="space-y-3">
                <div className="rounded-2xl bg-white p-3 text-slate-900 shadow-sm">
                  <p className="mb-2 text-xs font-semibold text-slate-700">
                    Canvas size
                  </p>
                  <PageSizeControls
                    height={pageHeight}
                    key={`${pageWidth}-${pageHeight}`}
                    onChange={updatePageDimension}
                    width={pageWidth}
                  />
                </div>
                <div className="rounded-2xl bg-white p-3 text-slate-900 shadow-sm">
                  <p className="mb-2 text-xs font-semibold text-slate-700">
                    Entrance animation
                  </p>
                  <AnimationControl
                    onChange={setSiteAnimation}
                    value={siteAnimation}
                  />
                </div>
              </div>
            </section>

            <div className="mb-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-300">Build</p>
              <h2 className="mt-1 text-sm font-semibold tracking-tight text-white">
                Add components
              </h2>
              <p className="mt-1 text-xs leading-5 text-slate-400">
                Click to add, or drag onto the canvas.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {blockLibrary.map((block) => (
                <button
                  className="group flex min-h-[76px] flex-col items-start justify-between rounded-2xl border border-white/[0.08] bg-white/[0.04] p-3 text-left transition duration-150 hover:-translate-y-0.5 hover:border-indigo-400/50 hover:bg-indigo-500/15 hover:shadow-md hover:shadow-black/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-400/30"
                  draggable
                  key={block.type}
                  onClick={() => addBlock(block.type)}
                  onDragEnd={() => setActiveDrag(null)}
                  onDragStart={(event) => {
                    setActiveDrag(block.type);
                    event.dataTransfer.setData("text/plain", block.type);
                    event.dataTransfer.effectAllowed = "copy";
                  }}
                  type="button"
                >
                  <span className="grid size-8 place-items-center rounded-xl bg-white/[0.08] text-sm font-semibold text-indigo-300 transition group-hover:bg-indigo-400/20 group-hover:text-indigo-200">
                    {block.icon}
                  </span>
                  <span className="mt-2 text-xs font-medium text-slate-200">
                    {block.label}
                  </span>
                </button>
              ))}
            </div>

            <div className="mb-3 mt-8 flex items-center justify-between border-t border-white/10 pt-5">
              <h2 className="text-sm font-semibold tracking-tight text-white">
                Page layers
              </h2>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-medium text-slate-300">{blocks.length}</span>
            </div>
            <div className="space-y-1">
              {blocks.map((block, index) => (
                <button
                  className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs transition ${
                    selectedIds.includes(block.id)
                      ? "bg-indigo-500/20 font-semibold text-indigo-200 ring-1 ring-indigo-300/20"
                      : "text-slate-300 hover:bg-white/[0.06]"
                  }`}
                  aria-pressed={selectedIds.includes(block.id)}
                  key={block.id}
                  onClick={(event) =>
                    selectBlock(
                      block.id,
                      event.shiftKey || event.ctrlKey || event.metaKey,
                      event.ctrlKey || event.metaKey,
                    )
                  }
                  type="button"
                >
                  <span className="grid size-5 place-items-center rounded-md bg-white/[0.06] text-[10px] text-slate-400">{index + 1}</span>
                  <span className="truncate capitalize">{block.type}</span>
                </button>
              ))}
              {blocks.length === 0 && (
                <p className="px-3 py-2 text-xs text-slate-500">
                  Your page is empty.
                </p>
              )}
            </div>
          </aside>
        )}

        <section
          className="editor-workspace min-h-0 min-w-0 overflow-auto p-4 sm:p-6 xl:p-7"
          ref={workspaceRef}
        >
          {!previewMode && (
            <div
              className="mx-auto mb-5 flex w-full flex-wrap items-center gap-2.5 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm shadow-slate-900/[0.03]"
              style={{ width: editorHeaderWidth, maxWidth: "100%" }}
            >
              <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
                {sitePages.map((page) => (
                  <button
                    aria-current={page.slug === activePageSlug ? "page" : undefined}
                    className={`shrink-0 rounded-xl px-3 py-2 text-xs font-medium transition ${
                      page.slug === activePageSlug
                        ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                    key={page.id}
                    onClick={() => navigateEditorPage(page.slug)}
                    type="button"
                  >
                    {page.title}
                  </button>
                ))}
              </div>
              <button
                className="shrink-0 rounded-xl border border-dashed border-indigo-300 px-3 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-50 disabled:opacity-50"
                disabled={sitePages.length >= 20}
                onClick={addSitePage}
                type="button"
              >
                + Add page
              </button>
              {selectedPage && (
                <>
                  <label className="flex min-w-0 items-center gap-2 border-l border-slate-200 pl-3">
                    <span className="shrink-0 text-[11px] text-slate-500">
                      Page name
                    </span>
                    <input
                      aria-label="Current page name"
                      className="w-28 min-w-0 rounded-lg border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-indigo-400"
                      maxLength={40}
                      onChange={(event) =>
                        updateCurrentPageTitle(event.target.value)
                      }
                      value={selectedPage.title}
                    />
                  </label>
                  <span className="hidden text-[11px] text-slate-400 sm:inline">
                    /{selectedPage.slug}
                  </span>
                  {activePageSlug !== "home" && (
                    <button
                      className="shrink-0 rounded-lg px-2 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50"
                      onClick={removeCurrentPage}
                      type="button"
                    >
                      Delete page
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          <div
            className="mx-auto mb-3 flex w-full items-center justify-between"
            style={{ width: editorHeaderWidth, maxWidth: "100%" }}
          >
            <span className="text-sm font-semibold tracking-tight text-slate-800">
              {selectedPage?.title ?? "Home page"}
            </span>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span>
                {previewMode
                  ? "Preview"
                  : selectedIds.length > 1
                    ? `${selectedIds.length} components selected · drag to move together`
                    : "Drag components to move"}
              </span>
              <span className="hidden sm:inline">
                {viewport === "custom"
                  ? "Custom size"
                  : viewport === "desktop"
                    ? "Desktop"
                    : "Mobile"}
              </span>
            </div>
          </div>

          {!previewMode && (
            <div
              className="mx-auto mb-4 flex gap-2 overflow-x-auto pb-1 xl:hidden"
              style={{ width: editorHeaderWidth, maxWidth: "100%" }}
            >
              {blockLibrary.map((block) => (
                <button
                  className="shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-sm transition hover:border-indigo-200 hover:text-indigo-700"
                  key={block.type}
                  onClick={() => addBlock(block.type)}
                  type="button"
                >
                  + {block.label}
                </button>
              ))}
            </div>
          )}

          <div
            className="mx-auto shrink-0 py-1"
            ref={canvasFrameRef}
            style={{
              width: `${pageWidth * canvasZoom}px`,
              height: `${pageHeight * canvasZoom}px`,
            }}
          >
            <div
              aria-label="Website canvas. Drop a component here to add it."
              className={`relative origin-top-left overflow-hidden rounded-[20px] border shadow-xl shadow-slate-900/10 transition-colors ${
                activeDrag
                  ? "border-indigo-400 ring-4 ring-indigo-100"
                  : "border-slate-200"
              }`}
              onClick={(event) => {
                if (event.target === event.currentTarget && !previewMode) {
                  setSelectedId(null);
                }
              }}
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = "copy";
              }}
              onDrop={handleDrop}
              onPointerMove={moveSelected}
              onPointerUp={stopMoving}
              onPointerCancel={stopMoving}
              onWheel={(event) => {
                if (previewMode) return;
                event.preventDefault();
                changeCanvasZoom(event.deltaY < 0 ? 0.1 : -0.1);
              }}
              ref={canvasRef}
              role="region"
              title="Scroll the mouse wheel to zoom in or out"
              style={{
                backgroundColor: canvasColor,
                boxSizing: "border-box",
                width: `${pageWidth}px`,
                height: `${pageHeight}px`,
                transform: `scale(${canvasZoom})`,
              }}
            >
            {!previewMode && activeDrag && (
              <div className="pointer-events-none absolute inset-x-0 top-0 z-[2] text-center">
                <span className="inline-flex rounded-b-xl bg-indigo-600 px-4 py-2 text-xs font-medium text-white shadow">
                  Drop to add {activeDrag}
                </span>
              </div>
            )}

            {blocks.map((block, index) => {
              const selected = !previewMode && selectedIds.includes(block.id);
              const hasSingleSelection = selectedIds.length === 1;
              const content = renderBlockContent(
                block,
                previewMode,
                sitePages,
                navigateEditorPage,
              );

              return (
                <div
                  aria-label={`${block.type}: ${block.text || block.type}. Drag to move and resize.`}
                  aria-selected={selected}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 transition-shadow ${
                    previewMode && siteAnimation !== "none"
                      ? `site-animation-block site-animation-${siteAnimation}`
                      : ""
                  } ${
                    previewMode
                      ? ""
                      : selected
                        ? "z-[3] cursor-move outline outline-2 outline-indigo-500 outline-offset-2 shadow-lg shadow-indigo-100"
                        : "cursor-move outline outline-1 outline-transparent hover:outline-indigo-200"
                  }`}
                  key={block.id}
                  onClick={(event) => {
                    event.stopPropagation();
                  }}
                  onKeyDown={(event) => moveWithKeyboard(event, block)}
                  onPointerDown={(event) => startMoving(event, block)}
                  onPointerUp={stopMoving}
                  onPointerCancel={stopMoving}
                  role={previewMode ? undefined : "button"}
                  style={{
                    left: `${block.x}%`,
                    top: `${block.y}%`,
                    transform: `rotate(${block.rotation ?? 0}deg)`,
                    width: `${block.width}px`,
                    height: `${block.height}px`,
                    maxWidth: "94%",
                    touchAction: previewMode ? undefined : "none",
                    cursor: previewMode ? undefined : "move",
                    animationDelay: `${Math.min(index * 80, 800)}ms`,
                  }}
                  tabIndex={previewMode ? undefined : 0}
                >
                  {content}
                  {!previewMode && selected && hasSingleSelection && (
                    <button
                      aria-label="Drag to rotate component"
                      className="absolute -top-9 left-1/2 z-10 grid size-7 -translate-x-1/2 cursor-grab place-items-center rounded-full border border-indigo-600 bg-white text-sm font-semibold text-indigo-700 shadow-md shadow-indigo-200 transition hover:scale-110 active:cursor-grabbing"
                      onPointerDown={(event) => startRotating(event, block)}
                      onPointerUp={stopMoving}
                      onPointerCancel={stopMoving}
                      title={`Drag to rotate · ${block.rotation ?? 0}°`}
                      type="button"
                    >
                      ↻
                    </button>
                  )}
                  {!previewMode && selected && hasSingleSelection && (
                    <button
                      aria-label="Resize component"
                      className="absolute -bottom-2 -right-2 z-10 grid size-5 cursor-nwse-resize place-items-center rounded-md border border-indigo-600 bg-white text-[10px] text-indigo-700 shadow"
                      onPointerDown={(event) => startResizing(event, block)}
                      onPointerUp={stopMoving}
                      onPointerCancel={stopMoving}
                      title="Drag to resize"
                      type="button"
                    >
                      ↘
                    </button>
                  )}
                  {!previewMode && selected && (
                    <span className="pointer-events-none absolute -top-7 left-0 rounded-md bg-indigo-600 px-2 py-1 text-[10px] font-semibold capitalize text-white shadow">
                      {block.type} · drag to move or rotate
                    </span>
                  )}
                </div>
              );
            })}

            {blocks.length === 0 && !previewMode && (
              <p className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-sm text-slate-400">
                Drop a component anywhere to start designing.
              </p>
            )}
            </div>
          </div>

          {!previewMode && (
            <p
              className="mx-auto mt-3 text-center text-[11px] text-slate-500"
              style={{ width: editorHeaderWidth, maxWidth: "100%" }}
            >
              Scroll to zoom · Shift-click to select multiple · Drag to move
              together · Ctrl+C copy · Ctrl+V paste · Delete remove
            </p>
          )}

          {!previewMode && (
            <div className="mx-auto mt-5 w-full max-w-6xl space-y-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm xl:hidden">
              <div className="grid gap-3 sm:grid-cols-2">
                <section className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <h3 className="mb-2 text-xs font-semibold text-slate-700">
                    Canvas size
                  </h3>
                  <PageSizeControls
                    height={pageHeight}
                    key={`${pageWidth}-${pageHeight}`}
                    onChange={updatePageDimension}
                    width={pageWidth}
                  />
                </section>
                <section className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <h3 className="mb-2 text-xs font-semibold text-slate-700">
                    Entrance animation
                  </h3>
                  <AnimationControl
                    onChange={setSiteAnimation}
                    value={siteAnimation}
                  />
                </section>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  {selectedBlock ? "Component settings" : "Page background"}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {selectedBlock
                      ? selectedIds.length > 1
                        ? `${selectedIds.length} selected. Move, duplicate, or delete together; settings apply to the active component.`
                        : `Customize your ${selectedBlock.type}.`
                      : "Choose the color behind your design."}
                </p>
              </div>
              <ColorControl
                label="Page background color"
                onChange={setCanvasColor}
                value={canvasColor}
              />
              {selectedBlock && (
                <>
                  <label className="block">
                    <span className="mb-2 block text-xs font-medium text-slate-600">
                      Text
                    </span>
                    <textarea
                      className="min-h-20 w-full resize-y rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                      onChange={(event) =>
                        updateSelected("text", event.target.value)
                      }
                      value={selectedBlock.text}
                    />
                  </label>
                  <ColorControl
                    label="Text color"
                    onChange={(value) => updateSelected("color", value)}
                    value={selectedBlock.color}
                  />
                  <ColorControl
                    allowTransparent
                    label="Component background"
                    onChange={(value) =>
                      updateSelected("backgroundColor", value)
                    }
                    value={selectedBlock.backgroundColor}
                  />
                  <SizeControls
                    height={selectedBlock.height}
                    onChange={updateSelectedSize}
                    width={selectedBlock.width}
                  />
                  <RotationControl
                    onChange={updateSelectedRotation}
                    value={selectedBlock.rotation}
                  />
                  {["button", "card", "image", "map"].includes(selectedBlock.type) && (
                    <LinkControl
                      block={selectedBlock}
                      onChange={(value) => updateSelected("url", value)}
                    />
                  )}
                  {selectedBlock.type === "image" && (
                    <ImageUploadControl
                      error={imageUploadError}
                      onUpload={(file) => void handleImageUpload(file)}
                      pending={imageUploading}
                    />
                  )}
                  {selectedBlock.type === "carousel" && (
                    <CarouselUploadControl
                      error={imageUploadError}
                      images={selectedBlock.images ?? []}
                      onRemove={removeCarouselImage}
                      onUpload={(file, index) =>
                        void handleCarouselImageUpload(file, index)
                      }
                      pending={imageUploading}
                    />
                  )}
                  {selectedBlock.type === "navbar" && (
                    <NavigationItemsControl
                      block={selectedBlock}
                      onChange={updateSelectedNavigation}
                      pages={sitePages}
                    />
                  )}
                  <div className="flex gap-2 border-t border-slate-100 pt-4">
                    <button
                      className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                      onClick={duplicateSelected}
                      type="button"
                    >
                      {selectedIds.length > 1
                        ? `Duplicate ${selectedIds.length}`
                        : "Duplicate"}
                    </button>
                    <button
                      className="flex-1 rounded-lg border border-rose-200 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50"
                      onClick={removeSelected}
                      type="button"
                    >
                      {selectedIds.length > 1
                        ? `Delete ${selectedIds.length}`
                        : "Delete"}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </section>

        {!previewMode && (
          <aside className="hidden min-h-0 overflow-y-auto border-l border-slate-200/80 bg-white p-5 xl:block">
            <div className="mb-5 border-b border-slate-100 pb-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-indigo-600">
                Inspector
              </p>
              <h2 className="mt-1 text-base font-semibold tracking-tight text-slate-900">
                {selectedBlock ? "Component settings" : "Page background"}
              </h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {selectedBlock
                  ? selectedIds.length > 1
                    ? `${selectedIds.length} selected. Move, duplicate, or delete together; settings apply to the active component.`
                    : `Customize your ${selectedBlock.type}.`
                  : "Choose the color behind your design."}
              </p>
            </div>

            {selectedBlock ? (
              <form
                className="space-y-5"
                onSubmit={(event: FormEvent<HTMLFormElement>) =>
                  event.preventDefault()
                }
              >
                <label className="block">
                  <span className="mb-2 block text-xs font-medium text-slate-600">
                    Text
                  </span>
                  <textarea
                    className="min-h-20 w-full resize-y rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                    onChange={(event) =>
                      updateSelected("text", event.target.value)
                    }
                    value={selectedBlock.text}
                  />
                </label>

                <ColorControl
                  label="Text color"
                  onChange={(value) => updateSelected("color", value)}
                  value={selectedBlock.color}
                />
                <ColorControl
                  allowTransparent
                  label="Component background"
                  onChange={(value) =>
                    updateSelected("backgroundColor", value)
                  }
                  value={selectedBlock.backgroundColor}
                />

                <SizeControls
                  height={selectedBlock.height}
                  onChange={updateSelectedSize}
                  width={selectedBlock.width}
                />
                <RotationControl
                  onChange={updateSelectedRotation}
                  value={selectedBlock.rotation}
                />
                {["button", "card", "image", "map"].includes(selectedBlock.type) && (
                  <LinkControl
                    block={selectedBlock}
                    onChange={(value) => updateSelected("url", value)}
                  />
                )}
                {selectedBlock.type === "image" && (
                  <ImageUploadControl
                    error={imageUploadError}
                    onUpload={(file) => void handleImageUpload(file)}
                    pending={imageUploading}
                  />
                )}
                {selectedBlock.type === "carousel" && (
                  <CarouselUploadControl
                    error={imageUploadError}
                    images={selectedBlock.images ?? []}
                    onRemove={removeCarouselImage}
                    onUpload={(file, index) =>
                      void handleCarouselImageUpload(file, index)
                    }
                    pending={imageUploading}
                  />
                )}
                {selectedBlock.type === "navbar" && (
                  <NavigationItemsControl
                    block={selectedBlock}
                    onChange={updateSelectedNavigation}
                    pages={sitePages}
                  />
                )}

                <div className="grid grid-cols-2 gap-3">
                  {(
                    [
                      ["Horizontal position", "x", selectedBlock.x],
                      ["Vertical position", "y", selectedBlock.y],
                    ] as const
                  ).map(([label, axis, value]) => (
                    <label className="block" key={axis}>
                      <span className="mb-2 block text-xs font-medium text-slate-600">
                        {label}
                      </span>
                      <input
                        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                        max={98}
                        min={2}
                        onChange={(event) => {
                          const nextValue = Number(event.target.value);
                          if (!Number.isFinite(nextValue)) return;
                          setBlocks((current) =>
                            current.map((block) =>
                              block.id === selectedBlock.id
                                ? { ...block, [axis]: nextValue }
                                : block,
                            ),
                          );
                        }}
                        type="number"
                        value={Math.round(value)}
                      />
                    </label>
                  ))}
                </div>

                <div className="flex gap-2 border-t border-slate-100 pt-4">
                  <button
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                    onClick={duplicateSelected}
                    type="button"
                  >
                    {selectedIds.length > 1
                      ? `Duplicate ${selectedIds.length}`
                      : "Duplicate"}
                  </button>
                  <button
                    className="flex-1 rounded-lg border border-rose-200 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50"
                    onClick={removeSelected}
                    type="button"
                  >
                    {selectedIds.length > 1
                      ? `Delete ${selectedIds.length}`
                      : "Delete"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-5">
                <ColorControl
                  label="Page background color"
                  onChange={setCanvasColor}
                  value={canvasColor}
                />
                <p className="rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500">
                  Tip: click an empty part of the canvas to change the page
                  background. Select a component to edit its own colors.
                </p>
              </div>
            )}

            <div className="mt-7 rounded-xl border border-amber-200 bg-amber-50 p-3">
              <p className="text-xs font-semibold text-amber-900">Local draft</p>
              <p className="mt-1 text-xs leading-5 text-amber-800">
                Design changes are in memory for now. Project saving is coming
                next.
              </p>
            </div>
          </aside>
        )}
      </div>
      {!previewMode && (
        <div
          aria-label="Canvas zoom controls"
          className="fixed bottom-5 right-4 z-30 flex items-center gap-1 rounded-2xl border border-slate-200 bg-white/95 p-1.5 shadow-xl shadow-slate-900/15 backdrop-blur xl:right-[320px]"
        >
          <button
            aria-label="Zoom out"
            className="grid size-9 place-items-center rounded-xl text-lg text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-35"
            disabled={canvasZoom <= 0.05}
            onClick={() => changeCanvasZoom(-0.1)}
            title="Zoom out"
            type="button"
          >
            −
          </button>
          <span
            aria-live="polite"
            className="min-w-12 text-center text-xs font-semibold tabular-nums text-slate-700"
          >
            {Math.round(canvasZoom * 100)}%
          </span>
          <button
            aria-label="Zoom in"
            className="grid size-9 place-items-center rounded-xl text-lg text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-35"
            disabled={canvasZoom >= 2}
            onClick={() => changeCanvasZoom(0.1)}
            title="Zoom in"
            type="button"
          >
            +
          </button>
          <span className="mx-1 h-6 w-px bg-slate-200" />
          <button
            className="rounded-xl px-3 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-50"
            onClick={() => setFitCanvasToWidth(true)}
            title="Fit canvas to available width"
            type="button"
          >
            Fit
          </button>
        </div>
      )}
    </main>
  );
}
