import { fetchBackend } from "@/lib/backend-proxy";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get("limit") || "50";
  return fetchBackend(request, `/api/admin/link-health?limit=${limit}`);
}

export async function POST(request: Request) {
  return fetchBackend(request, "/api/admin/link-health");
}

