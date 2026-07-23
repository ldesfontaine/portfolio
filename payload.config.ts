import path from "path";
import { fileURLToPath } from "url";
import { buildConfig } from "payload";
import { sqliteAdapter } from "@payloadcms/db-sqlite";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { fr } from "@payloadcms/translations/languages/fr";
import sharp from "sharp";

import { Users } from "./src/collections/Users";
import { Media } from "./src/collections/Media";
import { Projects } from "./src/collections/Projects";
import { TimelineItems } from "./src/collections/TimelineItems";
import { Certifications } from "./src/collections/Certifications";
import { Posts } from "./src/collections/Posts";
import { SiteMeta } from "./src/globals/SiteMeta";
import { About } from "./src/globals/About";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const siteUrl = process.env.SITE_URL || "http://localhost:3000";
const extraOrigins = (process.env.EXTRA_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const allowedOrigins = [siteUrl, ...extraOrigins];

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    components: {
      beforeDashboard: [
        "/src/components/admin/BackupCard",
        "/src/components/admin/AnalyticsCard",
      ],
    },
  },
  i18n: {
    fallbackLanguage: "fr",
    supportedLanguages: { fr },
  },
  collections: [Users, Media, Projects, Posts, TimelineItems, Certifications],
  globals: [SiteMeta, About],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || "",
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  db: sqliteAdapter({
    client: {
      url: process.env.DATABASE_URI || "file:./payload.db",
    },
    // Local development keeps Payload's automatic push. The production
    // entrypoint uses scripts/bootstrap-schema.ts to inspect, back up and
    // verify the same plan without an interactive prompt.
    push: true,
  }),
  sharp,
  cors: allowedOrigins,
  csrf: allowedOrigins,
});
