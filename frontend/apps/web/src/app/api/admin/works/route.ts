import { fetchBackend } from "@/lib/backend-proxy";

export async function GET(request: Request) {
  return fetchBackend(request, "/api/admin/works");
}

export async function POST(request: Request) {
  return fetchBackend(request, "/api/admin/works");
}

