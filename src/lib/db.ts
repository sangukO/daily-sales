import Dexie, { type EntityTable } from "dexie";
import type { Sale } from "@/types";

const db = new Dexie("SalesDatabase") as Dexie & {
  sales: EntityTable<Sale, "id">;
};

db.version(1).stores({
  sales: "++id, date, amount, memo",
});

export type { Sale };
export { db };
