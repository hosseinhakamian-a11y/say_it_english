
import { db } from "../server/db";
import { content, purchases } from "../shared/schema";
import { eq, inArray } from "drizzle-orm";

async function debug() {
    console.log("🔍 Deep Dive Content Check...");
    
    const idsToCheck = [20, 21, 22, 24, 30, 37];
    const items = await db.select().from(content).where(inArray(content.id, idsToCheck));
    
    console.log("\n📦 Content Details:");
    console.table(items.map(c => ({
        id: c.id,
        title: c.title,
        type: c.type,
        isPremium: c.isPremium,
        videoProvider: c.videoProvider
    })));

    const userId = 7; 
    console.log(`\n🛍️ Purchases for User ID ${userId}:`);
    const userPurchases = await db.select().from(purchases).where(eq(purchases.userId, userId));
    console.table(userPurchases.map(p => ({
        id: p.id,
        contentId: p.contentId,
        createdAt: p.createdAt
    })));

    process.exit(0);
}

debug().catch(err => {
    console.error(err);
    process.exit(1);
});
