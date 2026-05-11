import Link from "next/link";
import { siteMeta } from "@/content/meta";
import { timeline } from "@/content/timeline";
import { getProjects } from "@/lib/projects";
import StatusBadge from "@/components/StatusBadge";
import ProjectCard from "@/components/ProjectCard";
import Timeline from "@/components/Timeline";

export default function Home() {
  const projects = getProjects();

  return (
    <>
      {/* Hero */}
      <div className="mx-auto max-w-[680px] px-5">
        <section className="flex flex-col gap-5">
          <div><StatusBadge text={siteMeta.availability} /></div>
          <h1 className="text-[28px] font-medium sm:text-[42px]">
            <span style={{ color: "var(--n900)" }}>Lucas</span>{" "}
            <span style={{ color: "var(--accent)" }}>Desfontaine</span>
          </h1>
          <p
            className="font-mono text-sm"
            style={{ color: "var(--n500)" }}
          >
            {siteMeta.title}
          </p>
          <p
            className="max-w-[520px] text-base"
            style={{ color: "var(--n500)" }}
          >
            {siteMeta.description}
          </p>
          <div className="flex items-center gap-3">
            <Link href="/projets" className="btn-primary group">
              Voir mes projets
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="btn-arrow"
              >
                <path d="M6 3l5 5-5 5" />
              </svg>
            </Link>
            <a href="/cv.pdf" className="btn-ghost">
              CV
            </a>
          </div>
        </section>
      </div>

      {/* Projects + Timeline — 2 colonnes en lg */}
      <div className="mx-auto mt-16 max-w-[1200px] px-5">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-[3fr_2fr]">
          {/* Projects */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span
                className="font-mono text-[13px] uppercase"
                style={{ color: "var(--accent)" }}
              >
                // projets
              </span>
              <Link
                href="/projets"
                className="font-mono text-xs transition-colors duration-200 hover:!text-[var(--accent)]"
                style={{ color: "var(--n400)" }}
              >
                tout voir →
              </Link>
            </div>
            <div
              className="overflow-hidden"
              style={{
                background: "var(--n100)",
                borderRadius: "10px",
                border: "0.5px solid var(--n100)",
              }}
            >
              {projects.map((project, i) => (
                <div
                  key={project.slug}
                  style={{
                    borderTop: i > 0 ? "1px solid var(--n100)" : undefined,
                  }}
                >
                  <ProjectCard
                    project={project}
                    href={`/projets/${project.slug}`}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Timeline */}
          <section className="flex flex-col gap-4">
            <span
              className="font-mono text-[13px] uppercase"
              style={{ color: "var(--accent)" }}
            >
              // parcours
            </span>
            <Timeline items={timeline.slice(0, 4)} />
            <Link
              href="/parcours"
              className="font-mono text-xs transition-colors duration-200 hover:!text-[var(--accent)]"
              style={{ color: "var(--n400)" }}
            >
              voir tout le parcours →
            </Link>
          </section>
        </div>
      </div>
    </>
  );
}
