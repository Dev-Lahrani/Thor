import React from 'react';
import type { ThreatEvent, ThreatCategory } from '../types';
import { formatRelativeTime, CATEGORY_INFO, SEVERITY_COLORS, ALERT_COLORS } from '../utils/helpers';
import {
  ShieldAlert,
  Radio,
  Fish,
  Database,
  ExternalLink,
  MapPin,
  Clock,
  X,
  Activity,
  Globe,
  CalendarClock,
  Skull,
} from 'lucide-react';

interface SidebarProps {
  events: ThreatEvent[];
  selectedEvent: ThreatEvent | null;
  onSelectEvent: (event: ThreatEvent | null) => void;
}

const categoryIcons: Record<ThreatCategory, React.ReactNode> = {
  kev: <ShieldAlert className="w-4 h-4" />,
  maliciousIp: <Radio className="w-4 h-4" />,
  phishing: <Fish className="w-4 h-4" />,
  breach: <Database className="w-4 h-4" />,
};

export const Sidebar: React.FC<SidebarProps> = ({
  events,
  selectedEvent,
  onSelectEvent,
}) => {
  const renderDetailPanel = () => {
    if (!selectedEvent) return null;

    const info = CATEGORY_INFO[selectedEvent.category];
    const severity = selectedEvent.severity || 'low';
    const severityStyle = SEVERITY_COLORS[severity];
    const alertLevel = selectedEvent.alertLevel || 'green';
    const alertStyle = ALERT_COLORS[alertLevel];

    return (
      <div className="p-4 glass-darker rounded-xl animate-slide-in max-h-[60vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="p-3 rounded-xl relative"
              style={{ backgroundColor: info.bgColor }}
            >
              <span style={{ color: info.color }}>
                {categoryIcons[selectedEvent.category]}
              </span>
            </div>
            <div>
              <span
                className={`text-xs px-2 py-1 rounded-full font-semibold uppercase ${severityStyle.bg} ${severityStyle.text} border ${severityStyle.border}`}
              >
                {severity}
              </span>
            </div>
          </div>
          <button
            onClick={() => onSelectEvent(null)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <h2 className="text-lg font-bold text-white mb-2">
          {selectedEvent.title}
        </h2>

        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span
            className="text-xs px-3 py-1 rounded-full font-medium"
            style={{
              backgroundColor: info.bgColor,
              color: info.color,
            }}
          >
            {info.label}
          </span>
          <span className="text-xs px-2 py-1 rounded-full bg-white/5 text-gray-400 font-mono">
            {selectedEvent.source}
          </span>
          {alertStyle.pulse ? (
            <span className={`text-xs px-2 py-1 rounded-full ${alertStyle.bg} ${alertStyle.text} flex items-center gap-1`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              {alertLevel.toUpperCase()} ALERT
            </span>
          ) : (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Activity className="w-3 h-3" />
              Active Signal
            </span>
          )}
          {selectedEvent.magnitudeLabel === 'RANSOMWARE' && (
            <span className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-400 flex items-center gap-1 font-bold uppercase">
              <Skull className="w-3 h-3" />
              Ransomware
            </span>
          )}
        </div>

        <p className="text-sm text-gray-300 mb-4">
          {selectedEvent.description}
        </p>

        {/* Threat metrics */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {selectedEvent.cvssScore !== undefined && selectedEvent.cvssScore > 0 && (
            <div className="p-3 bg-white/5 rounded-lg">
              <div className="text-[10px] text-gray-400 mb-1 uppercase tracking-wider">CVSS Score</div>
              <span className="text-2xl font-bold font-mono" style={{ color: info.color }}>
                {selectedEvent.cvssScore.toFixed(1)}
              </span>
            </div>
          )}
          {selectedEvent.magnitudeLabel && (
            <div className="p-3 bg-white/5 rounded-lg">
              <div className="text-[10px] text-gray-400 mb-1 uppercase tracking-wider">Tag</div>
              <span className="text-sm font-bold font-mono text-white">
                {selectedEvent.magnitudeLabel}
              </span>
            </div>
          )}
          {selectedEvent.eventCount !== undefined && (
            <div className="p-3 bg-white/5 rounded-lg">
              <div className="text-[10px] text-gray-400 mb-1 uppercase tracking-wider flex items-center gap-1">
                <Activity className="w-3 h-3" />
                Activity
              </div>
              <span className="text-xl font-bold font-mono text-neon-purple">
                {selectedEvent.eventCount}
              </span>
            </div>
          )}
          {selectedEvent.asn && (
            <div className="p-3 bg-white/5 rounded-lg">
              <div className="text-[10px] text-gray-400 mb-1 uppercase tracking-wider flex items-center gap-1">
                <Globe className="w-3 h-3" />
                ASN
              </div>
              <span className="text-sm font-bold font-mono text-neon-cyan">
                {selectedEvent.asn}
              </span>
            </div>
          )}
        </div>

        {/* Location info */}
        <div className="space-y-2 text-sm mb-4">
          {selectedEvent.countryName && (
            <div className="flex items-center gap-2 text-gray-400">
              <MapPin className="w-4 h-4" />
              <span>
                {selectedEvent.city ? `${selectedEvent.city}, ` : ''}{selectedEvent.countryName}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 text-gray-400">
            <MapPin className="w-4 h-4" />
            <span className="font-mono">
              {selectedEvent.coordinates[1].toFixed(4)}°, {selectedEvent.coordinates[0].toFixed(4)}°
            </span>
            {selectedEvent.approxLocation && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-gray-500 border border-white/10 uppercase tracking-wide">
                approx — no geo data
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <Clock className="w-4 h-4" />
            <span>{formatRelativeTime(selectedEvent.date)}</span>
            <span className="text-gray-600">•</span>
            <span className="text-[10px] font-mono">{new Date(selectedEvent.date).toLocaleString()}</span>
          </div>
        </div>

        {/* Source link */}
        {selectedEvent.sourceUrl && (
          <div className="pt-4 border-t border-white/10">
            <p className="text-xs text-gray-500 mb-2">Source</p>
            <a
              href={selectedEvent.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-white/10 text-neon-cyan hover:bg-white/20 transition-colors w-fit"
            >
              {selectedEvent.sourceUrl.replace(/^https?:\/\//, '').slice(0, 40)}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className="h-full flex flex-col glass-darker">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-neon-red" />
          Active Threats
        </h2>
        <p className="text-xs text-gray-500 mt-1 font-mono">
          {events.length} signals on the map
        </p>
      </div>

      {/* Detail Panel */}
      {selectedEvent && (
        <div className="p-4 border-b border-white/10">
          {renderDetailPanel()}
        </div>
      )}

      {/* Event List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {events.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <ShieldAlert className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No active threats</p>
          </div>
        ) : (
          events.map((event, index) => {
            const info = CATEGORY_INFO[event.category];
            const isSelected = selectedEvent?.id === event.id;
            const severity = event.severity || 'low';
            const severityStyle = SEVERITY_COLORS[severity];
            const alertLevel = event.alertLevel || 'green';
            const alertStyle = ALERT_COLORS[alertLevel];

            return (
              <div
                key={event.id}
                onClick={() => onSelectEvent(event)}
                className={`
                  p-3 rounded-xl cursor-pointer transition-all duration-300
                  animate-fade-in border group
                  ${isSelected
                    ? 'glass-card border-opacity-100'
                    : 'bg-white/[0.02] hover:bg-white/[0.05] border-white/[0.03] hover:border-white/10'
                  }
                `}
                style={{
                  animationDelay: `${index * 30}ms`,
                  borderColor: isSelected ? `${info.color}50` : undefined,
                  boxShadow: isSelected ? `0 4px 24px ${info.color}15, inset 0 1px 0 rgba(255,255,255,0.05)` : undefined,
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="p-2.5 rounded-xl flex-shrink-0 relative transition-transform duration-300 group-hover:scale-105"
                    style={{
                      background: `linear-gradient(135deg, ${info.color}20, ${info.color}10)`,
                      border: `1px solid ${info.color}30`,
                    }}
                  >
                    <span style={{ color: info.color }}>
                      {categoryIcons[event.category]}
                    </span>
                    {event.magnitudeLabel && (
                      <span
                        className="absolute -top-1.5 -right-1.5 text-[8px] font-bold px-1.5 py-0.5 rounded-md shadow-lg whitespace-nowrap"
                        style={{
                          background: `linear-gradient(135deg, ${info.color}, ${info.color}cc)`,
                          color: '#000',
                          boxShadow: `0 2px 8px ${info.color}40`,
                        }}
                      >
                        {event.magnitudeLabel.length > 8 ? event.magnitudeLabel.slice(0, 8) : event.magnitudeLabel}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <h3 className="text-sm font-semibold text-white truncate flex-1 group-hover:text-white/90 transition-colors">
                        {event.title}
                      </h3>
                      {alertStyle.pulse && (
                        <span className="relative flex h-2.5 w-2.5">
                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${alertStyle.text.replace('text-', 'bg-')}`} />
                          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${alertStyle.text.replace('text-', 'bg-')}`} />
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${severityStyle.bg} ${severityStyle.text} border ${severityStyle.border}`}
                      >
                        {severity}
                      </span>
                      {event.country && (
                        <span className="text-[10px] text-gray-400 px-1.5 py-0.5 rounded bg-white/5">
                          {event.country}
                        </span>
                      )}
                      <span className="text-[10px] text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatRelativeTime(event.date)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="p-3 border-t border-white/10 text-center text-[10px] text-gray-600 font-mono flex items-center justify-center gap-1.5">
        <CalendarClock className="w-3 h-3" />
        Live threat feed
      </div>
    </aside>
  );
};
