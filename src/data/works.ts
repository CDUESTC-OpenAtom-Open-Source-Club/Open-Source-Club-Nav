export interface Work {
  id: number;
  title: string;
  desc: string;
  author: string;
  avatar: string;
  tags: string[];
  color: string;
  status: string;
  stars: number;
  preview: string | null;
}

export const WORKS: Work[] = [
  {
    id: 1,
    title: "选课助手 Pro",
    desc: "自动抢课 · 冲突检测 · 课表可视化",
    author: "Zhang Wei",
    avatar: "ZW",
    tags: ["React", "Python", "FastAPI"],
    color: "#0A84FF",
    status: "已上线",
    stars: 128,
    preview: null,
  },
  {
    id: 2,
    title: "校园外卖比价器",
    desc: "实时比价 · 拼单功能 · 历史价格趋势",
    author: "Liu Fang",
    avatar: "LF",
    tags: ["Vue3", "Node.js", "Redis"],
    color: "#06E5CC",
    status: "开发中",
    stars: 87,
    preview: null,
  },
  {
    id: 3,
    title: "摸鱼时钟",
    desc: "番茄钟 · 任务追踪 · 团队协作看板",
    author: "Chen Hao",
    avatar: "CH",
    tags: ["TypeScript", "Prisma", "WebSocket"],
    color: "#7C3AED",
    status: "已上线",
    stars: 203,
    preview: null,
  },
  {
    id: 4,
    title: "OpenAI 实验室",
    desc: "大模型 Prompt 调试 · 对话记录云端同步",
    author: "Wang Jing",
    avatar: "WJ",
    tags: ["Next.js", "OpenAI API", "Supabase"],
    color: "#F59E0B",
    status: "内测中",
    stars: 156,
    preview: null,
  },
  {
    id: 5,
    title: "成电路线导航",
    desc: "室内导航 · 空教室查询 · 一键打印路线",
    author: "Li Ming",
    avatar: "LM",
    tags: ["Flutter", "Go", "PostgreSQL"],
    color: "#EF4444",
    status: "已上线",
    stars: 94,
    preview: null,
  },
  {
    id: 6,
    title: "HexBoard",
    desc: "极简六边形笔记板 · Markdown · 本地优先",
    author: "Zhao Yu",
    avatar: "ZY",
    tags: ["Electron", "SQLite", "ProseMirror"],
    color: "#10B981",
    status: "已上线",
    stars: 312,
    preview: null,
  },
  {
    id: 7,
    title: "StarLink CLI",
    desc: "Git 工作流工具 · 自动化提交规范",
    author: "Sun Lei",
    avatar: "SL",
    tags: ["Rust", "CLI", "Shell"],
    color: "#38BDF8",
    status: "开发中",
    stars: 67,
    preview: null,
  },
  {
    id: 8,
    title: "开源贡献看板",
    desc: "社团成员贡献可视化 · GitHub Stats",
    author: "Huang Xin",
    avatar: "HX",
    tags: ["D3.js", "GitHub API", "Vercel"],
    color: "#EC4899",
    status: "已上线",
    stars: 143,
    preview: null,
  },
];
