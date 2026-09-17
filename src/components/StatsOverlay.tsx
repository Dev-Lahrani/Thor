import React from 'react';
import type { ThreatEvent, KevEntry, IocIndicator } from '../types';
import { CATEGORY_INFO } from '../utils/helpers';
import {
  Activity,
  AlertTriangle,
  ShieldAlert,
  Radio,
  Globe,
  Database,
} from 'lucide-react';

interface StatsOverlayProps {
  events: ThreatEvent[];
  kev: KevEntry[];
  iocs: IocIndicator[];
  isVisible: boolean;
}

export const StatsOverlay: React.FC<StatsOverlayProps> = ({
  events,
  kev,
  iocs,
  isVisible,
}) => {
  if (!isVisible) return null;

  const criticalCount = events.filter(e => e.severity === 'critical').length;
  const c2Count = iocs.filter(i => i.type === 'c2-ip').length;
  const ransomwareCount = kev.filter(k => k.knownRansomwareCampaignUse === 'Known').length;

  // Top source countries from geolocated IOCs
  const countryCounts = events.reduce((acc, e) => {
    if (e.countryName) {
      acc[e.countryName] = (acc[e.countryName] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);
  const topCountries = Object.entries(countryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  // Category breakdown
  const categoryBreakdown = events.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="absolute top-20 left-4 z-20 space-y-3 w-72">
      <div className="glass-darker rounded-2xl p-5 animate-slide-in border border-white/5 shadow-xl">
        <h3 className="text-[10px] text-gray-500 uppercase tracking-[0.15em] font-semibold mb-4 flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-neon-cyan" />
          Threat Statistics
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between group">
            <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">Total Signals</span>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold font-mono text-white">{events.length}</span>
              <div className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse" />
            </div>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400 flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-red-500/15 flex items-center justify-center">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              </div>
              Critical
            </span>
            <span className="text-xl font-bold font-mono text-red-400">{criticalCount}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400 flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-neon-red/15 flex items-center justify-center">
                <ShieldAlert className="w-3.5 h-3.5 text-neon-red" />
              </div>
              KEV Entries
            </span>
            <span className="text-xl font-bold font-mono text-neon-red">{kev.length}</span>
          </div>

          {ransomwareCount > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400 pl-8">Ransomware campaigns</span>
              <span className="text-lg font-bold font-mono text-purple-400">{ransomwareCount}</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400 flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-orange-500/15 flex items-center justify-center">
                <Radio className="w-3.5 h-3.5 text-orange-400" />
              </div>
              C2 Servers
            </span>
            <span className="text-xl font-bold font-mono text-orange-400">{c2Count}</span>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="mt-4 pt-3 border-t border-white/10">
          <div className="text-xs text-gray-500 mb-2">By Category</div>
          <div className="space-y-1">
            {Object.entries(categoryBreakdown).map(([category, count]) => {
              const info = CATEGORY_INFO[category as keyof typeof CATEGORY_INFO];
              if (!info) return null;
              return (
                <div key={category} className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(count / events.length) * 100}%`,
                        backgroundColor: info.color,
                      }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 w-20 truncate capitalize">
                    {info.label}
                  </span>
                  <span className="text-xs font-mono text-white">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top source countries */}
      {topCountries.length > 0 && (
        <div className="glass-darker rounded-xl p-4 animate-slide-in" style={{ animationDelay: '100ms' }}>
          <h3 className="text-xs text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Top Source Countries
          </h3>

          <div className="space-y-3">
            {topCountries.map(([country, count], i) => (
              <div key={country} className="flex items-center justify-between">
                <span className="text-sm text-gray-400 flex items-center gap-2">
                  <span className="text-neon-cyan font-mono text-xs">{i + 1}</span>
                  {country}
                </span>
                <span className="text-lg font-mono text-white">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="glass-darker rounded-xl p-4 animate-slide-in" style={{ animationDelay: '200ms' }}>
        <h3 className="text-xs text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Database className="w-4 h-4" />
          Feeds
        </h3>
        <div className="space-y-1.5 text-xs text-gray-400">
          <div className="flex justify-between"><span>NVD CVEs</span><span className="text-white font-mono">{events.filter(e => e.source === 'NVD').length}</span></div>
          <div className="flex justify-between"><span>CISA KEV</span><span className="text-white font-mono">{kev.length}</span></div>
          <div className="flex justify-between"><span>Feodo C2</span><span className="text-white font-mono">{iocs.filter(i => i.type === 'c2-ip').length}</span></div>
          <div className="flex justify-between"><span>DShield attackers</span><span className="text-white font-mono">{iocs.filter(i => i.type === 'attacker-ip').length}</span></div>
          <div className="flex justify-between"><span>OpenPhish URLs</span><span className="text-white font-mono">{iocs.filter(i => i.type === 'phishing-url').length}</span></div>
        </div>
      </div>
    </div>
  );
};
