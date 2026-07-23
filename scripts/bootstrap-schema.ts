import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import path from "node:path";

import type { SQLiteAdapter } from "@payloadcms/db-sqlite";
import { getPayload, type Payload } from "payload";

import config from "../payload.config";
import {
  applyRedesignContentMigration,
  applyRedesignBridgeColumns,
  dropStaleRedesignStagingTables,
  findPendingRedesignBridgeColumns,
  findStaleRedesignStagingTables,
  markRedesignContentMigrationComplete,
  needsRedesignContentMigration,
} from "./redesign-content-v1";
import { migrateProjectWriteupsToNotes } from "./migrate-project-writeups-to-notes";
import { prepareEditorialV2 } from "./prepare-editorial-v2";
import {
  assessSchemaPush,
  normalizeSchemaPushStatements,
} from "./schema-bootstrap-policy";

type SchemaPushResult = {
  apply: () => Promise<void>;
  duplicateIndexes: string[];
  hasDataLoss: boolean;
  statementsToExecute: string[];
  warnings: string[];
};

type BootstrapSQLiteAdapter = Pick<
  SQLiteAdapter,
  "client" | "drizzle" | "requireDrizzleKit" | "schema"
>;

type PushSQLiteSchema = (
  schema: BootstrapSQLiteAdapter["schema"],
  drizzle: BootstrapSQLiteAdapter["drizzle"],
) => Promise<SchemaPushResult>;

// Prevent Payload's development auto-push: this script inspects the plan and
// applies it itself, without an interactive prompt.
process.env.PAYLOAD_MIGRATING = "true";

const getLocalDatabasePath = (databaseUri: string): string => {
  if (!databaseUri.startsWith("file:")) {
    throw new Error(
      "Automatic schema backup requires a local file: DATABASE_URI. " +
        "Refusing to mutate a remote database without a dedicated backup path.",
    );
  }

  const encodedPath = databaseUri.slice("file:".length).split(/[?#]/, 1)[0];
  const databasePath = decodeURIComponent(encodedPath);
  if (!databasePath || databasePath === ":memory:") {
    throw new Error(
      "Automatic schema backup requires a persistent SQLite database file.",
    );
  }

  return path.resolve(databasePath);
};

const createDatabaseBackup = async (
  adapter: BootstrapSQLiteAdapter,
): Promise<string> => {
  const databaseUri = process.env.DATABASE_URI || "file:./payload.db";
  const databasePath = getLocalDatabasePath(databaseUri);
  const backupDirectory = path.join(path.dirname(databasePath), "backups");
  const backupName = [
    "payload-before-redesign",
    new Date().toISOString().replace(/[:.]/g, "-"),
    randomUUID().slice(0, 8),
  ].join("-");
  const backupPath = path.join(backupDirectory, `${backupName}.db`);

  await mkdir(backupDirectory, { recursive: true });
  await adapter.client.execute({
    sql: "VACUUM INTO ?",
    args: [backupPath],
  });

  console.log(`✓ SQLite backup created: ${backupPath}`);
  return backupPath;
};

const inspectSchema = async (
  adapter: BootstrapSQLiteAdapter,
): Promise<SchemaPushResult> => {
  // Payload's public adapter type erases the concrete SQLite Drizzle generic.
  // This cast restores that local boundary; runtime capability checks happen
  // in getBootstrapAdapter before any mutation.
  const pushSchema = adapter.requireDrizzleKit()
    .pushSchema as unknown as PushSQLiteSchema;
  const result = await pushSchema(adapter.schema, adapter.drizzle);
  const rawStatements = Array.isArray(result.statementsToExecute)
    ? result.statementsToExecute
    : [];
  const normalized = normalizeSchemaPushStatements(rawStatements);

  // pushSchema.apply closes over this array. Mutating it in place preserves
  // Drizzle's execution semantics while removing only proven exact duplicates.
  rawStatements.splice(0, rawStatements.length, ...normalized.statements);

  return {
    apply: result.apply as () => Promise<void>,
    duplicateIndexes: normalized.duplicateIndexes,
    hasDataLoss: Boolean(result.hasDataLoss),
    statementsToExecute: normalized.statements,
    warnings: Array.isArray(result.warnings)
      ? result.warnings.map(String)
      : [],
  };
};

const getBootstrapAdapter = (payload: Payload): BootstrapSQLiteAdapter => {
  const adapter = payload.db;
  if (
    adapter.name !== "sqlite" ||
    !("client" in adapter) ||
    typeof adapter.requireDrizzleKit !== "function"
  ) {
    throw new Error(
      "Schema bootstrap requires the configured Payload SQLite adapter.",
    );
  }

  return adapter as unknown as BootstrapSQLiteAdapter;
};

const provisionSchemaAndContent = async (
  payload: Payload,
): Promise<void> => {
  const adapter = getBootstrapAdapter(payload);
  const pendingBridgeColumns = await findPendingRedesignBridgeColumns(
    adapter.client,
  );
  const staleStagingTables = await findStaleRedesignStagingTables(
    adapter.client,
  );
  let backupPath: string | undefined;

  // Bridge known additive fields before asking Drizzle to infer renames. On a
  // legacy database, inspecting first can open an interactive
  // "create-or-rename" prompt, which is unsafe and unusable at container boot.
  if (pendingBridgeColumns.length > 0 || staleStagingTables.length > 0) {
    backupPath = await createDatabaseBackup(adapter);
  }

  if (staleStagingTables.length > 0) {
    await dropStaleRedesignStagingTables(
      adapter.client,
      staleStagingTables,
    );
    console.log(
      `→ Removed stale schema staging tables: ${staleStagingTables.join(", ")}`,
    );
  }

  if (pendingBridgeColumns.length > 0) {
    await applyRedesignBridgeColumns(adapter.client, pendingBridgeColumns);
    console.log(
      `→ Added redesign bridge columns: ${pendingBridgeColumns
        .map((column) => `${column.table}.${column.name}`)
        .join(", ")}`,
    );
  }

  const schemaPush = await inspectSchema(adapter);
  const assessment = assessSchemaPush(
    schemaPush.warnings,
    schemaPush.hasDataLoss,
    schemaPush.statementsToExecute,
  );

  if (assessment.requiresBackup && !backupPath) {
    backupPath = await createDatabaseBackup(adapter);
  }

  if (schemaPush.duplicateIndexes.length > 0) {
    console.log(
      `→ Removed duplicate Drizzle index statements: ${[
        ...new Set(schemaPush.duplicateIndexes),
      ].join(", ")}`,
    );
  }

  if (assessment.requiresBackup) {
    console.log(
      `→ Removing approved legacy columns: ${assessment.removedLegacyColumns.join(", ")}`,
    );
  }

  await schemaPush.apply();

  if (await needsRedesignContentMigration(adapter.client)) {
    backupPath ??= await createDatabaseBackup(adapter);
    await applyRedesignContentMigration(adapter.client);
    const noteMigration = await migrateProjectWriteupsToNotes(payload);
    const editorialPreparation = await prepareEditorialV2(payload);
    await markRedesignContentMigrationComplete(adapter.client);
    console.log(
      `✓ Project write-ups synchronized as Notes: ${noteMigration.created} created, ` +
        `${noteMigration.existing} already present, ${noteMigration.skipped} skipped.`,
    );
    console.log(
      `✓ Editorial structure prepared: ${editorialPreparation.legacyProjectsDrafted} legacy projects drafted, ` +
        `${editorialPreparation.independentNotesUpdated} independent Notes updated, ` +
        `${editorialPreparation.legacyYourCloudDraftsDeleted} obsolete Your Cloud drafts deleted, ` +
        `${editorialPreparation.legacyYourCloudDraftsPreserved} non-draft documents preserved, ` +
        `Your Cloud theme ${
          editorialPreparation.yourCloudProjectCreated
            ? "created as draft"
            : "already present"
        }, introduction Note ${
          editorialPreparation.yourCloudIntroductionCreated
            ? "created as draft"
            : editorialPreparation.yourCloudIntroductionUpdated
              ? "updated as draft"
              : editorialPreparation.yourCloudIntroductionPublishedUpdated
                ? "updated as published"
                : editorialPreparation.yourCloudIntroductionExisting
                  ? "already present"
                  : "not created"
        }.`,
    );
    console.log("✓ Redesign content metadata synchronized.");
  }

  const verification = await inspectSchema(adapter);
  if (verification.warnings.length > 0 || verification.hasDataLoss) {
    throw new Error(
      "Schema bootstrap verification failed: Payload still reports pending " +
        "destructive changes after apply.",
    );
  }
};

let payload: Payload | undefined;
let bootstrapFailure: unknown;

try {
  payload = await getPayload({ config });
  await provisionSchemaAndContent(payload);
  console.log("✓ Schema bootstrap complete.");
} catch (error) {
  bootstrapFailure = error;
  console.error("✗ Schema bootstrap failed.", error);
} finally {
  await payload?.destroy();
}

if (bootstrapFailure) {
  // `payload run` can normalize process.exitCode after a loaded script ends.
  // Exiting explicitly after the adapter is closed guarantees that the shell
  // entrypoint cannot start Next.js on a schema that failed to provision.
  process.exit(1);
}
