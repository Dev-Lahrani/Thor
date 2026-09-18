import { useState, useCallback, lazy, Suspense } from 'react';
import {
  Header,
  RealWorldMap,
  Sidebar,
  Footer,
  LoadingScreen,
  NotificationToast,
  SearchBar,
  TimelineView,
  SettingsModal,
  ExportModal,
  StatsOverlay,
  Watchlist,
  DisasterTrends,
} from './components';
import type { DisasterEvent, WeatherData } from './types';
import { useSettings } from './hooks/useSettings';
import { useNotifications } from './hooks/useNotifications';
import { useFilteredDisasters } from './hooks/useFilteredDisasters';
import { useUIState } from './hooks/useUIState';
import { usePersona } from './hooks/usePersona';
import {
  AlertTriangle,
  Settings,
  Download,
  BarChart3,
  Clock,
  List,
  GitCompare,
  TrendingUp,
  Globe,
  Shield,
  Map,
  Swords,
  Users,
} from 'lucide-react';
import { PersonaSelector } from './components/PersonaSelector';

const WeatherCompare = lazy(() => import('./components/WeatherCompare'));
const Globe3D = lazy(() => import('./components/Globe3D'));
const IoCFeedPanel = lazy(() => import('./components/IoCFeedPanel').then(m => ({ default: m.IoCFeedPanel })));
const ThreatMap = lazy(() => import('./components/ThreatMap').then(m => ({ default: m.ThreatMap })));
const CampaignPanel = lazy(() => import('./components/CampaignPanel').then(m => ({ default: m.CampaignPanel })));
const ActorPanel = lazy(() => import('./components/ActorPanel').then(m => ({ default: m.ActorPanel })));

function App() {
  const { settings, updateSettings } = useSettings();
  const { notifications, initAudio, detectNewEvents, dismiss, dismissAll, markAsRead } =
    useNotifications();
  const { personaId, config: persona, setPersona } = usePersona();

  const handleNewEvents = useCallback(
    (disasterData: DisasterEvent[], previousIds: Set<string>) => {
      detectNewEvents(disasterData, previousIds, {
        enabled: settings.notificationsEnabled,
        minSeverity: settings.minSeverityNotification,
        soundEnabled: settings.soundEnabled,
      });
    },
    [detectNewEvents, settings.notificationsEnabled, settings.minSeverityNotification, settings.soundEnabled],
  );

  useState(() => {
    const handler = () => { initAudio(); window.removeEventListener('click', handler); };
    window.addEventListener('click', handler);
  });

  const {
    disasters, weather, loading, error, lastUpdated, fetchData,
    filters, handleFilterChange, filteredDisasters,
  } = useFilteredDisasters({
    autoRefresh: settings.autoRefresh,
    refreshInterval: settings.refreshInterval,
    onNewEvents: handleNewEvents,
  });

  const {
    viewMode, setViewMode, ctiSubView, setCtiSubView,
    sidebarView, setSidebarView,
    isSettingsOpen, setIsSettingsOpen,
    isExportOpen, setIsExportOpen,
    showStats, toggleStats,
    showWeatherCompare, setShowWeatherCompare,
    showTrends, setShowTrends,
    showGlobe, setShowGlobe,
  } = useUIState();

  const [selectedEvent, setSelectedEvent] = useState<DisasterEvent | WeatherData | null>(null);

  const handleSelectEvent = useCallback((event: DisasterEvent | WeatherData | null) => {
    setSelectedEvent(event);
    if (event && 'id' in event) {
      markAsRead(event.id);
    }
  }, [markAsRead]);

  const handleFocusLocation = (_coords: [number, number]) => {
    // TODO: wire mapFocusCoords to RealWorldMap once focus is implemented
  };

  if (loading && disasters.length === 0) {
    return <LoadingScreen message="Connecting to global monitoring systems..." />;
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-cyber-darker overflow-hidden">
      {/* Header */}
      <Header
        filters={filters}
        onFilterChange={handleFilterChange}
        onRefresh={fetchData}
        lastUpdated={lastUpdated}
        loading={loading}
        disasters={filteredDisasters}
        weatherCount={filters.weather ? weather.length : 0}
      />

      {/* Toolbar below header */}
      <div className="px-4 py-2 border-b border-white/10 flex items-center justify-between gap-4 bg-cyber-darker">
        <div className="flex items-center gap-3">
          {/* Persona Selector */}
          <PersonaSelector currentPersona={personaId} onSelect={setPersona} />

          {/* View Mode Tabs */}
          <div className="flex items-center bg-white/5 rounded-lg p-1">
            <button
              onClick={() => setViewMode('dashboard')}
              className={`px-3 py-1.5 text-xs rounded transition-colors ${viewMode === 'dashboard' ? 'bg-white/10 text-neon-cyan' : 'text-gray-400 hover:text-white'}`}
            >
              <Globe className="w-3.5 h-3.5 inline mr-1.5" />
              Dashboard
            </button>
            <button
              onClick={() => setViewMode('cti')}
              className={`px-3 py-1.5 text-xs rounded transition-colors ${viewMode === 'cti' ? 'bg-neon-cyan/20 text-neon-cyan' : 'text-gray-400 hover:text-white'}`}
            >
              <Shield className="w-3.5 h-3.5 inline mr-1.5" />
              IoC Feeds
            </button>
          </div>
          <SearchBar
            disasters={filteredDisasters}
            weather={weather}
            onSelectEvent={handleSelectEvent}
            onFocusLocation={handleFocusLocation}
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

          <button
            onClick={() => setShowGlobe(true)}
            className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-neon-cyan hover:bg-white/10 transition-colors"
            title="3D Globe View"
          >
            <Globe className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowTrends(true)}
            className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-neon-purple hover:bg-white/10 transition-colors"
            title="Disaster Trends"
          >
            <TrendingUp className="w-4 h-4" />
          </button>

          {persona.showWeatherPanels && (
            <button
              onClick={() => setShowWeatherCompare(true)}
              className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-neon-orange hover:bg-white/10 transition-colors"
              title="Compare Weather"
            >
              <GitCompare className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={toggleStats}
            className={`p-2 rounded-lg transition-colors ${showStats ? 'bg-neon-purple/20 text-neon-purple' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}
            title="Toggle Statistics"
          >
            <BarChart3 className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsExportOpen(true)}
            className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Export Data"
          >
            <Download className="w-4 h-4" />
          </button>

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
      {viewMode === 'cti' ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* CTI sub-tabs */}
          <div className="px-4 py-2 border-b border-white/10 flex items-center gap-2 bg-cyber-darker">
            <button
              onClick={() => setCtiSubView('feeds')}
              className={`px-3 py-1.5 text-xs rounded transition-colors ${ctiSubView === 'feeds' ? 'bg-neon-cyan/20 text-neon-cyan' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
            >
              <Shield className="w-3.5 h-3.5 inline mr-1.5" />
              IoC Feeds
            </button>
            <button
              onClick={() => setCtiSubView('map')}
              className={`px-3 py-1.5 text-xs rounded transition-colors ${ctiSubView === 'map' ? 'bg-neon-cyan/20 text-neon-cyan' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
            >
              <Map className="w-3.5 h-3.5 inline mr-1.5" />
              Threat Map
            </button>
            {persona.showCampaignPanel && (
              <button
                onClick={() => setCtiSubView('campaigns')}
                className={`px-3 py-1.5 text-xs rounded transition-colors ${ctiSubView === 'campaigns' ? 'bg-neon-purple/20 text-neon-purple' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
              >
                <Swords className="w-3.5 h-3.5 inline mr-1.5" />
                Campaigns
              </button>
            )}
            {persona.showActorPanel && (
              <button
                onClick={() => setCtiSubView('actors')}
                className={`px-3 py-1.5 text-xs rounded transition-colors ${ctiSubView === 'actors' ? 'bg-neon-orange/20 text-neon-orange' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
              >
                <Users className="w-3.5 h-3.5 inline mr-1.5" />
                Actors
              </button>
            )}
          </div>

          {/* CTI content */}
          <div className="flex-1 flex overflow-hidden">
            {ctiSubView === 'feeds' && (
              <Suspense fallback={<LoadingScreen message="Loading IoC feeds..." />}>
                <IoCFeedPanel />
              </Suspense>
            )}
            {ctiSubView === 'map' && (
              <>
                <div className="flex-[7] relative">
                  <Suspense fallback={<LoadingScreen message="Loading threat map..." />}>
                    <ThreatMap />
                  </Suspense>
                </div>
                <div className="flex-[3] border-l border-white/10 overflow-hidden">
                  <Suspense fallback={<LoadingScreen message="Loading IoC feeds..." />}>
                    <IoCFeedPanel />
                  </Suspense>
                </div>
              </>
            )}
            {ctiSubView === 'campaigns' && (
              <Suspense fallback={<LoadingScreen message="Loading campaigns..." />}>
                <CampaignPanel />
              </Suspense>
            )}
            {ctiSubView === 'actors' && (
              <Suspense fallback={<LoadingScreen message="Loading actors..." />}>
                <ActorPanel />
              </Suspense>
            )}
          </div>
        </div>
      ) : (
      <div className="flex-1 flex overflow-hidden">
        {/* Map Section (70%) */}
        <div className="flex-[7] relative">
          {error && (
            <div className="absolute top-4 left-4 right-4 z-10 glass rounded-lg p-4 border border-neon-red/30 animate-fade-in">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-neon-red flex-shrink-0" />
                <div>
                  <p className="text-sm text-white font-medium">Connection Error</p>
                  <p className="text-xs text-gray-400">{error}</p>
                </div>
                <button
                  onClick={() => fetchData()}
                  className="ml-auto px-3 py-1 text-xs bg-neon-red/20 text-neon-red rounded hover:bg-neon-red/30 transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          <StatsOverlay
            disasters={filteredDisasters}
            weather={weather}
            isVisible={showStats}
          />

          <RealWorldMap
            disasters={filteredDisasters}
            weather={weather}
            onSelectEvent={handleSelectEvent}
            selectedEvent={selectedEvent}
            showWeather={filters.weather && persona.showWeatherPanels}
          />
        </div>

        {/* Sidebar (30%) */}
        <div className="flex-[3] border-l border-white/10 flex flex-col">
          {persona.showWeatherPanels && (
            <div className="p-4 border-b border-white/10">
              <Watchlist
                weather={weather}
                disasters={filteredDisasters}
                onSelectLocation={handleFocusLocation}
              />
            </div>
          )}

          <div className="flex-1 overflow-hidden">
            {sidebarView === 'list' ? (
              <Sidebar
                disasters={filteredDisasters}
                weather={weather}
                selectedEvent={selectedEvent}
                onSelectEvent={handleSelectEvent}
                showWeather={filters.weather && persona.showWeatherPanels}
              />
            ) : (
              <TimelineView
                disasters={filteredDisasters}
                onSelectEvent={handleSelectEvent}
                selectedEvent={selectedEvent && 'id' in selectedEvent ? selectedEvent : null}
              />
            )}
          </div>
        </div>
      </div>
      )}

      {/* Footer */}
      <Footer />

      {/* Notifications */}
      <NotificationToast
        notifications={notifications}
        onDismiss={dismiss}
        onDismissAll={dismissAll}
        onSelectEvent={handleSelectEvent}
        soundEnabled={settings.soundEnabled}
        onToggleSound={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
      />

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={updateSettings}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        disasters={filteredDisasters}
        weather={weather}
        selectedEvent={selectedEvent}
      />

      {persona.showWeatherPanels && (
        <Suspense fallback={null}>
          <WeatherCompare
            weather={weather}
            isOpen={showWeatherCompare}
            onClose={() => setShowWeatherCompare(false)}
          />
        </Suspense>
      )}

      <DisasterTrends
        disasters={filteredDisasters}
        isOpen={showTrends}
        onClose={() => setShowTrends(false)}
      />

      <Suspense fallback={null}>
        <Globe3D
          disasters={filteredDisasters}
          isOpen={showGlobe}
          onClose={() => setShowGlobe(false)}
          onSelectDisaster={handleSelectEvent}
        />
      </Suspense>
    </div>
  );
}

export default App;
