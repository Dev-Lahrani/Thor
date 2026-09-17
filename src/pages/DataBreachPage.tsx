import React, { useMemo, useState } from 'react';
import { useThreat } from '../context/ThreatContext';
import { formatCompactNumber, formatDate } from '../utils/helpers';
import {
  Database,
  Search,
  ShieldCheck,
  AlertTriangle,
  Lock,
  ExternalLink,
} from 'lucide-react';

export const DataBreachPage: React.FC = () => {
  const { breaches } = useThreat();
  const [query, setQuery] = useState('');
  const [sensitiveOnly, setSensitiveOnly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return breaches.filter(b => {
      if (sensitiveOnly && !b.isSensitive) return false;
      if (verifiedOnly && !b.isVerified) return false;
      if (q) {
        const hay = `${b.name} ${b.title} ${b.domain}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [breaches, query, sensitiveOnly, verifiedOnly]);

  const totalAccounts = breaches.reduce((sum, b) => sum + b.pwnCount, 0);

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-neon-purple/20 to-pink-500/10 flex items-center justify-center border border-neon-purple/20">
              <Database className="w-4 h-4 text-neon-purple" />
            </div>
            Data Breaches
          </h2>
          <p className="text-xs text-gray-500 mt-1 font-mono">
            {breaches.length} public breaches from HaveIBeenPwned • {formatCompactNumber(totalAccounts)} accounts exposed
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            <span className="text-xs font-semibold text-red-400">
              {breaches.filter(b => b.isSensitive).length} sensitive
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
            <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
            <span className="text-xs font-semibold text-green-400">
              {breaches.filter(b => b.isVerified).length} verified
            </span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search breach name or domain..."
            className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-neon-cyan/50"
          />
        </div>

        <button
          onClick={() => setSensitiveOnly(!sensitiveOnly)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
            sensitiveOnly
              ? 'bg-red-500/15 text-red-400 border-red-500/40'
              : 'bg-white/[0.03] text-gray-400 border-white/10 hover:text-white'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          Sensitive Only
        </button>

        <button
          onClick={() => setVerifiedOnly(!verifiedOnly)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
            verifiedOnly
              ? 'bg-green-500/15 text-green-400 border-green-500/40'
              : 'bg-white/[0.03] text-gray-400 border-white/10 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Verified Only
        </button>
      </div>

      {/* Breach cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            No breaches match the current filters
          </div>
        ) : (
          filtered.map(b => (
            <div key={b.name} className="glass-card rounded-xl p-4 border border-white/[0.06] flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-white truncate">{b.name}</h3>
                <div className="flex items-center gap-1">
                  {b.isVerified && (
                    <span title="Verified breach">
                      <ShieldCheck className="w-4 h-4 text-green-400" />
                    </span>
                  )}
                  {b.isSensitive && (
                    <span title="Sensitive data exposed">
                      <Lock className="w-4 h-4 text-red-400" />
                    </span>
                  )}
                </div>
              </div>

              <p className="text-[11px] text-gray-500 mb-2 font-mono truncate">{b.domain}</p>

              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1">
                  <div className="text-[9px] text-gray-500 uppercase tracking-wider">Accounts Exposed</div>
                  <div className="text-xl font-bold font-mono text-neon-red">{formatCompactNumber(b.pwnCount)}</div>
                </div>
                <div className="flex-1">
                  <div className="text-[9px] text-gray-500 uppercase tracking-wider">Breach Date</div>
                  <div className="text-sm font-mono text-white">{formatDate(b.breachDate)}</div>
                </div>
              </div>

              <p className="text-xs text-gray-400 line-clamp-3 mb-3 flex-1">{b.description}</p>

              <div className="flex flex-wrap gap-1 mb-3">
                {b.dataClasses.slice(0, 6).map(cls => (
                  <span key={cls} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-gray-400 border border-white/10">
                    {cls}
                  </span>
                ))}
                {b.dataClasses.length > 6 && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-gray-500">
                    +{b.dataClasses.length - 6} more
                  </span>
                )}
              </div>

              <a
                href={`https://haveibeenpwned.com/Breach/${encodeURIComponent(b.name)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-neon-cyan hover:text-white transition-colors"
              >
                View on HIBP
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
