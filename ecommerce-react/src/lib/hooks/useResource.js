import { useCallback, useEffect, useRef, useState } from 'react';
import { get, peek } from '../api/client.js';

/**
 * Reads a cached GET endpoint with stale-while-revalidate semantics.
 *
 * On a warm cache (or a build-time snapshot) the component renders real data
 * on its very first paint — no spinner, no layout shift — while a refresh runs
 * in the background. Render only ever *peeks* at the cache; the network is
 * touched from the effect, so re-renders never start stray requests.
 */
export function useResource(path, { enabled = true } = {}) {
  const [data, setData] = useState(() => (enabled ? peek(path) : undefined));
  const [error, setError] = useState(null);
  const [isLoading, setLoading] = useState(() => enabled && peek(path) === undefined);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const load = useCallback(
    (signal) => {
      const { cached, promise } = get(path, { signal });
      if (cached !== undefined) {
        setData(cached);
        setLoading(false);
      }
      return promise
        .then((fresh) => {
          if (!mounted.current || signal?.aborted) return;
          setData(fresh);
          setError(null);
        })
        .catch((err) => {
          if (!mounted.current || signal?.aborted) return;
          setError(err);
        })
        .finally(() => {
          if (mounted.current && !signal?.aborted) setLoading(false);
        });
    },
    [path]
  );

  useEffect(() => {
    if (!enabled) return undefined;
    const controller = new AbortController();
    setLoading((prev) => prev || peek(path) === undefined);
    load(controller.signal);
    return () => controller.abort();
  }, [path, enabled, load]);

  return { data, error, isLoading, refresh: () => load() };
}
