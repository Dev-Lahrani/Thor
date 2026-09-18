// Darkfield - CTI feeds aggregator
// https://darkfield.space/api/v1

import type { IoC } from '../../types/cti';

interface DarkfieldIoC {
  indicator: string;
  type: string;
  threat_level: string;
  confidence: string;
  tags: string[];
  first_seen: string;
  last_seen: string;
  source: string;
  description: string;
}

interface DarkfieldResponse {
  iocs: DarkfieldIoC[];
  count: number;
  generated_at: string;
}

const TYPE_MAP: Record<string, IoC['type']> = {
  ip: 'ipv4',
  ipv4: 'ipv4',
  ipv6: 'ipv6',
  domain: 'domain',
  url: 'url',
  sha256: 'sha256',
  sha1: 'sha1',
  md5: 'md5',
  email: 'email',
};

const THREAT_MAP: Record<string, IoC['threatLevel']> = {
  low: 'low',
  medium: 'medium',
  high: 'high',
  critical: 'critical',
};

export function parseDarkfield(response: DarkfieldResponse): IoC[] {
  const iocs: IoC[] = [];

  for (const entry of response.iocs || []) {
    const type = TYPE_MAP[entry.type] || 'ipv4';
    const threatLevel = THREAT_MAP[entry.threat_level] || 'unknown';

    iocs.push({
      id: `darkfield-${entry.indicator.slice(0, 24)}`,
      type,
      value: entry.indicator,
      confidence: entry.confidence as IoC['confidence'] || 'medium',
      threatLevel,
      status: 'active',
      firstSeen: entry.first_seen || new Date().toISOString(),
      lastSeen: entry.last_seen || new Date().toISOString(),
      tags: entry.tags || [],
      source: 'Darkfield',
      sourceFeed: 'darkfield',
      description: entry.description || `Darkfield IOC (${entry.type})`,
    });
  }

  return iocs;
}
