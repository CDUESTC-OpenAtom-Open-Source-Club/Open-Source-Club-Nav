// 链接健康检查 - 代理到 Go 后端
import { proxyRequest } from "@/lib/backend-proxy";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get("limit") || "50";
  return proxyRequest(request, `/api/admin/link-health?limit=${limit}`);
}

export async function POST(request: Request) {
  return proxyRequest(request, "/api/admin/link-health");
}
