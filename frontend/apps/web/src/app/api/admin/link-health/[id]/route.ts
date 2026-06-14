import { fetchBackend } from "@/lib/backend-proxy";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return fetchBackend(request, `/api/admin/link-health/${id}`, { method: "POST" });
}
