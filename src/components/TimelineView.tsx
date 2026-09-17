import React, { useMemo, useState } from 'react';
import { Clock, ChevronDown } from 'lucide-react';
import type { ThreatEvent } from '../types';
import { formatRelativeTime, CATEGORY_INFO, SEVERITY_COLORS } from '../utils/helpers';

interface TimelineViewProps {
  events: ThreatEvent[];
  onSelectEvent: (event: ThreatEvent) => void;
  selectedEvent: ThreatEvent | null;
}

type TimeFilter = '1h' | '6h' | '24h' | '7d' | 'all';

const timeFilterLabels: Record<TimeFilter, string> = {
  '1h': 'Past Hour',
  '6h': 'Past 6 Hours',
  '24h': 'Past 24 Hours',
  '7d': 'Past 7 Days',
  'all': 'All Time',
};

const timeFilterMs: Record<TimeFilter, number> = {
  '1h': 60 * 60 * 1000,
  '6h': 6 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  'all': Infinity,
};

export const TimelineView: React.FC<TimelineViewProps> = ({
  events,
  onSelectEvent,
  selectedEvent,
}) => {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('24h');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const filteredEvents = useMemo(() => {
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();
    return events
      .filter(e => now - new Date(e.date).getTime() <= timeFilterMs[timeFilter])
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [events, timeFilter]);

  // Group by hour/day for visual timeline
  const groupedEvents = filteredEvents.reduce((acc, event) => {
    const date = new Date(event.date);
    let key: string;

    if (timeFilter === '1h' || timeFilter === '6h') {
      const minutes = Math.floor(date.getMinutes() / 15) * 15;
      key = `${date.getHours()}:${minutes.toString().padStart(2, '0')}`;
    } else if (timeFilter === '24h') {
      key = `${date.getHours()}:00`;
    } else {
      key = date.toLocaleDateString();
    }

    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(event);
    return acc;
  }, {} as Record<string, ThreatEvent[]>);

  return (
    <div className="h-full flex flex-col">
      {/* Time Filter Header */}
      <div className="p-3 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Clock className="w-4 h-4" />
          <span>Timeline</span>
        </div>

        {/* Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg text-sm text-white hover:bg-white/10 transition-colors"
          >
            {timeFilterLabels[timeFilter]}
            <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
              <div className="absolute right-0 mt-1 py-1 glass-darker rounded-lg z-50 min-w-[120px]">
                {(Object.keys(timeFilterLabels) as TimeFilter[]).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => {
                      setTimeFilter(filter);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-1.5 text-left text-sm hover:bg-white/10 transition-colors ${
                      timeFilter === filter ? 'text-neon-cyan' : 'text-gray-300'
                    }`}
                  >
                    {timeFilterLabels[filter]}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="px-3 py-2 border-b border-white/10 text-xs text-gray-500 font-mono">
        {filteredEvents.length} signals in {timeFilterLabels[timeFilter].toLowerCase()}
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto p-3">
        {Object.keys(groupedEvents).length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            No signals in this time period
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-3 top-0 bottom-0 w-px bg-gradient-to-b from-neon-cyan/50 via-neon-purple/30 to-transparent" />

            {Object.entries(groupedEvents).map(([timeKey, eventsInGroup]) => (
              <div key={timeKey} className="relative mb-4">
                {/* Time marker */}
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-2 h-2 rounded-full bg-neon-cyan relative z-10" />
                  <span className="text-xs text-gray-500 font-mono">{timeKey}</span>
                </div>

                {/* Events */}
                <div className="ml-6 space-y-2">
                  {eventsInGroup.map((event) => {
                    const info = CATEGORY_INFO[event.category];
                    const isSelected = selectedEvent?.id === event.id;
                    const severityStyle = SEVERITY_COLORS[event.severity || 'low'];

                    return (
                      <div
                        key={event.id}
                        onClick={() => onSelectEvent(event)}
                        className={`p-2 rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-white/10 border border-white/20'
                            : 'bg-white/5 hover:bg-white/10 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {event.magnitudeLabel && (
                            <span
                              className="text-xs font-bold font-mono px-1.5 py-0.5 rounded"
                              style={{ backgroundColor: info.bgColor, color: info.color }}
                            >
                              {event.magnitudeLabel.length > 10 ? event.magnitudeLabel.slice(0, 10) : event.magnitudeLabel}
                            </span>
                          )}
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded uppercase"
                            style={{ backgroundColor: info.bgColor, color: info.color }}
                          >
                            {info.label}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase ${severityStyle.bg} ${severityStyle.text}`}>
                            {event.severity}
                          </span>
                        </div>
                        <p className="text-sm text-white mt-1 truncate">
                          {event.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {formatRelativeTime(event.date)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
