
import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const { Pool } = pg;

// Using the verified connection string from reset-db.ts
const CONNECTION_STRING = "postgresql://postgres.eomhzporbyhebawkmxyq:ManaPalm2025@aws-1-eu-north-1.pooler.supabase.com:6543/postgres";

const pool = new Pool({
    connectionString: CONNECTION_STRING,
    ssl: { rejectUnauthorized: false }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function backup() {
    console.log("📦 Starting Database Backup...");
    
    const tables = ["users", "content", "payments", "purchases", "bookings", "time_slots", "enrollments", "classes"];
    const backupData: Record<string, any[]> = {};

    try {
        for (const table of tables) {
            console.log(`Reading table: ${table}...`);
            try {
                const res = await pool.query(`SELECT * FROM "${table}"`);
                backupData[table] = res.rows;
                console.log(`  - ${res.rowCount} rows found.`);
            } catch (err: any) {
                console.warn(`  ! Could not read table ${table}: ${err.message}`);
            }
        }

        const backupDir = path.resolve(__dirname, "../backup");
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const filename = `backup_${timestamp}.json`;
        const filepath = path.join(backupDir, filename);

        fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2));
        
        console.log("-----------------------------------------");
        console.log(`✅ Backup saved to: ${filepath}`);
        console.log("-----------------------------------------");

    } catch (err: any) {
        console.error("❌ Backup Error:", err.message);
    } finally {
        await pool.end();
    }
}

backup();
