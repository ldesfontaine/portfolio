import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProjects, getProjectBySlug } from "@/lib/projects";
import BlockRenderer, {
  hasStructuralBlocks,
  type RenderBlock,
} from "@/components/BlockRenderer";

export const dynamic = "force-dynamic";

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

const AUTO_SCAFFOLD_PREFIX: RenderBlock[] = [
  { blockType: "project-header", id: "auto-header", showBackLink: true },
  { blockType: "project-meta", id: "auto-meta" },
];

const AUTO_SCAFFOLD_SUFFIX: RenderBlock[] = [
  { blockType: "project-tags", id: "auto-tags" },
  { blockType: "project-nav", id: "auto-nav" },
];

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
  const next = idx >= 0 && idx < all.length - 1 ? all[idx + 1] : undefined;

  const content = (project.content ?? []) as RenderBlock[];
  const blocks = hasStructuralBlocks(content)
    ? content
    : [...AUTO_SCAFFOLD_PREFIX, ...content, ...AUTO_SCAFFOLD_SUFFIX];

  return (
    <article className="mx-auto max-w-[680px] px-5 flex flex-col">
      <BlockRenderer
        blocks={blocks}
        project={project}
        prev={prev}
        next={next}
      />
    </article>
  );
}
