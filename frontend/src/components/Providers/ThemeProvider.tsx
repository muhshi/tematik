"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { BPS_THEMES, DEFAULT_THEME, type ThemeId, type ThemeOption } from "@/lib/theme";

interface ThemeContextType {
  theme: ThemeId;
  setTheme: (themeId: ThemeId) => void;
  currentThemeConfig: ThemeOption;
  themes: ThemeOption[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(DEFAULT_THEME);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // 1. Baca tema dari localStorage atau cookie atau DOM
    let savedTheme: ThemeId = DEFAULT_THEME;
    try {
      const fromLocal = localStorage.getItem("bps-theme") as ThemeId;
      if (fromLocal && ["blue", "orange", "green"].includes(fromLocal)) {
        savedTheme = fromLocal;
      } else {
        const fromDom = document.documentElement.getAttribute("data-theme") as ThemeId;
        if (fromDom && ["blue", "orange", "green"].includes(fromDom)) {
          savedTheme = fromDom;
        }
      }
    } catch {
      // Ignore
    }

    setThemeState(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
    setMounted(true);
  }, []);

  const setTheme = (newTheme: ThemeId) => {
    if (!["blue", "orange", "green"].includes(newTheme)) return;

    setThemeState(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);

    try {
      localStorage.setItem("bps-theme", newTheme);
      document.cookie = `bps-theme=${newTheme}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {
      // Ignore
    }
  };

  const currentThemeConfig = BPS_THEMES.find((t) => t.id === theme) || BPS_THEMES[0];

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        currentThemeConfig,
        themes: BPS_THEMES,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
