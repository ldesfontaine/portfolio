import type { Metadata } from "next";

import NotesExplorer from "@/components/NotesExplorer";
import { getEditorialEntries } from "@/lib/posts";
import { getThemes } from "@/lib/projects";

export const metadata: Metadata = {
  title: "Notes",
  description: "Notes techniques et retours d’expérience de Lucas Desfontaine.",
};

export const dynamic = "force-dynamic";

export default async function NotesPage({
  searchParams,
}: {
  searchParams: Promise<{ theme?: string }>;
}) {
  const [{ theme }, notes, themes] = await Promise.all([
    searchParams,
    getEditorialEntries(),
    getThemes(),
  ]);

  return (
    <div className="reading-page notes-index">
      <header className="reading-header site-container reading-container">
        <p className="eyebrow">NOTES</p>
        <h1>Une idée, une notion ou un choix à la fois.</h1>
        <p>
          Une Note peut être indépendante. Les thèmes servent uniquement à
          regrouper celles qui parlent d’un même sujet, comme Homelab.
        </p>
      </header>
      <main className="site-container notes-page-container">
        <NotesExplorer notes={notes} themes={themes} initialTheme={theme} />
      </main>
    </div>
  );
}
