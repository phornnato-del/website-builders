import { proxyApiRequest } from "@/lib/server-api-proxy";

type RouteContext = { params: Promise<{ segments: string[] }> };

async function proxy(request: Request, context: RouteContext) {
  const { segments } = await context.params;
  return proxyApiRequest(request, "auth", segments);
}

export const GET = proxy;
export const POST = proxy;
