const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database/app_odonto.sqlite');
const table = process.argv[2];

if (!table) {
    console.error("Please provide a table name.");
    process.exit(1);
}

db.all(`PRAGMA table_info(${table})`, (err, columns) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log(`${table} columns:`, JSON.stringify(columns.map(c => c.name)));
    db.close();
});
