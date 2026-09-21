const UI_CACHE_VERSION = '2026-09-21-avatar-initials-v2';
const VERSION_KEY = 'innocean_ui_cache_version';

const PRESERVE_KEYS = [
  'innocean_auth',
  'innocean_token',
  'innocean_username',
  'innocean_lang',
  'innocean_app_theme',
];

export function bustStaleClientCache() {
  if (typeof window === 'undefined') return;

  try {
    if (localStorage.getItem(VERSION_KEY) === UI_CACHE_VERSION) return;

    const preserved = {};
    PRESERVE_KEYS.forEach((key) => {
      const value = localStorage.getItem(key);
      if (value !== null) preserved[key] = value;
    });

    localStorage.clear();
    Object.entries(preserved).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });
    localStorage.setItem(VERSION_KEY, UI_CACHE_VERSION);

    const reloadAfterCleanup = () => {
      window.location.reload();
    };

    const jobs = [];
    if ('caches' in window) {
      jobs.push(
        caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      );
    }
    if ('serviceWorker' in navigator) {
      jobs.push(
        navigator.serviceWorker
          .getRegistrations()
          .then((regs) => Promise.all(regs.map((reg) => reg.unregister())))
      );
    }

    Promise.all(jobs)
      .catch(() => {})
      .finally(reloadAfterCleanup);
  } catch {
    // Ignore storage access errors and continue app boot.
  }
}
