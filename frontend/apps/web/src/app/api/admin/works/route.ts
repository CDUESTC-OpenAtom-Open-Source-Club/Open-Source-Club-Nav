// @route-desc BFF API route proxy/handler for /api/admin/works/route.ts
// 鍚庡彴浣滃搧绠＄悊 - 浠ｇ悊鍒?Go 鍚庣
import { fetchBackend } from "@/lib/backend-proxy";

export async function GET(request: Request) {
  return fetchBackend(request, "/api/admin/works");
}

export async function POST(request: Request) {
  return fetchBackend(request, "/api/admin/works");
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return Response.json({ error: "缂哄皯 id" }, { status: 400 });
  }
  return fetchBackend(request, `/api/admin/works/${id}`);
}

