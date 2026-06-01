// @route-desc BFF API route proxy/handler for /api/org-stats/route.ts
import { fetchOrgStats } from "@/services/github";

export const revalidate = 60;

export async function GET() {
  const stats = await fetchOrgStats();
  return Response.json(stats);
}
