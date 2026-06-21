import { fetchPublicBackend } from "@/lib/backend-proxy";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const params = searchParams.toString();
  return fetchPublicBackend(request, `/api/links${params ? `?${params}` : ""}`, {
    cache: "no-store",
    browserMaxAgeSeconds: 0,
    sharedMaxAgeSeconds: 0,
    staleWhileRevalidateSeconds: 0,
  });
}
