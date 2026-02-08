import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const apiDir = path.join(__dirname, 'api');

try {
    const files = fs.readdirSync(apiDir);
    let deletedCount = 0;

    files.forEach(file => {
        if (file.endsWith('.ts') && file !== 'index.ts') {
            const filePath = path.join(apiDir, file);
            console.log(`Deleting ${filePath}`);
            fs.unlinkSync(filePath);
            deletedCount++;
        }
    });
    console.log(`Cleanup complete. Deleted ${deletedCount} files.`);
} catch (error) {
    console.error("Error during cleanup:", error);
}
