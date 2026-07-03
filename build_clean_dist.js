const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'app_odonto.sqlite');
const backupPath = path.join(__dirname, 'database', 'app_odonto_backup.sqlite');
const cleanDbPath = path.join(__dirname, 'database', 'app_odonto_clean.sqlite');

try {
    console.log("Starting installer build process...");
    
    if (!fs.existsSync(cleanDbPath)) {
        throw new Error("Clean database (app_odonto_clean.sqlite) not found!");
    }

    console.log("Backing up original database...");
    if (fs.existsSync(dbPath)) {
        if (fs.existsSync(backupPath)) {
            fs.unlinkSync(backupPath);
        }
        fs.renameSync(dbPath, backupPath);
    }

    console.log("Swapping to clean database...");
    fs.copyFileSync(cleanDbPath, dbPath);

    console.log("Running npm run dist...");
    execSync('npm run dist', { stdio: 'inherit' });

    console.log("Installer generated successfully in the 'dist' folder!");

} catch (err) {
    console.error("An error occurred during the clean build:", err);
} finally {
    console.log("Restoring original database...");
    if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath); // remove the copied clean db
    }
    if (fs.existsSync(backupPath)) {
        fs.renameSync(backupPath, dbPath); // restore original
    }
    console.log("Restore complete.");
}

