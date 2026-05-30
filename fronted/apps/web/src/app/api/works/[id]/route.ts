// 作品更新 API
// PATCH /api/works/:id - 更新单个作品

import pool from "@/lib/db";
import { getAdminSessionFromCookies } from "@/lib/admin-auth";
import { ensureAdminTables } from "@/lib/admin-db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensureAdminTables();
  const session = await getAdminSessionFromCookies();
  if (!session) return Response.json({ error: "未登录" }, { status: 401 });
  if (session.role !== "editor" && session.role !== "super") {
    return Response.json({ error: "无权限" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    const allowedFields = [
      "type", "repo_url", "title", "description", "author_name", "author_avatar",
      "tags", "color", "status", "stars", "preview_url", "is_featured", "display_order",
    ];

    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        if (key === "tags") {
          fields.push(`${key} = ?`);
          values.push(JSON.stringify(body[key]));
        } else if (key === "is_featured") {
          fields.push(`${key} = ?`);
          values.push(body[key] ? 1 : 0);
        } else {
          fields.push(`${key} = ?`);
          values.push(body[key]);
        }
      }
    }

    if (fields.length === 0) {
      return Response.json({ error: "无更新字段" }, { status: 400 });
    }

    values.push(Number(id));
    await pool.query(`UPDATE works SET ${fields.join(", ")} WHERE id = ?`, values);

    const [rows] = await pool.query("SELECT * FROM works WHERE id = ?", [Number(id)]);
    const work = (rows as Record<string, unknown>[])[0];

    if (!work) {
      return Response.json({ error: "作品不存在" }, { status: 404 });
    }

    if (typeof work.tags === "string") work.tags = JSON.parse(work.tags as string);

    return Response.json({ work });
  } catch (error) {
    console.error("[works] 更新作品失败：", error);
    return Response.json({ error: "数据库未配置或更新失败" }, { status: 503 });
  }
}
