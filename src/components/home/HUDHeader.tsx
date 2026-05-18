"use client";
import { useEffect, useState } from "react";
import { Radio, Clock3, Server, TimerReset } from "lucide-react";

const TYPEWRITER_MESSAGES = [
  "KCOS 缁夋垶鍨氬鈧弨鎯у斧鐎涙劕绱戝┃鎰仦閸?璺?閹恒垻鍌ㄩ妴浣稿彙閸掓稏鈧礁鍨庢禍?,
  "KCOS HUB ONLINE 璺?SYSTEM STATUS NORMAL",
  "Kecheng OpenAtom Open Source Club 璺?Build with global developers",
  "OPEN SOURCE CONNECTS IDEAS AND PEOPLE",
];

const HEADER_HEIGHT = "clamp(58px, 6.4vh, 68px)";
const HEADER_PADDING_X = "clamp(12px, 1.3vw, 20px)";
const LEFT_BLOCK_MIN_WIDTH = "clamp(156px, 18vw, 190px)";
const THEME_MODES = [
  { key: "light", label: "閻ц棄銇? },
  { key: "dark", label: "姒涙垵顧? },
  { key: "auto", label: "閼奉亜濮? },
];
const SYSTEM_STATUS_API = "/api/system";

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
            aria-label={`閸掑洦宕叉稉濠氼暯娑?{mode.label}`}
            title={mode.label}
          >
            {mode.label}
          </button>
        );
      })}
    </div>
  );
}

function formatDateTime(isoString) {
  if (!isoString) return "--";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "--";
  return date
    .toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
    .replace(/\//g, "-");
}

function formatUptime(sec) {
  const total = Number(sec || 0);
  if (!Number.isFinite(total) || total < 0) return "--";
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  if (days > 0) return `${days}婢?${hours}閺?${minutes}閸掑摲;
  if (hours > 0) return `${hours}閺?${minutes}閸?${seconds}缁夋妶;
  if (minutes > 0) return `${minutes}閸?${seconds}缁夋妶;
  return `${seconds}缁夋妶;
}

function formatClockTime(date) {
  return date.toLocaleTimeString("zh-CN", { hour12: false });
}

function StatusDivider({ isDarkMode }) {
  return (
    <div
      style={{
        width: 1,
        height: 30,
        background: isDarkMode
          ? "rgba(148,163,184,0.28)"
          : "rgba(148,163,184,0.16)",
        flexShrink: 0,
      }}
    />
  );
}

function StatusBlock({ icon: Icon, value, sub, accent, valueColor, isDarkMode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        minWidth: 0,
        padding: "0 10px",
        whiteSpace: "nowrap",
      }}
    >
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: 7,
          border: `1px solid ${accent}26`,
          background: isDarkMode
            ? `${accent}16`
            : "rgba(255,255,255,0.8)",
          boxShadow: `0 4px 10px ${accent}12`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={12} color={accent} />
      </div>

      <div style={{ minWidth: 0, display: "grid", gap: 1 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            lineHeight: 1.05,
            color: valueColor || (isDarkMode ? "#F8FAFC" : "#0F172A"),
            letterSpacing: 0.2,
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {value}
        </div>
        <div
          style={{
            fontSize: 9,
            lineHeight: 1.1,
            color: isDarkMode ? "#94A3B8" : "#64748B",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {sub}
        </div>
      </div>
    </div>
  );
}

function WifiSignalIcon({ size = 12, color = "#10B981", level = 4 }) {
  const bars = [0.34, 0.54, 0.74, 0.96];
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "end",
        justifyContent: "center",
        gap: 1,
      }}
    >
      {bars.map((heightScale, index) => {
        const active = index < level;
        return (
          <span
            key={heightScale}
            style={{
              width: 1.8,
              height: Math.max(2, Math.round(size * heightScale)),
              borderRadius: 999,
              background: active ? color : "rgba(148,163,184,0.42)",
              boxShadow: active ? `0 0 6px ${color}55` : "none",
              opacity: active ? 1 : 0.7,
            }}
          />
        );
      })}
    </div>
  );
}

function clampPercent(value) {
  if (!Number.isFinite(value)) return null;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getSignalQualityLabel(percent) {
  if (percent === null) return "閺堫亞鐓?;
  if (percent >= 85) return "濠娾剝鐗?;
  if (percent >= 65) return "瀵?;
  if (percent >= 40) return "娑?;
  if (percent > 0) return "瀵?;
  return "缁傝崵鍤?;
}

function readBrowserWifiStatus() {
  if (typeof navigator === "undefined") {
    return {
      available: false,
      connected: false,
      signalPercent: null,
      signalLevel: 0,
      qualityLabel: "閺堫亞鐓?,
      linkLabel: "缂冩垹绮?,
      detail: "濞村繗顫嶉崳銊︽弓鐏忚京鍗?,
    };
  }

  const connection =
    navigator.connection ||
    navigator.mozConnection ||
    navigator.webkitConnection ||
    null;
  const online = navigator.onLine !== false;

  if (!online) {
    return {
      available: true,
      connected: false,
      signalPercent: 0,
      signalLevel: 0,
      qualityLabel: "缁傝崵鍤?,
      linkLabel: "缂冩垹绮?,
      detail: "瑜版挸澧犵拋鎯ь槵閺堫亣浠堢純?,
    };
  }

  const effectiveType = connection?.effectiveType || null;
  const connectionType = connection?.type || null;
  const downlink =
    typeof connection?.downlink === "number" ? connection.downlink : null;
  const rtt = typeof connection?.rtt === "number" ? connection.rtt : null;

  let signalPercent = null;
  if (effectiveType === "slow-2g") signalPercent = 18;
  else if (effectiveType === "2g") signalPercent = 32;
  else if (effectiveType === "3g") signalPercent = 56;
  else if (effectiveType === "4g") signalPercent = 78;
  else signalPercent = 72;

  if (downlink !== null) {
    signalPercent = signalPercent * 0.7 + Math.min(100, downlink * 8) * 0.3;
  }
  if (rtt !== null) {
    signalPercent -= Math.min(25, rtt / 8);
  }

  signalPercent = clampPercent(signalPercent);
  const signalLevel =
    signalPercent === null
      ? 0
      : signalPercent >= 85
        ? 4
        : signalPercent >= 65
          ? 3
          : signalPercent >= 40
            ? 2
            : 1;

  const linkLabel =
    connectionType === "wifi"
      ? "WiFi"
      : connectionType === "ethernet"
        ? "閺堝鍤?
        : connectionType === "cellular"
          ? "缁夎濮╃純鎴犵捕"
          : "缂冩垹绮?;

  const detailParts = [];
  if (effectiveType) detailParts.push(effectiveType.toUpperCase());
  if (typeof downlink === "number") {
    detailParts.push(`${downlink.toFixed(downlink >= 10 ? 0 : 1)}Mbps`);
  }
  if (typeof rtt === "number") {
    detailParts.push(`${Math.round(rtt)}ms`);
  }
  if (!detailParts.length) detailParts.push("鐎圭偞妞傛导鎵暬");

  return {
    available: true,
    connected: true,
    signalPercent,
    signalLevel,
    qualityLabel: getSignalQualityLabel(signalPercent),
    linkLabel,
    detail: detailParts.join(" 璺?"),
  };
}

function WifiRuntimeStatus({ isDarkMode }) {
  const [clockNow, setClockNow] = useState(() => new Date());
  const [systemStatus, setSystemStatus] = useState({
    now: null,
    startedAt: null,
    uptimeSec: 0,
    syncAt: 0,
    wifi: {
      available: false,
      connected: false,
      ssid: null,
      signalPercent: null,
    },
  });
  const [browserWifi, setBrowserWifi] = useState(() => readBrowserWifiStatus());

  const refreshSystemStatus = async () => {
    const syncedAt = Date.now();
    try {
      const response = await fetch(SYSTEM_STATUS_API, { cache: "no-store" });
      if (!response.ok) return;
      const payload = await response.json();
      setSystemStatus({
        now: payload?.serverNow || payload?.now || null,
        startedAt: payload?.startedAt || null,
        uptimeSec: Number(payload?.uptimeSec || 0),
        syncAt: 0,
        wifi: {
          available: Boolean(payload?.wifi?.available),
          connected: Boolean(payload?.wifi?.connected),
          ssid: payload?.wifi?.ssid || null,
          signalPercent:
            payload?.wifi?.signalPercent === null ||
            payload?.wifi?.signalPercent === undefined
              ? null
              : Number(payload.wifi.signalPercent),
        },
      });
    } catch {
      // keep previous snapshot
    }
  };

  useEffect(() => {
    const refreshBrowserWifi = () => {
      setBrowserWifi(readBrowserWifiStatus());
    };

    refreshBrowserWifi();

    const clockTimer = window.setInterval(() => {
      setClockNow(new Date());
    }, 1000);
    const bootTimer = setTimeout(() => {
      refreshSystemStatus();
    }, 0);
    const timer = setInterval(refreshSystemStatus, 10000);
    const wifiTimer = window.setInterval(refreshBrowserWifi, 3000);
    window.addEventListener("online", refreshBrowserWifi);
    window.addEventListener("offline", refreshBrowserWifi);
    const connection =
      window.navigator.connection ||
      window.navigator.mozConnection ||
      window.navigator.webkitConnection ||
      null;
    connection?.addEventListener?.("change", refreshBrowserWifi);
    return () => {
      window.clearInterval(clockTimer);
      clearTimeout(bootTimer);
      clearInterval(timer);
      window.clearInterval(wifiTimer);
      window.removeEventListener("online", refreshBrowserWifi);
      window.removeEventListener("offline", refreshBrowserWifi);
      connection?.removeEventListener?.("change", refreshBrowserWifi);
    };
  }, []);

  const liveUptime = Math.max(
    0,
    systemStatus.uptimeSec +
      Math.floor((clockNow.getTime() - systemStatus.syncAt) / 1000),
  );
  const wifiStatus = browserWifi.available ? browserWifi : systemStatus.wifi;
  const wifiPercent = clampPercent(wifiStatus.signalPercent);
  const wifiValue = wifiStatus.connected
    ? wifiPercent === null
      ? `${wifiStatus.linkLabel} 閸︺劎鍤巂
      : `${wifiStatus.qualityLabel} ${wifiPercent}%`
    : "缂冩垹绮剁粋鑽ゅ殠";
  const wifiSub = wifiStatus.connected
    ? `${wifiStatus.linkLabel} 璺?${wifiStatus.detail}`
    : wifiStatus.available
      ? "鐎圭偞妞傜純鎴犵捕閻樿埖鈧胶娲冨ù瀣╄厬"
      : "缂冩垹绮堕悩鑸碘偓浣规弓閼惧嘲褰?;
  const wifiAccent =
    !wifiStatus.connected || wifiPercent === null
      ? "#64748B"
      : wifiPercent >= 85
        ? "#10B981"
        : wifiPercent >= 55
          ? "#0A84FF"
          : "#F59E0B";
  const wifiLevel =
    !wifiStatus.connected || wifiPercent === null
      ? 0
      : wifiPercent >= 85
        ? 4
        : wifiPercent >= 65
          ? 3
          : wifiPercent >= 40
            ? 2
            : 1;
  const localClock = formatClockTime(clockNow);
  const utcClock = `UTC ${clockNow.toISOString().slice(11, 19)}`;
  const startedAt = formatDateTime(systemStatus.startedAt);
  const uptime = formatUptime(liveUptime);

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0,
        padding: "4px 8px",
        borderRadius: 16,
        border: `1px solid ${isDarkMode ? "#334155" : "#D6E7F7"}`,
        background: isDarkMode
          ? "linear-gradient(180deg, rgba(15,23,42,0.98), rgba(15,23,42,0.88))"
          : "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(247,250,255,0.92))",
        boxShadow: isDarkMode
          ? "0 10px 24px rgba(15,23,42,0.18)"
          : "0 10px 24px rgba(15,23,42,0.06)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        minWidth: 0,
        flexShrink: 0,
      }}
    >
      <StatusBlock
        icon={(props) => <WifiSignalIcon {...props} level={wifiLevel} />}
        value={wifiValue}
        sub={wifiSub}
        accent={wifiAccent}
        valueColor={wifiAccent}
        isDarkMode={isDarkMode}
      />
      <StatusDivider isDarkMode={isDarkMode} />
      <StatusBlock
        icon={Clock3}
        value={localClock}
        sub={utcClock}
        accent="#0A84FF"
        valueColor={isDarkMode ? "#F8FAFC" : "#0F172A"}
        isDarkMode={isDarkMode}
      />
      <StatusDivider isDarkMode={isDarkMode} />
      <StatusBlock
        icon={Server}
        value={startedAt || "閸氼垰濮╅弮鍫曟？ --"}
        sub="閺堝秴濮熼崥顖氬З閺冨爼妫?
        accent="#8B5CF6"
        valueColor={isDarkMode ? "#F8FAFC" : "#0F172A"}
        isDarkMode={isDarkMode}
      />
      <StatusDivider isDarkMode={isDarkMode} />
      <StatusBlock
        icon={TimerReset}
        value={uptime}
        sub="瀹歌尪绻嶇悰灞炬闂€?
        accent="#F59E0B"
        valueColor={isDarkMode ? "#F8FAFC" : "#0F172A"}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}

export default function HUDHeader({
  compact = false,
  isDarkMode = false,
  themeMode = "auto",
  onThemeModeChange = () => {},
}) {
  const [typeText, setTypeText] = useState("");
  const [msgIdx, setMsgIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const deletingRef = useRef(false);

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
        id = setTimeout(() => deletingRef.current = true;
        setDeleting(true), 2200);
      }
    } else if (charIdx > 0) {
      id = setTimeout(() => {
        setTypeText(msg.slice(0, charIdx - 1));
        setCharIdx((c) => c - 1);
      }, 28);
    } else {
      deletingRef.current = false;
      setDeleting(false);
      setMsgIdx((m) => (m + 1) % TYPEWRITER_MESSAGES.length);
    }
    return () => clearTimeout(id);
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
            src="/images/brand/club-logo-user.jpg"
            alt="缁夋垶鍨氬鈧弨鎯у斧鐎涙劕绱戝┃鎰仦閸?Logo"
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
              gap: "clamp(8px, 0.8vw, 12px)",
              minWidth: 0,
              justifyContent: "flex-end",
              marginLeft: "auto",
            }}
          >
            <ThemeModeSwitch
              compact={false}
              isDarkMode={isDarkMode}
              themeMode={themeMode}
              onThemeModeChange={onThemeModeChange}
            />
            <WifiRuntimeStatus isDarkMode={isDarkMode} />
          </div>
        </>
      ) : (
        <div
          style={{
            marginLeft: "auto",
          }}
        >
          <ThemeModeSwitch
            compact={true}
            isDarkMode={isDarkMode}
            themeMode={themeMode}
            onThemeModeChange={onThemeModeChange}
          />
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
