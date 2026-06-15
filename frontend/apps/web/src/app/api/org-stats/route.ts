import { fetchOrgStats } from "@/services/github";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const stats = await fetchOrgStats();
  return Response.json(stats, {
    headers: {
      "Cache-Control": "no-store",
      "CDN-Cache-Control": "no-store",
    },
  });
}
