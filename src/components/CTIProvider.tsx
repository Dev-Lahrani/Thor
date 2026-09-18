import { useState, useCallback, useMemo, type ReactNode } from 'react';
import { CTIContext, type CTIContextValue } from '../contexts/CTIContext';
import { fetchAllFeeds, deduplicateIoCs, FEED_SOURCES } from '../services/feedManager';
import { enrichIocs } from '../services/geoEnrich';
import { correlateIoCs, type CrossFeedCluster, type TemporalCluster } from '../services/ctiCorrelator';
import { scoreAllIoCs } from '../services/confidenceScorer';
import type { CTIState, CTIFilterState, IoC, Confidence } from '../types/cti';

const DEFAULT_FILTER: CTIFilterState = {
  types: [],
  threatLevels: [],
  sources: [],
  searchQuery: '',
};

function filterIoCs(iocs: IoC[], filter: CTIFilterState): IoC[] {
  let result = iocs;

  if (filter.types.length > 0) {
    result = result.filter(ioc => filter.types.includes(ioc.type));
  }

  if (filter.threatLevels.length > 0) {
    result = result.filter(ioc => filter.threatLevels.includes(ioc.threatLevel));
  }

  if (filter.sources.length > 0) {
    result = result.filter(ioc => filter.sources.includes(ioc.sourceFeed));
  }

  if (filter.searchQuery) {
    const q = filter.searchQuery.toLowerCase();
    result = result.filter(ioc =>
      ioc.value.toLowerCase().includes(q) ||
      ioc.description?.toLowerCase().includes(q) ||
      ioc.tags.some(t => t.toLowerCase().includes(q)),
    );
  }

  return result;
}

export interface ConfidenceEntry {
  score: number;
  confidence: Confidence;
  feedCount: number;
}

export function CTIProvider({ children }: { children: ReactNode }) {
  const [iocs, setIoCs] = useState<IoC[]>([]);
  const [actors, setActors] = useState<CTIState['actors']>([]);
  const [campaigns, setCampaigns] = useState<CTIState['campaigns']>([]);
  const [malware, setMalware] = useState<CTIState['malware']>([]);
  const [feedResults, setFeedResults] = useState<CTIState['feedResults']>([]);
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilterState] = useState<CTIFilterState>(DEFAULT_FILTER);
  const [confidenceScores, setConfidenceScores] = useState<Map<string, ConfidenceEntry>>(new Map());
  const [crossFeedClusters, setCrossFeedClusters] = useState<CrossFeedCluster[]>([]);
  const [temporalClusters, setTemporalClusters] = useState<TemporalCluster[]>([]);

  const refreshFeeds = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { results, allIoCs } = await fetchAllFeeds(FEED_SOURCES);
      const enriched = await enrichIocs(allIoCs);
      const deduped = deduplicateIoCs(enriched);
      const correlated = correlateIoCs(deduped);
      const scores = scoreAllIoCs(deduped);
      setIoCs(deduped);
      setActors(correlated.actors);
      setCampaigns(correlated.campaigns);
      setMalware(correlated.malwareFamilies);
      setConfidenceScores(scores);
      setCrossFeedClusters(correlated.crossFeedClusters);
      setTemporalClusters(correlated.temporalClusters);
      setFeedResults(results);
      setLastRefresh(new Date().toISOString());
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Failed to fetch feeds');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setFilter = useCallback((patch: Partial<CTIFilterState>) => {
    setFilterState(prev => ({ ...prev, ...patch }));
  }, []);

  const filteredIoCs = useMemo(() => filterIoCs(iocs, filter), [iocs, filter]);

  const stats = useMemo(() => {
    const byType: Record<string, number> = {};
    const byThreatLevel: Record<string, number> = {};
    const bySource: Record<string, number> = {};

    for (const ioc of iocs) {
      byType[ioc.type] = (byType[ioc.type] || 0) + 1;
      byThreatLevel[ioc.threatLevel] = (byThreatLevel[ioc.threatLevel] || 0) + 1;
      bySource[ioc.sourceFeed] = (bySource[ioc.sourceFeed] || 0) + 1;
    }

    return {
      totalIoCs: iocs.length,
      byType: byType as CTIState['stats']['byType'],
      byThreatLevel: byThreatLevel as CTIState['stats']['byThreatLevel'],
      bySource,
      activeFeeds: FEED_SOURCES.filter(s => s.enabled).length,
      failedFeeds: feedResults.filter(r => r.error).length,
      lastUpdated: lastRefresh,
    };
  }, [iocs, feedResults, lastRefresh]);

  const value: CTIContextValue = useMemo(() => ({
    iocs,
    actors,
    campaigns,
    malware,
    feedSources: FEED_SOURCES,
    feedResults,
    lastRefresh,
    isLoading,
    error,
    stats,
    filter,
    filteredIoCs,
    refreshFeeds,
    setFilter,
    confidenceScores,
    crossFeedClusters,
    temporalClusters,
  }), [iocs, actors, campaigns, malware, feedResults, lastRefresh, isLoading, error, stats, filter, filteredIoCs, refreshFeeds, setFilter, confidenceScores, crossFeedClusters, temporalClusters]);

  return (
    <CTIContext.Provider value={value}>
      {children}
    </CTIContext.Provider>
  );
}
