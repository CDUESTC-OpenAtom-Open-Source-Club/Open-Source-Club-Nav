import { fetchPublicBackend } from "@/lib/backend-proxy";

export const revalidate = 3600;

export async function GET(request: Request) {
  return fetchPublicBackend(request, "/api/org-stats", {
    browserMaxAgeSeconds: 300,
    sharedMaxAgeSeconds: 3600,
  });
}
