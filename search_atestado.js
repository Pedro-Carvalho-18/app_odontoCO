const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'app_odonto.sqlite');
const db = new sqlite3.Database(dbPath);

db.all("SELECT name, sql FROM sqlite_master WHERE type='table'", (err, tables) => {
    if (err) {
        console.error(err);
        return;
    }

    tables.forEach(table => {
        if (table.sql && table.sql.toUpperCase().includes('ATESTADO')) {
            console.log(`Table: ${table.name}`);
            console.log(`Schema: ${table.sql}`);
            console.log('---');
        }
    });
    db.close();
});
