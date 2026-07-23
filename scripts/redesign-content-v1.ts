import type { Client, InStatement } from "@libsql/client";

export const REDESIGN_CONTENT_REVISION = 7;

const REDESIGN_BRIDGE_COLUMNS = [
  {
    table: "site_meta",
    name: "content_revision",
    definition: "numeric DEFAULT 0",
  },
  {
    table: "site_meta",
    name: "hero_eyebrow",
    definition: "text DEFAULT 'DevSecOps · Infrastructure · Sécurité'",
  },
  {
    table: "site_meta",
    name: "hero_title",
    definition:
      "text DEFAULT 'Je construis, sécurise et documente des systèmes.'",
  },
  {
    table: "site_meta",
    name: "hero_description",
    definition:
      "text DEFAULT 'Conception et exploitation de plateformes fiables : infrastructure as code, automatisation, observabilité et sécurité.'",
  },
  { table: "about", name: "intro", definition: "text" },
  { table: "about", name: "quick_info_mobility", definition: "text" },
  { table: "projects", name: "short_title", definition: "text" },
  {
    table: "projects",
    name: "kind",
    definition: "text DEFAULT 'case-study'",
  },
  {
    table: "projects",
    name: "card_visual",
    definition: "text DEFAULT 'auto'",
  },
  {
    table: "projects",
    name: "cover_id",
    definition: "integer REFERENCES media(id) ON DELETE SET NULL",
  },
  {
    table: "projects",
    name: "featured",
    definition: "integer DEFAULT false",
  },
  {
    table: "projects",
    name: "listed_in_notes",
    definition: "integer DEFAULT false",
  },
  { table: "projects", name: "published_at", definition: "text" },
  {
    table: "projects",
    name: "reading_time",
    definition: "numeric DEFAULT 5",
  },
  {
    table: "projects",
    name: "parent_project_id",
    definition: "integer REFERENCES projects(id) ON DELETE SET NULL",
  },
  { table: "_projects_v", name: "version_short_title", definition: "text" },
  {
    table: "_projects_v",
    name: "version_kind",
    definition: "text DEFAULT 'case-study'",
  },
  {
    table: "_projects_v",
    name: "version_card_visual",
    definition: "text DEFAULT 'auto'",
  },
  {
    table: "_projects_v",
    name: "version_cover_id",
    definition: "integer",
  },
  {
    table: "_projects_v",
    name: "version_featured",
    definition: "integer DEFAULT false",
  },
  {
    table: "_projects_v",
    name: "version_listed_in_notes",
    definition: "integer DEFAULT false",
  },
  { table: "_projects_v", name: "version_published_at", definition: "text" },
  {
    table: "_projects_v",
    name: "version_reading_time",
    definition: "numeric DEFAULT 5",
  },
  {
    table: "_projects_v",
    name: "version_parent_project_id",
    definition: "integer",
  },
] as const;

const REDESIGN_STAGING_TABLES = new Set([
  "__new_projects",
  "__new__projects_v",
  "__new_site_meta",
  "__new_about",
]);

type RedesignBridgeTable = (typeof REDESIGN_BRIDGE_COLUMNS)[number]["table"];

export type RedesignBridgeColumn = {
  name: string;
  table: RedesignBridgeTable;
};

export async function findStaleRedesignStagingTables(
  client: Client,
): Promise<string[]> {
  const result = await client.execute(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name LIKE '__new_%' ORDER BY name",
  );
  const stagingTables = result.rows.map((row) => String(row.name));
  const unexpectedTables = stagingTables.filter(
    (table) => !REDESIGN_STAGING_TABLES.has(table),
  );

  if (unexpectedTables.length > 0) {
    throw new Error(
      `Unexpected schema staging tables: ${unexpectedTables.join(", ")}`,
    );
  }

  return stagingTables;
}

export async function dropStaleRedesignStagingTables(
  client: Client,
  stagingTables: string[],
): Promise<void> {
  for (const table of stagingTables) {
    if (!REDESIGN_STAGING_TABLES.has(table)) {
      throw new Error(`Refusing to drop unapproved staging table: ${table}`);
    }
    await client.execute(`DROP TABLE ${table}`);
  }
}

type ProjectRedesign = {
  cardVisual: "crisis" | "homelab" | "phantom" | "system";
  category: string;
  featured: boolean;
  kind: "case-study" | "experiment" | "living-system" | "product";
  order: number;
  readingTime: number;
  shortTitle: string;
  slug: string;
  title: string;
};

const PROJECT_REDESIGN: ProjectRedesign[] = [
  {
    slug: "homelab",
    title: "Homelab",
    shortTitle: "Homelab",
    category: "infrastructure · self-hosting",
    kind: "living-system",
    cardVisual: "homelab",
    featured: true,
    order: 1,
    readingTime: 8,
  },
  {
    slug: "simulation-ba186",
    title: "Simulation de crise temps réel",
    shortTitle: "Simulation",
    category: "simulation · ia",
    kind: "case-study",
    cardVisual: "crisis",
    featured: true,
    order: 2,
    readingTime: 4,
  },
  {
    slug: "poc-phantom",
    title: "Phantom : trier un incident sans polluer la cible",
    shortTitle: "Phantom",
    category: "tooling · ir",
    kind: "experiment",
    cardVisual: "phantom",
    featured: true,
    order: 3,
    readingTime: 4,
  },
  {
    slug: "bientot",
    title: "Bientôt : monitoring léger du Homelab",
    shortTitle: "Bientôt",
    category: "monitoring · devsecops",
    kind: "product",
    cardVisual: "system",
    featured: false,
    order: 4,
    readingTime: 7,
  },
];

const SPECIALTIES = [
  "DevSecOps",
  "Infrastructure as Code",
  "Sécurité des systèmes",
  "Observabilité",
];

const PROFILE_INTRO =
  "Je conçois et exploite des infrastructures où la sécurité, " +
  "l'automatisation et la compréhension du système avancent ensemble. Le " +
  "Homelab sert de terrain réel ; les dossiers et les Notes en montrent les " +
  "choix et les preuves.";

const getContentRevision = async (client: Client): Promise<number | null> => {
  const result = await client.execute(
    "SELECT content_revision FROM site_meta LIMIT 1",
  );
  const value = result.rows[0]?.content_revision;
  return typeof value === "number" ? value : null;
};

export async function findPendingRedesignBridgeColumns(
  client: Client,
): Promise<RedesignBridgeColumn[]> {
  const pendingColumns: RedesignBridgeColumn[] = [];
  const tables = ["site_meta", "about", "projects", "_projects_v"] as const;

  for (const table of tables) {
    const tableInfo = await client.execute(`PRAGMA table_info(${table})`);
    if (tableInfo.rows.length === 0) continue;

    const existingColumns = new Set(
      tableInfo.rows.map((column) => String(column.name)),
    );

    for (const column of REDESIGN_BRIDGE_COLUMNS) {
      if (column.table !== table || existingColumns.has(column.name)) continue;
      pendingColumns.push({ table, name: column.name });
    }
  }

  return pendingColumns;
}

/**
 * Adds only the known, non-destructive redesign columns before Drizzle rebuilds
 * legacy tables. This bridges databases that were stopped part-way through a
 * previous additive schema push; the caller must create a backup first.
 */
export async function applyRedesignBridgeColumns(
  client: Client,
  pendingColumns: RedesignBridgeColumn[],
): Promise<void> {
  for (const pendingColumn of pendingColumns) {
    const approvedColumn = REDESIGN_BRIDGE_COLUMNS.find(
      (column) =>
        column.table === pendingColumn.table &&
        column.name === pendingColumn.name,
    );

    if (!approvedColumn) {
      throw new Error(
        `Unapproved redesign bridge column: ${pendingColumn.table}.${pendingColumn.name}`,
      );
    }

    await client.execute(
      `ALTER TABLE ${approvedColumn.table} ADD COLUMN ${approvedColumn.name} ${approvedColumn.definition}`,
    );
  }
}

export async function needsRedesignContentMigration(
  client: Client,
): Promise<boolean> {
  const revision = await getContentRevision(client);
  return revision !== null && revision < REDESIGN_CONTENT_REVISION;
}

const projectStatements = (): InStatement[] =>
  PROJECT_REDESIGN.map((project) => ({
    sql: `
      UPDATE projects
      SET title = ?, short_title = ?, category = ?, kind = ?, card_visual = ?,
          featured = ?, listed_in_notes = 0,
          published_at = COALESCE(published_at, created_at),
          reading_time = ?, "order" = ?
      WHERE slug = ?
    `,
    args: [
      project.title,
      project.shortTitle,
      project.category,
      project.kind,
      project.cardVisual,
      project.featured ? 1 : 0,
      project.readingTime,
      project.order,
      project.slug,
    ],
  }));

const specialtyStatements = async (client: Client): Promise<InStatement[]> => {
  const result = await client.execute(
    "SELECT COUNT(*) AS count FROM about_specialties",
  );
  const count = Number(result.rows[0]?.count ?? 0);
  if (count > 0) return [];

  return SPECIALTIES.map((value, index) => ({
    sql: `
      INSERT INTO about_specialties (_order, _parent_id, id, value)
      SELECT ?, id, ?, ? FROM about
    `,
    args: [
      index + 1,
      `70000000000000000000000${index + 1}`,
      value,
    ],
  }));
};

/**
 * Applies idempotent redesign metadata without marking the revision complete.
 * The caller does that only after the Project-to-Note copy has succeeded.
 */
export async function applyRedesignContentMigration(
  client: Client,
): Promise<void> {
  const statements: InStatement[] = [
    ...projectStatements(),
    {
      sql: `
        UPDATE projects
        SET badge = NULL
        WHERE slug = 'homelab'
      `,
      args: [],
    },
    {
      sql: `
        UPDATE projects
        SET slug = 'homelab',
            title = 'Homelab',
            short_title = 'Homelab',
            category = 'infrastructure · self-hosting',
            kind = 'living-system',
            card_visual = 'homelab',
            badge = NULL,
            featured = 1,
            listed_in_notes = 0,
            published_at = COALESCE(published_at, created_at),
            reading_time = 8,
            "order" = 1
        WHERE slug = 'zero-trust'
          AND NOT EXISTS (
            SELECT 1 FROM projects AS canonical WHERE canonical.slug = 'homelab'
          )
      `,
      args: [],
    },
    {
      sql: `
        UPDATE projects
        SET featured = 0,
            listed_in_notes = 0,
            "order" = 90,
            badge = 'À convertir en Note',
            _status = 'draft'
        WHERE slug = 'zero-trust'
      `,
      args: [],
    },
    {
      sql: `
        UPDATE about
        SET intro = COALESCE(NULLIF(intro, ''), ?),
            section_title = ?
      `,
      args: [PROFILE_INTRO, "D'où je viens."],
    },
    ...(await specialtyStatements(client)),
  ];

  await client.batch(statements, "write");
}

export async function markRedesignContentMigrationComplete(
  client: Client,
): Promise<void> {
  await client.execute({
    sql: "UPDATE site_meta SET content_revision = ?",
    args: [REDESIGN_CONTENT_REVISION],
  });
}
