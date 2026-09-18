import React from 'react';
import { Download, Share2, X, FileJson, FileSpreadsheet, Link2, Copy, Check } from 'lucide-react';
import type { DisasterEvent, WeatherData } from '../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  disasters: DisasterEvent[];
  weather: WeatherData[];
  selectedEvent: DisasterEvent | WeatherData | null;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  disasters,
  weather,
  selectedEvent,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const exportToJSON = (data: DisasterEvent[] | WeatherData[] | Record<string, unknown>, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToCSV = (data: DisasterEvent[], filename: string) => {
    const headers = ['ID', 'Title', 'Category', 'Severity', 'Magnitude', 'Depth', 'Latitude', 'Longitude', 'Date', 'Estimated Affected', 'Description'];
    const rows = data.map(d => [
      d.id,
      `"${d.title.replace(/"/g, '""')}"`,
      d.category,
      d.severity || '',
      d.magnitude || '',
      d.depth || '',
      d.coordinates[1],
      d.coordinates[0],
      d.date,
      d.estimatedAffected || '',
      `"${d.description.replace(/"/g, '""')}"`,
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateShareLink = () => {
    if (!selectedEvent) return '';
    if ('id' in selectedEvent) {
      // It's a disaster event
      return `${window.location.origin}?event=${selectedEvent.id}`;
    } else {
      // It's weather data
      return `${window.location.origin}?city=${encodeURIComponent(selectedEvent.city)}`;
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const shareLink = generateShareLink();

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50 animate-scale-in">
        <div className="glass-card rounded-2xl border border-white/[0.08] shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
            <h2 className="text-lg font-bold text-white flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-cyan/20 to-blue-500/10 flex items-center justify-center border border-neon-cyan/20">
                <Download className="w-4 h-4 text-neon-cyan" />
              </div>
              Export & Share
            </h2>
            <button
              onClick={onClose}
              className="p-2.5 hover:bg-white/[0.06] rounded-xl transition-all duration-300 border border-transparent hover:border-white/10"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-5 space-y-6">
            {/* Export Options */}
            <div>
              <label className="text-[10px] font-medium text-gray-500 uppercase tracking-widest mb-3 block">Export All Data</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => exportToJSON({ disasters, weather, exportedAt: new Date().toISOString() }, 'geoalert-data.json')}
                  className="flex items-center justify-center gap-2 p-4 bg-white/[0.03] hover:bg-white/[0.06] rounded-xl transition-all duration-300 text-white border border-white/[0.04] hover:border-neon-cyan/20 group"
                >
                  <FileJson className="w-5 h-5 text-neon-cyan group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium">Export JSON</span>
                </button>
                <button
                  onClick={() => exportToCSV(disasters, 'geoalert-disasters.csv')}
                  className="flex items-center justify-center gap-2 p-4 bg-white/[0.03] hover:bg-white/[0.06] rounded-xl transition-all duration-300 text-white border border-white/[0.04] hover:border-green-500/20 group"
                >
                  <FileSpreadsheet className="w-5 h-5 text-green-400 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium">Export CSV</span>
                </button>
              </div>
            </div>

            {/* Export Stats */}
            <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.04]">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest">Disaster Events</span>
                  <div className="text-white font-mono text-lg mt-1">{disasters.length}</div>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest">Weather Stations</span>
                  <div className="text-white font-mono text-lg mt-1">{weather.length}</div>
                </div>
              </div>
            </div>

            {/* Share Selected Event */}
            {selectedEvent && (
              <div>
                <label className="text-[10px] font-medium text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Share2 className="w-3.5 h-3.5" />
                  Share Selected Event
                </label>
                <div className="p-3.5 bg-white/[0.03] rounded-xl mb-3 border border-white/[0.04]">
                  <p className="text-sm text-white truncate font-medium">
                    {'id' in selectedEvent ? selectedEvent.title : `${selectedEvent.city}, ${selectedEvent.country}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center gap-2 px-3.5 py-2.5 bg-white/[0.03] rounded-xl border border-white/[0.06]">
                    <Link2 className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <input
                      type="text"
                      value={shareLink}
                      readOnly
                      className="flex-1 bg-transparent text-sm text-gray-300 focus:outline-none font-mono"
                    />
                  </div>
                  <button
                    onClick={() => copyToClipboard(shareLink)}
                    className="px-4 py-2.5 bg-gradient-to-r from-neon-cyan/15 to-blue-500/15 text-neon-cyan rounded-xl border border-neon-cyan/30 hover:border-neon-cyan/50 transition-all duration-300"
                  >
                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  const severeEvents = disasters.filter(d => 
                    d.severity === 'severe' || d.severity === 'extreme' || d.severity === 'catastrophic'
                  );
                  exportToJSON(severeEvents, 'geoalert-severe-events.json');
                }}
                className="p-3.5 bg-orange-500/10 hover:bg-orange-500/15 rounded-xl transition-all duration-300 text-orange-400 text-sm font-medium border border-orange-500/20 hover:border-orange-500/30"
              >
                Export Severe+ Only
              </button>
              <button
                onClick={() => {
                  const earthquakes = disasters.filter(d => d.category === 'earthquakes');
                  exportToCSV(earthquakes, 'geoalert-earthquakes.csv');
                }}
                className="p-3.5 bg-neon-purple/10 hover:bg-neon-purple/15 rounded-xl transition-all duration-300 text-neon-purple text-sm font-medium border border-neon-purple/20 hover:border-neon-purple/30"
              >
                Export Earthquakes
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-white/[0.06] flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-white/[0.03] text-gray-300 rounded-xl hover:bg-white/[0.06] transition-all duration-300 text-sm font-medium border border-white/[0.06] hover:border-white/10"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default React.memo(ExportModal);
