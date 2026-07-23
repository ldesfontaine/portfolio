import Link from "next/link";

import type { EditorialEntry } from "@/lib/types";

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

export default function HomeNoteCard({ note }: { note: EditorialEntry }) {
  return (
    <Link href={note.href} className="home-note-card">
      <div className="home-note-card-meta">
        <span>Note</span>
        <time dateTime={note.publishedAt}>{formatDate(note.publishedAt)}</time>
      </div>
      <h3>{note.title}</h3>
      <p>{note.excerpt}</p>
      <div className="home-note-card-footer">
        <span>{note.tags.slice(0, 3).join(" · ")}</span>
        <b>
          {note.readingTime} min <i aria-hidden="true">↗</i>
        </b>
      </div>
    </Link>
  );
}
