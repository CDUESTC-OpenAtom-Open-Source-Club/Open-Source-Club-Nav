// 成员动态 API 接口
// 当前返回本地测试数据，后续替换为真实数据源（如 GitHub API / 数据库查询）

import activities from "@/constants/activities";

export async function GET() {
  try {
    // TODO: 替换为真实数据源，例如：
    // const activities = await sql`SELECT * FROM activities ORDER BY created_at DESC LIMIT 20`;
    // 或接入 GitHub API：
    // const res = await fetch(`https://api.github.com/orgs/your-org/events`, {
    //   headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` },
    // });
    // const data = await res.json();

    return Response.json({ activities });
  } catch (error) {
    console.error("[activities] 获取成员动态失败：", error);
    return Response.json({ error: "获取动态失败" }, { status: 500 });
  }
}



