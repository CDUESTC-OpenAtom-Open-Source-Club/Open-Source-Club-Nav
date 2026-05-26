import pool from "@/lib/db";
import { FALLBACK_LINKS } from "@/data/mock/links";
import type { FriendLink, LinkCreateInput, LinkUpdateInput } from "@/types/links";

const USE_MOCK = process.env.USE_MOCK_DATA === "true";

export async function getLinks(): Promise<{ links: FriendLink[]; source: string }> {
  if (USE_MOCK) return { links: FALLBACK_LINKS, source: "mock" };

  try {
    const [rows] = await pool.query(
      "SELECT * FROM friend_links WHERE active = 1 ORDER BY sort ASC, id ASC"
    );
    return { links: rows as FriendLink[], source: "mysql" };
  } catch {
    return { links: FALLBACK_LINKS, source: "fallback" };
  }
}

export async function getAllLinks(): Promise<FriendLink[]> {
  if (USE_MOCK) {
    const { MOCK_ADMIN_LINKS } = await import("@/data/mock/links");
    return MOCK_ADMIN_LINKS as FriendLink[];
  }
  const [rows] = await pool.query("SELECT * FROM friend_links ORDER BY sort ASC, id ASC");
  return rows as FriendLink[];
}

export async function createLink(input: LinkCreateInput): Promise<FriendLink> {
  const [result] = await pool.query(
    "INSERT INTO friend_links (title, url, description, sort, active) VALUES (?, ?, ?, ?, ?)",
    [input.title, input.url, input.description || "", input.sort || 0, input.active ?? 1]
  );
  const insertId = (result as { insertId: number }).insertId;
  const [rows] = await pool.query("SELECT * FROM friend_links WHERE id = ?", [insertId]);
  return (rows as FriendLink[])[0];
}

export async function updateLink(input: LinkUpdateInput): Promise<FriendLink | null> {
  const allowed = ["title", "url", "description", "sort", "active"] as const;
  const fields: string[] = [];
  const values: (string | number)[] = [];

  for (const key of allowed) {
    if (input[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(input[key] as string | number);
    }
  }
  if (fields.length === 0) return null;

  values.push(input.id);
  await pool.query(`UPDATE friend_links SET ${fields.join(", ")} WHERE id = ?`, values);
  const [rows] = await pool.query("SELECT * FROM friend_links WHERE id = ?", [input.id]);
  return (rows as FriendLink[])[0] || null;
}

export async function deleteLink(id: number): Promise<void> {
  await pool.query("UPDATE friend_links SET active = 0 WHERE id = ?", [id]);
}
