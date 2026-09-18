import React, { useState, useEffect } from 'react';
import { 
  Star, 
  X, 
  MapPin, 
  Thermometer, 
  Plus,
  ChevronDown,
  ChevronUp,
  Trash2,
  Bell,
  BellOff
} from 'lucide-react';
import type { WeatherData, DisasterEvent } from '../types';

interface WatchlistItem {
  id: string;
  type: 'city' | 'region' | 'disaster';
  name: string;
  country?: string;
  coordinates: [number, number];
  addedAt: string;
  notifyOnDisaster: boolean;
}

interface WatchlistProps {
  weather: WeatherData[];
  disasters: DisasterEvent[];
  onSelectLocation: (coords: [number, number]) => void;
}

const STORAGE_KEY = 'geoalert_watchlist';

export const Watchlist: React.FC<WatchlistProps> = ({
  weather,
  disasters,
  onSelectLocation,
}) => {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(() => {
    // Lazy initializer: load persisted watchlist synchronously at mount
    // instead of setting state from an effect (avoids cascading renders).
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? (JSON.parse(saved) as WatchlistItem[]) : [];
    } catch {
      // Invalid data — start empty
      return [];
    }
  });
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Save watchlist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(watchlist));
  }, [watchlist]);

  const addToWatchlist = (item: Omit<WatchlistItem, 'id' | 'addedAt' | 'notifyOnDisaster'>) => {
    const newItem: WatchlistItem = {
      ...item,
      id: `${item.type}-${crypto.randomUUID()}`,
      addedAt: new Date().toISOString(),
      notifyOnDisaster: true,
    };
    setWatchlist(prev => [...prev, newItem]);
    setShowAddModal(false);
    setSearchQuery('');
  };

  const removeFromWatchlist = (id: string) => {
    setWatchlist(prev => prev.filter(item => item.id !== id));
  };

  const toggleNotifications = (id: string) => {
    setWatchlist(prev => prev.map(item => 
      item.id === id ? { ...item, notifyOnDisaster: !item.notifyOnDisaster } : item
    ));
  };

  // Get weather data for a watchlist city
  const getWeatherForCity = (name: string) => {
    return weather.find(w => w.city.toLowerCase() === name.toLowerCase());
  };

  // Count nearby disasters for a location
  const getNearbyDisasters = (coords: [number, number], radiusKm: number = 500) => {
    return disasters.filter(d => {
      const [lon1, lat1] = coords;
      const [lon2, lat2] = d.coordinates;
      const R = 6371; // Earth's radius in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      return distance <= radiusKm;
    }).length;
  };

  // Available cities to add (from weather data)
  const availableCities = weather.filter(w => 
    !watchlist.some(item => item.name.toLowerCase() === w.city.toLowerCase()) &&
    (searchQuery === '' || 
     w.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
     w.country.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (watchlist.length === 0 && !showAddModal) {
    return (
      <div className="glass-card rounded-2xl p-4 border border-white/[0.06]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-yellow-500/15 flex items-center justify-center">
              <Star className="w-3.5 h-3.5 text-yellow-400" />
            </div>
            <span className="text-sm font-medium text-white">Watchlist</span>
          </div>
        </div>
        <div className="text-center py-6">
          <div className="w-12 h-12 rounded-xl bg-white/[0.03] flex items-center justify-center mx-auto mb-3 border border-white/[0.04]">
            <Star className="w-6 h-6 text-gray-600" />
          </div>
          <p className="text-xs text-gray-500 mb-4">No locations saved</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-neon-cyan/15 to-blue-500/15 text-neon-cyan rounded-xl text-xs font-medium hover:border-neon-cyan/30 transition-all duration-300 border border-neon-cyan/20"
          >
            <Plus className="w-3 h-3 inline mr-1.5" />
            Add Location
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl overflow-hidden border border-white/[0.06]">
      {/* Header */}
      <div 
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.03] transition-all duration-300"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-yellow-500/15 flex items-center justify-center">
            <Star className="w-3.5 h-3.5 text-yellow-400" />
          </div>
          <span className="text-sm font-medium text-white">Watchlist</span>
          <span className="text-[10px] text-gray-500 bg-white/[0.04] px-1.5 py-0.5 rounded-md font-mono">{watchlist.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowAddModal(true);
            }}
            className="p-1.5 hover:bg-white/[0.06] rounded-lg text-gray-400 hover:text-neon-cyan transition-all duration-300 border border-transparent hover:border-white/10"
          >
            <Plus className="w-4 h-4" />
          </button>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </div>
      </div>

      {/* Watchlist Items */}
      {isExpanded && (
        <div className="border-t border-white/[0.04] max-h-64 overflow-y-auto">
          {watchlist.map((item) => {
            const cityWeather = item.type === 'city' ? getWeatherForCity(item.name) : null;
            const nearbyCount = getNearbyDisasters(item.coordinates);
            
            return (
              <div
                key={item.id}
                className="p-3 border-b border-white/[0.03] hover:bg-white/[0.03] transition-all duration-300"
              >
                <div className="flex items-start justify-between">
                  <div 
                    className="flex-1 cursor-pointer"
                    onClick={() => onSelectLocation(item.coordinates)}
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3 h-3 text-neon-cyan" />
                      <span className="text-sm font-medium text-white">{item.name}</span>
                      {item.country && (
                        <span className="text-[10px] text-gray-500">{item.country}</span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3 mt-1.5">
                      {cityWeather && (
                        <div className="flex items-center gap-1 text-[10px] text-gray-400 bg-white/[0.02] px-2 py-0.5 rounded-lg">
                          <Thermometer className="w-2.5 h-2.5" />
                          <span>{cityWeather.temperature}°C</span>
                        </div>
                      )}
                      {nearbyCount > 0 && (
                        <div className="flex items-center gap-1 text-[10px] text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-lg">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                          <span>{nearbyCount} alert{nearbyCount > 1 ? 's' : ''} nearby</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleNotifications(item.id)}
                      className={`p-1.5 rounded-lg transition-all duration-300 ${
                        item.notifyOnDisaster 
                          ? 'text-neon-cyan hover:bg-neon-cyan/15 border border-neon-cyan/20' 
                          : 'text-gray-500 hover:bg-white/[0.06] border border-transparent'
                      }`}
                      title={item.notifyOnDisaster ? 'Notifications on' : 'Notifications off'}
                    >
                      {item.notifyOnDisaster ? (
                        <Bell className="w-3 h-3" />
                      ) : (
                        <BellOff className="w-3 h-3" />
                      )}
                    </button>
                    <button
                      onClick={() => removeFromWatchlist(item.id)}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/15 transition-all duration-300 border border-transparent hover:border-red-500/20"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden border border-white/[0.08] shadow-2xl animate-scale-in">
            <div className="p-5 border-b border-white/[0.06] flex items-center justify-between">
              <h3 className="font-semibold text-white">Add to Watchlist</h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSearchQuery('');
                }}
                className="p-2 hover:bg-white/[0.06] rounded-xl text-gray-400 transition-all duration-300 border border-transparent hover:border-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cities..."
                className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-neon-cyan/30 transition-all duration-300"
                autoFocus
              />
            </div>
            
            <div className="max-h-64 overflow-y-auto">
              {availableCities.slice(0, 20).map((city) => (
                <button
                  key={`${city.city}-${city.country}`}
                  onClick={() => addToWatchlist({
                    type: 'city',
                    name: city.city,
                    country: city.country,
                    coordinates: city.coordinates,
                  })}
                  className="w-full p-3.5 flex items-center justify-between hover:bg-white/[0.04] transition-all duration-300 text-left border-b border-white/[0.02]"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-white font-medium">{city.city}</span>
                    <span className="text-[10px] text-gray-500">{city.country}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-gray-400 bg-white/[0.03] px-2 py-1 rounded-lg">
                    <Thermometer className="w-3 h-3" />
                    <span>{city.temperature}°C</span>
                  </div>
                </button>
              ))}
              {availableCities.length === 0 && (
                <div className="p-6 text-center text-gray-500 text-sm">
                  {searchQuery ? 'No cities found' : 'All cities already in watchlist'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
