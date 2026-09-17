// ============================================================
// Thor — Threat state provider
// Shared state for the multi-page dashboard: threat events, CVE/KEV/IOC/breach
// feeds, filters, notifications, settings, and the auto-refresh loop.
// Notification logic ported from the GeoAlert App.tsx (D10).
// ============================================================

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  type ReactNode,
} from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchThreatFeeds } from '../services/api';
import { NOTIFICATION_SOUND } from '../utils/audio';
import { severityIndex } from '../utils/helpers';
import type {
  ThreatEvent,
  CveRecord,
  KevEntry,
  IocIndicator,
  BreachRecord,
  FilterState,
  ThreatCategory,
  SeverityLevel,
  FeedStatusMap,
} from '../types';

export interface UserSettings {
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  autoRefresh: boolean;
  refreshInterval: number; // seconds
  minSeverityNotification: SeverityLevel;
}

const SETTINGS_STORAGE_KEY = 'thor_settings_v1';

// eslint-disable-next-line react-refresh/only-export-components
export const DEFAULT_SETTINGS: UserSettings = {
  notificationsEnabled: true,
  soundEnabled: false,
  autoRefresh: true,
  refreshInterval: 300,
  minSeverityNotification: 'high',
};

function loadSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<UserSettings>;
    // Merge over defaults so new fields added later stay valid
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export interface ThreatNotification {
  id: string;
  event: ThreatEvent;
  timestamp: Date;
  read: boolean;
}

export type SidebarView = 'list' | 'timeline';

interface ThreatContextValue {
  // Feed data
  events: ThreatEvent[];
  cves: CveRecord[];
  kev: KevEntry[];
  iocs: IocIndicator[];
  breaches: BreachRecord[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  feedStatus: FeedStatusMap;

  // Selection & filtering
  selectedEvent: ThreatEvent | null;
  filters: FilterState;
  filteredEvents: ThreatEvent[];

  // Notifications & settings
  notifications: ThreatNotification[];
  settings: UserSettings;

  // UI state
  isSettingsOpen: boolean;
  isExportOpen: boolean;
  showStats: boolean;
  sidebarView: SidebarView;
  showTrends: boolean;
  showGlobe: boolean;
  mapFocusCoords: [number, number] | null;

  // Actions
  selectEvent: (event: ThreatEvent | null) => void;
  toggleFilter: (category: ThreatCategory) => void;
  refresh: () => Promise<void>;
  dismissNotification: (id: string) => void;
  dismissAllNotifications: () => void;
  updateSettings: (patch: Partial<UserSettings>) => void;
  setIsSettingsOpen: (open: boolean) => void;
  setIsExportOpen: (open: boolean) => void;
  setShowStats: (show: boolean) => void;
  setSidebarView: (view: SidebarView) => void;
  setShowTrends: (show: boolean) => void;
  setShowGlobe: (show: boolean) => void;
  focusMapLocation: (coords: [number, number]) => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const DEFAULT_FILTERS: FilterState = {
  kev: true,
  maliciousIp: true,
  phishing: true,
  breach: true,
};

const ThreatContext = createContext<ThreatContextValue | null>(null);

export const ThreatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<ThreatEvent[]>([]);
  const [cves, setCves] = useState<CveRecord[]>([]);
  const [kev, setKev] = useState<KevEntry[]>([]);
  const [iocs, setIocs] = useState<IocIndicator[]>([]);
  const [breaches, setBreaches] = useState<BreachRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [feedStatus, setFeedStatus] = useState<FeedStatusMap>({});

  const [searchParams, setSearchParams] = useSearchParams();

  const [selectedEvent, setSelectedEvent] = useState<ThreatEvent | null>(null);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  const [notifications, setNotifications] = useState<ThreatNotification[]>([]);
  const [settings, setSettings] = useState<UserSettings>(loadSettings);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [sidebarView, setSidebarView] = useState<SidebarView>('list');
  const [showTrends, setShowTrends] = useState(false);
  const [showGlobe, setShowGlobe] = useState(false);
  const [mapFocusCoords, setMapFocusCoords] = useState<[number, number] | null>(null);

  const previousEventIds = useRef<Set<string>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  // Notification audio
  useEffect(() => {
    audioRef.current = new Audio(NOTIFICATION_SOUND);
    audioRef.current.preload = 'auto';
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchThreatFeeds();

      // New-event detection for notifications
      const s = settingsRef.current;
      if (s.notificationsEnabled && previousEventIds.current.size > 0) {
        const minIdx = severityIndex(s.minSeverityNotification);
        const significantNew = result.events.filter(
          e => !previousEventIds.current.has(e.id) && severityIndex(e.severity) >= minIdx
        );

        if (significantNew.length > 0) {
          const fresh: ThreatNotification[] = significantNew.map(event => ({
            id: `notif-${event.id}-${Date.now()}`,
            event,
            timestamp: new Date(),
            read: false,
          }));
          setNotifications(prev => [...fresh, ...prev].slice(0, 50));

          if (s.soundEnabled && audioRef.current) {
            audioRef.current.play().catch(() => {});
          }
        }
      }
      previousEventIds.current = new Set(result.events.map(e => e.id));

      setEvents(result.events);
      setCves(result.cves);
      setKev(result.kev);
      setIocs(result.iocs);
      setBreaches(result.breaches);
      setFeedStatus(result.feedStatus);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch threat feeds');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch — runs once, independent of refresh settings so changing
  // the interval doesn't trigger a redundant immediate refetch.
  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Auto-refresh loop
  useEffect(() => {
    if (!settings.autoRefresh) return;
    const interval = setInterval(() => void refresh(), settings.refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [refresh, settings.autoRefresh, settings.refreshInterval]);

  // Persist settings across reloads
  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch {
      /* storage unavailable */
    }
  }, [settings]);

  // Deep link: ?event=<id> selects that event once events have loaded
  const [deepLinkApplied, setDeepLinkApplied] = useState(false);
  useEffect(() => {
    if (deepLinkApplied || events.length === 0) return;
    const eventId = searchParams.get('event');
    if (!eventId) return;
    const match = events.find(e => e.id === eventId);
    if (match) {
      setSelectedEvent(match);
      setDeepLinkApplied(true);
      // Strip the param so a manual refresh doesn't re-trigger
      searchParams.delete('event');
      setSearchParams(searchParams, { replace: true });
    }
  }, [events, searchParams, setSearchParams, deepLinkApplied]);

  const toggleFilter = useCallback((category: ThreatCategory) => {
    setFilters(prev => ({ ...prev, [category]: !prev[category] }));
  }, []);

  const selectEvent = useCallback((event: ThreatEvent | null) => {
    setSelectedEvent(event);
    if (event) {
      setNotifications(prev =>
        prev.map(n => (n.event.id === event.id ? { ...n, read: true } : n))
      );
    }
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const dismissAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const updateSettings = useCallback((patch: Partial<UserSettings>) => {
    setSettings(prev => ({ ...prev, ...patch }));
  }, []);

  const focusMapLocation = useCallback((coords: [number, number]) => {
    setMapFocusCoords(coords);
    setTimeout(() => setMapFocusCoords(null), 100);
  }, []);

  const filteredEvents = useMemo(
    () => events.filter(e => filters[e.category]),
    [events, filters]
  );

  const value: ThreatContextValue = {
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
    showStats,
    sidebarView,
    showTrends,
    showGlobe,
    mapFocusCoords,
    selectEvent,
    toggleFilter,
    refresh,
    dismissNotification,
    dismissAllNotifications,
    updateSettings,
    setIsSettingsOpen,
    setIsExportOpen,
    setShowStats,
    setSidebarView,
    setShowTrends,
    setShowGlobe,
    focusMapLocation,
  };

  return <ThreatContext.Provider value={value}>{children}</ThreatContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export function useThreat(): ThreatContextValue {
  const ctx = useContext(ThreatContext);
  if (!ctx) {
    throw new Error('useThreat must be used inside <ThreatProvider>');
  }
  return ctx;
}
