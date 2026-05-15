import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { getPayload } from "payload";

import config from "@payload-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers: request.headers });
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const workDir = `/tmp/snapshot-${ts}`;
  const tarFile = `/tmp/snapshot-${ts}.tar.gz`;

  try {
    const dbUri = process.env.DATABASE_URI || "file:./payload.db";
    const dbPath = dbUri.startsWith("file:") ? dbUri.slice(5) : dbUri;
    const mediaDir = path.resolve(process.cwd(), "media");

    mkdirSync(workDir, { recursive: true });

    // Prefer `sqlite3 .backup` for a fully consistent dump (handles WAL/locks).
    // Falls back to a raw file copy when the sqlite3 CLI is missing — fine
    // for a single-writer portfolio, just less crash-safe under concurrent writes.
    try {
      execFileSync("sqlite3", [dbPath, `.backup '${workDir}/payload.db'`]);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
      copyFileSync(dbPath, `${workDir}/payload.db`);
    }

    // Copy media tree (best-effort: dir may not exist on a fresh install).
    try {
      execFileSync("cp", ["-r", mediaDir, `${workDir}/media`]);
    } catch {
      mkdirSync(`${workDir}/media`, { recursive: true });
    }

    execFileSync("tar", ["-czf", tarFile, "-C", workDir, "."]);

    const buffer = readFileSync(tarFile);
    const filename = `portfolio-snapshot-${ts}.tar.gz`;

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/gzip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (err) {
    return Response.json(
      { error: (err as Error).message || "Snapshot failed" },
      { status: 500 },
    );
  } finally {
    try {
      rmSync(workDir, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
    try {
      rmSync(tarFile, { force: true });
    } catch {
      /* ignore */
    }
  }
}
