import { useState, useMemo } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Copy } from 'lucide-react';
import type { IoC, IoCType, ThreatLevel } from '../types/cti';
import type { ConfidenceEntry } from './CTIProvider';

type SortField = 'value' | 'type' | 'threatLevel' | 'confidence' | 'source' | 'lastSeen';
type SortDir = 'asc' | 'desc';

const THREAT_BADGE: Record<ThreatLevel, string> = {
  critical: 'bg-neon-red/15 text-neon-red border-neon-red/30',
  high: 'bg-neon-orange/15 text-neon-orange border-neon-orange/30',
  medium: 'bg-neon-yellow/15 text-neon-yellow border-neon-yellow/30',
  low: 'bg-neon-cyan/15 text-neon-cyan border-neon-cyan/30',
  unknown: 'bg-white/5 text-gray-400 border-white/10',
};

const TYPE_COLOR: Record<IoCType, string> = {
  ipv4: 'text-neon-cyan',
  ipv6: 'text-neon-cyan',
  domain: 'text-neon-purple',
  url: 'text-neon-orange',
  sha256: 'text-neon-red',
  sha1: 'text-neon-red',
  md5: 'text-neon-red',
  email: 'text-neon-green',
};

const THREAT_ORDER: Record<ThreatLevel, number> = {
  critical: 0, high: 1, medium: 2, low: 3, unknown: 4,
};

const CONFIDENCE_COLOR: Record<string, string> = {
  none: 'bg-white/5 text-gray-500',
  low: 'bg-neon-orange/10 text-neon-orange',
  medium: 'bg-neon-yellow/10 text-neon-yellow',
  high: 'bg-neon-cyan/10 text-neon-cyan',
  confirmed: 'bg-neon-red/10 text-neon-red',
};

export interface IoCTableProps {
  iocs: IoC[];
  onSelectIoC: (ioc: IoC) => void;
  selectedIoC: IoC | null;
  confidenceScores?: Map<string, ConfidenceEntry>;
}

export function IoCTable({ iocs, onSelectIoC, selectedIoC, confidenceScores }: IoCTableProps) {
  const [sortField, setSortField] = useState<SortField>('lastSeen');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const sorted = useMemo(() => {
    return [...iocs].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'value': cmp = a.value.localeCompare(b.value); break;
        case 'type': cmp = a.type.localeCompare(b.type); break;
        case 'threatLevel': cmp = THREAT_ORDER[a.threatLevel] - THREAT_ORDER[b.threatLevel]; break;
        case 'confidence': cmp = a.confidence.localeCompare(b.confidence); break;
        case 'source': cmp = a.source.localeCompare(b.source); break;
        case 'lastSeen': cmp = new Date(a.lastSeen).getTime() - new Date(b.lastSeen).getTime(); break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [iocs, sortField, sortDir]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const handleCopy = async (value: string, id: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-gray-600" />;
    return sortDir === 'asc'
      ? <ArrowUp className="w-3 h-3 text-neon-cyan" />
      : <ArrowDown className="w-3 h-3 text-neon-cyan" />;
  };

  if (iocs.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 text-sm">
        No IoCs match your filters
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-cyber-darker border-b border-white/10 z-10">
          <tr className="text-gray-500">
            {([
              ['value', 'Indicator'],
              ['type', 'Type'],
              ['threatLevel', 'Threat'],
              ['confidence', 'Confidence'],
              ['source', 'Source'],
              ['lastSeen', 'Last Seen'],
            ] as const).map(([field, label]) => (
              <th
                key={field}
                className="px-3 py-2 text-left font-medium cursor-pointer hover:text-white transition-colors select-none"
                onClick={() => handleSort(field)}
              >
                <span className="flex items-center gap-1">
                  {label} <SortIcon field={field} />
                </span>
              </th>
            ))}
            <th className="px-3 py-2 w-16"></th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(ioc => (
            <tr
              key={ioc.id}
              onClick={() => onSelectIoC(ioc)}
              className={`border-b border-white/5 cursor-pointer transition-colors hover:bg-white/5 ${
                selectedIoC?.id === ioc.id ? 'bg-neon-cyan/5 border-l-2 border-l-neon-cyan' : ''
              }`}
            >
              <td className="px-3 py-2 font-mono text-gray-200 max-w-[300px] truncate" title={ioc.value}>
                {ioc.value}
              </td>
              <td className={`px-3 py-2 font-medium ${TYPE_COLOR[ioc.type]}`}>
                {ioc.type}
              </td>
              <td className="px-3 py-2">
                <span className={`px-1.5 py-0.5 rounded border text-[10px] font-medium ${THREAT_BADGE[ioc.threatLevel]}`}>
                  {ioc.threatLevel}
                </span>
              </td>
              <td className="px-3 py-2">
                {(() => {
                  const entry = confidenceScores?.get(ioc.id);
                  const level = entry?.confidence ?? ioc.confidence;
                  const score = entry?.score;
                  const feedCount = entry?.feedCount;
                  return (
                    <div className="flex items-center gap-1.5">
                      <span className={`px-1.5 py-0.5 rounded border text-[10px] font-medium capitalize ${CONFIDENCE_COLOR[level]}`}>
                        {level}
                      </span>
                      {score !== undefined && (
                        <span className="text-[10px] text-gray-500 font-mono">{score.toFixed(1)}</span>
                      )}
                      {feedCount !== undefined && feedCount > 1 && (
                        <span className="text-[10px] text-neon-purple font-mono">{feedCount}f</span>
                      )}
                    </div>
                  );
                })()}
              </td>
              <td className="px-3 py-2 text-gray-400 truncate max-w-[120px]" title={ioc.source}>
                {ioc.source}
              </td>
              <td className="px-3 py-2 text-gray-500">
                {new Date(ioc.lastSeen).toLocaleDateString()}
              </td>
              <td className="px-3 py-2">
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleCopy(ioc.value, ioc.id); }}
                    className="p-1 rounded hover:bg-white/10 text-gray-500 hover:text-white transition-colors"
                    title="Copy"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  {copiedId === ioc.id && (
                    <span className="text-neon-green text-[10px]">Copied</span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
