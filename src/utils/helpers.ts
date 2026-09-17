import type { CategoryInfo, ThreatCategory, SeverityLevel, AlertLevel } from '../types';

// ------------------------------------------------------------
// Category styling — KEV red, malicious IP orange, phishing pink, breach purple
// ------------------------------------------------------------
export const CATEGORY_INFO: Record<ThreatCategory, CategoryInfo> = {
  kev: {
    id: 'kev',
    label: 'KEV Exploits',
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: 'rgba(239, 68, 68, 0.5)',
  },
  maliciousIp: {
    id: 'maliciousIp',
    label: 'Malicious IPs',
    color: '#f97316',
    bgColor: 'rgba(249, 115, 22, 0.2)',
    borderColor: 'rgba(249, 115, 22, 0.5)',
  },
  phishing: {
    id: 'phishing',
    label: 'Phishing',
    color: '#ec4899',
    bgColor: 'rgba(236, 72, 153, 0.2)',
    borderColor: 'rgba(236, 72, 153, 0.5)',
  },
  breach: {
    id: 'breach',
    label: 'Breaches',
    color: '#a855f7',
    bgColor: 'rgba(168, 85, 247, 0.2)',
    borderColor: 'rgba(168, 85, 247, 0.5)',
  },
};

export const CATEGORY_ORDER: Array<CategoryInfo['id']> = ['kev', 'maliciousIp', 'phishing', 'breach'];

// ------------------------------------------------------------
// Severity styling — CVSS bands (low / medium / high / critical)
// ------------------------------------------------------------
export const SEVERITY_ORDER: SeverityLevel[] = ['low', 'medium', 'high', 'critical'];

export const SEVERITY_COLORS: Record<SeverityLevel, { bg: string; text: string; border: string }> = {
  low: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/50' },
  medium: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/50' },
  high: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/50' },
  critical: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/50' },
};

export const SEVERITY_MAP_COLORS: Record<SeverityLevel, { fill: string; stroke: string; pulse: boolean }> = {
  low: { fill: '#22c55e20', stroke: '#22c55e', pulse: false },
  medium: { fill: '#eab30820', stroke: '#eab308', pulse: false },
  high: { fill: '#f9731620', stroke: '#f97316', pulse: true },
  critical: { fill: '#ef444420', stroke: '#ef4444', pulse: true },
};

export const ALERT_PULSE_SPEEDS: Record<AlertLevel, string> = {
  green: 'none',
  yellow: '2s',
  orange: '1.5s',
  red: '0.8s',
};

export const ALERT_COLORS: Record<AlertLevel, { bg: string; text: string; pulse: boolean }> = {
  green: { bg: 'bg-green-500/20', text: 'text-green-400', pulse: false },
  yellow: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', pulse: false },
  orange: { bg: 'bg-orange-500/20', text: 'text-orange-400', pulse: true },
  red: { bg: 'bg-red-500/20', text: 'text-red-400', pulse: true },
};

export function severityIndex(sev: SeverityLevel): number {
  return SEVERITY_ORDER.indexOf(sev);
}

// ------------------------------------------------------------
// Date formatting
// ------------------------------------------------------------
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateString);
}

// ------------------------------------------------------------
// Number formatting
// ------------------------------------------------------------
export function formatCompactNumber(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

// ------------------------------------------------------------
// Map projection — [lon, lat] to SVG viewBox 0 0 1000 500 (equirectangular,
// matches the TopoJSON land rendering in ThreatMap)
// ------------------------------------------------------------
export function coordsToMapPosition(lon: number, lat: number): { x: number; y: number } {
  const x = ((lon + 180) / 360) * 1000;
  const y = ((90 - lat) / 180) * 500;
  return { x, y };
}
