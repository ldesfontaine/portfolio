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

import type { Media, Project } from "@/payload-types";
import CodeBlockComponent from "./CodeBlock";
import HighlightComponent from "./Highlight";
import ArchitectureDiagramComponent from "./ArchitectureDiagram";

type Block = NonNullable<Project["content"]>[number];

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
  text: ({ node }) => {
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
  },
});

type RichTextLike = { root?: unknown } & Record<string, unknown>;

const isLexicalState = (
  value: unknown,
): value is SerializedEditorState =>
  !!value &&
  typeof value === "object" &&
  "root" in value &&
  !!(value as RichTextLike).root;

export default function BlockRenderer({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((block, i) => {
        const key = block.id ?? `${block.blockType}-${i}`;
        switch (block.blockType) {
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
                    converters={proseConverters}
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
