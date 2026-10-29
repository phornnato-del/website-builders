import { NextResponse } from "next/server";

function backendUrl(): URL {
  const url = new URL(
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",
  );
  if (url.hostname === "localhost") {
    url.hostname = "127.0.0.1";
  }
  return url;
}

export async function proxyApiRequest(
  request: Request,
  route: "auth" | "sites",
  segments: string[],
): Promise<NextResponse> {
  const target = new URL(
    `/api/${route}/${segments.map(encodeURIComponent).join("/")}`,
    backendUrl(),
  );
  target.search = new URL(request.url).search;

  const headers = new Headers();
  for (const name of ["cookie", "origin", "content-type", "x-csrf-token"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  try {
    const response = await fetch(target, {
      method: request.method,
      headers,
      body:
        request.method === "GET" || request.method === "HEAD"
          ? undefined
          : await request.arrayBuffer(),
      cache: "no-store",
      redirect: "manual",
    });
    const responseHeaders = new Headers();
    const contentType = response.headers.get("content-type");
    if (contentType) responseHeaders.set("content-type", contentType);
    for (const cookie of response.headers.getSetCookie()) {
      responseHeaders.append("set-cookie", cookie);
    }

    return new NextResponse(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error(`API proxy request failed for /api/${route}.`, error);
    return NextResponse.json(
      { detail: "The API service is unavailable. Try again shortly." },
      { status: 503 },
    );
  }
}
