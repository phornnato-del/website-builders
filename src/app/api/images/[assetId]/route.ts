import { get } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

function backendUrl(): URL {
  const url = new URL(
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",
  );
  if (url.hostname === "localhost") {
    url.hostname = "127.0.0.1";
  }
  return url;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ assetId: string }> },
) {
  const { assetId } = await params;
  if (!/^[a-f0-9]{24}$/i.test(assetId)) {
    return NextResponse.json({ detail: "Image not found." }, { status: 404 });
  }

  const apiUrl = backendUrl();
  try {
    const metadataResponse = await fetch(
      new URL(`/api/assets/${assetId}/metadata`, apiUrl),
      { cache: "no-store" },
    );
    if (metadataResponse.ok) {
      const metadata: unknown = await metadataResponse.json();
      if (
        typeof metadata !== "object" ||
        metadata === null ||
        !("pathname" in metadata) ||
        typeof metadata.pathname !== "string" ||
        !("content_type" in metadata) ||
        typeof metadata.content_type !== "string"
      ) {
        return NextResponse.json(
          { detail: "Image metadata is invalid." },
          { status: 502 },
        );
      }

      const result = await get(metadata.pathname, { access: "private" });
      if (result?.statusCode !== 200) {
        return NextResponse.json(
          { detail: "Image not found in Blob storage." },
          { status: 404 },
        );
      }
      return new Response(result.stream, {
        headers: {
          "Cache-Control": "public, max-age=31536000, immutable",
          "Content-Type": metadata.content_type,
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    if (metadataResponse.status !== 404) {
      return NextResponse.json(
        { detail: "Image metadata service is unavailable." },
        { status: 503 },
      );
    }

    const legacyResponse = await fetch(
      new URL(`/api/assets/${assetId}/content`, apiUrl),
      { cache: "force-cache" },
    );
    if (!legacyResponse.ok || !legacyResponse.body) {
      return NextResponse.json({ detail: "Image not found." }, { status: 404 });
    }
    return new Response(legacyResponse.body, {
      headers: {
        "Cache-Control":
          legacyResponse.headers.get("cache-control") ??
          "public, max-age=31536000, immutable",
        "Content-Type":
          legacyResponse.headers.get("content-type") ?? "application/octet-stream",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Could not retrieve the requested image.", error);
    return NextResponse.json(
      { detail: "Image storage is unavailable." },
      { status: 503 },
    );
  }
}
