import { apiClient } from "@/lib/api-client";
import type { FriendLink, LinkCreateInput, LinkUpdateInput, NavModule, ResourceMatrixSubModule } from "@/types";

const DEFAULT_MODULE: NavModule = "friend_links";

type LinkListResponse = { links?: FriendLink[]; data?: FriendLink[] };
type LinkSingleResponse = { data?: FriendLink; link?: FriendLink } | FriendLink;

/** Client-facing link service via local BFF routes. */
export async function getLinks(
  navModule: NavModule = DEFAULT_MODULE,
  resourceSubModule?: ResourceMatrixSubModule,
): Promise<{ links: FriendLink[]; source: string }> {
  try {
    const params = new URLSearchParams();
    if (navModule) params.set("module", navModule);
    if (resourceSubModule) params.set("resource_sub_module", resourceSubModule);
    const data = await apiClient.get<LinkListResponse>(`/api/links?${params.toString()}`, { cache: "no-store" });
    return { links: data.links || data.data || [], source: "bff" };
  } catch {
    return { links: [], source: "fallback" };
  }
}

export async function getAllLinks(navModule?: NavModule, resourceSubModule?: ResourceMatrixSubModule): Promise<FriendLink[]> {
  const data = await getLinks(navModule ?? DEFAULT_MODULE, resourceSubModule);
  return data.links;
}

export async function getLinkById(id: number): Promise<FriendLink | null> {
  try {
    const data = await apiClient.get<LinkListResponse>(`/api/links?keyword=&id=${id}`, { cache: "no-store" });
    const links = data.links || data.data || [];
    return links[0] || null;
  } catch {
    return null;
  }
}

export async function createLink(input: LinkCreateInput): Promise<FriendLink> {
  const data = await apiClient.post<LinkSingleResponse>("/api/admin/links", input);
  if ("data" in data || "link" in data) {
    const item = data.data || data.link;
    if (item) return item;
  }
  return data as FriendLink;
}

export async function updateLink(input: LinkUpdateInput): Promise<FriendLink | null> {
  const data = await apiClient.put<LinkSingleResponse>("/api/admin/links", input);
  if ("data" in data || "link" in data) return data.data || data.link || null;
  return data as FriendLink;
}

export async function deleteLink(id: number): Promise<void> {
  await apiClient.delete(`/api/admin/links?id=${id}`);
}
