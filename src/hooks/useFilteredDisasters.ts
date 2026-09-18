import { useState, useCallback, useMemo } from 'react';
import type { DisasterEvent, FilterState, DisasterCategory } from '../types';
import { useDataFetching } from './useDataFetching';

interface UseFilteredDisastersOpts {
  autoRefresh: boolean;
  refreshInterval: number;
  onNewEvents?: (data: DisasterEvent[], previousIds: Set<string>) => void;
}

export function useFilteredDisasters(opts: UseFilteredDisastersOpts) {
  const { disasters, weather, loading, error, lastUpdated, fetchData } = useDataFetching(opts);

  const [filters, setFilters] = useState<FilterState>({
    earthquakes: true,
    floods: true,
    wildfires: true,
    severeStorms: true,
    volcanoes: true,
    weather: true,
  });

  const handleFilterChange = useCallback((category: DisasterCategory) => {
    setFilters(prev => ({ ...prev, [category]: !prev[category] }));
  }, []);

  const filteredDisasters = useMemo(
    () => disasters.filter(d => filters[d.category]),
    [disasters, filters],
  );

  return {
    disasters,
    weather,
    loading,
    error,
    lastUpdated,
    fetchData,
    filters,
    handleFilterChange,
    filteredDisasters,
  } as const;
}
