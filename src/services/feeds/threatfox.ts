// ThreatFox - IOC sharing platform
// https://threatfox-api.abuse.ch/api/v1/

import type { IoC } from '../../types/cti';

interface ThreatFoxIoC {
  id: string;
  ioc: string;
  ioc_type: string;
  threat_type: string;
  malware: string;
  confidence_level: number;
  first_seen: string;
  last_seen: string;
  tags: string[];
  reporter: string;
}

interface ThreatFoxResponse {
  query_status: string;
  data: ThreatFoxIoC[];
}

const TYPE_MAP: Record<string, IoC['type']> = {
  ip: 'ipv4',
  url: 'url',
  domain: 'domain',
  md5: 'md5',
  sha256: 'sha256',
  sha1: 'sha1',
  email: 'email',
};

export function parseThreatFox(response: ThreatFoxResponse): IoC[] {
  const iocs: IoC[] = [];

  if (response.query_status !== 'ok' || !response.data) return iocs;

  for (const entry of response.data) {
    if (!entry.ioc) continue;

    const type = TYPE_MAP[entry.ioc_type] || TYPE_MAP[entry.threat_type] || 'ipv4';
    const confidence = entry.confidence_level >= 80 ? 'high'
      : entry.confidence_level >= 50 ? 'medium' : 'low';

    iocs.push({
      id: `threatfox-${entry.id}`,
      type,
      value: entry.ioc,
      confidence,
      threatLevel: confidence === 'high' ? 'high' : 'medium',
      status: 'active',
      firstSeen: entry.first_seen,
      lastSeen: entry.last_seen,
      tags: [entry.threat_type, entry.malware, ...(entry.tags || [])],
      source: 'ThreatFox',
      sourceFeed: 'threatfox',
      description: `${entry.threat_type} - ${entry.malware}`,
    });
  }

  return iocs;
}
