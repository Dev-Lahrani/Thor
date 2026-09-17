import React, { useState } from 'react';
import { X, AlertTriangle, Bell, Volume2, VolumeX, ShieldAlert } from 'lucide-react';
import type { ThreatEvent } from '../types';
import { SEVERITY_COLORS } from '../utils/helpers';

interface ThreatNotification {
  id: string;
  event: ThreatEvent;
  timestamp: Date;
  read: boolean;
}

interface NotificationToastProps {
  notifications: ThreatNotification[];
  onDismiss: (id: string) => void;
  onDismissAll: () => void;
  onSelectEvent: (event: ThreatEvent) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notifications,
  onDismiss,
  onDismissAll,
  onSelectEvent,
  soundEnabled,
  onToggleSound,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;
  const recentNotifications = notifications.slice(0, 5);

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-20 right-4 z-50 w-80">
      {/* Notification Bell */}
      <div className="flex items-center justify-end gap-2 mb-2">
        <button
          onClick={onToggleSound}
          className="p-2 glass rounded-lg hover:bg-white/10 transition-colors"
          title={soundEnabled ? 'Mute notifications' : 'Enable notification sounds'}
        >
          {soundEnabled ? (
            <Volume2 className="w-4 h-4 text-neon-cyan" />
          ) : (
            <VolumeX className="w-4 h-4 text-gray-500" />
          )}
        </button>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="relative p-2 glass rounded-lg hover:bg-white/10 transition-colors"
        >
          <Bell className="w-5 h-5 text-neon-cyan" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-neon-red text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Notification List */}
      {isExpanded && (
        <div className="glass-darker rounded-xl overflow-hidden animate-slide-in">
          <div className="p-3 border-b border-white/10 flex items-center justify-between">
            <span className="text-sm font-medium text-white">
              Notifications ({notifications.length})
            </span>
            {notifications.length > 0 && (
              <button
                onClick={onDismissAll}
                className="text-xs text-gray-400 hover:text-white transition-colors"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {recentNotifications.map((notification) => {
              const severity = notification.event.severity || 'low';
              const colors = SEVERITY_COLORS[severity];

              return (
                <div
                  key={notification.id}
                  className={`p-3 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors ${
                    !notification.read ? 'bg-white/5' : ''
                  }`}
                  onClick={() => onSelectEvent(notification.event)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${colors.bg}`}>
                      <AlertTriangle className={`w-4 h-4 ${colors.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${colors.bg} ${colors.text} uppercase font-semibold`}>
                          {severity}
                        </span>
                        {!notification.read && (
                          <span className="w-2 h-2 rounded-full bg-neon-cyan" />
                        )}
                      </div>
                      <p className="text-sm text-white truncate mt-1">
                        {notification.event.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {notification.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDismiss(notification.id);
                      }}
                      className="p-1 hover:bg-white/10 rounded transition-colors"
                    >
                      <X className="w-3 h-3 text-gray-500" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {notifications.length > 5 && (
            <div className="p-2 text-center text-xs text-gray-500 border-t border-white/10">
              +{notifications.length - 5} more notifications
            </div>
          )}
        </div>
      )}

      {/* Auto-show latest critical notification */}
      {!isExpanded && unreadCount > 0 && (
        <div className="space-y-2">
          {recentNotifications.slice(0, 2).filter(n => !n.read).map((notification) => {
            const severity = notification.event.severity || 'low';
            const colors = SEVERITY_COLORS[severity];

            return (
              <div
                key={notification.id}
                className={`glass-darker rounded-xl p-3 border ${colors.border} animate-slide-in cursor-pointer hover:bg-white/5 transition-colors`}
                onClick={() => onSelectEvent(notification.event)}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${colors.bg}`}>
                    <ShieldAlert className={`w-4 h-4 ${colors.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${colors.bg} ${colors.text} uppercase font-semibold`}>
                      New {severity} Signal
                    </span>
                    <p className="text-sm text-white truncate mt-1">
                      {notification.event.title}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDismiss(notification.id);
                    }}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                  >
                    <X className="w-3 h-3 text-gray-500" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export type { ThreatNotification };
