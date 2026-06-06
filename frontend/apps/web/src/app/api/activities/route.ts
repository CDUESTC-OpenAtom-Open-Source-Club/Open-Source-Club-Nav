import { fetchBackend } from "@/lib/backend-proxy";

export const revalidate = 60;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const params = searchParams.toString();
  return fetchBackend(request, `/api/activities${params ? `?${params}` : ""}`);
}
