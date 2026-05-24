"use client";
import { useEffect, useRef, useState } from "react";
import { Clock, Radio, Sun, Moon, Monitor, Wifi } from "lucide-react";

const TYPEWRITER_MESSAGES = [
  "KCOS 开放原子开源社团 · 探索、共创、分享",
  "KCOS HUB ONLINE · SYSTEM STATUS NORMAL",
  "Kecheng OpenAtom Open Source Club · Build with global developers",
  "OPEN SOURCE CONNECTS IDEAS AND PEOPLE",
] as const;

const HEADER_HEIGHT = "clamp(50px, 6vh, 56px)";
const HEADER_PADDING_X = "clamp(12px, 1.3vw, 20px)";
const LEFT_BLOCK_MIN_WIDTH = "clamp(156px, 18vw, 190px)";
const RIGHT_BLOCK_MIN_WIDTH = "clamp(210px, 24vw, 280px)";

type ThemeMode = "light" | "dark" | "auto";

const THEME_MODES: Array<{ key: ThemeMode; label: string }> = [
  { key: "light", label: "白天" },
  { key: "dark", label: "夜间" },
  { key: "auto", label: "自动" },
];

const THEME_MODE_ICONS: Record<ThemeMode, typeof Sun> = {
  light: Sun,
  dark: Moon,
  auto: Monitor,
};

type ThemeModeSwitchProps = {
  compact: boolean;
  isDarkMode: boolean;
  themeMode: ThemeMode;
  onThemeModeChange: (mode: ThemeMode) => void;
};

type HUDHeaderProps = {
  compact?: boolean;
  isDarkMode?: boolean;
  themeMode?: ThemeMode;
  onThemeModeChange?: (mode: ThemeMode) => void;
};

type NetInfo = {
  online: boolean;
  typeText: string;
  qualityText: string;
};

function ThemeModeSwitch({
  compact,
  isDarkMode,
  themeMode,
  onThemeModeChange,
}: ThemeModeSwitchProps) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: compact ? "2px" : "3px",
        borderRadius: 999,
        border: `1px solid ${isDarkMode ? "#334155" : "#E2E8F0"}`,
        background: isDarkMode
          ? "rgba(15,23,42,0.88)"
          : "rgba(255,255,255,0.92)",
      }}
    >
      {THEME_MODES.map((mode) => {
        const selected = themeMode === mode.key;
        const ModeIcon = THEME_MODE_ICONS[mode.key];
        return (
          <button
            key={mode.key}
            type="button"
            data-ui-touch="true"
            onClick={() => onThemeModeChange(mode.key)}
            style={{
              border: "none",
              borderRadius: 999,
              width: compact ? 24 : 28,
              height: compact ? 24 : 28,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: selected ? "#0A84FF" : isDarkMode ? "#94A3B8" : "#64748B",
              background: selected
                ? isDarkMode
                  ? "rgba(56,189,248,0.2)"
                  : "#DBEAFE"
                : "transparent",
              boxShadow: selected
                ? "inset 0 0 0 1px rgba(59,130,246,0.25)"
                : "none",
              transition: "all 0.18s ease",
            }}
            aria-label={`切换主题为${mode.label}`}
            title={mode.label}
          >
            <ModeIcon size={compact ? 13 : 14} />
          </button>
        );
      })}
    </div>
  );
}

export default function HUDHeader({
  compact = false,
  isDarkMode = false,
  themeMode = "auto",
  onThemeModeChange = () => {},
}: HUDHeaderProps) {
  const [sessionUptimeText, setSessionUptimeText] = useState("00:00:00");
  const [currentTimeText, setCurrentTimeText] = useState("--:--:--");
  const [netInfo, setNetInfo] = useState<NetInfo>({
    online: true,
    typeText: "未知网络",
    qualityText: "--",
  });
  const sessionStartMsRef = useRef<number | null>(null);
  const [typeText, setTypeText] = useState("");
  const [msgIdx, setMsgIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  const formatDuration = (totalSec: number) => {
    const safeSec = Math.max(0, Math.floor(totalSec));
    const days = Math.floor(safeSec / 86400);
    const hours = Math.floor((safeSec % 86400) / 3600);
    const minutes = Math.floor((safeSec % 3600) / 60);
    const seconds = safeSec % 60;
    return `${days}天 ${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  const formatClockTime = (date: Date) => {
    const hh = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");
    const ss = String(date.getSeconds()).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  };

  useEffect(() => {
    if (sessionStartMsRef.current === null) {
      sessionStartMsRef.current = Date.now();
    }

    const tick = () => {
      const now = new Date();
      const startMs = sessionStartMsRef.current ?? now.getTime();
      const elapsedSec = Math.floor(
        (now.getTime() - startMs) / 1000,
      );
      setSessionUptimeText(formatDuration(elapsedSec));
      setCurrentTimeText(formatClockTime(now));
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => {
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    const readConnection = () => {
      const nav = navigator as Navigator & {
        connection?: {
          effectiveType?: string;
          downlink?: number;
          rtt?: number;
        };
      };

      const online = navigator.onLine;
      const conn = nav.connection;
      const effectiveType = conn?.effectiveType || "";
      const downlink = typeof conn?.downlink === "number" ? conn.downlink : null;
      const rtt = typeof conn?.rtt === "number" ? conn.rtt : null;

      const typeText = effectiveType
        ? `${effectiveType.toUpperCase()}`
        : "网络已连接";
      const qualityText =
        downlink !== null
          ? `${downlink.toFixed(1)}Mb/s`
          : rtt !== null
            ? `${rtt}ms`
            : "--";

      setNetInfo({
        online,
        typeText: online ? typeText : "离线",
        qualityText: online ? qualityText : "--",
      });
    };

    readConnection();
    window.addEventListener("online", readConnection);
    window.addEventListener("offline", readConnection);
    const id = window.setInterval(readConnection, 5000);
    return () => {
      window.removeEventListener("online", readConnection);
      window.removeEventListener("offline", readConnection);
      window.clearInterval(id);
    };
  }, []);

  useEffect(() => {
    if (compact) return undefined;

    const msg = TYPEWRITER_MESSAGES[msgIdx];
    let id: ReturnType<typeof setTimeout> | undefined;

    if (!deleting) {
      if (charIdx < msg.length) {
        id = setTimeout(() => {
          setTypeText(msg.slice(0, charIdx + 1));
          setCharIdx((c) => c + 1);
        }, 55);
      } else {
        id = setTimeout(() => setDeleting(true), 2200);
      }
    } else if (charIdx > 0) {
      id = setTimeout(() => {
        setTypeText(msg.slice(0, charIdx - 1));
        setCharIdx((c) => c - 1);
      }, 28);
    } else {
      id = setTimeout(() => {
        setDeleting(false);
        setMsgIdx((m) => (m + 1) % TYPEWRITER_MESSAGES.length);
      }, 0);
    }

    return () => {
      if (id) clearTimeout(id);
    };
  }, [charIdx, compact, deleting, msgIdx]);

  return (
    <header
      style={{
        height: compact ? 48 : HEADER_HEIGHT,
        background: isDarkMode
          ? "rgba(15,23,42,0.92)"
          : "rgba(255,255,255,0.92)",
        borderBottom: `1px solid ${isDarkMode ? "#334155" : "#E5E7EB"}`,
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        display: "flex",
        alignItems: "center",
        padding: `0 ${HEADER_PADDING_X}`,
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: compact ? 8 : 10,
          minWidth: compact ? "auto" : LEFT_BLOCK_MIN_WIDTH,
        }}
      >
        <div
          style={{
            width: compact ? 34 : 46,
            height: compact ? 30 : 40,
            borderRadius: 10,
            border: `1px solid ${isDarkMode ? "#475569" : "#BFDBFE"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            background: isDarkMode ? "#0F172A" : "#FFFFFF",
            boxShadow: "0 2px 10px rgba(10,132,255,0.18)",
            flexShrink: 0,
          }}
        >
          <img
            src="/images/brand/club-logo-user.jpg"
            alt="开放原子开源社团 Logo"
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        </div>
        <div>
          <div
            style={{
              fontSize: compact ? 11 : 12,
              fontWeight: 600,
              color: isDarkMode ? "#F8FAFC" : "#0F172A",
              letterSpacing: 0.5,
            }}
          >
            KCOS
          </div>
          <div
            style={{
              fontSize: compact ? 8 : 9,
              color: isDarkMode ? "#94A3B8" : "#64748B",
              letterSpacing: compact ? 0.8 : 1.5,
              textTransform: "uppercase",
            }}
          >
            kcos.club
          </div>
        </div>
      </div>

      {!compact ? (
        <>
          <div
            style={{
              flex: 1,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Radio size={12} color={isDarkMode ? "#60A5FA" : "#0A84FF"} />
            <span
              style={{
                fontSize: 12,
                color: isDarkMode ? "#93C5FD" : "#0A84FF",
                fontWeight: 500,
                fontFamily: '"Courier New", monospace',
                letterSpacing: 0.5,
              }}
            >
              {typeText}
              <span
                style={{
                  display: "inline-block",
                  width: 6,
                  height: 12,
                  background: isDarkMode ? "#93C5FD" : "#0A84FF",
                  verticalAlign: "middle",
                  marginLeft: 2,
                  animation: "blink 1s infinite",
                }}
              />
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              minWidth: RIGHT_BLOCK_MIN_WIDTH,
              justifyContent: "flex-end",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "stretch",
                gap: 6,
                padding: "6px",
                borderRadius: 12,
                border: `1px solid ${isDarkMode ? "#334155" : "#E5E7EB"}`,
                background: isDarkMode
                  ? "rgba(15,23,42,0.76)"
                  : "rgba(255,255,255,0.82)",
                boxShadow: "0 10px 22px rgba(15,23,42,0.08)",
                backdropFilter: "blur(8px)",
                minWidth: 236,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", padding: "0 2px" }}>
                <ThemeModeSwitch
                  compact={false}
                  isDarkMode={isDarkMode}
                  themeMode={themeMode}
                  onThemeModeChange={onThemeModeChange}
                />
              </div>
              <div
                style={{
                  width: 1,
                  alignSelf: "stretch",
                  background: isDarkMode ? "#334155" : "#E5E7EB",
                  opacity: 0.8,
                }}
              />
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "2px 4px 2px 2px", minWidth: 124 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Clock size={10} color="#10B981" />
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#10B981", fontFamily: '"Courier New", monospace' }}>
                    {sessionUptimeText}
                  </span>
                </div>
                <div style={{ width: 1, height: 14, background: isDarkMode ? "#334155" : "#E5E7EB" }} />
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Clock size={10} color={isDarkMode ? "#93C5FD" : "#0A84FF"} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: isDarkMode ? "#93C5FD" : "#0A84FF", fontFamily: '"Courier New", monospace' }}>
                    {currentTimeText}
                  </span>
                </div>
                <div style={{ width: 1, height: 14, background: isDarkMode ? "#334155" : "#E5E7EB" }} />
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Wifi size={10} color={netInfo.online ? "#10B981" : "#EF4444"} />
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: netInfo.online ? "#10B981" : "#EF4444",
                      boxShadow: netInfo.online
                        ? "0 0 8px rgba(16,185,129,0.45)"
                        : "0 0 8px rgba(239,68,68,0.45)",
                    }}
                  />
                  <span style={{ fontSize: 10, color: isDarkMode ? "#94A3B8" : "#64748B", fontFamily: '"Courier New", monospace' }}>
                    {netInfo.typeText} / {netInfo.qualityText}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div
          style={{
            marginLeft: "auto",
            display: "grid",
            gap: 2,
            justifyItems: "end",
            color: isDarkMode ? "#94A3B8" : "#64748B",
            fontSize: 10,
            fontFamily: '"Courier New", monospace',
          }}
        >
          <ThemeModeSwitch
            compact={true}
            isDarkMode={isDarkMode}
            themeMode={themeMode}
            onThemeModeChange={onThemeModeChange}
          />
          <span>本次打开时长</span>
          <span style={{ color: "#10B981", fontWeight: 700 }}>
            {sessionUptimeText}
          </span>
          <span>当前时间</span>
          <span style={{ color: isDarkMode ? "#93C5FD" : "#0A84FF", fontWeight: 700 }}>
            {currentTimeText}
          </span>
          <span>设备信号</span>
          <span
            style={{
              color: netInfo.online ? "#10B981" : "#EF4444",
              fontWeight: 700,
            }}
          >
            {netInfo.typeText} / {netInfo.qualityText}
          </span>
        </div>
      )}

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </header>
  );
}
