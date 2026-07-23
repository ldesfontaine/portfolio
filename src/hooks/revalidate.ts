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
    // Hooks can fire from standalone bootstrap or maintenance scripts.
  }
};

export const revalidateThemes: CollectionAfterChangeHook = ({
  doc,
  operation,
}) => {
  if (operation !== "create" && operation !== "update") return doc;
  safeRevalidate("/notes");
  safeRevalidate("/");
  return doc;
};

export const revalidatePosts: CollectionAfterChangeHook = ({
  doc,
  operation,
}) => {
  if (operation !== "create" && operation !== "update") return doc;
  if (typeof doc.slug === "string" && doc.slug.length > 0) {
    safeRevalidate(`/notes/${doc.slug}`);
  }
  safeRevalidate("/notes");
  safeRevalidate("/");
  return doc;
};

export const revalidateTimeline: CollectionAfterChangeHook = ({ doc }) => {
  safeRevalidate("/profil");
  safeRevalidate("/");
  return doc;
};

export const revalidateCertifications: CollectionAfterChangeHook = ({ doc }) => {
  safeRevalidate("/profil");
  return doc;
};

export const revalidateSiteMeta: GlobalAfterChangeHook = ({ doc }) => {
  safeRevalidate("/", "layout");
  return doc;
};

export const revalidateAbout: GlobalAfterChangeHook = ({ doc }) => {
  safeRevalidate("/profil");
  return doc;
};
