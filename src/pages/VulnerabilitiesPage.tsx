import React, { useState, useMemo } from 'react';
import { useThreat } from '../context/ThreatContext';
import type { SeverityLevel } from '../types';
import { SEVERITY_COLORS, formatDate, formatRelativeTime } from '../utils/helpers';
import {
  Bug,
  ShieldAlert,
  Skull,
  CalendarClock,
  ExternalLink,
  Search,
  FileText,
} from 'lucide-react';

type SevFilter = 'all' | SeverityLevel;

const sevFilters: Array<{ value: SevFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

export const VulnerabilitiesPage: React.FC = () => {
  const { cves, kev } = useThreat();
  const [sevFilter, setSevFilter] = useState<SevFilter>('all');
  const [query, setQuery] = useState('');
  const [showOnlyKev, setShowOnlyKev] = useState(false);

  const kevIds = useMemo(() => new Set(kev.map(k => k.cveID)), [kev]);
  const kevByCve = useMemo(() => {
    const map: Record<string, (typeof kev)[number]> = {};
    kev.forEach(k => { map[k.cveID] = k; });
    return map;
  }, [kev]);

  const filteredCves = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cves.filter(c => {
      if (sevFilter !== 'all' && c.severity !== sevFilter) return false;
      if (showOnlyKev && !kevIds.has(c.id)) return false;
      if (q) {
        const hay = `${c.id} ${c.vendors.join(' ')} ${c.title} ${c.description}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [cves, sevFilter, showOnlyKev, query, kevIds]);

  const criticalCount = cves.filter(c => c.severity === 'critical').length;

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-neon-red/20 to-orange-500/10 flex items-center justify-center border border-neon-red/20">
              <Bug className="w-4 h-4 text-neon-red" />
            </div>
            Vulnerabilities
          </h2>
          <p className="text-xs text-gray-500 mt-1 font-mono">
            {cves.length} CVEs from NVD (3-day window) • {kev.length} KEV entries (180-day window)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {criticalCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20">
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
              <span className="text-xs font-semibold text-red-400">{criticalCount} Critical</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/5">
            <div className="relative">
              <div className="w-2 h-2 rounded-full bg-neon-cyan" />
              <div className="absolute inset-0 w-2 h-2 rounded-full bg-neon-cyan animate-ping opacity-50" />
            </div>
            <span className="text-xs font-medium text-gray-400">
              <span className="text-white font-bold text-sm">{kev.length}</span> actively exploited
            </span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 bg-white/5 rounded-lg p-1">
          {sevFilters.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setSevFilter(value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                sevFilter === value ? 'bg-white/10 text-neon-cyan' : 'text-gray-400 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowOnlyKev(!showOnlyKev)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
            showOnlyKev
              ? 'bg-red-500/15 text-red-400 border-red-500/40'
              : 'bg-white/[0.03] text-gray-400 border-white/10 hover:text-white'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          KEV Only
        </button>

        <div className="relative flex-1 max-w-xs ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Filter by CVE id or vendor..."
            className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-neon-cyan/50"
          />
        </div>
      </div>

      {/* CVE table */}
      <div className="glass-card rounded-2xl border border-white/[0.06] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wider text-gray-500 border-b border-white/10">
                <th className="px-4 py-3 font-medium">CVE</th>
                <th className="px-4 py-3 font-medium">Vendor</th>
                <th className="px-4 py-3 font-medium">CVSS</th>
                <th className="px-4 py-3 font-medium">Severity</th>
                <th className="px-4 py-3 font-medium">Published</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filteredCves.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                    No CVEs match the current filters
                  </td>
                </tr>
              ) : (
                filteredCves.map(cve => {
                  const sevStyle = SEVERITY_COLORS[cve.severity];
                  const kevEntry = kevByCve[cve.id];
                  return (
                    <tr
                      key={cve.id}
                      className="border-b border-white/5 hover:bg-white/[0.03] transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-neon-cyan">{cve.id}</td>
                      <td className="px-4 py-3 text-gray-300 max-w-[200px] truncate">
                        {cve.vendors.length > 0 ? cve.vendors.join(', ') : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-white">{cve.cvssScore.toFixed(1)}</span>
                        {cve.cvssVector && (
                          <span className="block text-[10px] text-gray-500 font-mono truncate max-w-[160px]" title={cve.cvssVector}>
                            {cve.cvssVector.split('/').slice(1, 3).join('/')}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${sevStyle.bg} ${sevStyle.text} border ${sevStyle.border}`}>
                          {cve.severity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{formatRelativeTime(cve.published)}</td>
                      <td className="px-4 py-3">
                        {kevEntry ? (
                          <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-bold uppercase bg-red-500/15 text-red-400 border border-red-500/40">
                            <ShieldAlert className="w-3 h-3" />
                            KEV
                            {kevEntry.knownRansomwareCampaignUse === 'Known' && (
                              <Skull className="w-3 h-3" />
                            )}
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-md uppercase bg-white/5 text-gray-500 border border-white/10">
                            disclosed
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <a
                          href={`https://nvd.nist.gov/vuln/detail/${cve.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-neon-cyan transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* KEV highlight cards */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-neon-red" />
          Known Exploited Vulnerabilities
          <span className="text-xs text-gray-500 font-normal">(newest first)</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {kev.slice(0, 9).map(k => (
            <div key={k.cveID} className="glass-card rounded-xl p-4 border border-white/[0.06]">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-sm text-neon-red">{k.cveID}</span>
                {k.knownRansomwareCampaignUse === 'Known' && (
                  <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 border border-red-500/30 font-bold uppercase">
                    <Skull className="w-3 h-3" />
                    Ransomware
                  </span>
                )}
              </div>
              <p className="text-xs text-white font-medium mb-1 truncate">{k.vulnerabilityName}</p>
              <p className="text-[11px] text-gray-500 mb-3">{k.vendorProject} — {k.product}</p>
              <p className="text-xs text-gray-400 line-clamp-2 mb-3">{k.shortDescription}</p>
              <div className="flex items-center gap-2 text-[10px] text-gray-500 mb-3">
                <CalendarClock className="w-3 h-3" />
                <span>Added {formatDate(k.dateAdded)}</span>
                <span>•</span>
                <span className="text-neon-orange">Due {formatDate(k.dueDate)}</span>
              </div>
              <div className="p-2 bg-white/[0.03] rounded-lg">
                <span className="text-[9px] text-gray-500 uppercase tracking-wider">Required Action</span>
                <p className="text-[11px] text-gray-300 mt-0.5 flex items-start gap-1">
                  <FileText className="w-3 h-3 mt-0.5 flex-shrink-0 text-gray-500" />
                  {k.requiredAction}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
