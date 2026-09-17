// ============================================================
// Thor — CSV export helpers
// Shared by ExportModal so every export escapes cells the same way.
// ============================================================

/**
 * Neutralize spreadsheet formula injection ("CSV injection").
 * A cell starting with = + - @ or a tab/CR could be interpreted as a
 * formula when the export is opened in Excel/Sheets. We prefix such
 * cells with a single quote, the standard mitigation.
 */
function neutralizeFormula(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

/** Escape a single cell for CSV output, or throw if the type is unsupported. */
export function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '""';
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new TypeError(`Non-finite number: ${value}`);
    return `"${value}"`;
  }
  if (typeof value !== 'string') throw new TypeError(`Unsupported CSV cell type: ${typeof value}`);

  const safe = neutralizeFormula(value);
  return `"${safe.replace(/"/g, '""')}"`;
}

/** Build a complete CSV string from headers + rows of strings/numbers. */
export function buildCsv(headers: string[], rows: Array<Array<string | number>>): string {
  return [
    headers.map(csvCell).join(','),
    ...rows.map(row => row.map(csvCell).join(',')),
  ].join('\n');
}
