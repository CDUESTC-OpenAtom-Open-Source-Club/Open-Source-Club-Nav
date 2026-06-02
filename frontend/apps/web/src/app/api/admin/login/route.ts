// @route-desc BFF API route proxy/handler for /api/admin/login/route.ts
// 管理员登录 - 代理到 Go 后端
import { fetchBackend } from "@/lib/backend-proxy";

export async function POST(request: Request) {
  return fetchBackend(request, "/api/admin/login");
}

