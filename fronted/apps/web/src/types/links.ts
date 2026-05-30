export type NavModule = "resource_matrix" | "friend_links" | "mini_games";

export interface FriendLink {
  id: number;
  title: string;
  url: string;
  description: string;
  sort: number;
  active: number;
  module?: NavModule;
  created_at: string;
  updated_at: string;
}

export interface LinkCreateInput {
  title: string;
  url: string;
  description?: string;
  sort?: number;
  active?: number;
  module?: NavModule;
}

export interface LinkUpdateInput {
  id: number;
  title?: string;
  url?: string;
  description?: string;
  sort?: number;
  active?: number;
  module?: NavModule;
}
