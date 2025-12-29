
import pg from "pg";
const { Pool } = pg;

// Connection string (should be verified one from before)
const CONNECTION_STRING = "postgresql://postgres.eomhzporbyhebawkmxyq:ManaPalm2025@aws-1-eu-north-1.pooler.supabase.com:6543/postgres";

const pool = new Pool({
    connectionString: CONNECTION_STRING,
    ssl: { rejectUnauthorized: false }
});

const ADMIN_NUMBERS = ["09222453571", "09123104254"];

async function makeAdmins() {
    console.log("👮‍♂️ Promoting users to Admin...");

    try {
        for (const phone of ADMIN_NUMBERS) {
            const res = await pool.query(
                `UPDATE users SET role = 'admin' WHERE username = $1 RETURNING username, role`,
                [phone]
            );

            if (res.rowCount && res.rowCount > 0) {
                console.log(`✅ User ${phone} is now ADMIN.`);
            } else {
                console.log(`⚠️ User ${phone} not found. (Make sure they have registered first!)`);
            }
        }
    } catch (err: any) {
        console.error("❌ Error:", err.message);
    } finally {
        await pool.end();
    }
}

makeAdmins();
