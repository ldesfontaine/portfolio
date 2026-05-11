import { getPayload } from "payload";

import config from "@payload-config";
import type { Project } from "@/payload-types";
import type { ProjectMeta } from "./types";

const payloadPromise = getPayload({ config });

const toMeta = (p: Project): ProjectMeta => ({
  slug: p.slug ?? String(p.id),
  title: p.title,
  category: p.category,
  description: p.description,
  stack: (p.stack ?? []).map((s) => s.value),
  github: p.github ?? undefined,
  period: p.period,
  type: p.type,
  badge: p.badge ?? undefined,
  order: p.order,
});

export type ProjectDetail = ProjectMeta & {
  content: NonNullable<Project["content"]>;
};

export async function getProjects(): Promise<ProjectMeta[]> {
  const payload = await payloadPromise;
  const { docs } = await payload.find({
    collection: "projects",
    where: { _status: { equals: "published" } },
    sort: "order",
    depth: 2,
    limit: 100,
  });
  return docs.map(toMeta);
}

export async function getProjectBySlug(
  slug: string,
): Promise<ProjectDetail | undefined> {
  const payload = await payloadPromise;
  const { docs } = await payload.find({
    collection: "projects",
    where: {
      and: [
        { slug: { equals: slug } },
        { _status: { equals: "published" } },
      ],
    },
    depth: 2,
    limit: 1,
  });
  const doc = docs[0];
  if (!doc) return undefined;
  return {
    ...toMeta(doc),
    content: doc.content ?? [],
  };
}

export async function getProjectSlugs(): Promise<string[]> {
  const payload = await payloadPromise;
  const { docs } = await payload.find({
    collection: "projects",
    where: { _status: { equals: "published" } },
    depth: 0,
    limit: 100,
  });
  return docs
    .map((d) => d.slug)
    .filter((s): s is string => typeof s === "string" && s.length > 0);
}
