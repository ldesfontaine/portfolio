import Link from "next/link";

import HeroFocus from "@/components/HeroFocus";
import HomeNoteCard from "@/components/HomeNoteCard";
import { getSiteMeta } from "@/lib/content";
import { getEditorialEntries } from "@/lib/posts";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

export default async function Home() {
  const [siteMeta, notes] = await Promise.all([
    getSiteMeta(),
    getEditorialEntries(),
  ]);

  return (
    <div className="explore-page">
      <section className="home-hero site-container">
        <div className="home-hero-copy">
          <p className="eyebrow">{siteMeta.hero.eyebrow}</p>
          <h1>{siteMeta.hero.title}</h1>
          <p className="home-hero-description">{siteMeta.hero.description}</p>
        </div>
        <HeroFocus />
      </section>

      <section
        className="home-notes reading-page"
        aria-labelledby="home-notes-title"
      >
        <div className="home-notes-inner site-container">
          <div className="section-heading-row">
            <h2 id="home-notes-title">Notes</h2>
            <span className="section-rule" />
            <Link href="/notes">
              Toutes les Notes <span aria-hidden="true">→</span>
            </Link>
          </div>
          {notes.length > 0 ? (
            <div className="home-notes-grid">
              {notes.slice(0, 3).map((note) => (
                <HomeNoteCard key={note.slug} note={note} />
              ))}
            </div>
          ) : (
            <p className="empty-state">Les premières Notes apparaîtront ici.</p>
          )}
        </div>
      </section>
    </div>
  );
}
