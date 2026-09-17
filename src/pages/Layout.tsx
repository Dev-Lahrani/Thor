import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header, Footer, NotificationToast, SettingsModal, ExportModal, ThreatTrends, Globe3D, LoadingScreen } from '../components';
import { useThreat } from '../context/ThreatContext';

export const Layout: React.FC = () => {
  const {
    events,
    cves,
    kev,
    iocs,
    breaches,
    loading,
    error,
    lastUpdated,
    feedStatus,
    selectedEvent,
    filters,
    filteredEvents,
    notifications,
    settings,
    isSettingsOpen,
    isExportOpen,
    showTrends,
    showGlobe,
    toggleFilter,
    refresh,
    selectEvent,
    dismissNotification,
    dismissAllNotifications,
    updateSettings,
    setIsSettingsOpen,
    setIsExportOpen,
    setShowTrends,
    setShowGlobe,
  } = useThreat();

  if (loading && events.length === 0) {
    return <LoadingScreen message="Connecting to global threat feeds..." />;
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-cyber-darker overflow-hidden">
      <Header
        filters={filters}
        onFilterChange={toggleFilter}
        onRefresh={() => void refresh()}
        lastUpdated={lastUpdated}
        loading={loading}
        events={filteredEvents}
        kevCount={kev.length}
      />

      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>

      <Footer />

      <NotificationToast
        notifications={notifications}
        onDismiss={dismissNotification}
        onDismissAll={dismissAllNotifications}
        onSelectEvent={selectEvent}
        soundEnabled={settings.soundEnabled}
        onToggleSound={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={updateSettings}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        events={filteredEvents}
        cves={cves}
        kev={kev}
        iocs={iocs}
        breaches={breaches}
        selectedEvent={selectedEvent}
      />

      <ThreatTrends
        events={filteredEvents}
        isOpen={showTrends}
        onClose={() => setShowTrends(false)}
      />

      <Globe3D
        events={filteredEvents}
        isOpen={showGlobe}
        onClose={() => setShowGlobe(false)}
        onSelectEvent={selectEvent}
      />

      {error && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 glass rounded-lg p-3 border border-neon-red/30 animate-fade-in">
          <p className="text-xs text-neon-red">Feed error: {error}</p>
        </div>
      )}

      {/* Degraded-mode indicator: feeds that failed but didn't hard-error */}
      {!loading && Object.entries(feedStatus).some(([, s]) => s === 'error') && !error && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 glass rounded-lg px-3 py-2 border border-neon-orange/30 animate-fade-in">
          <p className="text-xs text-neon-orange">
            ⚠ Some feeds unavailable:{' '}
            {Object.entries(feedStatus)
              .filter(([, s]) => s === 'error')
              .map(([id]) => id)
              .join(', ')}{' '}
            — showing cached/partial data
          </p>
        </div>
      )}
    </div>
  );
};
