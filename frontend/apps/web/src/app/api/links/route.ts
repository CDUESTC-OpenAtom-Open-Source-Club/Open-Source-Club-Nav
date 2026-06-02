// @route-desc BFF API route proxy/handler for /api/links/route.ts
import { fetchBackend } from "@/lib/backend-proxy";

export const revalidate = 60;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const params = searchParams.toString();
  return fetchBackend(request, `/api/links${params ? `?${params}` : ""}`);
}

export async function POST(request: Request) {
  return fetchBackend(request, "/api/admin/links");
}

export async function PUT(request: Request) {
  const body = (await request.json()) as { id?: number };
  const id = body.id;
  if (!id) {
    return Response.json({ error: "缺少 id" }, { status: 400 });
  }
  return fetchBackend(request, `/api/admin/links/${id}`, { body, method: "PUT" });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return Response.json({ error: "缺少 id" }, { status: 400 });
  }
  return fetchBackend(request, `/api/admin/links/${id}`, { method: "DELETE" });
}
