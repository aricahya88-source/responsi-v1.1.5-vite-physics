export default function ThemeToggle({ theme, onThemeChange }) {
  return (
    <div className="theme-toggle" aria-label="Pengaturan tema">
      <button
        type="button"
        className={theme === "light" ? "active" : ""}
        onClick={() => onThemeChange("light")}
        aria-pressed={theme === "light"}
      >
        Terang
      </button>
      <button
        type="button"
        className={theme === "dark" ? "active" : ""}
        onClick={() => onThemeChange("dark")}
        aria-pressed={theme === "dark"}
      >
        Gelap
      </button>
    </div>
  );
}
