import { useEffect, useRef, useState } from "react";
import { Wifi, Clock, Radio } from "lucide-react";
import clubLogo from "../assets/club-logo-user.jpg";

const TYPEWRITER_MESSAGES = [
  "KCOS 科成开放原子开源社团 · 探索、共创、分享",
  "KCOS HUB ONLINE · SYSTEM STATUS NORMAL",
  "Kecheng OpenAtom Open Source Club · Build with global developers",
  "OPEN SOURCE CONNECTS IDEAS AND PEOPLE",
];

const HEADER_HEIGHT = "clamp(50px, 6vh, 56px)";
const HEADER_PADDING_X = "clamp(12px, 1.3vw, 20px)";
const LEFT_BLOCK_MIN_WIDTH = "clamp(156px, 18vw, 190px)";
const RIGHT_BLOCK_MIN_WIDTH = "clamp(320px, 36vw, 430px)";
const THEME_MODES = [
  { key: "light", label: "白天" },
  { key: "dark", label: "黑夜" },
  { key: "auto", label: "自动" },
];

function WaveformBar({ animate, isDarkMode }) {
  const heights = useRef([4, 6, 10, 7, 12, 9, 8, 10, 6, 7]);
  const [bars, setBars] = useState(heights.current);

  useEffect(() => {
    if (!animate) return undefined;
    const id = setInterval(() => {
      setBars(heights.current.map(() => 4 + Math.random() * 9));
    }, 200);
    return () => clearInterval(id);
  }, [animate]);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2, height: 20 }}>
      {bars.map((h, i) => (
        <div
          key={i}
          style={{
            width: 2,
            height: h,
            background: isDarkMode ? "#60A5FA" : "#0A84FF",
            borderRadius: 2,
            transition: "height 0.1s ease",
            opacity: 0.8,
          }}
        />
      ))}
    </div>
  );
}

function ThemeModeSwitch({
  compact,
  isDarkMode,
  themeMode,
  onThemeModeChange,
}) {
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
        return (
          <button
            key={mode.key}
            type="button"
            data-ui-touch="true"
            onClick={() => onThemeModeChange(mode.key)}
            style={{
              border: "none",
              borderRadius: 999,
              padding: compact ? "2px 7px" : "3px 9px",
              fontSize: compact ? 9 : 10,
              fontWeight: selected ? 700 : 500,
              cursor: "pointer",
              color: selected ? "#0A84FF" : isDarkMode ? "#94A3B8" : "#64748B",
              background: selected ? "#DBEAFE" : "transparent",
              transition: "all 0.18s ease",
              whiteSpace: "nowrap",
            }}
            aria-label={`切换主题为${mode.label}`}
            title={mode.label}
          >
            {mode.label}
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
}) {
  const [utcTime, setUtcTime] = useState("");
  const [localTime, setLocalTime] = useState("");
  const [runDays, setRunDays] = useState(0);
  const [typeText, setTypeText] = useState("");
  const [msgIdx, setMsgIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [ping, setPing] = useState(12);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().split(" ").slice(4, 5)[0]);
      setLocalTime(now.toLocaleTimeString("zh-CN", { hour12: false }));
      const start = new Date("2024-09-01");
      setRunDays(Math.floor((now - start) / 86400000));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (compact) return undefined;

    const msg = TYPEWRITER_MESSAGES[msgIdx];
    let id;
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
      setDeleting(false);
      setMsgIdx((m) => (m + 1) % TYPEWRITER_MESSAGES.length);
    }
    return () => clearTimeout(id);
  }, [charIdx, compact, deleting, msgIdx]);

  useEffect(() => {
    const id = setInterval(() => {
      setPing(10 + Math.floor(Math.random() * 18));
    }, 2000);
    return () => clearInterval(id);
  }, []);

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
        gap: 0,
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
            src={clubLogo}
            alt="科成开放原子开源社团 Logo"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
            }}
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
            <Radio
              size={12}
              color={isDarkMode ? "#60A5FA" : "#0A84FF"}
              style={{ flexShrink: 0 }}
            />
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
              gap: "clamp(10px, 1vw, 16px)",
              minWidth: RIGHT_BLOCK_MIN_WIDTH,
              justifyContent: "flex-end",
            }}
          >
            <ThemeModeSwitch
              compact={false}
              isDarkMode={isDarkMode}
              themeMode={themeMode}
              onThemeModeChange={onThemeModeChange}
            />
            <WaveformBar animate={true} isDarkMode={isDarkMode} />
            <div
              style={{
                width: 1,
                height: 20,
                background: isDarkMode ? "#334155" : "#E5E7EB",
              }}
            />
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  justifyContent: "flex-end",
                }}
              >
                <Clock size={10} color={isDarkMode ? "#94A3B8" : "#64748B"} />
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: isDarkMode ? "#F8FAFC" : "#0F172A",
                    fontFamily: '"Courier New", monospace',
                  }}
                >
                  {localTime}
                </span>
              </div>
              <div
                style={{
                  fontSize: 9,
                  color: isDarkMode ? "#94A3B8" : "#64748B",
                  fontFamily: '"Courier New", monospace',
                  textAlign: "right",
                }}
              >
                UTC {utcTime}
              </div>
            </div>
            <div
              style={{
                width: 1,
                height: 20,
                background: isDarkMode ? "#334155" : "#E5E7EB",
              }}
            />
            <div style={{ textAlign: "right" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Wifi size={10} color="#10B981" />
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#10B981",
                    fontFamily: '"Courier New", monospace',
                  }}
                >
                  {ping}ms
                </span>
              </div>
              <div
                style={{
                  fontSize: 9,
                  color: isDarkMode ? "#94A3B8" : "#64748B",
                  letterSpacing: 0.5,
                }}
              >
                运行 {runDays} 天
              </div>
            </div>
          </div>
        </>
      ) : (
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 8,
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
          <span>{localTime}</span>
          <span style={{ color: isDarkMode ? "#475569" : "#CBD5E1" }}>·</span>
          <span style={{ color: "#10B981", fontWeight: 700 }}>{ping}ms</span>
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
