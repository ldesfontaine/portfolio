import type { Payload } from "payload";

import type { Post, Project } from "../payload-types";
import { ALLOW_ARCHIVED_THEME_RELATIONS } from "../src/editorial/themePolicy.ts";

const LEGACY_PROJECT_BLOCKS = new Set([
  "project-header",
  "project-meta",
  "project-tags",
  "project-nav",
]);

export const projectPresentationSlug = (projectSlug: string) =>
  `${projectSlug}-presentation`;

export const projectContentToNoteContent = (
  content: Project["content"],
): NonNullable<Post["content"]> =>
  (content ?? [])
    .filter((block) => !LEGACY_PROJECT_BLOCKS.has(block.blockType))
    .map((block) =>
      JSON.parse(
        JSON.stringify(block, (key, value) =>
          key === "id" && typeof value === "string" ? undefined : value,
        ),
      ),
    ) as NonNullable<Post["content"]>;

export type ProjectNotesMigrationResult = {
  created: number;
  existing: number;
  skipped: number;
};

/**
 * Copies each published project's legacy write-up to one canonical Note.
 *
 * The source content is deliberately kept for rollback. Existing Notes are
 * never overwritten: if a previous boot created one before a later failure,
 * the retry is idempotent and preserves any manual editorial changes.
 */
export async function migrateProjectWriteupsToNotes(
  payload: Payload,
): Promise<ProjectNotesMigrationResult> {
  const result: ProjectNotesMigrationResult = {
    created: 0,
    existing: 0,
    skipped: 0,
  };
  const { docs: projects } = await payload.find({
    collection: "projects",
    where: { _status: { equals: "published" } },
    depth: 0,
    limit: 100,
    overrideAccess: true,
  });

  for (const project of projects) {
    if (!project.slug) {
      result.skipped += 1;
      continue;
    }

    const content = projectContentToNoteContent(project.content);
    if (content.length === 0) {
      result.skipped += 1;
      continue;
    }

    const slug = projectPresentationSlug(project.slug);
    const existing = await payload.find({
      collection: "posts",
      where: { slug: { equals: slug } },
      depth: 0,
      limit: 1,
      overrideAccess: true,
    });
    if (existing.docs.length > 0) {
      result.existing += 1;
      continue;
    }

    const cover =
      typeof project.cover === "number" ? project.cover : project.cover?.id;
    await payload.create({
      collection: "posts",
      draft: false,
      overrideAccess: true,
      context: { [ALLOW_ARCHIVED_THEME_RELATIONS]: true },
      data: {
        title: `Présentation — ${project.shortTitle ?? project.title}`,
        slug,
        excerpt: project.description,
        publishedAt: project.publishedAt ?? project.createdAt,
        readingTime: project.readingTime ?? 5,
        cover,
        tags: (project.stack ?? []).slice(0, 5).map(({ value }) => ({ value })),
        relatedProjects: [project.id],
        content,
        _status: "published",
      },
    });
    result.created += 1;
  }

  return result;
}
