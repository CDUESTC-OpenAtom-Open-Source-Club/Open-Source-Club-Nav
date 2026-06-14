import { fetchPublicBackend } from "@/lib/backend-proxy";

export const revalidate = 3600;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const params = searchParams.toString();
  return fetchPublicBackend(request, `/api/github-contributors${params ? `?${params}` : ""}`, {
    browserMaxAgeSeconds: 600,
    sharedMaxAgeSeconds: 3600,
  });
}
