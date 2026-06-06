import { fetchBackend } from "@/lib/backend-proxy";

export const revalidate = 60;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const params = searchParams.toString();
  return fetchBackend(request, `/api/works${params ? `?${params}` : ""}`);
}

export async function POST(request: Request) {
  return fetchBackend(request, "/api/admin/works");
}
