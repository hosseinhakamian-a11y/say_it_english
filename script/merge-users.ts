
import { db } from "../server/db";
import { users, purchases, payments } from "../shared/schema";
import { eq, and } from "drizzle-orm";

async function mergeUsers() {
    console.log("🔄 Merging Users and Fixing Purchases...");

    const targetUserId = 4; // اکانت اصلی متصل به موبایل
    const sourceUserId = 7; // اکانتی که خریدها در آن مانده است

    // 1. Transfer purchases
    console.log(`🚚 Transferring purchases from User ${sourceUserId} to User ${targetUserId}...`);
    await db.update(purchases)
        .set({ userId: targetUserId })
        .where(eq(purchases.userId, sourceUserId));

    // 2. Transfer payments
    console.log(`🚚 Transferring payments from User ${sourceUserId} to User ${targetUserId}...`);
    await db.update(payments)
        .set({ userId: targetUserId })
        .where(eq(payments.userId, sourceUserId));

    // 3. Delete the redundant user
    console.log(`🗑️ Deleting redundant User ${sourceUserId}...`);
    await db.delete(users).where(eq(users.id, sourceUserId));

    // 4. Clean up duplicate purchase records (safety check)
    console.log("🧹 Deduplicating items for the main user...");
    const userPurchases = await db.select().from(purchases).where(eq(purchases.userId, targetUserId));
    const seenContent = new Set();
    for (const p of userPurchases) {
        if (seenContent.has(p.contentId)) {
            console.log(`🗑️ Removing duplicate purchase record ${p.id} for content ${p.contentId}`);
            await db.delete(purchases).where(eq(purchases.id, p.id));
        } else {
            seenContent.add(p.contentId);
        }
    }

    console.log("✨ Merge and cleanup complete! You can now test with ID 4 (Mobile login).");
    process.exit(0);
}

mergeUsers().catch(err => {
    console.error(err);
    process.exit(1);
});
