import React from 'react';
import type { DisasterEvent, WeatherData, DisasterCategory, SeverityLevel, AlertLevel } from '../types';
import { formatRelativeTime, CATEGORY_INFO } from '../utils/helpers';
import { 
  Mountain, 
  Droplets, 
  Flame, 
  CloudLightning, 
  TriangleAlert, 
  CloudSun,
  ExternalLink,
  MapPin,
  Clock,
  Thermometer,
  Wind,
  Droplet,
  X,
  AlertTriangle,
  Users,
  Gauge,
  Eye,
  Sun,
  Sunrise,
  Sunset,
  Cloud,
  CircleAlert,
  Activity,
  TrendingUp,
  Waves
} from 'lucide-react';

interface SidebarProps {
  disasters: DisasterEvent[];
  weather: WeatherData[];
  selectedEvent: DisasterEvent | WeatherData | null;
  onSelectEvent: (event: DisasterEvent | WeatherData | null) => void;
  showWeather: boolean;
}

const categoryIcons: Record<DisasterCategory, React.ReactNode> = {
  earthquakes: <Mountain className="w-4 h-4" />,
  floods: <Droplets className="w-4 h-4" />,
  wildfires: <Flame className="w-4 h-4" />,
  severeStorms: <CloudLightning className="w-4 h-4" />,
  volcanoes: <TriangleAlert className="w-4 h-4" />,
  weather: <CloudSun className="w-4 h-4" />,
};

// Severity badge colors
const severityColors: Record<SeverityLevel, { bg: string; text: string; border: string }> = {
  minor: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/50' },
  moderate: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/50' },
  severe: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/50' },
  extreme: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/50' },
  catastrophic: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/50' },
};

// Alert level colors
const alertColors: Record<AlertLevel, { bg: string; text: string; pulse: boolean }> = {
  green: { bg: 'bg-green-500/20', text: 'text-green-400', pulse: false },
  yellow: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', pulse: false },
  orange: { bg: 'bg-orange-500/20', text: 'text-orange-400', pulse: true },
  red: { bg: 'bg-red-500/20', text: 'text-red-400', pulse: true },
};

// Air quality badge colors
const airQualityColors: Record<string, { bg: string; text: string }> = {
  'good': { bg: 'bg-green-500/20', text: 'text-green-400' },
  'moderate': { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
  'unhealthy-sensitive': { bg: 'bg-orange-500/20', text: 'text-orange-400' },
  'unhealthy': { bg: 'bg-red-500/20', text: 'text-red-400' },
  'very-unhealthy': { bg: 'bg-purple-500/20', text: 'text-purple-400' },
  'hazardous': { bg: 'bg-rose-500/20', text: 'text-rose-400' },
};

const isDisaster = (event: DisasterEvent | WeatherData): event is DisasterEvent => {
  return 'id' in event && 'category' in event;
};

export const Sidebar: React.FC<SidebarProps> = ({
  disasters,
  weather,
  selectedEvent,
  onSelectEvent,
  showWeather,
}) => {
  const renderEventItem = (event: DisasterEvent | WeatherData, index: number) => {
    if (isDisaster(event)) {
      const info = CATEGORY_INFO[event.category];
      const isSelected = selectedEvent && isDisaster(selectedEvent) && selectedEvent.id === event.id;
      const severity = event.severity || 'minor';
      const severityStyle = severityColors[severity];
      const alertLevel = event.alertLevel || 'green';
      const alertStyle = alertColors[alertLevel];
      
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
              {event.magnitude && (
                <span 
                  className="absolute -top-1.5 -right-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-lg"
                  style={{ 
                    background: `linear-gradient(135deg, ${info.color}, ${info.color}cc)`,
                    color: '#000',
                    boxShadow: `0 2px 8px ${info.color}40`,
                  }}
                >
                  {event.magnitude.toFixed(1)}
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
                {event.estimatedAffected && event.estimatedAffected > 0 && (
                  <span className="text-[10px] text-gray-400 flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5">
                    <Users className="w-3 h-3" />
                    {event.estimatedAffected >= 1000000 
                      ? `${(event.estimatedAffected / 1000000).toFixed(1)}M` 
                      : event.estimatedAffected >= 1000 
                        ? `${(event.estimatedAffected / 1000).toFixed(0)}K`
                        : event.estimatedAffected
                    }
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
    } else {
      const info = CATEGORY_INFO.weather;
      const isSelected = selectedEvent && !isDisaster(selectedEvent) && 
        (selectedEvent as WeatherData).city === event.city;
      const aqLevel = event.airQualityLevel || 'good';
      const aqStyle = airQualityColors[aqLevel];
      
      return (
        <div
          key={`weather-${event.city}`}
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
          }}
        >
          <div className="flex items-start gap-3">
            <div 
              className="p-2.5 rounded-xl flex-shrink-0 transition-transform duration-300 group-hover:scale-105"
              style={{ 
                background: `linear-gradient(135deg, ${info.color}20, ${info.color}10)`,
                border: `1px solid ${info.color}30`,
              }}
            >
              <Thermometer className="w-4 h-4" style={{ color: info.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white truncate group-hover:text-white/90 transition-colors">
                  {event.city}, {event.country}
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent font-mono">
                    {event.temperature}°C
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="text-[10px] text-gray-400 px-1.5 py-0.5 rounded bg-white/5">
                  {event.description}
                </span>
                {event.feelsLike !== undefined && event.feelsLike !== event.temperature && (
                  <span className="text-[10px] text-gray-500">
                    Feels {event.feelsLike}°
                  </span>
                )}
                {event.airQualityIndex !== undefined && event.airQualityIndex > 0 && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-semibold ${aqStyle.bg} ${aqStyle.text}`}>
                    AQI {event.airQualityIndex}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }
  };

  const renderDetailPanel = () => {
    if (!selectedEvent) return null;

    if (isDisaster(selectedEvent)) {
      const info = CATEGORY_INFO[selectedEvent.category];
      const severity = selectedEvent.severity || 'minor';
      const severityStyle = severityColors[severity];
      const alertLevel = selectedEvent.alertLevel || 'green';
      const alertStyle = alertColors[alertLevel];
      
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
            {alertStyle.pulse ? (
              <span className={`text-xs px-2 py-1 rounded-full ${alertStyle.bg} ${alertStyle.text} flex items-center gap-1`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                {alertLevel.toUpperCase()} ALERT
              </span>
            ) : (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Activity className="w-3 h-3" />
                Active Event
              </span>
            )}
            {selectedEvent.tsunami && (
              <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 flex items-center gap-1">
                <Waves className="w-3 h-3" />
                TSUNAMI
              </span>
            )}
          </div>

          <p className="text-sm text-gray-300 mb-4">
            {selectedEvent.description}
          </p>

          {/* Earthquake-specific data */}
          {selectedEvent.magnitude && (
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="p-3 bg-white/5 rounded-lg">
                <div className="text-[10px] text-gray-400 mb-1 uppercase tracking-wider">Magnitude</div>
                <span className="text-2xl font-bold font-mono" style={{ color: info.color }}>
                  M{selectedEvent.magnitude.toFixed(1)}
                </span>
              </div>
              {selectedEvent.depth && (
                <div className="p-3 bg-white/5 rounded-lg">
                  <div className="text-[10px] text-gray-400 mb-1 uppercase tracking-wider">Depth</div>
                  <span className="text-2xl font-bold font-mono text-white">
                    {selectedEvent.depth.toFixed(1)}<span className="text-sm">km</span>
                  </span>
                </div>
              )}
              {selectedEvent.estimatedAffected && selectedEvent.estimatedAffected > 0 && (
                <div className="p-3 bg-white/5 rounded-lg">
                  <div className="text-[10px] text-gray-400 mb-1 uppercase tracking-wider flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    Est. Affected
                  </div>
                  <span className="text-xl font-bold font-mono text-neon-purple">
                    {selectedEvent.estimatedAffected >= 1000000 
                      ? `${(selectedEvent.estimatedAffected / 1000000).toFixed(1)}M` 
                      : selectedEvent.estimatedAffected >= 1000 
                        ? `${(selectedEvent.estimatedAffected / 1000).toFixed(0)}K`
                        : selectedEvent.estimatedAffected.toLocaleString()
                    }
                  </span>
                </div>
              )}
              {selectedEvent.impactRadius && selectedEvent.impactRadius > 0 && (
                <div className="p-3 bg-white/5 rounded-lg">
                  <div className="text-[10px] text-gray-400 mb-1 uppercase tracking-wider flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Impact Radius
                  </div>
                  <span className="text-xl font-bold font-mono text-neon-cyan">
                    {selectedEvent.impactRadius}<span className="text-sm">km</span>
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Additional seismic data */}
          {(selectedEvent.felt || selectedEvent.mmi || selectedEvent.cdi || selectedEvent.sig) && (
            <div className="mb-4 p-3 bg-white/5 rounded-lg">
              <div className="text-[10px] text-gray-400 mb-2 uppercase tracking-wider">Seismic Details</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {selectedEvent.felt && (
                  <div className="flex items-center gap-2">
                    <Users className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-300">
                      <span className="font-mono text-white">{selectedEvent.felt.toLocaleString()}</span> felt
                    </span>
                  </div>
                )}
                {selectedEvent.mmi && (
                  <div className="flex items-center gap-2">
                    <Gauge className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-300">
                      MMI: <span className="font-mono text-white">{selectedEvent.mmi.toFixed(1)}</span>
                    </span>
                  </div>
                )}
                {selectedEvent.cdi && (
                  <div className="flex items-center gap-2">
                    <Activity className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-300">
                      CDI: <span className="font-mono text-white">{selectedEvent.cdi.toFixed(1)}</span>
                    </span>
                  </div>
                )}
                {selectedEvent.sig && (
                  <div className="flex items-center gap-2">
                    <CircleAlert className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-300">
                      Significance: <span className="font-mono text-white">{selectedEvent.sig}</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Location info */}
          <div className="space-y-2 text-sm mb-4">
            {selectedEvent.location?.nearestCity && (
              <div className="flex items-center gap-2 text-gray-400">
                <MapPin className="w-4 h-4" />
                <span>
                  {selectedEvent.location.distanceFromCity && (
                    <span className="font-mono text-white">{selectedEvent.location.distanceFromCity}km</span>
                  )} from {selectedEvent.location.nearestCity}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 text-gray-400">
              <MapPin className="w-4 h-4" />
              <span className="font-mono">
                {selectedEvent.coordinates[1].toFixed(4)}°, {selectedEvent.coordinates[0].toFixed(4)}°
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <Clock className="w-4 h-4" />
              <span>{formatRelativeTime(selectedEvent.date)}</span>
              <span className="text-gray-600">•</span>
              <span className="text-[10px] font-mono">{new Date(selectedEvent.date).toLocaleString()}</span>
            </div>
          </div>

          {selectedEvent.sources.length > 0 && (
            <div className="pt-4 border-t border-white/10">
              <p className="text-xs text-gray-500 mb-2">Sources</p>
              <div className="flex flex-wrap gap-2">
                {selectedEvent.sources.map((source) => (
                  <a
                    key={source.id}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-white/10 text-neon-cyan hover:bg-white/20 transition-colors"
                  >
                    {source.id}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    } else {
      const weather = selectedEvent as WeatherData;
      const info = CATEGORY_INFO.weather;
      const aqLevel = weather.airQualityLevel || 'good';
      const aqStyle = airQualityColors[aqLevel];
      
      // Format sunrise/sunset times
      const formatTime = (timeStr?: string) => {
        if (!timeStr) return '--:--';
        const date = new Date(timeStr);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      };

      // Get wind direction name
      const getWindDirection = (deg?: number) => {
        if (deg === undefined) return '';
        const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
        const index = Math.round(deg / 22.5) % 16;
        return directions[index];
      };
      
      return (
        <div className="p-4 glass-darker rounded-xl animate-slide-in max-h-[60vh] overflow-y-auto">
          <div className="flex items-start justify-between mb-4">
            <div 
              className="p-3 rounded-xl"
              style={{ backgroundColor: info.bgColor }}
            >
              <CloudSun className="w-5 h-5" style={{ color: info.color }} />
            </div>
            <button
              onClick={() => onSelectEvent(null)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          <h2 className="text-lg font-bold text-white mb-1">
            {weather.city}
          </h2>
          <p className="text-sm text-gray-400 mb-4">{weather.country}</p>

          {/* Main temperature */}
          <div className="flex items-center gap-4 mb-2">
            <span className="text-5xl font-bold text-neon-cyan font-mono">
              {weather.temperature}°
            </span>
            <div className="flex flex-col">
              <span className="text-sm text-gray-300">
                {weather.description}
              </span>
              {weather.feelsLike !== undefined && (
                <span className="text-xs text-gray-500">
                  Feels like {weather.feelsLike}°C
                </span>
              )}
            </div>
          </div>

          {/* Min/Max temps */}
          {(weather.tempMin !== undefined || weather.tempMax !== undefined) && (
            <div className="flex items-center gap-4 mb-4 text-sm">
              {weather.tempMax !== undefined && (
                <span className="text-red-400 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  H: {weather.tempMax}°
                </span>
              )}
              {weather.tempMin !== undefined && (
                <span className="text-blue-400 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 rotate-180" />
                  L: {weather.tempMin}°
                </span>
              )}
            </div>
          )}

          {/* Main weather stats grid */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="p-3 bg-white/5 rounded-lg">
              <div className="flex items-center gap-2 text-gray-400 mb-1">
                <Wind className="w-3 h-3" />
                <span className="text-[10px] uppercase tracking-wider">Wind</span>
              </div>
              <div className="text-lg font-mono text-white">
                {weather.windSpeed} <span className="text-sm text-gray-400">km/h</span>
              </div>
              {weather.windDirection !== undefined && (
                <div className="text-xs text-gray-500">
                  {getWindDirection(weather.windDirection)} ({weather.windDirection}°)
                </div>
              )}
              {weather.windGusts !== undefined && weather.windGusts > 0 && (
                <div className="text-xs text-orange-400">
                  Gusts: {weather.windGusts} km/h
                </div>
              )}
            </div>
            <div className="p-3 bg-white/5 rounded-lg">
              <div className="flex items-center gap-2 text-gray-400 mb-1">
                <Droplet className="w-3 h-3" />
                <span className="text-[10px] uppercase tracking-wider">Humidity</span>
              </div>
              <div className="text-lg font-mono text-white">{weather.humidity}<span className="text-sm text-gray-400">%</span></div>
              {weather.dewPoint !== undefined && (
                <div className="text-xs text-gray-500">
                  Dew point: {weather.dewPoint}°C
                </div>
              )}
            </div>
            <div className="p-3 bg-white/5 rounded-lg">
              <div className="flex items-center gap-2 text-gray-400 mb-1">
                <Gauge className="w-3 h-3" />
                <span className="text-[10px] uppercase tracking-wider">Pressure</span>
              </div>
              <div className="text-lg font-mono text-white">
                {weather.pressure || '--'} <span className="text-sm text-gray-400">hPa</span>
              </div>
            </div>
            <div className="p-3 bg-white/5 rounded-lg">
              <div className="flex items-center gap-2 text-gray-400 mb-1">
                <Cloud className="w-3 h-3" />
                <span className="text-[10px] uppercase tracking-wider">Cloud Cover</span>
              </div>
              <div className="text-lg font-mono text-white">
                {weather.cloudCover ?? '--'}<span className="text-sm text-gray-400">%</span>
              </div>
            </div>
          </div>

          {/* UV & Precipitation */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {weather.uvIndex !== undefined && (
              <div className="p-3 bg-white/5 rounded-lg">
                <div className="flex items-center gap-2 text-gray-400 mb-1">
                  <Sun className="w-3 h-3" />
                  <span className="text-[10px] uppercase tracking-wider">UV Index</span>
                </div>
                <div className="text-lg font-mono text-white">{weather.uvIndex}</div>
                <div className={`text-xs ${
                  weather.uvIndex <= 2 ? 'text-green-400' :
                  weather.uvIndex <= 5 ? 'text-yellow-400' :
                  weather.uvIndex <= 7 ? 'text-orange-400' :
                  weather.uvIndex <= 10 ? 'text-red-400' : 'text-purple-400'
                }`}>
                  {weather.uvIndex <= 2 ? 'Low' :
                   weather.uvIndex <= 5 ? 'Moderate' :
                   weather.uvIndex <= 7 ? 'High' :
                   weather.uvIndex <= 10 ? 'Very High' : 'Extreme'}
                </div>
              </div>
            )}
            <div className="p-3 bg-white/5 rounded-lg">
              <div className="flex items-center gap-2 text-gray-400 mb-1">
                <Droplets className="w-3 h-3" />
                <span className="text-[10px] uppercase tracking-wider">Precipitation</span>
              </div>
              <div className="text-lg font-mono text-white">
                {weather.precipitation ?? 0}<span className="text-sm text-gray-400">mm</span>
              </div>
              {weather.precipitationProbability !== undefined && (
                <div className="text-xs text-gray-500">
                  {weather.precipitationProbability}% chance
                </div>
              )}
            </div>
          </div>

          {/* Air Quality */}
          {weather.airQualityIndex !== undefined && weather.airQualityIndex > 0 && (
            <div className="p-3 bg-white/5 rounded-lg mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-gray-400">
                  <Eye className="w-3 h-3" />
                  <span className="text-[10px] uppercase tracking-wider">Air Quality</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${aqStyle.bg} ${aqStyle.text}`}>
                  {aqLevel.replace('-', ' ')}
                </span>
              </div>
              <div className="text-2xl font-mono text-white mb-2">AQI {weather.airQualityIndex}</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {weather.pm25 !== undefined && (
                  <div className="text-gray-400">
                    PM2.5: <span className="text-white font-mono">{weather.pm25.toFixed(1)}</span> µg/m³
                  </div>
                )}
                {weather.pm10 !== undefined && (
                  <div className="text-gray-400">
                    PM10: <span className="text-white font-mono">{weather.pm10.toFixed(1)}</span> µg/m³
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sunrise/Sunset */}
          {(weather.sunrise || weather.sunset) && (
            <div className="flex items-center gap-4 p-3 bg-white/5 rounded-lg mb-4">
              {weather.sunrise && (
                <div className="flex items-center gap-2">
                  <Sunrise className="w-4 h-4 text-orange-400" />
                  <div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider">Sunrise</div>
                    <div className="text-sm font-mono text-white">{formatTime(weather.sunrise)}</div>
                  </div>
                </div>
              )}
              {weather.sunset && (
                <div className="flex items-center gap-2">
                  <Sunset className="w-4 h-4 text-purple-400" />
                  <div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider">Sunset</div>
                    <div className="text-sm font-mono text-white">{formatTime(weather.sunset)}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <MapPin className="w-4 h-4" />
              <span className="font-mono">
                {weather.coordinates[1].toFixed(4)}°, {weather.coordinates[0].toFixed(4)}°
              </span>
            </div>
          </div>
        </div>
      );
    }
  };

  // Combine and sort events
  const allEvents: (DisasterEvent | WeatherData)[] = [
    ...disasters,
    ...(showWeather ? weather : []),
  ];

  return (
    <aside className="h-full flex flex-col glass-darker">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-neon-red" />
          Active Events
        </h2>
        <p className="text-xs text-gray-500 mt-1 font-mono">
          {disasters.length} disasters • {showWeather ? `${weather.length} weather stations` : 'Weather hidden'}
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
        {allEvents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No active events</p>
          </div>
        ) : (
          allEvents.map((event, index) => renderEventItem(event, index))
        )}
      </div>
    </aside>
  );
};

export default React.memo(Sidebar);
