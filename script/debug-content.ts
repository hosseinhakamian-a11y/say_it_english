import "dotenv/config";
import { db } from "../server/db";
import { content } from "../shared/schema";
import { asc } from "drizzle-orm";

async function debug() {
  const items = await db.select().from(content).orderBy(asc(content.id)).limit(3);
  console.log(JSON.stringify(items, null, 2));
  process.exit(0);
}

debug();
