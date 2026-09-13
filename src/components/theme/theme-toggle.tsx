"use client";

import { useEffect, useState } from "react";

type Theme = "dark" | "light";

type ThemeToggleProps = {
  compact?: boolean;
};

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function ThemeToggle({ compact = false }: ThemeToggleProps) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const stored = window.localStorage.getItem("kinetiq-theme");
    const initial: Theme = stored === "light" ? "light" : "dark";
    setTheme(initial);
    applyTheme(initial);
  }, []);

  const toggleTheme = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    window.localStorage.setItem("kinetiq-theme", next);
    applyTheme(next);
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      className={`theme-toggle inline-flex items-center justify-center border border-white/10 bg-white/[0.03] text-white/60 transition hover:border-[#d7ff45]/35 hover:text-[#d7ff45] ${compact ? "h-8 w-8 rounded-full text-[13px]" : "h-9 gap-2 rounded-lg px-3 text-[10px]"}`}
    >
      <span aria-hidden="true">{theme === "dark" ? "☀" : "☾"}</span>
      {!compact && <span>{theme === "dark" ? "Light" : "Dark"}</span>}
    </button>
  );
}
