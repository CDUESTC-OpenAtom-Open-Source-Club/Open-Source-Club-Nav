import { fetchBackend } from "@/lib/backend-proxy";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const params = searchParams.toString();
  return fetchBackend(request, `/api/admin/link-health${params ? `?${params}` : ""}`);
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const params = searchParams.toString();
  return fetchBackend(request, `/api/admin/link-health${params ? `?${params}` : ""}`);
}
