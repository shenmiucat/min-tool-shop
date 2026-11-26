/**
 * 深色 / 淺色主題切換 Hook
 * 同步更新 <html class="dark"> 與 localStorage 偏好設定。
 */

import { useCallback, useEffect, useState } from 'react';
import type { ThemeMode } from '../types/workshop';
import { THEME_STORAGE_KEY } from '../utils/storage';

function getInitialTheme(): ThemeMode {
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  } catch {
    // 忽略隱私模式可能造成的存取例外
  }
  return 'light';
}

export function useTheme() {
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // 忽略寫入失敗
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, toggleTheme };
}
