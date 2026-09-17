import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Hammer,
  RefreshCw,
  AlertCircle,
  Map,
  Bug,
  Radar,
  Database,
  ShieldAlert,
  Fish,
  Radio,
} from 'lucide-react';
import type { FilterState, ThreatCategory, ThreatEvent } from '../types';
import { CATEGORY_INFO, CATEGORY_ORDER } from '../utils/helpers';

interface HeaderProps {
  filters: FilterState;
  onFilterChange: (category: ThreatCategory) => void;
  onRefresh: () => void;
  lastUpdated: Date | null;
  loading: boolean;
  events: ThreatEvent[];
  kevCount: number;
}

const categoryIcons: Record<ThreatCategory, React.ReactNode> = {
  kev: <ShieldAlert className="w-4 h-4" />,
  maliciousIp: <Radio className="w-4 h-4" />,
  phishing: <Fish className="w-4 h-4" />,
  breach: <Database className="w-4 h-4" />,
};

const NAV_ITEMS = [
  { to: '/', label: 'Map', icon: Map, active: 'from-neon-cyan/15 to-neon-cyan/5 text-neon-cyan border-neon-cyan/40 shadow-neon-cyan/10', glow: 'via-neon-cyan' },
  { to: '/vulnerabilities', label: 'Vulns', icon: Bug, active: 'from-neon-red/15 to-neon-red/5 text-neon-red border-neon-red/40 shadow-neon-red/10', glow: 'via-neon-red' },
  { to: '/threat-intel', label: 'Intel', icon: Radar, active: 'from-neon-orange/15 to-neon-orange/5 text-neon-orange border-neon-orange/40 shadow-neon-orange/10', glow: 'via-neon-orange' },
  { to: '/breaches', label: 'Breaches', icon: Database, active: 'from-neon-purple/15 to-neon-purple/5 text-neon-purple border-neon-purple/40 shadow-neon-purple/10', glow: 'via-neon-purple' },
];

export const Header: React.FC<HeaderProps> = ({
  filters,
  onFilterChange,
  onRefresh,
  lastUpdated,
  loading,
  events,
  kevCount,
}) => {
  const location = useLocation();
  // Only show filter toggles for categories that actually appear in the data —
  // phishing/breach entries are never emitted as map events, so toggles for
  // them would do nothing.
  const presentCategories = useMemo(() => {
    const set = new Set<ThreatCategory>();
    events.forEach(e => set.add(e.category));
    return set;
  }, [events]);
  const categories = CATEGORY_ORDER.filter(cat => presentCategories.has(cat));

  // Statistics
  const totalEvents = events.length;
  const criticalCount = events.filter(d => d.severity === 'critical').length;
  const redAlertCount = events.filter(d => d.alertLevel === 'red').length;

  return (
    <header className="glass-darker px-6 py-3 flex items-center justify-between gap-6 flex-wrap border-b border-white/5">
      {/* Logo and Title */}
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-3 group">
          <div className="relative">
            <div className="absolute inset-0 w-10 h-10 bg-neon-cyan/20 blur-xl rounded-full group-hover:bg-neon-cyan/30 transition-all duration-500" />
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 border border-neon-cyan/30 flex items-center justify-center">
              <Hammer className="w-5 h-5 text-neon-cyan" />
            </div>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span className="bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">
                THOR
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30 font-mono uppercase tracking-wider">
                Live
              </span>
            </h1>
            <p className="text-[11px] text-gray-500 font-medium tracking-wide">
              Cyber Threat Intelligence
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon, active, glow }) => {
            const isActive = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                  transition-all duration-300 relative overflow-hidden
                  ${isActive
                    ? `bg-gradient-to-r ${active} border shadow-lg`
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
                {isActive && (
                  <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-transparent ${glow} to-transparent`} />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Filter Toggles */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {categories.map((cat) => {
          const info = CATEGORY_INFO[cat];
          const isActive = filters[cat];
          const catCount = events.filter(d => d.category === cat).length;

          return (
            <button
              key={cat}
              onClick={() => onFilterChange(cat)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                transition-all duration-300 ease-out relative group
                ${isActive
                  ? 'text-white'
                  : 'text-gray-500 hover:text-gray-300 bg-white/[0.03] hover:bg-white/[0.06] border border-transparent hover:border-white/10'
                }
              `}
              style={{
                background: isActive
                  ? `linear-gradient(135deg, ${info.color}15, ${info.color}08)`
                  : undefined,
                borderWidth: '1px',
                borderColor: isActive ? `${info.color}40` : undefined,
                boxShadow: isActive ? `0 0 16px ${info.color}15, inset 0 1px 0 ${info.color}10` : undefined,
              }}
            >
              <span style={{ color: isActive ? info.color : undefined }} className="transition-colors duration-300">
                {categoryIcons[cat]}
              </span>
              <span className="hidden lg:inline">{info.label}</span>
              {catCount > 0 && (
                <span
                  className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded-md ml-0.5 transition-all duration-300"
                  style={{
                    background: isActive ? `${info.color}25` : 'rgba(255,255,255,0.08)',
                    color: isActive ? info.color : 'rgba(255,255,255,0.6)',
                  }}
                >
                  {catCount}
                </span>
              )}
              {isActive && (
                <div
                  className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: `linear-gradient(135deg, ${info.color}10, transparent)` }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Stats and Refresh */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          {/* Total Events Stat */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/5">
            <div className="relative">
              <div className="w-2 h-2 rounded-full bg-neon-cyan" />
              <div className="absolute inset-0 w-2 h-2 rounded-full bg-neon-cyan animate-ping opacity-50" />
            </div>
            <span className="text-xs font-medium text-gray-400">
              <span className="text-white font-bold text-sm">{totalEvents}</span> signals
            </span>
          </div>

          {kevCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20">
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
              <span className="text-xs font-semibold text-red-400">
                {kevCount} KEV
              </span>
            </div>
          )}

          {criticalCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <AlertCircle className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-xs font-semibold text-orange-400">
                {criticalCount} Critical
              </span>
            </div>
          )}

          {redAlertCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/30 animate-pulse">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <span className="text-xs font-bold text-red-400 uppercase tracking-wide">
                {redAlertCount} Alert{redAlertCount > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        <div className="h-5 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />

        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-[10px] text-gray-500 font-mono hidden md:block px-2 py-1 rounded bg-white/[0.02]">
              {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={onRefresh}
            disabled={loading}
            className={`
              p-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.08]
              text-gray-400 hover:text-neon-cyan
              border border-transparent hover:border-neon-cyan/30
              transition-all duration-300 group
              ${loading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'spinner' : 'group-hover:rotate-45 transition-transform duration-300'}`} />
          </button>
        </div>
      </div>
    </header>
  );
};
