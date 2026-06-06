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
    return Response.json({ error: "缂傚搫鐨?id" }, { status: 400 });
  }
  return fetchBackend(request, `/api/admin/works/${id}`);
}

