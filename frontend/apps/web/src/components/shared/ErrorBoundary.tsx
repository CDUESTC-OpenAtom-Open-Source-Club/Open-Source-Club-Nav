"use client";

import React from "react";

type Props = {
  children: React.ReactNode;
  /** 加载失败时的降级 UI */
  fallback?: React.ReactNode;
};

type State = {
  hasError: boolean;
};

/**
 * ErrorBoundary — 捕获子组件渲染错误并展示降级 UI，
 * 避免整个页面因 3D/Canvas 异常而白屏。
 */
export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 开发环境打印详细信息
    if (process.env.NODE_ENV === "development") {
      console.error("[ErrorBoundary]", error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? null;
    }
    return this.props.children;
  }
}
