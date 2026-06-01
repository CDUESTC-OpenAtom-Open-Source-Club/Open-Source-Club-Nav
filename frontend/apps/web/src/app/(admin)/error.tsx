"use client";

import { useEffect } from "react";
import styles from "./state.module.css";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin] route error:", error);
  }, [error]);

  return (
    <main className={styles.screen}>
      <div className={styles.panel}>
        <h1 className={styles.title}>后台页面异常</h1>
        <p className={styles.desc}>当前页面出现错误，请点击重试。</p>
        <button type="button" onClick={reset} className={styles.btn}>
          重试
        </button>
      </div>
    </main>
  );
}
