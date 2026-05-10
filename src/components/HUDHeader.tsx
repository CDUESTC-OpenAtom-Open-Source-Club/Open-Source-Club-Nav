"use client";
import { useState, useEffect, useRef } from "react";
import { Wifi, Clock, Radio } from "lucide-react";

const TYPEWRITER_MESSAGES = [
  "KCOS 科成开放原子开源社团 · 探索、共创、分享",
  "KCOS HUB ONLINE · SYSTEM STATUS NORMAL",
  "Kecheng OpenAtom Open Source Club · Build with global developers",
  "OPEN SOURCE CONNECTS IDEAS AND PEOPLE",
];

function WaveformBar({ animate }: { animate: boolean }) {
  const heightsRef = useRef([4, 6, 10, 7, 12, 9, 8, 10, 6, 7]);
  const [bars, setBars] = useState(heightsRef.current);

  useEffect(() => {
    if (!animate) return;
    const id = setInterval(() => {
      setBars(heightsRef.current.map(() => 4 + Math.random() * 9));
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
            background: "linear-gradient(to top, #0A84FF, #38BDF8)",
            borderRadius: 2,
            transition: "height 0.1s ease",
            opacity: 0.8,
          }}
        />
      ))}
    </div>
  );
}

export default function HUDHeader() {
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
      setRunDays(Math.floor((now.getTime() - start.getTime()) / 86400000));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const msg = TYPEWRITER_MESSAGES[msgIdx];
    let id: ReturnType<typeof setTimeout>;
    if (!deleting) {
      if (charIdx < msg.length) {
        id = setTimeout(() => {
          setTypeText(msg.slice(0, charIdx + 1));
          setCharIdx((c) => c + 1);
        }, 55);
      } else {
        id = setTimeout(() => setDeleting(true), 2200);
      }
    } else {
      if (charIdx > 0) {
        id = setTimeout(() => {
          setTypeText(msg.slice(0, charIdx - 1));
          setCharIdx((c) => c - 1);
        }, 28);
      } else {
        setDeleting(false);
        setMsgIdx((m) => (m + 1) % TYPEWRITER_MESSAGES.length);
      }
    }
    return () => clearTimeout(id);
  }, [charIdx, deleting, msgIdx]);

  useEffect(() => {
    const id = setInterval(() => {
      setPing(10 + Math.floor(Math.random() * 18));
    }, 2000);
    return () => clearInterval(id);
  }, []);

  return (
    <header
      style={{
        height: 54,
        background: "rgba(255,255,255,0.92)",
        borderBottom: "1px solid #E5E7EB",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        gap: 0,
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Left: Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 190 }}>
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: "50%",
            border: "1.5px solid #0A84FF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 12px rgba(10,132,255,0.2)",
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 9, fontWeight: 700, color: "#0A84FF", letterSpacing: 0.5 }}>KC</span>
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#0F172A", letterSpacing: 0.5 }}>KCOS</div>
          <div style={{ fontSize: 9, color: "#64748B", letterSpacing: 1.5, textTransform: "uppercase" }}>
            kcos.club
          </div>
        </div>
      </div>

      {/* Center: Typewriter */}
      <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}>
        <Radio size={12} color="#0A84FF" style={{ flexShrink: 0 }} />
        <span
          style={{
            fontSize: 12,
            color: "#0A84FF",
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
              background: "#0A84FF",
              verticalAlign: "middle",
              marginLeft: 2,
              animation: "blink 1s infinite",
            }}
          />
        </span>
      </div>

      {/* Right: Waveform + Time + Ping */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, minWidth: 280, justifyContent: "flex-end" }}>
        <WaveformBar animate={true} />
        <div style={{ width: 1, height: 20, background: "#E5E7EB" }} />
        <div style={{ textAlign: "right" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
            <Clock size={10} color="#64748B" />
            <span style={{ fontSize: 11, fontWeight: 600, color: "#0F172A", fontFamily: '"Courier New", monospace' }}>
              {localTime}
            </span>
          </div>
          <div style={{ fontSize: 9, color: "#64748B", fontFamily: '"Courier New", monospace', textAlign: "right" }}>
            UTC {utcTime}
          </div>
        </div>
        <div style={{ width: 1, height: 20, background: "#E5E7EB" }} />
        <div style={{ textAlign: "right" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Wifi size={10} color="#10B981" />
            <span style={{ fontSize: 11, fontWeight: 600, color: "#10B981", fontFamily: '"Courier New", monospace' }}>
              {ping}ms
            </span>
          </div>
          <div style={{ fontSize: 9, color: "#64748B", letterSpacing: 0.5 }}>运行 {runDays} 天</div>
        </div>
      </div>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </header>
  );
}
