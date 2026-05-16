/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  CentralHub,
  HUDHeader,
  LeftPanel,
  RightPanel,
  StartupSplash,
} from "@/components/home";
import { RESOURCE_CATEGORIES } from "@/data/resources";
import {
  ORG_DEPARTMENTS,
  MISSION_POINTS,
  OPEN_SOURCE_COLLAB_RULES,
  MILESTONES,
  CLUB_CHARTER,
  CLUB_POINTS_RULE_GROUPS,
  CLUB_POINTS_REWARD_NOTE,
  DEV_TEAM_MEMBERS,
  DEV_TEAM_GITHUB_LOGINS,
  ABOUT_ACKNOWLEDGEMENT_TEXT,
  ABOUT_SECTION_NAV,
  FOOTER_QUICK_LINKS,
} from "@/constants/about";

const STORAGE_KEY = "kcos_booted";
const THEME_MODE_STORAGE_KEY = "kcos_theme_mode";
const VALID_THEME_MODES = new Set(["light", "dark", "auto"]);
const GITHUB_USER_API = "/api/github-users";

export default function HomePage() {
  // 这里的状态分三类：启动流程、首页交互、关于弹层/主题/设备适配。
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [booted, setBooted] = useState(
    () =>
      typeof window !== "undefined" && Boolean(localStorage.getItem(STORAGE_KEY)),
  );
  const [fadeIn, setFadeIn] = useState(
    () =>
      typeof window !== "undefined" && Boolean(localStorage.getItem(STORAGE_KEY)),
  );
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const [aboutOpen, setAboutOpen] = useState(false);
  const [activeAboutSection, setActiveAboutSection] = useState("mission");
  const [themeMode, setThemeMode] = useState(() => {
    if (typeof window === "undefined") return "auto";
    const savedThemeMode = localStorage.getItem(THEME_MODE_STORAGE_KEY);
    return savedThemeMode && VALID_THEME_MODES.has(savedThemeMode)
      ? savedThemeMode
      : "auto";
  });
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [isTabletViewport, setIsTabletViewport] = useState(false);
  const [isPhoneViewport, setIsPhoneViewport] = useState(false);
  const [githubUserProfiles, setGithubUserProfiles] = useState({});
  const aboutScrollRef = useRef(null);
  const aboutSectionRefs = useRef({});
  const mobileTapGuardRef = useRef({ element: null, ts: 0, timer: null });
  const adminTapGuardRef = useRef({ count: 0, timer: null });
  const activeCategoryParam = searchParams.get("section");
  const activeCategory = RESOURCE_CATEGORIES.some(
    (category) => category.id === activeCategoryParam,
  )
    ? activeCategoryParam
    : null;

  useEffect(() => {
    // 启动页只在用户第一次进入时展示，之后直接进入首页。
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
    // 首页大背景和中心区域会读这个位移量做轻微视差。
    const x = (e.clientX / window.innerWidth - 0.5) * 20;
    const y = (e.clientY / window.innerHeight - 0.5) * 20;
    setParallax({ x, y });
  }, []);

  const handleCategorySelect = useCallback((catId) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    if (catId) {
      nextParams.set("section", catId);
    } else {
      nextParams.delete("section");
    }

    const nextQuery = nextParams.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
      scroll: false,
    });
  }, [pathname, router, searchParams]);

  const buildCategoryHref = useCallback((catId) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    if (catId) {
      nextParams.set("section", catId);
    } else {
      nextParams.delete("section");
    }
    const nextQuery = nextParams.toString();
    return nextQuery
      ? { pathname, query: Object.fromEntries(nextParams.entries()) }
      : pathname;
  }, [pathname, searchParams]);

  const scrollToAboutSection = useCallback((sectionId) => {
    // 关于弹层内部不是路由切换，而是滚动到对应 section。
    const root = aboutScrollRef.current;
    const target = aboutSectionRefs.current[sectionId];
    if (!root || !target) return;
    root.scrollTo({
      top: Math.max(0, target.offsetTop - 14),
      behavior: "smooth",
    });
    setActiveAboutSection(sectionId);
  }, []);

  const handleAdminEntryTap = useCallback(() => {
    // 移动端隐藏后台入口：连续点击指定次数后跳转登录页。
    const state = adminTapGuardRef.current;
    state.count += 1;
    if (state.timer) window.clearTimeout(state.timer);
    state.timer = window.setTimeout(() => {
      state.count = 0;
      state.timer = null;
    }, 5000);
    if (state.count >= 5) {
      state.count = 0;
      if (state.timer) {
        window.clearTimeout(state.timer);
        state.timer = null;
      }
      window.location.href = "/admin-gate";
    }
  }, []);

  useEffect(() => {
    if (!aboutOpen) return undefined;

    const controller = new AbortController();
    const params = new URLSearchParams({
      logins: DEV_TEAM_GITHUB_LOGINS.join(","),
    });

    fetch(`${GITHUB_USER_API}?${params.toString()}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => {
        if (!controller.signal.aborted && payload?.users) {
          setGithubUserProfiles(payload.users);
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          console.warn("[about] GitHub 用户头像拉取失败：", error);
        }
      });

    return () => controller.abort();
  }, [aboutOpen]);

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

    // auto 模式按本地时间切换明暗主题，避免强制跟随系统。
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
    // 首页大量布局依赖断点状态，这里统一同步到 React state。
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

    // 移动端用“双击确认”防误触，特别是资源卡片和可跳转区域。
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

      // 显式标记为 data-ui-touch 的控件按单击处理，双击确认只兜底未标记的原生可点击元素。
      if (event.target.closest('[data-ui-touch="true"]')) {
        resetArmedState();
        return;
      }

      const clickable = event.target.closest('button, a[href], [role="button"]');
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

    // 关于弹层通过监听滚动位置，高亮当前所在章节。
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
        className="xl:hidden"
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
          <Link
            key={item.id || "home"}
            href={buildCategoryHref(item.id)}
            replace
            scroll={false}
            data-ui-touch="true"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              padding: "5px 12px",
              borderRadius: 999,
              border: `1px solid ${activeCategory === item.id
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
              textDecoration: "none",
              touchAction: "manipulation",
            }}
          >
            {item.label}
          </Link>
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
          className="hidden xl:flex"
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
            onClosePanel={() => handleCategorySelect(null)}
            isDarkMode={isDarkMode}
          />
        </div>

        <div
          className="hidden xl:flex"
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
          KCOS.CLUB ·{" "}
          <span onClick={handleAdminEntryTap} style={{ cursor: "pointer", userSelect: "none" }}>
            科成开放原子开源社团
          </span>
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
                    {DEV_TEAM_MEMBERS.map((member) => {
                      const githubUser = githubUserProfiles[member.githubLogin];
                      const githubHref = githubUser?.htmlUrl || member.githubProfile;
                      const avatarUrl =
                        githubUser?.avatarUrl ||
                        `https://github.com/${member.githubLogin}.png?size=160`;

                      return (
                        <div key={member.name} className="about-member-card">
                          <img
                            className="about-member-avatar-img"
                            src={avatarUrl}
                            alt={`${member.name} GitHub 头像`}
                            loading="lazy"
                          />
                          <div className="about-member-name">{member.name}</div>
                          <div className="about-member-role">{member.role}</div>
                          <div className="about-member-simple">
                            {member.simpleIntro}
                          </div>

                          <div className="about-member-links">
                            <a
                              href={githubHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="about-member-link"
                            >
                              GitHub
                            </a>
                          </div>
                        </div>
                      );
                    })}
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
