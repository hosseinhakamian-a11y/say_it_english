const fs = require('fs');
const path = require('path');

const apiDir = path.join(__dirname, 'api');
const files = fs.readdirSync(apiDir);

files.forEach(file => {
    if (file.endsWith('.ts') && file !== 'index.ts') {
        const filePath = path.join(apiDir, file);
        console.log(`Deleting ${filePath}`);
        fs.unlinkSync(filePath);
    }
});
console.log('Cleanup complete.');
