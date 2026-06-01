// @route-desc BFF API route proxy/handler for /api/admin/logs/route.ts
// 操作日志 - 代理到 Go 后端
import { proxyRequest } from "@/lib/backend-proxy";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get("limit") || "50";
  const offset = searchParams.get("offset") || "0";
  return proxyRequest(request, `/api/admin/logs?limit=${limit}&offset=${offset}`);
}
