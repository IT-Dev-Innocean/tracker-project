/** Accent colors used for hover / focus / active UI that should follow Appearance theme */
export const THEME_ACCENTS = {
  '': {
    light: '#4f46e5',
    dark: '#818cf8',
    softLight: 'rgba(79, 70, 229, 0.12)',
    softDark: 'rgba(129, 140, 248, 0.18)',
    contrast: '#ffffff',
  },
  gamer: {
    light: '#1a44c2',
    dark: '#66c0f4',
    softLight: 'rgba(26, 68, 194, 0.12)',
    softDark: 'rgba(102, 192, 244, 0.15)',
    contrast: '#ffffff',
  },
  minimal: {
    light: '#1a73e8',
    dark: '#8ab4f8',
    softLight: 'rgba(26, 115, 232, 0.12)',
    softDark: 'rgba(138, 180, 248, 0.18)',
    contrast: '#ffffff',
  },
  sunset: {
    light: '#dc2743',
    dark: '#f09433',
    softLight: 'rgba(220, 39, 67, 0.12)',
    softDark: 'rgba(240, 148, 51, 0.18)',
    contrast: '#ffffff',
  },
  hacker: {
    light: '#66D9EF',
    dark: '#A6E22E',
    softLight: 'rgba(102, 217, 239, 0.12)',
    softDark: 'rgba(166, 226, 46, 0.15)',
    contrast: '#272822',
  },
  chatapp: {
    light: '#5865F2',
    dark: '#5865F2',
    softLight: 'rgba(88, 101, 242, 0.12)',
    softDark: 'rgba(88, 101, 242, 0.2)',
    contrast: '#ffffff',
  },
  editor: {
    light: '#FC9867',
    dark: '#FC9867',
    softLight: 'rgba(252, 152, 103, 0.15)',
    softDark: 'rgba(252, 152, 103, 0.18)',
    contrast: '#2D2A2E',
  },
  cupertino: {
    light: '#007AFF',
    dark: '#0A84FF',
    softLight: 'rgba(0, 122, 255, 0.12)',
    softDark: 'rgba(10, 132, 255, 0.2)',
    contrast: '#ffffff',
  },
  social: {
    light: '#1877F2',
    dark: '#1877F2',
    softLight: 'rgba(24, 119, 242, 0.12)',
    softDark: 'rgba(24, 119, 242, 0.2)',
    contrast: '#ffffff',
  },
  retail: {
    light: '#FF9900',
    dark: '#00A8E1',
    softLight: 'rgba(255, 153, 0, 0.15)',
    softDark: 'rgba(0, 168, 225, 0.18)',
    contrast: '#0F1111',
  },
};

export function resolveThemeAccent(appTheme) {
  if (!appTheme) return THEME_ACCENTS[''];
  if (THEME_ACCENTS[appTheme]) return THEME_ACCENTS[appTheme];
  // Gradient / custom wallpaper themes → keep default indigo accent
  return THEME_ACCENTS[''];
}
