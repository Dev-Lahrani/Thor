import { createContext, useContext } from 'react';
import type { CTIState, CTIFilterState, IoC } from '../types/cti';
import type { CrossFeedCluster, TemporalCluster } from '../services/ctiCorrelator';
import type { ConfidenceEntry } from '../components/CTIProvider';

export interface CTIContextValue extends CTIState {
  filter: CTIFilterState;
  filteredIoCs: IoC[];
  refreshFeeds: () => Promise<void>;
  setFilter: (patch: Partial<CTIFilterState>) => void;
  confidenceScores: Map<string, ConfidenceEntry>;
  crossFeedClusters: CrossFeedCluster[];
  temporalClusters: TemporalCluster[];
}

export const CTIContext = createContext<CTIContextValue | null>(null);

export function useCTI(): CTIContextValue {
  const ctx = useContext(CTIContext);
  if (!ctx) throw new Error('useCTI must be used within a CTIProvider');
  return ctx;
}
