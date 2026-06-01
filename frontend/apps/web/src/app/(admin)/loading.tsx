import styles from "./state.module.css";

export default function AdminLoading() {
  return (
    <main className={styles.screen}>
      <div className={styles.loadingText}>后台加载中...</div>
    </main>
  );
}
