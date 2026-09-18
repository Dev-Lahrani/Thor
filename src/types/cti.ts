// STIX 2.1 compatible CTI types

export type IoCType = 'ipv4' | 'ipv6' | 'domain' | 'url' | 'sha256' | 'sha1' | 'md5' | 'email';

export type ThreatLevel = 'unknown' | 'low' | 'medium' | 'high' | 'critical';
export type Confidence = 'none' | 'low' | 'medium' | 'high' | 'confirmed';
export type IoCStatus = 'active' | 'expired' | 'revoked' | 'unknown';

export interface IoC {
  id: string;
  type: IoCType;
  value: string;
  confidence: Confidence;
  threatLevel: ThreatLevel;
  status: IoCStatus;
  firstSeen: string;
  lastSeen: string;
  tags: string[];
  source: string;
  sourceFeed: string;
  geo?: GeoEnrichment;
  relatedIoCs?: string[];
  description?: string;
}

export interface GeoEnrichment {
  country?: string;
  countryCode?: string;
  city?: string;
  lat?: number;
  lon?: number;
  asn?: string;
  org?: string;
  isTor?: boolean;
  isVpn?: boolean;
}

export interface ThreatActor {
  id: string;
  name: string;
  aliases: string[];
  description: string;
  motivation?: string;
  sophistication?: string;
  resourceLevel?: string;
  firstSeen: string;
  lastSeen: string;
  campaigns: string[];
  malware: string[];
  techniques: string[];
  countries: string[];
  tags: string[];
}

export interface Campaign {
  id: string;
  name: string;
  description: string;
  firstSeen: string;
  lastSeen: string;
  actors: string[];
  malware: string[];
  techniques: string[];
  targets: string[];
  tags: string[];
  status: 'active' | 'inactive' | 'unknown';
}

export interface MalwareFamily {
  id: string;
  name: string;
  aliases: string[];
  description: string;
  firstSeen: string;
  lastSeen: string;
  platforms: string[];
  capabilities: string[];
  families: string[];
  tags: string[];
}

export interface FeedSource {
  id: string;
  name: string;
  url: string;
  format: 'csv' | 'json' | 'txt' | 'stix';
  updateIntervalMs: number;
  enabled: boolean;
  icon?: string;
  description?: string;
}

export interface FeedResult {
  source: string;
  iocs: IoC[];
  fetchedAt: string;
  error?: string;
  durationMs: number;
}

export interface CTIState {
  iocs: IoC[];
  actors: ThreatActor[];
  campaigns: Campaign[];
  malware: MalwareFamily[];
  feedSources: FeedSource[];
  feedResults: FeedResult[];
  lastRefresh: string | null;
  isLoading: boolean;
  error: string | null;
  stats: CTIStats;
}

export interface CTIStats {
  totalIoCs: number;
  byType: Record<IoCType, number>;
  byThreatLevel: Record<ThreatLevel, number>;
  bySource: Record<string, number>;
  activeFeeds: number;
  failedFeeds: number;
  lastUpdated: string | null;
}

export interface CTIFilterState {
  types: IoCType[];
  threatLevels: ThreatLevel[];
  sources: string[];
  searchQuery: string;
  dateRange?: { from: string; to: string };
}

export interface ThreatMapPoint {
  id: string;
  lat: number;
  lon: number;
  type: 'source' | 'target' | 'c2' | 'victim';
  threatLevel: ThreatLevel;
  label: string;
  iocCount: number;
}

export interface ThreatMapConnection {
  id: string;
  from: { lat: number; lon: number };
  to: { lat: number; lon: number };
  threatLevel: ThreatLevel;
  type: 'c2' | 'exfil' | 'lateral' | 'scan';
}
