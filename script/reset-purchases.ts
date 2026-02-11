
import { db } from "../server/db";
import { users, purchases, payments } from "../shared/schema";
import { eq } from "drizzle-orm";

async function reset() {
    console.log("🧹 Starting Database Reset for Testing...");

    // 1. Find the user
    const phoneNumber = "09125088277";
    const [user] = await db.select().from(users).where(eq(users.phone, phoneNumber));
    
    if (user) {
        console.log(`👤 Found user: ${user.username} (ID: ${user.id})`);
        
        // Delete this user's purchases
        const deletedPurchases = await db.delete(purchases).where(eq(purchases.userId, user.id)).returning();
        console.log(`✅ Deleted ${deletedPurchases.length} purchases for user ${user.id}`);

        // Delete this user's payments
        const deletedPayments = await db.delete(payments).where(eq(payments.userId, user.id)).returning();
        console.log(`✅ Deleted ${deletedPayments.length} payments for user ${user.id}`);
    } else {
        console.log(`❓ User with phone ${phoneNumber} not found.`);
    }

    // 2. Global cleanup (Optional: Delete ALL purchases if requested)
    console.log("🌐 Clearing ALL purchase and payment records for a fresh start...");
    const allDeletedPurchases = await db.delete(purchases).returning();
    const allDeletedPayments = await db.delete(payments).returning();
    
    console.log(`📊 Global Summary:
    - Total Purchases Deleted: ${allDeletedPurchases.length}
    - Total Payments Deleted: ${allDeletedPayments.length}`);

    console.log("✨ Database is now clean for testing!");
    process.exit(0);
}

reset().catch(err => {
    console.error(err);
    process.exit(1);
});
