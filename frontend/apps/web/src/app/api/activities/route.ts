import { fetchPublicBackend } from "@/lib/backend-proxy";

export const revalidate = 300;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const params = searchParams.toString();
  return fetchPublicBackend(request, `/api/activities${params ? `?${params}` : ""}`, {
    browserMaxAgeSeconds: 60,
    sharedMaxAgeSeconds: 300,
  });
}
