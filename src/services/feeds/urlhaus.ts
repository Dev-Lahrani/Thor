// URLhaus - Malicious URL database
// https://urlhaus.abuse.ch/api/

import type { IoC } from '../../types/cti';

interface URLHausEntry {
  id: string;
  url: string;
  url_status: string;
  threat: string;
  tags: string[];
  date_added: string;
  last_online: string;
  reporter: string;
  payloads?: Array<{
    filename: string;
    sha256_hash: string;
    file_type: string;
  }>;
}

interface URLHausResponse {
  urls: URLHausEntry[];
}

export function parseURLHaus(data: URLHausResponse): IoC[] {
  const iocs: IoC[] = [];

  for (const entry of data.urls || []) {
    if (!entry.url) continue;

    iocs.push({
      id: `urlhaus-${entry.id}`,
      type: 'url',
      value: entry.url,
      confidence: 'high',
      threatLevel: entry.threat === 'malware_download' ? 'high' : 'medium',
      status: entry.url_status === 'online' ? 'active' : 'expired',
      firstSeen: entry.date_added,
      lastSeen: entry.last_online || entry.date_added,
      tags: entry.tags || [],
      source: 'URLhaus',
      sourceFeed: 'urlhaus',
      description: `Malicious URL - ${entry.threat}`,
    });

    if (entry.payloads) {
      for (const payload of entry.payloads) {
        if (payload.sha256_hash) {
          iocs.push({
            id: `urlhaus-hash-${payload.sha256_hash.slice(0, 16)}`,
            type: 'sha256',
            value: payload.sha256_hash,
            confidence: 'high',
            threatLevel: 'high',
            status: 'active',
            firstSeen: entry.date_added,
            lastSeen: entry.last_online || entry.date_added,
            tags: [...(entry.tags || []), 'payload', payload.file_type],
            source: 'URLhaus',
            sourceFeed: 'urlhaus',
            description: `Malware payload: ${payload.filename}`,
          });
        }
      }
    }
  }

  return iocs;
}
