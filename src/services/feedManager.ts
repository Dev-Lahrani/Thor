// Feed Manager - orchestrates all CTI feed fetchers

import type { FeedSource, FeedResult, IoC } from '../types/cti';
import { parseFeodoTracker } from './feeds/feodoTracker';
import { parseURLHaus } from './feeds/urlhaus';
import { parseSSLBL } from './feeds/sslbl';
import { parseBlocklistDE } from './feeds/blocklistDE';
import { parseETCompromised } from './feeds/etCompromised';
import { parseThreatFox } from './feeds/threatfox';
import { parseMalwareBazaar } from './feeds/malwareBazaar';
import { parseOTX } from './feeds/alienvaultOtx';
import { parseGreyNoise } from './feeds/greyNoise';
import { parseDarkfield } from './feeds/darkfield';
import { enforceIocValidation } from './validateIoc';

export const FEED_SOURCES: FeedSource[] = [
  {
    id: 'feodo-tracker',
    name: 'Feodo Tracker',
    url: 'https://feodotracker.abuse.ch/downloads/ipblocklist.csv',
    format: 'csv',
    updateIntervalMs: 300000,
    enabled: true,
    description: 'Botnet C&C IP blacklist',
  },
  {
    id: 'urlhaus',
    name: 'URLhaus',
    url: 'https://urlhaus-api.abuse.ch/v1/urls/recent/',
    format: 'json',
    updateIntervalMs: 300000,
    enabled: true,
    description: 'Malicious URL database',
  },
  {
    id: 'sslbl',
    name: 'SSL Blacklist',
    url: 'https://sslbl.abuse.ch/blacklist/ja3_fingerprints.csv',
    format: 'csv',
    updateIntervalMs: 600000,
    enabled: true,
    description: 'Malicious JA3 fingerprints',
  },
  {
    id: 'blocklist-de',
    name: 'blocklist.de',
    url: 'https://lists.blocklist.de/lists/all.txt',
    format: 'txt',
    updateIntervalMs: 300000,
    enabled: true,
    description: 'Reported attackers',
  },
  {
    id: 'et-compromised',
    name: 'ET Compromised',
    url: 'https://rules.emergingthreats.net/blockrules/compromised-ips.txt',
    format: 'txt',
    updateIntervalMs: 600000,
    enabled: true,
    description: 'Confirmed compromised IPs',
  },
  {
    id: 'threatfox',
    name: 'ThreatFox',
    url: 'https://threatfox-api.abuse.ch/api/v1/',
    format: 'json',
    updateIntervalMs: 300000,
    enabled: true,
    description: 'IOC sharing platform',
  },
  {
    id: 'malwarebazaar',
    name: 'MalwareBazaar',
    url: 'https://mb-api.abuse.ch/api/v1/',
    format: 'json',
    updateIntervalMs: 600000,
    enabled: true,
    description: 'Malware sample repository',
  },
  {
    id: 'alienvault-otx',
    name: 'AlienVault OTX',
    url: 'https://otx.alienvault.com/api/v1/pulses/subscribed',
    format: 'json',
    updateIntervalMs: 900000,
    enabled: true,
    description: 'Open Threat Exchange',
  },
  {
    id: 'greynoise',
    name: 'GreyNoise',
    url: 'https://viz.greynoise.io/api/community/',
    format: 'json',
    updateIntervalMs: 600000,
    enabled: true,
    description: 'Internet scanner intelligence',
  },
  {
    id: 'darkfield',
    name: 'Darkfield',
    url: 'https://darkfield.space/api/v1/export',
    format: 'json',
    updateIntervalMs: 900000,
    enabled: true,
    description: 'CTI feeds aggregator',
  },
];

async function fetchWithTimeout(url: string, opts: RequestInit & { timeout?: number } = {}): Promise<Response> {
  const { timeout = 30000, ...fetchOpts } = opts;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    return await fetch(url, { ...fetchOpts, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchTextFeed(source: FeedSource, signal?: AbortSignal): Promise<FeedResult> {
  const start = Date.now();
  try {
    const res = await fetchWithTimeout(source.url, { signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const iocs = parseTextFeed(source.id, text);
    return { source: source.id, iocs, fetchedAt: new Date().toISOString(), durationMs: Date.now() - start };
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    return { source: source.id, iocs: [], fetchedAt: new Date().toISOString(), error: String(err), durationMs: Date.now() - start };
  }
}

function parseTextFeed(feedId: string, text: string): IoC[] {
  switch (feedId) {
    case 'feodo-tracker': return parseFeodoTracker(text);
    case 'sslbl': return parseSSLBL(text);
    case 'blocklist-de': return parseBlocklistDE(text);
    case 'et-compromised': return parseETCompromised(text);
    default: return [];
  }
}

async function fetchJsonFeed(source: FeedSource, signal?: AbortSignal): Promise<FeedResult> {
  const start = Date.now();
  try {
    const res = await fetchWithTimeout(source.url, {
      signal,
      headers: source.id === 'threatfox' || source.id === 'malwarebazaar'
        ? { 'Content-Type': 'application/json' }
        : {},
      method: source.id === 'threatfox' || source.id === 'malwarebazaar' ? 'POST' : 'GET',
      body: source.id === 'threatfox'
        ? JSON.stringify({ query: 'get_iocs', days: 1 })
        : source.id === 'malwarebazaar'
          ? JSON.stringify({ query: 'get_recent', days: 1 })
          : undefined,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const iocs = parseJsonFeed(source.id, json);
    return { source: source.id, iocs, fetchedAt: new Date().toISOString(), durationMs: Date.now() - start };
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    return { source: source.id, iocs: [], fetchedAt: new Date().toISOString(), error: String(err), durationMs: Date.now() - start };
  }
}

function parseJsonFeed(feedId: string, data: unknown): IoC[] {
  switch (feedId) {
    case 'urlhaus': return parseURLHaus(data as Parameters<typeof parseURLHaus>[0]);
    case 'threatfox': return parseThreatFox(data as Parameters<typeof parseThreatFox>[0]);
    case 'malwarebazaar': return parseMalwareBazaar(data as Parameters<typeof parseMalwareBazaar>[0]);
    case 'alienvault-otx': return parseOTX(data as Parameters<typeof parseOTX>[0]);
    case 'greynoise': return parseGreyNoise(data as Parameters<typeof parseGreyNoise>[0]);
    case 'darkfield': return parseDarkfield(data as Parameters<typeof parseDarkfield>[0]);
    default: return [];
  }
}

export async function fetchFeed(source: FeedSource, signal?: AbortSignal): Promise<FeedResult> {
  return source.format === 'json' ? fetchJsonFeed(source, signal) : fetchTextFeed(source, signal);
}

export async function fetchAllFeeds(
  sources: FeedSource[] = FEED_SOURCES,
  signal?: AbortSignal,
): Promise<{ results: FeedResult[]; allIoCs: IoC[] }> {
  const enabled = sources.filter(s => s.enabled);
  const results = await Promise.all(enabled.map(s => fetchFeed(s, signal)));
  // Security: every IoC comes from an untrusted third-party feed. Validate
  // values against their declared types before anything downstream
  // (dedup, correlation, geo enrichment, URL building) can consume them.
  const allIoCs = enforceIocValidation(results.flatMap((r: FeedResult) => r.iocs));
  return { results, allIoCs };
}

// Simple in-memory deduplication
export function deduplicateIoCs(iocs: IoC[]): IoC[] {
  const seen = new Map<string, IoC>();

  for (const ioc of iocs) {
    const key = `${ioc.type}:${ioc.value}`;
    const existing = seen.get(key);

    if (!existing) {
      seen.set(key, ioc);
    } else {
      // Merge: keep the one with more sources, combine tags
      if (ioc.confidence === 'confirmed' || ioc.confidence === 'high') {
        seen.set(key, {
          ...ioc,
          tags: [...new Set([...existing.tags, ...ioc.tags])],
          relatedIoCs: [...new Set([...(existing.relatedIoCs || []), existing.id])],
        });
      } else {
        existing.tags = [...new Set([...existing.tags, ...ioc.tags])];
      }
    }
  }

  return Array.from(seen.values());
}
