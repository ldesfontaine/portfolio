import assert from "node:assert/strict";
import test from "node:test";

import { createClient } from "@libsql/client";
import type { Payload } from "payload";

import { prepareEditorialV2 } from "../scripts/prepare-editorial-v2.ts";
import {
  applyRedesignContentMigration,
  applyRedesignBridgeColumns,
  dropStaleRedesignStagingTables,
  findPendingRedesignBridgeColumns,
  findStaleRedesignStagingTables,
  markRedesignContentMigrationComplete,
  needsRedesignContentMigration,
} from "../scripts/redesign-content-v1.ts";
import {
  projectContentToNoteContent,
  projectPresentationSlug,
} from "../scripts/migrate-project-writeups-to-notes.ts";

test("la préparation retire uniquement les anciens brouillons Your Cloud", async () => {
  type SeedDocument = {
    _status: "draft" | "published";
    id: number;
    slug: string;
    title?: string;
  };

  const projects: SeedDocument[] = [
    { id: 1, slug: "homelab", title: "Homelab", _status: "published" },
    { id: 2, slug: "your-cloud", title: "Your Cloud", _status: "draft" },
  ];
  const posts: SeedDocument[] = [
    {
      id: 10,
      slug: "your-cloud-gerer-une-infrastructure-sans-la-rendre-opaque",
      _status: "draft",
    },
    {
      id: 11,
      slug: "your-cloud-un-binaire-plusieurs-roles",
      _status: "draft",
    },
    {
      id: 12,
      slug: "your-cloud-observer-sans-ouvrir-une-porte-administration",
      _status: "draft",
    },
    {
      id: 13,
      slug: "your-cloud-pourquoi-separer-console-controller",
      _status: "draft",
    },
    {
      id: 14,
      slug: "your-cloud-preparer-ferme-publier-en-dernier",
      _status: "draft",
    },
    {
      id: 15,
      slug: "your-cloud-connecter-infrastructure-sans-gerer-wireguard",
      _status: "published",
    },
  ];

  const payload = {
    find: async (args: unknown) => {
      const query = args as {
        collection: "posts" | "projects";
        where: { slug: { equals: string } };
      };
      const documents = query.collection === "posts" ? posts : projects;
      return {
        docs: documents.filter(
          (document) => document.slug === query.where.slug.equals,
        ),
      };
    },
    create: async (args: unknown) => {
      const request = args as {
        collection: "posts" | "projects";
        data: SeedDocument;
      };
      const documents = request.collection === "posts" ? posts : projects;
      const document = {
        ...request.data,
        id: Math.max(...documents.map(({ id }) => id), 0) + 1,
      };
      documents.push(document);
      return document;
    },
    delete: async (args: unknown) => {
      const request = args as {
        collection: "posts" | "projects";
        id: number;
      };
      const documents = request.collection === "posts" ? posts : projects;
      const index = documents.findIndex(({ id }) => id === request.id);
      assert.notEqual(index, -1);
      return documents.splice(index, 1)[0];
    },
  } as unknown as Payload;

  const result = await prepareEditorialV2(payload);

  assert.equal(result.legacyYourCloudDraftsDeleted, 5);
  assert.equal(result.legacyYourCloudDraftsPreserved, 1);
  assert.equal(result.yourCloudIntroductionCreated, true);
  assert.equal(
    posts.some(
      ({ slug }) =>
        slug ===
        "your-cloud-connecter-infrastructure-sans-gerer-wireguard",
    ),
    true,
  );
  assert.equal(
    posts.some(
      ({ slug }) =>
        slug === "your-cloud-administrer-sans-perdre-de-vue",
    ),
    true,
  );
});

const createPartialRedesignDatabase = async () => {
  const client = createClient({ url: "file::memory:" });
  await client.batch(
    [
      "CREATE TABLE media (id integer PRIMARY KEY)",
      "CREATE TABLE site_meta (id integer PRIMARY KEY, content_revision numeric DEFAULT 0, hero_eyebrow text, hero_title text, hero_description text)",
      "CREATE TABLE about (id integer PRIMARY KEY, intro text, quick_info_mobility text)",
      "CREATE TABLE projects (id integer PRIMARY KEY, title text, short_title text, kind text DEFAULT 'case-study', card_visual text DEFAULT 'auto', cover_id integer, featured integer DEFAULT false, parent_project_id integer)",
      "CREATE TABLE _projects_v (id integer PRIMARY KEY, version_title text, version_short_title text, version_kind text DEFAULT 'case-study', version_card_visual text DEFAULT 'auto', version_cover_id integer, version_featured integer DEFAULT false, version_parent_project_id integer)",
      "CREATE TABLE __new_projects (id integer PRIMARY KEY, title text)",
      "INSERT INTO projects (id, title) VALUES (1, 'Projet conservé')",
      "INSERT INTO _projects_v (id, version_title) VALUES (1, 'Version conservée')",
    ],
    "write",
  );
  return client;
};

test("le préflight détecte l'état intermédiaire observé sur le volume réel", async () => {
  const client = await createPartialRedesignDatabase();

  try {
    assert.deepEqual(await findPendingRedesignBridgeColumns(client), [
      { table: "projects", name: "listed_in_notes" },
      { table: "projects", name: "published_at" },
      { table: "projects", name: "reading_time" },
      { table: "_projects_v", name: "version_listed_in_notes" },
      { table: "_projects_v", name: "version_published_at" },
      { table: "_projects_v", name: "version_reading_time" },
    ]);
  } finally {
    client.close();
  }
});

test("le pont additif conserve les lignes et devient idempotent", async () => {
  const client = await createPartialRedesignDatabase();

  try {
    const pendingColumns = await findPendingRedesignBridgeColumns(client);
    await applyRedesignBridgeColumns(client, pendingColumns);

    assert.deepEqual(await findPendingRedesignBridgeColumns(client), []);

    const project = await client.execute(
      "SELECT title, listed_in_notes, published_at, reading_time FROM projects WHERE id = 1",
    );
    assert.deepEqual(project.rows[0], {
      title: "Projet conservé",
      listed_in_notes: 0,
      published_at: null,
      reading_time: 5,
    });

    const projectVersion = await client.execute(
      "SELECT version_title, version_listed_in_notes, version_published_at, version_reading_time FROM _projects_v WHERE id = 1",
    );
    assert.deepEqual(projectVersion.rows[0], {
      version_title: "Version conservée",
      version_listed_in_notes: 0,
      version_published_at: null,
      version_reading_time: 5,
    });
  } finally {
    client.close();
  }
});

test("une table de staging Drizzle connue et vide est nettoyée", async () => {
  const client = await createPartialRedesignDatabase();

  try {
    const stagingTables = await findStaleRedesignStagingTables(client);
    assert.deepEqual(stagingTables, ["__new_projects"]);

    await dropStaleRedesignStagingTables(client, stagingTables);
    assert.deepEqual(await findStaleRedesignStagingTables(client), []);

    const project = await client.execute(
      "SELECT title FROM projects WHERE id = 1",
    );
    assert.equal(project.rows[0]?.title, "Projet conservé");
  } finally {
    client.close();
  }
});

test("une table de staging inconnue est refusée", async () => {
  const client = createClient({ url: "file::memory:" });

  try {
    await client.execute(
      "CREATE TABLE __new_unexpected_content (id integer PRIMARY KEY)",
    );
    await assert.rejects(
      () => findStaleRedesignStagingTables(client),
      /Unexpected schema staging tables/,
    );
  } finally {
    client.close();
  }
});

test("la révision 7 prépare la séparation entre Thèmes et Notes", async () => {
  const client = createClient({ url: "file::memory:" });

  try {
    await client.batch(
      [
        "CREATE TABLE site_meta (id integer PRIMARY KEY, content_revision numeric DEFAULT 2)",
        "CREATE TABLE about (id integer PRIMARY KEY, intro text, section_title text)",
        "CREATE TABLE about_specialties (_order integer, _parent_id integer, id text, value text)",
        `CREATE TABLE projects (
          id integer PRIMARY KEY,
          title text,
          short_title text,
          slug text,
          category text,
          kind text,
          card_visual text,
          badge text,
          featured integer,
          listed_in_notes integer,
          published_at text,
          reading_time numeric,
          "order" numeric,
          created_at text,
          _status text
        )`,
        "INSERT INTO site_meta (id, content_revision) VALUES (1, 2)",
        "INSERT INTO about (id) VALUES (1)",
        `INSERT INTO projects (id, title, slug, badge, featured, listed_in_notes, "order", created_at, _status)
         VALUES (1, 'Ancien Homelab', 'zero-trust', 'archivé', 1, 1, 1, '2026-01-01', 'published')`,
        `INSERT INTO projects (id, title, slug, badge, featured, listed_in_notes, "order", created_at, _status)
         VALUES (2, 'Homelab', 'homelab', 'Bientôt la V2', 0, 0, 0, '2026-01-02', 'published')`,
        `INSERT INTO projects (id, title, slug, featured, listed_in_notes, "order", created_at, _status)
         VALUES (3, 'Simulation de crise temps réel', 'simulation-ba186', 1, 1, 2, '2026-01-03', 'published')`,
      ],
      "write",
    );

    assert.equal(await needsRedesignContentMigration(client), true);
    await applyRedesignContentMigration(client);
    await markRedesignContentMigrationComplete(client);
    assert.equal(await needsRedesignContentMigration(client), false);

    const homelab = await client.execute(
      "SELECT short_title, kind, card_visual, badge, featured, listed_in_notes, \"order\" FROM projects WHERE slug = 'homelab'",
    );
    assert.deepEqual(homelab.rows[0], {
      short_title: "Homelab",
      kind: "living-system",
      card_visual: "homelab",
      badge: null,
      featured: 1,
      listed_in_notes: 0,
      order: 1,
    });

    const legacy = await client.execute(
      "SELECT badge, featured, listed_in_notes, _status FROM projects WHERE slug = 'zero-trust'",
    );
    assert.deepEqual(legacy.rows[0], {
      badge: "À convertir en Note",
      featured: 0,
      listed_in_notes: 0,
      _status: "draft",
    });

    const simulation = await client.execute(
      "SELECT short_title, category, listed_in_notes FROM projects WHERE slug = 'simulation-ba186'",
    );
    assert.deepEqual(simulation.rows[0], {
      short_title: "Simulation",
      category: "simulation · ia",
      listed_in_notes: 0,
    });

    const revision = await client.execute(
      "SELECT content_revision FROM site_meta WHERE id = 1",
    );
    assert.equal(revision.rows[0]?.content_revision, 7);
  } finally {
    client.close();
  }
});

test("la présentation d'un projet devient une Note sans ses anciens blocs de layout", () => {
  const content = projectContentToNoteContent([
    { blockType: "project-header", id: "header" },
    { blockType: "section-heading", text: "Le problème", id: "heading" },
    {
      blockType: "code-block",
      language: "bash",
      code: "echo ok",
      id: "code",
    },
    { blockType: "project-nav", id: "nav" },
  ]);

  assert.equal(projectPresentationSlug("homelab"), "homelab-presentation");
  assert.deepEqual(content, [
    { blockType: "section-heading", text: "Le problème" },
    { blockType: "code-block", language: "bash", code: "echo ok" },
  ]);
});

test("l'ancienne fiche devient le thème Homelab si aucun canonique n'existe", async () => {
  const client = createClient({ url: "file::memory:" });

  try {
    await client.batch(
      [
        "CREATE TABLE site_meta (id integer PRIMARY KEY, content_revision numeric DEFAULT 2)",
        "CREATE TABLE about (id integer PRIMARY KEY, intro text, section_title text)",
        "CREATE TABLE about_specialties (_order integer, _parent_id integer, id text, value text)",
        `CREATE TABLE projects (
          id integer PRIMARY KEY,
          title text,
          short_title text,
          slug text,
          category text,
          kind text,
          card_visual text,
          badge text,
          featured integer,
          listed_in_notes integer,
          published_at text,
          reading_time numeric,
          "order" numeric,
          created_at text,
          _status text
        )`,
        "INSERT INTO site_meta (id, content_revision) VALUES (1, 2)",
        "INSERT INTO about (id) VALUES (1)",
        `INSERT INTO projects (id, title, slug, badge, featured, listed_in_notes, "order", created_at, _status)
         VALUES (1, 'Homelab : du bricolage au Zero Trust', 'zero-trust', 'legacy', 1, 1, 1, '2026-01-01', 'published')`,
      ],
      "write",
    );

    await applyRedesignContentMigration(client);
    assert.equal(await needsRedesignContentMigration(client), true);

    const project = await client.execute(
      "SELECT slug, title, short_title, badge, featured, listed_in_notes, _status FROM projects WHERE id = 1",
    );
    assert.deepEqual(project.rows[0], {
      slug: "homelab",
      title: "Homelab",
      short_title: "Homelab",
      badge: null,
      featured: 1,
      listed_in_notes: 0,
      _status: "published",
    });

    await markRedesignContentMigrationComplete(client);
    assert.equal(await needsRedesignContentMigration(client), false);
  } finally {
    client.close();
  }
});
