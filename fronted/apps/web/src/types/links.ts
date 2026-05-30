export type NavModule = "resource_matrix" | "friend_links" | "mini_games";
export type ResourceMatrixSubModule = "think_tank" | "campus" | "tools";
export type GameType = "internal" | "external";

export interface FriendLink {
  id: number;
  title: string;
  url: string;
  description: string;
  sort: number;
  active: number;
  module?: NavModule;
  resource_sub_module?: ResourceMatrixSubModule;
  game_type?: GameType | null;
  click_count?: number;
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
  resource_sub_module?: ResourceMatrixSubModule;
  game_type?: GameType | null;
}

export interface LinkUpdateInput {
  id: number;
  title?: string;
  url?: string;
  description?: string;
  sort?: number;
  active?: number;
  module?: NavModule;
  resource_sub_module?: ResourceMatrixSubModule;
  game_type?: GameType | null;
}
