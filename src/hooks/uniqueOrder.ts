import type {
  CollectionAfterChangeHook,
  CollectionSlug,
  Payload,
} from "payload";

const SKIP_KEY = "skipUniqueOrder";

/**
 * Cascade-shift orders so no two documents share the same `order`. When the
 * saved doc lands on a slot already taken, the other doc gets bumped to N+1;
 * if that creates a new conflict, the cascade continues until a free slot is
 * found.
 *
 * Each doc bumped in a single cascade run is tracked in `bumped`: subsequent
 * iterations exclude those IDs so we don't keep re-bumping the same doc we
 * just moved up (which is what produced the runaway "everyone at order=1000"
 * bug). Inner updates set `context.skipUniqueOrder` so their own afterChange
 * bails immediately instead of starting a second cascade.
 */
export const makeUniqueOrder =
  (collection: CollectionSlug): CollectionAfterChangeHook =>
  async ({ doc, req, operation }) => {
    if (operation !== "create" && operation !== "update") return doc;
    if ((req.context as { [k: string]: unknown } | undefined)?.[SKIP_KEY]) {
      return doc;
    }
    const savedOrder = typeof doc.order === "number" ? doc.order : null;
    if (savedOrder === null) return doc;

    const payload = req.payload as Payload;
    const bumped = new Set<string | number>([doc.id]);

    let cursor = savedOrder;
    let safety = 1000;
    while (safety-- > 0) {
      const { docs: targets } = await payload.find({
        collection,
        where: {
          and: [
            { order: { equals: cursor } },
            { id: { not_in: Array.from(bumped) } },
          ],
        },
        limit: 100,
        depth: 0,
      });
      if (targets.length === 0) break;
      for (const t of targets) {
        await payload.update({
          collection,
          id: t.id,
          data: { order: cursor + 1 },
          depth: 0,
          context: { [SKIP_KEY]: true },
        });
        bumped.add(t.id);
      }
      cursor += 1;
    }

    return doc;
  };
