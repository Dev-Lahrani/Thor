import { useState } from 'react';
import { useCTI } from '../contexts/CTIContext';
import type { Campaign } from '../types/cti';
import {
  Users,
  Crosshair,
  Calendar,
  ChevronDown,
  ChevronRight,
  Search,
  AlertTriangle,
  Swords,
  Globe,
} from 'lucide-react';

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-red-500/20 text-red-400',
  inactive: 'bg-gray-500/20 text-gray-400',
  unknown: 'bg-yellow-500/20 text-yellow-400',
};

function CampaignCard({
  campaign,
  isExpanded,
  onToggle,
}: {
  campaign: Campaign;
  isExpanded: boolean;
  onToggle: () => void;
}) {
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
        <Swords className="w-4 h-4 text-neon-purple flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white truncate">{campaign.name}</div>
          <div className="text-xs text-gray-400 truncate">{campaign.description}</div>
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded-full border flex-shrink-0 ${STATUS_STYLES[campaign.status] || STATUS_STYLES.unknown}`}>
          {campaign.status}
        </span>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-3">
          {/* Timeline */}
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(campaign.firstSeen).toLocaleDateString()}
            </span>
            <span>→</span>
            <span>{new Date(campaign.lastSeen).toLocaleDateString()}</span>
          </div>

          {/* Tags */}
          {campaign.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {campaign.tags.slice(0, 10).map(tag => (
                <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-white/5 rounded text-gray-400">
                  {tag}
                </span>
              ))}
              {campaign.tags.length > 10 && (
                <span className="text-[10px] text-gray-500">+{campaign.tags.length - 10}</span>
              )}
            </div>
          )}

          {/* Associated data */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            {campaign.actors.length > 0 && (
              <div>
                <div className="text-gray-500 mb-1 flex items-center gap-1">
                  <Users className="w-3 h-3" /> Actors
                </div>
                <div className="space-y-0.5">
                  {campaign.actors.map(a => (
                    <div key={a} className="text-gray-300 truncate">{a}</div>
                  ))}
                </div>
              </div>
            )}
            {campaign.malware.length > 0 && (
              <div>
                <div className="text-gray-500 mb-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Malware
                </div>
                <div className="space-y-0.5">
                  {campaign.malware.map(m => (
                    <div key={m} className="text-gray-300 truncate">{m}</div>
                  ))}
                </div>
              </div>
            )}
            {campaign.techniques.length > 0 && (
              <div>
                <div className="text-gray-500 mb-1 flex items-center gap-1">
                  <Crosshair className="w-3 h-3" /> Techniques
                </div>
                <div className="flex flex-wrap gap-1">
                  {campaign.techniques.slice(0, 6).map(t => (
                    <span key={t} className="text-[10px] px-1 py-0.5 bg-neon-cyan/10 text-neon-cyan rounded">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {campaign.targets.length > 0 && (
              <div>
                <div className="text-gray-500 mb-1 flex items-center gap-1">
                  <Globe className="w-3 h-3" /> Targets
                </div>
                <div className="flex flex-wrap gap-1">
                  {campaign.targets.slice(0, 6).map(t => (
                    <span key={t} className="text-[10px] px-1 py-0.5 bg-white/5 rounded text-gray-400">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function CampaignPanel() {
  const { campaigns } = useCTI();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = campaigns.filter(c => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const activeCount = campaigns.filter(c => c.status === 'active').length;
  const totalActors = new Set(campaigns.flatMap(c => c.actors)).size;

  return (
    <div className="h-full flex flex-col">
      {/* Stats bar */}
      <div className="px-4 py-3 border-b border-white/10 bg-cyber-darker/50">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-neon-purple">{campaigns.length}</div>
            <div className="text-[10px] text-gray-400">Campaigns</div>
          </div>
          <div>
            <div className="text-lg font-bold text-neon-orange">{activeCount}</div>
            <div className="text-[10px] text-gray-400">Active</div>
          </div>
          <div>
            <div className="text-lg font-bold text-neon-cyan">{totalActors}</div>
            <div className="text-[10px] text-gray-400">Actors</div>
          </div>
        </div>
      </div>

      {/* Search + filter */}
      <div className="px-4 py-2 border-b border-white/10 space-y-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search campaigns..."
            className="w-full pl-7 pr-3 py-1.5 text-xs bg-white/5 border border-white/10 rounded text-white placeholder-gray-500 focus:outline-none focus:border-neon-purple/50"
          />
        </div>
        <div className="flex gap-1.5">
          {['all', 'active', 'inactive', 'unknown'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-2 py-1 text-[10px] rounded transition-colors ${
                statusFilter === status
                  ? 'bg-neon-purple/20 text-neon-purple'
                  : 'text-gray-400 hover:bg-white/10'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Campaign list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-8">
            {campaigns.length === 0
              ? 'No campaigns detected yet. Feeds need to be loaded first.'
              : 'No campaigns match your filter.'}
          </div>
        ) : (
          filtered.map(campaign => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              isExpanded={expandedId === campaign.id}
              onToggle={() => setExpandedId(expandedId === campaign.id ? null : campaign.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default CampaignPanel;
