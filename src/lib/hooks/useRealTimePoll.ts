import { useState, useEffect, useRef, useCallback } from "react";

export interface UseRealTimePollOptions<T> {
  fetchFunction: () => Promise<T>;
  interval?: number;
  enabled?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

export interface UseRealTimePollReturn<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  lastUpdate: Date | null;
  refetch: () => Promise<void>;
  isPolling: boolean;
}

export function useRealTimePoll<T>(options: UseRealTimePollOptions<T>): UseRealTimePollReturn<T> {
  const {
    fetchFunction,
    interval = 30000,
    enabled = true,
    onSuccess,
    onError
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isPolling, setIsPolling] = useState<boolean>(false);

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const lastFetchTimeRef = useRef<number>(0);
  
  // Use refs to store callbacks to avoid dependency changes on every render
  const fetchFunctionRef = useRef(fetchFunction);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  
  // Update refs when callbacks change
  useEffect(() => {
    fetchFunctionRef.current = fetchFunction;
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
  });

  const fetchData = useCallback(async (showLoading: boolean = true) => {
    if (!isMountedRef.current) return;

    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTimeRef.current;

    if (timeSinceLastFetch < 1000) {
      return;
    }

    lastFetchTimeRef.current = now;

    try {
      if (showLoading) setLoading(true);
      setError(null);

      const result = await fetchFunctionRef.current();

      if (isMountedRef.current) {
        setData(result);
        setLastUpdate(new Date());
        onSuccessRef.current?.(result);
      }
    } catch (err) {
      if (isMountedRef.current) {
        const errorObj = err instanceof Error ? err : new Error(String(err));
        setError(errorObj);
        onErrorRef.current?.(errorObj);
      }
    } finally {
      if (isMountedRef.current && showLoading) {
        setLoading(false);
      }
    }
  }, []); // No dependencies - uses refs for callbacks

  // Stable fetchData ref to avoid dependency changes
  const fetchDataRef = useRef(fetchData);
  fetchDataRef.current = fetchData;

  useEffect(() => {
    isMountedRef.current = true;

    if (enabled) {
      fetchDataRef.current(true);

      pollingIntervalRef.current = setInterval(() => {
        if (enabled) {
          setIsPolling(true);
          fetchDataRef.current(false).finally(() => {
            if (isMountedRef.current) {
              setIsPolling(false);
            }
          });
        }
      }, interval);
    }

    return () => {
      isMountedRef.current = false;
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [enabled, interval]); // fetchData removed - uses ref

  const refetch = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    lastUpdate,
    refetch,
    isPolling
  };
}
