// GitHub 作品同步 - 代理到 Go 后端
import { proxyRequest } from "@/lib/backend-proxy";

export async function POST(request: Request) {
  return proxyRequest(request, "/api/admin/works/sync");
}
