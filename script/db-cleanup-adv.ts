
import { db } from "../server/db";
import { content } from "../shared/schema";
import { eq, or, like, sql } from "drizzle-orm";

async function fix() {
    console.log("🛠️  Advanced Database Cleanup...");

    // 1. Fix YouTube typos with case-insensitive check and trim
    console.log("📺 Fixing video provider typos...");
    
    // Get all content
    const allContent = await db.select().from(content);
    let fixedCount = 0;

    for (const item of allContent) {
        if (!item.videoProvider) continue;
        
        const provider = item.videoProvider.toLowerCase().trim();
        if (provider.includes('youtube') || provider.includes('yutube') || provider.includes('youtub')) {
            if (item.videoProvider !== 'youtube') {
                await db.update(content)
                    .set({ videoProvider: 'youtube' })
                    .where(eq(content.id, item.id));
                console.log(`✅ Fixed ID ${item.id}: "${item.videoProvider}" -> "youtube"`);
                fixedCount++;
            }
        } else if (provider.includes('insta')) {
             if (item.videoProvider !== 'instagram') {
                await db.update(content)
                   .set({ videoProvider: 'instagram' })
                   .where(eq(content.id, item.id));
                console.log(`✅ Fixed ID ${item.id}: "${item.videoProvider}" -> "instagram"`);
                fixedCount++;
             }
        }
    }

    console.log(`🏁 Cleanup complete! Total fixed: ${fixedCount}`);
    process.exit(0);
}

fix().catch(err => {
    console.error(err);
    process.exit(1);
});
