import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import type { ThreatEvent, CveRecord, IocIndicator, BreachRecord } from '../types';
import { SEVERITY_COLORS } from '../utils/helpers';

interface SearchBarProps {
  events: ThreatEvent[];
  cves: CveRecord[];
  iocs: IocIndicator[];
  breaches: BreachRecord[];
  onSelectEvent: (event: ThreatEvent) => void;
  onSelectIoc: (ioc: IocIndicator) => void;
}

interface SearchMatch {
  type: 'event' | 'cve' | 'ioc' | 'breach';
  id: string;
  label: string;
  sublabel?: string;
  badge?: string;
  badgeColor?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  events,
  cves,
  iocs,
  breaches,
  onSelectEvent,
  onSelectIoc,
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const q = query.trim().toLowerCase();

  const matches: SearchMatch[] = [];

  if (q.length >= 2) {
    events
      .filter(e =>
        e.id.toLowerCase().includes(q) ||
        e.title.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        (e.countryName || '').toLowerCase().includes(q)
      )
      .slice(0, 5)
      .forEach(e => {
        const sev = SEVERITY_COLORS[e.severity || 'low'];
        matches.push({
          type: 'event',
          id: e.id,
          label: e.title,
          sublabel: `${e.source} • ${e.countryName || 'global'}`,
          badge: e.severity,
          badgeColor: sev.text,
        });
      });

    cves
      .filter(c =>
        c.id.toLowerCase().includes(q) ||
        c.vendors.some(v => v.toLowerCase().includes(q)) ||
        c.title.toLowerCase().includes(q)
      )
      .slice(0, 5)
      .forEach(c => {
        const sev = SEVERITY_COLORS[c.severity];
        matches.push({
          type: 'cve',
          id: c.id,
          label: `${c.id} — ${c.vendors.slice(0, 2).join(', ')}`,
          sublabel: c.description.slice(0, 60),
          badge: `CVSS ${c.cvssScore.toFixed(1)}`,
          badgeColor: sev.text,
        });
      });

    iocs
      .filter(i => i.value.toLowerCase().includes(q) || i.threat.toLowerCase().includes(q))
      .slice(0, 5)
      .forEach(i => {
        matches.push({
          type: 'ioc',
          id: i.id,
          label: i.value,
          sublabel: `${i.type} • ${i.threat}${i.countryName ? ` • ${i.countryName}` : ''}`,
          badge: i.type === 'c2-ip' ? 'C2' : i.type === 'attacker-ip' ? 'ATTACKER' : 'PHISH',
          badgeColor: i.type === 'c2-ip' ? 'text-red-400' : i.type === 'attacker-ip' ? 'text-orange-400' : 'text-pink-400',
        });
      });

    breaches
      .filter(b => b.name.toLowerCase().includes(q) || b.title.toLowerCase().includes(q) || b.domain.toLowerCase().includes(q))
      .slice(0, 3)
      .forEach(b => {
        matches.push({
          type: 'breach',
          id: b.name,
          label: b.name,
          sublabel: `${b.domain} • ${b.pwnCount.toLocaleString()} accounts`,
          badge: 'BREACH',
          badgeColor: 'text-purple-400',
        });
      });
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setIsOpen(true);
  };

  const handleSelect = (match: SearchMatch) => {
    if (match.type === 'event') {
      const ev = events.find(e => e.id === match.id);
      if (ev) onSelectEvent(ev);
    } else if (match.type === 'cve') {
      window.open(`https://nvd.nist.gov/vuln/detail/${match.id}`, '_blank', 'noopener,noreferrer');
    } else if (match.type === 'breach') {
      window.open(`https://haveibeenpwned.com/Breach/${encodeURIComponent(match.id)}`, '_blank', 'noopener,noreferrer');
    } else if (match.type === 'ioc') {
      const ioc = iocs.find(i => i.id === match.id);
      if (ioc) onSelectIoc(ioc);
    }
    setQuery('');
    setIsOpen(false);
  };

  const hasResults = matches.length > 0;

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder="Search CVE id, vendor, IP, or domain..."
          className="w-64 pl-10 pr-8 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-neon-cyan/50 focus:bg-white/10 transition-all"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 glass-darker rounded-xl overflow-hidden z-50 max-h-96 overflow-y-auto w-96">
          {!hasResults && (
            <div className="p-4 text-center text-gray-500 text-sm">
              No results found
            </div>
          )}

          {matches.map((match) => (
            <div
              key={`${match.type}-${match.id}`}
              onClick={() => handleSelect(match)}
              className="px-3 py-2 hover:bg-white/10 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2">
                {match.badge && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold ${match.badgeColor} bg-white/5 border border-white/10`}>
                    {match.badge}
                  </span>
                )}
                <span className="text-sm text-white truncate">{match.label}</span>
              </div>
              {match.sublabel && (
                <div className="text-xs text-gray-500 truncate mt-0.5">
                  {match.sublabel}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};
