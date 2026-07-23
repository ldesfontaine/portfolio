import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import BlockRenderer, { type RenderBlock } from "@/components/BlockRenderer";
import RelatedThemes from "@/components/RelatedThemes";
import { getPostBySlug, getPostPreviewBySlug } from "@/lib/posts";

export const dynamic = "force-dynamic";

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
}): Promise<Metadata> {
  const { preview } = await searchParams;
  if (preview === "1") {
    return {
      title: "Aperçu d’une Note",
      robots: { index: false, follow: false },
    };
  }

  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};
  return { title: post.title, description: post.excerpt };
}

export default async function NotePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const [{ slug }, { preview }] = await Promise.all([params, searchParams]);
  const previewMode = preview === "1";
  const post = previewMode
    ? await getPostPreviewBySlug(slug, new Headers(await headers()))
    : await getPostBySlug(slug);
  if (!post) notFound();

  return (
    <div className="reading-page article-page">
      <article className="article-shell">
        {previewMode ? (
          <div className="draft-preview-banner" role="status">
            Aperçu du brouillon — visible uniquement avec une session Payload
            active.
          </div>
        ) : null}
        <Link href="/notes" className="article-back">
          ← Toutes les Notes
        </Link>
        <header className="article-header">
          <div className="article-meta">
            <span className="article-type">Note</span>
            <time dateTime={post.publishedAt}>
              {formatDate(post.publishedAt)}
            </time>
            <span>{post.readingTime} min de lecture</span>
          </div>
          <h1>{post.title}</h1>
          <p>{post.excerpt}</p>
          {post.tags.length > 0 ? (
            <div className="article-tags">
              {post.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          ) : null}
        </header>
        {post.cover ? (
          <Image
            src={post.cover.url}
            alt={post.cover.alt || ""}
            width={post.cover.width}
            height={post.cover.height}
            className="article-cover"
            priority
          />
        ) : null}
        <div className="article-content">
          <BlockRenderer blocks={post.content as RenderBlock[]} />
        </div>
        <RelatedThemes themes={post.relatedThemes} />
      </article>
    </div>
  );
}
