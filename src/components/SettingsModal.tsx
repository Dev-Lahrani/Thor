import React from 'react';
import {
  X,
  Bell,
  Volume2,
  VolumeX,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import type { SeverityLevel } from '../types';
import type { UserSettings } from '../context/ThreatContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (settings: Partial<UserSettings>) => void;
}

const severityOptions: Array<{ value: SeverityLevel; label: string }> = [
  { value: 'low', label: 'All Signals' },
  { value: 'medium', label: 'Medium+' },
  { value: 'high', label: 'High+' },
  { value: 'critical', label: 'Critical Only' },
];

const refreshOptions = [
  { value: 60, label: '1 minute' },
  { value: 300, label: '5 minutes' },
  { value: 900, label: '15 minutes' },
  { value: 1800, label: '30 minutes' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

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
            <h2 className="text-lg font-bold text-white">Settings</h2>
            <button
              onClick={onClose}
              className="p-2.5 hover:bg-white/[0.06] rounded-xl transition-all duration-300 border border-transparent hover:border-white/10"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-5 space-y-6 max-h-[60vh] overflow-y-auto">
            {/* Notifications */}
            <div>
              <label className="text-[10px] font-medium text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Bell className="w-3.5 h-3.5" />
                Notifications
              </label>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3.5 bg-white/[0.03] rounded-xl border border-white/[0.04]">
                  <span className="text-sm text-white">Enable Notifications</span>
                  <button
                    onClick={() => onUpdateSettings({ notificationsEnabled: !settings.notificationsEnabled })}
                    className={`w-12 h-6 rounded-full transition-all duration-300 relative ${
                      settings.notificationsEnabled ? 'bg-gradient-to-r from-neon-cyan to-blue-500' : 'bg-gray-700'
                    }`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform shadow-md ${
                      settings.notificationsEnabled ? 'left-7' : 'left-1'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-white/[0.03] rounded-xl border border-white/[0.04]">
                  <span className="text-sm text-white flex items-center gap-2">
                    {settings.soundEnabled ? <Volume2 className="w-4 h-4 text-neon-cyan" /> : <VolumeX className="w-4 h-4 text-gray-500" />}
                    Sound
                  </span>
                  <button
                    onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
                    className={`w-12 h-6 rounded-full transition-all duration-300 relative ${
                      settings.soundEnabled ? 'bg-gradient-to-r from-neon-cyan to-blue-500' : 'bg-gray-700'
                    }`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform shadow-md ${
                      settings.soundEnabled ? 'left-7' : 'left-1'
                    }`} />
                  </button>
                </div>

                <div className="p-3.5 bg-white/[0.03] rounded-xl border border-white/[0.04]">
                  <span className="text-sm text-white mb-2 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-neon-red" />
                    Minimum Severity
                  </span>
                  <select
                    value={settings.minSeverityNotification}
                    onChange={(e) => onUpdateSettings({ minSeverityNotification: e.target.value as SeverityLevel })}
                    className="w-full bg-white/[0.06] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-neon-cyan/30 transition-all duration-300"
                  >
                    {severityOptions.map(({ value, label }) => (
                      <option key={value} value={value} className="bg-gray-900">
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Auto Refresh */}
            <div>
              <label className="text-[10px] font-medium text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5" />
                Auto Refresh
              </label>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3.5 bg-white/[0.03] rounded-xl border border-white/[0.04]">
                  <span className="text-sm text-white">Enable Auto Refresh</span>
                  <button
                    onClick={() => onUpdateSettings({ autoRefresh: !settings.autoRefresh })}
                    className={`w-12 h-6 rounded-full transition-all duration-300 relative ${
                      settings.autoRefresh ? 'bg-gradient-to-r from-neon-cyan to-blue-500' : 'bg-gray-700'
                    }`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform shadow-md ${
                      settings.autoRefresh ? 'left-7' : 'left-1'
                    }`} />
                  </button>
                </div>

                {settings.autoRefresh && (
                  <div className="p-3.5 bg-white/[0.03] rounded-xl border border-white/[0.04]">
                    <span className="text-sm text-white mb-2 block">Refresh Interval</span>
                    <select
                      value={settings.refreshInterval}
                      onChange={(e) => onUpdateSettings({ refreshInterval: Number(e.target.value) })}
                      className="w-full bg-white/[0.06] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-neon-cyan/30 transition-all duration-300"
                    >
                      {refreshOptions.map(({ value, label }) => (
                        <option key={value} value={value} className="bg-gray-900">
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-white/[0.06] flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-gradient-to-r from-neon-cyan/15 to-blue-500/15 text-neon-cyan rounded-xl border border-neon-cyan/30 hover:border-neon-cyan/50 transition-all duration-300 text-sm font-medium shadow-lg shadow-neon-cyan/10"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
