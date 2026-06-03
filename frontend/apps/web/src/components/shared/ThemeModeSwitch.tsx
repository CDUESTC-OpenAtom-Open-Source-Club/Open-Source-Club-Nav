"use client";
import styles from "./ThemeModeSwitch.module.css";

export type ThemeMode = "light" | "dark" | "auto";

/**
 * ThemeModeSwitchProps
 * - `compact`: use compact font size in dense headers
 * - `isDarkMode`: current resolved theme state
 * - `onThemeModeChange`: callback when user toggles mode
 *
 * Example:
 * `<ThemeModeSwitch compact={false} isDarkMode={isDark} onThemeModeChange={setMode} />`
 */
export type ThemeModeSwitchProps = {
  compact: boolean;
  isDarkMode: boolean;
  onThemeModeChange: (mode: ThemeMode) => void;
};

export function ThemeModeSwitch({
  compact,
  isDarkMode,
  onThemeModeChange,
}: ThemeModeSwitchProps) {
  const nextMode = isDarkMode ? "light" : "dark";

  return (
    <div
      className={styles.wrapper}
      style={{
        fontSize: compact ? "11px" : "15px",
      }}
    >
      <button
        type="button"
        className={styles.switch}
        role="switch"
        aria-checked={!isDarkMode}
        aria-label={isDarkMode ? "切换到白天模式" : "切换到夜间模式"}
        data-checked={!isDarkMode}
        onClick={(event) => {
          event.preventDefault();
          onThemeModeChange(nextMode);
        }}
        onKeyDown={(event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          onThemeModeChange(nextMode);
        }}
      >
        <span className={styles.slider}>
          <span className={styles.sunRays} />
          <span className={`${styles.star} ${styles.star1}`} />
          <span className={`${styles.star} ${styles.star2}`} />
          <span className={`${styles.star} ${styles.star3}`} />
          <svg viewBox="0 0 16 16" className={styles.cloud}>
            <path
              transform="matrix(.77976 0 0 .78395-299.99-418.63)"
              fill="#fff"
              d="m391.84 540.91c-.421-.329-.949-.524-1.523-.524-1.351 0-2.451 1.084-2.485 2.435-1.395.526-2.388 1.88-2.388 3.466 0 1.874 1.385 3.423 3.182 3.667v.034h12.73v-.006c1.775-.104 3.182-1.584 3.182-3.395 0-1.747-1.309-3.186-2.994-3.379.007-.106.011-.214.011-.322 0-2.707-2.271-4.901-5.072-4.901-2.073 0-3.856 1.202-4.643 2.925"
            />
          </svg>
        </span>
      </button>
    </div>
  );
}
