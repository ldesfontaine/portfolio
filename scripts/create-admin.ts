/* eslint-disable no-console */
import { getPayload } from "payload";

import config from "../payload.config";

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.log("ADMIN_EMAIL or ADMIN_PASSWORD missing — skipping auto-creation.");
    process.exit(0);
  }

  const payload = await getPayload({ config });
  const existing = await payload.find({
    collection: "users",
    limit: 1,
    pagination: false,
  });

  if (existing.totalDocs > 0) {
    console.log("→ Users already present, skipping admin auto-creation.");
    await payload.destroy();
    process.exit(0);
  }

  await payload.create({
    collection: "users",
    data: { email, password },
  });
  console.log(`✓ Created admin user ${email}.`);

  await payload.destroy();
  process.exit(0);
}

try {
  await main();
} catch (err) {
  console.error(err);
  process.exit(1);
}
