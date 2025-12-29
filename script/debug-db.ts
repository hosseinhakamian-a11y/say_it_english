
import pg from "pg";
const { Pool } = pg;

// Hardcoded for debugging - eliminating Env Var confusion
const CONNECTION_STRING = "postgresql://postgres.eomhzporbyhebawkmxyq:ManaPalm2025@aws-1-eu-north-1.pooler.supabase.com:6543/postgres";

async function verify() {
    console.log("🔍 Debugging Connection...");
    console.log("URL:", CONNECTION_STRING.replace(/:[^:@]*@/, ":***@"));
    console.log("SSL: { rejectUnauthorized: false } (Enforced)");

    const pool = new Pool({
        connectionString: CONNECTION_STRING,
        ssl: { rejectUnauthorized: false } // Explicitly Force SSL
    });

    try {
        const client = await pool.connect();
        console.log("✅ SUCCESS! Connected to Supabase.");
        const res = await client.query('SELECT version()');
        console.log("📊 Version:", res.rows[0].version);
        client.release();
        await pool.end();
    } catch (err: any) {
        console.error("❌ FAILED:", err.message);
        if (err.message.includes("password")) {
            console.error("\n🧐 Password Rejected. Possibilities:");
            console.error("1. The password 'ManaPalm2025' was not successfully saved in Supabase.");
            console.error("2. The Project ID 'eomhzporbyhebawkmxyq' is incorrect.");
            console.error("3. The user 'postgres' is disabled or renamed.");
        }
    }
}

verify();
