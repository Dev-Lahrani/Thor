import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchDisasterEvents, fetchWeatherData } from '../services/api';
import type { DisasterEvent, WeatherData } from '../types';

export interface UseDataFetchingOpts {
  autoRefresh: boolean;
  refreshInterval: number;
  onNewEvents?: (data: DisasterEvent[], previousIds: Set<string>) => void;
}

export function useDataFetching(opts: UseDataFetchingOpts) {
  const [disasters, setDisasters] = useState<DisasterEvent[]>([]);
  const [weather, setWeather] = useState<WeatherData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const previousDisasterIds = useRef<Set<string>>(new Set());
  const optsRef = useRef(opts);
  optsRef.current = opts;

  const fetchData = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      setError(null);

      const [disasterData, weatherData] = await Promise.all([
        fetchDisasterEvents(signal),
        fetchWeatherData(signal),
      ]);

      optsRef.current.onNewEvents?.(disasterData, previousDisasterIds.current);

      previousDisasterIds.current = new Set(disasterData.map(d => d.id));

      setDisasters(disasterData);
      setWeather(weatherData);
      setLastUpdated(new Date());
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);

    if (optsRef.current.autoRefresh) {
      const interval = setInterval(
        () => fetchData(),
        optsRef.current.refreshInterval * 1000,
      );
      return () => {
        clearInterval(interval);
        controller.abort();
      };
    }

    return () => controller.abort();
  }, [fetchData, opts.autoRefresh, opts.refreshInterval]);

  return { disasters, weather, loading, error, lastUpdated, fetchData } as const;
}
