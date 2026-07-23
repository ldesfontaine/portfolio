import assert from "node:assert/strict";
import test from "node:test";

import {
  validateDiagramBlock,
  validateTableBlock,
} from "../src/hooks/validateEditorialBlocks.ts";

test("un tableau cohérent est accepté", () => {
  assert.doesNotThrow(() =>
    validateTableBlock({
      columns: [
        { label: "Contrôle", align: "left" },
        { label: "État", align: "center" },
      ],
      rows: [
        {
          cells: [
            { value: "Segmentation", tone: "default" },
            { value: "Prouvé", tone: "positive" },
          ],
        },
      ],
    }),
  );
});

test("une ligne dont le nombre de cellules diffère est rejetée", () => {
  assert.throws(
    () =>
      validateTableBlock({
        columns: [{ label: "A" }, { label: "B" }],
        rows: [{ cells: [{ value: "seule cellule" }] }],
      }),
    /2 attendue/,
  );
});

test("un schéma cohérent est accepté", () => {
  assert.doesNotThrow(() =>
    validateDiagramBlock({
      data: {
        nodes: [
          { id: "vps", label: "VPS" },
          { id: "homelab", label: "Homelab" },
        ],
        links: [{ from: "vps", to: "homelab", label: "tunnel privé" }],
      },
    }),
  );
});

test("un schéma saisi avec les champs Payload est accepté", () => {
  assert.doesNotThrow(() =>
    validateDiagramBlock({
      nodes: [
        { key: "vps", label: "VPS", tone: "orange" },
        { key: "homelab", label: "Homelab", tone: "mauve" },
      ],
      links: [{ from: "vps", to: "homelab", label: "tunnel privé" }],
    }),
  );
});

test("un identifiant de nœud dupliqué est rejeté", () => {
  assert.throws(
    () =>
      validateDiagramBlock({
        data: {
          nodes: [
            { id: "vps", label: "VPS public" },
            { id: "vps", label: "VPS privé" },
          ],
          links: [],
        },
      }),
    /dupliqué/,
  );
});

test("un lien vers un nœud inconnu est rejeté", () => {
  assert.throws(
    () =>
      validateDiagramBlock({
        data: {
          nodes: [
            { id: "vps", label: "VPS" },
            { id: "homelab", label: "Homelab" },
          ],
          links: [{ from: "vps", to: "secret" }],
        },
      }),
    /nœud inconnu/,
  );
});

test("un détail de nœud non textuel est rejeté", () => {
  assert.throws(
    () =>
      validateDiagramBlock({
        data: {
          nodes: [
            { id: "vps", label: "VPS", detail: { html: "<script>" } },
            { id: "homelab", label: "Homelab" },
          ],
          links: [],
        },
      }),
    /doit être du texte/,
  );
});
