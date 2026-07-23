import assert from "node:assert/strict";
import test from "node:test";

import { visibleThemesWhere } from "../src/editorial/themePolicy.ts";

test("les anciens projets ne sont pas proposés comme thèmes", () => {
  assert.deepEqual(visibleThemesWhere(), {
    slug: {
      not_in: ["zero-trust", "simulation-ba186", "poc-phantom", "bientot"],
    },
  });
});
