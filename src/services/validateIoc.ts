// Validation & sanitization for untrusted IoC data.
//
// Everything in an IoC originates from third-party threat feeds fetched over
// the network. Parsers previously trusted the `value` field to match its
// declared `type`, and the detail drawer interpolates values into outbound
// URLs (VirusTotal / AbuseIPDB / Google). A malicious or compromised feed
// could inject arbitrary content into those URL contexts or mislabel values
// so they break downstream features (e.g. geo enrichment on non-IPs).
//
// These helpers give every IoC a shape guaranteed to be safe for the way the
// UI renders and re-uses it. enforceIocValidation() is the single pipeline
// hook — see feedManager.fetchAllFeeds().

import type { IoC, IoCType } from '../types/cti';

const IPV4_RE = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;

const IPV6_RE = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;

// Rough structural check: dot-separated labels, alphanumeric + hyphen,
// no leading/trailing hyphen per label, TLD >= 2 chars.
const DOMAIN_RE = /^(?=.{1,253}$)(?!-)[A-Za-z0-9-]{1,63}(?<!-)(\.(?!-)[A-Za-z0-9-]{1,63}(?<!-))*\.[A-Za-z]{2,}$/;

const HASH_RES: Record<string, RegExp> = {
  sha256: /^[a-fA-F0-9]{64}$/,
  sha1: /^[a-fA-F0-9]{40}$/,
  md5: /^[a-fA-F0-9]{32}$/,
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidIpv4(value: string): boolean {
  return IPV4_RE.test(value);
}

export function isValidIpv6(value: string): boolean {
  return IPV6_RE.test(value);
}

export function isValidDomain(value: string): boolean {
  return value.length <= 253 && DOMAIN_RE.test(value);
}

export function isValidHash(type: 'sha256' | 'sha1' | 'md5', value: string): boolean {
  return HASH_RES[type].test(value);
}

export function isValidEmail(value: string): boolean {
  return value.length <= 254 && EMAIL_RE.test(value);
}

/**
 * Structural validation of an IoC value against its declared type.
 * `url` is checked separately by sanitizeIocUrl (scheme allow-list).
 */
export function isWellFormedIoc(type: IoCType, value: string): boolean {
  switch (type) {
    case 'ipv4': return isValidIpv4(value);
    case 'ipv6': return isValidIpv6(value);
    case 'domain': return isValidDomain(value);
    case 'sha256': return isValidHash('sha256', value);
    case 'sha1': return isValidHash('sha1', value);
    case 'md5': return isValidHash('md5', value);
    case 'email': return isValidEmail(value);
    case 'url': return isValidHttpUrl(value);
    default: return false;
  }
}

function isValidHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

/** Max lengths — bounds any interpolated string that ends up in a URL. */
const VALUE_LIMITS: Record<IoCType, number> = {
  ipv4: 45, ipv6: 45, domain: 253, url: 2048,
  sha256: 64, sha1: 40, md5: 32, email: 254,
};

/**
 * Ensure an outbound link built from user/feed-visible data can only ever be
 * an http(s) URL. Used for every <a href> derived from IoC values.
 */
export function sanitizeIocUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
    return u.toString();
  } catch {
    return null;
  }
}

/**
 * Return a corrected IoC value for the given type, or null if unusable.
 * Minor mislabels are demoted to a safer type rather than dropped
 * (e.g. `url`-typed bare domains become `domain`); anything that does not
 * parse as its declared type is rejected.
 */
function sanitizeValue(type: IoCType, rawValue: string): { type: IoCType; value: string } | null {
  const value = rawValue.trim();

  if (!value || value.length > VALUE_LIMITS[type]) {
    // Over-limit strings are truncated to nothing — never pass them on.
    if (value.length > VALUE_LIMITS[type]) return null;
    return null;
  }

  // Control characters and Unicode direction overrides have no business in
  // an indicator value and can be used to spoof display contexts.
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f\u200e\u200f\u202a-\u202e]/.test(value)) return null;

  if (isWellFormedIoc(type, value)) return { type, value };

  // Demotions for common feed mislabels.
  if (type === 'url' && isValidDomain(value)) return { type: 'domain', value };
  if (type === 'domain' && isValidIpv4(value)) return { type: 'ipv4', value };
  if (type === 'url' || type === 'email') {
    // Try to recover a bare hash/domain that was mislabeled.
    for (const t of ['sha256', 'sha1', 'md5'] as const) {
      if (isValidHash(t, value)) return { type: t, value };
    }
    if (isValidDomain(value)) return { type: 'domain', value };
    if (isValidIpv4(value)) return { type: 'ipv4', value };
  }

  return null;
}

/**
 * Pipeline filter: validates every IoC from every feed. Run right after
 * parsing, before dedup/correlation/rendering. Invalid entries are dropped;
 * count is left to the caller via the stats callback if needed.
 */
export function enforceIocValidation(iocs: IoC[]): IoC[] {
  const out: IoC[] = [];
  for (const ioc of iocs) {
    const fixed = sanitizeValue(ioc.type, ioc.value);
    if (!fixed) continue;
    if (fixed.type === ioc.type && fixed.value === ioc.value) {
      out.push(ioc);
    } else {
      out.push({ ...ioc, type: fixed.type, value: fixed.value });
    }
  }
  return out;
}
