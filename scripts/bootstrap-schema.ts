/* eslint-disable no-console */
import { getPayload } from "payload";

import config from "../payload.config";

// Triggers the SQLite schema push at container boot. Required because
// Payload's SQLite adapter only auto-pushes when NODE_ENV != production,
// but we run the app server in production. entrypoint.sh invokes this
// with NODE_ENV=development specifically for that purpose.
try {
  const payload = await getPayload({ config });
  await payload.destroy();
  console.log("✓ Schema bootstrap complete.");
  process.exit(0);
} catch (err) {
  console.error(err);
  process.exit(1);
}
