import { useCallback, useEffect, useRef, useState } from 'react';
import { get } from '../api/client.js';

/**
 * Reads a cached GET endpoint with stale-while-revalidate semantics.
 *
 * On a warm cache the component renders real data on its very first paint —
 * no spinner, no layout shift — while a refresh runs in the background.
 */
export function useResource(path, { enabled = true } = {}) {
  const initial = enabled ? get(path, { revalidate: false }).cached : undefined;

  const [data, setData] = useState(initial);
  const [error, setError] = useState(null);
  const [isLoading, setLoading] = useState(enabled && initial === undefined);
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
    setLoading((prev) => prev || get(path, { revalidate: false }).cached === undefined);
    load(controller.signal);
    return () => controller.abort();
  }, [path, enabled, load]);

  return { data, error, isLoading, refresh: () => load() };
}
