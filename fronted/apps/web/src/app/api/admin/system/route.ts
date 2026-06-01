// 系统运行状态 - 代理到 Go 后端
import { proxyRequest } from "@/lib/backend-proxy";

export async function GET(request: Request) {
  return proxyRequest(request, "/api/admin/system");
}
