import { fetchBackend } from "@/lib/backend-proxy";

export async function POST(request: Request) {
  return fetchBackend(request, "/api/admin/login");
}

