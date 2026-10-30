import { proxyApiRequest } from "@/lib/server-api-proxy";

export async function GET(request: Request) {
  return proxyApiRequest(request, "sites", []);
}
