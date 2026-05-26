export interface FriendLink {
  id: number;
  title: string;
  url: string;
  description: string;
  sort: number;
  active: number;
  created_at: string;
  updated_at: string;
}

export interface LinkCreateInput {
  title: string;
  url: string;
  description?: string;
  sort?: number;
  active?: number;
}

export interface LinkUpdateInput {
  id: number;
  title?: string;
  url?: string;
  description?: string;
  sort?: number;
  active?: number;
}
