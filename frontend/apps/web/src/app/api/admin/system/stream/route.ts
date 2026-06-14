import { fetchBackend } from "@/lib/backend-proxy";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return fetchBackend(request, "/api/admin/system/stream", {
    headers: { Accept: "text/event-stream" },
    cache: "no-store",
  });
}
