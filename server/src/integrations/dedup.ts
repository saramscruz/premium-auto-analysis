import Fuse from "fuse.js";
import { getDb, schema } from "../db";
import { eq } from "drizzle-orm";

export interface DupResult {
  isDuplicate: boolean;
  duplicateOf: string | null;
  similarity: number;
}

export async function checkDuplicate(
  excerpt: string,
  brand: string,
  excludeId?: string
): Promise<DupResult> {
  const db = getDb();

  const existingSignals = await db
    .select({ id: schema.signals.id, exact_excerpt: schema.signals.exact_excerpt })
    .from(schema.signals)
    .where(eq(schema.signals.brand, brand));

  const candidates = existingSignals.filter((s) => s.id !== excludeId);
  if (candidates.length === 0) return { isDuplicate: false, duplicateOf: null, similarity: 0 };

  const fuse = new Fuse(candidates, {
    keys: ["exact_excerpt"],
    includeScore: true,
    threshold: 0.3,
    minMatchCharLength: 30,
  });

  const results = fuse.search(excerpt);
  if (results.length === 0) return { isDuplicate: false, duplicateOf: null, similarity: 0 };

  const best = results[0];
  const similarity = 1 - (best.score ?? 1);

  if (similarity >= 0.8) {
    return {
      isDuplicate: true,
      duplicateOf: best.item.id,
      similarity,
    };
  }

  return { isDuplicate: false, duplicateOf: null, similarity };
}
