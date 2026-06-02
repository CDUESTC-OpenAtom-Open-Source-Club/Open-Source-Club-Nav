// @route-desc BFF API route proxy/handler for /api/admin/system/route.ts
// 绯荤粺杩愯鐘舵€?- 浠ｇ悊鍒?Go 鍚庣
import { fetchBackend } from "@/lib/backend-proxy";

export async function GET(request: Request) {
  return fetchBackend(request, "/api/admin/system");
}

