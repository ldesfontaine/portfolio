import type { Metadata } from "next";
import { getProjects } from "@/lib/projects";
import ProjectCard from "@/components/ProjectCard";

export const metadata: Metadata = {
  title: "Projets",
  description: "Tous mes projets DevSecOps & sécurité des infrastructures.",
};

export default function ProjetsPage() {
  const projects = getProjects();

  return (
    <div className="mx-auto max-w-[680px] px-5 flex flex-col gap-4">
      <span
        className="font-mono text-[13px] uppercase"
        style={{ color: "var(--accent)" }}
      >
        // tous les projets
      </span>
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
    </div>
  );
}
