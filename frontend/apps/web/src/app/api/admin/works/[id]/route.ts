import { fetchBackend } from "@/lib/backend-proxy";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return fetchBackend(request, `/api/admin/works/${id}`, { method: "PATCH" });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return fetchBackend(request, `/api/admin/works/${id}`);
}
