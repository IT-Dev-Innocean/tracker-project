import { useEffect, useRef } from 'react';
import axios from 'axios';
import { applyServerFeatureFlags } from '../featureFlags';

const POLL_MS = 60_000;

/**
 * Loads feature flags from DB for every user and keeps them in sync.
 */
export default function FeatureFlagsBootstrap({ children }) {
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const loadFlags = () =>
      axios
        .get('/api/feature-flags')
        .then((res) => {
          if (!mountedRef.current) return;
          applyServerFeatureFlags(res.data?.flags || {});
        })
        .catch(() => {
          /* keep defaults if API unavailable */
        });

    loadFlags();
    const timer = setInterval(loadFlags, POLL_MS);
    const onFocus = () => loadFlags();
    window.addEventListener('focus', onFocus);

    return () => {
      mountedRef.current = false;
      clearInterval(timer);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  return children;
}
