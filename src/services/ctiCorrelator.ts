/**
 * Derives campaigns, threat actors, and malware families from IoC tags
 * and temporal clustering. Pure function — no state, no side effects.
 */
import type { IoC, IoCType, ThreatActor, Campaign, MalwareFamily, ThreatLevel } from '../types/cti';

const THREAT_ORDER: ThreatLevel[] = ['unknown', 'low', 'medium', 'high', 'critical'];

function maxThreat(a: ThreatLevel, b: ThreatLevel): ThreatLevel {
  return THREAT_ORDER.indexOf(a) >= THREAT_ORDER.indexOf(b) ? a : b;
}

/** Known malware families mapped to common tags */
const MALWARE_FAMILY_MAP: Record<string, { name: string; aliases: string[]; platforms: string[]; capabilities: string[] }> = {
  emotet: { name: 'Emotet', aliases: ['Emotet', 'EpochRat'], platforms: ['Windows'], capabilities: ['loader', 'banking-trojan', 'spam'] },
  trickbot: { name: 'TrickBot', aliases: ['TrickBot', 'TrickBot Loader'], platforms: ['Windows'], capabilities: ['loader', 'banking-trojan', 'ransomware-deployer'] },
  qakbot: { name: 'QakBot', aliases: ['QakBot', 'QBot', 'Quakbot'], platforms: ['Windows'], capabilities: ['loader', 'credential-theft'] },
  cobalt: { name: 'Cobalt Strike', aliases: ['Cobalt Strike', 'CS Beacon'], platforms: ['Windows', 'Linux'], capabilities: ['c2', 'lateral-movement', 'privilege-escalation'] },
  qbot: { name: 'QakBot', aliases: ['QBot', 'QakBot'], platforms: ['Windows'], capabilities: ['loader', 'credential-theft'] },
  solarmarker: { name: 'SolarMarker', aliases: ['SolarMarker', 'SolarMarker RAT'], platforms: ['Windows'], capabilities: ['info-stealer'] },
  dridex: { name: 'Dridex', aliases: ['Dridex', 'Bugat'], platforms: ['Windows'], capabilities: ['banking-trojan'] },
  icedid: { name: 'IcedID', aliases: ['IcedID', 'BokBot'], platforms: ['Windows'], capabilities: ['loader', 'banking-trojan'] },
  formbook: { name: 'FormBook', aliases: ['FormBook', 'XLoader'], platforms: ['Windows'], capabilities: ['info-stealer'] },
  medusa: { name: 'Medusa', aliases: ['Medusa', 'MedusaLocker'], platforms: ['Windows'], capabilities: ['ransomware'] },
};

/** Known threat actor → malware/tag associations */
const ACTOR_KNOWLEDGE: Record<string, { name: string; aliases: string[]; malware: string[]; techniques: string[]; motivation: string }> = {
  'lazarus': { name: 'Lazarus Group', aliases: ['Hidden Cobra', 'Zinc'], malware: ['cobalt'], techniques: ['T1566', 'T1059', 'T1071'], motivation: 'financial-gain' },
  'apt28': { name: 'APT28', aliases: ['Fancy Bear', 'Sofacy'], malware: ['cobalt'], techniques: ['T1566', 'T1078', 'T1053'], motivation: 'espionage' },
  'apt29': { name: 'APT29', aliases: ['Cozy Bear', 'The Dukes'], malware: [], techniques: ['T1199', 'T1078'], motivation: 'espionage' },
  'fin7': { name: 'FIN7', aliases: ['Carbanak', 'Navigator Group'], malware: ['cobalt', 'dridex'], techniques: ['T1566', 'T1059', 'T1105'], motivation: 'financial-gain' },
  'ta505': { name: 'TA505', aliases: ['Hive0065'], malware: ['qakbot', 'trickbot'], techniques: ['T1566', 'T1204', 'T1059'], motivation: 'financial-gain' },
};

function deriveMalwareFamilies(iocs: IoC[]): MalwareFamily[] {
  const familyMap = new Map<string, { iocs: IoC[]; tags: Set<string> }>();

  for (const ioc of iocs) {
    const normalizedTags = ioc.tags.map(t => t.toLowerCase().trim());

    for (const [key, family] of Object.entries(MALWARE_FAMILY_MAP)) {
      const matches = normalizedTags.some(t => t === key || family.aliases.some(a => t.includes(a.toLowerCase())));
      if (matches) {
        const existing = familyMap.get(key);
        if (existing) {
          existing.iocs.push(ioc);
          ioc.tags.forEach(t => existing.tags.add(t));
        } else {
          familyMap.set(key, { iocs: [ioc], tags: new Set(ioc.tags) });
        }
      }
    }
  }

  return Array.from(familyMap.entries()).map(([key, data]) => {
    const family = MALWARE_FAMILY_MAP[key];
    const iocDates = data.iocs
      .flatMap(i => [new Date(i.firstSeen).getTime(), new Date(i.lastSeen).getTime()])
      .filter(t => !isNaN(t));
    return {
      id: `malware-${key}`,
      name: family.name,
      aliases: family.aliases,
      description: `Malware family tracked across ${data.iocs.length} IoCs`,
      firstSeen: new Date(Math.min(...iocDates)).toISOString(),
      lastSeen: new Date(Math.max(...iocDates)).toISOString(),
      platforms: family.platforms,
      capabilities: family.capabilities,
      families: [family.name],
      tags: Array.from(data.tags),
    };
  });
}

function deriveThreatActors(iocs: IoC[], malwareFamilies: MalwareFamily[]): ThreatActor[] {
  const actorMap = new Map<string, { iocs: IoC[]; tags: Set<string>; known: typeof ACTOR_KNOWLEDGE[keyof typeof ACTOR_KNOWLEDGE] | null }>();

  // First pass: match known actors
  for (const ioc of iocs) {
    const normalizedTags = ioc.tags.map(t => t.toLowerCase().trim());

    for (const [key, known] of Object.entries(ACTOR_KNOWLEDGE)) {
      const matches = normalizedTags.some(t =>
        t.includes(key) || known.aliases.some(a => t.includes(a.toLowerCase()))
      );
      if (matches) {
        const existing = actorMap.get(key);
        if (existing) {
          existing.iocs.push(ioc);
          ioc.tags.forEach(t => existing.tags.add(t));
        } else {
          actorMap.set(key, { iocs: [ioc], tags: new Set(ioc.tags), known });
        }
      }
    }
  }

  // Derive implicit actors from botnet/C2 clusters that share infrastructure
  const c2Iocs = iocs.filter(i =>
    i.tags.some(t => t.toLowerCase().includes('c&c') || t.toLowerCase().includes('cnc'))
  );

  if (c2Iocs.length > 5 && actorMap.size === 0) {
    // No known actors — create implicit from malware families
    for (const malware of malwareFamilies.slice(0, 5)) {
      const key = malware.name.toLowerCase().replace(/\s+/g, '-');
      const keyIocs = c2Iocs.filter(i =>
        i.tags.some(t => malware.aliases.some(a => t.toLowerCase().includes(a.toLowerCase())))
      );
      if (keyIocs.length >= 2) {
        actorMap.set(key, {
          iocs: keyIocs,
          tags: new Set(keyIocs.flatMap(i => i.tags)),
          known: null,
        });
      }
    }
  }

  return Array.from(actorMap.entries()).map(([key, data]) => {
    const known = data.known;
    const iocDates = data.iocs
      .flatMap(i => [new Date(i.firstSeen).getTime(), new Date(i.lastSeen).getTime()])
      .filter(t => !isNaN(t));

    const relatedMalware = malwareFamilies
      .filter(mf => known?.malware.some(m => mf.name.toLowerCase().includes(m)) ||
        data.tags.has(mf.name.toLowerCase()))
      .map(mf => mf.name);

    return {
      id: `actor-${key}`,
      name: known?.name || key.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      aliases: known?.aliases || [],
      description: known
        ? `Threat actor associated with ${relatedMalware.join(', ') || 'multiple IoCs'}`
        : `Implicit actor cluster with ${data.iocs.length} IoCs`,
      motivation: known?.motivation,
      sophistication: known ? 'advanced' : 'unknown',
      firstSeen: new Date(Math.min(...iocDates)).toISOString(),
      lastSeen: new Date(Math.max(...iocDates)).toISOString(),
      campaigns: [],
      malware: relatedMalware,
      techniques: known?.techniques || [],
      countries: [...new Set(data.iocs.map(i => i.geo?.country).filter(Boolean) as string[])],
      tags: Array.from(data.tags).slice(0, 20),
    };
  });
}

function deriveCampaigns(iocs: IoC[], actors: ThreatActor[], malwareFamilies: MalwareFamily[]): Campaign[] {
  const DAY = 86400000;
  const WINDOW = 30 * DAY; // 30-day clustering window

  // Group IoCs into temporal clusters by shared tags
  const clusters = new Map<string, IoC[]>();

  for (const ioc of iocs) {
    const iocTime = new Date(ioc.lastSeen).getTime();
    const key = ioc.tags
      .filter(t => !['scanner', 'brute-force', 'attack', 'noise', 'riot'].includes(t.toLowerCase()))
      .sort()
      .join('|');

    if (!key) continue;

    const existing = clusters.get(key);
    if (existing) {
      const hasOverlap = existing.some(e =>
        Math.abs(new Date(e.lastSeen).getTime() - iocTime) < WINDOW
      );
      if (hasOverlap) {
        existing.push(ioc);
      } else {
        clusters.set(`${key}-${ioc.id}`, [ioc]);
      }
    } else {
      clusters.set(key, [ioc]);
    }
  }

  // Convert clusters with ≥3 IoCs into campaigns
  const campaigns: Campaign[] = [];
  for (const [tagKey, clusterIocs] of clusters) {
    if (clusterIocs.length < 3) continue;

    const dates = clusterIocs
      .flatMap(i => [new Date(i.firstSeen).getTime(), new Date(i.lastSeen).getTime()])
      .filter(t => !isNaN(t));

    if (dates.length === 0) continue;

    const threats = clusterIocs.map(i => i.threatLevel);
    let overallThreat = 'unknown' as ThreatLevel;
    for (const t of threats) {
      overallThreat = maxThreat(overallThreat, t);
    }

    const malware = [...new Set(
      clusterIocs.flatMap(i => i.tags)
        .filter(t => malwareFamilies.some(mf => mf.aliases.some(a => t.toLowerCase().includes(a.toLowerCase()))))
    )].slice(0, 5);

    const actorMatches = actors
      .filter(a =>
        a.tags.some(t => clusterIocs.some(ci => ci.tags.includes(t))) ||
        clusterIocs.some(ci => ci.tags.some(t =>
          a.aliases.some(al => t.toLowerCase().includes(al.toLowerCase())) ||
          t.toLowerCase().includes(a.name.toLowerCase())
        ))
      )
      .map(a => a.id);

    const status = overallThreat === 'critical' || overallThreat === 'high' ? 'active' : 'unknown';
    const dateStr = (d: number) => new Date(d).toISOString();

    campaigns.push({
      id: `campaign-${tagKey.slice(0, 40).replace(/[^a-zA-Z0-9]/g, '-')}`,
      name: malware.length > 0
        ? `${malware[0]} Campaign`
        : tagKey.split('|').filter(Boolean).slice(0, 3).join(' / '),
      description: `Campaign involving ${clusterIocs.length} IoCs across ${[...new Set(clusterIocs.map(i => i.sourceFeed))].length} feeds`,
      firstSeen: dateStr(Math.min(...dates)),
      lastSeen: dateStr(Math.max(...dates)),
      actors: actorMatches,
      malware,
      techniques: [...new Set(clusterIocs.flatMap(i => i.tags).filter(t => t.startsWith('T')))],
      targets: [...new Set(clusterIocs.map(i => i.geo?.country).filter(Boolean) as string[])],
      tags: [...new Set(clusterIocs.flatMap(i => i.tags))].slice(0, 20),
      status: status as 'active' | 'inactive' | 'unknown',
    });
  }

  // Sort by lastSeen descending
  campaigns.sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime());

  return campaigns;
}

export interface CTICorrelationResult {
  actors: ThreatActor[];
  campaigns: Campaign[];
  malwareFamilies: MalwareFamily[];
  crossFeedClusters: CrossFeedCluster[];
  temporalClusters: TemporalCluster[];
}

/**
 * Cluster IoCs that appear in 2+ feeds (cross-feed correlation).
 */
export interface CrossFeedCluster {
  id: string;
  value: string;
  type: IoCType;
  feeds: string[];
  threatLevel: ThreatLevel;
  iocs: IoC[];
}

/**
 * Cluster IoCs that share tags AND appear within a tight time window (7 days).
 */
export interface TemporalCluster {
  id: string;
  label: string;
  iocs: IoC[];
  timeSpanDays: number;
  threatLevel: ThreatLevel;
  tags: string[];
}

function deriveCrossFeedClusters(iocs: IoC[]): CrossFeedCluster[] {
  const feedMap = new Map<string, Map<string, IoC[]>>(); // type → value → iocs[]

  for (const ioc of iocs) {
    const byValue = feedMap.get(ioc.type) || new Map();
    const existing = byValue.get(ioc.value) || [];
    existing.push(ioc);
    byValue.set(ioc.value, existing);
    feedMap.set(ioc.type, byValue);
  }

  const clusters: CrossFeedCluster[] = [];

  for (const byValue of feedMap.values()) {
    for (const [value, clusterIocs] of byValue) {
      const feedSet = new Set(clusterIocs.map(i => i.sourceFeed));
      if (feedSet.size < 2) continue;

      let threat = 'unknown' as ThreatLevel;
      for (const ioc of clusterIocs) {
        threat = maxThreat(threat, ioc.threatLevel);
      }

      clusters.push({
        id: `crossfeed-${value.slice(0, 30).replace(/[^a-zA-Z0-9]/g, '-')}`,
        value,
        type: clusterIocs[0].type,
        feeds: [...feedSet],
        threatLevel: threat,
        iocs: clusterIocs,
      });
    }
  }

  clusters.sort((a, b) => b.iocs.length - a.iocs.length);
  return clusters;
}

function deriveTemporalClusters(iocs: IoC[]): TemporalCluster[] {
  const DAY = 86_400_000;
  const WINDOW = 7 * DAY;

  // Build tag → sorted IoC list
  const tagGroups = new Map<string, IoC[]>();
  for (const ioc of iocs) {
    const filtered = ioc.tags.filter(
      t => !['scanner', 'brute-force', 'attack', 'noise', 'riot', 'online'].includes(t.toLowerCase())
        && !t.startsWith('T')
    );
    for (const tag of filtered) {
      const existing = tagGroups.get(tag) || [];
      existing.push(ioc);
      tagGroups.set(tag, existing);
    }
  }

  const clusters: TemporalCluster[] = [];

  for (const [tag, tagIocs] of tagGroups) {
    if (tagIocs.length < 3) continue;

    const sorted = [...tagIocs].sort(
      (a, b) => new Date(a.lastSeen).getTime() - new Date(b.lastSeen).getTime()
    );

    // Sliding window clustering
    let current: IoC[] = [sorted[0]];
    for (let i = 1; i < sorted.length; i++) {
      const prevTime = new Date(current[current.length - 1].lastSeen).getTime();
      const currTime = new Date(sorted[i].lastSeen).getTime();
      if (currTime - prevTime < WINDOW) {
        current.push(sorted[i]);
      } else {
        if (current.length >= 3) {
          const dates = current.map(i => new Date(i.lastSeen).getTime());
          let threat = 'unknown' as ThreatLevel;
          for (const ioc of current) threat = maxThreat(threat, ioc.threatLevel);

          clusters.push({
            id: `temp-${tag.slice(0, 20).replace(/[^a-zA-Z0-9]/g, '-')}-${current[0].id.slice(-6)}`,
            label: tag,
            iocs: current,
            timeSpanDays: Math.round((Math.max(...dates) - Math.min(...dates)) / DAY),
            threatLevel: threat,
            tags: [...new Set(current.flatMap(i => i.tags))].slice(0, 10),
          });
        }
        current = [sorted[i]];
      }
    }
    // Final window
    if (current.length >= 3) {
      const dates = current.map(i => new Date(i.lastSeen).getTime());
      let threat = 'unknown' as ThreatLevel;
      for (const ioc of current) threat = maxThreat(threat, ioc.threatLevel);

      clusters.push({
        id: `temp-${tag.slice(0, 20).replace(/[^a-zA-Z0-9]/g, '-')}-${current[0].id.slice(-6)}`,
        label: tag,
        iocs: current,
        timeSpanDays: Math.round((Math.max(...dates) - Math.min(...dates)) / DAY),
        threatLevel: threat,
        tags: [...new Set(current.flatMap(i => i.tags))].slice(0, 10),
      });
    }
  }

  clusters.sort((a, b) => b.iocs.length - a.iocs.length);
  return clusters;
}

export function correlateIoCs(iocs: IoC[]): CTICorrelationResult {
  const malwareFamilies = deriveMalwareFamilies(iocs);
  const actors = deriveThreatActors(iocs, malwareFamilies);
  const campaigns = deriveCampaigns(iocs, actors, malwareFamilies);
  const crossFeedClusters = deriveCrossFeedClusters(iocs);
  const temporalClusters = deriveTemporalClusters(iocs);

  return { actors, campaigns, malwareFamilies, crossFeedClusters, temporalClusters };
}
