
import pg from "pg";
const { Pool } = pg;

// Using the recently verified connection string
const CONNECTION_STRING = "postgresql://postgres.eomhzporbyhebawkmxyq:ManaPalm2025@aws-1-eu-north-1.pooler.supabase.com:6543/postgres";

const pool = new Pool({
    connectionString: CONNECTION_STRING,
    ssl: { rejectUnauthorized: false }
});

async function reset() {
    console.log("🧹 Starting Database Cleanup...");
    try {
        // TRUNCATE removes all rows. CASCADE handles foreign keys. RESTART IDENTITY resets ID counters to 1.
        // Quoting table names to be safe, though existing names are lowercase.
        await pool.query(`
      TRUNCATE TABLE 
        "session",
        "enrollments",
        "bookings",
        "classes",
        "content",
        "users"
      RESTART IDENTITY CASCADE;
    `);
        console.log("-----------------------------------------");
        console.log("✨ Database verified clean. All users and data removed.");
        console.log("-----------------------------------------");
    } catch (err: any) {
        console.error("❌ Error:", err.message);
    } finally {
        await pool.end();
    }
}

reset();
