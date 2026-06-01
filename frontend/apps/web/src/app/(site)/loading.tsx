import styles from "./state.module.css";

export default function SiteLoading() {
  return (
    <main className={styles.screen}>
      <div className={styles.loadingText}>页面加载中...</div>
    </main>
  );
}
