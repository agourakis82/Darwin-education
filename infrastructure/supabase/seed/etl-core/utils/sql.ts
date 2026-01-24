/**
 * SQL Generation Utilities
 * Handles SQL formatting and safe value conversion
 */

/**
 * Convert value to safe SQL representation
 */
export function sqlValue(value: any): string {
  if (value === null || value === undefined) {
    return 'NULL';
  }

  if (typeof value === 'number') {
    return value.toString();
  }

  if (typeof value === 'boolean') {
    return value ? 'TRUE' : 'FALSE';
  }

  if (typeof value === 'object') {
    // Handle JSONB
    const json = JSON.stringify(value);
    const escaped = json.replace(/'/g, "''");
    return `'${escaped}'::jsonb`;
  }

  // String
  const str = String(value);
  const escaped = escapeSql(str);
  return `'${escaped}'`;
}

/**
 * Escape single quotes in SQL strings
 */
export function escapeSql(str: string): string {
  return str.replace(/'/g, "''");
}

/**
 * Generate SQL INSERT statement
 */
export function generateInsert(
  table: string,
  rows: Record<string, any>[]
): string {
  if (rows.length === 0) {
    throw new Error('Cannot generate INSERT with no rows');
  }

  const columns = Object.keys(rows[0]);
  const columnStr = columns.join(', ');

  const valueLines = rows.map((row) => {
    const values = columns.map((col) => sqlValue(row[col]));
    return `  (${values.join(', ')})`;
  });

  const sql = [
    `INSERT INTO ${table} (${columnStr})`,
    'VALUES',
    valueLines.join(',\n'),
    ';',
  ];

  return sql.join('\n');
}

/**
 * Generate SQL UPSERT statement (INSERT ... ON CONFLICT DO UPDATE)
 */
export function generateUpsert(
  table: string,
  rows: Record<string, any>[],
  conflictKey: string
): string {
  if (rows.length === 0) {
    throw new Error('Cannot generate UPSERT with no rows');
  }

  const columns = Object.keys(rows[0]);
  const excludedColumns = columns.filter((col) => col !== conflictKey);

  const columnStr = columns.join(', ');

  const valueLines = rows.map((row) => {
    const values = columns.map((col) => sqlValue(row[col]));
    return `  (${values.join(', ')})`;
  });

  const updateLine = excludedColumns
    .map((col) => `  ${col} = EXCLUDED.${col}`)
    .join(',\n');

  const sql = [
    `INSERT INTO ${table} (${columnStr})`,
    'VALUES',
    valueLines.join(',\n'),
    `ON CONFLICT (${conflictKey}) DO UPDATE SET`,
    updateLine,
    ',',
    '  updated_at = NOW();',
  ];

  return sql.join('\n');
}

/**
 * Format question options to JSONB array
 */
export function formatOptionsAsJsonb(options: { letter: string; text: string; feedback?: string }[]): string {
  const formatted = options.map((opt) => ({
    letter: opt.letter,
    text: opt.text,
    feedback: opt.feedback || '',
  }));

  const json = JSON.stringify(formatted);
  const escaped = json.replace(/'/g, "''");
  return `'${escaped}'::jsonb`;
}

/**
 * Generate deterministic UUID from parts
 * Used for question IDs to ensure reproducibility
 */
export function generateDeterministicId(source: string, year: number, itemNumber: number): string {
  // Simple deterministic ID: q-{source}-{year}-{itemNumber.padStart(3, '0')}
  return `q-${source}-${year}-${itemNumber.toString().padStart(3, '0')}`;
}

/**
 * Wrap comment block for SQL
 */
export function sqlComment(text: string): string {
  const lines = text.split('\n');
  return lines.map((line) => `-- ${line}`).join('\n');
}
