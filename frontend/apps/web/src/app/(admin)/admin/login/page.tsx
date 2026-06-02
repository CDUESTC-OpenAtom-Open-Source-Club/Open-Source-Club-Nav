"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoginScene } from "@/components/admin/LoginScene";
import styles from "./page.module.css";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      setPassword("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-pro-bg">
      <LoginScene />

      <button
        type="button"
        className="admin-login-pro-topclose"
        onClick={() => router.push("/")}
        aria-label="关闭并返回首页"
      >
        ×
      </button>

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
                className={styles.errorBox}
              >
                {error}
              </div>
            ) : null}

            <label className="admin-login-pro-field">
              <span>用户名</span>
              <input
                id="admin-username"
                name="username"
                type="text"
                className="admin-login-pro-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入用户名"
                autoComplete="username"
                required
              />
            </label>

            <label className="admin-login-pro-field">
              <span>密码</span>
              <div className="admin-login-pro-password">
                <input
                  id="admin-password"
                  name="current-password"
                  className="admin-login-pro-input"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  autoComplete="current-password"
                  required
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

            <div className={styles.forgotWrap}>
              <button
                type="button"
                onClick={() => alert("请联系管理员重置密码")}
                className={styles.forgotButton}
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
