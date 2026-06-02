// @route-desc BFF API route proxy/handler for /api/content/[id]/route.ts
import { fetchBackend } from "@/lib/backend-proxy";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return fetchBackend(request, `/api/content/${id}`, { method: "PUT" });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return fetchBackend(request, `/api/content/${id}`, { method: "DELETE" });
}
