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
const THEME_SWITCH_SYNC_MS = 1200;
const THEME_SWITCH_COMMIT_MS = 480;
const THEME_COLOR_TRANSITION_MS = 1000;
const VALID_THEME_MODES = new Set(["light", "dark", "auto"]);
const GITHUB_USER_API = "/api/github-users";
const PUBLIC_LINKS_API = "/api/links";
const PUBLIC_LINK_REFRESH_INTERVAL_MS = 5 * 60 * 1000;
const DEFAULT_THEME_MODE = "auto";
const DEFAULT_AUTO_DARK_MODE = false;
const getInitialThemeMode = () => {
  if (typeof window === "undefined") return "auto";

  try {
    const savedThemeMode = window.localStorage.getItem(THEME_MODE_STORAGE_KEY);
    return savedThemeMode && VALID_THEME_MODES.has(savedThemeMode) ? savedThemeMode : "auto";
  } catch {
    return "auto";
  }
};
const resolveAutoDarkMode = () => {
  const hour = new Date().getHours();
  return hour >= 19 || hour < 7;
};
const getAvatarFallbackText = (login = "") => {
  const normalized = String(login || "").trim();
  return (normalized.slice(0, 2) || "?").toUpperCase();
};
const normalizePublicLinks = (list = []) =>
  (Array.isArray(list) ? list : [])
    .map((item) => ({
      title: String(item?.title || "").trim(),
      url: String(item?.url || "").trim(),
      description: String(item?.description || "").trim(),
    }))
    .filter((item) => item.title && item.url);

function AboutMemberAvatar({ avatarUrl, name, login }) {
  const [loadFailed, setLoadFailed] = useState(!avatarUrl);

  if (!avatarUrl || loadFailed) {
    return (
      <div className="about-member-avatar-fallback" aria-label={`${name} GitHub 头像兜底`}>
        {getAvatarFallbackText(login || name)}
      </div>
    );
  }

  return (
    <img
      className="about-member-avatar-img"
      src={avatarUrl}
      alt={`${name} GitHub 头像`}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setLoadFailed(true)}
    />
  );
}

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
  const [themeMode, setThemeMode] = useState(DEFAULT_THEME_MODE);
  const [isThemeSwitching, setIsThemeSwitching] = useState(false);
  const [themeTransitionTarget, setThemeTransitionTarget] = useState<string | null>(null);
  const [clientPrefsReady, setClientPrefsReady] = useState(false);
  const [autoDarkMode, setAutoDarkMode] = useState(DEFAULT_AUTO_DARK_MODE);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [isTabletViewport, setIsTabletViewport] = useState(false);
  const [isPhoneViewport, setIsPhoneViewport] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileActivityOpen, setMobileActivityOpen] = useState(false);
  const [mobileMenuCloseSignal, setMobileMenuCloseSignal] = useState(0);
  const [mobileScrollHint, setMobileScrollHint] = useState(null);
  const [githubUserProfiles, setGithubUserProfiles] = useState({});
  const [mobileFriendLinks, setMobileFriendLinks] = useState([]);
  const [mobileMiniGameLinks, setMobileMiniGameLinks] = useState([]);
  const [adminTapCount, setAdminTapCount] = useState(0);
  const adminTapTimerRef = useRef(null);
  const themeSwitchTimerRef = useRef(null);
  const themeSwitchCommitTimerRef = useRef(null);
  const lastMobileScrollTopRef = useRef(0);
  const mobileActivityRef = useRef(null);
  const mobileActivityScrollTimerRef = useRef(null);
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
        /* ── Page & Layout ── */
        "--page-bg": "#0B1220",
        "--panel-bg": "rgba(15,23,42,0.92)",
        "--panel-bg-95": "rgba(15,23,42,0.95)",
        "--panel-bg-98": "rgba(15,23,42,0.98)",
        "--card-bg": "rgba(15,23,42,0.72)",
        "--card-bg-strong": "#0F172A",
        "--card-bg-86": "rgba(15,23,42,0.86)",
        "--card-bg-88": "rgba(15,23,42,0.88)",
        "--card-bg-82": "rgba(15,23,42,0.82)",
        "--card-bg-75": "rgba(15,23,42,0.75)",
        "--card-bg-68": "rgba(15,23,42,0.68)",
        "--card-bg-62": "rgba(15,23,42,0.62)",
        "--card-bg-42": "rgba(15,23,42,0.42)",
        "--card-bg-24": "rgba(15,23,42,0.24)",
        "--card-bg-deep": "#111827",
        "--card-bg-semi": "rgba(30,41,59,0.5)",
        "--card-bg-semi-78": "rgba(30,41,59,0.78)",
        "--card-bg-semi-9": "rgba(15,23,42,0.9)",
        "--card-bg-semi-active": "rgba(30,64,175,0.18)",
        "--card-bg-semi-active-24": "rgba(30,64,175,0.24)",
        "--card-bg-frost": "rgba(15,23,42,0.97)",
        "--card-bg-frost-2": "rgba(15,23,42,0.94)",
        "--card-bg-frost-3": "rgba(15,23,42,0.96)",
        "--card-bg-overlay": "rgba(15,23,42,0.35)",
        "--card-bg-blur": "rgba(15, 23, 42, 0.38)",
        "--card-bg-work": "rgba(15,23,42,0.24)",
        "--card-bg-work-m": "rgba(15,23,42,0.82)",
        /* ── Text Colors ── */
        "--text-primary": "#F8FAFC",
        "--text-secondary": "#CBD5E1",
        "--text-muted": "#94A3B8",
        "--text-dim": "#64748B",
        "--text-bright": "#E2E8F0",
        "--text-bright-2": "#E5EEF9",
        "--text-link": "#93C5FD",
        "--text-link-2": "#60A5FA",
        "--text-desc": "#8EA3BE",
        "--text-tag": "#9DB0C8",
        "--text-nav-active": "#F8FAFC",
        "--text-chip": "#CBD5E1",
        "--text-control": "#CBD5E1",
        "--text-control-active": "#93C5FD",
        "--text-subtle": "#7A8EA5",
        "--text-status": "#93C5FD",
        "--text-status-bg": "rgba(30,41,59,0.4)",
        "--text-footer": "#CBD5E1",
        "--text-footer-sub": "#64748B",
        /* ── Borders ── */
        "--border-soft": "#334155",
        "--border-mid": "#475569",
        "--border-light": "#E5E7EB",
        "--border-chip": "#334155",
        "--border-control": "#334155",
        "--border-control-active": "rgba(59,130,246,0.22)",
        "--border-control-active-solid": "#3B9CD744",
        "--border-divider": "#334155",
        "--border-tag": "#334155",
        "--border-tag-2": "rgba(148,163,184,0.22)",
        "--border-tag-3": "#334155",
        "--border-avatar": "rgba(255,255,255,0.15)",
        "--border-avatar-2": "#1E293B",
        "--border-card-tag": "#334155",
        "--border-card-tag-2": "rgba(148,163,184,0.18)",
        "--border-status": "#334155",
        "--border-section": "#334155",
        "--border-soft-rgba": "rgba(148,163,184,0.22)",
        "--border-soft-rgba-2": "rgba(255,255,255,0.06)",
        "--border-soft-rgba-3": "rgba(255,255,255,0.12)",
        "--border-soft-rgba-4": "rgba(96,165,250,0.42)",
        "--border-active-soft": "rgba(51,65,85,0.95)",
        /* ── Backgrounds ── */
        "--bg-icon": "#1E293B",
        "--bg-icon-2": "#0F172A",
        "--bg-avatar": "rgba(255,255,255,0.06)",
        "--bg-tag": "rgba(15,23,42,0.4)",
        "--bg-tag-2": "rgba(15,23,42,0.42)",
        "--bg-status": "rgba(30,41,59,0.4)",
        "--bg-chip": "rgba(15,23,42,0.82)",
        "--bg-control": "rgba(15,23,42,0.82)",
        "--bg-control-active": "rgba(59,130,246,0.22)",
        "--bg-btn-blue": "rgba(59,130,246,0.22)",
        "--bg-btn-blue-active": "#F2FAFF",
        "--bg-footer": "rgba(15,23,42,0.92)",
        "--bg-scroll-btn": "rgba(15,23,42,0.88)",
        "--bg-glow": "rgba(10,132,255,0.16)",
        "--bg-glow-2": "rgba(6,229,204,0.12)",
        "--bg-about-overlay": "rgba(15,23,42,0.55)",
        "--bg-about": "rgba(15,23,42,0.98)",
        "--bg-about-header": "rgba(15,23,42,0.94)",
        "--bg-about-btn": "rgba(15,23,42,0.92)",
        "--bg-tile-empty": "#0F172A99",
        "--bg-board-gradient": "rgba(15,23,42,0.35), rgba(15,23,42,0.55)",
        /* ── Shadows ── */
        "--shadow-card": "0 12px 28px rgba(0,0,0,0.28)",
        "--shadow-hover": "0 5px 10px rgba(0,0,0,0.3)",
        "--shadow-card-hover": "0 6px 14px rgba(0,0,0,0.4)",
        "--shadow-float": "0 26px 64px rgba(0,0,0,0.44)",
        "--shadow-scroll-btn": "0 14px 28px rgba(0,0,0,0.34)",
        "--shadow-work-dark": "0 0 18px rgba(0,0,0,0.34), 0 8px 18px rgba(0,0,0,0.34)",
        "--shadow-work-light": "0 0 16px rgba(0,0,0,0.4)",
        "--shadow-work-hover": "0 8px 18px rgba(0,0,0,0.28)",
        "--shadow-about": "0 26px 64px rgba(0,0,0,0.44)",
        /* ── Misc ── */
        "--hover-shadow": "0 5px 10px rgba(0,0,0,0.3)",
        "--hover-border": "#3B82F6",
        "--hover-border-2": "#475569",
        "--hover-bg": "#0F172A",
        "--hover-bg-2": "rgba(30,41,59,0.78)",
        "--work-bg-hover": "rgba(30,41,59,0.78)",
        "--list-border": "rgba(148,163,184,0.18)",
        "--list-hover-border": "rgba(148,163,184,0.18)",
        "--list-bg": "rgba(15,23,42,0.62)",
        "--section-bg": "rgba(15,23,42,0.86)",
        "--section-border": "#334155",
        "--stage-overlay": "rgba(15,23,42,0.34)",
        "--stage-border": "rgba(51,65,85,0.72)",
        "--about-highlight-border": "#334155",
        "--about-highlight-bg": "rgba(15,23,42,0.92)",
        "--about-item-bg": "rgba(2,6,23,0.38)",
        "--about-note-color": "#64748B",
        "--about-nav-inactive-text": "#94A3B8",
      }
    : {
        /* ── Page & Layout ── */
        "--page-bg": "#F3F6FA",
        "--panel-bg": "rgba(255,255,255,0.92)",
        "--panel-bg-95": "rgba(255,255,255,0.95)",
        "--panel-bg-98": "rgba(255,255,255,0.98)",
        "--card-bg": "rgba(255,255,255,0.86)",
        "--card-bg-strong": "#FFFFFF",
        "--card-bg-86": "transparent",
        "--card-bg-88": "rgba(255,255,255,0.86)",
        "--card-bg-82": "rgba(255,255,255,0.82)",
        "--card-bg-75": "rgba(255,255,255,0.9)",
        "--card-bg-68": "rgba(255,255,255,0.7)",
        "--card-bg-62": "#FCFDFE",
        "--card-bg-42": "rgba(255,255,255,0.94)",
        "--card-bg-24": "rgba(255,255,255,0.4)",
        "--card-bg-deep": "#FAFBFC",
        "--card-bg-semi": "#FFFFFF",
        "--card-bg-semi-78": "#FFFFFF",
        "--card-bg-semi-9": "rgba(255,255,255,0.96)",
        "--card-bg-semi-active": "#EFF6FF",
        "--card-bg-semi-active-24": "#EFF6FF",
        "--card-bg-frost": "rgba(248,250,252,0.97)",
        "--card-bg-frost-2": "rgba(255,255,255,0.92)",
        "--card-bg-frost-3": "rgba(255,255,255,0.96)",
        "--card-bg-overlay": "rgba(255, 255, 255, 0.4)",
        "--card-bg-blur": "rgba(255,255,255,0.7)",
        "--card-bg-work": "rgba(255,255,255,0.4)",
        "--card-bg-work-m": "rgba(255,255,255,0.94)",
        /* ── Text Colors ── */
        "--text-primary": "#0F172A",
        "--text-secondary": "#334155",
        "--text-muted": "#595959",
        "--text-dim": "#64748B",
        "--text-bright": "#0F172A",
        "--text-bright-2": "#1E293B",
        "--text-link": "#005FCC",
        "--text-link-2": "#0A84FF",
        "--text-desc": "#94A3B8",
        "--text-tag": "#94A3B8",
        "--text-nav-active": "#0F172A",
        "--text-chip": "#5E6B7B",
        "--text-control": "#7A8EA5",
        "--text-control-active": "#3B9CD7",
        "--text-subtle": "#7A8EA5",
        "--text-status": "#2F7DD4",
        "--text-status-bg": "#F7FBFF",
        "--text-footer": "#94A3B8",
        "--text-footer-sub": "#CBD5E1",
        /* ── Borders ── */
        "--border-soft": "#E5E7EB",
        "--border-mid": "#E5E7EB",
        "--border-light": "#E5E7EB",
        "--border-chip": "#E4ECF4",
        "--border-control": "#E2EAF2",
        "--border-control-active": "#F2FAFF",
        "--border-control-active-solid": "#3B9CD744",
        "--border-divider": "#E2EAF2",
        "--border-tag": "#E6EDF5",
        "--border-tag-2": "#E5E7EB",
        "--border-tag-3": "#D7E5F5",
        "--border-avatar": "rgba(0,0,0,0.05)",
        "--border-avatar-2": "#FFFFFF",
        "--border-card-tag": "#E6EDF5",
        "--border-card-tag-2": "#EAF0F5",
        "--border-status": "#D7E5F5",
        "--border-section": "#EAF0F6",
        "--border-soft-rgba": "rgba(148,163,184,0.22)",
        "--border-soft-rgba-2": "rgba(0,0,0,0.06)",
        "--border-soft-rgba-3": "rgba(255, 255, 255, 0.5)",
        "--border-soft-rgba-4": "rgba(10,132,255,0.28)",
        "--border-active-soft": "rgba(191,219,254,0.65)",
        /* ── Backgrounds ── */
        "--bg-icon": "#F1F5F9",
        "--bg-icon-2": "#F8FAFC",
        "--bg-avatar": "rgba(0,0,0,0.04)",
        "--bg-tag": "#F8FBFF",
        "--bg-tag-2": "transparent",
        "--bg-status": "#F7FBFF",
        "--bg-chip": "#FAFCFF",
        "--bg-control": "rgba(255,255,255,0.82)",
        "--bg-control-active": "#F2FAFF",
        "--bg-btn-blue": "#F2FAFF",
        "--bg-btn-blue-active": "#F2FAFF",
        "--bg-footer": "rgba(255,255,255,0.9)",
        "--bg-scroll-btn": "rgba(255,255,255,0.9)",
        "--bg-glow": "rgba(10,132,255,0.12)",
        "--bg-glow-2": "rgba(6,229,204,0.1)",
        "--bg-about-overlay": "rgba(15,23,42,0.55)",
        "--bg-about": "rgba(248,251,255,0.98)",
        "--bg-about-header": "rgba(255,255,255,0.92)",
        "--bg-about-btn": "rgba(255,255,255,0.92)",
        "--bg-tile-empty": "#FFFFFF99",
        "--bg-board-gradient": "rgba(255,255,255,0.35), rgba(241,245,249,0.45)",
        /* ── Shadows ── */
        "--shadow-card": "0 8px 18px rgba(148,163,184,0.14)",
        "--shadow-hover": "0 5px 10px rgba(15,23,42,0.08)",
        "--shadow-card-hover": "0 6px 14px rgba(148,163,184,0.16)",
        "--shadow-float": "0 26px 64px rgba(15,23,42,0.28)",
        "--shadow-scroll-btn": "0 12px 24px rgba(15,23,42,0.16)",
        "--shadow-work-dark": "0 0 14px rgba(148,163,184,0.14), 0 5px 14px rgba(148,163,184,0.14)",
        "--shadow-work-light": "0 0 16px rgba(148,163,184,0.16)",
        "--shadow-work-hover": "0 6px 12px rgba(148,163,184,0.14)",
        "--shadow-about": "0 26px 64px rgba(15,23,42,0.28)",
        /* ── Misc ── */
        "--hover-shadow": "0 5px 10px rgba(15,23,42,0.08)",
        "--hover-border": "#BFDBFE",
        "--hover-border-2": "#E2E8F0",
        "--hover-bg": "#FFFFFF",
        "--hover-bg-2": "#FFFFFF",
        "--work-bg-hover": "#FFFFFF",
        "--list-border": "#EAF0F5",
        "--list-hover-border": "#DCE6F2",
        "--list-bg": "#FCFDFE",
        "--section-bg": "transparent",
        "--section-border": "#EAF0F6",
        "--stage-overlay": "rgba(255,255,255,0.38)",
        "--stage-border": "rgba(226,234,242,0.92)",
        "--about-highlight-border": "#BFDBFE",
        "--about-highlight-bg": "#EFF6FF",
        "--about-item-bg": "#FFFFFF",
        "--about-note-color": "#94A3B8",
        "--about-nav-inactive-text": "#475569",
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

  const handleThemeModeChange = useCallback((nextMode) => {
    if (typeof window === "undefined") {
      setThemeMode(nextMode);
      return;
    }

    if (themeSwitchTimerRef.current) {
      window.clearTimeout(themeSwitchTimerRef.current);
    }
    if (themeSwitchCommitTimerRef.current) {
      window.clearTimeout(themeSwitchCommitTimerRef.current);
    }

    const nextResolvedTheme = nextMode === "auto" ? (autoDarkMode ? "dark" : "light") : nextMode;
    setIsThemeSwitching(true);
    setThemeTransitionTarget(nextResolvedTheme);
    themeSwitchCommitTimerRef.current = window.setTimeout(() => {
      setThemeMode(nextMode);
      themeSwitchCommitTimerRef.current = null;
    }, THEME_SWITCH_COMMIT_MS);
    themeSwitchTimerRef.current = window.setTimeout(() => {
      setIsThemeSwitching(false);
      setThemeTransitionTarget(null);
      themeSwitchTimerRef.current = null;
    }, THEME_SWITCH_SYNC_MS);
  }, [autoDarkMode]);

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
    setMobileActivityOpen(false);
  }, [requestMobileMenuClose]);

  const openAboutPanel = useCallback(() => {
    setAboutOpen(true);
    closeMobileLayers();
  }, [closeMobileLayers]);

  const openActivityPanel = useCallback(() => {
    setMobileActivityOpen(true);
    closeMobileLayers();
    if (mobileActivityScrollTimerRef.current) {
      window.clearTimeout(mobileActivityScrollTimerRef.current);
    }
    mobileActivityScrollTimerRef.current = window.setTimeout(() => {
      mobileActivityRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 1050);
  }, [closeMobileLayers]);

  useEffect(() => {
    return () => {
      if (mobileActivityScrollTimerRef.current) {
        window.clearTimeout(mobileActivityScrollTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    let cancelled = false;

    const fetchPublicLinks = async (module) => {
      try {
        const params = new URLSearchParams({ module });
        const res = await fetch(`${PUBLIC_LINKS_API}?${params.toString()}`);
        if (!res.ok) return [];
        const payload = await res.json().catch(() => null);
        return normalizePublicLinks(payload?.links || payload?.data || []);
      } catch {
        return [];
      }
    };

    const syncMobilePublicLinks = async () => {
      const [friendLinks, miniGameLinks] = await Promise.all([
        fetchPublicLinks("friend_links"),
        fetchPublicLinks("mini_games"),
      ]);
      if (cancelled) return;
      setMobileFriendLinks(friendLinks);
      setMobileMiniGameLinks(miniGameLinks);
    };

    void syncMobilePublicLinks();
    const timer = window.setInterval(syncMobilePublicLinks, PUBLIC_LINK_REFRESH_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const mobileNavSections = buildMobileNavSections({
    activeCategory,
    onCategorySelect: (categoryId) => {
      handleCategorySelect(categoryId);
      closeMobileLayers();
    },
    onOpenAbout: openAboutPanel,
    onOpenActivity: openActivityPanel,
    friendLinks: mobileFriendLinks,
    miniGameLinks: mobileMiniGameLinks,
  });

  useEffect(() => {
    if (!aboutOpen) return undefined;

    const controller = new AbortController();
    const params = new URLSearchParams({
      logins: DEV_TEAM_GITHUB_LOGINS.join(","),
    });

    fetch(`${GITHUB_USER_API}?${params.toString()}`, {
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

      setThemeMode(getInitialThemeMode());

      setClientPrefsReady(true);
    }, 0);

    return () => window.clearTimeout(hydrateId);
  }, []);

  useEffect(() => {
    return () => {
      if (themeSwitchTimerRef.current && typeof window !== "undefined") {
        window.clearTimeout(themeSwitchTimerRef.current);
      }
      if (themeSwitchCommitTimerRef.current && typeof window !== "undefined") {
        window.clearTimeout(themeSwitchCommitTimerRef.current);
      }
    };
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
      setMobileActivityOpen(false);
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

  return (
    <>
      {!booted && <StartupSplash onComplete={handleBootComplete} />}

    <div
      className={`${isDarkMode ? "home-theme-dark" : "home-theme-light"}${isThemeSwitching ? " home-theme-switching" : ""}`}
      data-kcos-theme-root="true"
      data-theme={effectiveTheme}
      data-theme-target={themeTransitionTarget || effectiveTheme}
      data-theme-mode={themeMode}
      data-theme-switching={isThemeSwitching ? "true" : undefined}
      onMouseMove={isPhoneViewport ? undefined : handleMouseMove}
      style={{
        ...themeVars,
        "--theme-transition-duration": isThemeSwitching ? `${THEME_COLOR_TRANSITION_MS}ms` : "360ms",
        "--theme-transition-ease": isThemeSwitching ? "cubic-bezier(0.37, 0, 0.21, 1)" : "cubic-bezier(0.22, 1, 0.36, 1)",
        colorScheme: effectiveTheme,
        minHeight: "100dvh",
        height: isMobileViewport ? "auto" : "100dvh",
        backgroundColor: "var(--page-bg)",
        color: "var(--text-primary)",
        display: "flex",
        flexDirection: "column",
        opacity: fadeIn ? 1 : 0,
        transition: "opacity 0.5s ease, background-color var(--theme-transition-duration) var(--theme-transition-ease), color var(--theme-transition-duration) var(--theme-transition-ease)",
        fontFamily: "inherit",
        overflow: isMobileViewport ? "auto" : "hidden",
      }}
    >
      <HUDHeader
        compact={isMobileViewport}
        isDarkMode={isDarkMode}
        themeMode={themeMode}
        onThemeModeChange={handleThemeModeChange}
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
          {isMobileViewport && !mobileMenuOpen && mobileActivityOpen && (
            <div
              ref={mobileActivityRef}
              style={{
                padding: "0 12px 12px",
                flexShrink: 0,
              }}
            >
              <RightPanel
                isDarkMode={isDarkMode}
                isThemeSwitching={isThemeSwitching}
                embedded
              />
            </div>
          )}
        </div>

        {!isMobileViewport && (
          <div
            className="hidden xl:flex"
            style={{ display: "flex", flexShrink: 0 }}
          >
            <RightPanel
              isDarkMode={isDarkMode}
              isThemeSwitching={isThemeSwitching}
            />
          </div>
        )}
      </div>

      {isMobileViewport && !mobileMenuOpen && mobileScrollHint && (
        <button
          type="button"
          data-ui-touch="true"
          aria-label={mobileScrollHint === "down" ? "滑到底部" : "滑到顶部"}
          aria-describedby="mobile-scroll-jump-description"
          onClick={handleMobileScrollJump}
          style={{
            position: "fixed",
            right: 14,
            bottom: "calc(88px + env(safe-area-inset-bottom, 0px))",
            zIndex: 45,
            width: 44,
            height: 44,
            borderRadius: "50%",
            border: "1px solid var(--border-soft-rgba-4)",
            background: "var(--bg-scroll-btn)",
            color: "#005FCC",
            boxShadow: "var(--shadow-scroll-btn)",
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
      <span
        id="mobile-scroll-jump-description"
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: "hidden",
          clip: "rect(0, 0, 0, 0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      >
        点击后在页面顶部和底部之间快速切换。
      </span>

      <div
        style={{
          minHeight: isPhoneViewport ? 48 : "clamp(32px, 4vh, 38px)",
          background: "var(--bg-footer)",
          borderTop: "1px solid var(--border-soft)",
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
            color: "var(--text-footer-sub)",
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
              color: "var(--text-footer)",
              cursor: "pointer",
              appearance: "none",
              background: "transparent",
              border: 0,
              padding: 0,
              textDecoration: "underline",
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#0A84FF")}
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--text-footer)")
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
                color: "var(--text-footer)",
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#0A84FF")}
              onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--text-footer)")
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
              border: "var(--border-active-soft)",
              background: "var(--bg-about)",
              boxShadow: "var(--shadow-about)",
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
                background: "var(--bg-glow)",
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
                background: "var(--bg-glow-2)",
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
                borderBottom: "var(--border-soft)",
                background: "var(--bg-about-header)",
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
                    color: "var(--text-primary)",
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
                  border: "var(--border-soft)",
                  background: "var(--bg-about-btn)",
                  cursor: "pointer",
                  color: "var(--text-chip)",
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
                            : "var(--border-soft)",
                          background: isActive
                            ? "var(--card-bg-semi-active-24)"
                            : "var(--card-bg-frost-2)",
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
                              ? "var(--text-primary)"
                              : "var(--about-nav-inactive-text)",
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
                  <div className="about-org-chart">
                    <div className="about-org-chart__leaders">
                      <div className="about-org-chart__leader">指导老师</div>
                      <div className="about-org-chart__leader">会长</div>
                      <div className="about-org-chart__leader about-org-chart__leader--vice">副会长</div>
                    </div>
                    <div className="about-org-chart__trunk" />
                    <div className="about-org-chart__heads">
                      {ORG_DEPARTMENTS.map((dept) => (
                        <div key={`head-${dept.name}`} className="about-org-chart__head">
                          <div className="about-org-chart__head-title">{dept.name}部长</div>
                        </div>
                      ))}
                    </div>
                    <div className="about-org-chart__details">
                      {ORG_DEPARTMENTS.map((dept) => (
                        <div key={`detail-${dept.name}`} className="about-org-chart__detail">
                          <div className="about-org-chart__detail-title">{dept.name}</div>
                          <div className="about-org-chart__detail-text">{dept.duty}</div>
                        </div>
                      ))}
                    </div>
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
	                        borderColor: "var(--about-highlight-border)",
	                        background: "var(--about-highlight-bg)",
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
	                                  border: "var(--border-soft)",
	                                  borderRadius: 8,
	                                  background: "var(--about-item-bg)",
	                                  padding: "5px 7px",
	                                }}
	                              >
	                                <span
	                                  style={{
	                                    fontSize: 11,
	                                    color: "var(--text-secondary)",
	                                    lineHeight: 1.4,
	                                  }}
                                >
                                  {item.name}
                                  {item.note ? (
                                    <span
	                                      style={{
	                                        color: "var(--about-note-color)",
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
                          <AboutMemberAvatar
                            avatarUrl={avatarUrl}
                            name={member.name}
                            login={member.githubLogin}
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
                              aria-label={`打开 ${member.name} 的 GitHub 主页`}
                              title="GitHub"
                            >
                              <svg
                                viewBox="0 0 16 16"
                                width="18"
                                height="18"
                                fill="currentColor"
                                aria-hidden="true"
                                focusable="false"
                              >
                                <path d="M8 0.45C3.82 0.45 0.45 3.82 0.45 8c0 3.34 2.17 6.17 5.18 7.17 0.38 0.07 0.52-0.16 0.52-0.36 0-0.18-0.01-0.77-0.01-1.39-2.1 0.46-2.54-0.89-2.54-0.89-0.34-0.87-0.84-1.1-0.84-1.1-0.69-0.47 0.05-0.46 0.05-0.46 0.76 0.05 1.16 0.78 1.16 0.78 0.68 1.16 1.78 0.83 2.21 0.63 0.07-0.49 0.27-0.83 0.49-1.02-1.68-0.19-3.44-0.84-3.44-3.73 0-0.82 0.29-1.5 0.78-2.03-0.08-0.19-0.34-0.96 0.07-2 0 0 0.64-0.2 2.08 0.78A7.2 7.2 0 0 1 8 4.32c0.64 0 1.28 0.09 1.88 0.26 1.44-0.98 2.08-0.78 2.08-0.78 0.41 1.04 0.15 1.81 0.07 2 0.49 0.53 0.78 1.2 0.78 2.03 0 2.9-1.77 3.54-3.45 3.73 0.27 0.23 0.51 0.69 0.51 1.39 0 1-0.01 1.8-0.01 2.05 0 0.2 0.14 0.44 0.52 0.36A7.56 7.56 0 0 0 15.55 8C15.55 3.82 12.18 0.45 8 0.45Z" />
                              </svg>
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
        .about-member-avatar-img,
        .about-member-avatar-fallback {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          border: 1px solid #BFDBFE;
          flex-shrink: 0;
          box-shadow: 0 6px 14px rgba(15, 23, 42, 0.08);
        }
        .about-member-avatar-img {
          object-fit: cover;
        }
        .about-member-avatar-fallback {
          display: flex;
          align-items: center;
          justify-content: center;
          background: #EFF6FF;
          color: #0A84FF;
          font-size: 16px;
          font-weight: 800;
          letter-spacing: 0;
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
          width: 30px;
          height: 30px;
          color: #005FCC;
          text-decoration: none;
          border: 1px solid #BFDBFE;
          background: #EFF6FF;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
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
        .about-org-chart {
          margin-top: 8px;
          border: 1px solid #DBEAFE;
          border-radius: 12px;
          background: linear-gradient(180deg, #F8FBFF 0%, #FFFFFF 100%);
          padding: 12px 10px;
          display: grid;
          gap: 10px;
        }
        .about-org-chart__leaders {
          display: grid;
          grid-template-columns: 1fr;
          gap: 6px;
          justify-items: center;
        }
        .about-org-chart__leader {
          border: 1px solid #93C5FD;
          border-radius: 10px;
          background: #EFF6FF;
          padding: 8px 10px;
          text-align: center;
          font-size: 12px;
          font-weight: 700;
          color: #1E3A8A;
          min-width: min(320px, 100%);
        }
        .about-org-chart__leader--vice {
          border-color: #BFDBFE;
          background: #F8FBFF;
        }
        .about-org-chart__trunk {
          height: 2px;
          background: #BFDBFE;
          border-radius: 999px;
          margin: 1px 6%;
        }
        .about-org-chart__heads {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 8px;
        }
        .about-org-chart__head {
          border: 1px solid #DCE8F8;
          border-radius: 10px;
          background: #FFFFFF;
          padding: 7px 8px;
          min-height: 54px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          box-shadow: 0 5px 12px rgba(15,23,42,0.06);
        }
        .about-org-chart__head-title {
          font-size: 11px;
          font-weight: 700;
          color: #1E293B;
          line-height: 1.35;
        }
        .about-org-chart__details {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 8px;
        }
        .about-org-chart__detail {
          border: 1px solid #E2E8F0;
          border-radius: 10px;
          background: #FFFFFF;
          padding: 8px;
          display: grid;
          gap: 4px;
          min-height: 120px;
        }
        .about-org-chart__detail-title {
          font-size: 12px;
          font-weight: 700;
          color: #1E293B;
        }
        .about-org-chart__detail-text {
          font-size: 11px;
          color: #475569;
          line-height: 1.5;
        }
        .about-dept-flow {
          display: none;
          margin-top: 8px;
          border: 1px solid #DBEAFE;
          border-radius: 12px;
          background: linear-gradient(180deg, #F8FBFF 0%, #FFFFFF 100%);
          padding: 12px 10px;
          display: grid;
          gap: 10px;
          position: relative;
          overflow: hidden;
        }
        .about-dept-flow::before {
          content: "";
          position: absolute;
          top: 46px;
          left: 50%;
          width: 2px;
          height: calc(100% - 92px);
          transform: translateX(-50%);
          background: #BFDBFE;
          opacity: 0.9;
          pointer-events: none;
        }
        .about-dept-flow__top,
        .about-dept-flow__bottom {
          display: flex;
          justify-content: center;
          position: relative;
          z-index: 1;
        }
        .about-dept-flow__mid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 8px;
          position: relative;
          z-index: 1;
        }
        .about-dept-flow__mid::before {
          content: "";
          position: absolute;
          top: -7px;
          left: 10%;
          right: 10%;
          height: 2px;
          background: #BFDBFE;
        }
        .about-dept-flow__mid::after {
          content: "";
          position: absolute;
          bottom: -7px;
          left: 10%;
          right: 10%;
          height: 2px;
          background: #BFDBFE;
        }
        .about-dept-node {
          border: 1px solid #DCE8F8;
          border-radius: 10px;
          background: #FFFFFF;
          padding: 8px;
          display: grid;
          gap: 4px;
          min-height: 78px;
          box-shadow: 0 6px 14px rgba(15,23,42,0.06);
        }
        .about-dept-node--hub {
          min-width: min(320px, 88%);
          text-align: center;
          border-color: #93C5FD;
          background: #EFF6FF;
        }
        .about-dept-node--result {
          min-width: min(360px, 92%);
          text-align: center;
          border-color: #93C5FD;
          background: #F0F9FF;
        }
        .about-dept-node__title {
          font-size: 12px;
          font-weight: 700;
          color: #1E293B;
          line-height: 1.3;
        }
        .about-dept-node__desc {
          font-size: 11px;
          color: #475569;
          line-height: 1.45;
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
        .home-theme-dark .about-org-chart {
          border-color: #334155;
          background: #0F172A;
        }
        .home-theme-dark .about-org-chart__leader,
        .home-theme-dark .about-org-chart__head,
        .home-theme-dark .about-org-chart__detail {
          border-color: #334155;
          background: rgba(2,6,23,0.38);
        }
        .home-theme-dark .about-org-chart__leader {
          color: #BFDBFE;
        }
        .home-theme-dark .about-org-chart__head-title,
        .home-theme-dark .about-org-chart__detail-title {
          color: #E2E8F0;
        }
        .home-theme-dark .about-org-chart__detail-text {
          color: #94A3B8;
        }
        .home-theme-dark .about-dept-flow {
          border-color: #334155;
          background: #0F172A;
        }
        .home-theme-dark .about-dept-flow::before,
        .home-theme-dark .about-dept-flow__mid::before,
        .home-theme-dark .about-dept-flow__mid::after {
          background: #334155;
        }
        .home-theme-dark .about-dept-node {
          border-color: #334155;
          background: rgba(2,6,23,0.38);
        }
        .home-theme-dark .about-dept-node__title {
          color: #E2E8F0;
        }
        .home-theme-dark .about-dept-node__desc {
          color: #94A3B8;
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
          .about-org-chart__heads,
          .about-org-chart__details {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .about-org-chart__leaders {
            grid-template-columns: 1fr;
          }
          .about-org-chart__trunk {
            margin: 2px 0;
          }
          .about-dept-flow::before {
            display: none;
          }
          .about-dept-flow__mid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .about-dept-flow__mid::before,
          .about-dept-flow__mid::after {
            display: none;
          }
          .about-dept-node--hub,
          .about-dept-node--result {
            min-width: 100%;
          }
        }
        @media (min-width: 1201px) {
          .lg\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
    </>
  );
}
