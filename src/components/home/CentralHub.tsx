"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, X, Zap } from "lucide-react";
import GlobeCanvas from "./GlobeCanvas";
import WorksCarousel from "./WorksCarousel";
import { RESOURCE_CATEGORIES } from "@/data/resources";

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
    title: "绀惧洟浠嬬粛",
    value:
      "寮€鏀惧師瀛愬紑婧愮ぞ鍥㈣仛鐒︾湡瀹為」鐩崗浣滐紝涓烘牎鍐呭悓瀛︽彁渚涗粠鍏ラ棬鍒拌繘闃剁殑宸ョ▼瀹炶返骞冲彴銆?,
    color: "#0A84FF",
  },
  {
    title: "娲诲姩瀹夋帓",
    value:
      "姣忓懆鎶€鏈垎浜€侀」鐩緥浼氫笌浣滃搧璺紨鎸佺画鎺ㄨ繘锛屽舰鎴愮ǔ瀹氬崗浣滆妭濂忋€?,
    color: "#10B981",
  },
  {
    title: "鎷涙柊淇℃伅",
    value:
      "闀挎湡寮€鏀炬嫑鏂帮紝娆㈣繋鍓嶇銆佸悗绔€佽璁°€佷骇鍝佸拰杩愮淮鏂瑰悜鍚屽鍔犲叆銆?,
    color: "#F59E0B",
  },
  {
    title: "鑱旂郴鏂瑰紡",
    value: "閭锛歬cos@opensouce-club.top / QQ缇わ細306601226",
    color: "#7C3AED",
  },
];

const HOME_INFO_CARDS = [
  {
    title: "绀惧洟鍩熷悕",
    value: "kcos.club",
    hint: "brand identity",
    color: "#0A84FF",
  },
  {
    title: "绀惧洟瀹樼綉",
    value: "opensouce-club.top",
    hint: "official website",
    color: "#10B981",
  },
  {
    title: "娲诲姩鐘舵€?,
    value: "weekly update",
    hint: "community active",
    color: "#F59E0B",
  },
];

const ORG_STATS_API = "/api/org-stats";
const ACTIVITIES_API = "/api/activities";

const DEFAULT_HOME_STATS = [
  { key: "members", label: "-- members", color: "#0A84FF" },
  { key: "projects", label: "-- projects", color: "#06E5CC" },
  { key: "stars", label: "-- stars", color: "#F59E0B" },
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
      label: `${formatCompactCount(orgStats?.members)} members`,
      color: "#0A84FF",
    },
    {
      key: "projects",
      label: `${formatCompactCount(orgStats?.projects)} projects`,
      color: "#06E5CC",
    },
    {
      key: "stars",
      label: `${formatCompactCount(orgStats?.stars)} stars`,
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
  // 缂備胶鍠嶇粩瀵告喆閿濆棛鈧晫鎸ч崟顒傜埍闂佸墽鍋撶敮鎾晬瀹€鍕┾偓搴㈢瑹閸喖鐏查柡鍌ゅ幗濡插摜绮╁▎蹇撴暥閻犲搫鐤囧ù鍡樻交濡粯笑濠㈣埖鐗犻幗濂稿箥閹惧磭纾婚柕?
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
  // 閻犙冨缁噣宕氶崱娆掝潶闁绘劗鎳撶槐鎴﹀触鎼搭垳绀夊☉鎿冨幖缁洪箖宕犻崫鍕幍濞村吋鑹鹃崹蹇涘礆閹峰瞼绠瑰☉鎿冧海椤╊偊鎯勯弽褏婀撮悘鐐存礈閵囨氨鎷犻敂鍓х煄闂佸墽鍋撶敮鎾Υ?
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
    // 缂佸顕ф慨鈺冪博椤栨艾绀嬮柛鎴ｎ嚙瑜把囨嚂濮樺崬濡介柛妤嬬磿婢ф牠鏁嶇仦钘夎摕闁告垹绮晶鐘绘儑閻斿壊鍔€闁瑰灚鎸哥槐鎴︽晬瀹€鍕級闁稿繐绉烽銈囨喆閿曚胶鍎查悹褑鍩囬埀?
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
            {cat.links.length} resources 鐠?闁绘劗鎳撻崵顔剧矚閾忚顏ら柛娆樺灥缁绘垿宕堕悙鏉跨槣濡?
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
              ? "闁告娲栭崵顕€宕￠敍鍕暬闁稿繐鐗撻。鈺冩喆閸剛绀夐柛娆忚嫰閸ゎ噣宕ョ仦鑲╊伇闁告绱曟晶鏍礃瀹ュ棗鈪电€殿喒鍋撻梺鍓у亾鐢挳濡?
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
  const [hint, setHint] = useState("闁哄倻鎳撻幃婊堟煥?WASD 闁瑰瓨鐗楁晶婊堝嫉閻戞鎷ㄩ柛鏂诲姀缁绘鎮扮仦鑺ュ€ゆ鐐剁堪閳?);
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
    setHint("闁哄倻鎳撻幃婊堟煥?WASD 闁瑰瓨鐗楁晶婊堝嫉閻戞鎷ㄩ柛鏂诲姀缁绘鎮扮仦鑺ュ€ゆ鐐剁堪閳?);
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
        setHint("闁诡収鍘奸弸鈺傛綇閻愵剙鐏?2048闁挎稑鑻ぐ鑼磼瑜忛悽濠氬礃閹绘帒姣婇柡鍥ㄦ尦閻濐噣宕氶崱鎰ㄥ亾?);
        return;
      }

      if (!hasMove(withNewTile)) {
        setStatus("over");
        setHint("鐎圭寮跺Λ銈夊矗椤栨粍鏆忕紒澶庮嚙婵晠鏁嶅畝鈧崑锝夊礄缂佹ɑ鐓€閻忕偐鍋撻梺鎻掔Т缁辨垿濡?);
        return;
      }

      setHint("缂備綀鍛暰闁告艾鐗嗛懟鐔兼儎缁嬫寧鍊遍柡浣规緲閻⊙囨晬鐏炶棄鏆遍柛鎴犵帛濞叉寧顨囧Ο鍝勭€婚柕?);
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
          <span>闁告帒妫欓弳?{score}</span>
          <span>婵縿鍎查弳?{moves}</span>
          <span>
            {status === "won"
              ? "闁绘鍩栭埀?闁艰櫕绮岄崺?
              : status === "over"
                ? "闁绘鍩栭埀?缂備焦鎸诲?
                : "闁绘鍩栭埀?閺夆晜绋栭、鎴炵▔?}
          </span>
          <span>闁哄牃鍋撳Δ?{best}</span>
        </div>
      </div>

      <div
        style={{
          position: "relative",
          height: 176,
          borderRadius: 10,
          border: `1px solid ${isDarkMode ? "#334155" : "#BFDBFE"}`,
          backgroundImage: `linear-gradient(${isDarkMode
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
            闁?
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
            闁?
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
            闁?
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
            闁?
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
          闁哄倹婢橀惇?
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
  // 濞戞搩鍘肩缓楣冨礌閸濆嫮鍘甸悹鎰枙閻绋夐妶鍥舵綒濞戞捁宕垫慨鎼佸箑娓氬﹦绐楀娑欘焾椤撶粯绋夋繝姘モ偓澶愬箑娓氬﹦绀夊ù鐘劚瀵?activeCategory 闁瑰灚鎸哥槐鎴︽儍閸曨偄鐎荤紒顐ｆ椤曟盯骞嗛崨顔瑰亾娴ｇ鍋?
  const [viewportMode, setViewportMode] = useState("desktop");
  const [isShortViewport, setIsShortViewport] = useState(false);
  const [homeStats, setHomeStats] = useState(DEFAULT_HOME_STATS);

  useEffect(() => {
    let cancelled = false;

    const syncHomeStats = async () => {
      try {
        const [orgStatsRes, activitiesRes] = await Promise.all([
          fetch(ORG_STATS_API, { cache: "no-store" }),
          fetch(ACTIVITIES_API, { cache: "no-store" }),
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
            { key: "projects", label: "projects unavailable", color: "#64748B" },
            { key: "stars", label: "stars unavailable", color: "#64748B" },
            { key: "activity", label: "events unavailable", color: "#64748B" },
          ]);
        }
      }
    };

    syncHomeStats();
    const refreshId = setInterval(syncHomeStats, 120000);
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
    ? 170
    : isDenseViewport
      ? isTabletViewport
        ? 146
        : 132
      : isTabletViewport
        ? 188
        : 206;
  const infoCardMinWidth = isMobileViewport ? 104 : isTabletViewport ? 136 : 120;
  const overviewCardMinWidth = isMobileViewport
    ? 132
    : isTabletViewport
      ? 150
      : 160;
  const homeStackGap = isDenseViewport ? 5 : 10;
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
        // 闂侇偄顦懙鎴﹀礆閸℃瑨顫﹂柛姘捣閺併倗鎲伴崱娆愮０閻忕偛鍊瑰ù娑㈠箲椤厼鐦滃銈夋涧閸炲鈧湱娅㈢槐婵堟喆閸℃凹娼曞☉鎾筹攻濞插潡宕撹箛濞惧亾濠婂棛绠婚柛蹇嬪劙缁斿瓨绋夐鍕憤缂佸本妞藉Λ鍧楀灳濠靛嫧鍋?
        <HologramPanel
          category={activeCategory}
          onClose={onClosePanel}
          isDarkMode={isDarkMode}
        />
      )}

      {!activeCategory && (
        // 闁哄牜浜埀顒€顦懙鎴﹀礆閸℃瑨顫﹂柡鍐啇缁辨繄浠﹂弴鐘粵濡絾鐗犻妴澶嬵渶濡鍚囧☉鎿冨幗閻忔垿宕橀崨顓у晣闁?
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
            {!isDenseViewport && (
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
                <span style={{ fontWeight: 1000 }}>鐎归潻缂氶弲鍫曟焻婢跺顏ラ柛鎺戞鐞氼偊骞嶉幘宕囩；閻犙冨缁噣妫冮姀鈩冪凡</span>
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
            )}

            <div
              style={{
                position: "relative",
                transform: `translate(${parallax.x * 0.6}px, ${parallax.y * 0.4}px)`,
                transition: "transform 0.15s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* 鐎归潻缂氶弲?HUD 闂傚牄鍨哄?*/}
              <div
                style={{
                  position: "absolute",
                  left: "-320px",
                  display: viewportMode === "desktop" ? "flex" : "none",
                  flexDirection: "column",
                  gap: 16,
                  zIndex: 2,
                }}
              >
                {CLUB_OVERVIEW_ITEMS.slice(0, 2).map((item, idx) => (
                  <div
                    key={item.title}
                    style={{
                      width: 220,
                      padding: "16px 18px",
                      borderRadius: 16,
                      background: isDarkMode ? "rgba(15, 23, 42, 0.35)" : "rgba(255, 255, 255, 0.4)",
                      backdropFilter: "blur(20px)",
                      WebkitBackdropFilter: "blur(20px)",
                      border: isDarkMode ? "1px solid rgba(255, 255, 255, 0.12)" : "1px solid rgba(255, 255, 255, 0.5)",
                      boxShadow: "0 15px 35px rgba(0,0,0,0.12)",
                      animation: `fadeInLeft 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${idx * 0.15}s both`,
                    }}
                  >
                    <div style={{ fontSize: 11, color: item.color, fontWeight: 700, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: item.color, boxShadow: `0 0 8px ${item.color}` }} />
                      {item.title}
                    </div>
                    <div style={{ fontSize: 11, color: isDarkMode ? "#94A3B8" : "#64748B", lineHeight: 1.5 }}>
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>

              <GlobeCanvas size={globeSize} />

              {/* 闁告瑥鍘栭弲?HUD 闂傚牄鍨哄?*/}
              <div
                style={{
                  position: "absolute",
                  right: "-320px",
                  display: viewportMode === "desktop" ? "flex" : "none",
                  flexDirection: "column",
                  gap: 16,
                  zIndex: 2,
                }}
              >
                {CLUB_OVERVIEW_ITEMS.slice(2, 4).map((item, idx) => (
                  <div
                    key={item.title}
                    style={{
                      width: 220,
                      padding: "16px 18px",
                      borderRadius: 16,
                      background: isDarkMode ? "rgba(15, 23, 42, 0.35)" : "rgba(255, 255, 255, 0.4)",
                      backdropFilter: "blur(20px)",
                      WebkitBackdropFilter: "blur(20px)",
                      border: isDarkMode ? "1px solid rgba(255, 255, 255, 0.12)" : "1px solid rgba(255, 255, 255, 0.5)",
                      boxShadow: "0 15px 35px rgba(0,0,0,0.12)",
                      animation: `fadeInRight 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${idx * 0.15}s both`,
                    }}
                  >
                    <div style={{ fontSize: 11, color: item.color, fontWeight: 700, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: item.color, boxShadow: `0 0 8px ${item.color}` }} />
                      {item.title}
                    </div>
                    <div style={{ fontSize: 11, color: isDarkMode ? "#94A3B8" : "#64748B", lineHeight: 1.5 }}>
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
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
                缂佸鍨堕崹?span style={{ color: "#0A84FF" }}>鐎殿喒鍋撻柡鈧幆褍鏂ч悗娑欏姇缁辨垵鈹冮幇顔轰沪闁?/span>
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
              {homeStats.map((stat) => (
                <div
                  key={stat.key}
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
                    padding: isDenseViewport ? "5px 8px" : "7px 8px",
                    display: "flex",
                    flexDirection: "column",
                    gap: isDenseViewport ? 1 : 2,
                    minHeight: isDenseViewport ? 44 : 56,
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
