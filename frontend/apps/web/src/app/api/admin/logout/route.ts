// @route-desc BFF API route proxy/handler for /api/admin/logout/route.ts
// 绠＄悊鍛樼櫥鍑?- 浠ｇ悊鍒?Go 鍚庣
import { fetchBackend } from "@/lib/backend-proxy";

export async function POST(request: Request) {
  return fetchBackend(request, "/api/admin/logout");
}

