// ============================================================
// Thor — Cyber Threat Intelligence types
// ============================================================

// Threat categories used across map, filters, and styling
export type ThreatCategory =
  | 'kev'
  | 'maliciousIp'
  | 'phishing'
  | 'breach';

// Severity scale mirrors CVSS bands
export type SeverityLevel =
  | 'low'      // CVSS 0.1–3.9
  | 'medium'   // CVSS 4.0–6.9
  | 'high'     // CVSS 7.0–8.9
  | 'critical'; // CVSS 9.0–10

export type AlertLevel = 'green' | 'yellow' | 'orange' | 'red';

export type ThreatSource =
  | 'NVD'
  | 'CISA-KEV'
  | 'Feodo'
  | 'DShield'
  | 'OpenPhish'
  | 'HIBP'
  | 'ISC';

// Connectivity status per configured feed, keyed by feed id (nvd, kev, feodo,
// dshield, openphish, hibp). 'ok' = data returned, 'error' = fetch/parse failed.
export type FeedStatusMap = Record<string, 'ok' | 'error'>;

// ------------------------------------------------------------
// CVE vulnerability (NVD)
// ------------------------------------------------------------
export interface CveRecord {
  id: string;               // CVE-YYYY-NNNNN
  title: string;
  description: string;
  published: string;        // ISO date
  lastModified: string;
  cvssScore: number;        // 0–10, base score (v3.1 preferred)
  cvssVector: string;
  severity: SeverityLevel;
  attackVector?: string;    // NETWORK / ADJACENT / LOCAL / PHYSICAL
  exploitAvailable?: boolean;
  cisaExploitPoc?: boolean;
  references: string[];     // URLs
  vendors: string[];        // affected vendors/products
  cwe?: string;
  sourceIdentifier?: string;
}

// ------------------------------------------------------------
// CISA Known Exploited Vulnerability
// ------------------------------------------------------------
export interface KevEntry {
  cveID: string;
  vendorProject: string;
  product: string;
  vulnerabilityName: string;
  dateAdded: string;
  shortDescription: string;
  requiredAction: string;
  dueDate: string;
  knownRansomwareCampaignUse: 'Known' | 'Unknown';
  notes?: string;
  cwes?: string[];
}

// ------------------------------------------------------------
// Indicator of compromise
// ------------------------------------------------------------
export type IocType = 'c2-ip' | 'phishing-url' | 'attacker-ip';

export interface IocIndicator {
  id: string;
  type: IocType;
  value: string;            // IP or URL
  threat: string;           // malware family / campaign label
  source: ThreatSource;
  country?: string;         // ISO code
  countryName?: string;
  city?: string;
  coordinates?: [number, number]; // [lon, lat] once geolocated
  firstSeen?: string;
  lastSeen?: string;
  confidence: 'low' | 'medium' | 'high';
  eventCount?: number;         // attack count (DShield)
}

// ------------------------------------------------------------
// Map event — union of geo-tagged threats
// ------------------------------------------------------------
export interface ThreatEvent {
  id: string;
  category: ThreatCategory;
  title: string;
  description: string;
  coordinates: [number, number]; // [lon, lat]
  date: string;                  // ISO
  severity: SeverityLevel;
  alertLevel: AlertLevel;
  source: ThreatSource;
  sourceUrl?: string;
  // Optional enrichments
  country?: string;
  countryName?: string;
  city?: string;
  cvssScore?: number;
  magnitudeLabel?: string;       // e.g. "CVSS 9.8" or malware family
  asn?: string;
  eventCount?: number;           // e.g. attack count for DShield
  // True when coordinates are a deterministic hash-scatter (KEV/CVE entries have
  // no real geolocation) rather than an observed location.
  approxLocation?: boolean;
}

// ------------------------------------------------------------
// Breach (HIBP)
// ------------------------------------------------------------
export interface BreachRecord {
  name: string;
  title: string;
  domain: string;
  breachDate: string;
  addedDate: string;
  pwnCount: number;
  description: string;
  dataClasses: string[];
  isVerified: boolean;
  isSensitive: boolean;
}

// ------------------------------------------------------------
// Filters & UI state
// ------------------------------------------------------------
export interface FilterState {
  kev: boolean;
  maliciousIp: boolean;
  phishing: boolean;
  breach: boolean;
}

export interface CategoryInfo {
  id: ThreatCategory;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

// ------------------------------------------------------------
// Raw API response shapes (NVD 2.0, KEV, Feodo)
// ------------------------------------------------------------
export interface NvdCveItem {
  cve: {
    id: string;
    sourceIdentifier?: string;
    published: string;
    lastModified: string;
    descriptions: Array<{ lang: string; value: string }>;
    metrics?: {
      cvssMetricV31?: Array<{
        cvssData: { baseScore: number; baseSeverity: string; vectorString: string; attackVector?: string };
        source?: string;
      }>;
      cvssMetricV30?: Array<{
        cvssData: { baseScore: number; baseSeverity: string; vectorString: string; attackVector?: string };
      }>;
      cvssMetricV2?: Array<{
        cvssData: { baseScore: number; vectorString: string };
        baseSeverity?: string;
      }>;
    };
    references?: Array<{ url: string }>;
    weaknesses?: Array<{ description: Array<{ value: string }> }>;
    configurations?: Array<{
      nodes?: Array<{
        cpeMatch?: Array<{ criteria: string }>;
      }>;
    }>;
  };
}

export interface KevCatalog {
  title: string;
  catalogVersion: string;
  dateReleased: string;
  count: number;
  vulnerabilities: Array<{
    cveID: string;
    vendorProject: string;
    product: string;
    vulnerabilityName: string;
    dateAdded: string;
    shortDescription: string;
    requiredAction: string;
    dueDate: string;
    knownRansomwareCampaignUse?: string;
    notes?: string;
    cwes?: Array<{ cweID: string }>;
  }>;
}

export interface FeodoEntry {
  ip_address: string;
  port: number;
  status: string;
  hostname?: string | null;
  as_number?: number;
  as_name?: string;
  country: string;
  first_seen?: string;
  last_online?: string;
  malware: string;
}
