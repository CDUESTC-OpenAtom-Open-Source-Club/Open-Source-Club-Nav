import { fetchBackend } from "@/lib/backend-proxy";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(request: Request, { params }: RouteContext) {
  const { id } = await params;
  return fetchBackend(request, `/api/admin/users/${id}`, { method: "DELETE" });
}
