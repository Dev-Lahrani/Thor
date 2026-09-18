import { useState, useMemo } from 'react';
import { useCTI } from '../contexts/CTIContext';
import {
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Shield,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Clock,
} from 'lucide-react';
import type { IoC, IoCType } from '../types/cti';
import { IoCTable } from './IoCTable';
import { IoCDetailDrawer } from './IoCDetailDrawer';

const TYPE_COLORS: Record<IoCType, string> = {
  ipv4: 'text-neon-cyan',
  ipv6: 'text-neon-cyan',
  domain: 'text-neon-purple',
  url: 'text-neon-orange',
  sha256: 'text-neon-red',
  sha1: 'text-neon-red',
  md5: 'text-neon-red',
  email: 'text-neon-green',
};

export function IoCFeedPanel() {
  const { stats, feedResults, isLoading, error, lastRefresh, refreshFeeds, filteredIoCs, confidenceScores } = useCTI();
  const [selectedIoC, setSelectedIoC] = useState<IoC | null>(null);
  const [expandedFeeds, setExpandedFeeds] = useState(true);
  const [typeFilter, setTypeFilter] = useState<IoCType | ''>('');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    let result = filteredIoCs;
    if (typeFilter) result = result.filter(ioc => ioc.type === typeFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(ioc =>
        ioc.value.toLowerCase().includes(q) ||
        ioc.description?.toLowerCase().includes(q) ||
        ioc.tags.some(t => t.toLowerCase().includes(q)),
      );
    }
    return result;
  }, [filteredIoCs, typeFilter, searchQuery]);

  const feedErrors = feedResults.filter(r => r.error);

  return (
    <div className="h-full flex flex-col bg-cyber-darker">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-neon-cyan" />
          <h2 className="text-lg font-bold text-white">IoC Feed Intelligence</h2>
          <span className="text-xs text-gray-400 bg-white/5 px-2 py-0.5 rounded-full">
            {stats.totalIoCs} indicators
          </span>
        </div>
        <div className="flex items-center gap-2">
          {lastRefresh && (
            <span className="text-xs text-gray-500">
              <Clock className="w-3 h-3 inline mr-1" />
              {new Date(lastRefresh).toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={() => refreshFeeds()}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-neon-cyan/10 text-neon-cyan rounded-lg hover:bg-neon-cyan/20 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-neon-red/10 border border-neon-red/30 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-neon-red flex-shrink-0" />
          <span className="text-sm text-neon-red">{error}</span>
        </div>
      )}

      {/* Stats Bar */}
      <div className="px-4 py-3 border-b border-white/10 grid grid-cols-5 gap-3">
        <StatCard label="Total IoCs" value={stats.totalIoCs} color="neon-cyan" />
        <StatCard label="Critical" value={stats.byThreatLevel.critical || 0} color="neon-red" />
        <StatCard label="High" value={stats.byThreatLevel.high || 0} color="neon-orange" />
        <StatCard label="Active Feeds" value={stats.activeFeeds} color="neon-green" />
        <StatCard label="Failed Feeds" value={stats.failedFeeds} color={stats.failedFeeds > 0 ? 'neon-red' : 'neon-green'} />
      </div>

      {/* Confidence Summary */}
      {confidenceScores.size > 0 && (
        <div className="px-4 py-2 border-b border-white/10 flex items-center gap-4 text-[10px]">
          <span className="text-gray-500 uppercase tracking-wider">Confidence:</span>
          <span className="text-neon-cyan">{confidenceScores.size} scored</span>
          <span className="text-neon-purple">
            {[...confidenceScores.values()].filter(e => e.feedCount > 1).length} cross-feed
          </span>
          <span className="text-neon-orange">
            {[...confidenceScores.values()].filter(e => e.confidence === 'high' || e.confidence === 'confirmed').length} high/conf
          </span>
          <span className="text-gray-600">
            avg {[...confidenceScores.values()].reduce((s, e) => s + e.score, 0) / confidenceScores.size || 0}
          </span>
        </div>
      )}

      {/* Type Breakdown */}
      <div className="px-4 py-2 border-b border-white/10 flex items-center gap-3 flex-wrap">
        {Object.entries(stats.byType).map(([type, count]) => (
          <button
            key={type}
            onClick={() => setTypeFilter(typeFilter === type ? '' : type as IoCType)}
            className={`flex items-center gap-1 px-2 py-0.5 text-xs rounded-full border transition-colors ${
              typeFilter === type
                ? 'bg-neon-cyan/20 border-neon-cyan/40 text-neon-cyan'
                : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <span className={TYPE_COLORS[type as IoCType]}>{type}</span>
            <span className="text-gray-500">{count}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="px-4 py-2 border-b border-white/10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search IoCs by value, description, or tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/20"
          />
        </div>
      </div>

      {/* Feed Status */}
      <div className="px-4 py-2 border-b border-white/10">
        <button
          onClick={() => setExpandedFeeds(!expandedFeeds)}
          className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors"
        >
          <Filter className="w-3 h-3" />
          Feed Status ({feedResults.length})
          {expandedFeeds ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
        {expandedFeeds && (
          <div className="mt-2 grid grid-cols-2 lg:grid-cols-3 gap-2">
            {feedResults.map(result => (
              <div
                key={result.source}
                className={`flex items-center gap-2 px-2 py-1 text-xs rounded ${
                  result.error ? 'bg-neon-red/5 border border-neon-red/20' : 'bg-white/5 border border-white/10'
                }`}
              >
                {result.error ? (
                  <XCircle className="w-3 h-3 text-neon-red flex-shrink-0" />
                ) : (
                  <CheckCircle className="w-3 h-3 text-neon-green flex-shrink-0" />
                )}
                <span className="text-gray-300 truncate">{result.source}</span>
                <span className="text-gray-500 ml-auto">{result.iocs.length}</span>
              </div>
            ))}
          </div>
        )}
        {feedErrors.length > 0 && (
          <div className="mt-2 space-y-1">
            {feedErrors.map(err => (
              <div key={err.source} className="text-xs text-neon-red/80 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {err.source}: {err.error}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* IoC Table */}
      <div className="flex-1 overflow-hidden">
        <IoCTable iocs={filtered} onSelectIoC={setSelectedIoC} selectedIoC={selectedIoC} confidenceScores={confidenceScores} />
      </div>

      {/* Detail Drawer */}
      {selectedIoC && (
        <IoCDetailDrawer ioc={selectedIoC} onClose={() => setSelectedIoC(null)} />
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`p-2 rounded-lg bg-white/5 border border-white/10`}>
      <div className={`text-lg font-bold text-${color}`}>{value.toLocaleString()}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}
