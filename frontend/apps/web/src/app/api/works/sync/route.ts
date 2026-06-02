// @route-desc BFF API route proxy/handler for /api/works/sync/route.ts
// GitHub 浣滃搧鍚屾 - 浠ｇ悊鍒?Go 鍚庣
import { fetchBackend } from "@/lib/backend-proxy";

export async function POST(request: Request) {
  return fetchBackend(request, "/api/admin/works/sync");
}

