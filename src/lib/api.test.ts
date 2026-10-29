import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError, apiRequest } from "./api";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("API error details", () => {
  it("shows field paths for structured validation errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            detail: [
              {
                loc: ["body", "blocks", 2, "images"],
                msg: "Input should have at most 3 items",
                type: "too_long",
              },
            ],
          }),
          { status: 422, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    await expect(apiRequest("/api/sites/example")).rejects.toMatchObject({
      name: "ApiError",
      message: "blocks.2.images: Input should have at most 3 items",
      status: 422,
    } satisfies Partial<ApiError>);
  });

  describe("same-origin API requests", () => {
    it("sends requests through the website origin with credentials", async () => {
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ status: "ok" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
      vi.stubGlobal("fetch", fetchMock);

      await apiRequest("/api/auth/me");

      expect(fetchMock).toHaveBeenCalledWith(
        "/api/auth/me",
        expect.objectContaining({ credentials: "include" }),
      );
    });
  });

  it("preserves string error details", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ detail: "Website not found." }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    await expect(apiRequest("/api/sites/missing")).rejects.toMatchObject({
      message: "Website not found.",
      status: 404,
    });
  });
});
