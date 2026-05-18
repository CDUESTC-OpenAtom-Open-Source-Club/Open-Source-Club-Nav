export interface Work {
  id: number;
  type: "GITHUB" | "MANUAL";
  repo_url: string | null;
  title: string;
  description: string;
  author_name: string;
  author_avatar: string;
  tags: string[];
  color: string;
  status: string;
  stars: number;
  preview_url: string | null;
  is_featured: number;
  display_order: number;
}

export interface WorkCreateInput {
  title: string;
  description?: string;
  author_name?: string;
  author_avatar?: string;
  tags?: string[];
  color?: string;
  status?: string;
  repo_url?: string;
  type?: "GITHUB" | "MANUAL";
  stars?: number;
  preview_url?: string;
  is_featured?: boolean;
  display_order?: number;
}

export type WorkUpdateInput = Partial<WorkCreateInput>;
