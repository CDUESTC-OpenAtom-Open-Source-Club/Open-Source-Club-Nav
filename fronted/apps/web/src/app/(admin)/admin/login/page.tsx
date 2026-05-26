"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cubeMotions, setCubeMotions] = useState(() =>
    Array.from({ length: 5 }).map((_, i) => ({
      id: i,
      size: [152, 96, 130, 108, 84][i],
      x: [560, 600, 640, 680, 720][i],
      y: [80, 260, 460, 640, 320][i],
      z: [-80, -300, -150, -240, -360][i],
      vx: [-0.52, -0.34, 0.24, 0.4, 0.56][i],
      vy: [1.2, 1.36, 1.12, 1.28, 1.18][i],
      layer: (["near", "far", "mid", "mid", "far"] as const)[i],
      delay: ["0s", "-5s", "-10s", "-15s", "-20s"][i],
    })),
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") router.push("/");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    const checkSession = async () => {
      try {
        const res = await fetch("/api/admin/me", { cache: "no-store" });
        if (!cancelled && res.ok) {
          router.replace("/admin");
        }
      } catch {
        // Ignore bootstrap check errors on login page.
      }
    };
    checkSession();
    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const topY = Math.max(70, height * 0.18);
    const midY = Math.max(140, height * 0.5);
    const bottomY = Math.max(220, height * 0.8);
    const centerX = width * 0.5;
    setCubeMotions((prev) =>
      prev.map((c, i) => ({
        ...c,
        x: centerX + [-120, -60, 0, 60, 120][i],
        y: [topY - 24, midY - 90, bottomY + 12, topY + 170, midY + 210][i],
        vx: [-0.56, -0.36, 0.22, 0.42, 0.6][i],
      })),
    );

    let frameId = 0;
    let lastTs = performance.now();

    const step = (ts: number) => {
      const dt = Math.min(32, ts - lastTs);
      lastTs = ts;
      const factor = dt / 16.67;
      const width = window.innerWidth;
      const height = window.innerHeight;

      setCubeMotions((prev) =>
        prev.map((c) => {
          // Physical model: gravity + air drag + inelastic collision bounce.
          const gravity = 0.015 * factor;
          const airDrag = 0.996;
          const restitutionX = 0.92;
          const restitutionY = 0.88;

          let vx = c.vx * Math.pow(airDrag, factor);
          let vy = c.vy * Math.pow(airDrag, factor) + gravity;
          let x = c.x + vx * factor;
          let y = c.y + vy * factor;
          const half = c.size / 2;
          const minSpeedX = 0.12;
          const minSpeedY = 0.28;

          if (x - half <= 0) {
            x = half;
            vx = Math.abs(vx) * restitutionX;
            vy *= 0.985;
          } else if (x + half >= width) {
            x = width - half;
            vx = -Math.abs(vx) * restitutionX;
            vy *= 0.985;
          }

          if (y - half <= 0) {
            y = half;
            vy = Math.abs(vy) * restitutionY;
            // Tiny lateral nudge on vertical collision to avoid robotic loops.
            vx += (Math.random() - 0.5) * 0.02;
          } else if (y + half >= height) {
            y = height - half;
            vy = -Math.abs(vy) * restitutionY;
            vx += (Math.random() - 0.5) * 0.03;
          }

          if (Math.abs(vx) < minSpeedX) {
            vx = minSpeedX * (vx >= 0 ? 1 : -1);
          }
          if (Math.abs(vy) < minSpeedY) {
            vy = minSpeedY * (vy >= 0 ? 1 : -1);
          }

          return { ...c, x, y, vx, vy };
        }),
      );

      frameId = requestAnimationFrame(step);
    };

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, []);

  const canSubmit = !loading && username.trim().length > 0 && password.length > 0;

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });
      const payload = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        throw new Error(payload?.error || "登录失败，请稍后重试");
      }
      router.replace("/admin");
    } catch (err) {
      setError(String((err as Error)?.message || "登录失败，请稍后重试"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-pro-bg">
      <div className="admin-login-pro-media" aria-hidden="true">
        <div className="admin-login-pro-media__gradient" />
        <div className="admin-login-pro-media__brandPattern" />
        <div className="admin-login-pro-media__halo" />
        <div className="admin-login-pro-cubefield">
          {cubeMotions.map((c) => (
            <div
              key={c.id}
              className={`admin-login-pro-cube admin-login-pro-cube--${c.layer}`}
              style={
                {
                  "--cube-size": `${c.size}px`,
                  "--cube-x": `${c.x}px`,
                  "--cube-y": `${c.y}px`,
                  "--cube-z": `${c.z}px`,
                  "--cube-delay": c.delay,
                } as React.CSSProperties
              }
            >
              <div className="admin-login-pro-cube__rotor">
                <span className="face f-front" />
                <span className="face f-back" />
                <span className="face f-right" />
                <span className="face f-left" />
                <span className="face f-top" />
                <span className="face f-bottom" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        className="admin-login-pro-topclose"
        onClick={() => router.push("/")}
        aria-label="关闭并返回首页"
      >
        ×
      </button>

      <div className="admin-login-pro-grid" aria-hidden="true">
        <span />
      </div>
      <div className="admin-login-pro-lines" aria-hidden="true">
        <i className="line line-1" />
        <i className="line line-2" />
        <i className="line line-3" />
      </div>
      <div className="admin-login-pro-shine" aria-hidden="true" />
      <div className="admin-login-pro-dots" aria-hidden="true">
        {Array.from({ length: 18 }).map((_, index) => (
          <span
            key={index}
            style={{
              left: `${8 + ((index * 11) % 82)}%`,
              top: `${10 + ((index * 13) % 78)}%`,
              animationDelay: `${index * 0.12}s`,
            }}
          />
        ))}
      </div>

      <div className="admin-login-pro-stage">
        <div className="admin-login-pro-shell">
          <div className="admin-login-pro-brand">
            <div className="admin-login-pro-brand__logoImageWrap" aria-hidden="true">
              <Image
                src="/images/brand/club-logo-user.jpg"
                alt="开放原子开源社团 Logo"
                width={72}
                height={72}
                className="admin-login-pro-brand__logoImage"
              />
            </div>
            <div className="admin-login-pro-brand__name">开放原子开源社团</div>
          </div>

          <form className="admin-login-pro-card" onSubmit={onSubmit}>
            <div className="admin-login-pro-card__eyebrow">OPENATOM CONSOLE</div>
            <h1 className="admin-login-pro-card__title">开放原子开源社团后台</h1>
            <p className="admin-login-pro-card__desc">请输入账号信息后登录管理后台。</p>

            {error ? (
              <div
                role="alert"
                style={{
                  marginBottom: 16,
                  border: "1px solid rgba(248, 113, 113, 0.45)",
                  background: "rgba(127, 29, 29, 0.22)",
                  color: "#FECACA",
                  borderRadius: 14,
                  padding: "12px 14px",
                  fontSize: 13,
                  lineHeight: 1.5,
                }}
              >
                {error}
              </div>
            ) : null}

            <label className="admin-login-pro-field">
              <span>用户名</span>
              <input
                className="admin-login-pro-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入用户名"
                autoComplete="username"
              />
            </label>

            <label className="admin-login-pro-field">
              <span>密码</span>
              <div className="admin-login-pro-password">
                <input
                  className="admin-login-pro-input"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="admin-login-pro-eye"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "隐藏密码" : "显示密码"}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    {showPassword ? (
                      <>
                        <path d="M3 3l18 18" />
                        <path d="M10.6 10.6a3 3 0 104.24 4.24" />
                        <path d="M7.5 7.9C5 9.5 3.5 12 3 12c1.3 3.3 4.6 6.5 9 6.5 1.4 0 2.7-.2 3.9-.6" />
                      </>
                    ) : (
                      <>
                        <path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12s-3.5 6.5-9.5 6.5S2.5 12 2.5 12Z" />
                        <circle cx="12" cy="12" r="3" />
                      </>
                    )}
                  </svg>
                </button>
              </div>
            </label>

            <button type="submit" className="admin-login-pro-submit admin-login-pro-submit--glow" disabled={!canSubmit}>
              {loading ? "登录中..." : "登录"}
            </button>

            <div style={{ marginTop: -8, textAlign: "right" }}>
              <button
                type="button"
                onClick={() => alert("请联系管理员重置密码")}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#93C5FD",
                  fontSize: 12,
                  cursor: "pointer",
                  textDecoration: "underline",
                  textUnderlineOffset: 3,
                }}
              >
                忘记密码？
              </button>
            </div>

            <div className="admin-login-pro-note">请妥善保管您的登录凭证</div>
            <div className="admin-login-pro-copyright">© 2026 开放原子开源社团 All Rights Reserved.</div>
          </form>
        </div>
      </div>
    </div>
  );
}
