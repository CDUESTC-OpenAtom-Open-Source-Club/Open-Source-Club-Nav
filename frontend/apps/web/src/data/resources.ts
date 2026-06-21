// 默认资源数据（用于降级）
const DEFAULT_RESOURCE_CATEGORIES = [
  {
    id: "intelligence",
    label: "智库",
    sublabel: "Intelligence",
    icon: "Brain",
    color: "#0A84FF",
    glow: "#38BDF8",
    links: [
      {
        title: "CS 自学路线图",
        desc: "完整计算机科学自学路径",
        url: "https://roadmap.sh/computer-science",
        tag: "Learning",
      },
      {
        title: "LeetCode",
        desc: "算法刷题 · 面试准备",
        url: "https://leetcode.cn",
        tag: "Practice",
      },
      {
        title: "知网 CNKI",
        desc: "中文学术论文数据库",
        url: "https://www.cnki.net",
        tag: "Research",
      },
      {
        title: "arXiv",
        desc: "最新 AI / CS 预印本论文",
        url: "https://arxiv.org",
        tag: "Papers",
      },
      {
        title: "Coursera",
        desc: "顶尖高校在线课程",
        url: "https://www.coursera.org",
        tag: "Course",
      },
      {
        title: "MIT OCW",
        desc: "MIT 开放课程",
        url: "https://ocw.mit.edu",
        tag: "Course",
      },
      {
        title: "牛客网",
        desc: "面试刷题 · 笔试真题",
        url: "https://www.nowcoder.com",
        tag: "Practice",
      },
      {
        title: "洛谷",
        desc: "算法竞赛训练平台",
        url: "https://www.luogu.com.cn",
        tag: "Algorithm",
      },
      {
        title: "中国大学MOOC",
        desc: "国内高校优质课程",
        url: "https://www.icourse163.org",
        tag: "Course",
      },
      {
        title: "edX",
        desc: "哈佛MIT等名校课程",
        url: "https://www.edx.org",
        tag: "Course",
      },
      {
        title: "Kaggle",
        desc: "数据科学竞赛平台",
        url: "https://www.kaggle.com",
        tag: "Data",
      },
      {
        title: "W3Schools",
        desc: "Web开发入门教程",
        url: "https://www.w3schools.com",
        tag: "Web",
      },
      {
        title: "GeeksforGeeks",
        desc: "计算机科学知识库",
        url: "https://www.geeksforgeeks.org",
        tag: "CS",
      },
      {
        title: "菜鸟教程",
        desc: "编程语言入门指南",
        url: "https://www.runoob.com",
        tag: "Tutorial",
      },
    ],
  },
  {
    id: "surface",
    label: "校园",
    sublabel: "Campus Atlas",
    icon: "MapPin",
    color: "#06E5CC",
    glow: "#06E5CC",
    links: [
      {
        title: "教务处系统",
        desc: "成绩查询 · 选课 · 教务公告",
        url: "#",
        tag: "Campus",
      },
      {
        title: "图书馆资源",
        desc: "电子书 · 数据库 · 预约",
        url: "#",
        tag: "Campus",
      },
      {
        title: "校园卡服务",
        desc: "余额查询 · 挂失 · 充值",
        url: "#",
        tag: "Campus",
      },
      {
        title: "学工系统",
        desc: "奖助学金 · 素质测评",
        url: "#",
        tag: "Campus",
      },
      {
        title: "后勤服务",
        desc: "报修 · 校车 · 一卡通",
        url: "#",
        tag: "Campus",
      },
      {
        title: "外卖点位图",
        desc: "校园外卖集中取餐坐标",
        url: "#",
        tag: "Life",
      },
      {
        title: "就业信息网",
        desc: "招聘信息 · 就业指导",
        url: "#",
        tag: "Employment",
      },
      {
        title: "创新创业中心",
        desc: "创业指导 · 项目孵化",
        url: "#",
        tag: "Innovation",
      },
      {
        title: "学术讲座公告",
        desc: "学术活动 · 讲座信息",
        url: "#",
        tag: "Academic",
      },
      {
        title: "校园地图",
        desc: "校园导航 · 建筑分布",
        url: "#",
        tag: "Navigation",
      },
      {
        title: "校历查询",
        desc: "学期安排 · 假期时间",
        url: "#",
        tag: "Calendar",
      },
      {
        title: "实验室预约",
        desc: "实验室使用预约系统",
        url: "#",
        tag: "Lab",
      },
    ],
  },
  {
    id: "armory",
    label: "工具",
    sublabel: "Toolbox",
    icon: "Wrench",
    color: "#7C3AED",
    glow: "#A78BFA",
    links: [
      {
        title: "GitHub",
        desc: "代码托管 · 开源协作平台",
        url: "https://github.com",
        tag: "Dev",
      },
      {
        title: "清华开源镜像站",
        desc: "国内高速软件下载镜像",
        url: "https://mirrors.tuna.tsinghua.edu.cn",
        tag: "Mirror",
      },
      {
        title: "VS Code",
        desc: "微软开源代码编辑器",
        url: "https://code.visualstudio.com",
        tag: "IDE",
      },
      {
        title: "Docker Hub",
        desc: "容器镜像 · 一键部署",
        url: "https://hub.docker.com",
        tag: "DevOps",
      },
      {
        title: "MDN Web Docs",
        desc: "前端开发权威参考文档",
        url: "https://developer.mozilla.org",
        tag: "Docs",
      },
      {
        title: "DevDocs.io",
        desc: "多语言开发文档聚合",
        url: "https://devdocs.io",
        tag: "Docs",
      },
      {
        title: "Git",
        desc: "分布式版本控制系统",
        url: "https://git-scm.com",
        tag: "VCS",
      },
      {
        title: "Postman",
        desc: "API测试与协作平台",
        url: "https://www.postman.com",
        tag: "API",
      },
      {
        title: "Figma",
        desc: "UI/UX设计协作工具",
        url: "https://www.figma.com",
        tag: "Design",
      },
      {
        title: "Notion",
        desc: "知识管理与协作平台",
        url: "https://www.notion.so",
        tag: "Productivity",
      },
      {
        title: "Obsidian",
        desc: "本地知识管理工具",
        url: "https://obsidian.md",
        tag: "Notes",
      },
      {
        title: "Typora",
        desc: "极简Markdown编辑器",
        url: "https://typora.io",
        tag: "Editor",
      },
      {
        title: "Vercel",
        desc: "前端部署与托管平台",
        url: "https://vercel.com",
        tag: "Deploy",
      },
      {
        title: "Google Fonts",
        desc: "免费开源字体资源库",
        url: "https://fonts.google.com",
        tag: "Fonts",
      },
    ],
  },
];

const RESOURCE_SUBMODULES = [
  { subModule: "think_tank", categoryId: "intelligence", defaultTag: "Learning" },
  { subModule: "campus", categoryId: "surface", defaultTag: "Campus" },
  { subModule: "tools", categoryId: "armory", defaultTag: "Dev" },
] as const;

type PublicResourceLink = {
  title?: unknown;
  description?: unknown;
  desc?: unknown;
  url?: unknown;
  link_url?: unknown;
  active?: unknown;
};

const isActivePublicLink = (item: PublicResourceLink) =>
  item?.active === undefined || Number(item.active) === 1;

const normalizeResourceLinks = (
  items: PublicResourceLink[],
  defaultTag: string,
) =>
  (Array.isArray(items) ? items : [])
    .filter(isActivePublicLink)
    .map((item) => ({
      title: String(item?.title || "").trim(),
      desc: String(item?.description || item?.desc || "").trim() || "后台新增资源",
      url: String(item?.url || item?.link_url || "").trim(),
      tag: defaultTag,
    }))
    .filter((item) => item.title && item.url);

export function mergeResourceCategoriesFromPublicLinks(
  publicLinksBySubModule: Record<string, PublicResourceLink[]>,
) {
  return DEFAULT_RESOURCE_CATEGORIES.map((category) => {
    const meta = RESOURCE_SUBMODULES.find((item) => item.categoryId === category.id);
    if (!meta) return category;

    const links = normalizeResourceLinks(
      publicLinksBySubModule[meta.subModule] || [],
      meta.defaultTag,
    );

    return links.length > 0
      ? {
          ...category,
          links,
        }
      : category;
  });
}

// 从后端获取资源分类数据
export async function fetchResourceCategories() {
  try {
    const responses = await Promise.all(
      RESOURCE_SUBMODULES.map(async ({ subModule }) => {
        const params = new URLSearchParams({
          module: "resource_matrix",
          resource_sub_module: subModule,
        });
        const response = await fetch(`/api/links?${params.toString()}`, {
          cache: "no-store",
        });
        const payload = response.ok ? await response.json().catch(() => null) : null;
        return {
          subModule,
          links: Array.isArray(payload?.links) ? payload.links : [],
        };
      }),
    );

    return mergeResourceCategoriesFromPublicLinks(
      Object.fromEntries(responses.map((item) => [item.subModule, item.links])),
    );
  } catch (error) {
    console.error("Failed to fetch resource categories:", error);
    return DEFAULT_RESOURCE_CATEGORIES;
  }
}

// 导出默认分类数据（用于静态展示）
export const RESOURCE_CATEGORIES = DEFAULT_RESOURCE_CATEGORIES;
