// 作品更新/删除 API
// PATCH /api/works/:id - 更新单个作品
// DELETE /api/works/:id - 删除单个作品

import { getAdminSessionFromCookies } from "@/lib/admin-auth";
import { ensureAdminTables } from "@/lib/admin-db";
import { deleteWork, updateWork } from "@/services/works";

async function requireEditorOrSuper(): Promise<Response | null> {
  await ensureAdminTables();
  const session = await getAdminSessionFromCookies();
  if (!session) return Response.json({ error: "未登录" }, { status: 401 });
  if (session.role !== "editor" && session.role !== "super") {
    return Response.json({ error: "无权限" }, { status: 403 });
  }
  return null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireEditorOrSuper();
  if (denied) return denied;

  try {
    const { id } = await params;
    const body = await request.json();
    const work = await updateWork(Number(id), body);
    if (!work) return Response.json({ error: "作品不存在或没有可更新字段" }, { status: 404 });
    return Response.json({ work });
  } catch (error) {
    console.error("[works] 更新作品失败:", error);
    return Response.json({ error: "数据库未配置或更新失败" }, { status: 503 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireEditorOrSuper();
  if (denied) return denied;

  try {
    const { id } = await params;
    const deleted = await deleteWork(Number(id));
    if (!deleted) return Response.json({ error: "作品不存在" }, { status: 404 });
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[works] 删除作品失败:", error);
    return Response.json({ error: "数据库未配置或删除失败" }, { status: 503 });
  }
}
