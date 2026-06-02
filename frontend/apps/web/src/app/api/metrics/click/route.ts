// @route-desc BFF API route proxy/handler for /api/metrics/click/route.ts
// 鐐瑰嚮鍩嬬偣 - 浠ｇ悊鍒?Go 鍚庣
import { fetchBackend } from "@/lib/backend-proxy";

export async function POST(request: Request) {
  return fetchBackend(request, "/api/metrics/click");
}

