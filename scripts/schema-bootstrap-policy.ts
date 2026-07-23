const ALLOWED_LEGACY_COLUMN_REMOVALS = new Set([
  "site_meta.availability",
  "site_meta.description",
  "site_meta.location",
  "site_meta.title",
  "about.quick_info_rhythm",
  "posts.featured",
  "_posts_v.version_featured",
]);

const COLUMN_REMOVAL_WARNING =
  /delete ([a-z0-9_]+) column in ([a-z0-9_]+) table/i;
const DROP_COLUMN_STATEMENT =
  /^\s*ALTER TABLE\s+[`"]?([a-z0-9_]+)[`"]?\s+DROP COLUMN\s+[`"]?([a-z0-9_]+)[`"]?\s*;?\s*$/i;
const CREATE_INDEX_STATEMENT =
  /^\s*CREATE\s+(?:UNIQUE\s+)?INDEX\s+[`"]?([a-z0-9_]+)[`"]?\s+ON\b/i;

export type SchemaPushAssessment = {
  requiresBackup: boolean;
  removedLegacyColumns: string[];
};

export type NormalizedSchemaPushStatements = {
  duplicateIndexes: string[];
  statements: string[];
};

const describeWarnings = (warnings: string[]): string =>
  warnings.map((warning) => `- ${warning}`).join("\n");

const normalizeStatement = (statement: string): string =>
  statement.trim().replace(/\s+/g, " ");

/**
 * Drizzle 0.31 can emit the same CREATE INDEX twice around a SQLite table
 * rebuild. Keep the first exact definition, but fail closed if a reused index
 * name points to different SQL. Other repeated statements (notably PRAGMAs)
 * must retain their ordering.
 */
export function normalizeSchemaPushStatements(
  statements: string[],
): NormalizedSchemaPushStatements {
  const indexDefinitions = new Map<string, string>();
  const duplicateIndexes: string[] = [];
  const normalizedStatements: string[] = [];

  for (const statement of statements) {
    const indexMatch = statement.match(CREATE_INDEX_STATEMENT);
    if (!indexMatch) {
      normalizedStatements.push(statement);
      continue;
    }

    const indexName = indexMatch[1];
    const definition = normalizeStatement(statement);
    const previousDefinition = indexDefinitions.get(indexName);

    if (!previousDefinition) {
      indexDefinitions.set(indexName, definition);
      normalizedStatements.push(statement);
      continue;
    }

    if (previousDefinition !== definition) {
      throw new Error(
        `Schema push refused: conflicting definitions for index ${indexName}.`,
      );
    }

    duplicateIndexes.push(indexName);
  }

  return {
    duplicateIndexes,
    statements: normalizedStatements,
  };
}

/**
 * Only the columns retired by the portfolio redesign may be removed without a
 * human prompt. Any other Drizzle warning fails closed so a future code change
 * cannot silently discard content during a container restart.
 */
export function assessSchemaPush(
  warnings: string[],
  hasDataLoss: boolean,
  statements: string[] = [],
): SchemaPushAssessment {
  const removedLegacyColumns = new Set<string>();
  const unexpectedWarnings: string[] = [];

  for (const warning of warnings) {
    const match = warning.match(COLUMN_REMOVAL_WARNING);
    const column = match ? `${match[2]}.${match[1]}` : undefined;

    if (!column || !ALLOWED_LEGACY_COLUMN_REMOVALS.has(column)) {
      unexpectedWarnings.push(warning);
      continue;
    }

    removedLegacyColumns.add(column);
  }

  for (const statement of statements) {
    const match = statement.match(DROP_COLUMN_STATEMENT);
    if (!match) continue;

    const column = `${match[1]}.${match[2]}`;
    if (!ALLOWED_LEGACY_COLUMN_REMOVALS.has(column)) {
      throw new Error(
        "Schema push refused: SQL attempts to remove an unapproved column " +
          `${column}.`,
      );
    }

    removedLegacyColumns.add(column);
  }

  if (unexpectedWarnings.length > 0) {
    throw new Error(
      "Schema push refused: Payload reported changes that are not part of the " +
        `approved redesign migration:\n${describeWarnings(unexpectedWarnings)}`,
    );
  }

  if (hasDataLoss && removedLegacyColumns.size === 0) {
    throw new Error(
      "Schema push refused: Payload reported possible data loss without an " +
        "approved legacy-column warning.",
    );
  }

  return {
    requiresBackup: removedLegacyColumns.size > 0,
    removedLegacyColumns: [...removedLegacyColumns],
  };
}
