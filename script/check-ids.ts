
import { db } from "../server/db";
import { content } from "../shared/schema";

async function main() {
    const all = await db.select().from(content);
    console.log("ID | Type | Title");
    console.log("---|---|---");
    all.forEach(c => {
        console.log(`${c.id} | ${c.type} | ${c.title}`);
    });
    process.exit(0);
}

main();
