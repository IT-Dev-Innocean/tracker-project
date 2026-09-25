import * as Sentry from '@sentry/react';

const dsn = import.meta.env.VITE_SENTRY_DSN;

const apiBaseURL = (
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD ? 'https://innocean-tracker.onrender.com' : 'http://localhost:8000')
).replace(/\/$/, '');

const toRate = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 && n <= 1 ? n : fallback;
};

if (dsn) {
  Sentry.init({
    dsn,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    tracesSampleRate: toRate(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE, import.meta.env.PROD ? 0.2 : 1.0),
    tracePropagationTargets: ['localhost', /^\//, apiBaseURL],
    replaysSessionSampleRate: toRate(import.meta.env.VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE, import.meta.env.PROD ? 0.1 : 0),
    replaysOnErrorSampleRate: 1.0,
  });
}

export function setSentryUser(username) {
  Sentry.setUser(username ? { username } : null);
}

export { Sentry };
