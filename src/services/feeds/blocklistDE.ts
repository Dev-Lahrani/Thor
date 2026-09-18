// blocklist.de - Reported attackers
// https://lists.blocklist.de/lists/all.txt

import type { IoC } from '../../types/cti';

export function parseBlocklistDE(text: string): IoC[] {
  const lines = text.split('\n').filter(l => l.trim() && !l.startsWith('#') && !l.startsWith('//'));
  const iocs: IoC[] = [];

  for (const line of lines) {
    const ip = line.split('#')[0].trim();
    if (!ip || !/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip)) continue;

    iocs.push({
      id: `blocklistde-${ip}`,
      type: 'ipv4',
      value: ip,
      confidence: 'medium',
      threatLevel: 'medium',
      status: 'active',
      firstSeen: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      tags: ['scanner', 'brute-force', 'attack'],
      source: 'blocklist.de',
      sourceFeed: 'blocklist-de',
      description: 'Reported attacker IP',
    });
  }

  return iocs;
}
