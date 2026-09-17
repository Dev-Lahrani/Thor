import { describe, it, expect } from 'vitest';
import {
  CATEGORY_INFO,
  CATEGORY_ORDER,
  SEVERITY_ORDER,
  severityIndex,
  formatDate,
  formatRelativeTime,
  formatCompactNumber,
  coordsToMapPosition,
} from './helpers';

describe('severityIndex', () => {
  it('orders severities from low to critical', () => {
    expect(severityIndex('low')).toBeLessThan(severityIndex('medium'));
    expect(severityIndex('medium')).toBeLessThan(severityIndex('high'));
    expect(severityIndex('high')).toBeLessThan(severityIndex('critical'));
  });

  it('returns 0 for low and 3 for critical', () => {
    expect(severityIndex('low')).toBe(0);
    expect(severityIndex('critical')).toBe(3);
  });

  it('returns -1 for an unknown severity', () => {
    expect(severityIndex('bogus' as never)).toBe(-1);
  });
});

describe('SEVERITY_ORDER / CATEGORY_INFO consistency', () => {
  it('covers all four severity levels', () => {
    expect(SEVERITY_ORDER).toEqual(['low', 'medium', 'high', 'critical']);
  });

  it('has styling for every category in CATEGORY_ORDER', () => {
    for (const cat of CATEGORY_ORDER) {
      expect(CATEGORY_INFO[cat]).toBeDefined();
      expect(CATEGORY_INFO[cat].id).toBe(cat);
      expect(CATEGORY_INFO[cat].label.length).toBeGreaterThan(0);
      expect(CATEGORY_INFO[cat].color).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});

describe('formatDate', () => {
  it('formats an ISO date as a readable US date', () => {
    // Use T12:00 to dodge timezone edge cases
    expect(formatDate('2026-09-17T12:30:00Z')).toMatch(/Sep 17, 2026/);
  });

  it('does not throw on invalid input (returns "Invalid Date")', () => {
    expect(formatDate('not-a-date')).toBe('Invalid Date');
  });
});

describe('formatRelativeTime', () => {
  it('says "Just now" for less than a minute ago', () => {
    const now = new Date();
    expect(formatRelativeTime(new Date(now.getTime() - 10_000).toISOString())).toBe('Just now');
  });

  it('says "5m ago" for five minutes', () => {
    const now = new Date();
    expect(formatRelativeTime(new Date(now.getTime() - 5 * 60_000).toISOString())).toBe('5m ago');
  });

  it('says "3h ago" for three hours', () => {
    const now = new Date();
    expect(formatRelativeTime(new Date(now.getTime() - 3 * 60 * 60_000).toISOString())).toBe('3h ago');
  });

  it('says "2d ago" for two days', () => {
    const now = new Date();
    expect(formatRelativeTime(new Date(now.getTime() - 2 * 24 * 60 * 60_000).toISOString())).toBe('2d ago');
  });

  it('falls back to formatDate beyond a week', () => {
    const old = '2020-01-01T12:00:00Z';
    expect(formatRelativeTime(old)).toBe(formatDate(old));
  });
});

describe('formatCompactNumber', () => {
  it('leaves small numbers alone', () => {
    expect(formatCompactNumber(0)).toBe('0');
    expect(formatCompactNumber(999)).toBe('999');
  });

  it('abbreviates thousands', () => {
    expect(formatCompactNumber(1_000)).toBe('1K');
    expect(formatCompactNumber(164_200_000).length).toBeGreaterThan(0);
    expect(formatCompactNumber(164_200_000)).toMatch(/M/);
  });

  it('abbreviates millions and billions with one decimal', () => {
    expect(formatCompactNumber(2_500_000)).toBe('2.5M');
    expect(formatCompactNumber(1_250_000_000)).toBe('1.3B');
  });
});

describe('coordsToMapPosition', () => {
  it('maps lon/lat to the 1000x500 viewBox', () => {
    expect(coordsToMapPosition(-180, 90)).toEqual({ x: 0, y: 0 });
    expect(coordsToMapPosition(0, 0)).toEqual({ x: 500, y: 250 });
    expect(coordsToMapPosition(180, -90)).toEqual({ x: 1000, y: 500 });
  });

  it('is monotonic in both axes', () => {
    const a = coordsToMapPosition(-10, 20);
    const b = coordsToMapPosition(10, -20);
    expect(b.x).toBeGreaterThan(a.x);
    expect(b.y).toBeGreaterThan(a.y);
  });
});
