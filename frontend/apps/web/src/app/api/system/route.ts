import { fetchPublicBackend } from "@/lib/backend-proxy";

export const revalidate = 60;

export async function GET(request: Request) {
  return fetchPublicBackend(request, "/api/system", {
    browserMaxAgeSeconds: 30,
    sharedMaxAgeSeconds: 60,
  });
}
