# 🔌 API Reference

This document describes the feed layer in `src/services/api.ts` — the only
module that talks to the outside world. Everything else in the app consumes
the normalized results it returns.

## External data sources

All sources are free and require **no API keys**. CORS status verified
2026-09.

| Source | Feed URL | Data | Direct CORS | Cache |
|--------|----------|------|-------------|-------|
| [NIST NVD](https://nvd.nist.gov/) | `services.nvd.nist.gov/rest/json/cves/2.0` | CVEs published in the last 3 days | ✅ | 15 min (in-memory) |
| [CISA KEV](https://www.cisa.gov/known-exploited-vulnerabilities-catalog) | `cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json` | Actively exploited vulns (180-day window) | ❌ relay | 30 min |
| [abuse.ch Feodo Tracker](https://feodotracker.abuse.ch/) | `feodotracker.abuse.ch/downloads/ipblocklist.json` | Botnet C2 servers | ❌ relay | 30 min |
| [DShield / ISC](https://isc.sans.edu/) | `isc.sans.edu/api/topips/records/200?json` | Top attacking IPs + report counts | ✅ | 60 min |
| [OpenPhish](https://openphish.com/) | `raw.githubusercontent.com/openphish/public_feed/.../feed.txt` | Phishing URLs | ✅ | 30 min |
| [HaveIBeenPwned](https://haveibeenpwned.com/) | `haveibeenpwned.com/api/v3/breaches` | Public breach catalog | ✅ | 6 h |
| [ipwho.is](https://ipwho.is/) | `ipwho.is/{ip}` | IOC geolocation | ✅ | 7 days (localStorage) |

> ⚠️ The HIBP API is free for browser use but is designed for *per-breach*
> lookups; hammering the full catalog endpoint is not. Thor caches it
> aggressively (6 h) and only fetches it client-side, once per session, per
> browser.

## CORS relay

Two feeds (CISA KEV, Feodo) don't send `access-control-allow-origin` headers,
so browsers block direct fetches. Thor routes those through a public read
relay (`r.jina.ai`) via `relayFetch()`, which:

1. Tries the relay first and strips the relay's metadata prefix (the feed JSON
   is sliced from the first `{` or `[`).
2. Validates the parsed shape with a caller-supplied predicate.
3. Falls back to a direct fetch if the relay fails (covers future CORS-policy
   changes).
4. Returns `null` if both paths fail — the feed then reports `error` in
   `feedStatus`.

## Public API

All functions return `Promise<T[]>`. On failure they resolve to `[]` (empty
feed) rather than rejecting, with the exception of `fetchThreatFeeds`, which
also reports per-feed status.

### `fetchThreatFeeds(): Promise<ThreatFeedResult>`

The orchestrator. Fetches all six feeds in parallel, geolocates IP-based IOCs,
and assembles the unified map-event list.

```ts
interface ThreatFeedResult {
  events: ThreatEvent[];       // unified map events (KEV + IPs + critical CVEs)
  cves: CveRecord[];           // normalized NVD records
  kev: KevEntry[];             // normalized KEV entries (≤180 days old)
  iocs: IocIndicator[];        // C2 IPs + attacker IPs + phishing URLs (geo-attached)
  breaches: BreachRecord[];    // HIBP breach catalog
  feedStatus: FeedStatusMap;   // { nvd|kev|feodo|dshield|openphish|hibp: 'ok'|'error' }
}
```

Event assembly rules:

- **KEV entries** (top 120) → severity derived from age (`≤30d` critical,
  `≤90d` high, else medium); coordinates from a deterministic per-CVE hash
  scatter; `approxLocation: true`.
- **C2 IPs** → `critical` severity, real coordinates from geolocation.
- **Attacker IPs** → `high` severity, `eventCount` = DShield report count.
- **Phishing URLs** → never map events; they live in the Intel page table only.
- **Critical/high CVEs** (top 60) → hash-scattered "global pressure" markers,
  `magnitudeLabel` = `CVSS x.x`.

### `fetchRecentCves(days = 3, maxResults = 150): Promise<CveRecord[]>`

Queries the NVD 2.0 API for CVEs published in the last `days`, up to
`maxResults`. Cached in memory for 15 minutes.

### `normalizeNvdCve(item: NvdCveItem): CveRecord | null`

Converts one raw NVD item into a `CveRecord`:

- Prefers **CVSS v3.1**, then v3.0, then v2.
- Extracts the English description, vendors (from CPE criteria), CWE, and the
  first 5 reference URLs.
- Returns `null` when no CVSS metrics exist (the record is skipped).

### `fetchKevEntries(): Promise<KevEntry[]>`

Fetches the KEV catalog via `relayFetch`, keeps entries added in the last 180
days, sorts newest-first, and maps `knownRansomwareCampaignUse` to
`'Known' | 'Unknown'`.

### `fetchC2Ips(): Promise<IocIndicator[]>`

Feodo botnet C2 IP blocklist → `IocIndicator[]` with `type: 'c2-ip'` and
`confidence: 'high'`.

### `fetchAttackerIps(): Promise<IocIndicator[]>`

DShield top-200 attacking IPs → `IocIndicator[]` with `type: 'attacker-ip'`.
The response shape is validated (`isDshieldSourceArray`) before use; unexpected
payloads are skipped rather than rendered as garbage.

### `fetchPhishingUrls(limit = 40): Promise<IocIndicator[]>`

OpenPhish plain-text URL feed, first `limit` entries → `IocIndicator[]` with
`type: 'phishing-url'`.

### `fetchBreaches(): Promise<BreachRecord[]>`

HIBP v3 breach catalog → `BreachRecord[]`, sorted newest-added first, HTML
stripped from descriptions. Cached 6 hours.

### `geolocateIps(ips: string[]): Promise<Record<string, GeoEntry>>`

Cache-first geolocation through `ipwho.is`:

- 7-day `localStorage` cache (`thor_geo_cache_v1`, capped at 5,000 entries).
- Misses are fetched in **batches of 10** (`Promise.allSettled`) to stay
  rate-limit friendly.
- Returns `{ ip → { country, countryName, city, coordinates, asn } }`.

### `cvssToSeverity(score: number): SeverityLevel`

CVSS bands:

| Score | Severity |
|-------|----------|
| ≥ 9.0 | `critical` |
| 7.0–8.9 | `high` |
| 4.0–6.9 | `medium` |
| < 4.0 | `low` |

## Cache behavior

- **In-memory TTL cache** (`cached()`) per feed, keyed by parameters — repeated
  calls within the TTL return the same promise result without re-fetching.
- **Geo cache** in `localStorage` — survives reloads; stale entries (older than
  7 days) are re-fetched; the cache evicts oldest-first past 5,000 entries.

## Error handling contract

- Feed fetchers **never throw**; they return `[]` and log with a `[Thor]`
  prefix.
- `fetchThreatFeeds` tracks per-feed status so the UI can show a degraded-mode
  banner instead of silently rendering nothing.
- `relayFetch` validates parsed JSON with a caller-supplied predicate before
  trusting it.
