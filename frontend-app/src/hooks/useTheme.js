import { useState } from 'react';

export function useTheme() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      if (localStorage.getItem('innocean_auth') !== 'true') return true; // Landing Page selalu dark
      if ('theme' in localStorage) {
        return localStorage.getItem('theme') === 'dark';
      }
      return true; // Default to dark theme for new visitors
    }
    return true;
  });
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
    isDarkMode, setIsDarkMode,
    appTheme, setAppTheme,
    appBgImage, setAppBgImage,
    appTexture, setAppTexture,
    cardTheme, setCardTheme,
    language, setLanguage,
  };
}
