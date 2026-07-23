import assert from "node:assert/strict";
import test from "node:test";

import {
  assessSchemaPush,
  normalizeSchemaPushStatements,
} from "../scripts/schema-bootstrap-policy.ts";

test("le schéma inchangé est accepté sans sauvegarde", () => {
  assert.deepEqual(assessSchemaPush([], false), {
    requiresBackup: false,
    removedLegacyColumns: [],
  });
});

test("les anciennes colonnes du redesign sont acceptées et sauvegardées", () => {
  const result = assessSchemaPush(
    [
      "· You're about to delete title column in site_meta table with 1 items",
      "· You're about to delete quick_info_rhythm column in about table with 1 items",
    ],
    true,
  );

  assert.equal(result.requiresBackup, true);
  assert.deepEqual(result.removedLegacyColumns, [
    "site_meta.title",
    "about.quick_info_rhythm",
  ]);
});

test("une suppression SQL silencieuse mais approuvée exige une sauvegarde", () => {
  const result = assessSchemaPush(
    [],
    false,
    ["ALTER TABLE `posts` DROP COLUMN `featured`;"],
  );

  assert.deepEqual(result, {
    requiresBackup: true,
    removedLegacyColumns: ["posts.featured"],
  });
});

test("une future suppression de contenu non approuvée est refusée", () => {
  assert.throws(
    () =>
      assessSchemaPush(
        [
          "· You're about to delete description column in projects table with 4 items",
        ],
        true,
      ),
    /projects table/,
  );
});

test("une suppression SQL non signalée et non approuvée est refusée", () => {
  assert.throws(
    () =>
      assessSchemaPush(
        [],
        false,
        ["ALTER TABLE `projects` DROP COLUMN `description`;"],
      ),
    /projects\.description/,
  );
});

test("une alerte de perte sans détail exploitable est refusée", () => {
  assert.throws(
    () => assessSchemaPush([], true),
    /possible data loss/,
  );
});

test("les créations d'index strictement identiques sont dédupliquées", () => {
  const index = "CREATE UNIQUE INDEX `projects_slug_idx` ON `projects` (`slug`);";
  const result = normalizeSchemaPushStatements([
    "PRAGMA foreign_keys=OFF;",
    index,
    "PRAGMA foreign_keys=ON;",
    index,
    "PRAGMA foreign_keys=OFF;",
  ]);

  assert.deepEqual(result, {
    duplicateIndexes: ["projects_slug_idx"],
    statements: [
      "PRAGMA foreign_keys=OFF;",
      index,
      "PRAGMA foreign_keys=ON;",
      "PRAGMA foreign_keys=OFF;",
    ],
  });
});

test("un même nom d'index avec deux définitions est refusé", () => {
  assert.throws(
    () =>
      normalizeSchemaPushStatements([
        "CREATE INDEX `projects_lookup_idx` ON `projects` (`slug`);",
        "CREATE INDEX `projects_lookup_idx` ON `projects` (`title`);",
      ]),
    /conflicting definitions/,
  );
});
