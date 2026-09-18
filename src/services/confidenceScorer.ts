/**
 * Scores IoC confidence based on:
 *  - Feed cross-correlation (same IoC in multiple feeds = higher confidence)
 *  - Enrichment quality (has geo/ASN/org data = higher confidence)
 *  - Age decay (fresh IoCs score higher than stale ones)
 *  - Tag richness (more descriptive tags = higher confidence)
 *
 * Pure function — no state, no side effects.
 */
import type { IoC, Confidence } from '../types/cti';

const MS_PER_DAY = 86_400_000;
const FRESHNESS_HALF_LIFE_DAYS = 14;

interface ConfidenceFactors {
  feedCount: number;
  hasGeo: boolean;
  hasAsn: boolean;
  freshnessScore: number;
  tagRichness: number;
  baseConfidence: number;
}

const CONFIDENCE_LEVELS: Confidence[] = ['none', 'low', 'medium', 'high', 'confirmed'];

function levelToNumber(c: Confidence): number {
  return CONFIDENCE_LEVELS.indexOf(c);
}

function numberToLevel(n: number): Confidence {
  const clamped = Math.max(0, Math.min(CONFIDENCE_LEVELS.length - 1, Math.round(n)));
  return CONFIDENCE_LEVELS[clamped];
}

/**
 * Count how many distinct feeds report the same IoC value.
 */
export function countFeedSources(iocs: IoC[]): Map<string, Set<string>> {
  const feedMap = new Map<string, Set<string>>();
  for (const ioc of iocs) {
    const existing = feedMap.get(ioc.value);
    if (existing) {
      existing.add(ioc.sourceFeed);
    } else {
      feedMap.set(ioc.value, new Set([ioc.sourceFeed]));
    }
  }
  return feedMap;
}

/**
 * Compute freshness score (1.0 = just seen, approaches 0 over time).
 */
function freshnessScore(lastSeen: string): number {
  const ageMs = Date.now() - new Date(lastSeen).getTime();
  const ageDays = Math.max(0, ageMs / MS_PER_DAY);
  return Math.exp(-Math.LN2 * ageDays / FRESHNESS_HALF_LIFE_DAYS);
}

/**
 * Compute tag richness (0–1 scale, more unique tags = richer).
 * Heuristic: saturates around 6 tags.
 */
function tagRichness(tags: string[]): number {
  return Math.min(1, tags.length / 6);
}

/**
 * Compute confidence factors for a single IoC.
 */
export function computeFactors(ioc: IoC, feedCounts: Map<string, Set<string>>): ConfidenceFactors {
  const feedCount = feedCounts.get(ioc.value)?.size ?? 1;

  return {
    feedCount,
    hasGeo: Boolean(ioc.geo?.country),
    hasAsn: Boolean(ioc.geo?.asn),
    freshnessScore: freshnessScore(ioc.lastSeen),
    tagRichness: tagRichness(ioc.tags),
    baseConfidence: levelToNumber(ioc.confidence),
  };
}

/**
 * Compute a numeric score (0–4) from factors.
 *
 * Weights:
 *   base confidence  : 40%
 *   feed cross-match  : 25%
 *   enrichment quality: 15%
 *   freshness         : 12%
 *   tag richness      :  8%
 */
export function scoreIoC(ioc: IoC, feedCounts: Map<string, Set<string>>): number {
  const f = computeFactors(ioc, feedCounts);

  const feedScore = Math.min(1, (f.feedCount - 1) / 3); // 1 feed = 0, 4+ feeds = 1
  const enrichmentScore = (f.hasGeo ? 0.5 : 0) + (f.hasAsn ? 0.5 : 0);

  const weighted =
    f.baseConfidence * 0.40 +
    feedScore * 4 * 0.25 +
    enrichmentScore * 4 * 0.15 +
    f.freshnessScore * 4 * 0.12 +
    f.tagRichness * 4 * 0.08;

  return Math.round(weighted * 100) / 100; // 2 decimal places
}

/**
 * Map numeric score to confidence level.
 */
export function scoreToConfidence(score: number): Confidence {
  return numberToLevel(score);
}

/**
 * Score all IoCs and return enriched map.
 */
export function scoreAllIoCs(iocs: IoC[]): Map<string, { score: number; confidence: Confidence; feedCount: number }> {
  const feedCounts = countFeedSources(iocs);
  const result = new Map<string, { score: number; confidence: Confidence; feedCount: number }>();

  for (const ioc of iocs) {
    const score = scoreIoC(ioc, feedCounts);
    result.set(ioc.id, {
      score,
      confidence: scoreToConfidence(score),
      feedCount: feedCounts.get(ioc.value)?.size ?? 1,
    });
  }

  return result;
}
