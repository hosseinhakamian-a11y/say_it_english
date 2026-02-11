
import { db } from "../server/db";
import { content, purchases, payments } from "../shared/schema";
import { eq, and, ne, sql } from "drizzle-orm";

async function deepClean() {
    console.log("🧹 Starting Deep Content Cleanup...");

    // 1. Find duplicate titles in content
    const all = await db.select().from(content);
    const seenTitles = new Map();
    const toDelete = [];

    for (const item of all) {
        if (seenTitles.has(item.title)) {
            const firstId = seenTitles.get(item.title);
            console.log(`⚠️ Duplicate found: "${item.title}" (ID: ${item.id} is a duplicate of ID: ${firstId})`);
            toDelete.push(item.id);
        } else {
            seenTitles.set(item.title, item.id);
        }
    }

    if (toDelete.length > 0) {
        console.log(`🗑️ Deleting ${toDelete.length} duplicate content records...`);
        // Before deleting content, we must remove dependent purchases/payments to avoid FK errors
        for (const id of toDelete) {
            await db.delete(purchases).where(eq(purchases.contentId, id));
            await db.delete(payments).where(eq(payments.contentId, id));
            await db.delete(content).where(eq(content.id, id));
        }
        console.log("✅ Duplicates removed.");
    } else {
        console.log("✨ No duplicate titles found in content table.");
    }

    // 2. Fix ANY remaining videoProvider typos
    console.log("📺 Final check for provider typos...");
    await db.update(content)
        .set({ videoProvider: 'youtube' })
        .where(sql`LOWER(TRIM(video_provider)) LIKE '%youtub%'`);
    
    console.log("🏁 Cleanup complete!");
    process.exit(0);
}

deepClean().catch(err => {
    console.error(err);
    process.exit(1);
});
