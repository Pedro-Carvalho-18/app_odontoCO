const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'app_odonto.sqlite');
const db = new sqlite3.Database(dbPath);

db.get("SELECT sql FROM sqlite_master WHERE name='LOG_DOCUMENTO'", (err, row) => {
    if (row) console.log(row.sql);
    else console.log('LOG_DOCUMENTO not found');
    db.close();
});
