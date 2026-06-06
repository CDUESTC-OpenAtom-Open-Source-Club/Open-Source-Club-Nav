import { proxyRequest } from "@/lib/backend-proxy";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get("limit") || "50";
  const offset = searchParams.get("offset") || "0";
  return proxyRequest(request, `/api/admin/logs?limit=${limit}&offset=${offset}`);
}
