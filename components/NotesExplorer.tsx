"use client";

import { useMemo, useState } from "react";

import type { EditorialEntry, ThemeLink } from "@/lib/types";
import PostCard from "./PostCard";

const ALL_NOTES = "all";
const INDEPENDENT_NOTES = "independent";

const countForTheme = (notes: EditorialEntry[], slug: string) =>
  notes.filter((note) =>
    note.relatedThemes.some((theme) => theme.slug === slug),
  ).length;

const isKnownFilter = (value: string, themes: ThemeLink[]) =>
  value === ALL_NOTES ||
  value === INDEPENDENT_NOTES ||
  themes.some((theme) => theme.slug === value);

const formatNoteCount = (count: number) =>
  `${count} ${count > 1 ? "Notes" : "Note"}`;

export default function NotesExplorer({
  notes,
  themes,
  initialTheme,
}: {
  notes: EditorialEntry[];
  themes: ThemeLink[];
  initialTheme?: string;
}) {
  const initialFilter =
    initialTheme && isKnownFilter(initialTheme, themes)
      ? initialTheme
      : ALL_NOTES;
  const [activeFilter, setActiveFilter] = useState(initialFilter);

  const visibleNotes = useMemo(() => {
    if (activeFilter === ALL_NOTES) return notes;
    if (activeFilter === INDEPENDENT_NOTES) {
      return notes.filter((note) => note.relatedThemes.length === 0);
    }
    return notes.filter((note) =>
      note.relatedThemes.some((theme) => theme.slug === activeFilter),
    );
  }, [activeFilter, notes]);

  const filters = [
    { value: ALL_NOTES, label: "Toutes", count: notes.length },
    ...themes.map((theme) => ({
      value: theme.slug,
      label: theme.title,
      count: countForTheme(notes, theme.slug),
    })),
    {
      value: INDEPENDENT_NOTES,
      label: "Sans thème",
      count: notes.filter((note) => note.relatedThemes.length === 0).length,
    },
  ].filter((filter) => filter.count > 0);

  return (
    <div className="notes-explorer">
      <aside className="notes-filter-panel" aria-label="Filtrer les Notes">
        <p>PARCOURIR</p>
        <div className="notes-filters">
          {filters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              className={
                activeFilter === filter.value ? "is-active" : undefined
              }
              aria-pressed={activeFilter === filter.value}
              aria-controls="filtered-notes"
              onClick={() => setActiveFilter(filter.value)}
            >
              <span>{filter.label}</span>
              <small>{formatNoteCount(filter.count)}</small>
            </button>
          ))}
        </div>
      </aside>

      <div id="filtered-notes" className="post-list" aria-live="polite">
        {visibleNotes.length > 0 ? (
          visibleNotes.map((note) => <PostCard key={note.slug} post={note} />)
        ) : (
          <p className="empty-state">Aucune Note publiée dans ce thème.</p>
        )}
      </div>
    </div>
  );
}
