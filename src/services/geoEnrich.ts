// Geo enrichment for IPs/domains using free IP geolocation APIs

import type { IoC, GeoEnrichment } from '../types/cti';

// Batch enrichment using ip-api.com (free, 45 req/min)
const IP_API_URL = 'http://ip-api.com/batch';

interface IPApiResponse {
  query: string;
  status: string;
  country?: string;
  countryCode?: string;
  city?: string;
  lat?: number;
  lon?: number;
  as?: string;
  org?: string;
  isp?: string;
}

const enrichmentCache = new Map<string, GeoEnrichment>();
const CACHE_TTL = 86400000; // 24h
const cacheTimestamps = new Map<string, number>();

export async function enrichIocs(iocs: IoC[], signal?: AbortSignal): Promise<IoC[]> {
  const ips = iocs
    .filter(ioc => ioc.type === 'ipv4' || ioc.type === 'ipv6')
    .filter(ioc => !ioc.geo);

  if (ips.length === 0) return iocs;

  // Filter out already-cached
  const now = Date.now();
  const toEnrich = ips.filter(ioc => {
    const cached = enrichmentCache.get(ioc.value);
    const ts = cacheTimestamps.get(ioc.value) || 0;
    return !cached || now - ts > CACHE_TTL;
  });

  if (toEnrich.length === 0) {
    // All cached
    return iocs.map(ioc => ({
      ...ioc,
      geo: ioc.geo || enrichmentCache.get(ioc.value),
    }));
  }

  // Batch request (max 100 per batch)
  const batches: string[][] = [];
  for (let i = 0; i < toEnrich.length; i += 100) {
    batches.push(toEnrich.slice(i, i + 100).map(ioc => ioc.value));
  }

  const results = new Map<string, GeoEnrichment>();

  for (const batch of batches) {
    try {
      const res = await fetch(IP_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batch),
        signal,
      });

      if (!res.ok) continue;

      const data: IPApiResponse[] = await res.json();

      for (const item of data) {
        if (item.status !== 'success') continue;

        const geo: GeoEnrichment = {
          country: item.country,
          countryCode: item.countryCode,
          city: item.city,
          lat: item.lat,
          lon: item.lon,
          asn: item.as,
          org: item.org || item.isp,
        };

        results.set(item.query, geo);
        enrichmentCache.set(item.query, geo);
        cacheTimestamps.set(item.query, Date.now());
      }
    } catch {
      // Silently fail — enrichment is best-effort
    }
  }

  // Merge back
  return iocs.map(ioc => ({
    ...ioc,
    geo: ioc.geo || enrichmentCache.get(ioc.value) || results.get(ioc.value),
  }));
}

export function getCachedGeo(ip: string): GeoEnrichment | undefined {
  return enrichmentCache.get(ip);
}

export function clearEnrichmentCache(): void {
  enrichmentCache.clear();
  cacheTimestamps.clear();
}
