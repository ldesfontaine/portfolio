import { APIError, type CollectionBeforeValidateHook } from "payload";

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const readArray = (record: UnknownRecord, key: string): unknown[] => {
  const value = record[key];
  return Array.isArray(value) ? value : [];
};

const readRequiredString = (
  record: UnknownRecord,
  key: string,
  context: string,
): string => {
  const value = record[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new APIError(`${context} : le champ « ${key} » est obligatoire.`, 400);
  }
  return value.trim();
};

const readOptionalString = (
  record: UnknownRecord,
  key: string,
  context: string,
): string | undefined => {
  const value = record[key];
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") {
    throw new APIError(`${context} : le champ « ${key} » doit être du texte.`, 400);
  }
  return value.trim();
};

export const validateTableBlock = (block: UnknownRecord): void => {
  const columns = readArray(block, "columns");
  const rows = readArray(block, "rows");

  if (columns.length < 2 || columns.length > 6) {
    throw new APIError(
      "Tableau : ajoute entre 2 et 6 colonnes.",
      400,
    );
  }

  if (rows.length === 0) {
    throw new APIError("Tableau : ajoute au moins une ligne.", 400);
  }

  columns.forEach((column, columnIndex) => {
    if (!isRecord(column)) {
      throw new APIError(
        `Tableau : la colonne ${columnIndex + 1} est invalide.`,
        400,
      );
    }
    readRequiredString(column, "label", `Tableau, colonne ${columnIndex + 1}`);
  });

  rows.forEach((row, rowIndex) => {
    if (!isRecord(row)) {
      throw new APIError(`Tableau : la ligne ${rowIndex + 1} est invalide.`, 400);
    }
    const cells = readArray(row, "cells");
    if (cells.length !== columns.length) {
      throw new APIError(
        `Tableau : la ligne ${rowIndex + 1} contient ${cells.length} cellule(s), ${columns.length} attendue(s).`,
        400,
      );
    }
    cells.forEach((cell, cellIndex) => {
      if (!isRecord(cell)) {
        throw new APIError(
          `Tableau : la cellule ${cellIndex + 1} de la ligne ${rowIndex + 1} est invalide.`,
          400,
        );
      }
      readRequiredString(
        cell,
        "value",
        `Tableau, ligne ${rowIndex + 1}, cellule ${cellIndex + 1}`,
      );
    });
  });
};

export const validateDiagramBlock = (block: UnknownRecord): void => {
  const structuredNodes = readArray(block, "nodes");
  const data = structuredNodes.length > 0
    ? {
        nodes: structuredNodes.map((node) =>
          isRecord(node) ? { ...node, id: node.key } : node,
        ),
        links: readArray(block, "links"),
      }
    : block.data;
  if (!isRecord(data)) {
    throw new APIError("Schéma : les données doivent être un objet JSON.", 400);
  }

  const nodes = readArray(data, "nodes");
  const links = readArray(data, "links");
  if (nodes.length < 2 || nodes.length > 12) {
    throw new APIError("Schéma : ajoute entre 2 et 12 nœuds.", 400);
  }
  if (links.length > 24) {
    throw new APIError("Schéma : 24 liens maximum sont autorisés.", 400);
  }

  const nodeIds = new Set<string>();
  nodes.forEach((node, index) => {
    if (!isRecord(node)) {
      throw new APIError(`Schéma : le nœud ${index + 1} est invalide.`, 400);
    }
    const id = readRequiredString(node, "id", `Schéma, nœud ${index + 1}`);
    readRequiredString(node, "label", `Schéma, nœud ${index + 1}`);
    readOptionalString(node, "detail", `Schéma, nœud ${index + 1}`);
    const tone = readOptionalString(node, "tone", `Schéma, nœud ${index + 1}`);
    if (tone && !["default", "mauve", "orange"].includes(tone)) {
      throw new APIError(
        `Schéma : la couleur « ${tone} » du nœud ${index + 1} est inconnue.`,
        400,
      );
    }
    if (!/^[a-z0-9][a-z0-9-]{0,39}$/.test(id)) {
      throw new APIError(
        `Schéma : l'identifiant « ${id} » doit utiliser 1 à 40 caractères minuscules, chiffres ou tirets.`,
        400,
      );
    }
    if (nodeIds.has(id)) {
      throw new APIError(`Schéma : l'identifiant « ${id} » est dupliqué.`, 400);
    }
    nodeIds.add(id);
  });

  links.forEach((link, index) => {
    if (!isRecord(link)) {
      throw new APIError(`Schéma : le lien ${index + 1} est invalide.`, 400);
    }
    const from = readRequiredString(link, "from", `Schéma, lien ${index + 1}`);
    const to = readRequiredString(link, "to", `Schéma, lien ${index + 1}`);
    readOptionalString(link, "label", `Schéma, lien ${index + 1}`);
    if (!nodeIds.has(from) || !nodeIds.has(to)) {
      throw new APIError(
        `Schéma : le lien ${index + 1} référence un nœud inconnu (${from} → ${to}).`,
        400,
      );
    }
  });
};

export const validateEditorialBlocks: CollectionBeforeValidateHook = ({ data }) => {
  const content = data?.content;
  if (!Array.isArray(content)) return data;

  content.forEach((block) => {
    if (!isRecord(block)) return;
    if (block.blockType === "table") validateTableBlock(block);
    if (block.blockType === "architecture-diagram") validateDiagramBlock(block);
  });

  return data;
};
