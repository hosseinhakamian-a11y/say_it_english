import { db } from "../server/db";
import { content, purchases, users } from "../shared/schema";
import { eq } from "drizzle-orm";

async function seedTestContent() {
  console.log("🌱 Seeding Test Content for ArvanCloud...");

  // 1. Ensure ID=1 content exists and points to 'test-file.txt'
  const existing = await db.select().from(content).where(eq(content.id, 1));
  
  if (existing.length > 0) {
    console.log("Updating existing content ID=1...");
    await db.update(content)
      .set({ 
        fileKey: "video.mp4",
        isPremium: true,
        price: 1000 // 1000 Toman, not free
      })
      .where(eq(content.id, 1));
  } else {
    console.log("Creating new content ID=1...");
    await db.insert(content).values({
      id: 1,
      title: "تست استریم ویدیو",
      description: "این یک ویدیو تستی از آروان کلاد است.",
      type: "video",
      level: "beginner",
      isPremium: true,
      price: 1000,
      fileKey: "video.mp4"
    });
  }

  // 2. Ensure User (Admin) has 'purchased' this content (or relies on Admin role)
  // Since Admins bypass checks, we don't technically need a purchase record if we are testing as admin.
  // But let's add one just in case.
  
  // Find first user (likely admin)
  const user = await db.query.users.findFirst();
  if (user) {
      console.log(`Granting access to user ${user.username} (ID: ${user.id})...`);
      const hasPurchase = await db.select().from(purchases)
        .where(eq(purchases.userId, user.id))
        .where(eq(purchases.contentId, 1)); // We can't double-where easily in drizzle query builder sometimes without and(), checking simple way

        // actually raw sql or simple insert ignore is easier, but let's try-catch insert
        try {
            await db.insert(purchases).values({
                userId: user.id,
                contentId: 1,
            });
            console.log("Purchase record added.");
        } catch (e) {
            console.log("Purchase record likely exists.");
        }
  }

  console.log("✅ Seed complete.");
  process.exit(0);
}

seedTestContent();
