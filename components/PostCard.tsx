import Link from "next/link";

import type { EditorialEntry } from "@/lib/types";

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

export default function PostCard({ post }: { post: EditorialEntry }) {
  return (
    <Link href={post.href} className="post-card">
      <div className="post-card-meta">
        <span>{post.label}</span>
        <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
        <span>{post.readingTime} min</span>
      </div>
      <h2>{post.title}</h2>
      <p>{post.excerpt}</p>
      <div className="post-card-bottom">
        <span>
          {post.relatedThemes.length > 0
            ? `Thème · ${post.relatedThemes.map((theme) => theme.title).join(" · ")}`
            : post.tags.join(" · ")}
        </span>
        <b aria-hidden="true">↗</b>
      </div>
    </Link>
  );
}
