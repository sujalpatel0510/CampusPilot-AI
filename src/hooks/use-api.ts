"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

interface UseApiOptions {
  /** Shared cache key. Calls with the same key reuse cached data and dedupe in-flight requests. */
  key?: string;
  /** Cache lifetime in milliseconds. Defaults to 60_000. */
  ttl?: number;
}

interface CacheEntry {
  data: unknown;
  at: number;
}

const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<unknown>>();

/** Drop all cached API data (called on login/logout so data never leaks across users). */
export function clearApiCache() {
  cache.clear();
}

export function useApi<T>(fetcher: () => Promise<T>, deps: unknown[] = [], options?: UseApiOptions): UseApiResult<T> {
  const key = options?.key;
  const ttl = options?.ttl ?? 60_000;
  const [data, setData] = useState<T | null>(() => {
    if (key) {
      const hit = cache.get(key);
      if (hit && Date.now() - hit.at < ttl) return hit.data as T;
    }
    return null;
  });
  const [loading, setLoading] = useState(() => {
    if (key) {
      const hit = cache.get(key);
      if (hit && Date.now() - hit.at < ttl) return false;
    }
    return true;
  });
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const dataRef = useRef<T | null>(data);
  const forceRef = useRef(false);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    let cancelled = false;
    const force = forceRef.current;
    forceRef.current = false;

    if (key && !force) {
      const hit = cache.get(key);
      if (hit && Date.now() - hit.at < ttl) {
        dataRef.current = hit.data as T;
        setData(hit.data as T);
        setError(null);
        setLoading(false);
        return () => {
          cancelled = true;
        };
      }
    }

    setError(null);
    if (dataRef.current === null) setLoading(true);

    const promise =
      key && inflight.has(key)
        ? (inflight.get(key) as Promise<T>)
        : fetcher().then((result) => {
            if (key) {
              cache.set(key, { data: result, at: Date.now() });
            }
            return result;
          });
    if (key && !inflight.has(key)) {
      inflight.set(key, promise);
    }

    promise
      .then((result) => {
        if (key) inflight.delete(key);
        if (!cancelled) {
          dataRef.current = result;
          setData(result);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (key) inflight.delete(key);
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Something went wrong.");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, key, ttl, ...deps]);

  const refetch = useCallback(() => {
    forceRef.current = true;
    setTick((t) => t + 1);
  }, []);

  return { data, loading, error, refetch };
}