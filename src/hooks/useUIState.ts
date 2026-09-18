import { useState, useCallback } from 'react';

export type ViewMode = 'dashboard' | 'cti';
export type CTISubView = 'feeds' | 'map' | 'campaigns' | 'actors';
export type SidebarView = 'list' | 'timeline';

export function useUIState() {
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [ctiSubView, setCtiSubView] = useState<CTISubView>('feeds');
  const [sidebarView, setSidebarView] = useState<SidebarView>('list');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showWeatherCompare, setShowWeatherCompare] = useState(false);
  const [showTrends, setShowTrends] = useState(false);
  const [showGlobe, setShowGlobe] = useState(false);

  const toggleStats = useCallback(() => setShowStats(prev => !prev), []);

  return {
    viewMode,
    setViewMode,
    ctiSubView,
    setCtiSubView,
    sidebarView,
    setSidebarView,
    isSettingsOpen,
    setIsSettingsOpen,
    isExportOpen,
    setIsExportOpen,
    showStats,
    toggleStats,
    showWeatherCompare,
    setShowWeatherCompare,
    showTrends,
    setShowTrends,
    showGlobe,
    setShowGlobe,
  } as const;
}
