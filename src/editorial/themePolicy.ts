import type { FilterOptions, Where } from "payload";

const ARCHIVED_PROJECT_SLUGS = [
  "zero-trust",
  "simulation-ba186",
  "poc-phantom",
  "bientot",
];

export const ALLOW_ARCHIVED_THEME_RELATIONS =
  "allowArchivedThemeRelationsDuringMigration";

/**
 * The old Project rows remain in SQLite as rollback sources, but they are not
 * editorial themes. This positive view keeps current and future themes visible
 * without deleting historical data.
 */
export const visibleThemesWhere = (): Where => ({
  slug: {
    not_in: [...ARCHIVED_PROJECT_SLUGS],
  },
});

export const visibleThemeFilterOptions: FilterOptions = ({ req }) =>
  req.context[ALLOW_ARCHIVED_THEME_RELATIONS] === true
    ? true
    : visibleThemesWhere();
