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
  Activity,
  ExternalLink,
  X,
} from "lucide-react";
import { WORKS } from "../data/works";

const getExternalHref = (url) =>
  typeof url === "string" && /^https?:\/\//i.test(url) ? url : null;

const PACMAN_BEST_KEY = "kcos_pacman_best";
const PACMAN_EASY = {
  startLives: 10,
  tickMs: 320,
  frightenedTicks: 220,
  // Higher number means ghosts move less frequently.
  ghostMoveDivisorByLevel: [9, 8, 7],
};
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

const PACMAN_DIR = {
  up: { dx: 0, dy: -1, label: "↑", angle: 270 },
  down: { dx: 0, dy: 1, label: "↓", angle: 90 },
  left: { dx: -1, dy: 0, label: "←", angle: 180 },
  right: { dx: 1, dy: 0, label: "→", angle: 0 },
};

const PACMAN_GHOST_META = {
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

const wrapX = (x, width) => {
  if (x < 0) return width - 1;
  if (x >= width) return 0;
  return x;
};

const isWall = (board, x, y) => {
  if (y < 0 || y >= board.length) return true;
  const wx = wrapX(x, board[0].length);
  return board[y][wx] === "#";
};

const countPellets = (board) =>
  board.flat().filter((c) => c === "." || c === "o").length;

const manhattan = (a, b, width) => {
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

const resetPacmanActors = (state) => ({
  ...state,
  pac: { ...state.pacSpawn },
  dir: "left",
  nextDir: "left",
  frightenedTicks: 0,
  ghostCombo: 0,
  ghosts: (state.ghosts || []).map((ghost) => ({
    ...ghost,
    x: ghost.spawnX,
    y: ghost.spawnY,
    dir: "left",
    respawnTicks: 0,
  })),
});

const chooseGhostDirection = (ghost, pac, pacDir, board, frightened, tick) => {
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
      ? options.filter((option) => option.key !== OPPOSITE_DIR[ghost.dir])
      : options;

  if (frightened) {
    const idx = (tick + ghost.x + ghost.y) % filtered.length;
    return filtered[idx].key;
  }

  const forward = PACMAN_DIR[pacDir] || PACMAN_DIR.left;
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

function CardBody({ work }) {
  return (
    <>
      <div
        style={{
          height: 2.5,
          background: `${work.color}CC`,
          borderRadius: 3,
          marginBottom: 3,
        }}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
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
              background: `${work.color}10`,
              border: `1px solid ${work.color}2E`,
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
              color: "#9AA8B5",
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
            border: "1px solid #D7E5F5",
            color: "#2F7DD4",
            background: "#F7FBFF",
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

      <div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "#1E293B",
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
            color: "#718096",
            marginTop: 3,
            lineHeight: 1.35,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: 2,
          }}
        >
          {work.desc}
        </div>
      </div>

      <div
        style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: "auto" }}
      >
        {work.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            style={{
              fontSize: 8,
              padding: "1px 6px",
              borderRadius: 999,
              border: "1px solid #E6EDF5",
              color: "#728095",
              background: "#F8FBFF",
            }}
          >
            {tag}
          </span>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          paddingTop: 5,
          borderTop: "1px solid #EDF2F7",
        }}
      >
        <Star size={10} color="#F59E0B" fill="#F59E0B" />
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: "#475569",
            fontFamily: '"Courier New", monospace',
          }}
        >
          {work.stars}
        </span>
      </div>
    </>
  );
}

function WorkCard({ work, style, isCenter, onClick }) {
  return (
    <button
      onClick={onClick}
      type="button"
      data-ui-touch="true"
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: 208,
        marginLeft: -104,
        marginTop: -108,
        height: 216,
        background: "rgba(255,255,255,0.92)",
        border: `1px solid ${isCenter ? work.color + "38" : "#E5EDF5"}`,
        borderRadius: 14,
        padding: "10px 10px",
        cursor: "pointer",
        transition:
          "transform 0.45s cubic-bezier(0.25,0.46,0.45,0.94), opacity 0.35s ease, box-shadow 0.25s ease, border-color 0.2s ease",
        boxShadow: isCenter
          ? `0 0 16px ${work.color}12, 0 6px 14px rgba(148,163,184,0.16)`
          : "none",
        display: "flex",
        flexDirection: "column",
        gap: 5,
        userSelect: "none",
        textAlign: "left",
        ...style,
      }}
      aria-label={`Focus ${work.title}`}
      title={isCenter ? work.desc : "Click to bring to center"}
    >
      <CardBody work={work} />
    </button>
  );
}

function MobileWorkCard({ work }) {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 320,
        margin: "0 auto",
        minHeight: 188,
        background: "rgba(255,255,255,0.94)",
        border: `1px solid ${work.color}2E`,
        borderRadius: 14,
        padding: "11px 11px",
        boxShadow: `0 0 14px ${work.color}10, 0 5px 14px rgba(148,163,184,0.14)`,
        display: "flex",
        flexDirection: "column",
        gap: 5,
      }}
    >
      <CardBody work={work} />
    </div>
  );
}

function ListRow({ work }) {
  return (
    <div
      data-ui-touch="true"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 12px",
        borderRadius: 9,
        border: "1px solid #EAF0F5",
        background: "#FCFDFE",
        transition:
          "border-color 0.18s, box-shadow 0.18s, transform 0.18s, background 0.18s",
        cursor: "default",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "#DCE6F2";
        e.currentTarget.style.background = "#FFFFFF";
        e.currentTarget.style.transform = "translateY(-1px)";
        e.currentTarget.style.boxShadow = "0 6px 12px rgba(148,163,184,0.14)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#EAF0F5";
        e.currentTarget.style.background = "#FCFDFE";
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
            color: "#0F172A",
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
            color: "#94A3B8",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {work.desc}
        </div>
      </div>

      <div style={{ display: "flex", gap: 3 }}>
        {work.tags.slice(0, 2).map((t) => (
          <span
            key={t}
            style={{
              fontSize: 8,
              padding: "1px 6px",
              borderRadius: 999,
              border: "1px solid #E5E7EB",
              color: "#94A3B8",
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
            color: "#374151",
            fontFamily: '"Courier New", monospace',
          }}
        >
          {work.stars}
        </span>
      </div>
    </div>
  );
}

function InsightCard({ icon: Icon, label, value, tint }) {
  return (
    <div
      style={{
        border: `1px solid ${tint}24`,
        background: "#FFFFFF",
        borderRadius: 11,
        padding: "8px 9px",
        display: "flex",
        alignItems: "center",
        gap: 7,
        minHeight: 44,
      }}
    >
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: 7,
          border: `1px solid ${tint}33`,
          background: `${tint}14`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={12} color={tint} />
      </div>

      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 9, color: "#94A3B8", lineHeight: 1.2 }}>
          {label}
        </div>
        <div
          style={{
            fontSize: 12,
            color: "#1E293B",
            fontWeight: 700,
            lineHeight: 1.2,
            marginTop: 2,
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

function PacmanMiniGame({ compact = false }) {
  const [game, setGame] = useState(() => createPacmanRound());
  const [best, setBest] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const stored = Number(localStorage.getItem(PACMAN_BEST_KEY) || 0);
    if (Number.isFinite(stored) && stored > 0) {
      setBest(stored);
    }
    return undefined;
  }, []);

  useEffect(() => {
    if (game.score <= best) return;
    setBest(game.score);
    if (typeof window !== "undefined") {
      localStorage.setItem(PACMAN_BEST_KEY, String(game.score));
    }
  }, [best, game.score]);

  const setDirection = (dir) => {
    setGame((prev) => {
      if (prev.finished || prev.lives <= 0) return prev;
      return {
        ...prev,
        nextDir: dir,
        running: true,
      };
    });
  };

  useEffect(() => {
    const keyToDir = {
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

    const onKeyDown = (e) => {
      const dir = keyToDir[e.key];
      if (!dir) return;
      e.preventDefault();
      setDirection(dir);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
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

        const canMove = (x, y, direction) => {
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
          status = "能量豆！幽灵进入惊吓状态";
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
            status = `吃鬼 +${ghostScore}`;
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
              status: "被幽灵抓到，游戏结束",
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
              status: `三关通关！总分 ${score + 500}`,
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
  const pacDir = PACMAN_DIR[game.dir] || PACMAN_DIR.left;
  const mouthGap = safeTick % 8 < 4 ? 70 : 28;
  const frightenedBlink =
    game.frightenedTicks > 0 && game.frightenedTicks < 18 && safeTick % 4 < 2;

  return (
    <div
      style={{
        position: "absolute",
        left: compact ? 10 : 20,
        top: compact ? 8 : 10,
        zIndex: 16,
        width: compact ? 196 : 230,
        borderRadius: 16,
        border: "1px solid #D6E7F7",
        background: "rgba(255,255,255,0.9)",
        backdropFilter: "blur(8px)",
        padding: compact ? 9 : 12,
        display: "grid",
        gap: 8,
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
        <span>分 {game.score}</span>
        <span>命 {game.lives}</span>
        <span>
          关 {game.level}/{game.totalLevels}
        </span>
      </div>

      <div
        style={{
          borderRadius: 8,
          border: "1px solid #D6E7F7",
          padding: 5,
          background: "#0F172A",
          display: "grid",
          gridTemplateColumns: `repeat(${cellsX}, 1fr)`,
          gap: 1,
          height: compact ? 146 : 168,
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
                      width: 11,
                      height: 11,
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
                      width: 11,
                      height: 11,
                      borderRadius: "50% 50% 35% 35%",
                      background: ghostFrightened
                        ? frightenedBlink
                          ? "#F8FAFC"
                          : "#60A5FA"
                        : ghost.color,
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
          gap: 4,
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
            fontSize: 11,
            color: "#2563EB",
            cursor: "pointer",
            padding: "3px 0",
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
            fontSize: 11,
            color: "#2563EB",
            cursor: "pointer",
            padding: "3px 0",
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
            fontSize: 11,
            color: "#2563EB",
            cursor: "pointer",
            padding: "3px 0",
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
            fontSize: 11,
            color: "#2563EB",
            cursor: "pointer",
            padding: "3px 0",
          }}
        >
          {PACMAN_DIR.down.label}
        </button>
      </div>

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
  const [detailWork, setDetailWork] = useState(null);
  const autoRef = useRef(null);
  const touchStartRef = useRef(null);

  const total = WORKS.length;
  const focused = WORKS[currentIndex];
  const focusedPortfolioHref = getExternalHref(focused?.portfolioUrl);
  const totalStars = WORKS.reduce((sum, w) => sum + w.stars, 0);
  const avgStars = Math.round(totalStars / Math.max(1, total));
  const onlineCount = WORKS.filter((w) => w.status.includes("已上线")).length;
  const highImpactCount = WORKS.filter((w) => w.stars >= 150).length;
  const statusSnapshot = [
    {
      label: "上线项目",
      value: onlineCount,
      pct: Math.round((onlineCount / Math.max(1, total)) * 100),
      color: "#10B981",
    },
    {
      label: "高热项目",
      value: highImpactCount,
      pct: Math.round((highImpactCount / Math.max(1, total)) * 100),
      color: "#F59E0B",
    },
    {
      label: "进行中",
      value: WORKS.filter((w) => !w.status.includes("已上线")).length,
      pct: Math.round(
        (WORKS.filter((w) => !w.status.includes("已上线")).length /
          Math.max(1, total)) *
          100,
      ),
      color: "#0A84FF",
    },
  ];
  const topTags = Object.entries(
    WORKS.reduce((acc, work) => {
      work.tags.forEach((tag) => {
        acc[tag] = (acc[tag] || 0) + 1;
      });
      return acc;
    }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const desktopStageScale = isTablet ? 1.12 : 1.3;
  const sectionBg = isDarkMode ? "rgba(15,23,42,0.86)" : "transparent";
  const sectionBorder = isDarkMode ? "#334155" : "#EAF0F6";
  const stageOverlayBg = isDarkMode
    ? "rgba(15,23,42,0.34)"
    : "rgba(255,255,255,0.38)";
  const chipBorder = isDarkMode ? "#334155" : "#E4ECF4";
  const chipBg = isDarkMode ? "rgba(15,23,42,0.82)" : "#FAFCFF";
  const chipText = isDarkMode ? "#CBD5E1" : "#5E6B7B";
  const controlBtnBorder = isDarkMode ? "#334155" : "#E2EAF2";
  const controlBtnBg = isDarkMode
    ? "rgba(15,23,42,0.82)"
    : "rgba(255,255,255,0.82)";
  const controlBtnActiveBg = isDarkMode
    ? "rgba(59,130,246,0.22)"
    : "#F2FAFF";
  const controlBtnIconColor = isDarkMode ? "#CBD5E1" : "#7A8EA5";
  const controlBtnActiveIconColor = isDarkMode ? "#93C5FD" : "#3B9CD7";
  const controlDividerColor = isDarkMode ? "#334155" : "#E2EAF2";
  const stageMinHeight = isTablet ? 272 : 304;

  const go = (dir) => {
    setCurrentIndex((i) => (i + dir + total) % total);
  };

  const openDetail = (work) => {
    setDetailWork(work);
  };

  const closeDetail = () => {
    setDetailWork(null);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const update = () => {
      const width = window.innerWidth;
      setIsMobile(width <= 768);
      setIsTablet(width > 768 && width <= 1200);
    };

    update();
    window.addEventListener("resize", update);

    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    if (isMobile) {
      setAutoPlay(false);
    }
  }, [isMobile]);

  useEffect(() => {
    clearInterval(autoRef.current);

    if (viewMode !== "carousel" || !autoPlay || isInteracting || isMobile) {
      return () => clearInterval(autoRef.current);
    }

    autoRef.current = setInterval(() => {
      setCurrentIndex((i) => (i + 1) % total);
    }, 3500);

    return () => clearInterval(autoRef.current);
  }, [viewMode, autoPlay, isInteracting, isMobile, total]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        closeDetail();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const getCardStyle = (idx) => {
    const diff = (idx - currentIndex + total) % total;
    const normalized = diff > total / 2 ? diff - total : diff;
    const absD = Math.abs(normalized);

    if (absD > 2) return null;

    const rotateStep = isTablet ? 14 : 18;
    const depthStep = isTablet ? 94 : 112;
    const spreadStep = isTablet ? 90 : 106;
    const centerScale = isTablet ? 1.04 : 1.1;
    const sideBaseScale = isTablet ? 0.95 : 0.93;
    const sideScaleLoss = isTablet ? 0.05 : 0.07;
    const rotY = normalized * rotateStep;
    const z = absD === 0 ? 12 : -depthStep * absD;
    const tx = normalized * spreadStep;
    const scale = absD === 0 ? centerScale : sideBaseScale - absD * sideScaleLoss;
    const opacity = absD === 0 ? 1 : 0.74 - absD * 0.1;

    return {
      transform: `translateX(${tx}px) translateZ(${z}px) rotateY(${rotY}deg) scale(${scale})`,
      opacity,
      zIndex: 10 - absD,
    };
  };

  const onKeyDown = (e) => {
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
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 0,
        flex: 1,
        minHeight: 0,
        background: sectionBg,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "8px 16px 6px",
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
              color: isDarkMode ? "#E2E8F0" : "#0F172A",
            }}
          >
            Member Works
          </div>
          <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 1 }}>
            {isMobile
              ? `${total} items · mobile swipe mode`
              : isTablet
                ? `${total} items · tablet adaptive mode`
              : `${total} items · Arrow keys / swipe supported`}
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
                  transition: "all 0.18s ease",
                }}
                aria-label="Previous work"
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
                  transition: "all 0.18s ease",
                }}
                aria-label={autoPlay ? "Pause autoplay" : "Resume autoplay"}
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
                  transition: "all 0.18s ease",
                }}
                aria-label="Next work"
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
                transition: "all 0.18s ease",
              }}
              aria-label={`Switch to ${mode} view`}
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
          padding: "0 16px 8px",
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
          label="Total Stars"
          value={totalStars.toLocaleString()}
          tint="#0A84FF"
        />
        <InsightCard
          icon={Layers}
          label="Projects Online"
          value={`${onlineCount}/${total}`}
          tint="#10B981"
        />
        <InsightCard
          icon={Radar}
          label="Avg Stars"
          value={`${avgStars} / project`}
          tint="#F59E0B"
        />
        <InsightCard
          icon={Sparkles}
          label="Focused"
          value={focused?.title || "N/A"}
          tint={focused?.color || "#64748B"}
        />
      </div>

      <div
        style={{
          padding: "0 16px 8px",
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
            flex: 1,
            minHeight: stageMinHeight,
            overflow: "hidden",
            outline: "none",
            borderTop: "1px solid transparent",
            boxShadow: isFocused ? "inset 0 0 0 1px #BBDCF2" : "none",
          }}
          aria-label="Member works carousel"
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: stageOverlayBg,
              pointerEvents: "none",
            }}
          />

          <PacmanMiniGame compact={isTablet} />

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
                transform: `translateY(8px) scale(${desktopStageScale})`,
                transformOrigin: "50% 55%",
              }}
            >
              {WORKS.map((work, idx) => {
                const cardStyle = getCardStyle(idx);
                if (!cardStyle) return null;
                const isCenter = idx === currentIndex;

                return (
                  <WorkCard
                    key={work.id}
                    work={work}
                    style={cardStyle}
                    isCenter={isCenter}
                    onClick={() => {
                      if (!isCenter) {
                        go(
                          (idx - currentIndex + total) % total > total / 2
                            ? -1
                            : 1,
                        );
                        return;
                      }
                      openDetail(work);
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
              background: "rgba(255,255,255,0.86)",
              border: "1px solid #DFE8F1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              backdropFilter: "blur(8px)",
              transition: "all 0.18s ease",
            }}
            aria-label="Previous"
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
            <ChevronLeft size={14} color="#7A8EA5" />
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
              background: "rgba(255,255,255,0.86)",
              border: "1px solid #DFE8F1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              backdropFilter: "blur(8px)",
              transition: "all 0.18s ease",
            }}
            aria-label="Next"
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
            <ChevronRight size={14} color="#7A8EA5" />
          </button>

          <div
            style={{
              position: "absolute",
              bottom: 6,
              left: 0,
              right: 0,
              display: "flex",
              justifyContent: "center",
              gap: 4,
              zIndex: 20,
            }}
          >
            {WORKS.map((work, i) => (
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
                aria-label={`Go to ${work.title}`}
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

          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 26,
              display: "flex",
              justifyContent: "center",
              zIndex: 14,
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                border: "1px solid #DCEAF6",
                borderRadius: 999,
                background: "rgba(255,255,255,0.82)",
                backdropFilter: "blur(8px)",
                padding: "4px 10px",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 9,
                color: "#708090",
                letterSpacing: 0.35,
              }}
            >
              <Activity size={10} color="#3B9CD7" />
              <span>Live focus on {focused?.author}</span>
              <span
                style={{
                  color: "#2F8FE4",
                  fontFamily: '"Courier New", monospace',
                }}
              >
                #{focused?.id}
              </span>
            </div>
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
            Swipe left or right to browse works
          </div>

          <MobileWorkCard work={WORKS[currentIndex]} />

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
                border: "1px solid #E2EAF2",
                background: "rgba(255,255,255,0.9)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.18s ease",
              }}
              aria-label="Previous work"
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
              <ChevronLeft size={14} color="#7A8EA5" />
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
              {WORKS.map((work, i) => (
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
                  aria-label={`Go to ${work.title}`}
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
                border: "1px solid #E2EAF2",
                background: "rgba(255,255,255,0.9)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.18s ease",
              }}
              aria-label="Next work"
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
              <ChevronRight size={14} color="#7A8EA5" />
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
          {WORKS.map((work) => (
            <ListRow key={work.id} work={work} />
          ))}
        </div>
      )}

      {detailWork && (
        <div
          onClick={closeDetail}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(2, 6, 23, 0.55)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
            zIndex: 210,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 14,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(680px, 100%)",
              maxHeight: "86vh",
              overflowY: "auto",
              borderRadius: 14,
              border: `1px solid ${detailWork.color}35`,
              background: "#FFFFFF",
              boxShadow: "0 24px 46px rgba(2, 6, 23, 0.28)",
              padding: 14,
              display: "grid",
              gap: 10,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 10,
                    color: detailWork.color,
                    letterSpacing: 1.3,
                    fontFamily: '"Courier New", monospace',
                    fontWeight: 700,
                  }}
                >
                  WORK DETAIL
                </div>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: "#0F172A",
                    marginTop: 3,
                  }}
                >
                  {detailWork.title}
                </div>
                <div style={{ fontSize: 12, color: "#64748B", marginTop: 3 }}>
                  {detailWork.desc}
                </div>
              </div>

              <button
                type="button"
                onClick={closeDetail}
                data-ui-touch="true"
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  border: "1px solid #E2E8F0",
                  background: "#FFFFFF",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <X size={14} color="#64748B" />
              </button>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {detailWork.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontSize: 10,
                    borderRadius: 999,
                    border: "1px solid #E2E8F0",
                    background: "#FFFFFF",
                    color: "#475569",
                    padding: "2px 8px",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 8,
              }}
            >
              {[
                { label: "作者", value: detailWork.author },
                { label: "状态", value: detailWork.status },
                {
                  label: "社团",
                  value: detailWork.club || "科成开放原子开源社团",
                },
                {
                  label: "招新",
                  value: detailWork.recruitStatus || "长期招新",
                },
                {
                  label: "联系方式",
                  value: detailWork.contact || "kcos@opensouce-club.top",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    border: "1px solid #E2E8F0",
                    borderRadius: 10,
                    background: "#FFFFFF",
                    padding: "8px 9px",
                    display: "grid",
                    gap: 2,
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      color: "#94A3B8",
                      letterSpacing: 0.5,
                      fontFamily: '"Courier New", monospace',
                    }}
                  >
                    {item.label}
                  </span>
                  <span
                    style={{ fontSize: 12, color: "#334155", lineHeight: 1.45 }}
                  >
                    {item.value}
                  </span>
                </div>
              ))}
            </div>

            <div
              style={{
                border: "1px solid #E2E8F0",
                borderRadius: 10,
                background: "#FFFFFF",
                padding: "8px 9px",
                display: "grid",
                gap: 6,
              }}
            >
              <div style={{ fontSize: 11, color: "#0F172A", fontWeight: 700 }}>
                社团活动
              </div>
              <div style={{ display: "grid", gap: 4 }}>
                {(detailWork.activities || []).map((item) => (
                  <div
                    key={item}
                    style={{
                      fontSize: 12,
                      color: "#475569",
                      lineHeight: 1.4,
                      paddingLeft: 10,
                      position: "relative",
                    }}
                  >
                    <span
                      style={{
                        width: 4,
                        height: 4,
                        borderRadius: "50%",
                        background: detailWork.color,
                        position: "absolute",
                        left: 0,
                        top: 7,
                      }}
                    />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {getExternalHref(detailWork.projectUrl) ? (
                <a
                  href={detailWork.projectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-ui-touch="true"
                  style={{
                    borderRadius: 999,
                    border: "1px solid #BFDBFE",
                    background: "#EFF6FF",
                    color: "#0A84FF",
                    fontSize: 12,
                    fontWeight: 600,
                    textDecoration: "none",
                    padding: "7px 12px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  项目网址
                  <ExternalLink size={12} />
                </a>
              ) : null}

              {getExternalHref(detailWork.portfolioUrl) ? (
                <a
                  href={detailWork.portfolioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-ui-touch="true"
                  style={{
                    borderRadius: 999,
                    border: "1px solid #D1D5DB",
                    background: "#FFFFFF",
                    color: "#374151",
                    fontSize: 12,
                    fontWeight: 600,
                    textDecoration: "none",
                    padding: "7px 12px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  作品集链接
                  <ExternalLink size={12} />
                </a>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
