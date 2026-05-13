import { useState, useEffect, useCallback, useRef } from "react";
import StartupSplash from "../components/StartupSplash";
import HUDHeader from "../components/HUDHeader";
import LeftPanel from "../components/LeftPanel";
import CentralHub from "../components/CentralHub";
import RightPanel from "../components/RightPanel";

const STORAGE_KEY = "kcos_booted";
const THEME_MODE_STORAGE_KEY = "kcos_theme_mode";
const VALID_THEME_MODES = new Set(["light", "dark", "auto"]);
const ORG_DEPARTMENTS = [
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
const MISSION_POINTS = [
  "以开源项目驱动技术成长，鼓励成员在真实协作中提升工程能力。",
  "构建校内外开放协作网络，让学生开发者持续连接社区与产业。",
  "沉淀可复用的知识文档与项目资产，形成长期可持续的社团生态。",
];
const OPEN_SOURCE_COLLAB_RULES = [
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
const MILESTONES = [
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
const CLUB_CHARTER = [
  "坚持开源精神：共享、共创、共建，不闭门造车。",
  "尊重每一位贡献者：认可不同背景与节奏，鼓励新人与资深成员协作。",
  "结果导向与过程并重：既追求产出，也重视可复用的工程方法沉淀。",
  "公开透明：重大决策、资金记录、项目进度保持可查询、可追踪。",
  "守时守约：按时参与会议与任务，不无故缺席，不拖延关键节点。",
  "持续学习：每位成员应保持技术学习与知识分享，推动团队共同进步。",
];
const CLUB_POINTS_RULE_GROUPS = [
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
const CLUB_POINTS_REWARD_NOTE =
  "积分可用于兑换奖品与优先权（企业实习内推、夏令营/冬令营、跨省校外讲座交流参与优先）。";
const DEV_TEAM_MEMBERS = [
  {
    name: "V09201030",
    role: "项目经理",
    simpleIntro: "发起与统筹，负责项目推进和团队协同",
    avatar: "/avatars/v09201030.svg",
    responsibilities: [
      "整体项目进度管理与风险把控",
      "跨角色沟通协调（前后端/设计）",
      "向社团汇报项目进展",
    ],
    skills: "项目管理、文档协作",
    deliverables: "进度周报、会议纪要、项目里程碑文档",
    github: "https://github.com/CDUESTC-OpenAtom-Club/OpenAtom-Club-Blog",
    githubProfile: "https://github.com/CDUESTC-OpenAtom-Club",
    blog: "https://opensouce-club.top/",
  },
  {
    name: "LRXZH",
    role: "美术设计师",
    simpleIntro: "负责视觉风格、页面规范与设计资源产出",
    avatar: "/avatars/lrxzh.jpg",
    responsibilities: [
      "网站整体视觉风格与 UI 设计",
      "页面布局、图标/Logo 设计",
      "前端页面设计稿交付",
    ],
    skills: "Figma、UI/UX 设计",
    deliverables: "完整设计稿、图标资源、视觉规范文档",
    github: "https://github.com/CDUESTC-OpenAtom-Club/OpenAtom-Club-Blog",
    githubProfile: "https://github.com/CDUESTC-OpenAtom-Club",
    blog: "https://opensouce-club.top/",
  },
  {
    name: "Tippydes",
    role: "前端开发",
    simpleIntro: "实现页面与交互，完成双端适配与联调",
    avatar: "/avatars/tippydes.png",
    responsibilities: [
      "页面实现（HTML/CSS/JS）",
      "交互效果与响应式适配",
      "和后端对接 API 接口",
    ],
    skills: "原生 HTML/CSS/JS、浏览器调试",
    deliverables: "可运行的前端页面、交互效果实现",
    github: "https://github.com/CDUESTC-OpenAtom-Club/OpenAtom-Club-Blog",
    githubProfile: "https://github.com/CDUESTC-OpenAtom-Club",
    blog: "https://opensouce-club.top/",
  },
  {
    name: "Nerdlet369",
    role: "后端开发",
    simpleIntro: "负责 API、服务逻辑与数据库设计维护",
    avatar: "/avatars/nerdlet369.jpg",
    responsibilities: [
      "API 接口设计与开发",
      "后台服务与业务逻辑实现",
      "MySQL 数据库设计与维护",
    ],
    skills: "Go 语言、MySQL、API 文档工具",
    deliverables: "可调用的后端接口、数据库设计文档",
    github: "https://github.com/CDUESTC-OpenAtom-Club/OpenAtom-Club-Blog",
    githubProfile: "https://github.com/CDUESTC-OpenAtom-Club",
    blog: "https://opensouce-club.top/",
  },
  {
    name: "Dirinkbottle",
    role: "后端开发",
    simpleIntro: "负责 API、服务逻辑与数据库设计维护",
    avatar: "/avatars/dirinkbottle.jpg",
    responsibilities: [
      "API 接口设计与开发",
      "后台服务与业务逻辑实现",
      "MySQL 数据库设计与维护",
    ],
    skills: "Go 语言、MySQL、API 文档工具",
    deliverables: "可调用的后端接口、数据库设计文档",
    github: "https://github.com/CDUESTC-OpenAtom-Club/OpenAtom-Club-Blog",
    githubProfile: "https://github.com/CDUESTC-OpenAtom-Club",
    blog: "https://opensouce-club.top/",
  },
  {
    name: "李枨",
    role: "团队管理员",
    simpleIntro: "负责仓库权限、协作规范与流程治理",
    avatar: "/avatars/lichang.jpg",
    responsibilities: [
      "GitHub 仓库权限管理",
      "项目组织成员权限配置",
      "协作流程规范制定",
    ],
    skills: "GitHub、Git 版本控制",
    deliverables: "配置好的项目仓库、成员权限管理",
    github: "https://github.com/CDUESTC-OpenAtom-Club/OpenAtom-Club-Blog",
    githubProfile: "https://github.com/CDUESTC-OpenAtom-Club",
    blog: "https://opensouce-club.top/",
  },
];
const ABOUT_PREFACE_TEXT =
  "科成星球项目组由浅巷墨黎、李头成立于 2025-03-10，目前正在撰写内容。";
const ABOUT_ACKNOWLEDGEMENT_TEXT =
  "除了项目组成员之外，许多校友也为项目提供了诸多帮助，在此一并致谢。";
const ABOUT_SECTION_NAV = [
  { id: "mission", label: "社团使命", index: "01" },
  { id: "departments", label: "社团部门", index: "02" },
  { id: "collab", label: "开源协作规范", index: "03" },
  { id: "timeline", label: "里程碑时间线", index: "04" },
  { id: "charter", label: "社团公约", index: "05" },
  { id: "points", label: "社团积分", index: "06" },
  { id: "devteam", label: "开发组人员", index: "07" },
  { id: "thanks", label: "致谢", index: "08" },
];
const FOOTER_QUICK_LINKS = [
  { label: "社团官网", href: "https://opensouce-club.top/" },
  {
    label: "GitHub项目仓库",
    href: "https://github.com/CDUESTC-OpenAtom-Club/OpenAtom-Club-Blog",
  },
];

export default function HomePage() {
  const [booted, setBooted] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const [aboutOpen, setAboutOpen] = useState(false);
  const [activeAboutSection, setActiveAboutSection] = useState("mission");
  const [themeMode, setThemeMode] = useState("auto");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [isTabletViewport, setIsTabletViewport] = useState(false);
  const [isPhoneViewport, setIsPhoneViewport] = useState(false);
  const aboutScrollRef = useRef(null);
  const aboutSectionRefs = useRef({});
  const mobileTapGuardRef = useRef({ element: null, ts: 0, timer: null });

  useEffect(() => {
    const hasBooted =
      typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY);
    if (hasBooted) {
      setBooted(true);
      setTimeout(() => setFadeIn(true), 50);
    }
  }, []);

  const handleBootComplete = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, "1");
    }
    setBooted(true);
    setTimeout(() => setFadeIn(true), 100);
  }, []);

  const handleMouseMove = useCallback((e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 20;
    const y = (e.clientY / window.innerHeight - 0.5) * 20;
    setParallax({ x, y });
  }, []);

  const handleCategorySelect = useCallback((catId) => {
    setActiveCategory(catId);
  }, []);

  const scrollToAboutSection = useCallback((sectionId) => {
    const root = aboutScrollRef.current;
    const target = aboutSectionRefs.current[sectionId];
    if (!root || !target) return;
    root.scrollTo({
      top: Math.max(0, target.offsetTop - 14),
      behavior: "smooth",
    });
    setActiveAboutSection(sectionId);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedThemeMode = localStorage.getItem(THEME_MODE_STORAGE_KEY);
    if (savedThemeMode && VALID_THEME_MODES.has(savedThemeMode)) {
      setThemeMode(savedThemeMode);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(THEME_MODE_STORAGE_KEY, themeMode);
  }, [themeMode]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    if (themeMode === "light") {
      setIsDarkMode(false);
      return undefined;
    }

    if (themeMode === "dark") {
      setIsDarkMode(true);
      return undefined;
    }

    const syncThemeByTime = () => {
      const hour = new Date().getHours();
      setIsDarkMode(hour >= 19 || hour < 7);
    };

    syncThemeByTime();
    const id = window.setInterval(syncThemeByTime, 60 * 1000);
    return () => window.clearInterval(id);
  }, [themeMode]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const syncViewport = () => {
      const width = window.innerWidth;
      setIsPhoneViewport(width <= 768);
      setIsTabletViewport(width > 768 && width <= 1200);
      setIsMobileViewport(width <= 1200);
    };
    syncViewport();

    window.addEventListener("resize", syncViewport);
    return () => {
      window.removeEventListener("resize", syncViewport);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !isMobileViewport) return undefined;

    const resetArmedState = () => {
      const current = mobileTapGuardRef.current;
      if (current.element instanceof HTMLElement) {
        delete current.element.dataset.doubletapArmed;
      }
      if (current.timer) {
        window.clearTimeout(current.timer);
      }
      mobileTapGuardRef.current = { element: null, ts: 0, timer: null };
    };

    const onClickCapture = (event) => {
      if (!(event.target instanceof Element)) return;

      const clickable = event.target.closest(
        '[data-ui-touch="true"], button, a[href], [role="button"]',
      );
      if (!clickable) return;

      if (
        clickable.matches("button:disabled, [aria-disabled='true']") ||
        clickable.getAttribute("disabled") !== null
      ) {
        return;
      }

      const now = Date.now();
      const { element, ts } = mobileTapGuardRef.current;
      const isSameElement = element === clickable;
      const withinConfirmWindow = now - ts <= 520;

      if (isSameElement && withinConfirmWindow) {
        resetArmedState();
        return;
      }

      resetArmedState();
      mobileTapGuardRef.current.element = clickable;
      mobileTapGuardRef.current.ts = now;
      if (clickable instanceof HTMLElement) {
        clickable.dataset.doubletapArmed = "true";
      }
      mobileTapGuardRef.current.timer = window.setTimeout(() => {
        resetArmedState();
      }, 520);

      event.preventDefault();
      event.stopPropagation();
    };

    window.addEventListener("click", onClickCapture, true);
    return () => {
      window.removeEventListener("click", onClickCapture, true);
      resetArmedState();
    };
  }, [isMobileViewport]);

  useEffect(() => {
    if (!aboutOpen || typeof window === "undefined") return undefined;
    const onKeyDown = (e) => {
      if (e.key === "Escape") setAboutOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [aboutOpen]);

  useEffect(() => {
    if (!aboutOpen) return undefined;

    setActiveAboutSection("mission");
    const root = aboutScrollRef.current;
    if (!root) return undefined;

    const syncActiveSection = () => {
      const rootTop = root.getBoundingClientRect().top + 72;
      let nearestId = "mission";
      let nearestDist = Number.POSITIVE_INFINITY;

      ABOUT_SECTION_NAV.forEach(({ id }) => {
        const sectionNode = aboutSectionRefs.current[id];
        if (!sectionNode) return;
        const dist = Math.abs(
          sectionNode.getBoundingClientRect().top - rootTop,
        );
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestId = id;
        }
      });

      setActiveAboutSection((prev) => (prev === nearestId ? prev : nearestId));
    };

    syncActiveSection();
    root.addEventListener("scroll", syncActiveSection, { passive: true });
    return () => root.removeEventListener("scroll", syncActiveSection);
  }, [aboutOpen]);

  if (!booted) {
    return <StartupSplash onComplete={handleBootComplete} />;
  }

  return (
    <div
      className={isDarkMode ? "home-theme-dark" : "home-theme-light"}
      onMouseMove={isPhoneViewport ? undefined : handleMouseMove}
      style={{
        height: "100dvh",
        background: isDarkMode ? "#0B1220" : "#F3F6FA",
        display: "flex",
        flexDirection: "column",
        opacity: fadeIn ? 1 : 0,
        transition: "opacity 0.5s ease",
        fontFamily: '"Inter", -apple-system, sans-serif',
        overflow: "hidden",
      }}
    >
      <HUDHeader
        compact={isMobileViewport}
        isDarkMode={isDarkMode}
        themeMode={themeMode}
        onThemeModeChange={setThemeMode}
      />

      <div
        className="lg:hidden"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 16px",
          borderBottom: "1px solid #E5E7EB",
          background: isDarkMode
            ? "rgba(15,23,42,0.95)"
            : "rgba(255,255,255,0.95)",
          overflowX: "auto",
          flexShrink: 0,
        }}
      >
        {[
          { id: null, label: "首页" },
          { id: "intelligence", label: "智库" },
          { id: "surface", label: "校园" },
          { id: "armory", label: "工具" },
        ].map((item) => (
          <button
            key={item.id || "home"}
            onClick={() => handleCategorySelect(item.id)}
            style={{
              flexShrink: 0,
              padding: "5px 12px",
              borderRadius: 999,
              border: `1px solid ${
                activeCategory === item.id
                  ? isDarkMode
                    ? "#38BDF840"
                    : "#0A84FF40"
                  : isDarkMode
                    ? "#334155"
                    : "#E5E7EB"
              }`,
              background:
                activeCategory === item.id
                  ? isDarkMode
                    ? "rgba(10,132,255,0.18)"
                    : "#EFF6FF"
                  : "transparent",
              fontSize: 12,
              fontWeight: activeCategory === item.id ? 600 : 400,
              color:
                activeCategory === item.id
                  ? "#0A84FF"
                  : isDarkMode
                    ? "#94A3B8"
                    : "#64748B",
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.15s",
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          overflow: "hidden",
          position: "relative",
          minHeight: 0,
        }}
      >
        <div
          className="hidden lg:flex"
          style={{ display: "flex", flexShrink: 0 }}
        >
          <LeftPanel
            activeCategory={activeCategory}
            onCategorySelect={handleCategorySelect}
            isDarkMode={isDarkMode}
          />
        </div>

        <div
          style={{
            flex: 1,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <CentralHub
            activeCategory={activeCategory}
            parallax={parallax}
            onClosePanel={() => setActiveCategory(null)}
            isDarkMode={isDarkMode}
          />
        </div>

        <div
          className="hidden lg:flex"
          style={{ display: "flex", flexShrink: 0 }}
        >
          <RightPanel isDarkMode={isDarkMode} />
        </div>
      </div>

      <div
        style={{
          height: "clamp(32px, 4vh, 38px)",
          background: isDarkMode
            ? "rgba(15,23,42,0.92)"
            : "rgba(255,255,255,0.9)",
          borderTop: `1px solid ${isDarkMode ? "#334155" : "#E5E7EB"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 clamp(12px, 1.3vw, 20px)",
          backdropFilter: "blur(8px)",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: "clamp(9px, 0.65vw, 10px)",
            color: isDarkMode ? "#64748B" : "#CBD5E1",
            fontFamily: '"Courier New", monospace',
            letterSpacing: 1,
          }}
        >
          KCOS.CLUB · 科成开放原子开源社团
        </span>
        <div
          style={{
            display: "flex",
            gap: 16,
            overflowX: isMobileViewport ? "auto" : "visible",
            whiteSpace: "nowrap",
          }}
        >
          <button
            type="button"
            onClick={() => setAboutOpen(true)}
            style={{
              fontSize: "clamp(9px, 0.65vw, 10px)",
              color: isDarkMode ? "#CBD5E1" : "#94A3B8",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 0,
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#0A84FF")}
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = isDarkMode ? "#CBD5E1" : "#94A3B8")
            }
          >
            关于我们
          </button>

          {FOOTER_QUICK_LINKS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              target={item.href.startsWith("http") ? "_blank" : undefined}
              rel={
                item.href.startsWith("http") ? "noopener noreferrer" : undefined
              }
              style={{
                fontSize: "clamp(9px, 0.65vw, 10px)",
                color: isDarkMode ? "#CBD5E1" : "#94A3B8",
                textDecoration: "none",
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#0A84FF")}
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = isDarkMode
                  ? "#CBD5E1"
                  : "#94A3B8")
              }
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>

      {aboutOpen && (
        <div
          onClick={() => setAboutOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.55)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            zIndex: 120,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: isPhoneViewport
              ? "10px 8px"
              : isTabletViewport
                ? "16px 12px"
                : "22px 14px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: isPhoneViewport ? "100%" : "min(1180px, 100%)",
              height: isPhoneViewport ? "min(94dvh, 860px)" : "min(88dvh, 860px)",
              borderRadius: isPhoneViewport ? 14 : 20,
              border: "1px solid rgba(191,219,254,0.65)",
              background: "rgba(248,251,255,0.98)",
              boxShadow: "0 26px 64px rgba(15,23,42,0.28)",
              display: "flex",
              flexDirection: "column",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                width: isPhoneViewport ? 200 : 360,
                height: isPhoneViewport ? 200 : 360,
                borderRadius: "50%",
                right: -120,
                top: -170,
                background: "rgba(10,132,255,0.12)",
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                position: "absolute",
                width: isPhoneViewport ? 170 : 260,
                height: isPhoneViewport ? 170 : 260,
                borderRadius: "50%",
                left: -90,
                bottom: -130,
                background: "rgba(6,229,204,0.1)",
                pointerEvents: "none",
              }}
            />

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 20,
                padding: isPhoneViewport ? "12px 14px" : "18px 20px",
                borderBottom: "1px solid #E5E7EB",
                background: "rgba(255,255,255,0.92)",
                position: "relative",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 10,
                    color: "#0A84FF",
                    letterSpacing: 2,
                    textTransform: "uppercase",
                    fontFamily: '"Courier New", monospace',
                  }}
                >
                  KCOS ABOUT
                </div>
                <div
                  style={{
                    fontSize: isPhoneViewport ? 20 : 24,
                    fontWeight: 700,
                    color: "#0F172A",
                    lineHeight: 1.15,
                    marginTop: 4,
                  }}
                >
                  关于我们
                </div>
                <div
                  style={{
                    marginTop: 4,
                    fontSize: 12,
                    color: "#64748B",
                    letterSpacing: 0.15,
                  }}
                >
                  社团使命 · 社团部门 · 开源协作规范 · 里程碑时间线 · 社团公约 ·
                  社团积分 · 开发组人员 · 致谢
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAboutOpen(false)}
                data-ui-touch="true"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  border: "1px solid #E5E7EB",
                  background: "rgba(255,255,255,0.92)",
                  cursor: "pointer",
                  color: "#94A3B8",
                  fontSize: 18,
                  lineHeight: 1,
                  transition: "all 0.2s ease",
                }}
                aria-label="关闭"
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow =
                    "0 8px 18px rgba(15,23,42,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                ×
              </button>
            </div>

            <div className="about-layout">
              <aside className="about-sidebar">
                <div
                  style={{
                    border: "1px solid #DBEAFE",
                    borderRadius: 14,
                    background: "#FFFFFF",
                    padding: "12px 12px 10px",
                    marginBottom: 10,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: "#0A84FF",
                      fontWeight: 700,
                      letterSpacing: 1.2,
                    }}
                  >
                    CONTENT NAVIGATION
                  </div>
                  <div
                    style={{
                      marginTop: 5,
                      fontSize: 12,
                      color: "#475569",
                      lineHeight: 1.55,
                    }}
                  >
                    企业化章节导览，点击可平滑跳转，滚动时自动高亮当前版块。{" "}
                  </div>
                </div>

                <div className="about-nav">
                  {ABOUT_SECTION_NAV.map((item) => {
                    const isActive = activeAboutSection === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        data-ui-touch="true"
                        onClick={() => scrollToAboutSection(item.id)}
                        style={{
                          width: "100%",
                          border: `1px solid ${isActive ? "#93C5FD" : "#E5E7EB"}`,
                          background: isActive
                            ? "#EFF6FF"
                            : "rgba(255,255,255,0.92)",
                          borderRadius: 10,
                          padding: "8px 10px",
                          textAlign: "left",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          boxShadow: isActive
                            ? "0 10px 20px rgba(10,132,255,0.1)"
                            : "none",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: isActive ? "#0A84FF" : "#94A3B8",
                            fontFamily: '"Courier New", monospace',
                          }}
                        >
                          {item.index}
                        </span>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: isActive ? "#0F172A" : "#475569",
                          }}
                        >
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </aside>

              <div ref={aboutScrollRef} className="about-scroll">
                <section
                  ref={(node) => {
                    aboutSectionRefs.current.mission = node;
                  }}
                  className="about-section about-section-emphasis"
                >
                  <div className="about-section-head">
                    <span>01</span>
                    <span>社团使命</span>
                  </div>
                  <div className="about-card" style={{ marginTop: 8 }}>
                    <div
                      className="about-card-title"
                      style={{ marginBottom: 3 }}
                    >
                      写在开头
                    </div>
                    <div className="about-card-text">{ABOUT_PREFACE_TEXT}</div>
                  </div>
                  <div className="about-section-text">
                    科成开放原子开源社团以“真实项目 + 开源协作 +
                    长期成长”为核心路径，致力于打造开放、专业、可持续的校园技术社区。{" "}
                  </div>
                  <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                    {MISSION_POINTS.map((point) => (
                      <div key={point} className="about-card">
                        <div className="about-card-text">{point}</div>
                      </div>
                    ))}
                  </div>
                </section>

                <section
                  ref={(node) => {
                    aboutSectionRefs.current.departments = node;
                  }}
                  className="about-section"
                >
                  <div className="about-section-head">
                    <span>02</span>
                    <span>社团部门（组织架构）</span>
                  </div>
                  <div className="about-section-sub">
                    会长 → 副会长 → 项目部 / 组织部 / 宣策部 / 外联部 /
                    秘书处{" "}
                  </div>
                  <div className="about-grid-cards">
                    {ORG_DEPARTMENTS.map((dept) => (
                      <div key={dept.name} className="about-card">
                        <div className="about-card-title">{dept.name}</div>
                        <div className="about-card-text">{dept.duty}</div>
                      </div>
                    ))}
                  </div>
                </section>

                <section
                  ref={(node) => {
                    aboutSectionRefs.current.collab = node;
                  }}
                  className="about-section"
                >
                  <div className="about-section-head">
                    <span>03</span>
                    <span>开源协作规范</span>
                  </div>
                  <div className="about-grid-cards">
                    {OPEN_SOURCE_COLLAB_RULES.map((rule) => (
                      <div key={rule.title} className="about-card">
                        <div className="about-card-title">{rule.title}</div>
                        <div className="about-card-text">{rule.detail}</div>
                      </div>
                    ))}
                  </div>
                </section>

                <section
                  ref={(node) => {
                    aboutSectionRefs.current.timeline = node;
                  }}
                  className="about-section"
                >
                  <div className="about-section-head">
                    <span>04</span>
                    <span>里程碑时间线</span>
                  </div>
                  <div style={{ marginTop: 8, display: "grid", gap: 10 }}>
                    {MILESTONES.map((item) => (
                      <div key={item.phase} className="about-timeline-card">
                        <div className="about-timeline-accent" />
                        <div className="about-timeline-head">
                          <span>{item.phase}</span>
                          <span>{item.time}</span>
                        </div>
                        <div className="about-card-text">{item.detail}</div>
                      </div>
                    ))}
                  </div>
                </section>

                <section
                  ref={(node) => {
                    aboutSectionRefs.current.charter = node;
                  }}
                  className="about-section"
                >
                  <div className="about-section-head">
                    <span>05</span>
                    <span>社团公约</span>
                  </div>
                  <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
                    {CLUB_CHARTER.map((rule, index) => (
                      <div
                        key={rule}
                        className="about-card"
                        style={{ display: "flex", gap: 8 }}
                      >
                        <span className="about-rule-num">{index + 1}</span>
                        <span className="about-card-text">{rule}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section
                  ref={(node) => {
                    aboutSectionRefs.current.points = node;
                  }}
                  className="about-section"
                >
                  <div className="about-section-head">
                    <span>06</span>
                    <span>社团积分</span>
                  </div>

                  <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
                    <div
                      className="about-card"
                      style={{
                        borderColor: "#BFDBFE",
                        background: "#EFF6FF",
                      }}
                    >
                      <div
                        className="about-card-title"
                        style={{ marginBottom: 4 }}
                      >
                        社团积分获取方式一览卡
                      </div>
                      <div className="about-card-text">
                        用努力赚积分，用行动争荣誉。{" "}
                      </div>
                    </div>

                    <div className="about-grid-cards" style={{ marginTop: 0 }}>
                      {CLUB_POINTS_RULE_GROUPS.map((group) => (
                        <div key={group.title} className="about-card">
                          <div className="about-card-title">{group.title}</div>
                          <div style={{ display: "grid", gap: 4 }}>
                            {group.items.map((item) => (
                              <div
                                key={`${group.title}-${item.name}`}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  gap: 8,
                                  border: "1px solid #E2E8F0",
                                  borderRadius: 8,
                                  background: "#FFFFFF",
                                  padding: "5px 7px",
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: 11,
                                    color: "#334155",
                                    lineHeight: 1.4,
                                  }}
                                >
                                  {item.name}
                                  {item.note ? (
                                    <span
                                      style={{
                                        color: "#94A3B8",
                                        marginLeft: 3,
                                      }}
                                    >
                                      {item.note}
                                    </span>
                                  ) : null}
                                </span>
                                <span
                                  style={{
                                    fontSize: 11,
                                    color: "#0A84FF",
                                    fontWeight: 700,
                                    fontFamily: '"Courier New", monospace',
                                    flexShrink: 0,
                                  }}
                                >
                                  {item.points}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="about-card">
                      <div
                        className="about-card-title"
                        style={{ marginBottom: 3 }}
                      >
                        积分权益说明
                      </div>
                      <div className="about-card-text">
                        {CLUB_POINTS_REWARD_NOTE}
                      </div>
                    </div>
                  </div>
                </section>

                <section
                  ref={(node) => {
                    aboutSectionRefs.current.devteam = node;
                  }}
                  className="about-section about-section-devteam"
                >
                  <div className="about-section-head">
                    <span>07</span>
                    <span>开发组人员</span>
                  </div>
                  <div className="about-member-grid">
                    {DEV_TEAM_MEMBERS.map((member) => (
                      <div key={member.name} className="about-member-card">
                        <img
                          className="about-member-avatar-img"
                          src={
                            member.avatar ||
                            `${member.githubProfile.replace(/\/$/, "")}.png?size=96`
                          }
                          alt={`${member.name} 头像`}
                          loading="lazy"
                        />
                        <div className="about-member-name">{member.name}</div>
                        <div className="about-member-role">{member.role}</div>
                        <div className="about-member-simple">
                          {member.simpleIntro}
                        </div>

                        <div className="about-member-links">
                          <a
                            href={member.githubProfile}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="about-member-link"
                          >
                            GitHub
                          </a>
                          <a
                            href={member.blog}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="about-member-link"
                          >
                            主页
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section
                  ref={(node) => {
                    aboutSectionRefs.current.thanks = node;
                  }}
                  className="about-section"
                >
                  <div className="about-section-head">
                    <span>08</span>
                    <span>致谢</span>
                  </div>
                  <div className="about-card-text" style={{ marginTop: 8 }}>
                    {ABOUT_ACKNOWLEDGEMENT_TEXT}
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+SC:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          overflow-x: hidden;
          font-family: "Noto Sans SC", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei",
            "Inter", "Segoe UI", "Helvetica Neue", Arial, sans-serif;
        }
        button, input, textarea, select { font: inherit; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: #F1F5F9; }
        ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #94A3B8; }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .about-layout {
          display: flex;
          gap: 14px;
          padding: 14px;
          min-height: 0;
          flex: 1;
          position: relative;
          z-index: 1;
        }
        .about-sidebar {
          width: 236px;
          min-width: 236px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .about-nav {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .about-scroll {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          padding-right: 4px;
          display: grid;
          gap: 10px;
          scroll-behavior: smooth;
        }
        .about-section {
          border: 1px solid #E2E8F0;
          border-radius: 14px;
          background: #FFFFFF;
          padding: 14px;
        }
        .about-section-emphasis {
          border-color: #DBEAFE;
          background: #FFFFFF;
        }
        .about-section-devteam {
          border-color: #DCE6F2;
          background: #FFFFFF;
        }
        .about-section-head {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }
        .about-section-head span:first-child {
          font-family: "Courier New", monospace;
          font-size: 11px;
          font-weight: 700;
          color: #0A84FF;
        }
        .about-section-head span:last-child {
          font-size: 15px;
          font-weight: 700;
          color: #0F172A;
          letter-spacing: 0.2px;
        }
        .about-section-sub {
          margin-top: 4px;
          font-size: 12px;
          color: #64748B;
        }
        .about-section-text {
          margin-top: 6px;
          font-size: 13px;
          color: #334155;
          line-height: 1.72;
        }
        .about-grid-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 8px;
          margin-top: 8px;
        }
        .about-card {
          border: 1px solid #E2E8F0;
          border-radius: 10px;
          background: #FCFDFF;
          padding: 9px 10px;
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .about-card:hover {
          transform: translateY(-1px);
          border-color: #BFDBFE;
          box-shadow: 0 10px 20px rgba(15,23,42,0.08);
        }
        .about-card-title {
          font-size: 13px;
          font-weight: 700;
          color: #1E293B;
          margin-bottom: 4px;
        }
        .about-card-text {
          font-size: 12px;
          color: #475569;
          line-height: 1.65;
        }
        .about-member-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 10px;
          margin-top: 8px;
        }
        .about-member-card {
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          background: #FCFCFD;
          padding: 12px 10px 10px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          text-align: center;
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .about-member-card:hover {
          transform: translateY(-1px);
          border-color: #BFDBFE;
          box-shadow: 0 10px 20px rgba(15,23,42,0.08);
        }
        .about-member-avatar-img {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          border: 1px solid #BFDBFE;
          object-fit: cover;
          flex-shrink: 0;
          box-shadow: 0 6px 14px rgba(15, 23, 42, 0.08);
        }
        .about-member-name {
          font-size: 14px;
          color: #1E293B;
          font-weight: 700;
          line-height: 1.25;
          max-width: 100%;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .about-member-role {
          font-size: 11px;
          color: #64748B;
        }
        .about-member-simple {
          margin-top: 2px;
          font-size: 12px;
          color: #475569;
          line-height: 1.45;
          min-height: 34px;
        }
        .about-member-link {
          font-size: 11px;
          color: #0A84FF;
          text-decoration: none;
          border: 1px solid #BFDBFE;
          background: #EFF6FF;
          border-radius: 999px;
          padding: 4px 10px;
          width: fit-content;
          transition: all 0.18s ease;
        }
        .about-member-link:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 14px rgba(15,23,42,0.08);
        }
        .about-member-links {
          margin-top: auto;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          flex-wrap: wrap;
        }
        .about-timeline-card {
          position: relative;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          background: #FFFFFF;
          padding: 10px 12px 10px 18px;
          overflow: hidden;
        }
        .about-timeline-accent {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 4px;
          background: #0A84FF;
        }
        .about-timeline-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 4px;
        }
        .about-timeline-head span:first-child {
          font-size: 13px;
          font-weight: 700;
          color: #1E293B;
        }
        .about-timeline-head span:last-child {
          font-size: 10px;
          font-family: "Courier New", monospace;
          color: #0A84FF;
          font-weight: 700;
        }
        .about-rule-num {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 1px solid #BFDBFE;
          background: #EFF6FF;
          color: #2563EB;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 700;
          flex-shrink: 0;
          margin-top: 1px;
        }
        .home-theme-dark .about-section,
        .home-theme-dark .about-card,
        .home-theme-dark .about-member-card,
        .home-theme-dark .about-timeline-card {
          background: #0F172A !important;
          border-color: #334155 !important;
        }
        .home-theme-dark .about-card-title,
        .home-theme-dark .about-member-name,
        .home-theme-dark .about-section-head span:last-child,
        .home-theme-dark .about-timeline-head span:first-child {
          color: #E2E8F0 !important;
        }
        .home-theme-dark .about-card-text,
        .home-theme-dark .about-section-sub,
        .home-theme-dark .about-section-text,
        .home-theme-dark .about-member-role,
        .home-theme-dark .about-member-simple {
          color: #94A3B8 !important;
        }
        .home-theme-dark .about-nav button {
          background: #0F172A !important;
          border-color: #334155 !important;
        }
        [data-doubletap-armed="true"] {
          outline: 2px solid #38BDF8 !important;
          outline-offset: 2px !important;
          filter: brightness(1.03);
        }
        @media (max-width: 1200px) {
          .hidden.lg\\:flex { display: none !important; }
        }
        @media (max-width: 980px) {
          .about-layout {
            flex-direction: column;
            gap: 10px;
            padding: 10px;
          }
          .about-sidebar {
            width: 100%;
            min-width: 100%;
          }
          .about-nav {
            flex-direction: row;
            overflow-x: auto;
            padding-bottom: 2px;
          }
          .about-nav button {
            min-width: 160px;
          }
        }
        @media (min-width: 1201px) {
          .lg\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}
