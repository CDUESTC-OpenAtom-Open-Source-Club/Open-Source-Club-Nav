// @ts-nocheck
"use client";
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, X } from "lucide-react";
import ErrorBoundary from "@/components/shared/ErrorBoundary";
import { useDeviceCapability } from "@/hooks/useDeviceCapability";
import { RESOURCE_CATEGORIES } from "@/data/resources";
import { trackOutboundClick } from "@/lib/track-outbound";

// ── 懒加载重型 3D / Canvas 组件 ──
const GlobeCanvas = lazy(() => import("@/components/shared/GlobeCanvas"));
const GlobeCanvasFallback = lazy(() => import("@/components/shared/GlobeCanvasFallback"));
const WorksCarousel = lazy(() => import("./WorksCarousel"));

const PUBLIC_REFRESH_INTERVAL_MS = 5 * 60 * 1000;

const TAG_COLORS = {
  Learning: { bg: "#EFF6FF", text: "#2563EB", border: "#BFDBFE" },
  Practice: { bg: "#F0FDF4", text: "#059669", border: "#BBF7D0" },
  Research: { bg: "#FFF7ED", text: "#EA580C", border: "#FED7AA" },
  Papers: { bg: "#FAF5FF", text: "#7C3AED", border: "#DDD6FE" },
  Course: { bg: "#F0FDF4", text: "#059669", border: "#BBF7D0" },
  Campus: { bg: "#EFF6FF", text: "#005FCC", border: "#BFDBFE" },
  Life: { bg: "#FFFBEB", text: "#F59E0B", border: "#FDE68A" },
  Dev: { bg: "#F1F5F9", text: "#374151", border: "#E2E8F0" },
  Mirror: { bg: "#EFF6FF", text: "#005FCC", border: "#BFDBFE" },
  IDE: { bg: "#FAF5FF", text: "#7C3AED", border: "#DDD6FE" },
  DevOps: { bg: "#F0FDF4", text: "#059669", border: "#BBF7D0" },
  Docs: { bg: "#F8FAFC", text: "#595959", border: "#E2E8F0" },
};

const CLUB_OVERVIEW_ITEMS = [
  {
    title: "社团介绍",
    value:
      "电子科技大学成都学院开放原子开源社团聚焦真实项目协作，面向校内同学提供从入门到进阶的工程实践平台。",
    color: "#0A84FF",
  },
  {
    title: "活动安排",
    value:
      "每周技术分享 + 项目例会，每月作品路演与复盘，持续沉淀可复用的开源资产。",
    color: "#10B981",
  },
  {
    title: "招新信息",
    value:
      "长期招新，按项目方向分组协作；欢迎前端、后端、设计、产品方向同学加入。",
    color: "#F59E0B",
  },
  {
    title: "联系方式",
    value: "邮箱：opensouce-club@kcos.club ｜ 社团QQ群：306601226",
    color: "#7C3AED",
  },
];

function HoverRevealCard({ item, direction, delay = 0, isDarkMode }) {
  const isLeft = direction === "left";
  const [isExpanded, setIsExpanded] = useState(false);
  const collapsedWidth = 110;

  return (
    <div
      className="hover-reveal-card"
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      style={{
        position: "relative",
        width: isExpanded ? 220 : collapsedWidth,
        minHeight: isExpanded ? 108 : 54,
        padding: isExpanded ? "14px 18px 16px" : "0",
        borderRadius: 16,
        background: isExpanded
          ? isDarkMode
            ? "rgba(15, 23, 42, 0.35)"
            : "rgba(255, 255, 255, 0.4)"
          : "transparent",
        backdropFilter: isExpanded ? "blur(20px)" : "none",
        WebkitBackdropFilter: isExpanded ? "blur(20px)" : "none",
        border: isExpanded
          ? isDarkMode
            ? "1px solid rgba(255, 255, 255, 0.12)"
            : "1px solid rgba(255, 255, 255, 0.5)"
          : "1px solid transparent",
        boxShadow: isExpanded
          ? "0 22px 46px rgba(15, 23, 42, 0.14)"
          : "none",
        overflow: "visible",
        cursor: "default",
        zIndex: isExpanded ? 30 : 1,
        transition:
          "width 0.26s ease, min-height 0.26s ease, padding 0.24s ease, transform 0.22s ease, box-shadow 0.22s ease, background 0.22s ease, border-color 0.22s ease",
        transform: isExpanded ? "translateY(-2px) scale(1.01)" : "translateY(0) scale(1)",
        animation: `${isLeft ? "fadeInLeft" : "fadeInRight"} 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s both`,
      }}
    >
      <div
        className="hover-reveal-card__chip"
        style={{
          fontSize: 11,
          color: item.color,
          fontWeight: 700,
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 10px",
          borderRadius: 10,
          background: isDarkMode
            ? "rgba(15,23,42,0.38)"
            : "rgba(255,255,255,0.7)",
          border: `1px solid ${item.color}33`,
          boxShadow: `0 0 0 1px ${item.color}10 inset`,
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          transition: "transform 0.22s ease, box-shadow 0.22s ease, background 0.22s ease",
          transform: "translateY(0) scale(1)",
          boxShadow: isExpanded
            ? "0 12px 28px rgba(15, 23, 42, 0.12)"
            : `0 0 0 1px ${item.color}10 inset`,
          background: isExpanded
            ? "rgba(255, 255, 255, 0.9)"
            : isDarkMode
              ? "rgba(15,23,42,0.38)"
              : "rgba(255,255,255,0.7)",
          width: "fit-content",
          marginLeft: isLeft ? 10 : "auto",
          marginRight: isLeft ? "auto" : 10,
        }}
      >
        <div
          className="hover-reveal-card__spark"
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: item.color,
            boxShadow: `0 0 8px ${item.color}`,
          }}
        />
        {item.title}
      </div>

      <div
        className="hover-reveal-card__body"
        style={{
          fontSize: 11,
          color: "var(--text-muted)",
          lineHeight: 1.5,
          opacity: isExpanded ? 1 : 0,
          maxHeight: isExpanded ? 90 : 0,
          overflow: "hidden",
          filter: isExpanded ? "blur(0)" : "blur(4px)",
          whiteSpace: "normal",
          marginTop: isExpanded ? 10 : 0,
          transform: isExpanded ? "translateY(0)" : "translateY(-8px)",
          transition:
            "opacity 0.2s ease, max-height 0.26s ease, margin-top 0.24s ease, transform 0.24s ease, filter 0.24s ease",
        }}
      >
        {item.value}
      </div>
    </div>
  );
}

const HOME_INFO_CARDS = [
  {
    title: "社团域名",
    value: "kcos.club",
    hint: "brand identity",
    color: "#0A84FF",
    href: "https://kcos.club",
  },
  {
    title: "社团官网",
    value: "opensouce-club.top",
    hint: "official website",
    color: "#10B981",
    href: "https://opensouce-club.top/",
  },
  {
    title: "活动状态",
    value: "weekly update",
    hint: "community active",
    color: "#F59E0B",
  },
];

const ORG_STATS_API = "/api/org-stats";
const ACTIVITIES_API = "/api/activities";

const DEFAULT_HOME_STATS = [
  { key: "members", label: "-- members", color: "#0A84FF" },
  { key: "projects", label: "-- repos", color: "#06E5CC" },
  { key: "stars", label: "-- repo stars", color: "#F59E0B" },
  { key: "activity", label: "syncing events", color: "#10B981" },
];

const formatCompactCount = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return "--";
  if (numeric >= 1000) {
    return `${(numeric / 1000).toFixed(numeric >= 10000 ? 0 : 1).replace(/\.0$/, "")}k`;
  }
  return String(numeric);
};

const buildMemberStatLabel = (orgStats) => {
  if (orgStats?.membersSource === "github-unavailable") return "members unavailable";
  if (orgStats?.members === null || orgStats?.members === undefined || orgStats?.members === "") {
    return "members unavailable";
  }
  const githubMemberCount = Number(orgStats?.members);
  if (!Number.isFinite(githubMemberCount) || githubMemberCount < 0) return "-- members";
  return `${formatCompactCount(githubMemberCount)} members`;
};

const buildHomeStats = (orgStats, activityPayload) => {
  const activities = Array.isArray(activityPayload?.activities)
    ? activityPayload.activities.length
    : null;
  const activitySource = activityPayload?.source || orgStats?.source || "api";
  const activityLabel = activities === null
    ? `${activitySource} events`
    : `${formatCompactCount(activities)} ${activitySource === "github" ? "live" : activitySource} events`;

  return [
    {
      key: "members",
      label: buildMemberStatLabel(orgStats),
      color: "#0A84FF",
    },
    {
      key: "projects",
      label: `${formatCompactCount(orgStats?.projects)} repos`,
      color: "#06E5CC",
    },
    {
      key: "stars",
      label: `${formatCompactCount(orgStats?.stars)} repo stars`,
      color: "#F59E0B",
    },
    {
      key: "activity",
      label: activityLabel,
      color: activitySource === "github" ? "#10B981" : "#F59E0B",
    },
  ];
};

const MINI_GAME_BACKGROUND_URL =
  "https://opengameart.org/sites/default/files/back_3.png";

function getLinkMeta(url) {
  // 统一解析资源链接，顺便判断是站内跳转还是外链打开。
  if (!url || url === "#") {
    return { label: "Campus Resource", href: "#", isExternal: false };
  }

  try {
    const parsed = new URL(url);
    return {
      label: parsed.host.replace(/^www\./, ""),
      href: url,
      isExternal: true,
    };
  } catch {
    return { label: "Resource", href: url, isExternal: false };
  }
}

function HologramPanel({ category, categories, onClose, isDarkMode }) {
  // 资源分类点开后，中心区域会切到这个覆盖层展示详细链接。
  const [hoveredLink, setHoveredLink] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const lastTapRef = useRef({ index: null, ts: 0 });
  const cat = categories.find((c) => c.id === category);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const sync = () => setIsMobile(window.innerWidth <= 768);
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  const hovered = useMemo(() => {
    if (!cat || hoveredLink === null) return null;
    return cat.links[hoveredLink] ?? null;
  }, [cat, hoveredLink]);

  if (!cat) return null;

  const hoveredMeta = hovered ? getLinkMeta(hovered.url) : null;

  const openLink = (link) => {
    const meta = getLinkMeta(link.url);

    // 点击埋点
    trackOutboundClick({
      targetUrl: meta.href,
      targetLabel: link.title,
      sourceContext: `resource_panel:${cat?.sublabel ?? "unknown"}`,
    });

    if (meta.isExternal) {
      window.open(meta.href, "_blank", "noopener,noreferrer");
      return;
    }
    window.location.href = meta.href;
  };

  const handleMobileCardAction = (e, link, index) => {
    // 移动端单击只聚焦卡片，双击才真正打开，避免误触跳走。
    if (!isMobile) return;

    e.preventDefault();
    e.stopPropagation();
    setHoveredLink(index);

    const now = Date.now();
    const isDoubleTap =
      lastTapRef.current.index === index && now - lastTapRef.current.ts <= 450;
    lastTapRef.current = { index, ts: now };

    if (isDoubleTap) {
      openLink(link);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      style={{
        position: "absolute",
        inset: 0,
        background: isDarkMode
          ? "rgba(15,23,42,0.97)"
          : "rgba(248,250,252,0.97)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        display: "flex",
        flexDirection: "column",
        animation: "panelIn 0.22s ease",
        zIndex: 10,
        padding: 20,
        overflowY: "auto",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 14,
          gap: 12,
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 4,
            }}
          >
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: cat.color,
              }}
            />
            <span
              style={{
                fontSize: 10,
                fontFamily: '"Courier New", monospace',
                color: cat.color,
                letterSpacing: 1.4,
                fontWeight: 600,
              }}
            >
              SECTOR // {cat.sublabel.toUpperCase()}
            </span>
          </div>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "var(--text-primary)",
              margin: 0,
              lineHeight: 1.15,
            }}
          >
            {cat.label}
          </h2>
          <p style={{ fontSize: 11, color: "#64748B", margin: "5px 0 0" }}>
            {cat.links.length} resources · 点击空白可返回主页
          </p>
        </div>

        <button
          onClick={onClose}
          data-ui-touch="true"
          style={{
            width: 30,
            height: 30,
            borderRadius: "50%",
            border: "1px solid var(--border-control)",
            background: "var(--card-bg-deep)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
            transition: "all 0.18s ease",
          }}
          aria-label="Close panel"
        >
          <X size={14} color="#94A3B8" />
        </button>
      </div>

      <div
        style={{
          height: 2,
          background: `${cat.color}44`,
          borderRadius: 2,
          marginBottom: 12,
        }}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(168px, 1fr))",
          gap: 10,
        }}
        onMouseLeave={() => {
          if (!isMobile) setHoveredLink(null);
        }}
      >
        {cat.links.map((link, i) => {
          const tagStyle = TAG_COLORS[link.tag] || TAG_COLORS.Docs;
          const isHovered = hoveredLink === i;
          const linkMeta = getLinkMeta(link.url);

          return (
            <a
              key={i}
              href={link.url}
              target={linkMeta.isExternal ? "_blank" : undefined}
              rel={linkMeta.isExternal ? "noopener noreferrer" : undefined}
              data-ui-touch="true"
              onMouseEnter={() => {
                if (!isMobile) setHoveredLink(i);
              }}
              onClick={(e) => {
                if (isMobile) {
                  handleMobileCardAction(e, link, i);
                } else {
                  // 桌面端点击链接时记录埋点
                  trackOutboundClick({
                    targetUrl: linkMeta.href,
                    targetLabel: link.title,
                    sourceContext: `resource_panel:${cat?.sublabel ?? "unknown"}`,
                  });
                }
              }}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                minHeight: 84,
                padding: "10px 12px",
                borderRadius: 10,
                border: `1px solid ${isHovered ? cat.color + "55" : "var(--border-soft)"}`,
                background: "var(--card-bg-deep)",
                textDecoration: "none",
                transition: "all 0.15s ease",
                position: "relative",
                overflow: "hidden",
                transform: isHovered ? "translateY(-2px)" : "translateY(0)",
                boxShadow: isHovered ? `0 8px 16px ${cat.color}12` : "none",
              }}
              title={link.desc}
            >
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: 3,
                  background: cat.color,
                  borderRadius: "3px 0 0 3px",
                  transform: isHovered ? "scaleX(1)" : "scaleX(0)",
                  transformOrigin: "left",
                  transition: "transform 0.15s ease",
                }}
              />

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontSize: 8,
                    padding: "2px 8px",
                    borderRadius: 999,
                    background: tagStyle.bg,
                    color: tagStyle.text,
                    border: `1px solid ${tagStyle.border}`,
                    fontWeight: 500,
                    letterSpacing: 0.2,
                  }}
                >
                  {link.tag}
                </span>
                <ExternalLink
                  size={10}
                  color={isHovered ? cat.color : "#CBD5E1"}
                  style={{ transition: "color 0.15s" }}
                />
              </div>

              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text-bright)",
                  lineHeight: 1.25,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {link.title}
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  marginTop: "auto",
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    color: "#94A3B8",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {linkMeta.label}
                </span>
                <span
                  style={{
                    fontSize: 9,
                    color: isHovered ? cat.color : "#CBD5E1",
                    fontFamily: '"Courier New", monospace',
                    flexShrink: 0,
                  }}
                >
                  INFO
                </span>
              </div>
            </a>
          );
        })}
      </div>

      <div
        style={{
          marginTop: 12,
          border: `1px solid ${cat.color}26`,
          background: "var(--card-bg-strong)",
          borderRadius: 12,
          padding: "10px 12px",
          minHeight: 88,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 6,
        }}
      >
        {hovered ? (
          <>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "var(--text-primary)",
              }}
            >
              {hovered.title}
            </div>
            <div style={{ fontSize: 11, color: "#64748B", lineHeight: 1.45 }}>
              {hovered.desc}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  color: cat.color,
                  fontFamily: '"Courier New", monospace',
                }}
              >
                {hoveredMeta?.label}
              </span>
              {hoveredMeta?.isExternal ? (
                <a
                  href={hoveredMeta.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-ui-touch="true"
                  style={{
                    fontSize: 10,
                    color: "#0A84FF",
                    textDecoration: "none",
                    border: "1px solid #BFDBFE",
                    background: "#EFF6FF",
                    borderRadius: 999,
                    padding: "3px 8px",
                    fontWeight: 600,
                  }}
                >
                  Open
                </a>
              ) : (
                <span
                  style={{
                    fontSize: 10,
                    color: "#94A3B8",
                    border: "1px solid #E5E7EB",
                    borderRadius: 999,
                    padding: "3px 8px",
                  }}
                >
                  Internal
                </span>
              )}
            </div>
          </>
        ) : (
          <div style={{ fontSize: 11, color: "#64748B", lineHeight: 1.5 }}>
            {isMobile
              ? "单击卡片先预览，双击同一卡片再打开链接。"
              : "Move your pointer over a card to preview full details here."}
          </div>
        )}
      </div>

      <style>{`
        @keyframes panelIn {
          from { opacity: 0; transform: scale(0.98) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes fadeInLeft {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeInRight {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

export function MiniTapGame({ isDarkMode = false }) {
  const GRID_SIZE = 4;
  const WIN_TILE = 2048;
  const BEST_KEY = "kcos_2048_best";

  const createGrid = () =>
    Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));

  const cloneGrid = (grid) => grid.map((row) => [...row]);

  const pickEmptyCell = (grid) => {
    const empty = [];
    for (let r = 0; r < GRID_SIZE; r += 1) {
      for (let c = 0; c < GRID_SIZE; c += 1) {
        if (grid[r][c] === 0) empty.push([r, c]);
      }
    }
    if (!empty.length) return null;
    return empty[Math.floor(Math.random() * empty.length)];
  };

  const spawnRandomTile = (grid) => {
    const next = cloneGrid(grid);
    const cell = pickEmptyCell(next);
    if (!cell) return next;
    const [r, c] = cell;
    next[r][c] = Math.random() < 0.9 ? 2 : 4;
    return next;
  };

  const initGrid = () => spawnRandomTile(spawnRandomTile(createGrid()));

  const mergeLine = (line) => {
    const compact = line.filter((n) => n !== 0);
    const merged = [];
    let scoreGain = 0;
    for (let i = 0; i < compact.length; i += 1) {
      if (compact[i] === compact[i + 1]) {
        const value = compact[i] * 2;
        merged.push(value);
        scoreGain += value;
        i += 1;
      } else {
        merged.push(compact[i]);
      }
    }
    while (merged.length < GRID_SIZE) merged.push(0);
    return { merged, scoreGain };
  };

  const moveGrid = (grid, direction) => {
    const next = createGrid();
    let moved = false;
    let scoreGain = 0;

    const writeRow = (r, row) => {
      for (let c = 0; c < GRID_SIZE; c += 1) {
        next[r][c] = row[c];
        if (row[c] !== grid[r][c]) moved = true;
      }
    };

    const writeCol = (c, col) => {
      for (let r = 0; r < GRID_SIZE; r += 1) {
        next[r][c] = col[r];
        if (col[r] !== grid[r][c]) moved = true;
      }
    };

    if (direction === "left" || direction === "right") {
      for (let r = 0; r < GRID_SIZE; r += 1) {
        const line =
          direction === "left" ? [...grid[r]] : [...grid[r]].reverse();
        const { merged, scoreGain: gain } = mergeLine(line);
        const row = direction === "left" ? merged : merged.reverse();
        scoreGain += gain;
        writeRow(r, row);
      }
    } else {
      for (let c = 0; c < GRID_SIZE; c += 1) {
        const colRaw = Array.from({ length: GRID_SIZE }, (_, r) => grid[r][c]);
        const line = direction === "up" ? colRaw : colRaw.reverse();
        const { merged, scoreGain: gain } = mergeLine(line);
        const col = direction === "up" ? merged : merged.reverse();
        scoreGain += gain;
        writeCol(c, col);
      }
    }

    return { next, moved, scoreGain };
  };

  const hasMove = (grid) => {
    for (let r = 0; r < GRID_SIZE; r += 1) {
      for (let c = 0; c < GRID_SIZE; c += 1) {
        const v = grid[r][c];
        if (v === 0) return true;
        if (c < GRID_SIZE - 1 && v === grid[r][c + 1]) return true;
        if (r < GRID_SIZE - 1 && v === grid[r + 1][c]) return true;
      }
    }
    return false;
  };

  const [grid, setGrid] = useState(() => initGrid());
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [moves, setMoves] = useState(0);
  const [status, setStatus] = useState("playing");
  const [hint, setHint] = useState("方向键/WASD 或手机滑动进行合并。");
  const touchStartRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const localBest = Number(localStorage.getItem(BEST_KEY) || 0);
    if (Number.isFinite(localBest) && localBest > 0) {
      setBest(localBest);
    }
    return undefined;
  }, []);

  const updateBest = useCallback(
    (nextScore) => {
      setBest((prev) => {
        if (nextScore <= prev) return prev;
        if (typeof window !== "undefined") {
          localStorage.setItem(BEST_KEY, String(nextScore));
        }
        return nextScore;
      });
    },
    [BEST_KEY],
  );

  const restart = useCallback(() => {
    setGrid(initGrid());
    setScore(0);
    setMoves(0);
    setStatus("playing");
    setHint("方向键/WASD 或手机滑动进行合并。");
  }, []);

  const handleMove = useCallback(
    (direction) => {
      if (status === "over") return;
      const { next, moved, scoreGain } = moveGrid(grid, direction);
      if (!moved) return;

      const withNewTile = spawnRandomTile(next);
      const nextScore = score + scoreGain;
      const maxTile = Math.max(...withNewTile.flat());

      setGrid(withNewTile);
      setScore(nextScore);
      setMoves((prev) => prev + 1);
      updateBest(nextScore);

      if (maxTile >= WIN_TILE && status !== "won") {
        setStatus("won");
        setHint("恭喜达成 2048，可继续冲击更高分。");
        return;
      }

      if (!hasMove(withNewTile)) {
        setStatus("over");
        setHint("已无可用移动，点击新局重开。");
        return;
      }

      setHint("继续合并相同数字，冲击更高分。");
    },
    [grid, score, status, updateBest],
  );

  useEffect(() => {
    const keyMap = {
      ArrowUp: "up",
      ArrowDown: "down",
      ArrowLeft: "left",
      ArrowRight: "right",
      w: "up",
      s: "down",
      a: "left",
      d: "right",
      W: "up",
      S: "down",
      A: "left",
      D: "right",
    };

    const onKeyDown = (e) => {
      const direction = keyMap[e.key];
      if (!direction) return;
      e.preventDefault();
      handleMove(direction);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleMove]);

  const getTileStyle = (value) => {
    const palette = {
      0: { bg: "var(--bg-tile-empty)", color: "#94A3B8" },
      2: { bg: "#FEF3C7", color: "#7C2D12" },
      4: { bg: "#FDE68A", color: "#7C2D12" },
      8: { bg: "#FDBA74", color: "#7C2D12" },
      16: { bg: "#FB923C", color: "#FFFFFF" },
      32: { bg: "#F97316", color: "#FFFFFF" },
      64: { bg: "#EA580C", color: "#FFFFFF" },
      128: { bg: "#38BDF8", color: "#0C4A6E" },
      256: { bg: "#0EA5E9", color: "#FFFFFF" },
      512: { bg: "#0284C7", color: "#FFFFFF" },
      1024: { bg: "#0369A1", color: "#FFFFFF" },
      2048: { bg: "#7C3AED", color: "#FFFFFF" },
    };
    return palette[value] || { bg: "#4F46E5", color: "#FFFFFF" };
  };

  const onTouchStart = (e) => {
    const t = e.touches?.[0];
    if (!t) return;
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  };

  const onTouchEnd = (e) => {
    const start = touchStartRef.current;
    const t = e.changedTouches?.[0];
    if (!start || !t) return;
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 22) return;
    if (Math.abs(dx) > Math.abs(dy)) {
      handleMove(dx > 0 ? "right" : "left");
    } else {
      handleMove(dy > 0 ? "down" : "up");
    }
    touchStartRef.current = null;
  };

  return (
    <div
      style={{
        width: "88%",
        border: "1px solid var(--border-soft)",
        borderRadius: 12,
        background: "var(--card-bg-75)",
        padding: "9px 10px",
        display: "grid",
        gap: 8,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontSize: 10,
            color: "#0A84FF",
            letterSpacing: 1,
            fontWeight: 700,
            fontFamily: '"Courier New", monospace',
          }}
        >
          2048 RUSH
        </span>
        <div
          style={{
            display: "flex",
            gap: 8,
            fontSize: 10,
            color: "var(--text-secondary)",
            flexWrap: "wrap",
            justifyContent: "flex-end",
          }}
        >
          <span>分数 {score}</span>
          <span>步数 {moves}</span>
          <span>
            {status === "won"
              ? "状态 胜利"
              : status === "over"
                ? "状态 结束"
                : "状态 进行中"}
          </span>
          <span>最高 {best}</span>
        </div>
      </div>

      <div
        style={{
          position: "relative",
          height: 176,
          borderRadius: 10,
          border: "1px solid var(--border-mid)",
          backgroundImage: `linear-gradient(var(--bg-board-gradient)), url(${MINI_GAME_BACKGROUND_URL})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          padding: 8,
          overflow: "hidden",
        }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 6,
            width: "100%",
            height: "100%",
          }}
        >
          {grid.flat().map((value, idx) => {
            const style = getTileStyle(value);
            return (
              <div
                key={idx}
                style={{
                  borderRadius: 8,
                  border: "1px solid var(--border-tag)",
                  background: style.bg,
                  color: style.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize:
                    value >= 1024
                      ? 11
                      : value >= 128
                        ? 13
                        : value >= 8
                          ? 14
                          : 15,
                  fontFamily: '"Courier New", monospace',
                  backdropFilter: "blur(2px)",
                  transition: "all 0.16s ease",
                }}
              >
                {value || ""}
              </div>
            );
          })}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gap: 6,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 6,
          }}
        >
          <button
            type="button"
            onClick={() => handleMove("up")}
            data-ui-touch="true"
            style={{
              border: "1px solid #BFDBFE",
              background: "#EFF6FF",
              color: "#0A84FF",
              borderRadius: 8,
              padding: "4px 0",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => handleMove("left")}
            data-ui-touch="true"
            style={{
              border: "1px solid #BFDBFE",
              background: "#EFF6FF",
              color: "#0A84FF",
              borderRadius: 8,
              padding: "4px 0",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => handleMove("right")}
            data-ui-touch="true"
            style={{
              border: "1px solid #BFDBFE",
              background: "#EFF6FF",
              color: "#0A84FF",
              borderRadius: 8,
              padding: "4px 0",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            →
          </button>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span
            style={{ fontSize: 10, color: "var(--text-muted)" }}
          >
            {hint}
          </span>
          <button
            type="button"
            onClick={() => handleMove("down")}
            data-ui-touch="true"
            style={{
              border: "1px solid #BFDBFE",
              background: "#EFF6FF",
              color: "#0A84FF",
              borderRadius: 8,
              padding: "4px 10px",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            ↓
          </button>
        </div>

        <button
          type="button"
          onClick={restart}
          data-ui-touch="true"
          style={{
            border: "1px solid #BFDBFE",
            background: "#EFF6FF",
            color: "#0A84FF",
            borderRadius: 999,
            padding: "4px 10px",
            fontSize: 10,
            fontWeight: 600,
            cursor: "pointer",
            justifySelf: "flex-end",
          }}
        >
          新局
        </button>
      </div>
    </div>
  );
}

export default function CentralHub({
  activeCategory,
  resourceCategories = RESOURCE_CATEGORIES,
  parallax,
  onClosePanel,
  isDarkMode = false,
}) {
  // 中心区域负责两种主状态：默认主页态，以及 activeCategory 打开的分类详情态。
  const [viewportMode, setViewportMode] = useState("desktop");
  const [isShortViewport, setIsShortViewport] = useState(false);
  const [homeStats, setHomeStats] = useState(DEFAULT_HOME_STATS);

  // 设备性能检测，决定加载全量 3D 还是降级版本
  const deviceTier = useDeviceCapability();

  useEffect(() => {
    let cancelled = false;

    const syncHomeStats = async () => {
      try {
        const [orgStatsRes, activitiesRes] = await Promise.all([
          fetch(ORG_STATS_API, { cache: "no-store" }),
          fetch(ACTIVITIES_API),
        ]);
        const [orgStats, activityPayload] = await Promise.all([
          orgStatsRes.ok ? orgStatsRes.json() : null,
          activitiesRes.ok ? activitiesRes.json() : null,
        ]);
        if (!cancelled) {
          setHomeStats(buildHomeStats(orgStats, activityPayload));
        }
      } catch {
        if (!cancelled) {
          setHomeStats([
            { key: "members", label: "members unavailable", color: "#64748B" },
            { key: "projects", label: "repos unavailable", color: "#64748B" },
            { key: "stars", label: "repo stars unavailable", color: "#64748B" },
            { key: "activity", label: "events unavailable", color: "#64748B" },
          ]);
        }
      }
    };

    syncHomeStats();
    const refreshId = setInterval(syncHomeStats, PUBLIC_REFRESH_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(refreshId);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const syncViewportMode = () => {
      const width = window.innerWidth;
      setIsShortViewport(window.innerHeight <= 820);
      if (width <= 768) {
        setViewportMode("mobile");
      } else if (width <= 1200) {
        setViewportMode("tablet");
      } else {
        setViewportMode("desktop");
      }
    };

    syncViewportMode();
    window.addEventListener("resize", syncViewportMode);
    return () => window.removeEventListener("resize", syncViewportMode);
  }, []);

  const isMobileViewport = viewportMode === "mobile";
  const isTabletViewport = viewportMode === "tablet";
  const isDenseViewport = isShortViewport && !isMobileViewport;
  const dashboardWidth = isMobileViewport
    ? "96%"
    : isTabletViewport
      ? "92%"
      : "88%";
  const dividerWidth = isMobileViewport
    ? "92%"
    : isTabletViewport
      ? "86%"
      : "80%";
  const globeSize = isMobileViewport
    ? 148
    : isDenseViewport
      ? isTabletViewport
        ? 146
        : 132
      : isTabletViewport
        ? 188
        : 206;
  const infoCardMinWidth = isMobileViewport ? 104 : isTabletViewport ? 136 : 120;
  const overviewCardMinWidth = isMobileViewport
    ? 150
    : isTabletViewport
      ? 150
      : 160;
  const homeStackGap = isMobileViewport ? 8 : isDenseViewport ? 5 : 10;
  const homeTopPadding = isMobileViewport ? 10 : isDenseViewport ? 6 : 14;

  return (
    <main
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        position: "relative",
        background: isDarkMode
          ? "rgba(15,23,42,0.68)"
          : "rgba(255,255,255,0.7)",
        overflow: "visible",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "none",
          transform: `translate(${parallax.x * 0.3}px, ${parallax.y * 0.3}px)`,
          transition: "transform 0.1s ease",
          pointerEvents: "none",
        }}
      />

      {activeCategory && (
        // 选中分类后用覆盖层替换主页内容，视觉上更像“进入一个子空间”。
        <HologramPanel
          category={activeCategory}
          categories={resourceCategories}
          onClose={onClosePanel}
          isDarkMode={isDarkMode}
        />
      )}

      {!activeCategory && (
        // 未选中分类时，展示首页默认中枢内容。
        <>
          <div
            style={{
              flex: "0 0 auto",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              paddingTop: homeTopPadding,
              gap: homeStackGap,
              position: "relative",
            }}
          >
            <div
              style={{
                position: "relative",
                transform: `translate(${parallax.x * 0.6}px, ${parallax.y * 0.4}px)`,
                transition: "transform 0.15s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "visible",
                zIndex: 4,
              }}
            >
              {/* 左侧 HUD 面板 */}
              <div
                style={{
                  position: "absolute",
                  left: "-320px",
                  display: viewportMode === "desktop" ? "flex" : "none",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: 16,
                  zIndex: 8,
                  overflow: "visible",
                }}
              >
                {CLUB_OVERVIEW_ITEMS.slice(0, 2).map((item, idx) => (
                  <HoverRevealCard
                    key={item.title}
                    item={item}
                    direction="left"
                    delay={idx * 0.15}
                    isDarkMode={isDarkMode}
                  />
                ))}
              </div>

              {/* 3D Globe — 低端设备使用 CSS 降级版 */}
              <ErrorBoundary fallback={<GlobeCanvasFallback size={globeSize} isDarkMode={isDarkMode} />}>
                <Suspense fallback={<GlobeCanvasFallback size={globeSize} isDarkMode={isDarkMode} />}>
                  {deviceTier === "low" ? (
                    <GlobeCanvasFallback size={globeSize} isDarkMode={isDarkMode} />
                  ) : (
                    <GlobeCanvas size={globeSize} isDarkMode={isDarkMode} quality={deviceTier} />
                  )}
                </Suspense>
              </ErrorBoundary>

              {/* 右侧 HUD 面板 */}
              <div
                style={{
                  position: "absolute",
                  right: "-320px",
                  display: viewportMode === "desktop" ? "flex" : "none",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  gap: 16,
                  zIndex: 8,
                  overflow: "visible",
                }}
              >
                {CLUB_OVERVIEW_ITEMS.slice(2, 4).map((item, idx) => (
                  <HoverRevealCard
                    key={item.title}
                    item={item}
                    direction="right"
                    delay={idx * 0.15}
                    isDarkMode={isDarkMode}
                  />
                ))}
              </div>
            </div>

            <style>{`
              .hover-reveal-card__spark {
                animation: sparkBlink 1.25s ease-in-out infinite;
              }

              .hover-reveal-card:hover .hover-reveal-card__spark {
                animation-duration: 0.7s;
              }

              @keyframes sparkBlink {
                0%, 100% {
                  opacity: 0.45;
                  transform: scale(0.92);
                  filter: brightness(0.95);
                }
                50% {
                  opacity: 1;
                  transform: scale(1.35);
                  filter: brightness(1.2);
                }
              }
            `}</style>

            <div style={{ textAlign: "center", marginTop: -12 }}>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  letterSpacing: 1,
                  lineHeight: 1.1,
                }}
              >
                电子科技大学成都学院<span style={{ color: "#0A84FF" }}>开放原子开源社团</span>
              </div>
              <div
                style={{
                  fontSize: 9,
                  color: "#94A3B8",
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  marginTop: 4,
                  fontFamily: '"Courier New", monospace',
                }}
              >
                Kecheng OpenAtom Open Source Club
              </div>
            </div>

            {isMobileViewport && (
              <div
                style={{
                  width: "92%",
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: 7,
                  marginTop: -1,
                }}
              >
                {CLUB_OVERVIEW_ITEMS.map((item) => (
                  <div
                    key={item.title}
                    data-mobile-overview-card="true"
                    data-mobile-overview-title={item.title}
                    style={{
                      minHeight: 54,
                      borderRadius: 12,
                      border: `1px solid var(--border-soft-rgba)`,
                      background: "var(--card-bg)",
                      boxShadow: "var(--shadow-card)",
                      backdropFilter: "blur(12px)",
                      WebkitBackdropFilter: "blur(12px)",
                      padding: "8px 9px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        minWidth: 0,
                      }}
                    >
                      <span
                        aria-hidden="true"
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: item.color,
                          boxShadow: `0 0 8px ${item.color}`,
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: "var(--text-bright-2)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.title}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 9,
                        lineHeight: 1.35,
                        color: "var(--text-muted)",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              {homeStats.map((stat) => (
                <div
                  key={stat.key}
                  style={{
                    padding: "2px 9px",
                    borderRadius: 999,
                    border: "1px solid var(--border-soft)",
                    background: "var(--card-bg-86)",
                    fontSize: 9,
                    color: "var(--text-secondary)",
                    fontWeight: 500,
                    backdropFilter: "blur(8px)",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <div
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: stat.color,
                    }}
                  />
                  {stat.label}
                </div>
              ))}
            </div>

            <div
              style={{
                width: dividerWidth,
                height: 1,
                background: "#E5E7EB",
                marginTop: 2,
              }}
            />

            <div
              style={{
                width: dashboardWidth,
                display: "grid",
                gridTemplateColumns: `repeat(auto-fit, minmax(${infoCardMinWidth}px, 1fr))`,
                gap: 8,
                marginTop: isDenseViewport ? 0 : 2,
              }}
            >
              {HOME_INFO_CARDS.map((item) => {
                const cardStyle = {
                  border: "1px solid var(--border-soft)",
                  borderRadius: 10,
                  background: "var(--card-bg-88)",
                  backdropFilter: "blur(6px)",
                  padding: isDenseViewport ? "5px 8px" : "7px 8px",
                  display: "flex",
                  flexDirection: "column",
                  gap: isDenseViewport ? 1 : 2,
                  minHeight: isDenseViewport ? 44 : 56,
                  textDecoration: "none",
                  color: "inherit",
                  cursor: item.href ? "pointer" : "default",
                  transition: item.href ? "transform 0.15s ease, box-shadow 0.15s ease" : undefined,
                };

                const content = (
                  <>
                    <div
                      style={{
                        fontSize: 8,
                        color: "#94A3B8",
                        textTransform: "uppercase",
                        letterSpacing: 1,
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      <span
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: "50%",
                          background: item.color,
                        }}
                      />
                      {item.title}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: "var(--text-bright)",
                        lineHeight: 1.2,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.value}
                    </div>
                    <div
                      style={{
                        fontSize: 8,
                        color: "#94A3B8",
                        letterSpacing: 0.3,
                      }}
                    >
                      {item.hint}
                    </div>
                  </>
                );

                if (item.href) {
                  return (
                    <a
                      key={item.title}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={cardStyle}
                    >
                      {content}
                    </a>
                  );
                }

                return (
                  <div key={item.title} style={cardStyle}>
                    {content}
                  </div>
                );
              })}
            </div>


          </div>

          <div
            style={{
              flex: 1,
              minHeight: 0,
              overflow: "hidden",
              display: "flex",
            }}
          >
            {/* WorksCarousel — 懒加载 + 错误边界 */}
            <ErrorBoundary>
              <Suspense
                fallback={
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: 0.3,
                      fontSize: 14,
                      color: isDarkMode ? "#94a3b8" : "#64748b",
                    }}
                  >
                    Loading…
                  </div>
                }
              >
                <WorksCarousel isDarkMode={isDarkMode} />
              </Suspense>
            </ErrorBoundary>
          </div>
        </>
      )}
    </main>
  );
}
//测试部署
