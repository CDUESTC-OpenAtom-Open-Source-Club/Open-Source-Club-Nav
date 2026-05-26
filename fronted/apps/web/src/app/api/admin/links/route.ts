import { getAdminSessionFromCookies } from "@/lib/admin-auth";
import pool from "@/lib/db";
import { ensureAdminTables } from "@/lib/admin-db";
import { MOCK_ADMIN_LINKS } from "@/data/mock/links";
import { getAllLinks, createLink, updateLink, deleteLink } from "@/services/links";

const USE_MOCK = process.env.USE_MOCK_DATA === "true";

function unauthorized() {
  return Response.json({ error: "未登录" }, { status: 401 });
}

function forbidden() {
  return Response.json({ error: "无权限" }, { status: 403 });
}

async function requireEditorOrSuper() {
  if (USE_MOCK) {
    return {
      error: null,
      session: { userId: 1, username: "admin", role: "super" as const },
    };
  }

  await ensureAdminTables();
  const session = await getAdminSessionFromCookies();
  if (!session) return { error: unauthorized() as Response, session: null };
  if (session.role !== "editor" && session.role !== "super") {
    return { error: forbidden() as Response, session: null };
  }
  return { error: null, session };
}

async function writeLinkLog(
  session: { userId: number; username: string; role: "super" | "editor" },
  action: string,
  linkId: number | null,
  detail: Record<string, unknown>,
) {
  if (USE_MOCK) return;

  await pool.query(
    `INSERT INTO nav_item_logs
      (nav_item_id, action, actor_user_id, actor_username, actor_role, detail)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [linkId, action, session.userId, session.username, session.role, JSON.stringify(detail || {})],
  );
}

export async function GET() {
  if (USE_MOCK) {
    return Response.json({ links: MOCK_ADMIN_LINKS });
  }

  const auth = await requireEditorOrSuper();
  if (auth.error) return auth.error;

  const links = await getAllLinks();
  return Response.json({ links });
}

export async function POST(request: Request) {
  if (USE_MOCK) {
    const body = await request.json().catch(() => ({}));
    return Response.json({
      ok: true,
      link: {
        id: Date.now(),
        title: String(body?.title || ""),
        url: String(body?.url || ""),
        description: String(body?.description || ""),
        sort: Number(body?.sort || 0),
        active: 1,
      },
    }, { status: 201 });
  }

  const auth = await requireEditorOrSuper();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const title = String(body?.title || "").trim();
    const url = String(body?.url || "").trim();
    const description = String(body?.description || "").trim();
    const sort = Number(body?.sort || 0);

    if (!title || !url) {
      return Response.json({ error: "标题和链接不能为空" }, { status: 400 });
    }

    const link = await createLink({ title, url, description, sort });
    await writeLinkLog(auth.session, "create", link.id, { title, url, description, sort });
    return Response.json({ ok: true, link }, { status: 201 });
  } catch {
    return Response.json({ error: "新增链接失败" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (USE_MOCK) {
    const body = await request.json().catch(() => ({}));
    return Response.json({ ok: true, link: body });
  }

  const auth = await requireEditorOrSuper();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const id = Number(body?.id);
    if (!id) return Response.json({ error: "缺少 id" }, { status: 400 });

    const link = await updateLink(body);
    if (!link) return Response.json({ error: "没有可更新字段" }, { status: 400 });

    await writeLinkLog(auth.session, "update", id, {
      title: body?.title,
      url: body?.url,
      description: body?.description,
      sort: body?.sort,
      active: body?.active,
    });
    return Response.json({ ok: true, link });
  } catch {
    return Response.json({ error: "更新链接失败" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (USE_MOCK) {
    return Response.json({ ok: true });
  }

  const auth = await requireEditorOrSuper();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const id = Number(searchParams.get("id"));
  if (!id) return Response.json({ error: "缺少 id" }, { status: 400 });

  await deleteLink(id);
  await writeLinkLog(auth.session, "disable", id, {});
  return Response.json({ ok: true });
}
