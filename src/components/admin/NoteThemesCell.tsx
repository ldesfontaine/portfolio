"use client";

import { DefaultCell } from "@payloadcms/ui";
import type {
  DefaultCellComponentProps,
  RelationshipFieldClient,
} from "payload";

type NoteThemesCellProps = DefaultCellComponentProps<RelationshipFieldClient>;

export default function NoteThemesCell(props: NoteThemesCellProps) {
  const { cellData } = props;
  const hasTheme = Array.isArray(cellData)
    ? cellData.length > 0
    : cellData !== null && cellData !== undefined && cellData !== "";

  if (!hasTheme) {
    return (
      <span style={{ color: "var(--theme-elevation-500)", fontStyle: "italic" }}>
        Sans thème
      </span>
    );
  }

  return <DefaultCell {...props} />;
}
