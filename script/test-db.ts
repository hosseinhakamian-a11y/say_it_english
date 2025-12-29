
import { pool } from "../server/db";

async function test() {
    console.log("🔌 Testing Database Connection...");
    console.log("NODE_ENV:", process.env.NODE_ENV);
    // Log masked DB URL to verify format (looking for postgres.project_ref in username)
    const dbUrl = process.env.DATABASE_URL || "";
    const maskedUrl = dbUrl.replace(/:[^:@]+@/, ":***@");
    console.log("DATABASE_URL (Masked):", maskedUrl);

    try {
        const client = await pool.connect();
        console.log("✅ Database connected successfully!");
        const res = await client.query('SELECT NOW() as time');
        console.log("🕒 Server Time:", res.rows[0].time);
        client.release();
        await pool.end();
        process.exit(0);
    } catch (err: any) {
        console.error("❌ Connection failed!");
        console.error("Error Message:", err.message);
        console.error("Full Error:", err);

        if (err.message.includes("Tenant or user not found")) {
            console.log("\n💡 TIP: For Supabase Transaction Pool (port 6543), username must be 'postgres.PROJECT_ID'.");
            console.log("Check if your DATABASE_URL user part is just 'postgres'?");
        }

        process.exit(1);
    }
}

test();
