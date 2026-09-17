import { describe, it, expect } from 'vitest';
import { cvssToSeverity, normalizeNvdCve as normalizeNvdCveForTest } from './api.test-helpers';
import type { NvdCveItem } from '../types';

describe('cvssToSeverity', () => {
  it('maps CVSS bands to severity levels', () => {
    expect(cvssToSeverity(0.1)).toBe('low');
    expect(cvssToSeverity(3.9)).toBe('low');
    expect(cvssToSeverity(4.0)).toBe('medium');
    expect(cvssToSeverity(6.9)).toBe('medium');
    expect(cvssToSeverity(7.0)).toBe('high');
    expect(cvssToSeverity(8.9)).toBe('high');
    expect(cvssToSeverity(9.0)).toBe('critical');
    expect(cvssToSeverity(10)).toBe('critical');
  });
});

describe('normalizeNvdCve', () => {
  const baseItem: NvdCveItem = {
    cve: {
      id: 'CVE-2026-1234',
      sourceIdentifier: 'nvd@nist.gov',
      published: '2026-09-10T00:00:00.000',
      lastModified: '2026-09-11T00:00:00.000',
      descriptions: [
        { lang: 'fr', value: 'Ignore me' },
        { lang: 'en', value: 'A test vulnerability affecting widgets.' },
      ],
      metrics: {
        cvssMetricV31: [
          {
            cvssData: {
              baseScore: 9.8,
              baseSeverity: 'CRITICAL',
              vectorString: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H',
              attackVector: 'NETWORK',
            },
          },
        ],
      },
      references: [{ url: 'https://example.com/advisory' }],
      weaknesses: [{ description: [{ value: 'CWE-79' }] }],
      configurations: [
        {
          nodes: [
            {
              cpeMatch: [{ criteria: 'cpe:2.3:a:vendor:product:1.0:*:*:*:*:*:*:*' }],
            },
          ],
        },
      ],
    },
  };

  it('extracts score, vector, severity, and attack vector from v3.1 metrics', () => {
    const rec = normalizeNvdCveForTest(baseItem);
    expect(rec).not.toBeNull();
    expect(rec!.cvssScore).toBe(9.8);
    expect(rec!.severity).toBe('critical');
    expect(rec!.cvssVector).toContain('CVSS:3.1');
    expect(rec!.attackVector).toBe('NETWORK');
  });

  it('prefers the English description', () => {
    const rec = normalizeNvdCveForTest(baseItem);
    expect(rec!.description).toBe('A test vulnerability affecting widgets.');
  });

  it('extracts vendors from CPE criteria', () => {
    const rec = normalizeNvdCveForTest(baseItem);
    expect(rec!.vendors).toContain('vendor');
  });

  it('builds a title from the CVE id and vendor', () => {
    const rec = normalizeNvdCveForTest(baseItem);
    expect(rec!.title).toContain('CVE-2026-1234');
  });

  it('carries the CWE id', () => {
    const rec = normalizeNvdCveForTest(baseItem);
    expect(rec!.cwe).toBe('CWE-79');
  });

  it('falls back to v2 metrics when v3 is absent', () => {
    const item: NvdCveItem = {
      cve: {
        ...baseItem.cve,
        metrics: {
          cvssMetricV2: [
            {
              cvssData: { baseScore: 5.0, vectorString: 'AV:N/AC:L/Au:N/C:P/I:N/A:N' },
              baseSeverity: 'MEDIUM',
            },
          ],
        },
      },
    };
    const rec = normalizeNvdCveForTest(item);
    expect(rec!.cvssScore).toBe(5.0);
    expect(rec!.severity).toBe('medium');
  });

  it('returns null when no CVSS data exists at all', () => {
    const item: NvdCveItem = { cve: { ...baseItem.cve, metrics: {} } };
    expect(normalizeNvdCveForTest(item)).toBeNull();
  });
});
