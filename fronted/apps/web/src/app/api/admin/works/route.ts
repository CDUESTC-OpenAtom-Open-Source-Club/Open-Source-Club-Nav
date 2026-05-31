import { getAdminSessionFromCookies } from "@/lib/admin-auth";
import { ensureAdminTables } from "@/lib/admin-db";
import { createWork, deleteWork, getAllWorks } from "@/services/works";

async function requireEditorOrSuper(): Promise<Response | null> {
  await ensureAdminTables();
  const session = await getAdminSessionFromCookies();
  if (!session) return Response.json({ error: "未登录" }, { status: 401 });
  if (session.role !== "editor" && session.role !== "super") {
    return Response.json({ error: "无权限" }, { status: 403 });
  }
  return null;
}

export async function GET() {
  const denied = await requireEditorOrSuper();
  if (denied) return denied;

  try {
    const works = await getAllWorks();
    return Response.json({ works });
  } catch (error) {
    console.error("[admin/works] load failed:", error);
    return Response.json({ error: "数据源不可用" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const denied = await requireEditorOrSuper();
  if (denied) return denied;

  try {
    const body = await request.json();
    if (!body.title || !body.author_name) {
      return Response.json({ error: "title 和 author_name 为必填项" }, { status: 400 });
    }
    const work = await createWork(body);
    return Response.json({ work }, { status: 201 });
  } catch (error) {
    console.error("[admin/works] create failed:", error);
    return Response.json({ error: "新增失败" }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  const denied = await requireEditorOrSuper();
  if (denied) return denied;

  try {
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));
    if (!id) {
      return Response.json({ error: "缺少 id" }, { status: 400 });
    }
    const deleted = await deleteWork(id);
    if (!deleted) {
      return Response.json({ error: "作品不存在" }, { status: 404 });
    }
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[admin/works] delete failed:", error);
    return Response.json({ error: "删除失败" }, { status: 503 });
  }
}
