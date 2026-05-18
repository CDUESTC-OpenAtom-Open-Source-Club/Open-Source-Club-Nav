"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

function getPasswordStrength(value: string) {
  let score = 0;
  if (value.length >= 8) score += 25;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 25;
  if (/\d/.test(value)) score += 25;
  if (/[^A-Za-z0-9]/.test(value)) score += 25;
  const level = score >= 75 ? "强" : score >= 50 ? "中" : score > 0 ? "弱" : "无";
  return { score, level };
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") router.push("/");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router]);

  const canSubmit = useMemo(() => !loading, [loading]);
  const strength = useMemo(() => getPasswordStrength(password), [password]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 260));
    router.replace("/admin");
  };

  return (
    <div className="admin-login-pro-bg">
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
          <span key={index} style={{ left: `${8 + ((index * 11) % 82)}%`, top: `${10 + ((index * 13) % 78)}%`, animationDelay: `${index * 0.12}s` }} />
        ))}
      </div>

      <div className="admin-login-pro-stage">
        <div className="admin-login-pro-shell">
          <div className="admin-login-pro-brand">
            <div className="admin-login-pro-brand__logoImageWrap" aria-hidden="true">
              <Image
                src="/images/branding/openatom-club-logo.svg"
                alt="开放原子开源社团 Logo"
                width={72}
                height={72}
                className="admin-login-pro-brand__logoImage"
                priority
              />
            </div>
            <div className="admin-login-pro-brand__name">开放原子开源社团</div>
          </div>

          <form className="admin-login-pro-card" onSubmit={onSubmit}>
            <div className="admin-login-pro-card__eyebrow">OPENATOM CONSOLE</div>
            <h1 className="admin-login-pro-card__title">开放原子开源社团后台</h1>
            <p className="admin-login-pro-card__desc">当前演示阶段，点击登录即可进入后台</p>

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

            <div className="admin-login-pro-strength" aria-live="polite">
              <div className="admin-login-pro-strength__meta">
                <span>密码强度</span>
                <strong>{strength.level}</strong>
              </div>
              <div className="admin-login-pro-strength__track">
                <div className={`admin-login-pro-strength__fill level-${strength.level}`} style={{ width: `${strength.score}%` }} />
              </div>
            </div>

            <button type="submit" className="admin-login-pro-submit admin-login-pro-submit--glow" disabled={!canSubmit}>
              {loading ? "登录中..." : "登录"}
            </button>

            <div className="admin-login-pro-note">请妥善保管您的登录凭证</div>
            <div className="admin-login-pro-copyright">© 2026 开放原子开源社团. All Rights Reserved.</div>
          </form>
        </div>
      </div>
    </div>
  );
}
