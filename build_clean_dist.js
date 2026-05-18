const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'app_odonto.sqlite');
const backupPath = path.join(__dirname, 'database', 'app_odonto_backup.sqlite');
const cleanDbPath = path.join(__dirname, 'database', 'app_odonto_clean.sqlite');
const builtInstaller = path.join(__dirname, 'dist', 'OdontOC_v1.0.0.exe');
const originalInstallerBackup = path.join(__dirname, 'dist', 'OdontOC_v1.0.0_Original.exe');
const cleanInstaller = path.join(__dirname, 'dist', 'OdontOC_Distrib_Clean.exe');

try {
    console.log("Backing up original database...");
    if (fs.existsSync(dbPath)) {
        fs.renameSync(dbPath, backupPath);
    }

    console.log("Backing up original installer...");
    if (fs.existsSync(builtInstaller)) {
        fs.renameSync(builtInstaller, originalInstallerBackup);
    }

    console.log("Swapping to clean database...");
    fs.copyFileSync(cleanDbPath, dbPath);

    console.log("Running npm run dist...");
    execSync('npm run dist', { stdio: 'inherit' });

    console.log("Renaming output installer to Clean...");
    if (fs.existsSync(cleanInstaller)) {
        fs.unlinkSync(cleanInstaller);
    }
    if (fs.existsSync(builtInstaller)) {
        fs.renameSync(builtInstaller, cleanInstaller);
        console.log(`Clean installer created at: ${cleanInstaller}`);
    } else {
        console.warn("Could not find the built installer to rename.");
    }

    console.log("Restoring original installer name...");
    if (fs.existsSync(originalInstallerBackup)) {
        fs.renameSync(originalInstallerBackup, builtInstaller);
    }

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
