import { revalidatePath } from "next/cache";
import type { CollectionAfterChangeHook, GlobalAfterChangeHook } from "payload";

const safeRevalidate = (
  path: string,
  type?: Parameters<typeof revalidatePath>[1],
) => {
  try {
    revalidatePath(path, type);
  } catch {
    // revalidatePath requires a Next.js request context; ignore failures when
    // hooks fire from standalone scripts (seed, migrate, etc.).
  }
};

export const revalidateProjects: CollectionAfterChangeHook = ({
  doc,
  operation,
}) => {
  if (operation !== "create" && operation !== "update") return doc;
  if (typeof doc.slug === "string" && doc.slug.length > 0) {
    safeRevalidate(`/projets/${doc.slug}`);
  }
  safeRevalidate("/projets");
  safeRevalidate("/");
  return doc;
};

export const revalidateTimeline: CollectionAfterChangeHook = ({ doc }) => {
  safeRevalidate("/parcours");
  safeRevalidate("/");
  return doc;
};

export const revalidateCertifications: CollectionAfterChangeHook = ({ doc }) => {
  safeRevalidate("/parcours");
  safeRevalidate("/a-propos");
  return doc;
};

export const revalidateSiteMeta: GlobalAfterChangeHook = ({ doc }) => {
  safeRevalidate("/", "layout");
  return doc;
};

export const revalidateAbout: GlobalAfterChangeHook = ({ doc }) => {
  safeRevalidate("/a-propos");
  return doc;
};
