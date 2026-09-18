// GreyNoise - Internet scanner intelligence
// https://viz.greynoise.io/api/

import type { IoC } from '../../types/cti';

interface GreyNoiseIP {
  ip: string;
  noise: boolean;
  riot: boolean;
  classification: string;
  name: string;
  link: string;
  last_seen: string;
  message: string;
}

interface GreyNoiseResponse {
  data: GreyNoiseIP[];
  complete: boolean;
}

export function parseGreyNoise(response: GreyNoiseResponse): IoC[] {
  const iocs: IoC[] = [];

  for (const entry of response.data || []) {
    if (!entry.ip || !entry.noise) continue;

    const threatLevel = entry.classification === 'malicious' ? 'high'
      : entry.classification === 'unknown' ? 'medium' : 'low';

    iocs.push({
      id: `greynoise-${entry.ip}`,
      type: 'ipv4',
      value: entry.ip,
      confidence: entry.classification === 'malicious' ? 'high' : 'medium',
      threatLevel: threatLevel as IoC['threatLevel'],
      status: 'active',
      firstSeen: entry.last_seen,
      lastSeen: entry.last_seen,
      tags: [entry.classification, entry.name, entry.riot ? 'riot' : 'noise'].filter(Boolean),
      source: 'GreyNoise',
      sourceFeed: 'greynoise',
      description: entry.message || `Internet scanner: ${entry.name} (${entry.classification})`,
    });
  }

  return iocs;
}
