export function isSafeLink(value: string): boolean {
  const url = value.trim();
  if (!url || url.startsWith("//")) return false;
  if (url.startsWith("/") || url.startsWith("#") || url.startsWith("?")) {
    return true;
  }
  try {
    const parsed = new URL(url);
    return ["http:", "https:", "mailto:", "tel:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

export function safeImageUrl(value: string): string | null {
  const imagePath = value.trim();
  if (/^\/api\/images\/[a-f0-9]{24}$/i.test(imagePath)) {
    return imagePath;
  }
  try {
    const url = new URL(imagePath);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.href
      : null;
  } catch {
    return null;
  }
}

export function normalizeSiteSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/^-+|-+$/g, "");
}

export function createRandomSiteSlug(): string {
  return `site-${crypto.randomUUID().slice(0, 8)}`;
}

export function clampCanvasPercent(value: number): number {
  return Math.min(98, Math.max(2, value));
}

export function newBlockPosition(
  blockCount: number,
  starterBlockCount: number,
): { x: number; y: number } {
  const addedCount = Math.max(0, blockCount - starterBlockCount);
  const horizontalPositions = [38, 62, 50];
  return {
    x: horizontalPositions[addedCount % horizontalPositions.length],
    y: Math.min(86, 20 + addedCount * 9),
  };
}

export function fitCanvasZoom(
  pageWidth: number,
  pageHeight: number,
  availableWidth: number,
  availableHeight: number,
): number {
  return Math.max(
    0.05,
    Math.min(
      1,
      availableWidth / pageWidth,
      availableHeight / pageHeight,
    ),
  );
}

export function clampPageDimension(
  dimension: "width" | "height",
  value: number,
): number {
  const min = dimension === "width" ? 320 : 400;
  const max = dimension === "width" ? 4000 : 10000;
  return Math.round(Math.min(max, Math.max(min, value)));
}

export function canvasPositionFromPointer(
  clientX: number,
  clientY: number,
  bounds: Pick<DOMRect, "left" | "top" | "width" | "height">,
): { x: number; y: number } {
  if (!bounds.width || !bounds.height) {
    return { x: 50, y: 50 };
  }
  return {
    x: clampCanvasPercent(((clientX - bounds.left) / bounds.width) * 100),
    y: clampCanvasPercent(((clientY - bounds.top) / bounds.height) * 100),
  };
}
