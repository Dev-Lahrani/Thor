import { describe, it, expect } from 'vitest';
import { buildCsv, csvCell } from './csv';

describe('csvCell', () => {
  it('wraps values in quotes and escapes inner quotes', () => {
    expect(csvCell('plain')).toBe('"plain"');
    expect(csvCell('has "quotes"')).toBe('"has ""quotes"""');
  });

  it('passes numbers through', () => {
    expect(csvCell(9.8)).toBe('"9.8"');
    expect(csvCell(0)).toBe('"0"');
  });

  it('renders null/undefined as empty quoted cells', () => {
    expect(csvCell(null)).toBe('""');
    expect(csvCell(undefined)).toBe('""');
  });

  it('neutralizes formula injection prefixes', () => {
    expect(csvCell('=cmd|exec')).toBe('"\'=cmd|exec"');
    expect(csvCell('+1+1')).toBe('"\'+1+1"');
    expect(csvCell('-2+3')).toBe('"\'-2+3"');
    expect(csvCell('@SUM(A1)')).toBe('"\'@SUM(A1)"');
    expect(csvCell('\tTAB')).toBe('"\'\tTAB"');
  });

  it('does not touch safe values that merely contain = later', () => {
    expect(csvCell('CVE-2024-1234=ok')).toBe('"CVE-2024-1234=ok"');
  });

  it('throws on unsupported types', () => {
    expect(() => csvCell({ obj: true } as unknown as string)).toThrow(TypeError);
  });

  it('throws on non-finite numbers', () => {
    expect(() => csvCell(Number.NaN)).toThrow(TypeError);
    expect(() => csvCell(Number.POSITIVE_INFINITY)).toThrow(TypeError);
  });
});

describe('buildCsv', () => {
  it('joins headers and rows with commas and newlines', () => {
    const csv = buildCsv(['A', 'B'], [['1', '2'], ['3', '4']]);
    expect(csv).toBe('"A","B"\n"1","2"\n"3","4"');
  });

  it('escapes and neutralizes per cell', () => {
    const csv = buildCsv(['Description'], [['=HYPERLINK("http://evil")']]);
    expect(csv).toContain('"\'=HYPERLINK(""http://evil"")"');
  });

  it('produces empty output for empty input', () => {
    expect(buildCsv([], [])).toBe('');
  });
});
