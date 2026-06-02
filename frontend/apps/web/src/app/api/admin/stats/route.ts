// @route-desc BFF API route proxy/handler for /api/admin/stats/route.ts
// 鍚庡彴缁熻鏁版嵁 - 浠ｇ悊鍒?Go 鍚庣
import { fetchBackend } from "@/lib/backend-proxy";

export async function GET(request: Request) {
  return fetchBackend(request, "/api/admin/stats");
}

