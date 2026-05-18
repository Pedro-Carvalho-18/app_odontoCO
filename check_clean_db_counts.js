const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'app_odonto_clean.sqlite');
const db = new sqlite3.Database(dbPath);

db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
    if (err) {
        console.error(err);
        return;
    }

    const promises = tables.map(t => {
        return new Promise((resolve, reject) => {
            db.get(`SELECT COUNT(*) as count FROM ${t.name}`, (err, row) => {
                if (err) {
                    resolve({ name: t.name, count: 'Error' });
                } else {
                    resolve({ name: t.name, count: row.count });
                }
            });
        });
    });

    Promise.all(promises).then(results => {
        results.sort((a, b) => b.count - a.count);
        results.forEach(r => {
            if (r.count > 0 && r.count !== 'Error') {
                console.log(`${r.name}: ${r.count}`);
            }
        });
        db.close();
    });
});
