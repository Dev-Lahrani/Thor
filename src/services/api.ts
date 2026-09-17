// ============================================================
// Thor — Threat intelligence feeds
// All sources are free and require no API keys.
// CORS status verified 2026-09:
//   direct (CORS *)      : NVD, HIBP, OpenPhish, DShield/ISC, ipwho.is
//   via r.jina.ai relay  : CISA KEV, Feodo Tracker
// ============================================================

import type {
  CveRecord,
  KevEntry,
  IocIndicator,
  ThreatEvent,
  BreachRecord,
  SeverityLevel,
  NvdCveItem,
  KevCatalog,
  FeodoEntry,
  ThreatSource,
  ThreatCategory,
} from '../types';

// ------------------------------------------------------------
// Config
// ------------------------------------------------------------
const NVD_API = 'https://services.nvd.nist.gov/rest/json/cves/2.0';
const KEV_FEED = 'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json';
const FEODO_FEED = 'https://feodotracker.abuse.ch/downloads/ipblocklist.json';
const OPENPHISH_FEED = 'https://raw.githubusercontent.com/openphish/public_feed/refs/heads/main/feed.txt';
const HIBP_API = 'https://haveibeenpwned.com/api/v3/breaches';
const DSHIELD_SOURCES = 'https://isc.sans.edu/api/topips/records/200?json';
const GEO_API = 'https://ipwho.is';
const CORS_RELAY = 'https://r.jina.ai/';

const GEO_CACHE_KEY = 'thor_geo_cache_v1';
const GEO_CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 1 week

// ------------------------------------------------------------
// Simple TTL cache
// ------------------------------------------------------------
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

function cached<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.timestamp < ttlMs) {
    return Promise.resolve(hit.data as T);
  }
  return fetcher().then(data => {
    cache.set(key, { data, timestamp: Date.now() });
    return data;
  });
}

/**
 * Fetch through a CORS relay with graceful fallback to direct fetch.
 * Used for feeds that don't send access-control-allow-origin.
 */
async function relayFetch<T>(url: string, validate: (raw: unknown) => T | null): Promise<T | null> {
  // Try relay first (feed lacks CORS headers)
  try {
    const res = await fetch(CORS_RELAY + url);
    if (res.ok) {
      const text = await res.text();
      // Relay prefixes content with "Title:/URL Source:/Published Time:" metadata lines.
      // Feeds may be JSON objects ({) or arrays ([) — slice from whichever comes first.
      const objStart = text.indexOf('{');
      const arrStart = text.indexOf('[');
      let jsonStart = -1;
      if (objStart === -1) jsonStart = arrStart;
      else if (arrStart === -1) jsonStart = objStart;
      else jsonStart = Math.min(objStart, arrStart);
      if (jsonStart >= 0) {
        const cleaned = text.slice(jsonStart);
        try {
          const parsed = validate(JSON.parse(cleaned));
          if (parsed) return parsed;
        } catch {
          /* fall through to direct */
        }
      }
    }
  } catch {
    /* fall through to direct */
  }

  // Direct fetch (works if CORS policy changes or an extension adds headers)
  try {
    const res = await fetch(url);
    if (res.ok) {
      const parsed = validate(await res.json());
      if (parsed) return parsed;
    }
  } catch {
    /* both paths failed */
  }
  return null;
}

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

export function cvssToSeverity(score: number): SeverityLevel {
  if (score >= 9) return 'critical';
  if (score >= 7) return 'high';
  if (score >= 4) return 'medium';
  return 'low';
}

function alertFromSeverity(sev: SeverityLevel): 'green' | 'yellow' | 'orange' | 'red' {
  switch (sev) {
    case 'critical': return 'red';
    case 'high': return 'orange';
    case 'medium': return 'yellow';
    default: return 'green';
  }
}

// ------------------------------------------------------------
// NVD — recent CVEs (last N days, CVSS scored)
// ------------------------------------------------------------

export async function fetchRecentCves(days = 3, maxResults = 150): Promise<CveRecord[]> {
  return cached(`nvd-${days}-${maxResults}`, 15 * 60 * 1000, async () => {
    const end = new Date();
    const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const fmt = (d: Date) => d.toISOString().replace(/\.\d+Z$/, '+00:00');
    const url = `${NVD_API}?pubStartDate=${encodeURIComponent(fmt(start))}&pubEndDate=${encodeURIComponent(fmt(end))}&resultsPerPage=${maxResults}`;

    try {
      const res = await fetch(url);
      if (!res.ok) return [];
      const data = await res.json();
      return (data.vulnerabilities || [])
        .map((item: NvdCveItem) => normalizeNvdCve(item))
        .filter((c: CveRecord | null): c is CveRecord => c !== null);
    } catch (err) {
      console.error('[Thor] NVD fetch failed:', err);
      return [];
    }
  });
}

function normalizeNvdCve(item: NvdCveItem): CveRecord | null {
  const cve = item.cve;
  const metrics = cve.metrics || {};

  // Prefer CVSS v3.1, then v3.0, then v2
  const v31 = metrics.cvssMetricV31?.[0];
  const v30 = metrics.cvssMetricV30?.[0];
  const v2 = metrics.cvssMetricV2?.[0];

  let cvssScore = 0;
  let cvssVector = '';
  let severity: SeverityLevel = 'medium';
  let attackVector: string | undefined;

  if (v31) {
    cvssScore = v31.cvssData.baseScore;
    cvssVector = v31.cvssData.vectorString;
    severity = cvssToSeverity(cvssScore);
    attackVector = v31.cvssData.attackVector;
  } else if (v30) {
    cvssScore = v30.cvssData.baseScore;
    cvssVector = v30.cvssData.vectorString;
    severity = cvssToSeverity(cvssScore);
    attackVector = v30.cvssData.attackVector;
  } else if (v2) {
    cvssScore = v2.cvssData.baseScore;
    cvssVector = v2.cvssData.vectorString;
    // NVD v2 baseSeverity uses lowercase words
    const s = (v2.baseSeverity || '').toLowerCase();
    severity = s === 'high' ? 'high' : s === 'medium' ? 'medium' : s === 'low' ? 'low' : cvssToSeverity(cvssScore);
  } else {
    return null; // No CVSS data — skip
  }

  const description =
    cve.descriptions?.find(d => d.lang === 'en')?.value || 'No description available.';

  // Extract vendors from CPE criteria
  const vendors = new Set<string>();
  cve.configurations?.forEach(conf =>
    conf.nodes?.forEach(node =>
      node.cpeMatch?.forEach(cpe => {
        const parts = cpe.criteria.split(':');
        if (parts.length > 3) {
          vendors.add(parts[3].replace(/_/g, ' '));
        }
      })
    )
  );

  return {
    id: cve.id,
    title: `${cve.id} — ${vendors.size > 0 ? [...vendors].slice(0, 2).map(v => v.charAt(0).toUpperCase() + v.slice(1)).join(', ') : 'Vulnerability'}`,
    description,
    published: cve.published,
    lastModified: cve.lastModified,
    cvssScore,
    cvssVector,
    severity,
    attackVector,
    cisaExploitPoc: /CISA-EXPLOIT-POC|KEV/i.test(cve.sourceIdentifier || ''),
    references: (cve.references || []).map(r => r.url).slice(0, 5),
    vendors: [...vendors].slice(0, 6),
    cwe: cve.weaknesses?.[0]?.description?.[0]?.value,
    sourceIdentifier: cve.sourceIdentifier,
  };
}

// ------------------------------------------------------------
// CISA KEV — actively exploited vulnerabilities
// ------------------------------------------------------------

const KEV_MAX_AGE_DAYS = 180;

export async function fetchKevEntries(): Promise<KevEntry[]> {
  return cached('kev', 30 * 60 * 1000, async () => {
    const parse = (raw: unknown): KevCatalog | null => {
      if (raw && typeof raw === 'object' && 'vulnerabilities' in raw) {
        return raw as KevCatalog;
      }
      return null;
    };

    const catalog = await relayFetch<KevCatalog>(KEV_FEED, parse);
    if (!catalog) return [];

    const cutoff = Date.now() - KEV_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
    return catalog.vulnerabilities
      .filter(v => new Date(v.dateAdded).getTime() >= cutoff)
      .sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime())
      .map(v => ({
        cveID: v.cveID,
        vendorProject: v.vendorProject,
        product: v.product,
        vulnerabilityName: v.vulnerabilityName,
        dateAdded: v.dateAdded,
        shortDescription: v.shortDescription,
        requiredAction: v.requiredAction,
        dueDate: v.dueDate,
        knownRansomwareCampaignUse: (v.knownRansomwareCampaignUse === 'Known' ? 'Known' : 'Unknown') as 'Known' | 'Unknown',
        notes: v.notes,
        cwes: v.cwes?.map(c => c.cweID),
      }));
  });
}

// ------------------------------------------------------------
// Feodo Tracker — C2 servers
// ------------------------------------------------------------

export async function fetchC2Ips(): Promise<IocIndicator[]> {
  return cached('feodo', 30 * 60 * 1000, async () => {
    const parse = (raw: unknown): FeodoEntry[] | null =>
      Array.isArray(raw) ? (raw as FeodoEntry[]) : null;

    const entries = await relayFetch<FeodoEntry[]>(FEODO_FEED, parse);
    if (!entries) return [];

    return entries
      .filter(e => e.ip_address)
      .map((e, i) => ({
        id: `feodo-${e.ip_address}-${e.port}-${i}`,
        type: 'c2-ip' as const,
        value: e.ip_address,
        threat: e.malware || 'Botnet C2',
        source: 'Feodo' as ThreatSource,
        country: e.country,
        firstSeen: e.first_seen,
        lastSeen: e.last_online,
        confidence: 'high' as const,
      }));
  });
}

// ------------------------------------------------------------
// DShield — top attacking sources
// ------------------------------------------------------------

interface DshieldSource {
  rank?: number;
  source: string;
  reports: number;
  targets?: number;
  firstseen?: string;
  lastseen?: string;
}

export async function fetchAttackerIps(): Promise<IocIndicator[]> {
  return cached('dshield', 60 * 60 * 1000, async () => {
    try {
      const res = await fetch(DSHIELD_SOURCES);
      if (!res.ok) return [];
      const data: DshieldSource[] = await res.json();
      return data
        .filter(s => s.source)
        .map(s => ({
          id: `dshield-${s.source}`,
          type: 'attacker-ip' as const,
          value: s.source,
          threat: 'Network attack source',
          source: 'DShield' as ThreatSource,
          firstSeen: s.firstseen,
          lastSeen: s.lastseen,
          confidence: 'high' as const,
          eventCount: s.reports,
        }));
    } catch (err) {
      console.error('[Thor] DShield fetch failed:', err);
      return [];
    }
  });
}

// ------------------------------------------------------------
// OpenPhish — phishing URLs
// ------------------------------------------------------------

export async function fetchPhishingUrls(limit = 40): Promise<IocIndicator[]> {
  return cached(`openphish-${limit}`, 30 * 60 * 1000, async () => {
    try {
      const res = await fetch(OPENPHISH_FEED);
      if (!res.ok) return [];
      const text = await res.text();
      return text
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.startsWith('http'))
        .slice(0, limit)
        .map((url, i) => ({
          id: `openphish-${i}`,
          type: 'phishing-url' as const,
          value: url,
          threat: 'Phishing URL',
          source: 'OpenPhish' as ThreatSource,
          confidence: 'high' as const,
        }));
    } catch (err) {
      console.error('[Thor] OpenPhish fetch failed:', err);
      return [];
    }
  });
}

// ------------------------------------------------------------
// HaveIBeenPwned — public breach catalog
// ------------------------------------------------------------

export async function fetchBreaches(): Promise<BreachRecord[]> {
  return cached('hibp', 6 * 60 * 60 * 1000, async () => {
    try {
      const res = await fetch(HIBP_API);
      if (!res.ok) return [];
      const data: Array<{
        Name: string; Title: string; Domain: string; BreachDate: string;
        AddedDate: string; PwnCount: number; Description: string;
        DataClasses: string[]; IsVerified?: boolean; IsSensitive?: boolean;
      }> = await res.json();

      return data
        .map(b => ({
          name: b.Name,
          title: b.Title,
          domain: b.Domain,
          breachDate: b.BreachDate,
          addedDate: b.AddedDate,
          pwnCount: b.PwnCount,
          description: b.Description.replace(/<[^>]*>/g, ''),
          dataClasses: b.DataClasses || [],
          isVerified: b.IsVerified ?? false,
          isSensitive: b.IsSensitive ?? false,
        }))
        .sort((a, b) => new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime());
    } catch (err) {
      console.error('[Thor] HIBP fetch failed:', err);
      return [];
    }
  });
}

// ------------------------------------------------------------
// Geolocation (ipwho.is) — persisted in localStorage
// ------------------------------------------------------------

interface GeoEntry {
  country?: string;
  countryName?: string;
  city?: string;
  coordinates?: [number, number];
  asn?: string;
  fetchedAt: number;
}

function loadGeoCache(): Record<string, GeoEntry> {
  try {
    return JSON.parse(localStorage.getItem(GEO_CACHE_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveGeoCache(c: Record<string, GeoEntry>) {
  try {
    localStorage.setItem(GEO_CACHE_KEY, JSON.stringify(c));
  } catch { /* storage full/unavailable */ }
}

export async function geolocateIps(ips: string[]): Promise<Record<string, GeoEntry>> {
  const result: Record<string, GeoEntry> = {};
  const cacheData = loadGeoCache();
  const toFetch: string[] = [];

  for (const ip of ips) {
    const hit = cacheData[ip];
    if (hit && Date.now() - hit.fetchedAt < GEO_CACHE_TTL) {
      result[ip] = hit;
    } else {
      toFetch.push(ip);
    }
  }

  // ipwho.is free tier — small batches to stay rate-limit friendly
  const BATCH = 10;
  for (let i = 0; i < toFetch.length; i += BATCH) {
    const batch = toFetch.slice(i, i + BATCH);
    const settled = await Promise.allSettled(
      batch.map(async ip => {
        const res = await fetch(`${GEO_API}/${ip}`);
        if (!res.ok) throw new Error(`geo failed for ${ip}`);
        const data = await res.json();
        if (data.success === false || !data.latitude || !data.longitude) {
          throw new Error(`no geo data for ${ip}`);
        }
        return {
          ip,
          geo: {
            country: data.country_code,
            countryName: data.country,
            city: data.city,
            coordinates: [data.longitude, data.latitude] as [number, number],
            asn: data.connection?.asn ? `AS${data.connection.asn}` : undefined,
            fetchedAt: Date.now(),
          } as GeoEntry,
        };
      })
    );

    for (const s of settled) {
      if (s.status === 'fulfilled') {
        result[s.value.ip] = s.value.geo;
        cacheData[s.value.ip] = s.value.geo;
      }
    }
  }

  saveGeoCache(cacheData);
  return result;
}

// ------------------------------------------------------------
// Map event assembly — the unified ThreatEvent list
// ------------------------------------------------------------

function cvssToAlert(score: number): 'green' | 'yellow' | 'orange' | 'red' {
  return alertFromSeverity(cvssToSeverity(score));
}

export interface ThreatFeedResult {
  events: ThreatEvent[];
  cves: CveRecord[];
  kev: KevEntry[];
  iocs: IocIndicator[];
  breaches: BreachRecord[];
}

export async function fetchThreatFeeds(): Promise<ThreatFeedResult> {
  const [cves, kev, c2Ips, attackerIps, phishing, breaches] = await Promise.all([
    fetchRecentCves(3, 150),
    fetchKevEntries(),
    fetchC2Ips(),
    fetchAttackerIps(),
    fetchPhishingUrls(40),
    fetchBreaches(),
  ]);

  const iocs = [...c2Ips, ...attackerIps, ...phishing];

  // Geolocate all IP-based IOCs
  const ipList = [...new Set(iocs.filter(i => i.type !== 'phishing-url').map(i => i.value))];
  const geoMap = await geolocateIps(ipList).catch(() => ({} as Record<string, GeoEntry>));

  const events: ThreatEvent[] = [];

  // KEV → map events (rich: ransomware use, due date)
  const now = Date.now();
  for (const k of kev.slice(0, 120)) {
    const ageDays = (now - new Date(k.dateAdded).getTime()) / 86400000;
    const sev: SeverityLevel =
      ageDays <= 30 ? 'critical' :
      ageDays <= 90 ? 'high' :
      'medium';
    const threatCategory: ThreatCategory = 'kev';
    events.push({
      id: `kev-${k.cveID}`,
      category: threatCategory,
      title: `${k.cveID} — ${k.vendorProject} ${k.product}`,
      description: k.shortDescription,
      // KEV has no geo — spread across reference positions near vendor-neutral map slots
      coordinates: [
        ((k.cveID.split('').reduce((a, ch) => a + ch.charCodeAt(0), 0) % 340) - 170),
        ((k.cveID.split('').reduce((a, ch) => a + ch.charCodeAt(1) || 7, 0) % 120) - 60),
      ],
      date: k.dateAdded,
      severity: sev,
      alertLevel: alertFromSeverity(sev),
      source: 'CISA-KEV',
      sourceUrl: `https://nvd.nist.gov/vuln/detail/${k.cveID}`,
      magnitudeLabel: k.knownRansomwareCampaignUse === 'Known' ? 'RANSOMWARE' : 'KEV',
      eventCount: Math.round(ageDays),
    });
  }

  // IP-based IOCs → map events
  for (const ioc of iocs) {
    if (ioc.type === 'phishing-url') continue;
    const geo = geoMap[ioc.value];
    if (!geo?.coordinates) continue;
    const category: ThreatCategory = ioc.type === 'c2-ip' ? 'maliciousIp' : 'maliciousIp';
    const isC2 = ioc.type === 'c2-ip';
    const sev: SeverityLevel = isC2 ? 'critical' : 'high';
    events.push({
      id: ioc.id,
      category,
      title: isC2 ? `${ioc.value} — ${ioc.threat} C2` : `${ioc.value} — attack source`,
      description: isC2
        ? `Active command-and-control server for ${ioc.threat}.`
        : `${ioc.source} top attacking host (${ioc.eventCount ?? '?'} attacks logged).`,
      coordinates: geo.coordinates,
      date: ioc.lastSeen || new Date().toISOString(),
      severity: sev,
      alertLevel: alertFromSeverity(sev),
      source: ioc.source,
      magnitudeLabel: isC2 ? ioc.threat : `${ioc.eventCount ?? 0} attacks`,
      country: geo.country,
      countryName: geo.countryName,
      city: geo.city,
      asn: geo.asn,
      eventCount: ioc.eventCount,
    });
  }

  // Attach geo to IOC objects for the intel page
  for (const ioc of iocs) {
    if (ioc.type === 'phishing-url') continue;
    const geo = geoMap[ioc.value];
    if (geo) {
      ioc.country = geo.country;
      ioc.countryName = geo.countryName;
      ioc.city = geo.city;
      ioc.coordinates = geo.coordinates;
    }
  }

  // Recent critical/high CVEs → map markers scattered deterministically per-CVE
  for (const cve of cves.filter(c => c.severity === 'critical' || c.severity === 'high').slice(0, 60)) {
    const hash = cve.id.split('').reduce((a, ch) => a * 31 + ch.charCodeAt(0), 7);
    const lon = (Math.abs(hash) % 340) - 170;
    const lat = (Math.abs(hash >> 3) % 120) - 60;
    events.push({
      id: `cve-${cve.id}`,
      category: 'kev',
      title: `${cve.id} — CVSS ${cve.cvssScore.toFixed(1)}`,
      description: cve.description.slice(0, 240),
      coordinates: [lon, lat],
      date: cve.published,
      severity: cve.severity,
      alertLevel: cvssToAlert(cve.cvssScore),
      source: 'NVD',
      sourceUrl: `https://nvd.nist.gov/vuln/detail/${cve.id}`,
      magnitudeLabel: `CVSS ${cve.cvssScore.toFixed(1)}`,
    });
  }

  // Sort newest first
  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return { events, cves, kev, iocs, breaches };
}
