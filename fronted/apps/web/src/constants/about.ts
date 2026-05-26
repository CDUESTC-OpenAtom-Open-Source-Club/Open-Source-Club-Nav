export const ORG_DEPARTMENTS = [
  {
    name: "项目部",
    duty: "负责社团核心项目的技术开发与维护，推进项目进度、解决技术问题，持续输出高质量开源成果。部门成员需保持稳定产出，并积极参与技术竞赛与实践。",
  },
  {
    name: "组织部",
    duty: "负责活动策划与执行，统筹活动流程与人员安排，协调各方资源，配合宣策部与外联部，保障社团活动高效落地并营造良好社团氛围。",
  },
  {
    name: "宣策部",
    duty: "负责社团宣传推广、品牌建设与文化建设。制作宣传内容，运营公众号、社媒与官网等平台，提升社团知名度，并通过数据分析反馈社团运营情况。",
  },
  {
    name: "外联部",
    duty: "负责对外联络与合作，拓展高校、企业与社区资源，对接合作方与活动机会，维护合作关系，为社团争取支持。同时承担招新工作的主要外联职责。",
  },
  {
    name: "秘书处",
    duty: "负责文件管理与信息记录，整理会议与活动资料，保障信息可追溯并及时同步各部门；同时负责财务记录与台账管理，确保账目公开透明。",
  },
];

export const MISSION_POINTS = [
  "以开源项目驱动技术成长，鼓励成员在真实协作中提升工程能力。",
  "构建校内外开放协作网络，让学生开发者持续连接社区与产业。",
  "沉淀可复用的知识文档与项目资产，形成长期可持续的社团生态。",
];

export const OPEN_SOURCE_COLLAB_RULES = [
  {
    title: "Issue 先行",
    detail:
      "功能开发或问题修复需先提交 Issue，明确背景、目标与验收标准后再进入实现阶段。",
  },
  {
    title: "分支规范",
    detail:
      "统一使用 feature/*、fix/*、docs/* 分支命名，禁止直接向主分支提交未评审代码。",
  },
  {
    title: "PR 审查",
    detail:
      "所有 PR 至少经过 1 名维护者 Review，需说明变更点、测试结果与潜在影响范围。",
  },
  {
    title: "文档同步",
    detail:
      "涉及架构、接口或流程变化的改动，必须同步更新 README/接口文档/变更记录。",
  },
  {
    title: "发布节奏",
    detail:
      "采用周迭代 + 月度里程碑机制，每周复盘进度、每月汇总成果并发布版本说明。",
  },
  {
    title: "社区礼仪",
    detail:
      "讨论聚焦问题本身，尊重贡献者差异，禁止人身攻击与无意义争执，保持专业沟通。",
  },
];

export const MILESTONES = [
  {
    phase: "启动期",
    time: "2024 Q4",
    detail: "完成社团组织搭建，建立项目管理流程与基础协作规范。",
  },
  {
    phase: "建设期",
    time: "2025 Q1-Q2",
    detail: "上线首批校园应用与工具项目，形成固定的周会与技术分享机制。",
  },
  {
    phase: "拓展期",
    time: "2025 Q3-Q4",
    detail: "推进校外合作与开源贡献，完善文档体系与成员培养路径。",
  },
  {
    phase: "深化期",
    time: "2026+",
    detail: "沉淀可持续开源项目矩阵，打造具有影响力的校园开源品牌。",
  },
];

export const CLUB_CHARTER = [
  "坚持开源精神：共享、共创、共建，不闭门造车。",
  "尊重每一位贡献者：认可不同背景与节奏，鼓励新人与资深成员协作。",
  "结果导向与过程并重：既追求产出，也重视可复用的工程方法沉淀。",
  "公开透明：重大决策、资金记录、项目进度保持可查询、可追踪。",
  "守时守约：按时参与会议与任务，不无故缺席，不拖延关键节点。",
  "持续学习：每位成员应保持技术学习与知识分享，推动团队共同进步。",
];

export const CLUB_POINTS_RULE_GROUPS = [
  {
    title: "参与与互动",
    items: [
      { name: "参与活动", points: "+1 分", note: "每次" },
      { name: "积极互动", points: "+1 分", note: "每次" },
      { name: "演讲或主持", points: "+3 分", note: "每次" },
      { name: "竞赛参与", points: "+2 分", note: "每次（无论是否获奖）" },
    ],
  },
  {
    title: "优秀笔记分享",
    items: [
      { name: "码字截图", points: "+1 分", note: "" },
      { name: "手写笔记", points: "+2 分", note: "" },
      { name: "视频讲解", points: "+3 分", note: "" },
      { name: "被社区收录为优秀文章", points: "+5 分", note: "" },
    ],
  },
  {
    title: "岗位与协作",
    items: [
      { name: "当选组长", points: "+2 分", note: "" },
      { name: "协助活动", points: "+2 分", note: "" },
    ],
  },
  {
    title: "获奖加分",
    items: [
      { name: "校级奖项", points: "+5 分", note: "" },
      { name: "市级奖项", points: "+10 分", note: "" },
      { name: "省级奖项", points: "+15 分", note: "" },
      { name: "国家级奖项", points: "+20 分", note: "" },
    ],
  },
  {
    title: "证书获得",
    items: [
      { name: "初级", points: "+10 分", note: "" },
      { name: "中级", points: "+15 分", note: "" },
      { name: "高级", points: "+20 分", note: "" },
    ],
  },
  {
    title: "开源学习",
    items: [
      { name: "按时完成课程", points: "+1 分", note: "" },
      { name: "社区文档有效贡献", points: "+5 分", note: "" },
      { name: "社区代码有效贡献", points: "+5 分", note: "" },
      { name: "创建/助力社团项目", points: "+15 分", note: "" },
    ],
  },
];

export const CLUB_POINTS_REWARD_NOTE =
  "积分可用于兑换奖品与优先权（企业实习内推、夏令营/冬令营、跨省校外讲座交流参与优先）。";

export const DEV_TEAM_MEMBERS = [
  {
    name: "V09201030",
    role: "项目经理",
    simpleIntro: "发起与统筹，负责项目推进和团队协同",
    githubLogin: "V09201030",
    responsibilities: [
      "整体项目进度管理与风险把控",
      "跨角色沟通协调（前后端/设计）",
      "向社团汇报项目进展",
    ],
    skills: "项目管理、文档协作",
    deliverables: "进度周报、会议纪要、项目里程碑文档",
    githubProfile: "https://github.com/V09201030",
  },
  {
    name: "LRXZH",
    role: "美术设计师",
    simpleIntro: "负责视觉风格、页面规范与设计资源产出",
    githubLogin: "LRXZH",
    responsibilities: [
      "网站整体视觉风格与 UI 设计",
      "页面布局、图标/Logo 设计",
      "前端页面设计稿交付",
    ],
    skills: "Figma、UI/UX 设计",
    deliverables: "完整设计稿、图标资源、视觉规范文档",
    githubProfile: "https://github.com/LRXZH",
  },
  {
    name: "Tippydes",
    role: "前端开发",
    simpleIntro: "实现页面与交互，完成双端适配与联调",
    githubLogin: "Tippydes",
    responsibilities: [
      "页面实现（HTML/CSS/JS）",
      "交互效果与响应式适配",
      "和后端对接 API 接口",
    ],
    skills: "原生 HTML/CSS/JS、浏览器调试",
    deliverables: "可运行的前端页面、交互效果实现",
    githubProfile: "https://github.com/Tippydes",
  },
  {
    name: "Nerdlet369",
    role: "后端开发",
    simpleIntro: "负责 API、服务逻辑与数据库设计维护",
    githubLogin: "Nerdlet369",
    responsibilities: [
      "API 接口设计与开发",
      "后台服务与业务逻辑实现",
      "MySQL 数据库设计与维护",
    ],
    skills: "Go 语言、MySQL、API 文档工具",
    deliverables: "可调用的后端接口、数据库设计文档",
    githubProfile: "https://github.com/Nerdlet369",
  },
  {
    name: "Dirinkbottle",
    role: "后端开发",
    simpleIntro: "负责 API、服务逻辑与数据库设计维护",
    githubLogin: "Dirinkbottle",
    responsibilities: [
      "API 接口设计与开发",
      "后台服务与业务逻辑实现",
      "MySQL 数据库设计与维护",
    ],
    skills: "Go 语言、MySQL、API 文档工具",
    deliverables: "可调用的后端接口、数据库设计文档",
    githubProfile: "https://github.com/Dirinkbottle",
  },
  {
    name: "muzimu217",
    role: "项目指导",
    simpleIntro: "负责仓库权限、协作规范与流程治理",
    githubLogin: "muzimu217",
    responsibilities: [
      "GitHub 仓库权限管理",
      "项目组织成员权限配置",
      "协作流程规范制定",
    ],
    skills: "GitHub、Git 版本控制",
    deliverables: "配置好的项目仓库、成员权限管理",
    githubProfile: "https://github.com/muzimu217",
  },
];

export const DEV_TEAM_GITHUB_LOGINS = DEV_TEAM_MEMBERS.map((member) => member.githubLogin);

export const ABOUT_ACKNOWLEDGEMENT_TEXT =
  "除了项目组成员之外，许多校友也为项目提供了诸多帮助，在此一并致谢。";

export const ABOUT_SECTION_NAV = [
  { id: "mission", label: "社团使命", index: "01" },
  { id: "departments", label: "社团部门", index: "02" },
  { id: "collab", label: "开源协作规范", index: "03" },
  { id: "timeline", label: "里程碑时间线", index: "04" },
  { id: "charter", label: "社团公约", index: "05" },
  { id: "points", label: "社团积分", index: "06" },
  { id: "devteam", label: "开发组人员", index: "07" },
  { id: "thanks", label: "致谢", index: "08" },
];

export const FOOTER_QUICK_LINKS = [
  { label: "社团官网", href: "https://opensouce-club.top/" },
  {
    label: "GitHub",
    href: "https://github.com/CDUESTC-OpenAtom-Open-Source-Club/Open-Source-Club-Nav",
  },
];
