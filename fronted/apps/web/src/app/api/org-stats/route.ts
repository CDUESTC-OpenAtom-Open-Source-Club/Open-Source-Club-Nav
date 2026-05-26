// 组织统计数据 API
import { fetchOrgStats } from "@/services/github";

export async function GET() {
  const stats = await fetchOrgStats();
  return Response.json(stats);
}
