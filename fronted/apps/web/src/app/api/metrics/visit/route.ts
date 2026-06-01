// 访问埋点 - 代理到 Go 后端
import { proxyRequest } from "@/lib/backend-proxy";

export async function POST(request: Request) {
  return proxyRequest(request, "/api/metrics/visit");
}
