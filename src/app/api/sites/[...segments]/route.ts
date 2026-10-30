import { proxyApiRequest } from "@/lib/server-api-proxy";

type RouteContext = { params: Promise<{ segments: string[] }> };

async function proxy(request: Request, context: RouteContext) {
  const { segments } = await context.params;
  return proxyApiRequest(request, "sites", segments);
}

export const GET = proxy;
export const PUT = proxy;
export const DELETE = proxy;
