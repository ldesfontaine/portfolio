import type { Media, Post } from "@/payload-types";
import type { EditorialEntry, MediaAsset, ThemeLink } from "./types";
import { getPayloadClient } from "./payload";
import { toThemeLink } from "./projects";

const payloadPromise = getPayloadClient();

const safe = async <T>(fn: () => Promise<T>, fallback: T): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (process.env.NEXT_PHASE === "phase-production-build") return fallback;
    throw error;
  }
};

const toCover = (
  field: Media | number | null | undefined,
): MediaAsset | undefined => {
  if (!field || typeof field === "number" || !field.url) return undefined;
  return {
    url: field.url,
    alt: field.alt ?? "",
    width: field.width ?? 1200,
    height: field.height ?? 720,
  };
};

const toMeta = (post: Post): EditorialEntry => ({
  slug: post.slug ?? String(post.id),
  href: `/notes/${post.slug ?? String(post.id)}`,
  source: "note",
  label: "Note",
  title: post.title,
  excerpt: post.excerpt,
  publishedAt: post.publishedAt,
  readingTime: post.readingTime,
  tags: (post.tags ?? []).map((tag) => tag.value),
  relatedThemes: (post.relatedProjects ?? [])
    .map(toThemeLink)
    .filter((theme): theme is ThemeLink => theme !== undefined),
  cover: toCover(post.cover),
});

export type PostDetail = EditorialEntry & {
  content: NonNullable<Post["content"]>;
};

async function getPosts(): Promise<EditorialEntry[]> {
  return safe(async () => {
    const payload = await payloadPromise;
    const { docs } = await payload.find({
      collection: "posts",
      where: { _status: { equals: "published" } },
      sort: "-publishedAt",
      depth: 1,
      limit: 100,
    });
    return docs.map(toMeta);
  }, []);
}

export async function getEditorialEntries(): Promise<EditorialEntry[]> {
  return getPosts();
}

export async function getPostBySlug(
  slug: string,
): Promise<PostDetail | undefined> {
  return safe<PostDetail | undefined>(async () => {
    const payload = await payloadPromise;
    const { docs } = await payload.find({
      collection: "posts",
      where: {
        and: [{ slug: { equals: slug } }, { _status: { equals: "published" } }],
      },
      depth: 2,
      limit: 1,
    });
    const post = docs[0];
    if (!post) return undefined;
    return { ...toMeta(post), content: post.content ?? [] };
  }, undefined);
}

export async function getPostPreviewBySlug(
  slug: string,
  requestHeaders: Headers,
): Promise<PostDetail | undefined> {
  const payload = await payloadPromise;
  const { user } = await payload.auth({ headers: requestHeaders });

  if (!user || user.collection !== "users") return undefined;

  const { docs } = await payload.find({
    collection: "posts",
    draft: true,
    where: { slug: { equals: slug } },
    depth: 2,
    limit: 1,
    overrideAccess: false,
    user,
  });
  const post = docs[0];
  if (!post) return undefined;

  return { ...toMeta(post), content: post.content ?? [] };
}
