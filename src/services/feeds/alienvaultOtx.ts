// AlienVault OTX - Open Threat Exchange
// https://otx.alienvault.com/api/v1/pulses

import type { IoC } from '../../types/cti';

interface OTXIndicator {
  type: string;
  indicator: string;
  title?: string;
  description?: string;
}

interface OTXPulse {
  id: string;
  name: string;
  description: string;
  created: string;
  modified: string;
  tags: string[];
  adversary?: string;
  malware_families?: string[];
  attack_ids?: Array<{ id: string; name: string }>;
  indicators: OTXIndicator[];
}

interface OTXResponse {
  results: OTXPulse[];
}

const TYPE_MAP: Record<string, IoC['type']> = {
  IPv4: 'ipv4',
  IPv6: 'ipv6',
  domain: 'domain',
  hostname: 'domain',
  URL: 'url',
  URI: 'url',
  FileHash_MD5: 'md5',
  FileHash_SHA1: 'sha1',
  FileHash_SHA256: 'sha256',
  Email: 'email',
  CIDR: 'ipv4',
};

export function parseOTX(response: OTXResponse): IoC[] {
  const iocs: IoC[] = [];

  for (const pulse of response.results || []) {
    for (const indicator of pulse.indicators || []) {
      const type = TYPE_MAP[indicator.type];
      if (!type) continue;

      iocs.push({
        id: `otx-${pulse.id}-${indicator.indicator.slice(0, 16)}`,
        type,
        value: indicator.indicator,
        confidence: 'medium',
        threatLevel: 'medium',
        status: 'active',
        firstSeen: pulse.created,
        lastSeen: pulse.modified || pulse.created,
        tags: [...(pulse.tags || []), indicator.type].filter(Boolean),
        source: 'AlienVault OTX',
        sourceFeed: 'alienvault-otx',
        description: indicator.description || indicator.title || pulse.name,
      });
    }
  }

  return iocs;
}
