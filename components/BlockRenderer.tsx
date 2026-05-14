import Image from "next/image";
import Link from "next/link";
import {
  RichText,
  type JSXConvertersFunction,
} from "@payloadcms/richtext-lexical/react";
import {
  IS_BOLD,
  IS_CODE,
  IS_ITALIC,
  IS_STRIKETHROUGH,
  IS_UNDERLINE,
  type SerializedEditorState,
} from "@payloadcms/richtext-lexical/lexical";

import type { About, Media, Project } from "@/payload-types";
import type { ProjectMeta } from "@/lib/types";
import CodeBlockComponent from "./CodeBlock";
import HighlightComponent from "./Highlight";
import ArchitectureDiagramComponent from "./ArchitectureDiagram";
import ProjectNavComponent from "./ProjectNav";

type ContentBlock =
  | NonNullable<Project["content"]>[number]
  | NonNullable<About["content"]>[number];

type ProjectContext = ProjectMeta;
type StructuralBlock =
  | { blockType: "project-header"; showBackLink?: boolean | null; id?: string | null }
  | { blockType: "project-meta"; id?: string | null }
  | { blockType: "project-tags"; id?: string | null }
  | { blockType: "project-nav"; id?: string | null };

export type RenderBlock = ContentBlock | StructuralBlock;

type LexicalTextNode = { text: string; format: number };

const renderInlineText = ({ node }: { node: LexicalTextNode }) => {
  let element: React.ReactNode = node.text;
  if (node.format & IS_CODE) {
    element = (
      <code
        className="rounded px-1 py-0.5 font-mono text-[13px]"
        style={{
          background: "var(--code-bg)",
          color: "var(--n900)",
          border: "0.5px solid var(--code-border)",
        }}
      >
        {element}
      </code>
    );
  }
  if (node.format & IS_UNDERLINE) {
    element = <span style={{ textDecoration: "underline" }}>{element}</span>;
  }
  if (node.format & IS_STRIKETHROUGH) {
    element = (
      <span style={{ textDecoration: "line-through" }}>{element}</span>
    );
  }
  if (node.format & IS_ITALIC) {
    element = <em>{element}</em>;
  }
  if (node.format & IS_BOLD) {
    element = (
      <strong className="font-medium" style={{ color: "var(--n900)" }}>
        {element}
      </strong>
    );
  }
  return element;
};

export const proseConverters: JSXConvertersFunction = ({ defaultConverters }) => ({
  ...defaultConverters,
  paragraph: ({ node, nodesToJSX }) => {
    const children = nodesToJSX({ nodes: node.children });
    return (
      <p
        className="mb-4 text-[15.5px] leading-[1.75]"
        style={{ color: "var(--n700)" }}
      >
        {children?.length ? children : <br />}
      </p>
    );
  },
  text: renderInlineText,
});

export const highlightConverters: JSXConvertersFunction = ({ defaultConverters }) => ({
  ...defaultConverters,
  paragraph: ({ node, nodesToJSX }) => {
    const children = nodesToJSX({ nodes: node.children });
    return (
      <p
        className="text-base leading-[1.65] [&:not(:last-child)]:mb-3"
        style={{ color: "var(--n900)" }}
      >
        {children?.length ? children : <br />}
      </p>
    );
  },
  text: renderInlineText,
});

type RichTextLike = { root?: unknown } & Record<string, unknown>;

const isLexicalState = (
  value: unknown,
): value is SerializedEditorState =>
  !!value &&
  typeof value === "object" &&
  "root" in value &&
  !!(value as RichTextLike).root;

export const STRUCTURAL_BLOCK_TYPES = new Set([
  "project-header",
  "project-meta",
  "project-tags",
  "project-nav",
]);

export const hasStructuralBlocks = (blocks: RenderBlock[] | null | undefined) =>
  !!blocks?.some((b) => STRUCTURAL_BLOCK_TYPES.has(b.blockType));

export default function BlockRenderer({
  blocks,
  project,
  prev,
  next,
}: {
  blocks: RenderBlock[];
  project?: ProjectContext;
  prev?: ProjectMeta;
  next?: ProjectMeta;
}) {
  return (
    <>
      {blocks.map((block, i) => {
        const key = ("id" in block ? block.id : undefined) ?? `${block.blockType}-${i}`;
        switch (block.blockType) {
          case "project-header": {
            if (!project) return null;
            const showBackLink = block.showBackLink !== false;
            return (
              <header key={key} className="flex flex-col">
                {showBackLink && (
                  <Link
                    href="/projets"
                    className="mb-8 inline-flex items-center gap-1 font-mono text-xs transition-colors duration-200"
                    style={{ color: "var(--n400)" }}
                  >
                    ← retour aux projets
                  </Link>
                )}
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
              </header>
            );
          }
          case "project-meta": {
            if (!project) return null;
            const stack = project.stack ?? [];
            const metaItems: {
              label: string;
              value: string;
              isLink?: boolean;
            }[] = [
              { label: "Type", value: project.type },
              { label: "Période", value: project.period },
              { label: "Stack", value: stack.join(", ") },
              ...(project.github
                ? [{ label: "GitHub", value: project.github, isLink: true }]
                : []),
            ];
            return (
              <div
                key={key}
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
                    {m.isLink ? (
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
            );
          }
          case "project-tags": {
            if (!project) return null;
            const stack = project.stack ?? [];
            return (
              <div key={key} className="mt-10 flex flex-wrap gap-1.5">
                {stack.map((tag) => (
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
            );
          }
          case "project-nav":
            return (
              <div key={key} className="mt-8">
                <ProjectNavComponent prev={prev} next={next} />
              </div>
            );
          case "section-heading":
            return (
              <h2
                key={key}
                className="mb-3 mt-10 font-mono text-[13px] uppercase"
                style={{ color: "var(--accent)" }}
              >
                // {block.text}
              </h2>
            );
          case "paragraph":
            return (
              <RichText
                key={key}
                data={block.text as SerializedEditorState}
                converters={proseConverters}
                disableContainer
              />
            );
          case "code-block":
            return (
              <CodeBlockComponent
                key={key}
                filename={block.filename ?? ""}
                language={block.language ?? "bash"}
              >
                {block.code ?? ""}
              </CodeBlockComponent>
            );
          case "highlight":
            return (
              <HighlightComponent key={key}>
                {isLexicalState(block.content) ? (
                  <RichText
                    data={block.content}
                    converters={highlightConverters}
                    disableContainer
                  />
                ) : null}
              </HighlightComponent>
            );
          case "architecture-diagram":
            return (
              <ArchitectureDiagramComponent key={key}>
                <pre
                  className="font-mono text-xs"
                  style={{ color: "var(--n500)" }}
                >
                  {JSON.stringify(block.data, null, 2)}
                </pre>
              </ArchitectureDiagramComponent>
            );
          case "image": {
            const image = block.image as Media | number | undefined;
            if (!image || typeof image === "number" || !image.url) return null;
            return (
              <figure key={key} className="my-8">
                <Image
                  src={image.url}
                  alt={image.alt ?? block.caption ?? ""}
                  width={image.width ?? 1200}
                  height={image.height ?? 800}
                  className="rounded-lg"
                />
                {block.caption && (
                  <figcaption
                    className="mt-2 text-center font-mono text-[12px]"
                    style={{ color: "var(--n400)" }}
                  >
                    {block.caption}
                  </figcaption>
                )}
              </figure>
            );
          }
          default:
            return null;
        }
      })}
    </>
  );
}
