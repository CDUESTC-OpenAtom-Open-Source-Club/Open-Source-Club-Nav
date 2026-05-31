import pool from "@/lib/db";
import { FALLBACK_LINKS, MOCK_ADMIN_LINKS } from "@/data/mock/links";
import type { FriendLink, LinkCreateInput, LinkUpdateInput, MiniGameType, NavModule, ResourceMatrixSubModule } from "@/types/links";

const USE_MOCK = process.env.USE_MOCK_DATA === "true";
const DEFAULT_MODULE: NavModule = "friend_links";
const MODULES: NavModule[] = ["resource_matrix", "friend_links", "mini_games"];
const RESOURCE_SUB_MODULES: ResourceMatrixSubModule[] = ["think_tank", "campus", "tools"];
const DEFAULT_RESOURCE_SUB_MODULE: ResourceMatrixSubModule = "think_tank";
const MINI_GAME_TYPES: MiniGameType[] = ["internal", "external"];
const MOCK_STORE_KEY = "__kcos_mock_links_store__";

const LINK_SELECT_FIELDS = `
  id,
  title,
  link_url AS url,
  description,
  sort,
  active,
  CASE
    WHEN category IS NULL OR category = '' THEN '${DEFAULT_MODULE}'
    ELSE category
  END AS module,
  COALESCE(mc.click_count, 0) AS click_count,
  content,
  created_at,
  updated_at
`;
const METRICS_CLICK_JOIN = `
  LEFT JOIN (
    SELECT nav_item_id, COUNT(*) AS click_count
    FROM metrics
    WHERE event_type = 'click'
    GROUP BY nav_item_id
  ) mc ON mc.nav_item_id = nav_items.id
`;

type DbLinkRow = FriendLink & {
  module?: NavModule;
  content?: string | null;
  click_count?: number;
};

function createMockSeed(): FriendLink[] {
  const seed = [...(MOCK_ADMIN_LINKS as FriendLink[]), ...FALLBACK_LINKS];
  const seen = new Set<number>();
  const now = new Date().toISOString();
  return seed
    .map((item, idx) => ({
      ...item,
      id: Number(item.id || idx + 1),
      module: normalizeModule(item.module),
      active: Number(item.active ?? 1),
      sort: Number(item.sort ?? idx + 1),
      created_at: item.created_at || now,
      updated_at: item.updated_at || now,
      click_count: Number(item.click_count || 0),
    }))
    .filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
}

function getMockStore(): FriendLink[] {
  const root = globalThis as typeof globalThis & { [MOCK_STORE_KEY]?: FriendLink[] };
  if (!root[MOCK_STORE_KEY]) {
    root[MOCK_STORE_KEY] = createMockSeed();
  }
  return root[MOCK_STORE_KEY]!;
}

export function resetMockLinksStore(): FriendLink[] {
  const root = globalThis as typeof globalThis & { [MOCK_STORE_KEY]?: FriendLink[] };
  const seed = createMockSeed();
  root[MOCK_STORE_KEY] = seed;
  return seed;
}

function normalizeModule(value: unknown): NavModule {
  return MODULES.includes(value as NavModule) ? (value as NavModule) : DEFAULT_MODULE;
}

function normalizeResourceSubModule(value: unknown): ResourceMatrixSubModule {
  return RESOURCE_SUB_MODULES.includes(value as ResourceMatrixSubModule)
    ? (value as ResourceMatrixSubModule)
    : DEFAULT_RESOURCE_SUB_MODULE;
}

function normalizeMiniGameType(value: unknown, url?: string): MiniGameType {
  if (MINI_GAME_TYPES.includes(value as MiniGameType)) return value as MiniGameType;
  return url && !/^https?:\/\//i.test(url) ? "internal" : "external";
}

function parseContent(content: unknown): Record<string, unknown> {
  if (!content || typeof content !== "string") return {};
  try {
    const parsed = JSON.parse(content) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : {};
  } catch {
    return {};
  }
}

function extractResourceSubModule(content: unknown): ResourceMatrixSubModule | undefined {
  const parsed = parseContent(content);
  if (!parsed.resourceSubModule) return undefined;
  return normalizeResourceSubModule(parsed.resourceSubModule);
}

function getResourceSubModule(item: DbLinkRow, navModule: NavModule): ResourceMatrixSubModule | undefined {
  if (navModule !== "resource_matrix") return undefined;
  const fromField = (item as { resource_sub_module?: unknown }).resource_sub_module;
  if (fromField) return normalizeResourceSubModule(fromField);
  return extractResourceSubModule(item.content);
}

function buildModuleWhereClause(navModule?: NavModule): { sql: string; values: unknown[] } {
  if (!navModule) return { sql: "", values: [] };
  if (navModule === "friend_links") {
    // Backward compatibility: legacy rows may have null/empty category.
    return { sql: "AND (category = ? OR category IS NULL OR category = '')", values: [navModule] };
  }
  return { sql: "AND category = ?", values: [navModule] };
}

function buildResourceSubModuleWhereClause(resourceSubModule?: ResourceMatrixSubModule): { sql: string; values: unknown[] } {
  if (!resourceSubModule) return { sql: "", values: [] };
  return {
    sql: "AND JSON_VALID(content) AND JSON_UNQUOTE(JSON_EXTRACT(content, '$.resourceSubModule')) = ?",
    values: [resourceSubModule],
  };
}

function getMiniGameType(item: DbLinkRow, navModule: NavModule): MiniGameType | undefined {
  if (navModule !== "mini_games") return undefined;
  const parsed = parseContent(item.content);
  return normalizeMiniGameType(parsed.gameType || parsed.game_type, item.url);
}

function buildContentPayload(input: {
  navModule: NavModule;
  resourceSubModule?: ResourceMatrixSubModule;
  gameType?: MiniGameType;
  url?: string;
}): string {
  if (input.navModule === "resource_matrix") {
    return JSON.stringify({
      resourceSubModule: normalizeResourceSubModule(input.resourceSubModule),
    });
  }
  if (input.navModule === "mini_games") {
    const gameType = normalizeMiniGameType(input.gameType, input.url);
    return JSON.stringify({
      gameType,
      gameRoute: gameType === "internal" ? input.url || "/games" : undefined,
      externalUrl: gameType === "external" ? input.url || "" : undefined,
      embedSupported: false,
    });
  }
  return "";
}

function toFriendLinks(rows: unknown): FriendLink[] {
  return (rows as DbLinkRow[]).map((item) => {
    const normalizedModule = normalizeModule(item.module);
    const resourceSubModule = getResourceSubModule(item, normalizedModule);
    const gameType = getMiniGameType(item, normalizedModule);
    return {
      id: item.id,
      title: item.title,
      url: item.url,
      description: item.description,
      sort: item.sort,
      active: item.active,
      module: normalizedModule,
      resource_sub_module: resourceSubModule,
      game_type: gameType,
      click_count: Number(item.click_count || 0),
      created_at: item.created_at,
      updated_at: item.updated_at,
    };
  });
}

async function resolveNextSortForCreate(
  navModule: NavModule,
  resourceSubModule?: ResourceMatrixSubModule,
): Promise<number> {
  if (USE_MOCK) {
    const store = getMockStore();
    const scoped = store.filter((item) => {
      if (normalizeModule(item.module) !== navModule) return false;
      if (navModule !== "resource_matrix") return true;
      return normalizeResourceSubModule(item.resource_sub_module) === normalizeResourceSubModule(resourceSubModule);
    });
    const maxSort = scoped.length ? Math.max(...scoped.map((item) => Number(item.sort || 0))) : 0;
    return maxSort + 1;
  }

  const where = buildModuleWhereClause(navModule);
  const subWhere = navModule === "resource_matrix"
    ? buildResourceSubModuleWhereClause(resourceSubModule)
    : { sql: "", values: [] };
  const [rows] = await pool.query(
    `SELECT COALESCE(MAX(sort), 0) AS max_sort
     FROM nav_items
     WHERE 1 = 1
       ${where.sql}
       ${subWhere.sql}`,
    [...where.values, ...subWhere.values],
  );
  const maxSort = Number((rows as Array<{ max_sort?: number }>)[0]?.max_sort || 0);
  return maxSort + 1;
}

export async function getLinks(
  navModule: NavModule = DEFAULT_MODULE,
  resourceSubModule?: ResourceMatrixSubModule,
): Promise<{ links: FriendLink[]; source: string }> {
  if (USE_MOCK) {
    const links = getMockStore().filter((item) => {
      if (Number(item.active ?? 1) !== 1) return false;
      const normalizedModule = normalizeModule(item.module);
      if (normalizedModule !== navModule) return false;
      if (navModule !== "resource_matrix" || !resourceSubModule) return true;
      return normalizeResourceSubModule(item.resource_sub_module) === resourceSubModule;
    }).sort((a, b) => a.sort - b.sort || a.id - b.id);
    return { links, source: "mock" };
  }

  try {
    const where = buildModuleWhereClause(navModule);
    const subWhere = navModule === "resource_matrix"
      ? buildResourceSubModuleWhereClause(resourceSubModule)
      : { sql: "", values: [] };
    const [rows] = await pool.query(
      `SELECT
         ${LINK_SELECT_FIELDS}
       FROM nav_items
       ${METRICS_CLICK_JOIN}
       WHERE active = 1
         ${where.sql}
         ${subWhere.sql}
       ORDER BY sort ASC, id ASC`,
      [...where.values, ...subWhere.values],
    );
    return { links: toFriendLinks(rows), source: "mysql" };
  } catch {
    const links = FALLBACK_LINKS.filter((item) => {
      const normalizedModule = normalizeModule(item.module);
      if (normalizedModule !== navModule) return false;
      if (navModule !== "resource_matrix" || !resourceSubModule) return true;
      return normalizeResourceSubModule(item.resource_sub_module) === resourceSubModule;
    });
    return { links, source: "fallback" };
  }
}

export async function getAllLinks(navModule?: NavModule, resourceSubModule?: ResourceMatrixSubModule): Promise<FriendLink[]> {
  if (USE_MOCK) {
    return getMockStore().filter((item) => {
      const normalizedModule = normalizeModule(item.module);
      if (navModule && normalizedModule !== navModule) return false;
      if (navModule === "resource_matrix" && resourceSubModule) {
        return normalizeResourceSubModule(item.resource_sub_module) === resourceSubModule;
      }
      return true;
    }).sort((a, b) => a.sort - b.sort || a.id - b.id);
  }

  const where = buildModuleWhereClause(navModule);
  const subWhere = navModule === "resource_matrix"
    ? buildResourceSubModuleWhereClause(resourceSubModule)
    : { sql: "", values: [] };
  const [rows] = await pool.query(
    `SELECT
       ${LINK_SELECT_FIELDS}
     FROM nav_items
     ${METRICS_CLICK_JOIN}
     WHERE 1 = 1
       ${where.sql}
       ${subWhere.sql}
     ORDER BY sort ASC, id ASC`,
    [...where.values, ...subWhere.values],
  );
  return toFriendLinks(rows);
}

export async function getLinkById(id: number): Promise<FriendLink | null> {
  if (!id) return null;
  if (USE_MOCK) {
    return (getMockStore().find((item) => Number(item.id) === Number(id)) || null);
  }
  const [rows] = await pool.query(
    `SELECT
       ${LINK_SELECT_FIELDS}
     FROM nav_items
     ${METRICS_CLICK_JOIN}
     WHERE id = ?
     LIMIT 1`,
    [id],
  );
  return toFriendLinks(rows)[0] || null;
}

export async function createLink(input: LinkCreateInput): Promise<FriendLink> {
  const navModule = normalizeModule(input.module);
  // Product rule: new links in resource_matrix/friend_links are always appended to list end.
  const sort = navModule === "resource_matrix" || navModule === "friend_links"
    ? await resolveNextSortForCreate(navModule, input.resource_sub_module)
    : Number(input.sort || 0);

  if (USE_MOCK) {
    const store = getMockStore();
    const nextId = store.length ? Math.max(...store.map((item) => Number(item.id || 0))) + 1 : 1;
    const now = new Date().toISOString();
    const created: FriendLink = {
      id: nextId,
      title: String(input.title || "").trim(),
      url: String(input.url || "").trim(),
      description: String(input.description || "").trim(),
      sort,
      active: Number(input.active ?? 1),
      module: navModule,
      resource_sub_module: navModule === "resource_matrix" ? normalizeResourceSubModule(input.resource_sub_module) : undefined,
      game_type: navModule === "mini_games" ? normalizeMiniGameType(input.game_type, input.url) : undefined,
      click_count: 0,
      created_at: now,
      updated_at: now,
    };
    store.push(created);
    return created;
  }
  const contentPayload = buildContentPayload({
    navModule,
    resourceSubModule: input.resource_sub_module,
    gameType: input.game_type,
    url: input.url,
  });
  const [result] = await pool.query(
    `INSERT INTO nav_items
      (title, content, cover_url, link_url, description, sort, active, category, created_at, updated_at)
     VALUES (?, ?, '', ?, ?, ?, ?, ?, NOW(3), NOW(3))`,
    [
      input.title,
      contentPayload,
      input.url,
      input.description || "",
      sort,
      input.active ?? 1,
      navModule,
    ],
  );
  const insertId = (result as { insertId: number }).insertId;
  const [rows] = await pool.query(
    `SELECT
       ${LINK_SELECT_FIELDS}
     FROM nav_items
     ${METRICS_CLICK_JOIN}
     WHERE id = ?`,
    [insertId],
  );
  return toFriendLinks(rows)[0];
}

export async function updateLink(input: LinkUpdateInput): Promise<FriendLink | null> {
  if (USE_MOCK) {
    const store = getMockStore();
    const idx = store.findIndex((item) => Number(item.id) === Number(input.id));
    if (idx < 0) return null;
    const current = store[idx];
    const nextModule = input.module === undefined ? normalizeModule(current.module) : normalizeModule(input.module);
    const next: FriendLink = {
      ...current,
      title: input.title !== undefined ? String(input.title) : current.title,
      url: input.url !== undefined ? String(input.url) : current.url,
      description: input.description !== undefined ? String(input.description) : current.description,
      sort: input.sort !== undefined ? Number(input.sort) : current.sort,
      active: input.active !== undefined ? Number(input.active) : current.active,
      module: nextModule,
      resource_sub_module: nextModule === "resource_matrix"
        ? normalizeResourceSubModule(input.resource_sub_module ?? current.resource_sub_module)
        : undefined,
      game_type: nextModule === "mini_games"
        ? normalizeMiniGameType(input.game_type ?? current.game_type, input.url ?? current.url)
        : undefined,
      updated_at: new Date().toISOString(),
    };
    store[idx] = next;
    return next;
  }

  const currentModule = input.module === undefined ? undefined : normalizeModule(input.module);
  const fields: string[] = [];
  const values: (string | number)[] = [];

  if (input.title !== undefined) {
    fields.push("title = ?");
    values.push(input.title);
  }
  if (input.url !== undefined) {
    fields.push("link_url = ?");
    values.push(input.url);
  }
  if (input.description !== undefined) {
    fields.push("description = ?");
    values.push(input.description);
  }
  if (input.sort !== undefined) {
    fields.push("sort = ?");
    values.push(input.sort);
  }
  if (input.active !== undefined) {
    fields.push("active = ?");
    values.push(input.active);
  }
  if (currentModule !== undefined) {
    fields.push("category = ?");
    values.push(currentModule);
  }
  if (input.resource_sub_module !== undefined || input.game_type !== undefined || currentModule !== undefined) {
    const moduleForContent = currentModule ?? (input.game_type !== undefined ? "mini_games" : "resource_matrix");
    fields.push("content = ?");
    values.push(buildContentPayload({
      navModule: moduleForContent,
      resourceSubModule: input.resource_sub_module,
      gameType: input.game_type,
      url: input.url,
    }));
  }
  if (fields.length === 0) return null;

  values.push(input.id);
  await pool.query(`UPDATE nav_items SET ${fields.join(", ")}, updated_at = NOW(3) WHERE id = ?`, values);
  const [rows] = await pool.query(
    `SELECT
       ${LINK_SELECT_FIELDS}
     FROM nav_items
     ${METRICS_CLICK_JOIN}
     WHERE id = ?`,
    [input.id],
  );
  return toFriendLinks(rows)[0] || null;
}

export async function deleteLink(id: number): Promise<void> {
  if (USE_MOCK) {
    const store = getMockStore();
    const idx = store.findIndex((item) => Number(item.id) === Number(id));
    if (idx < 0) return;
    store[idx] = {
      ...store[idx],
      active: 0,
      updated_at: new Date().toISOString(),
    };
    return;
  }
  await pool.query("UPDATE nav_items SET active = 0, updated_at = NOW(3) WHERE id = ?", [id]);
}
