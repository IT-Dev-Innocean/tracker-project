import { useState, useEffect, useCallback } from 'react';

const getSystemIsDark = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-color-scheme: dark)').matches;

const resolveIsDark = (mode) => {
  if (mode === 'auto') return getSystemIsDark();
  return mode === 'dark';
};

const readStoredThemeMode = () => {
  if (typeof window === 'undefined') return 'dark';
  if (localStorage.getItem('innocean_auth') !== 'true') return 'dark';
  const stored = localStorage.getItem('theme');
  if (stored === 'light' || stored === 'dark' || stored === 'auto') return stored;
  return 'dark';
};

export function useTheme() {
  const [themeMode, setThemeModeState] = useState(readStoredThemeMode);
  const [isDarkMode, setIsDarkModeState] = useState(() =>
    resolveIsDark(readStoredThemeMode())
  );

  const setThemeMode = useCallback((mode) => {
    setThemeModeState(mode);
    setIsDarkModeState(resolveIsDark(mode));
  }, []);

  /** Legacy boolean setter — maps to light/dark (not auto). */
  const setIsDarkMode = useCallback((value) => {
    setIsDarkModeState((prev) => {
      const next = typeof value === 'function' ? value(prev) : value;
      setThemeModeState(next ? 'dark' : 'light');
      return next;
    });
  }, []);

  useEffect(() => {
    if (themeMode !== 'auto' || typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e) => setIsDarkModeState(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [themeMode]);

  const [appTheme, setAppTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      if (localStorage.getItem('innocean_auth') !== 'true') return '';
      return localStorage.getItem('innocean_app_theme') || '';
    }
    return '';
  });
  const [appBgImage, setAppBgImage] = useState(() => {
    if (typeof window !== 'undefined') {
      if (localStorage.getItem('innocean_auth') !== 'true') return '';
      return localStorage.getItem('innocean_app_bg_image') || '';
    }
    return '';
  });
  const [appTexture, setAppTexture] = useState(() => {
    if (typeof window !== 'undefined') {
      if (localStorage.getItem('innocean_auth') !== 'true') return '';
      return localStorage.getItem('innocean_app_texture') || '';
    }
    return '';
  });
  const [cardTheme, setCardTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      if (localStorage.getItem('innocean_auth') !== 'true') return '';
      return localStorage.getItem('innocean_card_theme') || '';
    }
    return '';
  });
  const [language, setLanguage] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('innocean_lang') || 'en';
    return 'en';
  });

  return {
    isDarkMode,
    setIsDarkMode,
    themeMode,
    setThemeMode,
    appTheme,
    setAppTheme,
    appBgImage,
    setAppBgImage,
    appTexture,
    setAppTexture,
    cardTheme,
    setCardTheme,
    language,
    setLanguage,
  };
}
