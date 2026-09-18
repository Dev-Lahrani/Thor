import { useState, useCallback, useRef } from 'react';
import type { DisasterEvent } from '../types';
import type { SeverityLevel } from '../types';

export interface Notification {
  id: string;
  event: DisasterEvent;
  timestamp: Date;
  read: boolean;
}

const severityOrder: SeverityLevel[] = ['minor', 'moderate', 'severe', 'extreme', 'catastrophic'];

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const initAudio = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio('/notification.wav');
    }
  }, []);

  const detectNewEvents = useCallback(
    (
      disasterData: DisasterEvent[],
      previousIds: Set<string>,
      opts: { enabled: boolean; minSeverity: SeverityLevel; soundEnabled: boolean },
    ) => {
      if (!opts.enabled || previousIds.size === 0) return;

      const newEvents = disasterData.filter(d => !previousIds.has(d.id));
      const minSeverityIndex = severityOrder.indexOf(opts.minSeverity);

      const significantNew = newEvents.filter(event => {
        const eventSeverityIndex = severityOrder.indexOf(event.severity || 'minor');
        return eventSeverityIndex >= minSeverityIndex;
      });

      if (significantNew.length > 0) {
        const newNotifications: Notification[] = significantNew.map(event => ({
          id: `notif-${event.id}-${Date.now()}`,
          event,
          timestamp: new Date(),
          read: false,
        }));

        setNotifications(prev => [...newNotifications, ...prev].slice(0, 50));

        if (opts.soundEnabled && audioRef.current) {
          audioRef.current.play().catch(() => {});
        }
      }
    },
    [],
  );

  const dismiss = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const markAsRead = useCallback((eventId: string) => {
    setNotifications(prev =>
      prev.map(n => (n.event.id === eventId ? { ...n, read: true } : n)),
    );
  }, []);

  return { notifications, initAudio, detectNewEvents, dismiss, dismissAll, markAsRead } as const;
}
