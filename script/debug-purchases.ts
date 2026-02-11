
import { db } from "../server/db";
import { payments, purchases, content, users } from "../shared/schema";
import { eq, desc } from "drizzle-orm";

async function debug() {
    console.log("🔍 Debugging Purchases...");
    
    // 1. Get last 5 payments
    const lastPayments = await db.select().from(payments).orderBy(desc(payments.createdAt)).limit(5);
    console.log("\n💳 Last 5 Payments:");
    console.table(lastPayments.map(p => ({
        id: p.id,
        userId: p.userId,
        contentId: p.contentId,
        status: p.status,
        tracking: p.trackingCode
    })));

    // 2. Get last 5 purchases
    const lastPurchases = await db.select().from(purchases).orderBy(desc(purchases.createdAt)).limit(5);
    console.log("\n🛍️ Last 5 Purchases:");
    console.table(lastPurchases);

    // 3. Find user and their purchases
    // (Assuming user might be the one with most recent approved payment)
    const recentApproved = lastPayments.find(p => p.status === 'approved');
    if (recentApproved) {
        console.log(`\n👤 Checking purchases for User ID: ${recentApproved.userId}`);
        const userPurchases = await db.select().from(purchases).where(eq(purchases.userId, recentApproved.userId));
        console.log(`User has ${userPurchases.length} purchase(rows).`);
        console.table(userPurchases);
        
        const user = await db.select().from(users).where(eq(users.id, recentApproved.userId));
        console.log(`User Info:`, user[0]?.username, user[0]?.phone);
    }

    process.exit(0);
}

debug();
