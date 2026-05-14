"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") router.push("/");
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router]);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    router.replace("/admin");
  };

  return (
    <div className="admin-login-bg">
      <div className="admin-login-stage">
        <div className="admin-login-shell admin-login-shell--city">
          <section className="admin-login-visual">
            <div className="admin-login-visual__image" />
            <div className="admin-login-visual__haze" />
            <div className="admin-login-visual__grid" />
            <div className="admin-login-visual__glow admin-login-visual__glow--one" />
            <div className="admin-login-visual__glow admin-login-visual__glow--two" />
            <div className="admin-login-visual__float admin-login-visual__float--one" />
            <div className="admin-login-visual__float admin-login-visual__float--two" />
            <div className="admin-login-visual__float admin-login-visual__float--three" />

            <div className="admin-login-visual__hud">
              <div className="admin-login-visual__tag">OpenAtom Console</div>
              <h2>城市科技感登录视图</h2>
              <p>将背景图、雾光渲染与轻量动态效果结合，兼顾展示感与登录效率。</p>
            </div>
          </section>

          <form className="admin-login-formWrap" onSubmit={onSubmit}>
            <div className="admin-login-form">
              <button
                type="button"
                aria-label="关闭并返回首页"
                onClick={() => router.push("/")}
                className="admin-login-close"
              >
                ×
              </button>

              <div className="admin-login-form__eyebrow">Admin Access</div>
              <h1 className="admin-login-form__title">欢迎登录</h1>
              <p className="admin-login-form__desc">
                当前阶段为演示模式，点击登录将直接进入后台。
              </p>

              <label className="admin-login-form__label">
                <span>账号</span>
                <input
                  className="admin-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="请输入账号"
                  autoComplete="username"
                />
              </label>

              <label className="admin-login-form__label">
                <span>密码</span>
                <input
                  className="admin-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  autoComplete="current-password"
                />
              </label>

              <button type="submit" className="admin-login-submit" data-ui-touch="true">
                登录后台
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
