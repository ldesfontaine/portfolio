import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { ProjectMeta } from "./types";

const projectsDir = path.join(process.cwd(), "legacy/content/projects");

export function getProjects(): (ProjectMeta & { content: string })[] {
  const files = fs.readdirSync(projectsDir).filter((f) => f.endsWith(".mdx"));

  return files
    .map((file) => {
      const raw = fs.readFileSync(path.join(projectsDir, file), "utf-8");
      const { data, content } = matter(raw);
      return {
        ...(data as ProjectMeta),
        slug: file.replace(/\.mdx$/, ""),
        content,
      };
    })
    .sort((a, b) => a.order - b.order);
}

export function getProjectBySlug(
  slug: string
): (ProjectMeta & { content: string }) | undefined {
  const filePath = path.join(projectsDir, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return undefined;

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  return { ...(data as ProjectMeta), slug, content };
}

export function getProjectSlugs(): string[] {
  return fs
    .readdirSync(projectsDir)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx$/, ""));
}
