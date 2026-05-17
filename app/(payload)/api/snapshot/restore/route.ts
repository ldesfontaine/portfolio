import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { getPayload } from "payload";

import config from "@payload-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const MAX_SIZE = 500 * 1024 * 1024; // 500 MB

// SQLite file magic: 16-byte ASCII "SQLite format 3" followed by a NUL.
const SQLITE_HEADER = Buffer.from([
  0x53, 0x51, 0x4c, 0x69, 0x74, 0x65, 0x20, 0x66, 0x6f, 0x72, 0x6d, 0x61, 0x74,
  0x20, 0x33, 0x00,
]);

export async function POST(request: Request) {
  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers: request.headers });
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: "Invalid multipart body" }, { status: 400 });
  }

  const file = formData.get("snapshot");
  if (!(file instanceof File)) {
    return Response.json(
      { error: "Missing 'snapshot' file" },
      { status: 400 },
    );
  }

  if (file.size > MAX_SIZE) {
    return Response.json(
      { error: "Snapshot too large (>500 MB)" },
      { status: 413 },
    );
  }

  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const tarFile = `/tmp/restore-${ts}.tar.gz`;
  const extractDir = `/tmp/restore-${ts}`;

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    writeFileSync(tarFile, buffer);

    mkdirSync(extractDir, { recursive: true });
    try {
      execFileSync("tar", [
        "-xzf",
        tarFile,
        "-C",
        extractDir,
        "--no-same-owner",
        "--no-same-permissions",
      ]);
    } catch {
      return Response.json(
        { error: "Invalid or corrupt tar.gz" },
        { status: 400 },
      );
    }

    const newDb = path.join(extractDir, "payload.db");
    if (!existsSync(newDb)) {
      return Response.json(
        { error: "Snapshot missing payload.db" },
        { status: 400 },
      );
    }
    const header = readFileSync(newDb).subarray(0, 16);
    if (!header.equals(SQLITE_HEADER)) {
      return Response.json(
        { error: "payload.db is not a valid SQLite file" },
        { status: 400 },
      );
    }

    const dbUri = process.env.DATABASE_URI || "file:./payload.db";
    const dbPath = dbUri.startsWith("file:") ? dbUri.slice(5) : dbUri;
    const mediaDir = path.resolve(process.cwd(), "media");

    const dbBackup = `${dbPath}.pre-restore-${ts}`;
    const mediaBackup = path.join(mediaDir, `.pre-restore-${ts}`);

    // /tmp and /data sit on different mounts in the container, so rename() is
    // EXDEV. Stage a copy inside the target filesystem, then do an atomic
    // rename-swap within that filesystem (cheap, safe).
    const dbStaged = `${dbPath}.new-${ts}`;
    copyFileSync(newDb, dbStaged);
    if (existsSync(dbPath)) {
      renameSync(dbPath, dbBackup);
    }
    renameSync(dbStaged, dbPath);

    // GoatCounter DB — optional in the tarball to stay compatible with
    // snapshots taken before analytics were bundled. GoatCounter holds the
    // SQLite open; the swap is safe because the container exits below and
    // reopens the new file on restart.
    const newGcDb = path.join(extractDir, "goatcounter.sqlite3");
    let gcBackup: string | null = null;
    if (existsSync(newGcDb)) {
      const gcHeader = readFileSync(newGcDb).subarray(0, 16);
      if (!gcHeader.equals(SQLITE_HEADER)) {
        return Response.json(
          { error: "goatcounter.sqlite3 is not a valid SQLite file" },
          { status: 400 },
        );
      }
      const gcPath =
        process.env.GOATCOUNTER_DB || "/data/goatcounter.sqlite3";
      const gcStaged = `${gcPath}.new-${ts}`;
      gcBackup = `${gcPath}.pre-restore-${ts}`;
      copyFileSync(newGcDb, gcStaged);
      if (existsSync(gcPath)) {
        renameSync(gcPath, gcBackup);
      }
      renameSync(gcStaged, gcPath);
    }

    const newMedia = path.join(extractDir, "media");
    if (existsSync(newMedia)) {
      // The `nextjs` user owns /app/media but not /app itself, so we can't
      // create /app/media.new-<ts> next to it. Stage and backup inside the
      // /app/media folder, then move entries in place (not atomic, but the
      // window where /app/media is inconsistent is sub-second).
      const stagingDir = path.join(mediaDir, `.staging-${ts}`);
      const backupDir = path.join(mediaDir, `.pre-restore-${ts}`);

      mkdirSync(stagingDir, { recursive: true });
      for (const entry of readdirSync(newMedia)) {
        cpSync(path.join(newMedia, entry), path.join(stagingDir, entry), {
          recursive: true,
        });
      }

      mkdirSync(backupDir, { recursive: true });
      for (const entry of readdirSync(mediaDir)) {
        if (entry.startsWith(".staging-") || entry.startsWith(".pre-restore-")) {
          continue;
        }
        renameSync(path.join(mediaDir, entry), path.join(backupDir, entry));
      }

      for (const entry of readdirSync(stagingDir)) {
        renameSync(path.join(stagingDir, entry), path.join(mediaDir, entry));
      }

      rmSync(stagingDir, { recursive: true, force: true });
    }

    // Exit so docker restart picks up the new DB + media.
    setTimeout(() => {
      process.exit(0);
    }, 1000);

    return Response.json({
      ok: true,
      message:
        "Snapshot restauré. Le container redémarre. Recharge la page d'ici 10-15s.",
      backup: { db: dbBackup, media: mediaBackup, goatcounter: gcBackup },
    });
  } catch (err) {
    return Response.json(
      { error: (err as Error).message || "Restore failed" },
      { status: 500 },
    );
  } finally {
    try {
      rmSync(extractDir, { recursive: true, force: true });
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
