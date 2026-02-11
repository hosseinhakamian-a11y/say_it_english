
import { db } from "../server/db";
import { content, purchases } from "../shared/schema";
import { eq, or, like } from "drizzle-orm";

async function fix() {
    console.log("🛠️ Starting Database Cleanup...");

    // 1. Fix YouTube typos
    console.log("📺 Fixing video provider typos...");
    const typos = ["youutube", "yo outube", "yutube"];
    for (const typo of typos) {
        const result = await db.update(content)
            .set({ videoProvider: 'youtube' })
            .where(eq(content.videoProvider, typo))
            .returning();
        if (result.length > 0) {
            console.log(`✅ Fixed ${result.length} records with typo: "${typo}"`);
        }
    }

    // 2. Identify and report missing content in purchases
    console.log("🔍 Checking for purchases of non-existent content...");
    const allPurchases = await db.select().from(purchases);
    const allContent = await db.select().from(content);
    const contentIds = new Set(allContent.map(c => c.id));
    
    const orphans = allPurchases.filter(p => !contentIds.has(p.contentId));
    if (orphans.length > 0) {
        console.log(`⚠️ Found ${orphans.length} orphan purchase records (content no longer exists).`);
        // We don't delete them here to be safe, but the storage method will filter them.
    }

    console.log("🏁 Cleanup complete!");
    process.exit(0);
}

fix().catch(err => {
    console.error(err);
    process.exit(1);
});
