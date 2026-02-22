import { db } from "../server/db";
import { content } from "../shared/schema";
import { eq, or, like } from "drizzle-orm";

async function run() {
  const result = await db.select().from(content).where(
    or(
      eq(content.videoProvider, "youtube"),
      like(content.contentUrl, "%youtube.com%"),
      like(content.contentUrl, "%youtu.be%")
    )
  );
  
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}

run();
