/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowDown, ArrowUp } from "lucide-react";
import {
  CentralHub,
  HUDHeader,
  LeftPanel,
  MobileNavigationPanel,
  RightPanel,
  StartupSplash,
} from "@/components/home";
import { buildMobileNavSections } from "@/data/mobile-nav";
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
const resolveAutoDarkMode = () => {
  const hour = new Date().getHours();
  return hour >= 19 || hour < 7;
};

export default function HomePage() {
  // 页面主状态（启动动画、主题、关于弹层、响应式断点等）
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [booted, setBooted] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const [aboutOpen, setAboutOpen] = useState(false);
  const [activeAboutSection, setActiveAboutSection] = useState("mission");
  const [themeMode, setThemeMode] = useState("auto");
  const [clientPrefsReady, setClientPrefsReady] = useState(false);
  const [autoDarkMode, setAutoDarkMode] = useState(() => resolveAutoDarkMode());
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [isTabletViewport, setIsTabletViewport] = useState(false);
  const [isPhoneViewport, setIsPhoneViewport] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileMenuCloseSignal, setMobileMenuCloseSignal] = useState(0);
  const [mobileScrollHint, setMobileScrollHint] = useState(null);
  const [githubUserProfiles, setGithubUserProfiles] = useState({});
  const [adminTapCount, setAdminTapCount] = useState(0);
  const adminTapTimerRef = useRef(null);
  const lastMobileScrollTopRef = useRef(0);
  const mobileActivityRef = useRef(null);
  const aboutScrollRef = useRef(null);
  const aboutSectionRefs = useRef({});
  const activeCategoryParam = searchParams.get("section");
  const activeCategory = RESOURCE_CATEGORIES.some(
    (category) => category.id === activeCategoryParam,
  )
    ? activeCategoryParam
    : null;
  const aboutSectionLabels = Object.fromEntries(
    ABOUT_SECTION_NAV.map((item) => [item.id, item.label]),
  );
  const effectiveTheme = themeMode === "auto" ? (autoDarkMode ? "dark" : "light") : themeMode;
  const isDarkMode = effectiveTheme === "dark";
  const themeVars = isDarkMode
    ? {
        "--page-bg": "#0B1220",
        "--panel-bg": "rgba(15,23,42,0.92)",
        "--card-bg": "rgba(15,23,42,0.72)",
        "--card-bg-strong": "#0F172A",
        "--text-primary": "#F8FAFC",
        "--text-secondary": "#CBD5E1",
        "--text-muted": "#94A3B8",
        "--border-soft": "#334155",
        "--shadow-card": "0 12px 28px rgba(0,0,0,0.28)",
      }
    : {
        "--page-bg": "#F3F6FA",
        "--panel-bg": "rgba(255,255,255,0.92)",
        "--card-bg": "rgba(255,255,255,0.86)",
        "--card-bg-strong": "#FFFFFF",
        "--text-primary": "#0F172A",
        "--text-secondary": "#334155",
        "--text-muted": "#64748B",
        "--border-soft": "#E5E7EB",
        "--shadow-card": "0 8px 18px rgba(148,163,184,0.14)",
      };

  const handleBootComplete = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, "1");
    }
    setBooted(true);
    setTimeout(() => setFadeIn(true), 100);
  }, []);

  const handleMouseMove = useCallback((e) => {
    // 鼠标视差：根据光标位置微调背景位移
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

  const handleHiddenAdminEntry = useCallback((event) => {
    event.preventDefault();
    if (adminTapTimerRef.current) {
      window.clearTimeout(adminTapTimerRef.current);
    }
    setAdminTapCount((prev) => prev + 1);
    adminTapTimerRef.current = window.setTimeout(() => {
      setAdminTapCount(0);
      adminTapTimerRef.current = null;
    }, 1800);
  }, []);

  useEffect(() => {
    if (adminTapCount >= 3) {
      if (adminTapTimerRef.current) {
        window.clearTimeout(adminTapTimerRef.current);
        adminTapTimerRef.current = null;
      }
      setAdminTapCount(0);
      router.push("/admin/login");
    }
  }, [adminTapCount, router]);

  const scrollToAboutSection = useCallback((sectionId) => {
    // 点击侧栏目录后，平滑滚动到对应章节
    const root = aboutScrollRef.current;
    const target = aboutSectionRefs.current[sectionId];
    if (!root || !target) return;
    root.scrollTo({
      top: Math.max(0, target.offsetTop - 14),
      behavior: "smooth",
    });
    setActiveAboutSection(sectionId);
  }, []);
  const requestMobileMenuClose = useCallback(() => {
    setMobileMenuCloseSignal((signal) => signal + 1);
  }, []);

  const closeMobileLayers = useCallback(() => {
    requestMobileMenuClose();
  }, [requestMobileMenuClose]);

  const openAboutPanel = useCallback(() => {
    setAboutOpen(true);
    closeMobileLayers();
  }, [closeMobileLayers]);

  const openActivityPanel = useCallback(() => {
    closeMobileLayers();
    window.setTimeout(() => {
      mobileActivityRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 1050);
  }, [closeMobileLayers]);

  const mobileNavSections = buildMobileNavSections({
    activeCategory,
    onCategorySelect: (categoryId) => {
      handleCategorySelect(categoryId);
      closeMobileLayers();
    },
    onOpenAbout: openAboutPanel,
    onOpenActivity: openActivityPanel,
  });

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
          console.warn("[about] GitHub avatar fetch failed", error);
        }
      });

    return () => controller.abort();
  }, [aboutOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const hydrateId = window.setTimeout(() => {
      const hasBooted = Boolean(localStorage.getItem(STORAGE_KEY));
      if (hasBooted) {
        setBooted(true);
        setFadeIn(true);
      }

      const savedThemeMode = localStorage.getItem(THEME_MODE_STORAGE_KEY);
      if (savedThemeMode && VALID_THEME_MODES.has(savedThemeMode)) {
        setThemeMode(savedThemeMode);
      }

      setClientPrefsReady(true);
    }, 0);

    return () => window.clearTimeout(hydrateId);
  }, []);

  useEffect(() => {
    if (!clientPrefsReady || typeof window === "undefined") return;
    localStorage.setItem(THEME_MODE_STORAGE_KEY, themeMode);
  }, [clientPrefsReady, themeMode]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const syncThemeByTime = () => {
      setAutoDarkMode(resolveAutoDarkMode());
    };

    if (themeMode !== "auto") {
      return undefined;
    }

    syncThemeByTime();
    const id = window.setInterval(syncThemeByTime, 60 * 1000);
    return () => {
      window.clearInterval(id);
    };
  }, [themeMode]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    // 视口断点同步到 React state
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
    if (!aboutOpen || typeof window === "undefined") return undefined;
    const onKeyDown = (e) => {
      if (e.key === "Escape") setAboutOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [aboutOpen]);

  useEffect(() => {
    if (!isMobileViewport) {
      setMobileMenuOpen(false);
    }
  }, [isMobileViewport]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (isMobileViewport && mobileMenuOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }

    document.body.style.overflow = "";
    return undefined;
  }, [isMobileViewport, mobileMenuOpen]);

  useEffect(() => {
    if (typeof window === "undefined" || !isMobileViewport || mobileMenuOpen) {
      setMobileScrollHint(null);
      return undefined;
    }

    const edgeOffset = 24;
    const syncScrollHint = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;
      const maxScrollTop = Math.max(0, scrollHeight - clientHeight);
      const previousTop = lastMobileScrollTopRef.current;
      const delta = scrollTop - previousTop;
      lastMobileScrollTopRef.current = scrollTop;

      if (maxScrollTop <= edgeOffset) {
        setMobileScrollHint(null);
        return;
      }

      if (scrollTop <= edgeOffset) {
        setMobileScrollHint("down");
        return;
      }

      if (scrollTop >= maxScrollTop - edgeOffset) {
        setMobileScrollHint("up");
        return;
      }

      if (Math.abs(delta) > 2) {
        setMobileScrollHint(delta > 0 ? "down" : "up");
      }
    };

    lastMobileScrollTopRef.current = window.scrollY || document.documentElement.scrollTop || 0;
    syncScrollHint();
    window.addEventListener("scroll", syncScrollHint, { passive: true });
    window.addEventListener("resize", syncScrollHint);
    return () => {
      window.removeEventListener("scroll", syncScrollHint);
      window.removeEventListener("resize", syncScrollHint);
    };
  }, [isMobileViewport, mobileMenuOpen, activeCategory]);

  const handleMobileScrollJump = useCallback(() => {
    if (!mobileScrollHint) return;
    window.scrollTo({
      top: mobileScrollHint === "down" ? document.documentElement.scrollHeight : 0,
      behavior: "smooth",
    });
  }, [mobileScrollHint]);

  useEffect(() => {
    if (!aboutOpen) return undefined;

    // 打开关于弹层后，默认定位到 mission 并同步章节高亮
    const initId = setTimeout(() => setActiveAboutSection("mission"), 0);
    const root = aboutScrollRef.current;
    if (!root) return () => clearTimeout(initId);

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
    return () => {
      clearTimeout(initId);
      root.removeEventListener("scroll", syncActiveSection);
    };
  }, [aboutOpen]);

  if (!booted) {
    return <StartupSplash onComplete={handleBootComplete} />;
  }

  return (
    <div
      className={isDarkMode ? "home-theme-dark" : "home-theme-light"}
      data-kcos-theme-root="true"
      data-theme={effectiveTheme}
      data-theme-mode={themeMode}
      onMouseMove={isPhoneViewport ? undefined : handleMouseMove}
      style={{
        ...themeVars,
        colorScheme: effectiveTheme,
        minHeight: "100dvh",
        height: isMobileViewport ? "auto" : "100dvh",
        background: "var(--page-bg)",
        color: "var(--text-primary)",
        display: "flex",
        flexDirection: "column",
        opacity: fadeIn ? 1 : 0,
        transition: "opacity 0.5s ease, background-color 0.36s ease, color 0.36s ease",
        fontFamily: '"Inter", -apple-system, sans-serif',
        overflow: isMobileViewport ? "auto" : "hidden",
      }}
    >
      <HUDHeader
        compact={isMobileViewport}
        isDarkMode={isDarkMode}
        themeMode={themeMode}
        onThemeModeChange={setThemeMode}
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobileMenu={() => {
          if (mobileMenuOpen) {
            requestMobileMenuClose();
            return;
          }
          setMobileMenuOpen(true);
        }}
      />

      <div
        style={{
          flex: 1,
          display: "flex",
          overflow: isMobileViewport ? "auto" : "hidden",
          position: "relative",
          minHeight: 0,
        }}
      >
        <div
          className="hidden xl:flex"
          style={{ display: isMobileViewport ? "none" : "flex", flexShrink: 0 }}
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
            minHeight: 0,
            overflowX: "hidden",
            overflowY: isMobileViewport && !mobileMenuOpen ? "auto" : "hidden",
            display: "flex",
            flexDirection: "column",
            pointerEvents: "auto",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {isMobileViewport && mobileMenuOpen && (
            <MobileNavigationPanel
              isDarkMode={isDarkMode}
              sections={mobileNavSections}
              closeSignal={mobileMenuCloseSignal}
              onClose={() => setMobileMenuOpen(false)}
              onItemSelect={(item) => {
                item.action?.();
                if (item.href) {
                  window.open(item.href, item.external ? "_blank" : "_self", item.external ? "noopener,noreferrer" : undefined);
                  closeMobileLayers();
                }
              }}
            />
          )}
          <CentralHub
            activeCategory={activeCategory}
            parallax={parallax}
            onClosePanel={() => handleCategorySelect(null)}
            isDarkMode={isDarkMode}
          />
          {isMobileViewport && !mobileMenuOpen && (
            <div
              ref={mobileActivityRef}
              style={{
                padding: "0 12px 12px",
                flexShrink: 0,
              }}
            >
              <RightPanel isDarkMode={isDarkMode} embedded />
            </div>
          )}
        </div>

        {!isMobileViewport && (
          <div
            className="hidden xl:flex"
            style={{ display: "flex", flexShrink: 0 }}
          >
            <RightPanel isDarkMode={isDarkMode} />
          </div>
        )}
      </div>

      {isMobileViewport && !mobileMenuOpen && mobileScrollHint && (
        <button
          type="button"
          data-ui-touch="true"
          aria-label={mobileScrollHint === "down" ? "滑到底部" : "滑到顶部"}
          onClick={handleMobileScrollJump}
          style={{
            position: "fixed",
            right: 14,
            bottom: "calc(88px + env(safe-area-inset-bottom, 0px))",
            zIndex: 45,
            width: 44,
            height: 44,
            borderRadius: "50%",
            border: `1px solid ${isDarkMode ? "rgba(96,165,250,0.42)" : "rgba(10,132,255,0.28)"}`,
            background: isDarkMode ? "rgba(15,23,42,0.88)" : "rgba(255,255,255,0.9)",
            color: "#0A84FF",
            boxShadow: isDarkMode
              ? "0 14px 28px rgba(0,0,0,0.34)"
              : "0 12px 24px rgba(15,23,42,0.16)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition:
              "transform 220ms cubic-bezier(0.22, 1, 0.36, 1), opacity 180ms ease, background-color 0.24s ease, border-color 0.24s ease",
          }}
        >
          {mobileScrollHint === "down" ? (
            <ArrowDown size={18} strokeWidth={2.4} />
          ) : (
            <ArrowUp size={18} strokeWidth={2.4} />
          )}
        </button>
      )}

      <div
        style={{
          minHeight: isPhoneViewport ? 48 : "clamp(32px, 4vh, 38px)",
          background: isDarkMode
            ? "rgba(15,23,42,0.92)"
            : "rgba(255,255,255,0.9)",
          borderTop: `1px solid ${isDarkMode ? "#334155" : "#E5E7EB"}`,
          display: "flex",
          alignItems: isPhoneViewport ? "flex-start" : "center",
          justifyContent: "space-between",
          flexWrap: isPhoneViewport ? "wrap" : "nowrap",
          gap: isPhoneViewport ? 8 : 12,
          padding: isPhoneViewport
            ? "8px 12px calc(8px + env(safe-area-inset-bottom, 0px))"
            : "0 clamp(12px, 1.3vw, 20px)",
          backdropFilter: "blur(8px)",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: isPhoneViewport ? 9 : "clamp(9px, 0.65vw, 10px)",
            color: isDarkMode ? "#64748B" : "#CBD5E1",
            fontFamily: '"Courier New", monospace',
            letterSpacing: 1,
            whiteSpace: isPhoneViewport ? "normal" : "nowrap",
          }}
        >
          KCOS.CLUB /{" "}
          <a
            href="/admin/login"
            onClick={handleHiddenAdminEntry}
            style={{ color: "inherit", textDecoration: "none", cursor: "pointer", userSelect: "none" }}
            title={`连续点击 3 次可进入后台（当前 ${adminTapCount}/3）`}
          >
            开放原子开源社团
          </a>
        </span>
        <div
          style={{
            display: "flex",
            gap: isPhoneViewport ? 12 : 16,
            overflowX: isMobileViewport ? "auto" : "visible",
            whiteSpace: "nowrap",
            width: isPhoneViewport ? "100%" : "auto",
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
              border: `1px solid ${isDarkMode ? "rgba(51,65,85,0.95)" : "rgba(191,219,254,0.65)"}`,
              background: isDarkMode ? "rgba(15,23,42,0.98)" : "rgba(248,251,255,0.98)",
              boxShadow: isDarkMode
                ? "0 26px 64px rgba(0,0,0,0.44)"
                : "0 26px 64px rgba(15,23,42,0.28)",
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
                background: isDarkMode ? "rgba(10,132,255,0.16)" : "rgba(10,132,255,0.12)",
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
                background: isDarkMode ? "rgba(6,229,204,0.12)" : "rgba(6,229,204,0.1)",
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
                borderBottom: `1px solid ${isDarkMode ? "#334155" : "#E5E7EB"}`,
                background: isDarkMode ? "rgba(15,23,42,0.94)" : "rgba(255,255,255,0.92)",
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
                    color: isDarkMode ? "#F8FAFC" : "#0F172A",
                    lineHeight: 1.15,
                    marginTop: 4,
                  }}
                >
                  关于我们
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
                  border: `1px solid ${isDarkMode ? "#334155" : "#E5E7EB"}`,
                  background: isDarkMode ? "rgba(15,23,42,0.92)" : "rgba(255,255,255,0.92)",
                  cursor: "pointer",
                  color: isDarkMode ? "#CBD5E1" : "#94A3B8",
                  fontSize: 18,
                  lineHeight: 1,
                  transition: "all 0.2s ease",
                }}
                aria-label="关闭介绍弹层"
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
                          border: isActive
                            ? "1px solid #93C5FD"
                            : `1px solid ${isDarkMode ? "#334155" : "#E5E7EB"}`,
                          background: isActive
                            ? isDarkMode
                              ? "rgba(30,64,175,0.24)"
                              : "#EFF6FF"
                            : isDarkMode
                              ? "rgba(15,23,42,0.88)"
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
                            color: isActive
                              ? isDarkMode
                                ? "#F8FAFC"
                                : "#0F172A"
                              : isDarkMode
                                ? "#94A3B8"
                                : "#475569",
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
                    <span>{aboutSectionLabels.mission}</span>
                  </div>

                  <div className="about-section-text">
                    我们围绕开源协作、技术传播与社群共建，持续推进导航生态建设，
                    以开放共享与长期维护为核心，为开发者提供稳定、可信、可追踪的资源入口。
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
                    <span>{aboutSectionLabels.departments}</span>
                  </div>
                  <div className="about-section-sub">
                    项目 / 组织 / 宣策 / 外联 / 秘书处
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
                    <span>{aboutSectionLabels.collab}</span>
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
                    <span>{aboutSectionLabels.timeline}</span>
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
                    <span>{aboutSectionLabels.charter}</span>
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
                    <span>{aboutSectionLabels.points}</span>
                  </div>

                  <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
	                    <div
	                      className="about-card"
	                      style={{
	                        borderColor: isDarkMode ? "#334155" : "#BFDBFE",
	                        background: isDarkMode ? "rgba(15,23,42,0.92)" : "#EFF6FF",
	                      }}
	                    >
                      <div
                        className="about-card-title"
                        style={{ marginBottom: 4 }}
                      >
                        积分制度说明
                      </div>
                      <div className="about-card-text">
                        通过公开、透明、可追踪的积分体系，鼓励成员在内容建设、代码贡献与社群协作中持续投入。
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
	                                  border: `1px solid ${isDarkMode ? "#334155" : "#E2E8F0"}`,
	                                  borderRadius: 8,
	                                  background: isDarkMode ? "rgba(2,6,23,0.38)" : "#FFFFFF",
	                                  padding: "5px 7px",
	                                }}
	                              >
	                                <span
	                                  style={{
	                                    fontSize: 11,
	                                    color: isDarkMode ? "#CBD5E1" : "#334155",
	                                    lineHeight: 1.4,
	                                  }}
                                >
                                  {item.name}
                                  {item.note ? (
                                    <span
	                                      style={{
	                                        color: isDarkMode ? "#64748B" : "#94A3B8",
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
                        积分奖励说明
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
                    <span>{aboutSectionLabels.devteam}</span>
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
                    <span>{aboutSectionLabels.thanks}</span>
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
