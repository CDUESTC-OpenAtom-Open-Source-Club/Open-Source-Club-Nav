import { fetchBackend } from "@/lib/backend-proxy";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, { params }: RouteContext) {
  const { id } = await params;
  return fetchBackend(request, `/api/admin/links/${id}`, { method: "PUT" });
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const { id } = await params;
  return fetchBackend(request, `/api/admin/links/${id}`, { method: "DELETE" });
}
