import { useState } from 'react';
import { useCTI } from '../contexts/CTIContext';
import type { ThreatActor } from '../types/cti';
import {
  Users,
  Crosshair,
  Calendar,
  ChevronDown,
  ChevronRight,
  Search,
  AlertTriangle,
  MapPin,
  Target,
  Skull,
} from 'lucide-react';

function ActorCard({
  actor,
  isExpanded,
  onToggle,
}: {
  actor: ThreatActor;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const sophisticationColor = {
    advanced: 'text-red-400',
    intermediate: 'text-orange-400',
    novice: 'text-yellow-400',
    expert: 'text-purple-400',
    none: 'text-gray-400',
    unknown: 'text-gray-500',
  }[actor.sophistication || 'unknown'];

  return (
    <div className="bg-cyber-darker/50 border border-white/10 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors text-left"
      >
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
        )}
        <Users className="w-4 h-4 text-neon-orange flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white truncate">{actor.name}</div>
          {actor.aliases.length > 0 && (
            <div className="text-[10px] text-gray-500 truncate">
              AKA: {actor.aliases.slice(0, 3).join(', ')}
              {actor.aliases.length > 3 && ` +${actor.aliases.length - 3}`}
            </div>
          )}
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded ${sophisticationColor} bg-white/5`}>
          {actor.sophistication || 'unknown'}
        </span>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-3">
          {/* Description */}
          <p className="text-xs text-gray-400">{actor.description}</p>

          {/* Motivation */}
          {actor.motivation && (
            <div className="flex items-center gap-2 text-xs">
              <Target className="w-3 h-3 text-gray-500" />
              <span className="text-gray-500">Motivation:</span>
              <span className="text-gray-300">{actor.motivation}</span>
            </div>
          )}

          {/* Timeline */}
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(actor.firstSeen).toLocaleDateString()}
            </span>
            <span>→</span>
            <span>{new Date(actor.lastSeen).toLocaleDateString()}</span>
          </div>

          {/* Associated data grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            {actor.malware.length > 0 && (
              <div>
                <div className="text-gray-500 mb-1 flex items-center gap-1">
                  <Skull className="w-3 h-3" /> Malware
                </div>
                <div className="space-y-0.5">
                  {actor.malware.map(m => (
                    <div key={m} className="text-gray-300 truncate">{m}</div>
                  ))}
                </div>
              </div>
            )}
            {actor.techniques.length > 0 && (
              <div>
                <div className="text-gray-500 mb-1 flex items-center gap-1">
                  <Crosshair className="w-3 h-3" /> MITRE ATT&CK
                </div>
                <div className="flex flex-wrap gap-1">
                  {actor.techniques.map(t => (
                    <span key={t} className="text-[10px] px-1 py-0.5 bg-neon-cyan/10 text-neon-cyan rounded">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {actor.countries.length > 0 && (
              <div>
                <div className="text-gray-500 mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Countries
                </div>
                <div className="flex flex-wrap gap-1">
                  {actor.countries.slice(0, 8).map(c => (
                    <span key={c} className="text-[10px] px-1 py-0.5 bg-white/5 rounded text-gray-400">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {actor.campaigns.length > 0 && (
              <div>
                <div className="text-gray-500 mb-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Campaigns
                </div>
                <div className="space-y-0.5">
                  {actor.campaigns.map(c => (
                    <div key={c} className="text-gray-300 truncate">{c}</div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Tags */}
          {actor.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {actor.tags.slice(0, 12).map(tag => (
                <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-white/5 rounded text-gray-400">
                  {tag}
                </span>
              ))}
              {actor.tags.length > 12 && (
                <span className="text-[10px] text-gray-500">+{actor.tags.length - 12}</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ActorPanel() {
  const { actors } = useCTI();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = actors.filter(a => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        a.name.toLowerCase().includes(q) ||
        a.aliases.some(al => al.toLowerCase().includes(q)) ||
        a.description.toLowerCase().includes(q) ||
        a.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const withMalware = actors.filter(a => a.malware.length > 0).length;
  const withCountries = new Set(actors.flatMap(a => a.countries)).size;

  return (
    <div className="h-full flex flex-col">
      {/* Stats bar */}
      <div className="px-4 py-3 border-b border-white/10 bg-cyber-darker/50">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-neon-orange">{actors.length}</div>
            <div className="text-[10px] text-gray-400">Actors</div>
          </div>
          <div>
            <div className="text-lg font-bold text-neon-red">{withMalware}</div>
            <div className="text-[10px] text-gray-400">With Malware</div>
          </div>
          <div>
            <div className="text-lg font-bold text-neon-cyan">{withCountries}</div>
            <div className="text-[10px] text-gray-400">Countries</div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-2 border-b border-white/10">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search actors..."
            className="w-full pl-7 pr-3 py-1.5 text-xs bg-white/5 border border-white/10 rounded text-white placeholder-gray-500 focus:outline-none focus:border-neon-orange/50"
          />
        </div>
      </div>

      {/* Actor list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-8">
            {actors.length === 0
              ? 'No threat actors detected yet. Feeds need to be loaded first.'
              : 'No actors match your search.'}
          </div>
        ) : (
          filtered.map(actor => (
            <ActorCard
              key={actor.id}
              actor={actor}
              isExpanded={expandedId === actor.id}
              onToggle={() => setExpandedId(expandedId === actor.id ? null : actor.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default ActorPanel;
