import React, { useEffect, useMemo, useState } from 'react';
import { useThreat } from '../context/ThreatContext';
import type { IocType } from '../types';
import { formatRelativeTime } from '../utils/helpers';
import {
  Radar,
  Radio,
  Fish,
  ShieldAlert,
  Copy,
  Check,
  Globe,
  Activity,
  ExternalLink,
} from 'lucide-react';

type IocTab = 'c2' | 'attackers' | 'phishing';

const INFOCON_URL = 'https://isc.sans.edu/api/infocon?json';

interface InfoconResponse {
  status?: string;
  infocon?: number;
  updated?: string;
}

// ISC may answer either {"infocon": N} or {"status": "green|yellow|orange|red"}
const statusLevels: Record<string, { label: string; color: string; bg: string }> = {
  green: { label: 'GREEN — All Clear', color: 'text-green-400', bg: 'bg-green-500/15 border-green-500/30' },
  yellow: { label: 'YELLOW — Elevated', color: 'text-yellow-400', bg: 'bg-yellow-500/15 border-yellow-500/30' },
  orange: { label: 'ORANGE — Significant Threat', color: 'text-orange-400', bg: 'bg-orange-500/15 border-orange-500/30' },
  red: { label: 'RED — Extreme Threat', color: 'text-red-400', bg: 'bg-red-500/15 border-red-500/30' },
};

const infoconLevels: Record<number, { label: string; color: string; bg: string }> = {
  0: statusLevels.green,
  1: statusLevels.yellow,
  2: statusLevels.orange,
  3: statusLevels.red,
};

interface InfoconInfo {
  label: string;
  color: string;
  bg: string;
}

function parseInfocon(data: InfoconResponse | null): { info: InfoconInfo | null; updated?: string } {
  if (!data) return { info: null };
  if (typeof data.infocon === 'number') {
    return { info: infoconLevels[data.infocon] || null, updated: data.updated };
  }
  if (typeof data.status === 'string') {
    const info = statusLevels[data.status.toLowerCase()];
    return { info: info || null, updated: data.updated };
  }
  return { info: null };
}

export const ThreatIntelPage: React.FC = () => {
  const { iocs } = useThreat();
  const [tab, setTab] = useState<IocTab>('c2');
  const [query, setQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [infocon, setInfocon] = useState<InfoconResponse | null>(null);

  // ISC threat level strip (nice-to-have, feed verified)
  useEffect(() => {
    fetch(INFOCON_URL)
      .then(res => (res.ok ? res.json() : null))
      .then((data: InfoconResponse | null) => {
        if (data) setInfocon(data);
      })
      .catch(() => {});
  }, []);

  const infoconInfo = parseInfocon(infocon);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const byTab: Record<IocTab, IocType[]> = {
      c2: ['c2-ip'],
      attackers: ['attacker-ip'],
      phishing: ['phishing-url'],
    };
    return iocs.filter(i => {
      if (!byTab[tab].includes(i.type)) return false;
      if (q && !(`${i.value} ${i.threat} ${i.countryName || ''}`.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [iocs, tab, query]);

  const copyToClipboard = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  const tabs: Array<{ id: IocTab; label: string; icon: React.ReactNode; count: number; color: string }> = [
    { id: 'c2', label: 'C2 Servers', icon: <Radio className="w-4 h-4" />, count: iocs.filter(i => i.type === 'c2-ip').length, color: 'text-neon-red' },
    { id: 'attackers', label: 'Attack Sources', icon: <ShieldAlert className="w-4 h-4" />, count: iocs.filter(i => i.type === 'attacker-ip').length, color: 'text-neon-orange' },
    { id: 'phishing', label: 'Phishing URLs', icon: <Fish className="w-4 h-4" />, count: iocs.filter(i => i.type === 'phishing-url').length, color: 'text-pink-400' },
  ];

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-neon-orange/20 to-yellow-500/10 flex items-center justify-center border border-neon-orange/20">
              <Radar className="w-4 h-4 text-neon-orange" />
            </div>
            Threat Intelligence
          </h2>
          <p className="text-xs text-gray-500 mt-1 font-mono">
            Indicators of compromise from Feodo Tracker, DShield, and OpenPhish
          </p>
        </div>
      </div>

      {/* Infocon status strip */}
      <div className={`rounded-xl border px-4 py-3 flex items-center gap-3 ${infoconInfo.info?.bg || 'bg-white/[0.03] border-white/10'}`}>
        <Activity className={`w-4 h-4 ${infoconInfo.info?.color || 'text-gray-500'}`} />
        <div>
          <span className={`text-sm font-semibold ${infoconInfo.info?.color || 'text-gray-500'}`}>
            {infoconInfo.info ? `ISC Threat Level: ${infoconInfo.info.label}` : 'Loading ISC threat level...'}
          </span>
          {infoconInfo.updated && (
            <span className="block text-[10px] text-gray-500 font-mono mt-0.5">
              Updated {formatRelativeTime(infoconInfo.updated)}
            </span>
          )}
        </div>
        <a
          href="https://isc.sans.edu/"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-[10px] text-gray-500 hover:text-neon-cyan transition-colors flex items-center gap-1"
        >
          ISC/SANS
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 bg-white/5 rounded-lg p-1 w-fit">
        {tabs.map(({ id, label, icon, count, color }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === id ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <span className={tab === id ? color : undefined}>{icon}</span>
            {label}
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${tab === id ? 'bg-white/10 text-white' : 'bg-white/5 text-gray-500'}`}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Filter IOCs..."
          className="w-full pl-3 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-neon-cyan/50"
        />
      </div>

      {/* IOC list */}
      <div className="glass-card rounded-2xl border border-white/[0.06] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wider text-gray-500 border-b border-white/10">
                <th className="px-4 py-3 font-medium">Indicator</th>
                <th className="px-4 py-3 font-medium">Threat</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium">Last Seen</th>
                <th className="px-4 py-3 font-medium">Confidence</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                    No indicators available for this feed
                  </td>
                </tr>
              ) : (
                filtered.map(ioc => (
                  <tr key={ioc.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                    <td className="px-4 py-3">
                      {ioc.type === 'phishing-url' ? (
                        <span className="font-mono text-pink-400 text-xs">{ioc.value}</span>
                      ) : (
                        <span className="font-mono text-white">{ioc.value}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {ioc.threat}
                      {ioc.eventCount !== undefined && (
                        <span className="block text-[10px] text-gray-500">{ioc.eventCount.toLocaleString()} attacks</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{ioc.source}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {ioc.countryName ? (
                        <span className="flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          {ioc.city ? `${ioc.city}, ` : ''}{ioc.countryName}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {ioc.lastSeen ? formatRelativeTime(ioc.lastSeen) : 'active'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-md uppercase font-bold ${
                        ioc.confidence === 'high' ? 'bg-green-500/15 text-green-400' : ioc.confidence === 'medium' ? 'bg-yellow-500/15 text-yellow-400' : 'bg-gray-500/15 text-gray-400'
                      }`}>
                        {ioc.confidence}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => void copyToClipboard(ioc.id, ioc.value)}
                        className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-neon-cyan transition-colors"
                        title="Copy as IOC"
                      >
                        {copiedId === ioc.id ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
