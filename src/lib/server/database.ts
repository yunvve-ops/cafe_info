import { PGlite } from "@electric-sql/pglite";
import { mkdir } from "node:fs/promises";
import path from "node:path";

type DatabaseGlobal = typeof globalThis & {
  cafePglite?: PGlite;
  cafePgliteReady?: Promise<PGlite>;
};

const appGlobal = globalThis as DatabaseGlobal;

export async function getDatabase(): Promise<PGlite> {
  if (!appGlobal.cafePgliteReady) {
    const dataDirectory = path.join(process.cwd(), ".local-data", "pgdata");
    appGlobal.cafePgliteReady = (async () => {
      await mkdir(path.dirname(dataDirectory), { recursive: true });
      const db = new PGlite(dataDirectory);
      await db.waitReady;
      appGlobal.cafePglite = db;
      return db;
    })();
  }
  return appGlobal.cafePgliteReady;
}
