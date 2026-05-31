import { getAdminSessionFromCookies } from "@/lib/admin-auth";
import { ensureAdminTables } from "@/lib/admin-db";
import { recordAdminActionLog } from "@/lib/admin-logs";
import { createLink, deleteLink, getAllLinks, getLinkById, resetMockLinksStore, updateLink } from "@/services/links";
import type { MiniGameType, NavModule, ResourceMatrixSubModule } from "@/types/links";

const USE_MOCK = process.env.USE_MOCK_DATA === "true";
const MODULES: NavModule[] = ["resource_matrix", "friend_links", "mini_games"];
const RESOURCE_SUB_MODULES: ResourceMatrixSubModule[] = ["think_tank", "campus", "tools"];
const MINI_GAME_TYPES: MiniGameType[] = ["internal", "external"];
const DEFAULT_MODULE: NavModule = "friend_links";
const MOCK_ACTOR = { userId: 1, username: "admin", role: "super" as const };

function unauthorized() {
  return Response.json({ error: "未登录" }, { status: 401 });
}

function forbidden() {
  return Response.json({ error: "无权限" }, { status: 403 });
}

function parseModule(value: unknown): NavModule {
  return MODULES.includes(value as NavModule) ? (value as NavModule) : DEFAULT_MODULE;
}

function parseResourceSubModule(value: unknown): ResourceMatrixSubModule | undefined {
  return RESOURCE_SUB_MODULES.includes(value as ResourceMatrixSubModule)
    ? (value as ResourceMatrixSubModule)
    : undefined;
}

function parseMiniGameType(value: unknown, url?: string): MiniGameType | undefined {
  if (MINI_GAME_TYPES.includes(value as MiniGameType)) return value as MiniGameType;
  if (!url) return undefined;
  return /^https?:\/\//i.test(url) ? "external" : "internal";
}

async function requireEditorOrSuper() {
  if (USE_MOCK) {
    return {
      error: null,
      session: { userId: 1, username: "admin", role: "super" as const },
    };
  }

  try {
    await ensureAdminTables();
    const session = await getAdminSessionFromCookies();
    if (!session) return { error: unauthorized() as Response, session: null };
    if (session.role !== "editor" && session.role !== "super") {
      return { error: forbidden() as Response, session: null };
    }
    return { error: null, session };
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[admin/links] auth fallback mock:", (error as Error)?.message || error);
      return {
        error: null,
        session: { userId: 1, username: "admin", role: "super" as const },
      };
    }
    throw error;
  }
}

function buildLinkSnapshot(link: Awaited<ReturnType<typeof getLinkById>>) {
  if (!link) return null;
  return {
    id: link.id,
    title: link.title,
    url: link.url,
    description: link.description,
    sort: link.sort,
    active: link.active,
    module: link.module,
    resource_sub_module: link.resource_sub_module,
    click_count: link.click_count,
    created_at: link.created_at,
    updated_at: link.updated_at,
  };
}

function getChangedFields(
  before: ReturnType<typeof buildLinkSnapshot>,
  after: ReturnType<typeof buildLinkSnapshot>,
) {
  if (!before || !after) return [];
  const keys = Object.keys(after) as Array<keyof NonNullable<ReturnType<typeof buildLinkSnapshot>>>;
  return keys.filter((key) => JSON.stringify(before[key]) !== JSON.stringify(after[key]));
}

function parseCreatePayload(body: Record<string, unknown>) {
  const navModule = parseModule(body.module);
  const resourceSubModule = navModule === "resource_matrix"
    ? (parseResourceSubModule(body.resource_sub_module) || "think_tank")
    : undefined;
  const title = String(body.title || "").trim();
  const url = String(body.url || "").trim();
  const description = String(body.description || "").trim();
  const sort = Number(body.sort || 0);
  const gameType = navModule === "mini_games" ? parseMiniGameType(body.game_type, url) : undefined;
  return { navModule, resourceSubModule, title, url, description, sort, gameType };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const navModule = parseModule(searchParams.get("module"));
  const shouldResetMock = searchParams.get("reset") === "1";
  const resourceSubModule = navModule === "resource_matrix"
    ? parseResourceSubModule(searchParams.get("resource_sub_module"))
    : undefined;

  try {
    if (USE_MOCK && shouldResetMock) {
      resetMockLinksStore();
    }
    if (!USE_MOCK) {
      const auth = await requireEditorOrSuper();
      if (auth.error) return auth.error;
    }
    const links = (await getAllLinks(navModule, resourceSubModule)).filter((item) => Number(item.active ?? 1) === 1);
    return Response.json({ links, module: navModule, resource_sub_module: resourceSubModule || null });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[admin/links] GET fallback mock:", (error as Error)?.message || error);
      const links = (await getAllLinks(navModule, resourceSubModule)).filter((item) => Number(item.active ?? 1) === 1);
      return Response.json({ links, module: navModule, resource_sub_module: resourceSubModule || null });
    }
    throw error;
  }
}

export async function POST(request: Request) {
  const requestBody = await request.json().catch(() => ({}));
  try {
    const body = requestBody as Record<string, unknown>;
    const { navModule, resourceSubModule, title, url, description, sort, gameType } = parseCreatePayload(body);
    if (!title || !url) {
      return Response.json({ error: "标题和链接不能为空" }, { status: 400 });
    }

    let actor: Awaited<ReturnType<typeof requireEditorOrSuper>>["session"] | null = MOCK_ACTOR;
    if (!USE_MOCK) {
      const auth = await requireEditorOrSuper();
      if (auth.error) return auth.error;
      actor = auth.session;
    }

    const link = await createLink({ title, url, description, sort, module: navModule, resource_sub_module: resourceSubModule, game_type: gameType });
    await recordAdminActionLog({
      actor: actor!,
      action: "create_link",
      navItemId: link.id,
      detail: {
        input: { title, url, description, sort, module: navModule, resource_sub_module: resourceSubModule, game_type: gameType },
        created: buildLinkSnapshot(link),
      },
    });
    return Response.json({ ok: true, link }, { status: 201 });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[admin/links] POST fallback mock:", (error as Error)?.message || error);
      const body = requestBody as Record<string, unknown>;
      const { navModule, resourceSubModule, title, url, description, sort, gameType } = parseCreatePayload(body);
      if (!title || !url) {
        return Response.json({ error: "标题和链接不能为空" }, { status: 400 });
      }
      const link = await createLink({ title, url, description, sort, module: navModule, resource_sub_module: resourceSubModule, game_type: gameType });
      return Response.json({ ok: true, link }, { status: 201 });
    }
    return Response.json({ error: "新增链接失败" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const requestBody = await request.json().catch(() => ({}));
  try {
    const body = requestBody as Record<string, unknown>;
    const id = Number(body.id);
    if (!id) return Response.json({ error: "缺少 id" }, { status: 400 });

    let actor: Awaited<ReturnType<typeof requireEditorOrSuper>>["session"] | null = MOCK_ACTOR;
    if (!USE_MOCK) {
      const auth = await requireEditorOrSuper();
      if (auth.error) return auth.error;
      actor = auth.session;
    }

    const before = buildLinkSnapshot(await getLinkById(id));
    const navModule = body.module === undefined ? undefined : parseModule(body.module);
    const resourceSubModule = body.resource_sub_module === undefined
      ? undefined
      : parseResourceSubModule(body.resource_sub_module);
    const gameType = body.game_type === undefined
      ? undefined
      : parseMiniGameType(body.game_type, String(body.url || ""));

    const link = await updateLink({
      id,
      title: body.title as string | undefined,
      url: body.url as string | undefined,
      description: body.description as string | undefined,
      sort: body.sort as number | undefined,
      active: body.active as number | undefined,
      module: navModule,
      resource_sub_module: resourceSubModule,
      game_type: gameType,
    });
    if (!link) return Response.json({ error: "没有可更新字段" }, { status: 400 });

    const after = buildLinkSnapshot(link);
    const changedFields = getChangedFields(before, after);
    const action = body.active === 0 ? "disable_link" : body.active === 1 ? "enable_link" : "update_link";
    await recordAdminActionLog({
      actor: actor!,
      action,
      navItemId: id,
      detail: {
        request: {
          title: body.title,
          url: body.url,
          description: body.description,
          sort: body.sort,
          active: body.active,
          module: navModule,
          resource_sub_module: resourceSubModule,
          game_type: gameType,
        },
        changed_fields: changedFields,
        before,
        after,
      },
    });

    return Response.json({ ok: true, link });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[admin/links] PUT fallback mock:", (error as Error)?.message || error);
      return Response.json({ ok: true, link: requestBody });
    }
    return Response.json({ error: "更新链接失败" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    let actor: Awaited<ReturnType<typeof requireEditorOrSuper>>["session"] | null = MOCK_ACTOR;
    if (!USE_MOCK) {
      const auth = await requireEditorOrSuper();
      if (auth.error) return auth.error;
      actor = auth.session;
    }

    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));
    if (!id) return Response.json({ error: "缺少 id" }, { status: 400 });

    const before = buildLinkSnapshot(await getLinkById(id));
    await deleteLink(id);

    const after = buildLinkSnapshot(await getLinkById(id));
    await recordAdminActionLog({
      actor: actor!,
      action: "delete_link",
      navItemId: id,
      detail: {
        changed_fields: getChangedFields(before, after),
        before,
        after,
      },
    });
    return Response.json({ ok: true });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[admin/links] DELETE fallback mock:", (error as Error)?.message || error);
      return Response.json({ ok: true });
    }
    throw error;
  }
}
