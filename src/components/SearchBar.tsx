import React, { useState } from 'react';
import { Search, MapPin, X, Loader2 } from 'lucide-react';
import type { DisasterEvent, WeatherData } from '../types';

interface SearchBarProps {
  disasters: DisasterEvent[];
  weather: WeatherData[];
  onSelectEvent: (event: DisasterEvent | WeatherData) => void;
  onFocusLocation: (coords: [number, number]) => void;
}

interface GeocodingResult {
  name: string;
  country: string;
  lat: number;
  lon: number;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  disasters,
  weather,
  onSelectEvent,
  onFocusLocation,
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [geocodingResults, setGeocodingResults] = useState<GeocodingResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filter disasters and weather by query
  const filteredDisasters = query.length >= 2
    ? disasters.filter(d => 
        d.title.toLowerCase().includes(query.toLowerCase()) ||
        d.description.toLowerCase().includes(query.toLowerCase()) ||
        d.location?.nearestCity?.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5)
    : [];

  const filteredWeather = query.length >= 2
    ? weather.filter(w =>
        w.city.toLowerCase().includes(query.toLowerCase()) ||
        w.country.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 3)
    : [];

  // Geocoding search for locations
  const searchLocation = async (searchQuery: string) => {
    if (searchQuery.length < 3) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchQuery)}&count=5&language=en&format=json`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.results) {
          setGeocodingResults(data.results.map((r: { name: string; country?: string; latitude: number; longitude: number }) => ({
            name: r.name,
            country: r.country || '',
            lat: r.latitude,
            lon: r.longitude,
          })));
        } else {
          setGeocodingResults([]);
        }
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setGeocodingResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(true);
    
    // Debounced geocoding search
    if (value.length >= 3) {
      const timeoutId = setTimeout(() => searchLocation(value), 500);
      return () => clearTimeout(timeoutId);
    } else {
      setGeocodingResults([]);
    }
  };

  const handleSelectLocation = (result: GeocodingResult) => {
    onFocusLocation([result.lon, result.lat]);
    setQuery('');
    setIsOpen(false);
    setGeocodingResults([]);
  };

  const handleSelectEvent = (event: DisasterEvent | WeatherData) => {
    onSelectEvent(event);
    setQuery('');
    setIsOpen(false);
  };

  const hasResults = filteredDisasters.length > 0 || filteredWeather.length > 0 || geocodingResults.length > 0;

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder="Search events, cities, or locations..."
          className="w-64 pl-10 pr-8 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-neon-cyan/50 focus:bg-white/10 transition-all"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setGeocodingResults([]);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neon-cyan animate-spin" />
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 glass-darker rounded-xl overflow-hidden z-50 max-h-96 overflow-y-auto">
          {!hasResults && !isLoading && (
            <div className="p-4 text-center text-gray-500 text-sm">
              No results found
            </div>
          )}

          {/* Disaster Events */}
          {filteredDisasters.length > 0 && (
            <div>
              <div className="px-3 py-2 text-xs text-gray-500 uppercase tracking-wider bg-white/5">
                Disaster Events
              </div>
              {filteredDisasters.map((disaster) => (
                <div
                  key={disaster.id}
                  onClick={() => handleSelectEvent(disaster)}
                  className="px-3 py-2 hover:bg-white/10 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      disaster.severity === 'catastrophic' ? 'bg-purple-500/20 text-purple-400' :
                      disaster.severity === 'extreme' ? 'bg-red-500/20 text-red-400' :
                      disaster.severity === 'severe' ? 'bg-orange-500/20 text-orange-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {disaster.magnitude ? `M${disaster.magnitude.toFixed(1)}` : disaster.severity}
                    </span>
                    <span className="text-sm text-white truncate">{disaster.title}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Weather Stations */}
          {filteredWeather.length > 0 && (
            <div>
              <div className="px-3 py-2 text-xs text-gray-500 uppercase tracking-wider bg-white/5">
                Weather Stations
              </div>
              {filteredWeather.map((w) => (
                <div
                  key={w.city}
                  onClick={() => handleSelectEvent(w)}
                  className="px-3 py-2 hover:bg-white/10 cursor-pointer transition-colors flex items-center justify-between"
                >
                  <span className="text-sm text-white">{w.city}, {w.country}</span>
                  <span className="text-neon-cyan font-mono">{w.temperature}°C</span>
                </div>
              ))}
            </div>
          )}

          {/* Location Search Results */}
          {geocodingResults.length > 0 && (
            <div>
              <div className="px-3 py-2 text-xs text-gray-500 uppercase tracking-wider bg-white/5">
                Locations
              </div>
              {geocodingResults.map((result, index) => (
                <div
                  key={`${result.lat}-${result.lon}-${index}`}
                  onClick={() => handleSelectLocation(result)}
                  className="px-3 py-2 hover:bg-white/10 cursor-pointer transition-colors flex items-center gap-2"
                >
                  <MapPin className="w-4 h-4 text-neon-purple" />
                  <span className="text-sm text-white">
                    {result.name}
                    {result.country && <span className="text-gray-500">, {result.country}</span>}
                  </span>
                </div>
              ))}
            </div>
          )}
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

export default React.memo(SearchBar);
