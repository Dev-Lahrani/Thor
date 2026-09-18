// SSL Blacklist - Malicious JA3/JA3S fingerprints
// https://sslbl.abuse.ch/blacklist/ja3_fingerprints.csv

import type { IoC } from '../../types/cti';

export function parseSSLBL(text: string): IoC[] {
  const lines = text.split('\n').filter(l => l.trim() && !l.startsWith('#'));
  const iocs: IoC[] = [];

  for (const line of lines) {
    const parts = line.split(',');
    if (parts.length < 4) continue;

    const [ja3Hash, malware, firstSeen, lastSeen, description] = parts.map(p => p.trim());
    if (!ja3Hash || ja3Hash.length !== 32) continue;

    iocs.push({
      id: `sslbl-${ja3Hash.slice(0, 16)}`,
      type: 'sha256',
      value: ja3Hash,
      confidence: 'confirmed',
      threatLevel: 'high',
      status: 'active',
      firstSeen: firstSeen || new Date().toISOString(),
      lastSeen: lastSeen || firstSeen || new Date().toISOString(),
      tags: ['ja3', 'ssl', 'malware', malware?.toLowerCase() || 'unknown'],
      source: 'SSL Blacklist',
      sourceFeed: 'sslbl',
      description: description || `Malicious JA3 fingerprint (${malware})`,
    });
  }

  return iocs;
}
