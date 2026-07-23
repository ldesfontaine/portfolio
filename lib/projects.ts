import type { Project } from "@/payload-types";
import type { ThemeLink } from "./types";
import { visibleThemesWhere } from "@/src/editorial/themePolicy";
import { getPayloadClient } from "./payload";

const payloadPromise = getPayloadClient();

export const toThemeLink = (
  field: Project | number | null | undefined,
): ThemeLink | undefined => {
  if (!field || typeof field === "number" || !field.slug) return undefined;
  return {
    slug: field.slug,
    title: field.shortTitle ?? field.title,
  };
};

const safe = async <T>(fn: () => Promise<T>, fallback: T): Promise<T> => {
  try {
    return await fn();
  } catch (err) {
    if (process.env.NEXT_PHASE === "phase-production-build") {
      return fallback;
    }
    throw err;
  }
};

export async function getThemes(): Promise<ThemeLink[]> {
  return safe(async () => {
    const payload = await payloadPromise;
    const { docs } = await payload.find({
      collection: "projects",
      where: {
        and: [
          { _status: { equals: "published" } },
          visibleThemesWhere(),
        ],
      },
      sort: "order",
      depth: 2,
      limit: 100,
    });
    return docs
      .map(toThemeLink)
      .filter((theme): theme is ThemeLink => theme !== undefined);
  }, []);
}
