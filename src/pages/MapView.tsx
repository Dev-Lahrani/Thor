import React from 'react';
import {
  ThreatMap,
  Sidebar,
  SearchBar,
  TimelineView,
  StatsOverlay,
} from '../components';
import { useThreat } from '../context/ThreatContext';
import { AlertTriangle, Settings, Download, BarChart3, Clock, List, TrendingUp, Globe } from 'lucide-react';

export const MapView: React.FC = () => {
  const {
    filteredEvents,
    cves,
    iocs,
    breaches,
    kev,
    error,
    selectedEvent,
    sidebarView,
    showStats,
    selectEvent,
    setSidebarView,
    setShowStats,
    setIsExportOpen,
    setIsSettingsOpen,
    setShowTrends,
    setShowGlobe,
    refresh,
  } = useThreat();

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="px-4 py-2 border-b border-white/10 flex items-center justify-between gap-4 bg-cyber-darker">
        <div className="flex items-center gap-2">
          <SearchBar
            events={filteredEvents}
            cves={cves}
            iocs={iocs}
            breaches={breaches}
            onSelectEvent={selectEvent}
          />
        </div>

        <div className="flex items-center gap-2">
          {/* View toggles */}
          <div className="flex items-center bg-white/5 rounded-lg p-1">
            <button
              onClick={() => setSidebarView('list')}
              className={`p-2 rounded transition-colors ${sidebarView === 'list' ? 'bg-white/10 text-neon-cyan' : 'text-gray-400 hover:text-white'}`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSidebarView('timeline')}
              className={`p-2 rounded transition-colors ${sidebarView === 'timeline' ? 'bg-white/10 text-neon-cyan' : 'text-gray-400 hover:text-white'}`}
              title="Timeline View"
            >
              <Clock className="w-4 h-4" />
            </button>
          </div>

          {/* 3D Globe */}
          <button
            onClick={() => setShowGlobe(true)}
            className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-neon-cyan hover:bg-white/10 transition-colors"
            title="3D Globe View"
          >
            <Globe className="w-4 h-4" />
          </button>

          {/* Trends */}
          <button
            onClick={() => setShowTrends(true)}
            className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-neon-purple hover:bg-white/10 transition-colors"
            title="Threat Trends"
          >
            <TrendingUp className="w-4 h-4" />
          </button>

          {/* Stats toggle */}
          <button
            onClick={() => setShowStats(!showStats)}
            className={`p-2 rounded-lg transition-colors ${showStats ? 'bg-neon-purple/20 text-neon-purple' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}
            title="Toggle Statistics"
          >
            <BarChart3 className="w-4 h-4" />
          </button>

          {/* Export */}
          <button
            onClick={() => setIsExportOpen(true)}
            className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Export Data"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Settings */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Map Section (70%) */}
        <div className="flex-[7] relative">
          {error && (
            <div className="absolute top-4 left-4 right-4 z-10 glass rounded-lg p-4 border border-neon-red/30 animate-fade-in">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-neon-red flex-shrink-0" />
                <div>
                  <p className="text-sm text-white font-medium">Feed Connection Error</p>
                  <p className="text-xs text-gray-400">{error}</p>
                </div>
                <button
                  onClick={() => void refresh()}
                  className="ml-auto px-3 py-1 text-xs bg-neon-red/20 text-neon-red rounded hover:bg-neon-red/30 transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* Stats Overlay */}
          <StatsOverlay
            events={filteredEvents}
            kev={kev}
            iocs={iocs}
            isVisible={showStats}
          />

          <ThreatMap
            events={filteredEvents}
            onSelectEvent={selectEvent}
            selectedEvent={selectedEvent}
          />
        </div>

        {/* Sidebar (30%) */}
        <div className="flex-[3] border-l border-white/10 flex flex-col">
          <div className="flex-1 overflow-hidden">
            {sidebarView === 'list' ? (
              <Sidebar
                events={filteredEvents}
                selectedEvent={selectedEvent}
                onSelectEvent={selectEvent}
              />
            ) : (
              <TimelineView
                events={filteredEvents}
                onSelectEvent={selectEvent}
                selectedEvent={selectedEvent}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
