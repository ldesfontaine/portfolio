import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjects, getProjectBySlug, getProjectSlugs } from "@/lib/projects";
import ProjectNav from "@/components/ProjectNav";
import BlockRenderer from "@/components/BlockRenderer";

export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    const slugs = await getProjectSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    // The database is not reachable at build time (e.g. in a fresh Docker
    // image where the volume is not yet mounted). Defer to runtime: the
    // first request to a slug renders it on-demand and ISR caches it.
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return {};
  return {
    title: project.title,
    description: project.description,
  };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  const all = await getProjects();
  const idx = all.findIndex((p) => p.slug === slug);
  const prev = idx > 0 ? all[idx - 1] : undefined;
  const next = idx < all.length - 1 ? all[idx + 1] : undefined;

  const metaItems = [
    { label: "Type", value: project.type },
    { label: "Période", value: project.period },
    { label: "Stack", value: project.stack.join(", ") },
    ...(project.github
      ? [{ label: "GitHub", value: project.github, isLink: true }]
      : []),
  ];

  return (
    <article className="mx-auto max-w-[680px] px-5 flex flex-col">
      {/* Back */}
      <Link
        href="/projets"
        className="mb-8 inline-flex items-center gap-1 font-mono text-xs transition-colors duration-200"
        style={{ color: "var(--n400)" }}
      >
        ← retour aux projets
      </Link>

      {/* Header */}
      <span
        className="font-mono text-xs uppercase"
        style={{ color: "var(--accent)" }}
      >
        {project.category}
      </span>
      <h1
        className="mt-2 text-[34px] font-medium"
        style={{ color: "var(--n900)" }}
      >
        {project.title}
      </h1>
      <p
        className="mt-2 max-w-[560px] text-[17px]"
        style={{ color: "var(--n500)" }}
      >
        {project.description}
      </p>

      {/* Meta bar */}
      <div
        className="my-8 grid grid-cols-2 gap-x-6 gap-y-4 py-4 sm:grid-cols-[auto_auto_1fr_auto]"
        style={{
          borderTop: "0.5px solid var(--n100)",
          borderBottom: "0.5px solid var(--n100)",
        }}
      >
        {metaItems.map((m) => (
          <div key={m.label} className="flex flex-col gap-1">
            <span
              className="font-mono text-[10.5px] uppercase"
              style={{ color: "var(--n300)" }}
            >
              {m.label}
            </span>
            {"isLink" in m && m.isLink ? (
              <a
                href={m.value}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13.5px] font-medium transition-colors duration-200"
                style={{ color: "var(--accent)" }}
              >
                Voir le repo
              </a>
            ) : (
              <span
                className="text-[13.5px] font-medium"
                style={{ color: "var(--n700)" }}
              >
                {m.value}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Content blocks */}
      <div>
        <BlockRenderer blocks={project.content} />
      </div>

      {/* Tags */}
      <div className="mt-10 flex flex-wrap gap-1.5">
        {project.stack.map((tag) => (
          <span
            key={tag}
            className="rounded px-2 py-0.5 font-mono text-[11px]"
            style={{
              color: "var(--n500)",
              background: "var(--n50)",
              border: "0.5px solid var(--n100)",
            }}
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Nav */}
      <div className="mt-8">
        <ProjectNav prev={prev} next={next} />
      </div>
    </article>
  );
}
