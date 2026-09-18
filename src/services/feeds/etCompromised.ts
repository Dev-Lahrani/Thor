// Emerging Threats - Compromised IP list
// https://rules.emergingthreats.net/blockrules/compromised-ips.txt

import type { IoC } from '../../types/cti';

export function parseETCompromised(text: string): IoC[] {
  const lines = text.split('\n').filter(l => l.trim() && !l.startsWith('#'));
  const iocs: IoC[] = [];

  for (const line of lines) {
    const ip = line.replace(/;.*$/, '').trim();
    if (!ip || !/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip)) continue;

    iocs.push({
      id: `et-compromised-${ip}`,
      type: 'ipv4',
      value: ip,
      confidence: 'high',
      threatLevel: 'high',
      status: 'active',
      firstSeen: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      tags: ['compromised', 'botnet', 'c&c'],
      source: 'Emerging Threats',
      sourceFeed: 'et-compromised',
      description: 'Confirmed compromised IP address',
    });
  }

  return iocs;
}
