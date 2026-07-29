"use client";
import { useEffect, useRef, useState } from "react";
import {
  Star,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Pause,
  Play,
  TrendingUp,
  Layers,
  Radar,
  Sparkles,
} from "lucide-react";
import TechBackground from "./TechBackground";
import { trackOutboundClick } from "@/lib/track-outbound";

const PACMAN_BEST_KEY = "kcos_pacman_best";
const PACMAN_EASY = {
  startLives: 10,
  tickMs: 320,
  frightenedTicks: 220,
  // Higher number means ghosts move less frequently.
  ghostMoveDivisorByLevel: [9, 8, 7],
};
const THEME_TRANSITION_DURATION = "var(--theme-transition-duration, 360ms)";
const THEME_TRANSITION_EASE = "var(--theme-transition-ease, cubic-bezier(0.22, 1, 0.36, 1))";
const THEME_SURFACE_TRANSITION = [
  `background ${THEME_TRANSITION_DURATION} ${THEME_TRANSITION_EASE}`,
  `background-color ${THEME_TRANSITION_DURATION} ${THEME_TRANSITION_EASE}`,
  `border-color ${THEME_TRANSITION_DURATION} ${THEME_TRANSITION_EASE}`,
  `color ${THEME_TRANSITION_DURATION} ${THEME_TRANSITION_EASE}`,
  `box-shadow ${THEME_TRANSITION_DURATION} ${THEME_TRANSITION_EASE}`,
  `filter ${THEME_TRANSITION_DURATION} ${THEME_TRANSITION_EASE}`,
  `backdrop-filter ${THEME_TRANSITION_DURATION} ${THEME_TRANSITION_EASE}`,
  `-webkit-backdrop-filter ${THEME_TRANSITION_DURATION} ${THEME_TRANSITION_EASE}`,
].join(", ");
const QUICK_SURFACE_TRANSITION = `transform 0.18s ease, opacity 0.18s ease, ${THEME_SURFACE_TRANSITION}`;
const PACMAN_LEVEL_TEMPLATES = [
  [
    "###########",
    "#o..#....o#",
    "#.##.#.##.#",
    "#...P.....#",
    "#.###.#.#.#",
    "#B..#K..I.#",
    "###.#.###.#",
    "#...#.....#",
    "#.##.#.##.#",
    "#....#..C.#",
    "###########",
  ],
  [
    "###########",
    "#o..#...#.o",
    "#.##.#.#..#",
    "#....#.#..#",
    "#.#P.#.#.##",
    "#B..##..I.#",
    "#.#....##.#",
    "#.#.##....#",
    "#..K#..##.#",
    "#C#...#...#",
    "###########",
  ],
  [
    "###########",
    "#o..#.....#",
    "##.#.###..#",
    "#..#...#..#",
    "#..###.#.##",
    "#B..P..I..#",
    "#.##.#.##.#",
    "#..#.#....#",
    "#..#K.###.#",
    "#C...#...o#",
    "###########",
  ],
];

const PACMAN_DIR: Record<string, { dx: number; dy: number; label: string; angle: number }> = {
  up: { dx: 0, dy: -1, label: "↑", angle: 270 },
  down: { dx: 0, dy: 1, label: "↓", angle: 90 },
  left: { dx: -1, dy: 0, label: "←", angle: 180 },
  right: { dx: 1, dy: 0, label: "→", angle: 0 },
};

const PACMAN_GHOST_META: Record<string, { id: string; color: string; corner: { x: number; y: number } }> = {
  B: { id: "blinky", color: "#EF4444", corner: { x: 9, y: 1 } },
  K: { id: "pinky", color: "#EC4899", corner: { x: 1, y: 1 } },
  I: { id: "inky", color: "#22D3EE", corner: { x: 9, y: 9 } },
  C: { id: "clyde", color: "#F97316", corner: { x: 1, y: 9 } },
};

const OPPOSITE_DIR = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

const wrapX = (x: number, width: number): number => {
  if (x < 0) return width - 1;
  if (x >= width) return 0;
  return x;
};

const isWall = (board: string[][], x: number, y: number): boolean => {
  if (y < 0 || y >= board.length) return true;
  const wx = wrapX(x, board[0].length);
  return board[y][wx] === "#";
};

const countPellets = (board: string[][]): number =>
  board.flat().filter((c) => c === "." || c === "o").length;

const manhattan = (a: { x: number; y: number }, b: { x: number; y: number }, width: number): number => {
  const dx = Math.abs(a.x - b.x);
  const wrapDx = Math.min(dx, width - dx);
  return wrapDx + Math.abs(a.y - b.y);
};

const createPacmanRound = ({
  level = 1,
  score = 0,
  lives = PACMAN_EASY.startLives,
  totalLevels = PACMAN_LEVEL_TEMPLATES.length,
} = {}) => {
  const safeLevel = Math.max(1, Math.min(totalLevels, level));
  const template = PACMAN_LEVEL_TEMPLATES[safeLevel - 1];
  const board = template.map((row) => row.split(""));

  let pacSpawn = { x: 1, y: 1 };
  const ghosts = [];
  for (let y = 0; y < board.length; y += 1) {
    for (let x = 0; x < board[y].length; x += 1) {
      const cell = board[y][x];
      if (cell === "P") {
        pacSpawn = { x, y };
        board[y][x] = " ";
      } else if (PACMAN_GHOST_META[cell]) {
        const ghostMeta = PACMAN_GHOST_META[cell];
        ghosts.push({
          marker: cell,
          id: ghostMeta.id,
          color: ghostMeta.color,
          corner: ghostMeta.corner,
          x,
          y,
          spawnX: x,
          spawnY: y,
          dir: "left",
          respawnTicks: 0,
        });
        board[y][x] = " ";
      }
    }
  }

  return {
    board,
    pac: { ...pacSpawn },
    pacSpawn,
    ghosts,
    dir: "left",
    nextDir: "left",
    score,
    lives,
    level: safeLevel,
    totalLevels,
    running: false,
    finished: false,
    frightenedTicks: 0,
    ghostCombo: 0,
    tick: 0,
    status: `第 ${safeLevel}/${totalLevels} 关（新手最慢模式）`,
  };
};

const resetPacmanActors = (state: any): any => ({
  ...state,
  pac: { ...state.pacSpawn },
  dir: "left",
  nextDir: "left",
  frightenedTicks: 0,
  ghostCombo: 0,
  ghosts: (state.ghosts || []).map((ghost: any) => ({
    ...ghost,
    x: ghost.spawnX,
    y: ghost.spawnY,
    dir: "left",
    respawnTicks: 0,
  })),
});

const chooseGhostDirection = (
  ghost: any,
  pac: any,
  pacDir: string,
  board: string[][],
  frightened: boolean,
  tick: number
): string => {
  const width = board[0].length;
  const options = Object.entries(PACMAN_DIR)
    .map(([key, step]) => ({
      key,
      x: wrapX(ghost.x + step.dx, width),
      y: ghost.y + step.dy,
    }))
    .filter((option) => !isWall(board, option.x, option.y));

  if (!options.length) return ghost.dir;

  const filtered =
    options.length > 1
      ? options.filter((option) => option.key !== OPPOSITE_DIR[ghost.dir as keyof typeof OPPOSITE_DIR])
      : options;

  if (frightened) {
    const idx = (tick + ghost.x + ghost.y) % filtered.length;
    return filtered[idx].key;
  }

  const forward = PACMAN_DIR[pacDir as keyof typeof PACMAN_DIR] || PACMAN_DIR.left;
  let target = { ...pac };
  if (ghost.id === "pinky") {
    target = {
      x: wrapX(pac.x + forward.dx * 2, width),
      y: pac.y + forward.dy * 2,
    };
  } else if (ghost.id === "inky") {
    target = {
      x: wrapX(pac.x + ((tick % 4) - 2), width),
      y: pac.y + (tick % 3) - 1,
    };
  } else if (ghost.id === "clyde") {
    const distToPac = manhattan(ghost, pac, width);
    target = distToPac > 5 ? pac : ghost.corner;
  }

  filtered.sort((a, b) => {
    const da = manhattan(a, target, width);
    const db = manhattan(b, target, width);
    return da - db;
  });

  return filtered[0].key;
};

function getContributorsForWork(work: any, repoContributors: Record<string, any[]> = {}) {
  // 使用 GitHub API 异步获取的真实贡献者
  if (work.projectUrl && repoContributors[work.projectUrl] && repoContributors[work.projectUrl].length > 0) {
    return repoContributors[work.projectUrl];
  }
  // 无数据时返回空数组，不再使用硬编码 fallback
  return [];
}

const getAvatarFallbackText = (login = "") => {
  const normalized = String(login || "").trim();
  return (normalized.slice(0, 2) || "?").toUpperCase();
};

function ContributorAvatarImage({ contributor, tint }: { contributor: any; tint: string }) {
  const [loadFailed, setLoadFailed] = useState(!contributor?.avatar);

  if (loadFailed) {
    return (
      <span
        aria-hidden="true"
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: tint,
          fontSize: 7,
          fontWeight: 800,
          lineHeight: 1,
          background: `${tint}14`,
        }}
      >
        {getAvatarFallbackText(contributor?.login)}
      </span>
    );
  }

  return (
    <img
      src={contributor.avatar}
      alt={`${contributor.login} GitHub avatar`}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setLoadFailed(true)}
      style={{ width: "100%", height: "100%", objectFit: "cover" }}
    />
  );
}

function CardBody({
  work,
  isDarkMode = false,
  isCenter = false,
  hoveredRole = null,
  setHoveredRole = () => {},
  repoContributors = {}
}: {
  work: any;
  isDarkMode?: boolean;
  isCenter?: boolean;
  hoveredRole?: any;
  setHoveredRole?: (role: any) => void;
  repoContributors?: Record<string, any[]>;
}) {
  return (
    <>
      <div
        style={{
          height: 2.5,
          background: `${work.color}CC`,
          borderRadius: 3,
          marginBottom: 3,
          flexShrink: 0
        }}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
          flexShrink: 0
        }}
      >
        <div
          style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}
        >
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: isDarkMode ? "rgba(255,255,255,0.06)" : `${work.color}10`,
              border: `1px solid ${isDarkMode ? "rgba(255,255,255,0.15)" : `${work.color}2E`}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 8,
              fontWeight: 700,
              color: work.color,
              flexShrink: 0,
            }}
          >
            {work.avatar}
          </div>
          <span
            style={{
              fontSize: 9,
              color: "var(--text-muted)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {work.author}
          </span>
        </div>

        <span
          style={{
            fontSize: 8,
            padding: "1px 6px",
            borderRadius: 999,
            border: "var(--border-status)",
            color: "var(--text-status)",
            background: "var(--bg-status)",
            flexShrink: 0,
            maxWidth: 62,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={work.status}
        >
          {work.status}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--text-primary)",
            lineHeight: 1.25,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {work.title}
        </div>
        <div
          style={{
            fontSize: 10,
            color: "var(--text-muted)",
            marginTop: 1,
            lineHeight: 1.35,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: isCenter ? 2 : 3, // 激活卡片由网格压缩空间
          }}
        >
          {work.desc}
        </div>

        {/* 激活卡片内部：新增 GitHub Contribution Graph 极小发光全息网格 */}
        {isCenter && (
          <div style={{ display: "flex", flexDirection: "column", gap: 3, marginTop: 7, borderTop: "var(--border-soft-rgba-2)", paddingTop: 6, flexShrink: 0 }}>
            <div style={{
              fontSize: 7.5,
              color: "var(--text-dim)",
              letterSpacing: 0.5,
              textTransform: "uppercase",
              fontFamily: '"Courier New", monospace',
              fontWeight: 700
            }}>
              CONTRIBUTIONS // ACTIVE CURVE
            </div>
            <div style={{ display: "flex", gap: 2.5, marginTop: 1 }}>
              {(() => {
                const contributors = getContributorsForWork(work, repoContributors);
                const totalCommits = contributors.reduce((sum, c: any) => sum + (c.contributions || 0), 0);

                return Array.from({ length: 14 }).map((_, colIdx) => (
                  <div key={colIdx} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {Array.from({ length: 3 }).map((_, rowIdx) => {
                      const index = colIdx * 3 + rowIdx;
                      let hash = totalCommits * (index + 7);
                      contributors.forEach((c: any) => {
                        for (let i = 0; i < c.login.length; i++) {
                          hash += c.login.charCodeAt(i) * (i + 1);
                        }
                      });

                      const activeVal = hash % 100;
                      // 提交数越多，绿墙越密越亮。提交较少时稀疏。
                      const densityThreshold = Math.min(85, Math.max(25, 20 + totalCommits / 2));
                      const isActive = activeVal <= densityThreshold;
                      const level = isActive ? (activeVal % 3) + 1 : 0; // 0, 1, 2, 3

                      const bg = level === 0
                        ? "var(--border-soft-rgba-2)"
                        : level === 1
                          ? `${work.color}22`
                          : level === 2
                            ? `${work.color}66`
                            : `${work.color}cc`;

                      return (
                        <div
                          key={rowIdx}
                          style={{
                            width: 4.5,
                            height: 4.5,
                            borderRadius: 0.8,
                            background: bg,
                            boxShadow: level === 3 ? `0 0 4px ${work.color}` : "none",
                          }}
                        />
                      );
                    })}
                  </div>
                ));
              })()}
            </div>
          </div>
        )}
      </div>

      {/* 技术栈 Tag 墙 */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 4,
          marginTop: isCenter ? 6 : "auto",
          flexShrink: 0
        }}
      >
        {work.tags.slice(0, 3).map((tag: string) => (
          <span
            key={tag}
            style={{
              fontSize: 8,
              fontWeight: 600,
              padding: "2px 6px",
              borderRadius: 6,
              border: "var(--border-tag)",
              color: "var(--text-chip)",
              background: "var(--bg-tag)",
              display: "inline-flex",
              alignItems: "center"
            }}
          >
            {isCenter && (
              <span style={{
                width: 3.5,
                height: 3.5,
                borderRadius: "50%",
                background: work.color,
                marginRight: 4,
                display: "inline-block",
                boxShadow: `0 0 4px ${work.color}`
              }} />
            )}
            {tag}
          </span>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 4,
          paddingTop: 5,
          borderTop: "var(--border-divider)",
          flexShrink: 0,
          position: "relative"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
          <Star size={10} color="#F59E0B" fill="#F59E0B" />
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: "var(--text-muted)",
              fontFamily: '"Courier New", monospace',
            }}
          >
            {work.stars}
          </span>
        </div>

        {/* 贡献者 Avatar 头像精密堆叠 */}
        {isCenter && (
          <div style={{ display: "flex", alignItems: "center", position: "relative" }}>
            {getContributorsForWork(work, repoContributors).map((c: any, idx: number, arr: any[]) => (
              <a
                key={c.login}
                href={c.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`打开 ${c.login} 的 GitHub 主页`}
                onClick={(e) => e.stopPropagation()}
                onMouseEnter={() => setHoveredRole({ login: c.login, contributions: c.contributions })}
                onMouseLeave={() => setHoveredRole(null)}
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  border: "var(--border-avatar-2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                  background: "var(--bg-icon-2)",
                  cursor: "pointer",
                  marginLeft: idx === 0 ? 0 : -4,
                  zIndex: arr.length - idx,
                  transition: QUICK_SURFACE_TRANSITION,
                  overflow: "hidden",
                  textDecoration: "none",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "translateY(-1.5px)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <ContributorAvatarImage contributor={c} tint={work.color} />
              </a>
            ))}

            {/* 卡片内部浮空微型 Tooltip */}
            {hoveredRole && (
              <div
                style={{
                  position: "absolute",
                  bottom: 20,
                  right: 0,
                  background: "var(--card-bg-frost-3)",
                  border: `1px solid ${work.color}bb`,
                  borderRadius: 4,
                  padding: "3px 6px",
                  fontSize: 7.5,
                  color: "var(--text-primary)",
                  whiteSpace: "nowrap",
                  zIndex: 999,
                  boxShadow: `0 2px 10px rgba(0,0,0,0.35)`,
                  backdropFilter: "blur(6px)",
                  pointerEvents: "none"
                }}
              >
                {hoveredRole.login}
                {hoveredRole.contributions !== undefined && (
                  <span style={{ marginLeft: 4, opacity: 0.8, color: work.color }}>
                    ({hoveredRole.contributions} contributions)
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function WorkCard({
  work,
  style,
  isCenter,
  onClick,
  isDarkMode = false,
  hoveredRole = null,
  setHoveredRole = () => {},
  repoContributors = {}
}: {
  work: any;
  style?: React.CSSProperties;
  isCenter: boolean;
  onClick: () => void;
  isDarkMode?: boolean;
  hoveredRole?: any;
  setHoveredRole?: (role: any) => void;
  repoContributors?: Record<string, any[]>;
}) {
  return (
    <button
      onClick={onClick}
      type="button"
      data-ui-touch="true"
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: 196,
        marginLeft: -98,
        marginTop: -108,
        height: 216,
        background: "var(--card-bg-work)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: `1px solid ${isCenter ? work.color + "55" : "var(--border-tag)"}`,
        borderRadius: 14,
        padding: "10px 10px",
        cursor: "pointer",
        transition:
          `transform 0.45s cubic-bezier(0.25,0.46,0.45,0.94), opacity 0.35s ease, ${THEME_SURFACE_TRANSITION}`,
        boxShadow: isCenter
          ? (isDarkMode ? `0 0 16px ${work.color}24, 0 6px 14px rgba(0,0,0,0.4)` : `0 0 16px ${work.color}12, 0 6px 14px rgba(148,163,184,0.16)`)
          : "none",
        display: "flex",
        flexDirection: "column",
        gap: 5,
        userSelect: "none",
        textAlign: "left",
        ...style,
      }}
      aria-label={isCenter ? `打开作品 ${work.title}` : `聚焦作品 ${work.title}`}
      title={isCenter ? work.desc : "查看详情"}
    >
      <CardBody
        work={work}
        isDarkMode={isDarkMode}
        isCenter={isCenter}
        hoveredRole={hoveredRole}
        setHoveredRole={setHoveredRole}
        repoContributors={repoContributors}
      />
    </button>
  );
}

function MobileWorkCard({
  work,
  isDarkMode = false,
  hoveredRole = null,
  setHoveredRole = () => {},
  repoContributors = {}
}: {
  work: any;
  isDarkMode?: boolean;
  hoveredRole?: any;
  setHoveredRole?: (role: any) => void;
  repoContributors?: Record<string, any[]>;
}) {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 332,
        margin: "0 auto",
        minHeight: 238,
        background: "var(--card-bg-work-m)",
        border: `1px solid ${isDarkMode ? `${work.color}45` : `${work.color}2E`}`,
        borderRadius: 14,
        padding: "12px 12px",
        boxShadow: isDarkMode
          ? `0 0 18px ${work.color}18, 0 8px 18px rgba(0,0,0,0.34)`
          : `0 0 14px ${work.color}10, 0 5px 14px rgba(148,163,184,0.14)`,
        display: "flex",
        flexDirection: "column",
        gap: 5,
        transition: THEME_SURFACE_TRANSITION,
      }}
    >
      <CardBody
        work={work}
        isDarkMode={isDarkMode}
        isCenter={true}
        hoveredRole={hoveredRole}
        setHoveredRole={setHoveredRole}
        repoContributors={repoContributors}
      />
    </div>
  );
}
function ListRow({
  work,
  isDarkMode = false,
}: {
  work: any;
  isDarkMode?: boolean;
}) {
  const baseBorder = "var(--list-border)";
  const hoverBorder = isDarkMode ? `${work.color}66` : "#DCE6F2";
  const baseBg = "var(--list-bg)";
  const hoverBg = "var(--work-bg-hover)";

  return (
    <button
      type="button"
      onClick={() => {
        trackOutboundClick({
          targetUrl: work.projectUrl,
          targetLabel: work.title,
          sourceContext: "works-carousel:list-row",
        });
        window.open(work.projectUrl, "_blank");
      }}
      data-ui-touch="true"
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 12px",
        borderRadius: 9,
        border: `1px solid ${baseBorder}`,
        background: baseBg,
        transition: QUICK_SURFACE_TRANSITION,
        cursor: "pointer",
        textAlign: "left",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = hoverBorder;
        e.currentTarget.style.background = hoverBg;
        e.currentTarget.style.transform = "translateY(-1px)";
        e.currentTarget.style.boxShadow = "var(--shadow-work-hover)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = baseBorder;
        e.currentTarget.style.background = baseBg;
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: work.color,
          flexShrink: 0,
          boxShadow: `0 0 6px ${work.color}`,
        }}
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--text-bright-2)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {work.title}
        </div>
        <div
          style={{
            fontSize: 10,
            color: "var(--text-desc)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {work.desc}
        </div>
      </div>

      <div style={{ display: "flex", gap: 3 }}>
        {work.tags.slice(0, 2).map((t: string) => (
          <span
            key={t}
            style={{
              fontSize: 8,
              padding: "1px 6px",
              borderRadius: 999,
              border: "var(--border-tag-2)",
              color: "var(--text-tag)",
              background: "var(--bg-tag-2)",
            }}
          >
            {t}
          </span>
        ))}
      </div>

      <div
        style={{ display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}
      >
        <Star size={9} color="#F59E0B" fill="#F59E0B" />
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: "var(--text-secondary)",
            fontFamily: '"Courier New", monospace',
          }}
        >
          {work.stars}
        </span>
      </div>
    </button>
  );
}

function InsightCard({ icon: Icon, label, value, tint, isDarkMode = false }: any) {
  return (
    <div
      style={{
        border: `1px solid ${isDarkMode ? "rgba(255,255,255,0.06)" : `${tint}24`}`,
        background: "var(--card-bg-work)",
        backdropFilter: isDarkMode ? "blur(12px)" : "none",
        WebkitBackdropFilter: isDarkMode ? "blur(12px)" : "none",
        borderRadius: 11,
        padding: "8px 9px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        boxShadow: isDarkMode ? "none" : "0 4px 6px rgba(148,163,184,0.05)",
        transition: THEME_SURFACE_TRANSITION,
      }}
    >
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: 8,
          background: `${tint}15`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={12} color={tint} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 7.5,
            color: "var(--text-dim)",
            letterSpacing: 0.2,
            textTransform: "uppercase",
            fontWeight: 700,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "var(--text-primary)",
            fontFamily: '"Courier New", monospace',
            marginTop: 1,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

export function PacmanMiniGame({ compact = false, standalone = false }) {
  const [game, setGame] = useState(() => createPacmanRound());
  const [best, setBest] = useState(0);
  const panelRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const stored = Number(localStorage.getItem(PACMAN_BEST_KEY) || 0);
    if (Number.isFinite(stored) && stored > 0) {
      const id = setTimeout(() => setBest(stored), 0);
      return () => clearTimeout(id);
    }
    return undefined;
  }, []);

  useEffect(() => {
    if (game.score <= best) return;
    const id = setTimeout(() => setBest(game.score), 0);
    if (typeof window !== "undefined") {
      localStorage.setItem(PACMAN_BEST_KEY, String(game.score));
    }
    return () => clearTimeout(id);
  }, [best, game.score]);

  const setDirection = (dir: string) => {
    setGame((prev) => {
      if (prev.finished || prev.lives <= 0) return prev;
      return {
        ...prev,
        nextDir: dir,
        running: true,
      };
    });
  };

  const focusPanel = () => {
    if (panelRef.current && typeof panelRef.current.focus === "function") {
      panelRef.current.focus();
    }
  };

  useEffect(() => {
    const keyToDir: Record<string, string> = {
      ArrowUp: "up",
      ArrowDown: "down",
      ArrowLeft: "left",
      ArrowRight: "right",
      w: "up",
      a: "left",
      s: "down",
      d: "right",
      W: "up",
      A: "left",
      S: "down",
      D: "right",
    };

    const onKeyDown = (e: any) => {
      const dir = keyToDir[e.key];
      if (!dir) return;
      e.preventDefault();
      setDirection(dir);
    };

    const node = panelRef.current;
    if (!node) return undefined;

    node.addEventListener("keydown", onKeyDown);
    return () => node.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!game.running) return undefined;

    const id = setInterval(() => {
      setGame((prev) => {
        if (!prev.running || prev.finished) return prev;
        if (!Array.isArray(prev.board) || !prev.pac) {
          return createPacmanRound({
            level: Number(prev.level) || 1,
            score: Number(prev.score) || 0,
            lives: Number(prev.lives) || PACMAN_EASY.startLives,
          });
        }

        const board = prev.board.map((row) => [...row]);
        const width = board[0].length;

        let score = Number(prev.score) || 0;
        let lives = Number(prev.lives) || PACMAN_EASY.startLives;
        let status = prev.status || "READY!";
        let frightenedTicks = Math.max(
          0,
          (Number(prev.frightenedTicks) || 0) - 1,
        );
        let ghostCombo = frightenedTicks > 0 ? Number(prev.ghostCombo) || 0 : 0;
        let dir = PACMAN_DIR[prev.dir] ? prev.dir : "left";

        const canMove = (x: number, y: number, direction: string): boolean => {
          const step = PACMAN_DIR[direction] || PACMAN_DIR.left;
          return !isWall(board, wrapX(x + step.dx, width), y + step.dy);
        };

        const requestedDir = PACMAN_DIR[prev.nextDir] ? prev.nextDir : dir;
        if (canMove(prev.pac.x, prev.pac.y, requestedDir)) {
          dir = requestedDir;
        }

        let pac = { ...prev.pac };
        if (canMove(pac.x, pac.y, dir)) {
          const step = PACMAN_DIR[dir];
          pac = {
            x: wrapX(pac.x + step.dx, width),
            y: pac.y + step.dy,
          };
        }

        const cell = board[pac.y][pac.x];
        if (cell === ".") {
          board[pac.y][pac.x] = " ";
          score += 10;
          status = "Waka! +10";
        } else if (cell === "o") {
          board[pac.y][pac.x] = " ";
          score += 50;
          frightenedTicks = PACMAN_EASY.frightenedTicks;
          ghostCombo = 0;
          status = "能量豆触发，幽灵进入惊吓状态";
        }

        const levelIdx = Math.max(
          0,
          Math.min(
            PACMAN_EASY.ghostMoveDivisorByLevel.length - 1,
            (Number(prev.level) || 1) - 1,
          ),
        );
        const baseDivisor = PACMAN_EASY.ghostMoveDivisorByLevel[levelIdx];
        const ghostMoveDivisor =
          frightenedTicks > 0 ? baseDivisor + 1 : baseDivisor;
        const shouldMoveGhosts =
          (Number(prev.tick) || 0) % ghostMoveDivisor === 0;

        let ghosts = (Array.isArray(prev.ghosts) ? prev.ghosts : []).map(
          (ghost, idx) => {
            if (ghost.respawnTicks > 0) {
              return { ...ghost, respawnTicks: ghost.respawnTicks - 1 };
            }
            if (!shouldMoveGhosts) {
              return ghost;
            }

            const frightened = frightenedTicks > 0;
            const nextGhostDir = chooseGhostDirection(
              ghost,
              pac,
              dir,
              board,
              frightened,
              (Number(prev.tick) || 0) + idx,
            );
            const step = PACMAN_DIR[nextGhostDir];
            const nx = wrapX(ghost.x + step.dx, width);
            const ny = ghost.y + step.dy;
            if (isWall(board, nx, ny)) {
              return { ...ghost, dir: nextGhostDir };
            }
            return {
              ...ghost,
              x: nx,
              y: ny,
              dir: nextGhostDir,
            };
          },
        );

        let pacCaught = false;
        ghosts = ghosts.map((ghost) => {
          if (ghost.x !== pac.x || ghost.y !== pac.y) return ghost;

          if (frightenedTicks > 0 && ghost.respawnTicks === 0) {
            const ghostScore = 200 * 2 ** Math.min(3, ghostCombo);
            score += ghostScore;
            ghostCombo += 1;
            status = `鍚冮 +${ghostScore}`;
            return {
              ...ghost,
              x: ghost.spawnX,
              y: ghost.spawnY,
              dir: "left",
              respawnTicks: 10,
            };
          }

          pacCaught = true;
          return ghost;
        });

        if (pacCaught) {
          lives -= 1;
          if (lives <= 0) {
            return {
              ...prev,
              board,
              pac,
              ghosts,
              score,
              lives: 0,
              running: false,
              finished: true,
              tick: (Number(prev.tick) || 0) + 1,
              status: "琚菇鐏垫姄鍒帮紝娓告垙缁撴潫",
            };
          }

          const reset = resetPacmanActors({
            ...prev,
            board,
            score,
            lives,
          });
          return {
            ...reset,
            running: true,
            finished: false,
            tick: (Number(prev.tick) || 0) + 1,
            status: `损失 1 条命，剩余 ${lives} 条命`,
          };
        }

        if (countPellets(board) === 0) {
          if (prev.level >= prev.totalLevels) {
            return {
              ...prev,
              board,
              pac,
              ghosts,
              score: score + 500,
              lives,
              running: false,
              finished: true,
              frightenedTicks: 0,
              ghostCombo: 0,
              tick: (Number(prev.tick) || 0) + 1,
              status: `三关通关，总分 ${score + 500}`,
            };
          }

          const nextRound = createPacmanRound({
            level: prev.level + 1,
            totalLevels: prev.totalLevels,
            score: score + 300,
            lives,
          });
          return {
            ...nextRound,
            running: true,
            tick: (Number(prev.tick) || 0) + 1,
            status: `进入第 ${nextRound.level} 关（过关奖励 +300）`,
          };
        }

        return {
          ...prev,
          board,
          pac,
          ghosts,
          score,
          lives,
          dir,
          frightenedTicks,
          ghostCombo,
          tick: (Number(prev.tick) || 0) + 1,
          status,
        };
      });
    }, PACMAN_EASY.tickMs);

    return () => clearInterval(id);
  }, [game.running]);

  const toggleStartPause = () => {
    setGame((prev) => {
      if (prev.finished || prev.lives <= 0) {
        return createPacmanRound();
      }
      return {
        ...prev,
        running: !prev.running,
        status: prev.running ? "已暂停" : "READY!",
      };
    });
  };

  const restart = () => {
    setGame(createPacmanRound());
  };

  const boardRows =
    Array.isArray(game.board) && game.board.length > 0
      ? game.board
      : createPacmanRound().board;
  const safeGhosts = Array.isArray(game.ghosts) ? game.ghosts : [];
  const safePac =
    game.pac && Number.isFinite(game.pac.x) && Number.isFinite(game.pac.y)
      ? game.pac
      : { x: 1, y: 1 };
  const safeTick = Number.isFinite(game.tick) ? game.tick : 0;
  const cellsX = boardRows[0].length;
  const cellsY = boardRows.length;
  const pacDir = PACMAN_DIR[game.dir] || PACMAN_DIR.left;
  const mouthGap = safeTick % 8 < 4 ? 70 : 28;
  const frightenedBlink =
    game.frightenedTicks > 0 && game.frightenedTicks < 18 && safeTick % 4 < 2;
  const panelWidth = standalone ? "min(100%, 520px)" : compact ? 196 : 230;
  const boardHeight = standalone
    ? "min(62vw, 440px)"
    : compact
      ? 146
      : 168;
  const handleBoardPointer = (x: number, y: number) => {
    const dx = x - safePac.x;
    const dy = y - safePac.y;
    if (Math.abs(dx) <= 0 && Math.abs(dy) <= 0) return;
    if (Math.abs(dx) > Math.abs(dy)) {
      setDirection(dx > 0 ? "right" : "left");
    } else {
      setDirection(dy > 0 ? "down" : "up");
    }
    focusPanel();
  };

  return (
    <div
      ref={panelRef}
      tabIndex={0}
      aria-label="Pac-Man hidden game panel"
      style={{
        position: standalone ? "relative" : "absolute",
        left: standalone ? undefined : compact ? 10 : 20,
        top: standalone ? undefined : compact ? 8 : 10,
        zIndex: 16,
        width: panelWidth,
        maxWidth: "100%",
        borderRadius: standalone ? 24 : 16,
        border: "1px solid #D6E7F7",
        background: "rgba(255,255,255,0.9)",
        backdropFilter: "blur(8px)",
        padding: standalone ? 16 : compact ? 9 : 12,
        display: "grid",
        gap: standalone ? 12 : 8,
        boxShadow: standalone ? "0 24px 60px rgba(15,23,42,0.12)" : "none",
        outline: "none",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 6,
          fontFamily: '"Courier New", monospace',
          fontSize: 11,
          color: "#4B5563",
        }}
      >
        <span style={{ color: "#F59E0B", fontWeight: 700 }}>PAC-MAN</span>
        <span>分数 {game.score}</span>
        <span>生命 {game.lives}</span>
        <span>关卡 {game.level}/{game.totalLevels}</span>
      </div>

      <div
        style={{
          borderRadius: 8,
          border: "1px solid #D6E7F7",
          padding: standalone ? 8 : 5,
          background: "#0F172A",
          display: "grid",
          gridTemplateColumns: "repeat(" + cellsX + ", 1fr)",
          gap: 1,
          height: boardHeight,
          aspectRatio: String(cellsX) + " / " + String(cellsY),
          position: "relative",
        }}
      >
        {boardRows.flatMap((row, y) =>
          row.map((cell, x) => {
            const ghost = safeGhosts.find((g) => g.x === x && g.y === y);
            const isPac = safePac.x === x && safePac.y === y;
            const isGhost = Boolean(ghost);
            const ghostFrightened =
              game.frightenedTicks > 0 && ghost && ghost.respawnTicks === 0;

            return (
              <div
                key={`${x}-${y}`}
                onClick={() => handleBoardPointer(x, y)}
                onMouseDown={() => focusPanel()}
                data-ui-touch="true"
                style={{
                  borderRadius: 2,
                  background:
                    cell === "#"
                      ? "linear-gradient(145deg,#1E3A8A,#1D4ED8)"
                      : "#111827",
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: cell === "#" ? "not-allowed" : "pointer",
                }}
              >
                {cell === "." && !isPac && !isGhost ? (
                  <span
                    style={{
                      width: 3,
                      height: 3,
                      borderRadius: "50%",
                      background: "#FDE68A",
                      display: "block",
                    }}
                  />
                ) : null}

                {cell === "o" && !isPac && !isGhost ? (
                  <span
                    style={{
                      width: safeTick % 8 < 4 ? 6 : 5,
                      height: safeTick % 8 < 4 ? 6 : 5,
                      borderRadius: "50%",
                      background: "#FBBF24",
                      boxShadow: "0 0 6px rgba(251,191,36,0.8)",
                      display: "block",
                    }}
                  />
                ) : null}

                {isPac ? (
                  <span
                    style={{
                      width: standalone ? 16 : 11,
                      height: standalone ? 16 : 11,
                      borderRadius: "50%",
                      background: `conic-gradient(from ${pacDir.angle + mouthGap / 2}deg, transparent 0deg ${mouthGap}deg, #FACC15 ${mouthGap}deg 360deg)`,
                      boxShadow: "0 0 7px rgba(250,204,21,0.7)",
                      display: "block",
                    }}
                  />
                ) : null}

                {isGhost ? (
                  <span
                    style={{
                      width: standalone ? 16 : 11,
                      height: standalone ? 16 : 11,
                      borderRadius: "50% 50% 35% 35%",
                      background: ghostFrightened
                        ? frightenedBlink
                          ? "#F8FAFC"
                          : "#60A5FA"
                        : (ghost?.color || "#EF4444"),
                      boxShadow: ghostFrightened
                        ? "0 0 7px rgba(96,165,250,0.7)"
                        : "0 0 6px rgba(248,250,252,0.25)",
                      position: "relative",
                      display: "block",
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        left: 2,
                        top: 2,
                        width: 2,
                        height: 2,
                        borderRadius: "50%",
                        background: "#FFFFFF",
                      }}
                    />
                    <span
                      style={{
                        position: "absolute",
                        right: 2,
                        top: 2,
                        width: 2,
                        height: 2,
                        borderRadius: "50%",
                        background: "#FFFFFF",
                      }}
                    />
                  </span>
                ) : null}
              </div>
            );
          }),
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: standalone ? 8 : 4,
        }}
      >
        <button
          type="button"
          onClick={() => setDirection("up")}
          data-ui-touch="true"
          style={{
            border: "1px solid #C7DCF4",
            borderRadius: 6,
            background: "#F1F7FF",
            fontSize: standalone ? 13 : 11,
            color: "#2563EB",
            cursor: "pointer",
            padding: standalone ? "8px 0" : "3px 0",
          }}
        >
          {PACMAN_DIR.up.label}
        </button>
        <button
          type="button"
          onClick={() => setDirection("left")}
          data-ui-touch="true"
          style={{
            border: "1px solid #C7DCF4",
            borderRadius: 6,
            background: "#F1F7FF",
            fontSize: standalone ? 13 : 11,
            color: "#2563EB",
            cursor: "pointer",
            padding: standalone ? "8px 0" : "3px 0",
          }}
        >
          {PACMAN_DIR.left.label}
        </button>
        <button
          type="button"
          onClick={() => setDirection("right")}
          data-ui-touch="true"
          style={{
            border: "1px solid #C7DCF4",
            borderRadius: 6,
            background: "#F1F7FF",
            fontSize: standalone ? 13 : 11,
            color: "#2563EB",
            cursor: "pointer",
            padding: standalone ? "8px 0" : "3px 0",
          }}
        >
          {PACMAN_DIR.right.label}
        </button>
        <button
          type="button"
          onClick={() => setDirection("down")}
          data-ui-touch="true"
          style={{
            border: "1px solid #C7DCF4",
            borderRadius: 6,
            background: "#F1F7FF",
            fontSize: standalone ? 13 : 11,
            color: "#2563EB",
            cursor: "pointer",
            padding: standalone ? "8px 0" : "3px 0",
          }}
        >
          {PACMAN_DIR.down.label}
        </button>
      </div>

      {standalone ? (
        <div
          style={{
            border: "1px solid #E2E8F0",
            borderRadius: 14,
            background: "#FFFFFF",
            padding: "10px 12px",
            display: "grid",
            gap: 6,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A" }}>
            操作方式
          </div>
          <div style={{ fontSize: 12, color: "#64748B", lineHeight: 1.6 }}>
            点击棋盘上吃豆人周围的位置可改变移动方向；键盘支持方向键；触屏设备可直接点击下方方向键。
          </div>
        </div>
      ) : null}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 6,
        }}
      >
        <button
          type="button"
          onClick={toggleStartPause}
          data-ui-touch="true"
          style={{
            border: "1px solid #BFDBFE",
            borderRadius: 999,
            background: "#EFF6FF",
            color: "#0A84FF",
            padding: "3px 10px",
            fontSize: 10,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {game.finished || game.lives <= 0
            ? "重开"
            : game.running
              ? "暂停"
              : "开始"}
        </button>
        <button
          type="button"
          onClick={restart}
          data-ui-touch="true"
          style={{
            border: "1px solid #E5E7EB",
            borderRadius: 999,
            background: "#FFFFFF",
            color: "#64748B",
            padding: "3px 10px",
            fontSize: 10,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          新局
        </button>
        <span
          style={{
            marginLeft: "auto",
            fontSize: 10,
            color: "#64748B",
            fontFamily: '"Courier New", monospace',
          }}
        >
          BEST {best}
        </span>
      </div>

      <div style={{ fontSize: 10, color: "#6B7280", lineHeight: 1.35 }}>
        {game.status}
      </div>
      <div style={{ fontSize: 9, color: "#94A3B8" }}>
        新手最慢模式：超慢速度、10条命、超长惊吓时间
      </div>
    </div>
  );
}

export default function WorksCarousel({ isDarkMode = false }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState("carousel");
  const [autoPlay, setAutoPlay] = useState(true);
  const [isInteracting, setIsInteracting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isShortViewport, setIsShortViewport] = useState(false);
  const [worksData, setWorksData] = useState<any[]>([]);
  const [worksSource, setWorksSource] = useState("loading");
  const [hoveredRole, setHoveredRole] = useState(null);
  const [repoContributors, setRepoContributors] = useState({});

  useEffect(() => {
    const repoMap = new Map<string, string>();
    worksData.forEach((w: any) => {
      if (w.projectUrl && w.projectUrl.includes("github.com/")) {
        const match = w.projectUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
        if (!match) return;
        const owner = match[1];
        const repo = match[2].replace(/\.git$/, "");
        repoMap.set(w.projectUrl, `${owner}/${repo}`);
      }
    });

    const abortController = new AbortController();
    const fetchRepoContributors = async () => {
      try {
        const repos = Array.from(repoMap.values());
        if (!repos.length) return;
        const res = await fetch(`/api/github-contributors?repos=${encodeURIComponent(repos.join(","))}`, {
          signal: abortController.signal,
        });
        if (!res.ok) throw new Error("GitHub contributors API error");
        const payload = await res.json();
        const contributors = payload?.contributors || {};
        const nextMap: Record<string, any[]> = {};
        repoMap.forEach((repoKey, url) => {
          nextMap[url] = Array.isArray(contributors[repoKey]) ? contributors[repoKey] : [];
        });
        setRepoContributors(nextMap);
      } catch {
        // Fallback silently if API unavailable
      }
    };

    void fetchRepoContributors();

    return () => {
      abortController.abort();
    };
  }, [worksData]);
  const autoRef = useRef<any>(null);
  const touchStartRef = useRef<number | null>(null);

  useEffect(() => {
    const abortRef = new AbortController();

    const parseTags = (tags: any): string[] => {
      if (Array.isArray(tags)) return tags;
      if (typeof tags === "string") {
        try { const parsed = JSON.parse(tags); if (Array.isArray(parsed)) return parsed; } catch {}
      }
      return [];
    };

    const fetchWorks = () => {
      fetch("/api/works", { signal: abortRef.signal })
        .then((res) => (res.ok ? res.json() : null))
        .then((payload) => {
          if (abortRef.signal.aborted) return;
          if (Array.isArray(payload?.works) && payload.works.length > 0) {
            const mapped = payload.works.map((w: any) => ({
              id: w.id,
              title: w.title || "untitled",
              desc: w.description || "",
              author: w.author_name || "",
              avatar: w.author_avatar || (w.author_name || "").slice(0, 2).toUpperCase(),
              tags: parseTags(w.tags),
              color: w.color || "#0A84FF",
              status: w.status || "开发中",
              stars: w.stars || 0,
              preview: w.preview_url || null,
              projectUrl: w.repo_url || null,
              portfolioUrl: w.preview_url || null,
              club: "电子科技大学成都学院开放原子开源社团",
              recruitStatus: "",
              contact: "opensouce-club@kcos.club",
              activities: [],
            }));
            setWorksData(mapped);
            setWorksSource(payload.source || "api");
          } else {
            setWorksSource(payload?.source || "empty");
          }
        })
        .catch(() => {});
    };

    fetchWorks();
    const refreshId = setInterval(fetchWorks, 5 * 60 * 1000);
    return () => {
      abortRef.abort();
      clearInterval(refreshId);
    };
  }, []);

  const total = worksData.length;
  const focused = worksData[currentIndex];
  const totalStars = worksData.reduce((sum: number, w: any) => sum + w.stars, 0);
  const avgStars = Math.round(totalStars / Math.max(1, total));
  const topTags = Object.entries(
    worksData.reduce((acc: Record<string, number>, work: any) => {
      work.tags.forEach((tag: string) => {
        acc[tag] = (acc[tag] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const isDenseDesktop = isShortViewport && !isMobile;
  const desktopStageScale = isDenseDesktop ? 0.95 : isTablet ? 1 : 1.08;
  const sectionBg = "var(--section-bg)";
  const sectionBorder = "var(--section-border)";
  const stageOverlayBg = "var(--stage-overlay)";
  const chipBorder = "var(--border-chip)";
  const chipBg = "var(--bg-chip)";
  const chipText = "var(--text-chip)";
  const controlBtnBorder = "var(--border-control)";
  const controlBtnBg = "var(--bg-control)";
  const controlBtnActiveBg = "var(--bg-control-active)";
  const controlBtnIconColor = "var(--text-control)";
  const controlBtnActiveIconColor = "var(--text-control-active)";
  const controlDividerColor = "var(--border-control)";
  const stageMinHeight = isDenseDesktop ? 180 : isTablet ? 230 : 280;
  const stageBottomGap = isDenseDesktop ? 8 : 10;
  const carouselStatus = `${currentIndex + 1} / ${total}: ${focused?.title || "N/A"}`;

  const go = (dir: number) => {
    if (total > 0) setCurrentIndex((i) => (i + dir + total) % total);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const update = () => {
      const width = window.innerWidth;
      setIsMobile(width <= 768);
      setIsTablet(width > 768 && width <= 1200);
      setIsShortViewport(window.innerHeight <= 900);
    };

    update();
    window.addEventListener("resize", update);

    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    if (isMobile) {
      const id = setTimeout(() => setAutoPlay(false), 0);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [isMobile]);

  useEffect(() => {
    if (autoRef.current) clearInterval(autoRef.current);

    if (viewMode !== "carousel" || !autoPlay || isInteracting || isMobile) {
      return () => {
        if (autoRef.current) clearInterval(autoRef.current);
      };
    }

    autoRef.current = setInterval(() => {
      setCurrentIndex((i) => (i + 1) % total);
    }, 3500) as any;

    return () => {
      if (autoRef.current) clearInterval(autoRef.current);
    };
  }, [viewMode, autoPlay, isInteracting, isMobile, total]);



  const getCardStyle = (idx: number) => {
    if (!total || !Number.isFinite(total)) return null;
    const diff = (idx - currentIndex + total) % total;
    const normalized = diff > total / 2 ? diff - total : diff;
    const absD = Math.abs(normalized);

    if (!Number.isFinite(absD) || absD > 2) return null;

    const rotateStep = isDenseDesktop ? 8 : isTablet ? 9 : 10;
    const depthStep = isDenseDesktop ? 60 : isTablet ? 75 : 90;
    const spreadStep = isDenseDesktop ? 90 : isTablet ? 110 : 125;
    const centerScale = isDenseDesktop ? 1 : isTablet ? 1.02 : 1.06;
    const sideBaseScale = isDenseDesktop ? 0.88 : isTablet ? 0.9 : 0.92;
    const sideScaleLoss = isDenseDesktop ? 0.04 : isTablet ? 0.05 : 0.06;
    const rotY = normalized * rotateStep;
    const z = absD === 0 ? 12 : -depthStep * absD;
    const tx = normalized * spreadStep;
    const scale = absD === 0 ? centerScale : sideBaseScale - absD * sideScaleLoss;
    const opacity = absD === 0 ? 1 : 0.64 - absD * 0.12;

    return {
      transform: `translateX(${tx}px) translateZ(${z}px) rotateY(${rotY}deg) scale(${scale})`,
      opacity,
      zIndex: 10 - absD,
    };
  };

  const onKeyDown = (e: any) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(-1);
      return;
    }

    if (e.key === "ArrowRight") {
      e.preventDefault();
      go(1);
      return;
    }

    if (e.key === " " || e.key === "Spacebar") {
      e.preventDefault();
      setAutoPlay((v) => !v);
    }
  };

  return (
    <div
      role="region"
      aria-label="作品展示轮播"
      aria-roledescription="carousel"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 0,
        flex: 1,
        minHeight: 0,
        background: sectionBg,
      }}
    >
      <span
        aria-live="polite"
        aria-atomic="true"
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
        {carouselStatus}
      </span>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: isDenseDesktop ? "6px 16px 4px" : "8px 16px 6px",
          borderTop: `1px solid ${sectionBorder}`,
          gap: 10,
          flexWrap: isMobile || isTablet ? "wrap" : "nowrap",
          flexShrink: 0,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--text-bright)",
            }}
          >
            Member Works
          </div>
          <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 1 }}>
            {isMobile
              ? `${total} items 路 ${worksSource === "github" ? "GitHub API" : worksSource === "fallback" ? "local data" : worksSource}`
              : isTablet
                ? `${total} items 路 ${worksSource === "github" ? "GitHub API" : worksSource === "fallback" ? "local data" : worksSource}`
              : `${total} items 路 ${worksSource === "github" ? "GitHub 数据源" : worksSource === "fallback" ? "本地数据源" : worksSource} 路 键盘与触控支持`}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {!isMobile && (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                disabled={viewMode !== "carousel"}
                data-ui-touch="true"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  border: `1px solid ${controlBtnBorder}`,
                  background: controlBtnBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: viewMode === "carousel" ? "pointer" : "not-allowed",
                  opacity: viewMode === "carousel" ? 1 : 0.45,
                  transition: QUICK_SURFACE_TRANSITION,
                }}
                aria-label="上一项作品"
                title="Previous"
                onMouseEnter={(e) => {
                  if (viewMode === "carousel") {
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow =
                      "0 5px 10px rgba(148,163,184,0.2)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <ChevronLeft size={13} color={controlBtnIconColor} />
              </button>

              <button
                type="button"
                onClick={() => setAutoPlay((v) => !v)}
                disabled={viewMode !== "carousel"}
                data-ui-touch="true"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  border: `1px solid ${controlBtnBorder}`,
                  background:
                    autoPlay && viewMode === "carousel"
                      ? controlBtnActiveBg
                      : controlBtnBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: viewMode === "carousel" ? "pointer" : "not-allowed",
                  opacity: viewMode === "carousel" ? 1 : 0.45,
                  transition: QUICK_SURFACE_TRANSITION,
                }}
                aria-label={autoPlay ? "暂停自动播放" : "继续自动播放"}
                aria-pressed={autoPlay}
                title={autoPlay ? "Pause autoplay" : "Resume autoplay"}
                onMouseEnter={(e) => {
                  if (viewMode === "carousel") {
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow =
                      "0 5px 10px rgba(148,163,184,0.2)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {autoPlay ? (
                  <Pause size={12} color={controlBtnActiveIconColor} />
                ) : (
                  <Play size={12} color={controlBtnIconColor} />
                )}
              </button>

              <button
                type="button"
                onClick={() => go(1)}
                disabled={viewMode !== "carousel"}
                data-ui-touch="true"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  border: `1px solid ${controlBtnBorder}`,
                  background: controlBtnBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: viewMode === "carousel" ? "pointer" : "not-allowed",
                  opacity: viewMode === "carousel" ? 1 : 0.45,
                  transition: QUICK_SURFACE_TRANSITION,
                }}
                aria-label="下一项作品"
                title="Next"
                onMouseEnter={(e) => {
                  if (viewMode === "carousel") {
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow =
                      "0 5px 10px rgba(148,163,184,0.2)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <ChevronRight size={13} color={controlBtnIconColor} />
              </button>

              <div
                style={{
                  width: 1,
                  height: 18,
                  background: controlDividerColor,
                  margin: "0 2px",
                }}
              />
            </>
          )}

          {[
            { mode: "carousel", Icon: LayoutGrid },
            { mode: "list", Icon: List },
          ].map(({ mode, Icon }) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              data-ui-touch="true"
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                border: `1px solid ${
                  viewMode === mode ? "#3B9CD744" : controlBtnBorder
                }`,
                background:
                  viewMode === mode ? controlBtnActiveBg : controlBtnBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: QUICK_SURFACE_TRANSITION,
              }}
              aria-label={mode === "carousel" ? "切换到轮播视图" : "切换到列表视图"}
              title={mode === "carousel" ? "Carousel" : "List"}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow =
                  "0 5px 10px rgba(148,163,184,0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <Icon
                size={13}
                color={viewMode === mode ? controlBtnActiveIconColor : "#9AA8B5"}
              />
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          padding: isDenseDesktop ? "0 16px 5px" : "0 16px 8px",
          display: "grid",
          gridTemplateColumns: isMobile || isTablet
            ? "repeat(2, minmax(0, 1fr))"
            : "repeat(4, minmax(0, 1fr))",
          gap: 7,
          flexShrink: 0,
        }}
      >
        <InsightCard
          icon={TrendingUp}
          label="Repo Stars"
          value={totalStars.toLocaleString()}
          tint="#0A84FF"
          isDarkMode={isDarkMode}
        />
        <InsightCard
          icon={Layers}
          label={worksSource === "github" ? "Public Repos" : "Works Listed"}
          value={total.toLocaleString()}
          tint="#10B981"
          isDarkMode={isDarkMode}
        />
        <InsightCard
          icon={Radar}
          label="Avg Repo Stars"
          value={`${avgStars} / repo`}
          tint="#F59E0B"
          isDarkMode={isDarkMode}
        />
        <InsightCard
          icon={Sparkles}
          label="Focused"
          value={focused?.title || "N/A"}
          tint={focused?.color || "#64748B"}
          isDarkMode={isDarkMode}
        />
      </div>

      <div
        style={{
          padding: isDenseDesktop ? "0 16px 5px" : "0 16px 8px",
          display: "flex",
          alignItems: "center",
          gap: 6,
          overflowX: "auto",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: 9,
            color: "#94A3B8",
            letterSpacing: 0.6,
            whiteSpace: "nowrap",
          }}
        >
          Tech Heat:
        </span>
        {topTags.map(([tag, count]) => (
          <div
            key={tag}
            style={{
              whiteSpace: "nowrap",
              border: `1px solid ${chipBorder}`,
              borderRadius: 999,
              background: chipBg,
              padding: "3px 8px",
              fontSize: 9,
              color: chipText,
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <span>{tag}</span>
            <span
              style={{
                color: "#2B7EDC",
                fontFamily: '"Courier New", monospace',
                fontWeight: 700,
              }}
            >
              {count}
            </span>
          </div>
        ))}
      </div>

      {viewMode === "carousel" && !isMobile && (
        <div
          tabIndex={0}
          onKeyDown={onKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onMouseEnter={() => setIsInteracting(true)}
          onMouseLeave={() => setIsInteracting(false)}
          onTouchStart={(e) => {
            touchStartRef.current = e.touches[0]?.clientX ?? null;
            setIsInteracting(true);
          }}
          onTouchEnd={(e) => {
            const startX = touchStartRef.current;
            const endX = e.changedTouches[0]?.clientX ?? null;
            if (startX !== null && endX !== null) {
              const delta = endX - startX;
              if (Math.abs(delta) > 36) {
                go(delta > 0 ? -1 : 1);
              }
            }
            touchStartRef.current = null;
            setIsInteracting(false);
          }}
          style={{
            position: "relative",
            flex: "1 1 0",
            minHeight: `min(${stageMinHeight}px, 100%)`,
            margin: `0 16px ${stageBottomGap}px`,
            borderRadius: 14,
            overflow: "hidden",
            outline: "none",
            border: "var(--stage-border)",
            boxShadow: isFocused ? "inset 0 0 0 1px #BBDCF2" : "none",
          }}
          aria-label="成员作品轮播"
          aria-roledescription="carousel"
        >
          <TechBackground isDarkMode={isDarkMode} />

          <div
            style={{
              position: "absolute",
              inset: 0,
              background: stageOverlayBg,
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              position: "absolute",
              inset: 0,
              perspective: "700px",
              perspectiveOrigin: "50% 52%",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                transformStyle: "preserve-3d",
                transform: `translateY(${isDenseDesktop ? -2 : 8}px) scale(${desktopStageScale})`,
                transformOrigin: "50% 55%",
              }}
            >
              {worksData.map((work, idx) => {
                const cardStyle = getCardStyle(idx);
                if (!cardStyle) return null;
                const isCenter = idx === currentIndex;

                return (
                  <WorkCard
                    key={work.id}
                    work={work}
                    style={cardStyle}
                    isCenter={isCenter}
                    isDarkMode={isDarkMode}
                    hoveredRole={hoveredRole}
                    setHoveredRole={setHoveredRole}
                    repoContributors={repoContributors}
                    onClick={() => {
                      if (isCenter) {
                        trackOutboundClick({
                          targetUrl: work.projectUrl,
                          targetLabel: work.title,
                          sourceContext: "works-carousel:carousel-card",
                        });
                        window.open(work.projectUrl, "_blank");
                      } else {
                        go(
                          (idx - currentIndex + total) % total > total / 2
                            ? -1
                            : 1,
                        );
                      }
                    }}
                  />
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={() => go(-1)}
            data-ui-touch="true"
            style={{
              position: "absolute",
              left: 8,
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 20,
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: controlBtnBg,
              border: `1px solid ${controlBtnBorder}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              backdropFilter: "blur(8px)",
              transition: QUICK_SURFACE_TRANSITION,
            }}
            aria-label="上一项"
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-50%) scale(1.03)";
              e.currentTarget.style.boxShadow =
                "0 8px 14px rgba(148,163,184,0.24)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(-50%)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <ChevronLeft size={14} color={controlBtnIconColor} />
          </button>

          <button
            type="button"
            onClick={() => go(1)}
            data-ui-touch="true"
            style={{
              position: "absolute",
              right: 8,
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 20,
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: controlBtnBg,
              border: `1px solid ${controlBtnBorder}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              backdropFilter: "blur(8px)",
              transition: QUICK_SURFACE_TRANSITION,
            }}
            aria-label="下一项"
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-50%) scale(1.03)";
              e.currentTarget.style.boxShadow =
                "0 8px 14px rgba(148,163,184,0.24)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(-50%)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <ChevronRight size={14} color={controlBtnIconColor} />
          </button>

          <div
            style={{
              position: "absolute",
              bottom: -2,
              left: 0,
              right: 0,
              display: "flex",
              justifyContent: "center",
              gap: 4,
              zIndex: 20,
            }}
          >
            {worksData.map((work, i) => (
              <button
                key={work.id}
                type="button"
                onClick={() => setCurrentIndex(i)}
                data-ui-touch="true"
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                  transition: "transform 0.18s ease",
                }}
                aria-label={`切换到${work.title}`}
                title={work.title}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <span
                  style={{
                    width: i === currentIndex ? 14 : 6,
                    height: 6,
                    borderRadius: 3,
                    background: i === currentIndex ? "#39A9E8" : "#D4DFEC",
                    transition: "all 0.25s ease",
                    display: "block",
                  }}
                />
              </button>
            ))}
          </div>

        </div>
      )}

      {viewMode === "carousel" && isMobile && (
        <div
          onTouchStart={(e) => {
            touchStartRef.current = e.touches[0]?.clientX ?? null;
          }}
          onTouchEnd={(e) => {
            const startX = touchStartRef.current;
            const endX = e.changedTouches[0]?.clientX ?? null;
            if (startX !== null && endX !== null) {
              const delta = endX - startX;
              if (Math.abs(delta) > 28) {
                go(delta > 0 ? -1 : 1);
              }
            }
            touchStartRef.current = null;
          }}
          style={{
            position: "relative",
            padding: "0 12px 10px",
          }}
        >
          <div
            style={{
              fontSize: 10,
              color: "#94A3B8",
              marginBottom: 8,
              textAlign: "center",
            }}
          >
            左右滑动查看作品
          </div>

          {focused && (
            <MobileWorkCard
              work={focused}
              isDarkMode={isDarkMode}
              hoveredRole={hoveredRole}
              setHoveredRole={setHoveredRole}
              repoContributors={repoContributors}
            />
          )}

          <div
            style={{
              marginTop: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
            }}
          >
            <button
              type="button"
              onClick={() => go(-1)}
              data-ui-touch="true"
              style={{
                width: 34,
                height: 28,
                borderRadius: 8,
                border: `1px solid ${controlBtnBorder}`,
                background: controlBtnBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: QUICK_SURFACE_TRANSITION,
              }}
              aria-label="上一项作品"
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow =
                  "0 5px 10px rgba(148,163,184,0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <ChevronLeft size={14} color={controlBtnIconColor} />
            </button>

            <div
              style={{
                display: "flex",
                gap: 4,
                justifyContent: "center",
                overflowX: "auto",
                maxWidth: "72%",
                paddingBottom: 2,
              }}
            >
              {worksData.map((work, i) => (
                <button
                  key={work.id}
                  type="button"
                  onClick={() => setCurrentIndex(i)}
                  data-ui-touch="true"
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 8,
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    padding: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "transform 0.18s ease",
                  }}
                  aria-label={`切换到${work.title}`}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <span
                    style={{
                      width: i === currentIndex ? 12 : 6,
                      height: 6,
                      borderRadius: 3,
                      background: i === currentIndex ? "#39A9E8" : "#D4DFEC",
                      transition: "all 0.25s ease",
                    }}
                  />
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => go(1)}
              data-ui-touch="true"
              style={{
                width: 34,
                height: 28,
                borderRadius: 8,
                border: `1px solid ${controlBtnBorder}`,
                background: controlBtnBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: QUICK_SURFACE_TRANSITION,
              }}
              aria-label="下一项作品"
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow =
                  "0 5px 10px rgba(148,163,184,0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <ChevronRight size={14} color={controlBtnIconColor} />
            </button>
          </div>
        </div>
      )}

      {viewMode === "list" && (
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            padding: "0 14px 10px",
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          {worksData.map((work) => (
            <ListRow key={work.id} work={work} isDarkMode={isDarkMode} />
          ))}
        </div>
      )}


    </div>
  );
}
