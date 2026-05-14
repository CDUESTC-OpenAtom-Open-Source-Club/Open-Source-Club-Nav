import { getAdminSessionFromCookies } from "@/lib/admin-auth";
import pool from "@/lib/db";
import { ensureAdminTables } from "@/lib/admin-db";

const USE_MOCK = process.env.USE_MOCK_DATA === "true";
const mockLinks = [
  { id: 1, title: "OpenAtom Docs", url: "https://openatom.cn", description: "OpenAtom 开放原子开源基金会", sort: 1, active: 1 },
  { id: 2, title: "GitHub", url: "https://github.com", description: "全球代码托管平台", sort: 2, active: 1 },
  { id: 3, title: "Next.js", url: "https://nextjs.org", description: "React 全栈开发框架", sort: 3, active: 0 },
];

function unauthorized() {
  return Response.json({ error: "未登录" }, { status: 401 });
}

function forbidden() {
  return Response.json({ error: "无权限" }, { status: 403 });
}

async function requireEditorOrSuper() {
  // 演示模式直接注入一个虚拟 super 账号，便于后台本地联调。
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
    `INSERT INTO admin_link_logs
      (link_id, action, actor_user_id, actor_username, actor_role, detail)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      linkId,
      action,
      session.userId,
      session.username,
      session.role,
      JSON.stringify(detail || {}),
    ],
  );
}

export async function GET() {
  // 列表接口既服务后台首屏加载，也服务增删改后的刷新。
  if (USE_MOCK) {
    return Response.json({ links: mockLinks });
  }

  const auth = await requireEditorOrSuper();
  if (auth.error) return auth.error;
  const [rows] = await pool.query("SELECT * FROM friend_links ORDER BY sort ASC, id ASC");
  return Response.json({ links: rows });
}

export async function POST(request: Request) {
  // mock 模式只返回新增结果，不做真实持久化。
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
    const [result] = await pool.query(
      "INSERT INTO friend_links (title, url, description, sort, active) VALUES (?, ?, ?, ?, 1)",
      [title, url, description, Number.isFinite(sort) ? sort : 0],
    );
    const linkId = Number((result as { insertId?: number }).insertId || 0) || null;
    await writeLinkLog(auth.session, "create", linkId, { title, url, description, sort });
    return Response.json({ ok: true }, { status: 201 });
  } catch {
    return Response.json({ error: "新增链接失败" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  // 更新接口统一处理标题、描述、排序和启用状态修改。
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

    const fields: string[] = [];
    const values: Array<string | number> = [];
    if (body?.title !== undefined) {
      fields.push("title = ?");
      values.push(String(body.title));
    }
    if (body?.url !== undefined) {
      fields.push("url = ?");
      values.push(String(body.url));
    }
    if (body?.description !== undefined) {
      fields.push("description = ?");
      values.push(String(body.description));
    }
    if (body?.sort !== undefined) {
      fields.push("sort = ?");
      values.push(Number(body.sort) || 0);
    }
    if (body?.active !== undefined) {
      fields.push("active = ?");
      values.push(body.active ? 1 : 0);
    }

    if (fields.length === 0) {
      return Response.json({ error: "没有可更新字段" }, { status: 400 });
    }

    values.push(id);
    await pool.query(`UPDATE friend_links SET ${fields.join(", ")} WHERE id = ?`, values);
    await writeLinkLog(auth.session, "update", id, {
      title: body?.title,
      url: body?.url,
      description: body?.description,
      sort: body?.sort,
      active: body?.active,
    });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "更新链接失败" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  // 删除逻辑实际是“禁用链接”，数据库记录仍保留。
  if (USE_MOCK) {
    return Response.json({ ok: true });
  }

  const auth = await requireEditorOrSuper();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const id = Number(searchParams.get("id"));
  if (!id) return Response.json({ error: "缺少 id" }, { status: 400 });

  await pool.query("UPDATE friend_links SET active = 0 WHERE id = ?", [id]);
  await writeLinkLog(auth.session, "disable", id, {});
  return Response.json({ ok: true });
}


