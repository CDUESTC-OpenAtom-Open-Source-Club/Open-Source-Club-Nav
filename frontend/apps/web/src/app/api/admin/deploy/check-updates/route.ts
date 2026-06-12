import { fetchBackend } from "@/lib/backend-proxy";

export async function GET(request: Request) {
  return fetchBackend(request, "/api/admin/deploy/check-updates");
}
