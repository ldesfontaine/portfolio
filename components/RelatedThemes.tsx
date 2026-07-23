import Link from "next/link";

import type { ThemeLink } from "@/lib/types";

export default function RelatedThemes({ themes }: { themes: ThemeLink[] }) {
  if (themes.length === 0) return null;

  return (
    <aside className="article-relations" aria-labelledby="themes-title">
      <p>THÈMES</p>
      <h2 id="themes-title">Retrouver les Notes du même thème.</h2>
      <div>
        {themes.map((theme) => (
          <Link key={theme.slug} href={`/notes?theme=${theme.slug}`}>
            <span>Thème</span>
            <strong>{theme.title}</strong>
            <b aria-hidden="true">→</b>
          </Link>
        ))}
      </div>
    </aside>
  );
}
