import Image from "next/image";
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

import type { About, Media, Post, Project } from "@/payload-types";
import CodeBlockComponent from "./CodeBlock";
import HighlightComponent from "./Highlight";
import ArchitectureDiagramComponent from "./ArchitectureDiagram";
import EditorialTable from "./EditorialTable";

type ContentBlock =
  | NonNullable<Project["content"]>[number]
  | NonNullable<Post["content"]>[number]
  | NonNullable<About["content"]>[number];

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
}: {
  blocks: RenderBlock[];
}) {
  return (
    <>
      {blocks.map((block, i) => {
        const key = ("id" in block ? block.id : undefined) ?? `${block.blockType}-${i}`;
        switch (block.blockType) {
          case "project-header":
          case "project-meta":
          case "project-tags":
          case "project-nav":
            // These blocks only exist in the preserved pre-migration archive.
            // Notes carry their own title and metadata outside the block stream.
            return null;
          case "section-heading":
            return (
              <h2
                key={key}
                className="editorial-section-heading"
              >
                {block.text}
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
            const diagramData = block.nodes?.length
              ? {
                  nodes: block.nodes.map((node) => ({
                    id: node.key,
                    label: node.label,
                    detail: node.detail,
                    tone: node.tone,
                  })),
                  links: block.links ?? [],
                }
              : block.data;
            return (
              <ArchitectureDiagramComponent
                key={key}
                title={block.title}
                data={diagramData}
                caption={block.caption}
              />
            );
          case "table":
            return (
              <EditorialTable
                key={key}
                caption={block.caption}
                columns={block.columns}
                rows={block.rows}
              />
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
