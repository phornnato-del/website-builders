export type User = {
  id: string;
  email: string;
  created_at: string;
};

export type AuthResult = {
  user: User;
  csrf_token: string;
};

export type SiteBlock = {
  id: string;
  type:
    | "container"
    | "section"
    | "heading"
    | "text"
    | "image"
    | "button"
    | "navbar"
    | "card"
    | "columns"
    | "spacer"
    | "divider"
    | "footer"
    | "circle"
    | "carousel";
  text: string;
  x: number;
  y: number;
  rotation?: number;
  width: number;
  height: number;
  color: string;
  backgroundColor: string;
  url: string;
  images?: string[];
  navItems?: SiteNavItem[] | null;
};

export type SiteNavItem = {
  label: string;
  pageSlug: string;
};

export type SitePage = {
  id: string;
  slug: string;
  title: string;
  blocks: SiteBlock[];
};

export type SiteDesign = {
  blocks: SiteBlock[];
  pages: SitePage[];
  page_width: number;
  page_height: number;
  canvas_color: string;
  animation: SiteAnimation;
};

export type SiteAnimation = "none" | "fade" | "rise" | "zoom";

export type PublishedSite = SiteDesign & { slug: string };

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function formatApiError(body: unknown): string {
  if (typeof body !== "object" || body === null || !("detail" in body)) {
    return "The request could not be completed.";
  }

  const { detail } = body;
  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    const errors = detail.flatMap((entry) => {
      if (
        typeof entry !== "object" ||
        entry === null ||
        !("msg" in entry) ||
        typeof entry.msg !== "string"
      ) {
        return [];
      }

      const location: (string | number)[] =
        "loc" in entry && Array.isArray(entry.loc)
          ? entry.loc.filter(
              (part: unknown): part is string | number =>
                typeof part === "string" || typeof part === "number",
            )
          : [];
      const field = location.filter((part: string | number) => part !== "body").join(".");
      return [field ? `${field}: ${entry.msg}` : entry.msg];
    });

    if (errors.length > 0) {
      return errors.join("; ");
    }
  }

  return "The request could not be completed.";
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  } catch {
    throw new ApiError(
      "Cannot reach the API. Check that the backend is running and try again.",
      0,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(formatApiError(body), response.status);
  }
  return body as T;
}

export async function getCurrentUser(): Promise<AuthResult> {
  return apiRequest<AuthResult>("/api/auth/me");
}

export async function logout(csrfToken: string): Promise<void> {
  await apiRequest<void>("/api/auth/logout", {
    method: "POST",
    headers: { "X-CSRF-Token": csrfToken },
  });
}

export async function saveSite(
  slug: string,
  design: SiteDesign,
  csrfToken: string,
): Promise<PublishedSite> {
  return apiRequest<PublishedSite>(`/api/sites/${encodeURIComponent(slug)}`, {
    method: "PUT",
    headers: { "X-CSRF-Token": csrfToken },
    body: JSON.stringify(design),
  });
}

export async function getSite(slug: string): Promise<PublishedSite> {
  return apiRequest<PublishedSite>(`/api/sites/${encodeURIComponent(slug)}`);
}

export async function uploadSiteImage(
  file: File,
  csrfToken: string,
): Promise<{ url: string }> {
  let response: Response;
  try {
    const formData = new FormData();
    formData.set("file", file);
    response = await fetch("/api/images", {
      method: "POST",
      credentials: "include",
      headers: { "X-CSRF-Token": csrfToken },
      body: formData,
    });
  } catch {
    throw new ApiError("Could not reach the image upload service.", 0);
  }

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = response.status === 401
      ? "Your session expired. Sign out and sign back in before uploading."
      :
      typeof body === "object" &&
      body !== null &&
      "detail" in body &&
      typeof body.detail === "string"
        ? body.detail
        : "The image could not be uploaded.";
    throw new ApiError(message, response.status);
  }
  if (
    typeof body !== "object" ||
    body === null ||
    !("url" in body) ||
    typeof body.url !== "string"
  ) {
    throw new ApiError("Image storage returned an invalid response.", 502);
  }
  return { url: body.url };
}
