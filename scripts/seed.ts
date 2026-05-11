/* eslint-disable no-console */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import matter from "gray-matter";
import { getPayload } from "payload";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkMdx from "remark-mdx";
import type {
  Code as MdastCode,
  Heading as MdastHeading,
  InlineCode as MdastInlineCode,
  Paragraph as MdastParagraph,
  PhrasingContent,
  Root as MdastRoot,
  RootContent,
} from "mdast";

import config from "../payload.config";
import { siteMeta } from "../legacy/content/meta";
import { aboutStory, quickInfo } from "../legacy/content/about";
import { timeline } from "../legacy/content/timeline";
import { certifications } from "../legacy/content/certifications";

// ---------- paths ----------
const here = path.dirname(fileURLToPath(import.meta.url));
const projectsDir = path.resolve(here, "../legacy/content/projects");

// ---------- mdast -> Lexical paragraph ----------
const TEXT_FORMAT_BOLD = 1;
const TEXT_FORMAT_ITALIC = 2;
const TEXT_FORMAT_CODE = 16;

type LexicalText = {
  type: "text";
  text: string;
  format: number;
  detail: 0;
  mode: "normal";
  style: "";
  version: 1;
};

type LexicalParagraph = {
  type: "paragraph";
  children: LexicalText[];
  direction: "ltr" | null;
  format: "";
  indent: 0;
  textFormat: 0;
  textStyle: "";
  version: 1;
};

type LexicalRoot = {
  root: {
    type: "root";
    children: LexicalParagraph[];
    direction: "ltr" | null;
    format: "";
    indent: 0;
    version: 1;
  };
};

const warnings: string[] = [];

const mkText = (text: string, format: number): LexicalText => ({
  type: "text",
  text,
  format,
  detail: 0,
  mode: "normal",
  style: "",
  version: 1,
});

const phrasingToLexicalText = (
  nodes: PhrasingContent[],
  inheritedFormat = 0,
  context = "<unknown>",
): LexicalText[] => {
  const out: LexicalText[] = [];
  for (const n of nodes) {
    switch (n.type) {
      case "text":
        out.push(mkText(n.value, inheritedFormat));
        break;
      case "strong":
        out.push(
          ...phrasingToLexicalText(n.children, inheritedFormat | TEXT_FORMAT_BOLD, context),
        );
        break;
      case "emphasis":
        out.push(
          ...phrasingToLexicalText(n.children, inheritedFormat | TEXT_FORMAT_ITALIC, context),
        );
        break;
      case "inlineCode":
        out.push(mkText((n as MdastInlineCode).value, inheritedFormat | TEXT_FORMAT_CODE));
        break;
      case "break":
        out.push(mkText("\n", inheritedFormat));
        break;
      default:
        warnings.push(`Ignored inline mdast node type '${n.type}' in ${context}`);
    }
  }
  return out;
};

const mkParagraph = (children: LexicalText[]): LexicalParagraph => ({
  type: "paragraph",
  children,
  direction: "ltr",
  format: "",
  indent: 0,
  textFormat: 0,
  textStyle: "",
  version: 1,
});

const mkRoot = (paragraphs: LexicalParagraph[]): LexicalRoot => ({
  root: {
    type: "root",
    children: paragraphs,
    direction: "ltr",
    format: "",
    indent: 0,
    version: 1,
  },
});

const paragraphMdastToLexical = (
  node: MdastParagraph,
  context: string,
): LexicalRoot => mkRoot([mkParagraph(phrasingToLexicalText(node.children, 0, context))]);

const stringToLexical = (text: string): LexicalRoot =>
  mkRoot([mkParagraph([mkText(text, 0)])]);

// ---------- mdast -> project blocks ----------
type CodeLang =
  | "bash"
  | "ts"
  | "tsx"
  | "go"
  | "yaml"
  | "dockerfile"
  | "sh"
  | "json"
  | "python";

const KNOWN_LANGS = new Set<CodeLang>([
  "bash",
  "ts",
  "tsx",
  "go",
  "yaml",
  "dockerfile",
  "sh",
  "json",
  "python",
]);

const toLang = (raw: string | null | undefined): CodeLang => {
  const lower = (raw ?? "bash").toLowerCase();
  return KNOWN_LANGS.has(lower as CodeLang) ? (lower as CodeLang) : "bash";
};

const headingText = (h: MdastHeading): string =>
  h.children
    .map((c) => ("value" in c ? c.value : ""))
    .join("")
    .trim();

type ProjectBlock =
  | { blockType: "section-heading"; text: string }
  | { blockType: "paragraph"; text: LexicalRoot }
  | {
      blockType: "code-block";
      language: CodeLang;
      code: string;
      filename?: string;
    }
  | { blockType: "highlight"; content: LexicalRoot }
  | {
      blockType: "architecture-diagram";
      data:
        | string
        | number
        | boolean
        | unknown[]
        | { [k: string]: unknown }
        | null;
    };

const mdxAttrsToProps = (
  attrs: Array<{ type: string; name?: string; value?: unknown }>,
): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  for (const a of attrs) {
    if (a.type !== "mdxJsxAttribute" || !a.name) continue;
    if (typeof a.value === "string") {
      out[a.name] = a.value;
    } else if (a.value && typeof a.value === "object" && "value" in a.value) {
      const expr = (a.value as { value: unknown }).value;
      if (typeof expr === "string") {
        try {
          out[a.name] = JSON.parse(expr);
        } catch {
          out[a.name] = expr;
        }
      }
    }
  }
  return out;
};

const mdastToProjectBlocks = (
  tree: MdastRoot,
  projectSlug: string,
): ProjectBlock[] => {
  const blocks: ProjectBlock[] = [];
  for (const node of tree.children as RootContent[]) {
    switch (node.type) {
      case "heading": {
        if (node.depth === 2) {
          blocks.push({
            blockType: "section-heading",
            text: headingText(node),
          });
        } else {
          warnings.push(
            `Ignored mdast heading depth ${node.depth} in project '${projectSlug}'`,
          );
        }
        break;
      }
      case "paragraph":
        blocks.push({
          blockType: "paragraph",
          text: paragraphMdastToLexical(node, `project '${projectSlug}'`),
        });
        break;
      case "code": {
        const codeNode = node as MdastCode;
        blocks.push({
          blockType: "code-block",
          language: toLang(codeNode.lang),
          code: codeNode.value,
        });
        break;
      }
      case "mdxJsxFlowElement": {
        const el = node as unknown as {
          name?: string;
          attributes?: Array<{ type: string; name?: string; value?: unknown }>;
          children?: RootContent[];
        };
        const name = el.name ?? "";
        const props = mdxAttrsToProps(el.attributes ?? []);
        if (name === "CodeBlock") {
          blocks.push({
            blockType: "code-block",
            language: toLang(typeof props.language === "string" ? props.language : null),
            code: typeof props.code === "string" ? props.code : "",
            filename: typeof props.filename === "string" ? props.filename : undefined,
          });
        } else if (name === "Highlight") {
          const innerText =
            (el.children ?? [])
              .filter((c): c is MdastParagraph => c.type === "paragraph")
              .flatMap((p) => p.children)
              .map((c) => ("value" in c ? c.value : ""))
              .join(" ")
              .trim() ||
            (typeof props.text === "string" ? props.text : "");
          blocks.push({
            blockType: "highlight",
            content: stringToLexical(innerText),
          });
        } else if (name === "ArchitectureDiagram") {
          const data = (props.data ?? props) as {
            [k: string]: unknown;
          };
          blocks.push({
            blockType: "architecture-diagram",
            data,
          });
        } else {
          warnings.push(
            `Ignored MDX JSX element '${name}' in project '${projectSlug}'`,
          );
        }
        break;
      }
      default:
        warnings.push(
          `Ignored mdast node type '${node.type}' in project '${projectSlug}'`,
        );
    }
  }
  return blocks;
};

// ---------- main ----------
async function main() {
  const payload = await getPayload({ config });

  // Globals -----------------------------------------------------------------
  console.log("→ Upserting global site-meta…");
  await payload.updateGlobal({ slug: "site-meta", data: siteMeta });
  console.log("✓ Updated site-meta");

  console.log("→ Upserting global about…");
  await payload.updateGlobal({
    slug: "about",
    data: {
      sectionTitle: aboutStory.sectionTitle,
      paragraphs: aboutStory.paragraphs.map((p) => ({
        content: stringToLexical(p),
      })),
      highlight: aboutStory.highlight,
      paragraphsAfter: aboutStory.paragraphsAfter.map((p) => ({
        content: stringToLexical(p),
      })),
      quickInfo,
    },
  });
  console.log("✓ Updated about");

  // Timeline ----------------------------------------------------------------
  let tlCreated = 0;
  let tlUpdated = 0;
  for (let i = 0; i < timeline.length; i++) {
    const item = timeline[i];
    if (!item) continue;
    const existing = await payload.find({
      collection: "timeline-items",
      where: {
        and: [
          { date: { equals: item.date } },
          { title: { equals: item.title } },
        ],
      },
      limit: 1,
    });
    const data = {
      date: item.date,
      title: item.title,
      subtitle: item.subtitle,
      status: item.status ?? null,
      highlight: item.highlight ?? null,
      order: i,
    };
    if (existing.docs.length > 0 && existing.docs[0]) {
      await payload.update({
        collection: "timeline-items",
        id: existing.docs[0].id,
        data,
      });
      tlUpdated++;
      console.log(`✓ Updated timeline item: ${item.title}`);
    } else {
      await payload.create({ collection: "timeline-items", data });
      tlCreated++;
      console.log(`✓ Created timeline item: ${item.title}`);
    }
  }

  // Certifications ----------------------------------------------------------
  let certCreated = 0;
  let certUpdated = 0;
  for (let i = 0; i < certifications.length; i++) {
    const cert = certifications[i];
    if (!cert) continue;
    const existing = await payload.find({
      collection: "certifications",
      where: { name: { equals: cert.name } },
      limit: 1,
    });
    const data = {
      name: cert.name,
      organization: cert.organization,
      status: cert.status,
      statusLabel: cert.statusLabel,
      order: i,
    };
    if (existing.docs.length > 0 && existing.docs[0]) {
      await payload.update({
        collection: "certifications",
        id: existing.docs[0].id,
        data,
      });
      certUpdated++;
      console.log(`✓ Updated certification: ${cert.name}`);
    } else {
      await payload.create({ collection: "certifications", data });
      certCreated++;
      console.log(`✓ Created certification: ${cert.name}`);
    }
  }

  // Projects ----------------------------------------------------------------
  const projectFiles = fs
    .readdirSync(projectsDir)
    .filter((f) => f.endsWith(".mdx"))
    .sort();
  let projCreated = 0;
  let projUpdated = 0;
  for (const filename of projectFiles) {
    const slug = filename.replace(/\.mdx$/, "");
    const raw = fs.readFileSync(path.join(projectsDir, filename), "utf-8");
    const { data: frontmatter, content: body } = matter(raw);
    console.log(`→ Processing project: ${slug}`);

    const tree = unified().use(remarkParse).use(remarkMdx).parse(body) as MdastRoot;
    const blocks = mdastToProjectBlocks(tree, slug);
    console.log(`  → ${blocks.length} blocks generated from MDX body`);

    const stack = Array.isArray(frontmatter.stack)
      ? (frontmatter.stack as string[]).map((value) => ({ value }))
      : [];

    const projectData = {
      title: String(frontmatter.title ?? slug),
      slug,
      category: String(frontmatter.category ?? ""),
      description: String(frontmatter.description ?? ""),
      stack,
      github: typeof frontmatter.github === "string" ? frontmatter.github : null,
      period: String(frontmatter.period ?? ""),
      type: String(frontmatter.type ?? ""),
      badge: typeof frontmatter.badge === "string" ? frontmatter.badge : null,
      order: typeof frontmatter.order === "number" ? frontmatter.order : 0,
      content: blocks,
      _status: "published" as const,
    };

    const existing = await payload.find({
      collection: "projects",
      where: { slug: { equals: slug } },
      limit: 1,
      draft: true,
    });
    if (existing.docs.length > 0 && existing.docs[0]) {
      await payload.update({
        collection: "projects",
        id: existing.docs[0].id,
        data: projectData,
      });
      projUpdated++;
      console.log(`✓ Updated project: ${slug}`);
    } else {
      await payload.create({ collection: "projects", data: projectData });
      projCreated++;
      console.log(`✓ Created project: ${slug}`);
    }
  }

  // Summary -----------------------------------------------------------------
  console.log("\n— Seed summary —");
  console.log(
    `Projects: ${projCreated} created, ${projUpdated} updated (total ${projectFiles.length}).`,
  );
  console.log(
    `Timeline: ${tlCreated} created, ${tlUpdated} updated (total ${timeline.length}).`,
  );
  console.log(
    `Certifications: ${certCreated} created, ${certUpdated} updated (total ${certifications.length}).`,
  );
  console.log("Globals: site-meta + about updated.");

  if (warnings.length > 0) {
    console.log(`\n${warnings.length} warning(s):`);
    for (const w of warnings) console.log(`  - ${w}`);
  } else {
    console.log("\nNo warnings.");
  }

  await payload.destroy();
  process.exit(0);
}

try {
  await main();
} catch (err) {
  console.error(err);
  process.exit(1);
}
