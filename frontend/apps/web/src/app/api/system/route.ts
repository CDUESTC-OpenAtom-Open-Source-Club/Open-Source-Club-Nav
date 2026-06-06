import { fetchBackend } from "@/lib/backend-proxy";

export const revalidate = 60;

export async function GET(request: Request) {
  return fetchBackend(request, "/api/system");
}
