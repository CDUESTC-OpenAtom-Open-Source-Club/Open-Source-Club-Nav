"use client";

import { useEffect } from "react";
import styles from "./state.module.css";

export default function SiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[site] route error:", error);
  }, [error]);

  return (
    <main className={styles.screen}>
      <div className={styles.panel}>
        <h1 className={styles.title}>页面加载失败</h1>
        <p className={styles.desc}>发生了运行时错误，请重试。</p>
        <button type="button" onClick={reset} className={styles.btn}>
          重新加载
        </button>
      </div>
    </main>
  );
}
