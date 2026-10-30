import { describe, expect, it } from "vitest";

import {
  canvasPositionFromPointer,
  clampCanvasPercent,
  clampPageDimension,
  createRandomSiteSlug,
  fitCanvasZoom,
  isSafeLink,
  newBlockPosition,
  normalizeSiteSlug,
  safeImageUrl,
  safeMapUrl,
} from "./editor-utils";

describe("website URL slugs", () => {
  it("normalizes names into URL-safe slugs", () => {
    expect(normalizeSiteSlug("  My Cool Website!  ")).toBe("my-cool-website");
  });

  it("limits slugs to 40 characters and removes edge hyphens", () => {
    expect(normalizeSiteSlug("---A" + "b".repeat(45) + "---")).toBe(
      `a${"b".repeat(39)}`,
    );
  });

  it("generates a URL-safe random slug", () => {
    expect(createRandomSiteSlug()).toMatch(/^site-[a-f0-9]{8}$/);
  });
});

describe("editor links", () => {
  it.each([
    "https://example.com/page",
    "http://example.com",
    "mailto:hello@example.com",
    "tel:+15555550123",
    "/contact",
    "#about",
    "?page=about",
  ])("accepts safe website destination %s", (url) => {
    expect(isSafeLink(url)).toBe(true);
  });

  it.each(["", "  ", "//example.com", "javascript:alert(1)", "data:text/html,hi"])(
    "rejects unsafe or empty destination %s",
    (url) => {
      expect(isSafeLink(url)).toBe(false);
    },
  );
});

describe("image URLs", () => {
  it.each([
    ["https://example.com/image.jpg", "https://example.com/image.jpg"],
    ["http://example.com/image.png", "http://example.com/image.png"],
    ["/api/images/507f1f77bcf86cd799439011", "/api/images/507f1f77bcf86cd799439011"],
  ])("accepts absolute HTTP image URL %s", (value, expected) => {
    expect(safeImageUrl(value)).toBe(expected);
  });

  it.each(["/image.jpg", "//example.com/image.jpg", "javascript:alert(1)", "data:image/svg+xml,test"])(
    "rejects unsafe or relative image URL %s",
    (value) => {
      expect(safeImageUrl(value)).toBeNull();
    },
  );
});

describe("map embed URLs", () => {
  it.each([
    ["https://www.google.com/maps/embed?pb=example", "https://www.google.com/maps/embed?pb=example"],
    ["https://www.openstreetmap.org/export/embed.html", "https://www.openstreetmap.org/export/embed.html"],
    [
      '<iframe src="https://www.google.com/maps/embed?pb=example&amp;hl=en" width="600" height="450"></iframe>',
      "https://www.google.com/maps/embed?pb=example&hl=en",
    ],
  ])("accepts HTTPS map embed URL %s", (value, expected) => {
    expect(safeMapUrl(value)).toBe(expected);
  });

  it.each([
    "",
    "http://maps.example.com/embed",
    "javascript:alert(1)",
    "//maps.example.com/embed",
    "https://user:password@maps.example.com/embed",
  ])("rejects unsafe map embed URL %s", (value) => {
    expect(safeMapUrl(value)).toBeNull();
  });
});

describe("free canvas positioning", () => {
  it("places new components near the top with varied horizontal positions", () => {
    expect(newBlockPosition(6, 6)).toEqual({ x: 38, y: 20 });
    expect(newBlockPosition(7, 6)).toEqual({ x: 62, y: 29 });
    expect(newBlockPosition(8, 6)).toEqual({ x: 50, y: 38 });
  });

  it("keeps the default insertion point in the upper page area", () => {
    expect(newBlockPosition(30, 6).y).toBe(86);
  });

  it("maps pointer coordinates to canvas percentages", () => {
    expect(
      canvasPositionFromPointer(250, 150, {
        left: 50,
        top: 50,
        width: 400,
        height: 200,
      }),
    ).toEqual({ x: 50, y: 50 });
  });

  it("keeps a dropped component within the canvas", () => {
    expect(
      canvasPositionFromPointer(1000, -100, {
        left: 0,
        top: 0,
        width: 500,
        height: 250,
      }),
    ).toEqual({ x: 98, y: 2 });
  });

  it("uses the canvas center when the canvas has no size", () => {
    expect(
      canvasPositionFromPointer(10, 10, {
        left: 0,
        top: 0,
        width: 0,
        height: 0,
      }),
    ).toEqual({ x: 50, y: 50 });
  });

  it("clamps keyboard and pointer moves to the canvas edges", () => {
    expect(clampCanvasPercent(-5)).toBe(2);
    expect(clampCanvasPercent(105)).toBe(98);
    expect(clampCanvasPercent(63.5)).toBe(63.5);
  });
});

describe("page dimensions", () => {
  it("fits the canvas to whichever viewport dimension is limiting", () => {
    expect(fitCanvasZoom(1200, 900, 900, 700)).toBeCloseTo(0.75);
    expect(fitCanvasZoom(1200, 900, 1400, 450)).toBe(0.5);
  });

  it("does not enlarge the canvas and supports tall-page fit down to five percent", () => {
    expect(fitCanvasZoom(1200, 900, 1600, 1200)).toBe(1);
    expect(fitCanvasZoom(4000, 10000, 1200, 400)).toBe(0.05);
  });

  it("allows custom width and height in pixel units", () => {
    expect(clampPageDimension("width", 1440)).toBe(1440);
    expect(clampPageDimension("height", 1200)).toBe(1200);
  });

  it("keeps dimensions within supported bounds", () => {
    expect(clampPageDimension("width", 100)).toBe(320);
    expect(clampPageDimension("height", 200)).toBe(400);
    expect(clampPageDimension("width", 5000)).toBe(4000);
    expect(clampPageDimension("height", 12000)).toBe(10000);
  });
});
