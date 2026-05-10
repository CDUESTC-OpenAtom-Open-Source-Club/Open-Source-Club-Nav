export const ORG_DEPARTMENTS = [
  {
    name: "项目部",
    duty:
      "负责社团核心项目的技术开发与维护，推进项目进度、解决技术难题，持续输出高质量开源成果。部门成员需保持稳定产出，并积极参与技术竞赛与实践。",
  },
  {
    name: "组织部",
    duty:
      "负责活动策划与执行，统筹活动流程与人员安排，协调各方资源，配合宣策部与外联部，保障社团活动高效落地并营造良好社团氛围。",
  },
  {
    name: "宣策部",
    duty:
      "负责社团宣传推广、品牌建设与文化建设。制作宣传内容，运营公众号、社媒与官网等平台，提升社团知名度，并通过数据分析反馈社团运营情况。",
  },
  {
    name: "外联部",
    duty:
      "负责对外联络与合作，拓展高校、企业与社区资源，对接合作方与活动机会，维护合作关系，为社团争取支持。同时承担招新工作的主要外联职责。",
  },
  {
    name: "秘书处",
    duty:
      "负责文件管理与信息记录，整理会议与活动资料，保障信息可追溯并及时同步各部门；同时负责财务记录与台账管理，确保账目公开透明。",
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
  "坚持开源精神：共享、共创、共担，不闭门造车。",
  "尊重每一位贡献者：认可不同背景与节奏，鼓励新人与资深成员协作。",
  "结果导向与过程并重：既追求产出，也重视可复用的工程方法沉淀。",
  "公开透明：重大决策、资金记录、项目进度保持可查询、可追踪。",
  "守时守约：按时参与会议与任务，不无故缺席、不拖延关键节点。",
  "持续学习：每位成员应保持技术学习与知识分享，推动团队共同进步。",
];

export const CLUB_POINTS_INFO = {
  total: 2680,
  level: "A",
  nextLevel: "S",
  nextTarget: 3200,
  weeklyGain: 126,
  activeContributors: 29,
};

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

export const ABOUT_SECTION_NAV = [
  { id: "mission", label: "社团使命", index: "01" },
  { id: "departments", label: "社团部门", index: "02" },
  { id: "collab", label: "开源协作规范", index: "03" },
  { id: "timeline", label: "里程碑时间线", index: "04" },
  { id: "charter", label: "社团公约", index: "05" },
  { id: "points", label: "社团积分", index: "06" },
];
