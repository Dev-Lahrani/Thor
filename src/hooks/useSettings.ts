import { useState, useCallback, useEffect } from 'react';
import type { UserSettings } from '../components';

const STORAGE_KEY = 'thor-settings';

const DEFAULT_SETTINGS: UserSettings = {
  theme: 'dark',
  temperatureUnit: 'celsius',
  notificationsEnabled: true,
  soundEnabled: false,
  autoRefresh: true,
  refreshInterval: 30,
  minSeverityNotification: 'moderate',
};

function loadSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(loadSettings);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSettings = useCallback((patch: Partial<UserSettings>) => {
    setSettings(prev => ({ ...prev, ...patch }));
  }, []);

  return { settings, updateSettings } as const;
}
