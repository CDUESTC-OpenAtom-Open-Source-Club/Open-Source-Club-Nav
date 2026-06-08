import { fetchBackend } from "@/lib/backend-proxy";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const params = searchParams.toString();
  return fetchBackend(request, `/api/admin/login-audit${params ? `?${params}` : ""}`);
}
