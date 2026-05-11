import { revalidatePath } from "next/cache";
import type { CollectionAfterChangeHook, GlobalAfterChangeHook } from "payload";

export const revalidateProjects: CollectionAfterChangeHook = ({
  doc,
  operation,
}) => {
  if (operation !== "create" && operation !== "update") return doc;
  if (typeof doc.slug === "string" && doc.slug.length > 0) {
    revalidatePath(`/projets/${doc.slug}`);
  }
  revalidatePath("/projets");
  revalidatePath("/");
  return doc;
};

export const revalidateTimeline: CollectionAfterChangeHook = ({ doc }) => {
  revalidatePath("/parcours");
  revalidatePath("/");
  return doc;
};

export const revalidateCertifications: CollectionAfterChangeHook = ({ doc }) => {
  revalidatePath("/parcours");
  revalidatePath("/a-propos");
  return doc;
};

export const revalidateSiteMeta: GlobalAfterChangeHook = ({ doc }) => {
  revalidatePath("/", "layout");
  return doc;
};

export const revalidateAbout: GlobalAfterChangeHook = ({ doc }) => {
  revalidatePath("/a-propos");
  return doc;
};
