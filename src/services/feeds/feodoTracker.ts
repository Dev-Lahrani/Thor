// Feodo Tracker - Botnet C&C IP blacklist
// https://feodotracker.abuse.ch/blocklist/

import type { IoC } from '../../types/cti';

export function parseFeodoTracker(text: string): IoC[] {
  const lines = text.split('\n').filter(l => l.trim() && !l.startsWith('#'));
  const iocs: IoC[] = [];

  for (const line of lines) {
    const parts = line.split(',');
    if (parts.length < 2) continue;

    const ip = parts[0].trim();
    if (!ip || !/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip)) continue;

    const malware = parts[1]?.trim() || 'unknown';
    const lastSeen = parts[4]?.trim() || new Date().toISOString();

    iocs.push({
      id: `feodo-${ip}`,
      type: 'ipv4',
      value: ip,
      confidence: 'confirmed',
      threatLevel: 'high',
      status: 'active',
      firstSeen: parts[3]?.trim() || lastSeen,
      lastSeen,
      tags: ['botnet', 'c&c', malware.toLowerCase()],
      source: 'Feodo Tracker',
      sourceFeed: 'feodo-tracker',
      description: `Botnet C&C server (${malware})`,
    });
  }

  return iocs;
}
