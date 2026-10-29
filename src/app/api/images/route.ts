import { del, put } from "@vercel/blob";
import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

function hasValidSignature(contentType: string, data: Uint8Array): boolean {
  if (contentType === "image/jpeg") {
    return data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff;
  }
  if (contentType === "image/png") {
    return (
      data[0] === 0x89 &&
      data[1] === 0x50 &&
      data[2] === 0x4e &&
      data[3] === 0x47 &&
      data[4] === 0x0d &&
      data[5] === 0x0a &&
      data[6] === 0x1a &&
      data[7] === 0x0a
    );
  }
  if (contentType === "image/webp") {
    return (
      String.fromCharCode(...data.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...data.slice(8, 12)) === "WEBP"
    );
  }
  if (contentType === "image/gif") {
    const signature = String.fromCharCode(...data.slice(0, 6));
    return signature === "GIF87a" || signature === "GIF89a";
  }
  if (contentType === "image/avif") {
    const brand = String.fromCharCode(...data.slice(8, 16));
    return (
      String.fromCharCode(...data.slice(4, 8)) === "ftyp" &&
      (brand.includes("avif") || brand.includes("avis"))
    );
  }
  return false;
}

function backendUrl(): URL {
  const url = new URL(
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",
  );
  if (url.hostname === "localhost") {
    url.hostname = "127.0.0.1";
  }
  return url;
}

async function removeBlob(pathname: string): Promise<void> {
  try {
    await del(pathname);
  } catch (error) {
    console.error("Could not remove an image after its database save failed.", error);
  }
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) {
    return NextResponse.json(
      { detail: "Image uploads must come from this website." },
      { status: 403 },
    );
  }

  const cookie = request.headers.get("cookie");
  const csrfToken = request.headers.get("x-csrf-token");
  if (!cookie || !csrfToken) {
    return NextResponse.json(
      { detail: "Sign in before uploading an image." },
      { status: 401 },
    );
  }

  let uploadedPathname: string | undefined;
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json(
        { detail: "Select an image file to upload." },
        { status: 400 },
      );
    }
    if (!IMAGE_TYPES.has(file.type)) {
      return NextResponse.json(
        { detail: "Upload a JPEG, PNG, WebP, GIF, or AVIF image." },
        { status: 415 },
      );
    }
    if (file.size === 0 || file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        { detail: "Images must be larger than 0 bytes and 5 MB or smaller." },
        { status: 413 },
      );
    }

    const content = new Uint8Array(await file.arrayBuffer());
    if (!hasValidSignature(file.type, content)) {
      return NextResponse.json(
        { detail: "The file content does not match a supported image format." },
        { status: 415 },
      );
    }

    const apiUrl = backendUrl();
    const authResponse = await fetch(new URL("/api/auth/me", apiUrl), {
      headers: { Cookie: cookie },
      cache: "no-store",
    });
    if (!authResponse.ok) {
      return NextResponse.json(
        { detail: "Your session expired. Sign in again before uploading." },
        { status: authResponse.status === 401 ? 401 : 503 },
      );
    }

    const authBody: unknown = await authResponse.json();
    const user =
      typeof authBody === "object" && authBody !== null && "user" in authBody
        ? authBody.user
        : null;
    const userId =
      typeof user === "object" &&
      user !== null &&
      "id" in user &&
      typeof user.id === "string"
        ? user.id
        : null;
    const email =
      typeof user === "object" &&
      user !== null &&
      "email" in user &&
      typeof user.email === "string"
        ? user.email
        : null;
    if (!userId || !/^[a-f0-9]{24}$/i.test(userId) || !email) {
      return NextResponse.json(
        { detail: "The account service returned an invalid user." },
        { status: 502 },
      );
    }

    const loginName = email.split("@", 1)[0].toLowerCase();
    const safeLoginName =
      loginName.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) ||
      "user";
    const folder = `${safeLoginName}-${userId.slice(-8)}`;
    const safeFilename =
      file.name
        .split(/[\\/]/)
        .pop()
        ?.replace(/[^a-zA-Z0-9._-]/g, "_")
        .slice(0, 120) || "image";
    const pathname = `users/${folder}/${randomUUID()}-${safeFilename}`;
    const blob = await put(pathname, file, {
      access: "private",
      addRandomSuffix: false,
      contentType: file.type,
    });
    uploadedPathname = blob.pathname;

    const response = await fetch(new URL("/api/assets", apiUrl), {
      method: "POST",
      headers: {
        Cookie: cookie,
        Origin: origin,
        "X-CSRF-Token": csrfToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pathname: blob.pathname,
        filename: safeFilename,
        content_type: file.type,
        size: file.size,
      }),
    });
    const body: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      await removeBlob(blob.pathname);
      uploadedPathname = undefined;
      return NextResponse.json(body, { status: response.status });
    }
    if (
      typeof body !== "object" ||
      body === null ||
      !("id" in body) ||
      typeof body.id !== "string"
    ) {
      await removeBlob(blob.pathname);
      uploadedPathname = undefined;
      return NextResponse.json(
        { detail: "Image metadata returned an invalid response." },
        { status: 502 },
      );
    }

    return NextResponse.json(
      { ...body, url: `/api/images/${body.id}` },
      { status: 201 },
    );
  } catch (error) {
    console.error("Image upload failed.", error);
    if (uploadedPathname) {
      await removeBlob(uploadedPathname);
    }
    return NextResponse.json(
      { detail: "Image upload failed. Check the Blob store configuration and try again." },
      { status: 503 },
    );
  }
}
