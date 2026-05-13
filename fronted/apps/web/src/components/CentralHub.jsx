import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, X, Zap } from "lucide-react";
import GlobeCanvas from "./GlobeCanvas";
import WorksCarousel from "./WorksCarousel";
import { RESOURCE_CATEGORIES } from "../data/resources";

const TAG_COLORS = {
  Learning: { bg: "#EFF6FF", text: "#2563EB", border: "#BFDBFE" },
  Practice: { bg: "#F0FDF4", text: "#059669", border: "#BBF7D0" },
  Research: { bg: "#FFF7ED", text: "#EA580C", border: "#FED7AA" },
  Papers: { bg: "#FAF5FF", text: "#7C3AED", border: "#DDD6FE" },
  Course: { bg: "#F0FDF4", text: "#059669", border: "#BBF7D0" },
  Campus: { bg: "#EFF6FF", text: "#0A84FF", border: "#BFDBFE" },
  Life: { bg: "#FFFBEB", text: "#F59E0B", border: "#FDE68A" },
  Dev: { bg: "#F1F5F9", text: "#374151", border: "#E2E8F0" },
  Mirror: { bg: "#EFF6FF", text: "#0A84FF", border: "#BFDBFE" },
  IDE: { bg: "#FAF5FF", text: "#7C3AED", border: "#DDD6FE" },
  DevOps: { bg: "#F0FDF4", text: "#059669", border: "#BBF7D0" },
  Docs: { bg: "#F8FAFC", text: "#64748B", border: "#E2E8F0" },
};

const CLUB_OVERVIEW_ITEMS = [
  {
    title: "社团介绍",
    value:
      "科成开放原子开源社团聚焦真实项目协作，面向校内同学提供从入门到进阶的工程实践平台。",
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
    value: "邮箱：kcos@opensouce-club.top ｜ 社团QQ群：306601226",
    color: "#7C3AED",
  },
];

const HOME_STATS = [
  { label: "42 members", color: "#0A84FF" },
  { label: "18 projects", color: "#06E5CC" },
  { label: "1.2k stars", color: "#F59E0B" },
  { label: "year-round activity", color: "#10B981" },
];

const HOME_INFO_CARDS = [
  {
    title: "社团域名",
    value: "kcos.club",
    hint: "brand identity",
    color: "#0A84FF",
  },
  {
    title: "社团官网",
    value: "opensouce-club.top",
    hint: "official website",
    color: "#10B981",
  },
  {
    title: "活动状态",
    value: "weekly update",
    hint: "community active",
    color: "#F59E0B",
  },
];

const MINI_GAME_BACKGROUND_URL =
  "https://opengameart.org/sites/default/files/back_3.png";

function getLinkMeta(url) {
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

function HologramPanel({ category, onClose, isDarkMode }) {
  const [hoveredLink, setHoveredLink] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const lastTapRef = useRef({ index: null, ts: 0 });
  const cat = RESOURCE_CATEGORIES.find((c) => c.id === category);

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
    if (meta.isExternal) {
      window.open(meta.href, "_blank", "noopener,noreferrer");
      return;
    }
    window.location.href = meta.href;
  };

  const handleMobileCardAction = (e, link, index) => {
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
              color: isDarkMode ? "#F8FAFC" : "#0F172A",
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
            border: `1px solid ${isDarkMode ? "#475569" : "#E5E7EB"}`,
            background: isDarkMode ? "#111827" : "white",
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
              onClick={(e) => handleMobileCardAction(e, link, i)}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                minHeight: 84,
                padding: "10px 12px",
                borderRadius: 10,
                border: `1px solid ${isHovered ? cat.color + "55" : isDarkMode ? "#334155" : "#E5E7EB"}`,
                background: isDarkMode ? "#111827" : "white",
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
                  color: isDarkMode ? "#E2E8F0" : "#0F172A",
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
          background: isDarkMode ? "#0F172A" : "white",
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
                color: isDarkMode ? "#F8FAFC" : "#0F172A",
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
      `}</style>
    </div>
  );
}

function MiniTapGame({ isDarkMode = false }) {
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
      0: { bg: isDarkMode ? "#0F172A99" : "#FFFFFF99", color: "#94A3B8" },
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
        border: `1px solid ${isDarkMode ? "#334155" : "#E2E8F0"}`,
        borderRadius: 12,
        background: isDarkMode
          ? "rgba(15,23,42,0.75)"
          : "rgba(255,255,255,0.9)",
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
            color: isDarkMode ? "#CBD5E1" : "#64748B",
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
          border: `1px solid ${isDarkMode ? "#334155" : "#BFDBFE"}`,
          backgroundImage: `linear-gradient(${
            isDarkMode
              ? "rgba(15,23,42,0.35), rgba(15,23,42,0.55)"
              : "rgba(255,255,255,0.35), rgba(241,245,249,0.45)"
          }), url(${MINI_GAME_BACKGROUND_URL})`,
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
                  border: `1px solid ${isDarkMode ? "#334155" : "#D1D5DB"}`,
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
            style={{ fontSize: 10, color: isDarkMode ? "#94A3B8" : "#64748B" }}
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
  parallax,
  onClosePanel,
  isDarkMode = false,
}) {
  const [viewportMode, setViewportMode] = useState("desktop");

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const syncViewportMode = () => {
      const width = window.innerWidth;
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
  const globeSize = isMobileViewport ? 170 : isTabletViewport ? 188 : 206;
  const infoCardMinWidth = isMobileViewport ? 104 : isTabletViewport ? 136 : 120;
  const overviewCardMinWidth = isMobileViewport
    ? 132
    : isTabletViewport
      ? 150
      : 160;

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
        overflow: "hidden",
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
        <HologramPanel
          category={activeCategory}
          onClose={onClosePanel}
          isDarkMode={isDarkMode}
        />
      )}

      {!activeCategory && (
        <>
          <div
            style={{
              flex: "0 0 auto",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              paddingTop: isMobileViewport ? 10 : 14,
              gap: 10,
              position: "relative",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: isDarkMode
                  ? "rgba(15,23,42,0.92)"
                  : "rgba(255,255,255,0.9)",
                border: `1px solid ${isDarkMode ? "#334155" : "#E5E7EB"}`,
                borderRadius: 999,
                padding: "3px 11px",
                fontSize: 10,
                color: "#64748B",
                backdropFilter: "blur(8px)",
              }}
            >
              <Zap size={10} color="#0A84FF" />
              <span>选择分类打开资源面板</span>
              <span
                style={{
                  width: 1,
                  height: 10,
                  background: "#E5E7EB",
                  display: "inline-block",
                  verticalAlign: "middle",
                }}
              />
              <span style={{ color: "#0A84FF", fontWeight: 500 }}>
                KCOS.CLUB
              </span>
            </div>

            <div
              style={{
                transform: `translate(${parallax.x * 0.6}px, ${parallax.y * 0.4}px)`,
                transition: "transform 0.15s ease",
              }}
            >
              <GlobeCanvas size={globeSize} />
            </div>

            <div style={{ textAlign: "center", marginTop: -12 }}>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: isDarkMode ? "#F8FAFC" : "#0F172A",
                  letterSpacing: 1,
                  lineHeight: 1.1,
                }}
              >
                科成<span style={{ color: "#0A84FF" }}>开放原子开源社团</span>
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

            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              {HOME_STATS.map((p) => (
                <div
                  key={p.label}
                  style={{
                    padding: "2px 9px",
                    borderRadius: 999,
                    border: `1px solid ${isDarkMode ? "#334155" : "#E5E7EB"}`,
                    background: isDarkMode
                      ? "rgba(15,23,42,0.86)"
                      : "rgba(255,255,255,0.8)",
                    fontSize: 9,
                    color: isDarkMode ? "#CBD5E1" : "#374151",
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
                      background: p.color,
                    }}
                  />
                  {p.label}
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
                marginTop: 2,
              }}
            >
              {HOME_INFO_CARDS.map((item) => (
                <div
                  key={item.title}
                  style={{
                    border: `1px solid ${isDarkMode ? "#334155" : "#E5E7EB"}`,
                    borderRadius: 10,
                    background: isDarkMode
                      ? "rgba(15,23,42,0.88)"
                      : "rgba(255,255,255,0.86)",
                    backdropFilter: "blur(6px)",
                    padding: "7px 8px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    minHeight: 56,
                  }}
                >
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
                      color: isDarkMode ? "#E2E8F0" : "#334155",
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
                </div>
              ))}
            </div>

            <div
              style={{
                width: dashboardWidth,
                border: `1px solid ${isDarkMode ? "#334155" : "#E2E8F0"}`,
                borderRadius: 12,
                background: isDarkMode
                  ? "rgba(15,23,42,0.86)"
                  : "rgba(255,255,255,0.88)",
                backdropFilter: "blur(6px)",
                padding: "8px 9px",
                display: "grid",
                gap: 7,
              }}
            >
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
                    color: "#0A84FF",
                    letterSpacing: 1.2,
                    fontWeight: 700,
                    fontFamily: '"Courier New", monospace',
                  }}
                >
                  CLUB OVERVIEW
                </span>
                <span style={{ fontSize: 9, color: "#94A3B8" }}>
                  社团信息总览
                </span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(auto-fit, minmax(${overviewCardMinWidth}px, 1fr))`,
                  gap: 7,
                }}
              >
                {CLUB_OVERVIEW_ITEMS.map((item) => (
                  <div
                    key={item.title}
                    style={{
                      border: `1px solid ${item.color}30`,
                      borderRadius: 10,
                      background: isDarkMode ? "#0F172A" : "#FFFFFF",
                      padding: "7px 8px",
                      display: "grid",
                      gap: 3,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        color: item.color,
                        fontWeight: 700,
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
                        fontSize: 10,
                        color: isDarkMode ? "#CBD5E1" : "#475569",
                        lineHeight: 1.45,
                      }}
                    >
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
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
            <WorksCarousel isDarkMode={isDarkMode} />
          </div>
        </>
      )}
    </main>
  );
}
