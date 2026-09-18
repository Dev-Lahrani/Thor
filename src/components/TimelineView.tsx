import React, { useState } from 'react';
import { Clock, ChevronDown } from 'lucide-react';
import type { DisasterEvent } from '../types';
import { formatRelativeTime, CATEGORY_INFO } from '../utils/helpers';

interface TimelineViewProps {
  disasters: DisasterEvent[];
  onSelectEvent: (event: DisasterEvent) => void;
  selectedEvent: DisasterEvent | null;
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
  disasters,
  onSelectEvent,
  selectedEvent,
}) => {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('24h');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Filter disasters by time
  const [now] = useState(() => Date.now());
  const filteredDisasters = disasters
    .filter(d => {
      const eventTime = new Date(d.date).getTime();
      return now - eventTime <= timeFilterMs[timeFilter];
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Group by hour/day for visual timeline
  const groupedEvents = filteredDisasters.reduce((acc, event) => {
    const date = new Date(event.date);
    let key: string;
    
    if (timeFilter === '1h' || timeFilter === '6h') {
      // Group by 15-minute intervals
      const minutes = Math.floor(date.getMinutes() / 15) * 15;
      key = `${date.getHours()}:${minutes.toString().padStart(2, '0')}`;
    } else if (timeFilter === '24h') {
      // Group by hour
      key = `${date.getHours()}:00`;
    } else {
      // Group by day
      key = date.toLocaleDateString();
    }
    
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(event);
    return acc;
  }, {} as Record<string, DisasterEvent[]>);

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
        {filteredDisasters.length} events in {timeFilterLabels[timeFilter].toLowerCase()}
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto p-3">
        {Object.keys(groupedEvents).length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            No events in this time period
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-3 top-0 bottom-0 w-px bg-gradient-to-b from-neon-cyan/50 via-neon-purple/30 to-transparent" />
            
            {Object.entries(groupedEvents).map(([timeKey, events]) => (
              <div key={timeKey} className="relative mb-4">
                {/* Time marker */}
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-2 h-2 rounded-full bg-neon-cyan relative z-10" />
                  <span className="text-xs text-gray-500 font-mono">{timeKey}</span>
                </div>
                
                {/* Events */}
                <div className="ml-6 space-y-2">
                  {events.map((event) => {
                    const info = CATEGORY_INFO[event.category];
                    const isSelected = selectedEvent?.id === event.id;
                    
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
                          {event.magnitude && (
                            <span 
                              className="text-xs font-bold font-mono px-1.5 py-0.5 rounded"
                              style={{ backgroundColor: info.bgColor, color: info.color }}
                            >
                              M{event.magnitude.toFixed(1)}
                            </span>
                          )}
                          <span 
                            className="text-[10px] px-1.5 py-0.5 rounded uppercase"
                            style={{ backgroundColor: info.bgColor, color: info.color }}
                          >
                            {info.label}
                          </span>
                          {event.severity && event.severity !== 'minor' && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase ${
                              event.severity === 'catastrophic' ? 'bg-purple-500/20 text-purple-400' :
                              event.severity === 'extreme' ? 'bg-red-500/20 text-red-400' :
                              event.severity === 'severe' ? 'bg-orange-500/20 text-orange-400' :
                              'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {event.severity}
                            </span>
                          )}
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

export default React.memo(TimelineView);
